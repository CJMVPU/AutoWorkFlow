import * as fs from 'fs';
import * as path from 'path';
import { DBConnection } from './connection';

export function initializeDatabase() {
  const db = DBConnection.getInstance();

  // Create tables
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

  // Helper to insert data
  const insertData = (
    fileName: string,
    tableName: string,
    col1: string,
    col2: string
  ) => {
    // Check execution context
    const isDist = __dirname.includes('dist');
    const filePath = isDist
      ? path.resolve(__dirname, '..', '..', '..', 'src', 'db', fileName)
      : path.resolve(__dirname, fileName);

    if (!fs.existsSync(filePath)) {
      console.warn(`[WARN] ${fileName} not found. Skipping.`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const stmt = db.prepare(`INSERT OR REPLACE INTO ${tableName} (${col1}, ${col2}) VALUES (?, ?)`);

    const insertMany = db.transaction((entries: any[]) => {
      for (const [key, value] of entries) {
        stmt.run(key, value);
      }
    });

    insertMany(Object.entries(data));
  };

  insertData('terminal_id.json', 'terminals', 'firms_code', 'TP_ID');
  insertData('cy_location_id.json', 'cy_locations', 'cy_code', 'TP_ID');
  insertData('sales_id.json', 'sales', 'sale_name', 'sale_id');

  console.log('Database initialized successfully.');
}

if (process.argv[1] && (process.argv[1].endsWith('dbInit.ts') || process.argv[1].endsWith('dbInit.js'))) {
    initializeDatabase();
}
