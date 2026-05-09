import { useState, useEffect, useRef } from 'react';
import { requestJson } from '../utils/request';
import { TotalConsolidadoPanel } from '../components/ui/TotalConsolidadoPanel';
import { fmtNum } from '../utils/format';

function toChartData(records) {
  const seen = new Set();
  return (records || [])
    .filter(r => r.value !== null && r.value !== undefined && isFinite(r.value))
    .map(r => ({ time: `${String(r.time).slice(0, 4)}-01-01`, value: Number(r.value) }))
    .sort((a, b) => a.time.localeCompare(b.time))
    .filter(r => {
      if (seen.has(r.time)) return false;
      seen.add(r.time);
      return true;
    });
}

const parseRecord = raw => toChartData(raw);

function LazyChartPanel({ header, category, headers, accent }) {
  const [values, setValues] = useState(null);
  const containerRef = useRef();
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (loaded.current || !entry.isIntersecting) return;
      loaded.current = true;
      try {
        const records = await requestJson(`worldBank/${category}/${header.title}`);
        console.log(`worldBank/${category}/${header.title}`);
        const data = toChartData(records);
        if (data.length >= 2) setValues(data);
      } catch {
        // leave skeleton visible on error
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [category, header.title]);

  const compareOptions = headers
    .filter(h => h.title !== header.title)
    .map(h => ({ label: h.title.replaceAll('_', ' '), url: `worldBank/${category}/${h.title}` }));

  const subtitle = header.indicatorId ? (
    <a
      href={`https://data.worldbank.org/indicator/${header.indicatorId}?locations=DO`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: 'var(--text-dim)', fontSize: 11, textDecoration: 'none' }}
    >
      Banco Mundial ↗
    </a>
  ) : 'Banco Mundial';

  return (
    <div ref={containerRef} style={{ gridColumn: 'span 6', ...(!values && { minHeight: 220 }) }}>
      <TotalConsolidadoPanel
        title={header.title.replaceAll('_', ' ')}
        subtitle={subtitle}
        values={values}
        compareOptions={compareOptions}
        parseRecord={parseRecord}
        fmt={fmtNum}
        accent={accent}
      />
    </div>
  );
}

export function WorldBankPage({ category, accent }) {
  const [headers, setHeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setHeaders([]);

    requestJson(`worldBank/${category}/headers`)
      .then(hdrs => {
        setHeaders(hdrs);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [category]);

  if (loading) {
    return (
      <div style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>
        Cargando indicadores…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 48, color: '#f87171', textAlign: 'center' }}>
        Error al cargar datos: {error}
      </div>
    );
  }

  if (headers.length === 0) {
    return (
      <div style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>
        No hay datos disponibles para esta categoría.
      </div>
    );
  }

  return (
    <div className="charts-grid">
      {headers.map(h => (
        <LazyChartPanel
          key={h.title}
          header={h}
          category={category}
          headers={headers}
          accent={accent}
        />
      ))}
    </div>
  );
}
