import { Router } from 'express'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { pool } from '../db.js'
import { need, h, HttpError } from '../auth.js'
import { notify, inr } from '../notify.js'

import { imageUpload as upload, UPLOAD_DIR } from '../upload.js'
export { UPLOAD_DIR }

const r = Router()
r.use(need('staff'))
// pending/rejected staff may only log in and see their status
r.use((req, _res, next) => (req.me.status === 'approved' ? next() : next(new HttpError(403, 'Your registration is not approved yet'))))

async function myJob(req) {
  const [[b]] = await pool.query('SELECT * FROM bookings WHERE id = ? AND staff_id = ?', [req.params.id, req.me.id])
  if (!b) throw new HttpError(404, 'Job not found')
  return b
}
const photoCount = async (id, kind) => (await pool.query('SELECT COUNT(*) AS n FROM booking_photos WHERE booking_id=? AND kind=?', [id, kind]))[0][0].n
// before photos while accepted/in progress, after photos only while in progress
const kindAllowed = (b, kind) => (kind === 'before' ? ['accepted', 'in_progress'] : ['in_progress']).includes(b.status)

r.post('/online', h(async (req, res) => {
  await pool.query('UPDATE staff SET online = ? WHERE id = ?', [req.body.online ? 1 : 0, req.me.id]); res.json({ ok: true })
}))

r.post('/bookings/:id/accept', h(async (req, res) => {
  // atomic: only one staff member can win the request
  const eta = +req.body.eta === 15 ? 15 : 10 // the Expert promises to reach the customer in 10 or 15 minutes
  const [u] = await pool.query("UPDATE bookings SET status='accepted', staff_id=?, accepted_at=NOW(), eta_mins=? WHERE id=? AND status='requested' AND city=?", [req.me.id, eta, req.params.id, req.me.city])
  if (!u.affectedRows) throw new HttpError(409, 'Already taken by someone else')
  const [[b]] = await pool.query('SELECT * FROM bookings WHERE id = ?', [req.params.id])
  await notify([
    { role: 'user', to: b.customer_id, type: 'booking', title: 'Booking accepted', body: `${req.me.name} accepted your ${b.service_name} (#${b.id}) and will reach you in ${eta} min.`, ref: b.id },
    { role: 'admin', type: 'booking', title: 'Booking accepted', body: `${req.me.name} accepted #${b.id} (${b.service_name}, ${b.city}), arriving in ${eta} min.`, ref: b.id },
  ])
  res.json({ ok: true })
}))

r.post('/bookings/:id/decline', h(async (req, res) => {
  await pool.query('INSERT IGNORE INTO booking_declines (booking_id, staff_id) VALUES (?, ?)', [req.params.id, req.me.id])
  res.json({ ok: true })
}))

r.post('/bookings/:id/photos/:kind', upload.single('photo'), h(async (req, res) => {
  const { kind } = req.params
  try {
    if (!['before', 'after'].includes(kind)) throw new HttpError(400, 'Invalid photo type')
    if (!req.file) throw new HttpError(400, 'No photo received')
    const b = await myJob(req)
    if (!kindAllowed(b, kind)) throw new HttpError(409, `Cannot upload ${kind} photos at this stage`)
    if ((await photoCount(b.id, kind)) >= 6) throw new HttpError(400, 'Maximum 6 photos')
  } catch (e) { if (req.file) fs.unlink(req.file.path, () => {}); throw e }
  await pool.query('INSERT INTO booking_photos (booking_id, kind, url) VALUES (?,?,?)', [req.params.id, kind, '/uploads/' + req.file.filename])
  res.json({ ok: true })
}))

r.delete('/bookings/:id/photos', h(async (req, res) => {
  const b = await myJob(req)
  const [[p]] = await pool.query('SELECT * FROM booking_photos WHERE booking_id=? AND url=?', [b.id, String(req.query.url)])
  if (!p) throw new HttpError(404, 'Photo not found')
  if (!kindAllowed(b, p.kind)) throw new HttpError(409, 'Photos are locked')
  await pool.query('DELETE FROM booking_photos WHERE id = ?', [p.id])
  fs.unlink(path.join(UPLOAD_DIR, path.basename(p.url)), () => {})
  res.json({ ok: true })
}))

r.post('/bookings/:id/start', h(async (req, res) => {
  const b = await myJob(req)
  if (b.status !== 'accepted') throw new HttpError(409, 'Job cannot be started')
  if (!(await photoCount(b.id, 'before'))) throw new HttpError(400, 'Upload a before photo first')
  await pool.query("UPDATE bookings SET status='in_progress', started_at=NOW() WHERE id=?", [b.id])
  await notify({ role: 'user', to: b.customer_id, type: 'booking', title: 'Your job has started', body: `${req.me.name} started ${b.service_name} (#${b.id}). Before photos are uploaded.`, ref: b.id })
  res.json({ ok: true })
}))

r.post('/bookings/:id/complete', h(async (req, res) => {
  const b = await myJob(req)
  if (b.status !== 'in_progress') throw new HttpError(409, 'Job is not in progress')
  if (!(await photoCount(b.id, 'after'))) throw new HttpError(400, 'Upload an after photo first')
  await pool.query("UPDATE bookings SET status='completed', completed_at=NOW() WHERE id=?", [b.id])
  await notify([
    { role: 'user', to: b.customer_id, type: 'payment', title: `Job completed. Please pay ${inr(b.price)}`, body: `${b.service_name} (#${b.id}) is done. Choose cash or UPI in My bookings.`, ref: b.id },
    { role: 'admin', type: 'booking', title: 'Job completed', body: `${req.me.name} completed #${b.id} (${b.service_name}). Waiting for payment.`, ref: b.id },
  ])
  res.json({ ok: true })
}))

r.post('/bookings/:id/delay', h(async (req, res) => {
  const b = await myJob(req)
  const reason = String(req.body.reason || '').trim().slice(0, 255) || null
  await pool.query('UPDATE bookings SET delay_reason=? WHERE id=?', [reason, b.id])
  if (reason) await notify([
    { role: 'user', to: b.customer_id, type: 'booking', title: 'Your Expert is running late', body: `#${b.id}: ${reason}`, ref: b.id },
    { role: 'admin', type: 'booking', title: 'Delay reported', body: `${req.me.name} reported a delay on #${b.id}: ${reason}`, ref: b.id },
  ])
  res.json({ ok: true })
}))

export default r
