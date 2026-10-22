// Line icons (24x24, stroke). Used everywhere instead of emojis.
const P = (d) => <path d={d} />
const ICONS = {
  check: P('M20 6L9 17l-5-5'),
  close: P('M18 6L6 18M6 6l12 12'),
  plus: P('M12 5v14M5 12h14'),
  menu: P('M3 12h18M3 6h18M3 18h18'),
  chevronDown: P('M6 9l6 6 6-6'),
  chevronRight: P('M9 18l6-6-6-6'),
  chevronLeft: P('M15 18l-6-6 6-6'),
  arrowRight: P('M5 12h14M12 5l7 7-7 7'),
  star: P('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'),
  clock: <><circle cx="12" cy="12" r="10" />{P('M12 6v6l4 2')}</>,
  shield: P('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
  badge: <>{P('M12 2l2.4 1.8 3-.2.9 2.9 2.5 1.7-1 2.8 1 2.8-2.5 1.7-.9 2.9-3-.2L12 22l-2.4-1.8-3 .2-.9-2.9-2.5-1.7 1-2.8-1-2.8 2.5-1.7.9-2.9 3 .2z')}{P('M8.5 12l2.5 2.5 4.5-5')}</>,
  users: <>{P('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2')}<circle cx="9" cy="7" r="4" />{P('M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75')}</>,
  user: <>{P('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2')}<circle cx="12" cy="7" r="4" /></>,
  list: P('M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'),
  grid: <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>,
  map: <>{P('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z')}<circle cx="12" cy="10" r="3" /></>,
  tools: P('M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'),
  wallet: <><rect x="1" y="4" width="22" height="16" rx="2" />{P('M1 10h22')}</>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" />{P('M7 11V7a5 5 0 0 1 10 0v4')}</>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" />{P('M16 2v4M8 2v4M3 10h18')}</>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" />{P('M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16')}</>,
  camera: <>{P('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z')}<circle cx="12" cy="13" r="4" /></>,
  bell: P('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0'),
  phone: <><rect x="5" y="2" width="14" height="20" rx="2" />{P('M12 18h.01')}</>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" />{P('M22 6l-10 7L2 6')}</>,
  home: <>{P('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z')}{P('M9 22V12h6v10')}</>,
  upload: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12'),
  info: <><circle cx="12" cy="12" r="10" />{P('M12 16v-4M12 8h.01')}</>,
  refresh: P('M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'),
  rupee: P('M6 3h12M6 8h12M6 13h3c4 0 6-2.5 6-5M9 13l7 8'),
  female: <><circle cx="12" cy="8" r="5" />{P('M12 13v8M9 18h6')}</>,
  sparkle: P('M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z'),
  // service icons
  broom: P('M19 3l-7 9M9.5 12.5l2 2M4 21c0-4 2-8 5.5-8.5l2 2C11 18.5 8 21 4 21z'),
  dishes: <>{P('M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2')}{P('M7 2v20')}{P('M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7')}</>,
  bath: P('M9 6L6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5M10 5L8 7M2 12h20M7 19v2M17 19v2'),
  dust: P('M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2'),
  cook: P('M6 13.87A4 4 0 0 1 7.5 6.03 4 4 0 0 1 12 3a4 4 0 0 1 4.5 3.03A4 4 0 0 1 18 13.87V21H6zM6 17h12'),
  fan: <><circle cx="12" cy="12" r="2" />{P('M12 10c0-4 1-7 4-7s3 4 0 6M14 12c4 0 7 1 7 4s-4 3-6 0M12 14c0 4-1 7-4 7s-3-4 0-6M10 12c-4 0-7-1-7-4s4-3 6 0')}</>,
  kitchen: P('M2 12h20M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8M4 8l16-4M8.86 6.78l-.45-1.81a2 2 0 0 1 1.45-2.43l1.94-.48a2 2 0 0 1 2.43 1.46l.45 1.8'),
  laundry: P('M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z'),
  // brands
  facebook: P('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'),
  instagram: <><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" />{P('M17.5 6.5h.01')}</>,
  x: P('M4 4l16 16M20 4L4 20'),
}

export default function Icon({ name, size = 20, fill = false, className = '', style }) {
  return (
    <svg className={'ic ' + className} style={style} width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name] || ICONS.info}</svg>
  )
}

export const Stars = ({ n = 5, size = 16 }) => (
  <span className="stars-row">{Array.from({ length: n }, (_, i) => <Icon key={i} name="star" size={size} fill />)}</span>
)
