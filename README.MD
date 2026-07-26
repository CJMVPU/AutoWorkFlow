INTERNAL_EFFICIENCY_TOOLS/
├── package.json
├── tsconfig.json
├── .gitignore
├── .auth.json                               // Playwright 的 Cookies 和 Session 缓存状态
├── assets/                                  // 静态资源与持久化数据
│   ├── .db                                  // SQLite 数据库文件
│   └── .key                                 // 密码解密密钥 (Fernet)
├── src/                                     // 源码核心目录 (未来 Electron 的主进程代码)
│   ├── main.ts                              // 程序的总入口，负责组装各个模块
│   ├── types/                               // 核心数据契约 (Interface 定义)
│   │   └── index.ts                         // 存放 ShipmentTask、ITaskDataSource 等接口定义
│   ├── core/                                // 核心业务层
│   │   └── FileMaker.ts                     // 封装 Playwright 自动化逻辑
│   ├── data/                                // 数据源适配器层
│   │   ├── mappingData.ts                   // 原 mapping_data.py，存放硬编码的字典映射
│   │   └── adapters/                        // 针对不同数据源的具体实现
│   │       ├── ExcelDataSource.ts           // 当前处理 XLSX 的实现
│   │       └── ElectronDataSource.ts        // 预留给未来处理 Electron IPC 通信的占位
│   ├── db/                                  // 数据库交互层
│   │   ├── connection.ts                    // better-sqlite3 的连接池/单例封装
│   │   ├── dbInit.ts                        // 原 db_init.py，负责建表和初始数据注入
│   │   └── queries.ts                       // 集中管理业务 SQL 语句（查询 POL、Terminal 等）
│   └── utils/                               // 通用基础工具
│       ├── logger.ts                        // 重写原 log.py，实现终端彩色输出和视觉宽度对齐
│       └── crypto.ts                        // 封装 Fernet 的加密/解密逻辑
└── tests/                                   // 测试脚本
    └── test.ts                              // 原 test.py，用于独立测试 Playwright Cookies