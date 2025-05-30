import { Keypair } from '@solana/web3.js';
export interface IWallet {
    id: string;
    publicKey: string;
    privateKey: string;
    keypair: Keypair;
    createdAt: Date;
    lastUsedAt?: Date;
    balance?: number;
    isActive: boolean;
}
export interface IWalletBalance {
    publicKey: string;
    balance: number;
    lamports: number;
}
export interface IWalletCreateConfig {
    count: number;
    useExisting?: boolean;
}
export interface IWalletManager {
    generateWallets(count: number): Promise<IWallet[]>;
    getAllWallets(): Promise<IWallet[]>;
    getWalletByPublicKey(publicKey: string): Promise<IWallet | null>;
    saveWallet(wallet: IWallet): Promise<void>;
    loadWallets(): Promise<IWallet[]>;
    updateWalletBalance(publicKey: string, balance: number): Promise<void>;
    getAvailableWallets(): Promise<IWallet[]>;
}
