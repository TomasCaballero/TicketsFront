// src/pages/TicketsListPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';
import type { TicketDto } from '../types/tickets';
import { PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets';
import { Table, Button, Alert, Spinner, Badge, Card, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { Eye, PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';

// Importamos los nuevos tipos que creamos
import type { PagedResultDto } from '../types/common';
import type { ObtenerTicketsRequestDto } from '../types/requests';

// Importamos el componente de paginación
import PaginationControls from '../components/common/PaginationControls';

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
    // --- ESTADOS ---
    const [pagedResult, setPagedResult] = useState<PagedResultDto<TicketDto> | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { tienePermiso } = useAuth();

    // Estado para todos los parámetros de la solicitud
    const [requestParams, setRequestParams] = useState<ObtenerTicketsRequestDto>({
        pageNumber: 1,
        pageSize: 10,
        sortDirection: 'desc',
        sortBy: 'fechaCreacion',
        filtroTitulo: '',
        filtroCliente: '',
        filtroResponsable: '',
    });
    
    // Estado intermedio para los filtros de texto (para debouncing)
    const [filtroTitulo, setFiltroTitulo] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [filtroResponsable, setFiltroResponsable] = useState('');

    // --- LÓGICA DE DEBOUNCING ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setRequestParams(prev => ({
                ...prev,
                pageNumber: 1, // Resetear a la página 1 al filtrar
                filtroTitulo,
                filtroCliente,
                filtroResponsable,
            }));
        }, 500); // 500ms de retraso

        return () => clearTimeout(handler);
    }, [filtroTitulo, filtroCliente, filtroResponsable]);


    // --- LLAMADA A LA API ---
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiClient.get<PagedResultDto<TicketDto>>('/api/tickets', {
                params: {
                    ...requestParams,
                    // Asegurarse de no enviar filtros vacíos
                    filtroTitulo: requestParams.filtroTitulo || undefined,
                    filtroCliente: requestParams.filtroCliente || undefined,
                    filtroResponsable: requestParams.filtroResponsable || undefined,
                    filtroPrioridad: requestParams.filtroPrioridad || undefined,
                    filtroEstado: requestParams.filtroEstado || undefined,
                }
            });
            setPagedResult(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al cargar los tickets.');
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // --- MANEJADORES DE EVENTOS ---
    const handleSort = (key: string) => {
        setRequestParams(prev => {
            const direction = prev.sortBy === key && prev.sortDirection === 'asc' ? 'desc' : 'asc';
            return { ...prev, sortBy: key, sortDirection: direction };
        });
    };
    
    const handlePageChange = (page: number) => {
        setRequestParams(prev => ({ ...prev, pageNumber: page }));
    };

    const getSortIcon = (key: string) => {
        if (requestParams.sortBy !== key) return null;
        return requestParams.sortDirection === 'asc' ? <SortAlphaUp className="ms-1" /> : <SortAlphaDown className="ms-1" />;
    };

    const handleDeleteTicket = async (ticket: TicketDto) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar el ticket #${ticket.numeroTicketFormateado}: "${ticket.titulo}"?`)) {
            try {
                await apiClient.delete(`/api/tickets/${ticket.ticketID}`);
                // ¡Simplemente volvemos a cargar los datos para reflejar el cambio!
                fetchTickets(); 
            } catch (err: any) {
                setError(err.response?.data?.message || 'Error al eliminar el ticket.');
                console.error('Error deleting ticket:', err);
            }
        }
    };
    
    const formatDate = (dateString: string): string => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-AR');
    };

    // --- RENDERIZADO ---
    if (loading && !pagedResult) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Card className="shadow-sm">
            <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                <h1 className="h4 mb-0 text-dark">Lista de Tickets</h1>
                {tienePermiso(Permisos.CrearTickets) && (
                    <Button variant="primary" onClick={() => navigate('/tickets/nuevo')}>
                        <PlusCircle size={20} className="me-2" /> Nuevo Ticket
                    </Button>
                )}
            </Card.Header>
            <Card.Body>
                <div className="p-3 mb-4 border rounded bg-light">
                     <Row className="g-3 align-items-end">
                        <Col md={3} sm={12}>
                            <Form.Group>
                                <Form.Label className="fw-bold">Buscar por Título</Form.Label>
                                <Form.Control type="text" placeholder="Ej: Error al iniciar..." value={filtroTitulo} onChange={e => setFiltroTitulo(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={3} sm={6}>
                            <Form.Group>
                                <Form.Label>Cliente</Form.Label>
                                <Form.Control type="text" placeholder="Nombre..." value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Responsable</Form.Label>
                                <Form.Control type="text" placeholder="Nombre..." value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} />
                            </Form.Group>
                        </Col>
                        <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Prioridad</Form.Label>
                                <Form.Select value={requestParams.filtroPrioridad} onChange={e => setRequestParams(prev => ({...prev, filtroPrioridad: e.target.value ? Number(e.target.value) as PrioridadTicketEnum : undefined, pageNumber: 1}))}>
                                    <option value="">Todas</option>
                                    {Object.entries(prioridadMap).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                         <Col md={2} sm={6}>
                            <Form.Group>
                                <Form.Label>Estado</Form.Label>
                                <Form.Select value={requestParams.filtroEstado} onChange={e => setRequestParams(prev => ({...prev, filtroEstado: e.target.value ? Number(e.target.value) as EstadoTicketEnum : undefined, pageNumber: 1}))}>
                                    <option value="">Todos</option>
                                    {Object.entries(estadoMap).map(([key, { text }]) => <option key={key} value={key}>{text}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </div>

                {loading && <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>}
                
                <Table striped bordered hover responsive="lg" className="mb-0 align-middle">
                    <thead className="table-light">
                        <tr>
                            <th onClick={() => handleSort('numeroTicketFormateado')} style={{ cursor: 'pointer' }}># Ticket {getSortIcon('numeroTicketFormateado')}</th>
                            <th onClick={() => handleSort('titulo')} style={{ cursor: 'pointer' }}>Título {getSortIcon('titulo')}</th>
                            <th onClick={() => handleSort('cliente')} style={{ cursor: 'pointer' }}>Cliente {getSortIcon('cliente')}</th>
                            <th onClick={() => handleSort('prioridad')} style={{ cursor: 'pointer' }}>Prioridad {getSortIcon('prioridad')}</th>
                             <th onClick={() => handleSort('estado')} style={{ cursor: 'pointer' }}>Estado {getSortIcon('estado')}</th>
                            <th onClick={() => handleSort('usuarioResponsable')} style={{ cursor: 'pointer' }}>Responsable {getSortIcon('usuarioResponsable')}</th>
                            <th onClick={() => handleSort('fechaCreacion')} style={{ cursor: 'pointer' }}>Fecha Creación {getSortIcon('fechaCreacion')}</th>
                            <th className="text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pagedResult && pagedResult.items.map((ticket) => (
                            <tr key={ticket.ticketID}>
                                <td><Button variant="link" size="sm" onClick={() => navigate(`/tickets/${ticket.ticketID}`)} className="p-0 fw-medium">{ticket.numeroTicketFormateado}</Button></td>
                                <td>{ticket.titulo}</td>
                                <td>{ticket.cliente?.nombre || 'N/A'}</td>
                                <td><Badge bg={prioridadMap[ticket.prioridad]?.variant}>{prioridadMap[ticket.prioridad]?.text}</Badge></td>
                                <td><Badge bg={estadoMap[ticket.estado]?.variant} text={estadoMap[ticket.estado]?.variant === 'light' ? 'dark' : 'white'}>{estadoMap[ticket.estado]?.text}</Badge></td>
                                <td>{ticket.usuarioResponsable?.nombreCompleto || <span className="text-muted">No asignado</span>}</td>
                                <td>{formatDate(ticket.fechaCreacion)}</td>
                                <td className="text-center">
                                    <Button variant="outline-info" size="sm" className="me-1 p-1" title="Ver Detalles" onClick={() => navigate(`/tickets/${ticket.ticketID}`)}><Eye size={16} /></Button>
                                    {tienePermiso(Permisos.EditarTickets) && (<Button variant="outline-warning" size="sm" className="me-1 p-1" title="Editar" onClick={() => navigate(`/tickets/editar/${ticket.ticketID}`)}><PencilSquare size={16} /></Button>)}
                                    {tienePermiso(Permisos.EliminarTickets) && (<Button variant="outline-danger" size="sm" className="p-1" title="Eliminar" onClick={() => handleDeleteTicket(ticket)}><Trash3 size={16} /></Button>)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
                
                {pagedResult && pagedResult.items.length === 0 && !loading && (
                    <p className="text-center text-muted mt-3">No se encontraron tickets que coincidan con los filtros.</p>
                )}

                {pagedResult && pagedResult.totalPages > 1 && (
                    <PaginationControls
                        currentPage={pagedResult.pageNumber}
                        totalPages={pagedResult.totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </Card.Body>
        </Card>
    );
};

export default TicketsListPage;