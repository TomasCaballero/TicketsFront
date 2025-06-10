import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import apiClient from '../../services/apiClient';
import type { ContactoDto, ActualizarContactoDto } from '../../types/clientes';

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  onSuccess: () => void;
  contacto: ContactoDto | null;
}

const ModalEditarContacto: React.FC<ModalProps> = ({ show, handleClose, onSuccess, contacto }) => {
    const [formData, setFormData] = useState<Partial<ActualizarContactoDto>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (show) {
            setError(null);
            setIsSubmitting(false);
            if (contacto) {
                setFormData({
                    nombre: contacto.nombre,
                    apellido: contacto.apellido,
                    email: contacto.email,
                    telefonoDirecto: contacto.telefonoDirecto,
                    cargo: contacto.cargo,
                });
            }
        }
    }, [show, contacto]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contacto) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await apiClient.put(`/api/clientes/contactos/${contacto.contactoID}`, formData);
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al actualizar el contacto.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static">
            <Modal.Header closeButton>
                <Modal.Title>Editar Contacto</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control name="nombre" value={formData.nombre || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control name="apellido" value={formData.apellido || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email || ''} onChange={handleChange} />
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Teléfono</Form.Label>
                                <Form.Control name="telefonoDirecto" value={formData.telefonoDirecto || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Cargo</Form.Label>
                                <Form.Control name="cargo" value={formData.cargo || ''} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
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
export default ModalEditarContacto;