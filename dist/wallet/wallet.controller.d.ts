import { WalletService } from './wallet.service';
export declare class WalletController {
    private readonly walletService;
    private readonly logger;
    constructor(walletService: WalletService);
    generateWallets(body: {
        count: number;
    }): Promise<{
        status: string;
        message: string;
        data?: undefined;
    } | {
        status: string;
        data: {
            count: number;
            wallets: {
                id: string;
                publicKey: string;
                createdAt: Date;
                isActive: boolean;
            }[];
        };
        message?: undefined;
    }>;
    getAllWallets(): Promise<{
        status: string;
        data: {
            count: number;
            wallets: {
                id: string;
                publicKey: string;
                balance: number | undefined;
                createdAt: Date;
                lastUsedAt: Date | undefined;
                isActive: boolean;
            }[];
        };
        message?: undefined;
    } | {
        status: string;
        message: string;
        data?: undefined;
    }>;
    getWalletBalance(address: string): Promise<{
        status: string;
        message: string;
        data?: undefined;
    } | {
        status: string;
        data: import("../common/interfaces/wallet.interface").IWalletBalance;
        message?: undefined;
    }>;
    getWallet(address: string): Promise<{
        status: string;
        message: string;
        data?: undefined;
    } | {
        status: string;
        data: {
            id: string;
            publicKey: string;
            balance: number | undefined;
            createdAt: Date;
            lastUsedAt: Date | undefined;
            isActive: boolean;
        };
        message?: undefined;
    }>;
    updateAllBalances(): Promise<{
        status: string;
        message: string;
    }>;
    getWalletStats(): {
        status: string;
        data: {
            totalWallets: number;
            activeWallets: number;
            totalBalance: number;
            averageBalance: number;
        };
        message?: undefined;
    } | {
        status: string;
        message: string;
        data?: undefined;
    };
}
