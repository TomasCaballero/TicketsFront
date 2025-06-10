// src/components/ModalSubirAdjunto.tsx
import React, { useState, type FormEvent, useEffect, type ChangeEvent } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext'; 
import type { AdjuntoSimpleDto } from '../types/tickets'; 

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Image from 'react-bootstrap/Image'; 
import { Col, Row } from 'react-bootstrap';

interface ModalSubirAdjuntoProps {
  show: boolean;
  handleClose: () => void;
  ticketId?: string; 
  notaId?: string;   
  onAdjuntoAgregado: (nuevoAdjunto: AdjuntoSimpleDto) => void;
}

const ModalSubirAdjunto: React.FC<ModalSubirAdjuntoProps> = ({
  show,
  handleClose,
  ticketId,
  notaId,
  onAdjuntoAgregado,
}) => {
  const { usuarioActual } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setSelectedFile(null);
      setDescripcion(''); 
      setPreviewUrl(null); 
      setError(null);
      setIsSubmitting(false);
    }
  }, [show]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null); 
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo para subir.');
      return;
    }
    if (!usuarioActual) {
      setError("No se pudo identificar al usuario. Por favor, inicie sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }
    if (!ticketId && !notaId) {
        setError("Se requiere un ID de Ticket o ID de Nota para asociar el adjunto.");
        setIsSubmitting(false);
        return;
    }

    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('archivo', selectedFile); 
    if (descripcion.trim() !== '') {
        formData.append('descripcion', descripcion.trim());
    }
    
    let uploadUrl = '';
    if (ticketId) { 
      uploadUrl = `/api/tickets/${ticketId}/adjuntos`;
    } else if (notaId) {
      if (ticketId) { 
          uploadUrl = `/api/tickets/${ticketId}/notas/${notaId}/adjuntos`;
      } else {
           setError("Para adjuntar a una nota, se requiere el ID del ticket padre en la URL.");
           setIsSubmitting(false);
           return;
      }
    } else {
        setError("No se especificó un destino para el adjunto (ni ticketId ni notaId).");
        setIsSubmitting(false);
        return;
    }

    try {
      const response = await apiClient.post<AdjuntoSimpleDto>(uploadUrl, formData);
      onAdjuntoAgregado(response.data);
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        const errorMessage = typeof apiError === 'string' 
          ? apiError
          : apiError.message || apiError.Message || (apiError.title && typeof apiError.title === 'string' ? apiError.title : 'Error al subir el adjunto.');
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al subir adjunto:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered size="lg"> 
      <Modal.Header closeButton>
        <Modal.Title>
            Subir Nuevo Adjunto {ticketId && !notaId ? `al Ticket` : (notaId ? `a la Nota` : '')}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={previewUrl ? 7 : 12}>
              <Form.Group controlId="formFile" className="mb-3">
                <Form.Label>Seleccionar archivo *</Form.Label>
                <Form.Control 
                  type="file" 
                  onChange={handleFileChange} 
                  disabled={isSubmitting}
                  required 
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" 
                />
                {selectedFile && <Form.Text className="text-muted mt-1 d-block">Archivo seleccionado: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</Form.Text>}
              </Form.Group>

              <Form.Group className="mb-3" controlId="formFileDescription">
                <Form.Label>Descripción (Opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={previewUrl ? 2 : 4}
                  placeholder="Añade una breve descripción del archivo..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={isSubmitting}
                />
              </Form.Group>
            </Col>
            {previewUrl && (
              <Col md={5}>
                <div className="text-center">
                  <p className="text-muted mb-1">Previsualización:</p>
                  <Image src={previewUrl} alt="Previsualización" thumbnail fluid style={{ maxHeight: '200px' }} />
                </div>
              </Col>
            )}
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || !selectedFile}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Subiendo...
                </>
              ) : (
                'Subir Adjunto'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalSubirAdjunto;
