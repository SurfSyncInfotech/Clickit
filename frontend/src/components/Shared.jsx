import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useDB, api, ago } from '../store.js'

const NOTE_ICON = { booking: 'list', payment: 'wallet', staff: 'users', feedback: 'star', settlement: 'calendar' }

// bell in the top bar: stored notification history + a toast whenever a new one arrives
export function NotificationBell() {
  const { notifications } = useDB()
  const [open, setOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const seen = useRef(Math.max(0, ...notifications.map((n) => n.id)))
  const box = useRef(null)
  const [cleared, setCleared] = useState(0)          // ids up to here count as read right away (before the server answers)
  const [fresh, setFresh] = useState(new Set())      // what was new when the panel was opened, so it stays highlighted
  const isNew = (n) => !n.read && n.id > cleared
  const unread = notifications.filter(isNew).length

  useEffect(() => {
    const incoming = notifications.filter((n) => n.id > seen.current && !n.read)
    if (!incoming.length) return
    seen.current = Math.max(...notifications.map((n) => n.id))
    setToasts((t) => [...t, ...incoming].slice(-3))
    incoming.forEach((n) => setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 6000))
  }, [notifications])
  // seeing the notifications counts as reading them: clear the badge when the panel opens, and for anything arriving while it is open
  useEffect(() => {
    if (!open || !unread) return
    setFresh((f) => new Set([...f, ...notifications.filter(isNew).map((n) => n.id)]))
    setCleared(Math.max(0, ...notifications.map((n) => n.id)))
    api.markRead()
  }, [open, notifications]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <>
      <div className="bell-wrap" ref={box}>
        <button className={'bell' + (unread ? ' ring-on' : '')} onClick={() => { if (open) setFresh(new Set()); setOpen(!open) }} aria-label="Notifications">
          <Icon name="bell" size={22} />{unread > 0 && <span className="dot-count">{unread > 9 ? '9+' : unread}</span>}
        </button>
        {open && (
          <div className="note-panel">
            <div className="note-head"><b>Notifications</b></div>
            <div className="note-list">
              {!notifications.length && <div className="empty">No notifications yet.</div>}
              {notifications.map((n) => (
                <div key={n.id} className={'note' + (fresh.has(n.id) ? ' new' : '')}>
                  <span className="ni"><Icon name={NOTE_ICON[n.type] || 'bell'} size={18} /></span>
                  <div><b>{n.title}</b><p>{n.body}</p><small>{ago(n.createdAt)}</small></div>
                  {fresh.has(n.id) && <i className="udot" />}
                </div>))}
            </div>
          </div>)}
      </div>
      <div className="toasts">{toasts.map((n) => (
        <div key={n.id} className="toast" onClick={() => { setOpen(true); setToasts((t) => t.filter((x) => x.id !== n.id)) }}>
          <span className="ni"><Icon name={NOTE_ICON[n.type] || 'bell'} size={18} /></span><div><b>{n.title}</b><p>{n.body}</p></div></div>))}</div>
    </>
  )
}

export const Badge = ({ s }) => <span className={`badge b-${s}`}>{s.replace('_', ' ')}</span>

// split login screen used by all three panels
export function AuthShell({ title, sub, art, bullets, children, image, floats = [] }) {
  return (
    <div className="auth">
      <div className="auth-mhead"><Link to="/" className="logo">clickit</Link></div>
      <div className="auth-art">
        {image && <img className="bg" src={image} alt="" />}
        <div className="blob b1" /><div className="blob b2" />
        <div className="art-in">
          <Link to="/" className="logo">clickit</Link>
          <h1 className="fade-up">{art}</h1>
          <p className="fade-up d1">{sub}</p>
          <ul>{bullets.map((b, i) => <li key={b} className="fade-up" style={{ animationDelay: 0.3 + i * 0.12 + 's' }}><Icon name="check" size={18} />{b}</li>)}</ul>
        </div>
        {floats.map((f, i) => (
          <div key={f.title} className={'float-card fc' + (i + 1)}><span className="fi"><Icon name={f.icon} size={20} /></span><div><b>{f.title}</b><small>{f.sub}</small></div></div>))}
      </div>
      <div className="auth-form"><div className="auth-box"><h2>{title}</h2>{children}</div></div>
    </div>
  )
}

export function PanelLayout({ role, items, active, onNav, me, onLogout, children }) {
  const [menu, setMenu] = useState(false)
  return (
    <div className="panel">
      <aside className="side">
        <Link to="/" className="logo">clickit</Link>
        <div className="role">{role}</div>
        <nav>{items.map((i) => (
          <button key={i.key} className={active === i.key ? 'on' : ''} onClick={() => onNav(i.key)}>
            <Icon name={i.icon} size={18} />{i.label}{i.count > 0 && <span className="chip" style={{ marginLeft: 'auto', padding: '1px 9px' }}>{i.count}</span>}
          </button>))}
        </nav>
        <div className="me"><b>{me.name}</b><span style={{ color: 'var(--mute)' }}>{me.sub}</span>
          <button className="btn ghost sm" style={{ marginTop: 10, width: '100%' }} onClick={onLogout}>Log out</button></div>
      </aside>
      <main className="main">
        <div className="mainbar">
          <Link to="/" className="logo mob-only">clickit</Link><span className="mob-only role-chip">{role}</span>
          <span className="grow" />
          <NotificationBell />
          <button className="avatar mob-only" onClick={() => setMenu(!menu)} aria-label="Account">{me.name?.[0]}</button>
          {menu && <div className="prof-menu" onClick={() => setMenu(false)}><b>{me.name}</b><small>{me.sub}</small><button className="btn sm" onClick={onLogout}>Log out</button></div>}
        </div>
        <div className="page" key={active}>{children}</div>
      </main>
    </div>
  )
}

export function Photos({ list, onAdd, onRemove, locked }) {
  return (
    <div className="photos">
      {list.map((src, i) => (
        <div className="phwrap" key={i}><img className="ph" src={src} alt="" />
          {!locked && onRemove && <button onClick={() => onRemove(i)} aria-label="Remove"><Icon name="close" size={12} /></button>}</div>))}
      {!locked && onAdd && (
        <label className="upload"><Icon name="camera" size={22} />Upload
          <input type="file" accept="image/*" hidden multiple onChange={async (e) => { for (const f of e.target.files) await onAdd(f); e.target.value = '' }} />
        </label>)}
      {locked && !list.length && <span style={{ color: 'var(--mute)', fontSize: 13 }}>No photos</span>}
    </div>
  )
}

// image picker used by service / city forms. `onUpload(file)` returns the stored url.
export function ImageField({ value, onChange, upload, label = 'Image' }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const f = e.target.files[0]; e.target.value = ''
    if (!f) return
    setBusy(true); setErr('')
    try { onChange(await upload(f)) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div>
      <label>{label}</label>
      <div className="imgfield">
        {value ? <img src={value} alt="" /> : <div className="ph-empty"><Icon name="camera" size={26} /></div>}
        <div className="actions">
          <label className="btn ghost sm" style={{ margin: 0, cursor: 'pointer' }}><Icon name="upload" size={16} />{busy ? 'Uploading…' : value ? 'Change image' : 'Upload image'}
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} /></label>
          {value && <button type="button" className="btn ghost sm" onClick={() => onChange(null)}>Remove</button>}
        </div>
      </div>
      {err && <div className="err">{err}</div>}
    </div>
  )
}

export function Modal({ onClose, children }) {
  return <div className="overlay" onClick={onClose}><div className="modal" onClick={(e) => e.stopPropagation()}>{children}</div></div>
}

export const useMsg = () => {
  const [m, setM] = useState('')
  return [m, (x) => { setM(x); setTimeout(() => setM(''), 3000) }]
}
