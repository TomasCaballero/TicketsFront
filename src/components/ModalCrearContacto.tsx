// src/components/ModalCrearContacto.tsx
import React, { useState, type FormEvent } from 'react';
import apiClient from '../services/apiClient';
import type { 
    ContactoParaClienteDto,
    CrearContactoParaClienteDto,
} from '../types/clientes';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

interface ModalCrearContactoProps {
  show: boolean;
  handleClose: () => void;
  clienteId: string; 
  clienteNombre: string; 
  onContactoCreado: (nuevoContacto: ContactoParaClienteDto) => void;
}

const ModalCrearContacto: React.FC<ModalCrearContactoProps> = ({ 
  show, 
  handleClose, 
  clienteId,
  clienteNombre,
  onContactoCreado
}) => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefonoDirecto, setTelefonoDirecto] = useState('');
  const [cargo, setCargo] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefonoDirecto('');
    setCargo('');
    setError(null);
  };

  const handleModalClose = () => {
    resetForm();
    handleClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setError("El formato del Email no es válido.");
        setIsSubmitting(false);
        return;
    }
    
    const contactoData: CrearContactoParaClienteDto = {
      nombre,
      apellido,
      email,
      telefonoDirecto: telefonoDirecto,
      cargo: cargo || undefined,
      esPrincipal: false,
    };

    try {
      const response = await apiClient.post<ContactoParaClienteDto>(`/api/clientes/${clienteId}/contactos`, contactoData);
      
      onContactoCreado(response.data); 
      handleModalClose();
    } catch (err: any) {
      const apiError = err.response?.data;
      let errorMessage = "Error al crear el contacto. Por favor, intente nuevamente.";
      if (apiError) {
          if (typeof apiError === 'string') errorMessage = apiError;
          else if (apiError.message) errorMessage = apiError.message;
          else if (apiError.Message) errorMessage = apiError.Message;
          else if (apiError.title && typeof apiError.errors === 'object') {
               errorMessage = `${apiError.title}: ` + Object.values(apiError.errors).flat().join(' ');
          }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Contacto para: <span className="fw-normal">{clienteNombre}</span></Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Apellido *</Form.Label>
                <Form.Control
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono Directo *</Form.Label>
                <Form.Control
                  type="text"
                  value={telefonoDirecto}
                  onChange={(e) => setTelefonoDirecto(e.target.value)}
                  required
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Cargo (Opcional)</Form.Label>
            <Form.Control
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Creando...
              </>
            ) : (
              'Crear Contacto'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCrearContacto;
