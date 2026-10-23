import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import Icon from './Icon.jsx'
import { useDB, api, ago } from '../store.js'

const NOTE_ICON = { booking: 'list', payment: 'wallet', staff: 'users', feedback: 'star', settlement: 'calendar' }
const TOAST_MS = 7000

// bell in the top bar: stored notification history + a toast whenever a new one arrives
export function NotificationBell() {
  const { notifications, forRole } = useDB()
  const [open, setOpen] = useState(false)
  const [toasts, setToasts] = useState([])
  const seen = useRef(null)                          // highest notification id already known; null until the first snapshot arrives
  const timers = useRef([])
  const box = useRef(null)
  const [cleared, setCleared] = useState(0)          // ids up to here count as read right away (before the server answers)
  const [fresh, setFresh] = useState(new Set())      // what was new when the panel was opened, so it stays highlighted
  const isNew = (n) => !n.read && n.id > cleared
  const unread = notifications.filter(isNew).length
  const dismiss = (id) => setToasts((t) => t.filter((x) => x.id !== id))

  // Toast only what arrives AFTER the first snapshot of this login. Older unread items just show on the badge,
  // so opening the panel never floods the screen with pop-ups.
  useEffect(() => {
    if (!forRole) return
    const top = Math.max(0, ...notifications.map((n) => n.id))
    if (seen.current === null) { seen.current = top; return }
    const incoming = notifications.filter((n) => n.id > seen.current && !n.read)
    seen.current = Math.max(seen.current, top)
    if (!incoming.length) return
    setToasts((t) => [...t.filter((x) => !incoming.some((n) => n.id === x.id)), ...incoming].slice(-4))
    incoming.forEach((n) => timers.current.push(setTimeout(() => dismiss(n.id), TOAST_MS)))
  }, [notifications, forRole])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
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
      {/* rendered on <body>: the sticky top bar uses backdrop-filter, which would trap and clip fixed-position children */}
      {createPortal(
        <div className="toasts" role="status" aria-live="polite">{toasts.map((n) => (
          <div key={n.id} className={'toast tt-' + (n.type || 'info')} onClick={() => { setOpen(true); dismiss(n.id) }}>
            <span className="ni"><Icon name={NOTE_ICON[n.type] || 'bell'} size={18} /></span>
            <div className="toast-t"><b>{n.title}</b><p>{n.body}</p></div>
            <button className="toast-x" aria-label="Dismiss" onClick={(e) => { e.stopPropagation(); dismiss(n.id) }}><Icon name="close" size={14} /></button>
            <i className="toast-bar" style={{ animationDuration: TOAST_MS + 'ms' }} />
          </div>))}</div>, document.body)}
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

const SHORT = { 'Staff & Registrations': 'Staff', 'Cities & Areas': 'Cities', 'Users & Permissions': 'Users', 'Book a service': 'Book', 'My bookings': 'Bookings', 'Bookings history': 'History', 'Weekly settlement': 'Settlement', 'My feedback': 'Feedback' }
const MOBILE_TABS = 5   // bottom bar shows this many slots; with more menus the last slot becomes "More"

export function PanelLayout({ role, items, active, onNav, me, onLogout, children }) {
  const [menu, setMenu] = useState(false)
  const [more, setMore] = useState(false)
  const primary = items.length > MOBILE_TABS ? items.slice(0, MOBILE_TABS - 1) : items
  const rest = items.length > MOBILE_TABS ? items.slice(MOBILE_TABS - 1) : []
  const go = (k) => { onNav(k); setMore(false); setMenu(false); window.scrollTo?.({ top: 0 }) }
  useEffect(() => { document.body.style.overflow = more ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [more])
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
        <div className="me">
          <div className="me-row"><span className="me-av">{me.name?.[0]}</span><div className="me-txt"><b>{me.name}</b><span>{me.sub}</span></div></div>
          <button className="btn ghost sm" style={{ marginTop: 12, width: '100%' }} onClick={onLogout}>Log out</button></div>
      </aside>
      <main className="main">
        <div className="mainbar">
          <Link to="/" className="logo mob-only">clickit</Link><span className="mob-only role-chip">{role}</span>
          <div className="pcrumb desk-only"><span>{role}</span><Icon name="chevronRight" size={14} /><b>{items.find((i) => i.key === active)?.label}</b></div>
          <span className="grow" />
          <NotificationBell />
          <button className="avatar mob-only" onClick={() => setMenu(!menu)} aria-label="Account">{me.name?.[0]}</button>
          {menu && <div className="prof-menu" onClick={() => setMenu(false)}><b>{me.name}</b><small>{me.sub}</small><button className="btn sm" onClick={onLogout}>Log out</button></div>}
        </div>
        <div className="page" key={active}>{children}</div>
      </main>

      {/* phones: app-style bottom tab bar (the desktop sidebar is hidden there) */}
      <nav className="appnav" aria-label="Main menu">
        {primary.map((i) => (
          <button key={i.key} className={active === i.key ? 'on' : ''} onClick={() => go(i.key)}>
            <span className="ai"><Icon name={i.icon} size={22} />{i.count > 0 && <em>{i.count}</em>}</span><span className="al">{SHORT[i.label] || i.label}</span>
          </button>))}
        {rest.length > 0 && (
          <button className={rest.some((i) => i.key === active) ? 'on' : ''} onClick={() => setMore(true)}>
            <span className="ai"><Icon name="menu" size={22} />{rest.some((i) => i.count > 0) && <em>•</em>}</span><span className="al">More</span>
          </button>)}
      </nav>
      {more && (
        <div className="more-ov" onClick={() => setMore(false)}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            <i className="grab" />
            <div className="more-me"><span className="me-av">{me.name?.[0]}</span><div><b>{me.name}</b><small>{me.sub}</small></div></div>
            <div className="more-grid">{rest.map((i) => (
              <button key={i.key} className={active === i.key ? 'on' : ''} onClick={() => go(i.key)}>
                <span className="ai"><Icon name={i.icon} size={22} />{i.count > 0 && <em>{i.count}</em>}</span><span>{SHORT[i.label] || i.label}</span></button>))}</div>
            <button className="btn ghost" style={{ width: '100%' }} onClick={onLogout}>Log out</button>
          </div>
        </div>)}
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
