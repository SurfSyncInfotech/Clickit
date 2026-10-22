import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { pool } from './db.js'

const SECRET = process.env.JWT_SECRET
if (!SECRET || SECRET.length < 8) { console.error('Set JWT_SECRET (8+ chars) in backend/.env'); process.exit(1) }

export const sign = (role, id) => jwt.sign({ role, id }, SECRET, { expiresIn: '7d' })

export class HttpError extends Error { constructor(status, message) { super(message); this.status = status } }
export const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res)).catch(next)

const TABLES = { admin: 'admins', staff: 'staff', user: 'customers' }

async function load(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '')
  if (!m) return null
  try {
    const { role, id } = jwt.verify(m[1], SECRET)
    if (!TABLES[role]) return null
    const [[row]] = await pool.query(`SELECT * FROM ${TABLES[role]} WHERE id = ?`, [id])
    return row ? { role, row } : null
  } catch { return null }
}

// attaches req.auth = { role, row } when a valid token is present, never rejects
export const optional = async (req, _res, next) => { req.auth = await load(req); next() }

// requires a valid token for `role`; row is re-read each request so permission changes apply at once
export const need = (role) => async (req, _res, next) => {
  const a = await load(req)
  if (!a || a.role !== role) return next(new HttpError(401, 'Please log in again'))
  req.auth = a; req.me = a.row; next()
}

// can this admin do `perm` on a record in `city`?
export const can = (admin, perm, city) =>
  admin.role === 'Superadmin' || (admin.perms.includes(perm) && (admin.cities.includes('*') || !city || admin.cities.includes(city)))
// the admin must have the menu ticked (super admin always has all menus)
export const requireMenu = (admin, menu) => {
  if (admin.role !== 'Superadmin' && !admin.menus.includes(menu)) throw new HttpError(403, 'You do not have access to this section')
}
export const hasMenu = (admin, menu) => admin.role === 'Superadmin' || admin.menus.includes(menu)
export const requireCan =(admin, perm, city) => {
  if (!can(admin, perm, city)) throw new HttpError(403, `No ${perm} permission${city ? ' for ' + city : ''}`)
}
