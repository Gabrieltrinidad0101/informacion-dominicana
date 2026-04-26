import { Icon } from '../components/ui/Icon';

const PAYROLL_SOURCES = [
  {
    key: 'jarabacoa',
    name: 'Ayuntamiento de Jarabacoa',
    type: 'Ayuntamiento',
    link: 'https://ayuntamientojarabacoa.gob.do/transparencia/documentos/nomina/',
    data: 'Nómina',
    format: 'PDF',
    route: '/jarabacoa',
  },
  {
    key: 'moca',
    name: 'Ayuntamiento de Moca',
    type: 'Ayuntamiento',
    link: 'https://ayuntamientomoca.gob.do/transparencia/documentos/nomina/',
    data: 'Nómina',
    format: 'PDF',
    route: '/moca',
  },
  {
    key: 'cotui',
    name: 'Ayuntamiento de Cotuí',
    type: 'Ayuntamiento',
    link: null,
    data: 'Nómina',
    format: 'PDF',
    route: '/cotui',
  },
  {
    key: 'lascharcas',
    name: 'Ayuntamiento de Las Charcas',
    type: 'Ayuntamiento',
    link: 'https://ayuntamientolascharcas.gob.do/transparencia/documentos/nomina/',
    data: 'Nómina',
    format: 'PDF',
    route: null,
  },
  {
    key: 'intrant',
    name: 'INTRANT',
    type: 'Institución Gubernamental',
    link: 'https://intrant.gob.do/transparencia/recursos-humanos/nomina/',
    data: 'Nómina',
    format: 'Excel',
    route: '/intrant',
  },
  {
    key: 'digesett',
    name: 'DIGESETT',
    type: 'Institución Gubernamental',
    link: 'https://digesett.gob.do/transparencia/index.php/recursos-humanos/nomina/',
    data: 'Nómina',
    format: 'PDF',
    route: null,
  },
  {
    key: 'ogtic',
    name: 'OGTIC',
    type: 'Institución Gubernamental',
    link: 'https://ogtic.gob.do/transparencia/recursos-humanos/nomina/',
    data: 'Nómina',
    format: 'Excel',
    route: '/ogtic',
  },
];

const WORLDBANK_CATEGORIES = [
  { id: 'economia',      label: 'Economía',       route: '/economia',      count: 12 },
  { id: 'social',        label: 'Social',          route: '/social',        count: 8  },
  { id: 'salud',         label: 'Salud',           route: '/salud',         count: 10 },
  { id: 'educacion',     label: 'Educación',       route: '/educacion',     count: 9  },
  { id: 'medioambiente', label: 'Medioambiente',   route: '/medioambiente', count: 7  },
  { id: 'militar',       label: 'Militar',         route: '/militar',       count: 5  },
];

const PIPELINE_STEPS = [
  { label: 'Descarga',        desc: 'Puppeteer scraping del portal de transparencia. PDFs y Excel subidos a MinIO.' },
  { label: 'IA Process',      desc: 'Claude (PDFs) y DeepSeek (Excel) extraen nombre, cédula, cargo, ingreso, sexo.' },
  { label: 'Insert Data',     desc: 'Datos validados e insertados en PostgreSQL. Registros duplicados son reemplazados.' },
  { label: 'Export to JSON',  desc: 'Agregaciones por mes y año se exportan como JSON estático a MinIO.' },
  { label: 'Frontend',        desc: 'Esta app consume los JSON vía el proxy filesManager en puerto 4000.' },
];

function FormatBadge({ format }) {
  const colors = {
    PDF:   { bg: 'oklch(0.28 0.06 25 / 0.5)',  text: '#f2a06a' },
    Excel: { bg: 'oklch(0.28 0.06 145 / 0.5)', text: '#6af2a1' },
  };
  const c = colors[format] || { bg: 'var(--tag-bg)', text: 'var(--text-dim)' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 7px',
      borderRadius: 4,
      fontSize: 10.5,
      fontFamily: "'Geist Mono', monospace",
      background: c.bg,
      color: c.text,
      letterSpacing: 0.3,
    }}>
      {format}
    </span>
  );
}

export function Analytics({ accent }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Stats row */}
      <div className="kpi-row-grid">
        {[
          { label: 'Instituciones',    value: PAYROLL_SOURCES.length },
          { label: 'Indicadores WB',   value: WORLDBANK_CATEGORIES.reduce((a, c) => a + c.count, 0) },
          { label: 'Tipos de datos',   value: 2 },
          { label: 'Actualización',    value: 'Mensual' },
        ].map(k => (
          <div key={k.label} className="kpi">
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 22 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Payroll sources */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Nóminas gubernamentales</div>
            <div className="panel-sub">
              Datos extraídos mensualmente de los portales de transparencia oficiales
            </div>
          </div>
          <span style={{
            fontSize: 10.5,
            fontFamily: "'Geist Mono', monospace",
            padding: '3px 8px',
            borderRadius: 4,
            background: 'oklch(0.85 0.18 130 / 0.12)',
            color: accent,
            border: `1px solid ${accent}33`,
          }}>
            {PAYROLL_SOURCES.length} fuentes
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Institución', 'Tipo', 'Datos', 'Formato', 'Fuente oficial'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left',
                    padding: '10px 20px',
                    fontSize: 10.5,
                    fontWeight: 500,
                    color: 'var(--text-dimmer)',
                    fontFamily: "'Geist Mono', monospace",
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    borderTop: '1px solid var(--line-soft)',
                    borderBottom: '1px solid var(--line-soft)',
                    background: 'var(--th-bg)',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PAYROLL_SOURCES.map((src, i) => (
                <tr key={src.key} style={{ transition: 'background 80ms', cursor: 'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: 'var(--row-pad) 20px', borderBottom: '1px solid var(--line-soft)', color: 'var(--text)', fontWeight: 500 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `oklch(0.75 0.14 ${90 + i * 40})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#0a0d12', flexShrink: 0,
                      }}>
                        {src.name.charAt(0)}
                      </div>
                      {src.name}
                    </div>
                  </td>
                  <td style={{ padding: 'var(--row-pad) 20px', borderBottom: '1px solid var(--line-soft)', color: 'var(--text-dim)' }}>
                    {src.type}
                  </td>
                  <td style={{ padding: 'var(--row-pad) 20px', borderBottom: '1px solid var(--line-soft)', color: 'var(--text-dim)' }}>
                    {src.data}
                  </td>
                  <td style={{ padding: 'var(--row-pad) 20px', borderBottom: '1px solid var(--line-soft)' }}>
                    <FormatBadge format={src.format} />
                  </td>
                  <td style={{ padding: 'var(--row-pad) 20px', borderBottom: '1px solid var(--line-soft)' }}>
                    {src.link ? (
                      <a href={src.link} target="_blank" rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          color: accent, fontSize: 12, textDecoration: 'none',
                          fontFamily: "'Geist Mono', monospace",
                        }}>
                        Portal oficial
                        <Icon name="arrow" size={11} />
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-dimmer)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* World Bank */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Banco Mundial — Indicadores</div>
            <div className="panel-sub">
              Datos abiertos del World Bank API · República Dominicana (DOM)
            </div>
          </div>
          <a href="https://data.worldbank.org/country/dominican-republic" target="_blank" rel="noopener noreferrer"
            className="ghost-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
            data.worldbank.org
            <Icon name="arrow" size={11} />
          </a>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 1,
          background: 'var(--line-soft)',
          borderTop: '1px solid var(--line-soft)',
        }}>
          {WORLDBANK_CATEGORIES.map(cat => (
            <a key={cat.id} href={cat.route}
              style={{
                background: 'var(--panel)',
                padding: '16px 20px',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'background 100ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--hover-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--panel)'}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{cat.label}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace" }}>
                {cat.count} indicadores
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Pipeline */}
      <div className="panel">
        <div className="panel-head">
          <div>
            <div className="panel-title">Pipeline de datos</div>
            <div className="panel-sub">Cómo se procesan los datos desde la fuente hasta el frontend</div>
          </div>
        </div>
        <div style={{ padding: '8px 20px 20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: i === PIPELINE_STEPS.length - 1 ? accent : 'var(--panel-2)',
                  border: `1.5px solid ${i === PIPELINE_STEPS.length - 1 ? accent : 'var(--line)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  color: i === PIPELINE_STEPS.length - 1 ? '#0a0d12' : 'var(--text-dim)',
                  fontFamily: "'Geist Mono', monospace",
                  flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ width: 1, height: 28, background: 'var(--line-soft)' }} />
                )}
              </div>
              <div style={{ paddingTop: 4, paddingBottom: i < PIPELINE_STEPS.length - 1 ? 0 : 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
                  {step.label}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.6, paddingBottom: 20 }}>
                  {step.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
