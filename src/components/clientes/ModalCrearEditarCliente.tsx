import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { TipoClienteEnum } from '../../types/tickets';
import type { ClienteDto, CrearClienteDto, ActualizarClienteDto } from '../../types/clientes';

interface ModalProps {
    show: boolean;
    handleClose: () => void;
    onSuccess: () => void;
    clienteAEditar?: ClienteDto | null;
}

const ModalCrearEditarCliente: React.FC<ModalProps> = ({ show, handleClose, onSuccess, clienteAEditar }) => {
    const isEditMode = !!clienteAEditar;

    const [nombreCliente, setNombreCliente] = useState('');
    const [tipoCliente, setTipoCliente] = useState<TipoClienteEnum>(TipoClienteEnum.Empresa);
    const [cuitRuc, setCuitRuc] = useState('');
    const [emailPrincipal, setEmailPrincipal] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
    const [direccionFiscal, setDireccionFiscal] = useState('');

    useEffect(() => {
        if (show) {
            setError(null);
            setIsSubmitting(false);
            if (isEditMode && clienteAEditar) {
                setNombreCliente(clienteAEditar.nombreCliente);
                setTipoCliente(clienteAEditar.tipoCliente);
                setCuitRuc(clienteAEditar.cuiT_RUC || '');
                setEmailPrincipal(clienteAEditar.emailPrincipal || '');
                setTelefonoPrincipal(clienteAEditar.telefonoPrincipal || '');
                setDireccionFiscal(clienteAEditar.direccionFiscal || '');
            } else {
                setNombreCliente('');
                setTipoCliente(TipoClienteEnum.Empresa);
                setCuitRuc('');
                setEmailPrincipal('');
            }
        }
    }, [show, isEditMode, clienteAEditar]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditMode && clienteAEditar) {
                const payload: ActualizarClienteDto = {
                    nombreCliente,
                    cuit_RUC: cuitRuc,
                    emailPrincipal,
                    telefonoPrincipal, 
                    direccionFiscal  
                };
                await apiClient.put(`/api/clientes/${clienteAEditar.clienteID}`, payload);
            } else {
                const payload: CrearClienteDto = { nombreCliente, tipoCliente, cuit_RUC: cuitRuc, emailPrincipal, telefonoPrincipal };
                await apiClient.post('/api/clientes', payload);
            }
            onSuccess();
            handleClose();
        } catch (err: any) {
            setError(err.response?.data?.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el cliente.`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title>{isEditMode ? 'Editar' : 'Nuevo'} Cliente</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmit}>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre Cliente *</Form.Label>
                        <Form.Control type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} required />
                    </Form.Group>
                    <Row>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>Tipo *</Form.Label>
                                <Form.Select value={tipoCliente} onChange={e => setTipoCliente(Number(e.target.value) as TipoClienteEnum)} disabled={isEditMode}>
                                    <option value={TipoClienteEnum.Empresa}>Empresa</option>
                                    <option value={TipoClienteEnum.PersonaIndividual}>Persona Individual</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group className="mb-3">
                                <Form.Label>CUIT/RUC</Form.Label>
                                <Form.Control type="text" value={cuitRuc} onChange={e => setCuitRuc(e.target.value)} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mb-3">
                        <Form.Label>Email Principal</Form.Label>
                        <Form.Control type="email" value={emailPrincipal} onChange={e => setEmailPrincipal(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Teléfono Principal</Form.Label>
                        <Form.Control type="text" value={telefonoPrincipal} onChange={e => setTelefonoPrincipal(e.target.value)} />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Dirección Fiscal</Form.Label>
                        <Form.Control type="text" value={direccionFiscal} onChange={e => setDireccionFiscal(e.target.value)} />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Cancelar</Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" size="sm" /> : 'Guardar'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default ModalCrearEditarCliente;