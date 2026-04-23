import { useState, useMemo } from 'react';
import D from '../data/mockData';
import { PayrollChart } from '../components/charts/PayrollChart';
import { EmployeeTable } from '../components/ui/EmployeeTable';
import { EmployeeDrawer } from '../components/ui/EmployeeDrawer';
import { DeptDonut } from '../components/charts/DeptDonut';

const MONTHS = D.MONTHS;

function genSeries(seed, base, variance) {
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  return MONTHS.map(() => Math.round(base + (rand() - 0.5) * variance));
}

const CONFIGS = {
  jarabacoa: {
    seed: 11, base: 850000,
    depts: ["Obras Públicas", "Administrativo", "Alcaldía", "Servicios", "Legal"],
  },
  moca: {
    seed: 22, base: 1200000,
    depts: ["Obras Públicas", "Administrativo", "Alcaldía", "Servicios", "IT"],
  },
  cotui: {
    seed: 33, base: 950000,
    depts: ["Obras Públicas", "Administrativo", "Alcaldía", "Servicios", "Finanzas"],
  },
  intrant: {
    seed: 44, base: 3500000,
    depts: ["Operaciones", "Regulación", "Administrativo", "IT", "Legal", "Recursos Humanos"],
  },
};

function buildDeptData(cfg) {
  let s = cfg.seed + 10;
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  return cfg.depts.map(name => ({ name, count: 5 + Math.round(rand() * 20) }));
}

function buildEmployees(institution, cfg) {
  return D.EMPLOYEES.slice(0, 20).map((e, i) => ({
    ...e,
    id: institution.slice(0, 2).toUpperCase() + e.id,
    dept: cfg.depts[i % cfg.depts.length],
    email: e.email.replace('@lumen.co', `@${institution}.gob.do`),
  }));
}

export function InstitutionPayroll({ institution, accent }) {
  const [selected, setSelected] = useState(null);

  const cfg = CONFIGS[institution] ?? CONFIGS.intrant;

  const series = useMemo(() => ({
    permanente: genSeries(cfg.seed,     cfg.base * 0.60, cfg.base * 0.10),
    contratada: genSeries(cfg.seed + 1, cfg.base * 0.25, cfg.base * 0.08),
    eventual:   genSeries(cfg.seed + 2, cfg.base * 0.10, cfg.base * 0.05),
    total:      genSeries(cfg.seed + 3, cfg.base,         cfg.base * 0.12),
  }), [cfg]);

  const deptData = useMemo(() => buildDeptData(cfg), [cfg]);

  const contractData = useMemo(() => {
    const total = deptData.reduce((a, d) => a + d.count, 0);
    return [
      { name: "Permanente", count: Math.round(total * 0.60) },
      { name: "Contratado", count: Math.round(total * 0.28) },
      { name: "Eventual",   count: Math.round(total * 0.12) },
    ];
  }, [deptData]);

  const employees = useMemo(() => buildEmployees(institution, cfg), [institution, cfg]);

  return (
    <>
      {/* ── 4 PayrollCharts ── */}
      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Permanente</div>
              <div className="panel-sub">Personal de planta · últimos 12 meses</div>
            </div>
            <div className="legend">
              <span className="dot" style={{ background: accent }} /> Bruto mensual
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.permanente} labels={MONTHS} accent={accent} variant="area" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Contratada</div>
              <div className="panel-sub">Personal contratado · últimos 12 meses</div>
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.contratada} labels={MONTHS} accent={accent} variant="bars" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Nómina Eventual</div>
              <div className="panel-sub">Personal eventual · últimos 12 meses</div>
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.eventual} labels={MONTHS} accent={accent} variant="line" />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Total Consolidado</div>
              <div className="panel-sub">Suma de todas las categorías · últimos 12 meses</div>
            </div>
            <div className="legend">
              <span className="dot" style={{ background: accent }} /> Total
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={series.total} labels={MONTHS} accent={accent} variant="area" />
          </div>
        </div>
      </div>

      {/* ── Tabla de empleados ── */}
      <EmployeeTable rows={employees} depts={cfg.depts} accent={accent} onOpen={setSelected} />

      {/* ── 2 DeptDonuts ── */}
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
    </>
  );
}
