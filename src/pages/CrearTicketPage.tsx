// src/pages/CrearTicketPage.tsx
import React, { useState, useEffect, useMemo, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type { CrearTicketSoporteDto, CrearTicketDesarrolloDto } from '../types/tickets';
import type { UsuarioSimpleDto } from '../types/auth';
import { PrioridadTicketEnum, TipoClienteEnum } from '../types/tickets';
import type { ClienteParaSelectorDto as ClienteParaSelectorDtoBase } from '../types/clientes';
import { Editor } from '@tinymce/tinymce-react';

// Extend the type locally to include cuit_RUC if missing in the imported type
interface ClienteParaSelectorDto extends ClienteParaSelectorDtoBase {
  cuit_RUC?: string;
}

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
import ModalCrearCliente from '../components/ModalCrearCliente';
import ModalCrearContacto from '../components/ModalCrearContacto';
import ModalAnadirAdjunto from '../components/ModalAnadirAdjunto'; // <-- Usar el nuevo modal
import { Modal } from 'react-bootstrap';
import { Paperclip, Trash3, PlusCircle } from 'react-bootstrap-icons';
import Image from 'react-bootstrap/Image';
import ModalCrearEditarCentroDeCosto from '../components/centros-costo/ModalCrearEditarCentroDeCosto';


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
interface CentroDeCostoParaSelectorDto {
  centroDeCostoID: string;
  nombre: string;
}

// --- NUEVO TIPO PARA MANEJAR ARCHIVOS LOCALMENTE ---
interface ArchivoLocal {
  id: string; // Un ID temporal para el manejo de la lista
  file: File;
  descripcion: string;
  previewUrl?: string; // URL para previsualización de imágenes
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
  const [showCrearClienteModal, setShowCrearClienteModal] = useState(false);
  const [contactoId, setContactoId] = useState('');

  const [searchTermCentroDeCosto, setSearchTermCentroDeCosto] = useState('');
  const [selectedCentroDeCosto, setSelectedCentroDeCosto] = useState<CentroDeCostoParaSelectorDto | null>(null);
  const [showCrearCentroDeCostoModal, setShowCrearCentroDeCostoModal] = useState(false);

  const [usuarioResponsableId, setUsuarioResponsableId] = useState('');
  const [selectedParticipantes, setSelectedParticipantes] = useState<MultiValue<SelectOption>>([]);

  const [fechaInicioPlanificada, setFechaInicioPlanificada] = useState('');
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>('');

  const [archivosParaSubir, setArchivosParaSubir] = useState<ArchivoLocal[]>([]);
  const [showAnadirAdjuntoModal, setShowAnadirAdjuntoModal] = useState(false);

  const [clientes, setClientes] = useState<ClienteParaSelectorDto[]>([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState<CentroDeCostoParaSelectorDto[]>([]);
  const [usuariosParaAsignar, setUsuariosParaAsignar] = useState<UsuarioSimpleDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [isUsuariosLoading, setIsUsuariosLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showCrearContactoModal, setShowCrearContactoModal] = useState(false);

  const [isClienteInputFocused, setIsClienteInputFocused] = useState(false);
  const [isCentroCostoInputFocused, setIsCentroCostoInputFocused] = useState(false);

  const { state: locationState } = useLocation();
  const [isCentroCostoLocked, setIsCentroCostoLocked] = useState(false);

  useEffect(() => {
    return () => {
      archivosParaSubir.forEach(archivo => {
        if (archivo.previewUrl) {
          URL.revokeObjectURL(archivo.previewUrl);
        }
      });
    };
  }, [archivosParaSubir]);

  useEffect(() => {
    const cargarDatosGenerales = async () => {
      setIsDataLoading(true);
      try {
        const [clientesRes, centrosRes] = await Promise.all([
          apiClient.get<ClienteParaSelectorDto[]>('/api/clientes'),
          apiClient.get<CentroDeCostoParaSelectorDto[]>('/api/centrosdecosto'),
        ]);
        setClientes(clientesRes.data);
        setCentrosDeCosto(centrosRes.data);
      } catch (err) {
        console.error("Error cargando datos generales:", err);
        setError("No se pudieron cargar los datos necesarios (clientes/CC).");
      } finally {
        setIsDataLoading(false);
      }
    };
    cargarDatosGenerales();
  }, []);

  useEffect(() => {
    const cargarUsuariosPorRol = async () => {
      if (!ticketType) {
        setUsuariosParaAsignar([]);
        return;
      }
      setIsUsuariosLoading(true);
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
      } catch (err: any) {
        console.error(`Error cargando usuarios para ${ticketType}:`, err);
        setUsuariosParaAsignar([]);
      } finally {
        setIsUsuariosLoading(false);
      }
    };
    cargarUsuariosPorRol();
    setUsuarioResponsableId('');
    setSelectedParticipantes([]);
  }, [ticketType]);

  useEffect(() => {
    // Tipamos el estado recibido para seguridad
    const defaultData = locationState as { defaultCentroDeCosto?: { centroDeCostoID: string; nombre: string } };

    if (defaultData?.defaultCentroDeCosto) {
      const { centroDeCostoID, nombre } = defaultData.defaultCentroDeCosto;

      // Creamos un objeto que coincida con el tipo esperado por el selector
      const cdcSeleccionado = { centroDeCostoID, nombre };

      // Establecemos el estado para pre-seleccionar y bloquear el campo
      setSelectedCentroDeCosto(cdcSeleccionado);
      setSearchTermCentroDeCosto(nombre);
      setIsCentroCostoLocked(true);
    }
  }, [locationState]);

  const opcionesUsuariosParaAsignar: SelectOption[] = useMemo(() =>
    usuariosParaAsignar.map(u => ({ value: u.id, label: u.nombreCompleto || u.username || u.id }))
    , [usuariosParaAsignar]);

  const filteredClientes = useMemo(() => {
    // Caso 1: El usuario está escribiendo algo
    if (searchTermCliente) {
      return clientes.filter(c =>
        c.nombreCliente.toLowerCase().includes(searchTermCliente.toLowerCase()) ||
        (c.cuit_RUC && c.cuit_RUC.includes(searchTermCliente))
      ).slice(0, 10);
    }
    // Caso 2: El input está vacío pero tiene el foco
    if (isClienteInputFocused) {
      // Devolvemos los últimos 3 clientes de la lista como sugerencia
      return clientes.slice(-3);
    }
    // Caso 3: No hay foco ni texto, no mostrar nada
    return [];
  }, [searchTermCliente, clientes, isClienteInputFocused]);

  const filteredCentrosDeCosto = useMemo(() => {
    if (searchTermCentroDeCosto) {
      return centrosDeCosto.filter(cdc =>
        cdc.nombre.toLowerCase().includes(searchTermCentroDeCosto.toLowerCase())
      ).slice(0, 10);
    }
    if (isCentroCostoInputFocused) {
      return centrosDeCosto.slice(-3);
    }
    return [];
  }, [searchTermCentroDeCosto, centrosDeCosto, isCentroCostoInputFocused]);

  const handleClienteSelect = (cliente: ClienteParaSelectorDto) => {
    setSelectedCliente(cliente);
    setSearchTermCliente(cliente.nombreCliente);
    setContactoId('');
    setIsClienteInputFocused(false); // Ocultar la lista al seleccionar
  };
  const handleCentroDeCostoSelect = (cdc: CentroDeCostoParaSelectorDto) => {
    setSelectedCentroDeCosto(cdc);
    setSearchTermCentroDeCosto(cdc.nombre);
    setIsCentroCostoInputFocused(false); // Ocultar la lista al seleccionar
  };
  const handleClienteCreadoEnModal = (nuevoCliente: ClienteParaSelectorDto) => {
    setClientes(prevClientes => [...prevClientes, nuevoCliente].sort((a, b) => a.nombreCliente.localeCompare(b.nombreCliente)));
    handleClienteSelect(nuevoCliente);
  };

  const handleCentroDeCostoCreadoEnModal = (nuevoCentroDeCosto?: CentroDeCostoParaSelectorDto) => {
    if (!nuevoCentroDeCosto) return;
    setCentrosDeCosto(prev => [...prev, nuevoCentroDeCosto].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    handleCentroDeCostoSelect(nuevoCentroDeCosto);
    setShowCrearCentroDeCostoModal(false);
  };

  const handleContactoCreadoEnModal = (nuevoContacto: ContactoParaClienteDto) => {
    if (!selectedCliente) return;

    // Crear el nuevo cliente actualizado con el nuevo contacto
    const clienteActualizado: ClienteParaSelectorDto = {
      ...selectedCliente,
      contactos: [...(selectedCliente.contactos || []), nuevoContacto].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    };

    // Reemplazar el cliente viejo por el actualizado en la lista de clientes
    setClientes(prevClientes =>
      prevClientes.map(c => c.clienteID === clienteActualizado.clienteID ? clienteActualizado : c)
    );

    // Seleccionar el cliente actualizado
    setSelectedCliente(clienteActualizado);
    // Seleccionar el nuevo contacto en el dropdown
    setContactoId(nuevoContacto.contactoID);

    setShowCrearContactoModal(false); // Cerrar el modal
  };



  const validarFechasDesarrollo = (): string | null => {
    if (ticketType === 'Desarrollo' && fechaInicioPlanificada && fechaFinPlanificada) {
      if (new Date(fechaInicioPlanificada) >= new Date(fechaFinPlanificada)) {
        return 'La fecha de inicio planificada debe ser anterior a la fecha de fin planificada.';
      }
    }
    return null;
  };

  const handleAdjuntoAnadido = (file: File, descripcion: string) => {
    const nuevoAdjunto: ArchivoLocal = {
      id: `${file.name}-${file.lastModified}`,
      file,
      descripcion,
      previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    };
    setArchivosParaSubir(prev => [...prev, nuevoAdjunto]);
  };

  const handleRemoveFile = (idToRemove: string) => {
    setArchivosParaSubir(prev => {
      const archivoAEliminar = prev.find(a => a.id === idToRemove);
      if (archivoAEliminar?.previewUrl) {
        URL.revokeObjectURL(archivoAEliminar.previewUrl);
      }
      return prev.filter(a => a.id !== idToRemove)
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    if (!usuarioActual) {
      setError("No se pudo identificar al usuario creador."); setIsSubmitting(false); return;
    }
    if (!selectedCliente) {
      setError("Debe seleccionar un cliente."); setIsSubmitting(false); return;
    }
    if (selectedCliente.tipoCliente === TipoClienteEnum.Empresa && !contactoId) {
      setError("Debe seleccionar un contacto para el cliente empresa."); setIsSubmitting(false); return;
    }
    const errorFechas = validarFechasDesarrollo();
    if (errorFechas) {
      setError(errorFechas); setIsSubmitting(false); return;
    }

    const participantesIds = selectedParticipantes.map(p => p.value);

    const baseData = {
      titulo, descripcion, prioridad: Number(prioridad) as PrioridadTicketEnum, clienteID: selectedCliente.clienteID,
      contactoID: contactoId || undefined, centroDeCostoID: selectedCentroDeCosto?.centroDeCostoID,
      usuarioResponsableID: usuarioResponsableId || undefined, participantesIds: participantesIds.length > 0 ? participantesIds : undefined,
    };

    let ticketCreadoId: string | null = null;

    try {
      let response;
      if (ticketType === 'Soporte') {
        response = await apiClient.post<{ ticketID: string }>('/api/tickets/soporte', baseData as CrearTicketSoporteDto);
      } else {
        const data: CrearTicketDesarrolloDto = { ...baseData, fechaInicioPlanificada: fechaInicioPlanificada || undefined, fechaFinPlanificada: fechaFinPlanificada || undefined, horasEstimadas: horasEstimadas === '' ? undefined : parseFloat(horasEstimadas), };
        response = await apiClient.post<{ ticketID: string }>('/api/tickets/desarrollo', data);
      }
      ticketCreadoId = response.data.ticketID;

      if (ticketCreadoId && archivosParaSubir.length > 0) {
        setSuccessMessage(`Ticket ${ticketCreadoId} creado. Subiendo ${archivosParaSubir.length} adjunto(s)...`);
        const uploadPromises = archivosParaSubir.map(archivoLocal => {
          const formData = new FormData();
          formData.append('archivo', archivoLocal.file);
          if (archivoLocal.descripcion) {
            formData.append('descripcion', archivoLocal.descripcion);
          }
          return apiClient.post(`/api/adjuntos/ticket/${ticketCreadoId}`, formData);
        });
        await Promise.all(uploadPromises);
      }

      setSuccessMessage(`¡Ticket ${ticketCreadoId} creado exitosamente! Redirigiendo...`);
      setTimeout(() => navigate('/tickets'), 2000);

    } catch (err: any) {
      const errorMessage = ticketCreadoId
        ? `El ticket ${ticketCreadoId} se creó, pero falló la subida de adjuntos.`
        : (err.response?.data?.message || err.message || 'Error al crear el ticket.');
      setError(errorMessage);
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

  const prioridadOptions = Object.entries(PrioridadTicketEnum).filter(([, v]) => typeof v === 'number').map(([k, v]) => ({ value: v as PrioridadTicketEnum, label: k.replace(/_/g, ' ') }));
  const contactosDelClienteSeleccionado: ContactoParaClienteDto[] = selectedCliente?.tipoCliente === TipoClienteEnum.Empresa ? selectedCliente.contactos ?? [] : [];



  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white p-3"><h1 className="h4 mb-0">Crear Nuevo Ticket</h1></Card.Header>
        <Card.Body className="p-lg-4 p-3">
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={6}>
                <h5 className="mb-3 mt-2 text-primary">Información Principal</h5>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="ticketType">
                      <Form.Label>Tipo de Ticket *</Form.Label>
                      <Form.Select value={ticketType} onChange={(e) => setTicketType(e.target.value as TicketType)} required disabled={isSubmitting}>
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
                  <Editor
                    apiKey='4diy8fren78ukba5i30x08jzf50dazp3g1w70stpafjir4n1' // <-- Pega tu API Key aquí
                    value={descripcion}
                    onEditorChange={(content, editor) => setDescripcion(content)}
                    init={{
                      height: 250,
                      menubar: false,
                      plugins: [
                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                      ],
                      toolbar: 'undo redo | blocks | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                      content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                    }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <h5 className="mb-3 mt-2 text-primary">Asociaciones</h5>
                <Form.Group className="mb-3" controlId="clienteBusqueda">
                  <Form.Label>Cliente *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Buscar o hacer clic para ver recientes..."
                      value={searchTermCliente}
                      onChange={(e) => { setSearchTermCliente(e.target.value); setSelectedCliente(null); setContactoId(''); }}
                      onFocus={() => setIsClienteInputFocused(true)}
                      onBlur={() => setTimeout(() => setIsClienteInputFocused(false), 150)} // Delay para permitir el click
                      disabled={isSubmitting || clientes.length === 0}
                    />
                    <Button variant="outline-success" onClick={() => setShowCrearClienteModal(true)}>Nuevo</Button>
                  </InputGroup>

                  {/* --- 4. CONDICIÓN DE RENDERIZADO DEL DESPLEGABLE SIMPLIFICADA --- */}
                  {!selectedCliente && filteredClientes.length > 0 &&
                    <ListGroup className="mt-1 position-absolute" style={{ zIndex: 1000, width: 'calc(100% - 2.5rem)' }}>
                      {filteredClientes.map(c => (
                        <ListGroup.Item action key={c.clienteID} onClick={() => handleClienteSelect(c)} type="button">
                          {c.nombreCliente} {c.cuit_RUC && `(${c.cuit_RUC})`}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  }
                  {selectedCliente && <small className="form-text text-muted">Seleccionado: {selectedCliente.nombreCliente}</small>}
                </Form.Group>
                {selectedCliente && selectedCliente.tipoCliente === TipoClienteEnum.Empresa && (
                  <Form.Group className="mb-3" controlId="contactoId">
                    <Form.Label>Contacto del Cliente {contactosDelClienteSeleccionado.length > 0 ? '*' : ''}</Form.Label>
                    {/* AÑADIR InputGroup para tener el botón al lado */}
                    <InputGroup>
                      <Form.Select
                        value={contactoId}
                        onChange={(e) => setContactoId(e.target.value)}
                        required={contactosDelClienteSeleccionado.length > 0}
                        disabled={isSubmitting || contactosDelClienteSeleccionado.length === 0}
                      >
                        <option value="">{contactosDelClienteSeleccionado.length > 0 ? "Seleccione un contacto..." : "No hay contactos disponibles"}</option>
                        {contactosDelClienteSeleccionado.map(con => (
                          <option key={con.contactoID} value={con.contactoID}>
                            {`${con.nombre} ${con.apellido} (${con.email})`}
                          </option>
                        ))}
                      </Form.Select>
                      {/* Botón para abrir el nuevo modal */}
                      <Button variant="outline-success" onClick={() => setShowCrearContactoModal(true)}>
                        Nuevo Contacto
                      </Button>
                    </InputGroup>
                    {selectedCliente.tipoCliente === TipoClienteEnum.Empresa && contactosDelClienteSeleccionado.length === 0 &&
                      <small className="form-text text-warning">Este cliente empresa no tiene contactos. Puede agregar uno nuevo.</small>}
                  </Form.Group>
                )}
                <Form.Group className="mb-3" controlId="centroDeCostoBusqueda">
                  <Form.Label>Centro de Costo</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Buscar..."
                      value={searchTermCentroDeCosto}
                      onChange={(e) => { /* ... */ }}
                      onFocus={() => setIsCentroCostoInputFocused(true)}
                      onBlur={() => setTimeout(() => setIsCentroCostoInputFocused(false), 150)}
                      disabled={isSubmitting || isCentroCostoLocked} // <-- Deshabilitado si está bloqueado
                    />
                    <Button variant="outline-success" onClick={() => setShowCrearCentroDeCostoModal(true)} disabled={isCentroCostoLocked}>
                      Nuevo
                    </Button>
                  </InputGroup>

                  {!selectedCentroDeCosto && filteredCentrosDeCosto.length > 0 &&
                    <ListGroup className="mt-1 position-absolute" style={{ zIndex: 999, width: 'calc(100% - 2.5rem)' }}>
                      {filteredCentrosDeCosto.map(cdc => (
                        <ListGroup.Item action key={cdc.centroDeCostoID} onClick={() => handleCentroDeCostoSelect(cdc)} type="button">
                          {cdc.nombre}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  }
                  {selectedCentroDeCosto && <small className="form-text text-muted">Seleccionado: {selectedCentroDeCosto.nombre}</small>}
                </Form.Group>
                <Row><Col md={6}><Form.Group className="mb-3" controlId="usuarioResponsableId"><Form.Label>Responsable</Form.Label><Form.Select value={usuarioResponsableId} onChange={(e) => setUsuarioResponsableId(e.target.value)} disabled={isSubmitting || isUsuariosLoading || opcionesUsuariosParaAsignar.length === 0}><option value="">{isUsuariosLoading ? 'Cargando...' : 'Ninguno'}</option>{opcionesUsuariosParaAsignar.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}</Form.Select></Form.Group></Col><Col md={6}><Form.Group className="mb-4" controlId="participantesIds"><Form.Label>Participantes</Form.Label><Select isMulti options={opcionesUsuariosParaAsignar} className="basic-multi-select" classNamePrefix="select" placeholder={isUsuariosLoading ? 'Cargando...' : 'Seleccione...'} onChange={(s) => setSelectedParticipantes(s as MultiValue<SelectOption>)} value={selectedParticipantes} isDisabled={isSubmitting || isUsuariosLoading} isClearable /></Form.Group></Col></Row>
              </Col>
            </Row>
            <hr />
            <Row>
              {ticketType === 'Desarrollo' && (
                <Col md={6}>
                  <h5 className="mb-3 mt-2 text-primary">Detalles de Desarrollo</h5>
                  <Row>
                    <Col md={6}><Form.Group className="mb-3" controlId="fechaInicioPlanificada"><Form.Label>Fecha Inicio Planificada</Form.Label><Form.Control type="date" value={fechaInicioPlanificada} onChange={(e) => setFechaInicioPlanificada(e.target.value)} disabled={isSubmitting} /></Form.Group></Col>
                    <Col md={6}><Form.Group className="mb-3" controlId="fechaFinPlanificada"><Form.Label>Fecha Fin Planificada</Form.Label><Form.Control type="date" value={fechaFinPlanificada} onChange={(e) => setFechaFinPlanificada(e.target.value)} disabled={isSubmitting} /></Form.Group></Col>
                  </Row>
                  <Form.Group className="mb-4" controlId="horasEstimadas"><Form.Label>Horas Estimadas</Form.Label><Form.Control type="number" placeholder="Ej: 8.5" value={horasEstimadas} onChange={(e) => setHorasEstimadas(e.target.value)} step="0.1" min="0" disabled={isSubmitting} /></Form.Group>
                </Col>
              )}

              <Col md={ticketType === 'Desarrollo' ? 6 : 12}>
                <Card className="mb-4">
                  <Card.Header className="bg-light p-3 d-flex justify-content-between align-items-center">
                    <h5 className="mb-0 text-dark"><Paperclip size={20} className="me-2" />Adjuntos</h5>
                    <Button variant="outline-primary" size="sm" onClick={() => setShowAnadirAdjuntoModal(true)}>
                      <PlusCircle size={18} className="me-1" /> Añadir Adjunto
                    </Button>
                  </Card.Header>
                  {archivosParaSubir.length > 0 ? (
                    <ListGroup variant="flush">
                      {archivosParaSubir.map((archivo) => (
                        <ListGroup.Item key={archivo.id} className="p-2">
                          <Row className="align-items-center">
                            {archivo.previewUrl && (
                              <Col xs="auto">
                                <Image src={archivo.previewUrl} thumbnail style={{ width: '60px', height: '60px', objectFit: 'cover' }} />
                              </Col>
                            )}
                            <Col>
                              <div className="fw-bold text-truncate">{archivo.file.name}</div>
                              <div className="text-muted text-sm">{(archivo.file.size / 1024).toFixed(1)} KB</div>
                              {archivo.descripcion && <div className="text-muted text-sm fst-italic">"{archivo.descripcion}"</div>}
                            </Col>
                            <Col xs="auto">
                              <Button variant="outline-danger" size="sm" className="p-1" onClick={() => handleRemoveFile(archivo.id)}>
                                <Trash3 />
                              </Button>
                            </Col>
                          </Row>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  ) : (
                    <Card.Body><p className="text-muted mb-0">No se han añadido adjuntos.</p></Card.Body>
                  )}
                </Card>
              </Col>
            </Row>

            <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4 pt-3 border-top">
              <Button variant="outline-secondary" onClick={() => navigate('/tickets')} disabled={isSubmitting} className="me-md-2">Cancelar</Button>
              <Button variant="primary" type="submit" disabled={isSubmitting || isDataLoading} style={{ minWidth: '150px' }}>
                {isSubmitting ? (<><Spinner as="span" animation="border" size="sm" className="me-2" />Creando...</>) : ('Crear Ticket')}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <ModalAnadirAdjunto
        show={showAnadirAdjuntoModal}
        handleClose={() => setShowAnadirAdjuntoModal(false)}
        onAdjuntoAnadido={handleAdjuntoAnadido}
      />

      <ModalCrearCliente
        show={showCrearClienteModal}
        handleClose={() => setShowCrearClienteModal(false)}
        onClienteCreado={handleClienteCreadoEnModal}
      />

      {selectedCliente && (
        <ModalCrearContacto
          show={showCrearContactoModal}
          handleClose={() => setShowCrearContactoModal(false)}
          clienteId={selectedCliente.clienteID}
          clienteNombre={selectedCliente.nombreCliente}
          onContactoCreado={handleContactoCreadoEnModal}
        />
      )}
      <ModalCrearEditarCentroDeCosto
        show={showCrearCentroDeCostoModal}
        handleClose={() => setShowCrearCentroDeCostoModal(false)}
        onSuccess={handleCentroDeCostoCreadoEnModal}
      // No pasamos la prop `centroDeCostoAEditar`, por lo que el modal funcionará en modo "Crear"
      />
    </>
  );
};

export default CrearTicketPage;