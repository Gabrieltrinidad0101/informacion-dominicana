import { createClient } from '@libsql/client';

let db = null

export const handle = async (c) => {
  try {
    db ??= createClient({
      url: c.env.DATABASE_URL,
      authToken: c.env.DATABASE_AUTH_TOKEN,
    })
    const result = await db.execute('SELECT * FROM employees');
    return c.json(result.rows);
  } catch (err) {
    console.error('Error querying employees:', err);
    return c.text('Failed to fetch employees', 500);
  }
};
