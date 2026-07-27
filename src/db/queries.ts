import { DBConnection } from './connection';

export function getTerminalTpId(firmsCode: string): string | null {
  const db = DBConnection.getInstance();
  const stmt = db.prepare('SELECT TP_ID FROM terminals WHERE firms_code = ?');
  const result = stmt.get(firmsCode) as { TP_ID: string } | undefined;
  return result ? result.TP_ID : null;
}

export function getCyLocationTpId(cyCode: string): string | null {
  const db = DBConnection.getInstance();
  const stmt = db.prepare('SELECT TP_ID FROM cy_locations WHERE cy_code = ?');
  const result = stmt.get(cyCode) as { TP_ID: string } | undefined;
  return result ? result.TP_ID : null;
}

export function getSaleId(saleName: string): string | null {
  const db = DBConnection.getInstance();
  const stmt = db.prepare('SELECT sale_id FROM sales WHERE sale_name = ?');
  const result = stmt.get(saleName) as { sale_id: string } | undefined;
  return result ? result.sale_id : null;
}
