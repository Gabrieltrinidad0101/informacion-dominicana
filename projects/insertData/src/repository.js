import pgPromise from 'pg-promise';
import fs from 'fs';
import path from 'path';

const pgp = pgPromise();
const db = pgp('postgresql://myuser:mypassword@postgres:5432/informacion-dominicana');


export const insertData = async (payroll)=>{
    try {
      const sqlPath = path.resolve('scripts/insert_payroll.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await db.one(sql, payroll);
    } catch (err) {
      console.error('Error insertando:', err);
    }
}
