import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(private readonly walletService: WalletService) {}

  /**
   * 生成新钱包
   */
  @Post('generate')
  async generateWallets(@Body() body: { count: number }) {
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
    } catch (error) {
      this.logger.error('生成钱包失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '生成钱包失败',
      };
    }
  }

  /**
   * 获取所有钱包
   */
  @Get()
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
    } catch (error) {
      this.logger.error('获取钱包列表失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '获取钱包列表失败',
      };
    }
  }

  /**
   * 获取钱包余额
   */
  @Get(':address/balance')
  async getWalletBalance(@Param('address') address: string) {
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
    } catch (error) {
      this.logger.error(`获取钱包余额失败: ${address}`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '获取余额失败',
      };
    }
  }

  /**
   * 获取钱包详情
   */
  @Get(':address')
  async getWallet(@Param('address') address: string) {
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
    } catch (error) {
      this.logger.error(`获取钱包详情失败: ${address}`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '获取钱包详情失败',
      };
    }
  }

  /**
   * 更新所有钱包余额
   */
  @Post('update-balances')
  async updateAllBalances() {
    this.logger.log('更新所有钱包余额请求');
    
    try {
      await this.walletService.updateAllWalletBalances();
      return {
        status: 'success',
        message: '钱包余额更新完成',
      };
    } catch (error) {
      this.logger.error('更新钱包余额失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '更新余额失败',
      };
    }
  }

  /**
   * 获取钱包统计信息
   */
  @Get('stats/summary')
  getWalletStats() {
    try {
      const stats = this.walletService.getWalletStats();
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      this.logger.error('获取钱包统计失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '获取统计失败',
      };
    }
  }
} 