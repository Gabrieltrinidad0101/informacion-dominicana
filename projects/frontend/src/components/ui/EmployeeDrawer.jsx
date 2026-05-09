import { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Icon } from './Icon';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import { isPdfDownload, resolveDownloadUrl } from '../../utils/fileUrl.js';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';

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

function PdfViewer({ urlDownload }) {
  const [pdfData, setPdfData] = useState(null);
  const [rotation, setRotation] = useState(0);
  const pageMatch = urlDownload.match(/_page(\d+)$/);
  const pageNumber = pageMatch ? parseInt(pageMatch[1]) + 1 : 1;
  const pdfUrl = `${SERVER_URL}/${urlDownload.replace(/_page\d+$/, '')}.pdf`;

  useEffect(() => {
    setPdfData(null);
    setRotation(0);
    fetch(pdfUrl)
      .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then(buf => setPdfData(buf))
      .catch(() => setPdfData('error'));
  }, [pdfUrl]);

  if (!pdfData) return <StatusBox>Cargando PDF…</StatusBox>;
  if (pdfData === 'error') return <StatusBox>No se pudo cargar el PDF.</StatusBox>;

  return (
    <div style={{ width: '100%', borderRadius: 6, overflow: 'hidden', background: '#525659', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', background: '#3a3d40', flexShrink: 0, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginRight: 4, letterSpacing: '0.4px' }}>ROTAR</span>
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
        <Document file={pdfData}>
          <Page pageNumber={pageNumber} width={Math.floor(window.innerWidth * 0.78)} rotate={rotation} />
        </Document>
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

  if (isPdfDownload(urlDownload)) return <PdfViewer urlDownload={urlDownload} />;

  if (!checked) return <StatusBox>Cargando…</StatusBox>;
  if (excelUrl === 'error') return <StatusBox>No se pudo cargar el archivo.</StatusBox>;
  return <ExcelViewer fileUrl={excelUrl} employeeName={employeeName} />;
}

export function EmployeeDrawer({ employee, onClose, accent }) {
  if (!employee) return null;

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
