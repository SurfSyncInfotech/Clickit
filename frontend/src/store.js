import { useSyncExternalStore } from 'react'

// API client + polled snapshot. The backend (Express + MySQL) is the source of truth;
// every panel polls /api/state (scoped to the logged-in role) so new requests, approvals and photos show up live.

export const MENUS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'staff', label: 'Staff & Registrations' },
  { key: 'customers', label: 'Customers' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'cities', label: 'Cities & Areas' },
  { key: 'services', label: 'Services' },
  { key: 'settlements', label: 'Settlements' },
  { key: 'feedback', label: 'Feedback' },
  { key: 'users', label: 'Users & Permissions' },
]
export const PERMS = ['view', 'approve', 'reject', 'edit']
export const STAFF_SHARE = 0.7 // display only – the real percentage lives in the DB settings table

const EMPTY = { admins: [], cities: [], services: [], staff: [], customers: [], bookings: [], feedback: [], settlements: [], notifications: [], forRole: null }
let state = EMPTY
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

const pageRole = () => {
  const p = location.pathname
  return p.startsWith('/superadmin') ? 'admin' : p.startsWith('/staff') ? 'staff' : p.startsWith('/user') ? 'user' : null
}

export const session = {
  get: (role) => { try { return JSON.parse(sessionStorage.getItem('sess_' + role)) } catch { return null } },
  set: (role, v) => { sessionStorage.setItem('sess_' + role, JSON.stringify(v)); refresh() },
  clear: (role) => { sessionStorage.removeItem('sess_' + role); state = EMPTY; emit(); refresh() },
}
// true once the snapshot belongs to the logged-in role (avoids a login-screen flash on reload)
export const ready = (role) => !session.get(role) || state.forRole === role

async function call(method, url, body, role) {
  const headers = {}
  const tok = session.get(role || pageRole())?.token
  if (tok) headers.Authorization = 'Bearer ' + tok
  let payload
  if (body instanceof FormData) payload = body
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  const res = await fetch(url, { method, headers, body: payload })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; throw e }
  return data
}

let busy = false, again = false
export async function refresh() {
  if (busy) { again = true; return }
  busy = true
  const role = pageRole()
  try {
    const data = await call('GET', '/api/state', null, role)
    state = { ...data, forRole: role && session.get(role) ? role : null }
    emit()
  } catch (e) {
    if (e.status === 401 && role) { sessionStorage.removeItem('sess_' + role); location.reload() } // token expired
  } finally { busy = false; if (again) { again = false; refresh() } }
}
setInterval(() => { if (!document.hidden) refresh() }, 3000)
document.addEventListener('visibilitychange', () => !document.hidden && refresh())
refresh()

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l) }
export const useDB = () => useSyncExternalStore(subscribe, () => state)

// mutation that throws to the caller (forms show the error)
const mut = async (method, url, body) => { const r = await call(method, url, body); await refresh(); return r }
// fire-and-forget mutation (buttons) – shows the server error in an alert
const act = (method, url, body) => mut(method, url, body).catch((e) => { alert(e.message); refresh() })

const login = async (role, path, id, password) => {
  const { token, me } = await call('POST', '/api/auth/' + path, { id, password }, role)
  session.set(role, { ...me, token })
  return me
}

export const api = {
  // auth
  adminLogin: (email, password) => login('admin', 'admin/login', email, password),
  staffLogin: (email, password) => login('staff', 'staff/login', email, password),
  userLogin: (phone, password) => login('user', 'user/login', phone, password),
  userSignup: async (name, phone, password) => {
    const { token, me } = await call('POST', '/api/auth/user/signup', { name, phone, password }, 'user')
    session.set('user', { ...me, token }); return me
  },
  staffRegister: (d) => call('POST', '/api/auth/staff/register', d, 'staff'),
  // super admin
  createAdmin: (d) => mut('POST', '/api/admin/admins', d),
  updateAdmin: (id, d) => mut('PATCH', `/api/admin/admins/${id}`, d),
  deleteAdmin: (id) => act('DELETE', `/api/admin/admins/${id}`),
  createStaff: (d) => mut('POST', '/api/admin/staff', d),
  updateStaff: (id, d) => mut('PATCH', `/api/admin/staff/${id}`, d),
  deleteStaff: (id) => act('DELETE', `/api/admin/staff/${id}`),
  createCustomer: (d) => mut('POST', '/api/admin/customers', d),
  updateCustomer: (id, d) => mut('PATCH', `/api/admin/customers/${id}`, d),
  deleteCustomer: (id) => act('DELETE', `/api/admin/customers/${id}`),
  createCity: (d) => mut('POST', '/api/admin/cities', d),
  updateCity: (id, d) => mut('PATCH', `/api/admin/cities/${id}`, d),
  deleteCity: (id) => act('DELETE', `/api/admin/cities/${id}`),
  deleteService: async (id) => { try { return await mut('DELETE', `/api/admin/services/${id}`) } catch (e) { alert(e.message) } },
  uploadImage: async (file) => { const f = new FormData(); f.append('image', file); return (await call('POST', '/api/admin/upload', f)).url },
  setStaffStatus: (id, status) => act('POST', `/api/admin/staff/${id}/status`, { status }),
  toggleCity: (id) => act('POST', `/api/admin/cities/${id}/toggle`),
  addArea: (id, name) => act('POST', `/api/admin/cities/${id}/areas`, { name }),
  removeArea: (id, name) => act('DELETE', `/api/admin/cities/${id}/areas?name=${encodeURIComponent(name)}`),
  saveService: (s) => mut('POST', '/api/admin/services', s),
  assignStaff: (bookingId, staffId) => act('POST', `/api/admin/bookings/${bookingId}/assign`, { staffId }),
  runSettlement: async () => (await mut('POST', '/api/admin/settlements/run')).count,
  // customer
  requestBooking: (d) => mut('POST', '/api/user/bookings', d),
  cancelBooking: (id) => act('POST', `/api/user/bookings/${id}/cancel`),
  payBooking: (id, method, upiId) => mut('POST', `/api/user/bookings/${id}/pay`, { method, upiId }),
  markRead: (ids) => act('POST', '/api/notifications/read', ids ? { ids } : { all: true }),
  addFeedback: (bookingId, rating, comment) => act('POST', '/api/user/feedback', { bookingId, rating, comment }),
  // staff
  setOnline: (id, online) => act('POST', '/api/staff/online', { online }),
  acceptBooking: (id, eta = 10) => mut('POST', `/api/staff/bookings/${id}/accept`, { eta }).then(() => true, (e) => { refresh(); return false }),
  declineBooking: (id) => act('POST', `/api/staff/bookings/${id}/decline`),
  addPhoto: (id, kind, file) => { const f = new FormData(); f.append('photo', file); return act('POST', `/api/staff/bookings/${id}/photos/${kind}`, f) },
  removePhoto: (id, kind, i) => {
    const url = state.bookings.find((b) => b.id === id)?.[kind][i]
    return url && act('DELETE', `/api/staff/bookings/${id}/photos?url=${encodeURIComponent(url)}`)
  },
  startJob: (id) => act('POST', `/api/staff/bookings/${id}/start`),
  completeJob: (id) => act('POST', `/api/staff/bookings/${id}/complete`),
  reportDelay: (id, reason) => act('POST', `/api/staff/bookings/${id}/delay`, { reason }),
}

// requests a staff member should be popped: same city, online, approved, not declined
export const incomingFor = (db, staff) =>
  staff.status !== 'approved' || !staff.online ? [] :
    db.bookings.filter((b) => b.status === 'requested' && b.city === staff.city && !b.declinedBy.includes(staff.id))

export const inr = (n) => '₹' + Number(n).toLocaleString('en-IN')
export const ago = (iso) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' hr ago'
  return Math.floor(s / 86400) + ' d ago'
}
export const fmt =(iso) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
