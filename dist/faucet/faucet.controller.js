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
var FaucetController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaucetController = void 0;
const common_1 = require("@nestjs/common");
const faucet_service_1 = require("./faucet.service");
const wallet_service_1 = require("../wallet/wallet.service");
let FaucetController = FaucetController_1 = class FaucetController {
    constructor(faucetService, walletService) {
        this.faucetService = faucetService;
        this.walletService = walletService;
        this.logger = new common_1.Logger(FaucetController_1.name);
    }
    async requestFaucet(address) {
        this.logger.log(`API请求领水: ${address}`);
        try {
            const result = await this.faucetService.requestFaucet(address);
            return {
                status: 'success',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`领水请求失败: ${address}`, error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '请求失败',
            };
        }
    }
    async batchRequestFaucet(body) {
        this.logger.log(`批量领水请求，数量: ${body.addresses?.length || 0}`);
        if (!body.addresses || !Array.isArray(body.addresses)) {
            return {
                status: 'error',
                message: '请提供有效的钱包地址数组',
            };
        }
        try {
            const results = await this.faucetService.batchRequestFaucet(body.addresses);
            return {
                status: 'success',
                data: results,
                summary: {
                    total: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                },
            };
        }
        catch (error) {
            this.logger.error('批量领水请求失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '批量请求失败',
            };
        }
    }
    async requestFaucetForAllWallets() {
        this.logger.log('为所有钱包申请领水');
        try {
            const wallets = await this.walletService.getAvailableWallets();
            const addresses = wallets.map(wallet => wallet.publicKey);
            if (addresses.length === 0) {
                return {
                    status: 'error',
                    message: '没有可用的钱包',
                };
            }
            const results = await this.faucetService.batchRequestFaucet(addresses);
            return {
                status: 'success',
                data: results,
                summary: {
                    total: results.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length,
                },
            };
        }
        catch (error) {
            this.logger.error('为所有钱包申请领水失败', error);
            return {
                status: 'error',
                message: error instanceof Error ? error.message : '申请失败',
            };
        }
    }
    getStats() {
        const stats = this.faucetService.getStats();
        return {
            status: 'success',
            data: stats,
        };
    }
    getQueueStatus() {
        const queueStatus = this.faucetService.getQueueStatus();
        return {
            status: 'success',
            data: queueStatus,
        };
    }
    clearQueue() {
        this.faucetService.clearQueue();
        return {
            status: 'success',
            message: '队列已清空',
        };
    }
    canRequestFaucet(address) {
        const canRequest = this.faucetService.canRequestFaucet(address);
        return {
            status: 'success',
            data: {
                address,
                canRequest,
            },
        };
    }
};
exports.FaucetController = FaucetController;
__decorate([
    (0, common_1.Post)('request/:address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FaucetController.prototype, "requestFaucet", null);
__decorate([
    (0, common_1.Post)('batch'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FaucetController.prototype, "batchRequestFaucet", null);
__decorate([
    (0, common_1.Post)('request-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FaucetController.prototype, "requestFaucetForAllWallets", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FaucetController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('queue/status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FaucetController.prototype, "getQueueStatus", null);
__decorate([
    (0, common_1.Delete)('queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FaucetController.prototype, "clearQueue", null);
__decorate([
    (0, common_1.Get)('can-request/:address'),
    __param(0, (0, common_1.Param)('address')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FaucetController.prototype, "canRequestFaucet", null);
exports.FaucetController = FaucetController = FaucetController_1 = __decorate([
    (0, common_1.Controller)('faucet'),
    __metadata("design:paramtypes", [faucet_service_1.FaucetService,
        wallet_service_1.WalletService])
], FaucetController);
//# sourceMappingURL=faucet.controller.js.map