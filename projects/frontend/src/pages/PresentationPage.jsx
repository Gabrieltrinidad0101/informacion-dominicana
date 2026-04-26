import { useState, useEffect, useRef, Fragment } from 'react';
import './presentation.css';

const DESIGN_W = 1920;
const DESIGN_H = 1080;

function Counter({ target, decimals = 0, suffix = '', duration = 1400, active }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active, target, duration]);
  return <span className="counter">{val.toFixed(decimals)}{suffix}</span>;
}

function useInView(threshold = 0.4) {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true); },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, active];
}

function Slide1({ active }) {
  const tickerItems = [
    'PRESUPUESTOS', 'LICITACIONES', 'CONTRATOS', 'NÓMINA PÚBLICA',
    'SALUD', 'EDUCACIÓN', 'INFRAESTRUCTURA', 'JUSTICIA',
  ];
  return (
    <section className={'slide s1' + (active ? ' active' : '')}>
      <div className="s1-grid" />
      <div className="chrome-top">
        <div><span className="dot" />SISTEMA ACTIVO</div>
        <div className="pn">01 / 05</div>
      </div>
      <div className="s1-name anim-fade">
        <div className="logo-mark">ID</div>
        INFORMACIÓN DOMINICANA
      </div>
      <div className="s1-content">
        <div className="s1-eyebrow anim-up"><span className="bar" />PLATAFORMA DE INTELIGENCIA PÚBLICA · 2026</div>
        <h1 className="s1-title">
          <span className="line"><span className="inner">La plataforma</span></span>
          <span className="line"><span className="inner">que analiza <em className="yell">toda</em></span></span>
          <span className="line"><span className="inner">la información</span></span>
          <span className="line"><span className="inner">del <span className="yell">estado</span>.</span></span>
        </h1>
      </div>
      <div className="s1-ticker anim-fade">
        <div className="s1-ticker-track">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <Fragment key={i}>
              <span>— {t}</span><span className="y">●</span>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function Slide2({ active }) {
  return (
    <section className={'slide s2' + (active ? ' active' : '')}>
      <div className="chrome-top">
        <div><span className="dot" />02 · CONTEXTO</div>
        <div className="pn">02 / 05</div>
      </div>
      <div className="s2-wrap">
        <div className="s2-left">
          <h2 className="anim-up">— El problema</h2>
          <p className="headline anim-up-2">
            El estado genera <em>millones</em><br />
            de datos al día.<br />
            Casi nadie<br />
            los <span className="hl">lee</span>.
          </p>
          <p className="body anim-up-3 sans">
            Información Dominicana conecta, normaliza y analiza la información pública dispersa en cientos de organismos — y la vuelve útil, comparable y accionable para todos los dominicanos y dominicanas.
          </p>
        </div>
        <div className="s2-right anim-wipe">
          <div className="rh"><span>// VOInformación Dominicana INSTITUCIONAL</span><b>2025</b></div>
          <div className="big-num">
            <Counter target={2.4} decimals={1} active={active} />
            <span className="pct">M</span>
          </div>
          <div className="big-label">documentos públicos publicados al año por 348 organismos del estado en formato no estructurado.</div>
          <div className="stat-rule" />
          <div className="sub-stats">
            <div className="sub-stat">
              <div className="n"><Counter target={87} active={active} />%</div>
              <div className="l">NO SE INDEXA<br />NI SE ANALIZA</div>
            </div>
            <div className="sub-stat">
              <div className="n"><Counter target={348} active={active} /></div>
              <div className="l">ORGANISMOS<br />DESCONECTADOS</div>
            </div>
            <div className="sub-stat">
              <div className="n">∅</div>
              <div className="l">ESTÁNDAR<br />COMÚN DE DATOS</div>
            </div>
            <div className="sub-stat">
              <div className="n"><Counter target={14} active={active} />d</div>
              <div className="l">DEMORA MEDIA<br />PARA ACCEDER</div>
            </div>
          </div>
        </div>
      </div>
      <div className="chrome-bot">
        <div className="pn">INFORMACIÓN DOMINICANA / 2026</div>
      </div>
    </section>
  );
}

const DOMAINS = [
  { n: '01', tag: 'FISCAL', title: 'Presupuestos y ejecución', desc: 'Partidas, transferencias y ejecución mensual por ministerio, región y programa.', metric: 72, yell: false, anim: 'anim-up' },
  { n: '02', tag: 'COMPRAS PÚBLICAS', title: 'Licitaciones y contratos', desc: 'Cada orden de compra, proveedor adjudicado y trazabilidad de montos.', metric: 118, yell: true, anim: 'anim-up-2' },
  { n: '03', tag: 'PERSONAS', title: 'Nómina y funcionarios', desc: 'Personal del estado, cargos, remuneraciones y trayectoria inter-institucional.', metric: 9.8, decimals: 1, yell: false, anim: 'anim-up-3' },
  { n: '04', tag: 'SALUD', title: 'Red hospitalaria', desc: 'Lista de espera, atenciones, fármacos y capacidad instalada por establecimiento.', metric: 46, yell: false, anim: 'anim-up-4' },
  { n: '05', tag: 'EDUCACIÓN', title: 'Matrícula y desempeño', desc: 'Establecimientos, cobertura, deserción y resultados estandarizados.', metric: 38, yell: false, anim: 'anim-up' },
  { n: '06', tag: 'INFRAESTRUCTURA', title: 'Obras y concesiones', desc: 'Avance físico, desviaciones de plazo y costo, concesiones vigentes.', metric: 21, yell: false, anim: 'anim-up-2' },
  { n: '07', tag: 'JUSTICIA', title: 'Causas y sentencias', desc: 'Flujo judicial, tiempos de tramitación y carga por tribunal.', metric: 64, yell: true, anim: 'anim-up-3' },
  { n: '08', tag: 'TERRITORIO', title: 'Municipios y regiones', desc: 'Indicadores locales consolidados por comuna, provincia y región.', metric: 43, yell: false, anim: 'anim-up-4' },
];

function DomainCard({ d, active }) {
  return (
    <div className={'dcard ' + (d.yell ? 'yell ' : '') + d.anim}>
      <div className="corner" />
      <div className="num">/ {d.n} — {d.tag}</div>
      <div className="title">{d.title}</div>
      <div className="desc">{d.desc}</div>
      <div className="metric">
        <Counter target={d.metric} decimals={d.decimals || 0} active={active} />
        <span className="u">M registros</span>
      </div>
    </div>
  );
}

function Slide3({ active }) {
  const marq = ['INGESTA CONTINUA', 'NORMALIZACIÓN SEMÁNTICA', 'DETECCIÓN DE ANOMALÍAS', 'CRUCE ENTRE ORGANISMOS', 'TRAZABILIDAD TOTAL', 'API PÚBLICA'];
  return (
    <section className={'slide s3' + (active ? ' active' : '')}>
      <div className="chrome-top">
        <div><span className="dot" />03 · LO QUE ANALIZAMOS</div>
        <div className="pn">03 / 05</div>
      </div>
      <div className="s3-head">
        <div>
          <div className="kicker anim-up">— 8 DOMINIOS DE DATOS DEL ESTADO</div>
          <h2 className="anim-up-2">Toda la información pública, <em>conectada</em> y legible.</h2>
        </div>
        <div className="count anim-up-3">
          TOTAL DE REGISTROS INGERIDOS<br />
          <b><Counter target={130} suffix="K" active={active} /></b>
          APRIL 2026
        </div>
      </div>
      <div className="s3-grid">
        {DOMAINS.map(d => <DomainCard key={d.n} d={d} active={active} />)}
      </div>
      <div className="s3-marq">
        <div className="s3-marq-track">
          {[...marq, ...marq].map((t, i) => (
            <Fragment key={i}><span>{t}</span><span className="y">▲</span></Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

const BARS = [
  { year: '2026/4', total: 4, b: 4, y: 4 },
  { year: '2026/8', total: 92, b: 11, y: 12 },
  { year: '2026/12', total: 164, b: 18, y: 22 },
  { year: '2027/4', total: 247, b: 28, y: 34 },
  { year: '2027/8', total: 356, b: 42, y: 48 },
  { year: '2027/12', total: 491, b: 56, y: 68 },
  { year: '2028/4', total: 672, b: 74, y: 92 }
];

function Slide4({ active }) {
  return (
    <section className={'slide s4' + (active ? ' active' : '')}>
      <div className="chrome-top">
        <div><span className="dot" />04 · EVIDENCIA</div>
        <div className="pn">04 / 05</div>
      </div>
      <div className="s4-wrap">
        <div className="s4-left">
          <div className="kicker anim-up">— COBERTURA DE DATOS</div>
          <h2 className="anim-up-2">De <em>datos</em> dispersos a una <span className="hl">sola lectura</span> del estado.</h2>
          <p className="desc anim-up-3 sans">La cobertura de fuentes públicas integradas crece de forma sostenida. Cada nueva fuente mejora el poder analítico del conjunto — porque los datos se cruzan, no se acumulan.</p>
          <div className="s4-legend anim-up-4">
            <div className="it"><span className="sw y" />FUENTES INTEGRADAS</div>
            <div className="it"><span className="sw b" />DATASETS NORMALIZADOS</div>
          </div>
        </div>
        <div className="s4-chart anim-wipe">
          <div className="delta-tag">Δ 2019 → 2025</div>
          <div className="chart-head">
            <div className="title">Crecimiento de cobertura esperado · Información Dominicana</div>
            <div className="sub">UNIDADES · ORGANISMOS + DATASETS</div>
          </div>
          <div className="bars">
            {BARS.map((c, i) => (
              <div className="bar-col" key={c.year}>
                <div className="vals"><Counter target={c.total} active={active} /></div>
                <div className="stack">
                  <div className="bar b" style={{ height: c.b + '%', transitionDelay: (0.3 + i * 0.06) + 's' }} />
                  <div className="bar y" style={{ height: c.y + '%', transitionDelay: (0.4 + i * 0.06) + 's' }} />
                </div>
                <div className="lab">{c.year}</div>
              </div>
            ))}
          </div>
          <div className="chart-foot">
            <div>CAGR <b>·</b> <b><Counter target={1} suffix="%" active={active} /></b></div>
            <div>ORGANISMOS <b>·</b> <b><Counter target={348} active={active} /></b></div>
            <div>DATASETS <b>·</b> <b><Counter target={324} active={active} /></b></div>
            <div>ACTUALIZACIÓN <b>·</b> <b>DIARIO</b></div>
          </div>
        </div>
      </div>
      <div className="chrome-bot">
        <div>DATOS INTERNOS · INFORMACION-DOMINICANA</div>
        <div className="pn">04 / 05</div>
      </div>
    </section>
  );
}

function Slide5({ active }) {
  return (
    <section className={'slide s5' + (active ? ' active' : '')}>
      <div className="chrome-top">
        <div><span className="dot" />05 · CIERRE</div>
        <div className="pn">05 / 05</div>
      </div>
      <div className="s5-wrap">
        <div className="k anim-up">— LA VISIÓN</div>
        <h2>
          <span className="anim-up-2" style={{ display: 'block' }}>Ver al estado</span>
          <span className="anim-up-3" style={{ display: 'block' }}><em>completo</em>, por primera vez.</span>
        </h2>
        <div className="s5-row anim-up-5">
          <div className="s5-stat">
            <div className="n"><Counter target={348} active={active} /></div>
            <div className="l">Organismos públicos integrados</div>
          </div>
          <div className="s5-stat">
            <div className="n"><Counter target={412} suffix="M" active={active} /></div>
            <div className="l">Registros totales</div>
          </div>
          <div className="s5-stat">
            <div className="n"><Counter target={103} suffix="K" active={active} /></div>
            <div className="l">Registros analizados</div>
          </div>
          <div className="s5-stat">
            <div className="n">01</div>
            <div className="l">Una sola plataforma, una sola lectura</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const SLIDE_COMPONENTS = [Slide1, Slide2, Slide3, Slide4, Slide5];

function SlideRow({ SlideComp, scale }) {
  const [ref, active] = useInView(0.3);
  const containerH = Math.round(DESIGN_H * scale);
  return (
    <div ref={ref} style={{ width: '100%', height: containerH, overflow: 'hidden', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: DESIGN_W, height: DESIGN_H, flexShrink: 0, transformOrigin: 'top center', transform: `scale(${scale})` }}>
        <SlideComp active={active} />
      </div>
    </div>
  );
}

export function PresentationPage() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / DESIGN_W, window.innerHeight / DESIGN_H));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div className="pres-page">
      {SLIDE_COMPONENTS.map((SlideComp, i) => (
        <SlideRow key={i} SlideComp={SlideComp} scale={scale} />
      ))}
    </div>
  );
}
