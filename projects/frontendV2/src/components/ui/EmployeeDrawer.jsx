import { Icon } from './Icon';
import { fmtMoney } from '../../utils/format';

export function EmployeeDrawer({ employee, onClose, accent }) {
  if (!employee) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="avatar-lg" style={{ background: `oklch(0.4 0.05 ${(employee.id.charCodeAt(1) * 37) % 360})` }}>
              {employee.initials}
            </div>
            <div>
              <div style={{ fontSize: 20, color: 'var(--text)', fontWeight: 600 }}>{employee.name}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{employee.title} · {employee.dept}</div>
              <div style={{ color: 'var(--text-dimmer)', fontSize: 11, fontFamily: "'Geist Mono', monospace", marginTop: 4 }}>
                {employee.id} · {employee.email}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div className="drawer-grid">
          <div className="detail">
            <div className="detail-k">Level</div>
            <div className="detail-v mono">{employee.level}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Location</div>
            <div className="detail-v">{employee.location}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Salary</div>
            <div className="detail-v mono" style={{ color: accent }}>{fmtMoney(employee.salary)}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Start date</div>
            <div className="detail-v mono">{employee.startDate}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Status</div>
            <div className="detail-v">
              <span className="dot" style={{ background: employee.status === "Active" ? accent : "#b88a3b" }} />
              {employee.status}
            </div>
          </div>
          <div className="detail">
            <div className="detail-k">Performance</div>
            <div className="detail-v">{employee.perf}</div>
          </div>
        </div>

        <div style={{ padding: '18px 20px', borderTop: '1px solid var(--line-soft)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dimmer)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontFamily: "'Geist Mono', monospace" }}>
            Recent activity
          </div>
          <div className="timeline">
            <div className="tl-item"><span className="tl-dot" style={{ background: accent }} /><div><b>Apr 12</b> · Promotion cycle reviewed</div></div>
            <div className="tl-item"><span className="tl-dot" /><div><b>Mar 04</b> · Quarterly 1:1 completed</div></div>
            <div className="tl-item"><span className="tl-dot" /><div><b>Feb 20</b> · Project milestone shipped</div></div>
            <div className="tl-item"><span className="tl-dot" /><div><b>Jan 15</b> · Joined new squad</div></div>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="ghost-btn">Full profile</button>
          <button className="btn-primary" style={{ background: accent, color: '#0a0d12' }}>
            Message {employee.name.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  );
}
