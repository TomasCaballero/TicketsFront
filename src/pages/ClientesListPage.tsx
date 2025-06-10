import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { Permisos } from '../constants/permisos';
import { useSortableData } from '../hooks/useSortableData';
import { Button, Card, Spinner, Alert, Table, Badge, Form, InputGroup, Col, Row } from 'react-bootstrap';
import { PencilSquare, Trash3, PlusCircle, SortAlphaDown, SortAlphaUp } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import type { ClienteDto } from '../types/clientes';
import ModalCrearEditarCliente from '../components/clientes/ModalCrearEditarCliente';

const ClientesListPage: React.FC = () => {
  const [clientes, setClientes] = useState<ClienteDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { tienePermiso } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [clienteAEditar, setClienteAEditar] = useState<ClienteDto | null>(null);

  const filteredClients = useMemo(() => {
    return clientes.filter(cliente =>
      cliente.nombreCliente.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientes, searchTerm]);

  const { sortedItems, requestSort, sortConfig } = useSortableData(filteredClients, { key: 'nombreCliente', direction: 'ascending' });
  
  const fetchClientes = () => {
    setLoading(true);
    apiClient.get<ClienteDto[]>('/api/clientes')
      .then(response => {
        setClientes(response.data);
      })
      .catch(err => {
        setError("Error al cargar los Clientes.");
      })
      .finally(() => setLoading(false));
  };
  
  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenCreateModal = () => {
    setClienteAEditar(null);
    setShowModal(true);
  };
  
  const handleOpenEditModal = (cliente: ClienteDto) => {
    setClienteAEditar(cliente);
    setShowModal(true);
  };

  const handleDelete = (clienteId: string) => {
    if (window.confirm("¿Estás seguro? Esta acción no se puede deshacer.")) {
      apiClient.delete(`/api/clientes/${clienteId}`)
        .then(() => {
            setClientes(prev => prev.filter(c => c.clienteID !== clienteId));
        })
        .catch(err => setError(err.response?.data?.message || 'Error al eliminar el cliente.'));
    }
  };
  
  const handleSuccessModal = () => {
    setShowModal(false);
    fetchClientes();
  };

  const getSortIcon = (key: keyof ClienteDto) => { 
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <SortAlphaDown className="ms-1" /> : <SortAlphaUp className="ms-1" />;
  };

  if (loading) return <div className="text-center p-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>;

  return (
    <>
      <Card>
        <Card.Header>
          <Row className="align-items-center">
            <Col md={6}><h1 className="h4 mb-0">Clientes</h1></Col>
            <Col md={6} className="d-flex justify-content-end">
                {tienePermiso(Permisos.CrearClientes) && (
                    <Button variant="primary" onClick={handleOpenCreateModal}><PlusCircle className="me-2"/>Nuevo Cliente</Button>
                )}
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <Form.Group as={Col} md={4} className="mb-3">
            <InputGroup>
              <InputGroup.Text>Buscar</InputGroup.Text>
              <Form.Control type="text" placeholder="Filtrar por nombre..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </InputGroup>
          </Form.Group>
          
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th onClick={() => requestSort('nombreCliente')} style={{ cursor: 'pointer' }}>Nombre {getSortIcon('nombreCliente')}</th>
                <th onClick={() => requestSort('tipoCliente')} style={{ cursor: 'pointer' }}>Tipo {getSortIcon('tipoCliente')}</th>
                <th>CUIT/RUC</th>
                <th>Email Principal</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map(cliente => (
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
                        <Button variant="outline-danger" size="sm" onClick={() => handleDelete(cliente.clienteID)}><Trash3/></Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
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