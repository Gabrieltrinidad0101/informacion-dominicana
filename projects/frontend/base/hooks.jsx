// Shared React hooks + helpers
const { useState, useEffect, useRef, useCallback } = React;

// Returns the currently-active slide index, based on postMessage from <deck-stage>
function useActiveSlide() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    function onMsg(e) {
      if (e.data && typeof e.data.slideIndexChanged === 'number') {
        setIdx(e.data.slideIndexChanged);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);
  return idx;
}

// Animated counter. Re-runs whenever `active` flips to true.
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

Object.assign(window, { useActiveSlide, Counter });
