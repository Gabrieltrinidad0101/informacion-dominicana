// Lightweight custom SVG charts — original design, no library
const { useState, useRef, useEffect, useMemo } = React;

function useSize(ref){
  const [s, setS] = useState({w: 600, h: 240});
  useEffect(()=>{
    if(!ref.current) return;
    const ro = new ResizeObserver(entries=>{
      const r = entries[0].contentRect;
      setS({w: r.width, h: r.height});
    });
    ro.observe(ref.current);
    return ()=>ro.disconnect();
  },[]);
  return s;
}

function fmtMoney(n){
  if(n>=1e6) return "$"+(n/1e6).toFixed(2)+"M";
  if(n>=1e3) return "$"+(n/1e3).toFixed(0)+"k";
  return "$"+n;
}
function fmtNum(n){ return n.toLocaleString(); }

function PayrollChart({ data, labels, accent, variant="area" }){
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = useState(null);
  const pad = { t: 16, r: 16, b: 28, l: 56 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const max = Math.max(...data)*1.08;
  const min = Math.min(...data)*0.92;
  const x = i => pad.l + (i/(data.length-1))*iw;
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;

  const path = data.map((v,i)=>`${i?'L':'M'}${x(i)},${y(v)}`).join(' ');
  const area = path + ` L${x(data.length-1)},${pad.t+ih} L${x(0)},${pad.t+ih} Z`;

  // Y ticks
  const yTicks = [0,0.25,0.5,0.75,1].map(t=>min+(max-min)*t);

  return (
    <div ref={wrap} style={{position:'relative', width:'100%', height:'100%'}}
      onMouseMove={e=>{
        const rect = wrap.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const idx = Math.round(((mx-pad.l)/iw)*(data.length-1));
        if(idx>=0 && idx<data.length) setHover(idx); else setHover(null);
      }}
      onMouseLeave={()=>setHover(null)}
    >
      <svg width={w} height={h} style={{display:'block', overflow:'visible'}}>
        <defs>
          <linearGradient id="payGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* grid */}
        {yTicks.map((v,i)=>(
          <g key={i}>
            <line x1={pad.l} x2={pad.l+iw} y1={y(v)} y2={y(v)}
              stroke="var(--line-soft)" strokeDasharray={i===0?'':'2 4'}/>
            <text x={pad.l-10} y={y(v)+4} fill="var(--text-dimmer)"
              fontSize="10" textAnchor="end" fontFamily="'Geist Mono', monospace">
              {fmtMoney(Math.round(v))}
            </text>
          </g>
        ))}
        {/* area + line */}
        {variant==="area" && <path d={area} fill="url(#payGrad)"/>}
        {variant==="bars" && data.map((v,i)=>{
          const bw = iw/data.length * 0.55;
          return <rect key={i} x={x(i)-bw/2} y={y(v)} width={bw} height={pad.t+ih-y(v)}
            fill={accent} fillOpacity="0.75" rx="2"/>;
        })}
        {variant!=="bars" && <path d={path} fill="none" stroke={accent} strokeWidth="2"/>}
        {/* points */}
        {variant!=="bars" && data.map((v,i)=>(
          <circle key={i} cx={x(i)} cy={y(v)} r={hover===i?5:2.5}
            fill={hover===i?accent:"var(--panel)"} stroke={accent} strokeWidth="1.5"/>
        ))}
        {/* x labels */}
        {labels.map((l,i)=>(
          <text key={i} x={x(i)} y={pad.t+ih+18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
        {/* hover line */}
        {hover!==null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t+ih}
              stroke="var(--line)" strokeDasharray="2 3"/>
            <circle cx={x(hover)} cy={y(data[hover])} r={5} fill={accent}/>
          </g>
        )}
      </svg>
      {hover!==null && (
        <div style={{
          position:'absolute',
          left: Math.min(x(hover)+12, w-160),
          top: Math.max(y(data[hover])-50, 8),
          background:'#0c1117',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:6,
          padding:'8px 10px',
          pointerEvents:'none',
          fontSize:11,
          whiteSpace:'nowrap'
        }}>
          <div style={{color:'rgba(255,255,255,0.5)', fontFamily:"'Geist Mono', monospace"}}>{labels[hover]}</div>
          <div style={{fontFamily:"'Geist Mono', monospace", color:'#fff', fontWeight:600, fontSize:13, marginTop:2}}>
            {fmtMoney(data[hover])}
          </div>
        </div>
      )}
    </div>
  );
}

function HeadcountChart({ data, labels, accent }){
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = useState(null);
  const pad = { t: 16, r: 16, b: 28, l: 40 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const max = Math.max(...data)*1.1;
  const min = Math.min(...data)*0.9;
  const bw = iw/data.length * 0.65;
  const x = i => pad.l + (i+0.5)*(iw/data.length);
  const y = v => pad.t + ih - ((v-min)/(max-min))*ih;

  const yTicks = [0,0.5,1].map(t=>min+(max-min)*t);

  return (
    <div ref={wrap} style={{position:'relative', width:'100%', height:'100%'}}>
      <svg width={w} height={h} style={{display:'block', overflow:'visible'}}>
        {yTicks.map((v,i)=>(
          <g key={i}>
            <line x1={pad.l} x2={pad.l+iw} y1={y(v)} y2={y(v)}
              stroke="var(--line-soft)"/>
            <text x={pad.l-8} y={y(v)+3} fill="var(--text-dimmer)"
              fontSize="10" textAnchor="end" fontFamily="'Geist Mono', monospace">
              {Math.round(v)}
            </text>
          </g>
        ))}
        {data.map((v,i)=>{
          const hovered = hover===i;
          return (
            <g key={i} onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}>
              <rect x={x(i)-bw/2} y={pad.t} width={bw} height={ih} fill="transparent"/>
              <rect x={x(i)-bw/2} y={y(v)} width={bw} height={pad.t+ih-y(v)}
                fill={accent} fillOpacity={hovered?1:0.7} rx="2"/>
              {i===data.length-1 && (
                <text x={x(i)} y={y(v)-6} fill={accent}
                  fontSize="11" textAnchor="middle" fontFamily="'Geist Mono', monospace"
                  fontWeight="600">
                  {v}
                </text>
              )}
            </g>
          );
        })}
        {labels.map((l,i)=>(
          <text key={i} x={x(i)} y={pad.t+ih+18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
      </svg>
      {hover!==null && (
        <div style={{
          position:'absolute',
          left: Math.min(x(hover)+12, w-140),
          top: Math.max(y(data[hover])-46, 8),
          background:'#0c1117',
          border:'1px solid rgba(255,255,255,0.1)',
          borderRadius:6,
          padding:'8px 10px',
          pointerEvents:'none',
          fontSize:11,
          whiteSpace:'nowrap'
        }}>
          <div style={{color:'rgba(255,255,255,0.5)', fontFamily:"'Geist Mono', monospace"}}>{labels[hover]}</div>
          <div style={{fontFamily:"'Geist Mono', monospace", color:'#fff', fontWeight:600, fontSize:13, marginTop:2}}>
            {data[hover]} people
          </div>
        </div>
      )}
    </div>
  );
}

function DeptDonut({ data, accent }){
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const size = Math.min(w, h);
  const cx = w/2, cy = h/2;
  const r = size*0.38;
  const ir = size*0.26;
  const total = data.reduce((s,d)=>s+d.count,0);
  const [hover, setHover] = useState(null);

  // Generate harmonious hues from accent
  const colors = data.map((_,i)=>`oklch(0.75 0.14 ${90 + i*32})`);

  let angle = -Math.PI/2;
  const arcs = data.map((d,i)=>{
    const a0 = angle;
    const a1 = angle + (d.count/total)*Math.PI*2;
    angle = a1;
    const large = (a1-a0) > Math.PI ? 1 : 0;
    const x0 = cx + Math.cos(a0)*r, y0 = cy + Math.sin(a0)*r;
    const x1 = cx + Math.cos(a1)*r, y1 = cy + Math.sin(a1)*r;
    const xi1 = cx + Math.cos(a1)*ir, yi1 = cy + Math.sin(a1)*ir;
    const xi0 = cx + Math.cos(a0)*ir, yi0 = cy + Math.sin(a0)*ir;
    const d_ = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi1},${yi1} A${ir},${ir} 0 ${large} 0 ${xi0},${yi0} Z`;
    return { d: d_, color: colors[i], name: d.name, count: d.count };
  });

  return (
    <div ref={wrap} style={{position:'relative', width:'100%', height:'100%', display:'flex'}}>
      <svg width={w} height={h} style={{display:'block'}}>
        {arcs.map((a,i)=>(
          <path key={i} d={a.d} fill={a.color}
            opacity={hover===null || hover===i ? 1 : 0.35}
            onMouseEnter={()=>setHover(i)} onMouseLeave={()=>setHover(null)}
            style={{cursor:'pointer', transition:'opacity 120ms'}}/>
        ))}
        <text x={cx} y={cy-4} textAnchor="middle" fill="var(--text-dim)"
          fontSize="10" fontFamily="'Geist Mono', monospace">
          {hover===null ? "TOTAL" : arcs[hover].name.toUpperCase()}
        </text>
        <text x={cx} y={cy+16} textAnchor="middle" fill="var(--text)"
          fontSize="22" fontWeight="600" fontFamily="'Geist Mono', monospace">
          {hover===null ? total : arcs[hover].count}
        </text>
      </svg>
    </div>
  );
}

function SalaryBars({ data, accent }){
  const wrap = useRef(null);
  const { w, h } = useSize(wrap);
  const pad = { t: 12, r: 12, b: 24, l: 44 };
  const iw = Math.max(100, w-pad.l-pad.r);
  const ih = Math.max(60, h-pad.t-pad.b);
  const max = Math.max(...data.map(d=>d.avg))*1.1;
  const bh = ih/data.length * 0.6;

  return (
    <div ref={wrap} style={{width:'100%', height:'100%'}}>
      <svg width={w} height={h} style={{display:'block'}}>
        {data.map((d,i)=>{
          const y = pad.t + i*(ih/data.length) + (ih/data.length - bh)/2;
          const bw = (d.avg/max)*iw;
          return (
            <g key={d.level}>
              <text x={pad.l-8} y={y+bh/2+4} textAnchor="end"
                fill="var(--text-dim)" fontSize="11"
                fontFamily="'Geist Mono', monospace">{d.level}</text>
              <rect x={pad.l} y={y} width={bw} height={bh} fill={accent} fillOpacity="0.8" rx="2"/>
              <text x={pad.l+bw+6} y={y+bh/2+4} fill="var(--text-dim)"
                fontSize="10" fontFamily="'Geist Mono', monospace">
                {fmtMoney(d.avg)} · {d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ComparisonChart({ seriesA, extras, labels, accent }){
  const wrap = React.useRef(null);
  const { w, h } = useSize(wrap);
  const [hover, setHover] = React.useState(null);
  const PALETTE = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];
  const pad = { t: 16, r: 56, b: 28, l: 56 };
  const iw = Math.max(100, w - pad.l - pad.r);
  const ih = Math.max(60, h - pad.t - pad.b);
  const maxA = Math.max(...seriesA.data)*1.1, minA = Math.min(...seriesA.data)*0.9;
  const x = i => pad.l + (i/(seriesA.data.length-1))*iw;
  const yA = v => pad.t + ih - ((v-minA)/(maxA-minA||1))*ih;

  // shared normalized axis for extras (0..1 per-series)
  const extrasWithScale = extras.map((s, idx)=>{
    const mx = Math.max(...s.data)*1.1, mn = Math.min(...s.data)*0.9;
    return { ...s, mx, mn, color: PALETTE[idx % PALETTE.length],
      y: v => pad.t + ih - ((v-mn)/(mx-mn||1))*ih };
  });

  const pathA = seriesA.data.map((v,i)=>`${i?'L':'M'}${x(i)},${yA(v)}`).join(' ');
  const areaA = pathA + ` L${x(seriesA.data.length-1)},${pad.t+ih} L${x(0)},${pad.t+ih} Z`;
  const yTicks = [0,0.5,1];

  return (
    <div ref={wrap} style={{position:'relative', width:'100%', height:'100%'}}
      onMouseMove={e=>{
        const rect = wrap.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const idx = Math.round(((mx-pad.l)/iw)*(seriesA.data.length-1));
        if(idx>=0 && idx<seriesA.data.length) setHover(idx); else setHover(null);
      }}
      onMouseLeave={()=>setHover(null)}>
      <svg width={w} height={h} style={{display:'block', overflow:'visible'}}>
        <defs>
          <linearGradient id="cmpGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={accent} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {yTicks.map((t,i)=>{
          const vA = minA+(maxA-minA)*t;
          return (
            <g key={i}>
              <line x1={pad.l} x2={pad.l+iw} y1={yA(vA)} y2={yA(vA)}
                stroke="var(--line-soft)" strokeDasharray={t===0?'':'2 4'}/>
              <text x={pad.l-8} y={yA(vA)+3} fill={accent} fontSize="10"
                textAnchor="end" fontFamily="'Geist Mono', monospace">{seriesA.fmt(Math.round(vA))}</text>
            </g>
          );
        })}
        <path d={areaA} fill="url(#cmpGrad)"/>
        <path d={pathA} fill="none" stroke={accent} strokeWidth="2"/>
        {extrasWithScale.map(s=>{
          const p = s.data.map((v,i)=>`${i?'L':'M'}${x(i)},${s.y(v)}`).join(' ');
          return <path key={s.key} d={p} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray="4 3"/>;
        })}
        {seriesA.data.map((v,i)=>(
          <circle key={"a"+i} cx={x(i)} cy={yA(v)} r={hover===i?5:2.5}
            fill={hover===i?accent:"var(--panel)"} stroke={accent} strokeWidth="1.5"/>
        ))}
        {extrasWithScale.map(s=> s.data.map((v,i)=>(
          <circle key={s.key+i} cx={x(i)} cy={s.y(v)} r={hover===i?4:2}
            fill={hover===i?s.color:"var(--panel)"} stroke={s.color} strokeWidth="1.25"/>
        )))}
        {labels.map((l,i)=>(
          <text key={i} x={x(i)} y={pad.t+ih+18} fill="var(--text-dimmer)"
            fontSize="10" textAnchor="middle" fontFamily="'Geist Mono', monospace">
            {l.split(' ')[0]}
          </text>
        ))}
        {hover!==null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t+ih}
            stroke="var(--line)" strokeDasharray="2 3"/>
        )}
      </svg>
      {hover!==null && (
        <div style={{
          position:'absolute', left: Math.min(x(hover)+12, w-200),
          top: Math.max(yA(seriesA.data[hover])-60, 8),
          background:'var(--panel)', border:'1px solid var(--line-soft)',
          borderRadius:6, padding:'8px 10px', pointerEvents:'none',
          fontSize:11, whiteSpace:'nowrap'
        }}>
          <div style={{color:'var(--text-dim)', fontFamily:"'Geist Mono', monospace", marginBottom:4}}>{labels[hover]}</div>
          <div style={{fontFamily:"'Geist Mono', monospace", color:accent, fontWeight:600, fontSize:12}}>
            ● {seriesA.label}: {seriesA.fmt(seriesA.data[hover])}
          </div>
          {extrasWithScale.map(s=>(
            <div key={s.key} style={{fontFamily:"'Geist Mono', monospace", color:s.color, fontWeight:600, fontSize:12}}>
              ● {s.label}: {s.fmt(s.data[hover])}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.Charts = { PayrollChart, HeadcountChart, DeptDonut, SalaryBars, ComparisonChart, fmtMoney, fmtNum };
