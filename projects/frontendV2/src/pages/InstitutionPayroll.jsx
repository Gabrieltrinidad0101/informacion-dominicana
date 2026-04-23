import { useState, useMemo, useEffect } from 'react';
import { fetchInstitutionData } from '../utils/fetchInstitutionData';
import { PayrollChart } from '../components/charts/PayrollChart';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { EmployeeTable } from '../components/ui/EmployeeTable';
import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';
import { DeptDonut } from '../components/charts/DeptDonut';
import { Icon } from '../components/ui/Icon';
import { fmtMoney } from '../utils/format';

const CMP_PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

export function InstitutionPayroll({ institution, accent }) {
  const [selected, setSelected] = useState(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareWith, setCompareWith] = useState([]);
  const [draftCompare, setDraftCompare] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    fetchInstitutionData(institution)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [institution]);

  const months      = data?.months      ?? [];
  const series      = data?.series      ?? { total: [], permanente: [], contratada: [], eventual: [] };
  const deptData    = data?.deptData    ?? [];
  const contractData= data?.contractData?? [];
  const employees   = data?.employees   ?? [];
  const depts       = data?.depts       ?? [];

  const SERIES = useMemo(() => ({
    total:      { key: 'total',      label: 'Total consolidado', data: series.total,      fmt: fmtMoney },
    permanente: { key: 'permanente', label: 'Permanente',        data: series.permanente, fmt: fmtMoney },
    contratada: { key: 'contratada', label: 'Contratada',        data: series.contratada, fmt: fmtMoney },
    eventual:   { key: 'eventual',   label: 'Eventual',          data: series.eventual,   fmt: fmtMoney },
  }), [series]);

  if (loading) {
    return <div style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>Cargando datos…</div>;
  }

  if (error) {
    return <div style={{ padding: 48, color: '#f87171', textAlign: 'center' }}>Error al cargar datos: {error}</div>;
  }

  return (
    <>
      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Permanente</div>
              <div className="panel-sub">Personal de planta · histórico mensual</div>
            </div>
            <div className="legend">
              <span className="dot" style={{ background: accent }} /> Bruto mensual
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.permanente} labels={months} accent={accent} variant="area" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Contratada</div>
              <div className="panel-sub">Personal contratado · histórico mensual</div>
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.contratada} labels={months} accent={accent} variant="bars" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Eventual</div>
              <div className="panel-sub">Personal eventual · histórico mensual</div>
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.eventual} labels={months} accent={accent} variant="line" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {compareWith.length
                  ? `Total vs ${compareWith.map(k => SERIES[k].label).join(' · ')}`
                  : 'Total Consolidado'}
              </div>
              <div className="panel-sub">Suma de todas las categorías · histórico mensual</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {compareWith.length > 0 && (
                <div className="legend" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="dot" style={{ background: accent }} /> Total
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
                {compareWith.length ? 'Editar comparación' : 'Comparar series'}
              </button>
              {compareWith.length > 0 && (
                <button className="ghost-btn" onClick={() => setCompareWith([])}>Limpiar</button>
              )}
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            {compareWith.length ? (
              <ComparisonChart
                seriesA={SERIES.total}
                extras={compareWith.map(k => SERIES[k])}
                labels={months}
                accent={accent}
              />
            ) : (
              <PayrollChart data={series.total} labels={months} accent={accent} variant="area" />
            )}
          </div>
        </div>
      </div>

      <EmployeeTable rows={employees} depts={depts} accent={accent} onOpen={setSelected} />

      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Distribución por área</div>
              <div className="panel-sub">Empleados por departamento</div>
            </div>
          </div>
          <div style={{ display: 'flex', padding: '6px 18px 18px', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '0 0 180px', height: 180 }}>
              <DeptDonut data={deptData} accent={accent} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deptData.map((d, i) => (
                <div key={d.name} className="legend-row">
                  <span className="dot" style={{ background: `oklch(0.75 0.14 ${90 + i * 32})` }} />
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>{d.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", color: '#e5e9ef' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Distribución por contrato</div>
              <div className="panel-sub">Empleados por tipo de vinculación</div>
            </div>
          </div>
          <div style={{ display: 'flex', padding: '6px 18px 18px', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '0 0 180px', height: 180 }}>
              <DeptDonut data={contractData} accent={accent} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {contractData.map((d, i) => (
                <div key={d.name} className="legend-row">
                  <span className="dot" style={{ background: `oklch(0.75 0.14 ${90 + i * 32})` }} />
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>{d.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", color: '#e5e9ef' }}>{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />

      {compareOpen && (
        <div className="drawer-overlay" onClick={() => setCompareOpen(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Comparar series</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Selecciona una o más series para superponer al Total Consolidado.
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
                    <th>Serie</th>
                    <th style={{ textAlign: 'right' }}>Último</th>
                    <th style={{ textAlign: 'right' }}>Mín</th>
                    <th style={{ textAlign: 'right' }}>Máx</th>
                    <th style={{ textAlign: 'right' }}>Δ total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(SERIES).filter(s => s.key !== 'total').map(s => {
                    const on = draftCompare.includes(s.key);
                    const colorIdx = draftCompare.indexOf(s.key);
                    const latest = s.data[s.data.length - 1] ?? 0;
                    const first  = s.data[0] ?? 0;
                    const delta  = first ? ((latest - first) / first) * 100 : 0;
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
                {draftCompare.length} seleccionadas
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost-btn" onClick={() => setDraftCompare([])}>Limpiar</button>
                <button className="primary-btn" onClick={() => { setCompareWith(draftCompare); setCompareOpen(false); }}>
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
