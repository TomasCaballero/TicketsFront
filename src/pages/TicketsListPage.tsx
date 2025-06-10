import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useSortableData } from '../hooks/useSortableData';
import { useAuth } from '../context/AuthContext'; // <-- 1. IMPORTACIONES ADICIONALES
import { Permisos } from '../constants/permisos'; // <-- 1. IMPORTACIONES ADICIONALES
import type { TicketDto } from '../types/tickets';
import { PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets';
import { Table, Button, Alert, Spinner, Badge, Card, Form, Row, Col } from 'react-bootstrap';
import { Eye, PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';

// --- Mapeos para los Badges (los dejamos aquí por conveniencia) ---
const prioridadMap: Record<number, { text: string; variant: string }> = {
    [PrioridadTicketEnum.BAJA]: { text: 'Baja', variant: 'secondary' },
    [PrioridadTicketEnum.MEDIA]: { text: 'Media', variant: 'info' },
    [PrioridadTicketEnum.ALTA]: { text: 'Alta', variant: 'warning' },
    [PrioridadTicketEnum.URGENTE]: { text: 'Urgente', variant: 'danger' },
};
const estadoMap: Record<number, { text: string; variant: string }> = {
    [EstadoTicketEnum.NUEVO]: { text: 'Nuevo', variant: 'primary' },
    [EstadoTicketEnum.ABIERTO]: { text: 'Abierto', variant: 'success' },
    [EstadoTicketEnum.ASIGNADO]: { text: 'Asignado', variant: 'info' },
    [EstadoTicketEnum.EN_PROGRESO]: { text: 'En Progreso', variant: 'warning' },
    [EstadoTicketEnum.PENDIENTE_CLIENTE]: { text: 'Pendiente Cliente', variant: 'light' },
    [EstadoTicketEnum.EN_REVISION]: { text: 'En Revisión', variant: 'secondary' },
    [EstadoTicketEnum.RESUELTO]: { text: 'Resuelto', variant: 'dark' },
    [EstadoTicketEnum.CERRADO]: { text: 'Cerrado', variant: 'secondary' },
};

const TicketsListPage: React.FC = () => {
    const [tickets, setTickets] = useState<TicketDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const { tienePermiso } = useAuth();

    // 1. ESTADOS PARA LOS NUEVOS FILTROS
    const [searchTitulo, setSearchTitulo] = useState('');
    const [searchCliente, setSearchCliente] = useState('');
    const [searchResponsable, setSearchResponsable] = useState('');
    const [filterPrioridad, setFilterPrioridad] = useState('');
    const [filterEstado, setFilterEstado] = useState('');

    useEffect(() => {
        const fetchTickets = async () => {
            setLoading(true);
            try {
                const response = await apiClient.get<TicketDto[]>('/api/tickets');
                setTickets(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al cargar los tickets.');
            } finally {
                setLoading(false);
            }
        };
        fetchTickets();
    }, []);

    // 2. LÓGICA DE FILTRADO COMBINADO
    const filteredTickets = useMemo(() => {
        return tickets
            .filter(t => t.titulo.toLowerCase().includes(searchTitulo.toLowerCase()))
            .filter(t => searchCliente ? t.cliente?.nombre.toLowerCase().includes(searchCliente.toLowerCase()) : true)
            .filter(t => searchResponsable ? t.usuarioResponsable?.nombreCompleto?.toLowerCase().includes(searchResponsable.toLowerCase()) : true)
            .filter(t => filterPrioridad ? t.prioridad.toString() === filterPrioridad : true)
            .filter(t => filterEstado ? t.estado.toString() === filterEstado : true);
    }, [tickets, searchTitulo, searchCliente, searchResponsable, filterPrioridad, filterEstado]);

    // 3. APLICAR EL HOOK DE ORDENAMIENTO SOBRE LOS DATOS YA FILTRADOS
    const { sortedItems, requestSort, sortConfig } = useSortableData(filteredTickets, { key: 'fechaCreacion', direction: 'descending' });

    const getSortIcon = (key: keyof TicketDto) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <SortAlphaUp className="ms-1" /> : <SortAlphaDown className="ms-1" />;
    };

    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    const handleDeleteTicket = async (ticket: TicketDto) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el ticket #${ticket.numeroTicketFormateado}: "${ticket.titulo}"?`)) {
            try {
                await apiClient.delete(`/api/tickets/${ticket.ticketID}`);
                // Actualizamos el estado local para reflejar el cambio inmediatamente
                setTickets(prevTickets => prevTickets.filter(t => t.ticketID !== ticket.ticketID));
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al eliminar el ticket.');
                console.error('Error deleting ticket:', err);
            }
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                <h1 className="h4 mb-0 text-dark">Lista de Tickets</h1>
                <Button variant="primary" onClick={() => navigate('/tickets/nuevo')}>
                    <PlusCircle size={20} className="me-2" /> Nuevo Ticket
                </Button>
            </Card.Header>
            <Card.Body>
                {/* --- 4. PANEL DE FILTROS (JSX) --- */}
                <div className="p-3 mb-4 border rounded bg-light">
                    <Row className="g-3 align-items-end">
                        <Col md={3} sm={12}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Buscar por Título</Form.Label>
                                <Form.Control type="text" placeholder="Ej: Error al iniciar..." value={searchTitulo} onChange={e => setSearchTitulo(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Cliente</Form.Label>
                                <Form.Control type="text" placeholder="Nombre..." value={searchCliente} onChange={e => setSearchCliente(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Responsable</Form.Label>
                                <Form.Control type="text" placeholder="Nombre..." value={searchResponsable} onChange={e => setSearchResponsable(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Prioridad</Form.Label>
                                <Form.Select value={filterPrioridad} onChange={e => setFilterPrioridad(e.target.value)}>
                                    <option value="">Todas</option>
                                    {Object.entries(prioridadMap).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {/* <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Estado</Form.Label>
                                <Form.Select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}>
                                    <option value="">Todos</option>
                                    {Object.entries(estadoMap).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col> */}
                    </Row>
                </div>

                <Table striped bordered hover responsive="lg" className="mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th># Ticket</th>
                            {/* --- 5. CABECERAS DE TABLA CLICKEABLES PARA ORDENAR --- */}
                            <th onClick={() => requestSort('titulo')} style={{ cursor: 'pointer' }}>Título {getSortIcon('titulo')}</th>
                            <th>Cliente</th>
                            <th onClick={() => requestSort('prioridad')} style={{ cursor: 'pointer' }}>Prioridad {getSortIcon('prioridad')}</th>
                            {/* <th>Estado</th> */}
                            <th>Responsable</th>
                            <th onClick={() => requestSort('fechaCreacion')} style={{ cursor: 'pointer' }}>Fecha Creación {getSortIcon('fechaCreacion')}</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* --- 6. MAPEO SOBRE LOS ITEMS ORDENADOS Y FILTRADOS --- */}
                        {sortedItems.map((ticket) => (
                            <tr key={ticket.ticketID}>
                                <td>
                                    <Button variant="link" size="sm" onClick={() => navigate(`/tickets/${ticket.ticketID}`)} className="p-0 fw-medium">
                                        {ticket.numeroTicketFormateado}
                                    </Button>
                                </td>
                                <td>{ticket.titulo}</td>
                                <td>{ticket.cliente?.nombre || 'N/A'}</td>
                                <td><Badge bg={prioridadMap[ticket.prioridad]?.variant}>{prioridadMap[ticket.prioridad]?.text}</Badge></td>
                                {/* <td><Badge bg={estadoMap[ticket.estado]?.variant} text={(estadoMap[ticket.estado]?.variant === 'light' || estadoMap[ticket.estado]?.variant === 'warning') ? 'dark' : undefined}>{estadoMap[ticket.estado]?.text}</Badge></td> */}
                                <td>{ticket.usuarioResponsable?.nombreCompleto || <span className="text-muted">No asignado</span>}</td>
                                <td>{formatDate(ticket.fechaCreacion)}</td>
                                <td className="text-center">
                                    <Button variant="outline-info" size="sm" className="me-1 p-1" title="Ver Detalles" onClick={() => navigate(`/tickets/${ticket.ticketID}`)}><Eye size={16} /></Button>

                                    {tienePermiso(Permisos.EditarTickets) && (
                                        <Button variant="outline-warning" size="sm" className="me-1 p-1" title="Editar" onClick={() => navigate(`/tickets/editar/${ticket.ticketID}`)}><PencilSquare size={16} /></Button>
                                    )}

                                    {/* --- 4. BOTÓN DE ELIMINAR restaurado con su lógica de permisos --- */}
                                    {tienePermiso(Permisos.EliminarTickets) && (
                                        <Button variant="outline-danger" size="sm" className="p-1" title="Eliminar" onClick={() => handleDeleteTicket(ticket)}>
                                            <Trash3 size={16} />
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {sortedItems.length === 0 && <p className="text-center text-muted mt-3">No se encontraron tickets que coincidan con los filtros.</p>}
            </Card.Body>
        </Card>
    );
};

export default TicketsListPage;