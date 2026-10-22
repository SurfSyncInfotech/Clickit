import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { pool, tx } from '../db.js'
import { need, h, HttpError, requireCan, requireMenu } from '../auth.js'
import { imageUpload, removeUpload } from '../upload.js'
import { notify, inr } from '../notify.js'

const r = Router()
r.use(need('admin'))

const MENUS = ['dashboard', 'staff', 'customers', 'bookings', 'cities', 'services', 'settlements', 'feedback', 'users']
const PERMS = ['view', 'approve', 'reject', 'edit']
const ROLES = ['Admin', 'Account Manager', 'City Manager', 'Support']
const str = (v, max = 100) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const superOnly = (me) => { if (me.role !== 'Superadmin') throw new HttpError(403, 'Only the super admin can do this') }
const inUse = (e) => e && (e.code === 'ER_ROW_IS_REFERENCED_2' || e.errno === 1451)
const imgOrNull = (v) => { const s = str(v, 255); return s.startsWith('/uploads/') || /^https:\/\//.test(s) ? s : null }
const cleanList = (list, allowed) => (Array.isArray(list) ? list.filter((x) => allowed.includes(x)) : [])

// ---- image upload (used by service / city forms) ----
r.post('/upload', imageUpload.single('image'), h(async (req, res) => {
  if (!req.me || (req.me.role !== 'Superadmin' && !req.me.menus.some((m) => ['services', 'cities'].includes(m)))) {
    if (req.file) removeUpload('/uploads/' + req.file.filename)
    throw new HttpError(403, 'You do not have access to this section')
  }
  if (!req.file) throw new HttpError(400, 'No image received')
  res.json({ url: '/uploads/' + req.file.filename })
}))

// ---- sub-admin users: menus, permissions and cities are the checkboxes the super admin ticks ----
const adminFields = (b) => {
  const name = str(b.name), email = str(b.email, 150).toLowerCase()
  if (!name || !email) throw new HttpError(400, 'Name and email are required')
  if (!ROLES.includes(b.role)) throw new HttpError(400, 'Invalid role')
  const menus = cleanList(b.menus, MENUS.filter((m) => m !== 'users'))
  if (!menus.length) throw new HttpError(400, 'Tick at least one menu')
  const perms = cleanList(b.perms, PERMS)
  const cities = Array.isArray(b.cities) ? b.cities.map((c) => str(c, 80)).filter(Boolean) : []
  return { name, email, role: b.role, menus, perms, cities: cities.length ? cities : ['*'] }
}

r.post('/admins', h(async (req, res) => {
  superOnly(req.me)
  const f = adminFields(req.body), password = str(req.body.password, 200)
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  const [[dup]] = await pool.query('SELECT id FROM admins WHERE email = ?', [f.email])
  if (dup) throw new HttpError(409, 'Email already used')
  await pool.query('INSERT INTO admins (name, email, password_hash, role, menus, perms, cities) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [f.name, f.email, await bcrypt.hash(password, 10), f.role, JSON.stringify(f.menus), JSON.stringify(f.perms), JSON.stringify(f.cities)])
  res.json({ ok: true })
}))

r.patch('/admins/:id', h(async (req, res) => {
  superOnly(req.me)
  const [[a]] = await pool.query("SELECT * FROM admins WHERE id = ? AND role <> 'Superadmin'", [req.params.id])
  if (!a) throw new HttpError(404, 'User not found')
  const f = adminFields(req.body), password = str(req.body.password, 200)
  const [[dup]] = await pool.query('SELECT id FROM admins WHERE email = ? AND id <> ?', [f.email, a.id])
  if (dup) throw new HttpError(409, 'Email already used')
  if (password && password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  await pool.query('UPDATE admins SET name=?, email=?, role=?, menus=?, perms=?, cities=?' + (password ? ', password_hash=?' : '') + ' WHERE id=?',
    [f.name, f.email, f.role, JSON.stringify(f.menus), JSON.stringify(f.perms), JSON.stringify(f.cities), ...(password ? [await bcrypt.hash(password, 10)] : []), a.id])
  res.json({ ok: true })
}))

r.delete('/admins/:id', h(async (req, res) => {
  superOnly(req.me)
  await pool.query("DELETE FROM admins WHERE id = ? AND role <> 'Superadmin'", [req.params.id])
  res.json({ ok: true })
}))

// ---- staff: create, edit, delete, approve / reject ----
const staffFields = async (b, id) => {
  const name = str(b.name), phone = str(b.phone, 20), email = str(b.email, 150).toLowerCase(), city = str(b.city, 80), area = str(b.area)
  if (!name || !phone || !email || !city || !area) throw new HttpError(400, 'Please fill all fields')
  const [[c]] = await pool.query('SELECT id FROM cities WHERE name = ?', [city])
  if (!c) throw new HttpError(400, 'Unknown city')
  const [[dup]] = await pool.query('SELECT id FROM staff WHERE email = ? AND id <> ?', [email, id || 0])
  if (dup) throw new HttpError(409, 'Email already registered')
  return { name, phone, email, city, area }
}

r.post('/staff', h(async (req, res) => {
  requireMenu(req.me, 'staff')
  const f = await staffFields(req.body), password = str(req.body.password, 200)
  requireCan(req.me, 'edit', f.city)
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  await pool.query("INSERT INTO staff (name, phone, email, password_hash, city, area, status) VALUES (?,?,?,?,?,?,'approved')",
    [f.name, f.phone, f.email, await bcrypt.hash(password, 10), f.city, f.area])
  res.json({ ok: true })
}))

r.patch('/staff/:id', h(async (req, res) => {
  requireMenu(req.me, 'staff')
  const [[s]] = await pool.query('SELECT * FROM staff WHERE id = ?', [req.params.id])
  if (!s) throw new HttpError(404, 'Staff not found')
  requireCan(req.me, 'edit', s.city)
  const f = await staffFields(req.body, s.id), password = str(req.body.password, 200)
  requireCan(req.me, 'edit', f.city)
  if (password && password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  await pool.query('UPDATE staff SET name=?, phone=?, email=?, city=?, area=?' + (password ? ', password_hash=?' : '') + ' WHERE id=?',
    [f.name, f.phone, f.email, f.city, f.area, ...(password ? [await bcrypt.hash(password, 10)] : []), s.id])
  res.json({ ok: true })
}))

r.delete('/staff/:id', h(async (req, res) => {
  requireMenu(req.me, 'staff')
  const [[s]] = await pool.query('SELECT * FROM staff WHERE id = ?', [req.params.id])
  if (!s) throw new HttpError(404, 'Staff not found')
  requireCan(req.me, 'edit', s.city)
  try { await pool.query('DELETE FROM staff WHERE id = ?', [s.id]) }
  catch (e) { if (inUse(e)) throw new HttpError(409, 'This staff member has job history, so they cannot be deleted. Reject them instead.'); throw e }
  res.json({ ok: true })
}))

r.post('/staff/:id/status', h(async (req, res) => {
  requireMenu(req.me, 'staff')
  const { status } = req.body
  if (!['approved', 'rejected'].includes(status)) throw new HttpError(400, 'Invalid status')
  const [[s]] = await pool.query('SELECT * FROM staff WHERE id = ?', [req.params.id])
  if (!s) throw new HttpError(404, 'Staff not found')
  requireCan(req.me, status === 'approved' ? 'approve' : 'reject', s.city)
  await pool.query('UPDATE staff SET status = ?, online = IF(? = "approved", online, 0) WHERE id = ?', [status, status, s.id])
  await notify({ role: 'staff', to: s.id, type: 'staff', title: status === 'approved' ? 'Registration approved' : 'Registration rejected',
    body: status === 'approved' ? 'Welcome to Clickit. Go online to start receiving job requests.' : 'Your registration could not be approved. Contact support for help.' })
  res.json({ ok: true })
}))

// ---- customers ----
const customerFields = async (b, id) => {
  const name = str(b.name), phone = str(b.phone, 20)
  if (!name) throw new HttpError(400, 'Name is required')
  if (!/^\d{10}$/.test(phone)) throw new HttpError(400, 'Enter a 10 digit phone number')
  const [[dup]] = await pool.query('SELECT id FROM customers WHERE phone = ? AND id <> ?', [phone, id || 0])
  if (dup) throw new HttpError(409, 'Phone already registered')
  return { name, phone }
}
r.post('/customers', h(async (req, res) => {
  requireMenu(req.me, 'customers'); requireCan(req.me, 'edit')
  const f = await customerFields(req.body), password = str(req.body.password, 200)
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  await pool.query('INSERT INTO customers (name, phone, password_hash) VALUES (?,?,?)', [f.name, f.phone, await bcrypt.hash(password, 10)])
  res.json({ ok: true })
}))
r.patch('/customers/:id', h(async (req, res) => {
  requireMenu(req.me, 'customers'); requireCan(req.me, 'edit')
  const f = await customerFields(req.body, req.params.id), password = str(req.body.password, 200)
  if (password && password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters')
  await pool.query('UPDATE customers SET name=?, phone=?' + (password ? ', password_hash=?' : '') + ' WHERE id=?', [f.name, f.phone, ...(password ? [await bcrypt.hash(password, 10)] : []), req.params.id])
  res.json({ ok: true })
}))
r.delete('/customers/:id', h(async (req, res) => {
  requireMenu(req.me, 'customers'); requireCan(req.me, 'edit')
  try { await pool.query('DELETE FROM customers WHERE id = ?', [req.params.id]) }
  catch (e) { if (inUse(e)) throw new HttpError(409, 'This customer has bookings, so they cannot be deleted.'); throw e }
  res.json({ ok: true })
}))

// ---- cities (shown on the website) & areas ----
r.post('/cities', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit')
  const name = str(req.body.name, 80); if (!name) throw new HttpError(400, 'City name required')
  const [[dup]] = await pool.query('SELECT id FROM cities WHERE name = ?', [name])
  if (dup) throw new HttpError(409, 'City already exists')
  await pool.query('INSERT INTO cities (name, enabled, image) VALUES (?, 0, ?)', [name, imgOrNull(req.body.image)])
  res.json({ ok: true })
}))
r.patch('/cities/:id', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit')
  const [[c]] = await pool.query('SELECT * FROM cities WHERE id = ?', [req.params.id])
  if (!c) throw new HttpError(404, 'City not found')
  const name = str(req.body.name, 80) || c.name, image = imgOrNull(req.body.image)
  if (name !== c.name) {
    const [[used]] = await pool.query('SELECT (SELECT COUNT(*) FROM staff WHERE city = ?) + (SELECT COUNT(*) FROM bookings WHERE city = ?) AS n', [c.name, c.name])
    if (used.n) throw new HttpError(409, 'This city already has staff or bookings, so it cannot be renamed.')
  }
  await pool.query('UPDATE cities SET name = ?, image = ? WHERE id = ?', [name, image, c.id])
  if (c.image && c.image !== image) removeUpload(c.image)
  res.json({ ok: true })
}))
r.delete('/cities/:id', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit')
  const [[c]] = await pool.query('SELECT * FROM cities WHERE id = ?', [req.params.id])
  if (!c) throw new HttpError(404, 'City not found')
  const [[used]] = await pool.query('SELECT (SELECT COUNT(*) FROM staff WHERE city = ?) + (SELECT COUNT(*) FROM bookings WHERE city = ?) AS n', [c.name, c.name])
  if (used.n) throw new HttpError(409, 'This city has staff or bookings. Disable it instead of deleting.')
  await pool.query('DELETE FROM cities WHERE id = ?', [c.id]); removeUpload(c.image)
  res.json({ ok: true })
}))
r.post('/cities/:id/toggle', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit'); await pool.query('UPDATE cities SET enabled = 1 - enabled WHERE id = ?', [req.params.id]); res.json({ ok: true })
}))
r.post('/cities/:id/areas', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit')
  const name = str(req.body.name); if (!name) throw new HttpError(400, 'Area name required')
  await pool.query('INSERT IGNORE INTO areas (city_id, name) VALUES (?, ?)', [req.params.id, name]); res.json({ ok: true })
}))
r.delete('/cities/:id/areas', h(async (req, res) => {
  requireMenu(req.me, 'cities'); requireCan(req.me, 'edit')
  await pool.query('DELETE FROM areas WHERE city_id = ? AND name = ?', [req.params.id, str(req.query.name)]); res.json({ ok: true })
}))

// ---- services: add / edit / delete with description and image ----
r.post('/services', h(async (req, res) => {
  requireMenu(req.me, 'services'); requireCan(req.me, 'edit')
  const s = req.body, name = str(s.name), icon = str(s.icon, 16) || 'broom', descr = str(s.desc, 255)
  const price = Math.round(+s.price), mins = Math.round(+s.mins), active = s.active === false ? 0 : 1, image = imgOrNull(s.image)
  if (!name || !(price > 0) || !(mins > 0)) throw new HttpError(400, 'Name, price and minutes are required')
  if (s.id) {
    const [[old]] = await pool.query('SELECT image FROM services WHERE id = ?', [s.id])
    await pool.query('UPDATE services SET name=?, icon=?, descr=?, price=?, mins=?, active=?, image=? WHERE id=?', [name, icon, descr, price, mins, active, image, s.id])
    if (old?.image && old.image !== image) removeUpload(old.image)
  } else await pool.query('INSERT INTO services (name, icon, descr, price, mins, active, image) VALUES (?,?,?,?,?,1,?)', [name, icon, descr, price, mins, image])
  res.json({ ok: true })
}))
r.delete('/services/:id', h(async (req, res) => {
  requireMenu(req.me, 'services'); requireCan(req.me, 'edit')
  const [[old]] = await pool.query('SELECT image FROM services WHERE id = ?', [req.params.id])
  try { await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]); removeUpload(old?.image); res.json({ ok: true, deleted: true }) }
  catch (e) {
    if (!inUse(e)) throw e
    // already used by bookings: keep history by hiding it from customers
    await pool.query('UPDATE services SET active = 0 WHERE id = ?', [req.params.id]); res.json({ ok: true, deleted: false })
  }
}))

// ---- manual assignment ----
r.post('/bookings/:id/assign', h(async (req, res) => {
  requireMenu(req.me, 'bookings')
  const [[b]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id])
  if (!b) throw new HttpError(404, 'Booking not found')
  requireCan(req.me, 'edit', b.city)
  const [[s]] = await pool.query("SELECT id FROM staff WHERE id = ? AND status = 'approved' AND city = ?", [req.body.staffId, b.city])
  if (!s) throw new HttpError(400, 'Pick an approved staff member from the same city')
  const [u] = await pool.query("UPDATE bookings SET status='accepted', staff_id=?, accepted_at=NOW(), eta_mins=15 WHERE id=? AND status='requested'", [s.id, b.id])
  if (!u.affectedRows) throw new HttpError(409, 'Booking is no longer open')
  const [[who]] = await pool.query('SELECT name FROM staff WHERE id = ?', [s.id])
  await notify([
    { role: 'staff', to: s.id, type: 'booking', title: 'Job assigned to you', body: `${b.service_name} in ${b.area}, ${b.city} (#${b.id}).`, ref: b.id },
    { role: 'user', to: b.customer_id, type: 'booking', title: 'Expert assigned', body: `${who.name} will do your ${b.service_name} (#${b.id}) and reach you in about 15 min.`, ref: b.id },
  ])
  res.json({ ok: true })
}))

// ---- weekly settlement: pay out all completed, unsettled jobs per staff ----
r.post('/settlements/run', h(async (req, res) => {
  requireMenu(req.me, 'settlements'); requireCan(req.me, 'edit')
  const count = await tx(async (c) => {
    const [[share]] = await c.query("SELECT v FROM settings WHERE k = 'staff_share_percent'")
    const pct = +share.v
    // only jobs the customer has paid for are settled
    const [jobs] = await c.query("SELECT id, staff_id, price FROM bookings WHERE status='completed' AND payment_status='paid' AND settled=0 AND staff_id IS NOT NULL FOR UPDATE")
    const by = {}
    jobs.forEach((j) => (by[j.staff_id] ||= []).push(j))
    for (const [staffId, js] of Object.entries(by)) {
      const gross = js.reduce((t, j) => t + j.price, 0)
      const [ins] = await c.query('INSERT INTO settlements (staff_id, jobs, gross, payout, status) VALUES (?,?,?,?,"paid")', [staffId, js.length, gross, Math.round((gross * pct) / 100)])
      await c.query('INSERT INTO settlement_bookings (settlement_id, booking_id) VALUES ?', [js.map((j) => [ins.insertId, j.id])])
      await c.query('UPDATE bookings SET settled = 1 WHERE id IN (?)', [js.map((j) => j.id)])
      await notify({ role: 'staff', to: +staffId, type: 'settlement', title: 'Weekly payout credited', body: `${inr(Math.round((gross * pct) / 100))} for ${js.length} job${js.length > 1 ? 's' : ''} has been settled.` }, c)
    }
    return Object.keys(by).length
  })
  res.json({ count })
}))

export default r
