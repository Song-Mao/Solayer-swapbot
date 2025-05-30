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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WalletController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
let WalletController = WalletController_1 = class WalletController {
    constructor(walletService) {
        this.walletService = walletService;
        this.logger = new common_1.Logger(WalletController_1.name);
    }
    async generateWallets(body) {
        this.logger.log(`生成钱包请求，数量: ${body.count}`);
        if (!body.count || body.count <= 0 || body.count > 100) {
            return {
                status: 'error',
                message: '钱包数量必须在1-100之间',
            };
        }
        try {
            const wallets = await this.walletService.generateWallets(body.count);
            return {
                status: 'success',
                data: {
                    count: wallets.length,
                    wallets: wallets.map(wallet => ({
                        id: wallet.id,
                        publicKey: wallet.publicKey,
                        createdAt: wallet.createdAt,
                        isActive: wallet.isActive,
                    })),
                },
            };
        }
        catch (error) {
            this.logger.error('生成钱包失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '生成钱包失败',
            };
        }
    }
    async getAllWallets() {
        try {
            const wallets = await this.walletService.getAllWallets();
            return {
                status: 'success',
                data: {
                    count: wallets.length,
                    wallets: wallets.map(wallet => ({
                        id: wallet.id,
                        publicKey: wallet.publicKey,
                        balance: wallet.balance,
                        createdAt: wallet.createdAt,
                        lastUsedAt: wallet.lastUsedAt,
                        isActive: wallet.isActive,
                    })),
                },
            };
        }
        catch (error) {
            this.logger.error('获取钱包列表失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '获取钱包列表失败',
            };
        }
    }
    async getWalletBalance(address) {
        try {
            const balance = await this.walletService.getWalletBalance(address);
            if (!balance) {
                return {
                    status: 'error',
                    message: '钱包不存在或获取余额失败',
                };
            }
            return {
                status: 'success',
                data: balance,
            };
        }
        catch (error) {
            this.logger.error(`获取钱包余额失败: ${address}`, error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '获取余额失败',
            };
        }
    }
    async getWallet(address) {
        try {
            const wallet = await this.walletService.getWalletByPublicKey(address);
            if (!wallet) {
                return {
                    status: 'error',
                    message: '钱包不存在',
                };
            }
            return {
                status: 'success',
                data: {
                    id: wallet.id,
                    publicKey: wallet.publicKey,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt,
                    lastUsedAt: wallet.lastUsedAt,
                    isActive: wallet.isActive,
                },
            };
        }
        catch (error) {
            this.logger.error(`获取钱包详情失败: ${address}`, error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '获取钱包详情失败',
            };
        }
    }
    async updateAllBalances() {
        this.logger.log('更新所有钱包余额请求');
        try {
            await this.walletService.updateAllWalletBalances();
            return {
                status: 'success',
                message: '钱包余额更新完成',
            };
        }
        catch (error) {
            this.logger.error('更新钱包余额失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '更新余额失败',
            };
        }
    }
    getWalletStats() {
        try {
            const stats = this.walletService.getWalletStats();
            return {
                status: 'success',
                data: stats,
            };
        }
        catch (error) {
            this.logger.error('获取钱包统计失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '获取统计失败',
            };
        }
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "generateWallets", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getAllWallets", null);
__decorate([
    (0, common_1.Get)(':address/balance'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWalletBalance", null);
__decorate([
    (0, common_1.Get)(':address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getWallet", null);
__decorate([
    (0, common_1.Post)('update-balances'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "updateAllBalances", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WalletController.prototype, "getWalletStats", null);
exports.WalletController = WalletController = WalletController_1 = __decorate([
    (0, common_1.Controller)('wallet'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map