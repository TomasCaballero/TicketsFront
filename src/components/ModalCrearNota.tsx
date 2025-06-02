// src/components/ModalCrearNota.tsx
import React, { useState, type FormEvent, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type{ CrearNotaSoporteDto, CrearNotaDesarrolloDto } from '../types/tickets'; 
import type { NotaSimpleDto } from '../types/tickets'; 

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

// El tipo de ticket del padre determinará el tipo de nota a crear
type TipoTicketPadre = 'Soporte' | 'Desarrollo';

interface ModalCrearNotaProps {
  show: boolean;
  handleClose: () => void;
  ticketId: string;
  tipoTicketPadre: TipoTicketPadre; // Nueva prop
  onNotaAgregada: (nuevaNota: NotaSimpleDto) => void;
}

const ModalCrearNota: React.FC<ModalCrearNotaProps> = ({ 
  show, 
  handleClose, 
  ticketId, 
  tipoTicketPadre, // Usar esta prop
  onNotaAgregada 
}) => {
  const { usuarioActual } = useAuth();
  // Ya no necesitamos estado para tipoNota, se deriva de tipoTicketPadre
  const [contenido, setContenido] = useState<string>('');
  const [tiempoDeTrabajo, setTiempoDeTrabajo] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setContenido('');
      setTiempoDeTrabajo('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!usuarioActual) {
      setError("No se pudo identificar al usuario creador. Por favor, inicie sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }

    if (!contenido.trim()) {
        setError("El contenido de la nota no puede estar vacío.");
        setIsSubmitting(false);
        return;
    }

    try {
      let nuevaNotaCreada: NotaSimpleDto | null = null;

      if (tipoTicketPadre === 'Soporte') {
        const data: CrearNotaSoporteDto = {
          contenido,
          tiempoDeTrabajo: tiempoDeTrabajo === '' ? undefined : parseFloat(tiempoDeTrabajo),
        };
        // El endpoint ahora es específico para notas de soporte en el backend
        const response = await apiClient.post<NotaSimpleDto>(`/api/tickets/${ticketId}/notas/soporte`, data);
        nuevaNotaCreada = response.data;
      } else { // tipoTicketPadre es 'Desarrollo'
        if (tiempoDeTrabajo === '' || parseFloat(tiempoDeTrabajo) <= 0) {
            setError("El tiempo de trabajo es obligatorio y debe ser positivo para notas de desarrollo.");
            setIsSubmitting(false);
            return;
        }
        const data: CrearNotaDesarrolloDto = {
          contenido,
          tiempoDeTrabajo: parseFloat(tiempoDeTrabajo),
        };
        // El endpoint ahora es específico para notas de desarrollo en el backend
        const response = await apiClient.post<NotaSimpleDto>(`/api/tickets/${ticketId}/notas/desarrollo`, data);
        nuevaNotaCreada = response.data;
      }

      if (nuevaNotaCreada) {
        onNotaAgregada(nuevaNotaCreada);
        handleClose(); 
      } else {
        // Esto podría ocurrir si el backend devuelve null debido a la restricción de tipo de ticket
        setError(`No se pudo crear la nota. Verifique que el tipo de nota sea compatible con el tipo de ticket (${tipoTicketPadre}).`);
      }

    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        const errorMessage = typeof apiError === 'string' 
          ? apiError
          : apiError.message || apiError.Message || (apiError.errors && JSON.stringify(apiError.errors)) || (apiError.Errors && apiError.Errors.map((e:any) => e.description || e).join(', ')) || 'Error al crear la nota.';
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al crear nota:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>Añadir Nueva Nota ({tipoTicketPadre})</Modal.Title> {/* Mostrar el tipo de nota que se creará */}
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          {/* Ya no se necesita el selector de Tipo de Nota */}
          {/* <Form.Group className="mb-3" controlId="tipoNotaControl"> ... </Form.Group> */}

          <Form.Group className="mb-3" controlId="contenidoNotaControl">
            <Form.Label>Contenido *</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Escribe tu nota aquí..."
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </Form.Group>

          {/* El campo TiempoDeTrabajo ahora depende de tipoTicketPadre */}
          {tipoTicketPadre === 'Desarrollo' && (
            <Form.Group className="mb-3" controlId="tiempoTrabajoDesarrolloControl">
              <Form.Label>Tiempo de Trabajo (Horas) *</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ej: 2.5"
                value={tiempoDeTrabajo}
                onChange={(e) => setTiempoDeTrabajo(e.target.value)}
                step="0.1"
                min="0.01" 
                required 
                disabled={isSubmitting}
              />
              <Form.Text className="text-muted">
                Obligatorio y debe ser positivo para notas de desarrollo.
              </Form.Text>
            </Form.Group>
          )}

          {tipoTicketPadre === 'Soporte' && (
            <Form.Group className="mb-3" controlId="tiempoTrabajoSoporteControl">
              <Form.Label>Tiempo de Trabajo (Horas) (Opcional)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ej: 1.0"
                value={tiempoDeTrabajo}
                onChange={(e) => setTiempoDeTrabajo(e.target.value)}
                step="0.1"
                min="0"
                disabled={isSubmitting}
              />
            </Form.Group>
          )}

          <div className="d-flex justify-content-end mt-4">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Guardando...
                </>
              ) : (
                'Guardar Nota'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalCrearNota;
