import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import bs58 from 'bs58';
import { IWallet, IWalletManager, IWalletBalance } from '../common/interfaces/wallet.interface';

@Injectable()
export class WalletService implements IWalletManager {
  private readonly logger = new Logger(WalletService.name);
  private wallets: Map<string, IWallet> = new Map();
  private connection: Connection;
  private readonly storagePath: string;
  private readonly encryptionKey: string;

  constructor(private configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('app.solana.rpcUrl') || 'https://api.devnet.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.storagePath = this.configService.get<string>('app.wallet.storagePath') || './wallets';
    
    // 生成或获取加密密钥（实际生产环境应该从安全存储获取）
    this.encryptionKey = this.getOrCreateEncryptionKey();
    
    // 确保钱包存储目录存在
    this.ensureStorageDirectory();
    
    // 启动时加载现有钱包
    this.loadWallets().catch(error => {
      this.logger.error('Failed to load existing wallets:', error);
    });
  }

  /**
   * 生成指定数量的钱包
   */
  async generateWallets(count: number): Promise<IWallet[]> {
    this.logger.log(`生成 ${count} 个新钱包...`);
    const newWallets: IWallet[] = [];

    for (let i = 0; i < count; i++) {
      const keypair = Keypair.generate();
      const wallet: IWallet = {
        id: uuidv4(),
        publicKey: keypair.publicKey.toString(),
        privateKey: this.encryptPrivateKey(bs58.encode(keypair.secretKey)),
        keypair: keypair,
        createdAt: new Date(),
        isActive: true,
      };

      newWallets.push(wallet);
      this.wallets.set(wallet.publicKey, wallet);
      
      // 保存到文件
      await this.saveWallet(wallet);
      
      this.logger.debug(`生成钱包: ${wallet.publicKey}`);
    }

    this.logger.log(`成功生成 ${newWallets.length} 个钱包`);
    return newWallets;
  }

  /**
   * 获取所有钱包
   */
  async getAllWallets(): Promise<IWallet[]> {
    return Array.from(this.wallets.values());
  }

  /**
   * 根据公钥获取钱包
   */
  async getWalletByPublicKey(publicKey: string): Promise<IWallet | null> {
    return this.wallets.get(publicKey) || null;
  }

  /**
   * 保存钱包到存储
   */
  async saveWallet(wallet: IWallet): Promise<void> {
    try {
      const walletData = {
        id: wallet.id,
        publicKey: wallet.publicKey,
        privateKey: wallet.privateKey, // 已加密
        createdAt: wallet.createdAt.toISOString(),
        lastUsedAt: wallet.lastUsedAt?.toISOString(),
        balance: wallet.balance,
        isActive: wallet.isActive,
      };

      const filePath = path.join(this.storagePath, `${wallet.id}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(walletData, null, 2));
      
    } catch (error) {
      this.logger.error(`保存钱包失败 ${wallet.publicKey}:`, error);
      throw error;
    }
  }

  /**
   * 从存储加载钱包
   */
  async loadWallets(): Promise<IWallet[]> {
    try {
      if (!fs.existsSync(this.storagePath)) {
        this.logger.log('钱包存储目录不存在，将创建新目录');
        return [];
      }

      const files = await fs.promises.readdir(this.storagePath);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      this.logger.log(`发现 ${jsonFiles.length} 个钱包文件`);

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(this.storagePath, file);
          const content = await fs.promises.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);

          // 解密私钥并重建 Keypair
          const decryptedPrivateKey = this.decryptPrivateKey(data.privateKey);
          const keypair = Keypair.fromSecretKey(bs58.decode(decryptedPrivateKey));

          const wallet: IWallet = {
            id: data.id,
            publicKey: data.publicKey,
            privateKey: data.privateKey,
            keypair: keypair,
            createdAt: new Date(data.createdAt),
            lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : undefined,
            balance: data.balance,
            isActive: data.isActive,
          };

          this.wallets.set(wallet.publicKey, wallet);
        } catch (error) {
          this.logger.error(`加载钱包文件失败 ${file}:`, error);
        }
      }

      this.logger.log(`成功加载 ${this.wallets.size} 个钱包`);
      return Array.from(this.wallets.values());
    } catch (error) {
      this.logger.error('加载钱包失败:', error);
      throw error;
    }
  }

  /**
   * 更新钱包余额
   */
  async updateWalletBalance(publicKey: string, balance: number): Promise<void> {
    const wallet = this.wallets.get(publicKey);
    if (wallet) {
      wallet.balance = balance;
      wallet.lastUsedAt = new Date();
      await this.saveWallet(wallet);
    }
  }

  /**
   * 获取可用的钱包（用于领水）
   */
  async getAvailableWallets(): Promise<IWallet[]> {
    return Array.from(this.wallets.values()).filter(wallet => wallet.isActive);
  }

  /**
   * 获取钱包余额信息
   */
  async getWalletBalance(publicKey: string): Promise<IWalletBalance | null> {
    try {
      const pubKey = new PublicKey(publicKey);
      const lamports = await this.connection.getBalance(pubKey);
      const balance = lamports / LAMPORTS_PER_SOL;

      return {
        publicKey,
        balance,
        lamports,
      };
    } catch (error) {
      this.logger.error(`获取钱包余额失败 ${publicKey}:`, error);
      return null;
    }
  }

  /**
   * 批量更新所有钱包余额
   */
  async updateAllWalletBalances(): Promise<void> {
    this.logger.log('开始更新所有钱包余额...');
    const wallets = Array.from(this.wallets.values());
    
    for (const wallet of wallets) {
      try {
        const balanceInfo = await this.getWalletBalance(wallet.publicKey);
        if (balanceInfo) {
          await this.updateWalletBalance(wallet.publicKey, balanceInfo.balance);
        }
        
        // 添加小延迟避免RPC限制
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(`更新钱包余额失败 ${wallet.publicKey}:`, error);
      }
    }
    
    this.logger.log('钱包余额更新完成');
  }

  /**
   * 获取或创建加密密钥
   */
  private getOrCreateEncryptionKey(): string {
    const keyPath = path.join(this.storagePath, '.encryption.key');
    
    try {
      if (fs.existsSync(keyPath)) {
        return fs.readFileSync(keyPath, 'utf-8');
      } else {
        const key = crypto.randomBytes(32).toString('hex');
        this.ensureStorageDirectory();
        fs.writeFileSync(keyPath, key);
        return key;
      }
    } catch (error) {
      this.logger.error('创建或获取加密密钥失败:', error);
      // 如果文件操作失败，使用临时密钥（不推荐用于生产环境）
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * 加密私钥
   */
  private encryptPrivateKey(privateKey: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(privateKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * 解密私钥
   */
  private decryptPrivateKey(encryptedPrivateKey: string): string {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
    
    const parts = encryptedPrivateKey.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 确保存储目录存在
   */
  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
      this.logger.log(`创建钱包存储目录: ${this.storagePath}`);
    }
  }

  /**
   * 获取钱包统计信息
   */
  getWalletStats() {
    const wallets = Array.from(this.wallets.values());
    const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
    const activeWallets = wallets.filter(wallet => wallet.isActive).length;

    return {
      totalWallets: wallets.length,
      activeWallets,
      totalBalance,
      averageBalance: wallets.length > 0 ? totalBalance / wallets.length : 0,
    };
  }
} 