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
  const [chartDate, setChartDate] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData(null);
    setChartDate(null);
    fetchInstitutionData(institution)
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [institution]);

  const spendingData = data?.spendingData ?? [];
  const deptData = data?.deptData ?? [];

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
          onDoubleClick={setChartDate}
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
          title="Empleadas"
          subtitle="Cantidad de Empleadas · histórico mensual"
          seriesKey="employeersF"
          institution={institution}
          accent={accent}
        />
      </div>

      <EmployeeTable institution={institution} accent={accent} onOpen={setSelected} externalDate={chartDate} />

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
                <div className="panel-title">Porcentaje de gasto por puesto</div>
                <div className="panel-sub">Distribución del gasto salarial por posición</div>
              </div>
            </div>
            <div style={{ padding: '6px 18px 18px', height: '280px' }}>
              <DeptDonut data={spendingData} accent={accent} />
            </div>
          </div>

          <div className="panel" style={{ gridColumn: 'span 6' }}>
            <div className="panel-head">
              <div>
                <div className="panel-title">Cantidad de empleados por posición</div>
                <div className="panel-sub">Empleados por puesto</div>
              </div>
            </div>
            <div style={{ padding: '6px 18px 18px', height: '280px' }}>
              <DeptDonut data={deptData} accent={accent} />
            </div>
          </div>
        </div>
      )}

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />
    </>
  );
}
