/**
 * ExcelProcessor 使用示例
 * 
 * 这个文件展示了如何独立使用 ExcelProcessor 类
 */

import { ExcelProcessor, TaskRow } from '../utils/ExcelProcessor';
import Database from 'better-sqlite3';
import path from 'path';

async function main() {
    // 1. 初始化数据库连接
    const dbPath = path.join(__dirname, '../../database/your-database.db');
    const db = new Database(dbPath);
    
    console.log('数据库连接已建立');
    
    try {
        // 2. 创建 ExcelProcessor 实例
        const processor = new ExcelProcessor(db);
        
        // 3. 指定 Excel 文件路径
        const excelPath = path.join(__dirname, '../../data/WorkingShips.xlsx');
        console.log(`正在读取 Excel 文件: ${excelPath}`);
        
        // 4. 调用 getList 方法读取并处理 Excel
        const taskRows: TaskRow[] = await processor.getList(excelPath);
        
        // 5. 处理返回的数据
        console.log(`\n成功读取 ${taskRows.length} 行有效数据\n`);
        
        // 6. 遍历并处理每一行数据
        taskRows.forEach((row, index) => {
            console.log(`\n--- 任务 ${index + 1} (行 ${row.lineIndex}) ---`);
            console.log(`类型: ${row.Type}`);
            console.log(`MBL: ${row.MBL}`);
            console.log(`HBL: ${row.HBL}`);
            console.log(`集装箱号: ${row.ContainerNu}`);
            console.log(`ETA: ${row.ETA}`);
            console.log(`起运港: ${row.POL} -> 目的港: ${row.POD}`);
            console.log(`最终目的地: ${row.FinalDes}`);
            console.log(`船名: ${row.Vessel} / 航次: ${row.Voyage}`);
            console.log(`销售: ${row.Sale}`);
            
            // 这里可以添加你的业务逻辑
            // 例如：自动化填写表单、上传数据等
        });
        
        // 7. 示例：筛选特定类型的任务
        const cifTasks = taskRows.filter(row => row.Type === 'CIF');
        console.log(`\n找到 ${cifTasks.length} 个 CIF 类型的任务`);
        
        // 8. 示例：按 ETA 排序
        const sortedByETA = [...taskRows].sort((a, b) => {
            const dateA = new Date(a.ETA as string);
            const dateB = new Date(b.ETA as string);
            return dateA.getTime() - dateB.getTime();
        });
        console.log('\n按 ETA 排序后的前 3 个任务:');
        sortedByETA.slice(0, 3).forEach(row => {
            console.log(`- ${row.MBL}: ETA ${row.ETA}`);
        });
        
    } catch (error) {
        console.error('\n处理过程中发生错误:');
        if (error instanceof Error) {
            console.error(error.message);
        } else {
            console.error(error);
        }
        process.exit(1);
    } finally {
        // 9. 关闭数据库连接
        db.close();
        console.log('\n数据库连接已关闭');
    }
}

// 运行主函数
main().catch(console.error);
