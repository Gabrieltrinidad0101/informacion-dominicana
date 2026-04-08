import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as XLSX from 'xlsx';
import showImageCss from './ShowImage.module.css';
import { positionSelect } from '../../utils/positionSelect';
import positionSelectCss from '../../utils/positionSelect.module.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
import constants from '../../constants';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb', '.csv'];

function isExcelFile(link) {
  if (!link) return false;
  const lower = link.toLowerCase();
  return EXCEL_EXTENSIONS.some(ext => lower.endsWith(ext));
}

function ExcelViewer({ fileUrl }) {
  const [sheets, setSheets] = useState([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(fileUrl)
      .then(res => {
        if (!res.ok) throw new Error(`Error al cargar el archivo (${res.status})`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const parsed = workbook.SheetNames.map(name => ({
          name,
          data: XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1, defval: '' }),
        }));
        setSheets(parsed);
        setActiveSheet(0);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [fileUrl]);

  if (loading) return <div className={showImageCss.excelStatus}>Cargando archivo Excel...</div>;
  if (error) return <div className={showImageCss.excelStatus}>Error: {error}</div>;
  if (!sheets.length) return <div className={showImageCss.excelStatus}>Archivo vacío.</div>;

  const { data } = sheets[activeSheet];

  return (
    <div className={showImageCss.excelContainer}>
      {sheets.length > 1 && (
        <div className={showImageCss.sheetTabs}>
          {sheets.map((s, i) => (
            <button
              key={s.name}
              className={`${showImageCss.sheetTab} ${i === activeSheet ? showImageCss.sheetTabActive : ''}`}
              onClick={() => setActiveSheet(i)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className={showImageCss.excelTableWrapper}>
        <table className={showImageCss.excelTable}>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((cell, colIdx) => (
                  rowIdx === 0
                    ? <th key={colIdx}>{String(cell)}</th>
                    : <td key={colIdx}>{String(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ShowImage({ employee, internalLink }) {
  const selectEmployee = useRef(null);
  const pdfRef = useRef(null);
  const linksRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageDimension, setPageDimension] = useState({
    width: 0,
    height: 0,
  });

  const fileLink = internalLink ?? employee.internalLink;
  const isExcel = isExcelFile(fileLink);

  useEffect(() => {
    selectEmployee.current?.classList.add(positionSelectCss.selecteEmployeeOpacity);
  }, [employee]);

  const handleSelectPosition = (pageWidth, pageHeight) => {
    positionSelect({ selectEmployee, pdfRef, employee, pageWidth: pageWidth ?? pageDimension.width, pageHeight: pageHeight ?? pageDimension.height });
  };

  useEffect(() => {
    if (isExcel) return;
    const interval = setInterval(() => {
      if (!numPages) return;
      clearInterval(interval);
      handleSelectPosition();
    }, 500);
    window.addEventListener('resize', handleSelectPosition);
    return () => {
      window.removeEventListener('resize', handleSelectPosition);
    };
  }, []);

  return (
    <>
      <div className={showImageCss.overflowImage}>
        <div className={showImageCss.links} ref={linksRef}>
          <a href={employee.link} target="_blank" rel="noopener noreferrer">
            VER FUENTE ORIGINAL 📌
          </a>
          {!isExcel && (
            <a href={`${employee.link}#page=${employee.index}`} target="_blank" rel="noopener noreferrer">
              Pagina {employee.index + 1}
            </a>
          )}
        </div>
        <BrowserOnly>
          {() =>
            isExcel ? (
              <ExcelViewer fileUrl={`${constants.urlData}/${fileLink}`} />
            ) : (
              <div ref={pdfRef} className={showImageCss.pdfContainer}>
                <Document
                  file={`${constants.urlData}/${fileLink}`}
                  onLoadSuccess={({ numPages }) => {
                    setNumPages(numPages);
                  }}
                >
                  <Page
                    pageNumber={employee.index + 1}
                    width={800}
                    onLoadSuccess={(page) => {
                      const viewport = page.getViewport({ scale: 1 });
                      setPageDimension({
                        width: viewport.width,
                        height: viewport.height,
                      });
                      handleSelectPosition(viewport.width, viewport.height);
                    }}
                  />
                </Document>
                <div className={positionSelectCss.selecteEmployee} ref={selectEmployee}></div>
              </div>
            )
          }
        </BrowserOnly>
      </div>
    </>
  );
}
