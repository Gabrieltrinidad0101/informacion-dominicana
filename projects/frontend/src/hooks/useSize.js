import { useState, useEffect } from 'react';

export function useSize(ref) {
  const [s, setS] = useState({ w: 600, h: 240 });
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => {
      const r = entries[0].contentRect;
      setS({ w: r.width, h: r.height });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return s;
}
