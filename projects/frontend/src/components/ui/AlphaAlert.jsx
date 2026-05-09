import { useState } from 'react';

const SESSION_KEY = 'alpha_alert_dismissed';

export function AlphaAlert() {
  const [visible, setVisible] = useState(() => !sessionStorage.getItem(SESSION_KEY));

  if (!visible) return null;

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="alpha-alert">
      <div className="alpha-alert-body">
        <span className="alpha-badge">Alpha 0.1</span>
        <p>
          Este sitio web se encuentra en versión alpha y está en desarrollo activo.
          <strong> No es un sitio oficial del gobierno dominicano</strong> y ninguna institución pública ni privada financia este proyecto.
        </p>
      </div>
      <button className="alpha-alert-close" onClick={dismiss} aria-label="Cerrar aviso">✕</button>
    </div>
  );
}
