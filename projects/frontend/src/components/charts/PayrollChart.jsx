import { useState, useRef } from 'react';
import { useSize } from '../../hooks/useSize';
import { fmtMoney } from '../../utils/format';

export function PayrollChart({ data, labels, accent, variant = "area" }) {
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = useState(null);
  const pad = { t: 16, r: 16, b: 28, l: 56 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const max = Math.max(...data) * 1.08;
  const min = Math.min(...data) * 0.92;
  const x = i => pad.l + (i / (data.length - 1)) * iw;
  const y = v => pad.t + ih - ((v - min) / (max - min)) * ih;

  const path = data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
  const area = path + ` L${x(data.length - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + (max - min) * t);

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseMove={e => {
        const rect = wrap.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const idx = Math.round(((mx - pad.l) / iw) * (data.length - 1));
        if (idx >= 0 && idx < data.length) setHover(idx); else setHover(null);
      }}
      onMouseLeave={() => setHover(null)}
    >
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="payGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={pad.l} x2={pad.l + iw} y1={y(v)} y2={y(v)}
              stroke="var(--line-soft)" strokeDasharray={i === 0 ? '' : '2 4'} />
            <text x={pad.l - 10} y={y(v) + 4} fill="var(--text-dimmer)"
              fontSize="10" textAnchor="end" fontFamily="'Geist Mono', monospace">
              {fmtMoney(Math.round(v))}
            </text>
          </g>
        ))}
        {variant === "area" && <path d={area} fill="url(#payGrad)" />}
        {variant === "bars" && data.map((v, i) => {
          const bw = iw / data.length * 0.55;
          return <rect key={i} x={x(i) - bw / 2} y={y(v)} width={bw} height={pad.t + ih - y(v)}
            fill={accent} fillOpacity="0.75" rx="2" />;
        })}
        {variant !== "bars" && <path d={path} fill="none" stroke={accent} strokeWidth="2" />}
        {variant !== "bars" && data.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 2.5}
            fill={hover === i ? accent : "var(--panel)"} stroke={accent} strokeWidth="1.5" />
        ))}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={pad.t + ih + 18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih}
              stroke="var(--line)" strokeDasharray="2 3" />
            <circle cx={x(hover)} cy={y(data[hover])} r={5} fill={accent} />
          </g>
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute',
          left: Math.min(x(hover) + 12, w - 160),
          top: Math.max(y(data[hover]) - 50, 8),
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
            {fmtMoney(data[hover])}
          </div>
        </div>
      )}
    </div>
  );
}
