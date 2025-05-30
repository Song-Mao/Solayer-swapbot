"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    solana: {
        rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
    },
    faucet: {
        url: process.env.FAUCET_URL,
        maxRequestsPer10Seconds: parseInt(process.env.FAUCET_MAX_REQUESTS_PER_10_SECONDS || '10', 10),
        requestIntervalMs: parseInt(process.env.FAUCET_REQUEST_INTERVAL_MS || '1000', 10),
    },
    wallet: {
        storagePath: process.env.WALLET_STORAGE_PATH || './wallets',
        count: parseInt(process.env.WALLET_COUNT || '50', 10),
    },
    log: {
        level: process.env.LOG_LEVEL || 'info',
    },
}));
//# sourceMappingURL=app.config.js.map