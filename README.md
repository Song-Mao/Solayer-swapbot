# Solayer SwapBot - 自动领水机器人

Solayer 开发网自动领水和 Swap 机器人，使用 NestJS + TypeScript + Solana Web3.js 构建。

## 功能特性

### ✅ 已实现功能

- **🔐 钱包管理**
  - 自动生成多个 Solana 钱包
  - 安全的私钥加密存储
  - 钱包余额查询和更新
  - 钱包统计信息

- **💧 自动领水**
  - 遵循官方频率限制（每10秒最多10个请求）
  - 智能队列管理系统
  - 失败重试机制
  - 实时统计和监控

### 🚧 待实现功能

- **🔄 自动 Swap**
  - DEX 交易功能
  - 价格监控
  - 套利策略

## 技术架构

- **框架**: NestJS 10.x
- **语言**: TypeScript 5.x
- **区块链**: Solana Web3.js
- **存储**: 本地文件系统（加密）
- **队列**: 内存队列 + 定时任务

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 配置环境变量

复制 \`env.example\` 为 \`.env\` 并配置：

\`\`\`bash
cp env.example .env
\`\`\`

编辑 \`.env\` 文件：

\`\`\`env
# 应用配置
PORT=3000
NODE_ENV=development

# Solana 网络配置
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_COMMITMENT=confirmed

# 领水相关配置
FAUCET_URL=你的领水接口地址
FAUCET_MAX_REQUESTS_PER_10_SECONDS=10
FAUCET_REQUEST_INTERVAL_MS=1000

# 钱包配置
WALLET_STORAGE_PATH=./wallets
WALLET_COUNT=50

# 日志配置
LOG_LEVEL=info
\`\`\`

### 3. 启动应用

\`\`\`bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm run start
\`\`\`

## API 接口

### 钱包管理

\`\`\`http
# 生成钱包
POST /api/wallet/generate
Content-Type: application/json
{
  "count": 10
}

# 获取所有钱包
GET /api/wallet

# 获取钱包详情
GET /api/wallet/{address}

# 获取钱包余额
GET /api/wallet/{address}/balance

# 更新所有钱包余额
POST /api/wallet/update-balances

# 获取钱包统计
GET /api/wallet/stats/summary
\`\`\`

### 领水功能

\`\`\`http
# 单个钱包领水
POST /api/faucet/request/{address}

# 批量领水
POST /api/faucet/batch
Content-Type: application/json
{
  "addresses": ["address1", "address2", ...]
}

# 所有钱包领水
POST /api/faucet/request-all

# 获取领水统计
GET /api/faucet/stats

# 获取队列状态
GET /api/faucet/queue/status

# 清空队列
DELETE /api/faucet/queue

# 检查是否可以领水
GET /api/faucet/can-request/{address}
\`\`\`

## 使用示例

### 1. 生成钱包并领水

\`\`\`bash
# 1. 生成10个钱包
curl -X POST http://localhost:3000/api/wallet/generate \\
  -H "Content-Type: application/json" \\
  -d '{"count": 10}'

# 2. 为所有钱包申请领水
curl -X POST http://localhost:3000/api/faucet/request-all

# 3. 查看领水统计
curl http://localhost:3000/api/faucet/stats
\`\`\`

### 2. 监控和管理

\`\`\`bash
# 查看钱包统计
curl http://localhost:3000/api/wallet/stats/summary

# 查看队列状态
curl http://localhost:3000/api/faucet/queue/status

# 更新所有钱包余额
curl -X POST http://localhost:3000/api/wallet/update-balances
\`\`\`

## 频率控制

系统严格遵循 Solayer 官方限制：

- **最大频率**: 每10秒最多10个请求
- **请求间隔**: 1000ms（可配置）
- **智能队列**: 自动管理请求排队
- **失败重试**: 最多重试3次

## 安全特性

- **私钥加密**: 使用 AES-256-CBC 加密存储
- **本地存储**: 私钥仅存储在本地
- **访问控制**: API 接口访问限制
- **错误处理**: 完善的异常处理机制

## 目录结构

\`\`\`
src/
├── config/           # 配置文件
├── wallet/          # 钱包管理模块
│   ├── wallet.service.ts
│   ├── wallet.controller.ts
│   └── wallet.module.ts
├── faucet/          # 领水模块
│   ├── faucet.service.ts
│   ├── faucet.controller.ts
│   └── faucet.module.ts
├── common/          # 公共模块
│   ├── interfaces/  # 接口定义
│   ├── dto/        # 数据传输对象
│   └── utils/      # 工具函数
├── app.module.ts    # 主模块
└── main.ts         # 应用入口
\`\`\`

## 开发计划

- [ ] 添加 Web 管理界面
- [ ] 实现自动 Swap 功能
- [ ] 添加价格监控和套利策略
- [ ] 支持多种 DEX
- [ ] 添加数据库支持
- [ ] 实现集群部署

## 注意事项

1. **测试网络**: 目前仅支持 Solana 开发网
2. **API 限制**: 严格遵循官方 API 频率限制
3. **安全提醒**: 请妥善保管钱包文件和加密密钥
4. **风险提示**: 仅用于开发和测试，请勿用于主网

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！ 