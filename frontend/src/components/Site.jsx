import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import Icon, { Stars } from './Icon.jsx'
import { SERVICE_LINKS, CITIES, slug, cityImg, REVIEWS, FAQS, SERVICE_PHOTO, IMG } from '../content.js'
import { useDB, inr } from '../store.js'
import { Count } from './Charts.jsx'

// cities managed by the admin (static list only until the first response arrives)
export function useCities() {
  const { cities } = useDB()
  return cities.length ? cities : CITIES.map((name, i) => ({ id: i, name, enabled: false, image: null, areas: [] }))
}

// ---- scroll reveal ----
export function Reveal({ children, dir = '', delay = 0, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  const [on, setOn] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) return setOn(true)
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect() } }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <Tag ref={ref} className={`reveal ${dir} ${on ? 'in' : ''} ${className}`} style={{ transitionDelay: delay + 'ms' }} {...rest}>{children}</Tag>
}

export const Logo = () => <Link to="/" className="logo">clickit</Link>

// ---- navbar ----
export function Nav() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const cities = useCities()
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8)
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  return (
    <>
      <header className={'nav' + (scrolled ? ' scrolled' : '')}>
        <div className="wrap">
          <Logo />
          <nav className="nav-links">
            <div className="dd"><button>Home Services <Icon name="chevronDown" size={14} /></button>
              <div className="menu">{SERVICE_LINKS.map((s) => <Link key={s.to} to={s.to}>{s.label}</Link>)}</div></div>
            <div className="dd"><button>Cities <Icon name="chevronDown" size={14} /></button>
              <div className="menu cols">{cities.map((c) => <Link key={c.id} to={`/house-help/${slug(c.name)}`}>{c.name}</Link>)}</div></div>
            <Link to="/blog">Blog</Link>
            <Link to="/about">About</Link>
          </nav>
          <Link to="/user" className="btn sm nav-cta desk" style={{ padding: '12px 18px', fontSize: 14 }}>Book Now</Link>
          <button className="burger" aria-label="Menu" onClick={() => setOpen(true)}><Icon name="menu" size={26} /></button>
        </div>
      </header>
      {open && (
        <div className="drawer">
          <div className="top"><Logo /><button className="burger" aria-label="Close" onClick={() => setOpen(false)}><Icon name="close" size={26} /></button></div>
          <h4>Home Services</h4>{SERVICE_LINKS.map((s) => <Link className="l" key={s.to} to={s.to}>{s.label}</Link>)}
          <h4>Cities</h4>{cities.slice(0, 8).map((c) => <Link className="l" key={c.id} to={`/house-help/${slug(c.name)}`}>{c.name}</Link>)}
          <h4>More</h4><Link className="l" to="/blog">Blog</Link><Link className="l" to="/about">About</Link><Link className="l" to="/faq">FAQs</Link>
          <Link to="/user" className="btn" style={{ width: '100%', marginTop: 24 }}>Book Now</Link>
        </div>)}
    </>
  )
}

// ---- footer ----
export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="grid">
          <div>
            <div className="big">Book trusted house help<br />in 10 minutes.</div>
            <Link to="/user" className="btn glow">Book Now <Icon name="arrowRight" size={18} /></Link>
          </div>
          <div><h4>Pages</h4><Link to="/about">About Us</Link><Link to="/blog">Blog</Link><Link to="/staff">Join as Expert</Link><Link to="/legal/terms-and-conditions">Terms & Conditions</Link><Link to="/legal/privacy-policy">Privacy Policy</Link><Link to="/legal/refund-and-cancellation">Refund & Cancellation</Link></div>
          <div><h4>Contact</h4><a href="mailto:help@clickit.com">help@clickit.com</a><h4 style={{ marginTop: 22 }}>Address</h4><span style={{ fontSize: 15 }}>Clickit Technologies,<br />Andheri East, Mumbai</span></div>
          <div><h4>Socials</h4><div className="socials"><a href="#" aria-label="Facebook"><Icon name="facebook" size={18} /></a><a href="#" aria-label="Instagram"><Icon name="instagram" size={18} /></a><a href="#" aria-label="X"><Icon name="x" size={18} /></a></div>
            <h4 style={{ marginTop: 22 }}>Panels</h4><Link to="/user">User login</Link><Link to="/staff">Staff login</Link><Link to="/superadmin">Admin login</Link></div>
        </div>
        <div className="copy">© 2026 Clickit Technologies Pvt. Ltd. All rights reserved.</div>
      </div>
      <div className="water" aria-hidden="true">clickit</div>
    </footer>
  )
}

// bottom tab bar: makes the website feel like an app on phones
export function TabBar() {
  const tabs = [['/', 'home', 'Home', true], ['/house-help', 'sparkle', 'Services'], ['/blog', 'list', 'Blog'], ['/about', 'info', 'About']]
  return (
    <nav className="tabbar" aria-label="Primary">
      {tabs.map(([to, ic, label, end]) => <NavLink key={to} to={to} end={end} className={({ isActive }) => 'tab' + (isActive ? ' on' : '')}><Icon name={ic} size={22} /><span>{label}</span></NavLink>)}
      <Link to="/user" className="tab book"><span className="bk"><Icon name="calendar" size={22} /></span><span>Book</span></Link>
    </nav>
  )
}

export function SiteLayout() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return <><Nav /><main className="page" key={pathname}><Outlet /></main><Footer /><TabBar /></>
}

// ---- FAQ accordion ----
export function Accordion({ items }) {
  const [open, setOpen] = useState(0)
  return (
    <div className="faq">
      {items.map((q, i) => (
        <div key={q} className={'faq-item' + (open === i ? ' open' : '')}>
          <button onClick={() => setOpen(open === i ? -1 : i)}>{q}<Icon name="chevronDown" size={22} /></button>
          <div className="faq-body"><div><p>{FAQS[q]}</p></div></div>
        </div>))}
    </div>
  )
}
export function FaqSection({ items }) {
  return (
    <section className="sec" id="faq"><div className="wrap">
      <Reveal><h2 className="t">Frequently Asked Questions</h2></Reveal>
      <Accordion items={items} />
      <div className="faq-more"><p>Have more questions? We have answers.</p><Link to="/faq" className="btn">See all FAQs</Link></div>
    </div></section>
  )
}

// ---- testimonials (two counter-moving rows) ----
export function Reviews({ title = 'Rated 4.8+ by Happy Families', tint = true }) {
  const row = (list, rev) => (
    <div className={'marq' + (rev ? ' rev' : '')}><div className="track">{[...list, ...list].map(([q, n, c], i) => (
      <div className="rev" key={i}><Stars size={16} /><p>“{q}”</p><b>{n}</b><small>{c}</small></div>))}</div></div>
  )
  return (
    <section className={'sec' + (tint ? ' tint' : '')} style={{ overflow: 'hidden' }}>
      <div className="wrap"><Reveal><h2 className="t">{title}</h2></Reveal></div>
      {row(REVIEWS.slice(0, 4).concat(REVIEWS.slice(4)))}{row([...REVIEWS].reverse(), true)}
    </section>
  )
}

// ---- how it works with animated phone mockups ----
const Phone = ({ n }) => (
  <div className="phone-stage"><div className="phone">
    {n === 0 && <><h5>Choose service</h5>{[['broom', 'House cleaning', 1], ['dishes', 'Utensils cleaning'], ['bath', 'Bathroom cleaning']].map(([i, t, on]) => <div key={t} className={'opt' + (on ? ' on' : '')}><Icon name={i} size={14} />{t}</div>)}<div className="pbtn">Continue</div></>}
    {n === 1 && <><h5>Select duration</h5><div className="chips"><span>30 min</span><span className="on">60 min</span><span>90 min</span><span>2 hr</span></div><h5>Time slot</h5><div className="opt on"><Icon name="clock" size={14} />Instant, 10 min</div><div className="opt"><Icon name="calendar" size={14} />Schedule</div><div className="pbtn">Request Expert</div></>}
    {n === 2 && <><div className="eta"><b>10</b><small>minutes away</small></div><div className="av">SP</div><h5 style={{ textAlign: 'center' }}>Sunita is on her way</h5><div className="opt on"><Icon name="badge" size={14} />Verified Expert</div></>}
  </div></div>
)
export function Steps() {
  const S = [['Choose your service', 'Open Clickit and select instant or scheduled booking.'], ['Select duration', 'Select a time, set a duration and get multiple tasks done in one booking.'], ['Sit back and relax', 'A trained Expert arrives on time and handles everything just the way you want.']]
  return (
    <section className="sec" style={{ overflow: 'hidden' }}><div className="wrap">
      <Reveal><h2 className="t">In Simple Steps Get Quick Help</h2></Reveal>
      <div className="steps">{S.map(([t, d], i) => (
        <Reveal key={t} dir={i === 0 ? 'left' : i === 2 ? 'right' : ''} delay={i * 120} className="step"><Phone n={i} /><div className="lbl">STEP {i + 1}</div><h3>{t}</h3><p>{d}</p></Reveal>))}</div>
    </div></section>
  )
}

// ---- "in the spotlight" style marquee ----
export function Spotlight() {
  const items = [['clock', '10 min arrival'], ['badge', 'Background verified'], ['star', '4.8 average rating'], ['shield', 'Aadhaar verified Experts'], ['rupee', 'From ₹99 per hour'], ['users', '20,000+ happy homes'], ['camera', 'Before and after photos']]
  return (
    <section className="spot"><div className="eyebrow">TRUSTED BY THOUSANDS OF INDIAN HOUSEHOLDS</div>
      <div className="marq pillrow"><div className="track" style={{ animationDuration: '40s' }}>{[...items, ...items, ...items, ...items].map(([i, t], k) => <span className="p" key={k}><Icon name={i} size={20} />{t}</span>)}</div></div></section>
  )
}

// ---- cities grid ----
export function CityGrid() {
  const cities = useCities()
  return (
    <div className="city-grid">
      {cities.map((c, i) => (
        <Reveal key={c.id} delay={(i % 3) * 90} as={Link} to={`/house-help/${slug(c.name)}`} className="city">
          <img src={cityImg(c.name, 700, c.image)} alt={c.name} loading="lazy" />{c.enabled && <em className="live" style={{ fontStyle: 'normal' }}>Live now</em>}<span>{c.name}</span>
        </Reveal>))}
    </div>
  )
}

// ---- numbers band (counts up when scrolled into view) ----
export function StatsBand() {
  const [on, setOn] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), io.disconnect()), { threshold: 0.3 })
    ref.current && io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const cities = useCities()
  const S = [[20000, '+', 'Happy homes'], [4.8, '', 'Average rating', 1], [10, ' min', 'Typical arrival'], [cities.length, '+', 'Cities across India']]
  return (
    <div className="statband" ref={ref}><div className="wrap">
      {S.map(([v, suf, l, d]) => <div key={l}><b>{on ? <Count value={v} suffix={suf} decimals={d || 0} duration={1400} /> : '0'}</b><span>{l}</span></div>)}
    </div></div>
  )
}

// ---- image + text feature row ----
export function FeatureRow({ eyebrow, title, text, points = [], img, tag, tagIcon = 'badge', flip }) {
  return (
    <div className={'feat-row' + (flip ? ' flip' : '')}>
      <Reveal dir={flip ? 'right' : 'left'} className="fimg"><img src={img} alt={title} loading="lazy" />{tag && <span className="tag"><Icon name={tagIcon} size={18} />{tag}</span>}</Reveal>
      <Reveal dir={flip ? 'left' : 'right'} className="ftx"><div className="eyebrow">{eyebrow}</div><h3>{title}</h3><p>{text}</p>
        <ul>{points.map((p) => <li key={p}><Icon name="check" size={18} />{p}</li>)}</ul></Reveal>
    </div>
  )
}

// ---- services managed by the admin (image + description come from the database) ----
export function ServiceCards() {
  const { services } = useDB()
  const list = services.filter((s) => s.active)
  if (!list.length) return null
  return (
    <div className="pgrid">{list.map((s, i) => (
      <Reveal key={s.id} delay={(i % 4) * 80} as={Link} to="/user" className="pcard">
        <div className="im"><img src={s.image || (SERVICE_PHOTO[s.icon] || IMG.clean1)(700)} alt={s.name} loading="lazy" /></div>
        <div className="tx"><h3><Icon name={s.icon} size={20} />{s.name}</h3><p>{s.desc}</p><b>From {inr(s.price)} · {s.mins} min</b></div>
      </Reveal>))}</div>
  )
}

export function CtaBand({ title = 'Your home deserves a helping hand', text = 'Book a trained, verified Expert in under a minute.', img = IMG.heroB(1600) }) {
  return (
    <section className="sec"><div className="wrap"><Reveal className="cta-band"><img src={img} alt="" loading="lazy" />
      <div className="in"><h2>{title}</h2><p>{text}</p><Link to="/user" className="btn glow">Book Now <Icon name="arrowRight" size={18} /></Link></div></Reveal></div></section>
  )
}
