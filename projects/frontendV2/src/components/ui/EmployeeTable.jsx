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

export function EmployeeTable({ institution, accent, onOpen }) {
  const [q, setQ] = useState("");
  const [posFilter, setPosFilter] = useState("All");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [positionBySalary, setPositionBySalary] = useState({});
  const [allowedMonths, setAllowedMonths] = useState([]);
  const [currentDate, setCurrentDate] = useState(null);
  const pageSize = 9;

  const institutionName = INSTITUTION_NAMES[institution];
  const base = institutionName ? `${institutionName}/nomina/exportToJson` : null;

  const fetchByDate = async (date, baseUrl) => {
    setLoading(true);
    setError(null);
    try {
      const data = await requestJson(`${baseUrl}/employeersByPosition${date}`);
      setPositionBySalary(data);
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

  const rows = useMemo(() => {
    return Object.entries(positionBySalary).flatMap(([pos, emps]) =>
      (emps || []).map((r, i) => ({
        id: r.document ? r.document : `${pos}-${i}`,
        name: r.name || '—',
        dept: pos,
        salary: Number(r.income) || 0,
        startDate: r.date ? String(r.date).slice(0, 10) : '',
        status: r.isHonorific ? 'Honorífico' : 'Activo',
        urlDownload: r.urlDownload ?? null,
      }))
    );
  }, [positionBySalary]);

  const positions = useMemo(() => Object.keys(positionBySalary), [positionBySalary]);

  const filtered = useMemo(() => {
    let r = rows.filter(e => {
      const hit = !q || (e.name + ' ' + e.dept + ' ' + e.id).toLowerCase().includes(q.toLowerCase());
      const posOk = posFilter === 'All' || e.dept === posFilter;
      return hit && posOk;
    });
    r.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === 'number') return sort.dir === 'asc' ? av - bv : bv - av;
      return sort.dir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return r;
  }, [rows, q, posFilter, sort]);

  useEffect(() => { setPage(0); }, [q, posFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice(page * pageSize, page * pageSize + pageSize);

  const groupedShown = useMemo(() => {
    const groups = [];
    let currentPos = null;
    shown.forEach(e => {
      if (e.dept !== currentPos) {
        currentPos = e.dept;
        groups.push({ position: e.dept, employees: [] });
      }
      groups[groups.length - 1].employees.push(e);
    });
    return groups;
  }, [shown]);

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
          <div className="panel-sub">{filtered.length} of {rows.length} · searchable, sortable</div>
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
            <select className="select" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
              <option value="All">Posición: todas</option>
              {positions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            {posFilter !== 'All' && (
              <button className="ghost-btn" onClick={() => setPosFilter('All')}>Limpiar</button>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <Th k="name" label="Nombre" />
              <Th k="dept" label="Posición" />
              <Th k="salary" label="Salario" align="right" />
              <Th k="startDate" label="Fecha" />
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {groupedShown.map(({ position: pos, employees: emps }) => (
              <React.Fragment key={`group-${pos}`}>
                <tr style={{ background: 'var(--surface-2, rgba(255,255,255,0.04))' }}>
                  <td colSpan={5} style={{ fontWeight: 600, color: 'var(--text)', padding: '8px 12px', fontSize: 12 }}>
                    {pos}
                    <span style={{ fontWeight: 400, color: 'var(--text-dim)', marginLeft: 8 }}>
                      {emps.length} empleados
                    </span>
                  </td>
                </tr>
                {emps.map(e => (
                  <tr key={e.id} onClick={() => onOpen(e)}>
                    <td>
                      <div className="emp-name">
                        <div>
                          <div style={{ color: 'var(--text)' }}>{e.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: "'Geist Mono', monospace" }}>{e.id}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="tag">{e.dept}</span></td>
                    <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text)', textAlign: 'right' }}>{Number(e.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)', fontSize: 12 }}>{e.startDate}</td>
                    <td><Icon name="arrow" size={14} /></td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-dimmer)' }}>
                  No se encontraron resultados{q ? ` para "${q}"` : ''}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <div style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: "'Geist Mono', monospace" }}>
          Page {page + 1} / {pages}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="ghost-btn" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p - 1))}>Prev</button>
          <button className="ghost-btn" disabled={page >= pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
