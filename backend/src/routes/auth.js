import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool } from '../db.js'
import { sign, h, HttpError } from '../auth.js'
import { notify } from '../notify.js'

const r = Router()
const str = (v, max = 100) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const need = (...vals) => { if (vals.some((v) => !v)) throw new HttpError(400, 'Please fill all fields') }
const publicUser = (u) => ({ id: u.id, name: u.name, phone: u.phone })

// small in-memory throttle: 10 failed logins / 10 min / ip+identity
const fails = new Map()
const throttle = (key) => { const f = fails.get(key); if (f && f.n >= 10 && Date.now() - f.t < 600000) throw new HttpError(429, 'Too many attempts, try again later') }
const failed = (key) => { const f = fails.get(key); fails.set(key, { n: f && Date.now() - f.t < 600000 ? f.n + 1 : 1, t: Date.now() }) }

async function login(req, table, field, role, out) {
  const id = str(req.body.id, 150).toLowerCase(), password = str(req.body.password, 200)
  need(id, password)
  const key = req.ip + id; throttle(key)
  const [[row]] = await pool.query(`SELECT * FROM ${table} WHERE ${field} = ?`, [id])
  if (!row || !(await bcrypt.compare(password, row.password_hash))) { failed(key); throw new HttpError(401, `Wrong ${field === 'email' ? 'email' : 'phone'} or password`) }
  fails.delete(key)
  return { token: sign(role, row.id), me: out(row) }
}

r.post('/admin/login', h(async (req, res) => res.json(await login(req, 'admins', 'email', 'admin', (a) => ({ id: a.id })))))
r.post('/staff/login', h(async (req, res) => res.json(await login(req, 'staff', 'email', 'staff', (s) => ({ id: s.id })))))
r.post('/user/login', h(async (req, res) => res.json(await login(req, 'customers', 'phone', 'user', publicUser))))

r.post('/user/signup', h(async (req, res) => {
  const name = str(req.body.name), phone = str(req.body.phone, 20), password = str(req.body.password, 200)
  need(name, phone, password)
  if (!/^\d{10}$/.test(phone)) throw new HttpError(400, 'Enter a 10 digit phone number')
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  const [[dup]] = await pool.query('SELECT id FROM customers WHERE phone = ?', [phone])
  if (dup) throw new HttpError(409, 'Phone already registered')
  const [ins] = await pool.query('INSERT INTO customers (name, phone, password_hash) VALUES (?, ?, ?)', [name, phone, await bcrypt.hash(password, 10)])
  res.json({ token: sign('user', ins.insertId), me: { id: ins.insertId, name, phone } })
}))

r.post('/staff/register', h(async (req, res) => {
  const name = str(req.body.name), phone = str(req.body.phone, 20), email = str(req.body.email, 150).toLowerCase()
  const password = str(req.body.password, 200), city = str(req.body.city, 80), area = str(req.body.area)
  need(name, phone, email, password, city, area)
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  const [[c]] = await pool.query('SELECT id FROM cities WHERE name = ? AND enabled = 1', [city])
  if (!c) throw new HttpError(400, 'We are not hiring in that city yet')
  const [[dup]] = await pool.query('SELECT id FROM staff WHERE email = ?', [email])
  if (dup) throw new HttpError(409, 'Email already registered')
  await pool.query('INSERT INTO staff (name, phone, email, password_hash, city, area) VALUES (?, ?, ?, ?, ?, ?)', [name, phone, email, await bcrypt.hash(password, 10), city, area])
  await notify({ role: 'admin', type: 'staff', title: 'New staff registration', body: `${name} (${city}, ${area}) is waiting for approval.` })
  res.json({ ok: true })
}))

export default r
