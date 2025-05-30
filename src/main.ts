import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // 创建应用实例
  const app = await NestFactory.create(AppModule);
  
  // 获取配置服务
  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') || 3000;
  
  // 启用 CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });
  
  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 启动应用
  await app.listen(port);
  
  logger.log(`🚀 Solayer SwapBot 启动成功！`);
  logger.log(`🌐 服务地址: http://localhost:${port}`);
  logger.log(`📚 API文档: http://localhost:${port}/api`);
  logger.log(`💰 领水接口: http://localhost:${port}/api/faucet`);
  logger.log(`👛 钱包接口: http://localhost:${port}/api/wallet`);
}

// 启动应用并处理错误
bootstrap().catch((error) => {
  console.error('❌ 应用启动失败:', error);
  process.exit(1);
}); 