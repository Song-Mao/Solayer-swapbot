import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import appConfig from './config/app.config';
import { WalletModule } from './wallet/wallet.module';
import { FaucetModule } from './faucet/faucet.module';
import { SwapModule } from './swap/swap.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    
    // 定时任务模块
    ScheduleModule.forRoot(),
    
    // 业务模块
    WalletModule,
    FaucetModule,
    SwapModule,
  ],
})
export class AppModule {}