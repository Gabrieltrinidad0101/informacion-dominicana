import { useState, useEffect } from 'react';
import { fetchInstitutionData } from '../utils/fetchInstitutionData';
import { TotalConsolidadoPanel } from '../components/ui/TotalConsolidadoPanel';
import { EmployeeTable } from '../components/ui/EmployeeTable';
import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';
import { DeptDonut } from '../components/charts/DeptDonut';

export function InstitutionPayroll({ institution, accent }) {
  const [selected, setSelected] = useState(null);
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

  const deptData = data?.deptData ?? [];
  const contractData = data?.contractData ?? [];

  return (
    <>
      <div className="charts-grid">
        <TotalConsolidadoPanel
          title="Nómina"
          subtitle="Gasto total en nómina · histórico mensual"
          legend="Bruto mensual"
          seriesKey="payroll"
          institution={institution}
          accent={accent}
        />

        <TotalConsolidadoPanel
          title="Total de Empleados"
          subtitle="Cantidad total de empleados · histórico mensual"
          seriesKey="employeersTotal"
          institution={institution}
          accent={accent}
        />

        <TotalConsolidadoPanel
          title="Empleados Masculinos"
          subtitle="Cantidad de empleados masculinos · histórico mensual"
          seriesKey="employeersM"
          institution={institution}
          accent={accent}
        />

        <TotalConsolidadoPanel
          title="Empleadas Femeninas"
          subtitle="Cantidad de empleadas femeninas · histórico mensual"
          seriesKey="employeersF"
          institution={institution}
          accent={accent}
        />
      </div>

      <EmployeeTable institution={institution} accent={accent} onOpen={setSelected} />

      {loading && (
        <div style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>Cargando datos…</div>
      )}
      {error && (
        <div style={{ padding: 48, color: '#f87171', textAlign: 'center' }}>Error al cargar datos: {error}</div>
      )}

      {!loading && !error && (
        <div className="charts-grid">
          <div className="panel" style={{ gridColumn: 'span 6' }}>
            <div className="panel-head">
              <div>
                <div className="panel-title">Distribución por área</div>
                <div className="panel-sub">Empleados por departamento</div>
              </div>
            </div>
            <div style={{ display: 'flex', padding: '6px 18px 18px', gap: 16, alignItems: 'center', height: '250px' }}>
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
      )}

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />
    </>
  );
}
