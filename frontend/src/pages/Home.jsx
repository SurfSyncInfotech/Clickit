import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'
import { Reveal, Steps, Spotlight, CityGrid, Reviews, FaqSection, StatsBand, FeatureRow, ServiceCards, CtaBand } from '../components/Site.jsx'
import { IMG, cityImg } from '../content.js'

// Hero image eases in as the page scrolls (like snabbit's page-scale hero)
function useHeroScroll(ref) {
  useEffect(() => {
    const el = ref.current
    const f = () => {
      const p = Math.min(1, window.scrollY / 500)
      el.style.transform = `scale(${1 - p * 0.07})`
      el.style.borderRadius = `${28 + p * 20}px ${28 + p * 20}px 0 0`
    }
    f(); window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [ref])
}

const CARDS = [
  { name: 'House Help', to: '/house-help', img: IMG.clean1(900), cities: ['Mumbai', 'Delhi', 'Bengaluru', '& more'] },
  { name: 'Home Cook', to: '/home-cook', img: IMG.cook1(900), cities: ['Mumbai', 'Delhi'] },
  { name: 'Laundry & Ironing', to: '/house-help', img: IMG.laundry(900), soon: true },
]

export default function Home() {
  const heroRef = useRef(null)
  useHeroScroll(heroRef)
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <h1 className="fade-up">Get House Help in <em>10 min</em></h1>
          <p className="sub fade-up d1">Trained, verified Experts at your door for everyday chores.</p>
          <Link to="/user" className="btn glow fade-up d2">Book Now <Icon name="arrowRight" size={18} /></Link>
        </div>
        <div ref={heroRef} className="hero-img scale-in d2">
          <img src={IMG.heroA(1800)} alt="Expert mopping a bright living room" />
          <div className="hero-chip" style={{ left: '6%', top: '14%' }}><span className="dot"><Icon name="badge" size={20} /></span><div>Background verified<small>Every Expert</small></div></div>
          <div className="hero-chip" style={{ right: '6%', top: '28%', animationDelay: '1.2s' }}><span className="dot"><Icon name="clock" size={20} /></span><div>Arrives in 10 min<small>Instant booking</small></div></div>
        </div>
        <div className="hero-banner fade-in d4">We have landed the <b>BIGGEST</b> help ever!</div>
      </section>

      <section className="sec tint" id="services" style={{ paddingBottom: 56 }}>
        <div className="wrap">
          <Reveal><h2 className="t">Trained & Verified Home Experts</h2></Reveal>
          <div className="svc-row">
            {CARDS.map((c, i) => (
              <Reveal key={c.name} delay={i * 120} as={Link} to={c.to} className={'svc-card' + (c.soon ? ' soon' : '')}>
                <img src={c.img} alt={c.name} loading="lazy" />
                <div className="in">
                  <div className="row"><h3>{c.name}</h3><span className="go"><Icon name="chevronRight" size={20} /></span></div>
                  {c.soon ? <span className="soon-tag">Coming Soon</span> : <div><small>Available in</small><div className="cities">{c.cities.map((x) => <span key={x}>{x}</span>)}</div></div>}
                </div>
              </Reveal>))}
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal><h2 className="t">Everything your home needs</h2><p className="lead">Pick a service, choose the time and let a trained Expert take care of the rest.</p></Reveal>
          <ServiceCards />
        </div>
      </section>

      <StatsBand />
      <Steps />

      <section className="sec tint">
        <div className="wrap">
          <Reveal><h2 className="t">Help you can see and trust</h2></Reveal>
          <FeatureRow eyebrow="TRAINED FOR EVERY TASK" title="Experts who know exactly how you like it" text="Every Expert completes hands-on training in cleaning, dishwashing, dusting and kitchen hygiene before taking a single booking." points={["2-day training on conduct and safety", "Background and Aadhaar verification", "Approved by our admin team"]} img={IMG.clean3(1100)} tag="Verified Expert" />
          <FeatureRow flip eyebrow="PROOF ON EVERY JOB" title="Before and after photos, every time" text="Your Expert uploads a before photo when the job starts and an after photo when it ends, so you can see the work without being there." points={["Photos visible in your bookings", "Reviewed by our support team", "Rate the job right after it finishes"]} img={IMG.bath2(1100)} tag="Photo proof" tagIcon="camera" />
          <FeatureRow eyebrow="HONEST PRICING" title="Pay for the hours you book. Nothing more." text="See the exact price before you confirm. No lock-ins, no hidden fees, and you can cancel before the Expert starts." points={["Hourly rates from ₹99", "Instant or scheduled booking", "Settled securely, every week, with staff"]} img={IMG.dishes(1100)} tag="From ₹99" tagIcon="rupee" />
        </div>
      </section>

      <Spotlight />

      <section className="sec tint">
        <div className="wrap">
          <Reveal><h2 className="t">Serving Homes Across India</h2></Reveal>
          <CityGrid />
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <Reveal><h2 className="t">Experts Vetted for Quality</h2></Reveal>
          <div className="trust">
            <Reveal delay={0} className="tcard"><div>
              <div className="mini"><div className="av">SP</div><div><b>Sweta Patil</b><small>House Help Expert</small></div><div className="score"><Icon name="star" size={16} fill />4.7</div></div>
              <div className="mini"><div className="av" style={{ background: '#8b5cf6' }}>AS</div><div><b>Akshaya Singh</b><small>House Help Expert</small></div><div className="score"><Icon name="star" size={16} fill />4.9</div></div></div>
              <div><h3>Top Rated Experts</h3><p>Only the best rated Experts keep getting jobs on Clickit.</p></div></Reveal>
            <Reveal delay={120} className="tcard"><div>
              <div className="mini" style={{ display: 'block' }}><b>Training completed</b>
                {[['Cleaning', 100], ['Dishwashing', 100], ['Dusting', 92]].map(([t, v]) => <div key={t} style={{ marginTop: 10, fontSize: 13 }}>{t}<div className="bar"><i style={{ width: v + '%' }} /></div></div>)}</div></div>
              <div><h3>Professionally Trained</h3><p>Trained across cleaning, dishwashing, dusting and more.</p></div></Reveal>
            <Reveal delay={240} className="tcard"><div><div className="vbadge"><Icon name="badge" size={56} /></div></div>
              <div><h3>Background Verified</h3><p>Every Expert is ID checked and Clickit Verified.</p></div></Reveal>
          </div>
        </div>
      </section>

      <Reviews />
      <CtaBand />
      <FaqSection items={['What is Clickit?', 'What is included in the service?', 'How do I book services?', 'Are your Experts trusted?']} />
    </>
  )
}
