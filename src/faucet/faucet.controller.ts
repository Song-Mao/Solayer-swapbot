import { Controller, Post, Get, Body, Param, Logger, Delete } from '@nestjs/common';
import { FaucetService } from './faucet.service';
import { WalletService } from '../wallet/wallet.service';

@Controller('faucet')
export class FaucetController {
  private readonly logger = new Logger(FaucetController.name);

  constructor(
    private readonly faucetService: FaucetService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * 为单个钱包申请领水
   */
  @Post('request/:address')
  async requestFaucet(@Param('address') address: string) {
    this.logger.log(`API请求领水: ${address}`);
    
    try {
      const result = await this.faucetService.requestFaucet(address);
      return {
        status: 'success',
        data: result,
      };
    } catch (error) {
      this.logger.error(`领水请求失败: ${address}`, error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '请求失败',
      };
    }
  }

  /**
   * 批量申请领水
   */
  @Post('batch')
  async batchRequestFaucet(@Body() body: { addresses: string[] }) {
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
    } catch (error) {
      this.logger.error('批量领水请求失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '批量请求失败',
      };
    }
  }

  /**
   * 为所有可用钱包申请领水
   */
  @Post('request-all')
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
    } catch (error) {
      this.logger.error('为所有钱包申请领水失败', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : '申请失败',
      };
    }
  }

  /**
   * 获取领水统计信息
   */
  @Get('stats')
  getStats() {
    const stats = this.faucetService.getStats();
    return {
      status: 'success',
      data: stats,
    };
  }

  /**
   * 获取队列状态
   */
  @Get('queue/status')
  getQueueStatus() {
    const queueStatus = this.faucetService.getQueueStatus();
    return {
      status: 'success',
      data: queueStatus,
    };
  }

  /**
   * 清空队列
   */
  @Delete('queue')
  clearQueue() {
    this.faucetService.clearQueue();
    return {
      status: 'success',
      message: '队列已清空',
    };
  }

  /**
   * 检查钱包是否可以领水
   */
  @Get('can-request/:address')
  canRequestFaucet(@Param('address') address: string) {
    const canRequest = this.faucetService.canRequestFaucet(address);
    return {
      status: 'success',
      data: {
        address,
        canRequest,
      },
    };
  }
} 