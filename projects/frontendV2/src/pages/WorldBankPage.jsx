import { useState, useEffect } from 'react';
import { requestJson } from '../utils/request';
import { PayrollChart } from '../components/charts/PayrollChart';

function transformSeries(records) {
  const valid = (records || []).filter(
    r => r.value !== null && r.value !== undefined && isFinite(r.value)
  );
  return {
    data:   valid.map(r => Number(r.value)),
    labels: valid.map(r => String(r.time).slice(0, 4)),
  };
}

export function WorldBankPage({ category, accent }) {
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setCharts([]);

    requestJson(`worldBank/${category}/headers`)
      .then(async headers => {
        const loaded = await Promise.all(
          headers.map(async h => {
            try {
              const records = await requestJson(`worldBank/${category}/${h.title}`);
              const { data, labels } = transformSeries(records);
              if (data.length < 2) return null;
              return { title: h.title, indicatorId: h.indicatorId, data, labels };
            } catch {
              return null;
            }
          })
        );
        setCharts(loaded.filter(Boolean));
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

  if (charts.length === 0) {
    return (
      <div style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>
        No hay datos disponibles para esta categoría.
      </div>
    );
  }

  return (
    <div className="charts-grid">
      {charts.map(c => (
        <div key={c.title} className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">{c.title.replaceAll('_', ' ')}</div>
              {c.indicatorId && (
                <a
                  href={`https://data.worldbank.org/indicator/${c.indicatorId}?locations=DO`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="panel-sub"
                  style={{ color: 'var(--text-dim)', fontSize: 11, textDecoration: 'none' }}
                >
                  Banco Mundial ↗
                </a>
              )}
            </div>
          </div>
          <div style={{ height: 220, padding: '6px 18px 14px' }}>
            <PayrollChart data={c.data} labels={c.labels} accent={accent} variant="line" />
          </div>
        </div>
      ))}
    </div>
  );
}
