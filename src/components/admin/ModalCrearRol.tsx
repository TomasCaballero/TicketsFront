import React, { useState, type FormEvent, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import type { RolDto } from '../../types/roles';
import type { CrearRolDto } from '../../types/roles'; 

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

interface ModalCrearRolProps {
  show: boolean;
  handleClose: () => void;
  onRolCreado: (nuevoRol: RolDto) => void;
}

const ModalCrearRol: React.FC<ModalCrearRolProps> = ({ show, handleClose, onRolCreado }) => {
  const [nombreRol, setNombreRol] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setNombreRol('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nombreRol.trim()) {
      setError('El nombre del rol no puede estar vacío.');
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const rolParaCrear: CrearRolDto = { nombreRol: nombreRol.trim() };

    try {
      const response = await apiClient.post<RolDto>('/api/roles', rolParaCrear); 
      
      onRolCreado(response.data); 
      
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        const errorMessage = typeof apiError === 'string' 
          ? apiError
          : apiError.message || apiError.Message || (apiError.errors && JSON.stringify(apiError.errors)) || (apiError.Errors && apiError.Errors.map((e:any) => e.description || e).join(', ')) || 'Error al crear el rol.';
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al crear rol:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Rol</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="nombreRolControl">
            <Form.Label>Nombre del Rol *</Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: EditorDeContenido"
              value={nombreRol}
              onChange={(e) => setNombreRol(e.target.value)}
              required
              disabled={isSubmitting}
              autoFocus
            />
            <Form.Text className="text-muted">
              El nombre del rol debe ser único. No uses espacios ni caracteres especiales.
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || !nombreRol.trim()}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Creando...
                </>
              ) : (
                'Crear Rol'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalCrearRol;