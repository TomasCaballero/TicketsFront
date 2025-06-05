import React, { useState, useEffect, type FormEvent, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type {
  CrearTicketSoporteDto,
  CrearTicketDesarrolloDto,
} from '../types/tickets';
import type { UsuarioSimpleDto } from '../types/auth';
import { PrioridadTicketEnum, TipoClienteEnum } from '../types/tickets';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Select, { type MultiValue } from 'react-select';
import InputGroup from 'react-bootstrap/InputGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Modal from 'react-bootstrap/Modal';
import { Paperclip, PlusCircle, Trash3, Eye as EyeIcon } from 'react-bootstrap-icons';

// Importar los componentes de modal
import ModalSubirAdjunto from '../components/ModalSubirAdjunto';
import ModalPrevisualizarAdjunto from '../components/ModalPrevisualizarAdjunto';
import type { AdjuntoSimpleDto } from '../types/tickets';

type TicketType = 'Soporte' | 'Desarrollo';

interface SelectOption {
  value: string;
  label: string;
}

interface ContactoParaClienteDto {
  contactoID: string;
  nombre: string;
  apellido: string;
  email: string;
}
interface ClienteParaSelectorDto {
  clienteID: string;
  nombreCliente: string;
  tipoCliente: TipoClienteEnum;
  contactos?: ContactoParaClienteDto[];
  cuit_RUC?: string;
}
interface CentroDeCostoParaSelectorDto {
  centroDeCostoID: string;
  nombre: string;
}

const CrearTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuarioActual } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicketEnum>(PrioridadTicketEnum.MEDIA);
  const [ticketType, setTicketType] = useState<TicketType>('Soporte');

  const [searchTermCliente, setSearchTermCliente] = useState('');
  const [selectedCliente, setSelectedCliente] = useState<ClienteParaSelectorDto | null>(null);
  const [clienteIdManual, setClienteIdManual] = useState('');
  const [showCrearClienteModal, setShowCrearClienteModal] = useState(false);

  const [contactoId, setContactoId] = useState('');

  const [searchTermCentroDeCosto, setSearchTermCentroDeCosto] = useState('');
  const [selectedCentroDeCosto, setSelectedCentroDeCosto] = useState<CentroDeCostoParaSelectorDto | null>(null);
  const [centroDeCostoIdManual, setCentroDeCostoIdManual] = useState('');
  const [showCrearCentroDeCostoModal, setShowCrearCentroDeCostoModal] = useState(false);

  const [usuarioResponsableId, setUsuarioResponsableId] = useState('');
  const [selectedParticipantes, setSelectedParticipantes] = useState<MultiValue<SelectOption>>([]);

  const [fechaInicioPlanificada, setFechaInicioPlanificada] = useState('');
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>('');

  const [archivos, setArchivos] = useState<FileList | null>(null);

  const [clientes, setClientes] = useState<ClienteParaSelectorDto[]>([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState<CentroDeCostoParaSelectorDto[]>([]);
  // Estado para los usuarios que se pueden asignar (ya filtrados por rol desde el backend)
  const [usuariosParaAsignar, setUsuariosParaAsignar] = useState<UsuarioSimpleDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true); // Para datos iniciales (clientes, CC)
  const [isUsuariosLoading, setIsUsuariosLoading] = useState<boolean>(true); // Para la carga de usuarios por rol
  const [error, setError] = useState<string | null>(null);

  const [adjuntos, setAdjuntos] = useState<AdjuntoSimpleDto[]>([]);
  const [showSubirAdjuntoModal, setShowSubirAdjuntoModal] = useState<boolean>(false);
  const [showPrevisualizarAdjuntoModal, setShowPrevisualizarAdjuntoModal] = useState<boolean>(false);
  const [adjuntoSeleccionado, setAdjuntoSeleccionado] = useState<AdjuntoSimpleDto | null>(null);

  // Carga inicial de Clientes y Centros de Costo
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setIsDataLoading(true); // Este estado es para la carga general de la página
      setError(null);
      try {
        const [clientesRes, centrosRes] = await Promise.all([
          apiClient.get<ClienteParaSelectorDto[]>('/api/clientes'),
          apiClient.get<CentroDeCostoParaSelectorDto[]>('/api/centrosdecosto'),
        ]);
        setClientes(clientesRes.data);
        setCentrosDeCosto(centrosRes.data);
      } catch (err) {
        console.error("Error cargando datos iniciales:", err);
        setError("No se pudieron cargar los datos necesarios para crear el ticket (clientes/CC). Intente recargar la página.");
      } finally {
        setIsDataLoading(false);
      }
    };
    cargarDatosIniciales();
  }, []);

  // Carga de usuarios según el tipo de ticket seleccionado
  useEffect(() => {
    const cargarUsuariosPorRol = async () => {
      if (!ticketType) {
        setUsuariosParaAsignar([]);
        return;
      }
      setIsUsuariosLoading(true); // Estado específico para la carga de usuarios
      // No limpiar el error general aquí, podría haber uno de la carga inicial

      let endpoint = '';
      if (ticketType === 'Soporte') {
        endpoint = '/api/usuarios/soporte';
      } else if (ticketType === 'Desarrollo') {
        endpoint = '/api/usuarios/desarrolladores';
      } else {
        setUsuariosParaAsignar([]);
        setIsUsuariosLoading(false);
        return;
      }

      try {
        const usuariosRes = await apiClient.get<UsuarioSimpleDto[]>(endpoint);
        setUsuariosParaAsignar(usuariosRes.data);
      } catch (err) {
        console.error(`Error cargando usuarios para ${ticketType}:`, err);
        setError(`No se pudieron cargar los usuarios de ${ticketType}.`);
        setUsuariosParaAsignar([]);
      } finally {
        setIsUsuariosLoading(false);
      }
    };

    cargarUsuariosPorRol();
    // Resetear selecciones de usuario al cambiar tipo de ticket
    setUsuarioResponsableId('');
    setSelectedParticipantes([]);
  }, [ticketType]); // Depende de ticketType

  // Opciones para los selectores de react-select, basadas en usuariosParaAsignar
  const opcionesUsuariosParaAsignar: SelectOption[] = useMemo(() =>
    usuariosParaAsignar.map(u => ({ value: u.id, label: u.nombreCompleto || u.username }))
    , [usuariosParaAsignar]);

  const filteredClientes = useMemo(() => {
    if (!searchTermCliente) return [];
    return clientes.filter(c =>
      c.nombreCliente.toLowerCase().includes(searchTermCliente.toLowerCase()) ||
      (c.cuit_RUC && c.cuit_RUC.includes(searchTermCliente))
    ).slice(0, 5);
  }, [searchTermCliente, clientes]);

  const filteredCentrosDeCosto = useMemo(() => {
    if (!searchTermCentroDeCosto) return [];
    return centrosDeCosto.filter(cdc =>
      cdc.nombre.toLowerCase().includes(searchTermCentroDeCosto.toLowerCase())
    ).slice(0, 5);
  }, [searchTermCentroDeCosto, centrosDeCosto]);

  const handleNuevoAdjuntoAgregado = (nuevoAdjunto: AdjuntoSimpleDto) => {
    setAdjuntos(prev => [...prev, nuevoAdjunto]);
    setShowSubirAdjuntoModal(false);
  };

  // Función para abrir modal de previsualización
  const handleAbrirModalPrevisualizacion = (adjunto: AdjuntoSimpleDto) => {
    setAdjuntoSeleccionado(adjunto);
    setShowPrevisualizarAdjuntoModal(true);
  };

  // Función para cerrar modal de previsualización
  const handleCerrarModalPrevisualizacion = () => {
    setShowPrevisualizarAdjuntoModal(false);
    setAdjuntoSeleccionado(null);
  };

  // Función para eliminar adjunto
  const handleEliminarAdjunto = (adjuntoIdAEliminar: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este adjunto?")) {
      setAdjuntos(prev => prev.filter(adj => adj.adjuntoID !== adjuntoIdAEliminar));
    }
  };

  const handleClienteSelect = (cliente: ClienteParaSelectorDto) => {
    setSelectedCliente(cliente);
    setSearchTermCliente(cliente.nombreCliente);
    setClienteIdManual(cliente.clienteID);
    setContactoId('');
  };

  const handleCentroDeCostoSelect = (cdc: CentroDeCostoParaSelectorDto) => {
    setSelectedCentroDeCosto(cdc);
    setSearchTermCentroDeCosto(cdc.nombre);
    setCentroDeCostoIdManual(cdc.centroDeCostoID);
  };

  const validarFechasDesarrollo = (): string | null => {
    if (ticketType === 'Desarrollo' && fechaInicioPlanificada && fechaFinPlanificada) {
      const fechaInicio = new Date(fechaInicioPlanificada);
      const fechaFin = new Date(fechaFinPlanificada);
      if (fechaInicio >= fechaFin) {
        return 'La fecha de inicio planificada debe ser anterior a la fecha de fin planificada.';
      }
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!usuarioActual) {
      setError("No se pudo identificar al usuario creador. Por favor, inicie sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }
    if (!selectedCliente && !clienteIdManual) {
      setError("Debe seleccionar un cliente.");
      setIsSubmitting(false);
      return;
    }
    if (selectedCliente && selectedCliente.tipoCliente === TipoClienteEnum.Empresa && !contactoId) {
      setError("Debe seleccionar un contacto para el cliente empresa.");
      setIsSubmitting(false);
      return;
    }

    const errorFechas = validarFechasDesarrollo();
    if (errorFechas) {
      setError(errorFechas);
      setIsSubmitting(false);
      return;
    }

    const participantesIds = selectedParticipantes.map(p => p.value);
    const finalClienteId = selectedCliente ? selectedCliente.clienteID : clienteIdManual;


    const baseData = {
      titulo,
      descripcion,
      prioridad: Number(prioridad) as PrioridadTicketEnum,
      clienteID: finalClienteId,
      contactoID: contactoId || undefined,
      centroDeCostoID: (selectedCentroDeCosto ? selectedCentroDeCosto.centroDeCostoID : centroDeCostoIdManual) || undefined,
      usuarioResponsableID: usuarioResponsableId || undefined,
      participantesIds: participantesIds.length > 0 ? participantesIds : undefined,
      adjuntosIds: adjuntos.length > 0 ? adjuntos.map(a => a.adjuntoID) : undefined, // Agregar IDs de adjuntos
    };

    try {
      let response;
      let ticketCreadoId = null;

      if (ticketType === 'Soporte') {
        const data: CrearTicketSoporteDto = {
          ...baseData,
        };
        response = await apiClient.post<{ ticketID: string }>('/api/tickets/soporte', data);
        ticketCreadoId = response.data.ticketID;
      } else {
        const data: CrearTicketDesarrolloDto = {
          ...baseData,
          fechaInicioPlanificada: fechaInicioPlanificada || undefined,
          fechaFinPlanificada: fechaFinPlanificada || undefined,
          horasEstimadas: horasEstimadas === '' ? undefined : parseFloat(horasEstimadas),
        };
        response = await apiClient.post<{ ticketID: string }>('/api/tickets/desarrollo', data);
        ticketCreadoId = response.data.ticketID;
      }
      alert(`Ticket creado con ID: ${ticketCreadoId}${adjuntos.length > 0 ? ` con ${adjuntos.length} adjunto(s)` : ''}`);
      navigate('/tickets');
      console.log('Ticket creado:', response.data);

      if (ticketCreadoId && archivos && archivos.length > 0) {
        console.log(`Ticket ${ticketCreadoId} creado. Archivos para subir:`, archivos);
        alert(`Ticket creado con ID: ${ticketCreadoId}. La subida de ${archivos.length} archivo(s) se debe implementar.`);
      } else {
        alert(`Ticket creado con ID: ${ticketCreadoId}.`);
      }

      navigate('/tickets');
    } catch (err: any) {
      console.error("Error al crear ticket:", err);
      if (err.response) {
        const status = err.response.status;
        const apiError = err.response.data;
        let errorMessage = `Error del servidor (${status}). Intente nuevamente.`;
        if (apiError) {
          if (typeof apiError === 'string') errorMessage = apiError;
          else if (apiError.message) errorMessage = apiError.message;
          else if (apiError.Message) errorMessage = apiError.Message;
          else if (apiError.mensaje) errorMessage = apiError.mensaje;
          else if (apiError.errors) {
            errorMessage = Object.values(apiError.errors).flat().join('\n');
          }
        }
        setError(errorMessage);
      } else if (err.request) {
        setError('Error de conexión. Verifique su conexión a internet e intente nuevamente.');
      } else {
        setError('Error inesperado. Por favor, intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDataLoading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fs-5">Cargando datos del formulario...</p>
      </Container>
    );
  }

  const prioridadOptions = Object.entries(PrioridadTicketEnum)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => ({ value: value as PrioridadTicketEnum, label: key.replace(/_/g, ' ') }));

  const contactosDelClienteSeleccionado: ContactoParaClienteDto[] =
    selectedCliente && selectedCliente.tipoCliente === TipoClienteEnum.Empresa && selectedCliente.contactos
      ? selectedCliente.contactos
      : [];

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white p-3">
          <h1 className="h4 mb-0">Crear Nuevo Ticket</h1>
        </Card.Header>
        <Card.Body className="p-lg-4 p-3">
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <h5 className="mb-3 mt-2 text-primary">Información Principal del Ticket</h5>
              </Col>
              <Col md={6}>
                <h5 className="mb-3 mt-2 text-primary">Asociaciones y Responsables</h5>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="ticketType">
                      <Form.Label>Tipo de Ticket *</Form.Label>
                      <Form.Select
                        value={ticketType}
                        onChange={(e) => {
                          setTicketType(e.target.value as TicketType);
                          // El useEffect [ticketType] se encargará de resetear y cargar usuarios
                        }}
                        required
                        disabled={isSubmitting}
                      >
                        <option value="Soporte">Soporte</option>
                        <option value="Desarrollo">Desarrollo</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="prioridad">
                      <Form.Label>Prioridad *</Form.Label>
                      <Form.Select value={prioridad} onChange={(e) => setPrioridad(Number(e.target.value) as PrioridadTicketEnum)} required disabled={isSubmitting}>
                        {prioridadOptions.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>


                <Form.Group className="mb-3" controlId="titulo">
                  <Form.Label>Título *</Form.Label>
                  <Form.Control type="text" placeholder="Ej: Problema con inicio de sesión" value={titulo} onChange={(e) => setTitulo(e.target.value)} required disabled={isSubmitting} />
                </Form.Group>

                <Form.Group className="mb-4" controlId="descripcion">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control as="textarea" rows={4} placeholder="Detalles del problema o tarea..." value={descripcion} onChange={(e) => setDescripcion(e.target.value)} disabled={isSubmitting} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3" controlId="clienteBusqueda">
                  <Form.Label>Cliente *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Buscar cliente por nombre o CUIT/RUC..."
                      value={searchTermCliente}
                      onChange={(e) => {
                        setSearchTermCliente(e.target.value);
                        setSelectedCliente(null);
                        setClienteIdManual('');
                        setContactoId('');
                      }}
                      disabled={isSubmitting}
                    />
                    <Button variant="outline-success" onClick={() => {
                      setShowCrearClienteModal(true);
                      console.log("Abrir modal para crear cliente");
                    }} disabled={isSubmitting}>
                      Nuevo Cliente
                    </Button>
                  </InputGroup>
                  {searchTermCliente && filteredClientes.length > 0 && (
                    <ListGroup className="mt-1" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', zIndex: 1000, width: 'calc(100% - 2.5rem)' }}>
                      {filteredClientes.map(c => (
                        <ListGroup.Item action key={c.clienteID} onClick={() => handleClienteSelect(c)}>
                          {c.nombreCliente} {c.cuit_RUC && `(${c.cuit_RUC})`}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {selectedCliente && <small className="form-text text-muted">Cliente seleccionado: {selectedCliente.nombreCliente}</small>}
                </Form.Group>

                {selectedCliente && selectedCliente.tipoCliente === TipoClienteEnum.Empresa && (
                  <Form.Group className="mb-3" controlId="contactoId">
                    <Form.Label>Contacto del Cliente {contactosDelClienteSeleccionado.length > 0 ? '*' : '(Opcional, no hay contactos)'}</Form.Label>
                    <Form.Select
                      value={contactoId}
                      onChange={(e) => setContactoId(e.target.value)}
                      required={contactosDelClienteSeleccionado.length > 0}
                      disabled={isSubmitting || contactosDelClienteSeleccionado.length === 0}
                    >
                      <option value="">{contactosDelClienteSeleccionado.length > 0 ? "Seleccione un contacto..." : "No hay contactos para este cliente"}</option>
                      {contactosDelClienteSeleccionado.map(con => (
                        <option key={con.contactoID} value={con.contactoID}>
                          {`${con.nombre} ${con.apellido} (${con.email})`}
                        </option>
                      ))}
                    </Form.Select>
                    {selectedCliente.tipoCliente === TipoClienteEnum.Empresa && contactosDelClienteSeleccionado.length === 0 && <small className="form-text text-warning">Este cliente empresa no tiene contactos. Puede agregarle contactos editando el cliente.</small>}
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="centroDeCostoBusqueda">
                  <Form.Label>Centro de Costo (Opcional)</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Buscar centro de costo..."
                      value={searchTermCentroDeCosto}
                      onChange={(e) => {
                        setSearchTermCentroDeCosto(e.target.value);
                        setSelectedCentroDeCosto(null);
                        setCentroDeCostoIdManual('');
                      }}
                      disabled={isSubmitting}
                    />
                    <Button variant="outline-success" onClick={() => {
                      setShowCrearCentroDeCostoModal(true);
                      console.log("Abrir modal para crear centro de costo");
                    }} disabled={isSubmitting}>
                      Nuevo CC
                    </Button>
                  </InputGroup>
                  {searchTermCentroDeCosto && filteredCentrosDeCosto.length > 0 && (
                    <ListGroup className="mt-1" style={{ maxHeight: '150px', overflowY: 'auto', position: 'absolute', zIndex: 999, width: 'calc(100% - 2.5rem)' }}>
                      {filteredCentrosDeCosto.map(cdc => (
                        <ListGroup.Item action key={cdc.centroDeCostoID} onClick={() => handleCentroDeCostoSelect(cdc)}>
                          {cdc.nombre}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                  {selectedCentroDeCosto && <small className="form-text text-muted">Centro de Costo: {selectedCentroDeCosto.nombre}</small>}
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="usuarioResponsableId">
                      <Form.Label>Usuario Responsable (Opcional)</Form.Label>
                      <Form.Select
                        value={usuarioResponsableId}
                        onChange={(e) => setUsuarioResponsableId(e.target.value)}
                        disabled={isSubmitting || isUsuariosLoading || opcionesUsuariosParaAsignar.length === 0}
                      >
                        <option value="">
                          {isUsuariosLoading ? 'Cargando usuarios...' :
                            opcionesUsuariosParaAsignar.length === 0 ? `No hay usuarios ${ticketType === 'Soporte' ? 'de Soporte' : 'Desarrolladores'}` : 'Ninguno'}
                        </option>
                        {opcionesUsuariosParaAsignar.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-4" controlId="participantesIds">
                      <Form.Label>Participantes (Opcional)</Form.Label>
                      <Select
                        isMulti
                        options={opcionesUsuariosParaAsignar}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder={isUsuariosLoading ? 'Cargando...' : opcionesUsuariosParaAsignar.length === 0 ? `No hay usuarios ${ticketType === 'Soporte' ? 'de Soporte' : 'Desarrolladores'}` : 'Seleccione...'}
                        onChange={(s) => setSelectedParticipantes(s as MultiValue<SelectOption>)}
                        value={selectedParticipantes}
                        isDisabled={isSubmitting || isUsuariosLoading || opcionesUsuariosParaAsignar.length === 0}
                        isClearable
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Col>
            </Row>

            <hr />

            <Row>
              <Row>
                {ticketType === 'Desarrollo' && (
                  <Col md={6}>
                    <h5 className="mb-3 mt-4 text-primary">Detalles de Desarrollo</h5>
                  </Col>
                )}
                <Col md={ticketType === 'Desarrollo' ? 6 : 12}>
                  <h5 className="mb-3 text-primary">Adjuntos</h5>
                </Col>
              </Row>

              {ticketType === 'Desarrollo' && (
                <Col md={6}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="fechaInicioPlanificada">
                        <Form.Label>Fecha Inicio Planificada</Form.Label>
                        <Form.Control type="date" value={fechaInicioPlanificada} onChange={(e) => setFechaInicioPlanificada(e.target.value)} disabled={isSubmitting} />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3" controlId="fechaFinPlanificada">
                        <Form.Label>Fecha Fin Planificada</Form.Label>
                        <Form.Control type="date" value={fechaFinPlanificada} onChange={(e) => setFechaFinPlanificada(e.target.value)} disabled={isSubmitting} />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="mb-4" controlId="horasEstimadas">
                    <Form.Label>Horas Estimadas</Form.Label>
                    <Form.Control type="number" placeholder="Ej: 8.5" value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)} step="0.1" min="0" disabled={isSubmitting} />
                  </Form.Group>
                </Col>
              )}

              <Col md={ticketType === 'Desarrollo' ? 6 : 12}>
                <Card className="mb-4">
                  <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-dark"><Paperclip size={20} className="me-2" />Adjuntos ({adjuntos.length})</h5>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => setShowSubirAdjuntoModal(true)}
                      disabled={isSubmitting}
                    >
                      <PlusCircle size={18} className="me-1" /> Subir Nuevo Adjunto
                    </Button>
                  </Card.Header>
                  {adjuntos.length > 0 ? (
                    <ListGroup variant="flush">
                      {adjuntos.map(adjunto => (
                        <ListGroup.Item key={adjunto.adjuntoID} className="p-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <Button
                                variant="link"
                                className="p-0 fw-medium me-2"
                                onClick={() => handleAbrirModalPrevisualizacion(adjunto)}
                                title={`Ver ${adjunto.nombreArchivo}`}
                              >
                                <EyeIcon size={16} className="me-1" /> {adjunto.nombreArchivo}
                              </Button>
                              <span className="text-muted text-sm">({adjunto.tamanoArchivoKB.toFixed(2)} KB)</span>
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="p-1"
                              title="Eliminar Adjunto"
                              onClick={() => handleEliminarAdjunto(adjunto.adjuntoID)}
                              disabled={isSubmitting}
                            >
                              <Trash3 size={16} />
                            </Button>
                          </div>
                          {adjunto.descripcion && (
                            <p className="text-muted text-sm mt-1 mb-0 ms-3 ps-1 border-start border-2">
                              {adjunto.descripcion}
                            </p>
                          )}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Card.Body>
                      <p className="text-muted mb-0">No hay adjuntos para este ticket.</p>
                    </Card.Body>
                  )}
                </Card>
              </Col>
            </Row>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => navigate('/tickets')} disabled={isSubmitting} className="me-md-2">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting || isDataLoading || isUsuariosLoading} style={{ minWidth: '150px' }}>
                {isSubmitting ? (
                  <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Creando...</>
                ) : ('Crear Ticket')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={showCrearClienteModal} onHide={() => setShowCrearClienteModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Cliente</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Aquí iría el formulario para crear un nuevo cliente (Empresa/Persona) y sus contactos.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCrearClienteModal(false)}>Cerrar</Button>
          <Button variant="primary" onClick={() => { setShowCrearClienteModal(false); }}>Guardar Cliente</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showCrearCentroDeCostoModal} onHide={() => setShowCrearCentroDeCostoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Crear Nuevo Centro de Costo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Aquí iría el formulario para crear un nuevo centro de costo.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCrearCentroDeCostoModal(false)}>Cerrar</Button>
          <Button variant="primary" onClick={() => { setShowCrearCentroDeCostoModal(false); }}>Guardar Centro de Costo</Button>
        </Modal.Footer>
      </Modal>

      <ModalSubirAdjunto
        show={showSubirAdjuntoModal}
        handleClose={() => setShowSubirAdjuntoModal(false)}
        onAdjuntoAgregado={handleNuevoAdjuntoAgregado}
      />

      <ModalPrevisualizarAdjunto
        show={showPrevisualizarAdjuntoModal}
        handleClose={handleCerrarModalPrevisualizacion}
        adjunto={adjuntoSeleccionado}
      />
    </>
  );
};

export default CrearTicketPage;