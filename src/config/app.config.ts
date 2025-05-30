import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Solana 网络配置
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    commitment: process.env.SOLANA_COMMITMENT || 'confirmed',
  },

  // 领水配置
  faucet: {
    url: process.env.FAUCET_URL,
    maxRequestsPer10Seconds: parseInt(process.env.FAUCET_MAX_REQUESTS_PER_10_SECONDS || '10', 10),
    requestIntervalMs: parseInt(process.env.FAUCET_REQUEST_INTERVAL_MS || '1000', 10),
  },

  // 钱包配置
  wallet: {
    storagePath: process.env.WALLET_STORAGE_PATH || './wallets',
    count: parseInt(process.env.WALLET_COUNT || '50', 10),
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
})); 