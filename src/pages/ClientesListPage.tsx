// src/pages/ClientesListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';
import { Button, Card, Spinner, Alert, Table, Badge, Form, Col, Row } from 'react-bootstrap';
import { PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import type { ClienteDto } from '../types/clientes';
import { TipoClienteEnum } from '../types/tickets';
import ModalCrearEditarCliente from '../components/clientes/ModalCrearEditarCliente';

// Importamos los nuevos tipos
import type { PagedResultDto } from '../types/common';
import type { ObtenerClientesRequestDto } from '../types/requests';
import PaginationControls from '../components/common/PaginationControls';


const ClientesListPage: React.FC = () => {
  const [pagedResult, setPagedResult] = useState<PagedResultDto<ClienteDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tienePermiso } = useAuth();
  const navigate = useNavigate();

  const [requestParams, setRequestParams] = useState<ObtenerClientesRequestDto>({
    pageNumber: 1,
    pageSize: 10,
    sortBy: 'nombreCliente',
    sortDirection: 'asc',
  });

  const [filtroNombre, setFiltroNombre] = useState('');

  // Debouncing para el filtro de nombre
  useEffect(() => {
    const handler = setTimeout(() => {
      setRequestParams(prev => ({ ...prev, filtroNombre: filtroNombre, pageNumber: 1 }));
    }, 500);
    return () => clearTimeout(handler);
  }, [filtroNombre]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<ClienteDto | null>(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...requestParams,
        filtroNombre: requestParams.filtroNombre || undefined,
        filtroCuitRuc: requestParams.filtroCuitRuc || undefined,
        filtroTipoCliente: requestParams.filtroTipoCliente,
      };
      const response = await apiClient.get<PagedResultDto<ClienteDto>>('/api/clientes', { params });
      setPagedResult(response.data);
    } catch (err: any) {
      setError("Error al cargar los Clientes.");
    } finally {
      setLoading(false);
    }
  }, [requestParams]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);
  
  const handleOpenCreateModal = () => {
    setClienteAEditar(null);
    setShowModal(true);
  };
  
  const handleOpenEditModal = (cliente: ClienteDto) => {
    setClienteAEditar(cliente);
    setShowModal(true);
  };

  const handleDelete = (clienteId: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente "${nombre}"? Esta acción no se puede deshacer.`)) {
      apiClient.delete(`/api/clientes/${clienteId}`)
        .then(() => {
            fetchClientes(); // Recargamos los datos desde el servidor
        })
        .catch(err => setError(err.response?.data?.message || 'Error al eliminar el cliente.'));
    }
  };
  
  const handleSuccessModal = () => {
    setShowModal(false);
    fetchClientes();
  };
  
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
  
  const handlePageChange = (page: number) => {
    setRequestParams(prev => ({ ...prev, pageNumber: page }));
  };

  if (loading && !pagedResult) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>;

  return (
    <>
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}><h1 className="h4 mb-0">Clientes</h1></Col>
            <Col md={6} className="d-flex justify-content-end">
                {tienePermiso(Permisos.CrearClientes) && (
                    <Button variant="primary" onClick={handleOpenCreateModal}>
                        <PlusCircle className="me-2"/>Nuevo Cliente
                    </Button>
                )}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <div className="p-3 mb-4 border rounded bg-light">
            <Row className="g-3 align-items-end">
              <Col md={6}>
                  <Form.Group>
                      <Form.Label className="fw-bold">Buscar por Nombre</Form.Label>
                      <Form.Control type="text" placeholder="Filtrar por nombre..." value={filtroNombre} onChange={e => setFiltroNombre(e.target.value)} />
                  </Form.Group>
              </Col>
              <Col md={4}>
                  <Form.Group>
                      <Form.Label>Filtrar por Tipo</Form.Label>
                      <Form.Select 
                          value={requestParams.filtroTipoCliente ?? ""}
                          onChange={e => setRequestParams(prev => ({...prev, filtroTipoCliente: e.target.value ? Number(e.target.value) as TipoClienteEnum : undefined, pageNumber: 1}))}>
                          <option value="">Todos</option>
                          <option value={TipoClienteEnum.Empresa}>Empresa</option>
                          <option value={TipoClienteEnum.PersonaIndividual}>Persona</option>
                      </Form.Select>
                  </Form.Group>
              </Col>
            </Row>
          </div>
          
          {loading && <div className="text-center p-3"><Spinner animation="border" size="sm" /></div>}

          <Table striped bordered hover responsive>
            <thead className="table-light">
              <tr>
                <th onClick={() => handleSort('nombreCliente')} style={{ cursor: 'pointer' }}>Nombre {getSortIcon('nombreCliente')}</th>
                <th onClick={() => handleSort('tipoCliente')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipoCliente')}</th>
                <th onClick={() => handleSort('cuit_RUC')} style={{ cursor: 'pointer' }}>CUIT/RUC {getSortIcon('cuit_RUC')}</th>
                <th>Email Principal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedResult && pagedResult.items.map(cliente => (
                <tr key={cliente.clienteID}>
                  <td>
                    <Link to={`/clientes/${cliente.clienteID}`}>{cliente.nombreCliente}</Link>
                  </td>
                  <td><Badge bg={cliente.tipoCliente === 1 ? 'primary' : 'secondary'}>{cliente.tipoCliente === 1 ? 'Empresa' : 'Persona'}</Badge></td>
                  <td>{cliente.cuiT_RUC || 'N/A'}</td>
                  <td>{cliente.emailPrincipal || 'N/A'}</td>
                  <td className="text-center">
                    {tienePermiso(Permisos.EditarClientes) && (
                        <Button variant="outline-warning" size="sm" className="me-2" onClick={() => handleOpenEditModal(cliente)}><PencilSquare/></Button>
                    )}
                    {tienePermiso(Permisos.EliminarClientes) && (
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.clienteID, cliente.nombreCliente)}><Trash3/></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {pagedResult && pagedResult.items.length === 0 && !loading && (
              <p className="text-center text-muted mt-3">No se encontraron clientes que coincidan con los filtros.</p>
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
      
      <ModalCrearEditarCliente
        show={showModal}
        handleClose={() => setShowModal(false)}
        onSuccess={handleSuccessModal}
        clienteAEditar={clienteAEditar}
      />
    </>
  );
};

export default ClientesListPage;