import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDB, api, session, ready, MENUS, PERMS, inr, fmt, STAFF_SHARE } from '../store.js'
import { AuthShell, PanelLayout, Badge, Photos, Modal, ImageField, useMsg } from '../components/Shared.jsx'
import Icon, { Stars } from '../components/Icon.jsx'
import { Count, HBars, PALETTE, countBy, avg } from '../components/Charts.jsx'
import { DashHead, DashActions, DGrid, Col, Side, MetricCard, Kpi, BigKpi, ListCard, SplitCard, TilesCard, RingsCard, TableCard, series, trend, rupee, share } from '../components/Analytics.jsx'
import { IMG, SERVICE_PHOTO, cityImg, imgFallback } from '../content.js'

const ICONS = { dashboard: 'grid', staff: 'users', customers: 'user', bookings: 'list', cities: 'map', services: 'tools', settlements: 'wallet', feedback: 'star', users: 'lock' }
const SVC_ICONS = ['broom', 'dishes', 'kitchen', 'bath', 'dust', 'fan', 'cook', 'laundry', 'sparkle']
const ROLES = ['Admin', 'Account Manager', 'City Manager', 'Support']

// can this admin do `perm` on a record in `city`?
const can = (me, perm, city) => me.role === 'Superadmin' || (me.perms.includes(perm) && (me.cities.includes('*') || !city || me.cities.includes(city)))
const PayBadge = ({ b }) => b.status !== 'completed' ? <span style={{ color: 'var(--mute)' }}>—</span>
  : b.paymentStatus === 'paid' ? <span className="badge b-paid">Paid · {b.paymentMethod === 'upi' ? 'UPI' : 'Cash'}</span> : <span className="badge b-unpaid">Awaiting payment</span>
const photoFor = (s, w = 600) => s.image || (SERVICE_PHOTO[s.icon] || IMG.clean1)(w)

// mode 'super' = /superadmin (Superadmin only) · mode 'team' = /team (Admin, Account Manager, City Manager, Support)
export default function AdminApp({ mode = 'super' }) {
  const team = mode === 'team'
  const [id, setId] = useState(() => session.get('admin')?.id)
  const db = useDB()
  const me = db.admins.find((a) => a.id === id)
  const [f, setF] = useState({ email: '', password: '' }); const [err, setErr] = useState('')
  const logout = () => { session.clear('admin'); setId(null) }
  if (id && !ready('admin')) return <div className="empty">Loading…</div>
  if (!me) {
    return (
      <AuthShell title={team ? 'Team login' : 'Admin login'}
        art={team ? 'Your team workspace' : 'Your control room'}
        sub={team ? 'Sign in with the mail id and password your super admin created for you.' : 'Approve staff, manage cities and services, and grant access to your team.'}
        image={team ? IMG.clean2(1200) : IMG.heroB(1200)}
        bullets={team ? ['See only the menus you were given', 'Work within your assigned cities', 'Live dashboards for your role'] : ['Approve or reject registrations', 'Permissions by menu and city', 'Live charts and weekly settlements']}
        floats={team
          ? [{ icon: 'lock', title: 'Role based access', sub: 'Menus, permissions, cities' }, { icon: 'list', title: 'Bookings at a glance', sub: 'For your cities' }, { icon: 'star', title: 'Customer feedback', sub: 'Always in view' }]
          : [{ icon: 'users', title: 'New staff request', sub: 'Waiting for approval' }, { icon: 'wallet', title: 'Weekly settlement', sub: 'Ready to run' }, { icon: 'star', title: '4.8 average rating', sub: 'This week' }]}>
        <p className="sub">{team ? 'For Admin, Account Manager, City Manager and Support users' : 'Sign in with your super admin mail id'}</p>
        <form onSubmit={async (e) => { e.preventDefault(); setErr(''); try { setId((await api.adminLogin(f.email, f.password)).id) } catch (x) { setErr(x.message) } }}>
          <label>Mail id</label><input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <label>Password</label><input required type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          {err && <div className="err">{err}</div>}
          <button className="btn glow" style={{ width: '100%', marginTop: 20 }}>Log in</button>
        </form>
        <p className="demo">{team ? <>Are you the super admin? <Link to="/superadmin" style={{ color: 'var(--pink)', fontWeight: 700 }}>Use the Admin login</Link>.</> : <>Team member (Admin, Account Manager, City Manager, Support)? <Link to="/team" style={{ color: 'var(--pink)', fontWeight: 700 }}>Use the Team login</Link>.</>}</p>
      </AuthShell>)
  }
  // an account signed in on the wrong entry point: send it to its own login instead of mixing the two
  if ((me.role === 'Superadmin') === team) {
    return (
      <div className="auth-form" style={{ minHeight: '100vh', background: 'var(--soft)' }}>
        <div className="box" style={{ maxWidth: 460, textAlign: 'center' }}>
          <div style={{ color: 'var(--pink)', display: 'grid', placeItems: 'center', marginBottom: 10 }}><Icon name="lock" size={48} /></div>
          <h2>{team ? 'This is the super admin account' : `This is a ${me.role} account`}</h2>
          <p style={{ color: 'var(--mute)', margin: '10px 0 20px' }}>{team ? 'Super admins sign in on the Admin login page.' : 'Team members sign in on the Team login page.'}</p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Link className="btn" to={team ? '/superadmin' : '/team'} onClick={logout}>{team ? 'Go to Admin login' : 'Go to Team login'}</Link>
            <button className="btn ghost" onClick={logout}>Log out</button></div>
        </div>
      </div>)
  }
  return <AdminPanel me={me} db={db} onLogout={logout} team={team} />
}

function AdminPanel({ me, db, onLogout, team }) {
  const menus = MENUS.filter((m) => me.role === 'Superadmin' || me.menus.includes(m.key))
  const [tab, setTab] = useState(menus[0]?.key)
  const pendingStaff = menus.some((m) => m.key === 'staff') ? db.staff.filter((s) => s.status === 'pending').length : 0
  const items = menus.map((m) => ({ ...m, icon: ICONS[m.key], count: m.key === 'staff' ? pendingStaff : 0 }))
  const P = { me, db, go: setTab }
  return (
    <PanelLayout role={me.role === 'Superadmin' ? 'Super admin' : me.role} items={items} active={tab} onNav={setTab} me={{ name: me.name, sub: me.email }} onLogout={onLogout}>
      {!menus.length && <div className="box empty">No menus have been assigned to your account yet. Ask the super admin to give you access.</div>}
      {tab === 'dashboard' && <Dashboard {...P} />}
      {tab === 'staff' && <StaffTab {...P} />}
      {tab === 'customers' && <CustomersTab {...P} />}
      {tab === 'bookings' && <BookingsTab {...P} />}
      {tab === 'cities' && <CitiesTab {...P} />}
      {tab === 'services' && <ServicesTab {...P} />}
      {tab === 'settlements' && <SettlementsTab {...P} />}
      {tab === 'feedback' && <FeedbackTab {...P} />}
      {tab === 'users' && <UsersTab {...P} />}
    </PanelLayout>
  )
}

const Head = ({ t, s, hero, children }) => <div className={'topbar' + (hero ? ' hero-card' : '')}><div><h1>{t}</h1><p className="lead">{s}</p></div><div className="actions">{children}</div></div>
const Table = ({ head, rows, empty }) => !rows.length ? <div className="box empty">{empty}</div> :
  <div className="box tablewrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-label={head[j]}>{c}</td>)}</tr>)}</tbody></table></div>
const Stat = ({ icon, label, children, tone }) => (
  <div className={'stat ' + (tone || '')}><span className="si"><Icon name={icon} size={20} /></span><small>{label}</small><b>{children}</b></div>)

// ================= DASHBOARD =================
function exportCsv(rows) {
  const head = ['ID', 'Service', 'City', 'Area', 'Customer', 'Staff', 'Price', 'Status', 'Payment', 'Created']
  const esc = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"'
  const body = rows.map((b) => [b.id, b.serviceName, b.city, b.area, b.customerName, b.staffId || '', b.price, b.status, b.paymentStatus, b.createdAt].map(esc).join(','))
  const url = URL.createObjectURL(new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = 'clickit-bookings.csv'; a.click(); URL.revokeObjectURL(url)
}

function Dashboard({ db, me, go }) {
  const [city, setCity] = useState('all')
  const has = (m) => me.role === 'Superadmin' || me.menus.includes(m)
  const myCities = db.cities.filter((c) => me.role === 'Superadmin' || me.cities.includes('*') || me.cities.includes(c.name))
  const bookings = db.bookings.filter((b) => city === 'all' || b.city === city)
  const staff = db.staff.filter((s) => city === 'all' || s.city === city)
  const approved = staff.filter((s) => s.status === 'approved')
  const feedback = db.feedback.filter((f) => city === 'all' || staff.some((s) => s.id === f.staffId))
  const done = bookings.filter((b) => b.status === 'completed')
  const paid = done.filter((b) => b.paymentStatus === 'paid')
  const unpaid = done.filter((b) => b.paymentStatus !== 'paid')
  const cancelled = bookings.filter((b) => b.status === 'cancelled')
  const open = bookings.filter((b) => b.status === 'requested')
  const ratings = feedback.map((f) => f.rating)
  const pending = has('staff') ? db.staff.filter((s) => s.status === 'pending') : []
  const created = (b) => b.createdAt
  const paidAt = (b) => b.paidAt || b.completedAt
  const revenue = paid.reduce((t, b) => t + b.price, 0)
  const byStatus = countBy(bookings, 'status').map((x) => ({ ...x, label: x.label.replace('_', ' ') }))
  const services = countBy(bookings, 'serviceName').slice(0, 5)
  const cityRows = countBy(bookings, 'city').map((c) => ({ city: c.label, n: c.value, done: done.filter((b) => b.city === c.label).length, rev: paid.filter((b) => b.city === c.label).reduce((t, b) => t + b.price, 0) }))
  const staffRank = approved.map((s) => ({ s, n: done.filter((b) => b.staffId === s.id).length })).sort((a, b) => b.n - a.n).slice(0, 5)
  const today = new Date(), from = new Date(); from.setDate(from.getDate() - 6)
  const d = (x) => x.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  return (
    <>
      <DashHead title={`Hi, ${me.name}!`} sub="Here is what is happening on Clickit today."
        meta={[{ label: 'Start date', value: d(from) }, { label: 'End date', value: d(today) }]}>
        <div className="dmeta"><small>City</small>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="Filter by city"><option value="all">All cities</option>{myCities.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
      </DashHead>
      <DashActions>
        <button className="da" onClick={() => exportCsv(bookings)}><Icon name="upload" size={16} />Export CSV</button>
        <button className="da" onClick={() => window.print()}><Icon name="list" size={16} />Print / PDF</button>
      </DashActions>

      {pending.length > 0 && (
        <div className="box approvals">
          <div className="topbar"><h3><Icon name="bell" size={18} /> Staff registrations awaiting approval ({pending.length})</h3><button className="btn ghost sm" onClick={() => go('staff')}>Open staff</button></div>
          {pending.map((s) => (
            <div key={s.id} className="arow">
              <div className="av">{s.name[0]}</div>
              <div style={{ flex: 1 }}><b>{s.name}</b><small>{s.city}, {s.area} · {s.phone} · {fmt(s.createdAt)}</small></div>
              {can(me, 'approve', s.city) && <button className="btn ok sm" onClick={() => api.setStaffStatus(s.id, 'approved')}>Approve</button>}
              {can(me, 'reject', s.city) && <button className="btn bad sm" onClick={() => api.setStaffStatus(s.id, 'rejected')}>Reject</button>}
            </div>))}
        </div>)}

      <DGrid>
        <Col s={8}>
          <MetricCard title="Bookings & revenue" sub="Platform activity. Click a number to change the chart; the dashed line is the previous period." metrics={[
            { key: 'b', label: 'Bookings', list: bookings, pick: () => 1, when: created },
            { key: 'r', label: 'Revenue', list: paid, pick: (b) => b.price, when: paidAt, format: rupee, prefix: '₹' },
            { key: 'c', label: 'Completed', list: done, pick: () => 1 },
            { key: 'x', label: 'Cancelled', list: cancelled, pick: () => 1, when: created },
          ]} />
        </Col>
        <Col s={4}>
          <Side>
            <Kpi label="Payments received" display={rupee(revenue)} delta={trend(paid, (b) => b.price, paidAt)} data={series('day', paid, (b) => b.price, paidAt)} />
            <Kpi label="Awaiting payment" display={rupee(unpaid.reduce((t, b) => t + b.price, 0))} delta={trend(unpaid, (b) => b.price)} data={series('day', unpaid, (b) => b.price)} kind="bars" color={PALETTE[3]} />
            <BigKpi label="All bookings" value={bookings.length} delta={trend(bookings, () => 1, created)} data={series('week', bookings, () => 1, created)}
              text="Every booking request received, including open, completed and cancelled ones." />
          </Side>
        </Col>
      </DGrid>

      <DGrid>
        <Col s={5}>
          <ListCard title="Top services" sub="Most booked services and the payments they brought in." empty="No bookings yet." rows={services.map((s) => ({
            key: s.label, title: s.label, sub: `${rupee(paid.filter((b) => b.serviceName === s.label).reduce((t, b) => t + b.price, 0))} received`, value: s.value, share: share(s.value, bookings.length) }))} />
        </Col>
        <Col s={7}>
          <SplitCard title="Bookings by status" sub="Where every request currently stands." data={byStatus} empty="No bookings yet." />
        </Col>
      </DGrid>

      <DGrid>
        <Col s={5}>
          <TilesCard title="Overview" sub="People and demand on the platform." tiles={[
            { icon: 'user', label: 'Customers', value: has('customers') ? db.customers.length : '—' },
            { icon: 'users', label: 'Active staff', value: approved.length },
            { icon: 'clock', label: 'Open requests', value: open.length },
            { icon: 'star', label: 'Avg rating', value: ratings.length ? avg(ratings).toFixed(1) : '0.0' },
          ]} />
          <RingsCard title="Health" sub="Quick signals for the team." rings={[
            { label: 'Completion rate', pct: share(done.length, bookings.length - cancelled.length), value: `${done.length} done` },
            { label: 'Payments collected', pct: share(paid.length, done.length), value: `${paid.length} of ${done.length}` },
            { label: 'Staff online', pct: share(approved.filter((s) => s.online).length, approved.length), value: `${approved.filter((s) => s.online).length} of ${approved.length}` },
          ]} />
        </Col>
        <Col s={7}>
          <TableCard title="Top cities" sub="Demand and revenue by city." head={['City', 'Bookings', 'Share', 'Completed', 'Revenue']} empty="No bookings yet."
            rows={cityRows.map((c) => [<b>{c.city}</b>, c.n, share(c.n, bookings.length) + '%', c.done, rupee(c.rev)])} />
        </Col>
      </DGrid>

      <DGrid>
        <Col s={7}>
          <TableCard title="Latest bookings" sub="The most recent requests." head={['ID', 'Service', 'City', 'Amount', 'Status']} empty="No bookings yet."
            right={bookings.length > 6 ? <button className="btn ghost sm" onClick={() => go('bookings')}>View all</button> : null}
            rows={bookings.slice(0, 6).map((b) => [b.id, <span className="t"><Icon name={b.icon} size={16} />{b.serviceName}</span>, b.city, <b>{inr(b.price)}</b>, <Badge s={b.status} />])} />
        </Col>
        <Col s={5}>
          {has('feedback')
            ? <ListCard title="Latest feedback" sub="Customer ratings for staff." empty="No feedback yet." rows={feedback.slice(0, 5).map((f) => ({
              key: f.id, title: f.customerName, sub: `${f.comment || 'No comment'} · for ${db.staff.find((s) => s.id === f.staffId)?.name || 'staff'}`, value: '★ ' + f.rating }))} />
            : <ListCard title="Open requests" sub="Waiting for an expert." empty="No open requests." rows={open.slice(0, 5).map((b) => ({ key: b.id, title: b.serviceName, sub: `${b.area}, ${b.city}`, value: inr(b.price) }))} />}
        </Col>
      </DGrid>

      <DGrid>
        <Col s={6}>
          <ListCard title="Staff leaderboard" sub="Top experts by completed jobs." empty="No approved staff yet." rows={staffRank.map((x) => ({
            key: x.s.id, title: x.s.name, sub: `${x.s.city} · ${x.s.area}`, value: x.n, share: share(x.n, done.length) }))} />
        </Col>
        <Col s={6}>
          <SplitCard title="Payment method" sub="How customers pay once a job is done." data={countBy(paid, (b) => (b.paymentMethod === 'upi' ? 'UPI' : 'Cash'))} empty="No payments yet." />
        </Col>
      </DGrid>
    </>
  )
}

// ================= STAFF =================
function StaffTab({ db, me }) {
  const [filter, setFilter] = useState('pending')
  const [form, setForm] = useState(null)
  const list = db.staff.filter((s) => filter === 'all' || s.status === filter)
  const editable = can(me, 'edit')
  return (
    <>
      <Head t="Staff & registrations" s="Approve registrations, or add and manage staff yourself.">
        <div className="tabs" style={{ margin: 0 }}>{['pending', 'approved', 'rejected', 'all'].map((x) => <button key={x} className={filter === x ? 'on' : ''} onClick={() => setFilter(x)}>{x}</button>)}</div>
        {editable && <button className="btn sm" onClick={() => setForm({ name: '', phone: '', email: '', password: '', city: db.cities[0]?.name || '', area: '' })}><Icon name="plus" size={16} />Add staff</button>}
      </Head>
      <Table empty="No staff here." head={['Name', 'Contact', 'City / Area', 'Registered', 'Status', 'Action']}
        rows={list.map((s) => [<b>{s.name}</b>, <>{s.phone}<br /><small>{s.email}</small></>, `${s.city} · ${s.area}`, fmt(s.createdAt), <Badge s={s.status} />,
          <div className="actions">
            {s.status !== 'approved' && can(me, 'approve', s.city) && <button className="btn ok sm" onClick={() => api.setStaffStatus(s.id, 'approved')}>Approve</button>}
            {s.status !== 'rejected' && can(me, 'reject', s.city) && <button className="btn bad sm" onClick={() => api.setStaffStatus(s.id, 'rejected')}>Reject</button>}
            {can(me, 'edit', s.city) && <button className="btn ghost sm" onClick={() => setForm({ ...s, password: '' })}>Edit</button>}
            {can(me, 'edit', s.city) && <button className="btn ghost sm" onClick={() => confirm(`Delete ${s.name}?`) && api.deleteStaff(s.id)}>Delete</button>}
          </div>])} />
      {form && <PersonForm title={form.id ? 'Edit staff' : 'Add staff'} form={form} setForm={setForm} onClose={() => setForm(null)}
        onSave={() => (form.id ? api.updateStaff(form.id, form) : api.createStaff(form))} extra={
          <div className="form-grid"><div><label>City</label><select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value, area: '' })}>{db.cities.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
            <div><label>Area</label><input required list="areas" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
              <datalist id="areas">{(db.cities.find((c) => c.name === form.city)?.areas || []).map((a) => <option key={a} value={a} />)}</datalist></div></div>}
        withEmail /> }
    </>
  )
}

// shared create/edit form for staff and customers
function PersonForm({ title, form, setForm, onClose, onSave, extra, withEmail }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <Modal onClose={onClose}><h2>{title}</h2>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await onSave(); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) } }}>
        <div className="form-grid"><div><label>Full name</label><input required value={form.name} onChange={set('name')} /></div><div><label>Phone</label><input required value={form.phone} onChange={set('phone')} /></div></div>
        {withEmail && <><label>Mail id (login)</label><input required type="email" value={form.email} onChange={set('email')} /></>}
        <label>{form.id ? 'New password (leave blank to keep)' : 'Password'}</label><input type="text" minLength={6} required={!form.id} value={form.password} onChange={set('password')} placeholder="min 6 characters" />
        {extra}
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
      </form></Modal>
  )
}

// ================= CUSTOMERS =================
function CustomersTab({ db, me }) {
  const [form, setForm] = useState(null)
  const ok = can(me, 'edit')
  return (
    <>
      <Head t="Customers" s="Create and manage customer accounts.">{ok && <button className="btn sm" onClick={() => setForm({ name: '', phone: '', password: '' })}><Icon name="plus" size={16} />Add customer</button>}</Head>
      <Table empty="No customers yet." head={['Name', 'Phone', 'Joined', 'Bookings', '']}
        rows={db.customers.map((c) => [<b>{c.name}</b>, c.phone, fmt(c.createdAt), c.bookings, ok && <div className="actions"><button className="btn ghost sm" onClick={() => setForm({ ...c, password: '' })}>Edit</button>
          <button className="btn ghost sm" onClick={() => confirm(`Delete ${c.name}?`) && api.deleteCustomer(c.id)}>Delete</button></div>])} />
      {form && <PersonForm title={form.id ? 'Edit customer' : 'Add customer'} form={form} setForm={setForm} onClose={() => setForm(null)}
        onSave={() => (form.id ? api.updateCustomer(form.id, form) : api.createCustomer(form))} />}
    </>
  )
}

// ================= BOOKINGS =================
function BookingsTab({ db, me }) {
  const [view, setView] = useState(null)
  const [assign, setAssign] = useState(null)
  const [st, setSt] = useState('all')
  const list = db.bookings.filter((b) => st === 'all' || b.status === st)
  const v = view && db.bookings.find((b) => b.id === view)
  const staffName = (id) => db.staff.find((s) => s.id === id)?.name || '—'
  return (
    <>
      <Head t="Bookings" s="All requests, assignments and job photos.">
        <select style={{ width: 170 }} value={st} onChange={(e) => setSt(e.target.value)}>{['all', 'requested', 'accepted', 'in_progress', 'completed', 'cancelled'].map((x) => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select></Head>
      <Table empty="No bookings." head={['ID', 'Service', 'City', 'Customer', 'Staff', 'Price', 'Status', 'Payment', '']}
        rows={list.map((b) => [b.id, <span className="t"><Icon name={b.icon} size={16} />{b.serviceName}</span>, `${b.area}, ${b.city}`, b.customerName, staffName(b.staffId), inr(b.price), <Badge s={b.status} />, <PayBadge b={b} />,
          <div className="actions"><button className="btn ghost sm" onClick={() => setView(b.id)}>View</button>
            {b.status === 'requested' && can(me, 'edit', b.city) && <button className="btn sm" onClick={() => setAssign(b.id)}>Assign</button>}</div>])} />
      {v && <Modal onClose={() => setView(null)}>
        <h2 className="t"><Icon name={v.icon} size={22} />{v.serviceName} <Badge s={v.status} /></h2>
        <p style={{ color: 'var(--mute)', margin: '6px 0 12px' }}>#{v.id} · {v.customerName} ({v.customerPhone})<br />Address: {v.address}, {v.area}, {v.city}<br />Staff: {staffName(v.staffId)} · {inr(v.price)}</p>
        {v.status === 'completed' && <p style={{ margin: '0 0 10px' }}><PayBadge b={v} />{v.paymentStatus === 'paid' && v.upiRef && <span style={{ color: 'var(--mute)', marginLeft: 8 }}>Ref {v.upiRef}</span>}</p>}
        {v.delay && <p style={{ color: 'var(--warn)', fontWeight: 600 }}>Delay: {v.delay}</p>}
        <b>Before</b><Photos list={v.before} locked /><b>After</b><Photos list={v.after} locked />
        <button className="btn ghost sm" onClick={() => setView(null)}>Close</button></Modal>}
      {assign && <Modal onClose={() => setAssign(null)}><h2>Assign staff</h2><p className="lead">Manually pick an expert for this request.</p>
        {db.staff.filter((s) => s.status === 'approved' && s.city === db.bookings.find((b) => b.id === assign).city).map((s) => (
          <div key={s.id} className="job" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12 }}><span><b>{s.name}</b> · {s.area} · <span style={{ color: s.online ? 'var(--ok)' : 'var(--mute)' }}>{s.online ? 'Online' : 'Offline'}</span></span>
            <button className="btn sm" onClick={() => { api.assignStaff(assign, s.id); setAssign(null) }}>Assign</button></div>))}</Modal>}
    </>
  )
}

// ================= CITIES (shown on the website) =================
function CitiesTab({ db, me }) {
  const [area, setArea] = useState({})
  const [form, setForm] = useState(null)
  const ok = can(me, 'edit')
  return (
    <>
      <Head t="Cities & areas" s="Cities appear on the website. Enable a city to open bookings there.">{ok && <button className="btn sm" onClick={() => setForm({ name: '', image: null })}><Icon name="plus" size={16} />Add city</button>}</Head>
      <div className="cgrid">{db.cities.map((c) => (
        <div className="box citybox" key={c.id}>
          <div className="cimg"><img src={c.image || cityImg(c.name, 600)} onError={imgFallback(cityImg(c.name, 600))} alt={c.name} /><span className={'badge b-' + (c.enabled ? 'approved' : 'pending')}>{c.enabled ? 'Live' : 'Disabled'}</span></div>
          <div className="topbar" style={{ margin: '12px 0 4px' }}><h3 style={{ margin: 0 }}>{c.name}</h3>
            <button disabled={!ok} className={'switch' + (c.enabled ? ' on' : '')} onClick={() => api.toggleCity(c.id)} aria-label="Toggle city" /></div>
          <div className="chips" style={{ margin: '10px 0' }}>{c.areas.map((a) => <span className="chip" key={a}>{a}{ok && <button onClick={() => api.removeArea(c.id, a)} aria-label="Remove area">×</button>}</span>)}</div>
          {ok && <form style={{ display: 'flex', gap: 8 }} onSubmit={(e) => { e.preventDefault(); area[c.id] && api.addArea(c.id, area[c.id]); setArea({ ...area, [c.id]: '' }) }}>
            <input placeholder="Add area" value={area[c.id] || ''} onChange={(e) => setArea({ ...area, [c.id]: e.target.value })} /><button className="btn sm">Add</button></form>}
          {ok && <div className="actions" style={{ marginTop: 12 }}><button className="btn ghost sm" onClick={() => setForm({ ...c })}>Edit</button><button className="btn ghost sm" onClick={() => confirm(`Delete ${c.name}?`) && api.deleteCity(c.id)}>Delete</button></div>}
        </div>))}</div>
      {form && <CityForm form={form} setForm={setForm} onClose={() => setForm(null)} />}
    </>
  )
}
function CityForm({ form, setForm, onClose }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  return (
    <Modal onClose={onClose}><h2>{form.id ? 'Edit city' : 'Add city'}</h2>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await (form.id ? api.updateCity(form.id, form) : api.createCity(form)); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) } }}>
        <label>City name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <ImageField label="City photo (shown on the website)" value={form.image} onChange={(image) => setForm({ ...form, image })} upload={api.uploadImage} />
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></form></Modal>
  )
}

// ================= SERVICES: description + image =================
function ServicesTab({ db, me }) {
  const [edit, setEdit] = useState(null)
  const ok = can(me, 'edit')
  const del = async (s) => {
    if (!confirm(`Delete ${s.name}?`)) return
    const r = await api.deleteService(s.id)
    if (r && r.deleted === false) alert('This service already has bookings, so it was hidden from customers instead of being deleted.')
  }
  return (
    <>
      <Head t="Services" s="Add, edit or remove services. Active services appear on the website and in the booking screen.">{ok && <button className="btn sm" onClick={() => setEdit({ name: '', icon: 'broom', desc: '', price: 99, mins: 30, image: null, active: true })}><Icon name="plus" size={16} />Add service</button>}</Head>
      <div className="sgrid">{db.services.map((s) => (
        <div key={s.id} className={'scard' + (s.active ? '' : ' off')}>
          <div className="simg"><img src={photoFor(s)} onError={imgFallback(photoFor({ icon: s.icon }))} alt={s.name} loading="lazy" />{!s.active && <span className="badge b-cancelled">Hidden</span>}</div>
          <div className="stx"><h3 className="t"><Icon name={s.icon} size={18} />{s.name}</h3><p>{s.desc || 'No description'}</p><b>{inr(s.price)} · {s.mins} min</b>
            {ok && <div className="actions" style={{ marginTop: 10 }}>
              <button className={'switch' + (s.active ? ' on' : '')} onClick={() => api.saveService({ ...s, active: !s.active })} aria-label="Toggle" />
              <button className="btn ghost sm" onClick={() => setEdit({ ...s })}>Edit</button><button className="btn ghost sm" onClick={() => del(s)}>Delete</button></div>}</div>
        </div>))}</div>
      {edit && <ServiceForm form={edit} setForm={setEdit} onClose={() => setEdit(null)} />}
    </>
  )
}
function ServiceForm({ form, setForm, onClose }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  return (
    <Modal onClose={onClose}><h2>{form.id ? 'Edit service' : 'New service'}</h2>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await api.saveService({ ...form, price: +form.price, mins: +form.mins }); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) } }}>
        <div className="form-grid"><div><label>Name</label><input required value={form.name} onChange={set('name')} /></div>
          <div><label>Icon</label><select value={form.icon} onChange={set('icon')}>{SVC_ICONS.map((i) => <option key={i}>{i}</option>)}</select></div>
          <div><label>Price (₹)</label><input type="number" min="1" required value={form.price} onChange={set('price')} /></div>
          <div><label>Base duration (minutes)</label><input type="number" min="5" required value={form.mins} onChange={set('mins')} /></div></div>
        <label>Description</label><textarea rows={3} maxLength={255} value={form.desc} onChange={set('desc')} placeholder="What is included in this service?" />
        <ImageField label="Service image" value={form.image} onChange={(image) => setForm({ ...form, image })} upload={api.uploadImage} />
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Saving…' : 'Save service'}</button></form></Modal>
  )
}

// ================= SETTLEMENTS =================
function SettlementsTab({ db, me }) {
  const pending = db.bookings.filter((b) => b.status === 'completed' && b.paymentStatus === 'paid' && !b.settled)
  const [msg, flash] = useMsg()
  const name = (id) => db.staff.find((s) => s.id === id)?.name
  const due = pending.reduce((t, b) => t + Math.round(b.price * STAFF_SHARE), 0)
  return (
    <>
      <Head t="Weekly settlements" s={`Staff receive ${Math.round(STAFF_SHARE * 100)}% of every completed booking.`}>
        <button className="btn sm" disabled={!pending.length || !can(me, 'edit')} onClick={async () => { try { flash(`${await api.runSettlement()} staff settled`) } catch (e) { alert(e.message) } }}>Run weekly settlement ({pending.length} jobs)</button></Head>
      <div className="stats"><Stat icon="wallet" label="Due this week"><Count value={due} prefix="₹" /></Stat><Stat icon="clock" label="Awaiting customer payment"><Count value={db.bookings.filter((b) => b.status === 'completed' && b.paymentStatus !== 'paid').length} /></Stat><Stat icon="list" label="Paid jobs to settle"><Count value={pending.length} /></Stat><Stat icon="check" label="Paid to date"><Count value={db.settlements.reduce((t, s) => t + s.payout, 0)} prefix="₹" /></Stat></div>
      {msg && <div className="okmsg" style={{ marginBottom: 10 }}>{msg}</div>}
      <Table empty="No settlements yet." head={['ID', 'Staff', 'Date', 'Jobs', 'Gross', 'Payout', 'Status']}
        rows={db.settlements.map((s) => [s.id, name(s.staffId), fmt(s.createdAt), s.jobs, inr(s.gross), <b>{inr(s.payout)}</b>, <Badge s={s.status} />])} />
    </>
  )
}

// ================= FEEDBACK =================
function FeedbackTab({ db }) {
  const dist = [5, 4, 3, 2, 1].map((n) => ({ label: n + ' star', value: db.feedback.filter((f) => f.rating === n).length }))
  const perStaff = db.staff.map((s) => ({ s, list: db.feedback.filter((f) => f.staffId === s.id) })).filter((x) => x.list.length)
    .map((x) => ({ label: x.s.name, value: +avg(x.list.map((f) => f.rating)).toFixed(1) })).sort((a, b) => b.value - a.value)
  return (
    <>
      <Head t="Feedback" s="Customer ratings reach both the staff member and the admin team." />
      <div className="gridc">
        <div className="box"><h3>Rating distribution</h3><HBars data={dist} /></div>
        <div className="box"><h3>Average rating by staff</h3><HBars data={perStaff} format={(v) => v.toFixed(1)} /></div>
      </div>
      <Table empty="No feedback yet." head={['Customer', 'Staff', 'Rating', 'Comment', 'Date']}
        rows={db.feedback.map((f) => [f.customerName, db.staff.find((s) => s.id === f.staffId)?.name, <Stars n={f.rating} size={14} />, f.comment || '—', fmt(f.createdAt)])} />
    </>
  )
}

// ================= USERS & PERMISSIONS =================
function UsersTab({ db, me }) {
  const [form, setForm] = useState(null)
  const blank = { name: '', role: ROLES[1], email: '', password: '', menus: ['dashboard'], perms: ['view'], cities: ['*'] }
  const sup = me.role === 'Superadmin'
  return (
    <>
      <Head t="Users & permissions" s="Create panel users with their own mail id and password, and tick exactly what they can access.">{sup && <button className="btn sm" onClick={() => setForm(blank)}><Icon name="plus" size={16} />Create user</button>}</Head>
      <div className="box" style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '16px 20px' }}>
        <span className="ni"><Icon name="lock" size={18} /></span>
        <div style={{ flex: 1, minWidth: 220 }}><b>Team login page</b></div>
        <button className="btn ghost sm" onClick={() => navigator.clipboard?.writeText(location.origin + '/team')}>Copy link</button>
        <a className="btn sm" href="/team" target="_blank" rel="noreferrer">Open</a></div>
      <Table empty="No users" head={['Name', 'Role', 'Mail id', 'Menus', 'Permissions', 'Cities', '']}
        rows={db.admins.map((a) => [<b>{a.name}</b>, a.role, a.email,
          a.role === 'Superadmin' ? 'All menus' : <div className="chips">{a.menus.map((m) => <span className="chip" key={m}>{m}</span>)}</div>,
          a.perms.join(', '), a.cities.includes('*') ? 'All' : a.cities.join(', '),
          a.role !== 'Superadmin' && sup && <div className="actions"><button className="btn ghost sm" onClick={() => setForm({ ...a, password: '' })}>Edit</button>
            <button className="btn ghost sm" onClick={() => confirm(`Delete ${a.name}?`) && api.deleteAdmin(a.id)}>Delete</button></div>])} />
      {form && <UserForm form={form} setForm={setForm} db={db} onClose={() => setForm(null)} />}
    </>
  )
}
function UserForm({ form, setForm, db, onClose }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const tog = (k, v) => setForm({ ...form, [k]: form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v] })
  const allCities = form.cities.includes('*')
  return (
    <Modal onClose={onClose}><h2>{form.id ? 'Edit user' : 'Create user'}</h2>
      <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await (form.id ? api.updateAdmin(form.id, form) : api.createAdmin(form)); onClose() } catch (x) { setErr(x.message) } finally { setBusy(false) } }}>
        <div className="form-grid"><div><label>Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label>Role</label><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select></div>
          <div><label>Mail id</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label>{form.id ? 'New password (blank = keep)' : 'Password'}</label><input required={!form.id} minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div></div>
        <label>Menus this user can open</label>
        <div className="perm-grid">{MENUS.filter((m) => m.key !== 'users').map((m) => <label key={m.key}><input type="checkbox" checked={form.menus.includes(m.key)} onChange={() => tog('menus', m.key)} />{m.label}</label>)}</div>
        <label>Permissions</label>
        <div className="perm-grid">{PERMS.map((p) => <label key={p}><input type="checkbox" checked={form.perms.includes(p)} onChange={() => tog('perms', p)} /><span style={{ textTransform: 'capitalize' }}>{p}</span></label>)}</div>
        <label>Allowed cities</label>
        <div className="perm-grid">
          <label><input type="checkbox" checked={allCities} onChange={() => setForm({ ...form, cities: allCities ? [] : ['*'] })} />All cities</label>
          {!allCities && db.cities.map((c) => <label key={c.id}><input type="checkbox" checked={form.cities.includes(c.name)} onChange={() => tog('cities', c.name)} />{c.name}</label>)}</div>
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Saving…' : form.id ? 'Save changes' : 'Create user'}</button></form></Modal>
  )
}
