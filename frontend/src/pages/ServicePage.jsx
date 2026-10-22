import { Link, Navigate, useParams } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Reveal, Steps, Reviews, FaqSection, Spotlight, CtaBand, useCities } from '../components/Site.jsx'
import { SERVICE_PAGES, slug, cityImg, IMG } from '../content.js'

const Trusted = () => (
  <div className="trusted"><div className="avs"><i>A</i><i>R</i><i>S</i></div><div><small>Trusted by</small><b>20K+ Homes</b></div>
    <span style={{ color: '#f59e0b', display: 'inline-flex' }}>{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={14} fill />)}</span></div>
)
const Strip = () => (
  <div className="dstrip"><div className="wrap">
    <div className="i"><Icon name="badge" size={32} />Trained & Verified Experts</div>
    <div className="i"><Icon name="users" size={32} />Trusted By 20K+ Families</div>
    <div className="i"><Icon name="rupee" size={32} />No lock-ins, No hidden fees</div>
  </div></div>
)

export function ServicePage({ id: idProp }) {
  const params = useParams()
  const id = idProp || params.id
  const p = SERVICE_PAGES[id]
  const cities = useCities()
  if (!p) return <Navigate to="/" />
  return (
    <>
      <div className="wrap">
        <section className="shero">
          <div>
            <div className="crumb fade-in">Home <span>/</span> <span>{p.name}</span></div>
            <h1 className="fade-up"><span className="pk">{p.name}</span> in India</h1>
            <p className="fade-up d1">{p.sub}</p>
            <Link to="/user" className="btn glow fade-up d2">Book Now</Link><br />
            <div className="fade-up d3"><Trusted /></div>
          </div>
          <div className="pic scale-in d1"><img src={p.hero(1200)} alt={p.name} /></div>
        </section>
      </div>
      <Strip />

      <section className="sec"><div className="wrap">
        <Reveal><h2 className="t">{p.heading.split(' ').slice(0, -3).join(' ')} <span className="pk">{p.heading.split(' ').slice(-3).join(' ')}</span></h2></Reveal>
        <div className="cats">{p.cats.map(([ic, t, img], i) => (
          <Reveal key={t} delay={i * 70} className="cat"><img src={img(400)} alt={t} loading="lazy" />{t}</Reveal>))}</div>
        <div className="inc">
          <Reveal dir="left" className="box yes"><h3>What is included in {p.name}?</h3><ul>{p.included.map((x) => <li key={x}><Icon name="check" size={18} />{x}</li>)}</ul></Reveal>
          <Reveal dir="right" className="box no"><h3>Not included in this service</h3><ul>{p.excluded.map((x) => <li key={x}><Icon name="close" size={18} />{x}</li>)}</ul></Reveal>
        </div>
      </div></section>

      <section className="sec tint"><div className="wrap">
        <Reveal><h2 className="t">Why Families Trust Clickit for <span className="pk">{p.name}</span></h2></Reveal>
        <div className="why">{p.why.map(([ic, t, d], i) => (
          <Reveal key={t} delay={i * 90} className="c"><div className="ico"><Icon name={ic} size={26} /></div><h3>{t}</h3><p>{d}</p></Reveal>))}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <Reveal><h2 className="t">See it in action</h2><p className="lead">A glimpse of the care our Experts bring to every {p.name.toLowerCase()} booking.</p></Reveal>
        <div className="gallery">{[p.hero, ...p.cats.slice(0, 2).map((c) => c[2])].map((im, i) => <Reveal key={i} delay={i * 100}><img src={im(900)} alt="" loading="lazy" /></Reveal>)}</div>
      </div></section>

      <Steps />

      <section className="sec" style={{ paddingTop: 0 }}><div className="wrap">
        <Reveal><h2 className="t">Transparent hourly pricing for <span className="pk">{p.name}</span></h2></Reveal>
        <div className="price">
          <Reveal dir="left" className="card"><h3>Flexible pricing from ₹{p.price}</h3><p style={{ color: 'var(--mute)', margin: '6px 0 14px' }}>Pay only for the hours you need, with complete pricing transparency.</p>
            <ul>{['No hidden charges, what you see is what you pay', 'Simple hourly model, book 1hr, 2hr, or more', 'Scope depends on time booked and your preference', 'Cancel or reschedule anytime before the booking'].map((x) => <li key={x}><Icon name="check" size={18} />{x}</li>)}</ul></Reveal>
          <Reveal dir="right" className="card" style={{ background: 'var(--pink)', color: '#fff' }}><h3 style={{ color: '#fff' }}>Instant & Schedule</h3><p style={{ opacity: .9, margin: '6px 0 14px' }}>No lock-ins, no hidden fees. Pay only for the hours you book.</p>
            <ul>{['Instant booking', 'Same-day service', 'Scheduled slots', 'Weekly recurring'].map((x) => <li key={x}><Icon name="check" size={18} style={{ color: '#fff' }} />{x}</li>)}</ul>
            <Link to="/user" className="btn" style={{ background: '#fff', color: 'var(--pink)', marginTop: 18 }}>Book trusted help in minutes</Link></Reveal>
        </div>
      </div></section>

      <section className="sec tint"><div className="wrap">
        <Reveal><h2 className="t">Available across India</h2><p className="lead">Clickit {p.name} is available across Indian cities including Mumbai, Delhi, Pune, Bengaluru and more.</p></Reveal>
        <div className="chipset">{cities.map((c) => <Link key={c.id} to={`/house-help/${slug(c.name)}`}>{c.name}</Link>)}</div>
      </div></section>

      <Spotlight />
      <Reviews tint={false} title="Trusted by Thousands of Indian Households" />
      <FaqSection items={p.faq} />
      <CtaBand title={`Book ${p.name} today`} text="A verified Expert can be at your door in about 10 minutes." img={p.hero(1600)} />

      <section className="sec tint"><div className="wrap prose">
        <Reveal><h2 className="t l" style={{ fontSize: 40 }}>About {p.name} in India</h2>
          <h3>{p.about[0]}</h3><p>{p.about[1]}</p>
          <h3>{p.name} across India</h3><p>We are live in Mumbai and Delhi, with every city adding new neighbourhoods regularly. Each city has its own Experts working close to your home.</p></Reveal>
      </div></section>
    </>
  )
}

export function CityPage() {
  const { city } = useParams()
  const cities = useCities()
  const db = cities.find((c) => slug(c.name) === city)
  if (!db) return <Navigate to="/" />
  const name = db.name
  const live = !!db.enabled
  const p = SERVICE_PAGES['house-help']
  return (
    <>
      <div className="wrap">
        <section className="shero">
          <div>
            <div className="crumb">Home <span>/</span> House Help <span>/</span> <span>{name}</span></div>
            <h1 className="fade-up"><span className="pk">House Help</span> in {name}</h1>
            <p className="fade-up d1">{live ? `Book a verified Expert in ${name} and get help at your door in 10 minutes.` : `We are getting ready to launch in ${name}. Check back soon.`}</p>
            {live ? <Link to="/user" className="btn glow fade-up d2">Book Now</Link> : <span className="btn" style={{ opacity: .6 }}>Coming Soon</span>}<br />
            <div className="fade-up d3"><Trusted /></div>
          </div>
          <div className="pic scale-in d1"><img src={cityImg(name, 1200, db.image)} alt={name} /></div>
        </section>
      </div>
      <Strip />
      {live && db.areas.length > 0 && (
        <section className="sec"><div className="wrap">
          <Reveal><h2 className="t">Areas we serve in <span className="pk">{name}</span></h2></Reveal>
          <div className="chipset">{db.areas.map((a) => <span key={a}>{a}</span>)}</div>
        </div></section>)}
      <section className="sec tint"><div className="wrap">
        <Reveal><h2 className="t">Why Families Trust Clickit</h2></Reveal>
        <div className="why">{p.why.map(([ic, t, d], i) => <Reveal key={t} delay={i * 90} className="c"><div className="ico"><Icon name={ic} size={26} /></div><h3>{t}</h3><p>{d}</p></Reveal>)}</div>
      </div></section>
      <Steps />
      <Reviews tint />
      <FaqSection items={['What is Clickit?', 'In which cities is House Help available?', 'How do I book services?', 'Are your Experts trusted?']} />
    </>
  )
}
