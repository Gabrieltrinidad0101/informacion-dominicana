import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import showImageCss from './ShowImage.module.css';
import { positionSelect } from '../../utils/positionSelect';
import positionSelectCss from '../../utils/positionSelect.module.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import BrowserOnly from '@docusaurus/BrowserOnly';
import constants from '../../constants';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

let lastUrl = '';

const monthNames = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export function ShowImage({ employee, institution, currentDate }) {
  const selectEmployee = useRef(null);
  const pdfRef = useRef(null);
  const linksRef = useRef(null);
  const [numPages, setNumPages] = useState(null);

  const monthName = monthNames[currentDate?.getMonth() ?? 0];
  const url = `${constants.urlData}/${institution}/nomina/postDownloads/${currentDate.getFullYear()}/${monthName}/_.${employee.index}.jpg`;

  useEffect(() => {
    if (lastUrl !== '') selectEmployee.current?.classList.add(positionSelectCss.selecteEmployeeOpacity);
    lastUrl = url;
  }, [url]);

  const handleSelectPosition = () => {
    const offsetY = linksRef.current.getBoundingClientRect().height;
    positionSelect({selectEmployee, pdfRef, employee,offsetY});
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if(!numPages) return;
      clearInterval(interval);
      handleSelectPosition();
    }, 500);
  }, [employee]);

  useEffect(() => {
    const interval = setInterval(() => {
      if(!numPages) return;
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
                onLoadSuccess={(data) =>{ setNumPages(data._pdfInfo.numPages);}}
              >
                <Page pageNumber={employee.index} width={800} />
              </Document>
            </div>
          )}
        </BrowserOnly>
      </div>

      <div className={positionSelectCss.selecteEmployee} ref={selectEmployee}></div>
    </>
  );
}
