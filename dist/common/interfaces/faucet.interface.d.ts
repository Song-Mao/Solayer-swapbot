export interface IFaucetResult {
    success: boolean;
    walletAddress: string;
    transactionHash?: string;
    amount?: number;
    error?: string;
    timestamp: Date;
}
export interface IFaucetRequest {
    walletAddress: string;
    requestTime: Date;
}
export interface IFaucetConfig {
    url: string;
    maxRequestsPer10Seconds: number;
    requestIntervalMs: number;
}
export interface IFaucetQueueItem {
    walletAddress: string;
    queueTime: Date;
    retryCount: number;
    maxRetries: number;
}
export interface IFaucetStats {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    totalAmount: number;
    averageResponseTime: number;
    queuedRequests: number;
}
export interface IFaucetManager {
    requestFaucet(walletAddress: string): Promise<IFaucetResult>;
    batchRequestFaucet(walletAddresses: string[]): Promise<IFaucetResult[]>;
    getStats(): IFaucetStats;
    canRequestFaucet(walletAddress: string): boolean;
    getQueueStatus(): {
        pending: number;
        processing: number;
        completed: number;
    };
    clearQueue(): void;
}
