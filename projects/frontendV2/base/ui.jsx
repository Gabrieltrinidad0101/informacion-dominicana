const { useState, useMemo, useEffect } = React;
const { PayrollChart, HeadcountChart, DeptDonut, SalaryBars, fmtMoney, fmtNum } = window.Charts;

// -------- Icons (original, minimal, stroke-based) --------
const Icon = ({ name, size=16 }) => {
  const paths = {
    grid:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    chart:"M3 21V3M3 21h18M7 17V9M12 17V6M17 17v-5",
    users:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
    cash:"M3 6h18v12H3zM7 12h.01M17 12h.01M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6",
    building:"M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1",
    doc:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5",
    gear:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    search:"M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35",
    bell:"M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
    plus:"M12 5v14M5 12h14",
    up:"M6 15l6-6 6 6",
    down:"M6 9l6 6 6-6",
    close:"M18 6L6 18M6 6l12 12",
    arrow:"M5 12h14M12 5l7 7-7 7",
    filter:"M22 3H2l8 9.46V19l4 2v-8.54L22 3z",
    sort:"M3 6h18M6 12h12M10 18h4",
    dot:""
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]||""}/>
    </svg>
  );
};

// -------- Sidebar --------
function Sidebar({ page, setPage, density, accent }){
  const items = [
    { id:"economia", label:"Economía", icon:"cash" },
    { id:"social", label:"Social", icon:"users" },
    { id:"salud", label:"Salud", icon:"bell" },
    { id:"educacion", label:"Educación", icon:"doc" },
    { id:"medioambiente", label:"Medioambiente", icon:"grid" },
    { id:"militar", label:"Militar", icon:"building" },
    { type:"category", label:"Ayuntamientos", icon:"building", items:[
      { id:"jarabacoa", label:"Jarabacoa" },
      { id:"moca", label:"Moca" },
      { id:"cotui", label:"Cotuí" },
    ]},
    { id:"intrant", label:"Intrant", icon:"chart" },
    { id:"fuentes", label:"Fuentes", icon:"doc" },
  ];
  const [openCat, setOpenCat] = useState(true);
  const padY = density==="compact" ? 7 : 10;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark" style={{background:accent}}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0a0d12" strokeWidth="2.4" strokeLinecap="round">
            <path d="M4 18L10 8L14 14L20 6"/>
          </svg>
        </div>
        <div>
          <div className="brand-name">Lumen</div>
          <div className="brand-sub">Datos · Estadísticos</div>
        </div>
      </div>

      <div className="nav-section">
        <div className="nav-label">Categorías</div>
        {items.map((it,idx)=>{
          if(it.type==="category"){
            return (
              <div key={idx} className="nav-group">
                <button
                  className="nav-item"
                  style={{paddingTop:padY, paddingBottom:padY}}
                  onClick={()=>setOpenCat(o=>!o)}>
                  <span className="nav-ic"><Icon name={it.icon}/></span>
                  <span>{it.label}</span>
                  <span className="nav-caret" style={{marginLeft:'auto', opacity:0.6}}>
                    <Icon name={openCat?"down":"arrow"} size={12}/>
                  </span>
                </button>
                {openCat && (
                  <div className="nav-sublist">
                    {it.items.map(sub=>(
                      <button key={sub.id}
                        className={"nav-item nav-sub"+(page===sub.id?" active":"")}
                        style={{paddingTop:padY-2, paddingBottom:padY-2}}
                        onClick={()=>setPage(sub.id)}>
                        <span className="nav-subdot" style={page===sub.id?{background:accent}:{}}/>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <button key={it.id}
              className={"nav-item"+(page===it.id?" active":"")}
              style={{paddingTop:padY, paddingBottom:padY}}
              onClick={()=>setPage(it.id)}>
              <span className="nav-ic"><Icon name={it.icon}/></span>
              <span>{it.label}</span>
              {page===it.id && <span className="nav-rail" style={{background:accent}}/>}
            </button>
          );
        })}
      </div>

    </aside>
  );
}

// -------- Header --------
function Header({ title, subtitle, accent }){
  return (
    <header className="topbar">
      <div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{fontSize:11, color:'var(--text-dimmer)', fontFamily:"'Geist Mono', monospace", textTransform:'uppercase', letterSpacing:1}}>
            Lumen · People
          </div>
          <span style={{color:'var(--line)'}}>/</span>
          <div style={{fontSize:11, color:'var(--text-dim)', fontFamily:"'Geist Mono', monospace"}}>{title.toLowerCase()}</div>
        </div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <div className="page-sub">{subtitle}</div>}
      </div>
      <div className="topbar-actions" style={{display:'none'}}>
        <div className="pill">
          <span style={{width:6,height:6,borderRadius:3,background:accent, boxShadow:`0 0 6px ${accent}`}}/>
          <span style={{fontFamily:"'Geist Mono', monospace", fontSize:11}}>FY26 Q1</span>
        </div>
        <button className="icon-btn" title="Notifications"><Icon name="bell"/></button>
        <button className="btn-primary" style={{background:accent, color:'#0a0d12'}}>
          <Icon name="plus" size={14}/> Invite
        </button>
      </div>
    </header>
  );
}

// -------- KPI cards --------
function KPI({ label, value, delta, positive, spark, accent }){
  const w = 120, h = 36;
  const max = Math.max(...spark), min = Math.min(...spark);
  const path = spark.map((v,i)=>{
    const x = (i/(spark.length-1))*w;
    const y = h - ((v-min)/(max-min||1))*h;
    return `${i?'L':'M'}${x},${y}`;
  }).join(' ');
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className="kpi-row">
        <div className="kpi-value">{value}</div>
        <svg width={w} height={h} style={{opacity:0.9}}>
          <path d={path} fill="none" stroke={accent} strokeWidth="1.5"/>
        </svg>
      </div>
      <div className={"kpi-delta "+(positive?"up":"down")}>
        <Icon name={positive?"up":"down"} size={12}/> {delta}
        <span style={{color:'var(--text-dimmer)', marginLeft:6}}>vs last month</span>
      </div>
    </div>
  );
}

// -------- Employee Table --------
function EmployeeTable({ rows, accent, onOpen }){
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [year, setYear] = useState("All");
  const [month, setMonth] = useState("All");
  const [sort, setSort] = useState({ key:"name", dir:"asc" });
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const DEPTS = ["All", ...window.__DATA.DEPTS];
  const YEARS = useMemo(()=>{
    const ys = new Set(rows.map(e=>e.startDate.slice(0,4)));
    return ["All", ...Array.from(ys).sort()];
  },[rows]);
  const MONTHS_LIST = ["All","01","02","03","04","05","06","07","08","09","10","11","12"];
  const MONTH_NAMES = {"01":"Ene","02":"Feb","03":"Mar","04":"Abr","05":"May","06":"Jun","07":"Jul","08":"Ago","09":"Sep","10":"Oct","11":"Nov","12":"Dic"};

  const filtered = useMemo(()=>{
    let r = rows.filter(e=>{
      const hit = !q || (e.name+" "+e.email+" "+e.title+" "+e.id).toLowerCase().includes(q.toLowerCase());
      const ok = dept==="All" || e.dept===dept;
      const yOk = year==="All" || e.startDate.slice(0,4)===year;
      const mOk = month==="All" || e.startDate.slice(5,7)===month;
      return hit && ok && yOk && mOk;
    });
    r.sort((a,b)=>{
      const av = a[sort.key], bv = b[sort.key];
      if(typeof av==="number") return sort.dir==="asc"?av-bv:bv-av;
      return sort.dir==="asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return r;
  }, [rows, q, dept, year, month, sort]);

  useEffect(()=>{ setPage(0); }, [q, dept, year, month]);

  const pages = Math.max(1, Math.ceil(filtered.length/pageSize));
  const shown = filtered.slice(page*pageSize, page*pageSize+pageSize);

  const toggleSort = k => setSort(s=> s.key===k ? {key:k, dir:s.dir==="asc"?"desc":"asc"} : {key:k, dir:"asc"});

  const Th = ({k, label, align}) => (
    <th style={{textAlign:align||'left'}} onClick={()=>toggleSort(k)}>
      <span className="th-inner">
        {label}
        <span className={"sort-ind"+(sort.key===k?" active":"")}>
          {sort.key===k ? (sort.dir==="asc"?"↑":"↓") : ""}
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
            <Icon name="search" size={14}/>
            <input value={q} onChange={e=>setQ(e.target.value)}
              placeholder="Search by name, email, role, ID…"/>
            {q && <button className="clear" onClick={()=>setQ("")}><Icon name="close" size={12}/></button>}
          </div>
          <div className="chips" style={{display:'none'}}>
            {DEPTS.map(d=>(
              <button key={d}
                className={"chip"+(dept===d?" on":"")}
                style={dept===d?{background:accent, color:'#0a0d12', borderColor:accent}:{}}
                onClick={()=>setDept(d)}>
                {d}
              </button>
            ))}
          </div>
          <div className="date-filter">
            <span className="date-label">Fecha de ingreso</span>
            <select className="select" value={year} onChange={e=>setYear(e.target.value)}>
              {YEARS.map(y=>(<option key={y} value={y}>{y==="All"?"Año: todos":y}</option>))}
            </select>
            <select className="select" value={month} onChange={e=>setMonth(e.target.value)}>
              {MONTHS_LIST.map(m=>(<option key={m} value={m}>{m==="All"?"Mes: todos":MONTH_NAMES[m]}</option>))}
            </select>
            {(year!=="All"||month!=="All") && (
              <button className="ghost-btn" onClick={()=>{setYear("All");setMonth("All");}}>Limpiar</button>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="emp-table">
          <thead>
            <tr>
              <Th k="name" label="Name"/>
              <Th k="title" label="Role"/>
              <Th k="dept" label="Dept"/>
              <Th k="level" label="Lvl"/>
              <Th k="location" label="Location"/>
              <Th k="salary" label="Salary" align="right"/>
              <Th k="startDate" label="Start"/>
              <Th k="perf" label="Perf"/>
              <th style={{width:32}}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(e=>(
              <tr key={e.id} onClick={()=>onOpen(e)}>
                <td>
                  <div className="emp-name">
                    <div>
                      <div style={{color:'var(--text)'}}>{e.name}</div>
                      <div style={{fontSize:11, color:'var(--text-dimmer)', fontFamily:"'Geist Mono', monospace"}}>{e.id}</div>
                    </div>
                  </div>
                </td>
                <td style={{color:'var(--text)'}}>{e.title}</td>
                <td><span className="tag">{e.dept}</span></td>
                <td style={{fontFamily:"'Geist Mono', monospace", color:'var(--text)'}}>{e.level}</td>
                <td style={{color:'var(--text)'}}>{e.location}</td>
                <td style={{fontFamily:"'Geist Mono', monospace", color:'var(--text)', textAlign:'right'}}>{fmtMoney(e.salary)}</td>
                <td style={{fontFamily:"'Geist Mono', monospace", color:'var(--text-dim)', fontSize:12}}>{e.startDate}</td>
                <td>
                  <span className={"perf perf-"+e.perf.toLowerCase().replace(/\s/g,'')}>{e.perf}</span>
                </td>
                <td><Icon name="arrow" size={14}/></td>
              </tr>
            ))}
            {shown.length===0 && (
              <tr><td colSpan="9" style={{textAlign:'center', padding:'48px 12px', color:'var(--text-dimmer)'}}>
                No matches for "{q}"
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-foot">
        <div style={{color:'var(--text-dim)', fontSize:12, fontFamily:"'Geist Mono', monospace"}}>
          Page {page+1} / {pages}
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="ghost-btn" disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))}>Prev</button>
          <button className="ghost-btn" disabled={page>=pages-1} onClick={()=>setPage(p=>Math.min(pages-1,p+1))}>Next</button>
        </div>
      </div>
    </div>
  );
}

// -------- Employee drawer --------
function EmployeeDrawer({ employee, onClose, accent }){
  if(!employee) return null;
  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e=>e.stopPropagation()}>
        <div className="drawer-head">
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <div className="avatar-lg" style={{background:`oklch(0.4 0.05 ${(employee.id.charCodeAt(1)*37)%360})`}}>
              {employee.initials}
            </div>
            <div>
              <div style={{fontSize:20, color:'var(--text)', fontWeight:600}}>{employee.name}</div>
              <div style={{color:'var(--text-dim)', fontSize:13}}>{employee.title} · {employee.dept}</div>
              <div style={{color:'var(--text-dimmer)', fontSize:11, fontFamily:"'Geist Mono', monospace", marginTop:4}}>
                {employee.id} · {employee.email}
              </div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="close"/></button>
        </div>

        <div className="drawer-grid">
          <div className="detail">
            <div className="detail-k">Level</div>
            <div className="detail-v mono">{employee.level}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Location</div>
            <div className="detail-v">{employee.location}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Salary</div>
            <div className="detail-v mono" style={{color:accent}}>{fmtMoney(employee.salary)}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Start date</div>
            <div className="detail-v mono">{employee.startDate}</div>
          </div>
          <div className="detail">
            <div className="detail-k">Status</div>
            <div className="detail-v">
              <span className="dot" style={{background: employee.status==="Active"?accent:"#b88a3b"}}/>
              {employee.status}
            </div>
          </div>
          <div className="detail">
            <div className="detail-k">Performance</div>
            <div className="detail-v">{employee.perf}</div>
          </div>
        </div>

        <div style={{padding:'18px 20px', borderTop:'1px solid var(--line-soft)'}}>
          <div style={{fontSize:11, color:'var(--text-dimmer)', textTransform:'uppercase', letterSpacing:1, marginBottom:10, fontFamily:"'Geist Mono', monospace"}}>
            Recent activity
          </div>
          <div className="timeline">
            <div className="tl-item"><span className="tl-dot" style={{background:accent}}/><div><b>Apr 12</b> · Promotion cycle reviewed</div></div>
            <div className="tl-item"><span className="tl-dot"/><div><b>Mar 04</b> · Quarterly 1:1 completed</div></div>
            <div className="tl-item"><span className="tl-dot"/><div><b>Feb 20</b> · Project milestone shipped</div></div>
            <div className="tl-item"><span className="tl-dot"/><div><b>Jan 15</b> · Joined new squad</div></div>
          </div>
        </div>

        <div className="drawer-foot">
          <button className="ghost-btn">Full profile</button>
          <button className="btn-primary" style={{background:accent, color:'#0a0d12'}}>Message {employee.name.split(' ')[0]}</button>
        </div>
      </div>
    </div>
  );
}

window.UI = { Sidebar, Header, KPI, EmployeeTable, EmployeeDrawer, Icon };
