import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';

const EXTRA_COLORS = ['#6ad2f2', '#f2b76a', '#b06af2', '#6af2a1'];

export function LightweightChart({ primary, extras = [], accent = '#c9f26a', fmt, onDoubleClick }) {
  const containerRef = useRef(null);
  const state = useRef({ chart: null, primarySeries: null, extraSeries: [], dblClickHandler: null });
  const onDoubleClickRef = useRef(onDoubleClick);
  const [chartReady, setChartReady] = useState(false);

  useEffect(() => { onDoubleClickRef.current = onDoubleClick; }, [onDoubleClick]);

  // ── Lazy init via IntersectionObserver ───────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const init = () => {
      if (state.current.chart) return;

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: 'solid', color: '#1c2028' },
          textColor: 'rgba(232,236,242,0.45)',
          fontFamily: "'Geist Mono', monospace",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: 'rgba(255,255,255,0.04)' },
          horzLines: { color: 'rgba(255,255,255,0.04)' },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: { top: 0.12, bottom: 0.04 },
        },
        timeScale: {
          borderVisible: false,
          tickMarkFormatter: (time) => {
            const d = new Date(time + 'T12:00:00Z');
            return d.toLocaleDateString('es-DO', { month: 'short', year: '2-digit' });
          },
        },
        crosshair: {
          vertLine: { color: 'rgba(232,236,242,0.25)', width: 1, style: 3 },
          horzLine: { color: 'rgba(232,236,242,0.25)', width: 1, style: 3 },
        },
      });

      const handleDblClick = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const time = state.current.chart?.timeScale().coordinateToTime(x);
        if (time && onDoubleClickRef.current) onDoubleClickRef.current(String(time));
      };
      el.addEventListener('dblclick', handleDblClick);

      state.current.chart = chart;
      state.current.dblClickHandler = handleDblClick;
      setChartReady(true);
      document.querySelectorAll('#tv-attr-logo')?.forEach(e => e.remove());
      observer.disconnect();
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) init();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      const { chart, dblClickHandler } = state.current;
      if (dblClickHandler) el.removeEventListener('dblclick', dblClickHandler);
      if (chart) chart.remove();
      state.current = { chart: null, primarySeries: null, extraSeries: [], dblClickHandler: null };
    };
  }, []);

  // ── Price formatter ──────────────────────────────────────────────────────
  useEffect(() => {
    const { chart } = state.current;
    if (!chart) return;
    chart.applyOptions({
      localization: {
        priceFormatter: fmt ? (v) => fmt(Math.round(v)) : (v) => v.toLocaleString(),
      },
    });
  }, [fmt, chartReady]);

  // ── Primary series ───────────────────────────────────────────────────────
  useEffect(() => {
    const s = state.current;
    if (!s.chart) return;

    if (s.primarySeries) {
      s.chart.removeSeries(s.primarySeries);
      s.primarySeries = null;
    }
    if (!primary?.length) return;

    const series = s.chart.addAreaSeries({
      lineColor: accent,
      topColor: accent + '55',
      bottomColor: accent + '00',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    series.setData(primary);
    s.primarySeries = series;
    s.chart.timeScale().fitContent();
  }, [primary, accent, chartReady]);

  // ── Extra (comparison) series ────────────────────────────────────────────
  useEffect(() => {
    const s = state.current;
    if (!s.chart) return;

    s.extraSeries.forEach(es => { try { s.chart.removeSeries(es); } catch { } });
    s.extraSeries = [];

    extras.forEach((ex, i) => {
      if (!ex?.data?.length) return;
      const color = EXTRA_COLORS[i % EXTRA_COLORS.length];
      const series = s.chart.addAreaSeries({
        lineColor: color,
        topColor: color + '22',
        bottomColor: color + '00',
        lineWidth: 2,
        lineStyle: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 3,
      });
      series.setData(ex.data);
      s.extraSeries.push(series);
    });

    if (extras.length) s.chart.timeScale().fitContent();
  }, [extras, chartReady]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
