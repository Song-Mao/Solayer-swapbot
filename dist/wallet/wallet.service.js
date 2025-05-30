"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WalletService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const web3_js_1 = require("@solana/web3.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const bs58_1 = __importDefault(require("bs58"));
let WalletService = WalletService_1 = class WalletService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(WalletService_1.name);
        this.wallets = new Map();
        const rpcUrl = this.configService.get('app.solana.rpcUrl') || 'https://api.devnet.solana.com';
        this.connection = new web3_js_1.Connection(rpcUrl, 'confirmed');
        this.storagePath = this.configService.get('app.wallet.storagePath') || './wallets';
        this.encryptionKey = this.getOrCreateEncryptionKey();
        this.ensureStorageDirectory();
        this.loadWallets().catch(error => {
            this.logger.error('Failed to load existing wallets:', error);
        });
    }
    async generateWallets(count) {
        this.logger.log(`生成 ${count} 个新钱包...`);
        const newWallets = [];
        for (let i = 0; i < count; i++) {
            const keypair = web3_js_1.Keypair.generate();
            const wallet = {
                id: (0, uuid_1.v4)(),
                publicKey: keypair.publicKey.toString(),
                privateKey: this.encryptPrivateKey(bs58_1.default.encode(keypair.secretKey)),
                keypair: keypair,
                createdAt: new Date(),
                isActive: true,
            };
            newWallets.push(wallet);
            this.wallets.set(wallet.publicKey, wallet);
            await this.saveWallet(wallet);
            this.logger.debug(`生成钱包: ${wallet.publicKey}`);
        }
        this.logger.log(`成功生成 ${newWallets.length} 个钱包`);
        return newWallets;
    }
    async getAllWallets() {
        return Array.from(this.wallets.values());
    }
    async getWalletByPublicKey(publicKey) {
        return this.wallets.get(publicKey) || null;
    }
    async saveWallet(wallet) {
        try {
            const walletData = {
                id: wallet.id,
                publicKey: wallet.publicKey,
                privateKey: wallet.privateKey,
                createdAt: wallet.createdAt.toISOString(),
                lastUsedAt: wallet.lastUsedAt?.toISOString(),
                balance: wallet.balance,
                isActive: wallet.isActive,
            };
            const filePath = path.join(this.storagePath, `${wallet.id}.json`);
            await fs.promises.writeFile(filePath, JSON.stringify(walletData, null, 2));
        }
        catch (error) {
            this.logger.error(`保存钱包失败 ${wallet.publicKey}:`, error);
            throw error;
        }
    }
    async loadWallets() {
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
                    const decryptedPrivateKey = this.decryptPrivateKey(data.privateKey);
                    const keypair = web3_js_1.Keypair.fromSecretKey(bs58_1.default.decode(decryptedPrivateKey));
                    const wallet = {
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
                }
                catch (error) {
                    this.logger.error(`加载钱包文件失败 ${file}:`, error);
                }
            }
            this.logger.log(`成功加载 ${this.wallets.size} 个钱包`);
            return Array.from(this.wallets.values());
        }
        catch (error) {
            this.logger.error('加载钱包失败:', error);
            throw error;
        }
    }
    async updateWalletBalance(publicKey, balance) {
        const wallet = this.wallets.get(publicKey);
        if (wallet) {
            wallet.balance = balance;
            wallet.lastUsedAt = new Date();
            await this.saveWallet(wallet);
        }
    }
    async getAvailableWallets() {
        return Array.from(this.wallets.values()).filter(wallet => wallet.isActive);
    }
    async getWalletBalance(publicKey) {
        try {
            const pubKey = new web3_js_1.PublicKey(publicKey);
            const lamports = await this.connection.getBalance(pubKey);
            const balance = lamports / web3_js_1.LAMPORTS_PER_SOL;
            return {
                publicKey,
                balance,
                lamports,
            };
        }
        catch (error) {
            this.logger.error(`获取钱包余额失败 ${publicKey}:`, error);
            return null;
        }
    }
    async updateAllWalletBalances() {
        this.logger.log('开始更新所有钱包余额...');
        const wallets = Array.from(this.wallets.values());
        for (const wallet of wallets) {
            try {
                const balanceInfo = await this.getWalletBalance(wallet.publicKey);
                if (balanceInfo) {
                    await this.updateWalletBalance(wallet.publicKey, balanceInfo.balance);
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                this.logger.error(`更新钱包余额失败 ${wallet.publicKey}:`, error);
            }
        }
        this.logger.log('钱包余额更新完成');
    }
    getOrCreateEncryptionKey() {
        const keyPath = path.join(this.storagePath, '.encryption.key');
        try {
            if (fs.existsSync(keyPath)) {
                return fs.readFileSync(keyPath, 'utf-8');
            }
            else {
                const key = crypto.randomBytes(32).toString('hex');
                this.ensureStorageDirectory();
                fs.writeFileSync(keyPath, key);
                return key;
            }
        }
        catch (error) {
            this.logger.error('创建或获取加密密钥失败:', error);
            return crypto.randomBytes(32).toString('hex');
        }
    }
    encryptPrivateKey(privateKey) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }
    decryptPrivateKey(encryptedPrivateKey) {
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
    ensureStorageDirectory() {
        if (!fs.existsSync(this.storagePath)) {
            fs.mkdirSync(this.storagePath, { recursive: true });
            this.logger.log(`创建钱包存储目录: ${this.storagePath}`);
        }
    }
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
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = WalletService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map