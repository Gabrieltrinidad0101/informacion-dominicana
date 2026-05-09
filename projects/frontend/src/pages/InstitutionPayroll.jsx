import { useState } from 'react';
import { TotalConsolidadoPanel } from '../components/ui/TotalConsolidadoPanel';
import { EmployeeTable } from '../components/ui/EmployeeTable';
import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';
import { DeptDonut } from '../components/charts/DeptDonut';

export function InstitutionPayroll({ institution, accent }) {
  const [selected, setSelected] = useState(null);
  const [chartDate, setChartDate] = useState(null);

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
          title="Personal masculino"
          subtitle="Cantidad de personal masculino · histórico mensual"
          seriesKey="employeersM"
          institution={institution}
          accent={accent}
        />

        <TotalConsolidadoPanel
          title="Personal femenino"
          subtitle="Cantidad de personal femenino · histórico mensual"
          seriesKey="employeersF"
          institution={institution}
          accent={accent}
        />
      </div>

      <EmployeeTable institution={institution} accent={accent} onOpen={setSelected} externalDate={chartDate} />

      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Porcentaje de gasto por puesto</div>
              <div className="panel-sub">Distribución del gasto salarial por posición</div>
            </div>
          </div>
          <div style={{ padding: '6px 18px 18px', height: '340px' }}>
            <DeptDonut institution={institution} dataKey="spending" accent={accent} />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Cantidad de empleados por posición</div>
              <div className="panel-sub">Empleados por puesto</div>
            </div>
          </div>
          <div style={{ padding: '6px 18px 18px', height: '340px' }}>
            <DeptDonut institution={institution} dataKey="count" accent={accent} />
          </div>
        </div>
      </div>

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />
    </>
  );
}
