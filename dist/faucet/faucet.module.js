"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaucetModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const faucet_service_1 = require("./faucet.service");
const faucet_controller_1 = require("./faucet.controller");
const wallet_module_1 = require("../wallet/wallet.module");
let FaucetModule = class FaucetModule {
};
exports.FaucetModule = FaucetModule;
exports.FaucetModule = FaucetModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, wallet_module_1.WalletModule],
        controllers: [faucet_controller_1.FaucetController],
        providers: [faucet_service_1.FaucetService],
        exports: [faucet_service_1.FaucetService],
    })
], FaucetModule);
//# sourceMappingURL=faucet.module.js.map