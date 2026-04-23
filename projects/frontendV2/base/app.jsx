const { useState, useMemo, useEffect } = React;
const { Sidebar, Header, KPI, EmployeeTable, EmployeeDrawer, Icon } = window.UI;
const { PayrollChart, HeadcountChart, DeptDonut, SalaryBars, ComparisonChart, fmtMoney, fmtNum } = window.Charts;
const CMP_PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

// Tweak defaults — block below is machine-edited; must be valid JSON.
const TWEAKS_DEFAULT = /*EDITMODE-BEGIN*/{
  "accent": "#c9f26a",
  "density": "comfy",
  "payrollStyle": "area",
  "theme": "dark"
} /*EDITMODE-END*/;

function App() {
  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem('lumen.page');
    const valid = ["economia", "social", "salud", "educacion", "medioambiente", "militar", "jarabacoa", "moca", "cotui", "intrant", "fuentes"];
    return valid.includes(saved) ? saved : "economia";
  });
  const [selected, setSelected] = useState(null);
  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULT);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const [compareOpen, setCompareOpen] = useState(false);
  const [compareWith, setCompareWith] = useState([]);
  const [draftCompare, setDraftCompare] = useState([]);

  const D = window.__DATA;

  const SERIES = {
    payroll: { key:"payroll", label:"Monthly payroll", data: D.payrollSeries, fmt: fmtMoney },
    headcount: { key:"headcount", label:"Headcount", data: D.headcountSeries, fmt: n=>n+" ppl" },
    avgSalary: { key:"avgSalary", label:"Avg salary", data: D.payrollSeries.map((p,i)=>Math.round(p/D.headcountSeries[i])), fmt: fmtMoney },
    attrition: { key:"attrition", label:"Attrition %", data:[6.2,5.9,5.7,5.4,5.2,5.0,5.1,4.9,4.8,4.6,4.7,4.8], fmt: n=>n.toFixed(1)+"%" },
  };

  useEffect(() => {localStorage.setItem('lumen.page', page);}, [page]);

  // Tweak-mode wiring
  useEffect(() => {
    const onMsg = (e) => {
      const d = e.data || {};
      if (d.type === '__activate_edit_mode') setTweaksOpen(true);
      if (d.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setTweak = (k, v) => {
    setTweaks((t) => {
      const nt = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return nt;
    });
  };

  const accent = tweaks.accent;

  // Inject accent & density into CSS vars
  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--row-pad', tweaks.density === 'compact' ? '8px' : '14px');
    document.documentElement.setAttribute('data-theme', tweaks.theme || 'dark');
  }, [accent, tweaks.density, tweaks.theme]);

  const totalPayroll = D.payrollSeries[D.payrollSeries.length - 1];
  const prevPayroll = D.payrollSeries[D.payrollSeries.length - 2];
  const payrollDelta = ((totalPayroll - prevPayroll) / prevPayroll * 100).toFixed(1);
  const headcount = D.headcountSeries[D.headcountSeries.length - 1];
  const prevHc = D.headcountSeries[D.headcountSeries.length - 2];
  const avgSalary = Math.round(D.EMPLOYEES.reduce((s, e) => s + e.salary, 0) / D.EMPLOYEES.length);

  const pageTitles = {
    economia: ["Economía", "Indicadores económicos nacionales"],
    social: ["Social", "Estadísticas sociales y demográficas"],
    salud: ["Salud", "Sistema de salud pública"],
    educacion: ["Educación", "Indicadores del sistema educativo"],
    medioambiente: ["Medioambiente", "Indicadores ambientales"],
    militar: ["Militar", "Defensa y seguridad"],
    jarabacoa: ["Jarabacoa", "Ayuntamiento de Jarabacoa"],
    moca: ["Moca", "Ayuntamiento de Moca"],
    cotui: ["Cotuí", "Ayuntamiento de Cotuí"],
    intrant: ["Intrant", "Instituto Nacional de Tránsito y Transporte Terrestre"],
    fuentes: ["Fuentes", "Orígenes de datos oficiales"]
  };

  const renderAnalytics = () =>
  <>
      <div className="charts-grid">
        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">
                {compareWith.length ? `Payroll vs ${compareWith.map(k=>SERIES[k].label).join(' · ')}` : "Monthly payroll"}
              </div>
              <div className="panel-sub">Total gross, last 12 months · USD</div>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              {compareWith.length > 0 && (
                <div className="legend" style={{gap:10, flexWrap:'wrap'}}>
                  <span style={{display:'inline-flex', alignItems:'center', gap:4}}>
                    <span className="dot" style={{background:accent}}/> Payroll
                  </span>
                  {compareWith.map((k,i)=>(
                    <span key={k} style={{display:'inline-flex', alignItems:'center', gap:4}}>
                      <span className="dot" style={{background:CMP_PALETTE[i % CMP_PALETTE.length]}}/> {SERIES[k].label}
                    </span>
                  ))}
                </div>
              )}
              <button className="ghost-btn" onClick={()=>{ setDraftCompare(compareWith); setCompareOpen(true); }}>
                {compareWith.length ? "Edit comparison" : "Compare charts"}
              </button>
              {compareWith.length > 0 && (
                <button className="ghost-btn" onClick={()=>setCompareWith([])}>Clear</button>
              )}
            </div>
          </div>
          <div style={{height:260, padding:'6px 18px 14px'}}>
            {compareWith.length ? (
              <ComparisonChart
                seriesA={SERIES.payroll}
                extras={compareWith.map(k=>SERIES[k])}
                labels={D.MONTHS}
                accent={accent}/>
            ) : (
              <PayrollChart data={D.payrollSeries} labels={D.MONTHS}
                accent={accent} variant={tweaks.payrollStyle}/>
            )}
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 6' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Headcount</div>
              <div className="panel-sub">People by month</div>
            </div>
          </div>
          <div style={{ height: 260, padding: '6px 18px 14px' }}>
            <HeadcountChart data={D.headcountSeries} labels={D.MONTHS} accent={accent} />
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 5' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">By department</div>
              <div className="panel-sub">Hover to see counts</div>
            </div>
          </div>
          <div style={{ display: 'flex', padding: '6px 18px 18px', gap: 16, alignItems: 'center' }}>
            <div style={{ flex: '0 0 180px', height: 180 }}>
              <DeptDonut data={D.deptData} accent={accent} />
            </div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {D.deptData.map((d, i) =>
            <div key={d.name} className="legend-row">
                  <span className="dot" style={{ background: `oklch(0.75 0.14 ${90 + i * 32})` }} />
                  <span style={{ flex: 1, color: 'rgba(255,255,255,0.75)' }}>{d.name}</span>
                  <span style={{ fontFamily: "'Geist Mono', monospace", color: '#e5e9ef' }}>{d.count}</span>
                </div>
            )}
            </div>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: 'span 7' }}>
          <div className="panel-head">
            <div>
              <div className="panel-title">Avg salary by level</div>
              <div className="panel-sub">Mean base, excluding equity</div>
            </div>
          </div>
          <div style={{ height: 200, padding: '6px 18px 14px' }}>
            <SalaryBars data={D.salaryByLevel} accent={accent} />
          </div>
        </div>
      </div>

      <EmployeeTable rows={D.EMPLOYEES} accent={accent} onOpen={setSelected} />
    </>;


  const renderPlaceholder = (label) =>
  <div className="panel placeholder">
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ width: 40, height: 40, border: '1px dashed rgba(255,255,255,0.2)', borderRadius: 10, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
          <Icon name="grid" />
        </div>
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: "'Geist Mono', monospace" }}>
          // placeholder — head to Analytics for the live view
        </div>
      </div>
    </div>;


  const [title, sub] = pageTitles[page] || pageTitles.economia;

  return (
    <div className="app" data-screen-label={page}>
      <Sidebar page={page} setPage={setPage} density={tweaks.density} accent={accent} />
      <main className="main">
        <Header title={title} subtitle={sub} accent={accent} />
        <div className="content">
          {page && renderAnalytics()}
        </div>
      </main>

      <EmployeeDrawer employee={selected} onClose={() => setSelected(null)} accent={accent} />

      {compareOpen && (
        <div className="drawer-overlay" onClick={()=>setCompareOpen(false)}>
          <div className="compare-modal" onClick={e=>e.stopPropagation()}>
            <div className="compare-head">
              <div>
                <div style={{fontSize:16, fontWeight:600, color:'var(--text)'}}>Compare charts</div>
                <div style={{fontSize:12, color:'var(--text-dim)', marginTop:2}}>
                  Select one or more series to overlay on Monthly payroll.
                </div>
              </div>
              <button className="icon-btn" onClick={()=>setCompareOpen(false)}><Icon name="close"/></button>
            </div>
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th style={{width:32}}></th>
                    <th>Series</th>
                    <th style={{textAlign:'right'}}>Latest</th>
                    <th style={{textAlign:'right'}}>Min</th>
                    <th style={{textAlign:'right'}}>Max</th>
                    <th style={{textAlign:'right'}}>Δ 12m</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(SERIES).filter(s=>s.key!=="payroll").map((s,i)=>{
                    const on = draftCompare.includes(s.key);
                    const colorIdx = draftCompare.indexOf(s.key);
                    const latest = s.data[s.data.length-1];
                    const first = s.data[0];
                    const delta = ((latest-first)/first)*100;
                    return (
                      <tr key={s.key}
                        className={on?"on":""}
                        onClick={()=>{
                          setDraftCompare(on
                            ? draftCompare.filter(k=>k!==s.key)
                            : [...draftCompare, s.key]);
                        }}>
                        <td>
                          <span className={"cmp-check"+(on?" on":"")}
                            style={on?{background:CMP_PALETTE[colorIdx % CMP_PALETTE.length], borderColor:CMP_PALETTE[colorIdx % CMP_PALETTE.length]}:{}}>
                            {on && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" fill="none" stroke="#000" strokeWidth="1.8"/></svg>}
                          </span>
                        </td>
                        <td style={{color:'var(--text)', fontWeight:500}}>{s.label}</td>
                        <td style={{textAlign:'right', fontFamily:"'Geist Mono', monospace"}}>{s.fmt(latest)}</td>
                        <td style={{textAlign:'right', fontFamily:"'Geist Mono', monospace", color:'var(--text-dim)'}}>{s.fmt(Math.min(...s.data))}</td>
                        <td style={{textAlign:'right', fontFamily:"'Geist Mono', monospace", color:'var(--text-dim)'}}>{s.fmt(Math.max(...s.data))}</td>
                        <td style={{textAlign:'right', fontFamily:"'Geist Mono', monospace", color: delta>=0?'#4ade80':'#f87171'}}>
                          {delta>=0?'+':''}{delta.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="compare-foot">
              <div style={{fontSize:11, color:'var(--text-dim)', fontFamily:"'Geist Mono', monospace"}}>
                {draftCompare.length} selected
              </div>
              <div style={{display:'flex', gap:8}}>
                <button className="ghost-btn" onClick={()=>setDraftCompare([])}>Clear</button>
                <button className="primary-btn" onClick={()=>{ setCompareWith(draftCompare); setCompareOpen(false); }}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tweaksOpen &&
      <div className="tweaks">
          <div className="tweaks-head">
            <div style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>Tweaks</div>
            <button className="icon-btn" onClick={() => setTweaksOpen(false)}><Icon name="close" size={14} /></button>
          </div>
          <div className="tweaks-body">
            <div className="tweak-row">
              <label>Accent</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {["#c9f26a", "#6ad2f2", "#f26a9e", "#f2b36a", "#a58cff"].map((c) =>
              <button key={c}
              className={"swatch" + (tweaks.accent === c ? " on" : "")}
              style={{ background: c }}
              onClick={() => setTweak('accent', c)} />
              )}
              </div>
            </div>
            <div className="tweak-row">
              <label>Density</label>
              <div className="seg">
                {["compact", "comfy"].map((d) =>
              <button key={d} className={tweaks.density === d ? "on" : ""}
              onClick={() => setTweak('density', d)}>{d}</button>
              )}
              </div>
            </div>
            <div className="tweak-row">
              <label>Theme</label>
              <div className="seg">
                {["dark", "light"].map((t) =>
              <button key={t} className={tweaks.theme === t ? "on" : ""}
              onClick={() => setTweak('theme', t)}>{t}</button>
              )}
              </div>
            </div>
            <div className="tweak-row">
              <label>Payroll chart</label>
              <div className="seg">
                {["area", "line", "bars"].map((s) =>
              <button key={s} className={tweaks.payrollStyle === s ? "on" : ""}
              onClick={() => setTweak('payrollStyle', s)}>{s}</button>
              )}
              </div>
            </div>
          </div>
        </div>
      }
    </div>);

}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);