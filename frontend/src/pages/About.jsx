import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Reveal, StatsBand, FeatureRow, CtaBand } from '../components/Site.jsx'
import { IMG, TEAM, portrait } from '../content.js'

const VALUES = [
  ['users', 'People first', 'The women who work with us are our greatest strength. Fair pay, respect and growth are built into how we operate.'],
  ['shield', 'Safety always', 'From identity checks to one tap support, every booking is designed so families and Experts both feel safe.'],
  ['clock', 'Respect for time', 'We arrive when we say we will. Your time and your Expert\'s time are equally valuable.'],
  ['badge', 'Quality, proven', 'Before and after photos, ratings and reviews keep standards high and visible on every job.'],
  ['rupee', 'Honest pricing', 'Hourly rates shown upfront. No surprise charges, no lock-ins, no fine print.'],
  ['sparkle', 'Everyday delight', 'A clean home, a cooked meal, an hour saved. Small things done well make a big difference.'],
]
const TIMELINE = [
  ['2024', 'The idea', 'We noticed that finding reliable help at short notice was the hardest part of running a home. Clickit began as a simple question: what if help arrived in minutes?'],
  ['EARLY 2025', 'First Experts', 'Our first batch of trained Experts started serving homes in Mumbai, with every booking tracked from request to photo proof.'],
  ['MID 2025', 'Delhi launch', 'We opened in Delhi and introduced instant matching so the nearest available Expert can accept a request within seconds.'],
  ['2026', 'Growing across India', 'More neighbourhoods, more services and weekly settlements that pay Experts on time, every time.'],
]
const VET = [
  ['Apply', 'Experts register with their details, city and area. Nothing is assumed, everything is checked.'],
  ['Verify', 'Identity and background are verified, including Aadhaar, before anyone is approved.'],
  ['Train', 'A hands-on programme covers cleaning methods, kitchen hygiene, conduct and safety.'],
  ['Approve', 'Our admin team reviews every profile and approves only those who meet our standards.'],
]

export default function About() {
  return (
    <>
      <section className="about-hero wrap">
        <span className="pill-tag fade-in" style={{ display: 'inline-block', background: 'var(--tint)', color: 'var(--pink)', fontWeight: 700, padding: '6px 14px', borderRadius: 99, fontSize: 13, marginBottom: 18 }}>ABOUT CLICKIT</span>
        <h1 className="fade-up">Redefining convenience for the <span className="pk">Urban Indian Home</span></h1>
        <p className="fade-up d1" style={{ color: 'var(--mute)', fontSize: 20, maxWidth: 780, margin: '22px auto 0' }}>Clickit is a quick-service platform for everyday home help. Open the app and a verified, trained Expert arrives in about 10 minutes, ready to clean, cook or tidy exactly the way you like it.</p>
        <div className="mosaic">
          <div className="a scale-in d1"><img src={IMG.heroA(1000)} alt="Expert cleaning a living room" /></div>
          <div className="b scale-in d2"><img src={IMG.dishes(600)} alt="Dishwashing" /></div>
          <div className="c scale-in d3"><img src={IMG.cook1(500)} alt="Home cooking" /></div>
          <div className="c scale-in d3"><img src={IMG.laundry(500)} alt="Laundry" /></div>
          <div className="d scale-in d4"><img src={IMG.bath1(900)} alt="Bathroom cleaning" /></div>
        </div>
      </section>

      <StatsBand />

      <section className="sec"><div className="wrap">
        <FeatureRow eyebrow="OUR STORY" title="Built to give families their time back" text="Running a home is a full-time job. Between work, family and everything in between, even simple chores can pile up. Clickit connects you with trained Experts who handle everyday tasks quickly and reliably, so you can spend your hours on what matters." points={['Instant or scheduled bookings', 'Experts who live close to your neighbourhood', 'Photo proof and ratings on every job']} img={IMG.clean1(1100)} tag="Trusted by families" tagIcon="users" />
        <FeatureRow flip eyebrow="OUR MISSION" title="Dignified work for women, dependable help for homes" text="We believe great service starts with well treated people. Clickit offers Experts steady work, transparent weekly payouts and training that helps them grow, while families get consistent, high quality help." points={['Fair, predictable weekly settlements', 'Training and career growth', 'A respectful, safe working environment']} img={IMG.clean2(1100)} tag="Fair pay, weekly" tagIcon="wallet" />
      </div></section>

      <section className="sec tint"><div className="wrap">
        <Reveal><h2 className="t">What we stand for</h2><p className="lead" style={{ maxWidth: 680, margin: '12px auto 0' }}>Six principles guide every decision we make, from product to hiring.</p></Reveal>
        <div className="values">{VALUES.map(([i, t, d], k) => (
          <Reveal key={t} delay={(k % 3) * 90} className="c"><div className="ico"><Icon name={i} size={26} /></div><h3>{t}</h3><p>{d}</p></Reveal>))}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <Reveal><h2 className="t">How we vet every Expert</h2><p className="lead" style={{ maxWidth: 680, margin: '12px auto 0' }}>Trust is earned before the first booking, not after it.</p></Reveal>
        <div className="vet">{VET.map(([t, d], k) => (
          <Reveal key={t} delay={k * 100} className="c" style={{ background: 'var(--tint)' }}><span className="n">{k + 1}</span><h3>{t}</h3><p>{d}</p></Reveal>))}</div>
      </div></section>

      <section className="sec tint"><div className="wrap">
        <Reveal><h2 className="t">Our promise to you</h2></Reveal>
        <div className="promise">{[['refresh', 'Refund in 3 hours', 'If an Expert does not arrive, is more than 30 minutes late, or the work falls short, we refund the affected booking.'], ['star', '90% rated 4 or 5 stars', 'Quality stays consistent across every city we serve, backed by reviews after every job.'], ['clock', 'Hourly based pricing', 'Pay only for what you need with transparent hourly rates and no hidden fees or commitments.']].map(([i, t, d], k) => (
          <Reveal key={t} delay={k * 100} className="c"><div className="ico"><Icon name={i} size={26} /></div><h3>{t}</h3><p>{d}</p></Reveal>))}</div>
      </div></section>

      <section className="sec"><div className="wrap">
        <Reveal><h2 className="t">Our journey so far</h2></Reveal>
        <div className="timeline">{TIMELINE.map(([y, t, d], k) => <Reveal key={y} delay={k * 90} className="ev"><small>{y}</small><h4>{t}</h4><p>{d}</p></Reveal>)}</div>
      </div></section>

      <section className="sec tint"><div className="wrap">
        <FeatureRow eyebrow="SAFETY BUILT IN" title="Safe for your home. Safe for your Expert." text="Every booking starts with an OTP, every job is documented with photos, and our support team is available seven days a week. If anything is not right, we make it right." points={['Identity verified Experts only', 'OTP based job start', 'Support 8am to 10pm, 7 days a week']} img={IMG.bath2(1100)} tag="Support 7 days a week" tagIcon="shield" />
      </div></section>

      <section className="sec"><div className="wrap">
        <Reveal><h2 className="t">The team building Clickit</h2><p className="lead" style={{ maxWidth: 640, margin: '12px auto 0' }}>A growing team across Mumbai and Delhi, working to make home help simple and dependable.</p></Reveal>
        <div className="team">{TEAM.map(([n, r, city, id], k) => (
          <Reveal key={n} delay={(k % 5) * 80} className="m"><div className="mp"><img src={portrait(id, 500)} alt={n} loading="lazy" /><span className="mc"><Icon name="map" size={13} />{city}</span></div><b>{n}</b><small>{r}</small></Reveal>))}</div>
        <p style={{ textAlign: 'center', marginTop: 36, color: 'var(--mute)' }}>Want to work with us? <Link to="/staff" className="pk" style={{ fontWeight: 700 }}>Join as an Expert</Link></p>
      </div></section>

      <CtaBand title="Join thousands of happy homes" text="Experience help that arrives in minutes and does the job right." img={IMG.heroA(1600)} />
    </>
  )
}
