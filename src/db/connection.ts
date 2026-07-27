import Database from 'better-sqlite3';
import * as path from 'path';

// Calculate the path to the DB based on execution context (compiled vs ts-node)
const isDist = __dirname.includes('dist');
const dbPath = isDist
  ? path.resolve(__dirname, '..', '..', '..', 'assets', '.db')
  : path.resolve(__dirname, '..', '..', 'assets', '.db');

export class DBConnection {
  private static instance: Database.Database;

  public static getInstance(): Database.Database {
    if (!DBConnection.instance) {
      // Connect to SQLite DB, creating it if it doesn't exist
      DBConnection.instance = new Database(dbPath);
    }
    return DBConnection.instance;
  }
}
