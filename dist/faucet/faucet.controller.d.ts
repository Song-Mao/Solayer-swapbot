import { FaucetService } from './faucet.service';
import { WalletService } from '../wallet/wallet.service';
export declare class FaucetController {
    private readonly faucetService;
    private readonly walletService;
    private readonly logger;
    constructor(faucetService: FaucetService, walletService: WalletService);
    requestFaucet(address: string): Promise<{
        status: string;
        data: import("../common/interfaces/faucet.interface").IFaucetResult;
        message?: undefined;
    } | {
        status: string;
        message: string;
        data?: undefined;
    }>;
    batchRequestFaucet(body: {
        addresses: string[];
    }): Promise<{
        status: string;
        message: string;
        data?: undefined;
        summary?: undefined;
    } | {
        status: string;
        data: import("../common/interfaces/faucet.interface").IFaucetResult[];
        summary: {
            total: number;
            successful: number;
            failed: number;
        };
        message?: undefined;
    }>;
    requestFaucetForAllWallets(): Promise<{
        status: string;
        message: string;
        data?: undefined;
        summary?: undefined;
    } | {
        status: string;
        data: import("../common/interfaces/faucet.interface").IFaucetResult[];
        summary: {
            total: number;
            successful: number;
            failed: number;
        };
        message?: undefined;
    }>;
    getStats(): {
        status: string;
        data: import("../common/interfaces/faucet.interface").IFaucetStats;
    };
    getQueueStatus(): {
        status: string;
        data: {
            pending: number;
            processing: number;
            completed: number;
        };
    };
    clearQueue(): {
        status: string;
        message: string;
    };
    canRequestFaucet(address: string): {
        status: string;
        data: {
            address: string;
            canRequest: boolean;
        };
    };
}
