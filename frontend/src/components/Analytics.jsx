import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import { Count, PALETTE, Donut } from './Charts.jsx'

// Analytics-style dashboard building blocks shared by the user, staff and super-admin dashboards.
// Everything here is presentational: pages pass in lists they already have and small pick/when functions.

const useMounted = () => { const [m, setM] = useState(false); useEffect(() => { const t = setTimeout(() => setM(true), 60); return () => clearTimeout(t) }, []); return m }
export const compact = (v) => { const n = Math.abs(v); return n >= 1e7 ? +(v / 1e7).toFixed(1) + 'Cr' : n >= 1e5 ? +(v / 1e5).toFixed(1) + 'L' : n >= 1e3 ? +(v / 1e3).toFixed(1) + 'K' : String(Math.round(v * 10) / 10) }
export const rupee = (v) => '₹' + Number(v).toLocaleString('en-IN')

// ---------- time series helpers ----------
const DAY = 864e5
const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return +x }
const defWhen = (b) => b.completedAt || b.createdAt
// range: 'day' (7 days) | 'week' (8 weeks) | 'month' (6 months). `back` shifts the whole window one period into the past.
export function series(range, list, pick, when = defWhen, back = 0) {
  const n = range === 'month' ? 6 : range === 'week' ? 8 : 7
  const now = new Date(), tomorrow = sod(now) + DAY, out = []
  for (let i = n - 1; i >= 0; i--) {
    const k = i + back * n
    let start, end, label
    if (range === 'month') {
      start = +new Date(now.getFullYear(), now.getMonth() - k, 1); end = +new Date(now.getFullYear(), now.getMonth() - k + 1, 1)
      label = new Date(start).toLocaleDateString('en-IN', { month: 'short' })
    } else if (range === 'week') {
      end = tomorrow - k * 7 * DAY; start = end - 7 * DAY
      label = new Date(start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } else {
      start = sod(now) - k * DAY; end = start + DAY
      label = new Date(start).toLocaleDateString('en-IN', { weekday: 'short' })
    }
    out.push({ label, value: list.reduce((t, b) => { const w = +new Date(when(b)); return w >= start && w < end ? t + pick(b) : t }, 0) })
  }
  return out
}
const sum = (s) => s.reduce((t, d) => t + d.value, 0)
// % change of the last 7 days against the 7 days before
export function trend(list, pick, when = defWhen) {
  const cur = sum(series('day', list, pick, when)), prev = sum(series('day', list, pick, when, 1))
  if (!cur && !prev) return null
  return prev ? ((cur - prev) / prev) * 100 : 100
}

// ---------- charts ----------
const niceMax = (m) => { const p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p }
const smooth = (pts) => pts.map((p, i) => {
  if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`
  const a = pts[i - 2] || pts[i - 1], b = pts[i - 1], d = pts[i + 1] || p
  const lo = Math.min(b[1], p[1]), hi = Math.max(b[1], p[1])   // keep the curve between its neighbours so it never dips below zero
  const c1 = [b[0] + (p[0] - a[0]) / 6, Math.min(hi, Math.max(lo, b[1] + (p[1] - a[1]) / 6))], c2 = [p[0] - (d[0] - b[0]) / 6, Math.min(hi, Math.max(lo, p[1] - (d[1] - b[1]) / 6))]
  return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
}).join(' ')

// big area chart with y-axis, grid, hover tooltips and an optional dashed "previous period" line
export function AreaChart({ data, compare, height: tall = 280, color = PALETTE[0], format = compact }) {
  const on = useMounted()
  const gid = useRef('a' + Math.random().toString(36).slice(2, 7)).current
  // draw at the real pixel width so axis text stays readable on phones
  const wrap = useRef(null)
  const [W, setW] = useState(720)
  useEffect(() => {
    const el = wrap.current; if (!el || !window.ResizeObserver) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))))
    ro.observe(el); return () => ro.disconnect()
  }, [])
  const height = W < 480 ? Math.min(tall, 220) : tall
  const pad = { t: 14, r: W < 480 ? 12 : 18, b: 30, l: W < 480 ? 38 : 46 }, iw = W - pad.l - pad.r, ih = height - pad.t - pad.b
  const step = Math.max(1, Math.ceil((data.length * 50) / iw))   // thin out x labels when they would overlap
  const max = niceMax(Math.max(1, ...data.map((d) => d.value), ...(compare || []).map((d) => d.value)))
  const x = (i) => pad.l + (data.length === 1 ? iw / 2 : (iw / (data.length - 1)) * i)
  const y = (v) => Math.min(pad.t + ih, Math.max(pad.t, pad.t + ih - (v / max) * ih))
  const pts = data.map((d, i) => [x(i), y(d.value)])
  const line = smooth(pts)
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${pad.t + ih} L${pts[0][0].toFixed(1)} ${pad.t + ih} Z`
  const cmp = compare && smooth(compare.map((d, i) => [x(i), y(d.value)]))
  return (
    <div ref={wrap} className="achart-w">
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} role="img" className="achart">
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 1, 2, 3, 4].map((g) => (
        <g key={g}><line x1={pad.l} x2={W - pad.r} y1={pad.t + (ih / 4) * g} y2={pad.t + (ih / 4) * g} stroke="#eceef5" />
          <text x={pad.l - 10} y={pad.t + (ih / 4) * g + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#8a90a2">{format(max - (max / 4) * g)}</text></g>))}
      {cmp && <path d={cmp} fill="none" stroke="#b8a9f5" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" style={{ opacity: on ? 1 : 0, transition: 'opacity .8s .3s' }} />}
      <path d={area} fill={`url(#${gid})`} style={{ opacity: on ? 1 : 0, transition: 'opacity 1s .3s' }} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" pathLength="1"
        style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: 'stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)' }} />
      {data.map((d, i) => (
        <g key={i} className="pt">
          <line x1={x(i)} x2={x(i)} y1={pad.t} y2={pad.t + ih} stroke={color} strokeOpacity=".25" strokeDasharray="3 3" className="vl" />
          <circle cx={x(i)} cy={y(d.value)} r="5" fill="#fff" stroke={color} strokeWidth="2.5" className="dot" />
          <rect x={x(i) - iw / data.length / 2} y={pad.t} width={iw / data.length} height={ih} fill="transparent"><title>{d.label}: {format(d.value)}</title></rect>
          {i % step === 0 && <text x={x(i)} y={height - 9} textAnchor="middle" fontSize="11" fill="#8a90a2">{d.label}</text>}
        </g>))}
    </svg>
    </div>
  )
}

// tiny edge-to-edge chart for KPI cards: kind = 'area' | 'bars'
export function Sparkline({ data, kind = 'area', color = PALETTE[1], height = 64 }) {
  const on = useMounted()
  const gid = useRef('s' + Math.random().toString(36).slice(2, 7)).current
  const W = 200, H = height, max = Math.max(1, ...data.map((d) => d.value))
  if (kind === 'bars') {
    const bw = W / data.length
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} className="spark" aria-hidden="true">
        {data.map((d, i) => { const h = Math.max(d.value ? 4 : 2, (d.value / max) * (H - 6)); return (
          <rect key={i} x={i * bw + bw * 0.16} width={bw * 0.68} y={H - h} height={h} rx="2" fill={color} opacity={d.value ? 0.85 : 0.2}
            style={{ transformOrigin: `0 ${H}px`, transform: on ? 'scaleY(1)' : 'scaleY(0)', transition: `transform .7s ${i * 40}ms cubic-bezier(.2,.7,.2,1)` }} />) })}
      </svg>
    )
  }
  const pts = data.map((d, i) => [(W / Math.max(1, data.length - 1)) * i, H - 6 - (d.value / max) * (H - 14)])
  const line = smooth(pts)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} className="spark" aria-hidden="true">
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity=".02" /></linearGradient></defs>
      <path d={`${line} L${W} ${H} L0 ${H} Z`} fill={`url(#${gid})`} style={{ opacity: on ? 1 : 0, transition: 'opacity .8s .2s' }} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  )
}

// small progress ring with the percentage in the middle
export function Ring({ pct = 0, size = 58, color = PALETTE[1], track = '#eceef5' }) {
  const on = useMounted()
  const R = 22, C = 2 * Math.PI * R, p = Math.max(0, Math.min(100, pct))
  return (
    <svg viewBox="0 0 54 54" width={size} height={size} className="ring-s" role="img" aria-label={`${Math.round(p)}%`}>
      <circle cx="27" cy="27" r={R} fill="none" stroke={track} strokeWidth="6" />
      <circle cx="27" cy="27" r={R} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" transform="rotate(-90 27 27)"
        strokeDasharray={`${on ? (p / 100) * C : 0} ${C}`} style={{ transition: 'stroke-dasharray 1s cubic-bezier(.2,.7,.2,1)' }} />
      <text x="27" y="31" textAnchor="middle" fontSize="12" fontWeight="800" fill="#2b2f3e">{Math.round(p)}%</text>
    </svg>
  )
}

// ---------- layout + cards ----------
export const Delta = ({ pct }) => pct == null ? null : (
  <span className={'delta ' + (pct >= 0 ? 'up' : 'down')}>{pct >= 0 ? '↑' : '↓'} {Math.abs(pct) >= 1000 ? '999+' : Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%</span>)

// "Hi, welcome back!" row: title + subtitle on the left, small caps meta values and actions on the right
export function DashHead({ title, sub, meta = [], children }) {
  return (
    <div className="dhead">
      <div className="dhead-t"><h1>{title}</h1><p>{sub}</p></div>
      <div className="dhead-r">
        {meta.map((m) => <div className="dmeta" key={m.label}><small>{m.label}</small><b>{m.value}</b></div>)}
        {children}
      </div>
    </div>
  )
}
export const DashActions = ({ children }) => <div className="dactions">{children}</div>
export const DGrid = ({ children, className = '' }) => <div className={'dgrid ' + className}>{children}</div>
export const Col = ({ s = 12, children, className = '' }) => <div className={`dcol s${s} ${className}`}>{children}</div>
export const Side = ({ children }) => <div className="dside">{children}</div>
export const DCard = ({ title, sub, right, children, className = '' }) => (
  <section className={'dcard ' + className}>
    {(title || right) && <header className="dcard-h"><div>{title && <h3>{title}</h3>}{sub && <p>{sub}</p>}</div>{right}</header>}
    {children}
  </section>)

// main metrics card: Day / Week / Month toggle, clickable metric headline numbers, area chart with previous-period line
// metrics = [{ key, label, list, pick, when, format }]
export function MetricCard({ title, sub, metrics }) {
  const [range, setRange] = useState('day')
  const [key, setKey] = useState(metrics[0].key)
  const m = metrics.find((x) => x.key === key) || metrics[0]
  const cur = useMemo(() => series(range, m.list, m.pick, m.when), [range, m, m.list]) // eslint-disable-line react-hooks/exhaustive-deps
  const prev = useMemo(() => series(range, m.list, m.pick, m.when, 1), [range, m, m.list]) // eslint-disable-line react-hooks/exhaustive-deps
  const per = { day: 'last 7 days', week: 'last 8 weeks', month: 'last 6 months' }[range]
  return (
    <DCard className="dmain" title={title} sub={sub}
      right={<div className="seg">{[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([k, l]) => <button key={k} className={range === k ? 'on' : ''} onClick={() => setRange(k)}>{l}</button>)}</div>}>
      <div className="dmetrics">
        {metrics.map((x) => {
          const v = sum(series(range, x.list, x.pick, x.when))
          return (
            <button key={x.key} className={'dm' + (x.key === m.key ? ' on' : '')} onClick={() => setKey(x.key)}>
              <small>{x.label}</small><b>{(x.format || compact)(v)}</b>
            </button>)
        })}
      </div>
      <div className="dchart-legend"><span><i style={{ background: PALETTE[0] }} />{m.label}, {per}</span><span><i className="dash" />Previous period</span></div>
      <AreaChart data={cur} compare={prev} format={(v) => (m.prefix || '') + compact(v)} />
    </DCard>
  )
}

// small KPI card: big number + change vs last week + sparkline that bleeds to the card edges
export function Kpi({ label, value, display, delta, data, kind = 'area', color, tone }) {
  return (
    <section className={'dcard kpi' + (tone ? ' ' + tone : '')}>
      <div className="kpi-top"><b className="kpi-v">{display ?? <Count value={value} />}</b><Delta pct={delta} /></div>
      <small className="kpi-l">{label}</small>
      <div className="kpi-s"><Sparkline data={data} kind={kind} color={color} /></div>
    </section>)
}
// wide KPI with explanation text and a weekly bar chart (the "ALL SESSIONS" card)
export function BigKpi({ label, value, display, delta, text, data, color = PALETTE[1] }) {
  return (
    <section className="dcard bigkpi">
      <small className="caps">{label}</small>
      <div className="kpi-top"><b className="kpi-v lg">{display ?? <Count value={value} />}</b><Delta pct={delta} /></div>
      <p>{text}</p>
      <div className="kpi-s"><Sparkline data={data} kind="bars" color={color} height={84} /></div>
    </section>)
}

// "Page views by page title"-style ranked list: title + sub on the left, value + share on the right
export function ListCard({ title, sub, rows, empty = 'Nothing here yet.' }) {
  return (
    <DCard title={title} sub={sub}>
      {!rows.length ? <div className="dempty">{empty}</div> : (
        <ul className="dlist">{rows.map((r) => (
          <li key={r.key || r.title}>
            <div className="dl-l"><b>{r.title}</b>{r.sub && <small>{r.sub}</small>}</div>
            <div className="dl-r"><b>{r.value}</b>{r.share != null && <small>{r.share}%</small>}</div>
          </li>))}</ul>)}
    </DCard>)
}

// donut + thin labelled bars ("Sessions by Channel")
export function SplitCard({ title, sub, data, empty = 'No data yet.' }) {
  const on = useMounted()
  const total = data.reduce((t, d) => t + d.value, 0), max = Math.max(1, ...data.map((d) => d.value))
  return (
    <DCard title={title} sub={sub}>
      {!total ? <div className="dempty">{empty}</div> : (
        <div className="dsplit">
          <div className="dsplit-d"><Donut data={data} center={total} size={190} noLegend /></div>
          <ul className="dbars">{data.map((d, i) => (
            <li key={d.label}>
              <div className="dbars-t"><span>{d.label}</span><b>{d.value} <em>({Math.round((d.value / total) * 100)}%)</em></b></div>
              <div className="dbars-k"><i style={{ width: on ? (d.value / max) * 100 + '%' : 0, background: PALETTE[i % PALETTE.length], transitionDelay: i * 80 + 'ms' }} /></div>
            </li>))}</ul>
        </div>)}
    </DCard>)
}

// icon tiles ("Acquisition"): tiles = [{ icon, label, value, tone }]
export function TilesCard({ title, sub, tiles }) {
  return (
    <DCard title={title} sub={sub}>
      <div className="dtiles">{tiles.map((t, i) => (
        <div className="dtile" key={t.label}><span className={'dt-i t' + (t.tone ?? i % 5)}><Icon name={t.icon} size={22} /></span><div><small>{t.label}</small><b>{t.value}</b></div></div>))}</div>
    </DCard>)
}
// progress rings ("Sessions" card): rings = [{ label, pct, value, color }]
export function RingsCard({ title, sub, rings }) {
  return (
    <DCard title={title} sub={sub}>
      <div className="drings">{rings.map((r, i) => (
        <div className="dring" key={r.label}><Ring pct={r.pct} color={r.color || PALETTE[(i + 1) % PALETTE.length]} /><div><small>{r.label}</small><b>{r.value}</b></div></div>))}</div>
    </DCard>)
}

// bordered table card: head = [...], rows = [[cell, ...]]
export function TableCard({ title, sub, head, rows, empty = 'Nothing here yet.', right }) {
  return (
    <DCard title={title} sub={sub} right={right} className="dtablecard">
      {!rows.length ? <div className="dempty">{empty}</div> : (
        <div className="tablewrap"><table className="dtable"><thead><tr>{head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} data-label={head[j]}>{c}</td>)}</tr>)}</tbody></table></div>)}
    </DCard>)
}

export const share = (n, total) => (total ? Math.round((n / total) * 100) : 0)
