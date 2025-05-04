import { createClient } from '@libsql/client'

const db = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
})

export async function createTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(45) DEFAULT '' NOT NULL,
        sex CHAR(1) DEFAULT '' NOT NULL,
        position VARCHAR(45) DEFAULT '' NOT NULL,
        date VARCHAR(45) DEFAULT '' NOT NULL,
        document VARCHAR(45) DEFAULT '' NOT NULL,
        income INTEGER DEFAULT NULL,
        page INT DEFAULT 0 NOT NULL,
        deparment VARCHAR(45) DEFAULT '' NOT NULL,
        x INTEGER CHECK(x >= 0 AND x <= 2500),
        y INTEGER CHECK(y >= 0 AND y <= 2500),
        width INTEGER CHECK(width >= 0 AND width <= 2500),
        height INTEGER CHECK(height >= 0 AND height <= 2500)
      );

      CREATE INDEX IF NOT EXISTS idx_employees ON employees (
        name,
        sex,
        position,
        document,
        deparment,
        income,
        date
      );
    `)
    console.log('✅ Table "employees" created successfully.')
  } catch (error) {
    console.error('❌ Error creating table:', error)
  }
}
