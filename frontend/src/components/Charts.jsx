import { useEffect, useRef, useState } from 'react'

// Lightweight animated SVG charts (no dependency). Colours follow the brand pink.
export const PALETTE = ['#f4709f', '#9b8afb', '#5eb1ef', '#f7b955', '#4fc79a', '#f58b8b', '#7f8cf0']

// numbers that count up when they appear
export function Count({ value, prefix = '', suffix = '', decimals = 0, duration = 900 }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf, t0
    const to = Number(value) || 0
    if (document.hidden) { setN(to); return }   // rAF is paused in background tabs
    const tick = (t) => {
      t0 ??= t
      const p = Math.min(1, (t - t0) / duration), e = 1 - Math.pow(1 - p, 3)
      setN(to * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{prefix}{decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('en-IN')}{suffix}</>
}

// run an animation flag after mount so CSS transitions play
const useMounted = () => { const [m, setM] = useState(false); useEffect(() => { const t = setTimeout(() => setM(true), 60); return () => clearTimeout(t) }, []); return m }

// vertical bars: data = [{label, value}]
export function BarChart({ data, height = 220, color = '#f4709f', format = (v) => v }) {
  const on = useMounted()
  const gid = useRef('b' + Math.random().toString(36).slice(2, 7)).current
  const max = Math.max(1, ...data.map((d) => d.value))
  const W = 560, pad = { t: 24, r: 8, b: 30, l: 8 }, iw = W - pad.l - pad.r, ih = height - pad.t - pad.b
  const bw = Math.min(44, (iw / data.length) * 0.58)
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" className="chart">
      <defs><linearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} /><stop offset="1" stopColor={color} stopOpacity=".55" /></linearGradient></defs>
      {[0, 0.5, 1].map((g) => <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + ih * (1 - g)} y2={pad.t + ih * (1 - g)} stroke="#eceef5" strokeDasharray={g ? '4 4' : ''} />)}
      {data.map((d, i) => {
        const x = pad.l + (iw / data.length) * (i + 0.5) - bw / 2, h = (d.value / max) * ih
        return (
          <g key={i}>
            <rect x={x} y={pad.t + ih - h} width={bw} height={Math.max(h, 0)} rx="8" fill={`url(#${gid})`} opacity={d.value ? 1 : 0.15}
              style={{ transformOrigin: `${x + bw / 2}px ${pad.t + ih}px`, transform: on ? 'scaleY(1)' : 'scaleY(0)', transition: `transform .8s cubic-bezier(.2,.7,.2,1) ${i * 60}ms` }}>
              <title>{d.label}: {format(d.value)}</title></rect>
            {d.value > 0 && <text x={x + bw / 2} y={pad.t + ih - h - 6} textAnchor="middle" fontSize="11" fontWeight="700" fill="#303030" style={{ opacity: on ? 1 : 0, transition: `opacity .5s ${300 + i * 60}ms` }}>{format(d.value)}</text>}
            <text x={x + bw / 2} y={height - 10} textAnchor="middle" fontSize="11" fill="#6b7280">{d.label}</text>
          </g>)
      })}
    </svg>
  )
}

// smooth area/line chart
export function LineChart({ data, height = 220, color = '#f4709f', format = (v) => v }) {
  const on = useMounted()
  const W = 560, pad = { t: 24, r: 16, b: 30, l: 16 }, iw = W - pad.l - pad.r, ih = height - pad.t - pad.b
  const max = Math.max(1, ...data.map((d) => d.value))
  const pts = data.map((d, i) => [pad.l + (data.length === 1 ? iw / 2 : (iw / (data.length - 1)) * i), pad.t + ih - (d.value / max) * ih])
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ')
  const area = `${line} L${pts[pts.length - 1][0]} ${pad.t + ih} L${pts[0][0]} ${pad.t + ih} Z`
  const id = useRef('g' + Math.random().toString(36).slice(2, 7)).current
  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" role="img" className="chart">
      <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".28" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {[0, 0.5, 1].map((g) => <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + ih * (1 - g)} y2={pad.t + ih * (1 - g)} stroke="#ececf1" strokeDasharray={g ? '4 4' : ''} />)}
      <path d={area} fill={`url(#${id})`} style={{ opacity: on ? 1 : 0, transition: 'opacity 1s .4s' }} />
      <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" pathLength="1"
        style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: 'stroke-dashoffset 1.3s cubic-bezier(.2,.7,.2,1)' }} />
      {pts.map((p, i) => (
        <g key={i} style={{ opacity: on ? 1 : 0, transition: `opacity .4s ${600 + i * 70}ms` }}>
          <circle cx={p[0]} cy={p[1]} r="4.5" fill="#fff" stroke={color} strokeWidth="2.5"><title>{data[i].label}: {format(data[i].value)}</title></circle>
          <text x={p[0]} y={height - 10} textAnchor="middle" fontSize="11" fill="#6b7280">{data[i].label}</text>
        </g>))}
    </svg>
  )
}

// donut with legend: data = [{label, value}]
export function Donut({ data, size = 170, center, noLegend }) {
  const on = useMounted()
  const total = data.reduce((t, d) => t + d.value, 0)
  const R = 62, C = 2 * Math.PI * R
  let acc = 0
  return (
    <div className="donut-wrap">
      <svg viewBox="0 0 170 170" width={size} height={size} role="img" className="chart">
        <circle cx="85" cy="85" r={R} fill="none" stroke="#f3f3f6" strokeWidth="20" />
        {total > 0 && data.map((d, i) => {
          const len = (d.value / total) * C, off = -acc; acc += len
          return <circle key={i} cx="85" cy="85" r={R} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="20" strokeLinecap="butt"
            strokeDasharray={`${on ? Math.max(len - 2, 0) : 0} ${C}`} strokeDashoffset={off} transform="rotate(-90 85 85)"
            style={{ transition: `stroke-dasharray 1s cubic-bezier(.2,.7,.2,1) ${i * 120}ms` }}><title>{d.label}: {d.value}</title></circle>
        })}
        <text x="85" y="82" textAnchor="middle" fontSize="26" fontWeight="800" fill="#303030">{center ?? total}</text>
        <text x="85" y="100" textAnchor="middle" fontSize="11" fill="#6b7280">total</text>
      </svg>
      {!noLegend && <ul className="legend">{data.map((d, i) => <li key={d.label}><i style={{ background: PALETTE[i % PALETTE.length] }} />{d.label}<b>{d.value}</b></li>)}</ul>}
    </div>
  )
}

// horizontal bars (rankings): data = [{label, value, sub}]
export function HBars({ data, format = (v) => v }) {
  const on = useMounted()
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length || data.every((d) => !d.value)) return <div className="empty">No data yet.</div>
  return (
    <div className="hbars">{data.map((d, i) => (
      <div key={d.label} className="hb">
        <div className="hb-top"><span>{d.label}</span><b>{format(d.value)}</b></div>
        <div className="hb-track"><i style={{ width: on ? (d.value / max) * 100 + '%' : 0, background: PALETTE[i % PALETTE.length], transitionDelay: i * 90 + 'ms' }} /></div>
      </div>))}
    </div>
  )
}

// ---- helpers to shape booking data for the charts ----
export const dayKey = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}` }
export function lastDays(n, bookings, pick, when = (b) => b.completedAt || b.createdAt) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const key = dayKey(d)
    out.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), value: bookings.filter((b) => dayKey(when(b)) === key).reduce((t, b) => t + pick(b), 0) })
  }
  return out
}
export const countBy = (list, key) => {
  const m = {}
  list.forEach((x) => { const k = typeof key === 'function' ? key(x) : x[key]; m[k] = (m[k] || 0) + 1 })
  return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}
export const avg = (list) => (list.length ? list.reduce((t, x) => t + x, 0) / list.length : 0)
