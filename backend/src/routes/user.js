import { Router } from 'express'
import crypto from 'node:crypto'
import { pool } from '../db.js'
import { need, h, HttpError } from '../auth.js'
import { notify, inr } from '../notify.js'

const r = Router()
r.use(need('user'))

r.post('/bookings', h(async (req, res) => {
  const mult = Math.round(+req.body.mult)
  const city = String(req.body.city || ''), area = String(req.body.area || ''), address = String(req.body.address || '').trim().slice(0, 500)
  if (![1, 2, 3].includes(mult) || !address) throw new HttpError(400, 'Choose a duration and enter your address')
  // price & duration always come from the database, never from the client
  const [[svc]] = await pool.query('SELECT * FROM services WHERE id = ? AND active = 1', [req.body.serviceId])
  if (!svc) throw new HttpError(400, 'Service not available')
  const [[ok]] = await pool.query('SELECT 1 AS ok FROM cities c JOIN areas a ON a.city_id = c.id WHERE c.name = ? AND c.enabled = 1 AND a.name = ?', [city, area])
  if (!ok) throw new HttpError(400, 'We do not serve that area yet')
  const id = 'B' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 7)
  await pool.query('INSERT INTO bookings (id, customer_id, service_id, service_name, icon, mins, price, city, area, address) VALUES (?,?,?,?,?,?,?,?,?,?)',
    [id, req.me.id, svc.id, svc.name, svc.icon, svc.mins * mult, svc.price * mult, city, area, address])
  const [staff] = await pool.query("SELECT id FROM staff WHERE status = 'approved' AND city = ?", [city])
  await notify([
    { role: 'user', to: req.me.id, type: 'booking', title: 'Booking placed', body: `${svc.name} (#${id}). We are finding the nearest Expert in ${city}.`, ref: id },
    { role: 'admin', type: 'booking', title: 'New booking', body: `${req.me.name} booked ${svc.name} in ${area}, ${city} for ${inr(svc.price * mult)}.`, ref: id },
    ...staff.map((s) => ({ role: 'staff', to: s.id, type: 'booking', title: 'New job request', body: `${svc.name} in ${area}, ${city}. You earn about ${inr(Math.round(svc.price * mult * 0.7))}.`, ref: id })),
  ])
  res.json({ id })
}))

r.post('/bookings/:id/cancel', h(async (req, res) => {
  const [[b]] = await pool.query('SELECT * FROM bookings WHERE id=? AND customer_id=?', [req.params.id, req.me.id])
  const [u] = await pool.query("UPDATE bookings SET status='cancelled' WHERE id=? AND customer_id=? AND status IN ('requested','accepted')", [req.params.id, req.me.id])
  if (!u.affectedRows) throw new HttpError(409, 'This booking can no longer be cancelled')
  await notify([
    { role: 'admin', type: 'booking', title: 'Booking cancelled', body: `${req.me.name} cancelled #${b.id} (${b.service_name}).`, ref: b.id },
    b.staff_id && { role: 'staff', to: b.staff_id, type: 'booking', title: 'Job cancelled', body: `${req.me.name} cancelled #${b.id} (${b.service_name}).`, ref: b.id },
  ])
  res.json({ ok: true })
}))

// pay for a completed job: cash (handed to the Expert) or UPI. UPI here records the payment; a real gateway can be plugged in later.
r.post('/bookings/:id/pay', h(async (req, res) => {
  const method = req.body.method
  if (!['cash', 'upi'].includes(method)) throw new HttpError(400, 'Choose cash or UPI')
  const upiId = String(req.body.upiId || '').trim()
  if (method === 'upi' && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) throw new HttpError(400, 'Enter a valid UPI id, for example name@upi')
  const ref = method === 'upi' ? 'UPI' + crypto.randomBytes(5).toString('hex').toUpperCase() : null
  // only the owner, only completed jobs, only once
  const [u] = await pool.query("UPDATE bookings SET payment_status='paid', payment_method=?, upi_ref=?, paid_at=NOW() WHERE id=? AND customer_id=? AND status='completed' AND payment_status='unpaid'",
    [method, ref, req.params.id, req.me.id])
  if (!u.affectedRows) throw new HttpError(409, 'This booking cannot be paid right now')
  const [[b]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id])
  const how = method === 'upi' ? `UPI (${ref})` : 'cash'
  await notify([
    { role: 'user', to: req.me.id, type: 'payment', title: 'Payment successful', body: `You paid ${inr(b.price)} by ${how} for #${b.id}.`, ref: b.id },
    b.staff_id && { role: 'staff', to: b.staff_id, type: 'payment', title: 'Payment received', body: `${req.me.name} paid ${inr(b.price)} by ${how} for #${b.id}. Your share: ${inr(Math.round(b.price * 0.7))}.`, ref: b.id },
    { role: 'admin', type: 'payment', title: 'Payment received', body: `${req.me.name} paid ${inr(b.price)} by ${how} for #${b.id} (${b.service_name}).`, ref: b.id },
  ])
  res.json({ ok: true, ref })
}))

r.post('/feedback', h(async (req, res) => {
  const rating = Math.round(+req.body.rating), comment = String(req.body.comment || '').trim().slice(0, 500) || null
  if (!(rating >= 1 && rating <= 5)) throw new HttpError(400, 'Rating must be 1 to 5')
  const [[b]] = await pool.query("SELECT * FROM bookings WHERE id=? AND customer_id=? AND status='completed' AND rated=0", [req.body.bookingId, req.me.id])
  if (!b) throw new HttpError(400, 'You cannot rate this booking')
  await pool.query('INSERT INTO feedback (booking_id, customer_id, staff_id, rating, comment) VALUES (?,?,?,?,?)', [b.id, req.me.id, b.staff_id, rating, comment])
  await pool.query('UPDATE bookings SET rated = 1 WHERE id = ?', [b.id])
  await notify([
    b.staff_id && { role: 'staff', to: b.staff_id, type: 'feedback', title: `New ${rating} star feedback`, body: `${req.me.name}: ${comment || 'No comment'}`, ref: b.id },
    { role: 'admin', type: 'feedback', title: `New ${rating} star feedback`, body: `${req.me.name} rated #${b.id}: ${comment || 'No comment'}`, ref: b.id },
  ])
  res.json({ ok: true })
}))

export default r
