import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FaucetService } from './faucet.service';
import { FaucetController } from './faucet.controller';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [ConfigModule, WalletModule],
  controllers: [FaucetController],
  providers: [FaucetService],
  exports: [FaucetService],
})
export class FaucetModule {} 