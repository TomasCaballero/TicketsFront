import React, { useState, useEffect, type FormEvent } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import RichTextEditor from './editor/RichTextEditor';
import apiClient from '../services/apiClient';
import type { NotaSimpleDto, ActualizarNotaSoporteDto, ActualizarNotaDesarrolloDto } from '../types/tickets';

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  onSuccess: () => void;
  notaAEditar: NotaSimpleDto | null;
  ticketId: string;
}

const ModalEditarNota: React.FC<ModalProps> = ({ show, handleClose, onSuccess, notaAEditar, ticketId }) => {
  const [contenido, setContenido] = useState('');
  const [tiempoDeTrabajo, setTiempoDeTrabajo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && notaAEditar) {
      setContenido(notaAEditar.contenido);
      setTiempoDeTrabajo(notaAEditar.tiempoDeTrabajo?.toString() || '');
      setError(null);
    }
  }, [show, notaAEditar]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!notaAEditar) return;
    setIsSubmitting(true);
    setError(null);

    // --- LÓGICA DE PAYLOAD CORREGIDA ---
    const payload: Partial<ActualizarNotaSoporteDto & ActualizarNotaDesarrolloDto> = {
        contenido: contenido,
    };
    
    // Solo añadimos tiempoDeTrabajo si el campo tiene un valor, para evitar enviar 0 o NaN
    if (tiempoDeTrabajo && !isNaN(parseFloat(tiempoDeTrabajo))) {
        payload.tiempoDeTrabajo = parseFloat(tiempoDeTrabajo);
    }

    const url = `/api/tickets/${ticketId}/notas/${notaAEditar.tipoNota.toLowerCase()}/${notaAEditar.notaID}`;
    
    try {
        await apiClient.put(url, payload);
        onSuccess();
        handleClose();
    } catch (err: any) {
        setError(err.response?.data?.message || 'Error al actualizar la nota.');
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton><Modal.Title>Editar Nota</Modal.Title></Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Contenido</Form.Label>
            <RichTextEditor
              content={contenido}
              onChange={(newContent) => setContenido(newContent)}
            />
          </Form.Group>
          {notaAEditar?.tipoNota !== 'General' && (
            <Form.Group className="mb-3">
                <Form.Label>Tiempo de Trabajo (Horas)</Form.Label>
                <Form.Control type="number" step="0.1" min="0" value={tiempoDeTrabajo} onChange={(e) => setTiempoDeTrabajo(e.target.value)} />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Guardar Cambios'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};
export default ModalEditarNota;