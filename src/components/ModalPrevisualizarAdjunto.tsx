// src/components/ModalPrevisualizarAdjunto.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { AdjuntoSimpleDto } from '../types/tickets';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Download, FileEarmarkText, FileEarmarkZip, FileEarmarkPlay, FileEarmarkMusic, Paperclip } from 'react-bootstrap-icons';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; 
import 'react-pdf/dist/esm/Page/TextLayer.css'; 

// SOLUCIÓN 1: Configurar worker con CDN (más confiable)
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// SOLUCIÓN 2: Para proyectos con Vite, descomenta estas líneas y comenta la línea de arriba
// pdfjs.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.js',
//   import.meta.url,
// ).toString();

// SOLUCIÓN 3: Para proyectos con Webpack, descomenta esta línea y comenta las otras
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

interface ModalPrevisualizarAdjuntoProps {
  show: boolean;
  handleClose: () => void;
  adjunto: AdjuntoSimpleDto | null;
}

const ModalPrevisualizarAdjunto: React.FC<ModalPrevisualizarAdjuntoProps> = ({
  show,
  handleClose,
  adjunto,
}) => {
  const [filePreviewData, setFilePreviewData] = useState<string | null>(null); 
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'other'>('other');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [numPdfPages, setNumPdfPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    let objectUrl: string | undefined = undefined;

    const loadPreview = async () => {
      if (show && adjunto) {
        setDownloadError(null);
        setPreviewError(null);
        setFileType('other');
        setFilePreviewData(null);
        setNumPdfPages(null);
        setCurrentPage(1);

        setIsLoadingPreview(true);
        try {
          const response = await apiClient.get(`/api/adjuntos/${adjunto.adjuntoID}`, {
            responseType: 'blob',
          });
          
          const blob = new Blob([response.data], { type: adjunto.tipoArchivo });
          objectUrl = window.URL.createObjectURL(blob);

          if (adjunto.tipoArchivo && adjunto.tipoArchivo.startsWith('image/')) {
            setFileType('image');
            setFilePreviewData(objectUrl); 
          } else if (adjunto.tipoArchivo === 'application/pdf') {
            setFileType('pdf');
            setFilePreviewData(objectUrl); 
          } else {
            setFileType('other');
          }
        } catch (err) {
          console.error("Error cargando previsualización:", err);
          setPreviewError("No se pudo cargar la previsualización del archivo.");
        } finally {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPreview();

    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [show, adjunto]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPdfPages(numPages);
    setPreviewError(null); // Limpiar errores previos si se carga exitosamente
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error cargando PDF Document:', error);
    setPreviewError(`Error al cargar el PDF: ${error.message}`);
  };

  const handleDownload = async () => {
    if (!adjunto) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const response = await apiClient.get(`/api/adjuntos/${adjunto.adjuntoID}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: adjunto.tipoArchivo }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', adjunto.nombreArchivo || 'descarga');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al descargar adjunto desde modal:', err);
      setDownloadError(err.response?.data?.message || err.message || 'Error al descargar el archivo.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getFileIcon = () => {
    if (!adjunto || !adjunto.tipoArchivo) return <FileEarmarkText size={80} className="text-muted" />;
    if (adjunto.tipoArchivo.includes('zip') || adjunto.tipoArchivo.includes('compressed')) return <FileEarmarkZip size={80} className="text-warning" />;
    if (adjunto.tipoArchivo.startsWith('audio/')) return <FileEarmarkMusic size={80} className="text-info" />;
    if (adjunto.tipoArchivo.startsWith('video/')) return <FileEarmarkPlay size={80} className="text-success" />;
    return <FileEarmarkText size={80} className="text-muted" />;
  };

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, numPdfPages || 1));
  };

  if (!adjunto) return null;

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <Paperclip size={24} className="me-2" />
          {adjunto.nombreArchivo}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {previewError && <Alert variant="warning">{previewError}</Alert>}
        {downloadError && <Alert variant="danger">{downloadError}</Alert>}
        
        <div className="text-center mb-3 border p-2 rounded bg-light" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoadingPreview ? (
            <Spinner animation="border" variant="primary" />
          ) : fileType === 'image' && filePreviewData ? (
            <Image 
              src={filePreviewData} 
              alt={`Previsualización de ${adjunto.nombreArchivo}`} 
              fluid 
              style={{ maxHeight: '50vh', maxWidth: '100%' }} 
            />
          ) : fileType === 'pdf' && filePreviewData ? (
            <div style={{ width: '100%' }}>
              <Document
                file={filePreviewData} 
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="text-center p-3">
                    <Spinner animation="border" variant="secondary" />
                    <p className="mt-2">Cargando PDF...</p>
                  </div>
                }
                error={
                  <Alert variant="danger">
                    No se pudo cargar el PDF. Intente descargar el archivo para verlo.
                  </Alert>
                }
                options={{
                  cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                }}
              >
                <div style={{ maxHeight: '50vh', overflowY: 'auto', padding: '10px' }}>
                  <Page 
                    pageNumber={currentPage} 
                    width={Math.min(500, window.innerWidth - 100)}
                    renderAnnotationLayer={false} 
                    renderTextLayer={false}
                    onRenderError={(error) => {
                      console.error("Error renderizando página del PDF:", error);
                      setPreviewError("Error al renderizar la página del PDF");
                    }}
                  />
                </div>
              </Document>
              
              {numPdfPages && numPdfPages > 1 && (
                <div className="d-flex justify-content-center align-items-center mt-3 gap-3">
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={goToPrevPage}
                    disabled={currentPage <= 1}
                  >
                    ‹ Anterior
                  </Button>
                  <span className="text-muted">
                    Página {currentPage} de {numPdfPages}
                  </span>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    onClick={goToNextPage}
                    disabled={currentPage >= numPdfPages}
                  >
                    Siguiente ›
                  </Button>
                </div>
              )}
              
              {numPdfPages === 1 && (
                <p className="text-muted text-center mt-2">Página 1 de 1</p>
              )}
            </div>
          ) : (
            <div className="my-4">{getFileIcon()}</div>
          )}
        </div>

        <div className="mt-3">
          <p><strong>Tipo:</strong> {adjunto.tipoArchivo}</p>
          <p><strong>Tamaño:</strong> {adjunto.tamanoArchivoKB.toFixed(2)} KB</p>
          <p><strong>Subido:</strong> {formatDate(adjunto.fechaCarga, true)} por {adjunto.usuarioCargador?.nombreCompleto || 'N/A'}</p>
          {adjunto.descripcion && (
            <p><strong>Descripción:</strong> {adjunto.descripcion}</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={handleClose} disabled={isDownloading}>
          Cerrar
        </Button>
        <Button variant="primary" onClick={handleDownload} disabled={isDownloading || isLoadingPreview}>
          {isDownloading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
              Descargando...
            </>
          ) : (
            <>
              <Download size={18} className="me-1" /> Descargar
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const formatDate = (dateString?: string | null, includeTime = false): string => {
    if (!dateString) return 'N/A';
    try {
        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric', month: '2-digit', day: '2-digit'
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        return new Date(dateString).toLocaleString('es-AR', options);
    } catch (e) {
        return dateString; 
    }
};

export default ModalPrevisualizarAdjunto;