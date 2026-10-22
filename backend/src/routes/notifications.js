import { Router } from 'express'
import { pool } from '../db.js'
import { optional, h, HttpError } from '../auth.js'

const r = Router()
r.use(optional)

// mark notifications as read: { all: true } or { ids: [1, 2] }; each role only touches its own rows
r.post('/read', h(async (req, res) => {
  if (!req.auth) throw new HttpError(401, 'Please log in again')
  const { role, row } = req.auth
  const scope = role === 'admin' ? ['role = ? AND recipient_id IS NULL', [role]] : ['role = ? AND recipient_id = ?', [role, row.id]]
  if (req.body.all) await pool.query(`UPDATE notifications SET is_read = 1 WHERE ${scope[0]}`, scope[1])
  else if (Array.isArray(req.body.ids) && req.body.ids.length) await pool.query(`UPDATE notifications SET is_read = 1 WHERE ${scope[0]} AND id IN (?)`, [...scope[1], req.body.ids.map(Number)])
  res.json({ ok: true })
}))

export default r
