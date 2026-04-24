import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Icon } from './Icon';
import { fmtMoney } from '../../utils/format';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000';
const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];

function isPdfDownload(urlDownload) {
  return /_page\d+$/.test(urlDownload);
}

async function resolveExcelUrl(base) {
  for (const ext of EXCEL_EXTENSIONS) {
    const url = `${SERVER_URL}/${base}${ext}`;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch { /* try next */ }
  }
  return null;
}

function ExcelViewer({ fileUrl }) {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [status, setStatus] = useState('loading');

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

  if (status === 'loading') return <StatusBox>Cargando Excel…</StatusBox>;
  if (status === 'error') return <StatusBox>No se pudo cargar el archivo.</StatusBox>;
  if (!sheets.length) return <StatusBox>Archivo vacío.</StatusBox>;

  const { data } = sheets[activeSheet];

  return (
    <div style={{ width: '100%', height: '100%', border: '1px solid var(--line-soft)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {sheets.length > 1 && (
        <div style={{ display: 'flex', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--line-soft)', background: 'var(--surface-2)', flexShrink: 0 }}>
          {sheets.map((s, i) => (
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
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%', fontFamily: "'Geist Mono', monospace" }}>
          <tbody>
            {data.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                {row.map((cell, ci) => {
                  const Tag = ri === 0 ? 'th' : 'td';
                  return (
                    <Tag
                      key={ci}
                      style={{
                        padding: '4px 8px',
                        border: '1px solid var(--line-soft)',
                        color: ri === 0 ? 'var(--text)' : 'var(--text-dim)',
                        fontWeight: ri === 0 ? 600 : 400,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {String(cell)}
                    </Tag>
                  );
                })}
              </tr>
            ))}
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
  const pageMatch = urlDownload.match(/_page(\d+)$/);
  const pageNumber = pageMatch ? parseInt(pageMatch[1]) + 1 : 1;
  const pdfUrl = `${SERVER_URL}/${urlDownload.replace(/_page\d+$/, '')}.pdf`;

  useEffect(() => {
    setPdfData(null);
    fetch(pdfUrl)
      .then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
      .then(buf => setPdfData(buf))
      .catch(() => setPdfData('error'));
  }, [pdfUrl]);

  if (!pdfData) return <StatusBox>Cargando PDF…</StatusBox>;
  if (pdfData === 'error') return <StatusBox>No se pudo cargar el PDF.</StatusBox>;

  return (
    <div style={{ width: '100%', borderRadius: 6, overflow: 'auto', background: '#525659' }}>
      <Document file={pdfData}>
        <Page pageNumber={pageNumber} width={Math.floor(window.innerWidth * 0.78)} />
      </Document>
    </div>
  );
}

function FileViewer({ urlDownload }) {
  const [excelUrl, setExcelUrl] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setExcelUrl(null);
    setChecked(false);
    if (!urlDownload || isPdfDownload(urlDownload)) { setChecked(true); return; }
    resolveExcelUrl(urlDownload).then(url => {
      setExcelUrl(url ?? 'error');
      setChecked(true);
    });
  }, [urlDownload]);

  if (!urlDownload) return null;

  if (isPdfDownload(urlDownload)) return <PdfViewer urlDownload={urlDownload} />;

  if (!checked) return <StatusBox>Cargando…</StatusBox>;
  if (excelUrl === 'error') return <StatusBox>No se pudo cargar el archivo.</StatusBox>;
  return <ExcelViewer fileUrl={excelUrl} />;
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
              <div className="avatar-lg" style={{ background: `oklch(0.4 0.05 ${(employee.id.charCodeAt(1) * 37) % 360})` }}>
                {employee.initials}
              </div>
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
              <div className="detail-k">Salario</div>
              <div className="detail-v mono" style={{ color: accent }}>{fmtMoney(employee.salary)}</div>
            </div>
            <div className="detail">
              <div className="detail-k">Fecha</div>
              <div className="detail-v mono">{employee.startDate}</div>
            </div>
          </div>

          <div className="drawer-foot">
            <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
          </div>
        </div>

        {/* ── File viewer 80% ── */}
        <div className="drawer-file">
          {employee.urlDownload
            ? <FileViewer urlDownload={employee.urlDownload} />
            : <StatusBox>Sin archivo adjunto.</StatusBox>
          }
        </div>

      </div>
    </div>
  );
}
