// Runs database/clickit.sql against MySQL (drops & recreates the clickit database)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'
import { dbConfig } from './db.js'

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../database/clickit.sql')
const conn = await mysql.createConnection({ ...dbConfig, multipleStatements: true, charset: 'utf8mb4' })
await conn.query(fs.readFileSync(file, 'utf8'))
await conn.end()
console.log('Database "clickit" created and seeded from database/clickit.sql')
