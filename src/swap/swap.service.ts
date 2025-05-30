import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SwapService {
  private readonly logger = new Logger(SwapService.name);

  constructor(private configService: ConfigService) {}

  // TODO: 实现 swap 逻辑
  async swapToken(params: any): Promise<any> {
    this.logger.log('执行 swap 操作', params);
    // 这里调用 Solayer swap API 或构建交易
    return { status: 'not_implemented' };
  }

  /**
   * 发送已签名的swap交易到Solayer开发网
   * @param base64Tx 已签名交易（base64字符串）
   * @returns 交易结果（包含交易哈希）
   */
  async sendSwapTransaction(base64Tx: string): Promise<any> {
    const rpcUrl =
      this.configService.get<string>('app.solana.rpcUrl') ||
      'https://api.devnet.solana.com';
    const body = {
      jsonrpc: '2.0',
      id: Date.now().toString(),
      method: 'sendTransaction',
      params: [
        base64Tx,
        { encoding: 'base64', preflightCommitment: 'confirmed' },
      ],
    };
    this.logger.log('发送swap交易', body);
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (result.error) {
        this.logger.error('swap交易失败', result.error);
        return { success: false, error: result.error };
      }
      return { success: true, signature: result.result };
    } catch (e) {
      this.logger.error('swap交易异常', e);
      return { success: false, error: e instanceof Error ? e.message : e };
    }
  }
}
