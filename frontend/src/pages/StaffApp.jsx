import { useState } from 'react'
import { useDB, api, session, ready, incomingFor, inr, fmt, STAFF_SHARE } from '../store.js'
import { AuthShell, PanelLayout, Badge, Photos, useMsg } from '../components/Shared.jsx'
import Icon, { Stars } from '../components/Icon.jsx'
import { Count, HBars, PALETTE, countBy, avg } from '../components/Charts.jsx'
import { DashHead, DGrid, Col, Side, MetricCard, Kpi, BigKpi, ListCard, SplitCard, TilesCard, RingsCard, TableCard, series, trend, rupee, share } from '../components/Analytics.jsx'
import { IMG } from '../content.js'

export default function StaffApp() {
  const [id, setId] = useState(() => session.get('staff')?.id)
  const db = useDB()
  const me = db.staff.find((s) => s.id === id)
  const login = (s) => setId(s.id)
  if (id && !ready('staff')) return <div className="empty">Loading…</div>
  if (!me) return <StaffAuth db={db} onLogin={login} />
  if (me.status !== 'approved') return <Pending me={me} onLogout={() => { session.clear('staff'); setId(null) }} />
  return <StaffPanel me={me} db={db} onLogout={() => { session.clear('staff'); setId(null) }} />
}

function StaffAuth({ db, onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '', city: 'Mumbai', area: '' })
  const [err, setErr] = useState(''); const [ok, flash] = useMsg()
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try {
      if (mode === 'login') onLogin(await api.staffLogin(f.email, f.password))
      else { await api.staffRegister(f); flash('Registration sent! Wait for super admin approval, then log in.'); setMode('login') }
    } catch (x) { setErr(x.message) }
  }
  const cities = db.cities.filter((c) => ['Mumbai', 'Delhi'].includes(c.name))
  return (
    <AuthShell title={mode === 'login' ? 'Staff login' : 'Register as an expert'} art="Earn with Clickit" sub="Accept nearby jobs, upload photos and get paid weekly."
      bullets={['Get job pop-ups near you', 'Weekly settlement to your account', 'Currently hiring in Mumbai & Delhi']} image={IMG.clean2(1200)}
      floats={[{ icon: 'bell', title: 'New job nearby', sub: 'Andheri, 2 km away' }, { icon: 'wallet', title: 'You earned ₹1,240', sub: 'This week' }, { icon: 'star', title: '5 star review', sub: 'From a happy family' }]}>
      <p className="sub">{mode === 'login' ? 'Log in to your staff panel' : 'Your profile goes to the admin for approval'}</p>
      <div className="tabs"><button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button><button className={mode === 'register' ? 'on' : ''} onClick={() => setMode('register')}>Register</button></div>
      <form onSubmit={submit}>
        {mode === 'register' && <>
          <label>Full name</label><input required value={f.name} onChange={set('name')} />
          <label>Phone</label><input required value={f.phone} onChange={set('phone')} />
          <div className="form-grid"><div><label>City</label><select value={f.city} onChange={set('city')}>{cities.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
            <div><label>Area</label><input required value={f.area} onChange={set('area')} /></div></div></>}
        <label>Email</label><input required type="email" value={f.email} onChange={set('email')} />
        <label>Password</label><input required type="password" value={f.password} onChange={set('password')} />
        {err && <div className="err">{err}</div>}{ok && <div className="okmsg">{ok}</div>}
        <button className="btn" style={{ width: '100%', marginTop: 20 }}>{mode === 'login' ? 'Log in' : 'Submit registration'}</button>
      </form>
    </AuthShell>
  )
}

function Pending({ me, onLogout }) {
  return (
    <div className="auth-form" style={{ minHeight: '100vh', background: 'var(--soft)' }}>
      <div className="box" style={{ maxWidth: 440, textAlign: 'center' }}>
        <div style={{ color: me.status === 'rejected' ? 'var(--bad)' : 'var(--pink)', display: 'grid', placeItems: 'center', marginBottom: 10 }}><Icon name={me.status === 'rejected' ? 'close' : 'clock'} size={56} /></div>
        <h2>{me.status === 'rejected' ? 'Registration rejected' : 'Awaiting approval'}</h2>
        <p style={{ color: 'var(--mute)', margin: '10px 0 20px' }}>{me.status === 'rejected' ? 'The admin could not approve your registration. Contact support.' : `Hi ${me.name}, the super admin is reviewing your ${me.city} registration.`}</p>
        <button className="btn ghost" onClick={onLogout}>Log out</button>
      </div>
    </div>
  )
}

function StaffPanel({ me, db, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const incoming = incomingFor(db, me)
  const mine = db.bookings.filter((b) => b.staffId === me.id)
  const items = [
    { key: 'dashboard', icon: 'grid', label: 'Dashboard' },
    { key: 'jobs', icon: 'briefcase', label: 'My jobs', count: mine.filter((b) => ['accepted', 'in_progress'].includes(b.status)).length },
    { key: 'bookings', icon: 'list', label: 'Bookings history' },
    { key: 'payout', icon: 'wallet', label: 'Payout' },
    { key: 'settlement', icon: 'calendar', label: 'Weekly settlement' },
    { key: 'feedback', icon: 'star', label: 'My feedback' },
  ]
  const popup = incoming[0]
  return (
    <PanelLayout role="Staff panel" items={items} active={tab} onNav={setTab} me={{ name: me.name, sub: `${me.area}, ${me.city}` }} onLogout={onLogout}>
      {tab !== 'dashboard' && <div className="topbar"><div><h1>{items.find((i) => i.key === tab).label}</h1>
        <p className="lead">{me.online ? `Waiting for requests in ${me.city}…` : 'Go online to receive job requests.'}</p></div>
        <OnlinePill me={me} /></div>}
      {tab === 'dashboard' && <StaffDash me={me} db={db} mine={mine} go={setTab} />}
      {tab === 'feedback' && <StaffFeedback db={db} />}
      {tab === 'jobs' && <Jobs list={mine.filter((b) => ['accepted', 'in_progress'].includes(b.status))} />}
      {tab === 'bookings' && <History list={mine} />}
      {tab === 'payout' && <Payout me={me} list={mine} />}
      {tab === 'settlement' && <Settlement me={me} db={db} mine={mine} />}
      {popup && <JobPopup b={popup} me={me} />}
    </PanelLayout>
  )
}

const OnlinePill = ({ me }) => (
  <div className={'online-pill' + (me.online ? ' on' : '')}><i /><b>{me.online ? 'Online' : 'Offline'}</b>
    <button className={'switch' + (me.online ? ' on' : '')} onClick={() => api.setOnline(me.id, !me.online)} aria-label="Toggle online" /></div>
)

function StaffDash({ me, db, mine, go }) {
  const done = mine.filter((b) => b.status === 'completed')
  const earn = (b) => Math.round(b.price * STAFF_SHARE)
  const pending = done.filter((b) => !b.settled && b.paymentStatus === 'paid')
  const unpaid = done.filter((b) => b.paymentStatus !== 'paid')
  const ratings = db.feedback.map((f) => f.rating)
  const active = mine.filter((b) => ['accepted', 'in_progress'].includes(b.status))
  const valid = mine.filter((b) => b.status !== 'cancelled' && b.status !== 'requested')
  const sumEarn = (l) => l.reduce((t, b) => t + earn(b), 0)
  const dist = [5, 4, 3, 2, 1].map((n) => ({ label: n + ' star', value: ratings.filter((r) => r === n).length }))
  const accepted = (b) => b.acceptedAt || b.createdAt
  return (
    <>
      <DashHead title={`Hi, ${me.name}!`} sub={me.online ? `You are online and waiting for requests in ${me.city}.` : 'Go online to start receiving job requests.'}
        meta={[{ label: 'City', value: me.city }, { label: 'Area', value: me.area }, { label: 'Rating', value: ratings.length ? avg(ratings).toFixed(1) + ' / 5' : 'New' }]}>
        <OnlinePill me={me} />
      </DashHead>
      {active.length > 0 && <div className="box approvals"><div className="topbar"><h3><Icon name="briefcase" size={18} /> You have {active.length} active job{active.length > 1 ? 's' : ''}</h3><button className="btn sm" onClick={() => go('jobs')}>Open jobs</button></div></div>}

      <DGrid>
        <Col s={8}>
          <MetricCard title="Earnings overview" sub="Your share of completed jobs. Click a number to change the chart." metrics={[
            { key: 'e', label: 'Earned', list: done, pick: earn, format: rupee, prefix: '₹' },
            { key: 'j', label: 'Jobs done', list: done, pick: () => 1 },
            { key: 'h', label: 'Hours worked', list: done, pick: (b) => b.mins / 60, format: (v) => (Math.round(v * 10) / 10).toString() },
            { key: 'a', label: 'Jobs accepted', list: mine, pick: () => 1, when: accepted },
          ]} />
        </Col>
        <Col s={4}>
          <Side>
            <Kpi label="Ready for settlement" display={rupee(sumEarn(pending))} delta={trend(pending, earn)} data={series('day', pending, earn)} />
            <Kpi label="Average rating" display={ratings.length ? avg(ratings).toFixed(1) : '0.0'} data={dist.slice().reverse()} kind="bars" color={PALETTE[3]} />
            <BigKpi label="Total earned" display={rupee(sumEarn(done))} delta={trend(done, earn)} data={series('week', done, earn)}
              text={`Your ${Math.round(STAFF_SHARE * 100)}% share of every completed booking, settled weekly by the admin team.`} />
          </Side>
        </Col>
      </DGrid>

      <DGrid>
        <Col s={5}>
          <ListCard title="Recent feedback" sub="What customers say about your work." empty="No feedback yet." rows={db.feedback.slice(0, 5).map((f) => ({
            key: f.id, title: f.customerName, sub: f.comment || 'No comment', value: '★ ' + f.rating }))} />
        </Col>
        <Col s={7}>
          <SplitCard title="Jobs by service" sub="The kinds of jobs you complete." data={countBy(done, 'serviceName')} empty="Complete jobs to see this chart." />
        </Col>
      </DGrid>

      <DGrid>
        <Col s={5}>
          <TilesCard title="At a glance" sub="Where your money and jobs stand." tiles={[
            { icon: 'rupee', label: 'Awaiting customer', value: rupee(sumEarn(unpaid)) },
            { icon: 'briefcase', label: 'Active jobs', value: active.length },
            { icon: 'wallet', label: 'Avg per job', value: rupee(done.length ? Math.round(sumEarn(done) / done.length) : 0) },
            { icon: 'star', label: 'Reviews', value: ratings.length },
          ]} />
          <RingsCard title="Performance" sub="How your jobs are going." rings={[
            { label: 'Jobs completed', pct: share(done.length, valid.length), value: `${done.length} of ${valid.length}` },
            { label: 'Customer rating', pct: ratings.length ? (avg(ratings) / 5) * 100 : 0, value: ratings.length ? avg(ratings).toFixed(1) + ' / 5' : 'No ratings' },
          ]} />
        </Col>
        <Col s={7}>
          <TableCard title="Recent jobs" sub="Your latest jobs and what you earn." head={['Service', 'Customer', 'Date', 'You earn', 'Status']} empty="No jobs yet."
            right={mine.length > 6 ? <button className="btn ghost sm" onClick={() => go('bookings')}>View all</button> : null}
            rows={mine.slice(0, 6).map((b) => [<span className="t"><Icon name={b.icon} size={16} />{b.serviceName}</span>, b.customerName, fmt(b.createdAt), <b>{inr(earn(b))}</b>, <Badge s={b.status} />])} />
        </Col>
      </DGrid>
    </>
  )
}

function StaffFeedback({ db }) {
  const dist = [5, 4, 3, 2, 1].map((n) => ({ label: n + ' star', value: db.feedback.filter((f) => f.rating === n).length }))
  return (
    <>
      <div className="stats"><div className="stat"><span className="si"><Icon name="star" size={20} /></span><small>Average rating</small><b><Count value={avg(db.feedback.map((f) => f.rating))} decimals={1} /></b></div>
        <div className="stat"><span className="si"><Icon name="users" size={20} /></span><small>Reviews</small><b><Count value={db.feedback.length} /></b></div></div>
      <div className="box"><h3>Rating breakdown</h3><HBars data={dist} /></div>
      {!db.feedback.length && <div className="box empty">Customer feedback will show up here.</div>}
      {db.feedback.map((f) => <div className="job" key={f.id}><div className="head"><Stars n={f.rating} /><small style={{ color: 'var(--mute)' }}>{fmt(f.createdAt)}</small></div><p>{f.comment || 'No comment'}</p><small style={{ color: 'var(--mute)' }}>{f.customerName} · booking #{f.bookingId}</small></div>)}
    </>
  )
}

function JobPopup({ b, me }) {
  const [msg, flash] = useMsg()
  const [eta, setEta] = useState(10)
  return (
    <div className="overlay"><div className="popup">
      <div className="ring"><Icon name="bell" size={40} /></div><h2>New job nearby!</h2><p style={{ color: 'var(--mute)' }}>A customer in {b.city} needs help</p>
      <div className="meta">
        <div><span>Service</span><b>{b.serviceName}</b></div><div><span>Duration</span><b>{b.mins} min</b></div>
        <div><span>Area</span><b>{b.area}</b></div><div><span>You earn</span><b>{inr(Math.round(b.price * STAFF_SHARE))}</b></div>
      </div>
      <div style={{ textAlign: 'left' }}><b style={{ fontSize: 13 }}>I will reach the customer in</b>
        <div className="eta-pick">{[10, 15].map((m) => <button type="button" key={m} className={eta === m ? 'on' : ''} onClick={() => setEta(m)}><Icon name="clock" size={16} />{m} min</button>)}</div></div>
      {msg && <div className="err">{msg}</div>}
      <div className="btns">
        <button className="btn bad" onClick={() => api.declineBooking(b.id, me.id)}>Decline</button>
        <button className="btn ok" onClick={async () => (await api.acceptBooking(b.id, eta)) || flash('Already taken by someone else')}>Accept</button>
      </div>
    </div></div>
  )
}

function Jobs({ list }) {
  const [reason, setReason] = useState({})
  if (!list.length) return <div className="box empty">No active jobs. Stay online for new requests.</div>
  const add = (id, kind) => (file) => api.addPhoto(id, kind, file)
  return list.map((b) => (
    <div className="job" key={b.id}>
      <div className="head"><span className="t"><Icon name={b.icon} size={18} />{b.serviceName} · {b.mins} min</span><Badge s={b.status} /></div>
      {b.status === 'accepted' && b.etaMins && <p className="t" style={{ margin: '2px 0 6px', color: 'var(--pink)' }}><Icon name="clock" size={16} />You promised to arrive in {b.etaMins} min</p>}
      <div style={{ color: 'var(--mute)', fontSize: 14 }}>#{b.id} · {b.customerName} · {b.customerPhone}<br /><Icon name="map" size={14} style={{ verticalAlign: -2 }} /> {b.address}, {b.area}, {b.city}</div>
      <div className="two" style={{ marginTop: 14 }}>
        <div><b>Before photos</b><Photos list={b.before} onAdd={add(b.id, 'before')} onRemove={(i) => api.removePhoto(b.id, 'before', i)} locked={b.status !== 'accepted' && b.status !== 'in_progress'} /></div>
        <div><b>After photos</b><Photos list={b.after} onAdd={add(b.id, 'after')} onRemove={(i) => api.removePhoto(b.id, 'after', i)} locked={b.status !== 'in_progress'} />
          {b.status === 'accepted' && <small style={{ color: 'var(--mute)' }}>Start the job to upload after photos</small>}</div>
      </div>
      {b.delay && <p className="t" style={{ color: 'var(--warn)' }}><Icon name="clock" size={16} />Delay reported: {b.delay}</p>}
      <div className="actions" style={{ marginTop: 10 }}>
        {b.status === 'accepted' && <button className="btn sm" disabled={!b.before.length} onClick={() => api.startJob(b.id)}>{b.before.length ? 'Start job' : 'Upload before photo to start'}</button>}
        {b.status === 'in_progress' && <button className="btn ok sm" disabled={!b.after.length} onClick={() => api.completeJob(b.id)}>{b.after.length ? 'Mark completed' : 'Upload after photo to complete'}</button>}
        <input style={{ width: 200, padding: '7px 12px' }} placeholder="Delay reason…" value={reason[b.id] || ''} onChange={(e) => setReason({ ...reason, [b.id]: e.target.value })} />
        <button className="btn ghost sm" disabled={!reason[b.id]} onClick={() => { api.reportDelay(b.id, reason[b.id]); setReason({ ...reason, [b.id]: '' }) }}>Report delay</button>
      </div>
    </div>))
}

// customer payment status with the method used
export const PayBadge = ({ b }) => b.paymentStatus === 'paid'
  ? <span className="badge b-paid">Paid · {b.paymentMethod === 'upi' ? 'UPI' : 'Cash'}</span>
  : <span className="badge b-unpaid">Awaiting payment</span>

const Table = ({ head, rows, empty }) => !rows.length ? <div className="box empty">{empty}</div> :
  <div className="box tablewrap"><table><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-label={head[j]}>{c}</td>)}</tr>)}</tbody></table></div>

function History({ list }) {
  return <Table empty="No bookings yet." head={['ID', 'Service', 'Customer', 'Date', 'Status', 'Payment', 'Earn']}
    rows={list.map((b) => [b.id, b.serviceName, b.customerName, fmt(b.createdAt), <Badge s={b.status} />, b.status === 'completed' ? <PayBadge b={b} /> : '—', inr(Math.round(b.price * STAFF_SHARE))])} />
}

function Payout({ me, list }) {
  const done = list.filter((b) => b.status === 'completed')
  const pending = done.filter((b) => !b.settled && b.paymentStatus === 'paid')
  const sum = (l) => l.reduce((t, b) => t + Math.round(b.price * STAFF_SHARE), 0)
  return (
    <>
      <div className="stats">
        <div className="stat"><span className="si"><Icon name="wallet" size={20} /></span><small>Total earned</small><b>{inr(sum(done))}</b></div>
        <div className="stat"><span className="si"><Icon name="clock" size={20} /></span><small>Pending payout</small><b>{inr(sum(pending))}</b></div>
        <div className="stat"><span className="si"><Icon name="check" size={20} /></span><small>Jobs completed</small><b>{done.length}</b></div></div>
      <Table empty="Complete jobs to see payouts." head={['Booking', 'Service', 'Completed', 'Payout', 'Customer payment', 'Settlement']}
        rows={done.map((b) => [b.id, b.serviceName, fmt(b.completedAt), inr(Math.round(b.price * STAFF_SHARE)), <PayBadge b={b} />, <Badge s={b.settled ? 'paid' : 'pending'} />])} />
    </>
  )
}

function Settlement({ me, db }) {
  const rows = db.settlements.filter((s) => s.staffId === me.id)
  return (
    <>
      <p className="lead">Earnings are settled every week by the admin team ({Math.round(STAFF_SHARE * 100)}% of the booking value).</p>
      <Table empty="No settlements yet." head={['Settlement', 'Date', 'Jobs', 'Gross', 'Your payout', 'Status']}
        rows={rows.map((s) => [s.id, fmt(s.createdAt), s.jobs, inr(s.gross), <b>{inr(s.payout)}</b>, <Badge s={s.status} />])} />
    </>
  )
}
