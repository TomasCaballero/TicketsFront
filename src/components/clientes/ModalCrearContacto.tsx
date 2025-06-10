import React, { useState, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import type { CrearContactoParaClienteDto } from '../../types/clientes';

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  onContactoCreado: () => void; // Cambiado para no necesitar el objeto de vuelta
  clienteId: string;
  clienteNombre: string;
}

const ModalCrearContacto: React.FC<ModalProps> = ({ show, handleClose, onContactoCreado, clienteId, clienteNombre }) => {
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    const payload: CrearContactoParaClienteDto = {
      nombre,
      apellido,
      email,
      telefonoDirecto: telefonoDirecto || undefined,
      cargo: cargo || undefined,
    };

    try {
      await apiClient.post(`/api/clientes/${clienteId}/contactos`, payload);
      onContactoCreado();
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear el contacto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} onEnter={resetForm} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>Nuevo Contacto para: {clienteNombre}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control value={nombre} onChange={e => setNombre(e.target.value)} required />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Apellido *</Form.Label>
                <Form.Control value={apellido} onChange={e => setApellido(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono</Form.Label>
                <Form.Control value={telefonoDirecto} onChange={e => setTelefonoDirecto(e.target.value)} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Cargo</Form.Label>
                <Form.Control value={cargo} onChange={e => setCargo(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Crear Contacto'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCrearContacto;