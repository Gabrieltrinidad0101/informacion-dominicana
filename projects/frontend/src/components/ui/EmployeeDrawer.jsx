import { useState, useEffect, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Icon } from './Icon';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { isPdfDownload, resolveDownloadUrl } from '../../utils/fileUrl.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:9000/informacion-dominicana-v2';

function normalizeText(s) {
  return (s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseOcrWords(json) {
  const texts  = json?.rec_texts  || [];
  const scores = json?.rec_scores || [];
  const polys  = json?.rec_polys  || [];
  const words = [];
  for (let i = 0; i < texts.length; i++) {
    const poly = polys[i];
    if (!poly || poly.length !== 4) continue;
    const [p0, p1, p2, p3] = poly;
    const cx = (p0[0] + p2[0]) / 2;
    const cy = (p0[1] + p2[1]) / 2;
    const w  = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const h  = Math.hypot(p3[0] - p0[0], p3[1] - p0[1]);
    words.push({
      text: (texts[i] || '').trim(),
      x: cx - w / 2,
      y: cy - h / 2,
      w, h,
      conf: scores[i] ?? 0,
    });
  }
  return words;
}

function mergeBoxes(boxes) {
  const x  = Math.min(...boxes.map(b => b.x));
  const y  = Math.min(...boxes.map(b => b.y));
  const x2 = Math.max(...boxes.map(b => b.x + b.w));
  const y2 = Math.max(...boxes.map(b => b.y + b.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

function findOcrMatches(words, query) {
  const q = normalizeText(query);
  if (!q || !words.length) return [];

  const nTokens = q.split(' ').length;
  const windowSizes = nTokens === 1 ? [1] : [nTokens, nTokens - 1, nTokens + 1];

  const hits = [];
  for (const winSize of windowSizes) {
    if (winSize < 1 || winSize > words.length) continue;
    for (let start = 0; start <= words.length - winSize; start++) {
      const span = words.slice(start, start + winSize);
      const combined = span.map(w => normalizeText(w.text)).join(' ');
      if (!combined) continue;
      const hit = combined.includes(q) || (q.length > 4 && q.includes(combined));
      if (hit) {
        hits.push({
          ...mergeBoxes(span),
          text: span.map(w => w.text).join(' '),
        });
      }
    }
  }

  hits.sort((a, b) => (a.w * a.h) - (b.w * b.h));
  const uniq = [];
  for (const m of hits) {
    if (!uniq.some(u => Math.abs(u.x - m.x) < 10 && Math.abs(u.y - m.y) < 10)) {
      uniq.push(m);
    }
  }
  return uniq;
}

function loadImageDims(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

function ExcelViewer({ fileUrl, employeeName }) {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [status, setStatus] = useState('loading');
  const [searchQ, setSearchQ] = useState(employeeName ?? '');
  const firstMatchRef = useRef(null);

  useEffect(() => {
    setStatus('loading');
    fetch(fileUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        const wb = XLSX.read(buffer, { type: 'array' });
        setSheets(wb.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' }),
        })));
        setActiveSheet(0);
        setStatus('ok');
      })
      .catch(() => setStatus('error'));
  }, [fileUrl]);

  useEffect(() => { setSearchQ(employeeName ?? ''); }, [employeeName]);

  useEffect(() => {
    if (firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchQ, activeSheet, status]);

  if (status === 'loading') return <StatusBox>Cargando Excel…</StatusBox>;
  if (status === 'error') return <StatusBox>No se pudo cargar el archivo.</StatusBox>;
  if (!sheets.length) return <StatusBox>Archivo vacío.</StatusBox>;

  const { data } = sheets[activeSheet];
  const needle = searchQ.trim().toLowerCase();

  const rowMatches = (row) =>
    needle && row.some(cell => String(cell).toLowerCase().includes(needle));

  let firstMatchAssigned = false;

  return (
    <div style={{ width: '100%', height: '100%', border: '1px solid var(--line-soft)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 8, padding: '6px 8px', borderBottom: '1px solid var(--line-soft)', background: 'var(--panel-2)', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 160, background: 'var(--search-bg)', border: '1px solid var(--line-soft)', borderRadius: 5, padding: '3px 8px' }}>
          <Icon name="search" size={12} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Buscar en el archivo…"
            style={{ border: 'none', background: 'transparent', color: 'var(--text)', fontSize: 11, outline: 'none', width: '100%' }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', lineHeight: 1, padding: 0 }}>×</button>
          )}
        </div>
        {sheets.length > 1 && sheets.map((s, i) => (
          <button
            key={s.name}
            onClick={() => setActiveSheet(i)}
            style={{
              padding: '2px 10px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: i === activeSheet ? 'var(--accent, #6ee7b7)' : 'transparent',
              color: i === activeSheet ? '#0a0d12' : 'var(--text-dim)',
            }}
          >
            {s.name}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%', fontFamily: "'Geist Mono', monospace" }}>
          <tbody>
            {data.map((row, ri) => {
              const highlight = ri > 0 && rowMatches(row);
              const isFirstMatch = highlight && !firstMatchAssigned;
              if (isFirstMatch) firstMatchAssigned = true;
              return (
                <tr
                  key={ri}
                  ref={isFirstMatch ? firstMatchRef : null}
                  style={{ background: highlight ? 'rgba(201,242,106,0.12)' : ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                >
                  {row.map((cell, ci) => {
                    const Tag = ri === 0 ? 'th' : 'td';
                    const cellStr = String(cell);
                    const cellMatch = highlight && needle && cellStr.toLowerCase().includes(needle);
                    return (
                      <Tag
                        key={ci}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid var(--line-soft)',
                          color: ri === 0 ? 'var(--text)' : highlight ? 'var(--text)' : 'var(--text-dim)',
                          fontWeight: ri === 0 ? 600 : highlight ? 600 : 400,
                          whiteSpace: 'nowrap',
                          background: cellMatch ? 'rgba(201,242,106,0.25)' : undefined,
                        }}
                      >
                        {cellStr}
                      </Tag>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBox({ children }) {
  return (
    <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', border: '1px solid var(--line-soft)', borderRadius: 6 }}>
      {children}
    </div>
  );
}

function PdfViewer({ urlDownload, employeeName }) {
  const [pdfData, setPdfData] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [pageDims, setPageDims] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [searchQ, setSearchQ] = useState(employeeName ?? '');
  const firstMatchRef = useRef(null);

  const pageMatch = urlDownload.match(/_page(\d+)$/);
  const pageNumber = pageMatch ? parseInt(pageMatch[1]) + 1 : 1;
  const pdfUrl = `${SERVER_URL}/${urlDownload.replace('/download/', '/pdfFixed/').replace(/_page\d+$/, '')}.pdf`;
  const renderedWidth = Math.floor(window.innerWidth * 0.78);

  useEffect(() => {
    setPdfData(null);
    setRotation(0);
    setPageDims(null);
    fetch(pdfUrl)
      .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then(buf => setPdfData(buf))
      .catch(() => setPdfData('error'));
  }, [pdfUrl]);

  useEffect(() => {
    let cancelled = false;
    setOcrData(null);
    const ocrUrl = `${SERVER_URL}/${urlDownload.replace('/download/', '/extractedText/')}_img0.json`;
    const imgUrl = `${SERVER_URL}/${urlDownload.replace('/download/', '/imgProcessed/')}_img0.png`;

    Promise.all([
      fetch(ocrUrl).then(r => r.ok ? r.json() : null).catch(() => null),
      loadImageDims(imgUrl).catch(() => null),
    ]).then(([json, dims]) => {
      if (cancelled || !json || !dims) return;
      setOcrData({ width: dims.width, height: dims.height, words: parseOcrWords(json) });
    });
    return () => { cancelled = true; };
  }, [urlDownload]);

  useEffect(() => { setSearchQ(employeeName ?? ''); }, [employeeName]);

  const matches = useMemo(() => {
    if (!ocrData || !searchQ) return [];
    return findOcrMatches(ocrData.words, searchQ);
  }, [ocrData, searchQ]);

  useEffect(() => {
    if (firstMatchRef.current) {
      firstMatchRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matches]);

  if (!pdfData) return <StatusBox>Cargando PDF…</StatusBox>;
  if (pdfData === 'error') return <StatusBox>No se pudo cargar el PDF.</StatusBox>;

  const renderedHeight = pageDims ? renderedWidth * pageDims.height / pageDims.width : 0;
  const sx = ocrData ? renderedWidth  / ocrData.width  : 1;
  const sy = ocrData && renderedHeight ? renderedHeight / ocrData.height : 1;
  const showOverlay = rotation === 0 && ocrData && pageDims && matches.length > 0;

  return (
    <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', background: '#525659', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: '#3a3d40', flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '3px 8px', flex: '1 1 200px', minWidth: 160 }}>
          <Icon name="search" size={12} />
          <input
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Buscar en el PDF…"
            style={{ border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.9)', fontSize: 11, outline: 'none', width: '100%' }}
          />
          {searchQ && (
            <button onClick={() => setSearchQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', lineHeight: 1, padding: 0, fontSize: 14 }}>×</button>
          )}
        </div>
        {ocrData && (
          <span style={{ fontSize: 11, color: matches.length > 0 ? 'var(--accent, #c9f26a)' : 'rgba(255,255,255,0.5)' }}>
            {matches.length} resultado{matches.length === 1 ? '' : 's'}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginLeft: 8, letterSpacing: '0.4px' }}>ROTAR</span>
        {[0, 90, 270].map(deg => (
          <button
            key={deg}
            onClick={() => setRotation(deg)}
            style={{
              padding: '3px 10px', fontSize: 11, borderRadius: 4, border: 'none', cursor: 'pointer',
              background: rotation === deg ? 'var(--accent, #c9f26a)' : 'rgba(255,255,255,0.1)',
              color: rotation === deg ? '#0a0d12' : 'rgba(255,255,255,0.8)',
              fontWeight: rotation === deg ? 700 : 400,
            }}
          >
            {deg}°
          </button>
        ))}
      </div>
      <div style={{ overflow: 'auto' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Document file={pdfData}>
            <Page
              pageNumber={pageNumber}
              width={renderedWidth}
              rotate={rotation}
              onLoadSuccess={page => setPageDims({ width: page.width, height: page.height })}
            />
          </Document>
          {showOverlay && matches.map((m, i) => (
            <div
              key={i}
              ref={i === 0 ? firstMatchRef : null}
              style={{
                position: 'absolute',
                left: m.x * sx,
                top: m.y * sy,
                width: m.w * sx,
                height: m.h * sy,
                background: 'rgba(255, 235, 59, 0.35)',
                border: '2px solid rgb(255, 193, 7)',
                borderRadius: 2,
                pointerEvents: 'none',
                boxShadow: '0 0 12px rgba(255, 235, 59, 0.6)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FileViewer({ urlDownload, employeeName }) {
  const [excelUrl, setExcelUrl] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setExcelUrl(null);
    setChecked(false);
    if (!urlDownload || isPdfDownload(urlDownload)) { setChecked(true); return; }
    resolveDownloadUrl(urlDownload).then(url => {
      setExcelUrl(url ?? 'error');
      setChecked(true);
    });
  }, [urlDownload]);

  if (!urlDownload) return null;

  if (isPdfDownload(urlDownload)) return <PdfViewer urlDownload={urlDownload} employeeName={employeeName} />;

  if (!checked) return <StatusBox>Cargando…</StatusBox>;
  if (excelUrl === 'error') return <StatusBox>No se pudo cargar el archivo.</StatusBox>;
  return <ExcelViewer fileUrl={excelUrl} employeeName={employeeName} />;
}

export function EmployeeDrawer({ employee, allEmployees = [], onSelect, onClose, accent }) {
  if (!employee) return null;

  const sameSource = isPdfDownload(employee.urlDownload)
    ? Array.from(
        new Map(
          (allEmployees || [])
            .filter(e => e.urlDownload === employee.urlDownload && e.id !== employee.id)
            .map(e => [e.id, e])
        ).values()
      )
    : [];

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>

        {/* ── Sidebar 20% ── */}
        <div className="drawer-sidebar">
          <div className="drawer-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <img
                className="avatar-lg"
                src={`https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(employee.name)}&backgroundColor=0a0d12`}
                alt={employee.name}
              />
              <div>
                <div style={{ fontSize: 16, color: 'var(--text)', fontWeight: 600 }}>{employee.name}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{employee.dept}</div>
                <div style={{ color: 'var(--text-dimmer)', fontSize: 10, fontFamily: "'Geist Mono', monospace", marginTop: 4 }}>
                  {employee.id}
                </div>
              </div>
            </div>
            <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
          </div>

          <div className="drawer-grid">
            <div className="detail">
              <div className="detail-k">Fecha</div>
              <div className="detail-v mono">{employee.startDate}</div>
            </div>
            <div className="detail">
              <div className="detail-k">Salario</div>
              <div className="detail-v mono">{employee.salary}</div>
            </div>
          </div>

          {sameSource.length > 0 && (
            <div style={{ padding: '12px 16px 0', borderTop: '1px solid var(--line-soft)', marginTop: 12, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.6px', textTransform: 'uppercase', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span>Otros en esta página</span>
                <span style={{ color: 'var(--text-dimmer)', fontWeight: 400 }}>{sameSource.length}</span>
              </div>
              <div style={{ overflowY: 'auto', flex: 1, marginRight: -8, paddingRight: 8 }}>
                {sameSource.map(e => (
                  <button
                    key={e.id}
                    onClick={() => onSelect && onSelect(e)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '8px 10px', marginBottom: 4, borderRadius: 6,
                      background: 'var(--panel-2)', border: '1px solid var(--line-soft)',
                      cursor: 'pointer', color: 'var(--text)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--panel-3, rgba(255,255,255,0.04))'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--panel-2)'}
                  >
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                        {e.dept}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap' }}>
                        {Number(e.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="drawer-foot">
            <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
          </div>
        </div>

        {/* ── File viewer 80% ── */}
        <div className="drawer-file">
          {employee.urlDownload
            ? <FileViewer urlDownload={employee.urlDownload} employeeName={employee.name} />
            : <StatusBox>Sin archivo adjunto.</StatusBox>
          }
        </div>

      </div>
    </div>
  );
}
