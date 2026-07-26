// src/db/dbInit.ts
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 设定文件路径：对应你 Google Antigravity 中的目录结构
const dbPath = path.resolve(__dirname, '../../assets/.db');
const terminalJsonPath = path.resolve(__dirname, 'terminal_id.json');
const cyLocationJsonPath = path.resolve(__dirname, 'cy_location_id.json');
const salesJsonPath = path.resolve(__dirname, 'sales_id.json');

// 通用的读取 JSON 并解析为键值对对象的辅助函数
function readJsonData(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(rawData);
    if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
        return parsedData as Record<string, string>;
    }
    return {};
}

export function initDatabase() {
  // 1. 读取三个 JSON 文件
  const terminalData = readJsonData(terminalJsonPath);
  const cyLocationData = readJsonData(cyLocationJsonPath);
  const salesData = readJsonData(salesJsonPath);

  // 2. 连接数据库
  const db = new Database(dbPath);

  try {
    // 3. 创建表结构 (如果不存在)
    db.exec(`
      CREATE TABLE IF NOT EXISTS terminals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firms_code TEXT NOT NULL UNIQUE,
        TP_ID TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cy_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cy_code TEXT NOT NULL UNIQUE,
        TP_ID TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_name TEXT NOT NULL UNIQUE,
        sale_id TEXT NOT NULL
      );
    `);

    // 4. 准备预编译语句 (使用 INSERT OR REPLACE 实现幂等更新)
    const insertTerminal = db.prepare('INSERT OR REPLACE INTO terminals (firms_code, TP_ID) VALUES (?, ?)');
    const insertCyLocation = db.prepare('INSERT OR REPLACE INTO cy_locations (cy_code, TP_ID) VALUES (?, ?)');
    const insertSale = db.prepare('INSERT OR REPLACE INTO sales (sale_name, sale_id) VALUES (?, ?)');

    // 5. 开启事务，批量高效写入
    const insertAllData = db.transaction(() => {
      // Object.entries 会把 {"L738": "TP-002931"} 转换为 ["L738", "TP-002931"] 数组进行遍历
      for (const [code, id] of Object.entries(terminalData)) {
        insertTerminal.run(code, id);
      }
      
      for (const [code, id] of Object.entries(cyLocationData)) {
        insertCyLocation.run(code, id);
      }
      
      for (const [name, id] of Object.entries(salesData)) {
        insertSale.run(name, id);
      }
    });

    // 6. 执行事务
    insertAllData();
    
    console.log("‖\x1b[32mlog\x1b[0m 数据库已成功根据 JSON 文件初始化完成");
    
  } catch (error) {
    console.error("‖\x1b[31merr\x1b[0m 数据库初始化失败:", error);
  } finally {
    db.close();
  }
}

// 允许直接执行该脚本：npx ts-node src/db/dbInit.ts
if (require.main === module) {
  initDatabase();
}