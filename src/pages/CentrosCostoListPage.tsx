import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';
import { useSortableData } from '../hooks/useSortableData'; 
import { Button, Card, Spinner, Alert, Table, Badge, Form, InputGroup, Row, Col } from 'react-bootstrap';
import { PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';
import ModalCrearEditarCentroDeCosto from '../components/centros-costo/ModalCrearEditarCentroDeCosto';
import { type CentroDeCostoDto } from '../types/centrosCosto';
import { TipoCentroCosto } from '../types/tickets';
import { Link } from 'react-router-dom';

const tipoMap: Record<number, string> = {
    [TipoCentroCosto.PROYECTO]: "Proyecto",
    [TipoCentroCosto.PRODUCTO]: "Producto",
    [TipoCentroCosto.CONTRATO]: "Contrato"
};

const CentrosCostoListPage: React.FC = () => {
    const [centrosCosto, setCentrosCosto] = useState<CentroDeCostoDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { tienePermiso } = useAuth();

    const [searchNombre, setSearchNombre] = useState('');
    const [searchResponsable, setSearchResponsable] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [centroAEditar, setCentroAEditar] = useState<CentroDeCostoDto | null>(null);

    const fetchCentrosCosto = () => {
        setLoading(true);
        apiClient.get<CentroDeCostoDto[]>('/api/centrosdecosto')
            .then(response => {
                setCentrosCosto(response.data);
                setLoading(false);
            })
            .catch(err => {
                setError("Error al cargar los Centros de Costo.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCentrosCosto();
    }, []);

    const filteredItems = useMemo(() => {
        return centrosCosto
            .filter(cc => cc.nombre.toLowerCase().includes(searchNombre.toLowerCase()))
            .filter(cc => searchResponsable ? cc.usuarioResponsable?.nombreCompleto?.toLowerCase().includes(searchResponsable.toLowerCase()) : true)
            .filter(cc => filterTipo ? cc.tipo.toString() === filterTipo : true);
    }, [centrosCosto, searchNombre, searchResponsable, filterTipo]);

    const { sortedItems, requestSort, sortConfig } = useSortableData(filteredItems, { key: 'nombre', direction: 'ascending' });
    const getSortIcon = (key: keyof CentroDeCostoDto) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? <SortAlphaUp className="ms-1" /> : <SortAlphaDown className="ms-1" />;
    };

    const handleOpenCreateModal = () => {
        setCentroAEditar(null);
        setShowModal(true);
    };

    const handleOpenEditModal = (centro: CentroDeCostoDto) => {
        setCentroAEditar(centro);
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar este Centro de Costo?")) {
            apiClient.delete(`/api/centrosdecosto/${id}`)
                .then(() => fetchCentrosCosto()) 
                .catch(err => setError(err.response?.data?.message || 'Error al eliminar.'));
        }
    };

    const handleSuccess = () => {
        fetchCentrosCosto();
        setShowModal(false);
    };

    if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
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
                                    <Form.Control type="text" placeholder="Nombre del CC..." value={searchNombre} onChange={e => setSearchNombre(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>Buscar por Responsable</Form.Label>
                                    <Form.Control type="text" placeholder="Nombre del responsable..." value={searchResponsable} onChange={e => setSearchResponsable(e.target.value)} />
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>Filtrar por Tipo</Form.Label>
                                    <Form.Select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}>
                                        <option value="">Todos</option>
                                        {Object.entries(tipoMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                    </div>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('nombre')} style={{ cursor: 'pointer' }}>
                                    Nombre {getSortIcon('nombre')}
                                </th>
                                <th>Tipo</th>
                                <th>Responsable</th>
                                <th>Participantes</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedItems.map(cc => (
                                <tr key={cc.centroDeCostoID}>
                                    <td>
                                        <Link to={`/centros-costo/${cc.centroDeCostoID}`}>{cc.nombre}</Link>
                                    </td>
                                    <td><Badge bg="info">{tipoMap[cc.tipo] || 'N/A'}</Badge></td>
                                    <td>{cc.usuarioResponsable?.nombreCompleto || <i className="text-muted">N/A</i>}</td>
                                    <td>{cc.participantes.length}</td>
                                    <td>
                                        {tienePermiso(Permisos.EditarCentrosDeCosto) && (
                                            <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleOpenEditModal(cc)}><PencilSquare /></Button>
                                        )}
                                        {tienePermiso(Permisos.EliminarCentrosDeCosto) && (
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cc.centroDeCostoID)}><Trash3 /></Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    {sortedItems.length === 0 && <p className="text-center text-muted mt-3">No se encontraron centros de costo que coincidan con los filtros.</p>}
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