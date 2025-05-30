import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SwapService } from './swap.service';
import { SwapController } from './swap.controller';

@Module({
  imports: [ConfigModule],
  controllers: [SwapController],
  providers: [SwapService],
  exports: [SwapService],
})
export class SwapModule {}
