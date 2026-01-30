import ExcelJS from 'exceljs';
import { Database } from 'better-sqlite3';

// define an interface for the data structure
export interface TaskRow {
    lineIndex: number; // line index
    Data: Date | string;
    OI?: string;
    Type: string;
    MBL: string;
    HBL: string;
    ContainerNu: string;
    ETA: Date | string;
    POL: string;
    POD: string;
    FinalDes: string;
    Terminal: string;
    TrainSta: string;
    Sale: string;
    Vessel: string;
    Voyage: string;
    Remarks: string;
    Description: string;
    Marks: string;
    [key:string]: any; // allow additional properties
}

export class ExcelProcessor {
    private db: Database;
    // dependency injection of the database instance
    constructor(db: Database) {
        this.db = db;
    }

    async getList(filePath: string): Promise<TaskRow[]> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        // get sheet
        const sheet = workbook.getWorksheet('WorkingShips');
        if (!sheet) throw new Error("sheet 'WorkingShips' not found");
        const rawRows: TaskRow[] = [];
        // read excel titles
        const headers: string[] = [];
        sheet.getRow(1).eachCell((cell, colNumber) => {
            headers[colNumber] = cell.text.trim();
        });
        // read excel rows
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // skip header row
            const rowData: any = { lineIndex: rowNumber };
            row.eachCell((cell, colNumber) => {
                const header = headers[colNumber];
                if (header) {
                    // parse data cells
                    let val = cell.value;
                    if (typeof val === 'object' && val !== null && !(val instanceof Date)) {
                        if ('result' in val) val = (val as any).result;
                        else if ('text' in val) val = (val as any).text;
                    }
                    rowData[header] = val;
                }
            });
            rawRows.push(rowData as TaskRow);
        });
        // first filter columns with OI empty and Date present
        const filteredRows = rawRows.filter(row => {
            const isOIEmpty = !row.OI || row.OI.toString().trim() === '';
            const hasDate = !!row.Date;
            return isOIEmpty && hasDate;
        });
        // then filter out rows that with all information
        const validRows = filteredRows.filter(row => {
            const requiredFields = [
                'Type', 'MBL', 'HBL', 'ContainerNu', 'ETA', 'POL', 'POD', 'FinalDes', 'Terminal', 'TrainSta',
                'Vessel', 'Voyage', 'Remarks', 'Description', 'Marks'
            ];
            return requiredFields.every(field => {
                const val = row[field];
                return val !== undefined && val !== null && val.toString().trim() !== '';
            });
        });
        // finally bussiness logic check
        this.checkList(validRows);
        return validRows;
    }

    private checkList(rows: TaskRow[]) {
        if (rows.length === 0) {
            console.warn("working list is empty");
            return;
        }
        const errors: string[] = [];
        const now = new Date();
        // pre-compilation sql statements
        const stmtCheckPOL = this.db.prepare('SELECT TP_ID FROM cy_locations WHERE cy_code = ?');
        const stmtCheckPOD = this.db.prepare('SELECT TP_ID FROM cy_locations WHERE cy_code = ?');
        const stmtCheckTerminal = this.db.prepare('SELECT TP_ID FROM terminals WHERE firms_code = ?');
        const stmtCheckSale = this.db.prepare('SELECT sale_id FROM sales WHERE sale_name = ?');
        // regex to match container information
        const containerRegex = new RegExp(
            [
                // 1. 集装箱号：4 位大写字母 + 7 位数字
                '(?<container_num>[A-Z]{4}\\d{7})',
                // 2. 封条号：6~15 位，字母/数字/短横线
                '(?<seal_num>[A-Za-z-\\d]{6,15})',
                // 3. 箱型：2 位数字 + 2~3 位大写字母（如 40HQ、20GP）
                '(?<container_type>\\d{2}[A-Z]{2,3})',
                // 4. 件数：1~4 位数字 + CTNS/PKGS/PACKAGES/CARTONS
                '(?<pieces_num>\\d{1,4}(?:CTNS|PKGS|PACKAGES|CARTONS))',
                // 5. 重量：3~5 位数字 + 可选小数 + KG/KGS
                '(?<weight>\\d{3,5}[\\.]?\\d*(?:KG|KGS))',
                // 6. 体积：1~2 位数字 + 可选小数 + CBM
                '(?<cbm>\\d{1,2}[\\.]?\\d*(?:CBM))'
            ].join('\\/'),
        );
        for (const row of rows) {
            const line = row.lineIndex;
            // check type
            if (!['CIF', 'FOB', 'DDP', 'DDU'].includes(row.Type)) {
                errors.push(`Line ${line}: Invalid shipment type '${row.Type}'`);
            }
            // check ETA
            const etaDate = new Date(row.ETA as string);
            if (etaDate < now) {
                errors.push(`Line ${line}: ETA data passed (${row.ETA})`);
            }
            // check POL,POD
            if (!stmtCheckPOL.get(row.POL)) errors.push(`Line ${line}: POL not found '${row.POL}'`);
            if (!stmtCheckPOD.get(row.POD)) errors.push(`Line ${line}: POD not found '${row.POD}'`);
            // check FinalDes
            if (!['?', '？', '|'].includes(row.FinalDes)) {
                if (!stmtCheckPOD.get(row.FinalDes)) errors.push(`Line ${line}: FinalDes not found '${row.FinalDes}'`);
            }
            // check terminal
            if (!['?', '？', '|'].includes(row.Terminal)) {
                if (!stmtCheckTerminal.get(row.Terminal)) errors.push(`Line ${line}: Terminal not found '${row.Terminal}'`);
            }
            // check sale
            if (!stmtCheckSale.get(row.Sale)) errors.push(`Line ${line}: Sale not found '${row.Sale}'`);
            // check container regex
            if (row.Remarks && row.Remarks.includes('\n')) {
                const items = row.Remarks.replace(/ /g, '').replace(/\n/g, '').split(/[,，]/);
                // row container may have multiple containers
                for (const item of items) {
                    const match = item.match(containerRegex);
                    if (match && match.groups) {
                        const num = match.groups.container_num;
                        if (!row.ContainerNu.includes(num)) {
                            errors.push(`Line ${line}: Container mismatch inside Remarks found ${num}, but main column is ${row.ContainerNu}`);
                        }
                    }
                }
            }
        }
        if (errors.length > 0) {
            throw new Error(`Data validation failed:\n${errors.join('\n')}`);
        }
        console.log("working list check passed");
    }
}
