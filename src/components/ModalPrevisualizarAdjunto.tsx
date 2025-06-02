// src/components/ModalPrevisualizarAdjunto.tsx
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import type { AdjuntoSimpleDto } from '../types/tickets';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import { Download, FileEarmarkText, FileEarmarkImage, FileEarmarkZip, FileEarmarkPdf, FileEarmarkPlay, FileEarmarkMusic, Paperclip } from 'react-bootstrap-icons';

// Importaciones para react-pdf
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'; // Estilos necesarios para las anotaciones
import 'react-pdf/dist/esm/Page/TextLayer.css'; // Estilos necesarios para la capa de texto

// Configurar el worker de pdf.js (puedes mover esto a tu main.tsx o App.tsx para configurarlo globalmente)
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  const [filePreviewData, setFilePreviewData] = useState<string | File | null>(null); // Puede ser URL (imagen) o File (PDF)
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'other'>('other');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [numPdfPages, setNumPdfPages] = useState<number | null>(null);


  useEffect(() => {
    let objectUrl: string | undefined = undefined;

    const loadPreview = async () => {
      if (show && adjunto) {
        setDownloadError(null);
        setPreviewError(null);
        setFileType('other');
        setFilePreviewData(null);
        setNumPdfPages(null);

        setIsLoadingPreview(true);
        try {
          const response = await apiClient.get(`/api/adjuntos/${adjunto.adjuntoID}`, {
            responseType: 'blob',
          });
          const blob = new Blob([response.data], { type: adjunto.tipoArchivo });
          objectUrl = window.URL.createObjectURL(blob);

          if (adjunto.tipoArchivo && adjunto.tipoArchivo.startsWith('image/')) {
            setFileType('image');
            setFilePreviewData(objectUrl); // Usar ObjectURL para src de <img>
          } else if (adjunto.tipoArchivo === 'application/pdf') {
            setFileType('pdf');
            setFilePreviewData(objectUrl); // Usar ObjectURL para react-pdf
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

    // Limpiar el ObjectURL cuando el modal se cierra o el adjunto cambia
    return () => {
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [show, adjunto]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPdfPages(numPages);
  };

  const handleDownload = async () => {
    if (!adjunto) return;
    setIsDownloading(true);
    setDownloadError(null);
    try {
      // filePreviewData ya es el ObjectURL del blob si se cargó para previsualización
      // Si no, lo obtenemos de nuevo. Para simplificar, lo obtenemos siempre aquí.
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
    // No necesitamos el chequeo de imagen/pdf aquí ya que se maneja por fileType
    if (adjunto.tipoArchivo.includes('zip') || adjunto.tipoArchivo.includes('compressed')) return <FileEarmarkZip size={80} className="text-warning" />;
    if (adjunto.tipoArchivo.startsWith('audio/')) return <FileEarmarkMusic size={80} className="text-info" />;
    if (adjunto.tipoArchivo.startsWith('video/')) return <FileEarmarkPlay size={80} className="text-success" />;
    return <FileEarmarkText size={80} className="text-muted" />;
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
            <Image src={filePreviewData as string} alt={`Previsualización de ${adjunto.nombreArchivo}`} fluid style={{ maxHeight: '50vh', maxWidth: '100%' }} />
          ) : fileType === 'pdf' && filePreviewData ? (
            <div style={{ width: '100%', height: '50vh', overflowY: 'auto' }}>
              <Document
                file={filePreviewData} // Puede ser URL, File object, o datos base64
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('Error cargando PDF Document:', error);
                  setPreviewError(`Error al cargar el PDF: ${error.message}`);
                }}
                loading={<Spinner animation="border" variant="secondary" />}
                error={<Alert variant="danger">No se pudo cargar el PDF.</Alert>}
              >
                <Page 
                    pageNumber={1} 
                    width={500} // Puedes ajustar el ancho o hacerlo responsivo
                    renderAnnotationLayer={true} // Para anotaciones
                    renderTextLayer={true} // Para selección de texto
                    onRenderError={() => console.error("Error renderizando página del PDF")}
                />
              </Document>
              {numPdfPages && <p className="text-muted text-center mt-2">Página 1 de {numPdfPages}</p>}
            </div>
          ) : (
            <div className="my-4">{getFileIcon()}</div>
          )}
        </div>

        <p><strong>Tipo:</strong> {adjunto.tipoArchivo}</p>
        <p><strong>Tamaño:</strong> {adjunto.tamanoArchivoKB.toFixed(2)} KB</p>
        <p><strong>Subido:</strong> {formatDate(adjunto.fechaCarga, true)} por {adjunto.usuarioCargador?.nombreCompleto || 'N/A'}</p>
        {adjunto.descripcion && (
          <p><strong>Descripción:</strong> {adjunto.descripcion}</p>
        )}
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
