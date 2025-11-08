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
  const imageRef = useRef(null);
  const [numPages, setNumPages] = useState(null);

  const monthName = monthNames[currentDate?.getMonth() ?? 0];
  const url = `${constants.urlData}/${institution}/nomina/postDownloads/${currentDate.getFullYear()}/${monthName}/_.${employee.index}.jpg`;

  useEffect(() => {
    if (lastUrl !== '') selectEmployee.current?.classList.add(positionSelectCss.selecteEmployeeOpacity);
    lastUrl = url;
  }, [url]);

  const handleSelectPosition = () => {
    positionSelect(selectEmployee, imageRef, employee);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const image = imageRef.current;
      if (!image?.complete) return;
      clearInterval(interval);
      handleSelectPosition();
    }, 500);

    return () => clearInterval(interval);
  }, [employee]);

  useEffect(() => {
    window.addEventListener('resize', handleSelectPosition);
    return () => {
      window.removeEventListener('resize', handleSelectPosition);
    };
  }, []);
      
  return (
    <>
      <div className={showImageCss.overflowImage}>
        <a href={`${employee.link}#page=${employee.index}`} target="_blank" rel="noopener noreferrer">
          VER FUENTE ORIGINAL
        </a>
        <a href={`${employee.link}#page=${employee.index}`} target="_blank" rel="noopener noreferrer">
          Pagina {employee.index}
        </a>
        <BrowserOnly>
          {() => (
            <div ref={imageRef}>
              <Document
                file={`${constants.urlData}/${employee.urlDownload}`}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
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
