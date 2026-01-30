# ExcelProcessor 使用指南

## 概述

`ExcelProcessor` 类用于读取和验证 Excel 文件中的船运任务数据。它会：
1. 读取 Excel 文件中的 `WorkingShips` 工作表
2. 过滤出 OI 为空且有日期的行
3. 验证所有必填字段
4. 检查数据的业务逻辑（类型、日期、港口、销售等）

## 快速开始

### 1. 基本用法

```typescript
import { ExcelProcessor } from './utils/ExcelProcessor';
import Database from 'better-sqlite3';

// 初始化数据库
const db = new Database('path/to/database.db');

// 创建处理器实例
const processor = new ExcelProcessor(db);

// 读取 Excel 文件
const tasks = await processor.getList('path/to/excel.xlsx');

// 处理数据
tasks.forEach(task => {
    console.log(task.MBL, task.HBL, task.Type);
});

// 关闭数据库
db.close();
```

### 2. 在 Playwright 测试中使用

```typescript
import { test } from '@playwright/test';
import { ExcelProcessor } from '../utils/ExcelProcessor';
import Database from 'better-sqlite3';

test('process Excel and automate form filling', async ({ page }) => {
    // 初始化处理器
    const db = new Database('./database.db');
    const processor = new ExcelProcessor(db);
    
    // 读取任务
    const tasks = await processor.getList('./data/WorkingShips.xlsx');
    
    // 对每个任务执行自动化操作
    for (const task of tasks) {
        await page.goto('https://your-system.com');
        
        // 填写表单
        await page.fill('#mbl', task.MBL);
        await page.fill('#hbl', task.HBL);
        await page.selectOption('#type', task.Type);
        // ... 更多表单字段
        
        await page.click('#submit');
        await page.waitForNavigation();
    }
    
    db.close();
});
```

## API 文档

### 构造函数

```typescript
constructor(db: Database)
```

- **参数**: `db` - better-sqlite3 数据库实例
- **用途**: 用于验证港口、码头、销售人员等数据

### getList 方法

```typescript
async getList(filePath: string): Promise<TaskRow[]>
```

- **参数**: `filePath` - Excel 文件的完整路径
- **返回**: 通过验证的任务行数组
- **抛出**: 如果数据验证失败，会抛出包含所有错误的异常

### TaskRow 接口

```typescript
interface TaskRow {
    lineIndex: number;      // Excel 中的行号
    Data: Date | string;    // 日期
    OI?: string;           // OI 编号
    Type: string;          // 运输类型 (CIF/FOB/DDP/DDU)
    MBL: string;           // 主提单号
    HBL: string;           // 分提单号
    ContainerNu: string;   // 集装箱号
    ETA: Date | string;    // 预计到达时间
    POL: string;           // 起运港
    POD: string;           // 目的港
    FinalDes: string;      // 最终目的地
    Terminal: string;      // 码头
    TrainSta: string;      // 火车站
    Sale: string;          // 销售人员
    Vessel: string;        // 船名
    Voyage: string;        // 航次
    Remarks: string;       // 备注
    Description: string;   // 货物描述
    Marks: string;         // 唛头
}
```

## 数据验证规则

ExcelProcessor 会自动验证以下内容：

1. **运输类型**: 必须是 CIF、FOB、DDP 或 DDU
2. **ETA 日期**: 不能早于当前日期
3. **港口代码**: POL 和 POD 必须在数据库中存在
4. **最终目的地**: 如果不是 `?`/`？`/`|`，必须在数据库中存在
5. **码头**: 如果不是 `?`/`？`/`|`，必须在数据库中存在
6. **销售人员**: 必须在数据库中存在
7. **集装箱信息**: Remarks 中的集装箱号必须与 ContainerNu 字段一致

## 运行示例

### 运行独立示例
```bash
cd ts-automation
npx ts-node examples/use-excel-processor.ts
```

### 运行测试
```bash
cd ts-automation
npx playwright test excel-processor.spec.ts
```

## 数据库要求

ExcelProcessor 需要以下数据库表：

- `cy_locations` - 港口信息表（字段：cy_code, TP_ID）
- `terminals` - 码头信息表（字段：firms_code, TP_ID）
- `sales` - 销售人员表（字段：sales_name, sale_id）

## 错误处理

```typescript
try {
    const tasks = await processor.getList('file.xlsx');
    // 处理任务
} catch (error) {
    if (error instanceof Error) {
        // 错误消息会包含所有验证失败的详细信息
        console.error('验证失败:', error.message);
    }
}
```

## 注意事项

1. Excel 文件必须包含名为 `WorkingShips` 的工作表
2. 第一行必须是标题行
3. 只有 OI 为空且有日期的行才会被处理
4. 所有必填字段必须有值
5. 数据库连接必须在使用前建立，使用后关闭
