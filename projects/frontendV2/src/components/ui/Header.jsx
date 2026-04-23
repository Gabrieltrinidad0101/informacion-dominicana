import { Icon } from './Icon';

export function Header({ title, subtitle, accent }) {
  return (
    <header className="topbar">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase', letterSpacing: 1 }}>
            Lumen · People
          </div>
          <span style={{ color: 'var(--line)' }}>/</span>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace" }}>{title.toLowerCase()}</div>
        </div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      <div className="topbar-actions" style={{ display: 'none' }}>
        <div className="pill">
          <span style={{ width: 6, height: 6, borderRadius: 3, background: accent, boxShadow: `0 0 6px ${accent}` }} />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11 }}>FY26 Q1</span>
        </div>
        <button className="icon-btn" title="Notifications"><Icon name="bell" /></button>
        <button className="btn-primary" style={{ background: accent, color: '#0a0d12' }}>
          <Icon name="plus" size={14} /> Invite
        </button>
      </div>
    </header>
  );
}
