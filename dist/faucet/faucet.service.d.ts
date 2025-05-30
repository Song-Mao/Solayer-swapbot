import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IFaucetManager, IFaucetResult, IFaucetStats } from '../common/interfaces/faucet.interface';
export declare class FaucetService implements IFaucetManager, OnModuleDestroy {
    private configService;
    private readonly logger;
    private readonly config;
    private requestQueue;
    private processingQueue;
    private requestHistory;
    private stats;
    private requestTimestamps;
    private readonly maxRequestsPer10Seconds;
    private readonly requestIntervalMs;
    private isProcessing;
    private processingInterval;
    constructor(configService: ConfigService);
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
    private canMakeRequest;
    private processRequest;
    private callFaucetAPI;
    private startQueueProcessor;
    private processQueue;
    private updateStats;
    onModuleDestroy(): void;
}
