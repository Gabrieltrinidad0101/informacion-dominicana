import { useRef } from 'react';
import { useSize } from '../../hooks/useSize';
import { fmtMoney } from '../../utils/format';

export function SalaryBars({ data, accent }) {
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const pad = { t: 12, r: 12, b: 24, l: 44 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const max = Math.max(...data.map(d => d.avg)) * 1.1;
  const bh = ih / data.length * 0.6;

  return (
    <div ref={wrap} style={{ width: '100%', height: '100%' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const y = pad.t + i * (ih / data.length) + (ih / data.length - bh) / 2;
          const bw = (d.avg / max) * iw;
          return (
            <g key={d.level}>
              <text x={pad.l - 8} y={y + bh / 2 + 4} textAnchor="end"
                fill="var(--text-dim)" fontSize="11"
                fontFamily="'Geist Mono', monospace">{d.level}</text>
              <rect x={pad.l} y={y} width={bw} height={bh} fill={accent} fillOpacity="0.8" rx="2" />
              <text x={pad.l + bw + 6} y={y + bh / 2 + 4} fill="var(--text-dim)"
                fontSize="10" fontFamily="'Geist Mono', monospace">
                {fmtMoney(d.avg)} · {d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
