// src/components/clientes/ModalCrearContacto.tsx
import React, { useState, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import type { CrearContactoParaClienteDto, ContactoParaClienteDto } from '../../types/clientes';

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  onContactoCreado: (nuevoContacto: ContactoParaClienteDto) => void;
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

  const resetForm = () => { /* ... sin cambios ... */ };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !telefonoDirecto.trim()) {
        setError("Nombre, apellido y teléfono son obligatorios.");
        return;
    }
    setIsSubmitting(true);
    setError(null);
    
    // --- SECCIÓN CORREGIDA ---
    const payload: CrearContactoParaClienteDto = {
      nombre,
      apellido,
      email: email || undefined, // El email es opcional, así que si está vacío, enviamos undefined
      telefonoDirecto: telefonoDirecto, // El teléfono ahora es requerido y se envía tal cual
      cargo: cargo || undefined,
    };
    // --- FIN DE LA CORRECCIÓN ---

    try {
      const response = await apiClient.post<ContactoParaClienteDto>(`/api/clientes/${clienteId}/contactos`, payload);
      onContactoCreado(response.data);
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
            <Col><Form.Group className="mb-3"><Form.Label>Nombre *</Form.Label><Form.Control value={nombre} onChange={e => setNombre(e.target.value)} required /></Form.Group></Col>
            <Col><Form.Group className="mb-3"><Form.Label>Apellido *</Form.Label><Form.Control value={apellido} onChange={e => setApellido(e.target.value)} required /></Form.Group></Col>
          </Row>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Email (Opcional)</Form.Label>
                <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Teléfono *</Form.Label>
                <Form.Control value={telefonoDirecto} onChange={e => setTelefonoDirecto(e.target.value)} required />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Cargo (Opcional)</Form.Label>
            <Form.Control value={cargo} onChange={e => setCargo(e.target.value)} />
          </Form.Group>
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