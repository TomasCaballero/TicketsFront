import React, { useState, useEffect } from 'react';
import type { NotaSimpleDto, AdjuntoSimpleDto } from '../types/tickets';
import apiClient from '../services/apiClient'; 

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner'; 
import { ChatRightText, Clock, Person, Paperclip, Eye as EyeIcon, Download, XCircle } from 'react-bootstrap-icons';

interface ModalVerNotaProps {
  show: boolean;
  handleClose: () => void;
  nota: NotaSimpleDto | null;
}

const formatDate = (dateString?: string, includeTime = false): string => {
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

const ModalVerNota: React.FC<ModalVerNotaProps> = ({
  show,
  handleClose,
  nota,
}) => {
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!show) {
      setPreviewData(null);
      setPreviewType(null);
      setPreviewError(null);
    }
  }, [show]);

  const handlePreview = async (adjunto: AdjuntoSimpleDto) => {
    setPreviewData(null);
    setPreviewError(null);
    setIsLoadingPreview(true);
    setPreviewType(adjunto.tipoArchivo);

    try {
      const response = await apiClient.get(`/api/adjuntos/${adjunto.adjuntoID}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: adjunto.tipoArchivo });
      const objectUrl = URL.createObjectURL(blob);

      setPreviewData(objectUrl);

    } catch (err) {
      console.error("Error cargando previsualización:", err);
      setPreviewError("No se pudo cargar la previsualización del archivo.");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleClosePreview = () => {
    if (previewData) {
      URL.revokeObjectURL(previewData);
    }
    setPreviewData(null);
    setPreviewType(null);
    setPreviewError(null);
  };

  const handleModalClose = () => {
    handleClosePreview();
    handleClose();
  }
  
  const handleDownload = async (adjunto: AdjuntoSimpleDto) => {
    try {
      const response = await apiClient.get(`/api/adjuntos/${adjunto.adjuntoID}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', adjunto.nombreArchivo);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error al descargar el archivo:", error);
        alert("No se pudo descargar el archivo.");
    }
  };

  if (!nota) return null;

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
            <ChatRightText size={24} className="me-2" />
            Detalle de la Nota
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {previewType && (
            <div className="mb-4 p-3 border rounded bg-light">
                 <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Previsualización</h6>
                    <Button variant="light" size="sm" onClick={handleClosePreview}>
                        <XCircle className="me-1"/> Cerrar
                    </Button>
                 </div>

                {isLoadingPreview ? (
                  <div className="text-center p-5"><Spinner animation="border" variant="primary" /></div>
                ) : previewError ? (
                  <Alert variant="danger">{previewError}</Alert>
                ) : previewData ? (
                    previewType.startsWith('image/') ? (
                        <img src={previewData} alt="Previsualización" className="img-fluid" style={{ maxHeight: '50vh', display: 'block', margin: '0 auto' }}/>
                    ) : previewType === 'application/pdf' ? (
                        <iframe src={previewData} style={{ width: '100%', height: '60vh', border: 'none' }} title="Previsualización de PDF"></iframe>
                    ) : (
                        <Alert variant="info">La previsualización no está disponible para este tipo de archivo ({previewType}). Puede descargarlo.</Alert>
                    )
                ) : null}
            </div>
        )}

        <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
            <div>
                <p className="mb-1"><Person size={18} className="me-2 text-muted" /> <strong>Creador:</strong> {nota.usuarioCreador?.nombreCompleto || 'Desconocido'}</p>
                <p className="mb-0 text-muted"><Clock size={16} className="me-2" /> <strong>Fecha:</strong> {formatDate(nota.fechaCreacion, true)}</p>
            </div>
            <Badge bg={nota.tipoNota === 'Desarrollo' ? 'info' : 'secondary'} pill className="fs-6 px-3 py-2">
                {nota.tipoNota}
                {nota.tiempoDeTrabajo != null && ` (${nota.tiempoDeTrabajo} hs)`}
            </Badge>
        </div>

        <div className="mb-4">
            <h6 className="text-muted">Contenido</h6>
            <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{nota.contenido}</p>
        </div>

        {nota.adjuntos && nota.adjuntos.length > 0 && (
            <div>
                <h6 className="text-muted"><Paperclip className="me-1"/> Adjuntos ({nota.adjuntos.length})</h6>
                <ListGroup variant="flush">
                    {nota.adjuntos.map(adjunto => (
                         <ListGroup.Item key={adjunto.adjuntoID} className="px-0 py-2 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="fw-medium me-2">{adjunto.nombreArchivo}</span>
                                <span className="text-muted text-sm">({adjunto.tamanoArchivoKB.toFixed(2)} KB)</span>
                            </div>
                            <div>
                                <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handlePreview(adjunto)} title="Previsualizar">
                                    <EyeIcon size={16}/>
                                </Button>
                                <Button variant="outline-primary" size="sm" onClick={() => handleDownload(adjunto)} title="Descargar">
                                    <Download size={16}/>
                                </Button>
                            </div>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ModalVerNota;