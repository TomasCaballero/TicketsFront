// src/pages/EditarTicketPage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { Editor } from '@tinymce/tinymce-react';
import type {
  TicketDto,
  ActualizarTicketDto,
  ClienteSimpleDto,
  CentroDeCostoSimpleDto,
} from '../types/tickets';
import { PrioridadTicketEnum, EstadoTicketEnum } from '../types/tickets';
import type { UsuarioSimpleDto } from '../types/auth';


import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import { type MultiValue } from 'react-select';
import RichTextEditor from '../components/editor/RichTextEditor';

type TicketType = 'Soporte' | 'Desarrollo';

interface SelectOption {
  value: string;
  label: string;
}

const EditarTicketPage: React.FC = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();


  const [ticketOriginal, setTicketOriginal] = useState<TicketDto | null>(null);

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicketEnum | undefined>(undefined);
  const [estado, setEstado] = useState<EstadoTicketEnum | undefined>(undefined);
  const [clienteId, setClienteId] = useState('');
  const [centroDeCostoId, setCentroDeCostoId] = useState<string | undefined>('');
  const [usuarioResponsableId, setUsuarioResponsableId] = useState<string | undefined>('');
  const [selectedParticipantes, setSelectedParticipantes] = useState<MultiValue<SelectOption>>([]);
  const [ticketType, setTicketType] = useState<TicketType | null>(null);

  const [fechaInicioPlanificada, setFechaInicioPlanificada] = useState('');
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>('');

  const [clientes, setClientes] = useState<ClienteSimpleDto[]>([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState<CentroDeCostoSimpleDto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSimpleDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const [ticketRes, clientesRes, centrosRes, usuariosRes] = await Promise.all([
          apiClient.get<TicketDto>(`/api/tickets/${ticketId}`),
          apiClient.get<ClienteSimpleDto[]>('/api/clientes'),
          apiClient.get<CentroDeCostoSimpleDto[]>('/api/centrosdecosto'),
          apiClient.get<UsuarioSimpleDto[]>('/api/usuarios')
        ]);

        const ticketData = ticketRes.data;
        setTicketOriginal(ticketData);
        setTitulo(ticketData.titulo);
        setDescripcion(ticketData.descripcion || '');
        setPrioridad(ticketData.prioridad);
        setEstado(ticketData.estado);
        setClienteId(ticketData.cliente?.clienteID || '');
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
    if (!ticketId) return;

    setIsSubmitting(true);
    setError(null);

    // 1. Construimos el DTO con TODOS los valores actuales del formulario.
    //    Si un campo está vacío, enviamos null o un array vacío según corresponda.
    const payload: ActualizarTicketDto = {
      titulo: titulo,
      descripcion: descripcion,
      prioridad: Number(prioridad) as PrioridadTicketEnum,
      estado: Number(estado) as EstadoTicketEnum,
      centroDeCostoID: centroDeCostoId || null,
      usuarioResponsableID: usuarioResponsableId || null,
      participantesIds: selectedParticipantes.map(p => p.value),

      // Campos de desarrollo
      fechaInicioPlanificada: fechaInicioPlanificada || null,
      fechaFinPlanificada: fechaFinPlanificada || null,
      horasEstimadas: horasEstimadas === '' ? null : parseFloat(horasEstimadas),
    };

    try {
      // 2. Enviamos el payload completo al backend.
      await apiClient.put(`/api/tickets/${ticketId}`, payload);
      navigate(`/tickets/${ticketId}`); // Redirigir al detalle al guardar con éxito
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar el ticket.');
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

  if (error && !ticketOriginal) {
    return (
      <Container className="mt-4">
        <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>
        <Button variant="outline-secondary" onClick={() => navigate('/tickets')}>Volver a la lista</Button>
      </Container>
    );
  }

  if (!ticketOriginal) {
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
    <>
      <Button variant="outline-secondary" size="sm" onClick={() => navigate(`/tickets/${ticketId}`)} className="mb-3">
        Volver al Detalle del Ticket
      </Button>
      <Row className="justify-content-center">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-light p-3">
              <h1 className="h4 mb-0 text-dark">Editar Ticket: {ticketOriginal.numeroTicketFormateado}</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6} className="mb-4">
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

                  <Form.Group className="mb-4" controlId="descripcion">
                    <Form.Label>Descripción</Form.Label>
                    <RichTextEditor
                    content={descripcion}
                    onChange={(newContent) => setDescripcion(newContent)}
                  />
                  </Form.Group>
                </Col>
                <Col md={6}>
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
                    <Col md={12}>
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
                    <Col md={12}>
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

                  
                </Col>
                </Row>
                <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                    <Button variant="outline-secondary" onClick={() => navigate(`/tickets/${ticketId}`)} disabled={isSubmitting}>
                      Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingData}>
                      {isSubmitting ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
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
    </>
  );
};

export default EditarTicketPage;
