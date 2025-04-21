import React from "react";
import { Chats } from "../../components/chats/Chats";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { useState } from 'react';

// Configure the PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs`;

export function Economia() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfFile, setPdfFile] = useState(null);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset) {
    setPageNumber(prevPageNumber => prevPageNumber + offset);
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function onFileChange(event) {
    const file = event.target.files[0];
    if (file) {
      setPdfFile(URL.createObjectURL(file));
      setPageNumber(1);
    }
  }

  return (
    <div className="pdf-viewer">
      <div className="pdf-controls">
        <input type="file" onChange={onFileChange} accept=".pdf" />
        
        {pdfFile && (
          <>
            <button 
              type="button" 
              disabled={pageNumber <= 1} 
              onClick={previousPage}
            >
              Previous
            </button>
            <span>
              Page {pageNumber} of {numPages || '--'}
            </span>
            <button
              type="button"
              disabled={pageNumber >= numPages}
              onClick={nextPage}
            >
              Next
            </button>
          </>
        )}
      </div>

      <div className="pdf-container">
        {pdfFile && (
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            loading="Loading PDF..."
            error="Failed to load PDF."
          >
            <Page 
              pageNumber={pageNumber} 
              width={600}
              loading="Loading page..."
              error="Failed to load page."
            />
          </Document>
        )}
      </div>
    </div>
  );
}
