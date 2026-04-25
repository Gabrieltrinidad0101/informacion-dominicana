import { useState, useEffect } from 'react';
import { LightweightChart } from '../charts/LightweightChart';
import { Icon } from './Icon';
import { requestJson } from '../../utils/request.js';
import { fmtMoney, fmtNum } from '../../utils/format.js';

const CMP_PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

const INSTITUTION_NAMES = {
  jarabacoa: 'Ayuntamiento de Jarabacoa',
  moca:      'Ayuntamiento de Moca',
  cotui:     'Ayuntamiento de Cotuí',
  intrant:   'Intrant',
  ogtic:     'Ogtic',
};

const seriesConfig = Object.values(INSTITUTION_NAMES).map(name => [
  { name, key: 'payroll',         label: `Nómina - ${name}`,               url: `${name}/nomina/exportToJson/payroll`,         fmt: fmtMoney },
  { name, key: 'employeersTotal', label: `Total de Empleados - ${name}`,   url: `${name}/nomina/exportToJson/employeersTotal`, fmt: fmtNum   },
  { name, key: 'employeersM',     label: `Empleados Masculinos - ${name}`, url: `${name}/nomina/exportToJson/employeersM`,     fmt: fmtNum   },
  { name, key: 'employeersF',     label: `Empleadas Femeninas - ${name}`,  url: `${name}/nomina/exportToJson/employeersF`,     fmt: fmtNum   },
]).flat();

export function TotalConsolidadoPanel({ title, subtitle, legend, seriesKey = 'payroll', institution, accent, onDoubleClick }) {
  const [compareWith, setCompareWith]   = useState([]);
  const [compareOpen, setCompareOpen]   = useState(false);
  const [draftCompare, setDraftCompare] = useState([]);
  // data stored as {time, value}[] — the format lightweight-charts expects
  const [seriesA, setSeriesA]           = useState(null);
  const [extraSeries, setExtraSeries]   = useState({});
  const [search, setSearch]             = useState('');

  useEffect(() => {
    setSeriesA(null);
    setCompareWith([]);
    setExtraSeries({});
    const name   = INSTITUTION_NAMES[institution];
    const config = seriesConfig.find(s => s.name === name && s.key === seriesKey);
    if (!config) return;

    requestJson(config.url).then(raw => {
      setSeriesA({ ...config, data: raw });
    });
  }, [institution, seriesKey]);

  const primaryUrl     = seriesA?.url;
  const compareOptions = seriesConfig.filter(s =>
    s.url !== primaryUrl &&
    s.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleApply = async () => {
    const toFetch = draftCompare.filter(url => !extraSeries[url]);
    const results = await Promise.all(toFetch.map(url => requestJson(url)));
    const next    = { ...extraSeries };
    toFetch.forEach((url, i) => {
      const config = seriesConfig.find(s => s.url === url);
      next[url] = { ...config, data: results[i] };
    });
    setExtraSeries(next);
    setCompareWith(draftCompare);
    setCompareOpen(false);
  };

  const resolvedTitle = compareWith.length
    ? `${title} vs ${compareWith.map(url => seriesConfig.find(s => s.url === url)?.label).join(' · ')}`
    : title;

  const extrasForChart = compareWith.map(url => extraSeries[url]).filter(Boolean);

  return (
    <>
      <div className="panel" style={{ gridColumn: 'span 6' }}>
        <div className="panel-head">
          <div>
            <div className="panel-title">{resolvedTitle}</div>
            <div className="panel-sub">{subtitle}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {compareWith.length > 0 ? (
              <div className="legend" style={{ gap: 10, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className="dot" style={{ background: accent }} /> {seriesA?.label}
                </span>
                {compareWith.map((url, i) => (
                  <span key={url} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="dot" style={{ background: CMP_PALETTE[i % CMP_PALETTE.length] }} />
                    {extraSeries[url]?.label}
                  </span>
                ))}
              </div>
            ) : legend && (
              <div className="legend">
                <span className="dot" style={{ background: accent }} /> {legend}
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
          <LightweightChart
            primary={seriesA?.data}
            extras={extrasForChart}
            accent={accent}
            fmt={seriesA?.fmt}
            onDoubleClick={onDoubleClick}
          />
        </div>
      </div>

      {compareOpen && (
        <div className="drawer-overlay" onClick={() => setCompareOpen(false)}>
          <div className="compare-modal" onClick={e => e.stopPropagation()}>
            <div className="compare-head">
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Comparar series</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                  Selecciona una o más series para superponer a {seriesA?.label}.
                </div>
              </div>
              <button className="icon-btn" onClick={() => setCompareOpen(false)}>
                <Icon name="close" />
              </button>
            </div>
            <input
              className="compare-search"
              placeholder="Buscar serie…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}></th>
                    <th>Serie</th>
                  </tr>
                </thead>
                <tbody>
                  {compareOptions.map(s => {
                    const on       = draftCompare.includes(s.url);
                    const colorIdx = draftCompare.indexOf(s.url);
                    return (
                      <tr key={s.url}
                        className={on ? 'on' : ''}
                        onClick={() => setDraftCompare(on
                          ? draftCompare.filter(u => u !== s.url)
                          : [...draftCompare, s.url])}>
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
                <button className="primary-btn" onClick={handleApply}>Aplicar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
