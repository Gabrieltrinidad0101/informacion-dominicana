import { useState, useRef } from 'react';
import { useSize } from '../../hooks/useSize';

const PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

export function ComparisonChart({ seriesA, extras, labels, accent }) {
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = useState(null);
  const pad = { t: 16, r: 56, b: 28, l: 56 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const maxA = Math.max(...seriesA.data) * 1.1;
  const minA = Math.min(...seriesA.data) * 0.9;
  const x = i => pad.l + (i / (seriesA.data.length - 1)) * iw;
  const yA = v => pad.t + ih - ((v - minA) / (maxA - minA || 1)) * ih;

  const extrasWithScale = extras.map((s, idx) => {
    const mx = Math.max(...s.data) * 1.1;
    const mn = Math.min(...s.data) * 0.9;
    return {
      ...s,
      mx, mn,
      color: PALETTE[idx % PALETTE.length],
      y: v => pad.t + ih - ((v - mn) / (mx - mn || 1)) * ih,
    };
  });

  const pathA = seriesA.data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${yA(v)}`).join(' ');
  const areaA = pathA + ` L${x(seriesA.data.length - 1)},${pad.t + ih} L${x(0)},${pad.t + ih} Z`;
  const yTicks = [0, 0.5, 1];

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%', height: '100%' }}
      onMouseMove={e => {
        const rect = wrap.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const idx = Math.round(((mx - pad.l) / iw) * (seriesA.data.length - 1));
        if (idx >= 0 && idx < seriesA.data.length) setHover(idx); else setHover(null);
      }}
      onMouseLeave={() => setHover(null)}>
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="cmpGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {yTicks.map((t, i) => {
          const vA = minA + (maxA - minA) * t;
          return (
            <g key={i}>
              <line x1={pad.l} x2={pad.l + iw} y1={yA(vA)} y2={yA(vA)}
                stroke="var(--line-soft)" strokeDasharray={t === 0 ? '' : '2 4'} />
              <text x={pad.l - 8} y={yA(vA) + 3} fill={accent} fontSize="10"
                textAnchor="end" fontFamily="'Geist Mono', monospace">
                {seriesA.fmt(Math.round(vA))}
              </text>
            </g>
          );
        })}
        <path d={areaA} fill="url(#cmpGrad)" />
        <path d={pathA} fill="none" stroke={accent} strokeWidth="2" />
        {extrasWithScale.map(s => {
          const p = s.data.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${s.y(v)}`).join(' ');
          return <path key={s.key} d={p} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray="4 3" />;
        })}
        {seriesA.data.map((v, i) => (
          <circle key={"a" + i} cx={x(i)} cy={yA(v)} r={hover === i ? 5 : 2.5}
            fill={hover === i ? accent : "var(--panel)"} stroke={accent} strokeWidth="1.5" />
        ))}
        {extrasWithScale.map(s => s.data.map((v, i) => (
          <circle key={s.key + i} cx={x(i)} cy={s.y(v)} r={hover === i ? 4 : 2}
            fill={hover === i ? s.color : "var(--panel)"} stroke={s.color} strokeWidth="1.25" />
        )))}
        {labels.map((l, i) => (
          <text key={i} x={x(i)} y={pad.t + ih + 18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih}
            stroke="var(--line)" strokeDasharray="2 3" />
        )}
      </svg>
      {hover !== null && (
        <div style={{
          position: 'absolute',
          left: Math.min(x(hover) + 12, w - 200),
          top: Math.max(yA(seriesA.data[hover]) - 60, 8),
          background: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 6,
          padding: '8px 10px',
          pointerEvents: 'none',
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}>
          <div style={{ color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace", marginBottom: 4 }}>
            {labels[hover]}
          </div>
          <div style={{ fontFamily: "'Geist Mono', monospace", color: accent, fontWeight: 600, fontSize: 12 }}>
            ● {seriesA.label}: {seriesA.fmt(seriesA.data[hover])}
          </div>
          {extrasWithScale.map(s => (
            <div key={s.key} style={{ fontFamily: "'Geist Mono', monospace", color: s.color, fontWeight: 600, fontSize: 12 }}>
              ● {s.label}: {s.fmt(s.data[hover])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
