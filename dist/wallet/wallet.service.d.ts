import { ConfigService } from '@nestjs/config';
import { IWallet, IWalletManager, IWalletBalance } from '../common/interfaces/wallet.interface';
export declare class WalletService implements IWalletManager {
    private configService;
    private readonly logger;
    private wallets;
    private connection;
    private readonly storagePath;
    private readonly encryptionKey;
    constructor(configService: ConfigService);
    generateWallets(count: number): Promise<IWallet[]>;
    getAllWallets(): Promise<IWallet[]>;
    getWalletByPublicKey(publicKey: string): Promise<IWallet | null>;
    saveWallet(wallet: IWallet): Promise<void>;
    loadWallets(): Promise<IWallet[]>;
    updateWalletBalance(publicKey: string, balance: number): Promise<void>;
    getAvailableWallets(): Promise<IWallet[]>;
    getWalletBalance(publicKey: string): Promise<IWalletBalance | null>;
    updateAllWalletBalances(): Promise<void>;
    private getOrCreateEncryptionKey;
    private encryptPrivateKey;
    private decryptPrivateKey;
    private ensureStorageDirectory;
    getWalletStats(): {
        totalWallets: number;
        activeWallets: number;
        totalBalance: number;
        averageBalance: number;
    };
}
