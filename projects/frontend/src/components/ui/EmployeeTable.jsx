import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { requestJson } from '../../utils/request.js';

const INSTITUTION_NAMES = {
  jarabacoa: 'Ayuntamiento de Jarabacoa',
  moca: 'Ayuntamiento de Moca',
  cotui: 'Ayuntamiento de Cotuí',
  intrant: 'Intrant',
  ogtic: 'Ogtic',
};

const PAGE_SIZE = 10;

export function EmployeeTable({ institution, accent, onOpen, externalDate }) {
  const [q, setQ] = useState("");
  const [salaryVal, setSalaryVal] = useState("");
  const [sexFilter, setSexFilter] = useState("All");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [positionBySalary, setPositionBySalary] = useState({});
  const [allowedMonths, setAllowedMonths] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const [expandedPositions, setExpandedPositions] = useState(new Set());
  const [page, setPage] = useState(1);

  const institutionName = INSTITUTION_NAMES[institution];
  const base = institutionName ? `${institutionName}/nomina/exportToJson` : null;

  const fetchByDate = async (date, baseUrl) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson(`${baseUrl}/employeersByPosition${date}`);
      setPositionBySalary(data);
      setExpandedPositions(new Set());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!base) {
      setError(`Unknown institution: ${institution}`);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setPositionBySalary({});
    setExpandedPositions(new Set());
    requestJson(`${base}/header`)
      .then(data => {
        const months = data.map(v => v.replace(/[^0-9-]/g, ''));
        setAllowedMonths(months);
        const latest = months[months.length - 1];
        setCurrentDate(latest);
        return fetchByDate(latest, base);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, [institution]);

  const handleDateChange = (date) => {
    setCurrentDate(date);
    fetchByDate(date, base);
  };

  useEffect(() => {
    if (!externalDate || !allowedMonths.length) return;
    const match = allowedMonths.find(m => externalDate.startsWith(m) || m.startsWith(externalDate));
    if (match && match !== currentDate) handleDateChange(match);
  }, [externalDate]);

  const rows = useMemo(() => {
    return Object.entries(positionBySalary).flatMap(([pos, emps]) =>
      (emps || []).map((r, i) => ({
        id: r.document ? r.document : `${pos}-${i}`,
        name: r.name || '—',
        dept: pos,
        salary: Number(r.income) || 0,
        sex: r.sex || '',
        startDate: r.date ? String(r.date).slice(0, 10) : '',
        status: r.isHonorific ? 'Honorífico' : 'Activo',
        urlDownload: r.urlDownload ?? null,
      }))
    );
  }, [positionBySalary]);

  const filtered = useMemo(() => {
    const salaryNum = Number(salaryVal);
    const salaryActive = salaryVal !== '' && !isNaN(salaryNum);
    let r = rows.filter(e => {
      const hit = !q || (e.name + ' ' + e.dept + ' ' + e.id).toLowerCase().includes(q.toLowerCase());
      const sexOk = sexFilter === 'All' || e.sex === sexFilter;
      const salaryOk = !salaryActive || e.salary >= salaryNum;
      return hit && sexOk && salaryOk;
    });
    r.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return r;
  }, [rows, q, salaryVal, sexFilter, sort]);

  const groupedFiltered = useMemo(() => {
    const map = new Map();
    filtered.forEach(e => {
      if (!map.has(e.dept)) map.set(e.dept, []);
      map.get(e.dept).push(e);
    });
    return Array.from(map.entries()).map(([position, employees]) => ({ position, employees }));
  }, [filtered]);

  useEffect(() => { setPage(1); }, [q, salaryVal, sexFilter, sort, institution]);

  const totalPages = Math.max(1, Math.ceil(groupedFiltered.length / PAGE_SIZE));
  const pagedGroups = groupedFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const togglePosition = (pos) => {
    setExpandedPositions(prev => {
      const next = new Set(prev);
      if (next.has(pos)) next.delete(pos);
      else next.add(pos);
      return next;
    });
  };

  const toggleSort = k => setSort(s =>
    s.key === k ? { key: k, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: k, dir: 'asc' }
  );

  const Th = ({ k, label, align }) => (
    <th style={{ textAlign: align || 'left' }} onClick={() => toggleSort(k)}>
      <span className="th-inner">
        {label}
        <span className={"sort-ind" + (sort.key === k ? " active" : "")}>
          {sort.key === k ? (sort.dir === 'asc' ? '↑' : '↓') : ''}
        </span>
      </span>
    </th>
  );

  if (loading) {
    return (
      <div className="panel" style={{ padding: 48, color: 'var(--text-dim)', textAlign: 'center' }}>
        Cargando datos…
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ padding: 48, color: '#f87171', textAlign: 'center' }}>
        Error al cargar datos: {error}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">Employee directory</div>
          <div className="panel-sub">{filtered.length} of {rows.length} · {groupedFiltered.length} posiciones</div>
        </div>
        <div className="table-tools">
          <div className="search">
            <Icon name="search" size={14} />
            <input value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search by name, position, ID…" />
            {q && <button className="clear" onClick={() => setQ("")}><Icon name="close" size={12} /></button>}
          </div>
          <div className="date-filter">
            <span className="date-label">Período</span>
            <select className="select" value={currentDate ?? ''} onChange={e => handleDateChange(e.target.value)}>
              {allowedMonths.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="date-filter">
            <span className="date-label">Salario ≥</span>
            <input
              type="number"
              className="select"
              style={{ width: 110 }}
              placeholder="Monto…"
              value={salaryVal}
              onChange={e => setSalaryVal(e.target.value)}
            />
            <span className="date-label" style={{ marginLeft: 4 }}>Género</span>
            <select className="select" value={sexFilter} onChange={e => setSexFilter(e.target.value)}>
              <option value="All">todos</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {(salaryVal !== '' || sexFilter !== 'All') && (
              <button className="ghost-btn" onClick={() => { setSalaryVal(''); setSexFilter('All'); }}>Limpiar</button>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <Th k="name" label="Nombre" />
              <Th k="salary" label="Salario" align="right" />
              <Th k="startDate" label="Fecha" />
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {groupedFiltered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-dim)' }}>
                  No se encontraron resultados{q ? ` para "${q}"` : ''}
                </td>
              </tr>
            )}
            {pagedGroups.map(({ position: pos, employees: emps }) => {
              const isOpen = expandedPositions.has(pos);
              return (
                <React.Fragment key={`group-${pos}`}>
                  <tr
                    style={{ background: 'var(--panel-2)', borderTop: '2px solid var(--line)', cursor: 'pointer' }}
                    onClick={() => togglePosition(pos)}
                  >
                    <td colSpan={4} style={{ padding: '10px 12px 10px 16px', borderLeft: '3px solid var(--accent)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            {pos}
                          </span>
                          <span style={{ fontWeight: 400, color: 'var(--text-dim)', fontSize: 12 }}>
                            {emps.length} empleados
                          </span>
                        </div>
                        <span style={{ color: 'var(--text-dim)', fontSize: 14, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                          ›
                        </span>
                      </div>
                    </td>
                  </tr>
                  {isOpen && emps.map(e => (
                    <tr key={e.id} onClick={() => onOpen(e)}>
                      <td>
                        <div className="emp-name">
                          <div>
                            <div style={{ color: 'var(--text)' }}>{e.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace" }}>{e.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text)', textAlign: 'right' }}>{Number(e.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text)', fontSize: 12 }}>{e.startDate}</td>
                      <td><Icon name="arrow" size={14} /></td>
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button className="pg-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="pg-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          <span className="pg-info">{page} / {totalPages}</span>
          <button className="pg-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          <button className="pg-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      )}
    </div>
  );
}
