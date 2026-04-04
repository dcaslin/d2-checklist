import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';

export class Sqlite3Promise {
    private db: Database;

    private constructor(db: Database) {
        this.db = db;
    }

    static async open(path: string): Promise<Sqlite3Promise> {
        const SQL = await initSqlJs();
        const buffer = fs.readFileSync(path);
        const db = new SQL.Database(buffer);
        console.info(`Connected to db ${path}`);
        return new Sqlite3Promise(db);
    }

    public all(query: string): { [key: string]: any }[] {
        const stmt = this.db.prepare(query);
        const rows: { [key: string]: any }[] = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    }

    public close(): void {
        this.db.close();
    }
}
