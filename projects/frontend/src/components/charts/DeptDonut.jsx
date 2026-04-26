import { useState, useRef } from 'react';
import { useSize } from '../../hooks/useSize';

export function DeptDonut({ data, accent }) {
  const container = useRef(null);
  const { w: containerW } = useSize(container);
  const isMobile = containerW < 420;

  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const size = Math.min(w, h);
  const cx = w / 2, cy = h / 2;
  const r = size * 0.38;
  const ir = size * 0.26;
  const total = data.reduce((s, d) => s + d.count, 0);
  const [hover, setHover] = useState(null);

  const colors = data.map((_, i) => `oklch(0.75 0.14 ${90 + i * 32})`);

  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const a0 = angle;
    const a1 = angle + (d.count / total) * Math.PI * 2;
    angle = a1;
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0) * r, y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r, y1 = cy + Math.sin(a1) * r;
    const xi1 = cx + Math.cos(a1) * ir, yi1 = cy + Math.sin(a1) * ir;
    const xi0 = cx + Math.cos(a0) * ir, yi0 = cy + Math.sin(a0) * ir;
    const path = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi0},${yi0} Z`;
    return { d: path, color: colors[i], name: d.name, count: d.count };
  });

  const legend = (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: isMobile ? '6px 14px' : '6px',
      overflowY: isMobile ? 'visible' : 'auto',
      padding: isMobile ? '8px 0 0' : '4px 0',
      width: isMobile ? '100%' : '160px',
      flexShrink: 0,
    }}>
      {arcs.map((a, i) => (
        <div key={i}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(null)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            opacity: hover === null || hover === i ? 1 : 0.35,
            transition: 'opacity 120ms',
          }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '2px',
            backgroundColor: a.color,
            flexShrink: 0,
          }} />
          <span style={{
            fontSize: '11px',
            fontFamily: "'Geist Mono', monospace",
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {a.name}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={container} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', width: '100%', height: '100%', gap: '8px', minWidth: 0 }}>
      <div ref={wrap} style={{ position: 'relative', flex: '1 1 0', minWidth: 0, minHeight: isMobile ? '220px' : 0 }}>
        <svg width={w} height={h} style={{ display: 'block' }}>
          {arcs.map((a, i) => (
            <path key={i} d={a.d} fill={a.color}
              opacity={hover === null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', transition: 'opacity 120ms' }} />
          ))}
          <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text-dim)"
            fontSize="10" fontFamily="'Geist Mono', monospace">
            {hover === null ? "TOTAL" : arcs[hover].name.toUpperCase()}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text)"
            fontSize="22" fontWeight="600" fontFamily="'Geist Mono', monospace">
            {hover === null ? total : arcs[hover].count}
          </text>
        </svg>
      </div>
      {legend}
    </div>
  );
}
