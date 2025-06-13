import React, { useState, type FormEvent, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import type { NotaSimpleDto } from '../types/tickets';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';
import Image from 'react-bootstrap/Image';
import { Trash3, PlusCircle } from 'react-bootstrap-icons';
import { Editor } from '@tinymce/tinymce-react';
import RichTextEditor from './editor/RichTextEditor';

interface ModalCrearNotaProps {
  show: boolean;
  handleClose: () => void;
  ticketId: string;
  tipoTicketPadre: 'Soporte' | 'Desarrollo';
  onNotaAgregada: (nuevaNota: NotaSimpleDto) => void;
}

interface ArchivoLocal {
  id: string;
  file: File;
  previewUrl?: string;
}

const ModalCrearNota: React.FC<ModalCrearNotaProps> = ({
  show,
  handleClose,
  ticketId,
  tipoTicketPadre,
  onNotaAgregada
}) => {
  const [contenido, setContenido] = useState('');
  const [tiempoDeTrabajo, setTiempoDeTrabajo] = useState('');
  const [archivos, setArchivos] = useState<ArchivoLocal[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setContenido('');
    setTiempoDeTrabajo('');
    archivos.forEach(a => {
      if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    });
    setArchivos([]);
    setError(null);
  };

  const handleModalClose = () => {
    resetForm();
    handleClose();
  };

  useEffect(() => {
    return () => {
      archivos.forEach(a => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, [archivos]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const nuevosArchivos = Array.from(event.target.files).map(file => {
        const newFile: ArchivoLocal = {
          id: `${file.name}-${file.lastModified}-${Math.random()}`,
          file: file,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
        };
        return newFile;
      });
      setArchivos(prev => [...prev, ...nuevosArchivos]);
    }
  };

  const handleRemoveFile = (idToRemove: string) => {
    setArchivos(prev => {
      const archivoAEliminar = prev.find(a => a.id === idToRemove);
      if (archivoAEliminar?.previewUrl) {
        URL.revokeObjectURL(archivoAEliminar.previewUrl);
      }
      return prev.filter(a => a.id !== idToRemove);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!contenido.trim()) {
      setError("El contenido de la nota es obligatorio.");
      return;
    }
    if (tipoTicketPadre === 'Desarrollo' && (!tiempoDeTrabajo || parseFloat(tiempoDeTrabajo) <= 0)) {
      setError("Para notas de desarrollo, el tiempo de trabajo debe ser un número positivo.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const notaData = {
      contenido,
      tiempoDeTrabajo: tiempoDeTrabajo ? parseFloat(tiempoDeTrabajo) : undefined,
      tipoNota: tipoTicketPadre,
    };

    const formData = new FormData();
    formData.append('notaData', JSON.stringify(notaData));

    if (archivos.length > 0) {
      archivos.forEach(archivoLocal => {
        formData.append('archivos', archivoLocal.file);
      });
    }

    try {
      const response = await apiClient.post<NotaSimpleDto>(`/api/tickets/${ticketId}/notas-con-adjuntos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onNotaAgregada(response.data);
      handleModalClose();
    } catch (err: any) {
      const apiError = err.response?.data;
      const errorMessage = apiError?.message || apiError?.title || "Error al crear la nota.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Añadir Nueva Nota de {tipoTicketPadre}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Contenido de la Nota *</Form.Label>
            
            <RichTextEditor
              content={contenido}
              onChange={(newContent) => setContenido(newContent)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Tiempo de Trabajo (Horas)
              {tipoTicketPadre === 'Desarrollo' ? ' *' : ' (Opcional)'}
            </Form.Label>
            <Form.Control
              type="number"
              step="0.1"
              min="0"
              value={tiempoDeTrabajo}
              onChange={(e) => setTiempoDeTrabajo(e.target.value)}
              placeholder="Ej: 1.5"
              required={tipoTicketPadre === 'Desarrollo'}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Adjuntos</Form.Label>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              className="d-none"
            />
            <Button variant="outline-secondary" onClick={() => fileInputRef.current?.click()} className="w-100">
              <PlusCircle className="me-2" />
              Seleccionar archivos...
            </Button>
          </Form.Group>

          {archivos.length > 0 && (
            <ListGroup>
              {archivos.map((archivo) => (
                <ListGroup.Item key={archivo.id} className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    {archivo.previewUrl && (
                      <Image src={archivo.previewUrl} style={{ width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px' }} thumbnail />
                    )}
                    <span className="text-truncate" style={{ maxWidth: '300px' }}>{archivo.file.name}</span>
                    <span className="text-muted ms-2">({(archivo.file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button variant="outline-danger" size="sm" onClick={() => handleRemoveFile(archivo.id)}>
                    <Trash3 />
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> Guardando...</>
            ) : ('Guardar Nota')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCrearNota;