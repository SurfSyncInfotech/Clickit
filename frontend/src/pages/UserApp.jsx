import { useEffect, useState } from 'react'
import { useDB, api, session, inr, fmt } from '../store.js'
import { AuthShell, PanelLayout, Badge, Photos } from '../components/Shared.jsx'
import Icon, { Stars } from '../components/Icon.jsx'
import { SERVICE_PHOTO, IMG } from '../content.js'
import { Count, BarChart, Donut, lastDays, countBy } from '../components/Charts.jsx'

const photoFor = (icon, w = 600) => (SERVICE_PHOTO[icon] || IMG.clean1)(w)

export default function UserApp() {
  const [me, setMe] = useState(() => session.get('user'))
  const login = (u) => setMe(session.get('user') || u)
  if (!me) return <UserAuth onLogin={login} />
  return <UserPanel me={me} onLogout={() => { session.clear('user'); setMe(null) }} />
}

function UserAuth({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [f, setF] = useState({ name: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { onLogin(mode === 'login' ? await api.userLogin(f.phone, f.password) : await api.userSignup(f.name, f.phone, f.password)) }
    catch (x) { setErr(x.message) }
  }
  return (
    <AuthShell title={mode === 'login' ? 'Welcome back' : 'Create your account'} art="Get house help in 10 min" sub="Book trained & verified experts at your doorstep."
      bullets={['Nearest expert accepts instantly', 'Before & after photos for every job', 'Transparent pricing']} image={IMG.heroA(1200)}
      floats={[{ icon: 'clock', title: 'Expert arrives in 10 min', sub: 'Instant booking' }, { icon: 'badge', title: 'Background verified', sub: 'Every Expert' }, { icon: 'camera', title: 'Before and after photos', sub: 'On every job' }]}>
      <p className="sub">{mode === 'login' ? 'Log in to book an expert' : 'Sign up in 10 seconds'}</p>
      <div className="tabs"><button className={mode === 'login' ? 'on' : ''} onClick={() => setMode('login')}>Log in</button><button className={mode === 'signup' ? 'on' : ''} onClick={() => setMode('signup')}>Sign up</button></div>
      <form onSubmit={submit}>
        {mode === 'signup' && <><label>Full name</label><input required value={f.name} onChange={set('name')} /></>}
        <label>Phone number</label><input required value={f.phone} onChange={set('phone')} inputMode="numeric" />
        <label>Password</label><input required type="password" value={f.password} onChange={set('password')} />
        {err && <div className="err">{err}</div>}
        <button className="btn" style={{ width: '100%', marginTop: 20 }}>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
    </AuthShell>
  )
}

function UserPanel({ me, onLogout }) {
  const [tab, setTab] = useState('dashboard')
  const db = useDB()
  const mine = db.bookings.filter((b) => b.customerId === me.id)
  const active = mine.filter((b) => ['requested', 'accepted', 'in_progress'].includes(b.status)).length
  const dueCount = mine.filter((b) => b.status === 'completed' && b.paymentStatus === 'unpaid').length
  const items = [{ key: 'dashboard', icon: 'grid', label: 'Dashboard' }, { key: 'book', icon: 'sparkle', label: 'Book a service' }, { key: 'orders', icon: 'list', label: 'My bookings', count: active + dueCount }, { key: 'feedback', icon: 'star', label: 'Feedback' }]
  return (
    <PanelLayout role="User panel" items={items} active={tab} onNav={setTab} me={{ name: me.name, sub: me.phone }} onLogout={onLogout}>
      {tab === 'dashboard' && <UserDash me={me} mine={mine} db={db} go={setTab} />}
      {tab === 'book' && <Book me={me} db={db} done={() => setTab('orders')} />}
      {tab === 'orders' && <Orders list={mine} db={db} />}
      {tab === 'feedback' && <Feedback list={mine.filter((b) => b.status === 'completed')} db={db} />}
    </PanelLayout>
  )
}

function UserDash({ me, mine, db, go }) {
  const done = mine.filter((b) => b.status === 'completed')
  const live = mine.filter((b) => ['requested', 'accepted', 'in_progress'].includes(b.status))
  const mins = done.reduce((t, b) => t + b.mins, 0)
  const due = done.filter((b) => b.paymentStatus === 'unpaid')
  return (
    <>
      <div className="topbar"><div><h1>Hello, {me.name}</h1><p className="lead">Your home help at a glance.</p></div><button className="btn glow" onClick={() => go('book')}>Book a service <Icon name="arrowRight" size={18} /></button></div>
      <div className="stats">
        <div className="stat"><span className="si"><Icon name="list" size={20} /></span><small>Total bookings</small><b><Count value={mine.length} /></b></div>
        <div className="stat"><span className="si"><Icon name="clock" size={20} /></span><small>Active now</small><b><Count value={live.length} /></b></div>
        <div className="stat"><span className="si"><Icon name="wallet" size={20} /></span><small>Total spent</small><b><Count value={done.reduce((t, b) => t + b.price, 0)} prefix="₹" /></b></div>
        <div className="stat"><span className="si"><Icon name="clock" size={20} /></span><small>Hours of help</small><b><Count value={mins / 60} decimals={1} /></b></div>
        {due.length > 0 && <div className="stat"><span className="si"><Icon name="rupee" size={20} /></span><small>Payment due</small><b style={{ color: 'var(--pink)' }}><Count value={due.reduce((t, b) => t + b.price, 0)} prefix="₹" /></b></div>}
      </div>
      {due.map((b) => (
        <div key={b.id} className="box approvals"><div className="topbar"><h3 className="t"><Icon name="wallet" size={18} />Pay {inr(b.price)} for {b.serviceName} (#{b.id})</h3><button className="btn sm" onClick={() => go('orders')}>Pay now</button></div></div>))}
      {live.map((b) => (
        <div key={b.id} className="box approvals"><div className="topbar"><h3 className="t"><Icon name={b.icon} size={18} />{b.serviceName} <Badge s={b.status} /></h3><button className="btn ghost sm" onClick={() => go('orders')}>Track</button></div>
          <small style={{ color: 'var(--mute)' }}>{b.status === 'requested' ? `Finding the nearest expert in ${b.city}…` : `Expert: ${db.staff.find((s) => s.id === b.staffId)?.name || 'assigned'}`}</small></div>))}
      <div className="gridc">
        <div className="box"><h3>Spending, last 7 days</h3><BarChart data={lastDays(7, done, (b) => b.price)} format={(v) => '₹' + v} /></div>
        <div className="box"><h3>Bookings by service</h3>{mine.length ? <Donut data={countBy(mine, 'serviceName')} /> : <div className="empty">Book your first service to see this.</div>}</div>
      </div>
    </>
  )
}

function Book({ me, db, done }) {
  const cities = db.cities.filter((c) => c.enabled)
  const [svc, setSvc] = useState(null)
  const [mult, setMult] = useState(1)
  const [city, setCity] = useState(cities[0]?.name || '')
  const [area, setArea] = useState('')
  const [address, setAddress] = useState('')
  const areas = db.cities.find((c) => c.name === city)?.areas || []
  const price = svc ? svc.price * mult : 0
  const [err, setErr] = useState('')
  const submit = async (e) => {
    e.preventDefault(); setErr('')
    try { await api.requestBooking({ serviceId: svc.id, mult, city, area, address }); done() }
    catch (x) { setErr(x.message) }
  }
  return (
    <>
      <h1>Book a service</h1><p className="lead">Choose a service, duration and address – the nearest expert is notified instantly.</p>
      <div className="svc-pick">
        {db.services.filter((s) => s.active).map((s) => (
          <div key={s.id} className={'pick' + (svc?.id === s.id ? ' on' : '')} onClick={() => setSvc(s)}>
            <img src={s.image || photoFor(s.icon)} alt={s.name} loading="lazy" />
            <div className="tx"><h3><Icon name={s.icon} size={18} />{s.name}</h3><p>{s.desc}</p><b>{inr(s.price)} · {s.mins} min</b></div></div>))}
      </div>
      {svc && (
        <form className="box" onSubmit={submit}>
          <h3 className="t" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name={svc.icon} size={20} />{svc.name}</h3>
          <label>Select duration</label>
          <div className="tabs" style={{ maxWidth: 380 }}>{[1, 2, 3].map((m) => <button type="button" key={m} className={mult === m ? 'on' : ''} onClick={() => setMult(m)}>{svc.mins * m} min</button>)}</div>
          <div className="form-grid">
            <div><label>City</label><select value={city} onChange={(e) => { setCity(e.target.value); setArea('') }}>{cities.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
            <div><label>Area</label><select required value={area} onChange={(e) => setArea(e.target.value)}><option value="">Select area</option>{areas.map((a) => <option key={a}>{a}</option>)}</select></div>
          </div>
          <label>Full address</label><textarea required rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, building, landmark" />
          {err && <div className="err">{err}</div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
            <b style={{ fontSize: 22 }}>{inr(price)}</b><button className="btn glow">Request expert <Icon name="arrowRight" size={18} /></button></div>
        </form>)}
    </>
  )
}

// live countdown to the arrival time the Expert promised when accepting
function Arrival({ b }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 15000); return () => clearInterval(t) }, [])
  const due = new Date(b.acceptedAt).getTime() + b.etaMins * 60000
  const left = Math.ceil((due - now) / 60000)
  return (
    <div className="arrival"><span className="ni"><Icon name="clock" size={18} /></span>
      <div><b>{left > 0 ? `Arriving in about ${left} min` : 'Your Expert should be arriving now'}</b><small>Promised: reaches you within {b.etaMins} min of accepting</small></div></div>
  )
}

function Orders({ list, db }) {
  return (
    <>
      <h1>My bookings</h1><p className="lead">Track your requests live.</p>
      {!list.length && <div className="box empty">No bookings yet.</div>}
      {list.map((b) => {
        const staff = db.staff.find((s) => s.id === b.staffId)
        return (
          <div className="job" key={b.id}>
            <div className="head"><span className="t"><Icon name={b.icon} size={18} />{b.serviceName} · {b.mins} min</span><Badge s={b.status} /></div>
            <div style={{ color: 'var(--mute)', fontSize: 14 }}>#{b.id} · {fmt(b.createdAt)} · {b.area}, {b.city} · {inr(b.price)}</div>
            {b.status === 'requested' && <p className="t" style={{ margin: '10px 0' }}><Icon name="refresh" size={16} />Finding the nearest expert in {b.city}…</p>}
            {b.status === 'accepted' && b.etaMins && <Arrival b={b} />}
            {staff && <p className="t" style={{ margin: '10px 0' }}><Icon name="user" size={16} />Expert: {staff.name} · {staff.phone}</p>}
            {b.delay && <p className="t" style={{ margin: '6px 0', color: 'var(--warn)' }}><Icon name="clock" size={16} />Delay reported: {b.delay}</p>}
            {(b.before.length > 0 || b.after.length > 0) && (
              <div className="two job" style={{ border: 0, padding: 0, marginBottom: 0 }}>
                <div><b style={{ fontSize: 13 }}>Before</b><Photos list={b.before} locked /></div>
                <div><b style={{ fontSize: 13 }}>After</b><Photos list={b.after} locked /></div>
              </div>)}
            {b.status === 'completed' && (b.paymentStatus === 'paid'
              ? <div className="paid-line"><Icon name="check" size={18} />Paid {inr(b.price)} by {b.paymentMethod === 'upi' ? `UPI (${b.upiRef})` : 'cash'}</div>
              : <PayBox b={b} />)}
            {['requested', 'accepted'].includes(b.status) && <button className="btn bad sm" onClick={() => api.cancelBooking(b.id)}>Cancel booking</button>}
          </div>)
      })}
    </>
  )
}

// choose cash or UPI after the job is completed
function PayBox({ b }) {
  const [method, setMethod] = useState('upi')
  const [upi, setUpi] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const pay = async () => {
    setErr(''); setBusy(true)
    try { await api.payBooking(b.id, method, upi) } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }
  return (
    <div className="paybox">
      <h4><span className="t"><Icon name="wallet" size={20} />Payment due</span><b>{inr(b.price)}</b></h4>
      <div className="paymethods">
        <button type="button" className={'pm' + (method === 'upi' ? ' on' : '')} onClick={() => setMethod('upi')}><span className="ni"><Icon name="phone" size={18} /></span><div><b>UPI</b><small>Pay with any UPI app</small></div></button>
        <button type="button" className={'pm' + (method === 'cash' ? ' on' : '')} onClick={() => setMethod('cash')}><span className="ni"><Icon name="rupee" size={18} /></span><div><b>Cash</b><small>Hand it to your Expert</small></div></button>
      </div>
      {method === 'upi' && <><label>Your UPI id</label><input placeholder="name@upi" value={upi} onChange={(e) => setUpi(e.target.value)} /></>}
      {err && <div className="err">{err}</div>}
      <button className="btn glow" style={{ marginTop: 14 }} disabled={busy || (method === 'upi' && !upi)} onClick={pay}>{busy ? 'Processing…' : method === 'upi' ? `Pay ${inr(b.price)} with UPI` : `Confirm cash payment of ${inr(b.price)}`}</button>
    </div>
  )
}

function Feedback({ list, db }) {
  const [state, setState] = useState({})
  return (
    <>
      <h1>Feedback</h1><p className="lead">Rate completed jobs.</p>
      {!list.length && <div className="box empty">Nothing to rate yet.</div>}
      {list.map((b) => {
        const done = db.feedback.find((f) => f.bookingId === b.id)
        const s = state[b.id] || { rating: 0, comment: '' }
        return (
          <div className="job" key={b.id}>
            <b className="t"><Icon name={b.icon} size={18} />{b.serviceName}</b> <span style={{ color: 'var(--mute)' }}>#{b.id}</span>
            {done ? <p style={{ marginTop: 8 }}><Stars n={done.rating} /> “{done.comment || 'No comment'}”</p> : (
              <>
                <div className="stars">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={s.rating >= n ? 'on' : ''} onClick={() => setState({ ...state, [b.id]: { ...s, rating: n } })}><Icon name="star" size={28} fill /></button>)}</div>
                <textarea rows={2} placeholder="Tell us more (optional)" value={s.comment} onChange={(e) => setState({ ...state, [b.id]: { ...s, comment: e.target.value } })} />
                <button className="btn sm" style={{ marginTop: 10 }} disabled={!s.rating} onClick={() => api.addFeedback(b.id, s.rating, s.comment)}>Submit feedback</button>
              </>)}
          </div>)
      })}
    </>
  )
}
