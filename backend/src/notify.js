import { pool } from './db.js'

// Store notifications. `to` is the staff / customer id (omit for admins: every admin sees it).
// items: [{ role: 'admin'|'staff'|'user', to?, type, title, body?, ref? }]
export async function notify(items, db = pool) {
  const rows = (Array.isArray(items) ? items : [items]).filter(Boolean)
  if (!rows.length) return
  try {
    await db.query('INSERT INTO notifications (role, recipient_id, type, title, body, ref) VALUES ?',
      [rows.map((n) => [n.role, n.role === 'admin' ? null : n.to ?? null, n.type, String(n.title).slice(0, 120), String(n.body || '').slice(0, 255), n.ref || null])])
  } catch (e) { console.error('notify failed', e.message) } // a failed notification must never break the action itself
}

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
