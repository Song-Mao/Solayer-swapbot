import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WalletService } from '../wallet/wallet.service';
import { 
  IFaucetManager, 
  IFaucetResult, 
  IFaucetConfig, 
  IFaucetQueueItem, 
  IFaucetStats 
} from '../common/interfaces/faucet.interface';

const SOL_TO_LAMPORT = 1_000_000_000;
const DEFAULT_AIRDROP_AMOUNT_SOL = 10;

interface RequestPool {
  maxConcurrent: number;
  activeRequests: number;
  queue: IFaucetQueueItem[];
  lastRequestTime: number;
  minInterval: number;
  successCount: number;
  failCount: number;
}

enum RequestPriority {
  HIGH = 0,
  NORMAL = 1,
  LOW = 2
}

interface RequestInterval {
  baseInterval: number;
  minInterval: number;
  maxInterval: number;
  successThreshold: number;
  failThreshold: number;
}

interface RetryStrategy {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  exponentialFactor: number;
}

@Injectable()
export class FaucetService implements IFaucetManager, OnModuleDestroy {
  private readonly logger = new Logger(FaucetService.name);
  private readonly config: IFaucetConfig;
  
  // 请求队列和统计
  private requestQueue: IFaucetQueueItem[] = [];
  private processingQueue: Set<string> = new Set();
  private requestHistory: IFaucetResult[] = [];
  private stats: IFaucetStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    successRate: 0,
    totalAmount: 0,
    averageResponseTime: 0,
    queuedRequests: 0,
  };
  
  // 新增请求池相关属性
  private requestPool: RequestPool = {
    maxConcurrent: 8, // 最大并发数，留2个余量
    activeRequests: 0,
    queue: [],
    lastRequestTime: 0,
    minInterval: 100, // 最小请求间隔（毫秒）
    successCount: 0,
    failCount: 0,
  };

  private requestInterval: RequestInterval = {
    baseInterval: 100,
    minInterval: 50,
    maxInterval: 200,
    successThreshold: 5,
    failThreshold: 3,
  };

  private retryStrategy: RetryStrategy = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    exponentialFactor: 2,
  };

  // 频率控制
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPer10Seconds: number;
  private readonly requestIntervalMs: number;
  
  // 处理状态
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  private internalQueueProcessorInterval: NodeJS.Timeout | null = null;
  private sustainedFaucetSchedulerInterval: NodeJS.Timeout | null = null;
  private readonly sustainedFaucetCheckIntervalMs: number = 15000;

  constructor(
    private configService: ConfigService,
    private readonly walletService: WalletService,
  ) {
    this.config = {
      url: this.configService.get<string>('app.faucet.url') || '',
      maxRequestsPer10Seconds: this.configService.get<number>('app.faucet.maxRequestsPer10Seconds') || 10,
      requestIntervalMs: this.configService.get<number>('app.faucet.requestIntervalMs') || 1000,
    };

    this.maxRequestsPer10Seconds = this.config.maxRequestsPer10Seconds;
    this.requestIntervalMs = this.config.requestIntervalMs;

    this.startInternalQueueProcessor();
    this.startSustainedFaucetScheduler();
    
    this.logger.log('领水服务已初始化');
    this.logger.log(`配置: 每10秒最大${this.maxRequestsPer10Seconds}个请求，内部队列处理间隔${this.requestIntervalMs}ms`);
    this.logger.log(`持续领水调度器已启动，每 ${this.sustainedFaucetCheckIntervalMs / 1000} 秒检查钱包池。`);
  }

  /**
   * 持续领水调度器：定期检查钱包池，将需要领水的钱包加入内部队列
   */
  private async scheduleWalletsForFaucet(): Promise<void> {
    this.logger.debug('[持续调度器] 检查需要领水的钱包...');
    try {
      const availableWallets = await this.walletService.getAvailableWallets();
      if (availableWallets.length === 0) {
        this.logger.debug('[持续调度器] 没有可用的钱包。');
        return;
      }

      let addedToQueueCount = 0;
      for (const wallet of availableWallets) {
        const isInRequestQueue = this.requestQueue.some(item => item.walletAddress === wallet.publicKey);
        const isInProcessingQueue = this.processingQueue.has(wallet.publicKey);

        if (!isInRequestQueue && !isInProcessingQueue) {
          await this.requestFaucet(wallet.publicKey); 
          addedToQueueCount++;
        }
      }
      if (addedToQueueCount > 0) {
        this.logger.log(`[持续调度器] ${addedToQueueCount} 个钱包已提交到领水处理流程。当前内部队列长度: ${this.requestQueue.length}`);
      } else {
        this.logger.debug(`[持续调度器] 没有新的钱包需要加入领水队列。当前内部队列长度: ${this.requestQueue.length}`);
      }

    } catch (error) {
      this.logger.error('[持续调度器] 检查钱包池并安排领水时出错:', error instanceof Error ? error.stack : error);
    }
  }

  /**
   * 启动持续领水调度器
   */
  private startSustainedFaucetScheduler(): void {
    if (this.sustainedFaucetSchedulerInterval) {
      clearInterval(this.sustainedFaucetSchedulerInterval);
    }
    this.scheduleWalletsForFaucet().catch(err => this.logger.error("Initial scheduleWalletsForFaucet failed", err instanceof Error ? err.stack : err));
    
    this.sustainedFaucetSchedulerInterval = setInterval(async () => {
      await this.scheduleWalletsForFaucet();
    }, this.sustainedFaucetCheckIntervalMs); 
    this.logger.log(`持续领水调度器已设置，每 ${this.sustainedFaucetCheckIntervalMs / 1000} 秒运行一次。`);
  }

  /**
   * 为单个钱包申请领水 (由外部API或内部调度器调用)
   * 这个方法会将请求放入内部队列，等待处理
   */
  async requestFaucet(walletAddress: string): Promise<IFaucetResult> {
    this.logger.debug(`领水请求进入处理流程: ${walletAddress}`);

    if (this.requestQueue.some(item => item.walletAddress === walletAddress) || this.processingQueue.has(walletAddress)) {
       this.logger.debug(`钱包 ${walletAddress} 已在队列或处理中，本次请求忽略。`);
      return {
        success: false, 
        walletAddress,
        error: '钱包已在领水队列或处理中',
        timestamp: new Date(),
      };
    }
    
    const queueItem: IFaucetQueueItem = {
      walletAddress,
      queueTime: new Date(),
      retryCount: 0,
      maxRetries: this.retryStrategy.maxRetries,
      priority: RequestPriority.NORMAL,
    };
    this.requestQueue.push(queueItem);
    this.stats.queuedRequests = this.requestQueue.length;
    this.logger.log(`钱包 ${walletAddress} 已加入内部领水队列。当前队列长度: ${this.requestQueue.length}`);

    return {
      success: true, 
      walletAddress,
      error: `已加入内部领水队列，等待处理。位置: ${this.requestQueue.length}`,
      timestamp: new Date(),
    };
  }

  /**
   * 批量申请领水 (主要由外部API调用)
   */
  async batchRequestFaucet(walletAddresses: string[]): Promise<IFaucetResult[]> {
    this.logger.log(`收到批量领水请求，钱包数量: ${walletAddresses.length}`);
    const results: IFaucetResult[] = [];
    const batchSize = Math.min(10, walletAddresses.length); // 每批最多10个请求

    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      const batch = walletAddresses.slice(i, i + batchSize);
      const batchPromises = batch.map(walletAddress => this.requestFaucet(walletAddress));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 如果还有下一批，等待适当的间隔
      if (i + batchSize < walletAddresses.length) {
        const interval = this.calculateRequestInterval();
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    return results;
  }

  /**
   * 获取领水统计信息
   */
  getStats(): IFaucetStats {
    // 更新成功率
    if (this.stats.totalRequests > 0) {
      this.stats.successRate = (this.stats.successfulRequests / this.stats.totalRequests) * 100;
    }
    
    this.stats.queuedRequests = this.requestQueue.length;
    
    return { ...this.stats };
  }

  /**
   * 检查钱包是否可以领水
   */
  canRequestFaucet(walletAddress: string): boolean {
    if (this.processingQueue.has(walletAddress) || this.requestQueue.some(item => item.walletAddress === walletAddress)) {
      return false;
    }
    return true; 
  }

  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return {
      pending: this.requestQueue.length,
      processing: this.processingQueue.size,
      completed: this.requestHistory.length,
    };
  }

  /**
   * 清空队列
   */
  clearQueue(): void {
    this.requestQueue = [];
    this.stats.queuedRequests = 0;
    this.logger.log('内部领水队列已清空');
  }

  /**
   * 检查是否可以发起新请求（API频率控制的核心）
   */
  private canMakeRequestToExternalAPI(): boolean { 
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 10000 
    );
    return this.requestTimestamps.length < this.maxRequestsPer10Seconds;
  }

  /**
   * 优化后的请求处理逻辑
   */
  private async processRequest(walletAddress: string): Promise<IFaucetResult> {
    // 检查外部API的频率限制
    if (!this.canMakeRequestToExternalAPI()) {
      this.logger.warn(`[API速率限制] 外部API频率达到上限 (最大 ${this.maxRequestsPer10Seconds}/10s)。钱包 ${walletAddress} 将被重新排队。`);
      // 将项目重新排队以便稍后提取。高优先级添加到前面。
      this.requestQueue.unshift({ 
        walletAddress,
        queueTime: new Date(), 
        retryCount: 0, // 这不是API调用失败的重试，而是由于速率限制而重新调度
        maxRetries: this.retryStrategy.maxRetries,
        priority: RequestPriority.HIGH, 
      });
      this.stats.queuedRequests = this.requestQueue.length;
      return {
        success: false, // 表示此特定尝试未继续进行API调用
        walletAddress,
        error: 'RATE_LIMITED_REQUEUED', // 特殊错误代码，表明由于速率限制已重新排队
        timestamp: new Date(),
      };
    }

    const startTime = Date.now();
    // 重要：在 canMakeRequestToExternalAPI 检查通过后，实际调用API前，添加到 requestTimestamps
    this.requestTimestamps.push(startTime); 
    
    this.processingQueue.add(walletAddress); // 标记为正在内部处理
    this.requestPool.activeRequests++;

    try {
      this.logger.log(`[核心处理] 开始领水请求: ${walletAddress}. 活动请求: ${this.requestPool.activeRequests}, 10秒内时间戳数量: ${this.requestTimestamps.filter(t => Date.now() - t < 10000).length}`);
      
      const interval = this.calculateRequestInterval(); 
      if (Date.now() - this.requestPool.lastRequestTime < interval && this.requestPool.activeRequests > 1) {
         await new Promise(resolve => setTimeout(resolve, Math.max(0, interval - (Date.now() - this.requestPool.lastRequestTime))));
      }

      const response = await this.callFaucetAPI(walletAddress);
      this.requestPool.lastRequestTime = Date.now();

      const result: IFaucetResult = {
        success: response.success,
        walletAddress,
        transactionHash: response.transactionHash,
        amount: response.success ? DEFAULT_AIRDROP_AMOUNT_SOL : undefined,
        error: response.error,
        timestamp: new Date(),
      };

      // 更新请求池统计
      if (response.success) {
        this.requestPool.successCount++;
        this.requestPool.failCount = 0;
      } else {
        this.requestPool.failCount++;
        this.requestPool.successCount = 0;
      }

      this.updateStats(result, Date.now() - startTime);
      this.requestHistory.push(result);
      if (this.requestHistory.length > 1000) {
        this.requestHistory = this.requestHistory.slice(-500);
      }

      this.logger.log(`领水请求完成: ${walletAddress}, 成功: ${result.success}`);
      return result;
    } catch (error) {
      const result: IFaucetResult = {
        success: false,
        walletAddress,
        error: error instanceof Error ? error.message : '网络请求失败',
        timestamp: new Date(),
      };

      this.requestPool.failCount++;
      this.requestPool.successCount = 0;
      this.updateStats(result, Date.now() - startTime);
      this.requestHistory.push(result);
      this.logger.error(`领水请求失败: ${walletAddress}`, error);
      return result;
    } finally {
      this.processingQueue.delete(walletAddress);
      this.requestPool.activeRequests--;
    }
  }

  /**
   * 计算动态请求间隔
   */
  private calculateRequestInterval(): number {
    const { baseInterval, minInterval, maxInterval, successThreshold, failThreshold } = this.requestInterval;
    
    if (this.requestPool.successCount >= successThreshold) {
      // 连续成功，可以适当减少间隔
      return Math.max(minInterval, baseInterval * 0.8);
    } else if (this.requestPool.failCount >= failThreshold) {
      // 连续失败，增加间隔
      return Math.min(maxInterval, baseInterval * 1.5);
    }
    
    return baseInterval;
  }

  /**
   * 启动内部队列处理器
   */
  private startInternalQueueProcessor() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processQueue();
    }, 100); // 每100ms检查一次队列
  }

  /**
   * 优化后的队列处理逻辑
   */
  private async processQueue() {
    if (this.requestQueue.length === 0 || this.requestPool.activeRequests >= this.requestPool.maxConcurrent) {
      return;
    }

    // 按优先级排序队列
    this.requestQueue.sort((a, b) => {
      // 首先按优先级排序
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // 其次按入队时间排序
      return a.queueTime.getTime() - b.queueTime.getTime();
    });

    const availableSlots = this.requestPool.maxConcurrent - this.requestPool.activeRequests;
    const batchSize = Math.min(availableSlots, this.requestQueue.length);
    const batch = this.requestQueue.splice(0, batchSize);

    const batchPromises = batch.map(async (queueItem) => {
      try {
        const result = await this.processRequest(queueItem.walletAddress);

        // 仅当不是因为速率限制重新排队，并且是真正的失败时，才执行重试逻辑
        if (!result.success && result.error !== 'RATE_LIMITED_REQUEUED' && queueItem.retryCount < queueItem.maxRetries) {
          // 计算重试延迟
          const delay = this.calculateRetryDelay(queueItem.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));

          // 重新入队，提高优先级
          this.requestQueue.push({
            ...queueItem,
            retryCount: queueItem.retryCount + 1,
            priority: RequestPriority.HIGH,
            queueTime: new Date(),
          });
        }

        return result;
      } catch (error) {
        this.logger.error(`处理队列项失败: ${queueItem.walletAddress}`, error);
        
        if (queueItem.retryCount < queueItem.maxRetries) {
          // 计算重试延迟
          const delay = this.calculateRetryDelay(queueItem.retryCount);
          await new Promise(resolve => setTimeout(resolve, delay));

          // 重新入队，提高优先级
          this.requestQueue.push({
            ...queueItem,
            retryCount: queueItem.retryCount + 1,
            priority: RequestPriority.HIGH,
            queueTime: new Date(),
          });
        }

        return {
          success: false,
          walletAddress: queueItem.walletAddress,
          error: error instanceof Error ? error.message : '处理失败',
          timestamp: new Date(),
        };
      }
    });

    await Promise.all(batchPromises);
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(retryCount: number): number {
    const { baseDelay, maxDelay, exponentialFactor } = this.retryStrategy;
    const delay = Math.min(
      maxDelay,
      baseDelay * Math.pow(exponentialFactor, retryCount)
    );
    return delay;
  }

  /**
   * 调用领水API
   */
  private async callFaucetAPI(walletAddress: string): Promise<{
    success: boolean;
    transactionHash?: string;
    error?: string;
  }> {
    if (!this.config.url) {
      this.logger.error('领水API URL未配置');
      throw new Error('领水API URL未配置');
    }

    const requestBody = {
      id: Date.now(), // 使用时间戳作为唯一ID
      jsonrpc: "2.0",
      method: "requestAirdrop",
      params: [
        walletAddress,
        DEFAULT_AIRDROP_AMOUNT_SOL * SOL_TO_LAMPORT, 
      ],
    };

    try {
      this.logger.debug(`调用领水 API: ${this.config.url}, 请求体: ${JSON.stringify(requestBody)}`);
      const response = await globalThis.fetch(this.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Solayer-SwapBot/1.0.0',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      this.logger.debug(`领水 API 响应状态: ${response.status}, 响应体: ${responseText}`);

      if (!response.ok) {
        // 尝试解析错误响应体，如果它是JSON的话
        let errorDetail = responseText;
        try {
          const errorJson = JSON.parse(responseText);
          errorDetail = errorJson.error?.message || errorJson.message || JSON.stringify(errorJson.error || errorJson);
        } catch (e) { /* 保持 responseText 作为错误详情 */ }
        throw new Error(`HTTP ${response.status}: ${response.statusText}.详情: ${errorDetail}`);
      }

      const data = JSON.parse(responseText);
      
      if (data.error) {
        const errorMessage = typeof data.error === 'string' ? data.error : (data.error.message || JSON.stringify(data.error));
        return {
          success: false,
          error: errorMessage,
        };
      }

      if (data.result) {
        return {
          success: true,
          transactionHash: typeof data.result === 'string' ? data.result : JSON.stringify(data.result),
        };
      }
      
      // 如果响应格式不符合预期 (既没有 error 也没有 result)
      return {
        success: false,
        error: `未知或无效的API响应格式: ${responseText}`,
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
      this.logger.error(`调用领水 API 失败: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
      // 将原始错误信息或堆栈返回，而不是再次包装throw
      return {
          success: false,
          error: errorMessage
      }
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(result: IFaucetResult, responseTime: number): void {
    this.stats.totalRequests++;
    
    if (result.success) {
      this.stats.successfulRequests++;
      if (result.amount) {
        this.stats.totalAmount += result.amount;
      }
    } else {
      this.stats.failedRequests++;
    }
    
    // 更新平均响应时间（简单移动平均）
    if (this.stats.totalRequests > 0) {
        this.stats.averageResponseTime = 
        (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / 
        this.stats.totalRequests;
    } else {
        this.stats.averageResponseTime = responseTime;
    }
  }

  /**
   * 停止服务
   */
  onModuleDestroy(): void {
    if (this.internalQueueProcessorInterval) {
      clearInterval(this.internalQueueProcessorInterval);
    }
    if (this.sustainedFaucetSchedulerInterval) {
      clearInterval(this.sustainedFaucetSchedulerInterval);
    }
    this.logger.log('领水服务及相关定时器已停止。');
  }
} 