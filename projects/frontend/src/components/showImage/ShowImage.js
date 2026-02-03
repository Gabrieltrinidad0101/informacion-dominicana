import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import showImageCss from './ShowImage.module.css';
import { positionSelect } from '../../utils/positionSelect';
import positionSelectCss from '../../utils/positionSelect.module.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
import constants from '../../constants';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export function ShowImage({ employee, currentDate }) {
  const selectEmployee = useRef(null);
  const pdfRef = useRef(null);
  const linksRef = useRef(null);
  const [numPages, setNumPages] = useState(null);
  const [pageDimension, setPageDimension] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    selectEmployee.current?.classList.add(positionSelectCss.selecteEmployeeOpacity);
  }, [employee]);

  const handleSelectPosition = (pageWidth, pageHeight) => {
    positionSelect({ selectEmployee, pdfRef, employee, pageWidth: pageWidth ?? pageDimension.width, pageHeight: pageHeight ?? pageDimension.height });
  };


  useEffect(() => {
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
          <a href={`${employee.link}#page=${employee.index}`} target="_blank" rel="noopener noreferrer">
            VER FUENTE ORIGINAL 📌
          </a>
          <a href={`${employee.link}#page=${employee.index}`} target="_blank" rel="noopener noreferrer">
            Pagina {employee.index}
          </a>
        </div>

        <BrowserOnly>
          {() => (
            <div ref={pdfRef}>
              <Document
                file={`${constants.urlData}/${employee.urlDownload}`}
                onLoadSuccess={({ numPages }) => {
                  setNumPages(numPages);
                }}
              >
                <Page
                  pageNumber={employee.index}
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
            </div>
          )}
        </BrowserOnly>
      </div>

      <div className={positionSelectCss.selecteEmployee} ref={selectEmployee}></div>
    </>
  );
}
