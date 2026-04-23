import { Icon } from './Icon';

export function KPI({ label, value, delta, positive, spark, accent }) {
  const w = 120, h = 36;
  const max = Math.max(...spark), min = Math.min(...spark);
  const path = spark.map((v, i) => {
    const x = (i / (spark.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * h;
    return `${i ? 'L' : 'M'}${x},${y}`;
  }).join(' ');

  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-row">
        <div className="kpi-value">{value}</div>
        <svg width={w} height={h} style={{ opacity: 0.9 }}>
          <path d={path} fill="none" stroke={accent} strokeWidth="1.5" />
        </svg>
      </div>
      <div className={"kpi-delta " + (positive ? "up" : "down")}>
        <Icon name={positive ? "up" : "down"} size={12} /> {delta}
        <span style={{ color: 'var(--text-dimmer)', marginLeft: 6 }}>vs last month</span>
      </div>
    </div>
  );
}
