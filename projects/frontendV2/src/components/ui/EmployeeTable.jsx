import { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { fmtMoney } from '../../utils/format';

export function EmployeeTable({ rows, depts, accent, onOpen }) {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [year, setYear] = useState("All");
  const [month, setMonth] = useState("All");
  const [sort, setSort] = useState({ key: "name", dir: "asc" });
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const DEPTS = ["All", ...depts];
  const YEARS = useMemo(() => {
    const ys = new Set(rows.map(e => e.startDate.slice(0, 4)));
    return ["All", ...Array.from(ys).sort()];
  }, [rows]);
  const MONTHS_LIST = ["All", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const MONTH_NAMES = { "01": "Ene", "02": "Feb", "03": "Mar", "04": "Abr", "05": "May", "06": "Jun", "07": "Jul", "08": "Ago", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dic" };

  const filtered = useMemo(() => {
    let r = rows.filter(e => {
      const hit = !q || (e.name + " " + e.email + " " + e.title + " " + e.id).toLowerCase().includes(q.toLowerCase());
      const ok = dept === "All" || e.dept === dept;
      const yOk = year === "All" || e.startDate.slice(0, 4) === year;
      const mOk = month === "All" || e.startDate.slice(5, 7) === month;
      return hit && ok && yOk && mOk;
    });
    r.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (typeof av === "number") return sort.dir === "asc" ? av - bv : bv - av;
      return sort.dir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return r;
  }, [rows, q, dept, year, month, sort]);

  useEffect(() => { setPage(0); }, [q, dept, year, month]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice(page * pageSize, page * pageSize + pageSize);
  const toggleSort = k => setSort(s => s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: "asc" });

  const Th = ({ k, label, align }) => (
    <th style={{ textAlign: align || 'left' }} onClick={() => toggleSort(k)}>
      <span className="th-inner">
        {label}
        <span className={"sort-ind" + (sort.key === k ? " active" : "")}>
          {sort.key === k ? (sort.dir === "asc" ? "↑" : "↓") : ""}
        </span>
      </span>
    </th>
  );

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
              placeholder="Search by name, email, role, ID…" />
            {q && <button className="clear" onClick={() => setQ("")}><Icon name="close" size={12} /></button>}
          </div>
          <div className="date-filter">
            <span className="date-label">Fecha de ingreso</span>
            <select className="select" value={year} onChange={e => setYear(e.target.value)}>
              {YEARS.map(y => (<option key={y} value={y}>{y === "All" ? "Año: todos" : y}</option>))}
            </select>
            <select className="select" value={month} onChange={e => setMonth(e.target.value)}>
              {MONTHS_LIST.map(m => (<option key={m} value={m}>{m === "All" ? "Mes: todos" : MONTH_NAMES[m]}</option>))}
            </select>
            {(year !== "All" || month !== "All") && (
              <button className="ghost-btn" onClick={() => { setYear("All"); setMonth("All"); }}>Limpiar</button>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <Th k="name" label="Name" />
              <Th k="title" label="Role" />
              <Th k="dept" label="Dept" />
              <Th k="level" label="Lvl" />
              <Th k="location" label="Location" />
              <Th k="salary" label="Salary" align="right" />
              <Th k="startDate" label="Start" />
              <Th k="perf" label="Perf" />
              <th style={{ width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(e => (
              <tr key={e.id} onClick={() => onOpen(e)}>
                <td>
                  <div className="emp-name">
                    <div>
                      <div style={{ color: 'var(--text)' }}>{e.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-dimmer)', fontFamily: "'Geist Mono', monospace" }}>{e.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text)' }}>{e.title}</td>
                <td><span className="tag">{e.dept}</span></td>
                <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text)' }}>{e.level}</td>
                <td style={{ color: 'var(--text)' }}>{e.location}</td>
                <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text)', textAlign: 'right' }}>{fmtMoney(e.salary)}</td>
                <td style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)', fontSize: 12 }}>{e.startDate}</td>
                <td>
                  <span className={"perf perf-" + e.perf.toLowerCase().replace(/\s/g, '')}>{e.perf}</span>
                </td>
                <td><Icon name="arrow" size={14} /></td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="9" style={{ textAlign: 'center', padding: '48px 12px', color: 'var(--text-dimmer)' }}>
                No matches for "{q}"
              </td></tr>
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
