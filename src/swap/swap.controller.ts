import { Controller, Post, Body, Logger } from '@nestjs/common';
import { SwapService } from './swap.service';

@Controller('swap')
export class SwapController {
  private readonly logger = new Logger(SwapController.name);

  constructor(private readonly swapService: SwapService) {}

  /**
   * 执行 swap 操作
   */
  @Post()
  async swap(@Body() body: any) {
    this.logger.log('收到 swap 请求', body);
    // 这里可以根据实际 swap 参数定义 DTO
    const result = await this.swapService.swapToken(body);
    return {
      status: 'success',
      data: result,
    };
  }

  /**
   * 发送swap交易
   * @param body { base64Tx: string }
   */
  @Post('send')
  async sendSwap(@Body() body: { base64Tx: string }) {
    this.logger.log('收到swap交易请求', body);
    if (!body.base64Tx) {
      return { status: 'error', message: '缺少base64Tx参数' };
    }
    const result = await this.swapService.sendSwapTransaction(body.base64Tx);
    return result.success
      ? { status: 'success', signature: result.signature }
      : { status: 'error', message: result.error };
  }
}
