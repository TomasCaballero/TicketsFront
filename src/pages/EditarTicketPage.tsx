// src/pages/EditarTicketPage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type { 
    TicketDto, // Para poblar el formulario
    ActualizarTicketDto, // Para enviar la actualización
    ClienteSimpleDto,
    CentroDeCostoSimpleDto,
} from '../types/tickets'; 
import { PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets'; // Para el select de prioridad y estado
import type { UsuarioSimpleDto } from '../types/auth';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { type MultiValue} from 'react-select'; // Para selectores

type TicketType = 'Soporte' | 'Desarrollo'; // El tipo de ticket no se puede cambiar

interface SelectOption {
  value: string;
  label: string;
}

const EditarTicketPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { usuarioActual } = useAuth();

  // Estado para los datos originales del ticket
  const [ticketOriginal, setTicketOriginal] = useState<TicketDto | null>(null);

  // Estados para los campos del formulario (inicializados vacíos o con valores por defecto)
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicketEnum | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoTicketEnum | undefined>(undefined);
  // Cliente y UsuarioCreador no se editan, pero se muestran
  const [clienteId, setClienteId] = useState(''); // Solo para mostrar, no se edita
  const [centroDeCostoId, setCentroDeCostoId] = useState<string | undefined>('');
  const [usuarioResponsableId, setUsuarioResponsableId] = useState<string | undefined>('');
  const [selectedParticipantes, setSelectedParticipantes] = useState<MultiValue<SelectOption>>([]);
  const [ticketType, setTicketType] = useState<TicketType | null>(null); // Se determina al cargar el ticket

  // Estados específicos para TicketDesarrollo
  const [fechaInicioPlanificada, setFechaInicioPlanificada] = useState('');
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>('');

  // Estados para cargar datos de los selects
  const [clientes, setClientes] = useState<ClienteSimpleDto[]>([]); // Solo para mostrar el nombre del cliente del ticket
  const [centrosDeCosto, setCentrosDeCosto] = useState<CentroDeCostoSimpleDto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSimpleDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true); // Para la carga inicial del ticket y selects
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del ticket y datos para selects
  useEffect(() => {
    if (!ticketId) {
      setError("ID de Ticket no proporcionado.");
      setIsLoadingData(false);
      return;
    }

    const cargarTodo = async () => {
      setIsLoadingData(true);
      setError(null);
      try {
        // Cargar ticket existente y datos para selects en paralelo
        const [ticketRes, clientesRes, centrosRes, usuariosRes] = await Promise.all([
          apiClient.get<TicketDto>(`/api/tickets/${ticketId}`),
          apiClient.get<ClienteSimpleDto[]>('/api/clientes'), // Aunque no se edita, se podría necesitar para mostrar
          apiClient.get<CentroDeCostoSimpleDto[]>('/api/centrosdecosto'),
          apiClient.get<UsuarioSimpleDto[]>('/api/usuarios')
        ]);

        const ticketData = ticketRes.data;
        setTicketOriginal(ticketData);
        setTitulo(ticketData.titulo);
        setDescripcion(ticketData.descripcion || '');
        setPrioridad(ticketData.prioridad);
        setEstado(ticketData.estado);
        setClienteId(ticketData.cliente?.clienteID || ''); // Para mostrar
        setCentroDeCostoId(ticketData.centroDeCosto?.centroDeCostoID || '');
        setUsuarioResponsableId(ticketData.usuarioResponsable?.id || '');
        
        const participantesActuales = ticketData.participantes.map(p => ({ value: p.id, label: p.nombreCompleto || p.username }));
        setSelectedParticipantes(participantesActuales);
        
        setTicketType(ticketData.tipoTicket as TicketType);

        if (ticketData.tipoTicket === 'Desarrollo') {
          setFechaInicioPlanificada(ticketData.fechaInicioPlanificada ? ticketData.fechaInicioPlanificada.substring(0, 10) : '');
          setFechaFinPlanificada(ticketData.fechaFinPlanificada ? ticketData.fechaFinPlanificada.substring(0, 10) : '');
          setHorasEstimadas(ticketData.horasEstimadas?.toString() || '');
        }

        setClientes(clientesRes.data);
        setCentrosDeCosto(centrosRes.data);
        setUsuarios(usuariosRes.data);

      } catch (err: any) {
        console.error("Error cargando datos para editar ticket:", err);
        setError(err.response?.data?.message || "No se pudieron cargar los datos del ticket o los datos para los selectores.");
      } finally {
        setIsLoadingData(false);
      }
    };
    cargarTodo();
  }, [ticketId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ticketId || !ticketOriginal) {
        setError("No se pueden guardar los cambios, falta información del ticket original.");
        return;
    }
    setIsSubmitting(true);
    setError(null);

    const participantesIds = selectedParticipantes.map(p => p.value);

    const datosActualizados: ActualizarTicketDto = {
      titulo: titulo !== ticketOriginal.titulo ? titulo : undefined,
      descripcion: descripcion !== ticketOriginal.descripcion ? descripcion : undefined,
      prioridad: prioridad !== ticketOriginal.prioridad ? Number(prioridad) as PrioridadTicketEnum : undefined,
      estado: estado !== ticketOriginal.estado ? Number(estado) as EstadoTicketEnum : undefined,
      centroDeCostoID: centroDeCostoId !== (ticketOriginal.centroDeCosto?.centroDeCostoID || '') ? (centroDeCostoId || null) : undefined, // Enviar null para borrar
      usuarioResponsableID: usuarioResponsableId !== (ticketOriginal.usuarioResponsable?.id || '') ? (usuarioResponsableId || null) : undefined, // Enviar null para borrar
      // Los participantes se manejarían con un endpoint/lógica separada si se quiere actualizar la lista completa.
      // Por ahora, el DTO de actualización no incluye participantes.
    };

    if (ticketOriginal.tipoTicket === 'Desarrollo') {
      datosActualizados.fechaInicioPlanificada = (fechaInicioPlanificada || null) !== (ticketOriginal.fechaInicioPlanificada ? ticketOriginal.fechaInicioPlanificada.substring(0,10) : null) 
        ? (fechaInicioPlanificada || null) 
        : undefined;
      datosActualizados.fechaFinPlanificada = (fechaFinPlanificada || null) !== (ticketOriginal.fechaFinPlanificada ? ticketOriginal.fechaFinPlanificada.substring(0,10) : null)
        ? (fechaFinPlanificada || null)
        : undefined;
      datosActualizados.horasEstimadas = (horasEstimadas === '' ? null : parseFloat(horasEstimadas)) !== ticketOriginal.horasEstimadas
        ? (horasEstimadas === '' ? null : parseFloat(horasEstimadas))
        : undefined;
    }
    
    // Filtrar propiedades undefined para no enviarlas si no cambiaron
    const payload = Object.fromEntries(Object.entries(datosActualizados).filter(([_, v]) => v !== undefined));

    if (Object.keys(payload).length === 0) {
        setError("No se han realizado cambios para guardar.");
        setIsSubmitting(false);
        return;
    }

    try {
      await apiClient.put(`/api/tickets/${ticketId}`, payload);
      // Idealmente, mostrar un toast de éxito
      navigate(`/tickets/${ticketId}`); // Redirigir al detalle del ticket
    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        const errorMessage = typeof apiError === 'string' 
          ? apiError
          : apiError.message || apiError.Message || (apiError.errors && JSON.stringify(apiError.errors)) || (apiError.Errors && apiError.Errors.map((e:any) => e.description || e).join(', ')) || 'Error al actualizar el ticket.';
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al actualizar ticket:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingData) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
        <p className="mt-3 fs-5">Cargando datos del ticket para editar...</p>
      </Container>
    );
  }

  if (error && !ticketOriginal) { // Si hay error y no se cargó el ticket, mostrar error principal
    return (
        <Container className="mt-4">
            <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>
            <Button variant="outline-secondary" onClick={() => navigate('/tickets')}>Volver a la lista</Button>
        </Container>
    );
  }
  
  if (!ticketOriginal) { // Si no hay error pero tampoco ticket, es un estado inesperado
    return <Container className="mt-4"><Alert variant="warning">No se encontró el ticket para editar.</Alert></Container>;
  }

  const prioridadOptions = Object.entries(PrioridadTicketEnum)
    .filter(([key, value]) => typeof value === 'number') 
    .map(([key, value]) => ({ value: value as PrioridadTicketEnum, label: key }));

  const estadoOptions = Object.entries(EstadoTicketEnum)
    .filter(([key, value]) => typeof value === 'number')
    .map(([key, value]) => ({ value: value as EstadoTicketEnum, label: key }));

  const usuarioOptions: SelectOption[] = usuarios.map(u => ({ value: u.id, label: u.nombreCompleto || u.username }));

  return (
    <Container className="my-3 my-md-4">
      <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/tickets/${ticketId}`)} className="mb-3">
        Volver al Detalle del Ticket
      </Button>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light p-3">
              <h1 className="h4 mb-0 text-dark">Editar Ticket: {ticketOriginal.numeroTicketFormateado}</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="ticketTypeDisplay">
                  <Form.Label>Tipo de Ticket</Form.Label>
                  <Form.Control type="text" value={ticketType || ''} readOnly disabled />
                </Form.Group>

                <Form.Group className="mb-3" controlId="titulo">
                  <Form.Label>Título *</Form.Label>
                  <Form.Control
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="descripcion">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={isSubmitting}
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="prioridad">
                      <Form.Label>Prioridad *</Form.Label>
                      <Form.Select
                        value={prioridad}
                        onChange={(e) => setPrioridad(Number(e.target.value) as PrioridadTicketEnum)}
                        required
                        disabled={isSubmitting}
                      >
                        {prioridadOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="estado">
                      <Form.Label>Estado *</Form.Label>
                      <Form.Select
                        value={estado}
                        onChange={(e) => setEstado(Number(e.target.value) as EstadoTicketEnum)}
                        required
                        disabled={isSubmitting}
                      >
                        {estadoOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3" controlId="clienteDisplay">
                  <Form.Label>Cliente</Form.Label>
                  <Form.Control type="text" value={ticketOriginal.cliente ? `${ticketOriginal.cliente.nombre} ${ticketOriginal.cliente.apellido || ''}`.trim() : 'N/A'} readOnly disabled />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="centroDeCostoId">
                      <Form.Label>Centro de Costo (Opcional)</Form.Label>
                      <Form.Select
                        value={centroDeCostoId}
                        onChange={(e) => setCentroDeCostoId(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Ninguno</option>
                        {centrosDeCosto.map(cdc => (
                          <option key={cdc.centroDeCostoID} value={cdc.centroDeCostoID}>{cdc.nombre}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3" controlId="usuarioResponsableId">
                      <Form.Label>Usuario Responsable (Opcional)</Form.Label>
                      <Form.Select
                        value={usuarioResponsableId}
                        onChange={(e) => setUsuarioResponsableId(e.target.value)}
                        disabled={isSubmitting}
                      >
                        <option value="">Ninguno</option>
                        {usuarios.map(u => (
                          <option key={u.id} value={u.id}>{u.nombreCompleto || u.username}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* La gestión de participantes es más compleja y podría requerir un componente/modal separado
                    o una lógica de comparación más elaborada si se edita aquí.
                    Por ahora, no permitimos editar participantes directamente en este formulario.
                <Form.Group className="mb-3" controlId="participantesIds">
                    <Form.Label>Participantes</Form.Label>
                    <Select
                        isMulti
                        options={usuarioOptions}
                        value={selectedParticipantes}
                        onChange={(selected) => setSelectedParticipantes(selected as MultiValue<SelectOption>)}
                        isDisabled={isSubmitting}
                    />
                </Form.Group>
                */}


                {ticketType === 'Desarrollo' && (
                  <>
                    <h5 className="mt-4 mb-3">Detalles de Desarrollo</h5>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="fechaInicioPlanificada">
                          <Form.Label>Fecha Inicio Planificada</Form.Label>
                          <Form.Control
                            type="date"
                            value={fechaInicioPlanificada}
                            onChange={(e) => setFechaInicioPlanificada(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3" controlId="fechaFinPlanificada">
                          <Form.Label>Fecha Fin Planificada</Form.Label>
                          <Form.Control
                            type="date"
                            value={fechaFinPlanificada}
                            onChange={(e) => setFechaFinPlanificada(e.target.value)}
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-3" controlId="horasEstimadas">
                      <Form.Label>Horas Estimadas</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Ej: 8.5"
                        value={horasEstimadas}
                        onChange={(e) => setHorasEstimadas(e.target.value)}
                        step="0.1"
                        min="0"
                        disabled={isSubmitting}
                      />
                    </Form.Group>
                  </>
                )}

                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate(`/tickets/${ticketId}`)} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingData}>
                        {isSubmitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                            Guardando...
                        </>
                        ) : (
                        'Guardar Cambios'
                        )}
                    </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default EditarTicketPage;
