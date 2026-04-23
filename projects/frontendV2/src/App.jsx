import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './components/ui/Sidebar';
import { Header } from './components/ui/Header';
import { Icon } from './components/ui/Icon';
import { Analytics } from './pages/Analytics';
import { InstitutionPayroll } from './pages/InstitutionPayroll';

const TWEAKS_DEFAULT = {
  accent: "#c9f26a",
  density: "comfy",
  payrollStyle: "area",
  theme: "dark",
};

const PAGE_TITLES = {
  economia:     ["Economía",     "Indicadores económicos nacionales"],
  social:       ["Social",       "Estadísticas sociales y demográficas"],
  salud:        ["Salud",        "Sistema de salud pública"],
  educacion:    ["Educación",    "Indicadores del sistema educativo"],
  medioambiente:["Medioambiente","Indicadores ambientales"],
  militar:      ["Militar",      "Defensa y seguridad"],
  jarabacoa:    ["Jarabacoa",    "Ayuntamiento de Jarabacoa"],
  moca:         ["Moca",         "Ayuntamiento de Moca"],
  cotui:        ["Cotuí",        "Ayuntamiento de Cotuí"],
  intrant:      ["Intrant",      "Instituto Nacional de Tránsito y Transporte Terrestre"],
  fuentes:      ["Fuentes",      "Orígenes de datos oficiales"],
};

export function App() {
  const location = useLocation();
  const page = location.pathname.slice(1) || 'economia';

  const [tweaks, setTweaks] = useState(TWEAKS_DEFAULT);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const accent = tweaks.accent;
  const [title, sub] = PAGE_TITLES[page] ?? PAGE_TITLES.economia;

  useEffect(() => {
    document.documentElement.style.setProperty('--accent', accent);
    document.documentElement.style.setProperty('--row-pad', tweaks.density === 'compact' ? '8px' : '14px');
    document.documentElement.setAttribute('data-theme', tweaks.theme || 'dark');
  }, [accent, tweaks.density, tweaks.theme]);

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
    setTweaks(t => {
      const nt = { ...t, [k]: v };
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [k]: v } }, '*');
      return nt;
    });
  };

  return (
    <div className="app">
      <Sidebar density={tweaks.density} accent={accent} />

      <main className="main">
        <Header title={title} subtitle={sub} accent={accent} />
        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/economia" replace />} />
            <Route path="/economia"      element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/social"        element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/salud"         element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/educacion"     element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/medioambiente" element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/militar"       element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
            <Route path="/jarabacoa"     element={<InstitutionPayroll institution="jarabacoa" accent={accent} />} />
            <Route path="/moca"          element={<InstitutionPayroll institution="moca"      accent={accent} />} />
            <Route path="/cotui"         element={<InstitutionPayroll institution="cotui"     accent={accent} />} />
            <Route path="/intrant"       element={<InstitutionPayroll institution="intrant"   accent={accent} />} />
            <Route path="/fuentes"       element={<Analytics accent={accent} payrollStyle={tweaks.payrollStyle} />} />
          </Routes>
        </div>
      </main>

      {tweaksOpen && (
        <div className="tweaks">
          <div className="tweaks-head">
            <div style={{ fontSize: 12, fontFamily: "'Geist Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(255,255,255,0.5)' }}>
              Tweaks
            </div>
            <button className="icon-btn" onClick={() => setTweaksOpen(false)}>
              <Icon name="close" size={14} />
            </button>
          </div>
          <div className="tweaks-body">
            <div className="tweak-row">
              <label>Accent</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {["#c9f26a", "#6ad2f2", "#f26a9e", "#f2b36a", "#a58cff"].map(c => (
                  <button key={c}
                    className={"swatch" + (accent === c ? " on" : "")}
                    style={{ background: c }}
                    onClick={() => setTweak('accent', c)} />
                ))}
              </div>
            </div>
            <div className="tweak-row">
              <label>Density</label>
              <div className="seg">
                {["compact", "comfy"].map(d => (
                  <button key={d} className={tweaks.density === d ? "on" : ""} onClick={() => setTweak('density', d)}>{d}</button>
                ))}
              </div>
            </div>
            <div className="tweak-row">
              <label>Theme</label>
              <div className="seg">
                {["dark", "light"].map(t => (
                  <button key={t} className={tweaks.theme === t ? "on" : ""} onClick={() => setTweak('theme', t)}>{t}</button>
                ))}
              </div>
            </div>
            <div className="tweak-row">
              <label>Payroll chart</label>
              <div className="seg">
                {["area", "line", "bars"].map(s => (
                  <button key={s} className={tweaks.payrollStyle === s ? "on" : ""} onClick={() => setTweak('payrollStyle', s)}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
