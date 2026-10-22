import mysql from 'mysql2/promise'
import 'dotenv/config'

export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: +(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
}

export const pool = mysql.createPool({
  ...dbConfig, database: process.env.DB_NAME || 'clickit',
  waitForConnections: true, connectionLimit: 10, charset: 'utf8mb4',
})

// run fn(conn) inside a transaction
export async function tx(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const out = await fn(conn)
    await conn.commit()
    return out
  } catch (e) { await conn.rollback(); throw e } finally { conn.release() }
}
