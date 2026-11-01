import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import './presentation.css';

const DESIGN_W = 1920;
const DESIGN_H = 1080;

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
        <div className="pn">01 / 01</div>
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

const SLIDE_COMPONENTS = [Slide1];

const MOBILE_BP = 768;

function SlideRow({ SlideComp, scale, isMobile }) {
  const [ref, active] = useInView(0.3);

  if (isMobile) {
    return (
      <div ref={ref} style={{ width: '100%', flexShrink: 0 }}>
        <SlideComp active={active} />
      </div>
    );
  }

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
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < MOBILE_BP);

  const recalc = useCallback((w) => {
    const mobile = window.innerWidth < MOBILE_BP;
    setIsMobile(mobile);
    if (!mobile) setScale(Math.min(w / DESIGN_W, window.innerHeight / DESIGN_H));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => recalc(entry.contentRect.width));
    ro.observe(el);
    recalc(el.getBoundingClientRect().width);

    const onResize = () => recalc(el.getBoundingClientRect().width);
    window.addEventListener('resize', onResize);
    return () => { ro.disconnect(); window.removeEventListener('resize', onResize); };
  }, [recalc]);

  return (
    <div className="pres-page" ref={containerRef}>
      {SLIDE_COMPONENTS.map((SlideComp, i) => (
        <SlideRow key={i} SlideComp={SlideComp} scale={scale} isMobile={isMobile} />
      ))}
    </div>
  );
}
