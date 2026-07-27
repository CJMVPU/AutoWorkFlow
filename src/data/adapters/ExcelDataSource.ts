import * as xlsx from 'xlsx';
import { ITaskDataSource, ShipmentTask } from '../../types/index';
import { getCyLocationTpId, getTerminalTpId, getSaleId } from '../../db/queries';
import { outputErr, outputMultipleLine, outputSus, outputWarn } from '../../utils/logger';

export class ExcelDataSource implements ITaskDataSource {
  public async getTasks(filePath: string): Promise<ShipmentTask[]> {
    const workbook = xlsx.readFile(filePath);
    const sheetName = 'WorkingShips';
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      throw new Error(`Sheet ${sheetName} not found in the excel file.`);
    }

    // Parse data to JSON
    const data = xlsx.utils.sheet_to_json<ShipmentTask>(worksheet, { defval: null });

    // Filter data based on conditions in pandas script:
    // OI is na (null or empty) and Date is not na
    // and all other required fields are not na
    const workingList = data.filter(row => {
      return (
        (!row.OI || String(row.OI).trim() === '') &&
        row.Date &&
        row.Type &&
        row.Express &&
        row.MBL &&
        row.HBL &&
        row.ContainerNu &&
        row.Fee &&
        row.ETA &&
        row.POL &&
        row.POD &&
        row.FinalDes &&
        row.FclTrk &&
        row.DODate &&
        row.Terminal &&
        row.TrainSta &&
        row.Destination &&
        row.Vessel &&
        row.Voyage &&
        row.Remarks &&
        row.Description &&
        row.Marks
      );
    });

    try {
      this.checkList(workingList);
      const workingListResult = workingList.map((row, index) => {
        // index + 2 to match excel row number (1-indexed header + 1-indexed data)
        const lineIndex = index + 2;
        return `line ${String(lineIndex).padEnd(2, ' ')} : ${row.MBL}`;
      });

      outputMultipleLine(workingListResult, 'log', 'working list summary');
    } catch (e) {
      outputErr(`exiting... error ${e} found in working list`);
      throw e;
    }

    return workingList;
  }

  private checkList(workingList: ShipmentTask[]): void {
    if (workingList.length === 0) {
      outputWarn("working list is empty");
      return;
    }

    outputSus("working list found, proceeding...");
    let errorResult: string[] = [];

    const containerRegexPattern =
      /([A-Z]{4}\d{7})\/([A-Za-z-\d]{6,15})\/(\d{2}[A-Z]{2,3})\/(\d{1,4}(?:CTNS|PKGS|PACKAGES|CARTONS))\/(\d{3,5}[\.]?\d*(?:KG|KGS))\/(\d{1,2}[\.]?\d*(?:CBM))/;

    workingList.forEach((row, idx) => {
      const lineIndex = idx + 2;

      // check shipment type
      if (!['CIF', 'FOB', 'DDP', 'DDU'].includes(row.Type)) {
        errorResult.push(`invalid shipment type at line ${lineIndex}: ${row.Type}`);
      }

      // check eta
      const etaDate = new Date(row.ETA);
      const nowDate = new Date();
      if (!isNaN(etaDate.getTime()) && etaDate < nowDate) {
        errorResult.push(`ETA date passed found at line ${lineIndex}: ${row.ETA}`);
      }

      // POL check
      if (!getCyLocationTpId(row.POL)) {
        errorResult.push(`POL code not found at line ${lineIndex}: ${row.POL}`);
      }

      // POD check
      if (!getCyLocationTpId(row.POD)) {
        errorResult.push(`POD code not found at line ${lineIndex}: ${row.POD}`);
      }

      // final destination check
      if (!["?", "？", "|"].includes(row.FinalDes)) {
        if (!getCyLocationTpId(row.FinalDes)) {
          errorResult.push(`Final Destination code not found at line ${lineIndex}: ${row.FinalDes}`);
        }
      }

      // terminal check
      if (!["?", "？"].includes(row.Terminal)) {
        if (!getTerminalTpId(row.Terminal)) {
          errorResult.push(`Terminal code not found at line ${lineIndex}: ${row.Terminal}`);
        }
      }

      // train station check
      if (!["?", "？", "|"].includes(row.TrainSta)) {
        if (!getTerminalTpId(row.TrainSta)) {
          errorResult.push(`Train Station code not found at line ${lineIndex}: ${row.TrainSta}`);
        }
      }

      // sale check
      if (row.Sale && !getSaleId(row.Sale)) {
        errorResult.push(`Sales name not found at line ${lineIndex}: ${row.Sale}`);
      }

      // check if container num match
      if (row.Remarks && row.Remarks.includes('\n')) {
        const containerInfoList = row.Remarks
          .replace(/ /g, '')
          .replace(/\n/g, '')
          .split(/[,，]/);

        const containerInfoListLineN = row.ContainerNu.split('/');

        containerInfoList.forEach((item, index) => {
          const regexMatch = item.match(containerRegexPattern);
          if (regexMatch) {
            const containerNum = regexMatch[1];
            if (!row.ContainerNu.includes(containerNum)) {
              errorResult.push(`container mismatch ${' '.repeat(20) + (containerInfoListLineN[index] || '')}: ${containerNum}`);
            }
          }
        });
      }
    });

    if (errorResult.length > 0) {
      // deduplicate and sort
      let uniqueErrors = Array.from(new Set(errorResult)).sort();

      // format error
      uniqueErrors = uniqueErrors.map(err => {
        const parts = err.split(':');
        if (parts.length >= 2) {
          const firstPart = parts.shift() || '';
          return `${firstPart.padEnd(50, ' ')} :${parts.join(':')}`;
        }
        return err;
      });

      outputMultipleLine(uniqueErrors, "err", "errors summary");
      throw new Error("Working list validation failed.");
    } else {
      outputSus("working list check passed, no error found");
    }
  }
}
