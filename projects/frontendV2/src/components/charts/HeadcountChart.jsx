import { useState, useRef } from 'react';
import { useSize } from '../../hooks/useSize';

export function HeadcountChart({ data, labels, accent }) {
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = useState(null);
  const pad = { t: 16, r: 16, b: 28, l: 40 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.9;
  const bw = iw / data.length * 0.65;
  const x = i => pad.l + (i + 0.5) * (iw / data.length);
  const y = v => pad.t + ih - ((v - min) / (max - min)) * ih;
  const yTicks = [0, 0.5, 1].map(t => min + (max - min) * t);

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)} stroke="var(--line-soft)" />
            <text x={pad.l - 8} y={y(v) + 3} fill="var(--text-dimmer)"
              fontSize="10" textAnchor="end" fontFamily="'Geist Mono', monospace">
              {Math.round(v)}
            </text>
          </g>
        ))}
        {data.map((v, i) => {
          const hovered = hover === i;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={x(i) - bw / 2} y={pad.t} width={bw} height={ih} fill="transparent" />
              <rect x={x(i) - bw / 2} y={y(v)} width={bw} height={pad.t + ih - y(v)}
                fill={accent} fillOpacity={hovered ? 1 : 0.7} rx="2" />
              {i === data.length - 1 && (
                <text x={x(i)} y={y(v) - 6} fill={accent}
                  fontSize="11" textAnchor="middle" fontFamily="'Geist Mono', monospace" fontWeight="600">
                  {v}
                </text>
              )}
            </g>
          );
        })}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={pad.t + ih + 18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute',
          left: Math.min(x(hover) + 12, w - 140),
          top: Math.max(y(data[hover]) - 46, 8),
          background: '#0c1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          padding: '8px 10px',
          pointerEvents: 'none',
          fontSize: 11,
          whiteSpace: 'nowrap'
        }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontFamily: "'Geist Mono', monospace" }}>{labels[hover]}</div>
          <div style={{ fontFamily: "'Geist Mono', monospace", color: '#fff', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
            {data[hover]} people
          </div>
        </div>
      )}
    </div>
  );
}
