import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export function PdfViewer({ url }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [loading, setLoading] = useState(true);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
        setLoading(false);
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Button
                    variant="contained"
                    disabled={pageNumber <= 1}
                    onClick={previousPage}
                >
                    Previous
                </Button>
                <Typography>
                    Page {pageNumber || (numPages ? 1 : '--')} of {numPages || '--'}
                </Typography>
                <Button
                    variant="contained"
                    disabled={pageNumber >= numPages}
                    onClick={nextPage}
                >
                    Next
                </Button>
            </Box>

            <Box sx={{ border: '1px solid #ccc', minHeight: '500px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', overflow: 'auto' }}>
                {loading && <CircularProgress />}
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={(error) => {
                        console.error('Error loading PDF:', error);
                        setLoading(false);
                    }}
                    loading={<CircularProgress />}
                >
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        width={800}
                    />
                </Document>
            </Box>
        </Box>
    );
}
