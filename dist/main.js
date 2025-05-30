"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('app.port') || 3000;
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    await app.listen(port);
    logger.log(`🚀 Solayer SwapBot 启动成功！`);
    logger.log(`🌐 服务地址: http://localhost:${port}`);
    logger.log(`📚 API文档: http://localhost:${port}/api`);
    logger.log(`💰 领水接口: http://localhost:${port}/api/faucet`);
    logger.log(`👛 钱包接口: http://localhost:${port}/api/wallet`);
}
bootstrap().catch((error) => {
    console.error('❌ 应用启动失败:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map