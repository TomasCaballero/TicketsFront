// src/pages/CentrosCostoListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';
import { Button, Card, Spinner, Alert, Table, Badge, Form, Row, Col } from 'react-bootstrap';
import { PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';
import ModalCrearEditarCentroDeCosto from '../components/centros-costo/ModalCrearEditarCentroDeCosto';
import { type CentroDeCostoDto } from '../types/centrosCosto';
import { TipoCentroCosto } from '../types/tickets';
import { Link } from 'react-router-dom';

// Importamos los nuevos tipos
import type { PagedResultDto } from '../types/common';
import type { ObtenerCentrosDeCostoRequestDto } from '../types/requests';
import PaginationControls from '../components/common/PaginationControls';

const tipoMap: Record<number, string> = {
    [TipoCentroCosto.PROYECTO]: "Proyecto",
    [TipoCentroCosto.PRODUCTO]: "Producto",
    [TipoCentroCosto.CONTRATO]: "Contrato"
};

const CentrosCostoListPage: React.FC = () => {
    const [pagedResult, setPagedResult] = useState<PagedResultDto<CentroDeCostoDto> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { tienePermiso } = useAuth();

    // Estado para todos los parámetros de la solicitud
    const [requestParams, setRequestParams] = useState<ObtenerCentrosDeCostoRequestDto>({
        pageNumber: 1,
        pageSize: 10,
        sortBy: 'nombre',
        sortDirection: 'asc',
    });
    
    // Estados intermedios para debouncing
    const [filtroNombre, setFiltroNombre] = useState('');
    const [filtroResponsable, setFiltroResponsable] = useState('');

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [centroAEditar, setCentroAEditar] = useState<CentroDeCostoDto | null>(null);

    // Debouncing para los filtros de texto
    useEffect(() => {
        const handler = setTimeout(() => {
            setRequestParams(prev => ({ 
                ...prev, 
                filtroNombre, 
                filtroResponsable, 
                pageNumber: 1 
            }));
        }, 500);
        return () => clearTimeout(handler);
    }, [filtroNombre, filtroResponsable]);

    const fetchCentrosCosto = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...requestParams,
                filtroNombre: requestParams.filtroNombre || undefined,
                filtroResponsable: requestParams.filtroResponsable || undefined,
                filtroTipo: requestParams.filtroTipo
            };
            const response = await apiClient.get<PagedResultDto<CentroDeCostoDto>>('/api/centrosdecosto', { params });
            setPagedResult(response.data);
        } catch (err: any) {
            setError("Error al cargar los Centros de Costo.");
        } finally {
            setLoading(false);
        }
    }, [requestParams]);

    useEffect(() => {
        fetchCentrosCosto();
    }, [fetchCentrosCosto]);

    const handleSort = (key: string) => {
        setRequestParams(prev => ({
            ...prev,
            sortBy: key,
            sortDirection: prev.sortBy === key && prev.sortDirection === 'asc' ? 'desc' : 'asc'
        }));
    };

    const getSortIcon = (key: string) => {
        if (requestParams.sortBy !== key) return null;
        return requestParams.sortDirection === 'asc' ? <SortAlphaUp className="ms-1" /> : <SortAlphaDown className="ms-1" />;
    };

    const handleOpenCreateModal = () => {
        setCentroAEditar(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (centro: CentroDeCostoDto) => {
        setCentroAEditar(centro);
        setShowModal(true);
    };

    const handleDelete = (id: string, nombre: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
            apiClient.delete(`/api/centrosdecosto/${id}`)
                .then(() => fetchCentrosCosto()) 
                .catch(err => setError(err.response?.data?.message || 'Error al eliminar.'));
        }
    };

    const handleSuccess = () => {
        fetchCentrosCosto();
        setShowModal(false);
    };
    
    const handlePageChange = (page: number) => {
        setRequestParams(prev => ({ ...prev, pageNumber: page }));
    };

    if (loading && !pagedResult) return <div className="text-center p-5"><Spinner animation="border" /></div>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <>
            <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h1 className="h4 mb-0">Centros de Costo</h1>
                    {tienePermiso(Permisos.CrearCentrosDeCosto) && (
                        <Button variant="primary" onClick={handleOpenCreateModal}><PlusCircle className="me-2" />Nuevo</Button>
                    )}
                </Card.Header>
                <Card.Body>
                    <div className="p-3 mb-4 border rounded bg-light">
                        <Row className="g-3 align-items-end">
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">Buscar por Nombre</Form.Label>
                                    <Form.Control type="text" placeholder="Nombre del CC..." value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Buscar por Responsable</Form.Label>
                                    <Form.Control type="text" placeholder="Nombre del responsable..." value={filtroResponsable} onChange={e => setFiltroResponsable(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Filtrar por Tipo</Form.Label>
                                    <Form.Select 
                                        value={requestParams.filtroTipo ?? ""} 
                                        onChange={e => setRequestParams(prev => ({...prev, filtroTipo: e.target.value ? Number(e.target.value) as TipoCentroCosto : undefined, pageNumber: 1}))}>
                                        <option value="">Todos</option>
                                        {Object.entries(tipoMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>

                    {loading && <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>}

                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('nombre')} style={{ cursor: 'pointer' }}>Nombre {getSortIcon('nombre')}</th>
                                <th onClick={() => handleSort('tipo')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipo')}</th>
                                <th>Responsable</th>
                                <th className='text-center'>Participantes</th>
                                <th className='text-center'>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedResult && pagedResult.items.map(cc => (
                                <tr key={cc.centroDeCostoID}>
                                    <td><Link to={`/centros-costo/${cc.centroDeCostoID}`}>{cc.nombre}</Link></td>
                                    <td><Badge bg="info">{tipoMap[cc.tipo] || 'N/A'}</Badge></td>
                                    <td>{cc.usuarioResponsable?.nombreCompleto || <i className="text-muted">N/A</i>}</td>
                                    <td className='text-center'>{cc.participantes.length}</td>
                                    <td className='text-center'>
                                        {tienePermiso(Permisos.EditarCentrosDeCosto) && (<Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleOpenEditModal(cc)}><PencilSquare /></Button>)}
                                        {tienePermiso(Permisos.EliminarCentrosDeCosto) && (<Button variant="outline-danger" size="sm" onClick={() => handleDelete(cc.centroDeCostoID, cc.nombre)}><Trash3 /></Button>)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    {pagedResult && pagedResult.items.length === 0 && !loading && (
                        <p className="text-center text-muted mt-3">No se encontraron centros de costo que coincidan con los filtros.</p>
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

            <ModalCrearEditarCentroDeCosto
                show={showModal}
                handleClose={() => setShowModal(false)}
                onSuccess={handleSuccess}
                centroDeCostoAEditar={centroAEditar}
            />
        </>
    );
};

export default CentrosCostoListPage;