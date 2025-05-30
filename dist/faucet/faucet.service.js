"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FaucetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaucetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let FaucetService = FaucetService_1 = class FaucetService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FaucetService_1.name);
        this.requestQueue = [];
        this.processingQueue = new Set();
        this.requestHistory = [];
        this.requestTimestamps = [];
        this.isProcessing = false;
        this.processingInterval = null;
        this.config = {
            url: this.configService.get('app.faucet.url') || '',
            maxRequestsPer10Seconds: this.configService.get('app.faucet.maxRequestsPer10Seconds') || 10,
            requestIntervalMs: this.configService.get('app.faucet.requestIntervalMs') || 1000,
        };
        this.maxRequestsPer10Seconds = this.config.maxRequestsPer10Seconds;
        this.requestIntervalMs = this.config.requestIntervalMs;
        this.stats = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            successRate: 0,
            totalAmount: 0,
            averageResponseTime: 0,
            queuedRequests: 0,
        };
        this.startQueueProcessor();
        this.logger.log('领水服务已初始化');
        this.logger.log(`配置: 每10秒最大${this.maxRequestsPer10Seconds}个请求，间隔${this.requestIntervalMs}ms`);
    }
    async requestFaucet(walletAddress) {
        this.logger.log(`收到领水请求: ${walletAddress}`);
        if (this.processingQueue.has(walletAddress)) {
            const result = {
                success: false,
                walletAddress,
                error: '该钱包正在处理中，请稍后再试',
                timestamp: new Date(),
            };
            return result;
        }
        if (this.canMakeRequest()) {
            return await this.processRequest(walletAddress);
        }
        else {
            const queueItem = {
                walletAddress,
                queueTime: new Date(),
                retryCount: 0,
                maxRetries: 3,
            };
            this.requestQueue.push(queueItem);
            this.stats.queuedRequests = this.requestQueue.length;
            this.logger.log(`钱包 ${walletAddress} 已加入队列，当前队列长度: ${this.requestQueue.length}`);
            const result = {
                success: false,
                walletAddress,
                error: `已加入队列，排队位置: ${this.requestQueue.length}`,
                timestamp: new Date(),
            };
            return result;
        }
    }
    async batchRequestFaucet(walletAddresses) {
        this.logger.log(`收到批量领水请求，钱包数量: ${walletAddresses.length}`);
        const results = [];
        for (const walletAddress of walletAddresses) {
            try {
                const result = await this.requestFaucet(walletAddress);
                results.push(result);
                if (results.length < walletAddresses.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                const result = {
                    success: false,
                    walletAddress,
                    error: error instanceof Error ? error.message : '未知错误',
                    timestamp: new Date(),
                };
                results.push(result);
            }
        }
        return results;
    }
    getStats() {
        if (this.stats.totalRequests > 0) {
            this.stats.successRate = (this.stats.successfulRequests / this.stats.totalRequests) * 100;
        }
        this.stats.queuedRequests = this.requestQueue.length;
        return { ...this.stats };
    }
    canRequestFaucet(walletAddress) {
        if (this.processingQueue.has(walletAddress)) {
            return false;
        }
        return this.canMakeRequest();
    }
    getQueueStatus() {
        return {
            pending: this.requestQueue.length,
            processing: this.processingQueue.size,
            completed: this.requestHistory.length,
        };
    }
    clearQueue() {
        this.requestQueue = [];
        this.stats.queuedRequests = 0;
        this.logger.log('队列已清空');
    }
    canMakeRequest() {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(timestamp => now - timestamp < 10000);
        return this.requestTimestamps.length < this.maxRequestsPer10Seconds;
    }
    async processRequest(walletAddress) {
        const startTime = Date.now();
        this.processingQueue.add(walletAddress);
        try {
            this.logger.log(`开始处理领水请求: ${walletAddress}`);
            this.requestTimestamps.push(startTime);
            const response = await this.callFaucetAPI(walletAddress);
            const result = {
                success: response.success,
                walletAddress,
                transactionHash: response.transactionHash,
                amount: response.amount,
                error: response.error,
                timestamp: new Date(),
            };
            this.updateStats(result, Date.now() - startTime);
            this.requestHistory.push(result);
            if (this.requestHistory.length > 1000) {
                this.requestHistory = this.requestHistory.slice(-500);
            }
            this.logger.log(`领水请求完成: ${walletAddress}, 成功: ${result.success}`);
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                walletAddress,
                error: error instanceof Error ? error.message : '网络请求失败',
                timestamp: new Date(),
            };
            this.updateStats(result, Date.now() - startTime);
            this.requestHistory.push(result);
            this.logger.error(`领水请求失败: ${walletAddress}`, error);
            return result;
        }
        finally {
            this.processingQueue.delete(walletAddress);
        }
    }
    async callFaucetAPI(walletAddress) {
        if (!this.config.url) {
            throw new Error('领水API URL未配置');
        }
        try {
            const response = await globalThis.fetch(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Solayer-SwapBot/1.0.0',
                },
                body: JSON.stringify({
                    address: walletAddress,
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            return {
                success: data.success || data.status === 'success',
                transactionHash: data.transactionHash || data.txHash || data.signature,
                amount: data.amount || 1,
                error: data.error || data.message,
            };
        }
        catch (error) {
            this.logger.error('API调用失败:', error);
            throw error;
        }
    }
    startQueueProcessor() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.processingInterval = setInterval(async () => {
            await this.processQueue();
        }, this.requestIntervalMs);
        this.logger.log('队列处理器已启动');
    }
    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) {
            return;
        }
        this.isProcessing = true;
        try {
            while (this.requestQueue.length > 0 && this.canMakeRequest()) {
                const queueItem = this.requestQueue.shift();
                if (!queueItem)
                    break;
                try {
                    const result = await this.processRequest(queueItem.walletAddress);
                    if (!result.success && queueItem.retryCount < queueItem.maxRetries) {
                        queueItem.retryCount++;
                        this.requestQueue.push(queueItem);
                        this.logger.log(`钱包 ${queueItem.walletAddress} 重试 ${queueItem.retryCount}/${queueItem.maxRetries}`);
                    }
                }
                catch (error) {
                    this.logger.error(`处理队列项失败: ${queueItem.walletAddress}`, error);
                    if (queueItem.retryCount < queueItem.maxRetries) {
                        queueItem.retryCount++;
                        this.requestQueue.push(queueItem);
                    }
                }
                this.stats.queuedRequests = this.requestQueue.length;
            }
        }
        finally {
            this.isProcessing = false;
        }
    }
    updateStats(result, responseTime) {
        this.stats.totalRequests++;
        if (result.success) {
            this.stats.successfulRequests++;
            if (result.amount) {
                this.stats.totalAmount += result.amount;
            }
        }
        else {
            this.stats.failedRequests++;
        }
        this.stats.averageResponseTime =
            (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) /
                this.stats.totalRequests;
    }
    onModuleDestroy() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.logger.log('领水服务已停止');
    }
};
exports.FaucetService = FaucetService;
exports.FaucetService = FaucetService = FaucetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FaucetService);
//# sourceMappingURL=faucet.service.js.map