import { test, expect } from '@playwright/test';
import { ExcelProcessor } from '../utils/ExcelProcessor';
import Database from 'better-sqlite3';
import path from 'path';

test.describe('Excel Processor Tests', () => {
    let db: Database.Database;
    let processor: ExcelProcessor;

    // 在所有测试之前初始化数据库
    test.beforeAll(() => {
        // 根据你的实际数据库路径调整
        const dbPath = path.join(__dirname, '../../.db');
        db = new Database(dbPath);
        processor = new ExcelProcessor(db);
    });

    // 在所有测试之后关闭数据库
    test.afterAll(() => {
        if (db) {
            db.close();
        }
    });

    test('should read and process Excel file', async () => {
        // 设置 Excel 文件路径（根据实际情况调整）
        const excelPath = path.join(__dirname, '../../test.xlsx');
        
        try {
            // 调用 getList 方法读取 Excel
            const taskRows = await processor.getList(excelPath);
            
            // 验证结果
            console.log(`处理了 ${taskRows.length} 行数据`);
            expect(taskRows).toBeDefined();
            expect(Array.isArray(taskRows)).toBeTruthy();
            
            // 检查每一行的数据结构
            if (taskRows.length > 0) {
                const firstRow = taskRows[0];
                expect(firstRow).toHaveProperty('lineIndex');
                expect(firstRow).toHaveProperty('Type');
                expect(firstRow).toHaveProperty('MBL');
                expect(firstRow).toHaveProperty('HBL');
                
                console.log('第一行数据示例:', {
                    line: firstRow.lineIndex,
                    type: firstRow.Type,
                    mbl: firstRow.MBL,
                    eta: firstRow.ETA
                });
            }
        } catch (error) {
            console.error('处理 Excel 时出错:', error);
            throw error;
        }
    });

    test('should filter rows with empty OI and valid Date', async () => {
        const excelPath = path.join(__dirname, '../../test.xlsx');
        const taskRows = await processor.getList(excelPath);
        
        // 验证所有返回的行都应该满足过滤条件
        for (const row of taskRows) {
            // OI 应该为空
            expect(!row.OI || row.OI.toString().trim() === '').toBeTruthy();
            // Date 应该存在
            expect(row.Date).toBeDefined();
        }
    });

    test('should validate all required fields', async () => {
        const excelPath = path.join(__dirname, '../../test.xlsx');
        const taskRows = await processor.getList(excelPath);
        
        const requiredFields = [
            'Type', 'MBL', 'HBL', 'ContainerNu', 'ETA', 'POL', 'POD', 
            'FinalDes', 'Terminal', 'TrainSta', 'Vessel', 'Voyage', 
            'Remarks', 'Description', 'Marks'
        ];
        
        for (const row of taskRows) {
            for (const field of requiredFields) {
                expect(row[field]).toBeDefined();
                expect(row[field].toString().trim()).not.toBe('');
            }
        }
    });
});
