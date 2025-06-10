import React, { useEffect, useState, useCallback } from 'react'; // <-- Añadir useCallback
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Card, Spinner, Alert, ListGroup, Button, Table, Row, Col, Badge } from 'react-bootstrap';
import { ArrowLeft, Building, PersonVcard, Envelope, Phone, PencilSquare, Trash3, PlusCircle } from 'react-bootstrap-icons';
import { type ClienteDto, type ContactoDto } from '../types/clientes';
import { TipoClienteEnum } from '../types/tickets';

import ModalCrearEditarCliente from '../components/clientes/ModalCrearEditarCliente';
import ModalEditarContacto from '../components/clientes/ModalEditarContacto';
import ModalCrearContacto from '../components/clientes/ModalCrearContacto';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';


const ClienteDetailPage: React.FC = () => {
    const { clienteId } = useParams<{ clienteId: string }>();
    const [cliente, setCliente] = useState<ClienteDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { tienePermiso } = useAuth();

    const [showClienteModal, setShowClienteModal] = useState(false);
    const [showContactoModal, setShowContactoModal] = useState(false);
    const [showCrearContactoModal, setShowCrearContactoModal] = useState(false);
    const [contactoAEditar, setContactoAEditar] = useState<ContactoDto | null>(null);

    // --- 1. CREACIÓN DE LA FUNCIÓN fetchCliente ---
    // Usamos useCallback para memorizar la función y evitar que se recree en cada render
    const fetchCliente = useCallback(() => {
        if (!clienteId) {
            setError("No se proporcionó un ID de cliente.");
            setLoading(false);
            return;
        }

        setLoading(true);
        apiClient.get<ClienteDto>(`/api/clientes/${clienteId}`)
            .then(response => {
                setCliente(response.data);
                setError(null); // Limpiar errores previos si la carga es exitosa
            })
            .catch(err => {
                setError("Error al cargar los detalles del Cliente.");
                console.error(err);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [clienteId]); // La función se recreará solo si el clienteId cambia

    // --- 2. useEffect AHORA USA LA NUEVA FUNCIÓN ---
    useEffect(() => {
        fetchCliente();
    }, [fetchCliente]); // La dependencia ahora es la función memorizada

    const handleEditContacto = (contacto: ContactoDto) => {
        setContactoAEditar(contacto);
        setShowContactoModal(true);
    };

    const handleDeleteContacto = async (contactoId: string) => {
        if (window.confirm('¿Estás seguro de eliminar este contacto?')) {
            try {
                await apiClient.delete(`/api/clientes/contactos/${contactoId}`);
                fetchCliente(); // <-- AHORA ESTA LLAMADA FUNCIONA
            } catch (err: any) {
                setError(err.response?.data?.message || "Error al eliminar contacto.");
            }
        }
    };

    // El resto de la lógica de renderizado no cambia
    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>;
    if (!cliente) return <Alert variant="warning">No se encontró el Cliente.</Alert>;

    const esEmpresa = cliente.tipoCliente === TipoClienteEnum.Empresa;

    return (
        <>
            <Button as={Link as any} to="/clientes" variant="outline-secondary" size="sm" className="mb-3">
                <ArrowLeft /> Volver a la lista
            </Button>

            <Card className="mb-4">
                <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                    <span>
                        {esEmpresa ? <Building className="me-2" /> : <PersonVcard className="me-2" />}
                        {cliente.nombreCliente}
                    </span>
                    {tienePermiso(Permisos.EditarClientes) && (
                        <Button variant="outline-secondary" size="sm" onClick={() => setShowClienteModal(true)}>
                            <PencilSquare /> Editar Cliente
                        </Button>
                    )}
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <ListGroup.Item>
                                    <strong>Tipo de Cliente:</strong> <Badge bg={esEmpresa ? 'primary' : 'secondary'}>{esEmpresa ? 'Empresa' : 'Persona Individual'}</Badge>
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>CUIT/RUC:</strong> {cliente.cuiT_RUC || <span className="text-muted">N/A</span>}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <strong>Dirección Fiscal:</strong> {cliente.direccionFiscal || <span className="text-muted">N/A</span>}
                                </ListGroup.Item>
                            </ListGroup>
                        </Col>
                        <Col md={6}>
                            <ListGroup variant="flush">
                                <ListGroup.Item>
                                    <Envelope className="me-2" /><strong>Email Principal:</strong> {cliente.emailPrincipal || <span className="text-muted">N/A</span>}
                                </ListGroup.Item>
                                <ListGroup.Item>
                                    <Phone className="me-2" /><strong>Teléfono Principal:</strong> {cliente.telefonoPrincipal || <span className="text-muted">N/A</span>}
                                </ListGroup.Item>
                            </ListGroup>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {esEmpresa && (
                <Card className="mb-4">
                    <Card.Header as="h5">Contactos</Card.Header>
                    {tienePermiso(Permisos.EditarClientes) && (
                        <Button variant="primary" size="sm" onClick={() => setShowCrearContactoModal(true)}>
                            <PlusCircle className="me-1" /> Nuevo Contacto
                        </Button>
                    )}
                    <Card.Body>
                        {cliente.contactos && cliente.contactos.length > 0 ? (
                            <Table striped bordered hover responsive size="sm">
                                <thead>
                                    <tr>
                                        <th>Nombre</th><th>Apellido</th><th>Email</th><th>Teléfono</th><th>Cargo</th><th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cliente.contactos.map(contacto => (
                                        <tr key={contacto.contactoID}>
                                            <td>{contacto.nombre}</td>
                                            <td>{contacto.apellido}</td>
                                            <td>{contacto.email}</td>
                                            <td>{contacto.telefonoDirecto || <span className="text-muted">N/A</span>}</td>
                                            <td>{contacto.cargo || <span className="text-muted">N/A</span>}</td>
                                            <td>
                                                <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleEditContacto(contacto)}><PencilSquare /></Button>
                                                <Button variant="outline-danger" size="sm" onClick={() => handleDeleteContacto(contacto.contactoID)}><Trash3 /></Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : <p className="text-muted">Este cliente no tiene contactos registrados.</p>}
                    </Card.Body>
                </Card>
            )}

            <Card>
                <Card.Header as="h5">Tickets Asociados</Card.Header>
                <Card.Body>
                    {cliente.tickets && cliente.tickets.length > 0 ? (
                        <Table hover responsive size="sm">
                            <thead><tr><th># Ticket</th><th>Título</th><th>Estado</th></tr></thead>
                            <tbody>
                                {cliente.tickets.map(t => (
                                    <tr key={t.ticketID}>
                                        <td><Link to={`/tickets/${t.ticketID}`}>{t.numeroTicketFormateado}</Link></td>
                                        <td>{t.titulo}</td>
                                        <td>{t.estado}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : <p className="text-muted">No hay tickets asociados a este cliente.</p>}
                </Card.Body>
            </Card>

            <ModalCrearEditarCliente
                show={showClienteModal}
                handleClose={() => setShowClienteModal(false)}
                onSuccess={() => { setShowClienteModal(false); fetchCliente(); }} // <-- AHORA ESTA LLAMADA FUNCIONA
                clienteAEditar={cliente}
            />
            <ModalEditarContacto
                show={showContactoModal}
                handleClose={() => setShowContactoModal(false)}
                onSuccess={() => { setShowContactoModal(false); fetchCliente(); }} // <-- AHORA ESTA LLAMADA FUNCIONA
                contacto={contactoAEditar}
            />
            <ModalCrearContacto
                show={showCrearContactoModal}
                handleClose={() => setShowCrearContactoModal(false)}
                onContactoCreado={() => { setShowCrearContactoModal(false); fetchCliente(); }}
                clienteId={cliente.clienteID}
                clienteNombre={cliente.nombreCliente}
            />
        </>
    );
};

export default ClienteDetailPage;