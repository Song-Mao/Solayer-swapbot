/**
 * 领水请求结果
 */
export interface IFaucetResult {
  /** 是否成功 */
  success: boolean;
  /** 钱包地址 */
  walletAddress: string;
  /** 交易哈希（如果成功） */
  transactionHash?: string;
  /** 获得的金额（SOL） */
  amount?: number;
  /** 错误信息（如果失败） */
  error?: string;
  /** 响应时间 */
  timestamp: Date;
}

/**
 * 领水请求参数
 */
export interface IFaucetRequest {
  /** 钱包地址 */
  walletAddress: string;
  /** 请求时间 */
  requestTime: Date;
}

/**
 * 领水配置
 */
export interface IFaucetConfig {
  /** 领水接口URL */
  url: string;
  /** 每10秒最大请求数 */
  maxRequestsPer10Seconds: number;
  /** 请求间隔（毫秒） */
  requestIntervalMs: number;
}

/**
 * 领水队列项
 */
export interface IFaucetQueueItem {
  /** 钱包地址 */
  walletAddress: string;
  /** 加入队列时间 */
  queueTime: Date;
  /** 重试次数 */
  retryCount: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 优先级 */
  priority: number;
}

/**
 * 领水统计信息
 */
export interface IFaucetStats {
  /** 总请求数 */
  totalRequests: number;
  /** 成功请求数 */
  successfulRequests: number;
  /** 失败请求数 */
  failedRequests: number;
  /** 成功率 */
  successRate: number;
  /** 总获得金额 */
  totalAmount: number;
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 队列中等待的请求数 */
  queuedRequests: number;
}

/**
 * 领水管理器接口
 */
export interface IFaucetManager {
  /**
   * 为单个钱包申请领水
   */
  requestFaucet(walletAddress: string): Promise<IFaucetResult>;
  
  /**
   * 批量申请领水
   */
  batchRequestFaucet(walletAddresses: string[]): Promise<IFaucetResult[]>;
  
  /**
   * 获取领水统计信息
   */
  getStats(): IFaucetStats;
  
  /**
   * 检查钱包是否可以领水
   */
  canRequestFaucet(walletAddress: string): boolean;
  
  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    completed: number;
  };
  
  /**
   * 清空队列
   */
  clearQueue(): void;
} 