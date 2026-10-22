// Builds the role-scoped snapshot the frontend polls (same shape the UI already uses)
import { pool } from './db.js'
import { hasMenu } from './auth.js'

const staffOut = (s) => ({ id: s.id, name: s.name, phone: s.phone, email: s.email, city: s.city, area: s.area, status: s.status, online: !!s.online, createdAt: s.created_at })
const adminOut = (a) => ({ id: a.id, name: a.name, email: a.email, role: a.role, menus: a.menus, perms: a.perms, cities: a.cities })

async function cities() {
  const [cs] = await pool.query('SELECT * FROM cities ORDER BY enabled DESC, id')
  const [as] = await pool.query('SELECT city_id, name FROM areas ORDER BY name')
  return cs.map((c) => ({ id: c.id, name: c.name, enabled: !!c.enabled, image: c.image, areas: as.filter((a) => a.city_id === c.id).map((a) => a.name) }))
}
const services = async (all) => {
  const [r] = await pool.query(`SELECT * FROM services ${all ? '' : 'WHERE active = 1'} ORDER BY id`)
  return r.map((s) => ({ id: s.id, name: s.name, icon: s.icon, desc: s.descr, image: s.image, price: s.price, mins: s.mins, active: !!s.active }))
}

async function bookings(where, params) {
  const [rows] = await pool.query(
    `SELECT b.*, c.name AS customer_name, c.phone AS customer_phone FROM bookings b JOIN customers c ON c.id = b.customer_id ${where} ORDER BY b.created_at DESC LIMIT 500`, params)
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const [photos] = await pool.query('SELECT booking_id, kind, url FROM booking_photos WHERE booking_id IN (?) ORDER BY id', [ids])
  const [declines] = await pool.query('SELECT booking_id, staff_id FROM booking_declines WHERE booking_id IN (?)', [ids])
  return rows.map((b) => ({
    id: b.id, customerId: b.customer_id, customerName: b.customer_name, customerPhone: b.customer_phone, staffId: b.staff_id,
    serviceId: b.service_id, serviceName: b.service_name, icon: b.icon, mins: b.mins, price: b.price,
    city: b.city, area: b.area, address: b.address, status: b.status, delay: b.delay_reason, rated: !!b.rated, settled: !!b.settled,
    createdAt: b.created_at, acceptedAt: b.accepted_at, etaMins: b.eta_mins, completedAt: b.completed_at,
    paymentStatus: b.payment_status, paymentMethod: b.payment_method, upiRef: b.upi_ref, paidAt: b.paid_at,
    before: photos.filter((p) => p.booking_id === b.id && p.kind === 'before').map((p) => p.url),
    after: photos.filter((p) => p.booking_id === b.id && p.kind === 'after').map((p) => p.url),
    declinedBy: declines.filter((d) => d.booking_id === b.id).map((d) => d.staff_id),
  }))
}

const feedback = async (where, params) => {
  const [r] = await pool.query(
    `SELECT f.*, c.name AS customer_name FROM feedback f JOIN customers c ON c.id = f.customer_id ${where} ORDER BY f.created_at DESC LIMIT 300`, params)
  return r.map((f) => ({ id: f.id, bookingId: f.booking_id, staffId: f.staff_id, customerId: f.customer_id, customerName: f.customer_name, rating: f.rating, comment: f.comment, createdAt: f.created_at }))
}
const settlements = async (where, params) => {
  const [r] = await pool.query(`SELECT * FROM settlements ${where} ORDER BY created_at DESC, id DESC LIMIT 300`, params)
  return r.map((s) => ({ id: 'S' + s.id, staffId: s.staff_id, jobs: s.jobs, gross: s.gross, payout: s.payout, status: s.status, createdAt: s.created_at }))
}

// stored notifications for the logged-in role (admins share the ones with no recipient)
async function notifications(role, id) {
  const [r] = role === 'admin'
    ? await pool.query("SELECT * FROM notifications WHERE role = 'admin' AND recipient_id IS NULL ORDER BY id DESC LIMIT 60")
    : await pool.query('SELECT * FROM notifications WHERE role = ? AND recipient_id = ? ORDER BY id DESC LIMIT 60', [role, id])
  return r.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, ref: n.ref, read: !!n.is_read, createdAt: n.created_at }))
}

export async function buildState(auth) {
  const s = await buildRoleState(auth)
  return auth ? { ...s, notifications: await notifications(auth.role, auth.row.id) } : { ...s, notifications: [] }
}

async function buildRoleState(auth) {
  const empty = { admins: [], staff: [], customers: [], bookings: [], feedback: [], settlements: [] }
  if (!auth) return { ...empty, cities: await cities(), services: await services(false) }
  const { role, row } = auth

  if (role === 'user') return { ...empty, cities: await cities(), services: await services(false),
    bookings: await bookings('WHERE b.customer_id = ?', [row.id]), feedback: await feedback('WHERE f.customer_id = ?', [row.id]) }

  if (role === 'staff') return { ...empty, cities: await cities(), services: await services(false), staff: [staffOut(row)],
    // own jobs plus open requests in the staff member's city (drives the popup)
    bookings: row.status === 'approved' ? await bookings("WHERE b.staff_id = ? OR (b.status = 'requested' AND b.city = ?)", [row.id, row.city]) : [],
    settlements: await settlements('WHERE staff_id = ?', [row.id]), feedback: await feedback('WHERE f.staff_id = ?', [row.id]) }

  // admin: restricted admins only see their own cities
  const all = row.cities.includes('*')
  const scope = (col) => (all ? ['', []] : row.cities.length ? [`WHERE ${col} IN (?)`, [row.cities]] : ['WHERE 1 = 0', []])
  const [sw, sp] = scope('city'); const [bw, bp] = scope('b.city')
  const [staff] = await pool.query(`SELECT * FROM staff ${sw} ORDER BY created_at DESC`, sp)
  const [admins] = await pool.query('SELECT * FROM admins ORDER BY id')
  const ids = staff.map((s) => s.id)
  const [custs] = hasMenu(row, 'customers') ? await pool.query(
    'SELECT c.id, c.name, c.phone, c.created_at, (SELECT COUNT(*) FROM bookings b WHERE b.customer_id = c.id) AS bookings FROM customers c ORDER BY c.created_at DESC LIMIT 500') : [[]]
  return { ...empty, admins: row.role === 'Superadmin' ? admins.map(adminOut) : [adminOut(row)], cities: await cities(), services: await services(true), staff: staff.map(staffOut),
    customers: custs.map((c) => ({ id: c.id, name: c.name, phone: c.phone, createdAt: c.created_at, bookings: c.bookings })),
    bookings: await bookings(bw, bp),
    settlements: !hasMenu(row, 'settlements') ? [] : all ? await settlements('', []) : ids.length ? await settlements('WHERE staff_id IN (?)', [ids]) : [],
    feedback: !hasMenu(row, 'feedback') ? [] : all ? await feedback('', []) : ids.length ? await feedback('WHERE f.staff_id IN (?)', [ids]) : [] }
}
