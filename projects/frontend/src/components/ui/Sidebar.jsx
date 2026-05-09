import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const items = [
  { id: "economia", label: "Economía", icon: "cash" },
  { id: "social", label: "Social", icon: "users" },
  { id: "salud", label: "Salud", icon: "bell" },
  { id: "educacion", label: "Educación", icon: "doc" },
  { id: "medioambiente", label: "Medioambiente", icon: "grid" },
  { id: "militar", label: "Militar", icon: "building" },
  {
    type: "category", label: "Ayuntamientos", icon: "building",
    items: [
      { id: "jarabacoa", label: "Jarabacoa" },
      { id: "moca", label: "Moca" },
    ],
  },
  { id: "intrant", label: "Intrant", icon: "building" },
  { id: "ogtic", label: "OGTIC", icon: "building" },
  { id: "mopc", label: "MOPC", icon: "building" },
  { id: "fuentes", label: "Fuentes", icon: "doc" },
];

export function Sidebar({ density, accent, open }) {
  const [openCat, setOpenCat] = useState(true);
  const padY = density === "compact" ? 7 : 10;

  return (
    <aside className={"sidebar" + (open ? " open" : "")}>
      <div className="brand">
        <div className="brand-mark" style={{ background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0a0d12', fontFamily: "'Geist Mono', monospace", letterSpacing: '-0.5px' }}>
          ID
        </div>
        <div>
          <div className="brand-name">Información Dominicana</div>
          <div className="brand-sub">Datos · Estadísticos</div>
        </div>
      </div>

      <div className="nav-section" style={{ marginBottom: 4 }}>
        <NavLink to="/" end
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
          style={{ paddingTop: padY, paddingBottom: padY }}>
          {({ isActive }) => (
            <>
              <span className="nav-ic"><Icon name="grid" /></span>
              <span>Inicio</span>
              {isActive && <span className="nav-rail" style={{ background: accent }} />}
            </>
          )}
        </NavLink>
      </div>

      <div className="nav-section">
        <div className="nav-label">Categorías</div>
        {items.map((it, idx) => {
          if (it.type === "category") {
            return (
              <div key={idx} className="nav-group">
                <button className="nav-item" style={{ paddingTop: padY, paddingBottom: padY }}
                  onClick={() => setOpenCat(o => !o)}>
                  <span className="nav-ic"><Icon name={it.icon} /></span>
                  <span>{it.label}</span>
                  <span className="nav-caret" style={{ marginLeft: 'auto', opacity: 0.6 }}>
                    <Icon name={openCat ? "down" : "arrow"} size={12} />
                  </span>
                </button>
                {openCat && (
                  <div className="nav-sublist">
                    {it.items.map(sub => (
                      <NavLink key={sub.id} to={`/${sub.id}`}
                        className={({ isActive }) => "nav-item nav-sub" + (isActive ? " active" : "")}
                        style={{ paddingTop: padY - 2, paddingBottom: padY - 2 }}>
                        {({ isActive }) => (
                          <>
                            <span className="nav-subdot" style={isActive ? { background: accent } : {}} />
                            <span>{sub.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink key={it.id} to={`/${it.id}`}
              className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
              style={{ paddingTop: padY, paddingBottom: padY }}>
              {({ isActive }) => (
                <>
                  <span className="nav-ic"><Icon name={it.icon} /></span>
                  <span>{it.label}</span>
                  {isActive && <span className="nav-rail" style={{ background: accent }} />}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
