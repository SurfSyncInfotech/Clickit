import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Reveal, Accordion } from '../components/Site.jsx'
import { POSTS, BLOG_CATS, LEGAL, FAQ_GROUPS } from '../content.js'

export function Faq() {
  const [g, setG] = useState(0)
  return (
    <section className="sec"><div className="wrap">
      <h1 className="t fade-up" style={{ fontSize: 'clamp(34px,5vw,60px)', textAlign: 'center', fontWeight: 600, letterSpacing: -1.5, color: 'var(--head)' }}>Frequently Asked Questions</h1>
      <p className="lead" style={{ textAlign: 'center', color: 'var(--mute)', marginTop: 10 }}>Covers booking, payments, safety and more.</p>
      <div className="faq-tabs">{FAQ_GROUPS.map(([n], i) => <button key={n} className={g === i ? 'on' : ''} onClick={() => setG(i)}>{n}</button>)}</div>
      <Accordion key={g} items={FAQ_GROUPS[g][1]} />
      <div className="faq-more"><p>Still have questions? Support is available 7 days a week, 8am to 10pm IST.</p><a className="btn" href="mailto:help@clickit.com">help@clickit.com</a></div>
    </div></section>
  )
}

export function Legal() {
  const { doc } = useParams()
  const d = LEGAL[doc]
  if (!d) return <Navigate to="/" />
  return (
    <section className="sec"><div className="wrap prose">
      <h1 className="fade-up">{d.title}</h1><p style={{ color: 'var(--mute)' }}>Last updated: October 2026</p>
      {d.sections.map(([h, t], i) => <Reveal key={h}><h3>{i + 1}. {h}</h3><p>{t}</p></Reveal>)}
    </div></section>
  )
}

export function Blog() {
  const [cat, setCat] = useState('All')
  const list = POSTS.filter((p) => cat === 'All' || p.cat === cat)
  const [first, ...rest] = POSTS
  return (
    <section className="sec"><div className="wrap">
      <h1 className="t fade-up" style={{ fontSize: 'clamp(34px,5vw,60px)', fontWeight: 600, letterSpacing: -1.5, color: 'var(--head)', textAlign: 'center' }}>Home Care Tips & <span className="pk">Cleaning Guides</span></h1>
      <p className="lead" style={{ textAlign: 'center', color: 'var(--mute)', marginTop: 10 }}>Practical cleaning tips for Indian homes from trained Clickit Experts.</p>
      {cat === 'All' && (
        <Reveal as={Link} to={`/blog/${first.slug}`} className="feat"><img src={first.img(1200)} alt="" /><div className="tx"><span className="cat-l pk" style={{ fontWeight: 700 }}>{first.cat}</span><h2>{first.title}</h2><p style={{ color: 'var(--mute)' }}>{first.excerpt}</p><small style={{ color: 'var(--mute)' }}>{first.date}</small></div></Reveal>)}
      <div className="faq-tabs" style={{ marginTop: 36 }}>{BLOG_CATS.map((c) => <button key={c} className={cat === c ? 'on' : ''} onClick={() => setCat(c)}>{c}</button>)}</div>
      <h3 style={{ marginTop: 36, fontSize: 26, color: 'var(--head)' }}>Browse all guides</h3>
      <div className="bgrid">{(cat === 'All' ? rest : list).map((p, i) => (
        <Reveal key={p.slug} delay={(i % 3) * 90} as={Link} to={`/blog/${p.slug}`} className="bcard"><div className="im"><img src={p.img(700)} alt="" loading="lazy" /></div><div className="tx"><span className="cat-l">{p.cat}</span><h3>{p.title}</h3><small>{p.date}</small></div></Reveal>))}</div>
    </div></section>
  )
}

export function Post() {
  const { slug } = useParams()
  const p = POSTS.find((x) => x.slug === slug)
  if (!p) return <Navigate to="/blog" />
  return (
    <section className="sec"><div className="wrap prose">
      <Link to="/blog" className="pk" style={{ fontWeight: 600, display: 'inline-flex', gap: 4, alignItems: 'center' }}><Icon name="chevronLeft" size={16} />All guides</Link>
      <h1 className="fade-up" style={{ marginTop: 14 }}>{p.title}</h1>
      <small style={{ color: 'var(--mute)' }}>{p.cat} · {p.date}</small>
      <div className="post-hero scale-in"><img src={p.img(1400)} alt="" /></div>
      {p.body.map((t, i) => <Reveal key={i}><p>{t}</p></Reveal>)}
      <Link to="/user" className="btn glow" style={{ marginTop: 20 }}>Book an Expert</Link>
    </div></section>
  )
}
