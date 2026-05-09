import { useState, useRef, useEffect } from 'react';
import { useSize } from '../../hooks/useSize';
import { requestJson } from '../../utils/request.js';
import { INSTITUTION_NAMES } from '../../utils/institutionNames.js';
import { Icon } from '../ui/Icon';

export function DeptDonut({ institution, dataKey, accent }) {
  const [rawData, setRawData] = useState([]);
  const [allowedMonths, setAllowedMonths] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [hover, setHover] = useState(null);

  const institutionName = INSTITUTION_NAMES[institution];
  const base = institutionName ? `${institutionName}/nomina/exportToJson` : null;

  const parseStats = (positionStats) =>
    Object.entries(positionStats)
      .map(([name, d]) => ({
        name,
        count: dataKey === 'spending'
          ? Number(d.averageSalaryPercentage)
          : Number(d.employeeCount),
      }))
      .sort((a, b) => b.count - a.count);

  const fetchByDate = async (date, baseUrl) => {
    setLoading(true);
    try {
      const stats = await requestJson(`${baseUrl}/percentageOfSpendingByPosition${date}`);
      setRawData(parseStats(stats));
    } catch {
      setRawData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!base) { setLoading(false); return; }
    setLoading(true);
    requestJson(`${base}/header`)
      .then(data => {
        const months = data.map(v => v.replace(/[^0-9-]/g, '')).sort();
        setAllowedMonths(months);
        const latest = months[months.length - 1];
        setCurrentDate(latest);
        return fetchByDate(latest, base);
      })
      .catch(() => setLoading(false));
  }, [institution]);

  const handleDateChange = (date) => {
    setCurrentDate(date);
    fetchByDate(date, base);
  };

  const data = rawData;

  useEffect(() => {
    if (!q) { setHover(null); return; }
    const idx = data.findIndex(d => d.name.toLowerCase().includes(q.toLowerCase()));
    setHover(idx >= 0 ? idx : null);
  }, [q, data]);

  const container = useRef(null);
  const { w: containerW } = useSize(container);
  const isMobile = containerW < 600;

  const wrap = useRef(null);

  const VC = 100;
  const VR = 76;
  const VIR = 52;

  const total = data.reduce((s, d) => s + d.count, 0);
  const colors = data.map((_, i) => `oklch(0.75 0.14 ${90 + i * 32})`);

  let angle = -Math.PI / 2;
  const arcs = total > 0 ? data.map((d, i) => {
    const a0 = angle;
    const a1 = angle + (d.count / total) * Math.PI * 2;
    angle = a1;
    const large = (a1 - a0) > Math.PI ? 1 : 0;
    const x0 = VC + Math.cos(a0) * VR, y0 = VC + Math.sin(a0) * VR;
    const x1 = VC + Math.cos(a1) * VR, y1 = VC + Math.sin(a1) * VR;
    const xi1 = VC + Math.cos(a1) * VIR, yi1 = VC + Math.sin(a1) * VIR;
    const xi0 = VC + Math.cos(a0) * VIR, yi0 = VC + Math.sin(a0) * VIR;
    const path = `M${x0},${y0} A${VR},${VR} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${VIR},${VIR} 0 ${large} 0 ${xi0},${yi0} Z`;
    return { d: path, color: colors[i], name: d.name, count: d.count };
  }) : [];

  const centerValue = hover === null ? total : arcs[hover]?.count ?? 0;
  const centerLabel = hover === null ? 'TOTAL' : (arcs[hover]?.name ?? '').toUpperCase();

  const legend = (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'row' : 'column',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      gap: isMobile ? '6px 14px' : '6px',
      overflowY: isMobile ? 'visible' : 'auto',
      padding: isMobile ? '8px 0 0' : '4px 0',
      width: isMobile ? '100%' : '160px',
      flexShrink: isMobile ? 0 : 0,
      minHeight: 0,
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
    <div ref={container} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', gap: '8px', minWidth: 0 }}>
      <div className="table-tools" style={{ flexShrink: 0 }}>
        <div className="search">
          <Icon name="search" size={14} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar posición…" />
          {q && <button className="clear" onClick={() => setQ('')}><Icon name="close" size={12} /></button>}
        </div>
        {allowedMonths.length > 0 && (
          <div className="date-filter">
            <span className="date-label">Período</span>
            <select className="select" value={currentDate ?? ''} onChange={e => handleDateChange(e.target.value)}>
              {allowedMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', minHeight: 0, overflow: 'hidden' }}>
          <div ref={wrap} style={{ position: 'relative', flex: isMobile ? '0 0 auto' : '1 1 0', minWidth: 0, height: isMobile ? '220px' : '100%', overflow: 'hidden' }}>
            <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
              {arcs.map((a, i) => (
                <path key={i} d={a.d} fill={a.color}
                  opacity={hover === null || hover === i ? 1 : 0.35}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer', transition: 'opacity 120ms' }} />
              ))}
              <text x={VC} y={VC - 4} textAnchor="middle" fill="var(--text-dim)"
                fontSize="10" fontFamily="'Geist Mono', monospace">
                {centerLabel}
              </text>
              <text x={VC} y={VC + 16} textAnchor="middle" fill="var(--text)"
                fontSize="22" fontWeight="600" fontFamily="'Geist Mono', monospace">
                {Number(centerValue).toFixed(2)}
              </text>
            </svg>
          </div>
          {legend}
        </div>
      )}
    </div>
  );
}
