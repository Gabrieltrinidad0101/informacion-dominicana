import { useState } from 'react';
import D from '../data/mockData';
import { PayrollChart } from '../components/charts/PayrollChart';
import { HeadcountChart } from '../components/charts/HeadcountChart';
import { DeptDonut } from '../components/charts/DeptDonut';
import { SalaryBars } from '../components/charts/SalaryBars';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { EmployeeTable } from '../components/ui/EmployeeTable';
import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';
import { Icon } from '../components/ui/Icon';
import { fmtMoney } from '../utils/format';

const CMP_PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

const SERIES = {
  payroll:    { key: 'payroll',    label: 'Monthly payroll', data: D.payrollSeries,    fmt: fmtMoney },
  headcount:  { key: 'headcount',  label: 'Headcount',       data: D.headcountSeries,  fmt: n => n + ' ppl' },
  avgSalary:  { key: 'avgSalary',  label: 'Avg salary',      data: D.payrollSeries.map((p, i) => Math.round(p / D.headcountSeries[i])), fmt: fmtMoney },
  attrition:  { key: 'attrition', label: 'Attrition %',      data: [6.2,5.9,5.7,5.4,5.2,5.0,5.1,4.9,4.8,4.6,4.7,4.8], fmt: n => n.toFixed(1) + '%' },
};

export function Analytics({ accent, payrollStyle }) {
  const [selected, setSelected] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareWith, setCompareWith] = useState([]);
  const [draftCompare, setDraftCompare] = useState([]);

  return (
    <>
      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {compareWith.length
                  ? `Payroll vs ${compareWith.map(k => SERIES[k].label).join(' · ')}`
                  : 'Monthly payroll'}
              </div>
              <div className="panel-sub">Total gross, last 12 months · USD</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {compareWith.length > 0 && (
                <div className="legend" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="dot" style={{ background: accent }} /> Payroll
                  </span>
                  {compareWith.map((k, i) => (
                    <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span className="dot" style={{ background: CMP_PALETTE[i % CMP_PALETTE.length] }} />
                      {SERIES[k].label}
                    </span>
                  ))}
                </div>
              )}
              <button className="ghost-btn" onClick={() => { setDraftCompare(compareWith); setCompareOpen(true); }}>
                {compareWith.length ? 'Edit comparison' : 'Compare charts'}
              </button>
              {compareWith.length > 0 && (
                <button className="ghost-btn" onClick={() => setCompareWith([])}>Clear</button>
              )}
            </div>
          </div>
          <div style={{ height: 260, padding: '6px 18px 14px' }}>
            {compareWith.length ? (
              <ComparisonChart
                seriesA={SERIES.payroll}
                extras={compareWith.map(k => SERIES[k])}
                labels={D.MONTHS}
                accent={accent}
              />
            ) : (
              <PayrollChart data={D.payrollSeries} labels={D.MONTHS} accent={accent} variant={payrollStyle} />
            )}
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Headcount</div>
              <div className="panel-sub">People by month</div>
            </div>
          </div>
          <div style={{ height: 260, padding: '6px 18px 14px' }}>
            <HeadcountChart data={D.headcountSeries} labels={D.MONTHS} accent={accent} />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 5' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">By department</div>
              <div className="panel-sub">Hover to see counts</div>
            </div>
          </div>
          <div style={{ display: 'flex', padding: '6px 18px 18px', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '0 0 180px', height: 180 }}>
              <DeptDonut data={D.deptData} accent={accent} />
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {D.deptData.map((d, i) => (
                <div key={d.name} className="legend-row">
                  <span className="dot" style={{ background: `oklch(0.75 0.14 ${90 + i * 32})` }} />
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>{d.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", color: '#e5e9ef' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 7' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Avg salary by level</div>
              <div className="panel-sub">Mean base, excluding equity</div>
            </div>
          </div>
          <div style={{ height: 200, padding: '6px 18px 14px' }}>
            <SalaryBars data={D.salaryByLevel} accent={accent} />
          </div>
        </div>
      </div>

      <EmployeeTable rows={D.EMPLOYEES} depts={D.DEPTS} accent={accent} onOpen={setSelected} />
      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />

      {compareOpen && (
        <div className="drawer-overlay" onClick={() => setCompareOpen(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Compare charts</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Select one or more series to overlay on Monthly payroll.
                </div>
              </div>
              <button className="icon-btn" onClick={() => setCompareOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Series</th>
                    <th style={{ textAlign: 'right' }}>Latest</th>
                    <th style={{ textAlign: 'right' }}>Min</th>
                    <th style={{ textAlign: 'right' }}>Max</th>
                    <th style={{ textAlign: 'right' }}>Δ 12m</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(SERIES).filter(s => s.key !== 'payroll').map(s => {
                    const on = draftCompare.includes(s.key);
                    const colorIdx = draftCompare.indexOf(s.key);
                    const latest = s.data[s.data.length - 1];
                    const first = s.data[0];
                    const delta = ((latest - first) / first) * 100;
                    return (
                      <tr key={s.key}
                        className={on ? 'on' : ''}
                        onClick={() => setDraftCompare(on
                          ? draftCompare.filter(k => k !== s.key)
                          : [...draftCompare, s.key])}>
                        <td>
                          <span className={'cmp-check' + (on ? ' on' : '')}
                            style={on ? { background: CMP_PALETTE[colorIdx % CMP_PALETTE.length], borderColor: CMP_PALETTE[colorIdx % CMP_PALETTE.length] } : {}}>
                            {on && (
                              <svg width="10" height="10" viewBox="0 0 10 10">
                                <path d="M2 5l2 2 4-4" fill="none" stroke="#000" strokeWidth="1.8" />
                              </svg>
                            )}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text)', fontWeight: 500 }}>{s.label}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Geist Mono', monospace" }}>{s.fmt(latest)}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)' }}>{s.fmt(Math.min(...s.data))}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)' }}>{s.fmt(Math.max(...s.data))}</td>
                        <td style={{ textAlign: 'right', fontFamily: "'Geist Mono', monospace", color: delta >= 0 ? '#4ade80' : '#f87171' }}>
                          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="compare-foot">
              <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace" }}>
                {draftCompare.length} selected
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost-btn" onClick={() => setDraftCompare([])}>Clear</button>
                <button className="primary-btn" onClick={() => { setCompareWith(draftCompare); setCompareOpen(false); }}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
