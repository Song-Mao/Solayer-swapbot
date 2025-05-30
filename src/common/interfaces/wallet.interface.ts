import { Keypair, PublicKey } from '@solana/web3.js';

/**
 * 钱包信息接口
 */
export interface IWallet {
  /** 钱包唯一标识 */
  id: string;
  /** 钱包公钥地址 */
  publicKey: string;
  /** 钱包私钥（加密存储） */
  privateKey: string;
  /** 钱包 Keypair 对象 */
  keypair: Keypair;
  /** 创建时间 */
  createdAt: Date;
  /** 最后使用时间 */
  lastUsedAt?: Date;
  /** 当前余额（SOL） */
  balance?: number;
  /** 是否活跃 */
  isActive: boolean;
}

/**
 * 钱包余额信息
 */
export interface IWalletBalance {
  publicKey: string;
  balance: number;
  lamports: number;
}

/**
 * 钱包创建配置
 */
export interface IWalletCreateConfig {
  count: number;
  useExisting?: boolean;
}

/**
 * 钱包管理器接口
 */
export interface IWalletManager {
  /**
   * 生成指定数量的钱包
   */
  generateWallets(count: number): Promise<IWallet[]>;
  
  /**
   * 获取所有钱包
   */
  getAllWallets(): Promise<IWallet[]>;
  
  /**
   * 根据公钥获取钱包
   */
  getWalletByPublicKey(publicKey: string): Promise<IWallet | null>;
  
  /**
   * 保存钱包到存储
   */
  saveWallet(wallet: IWallet): Promise<void>;
  
  /**
   * 从存储加载钱包
   */
  loadWallets(): Promise<IWallet[]>;
  
  /**
   * 更新钱包余额
   */
  updateWalletBalance(publicKey: string, balance: number): Promise<void>;
  
  /**
   * 获取可用的钱包（用于领水）
   */
  getAvailableWallets(): Promise<IWallet[]>;
} 