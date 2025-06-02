// src/pages/CrearTicketPage.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import type { 
    CrearTicketSoporteDto, 
    CrearTicketDesarrolloDto,
    ClienteSimpleDto, // Asegúrate que este tipo esté definido en tus archivos de tipos
    CentroDeCostoSimpleDto // Asegúrate que este tipo esté definido
} from '../types/tickets'; // O donde tengas estos DTOs definidos
import type { UsuarioSimpleDto } from '../types/auth'; // Para el selector de usuarios
import { PrioridadTicketEnum } from '../types/tickets';

import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Select, { type MultiValue } from 'react-select'; // Para selectores múltiples (participantes)

type TicketType = 'Soporte' | 'Desarrollo';

interface SelectOption {
  value: string;
  label: string;
}

const CrearTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { usuarioActual } = useAuth();

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicketEnum>(PrioridadTicketEnum.MEDIA);
  const [clienteId, setClienteId] = useState('');
  const [centroDeCostoId, setCentroDeCostoId] = useState('');
  const [usuarioResponsableId, setUsuarioResponsableId] = useState('');
  const [selectedParticipantes, setSelectedParticipantes] = useState<MultiValue<SelectOption>>([]);
  const [ticketType, setTicketType] = useState<TicketType>('Soporte');

  const [fechaInicioPlanificada, setFechaInicioPlanificada] = useState('');
  const [fechaFinPlanificada, setFechaFinPlanificada] = useState('');
  const [horasEstimadas, setHorasEstimadas] = useState<string>(''); // Usar string para el input

  const [clientes, setClientes] = useState<ClienteSimpleDto[]>([]);
  const [centrosDeCosto, setCentrosDeCosto] = useState<CentroDeCostoSimpleDto[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSimpleDto[]>([]);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatosParaSelects = async () => {
      setIsDataLoading(true);
      setError(null);
      try {
        const [clientesRes, centrosRes, usuariosRes] = await Promise.all([
          apiClient.get<ClienteSimpleDto[]>('/api/clientes'),
          apiClient.get<CentroDeCostoSimpleDto[]>('/api/centrosdecosto'),
          apiClient.get<UsuarioSimpleDto[]>('/api/usuarios') // Asumiendo que tienes este endpoint
        ]);
        setClientes(clientesRes.data);
        setCentrosDeCosto(centrosRes.data);
        setUsuarios(usuariosRes.data);
      } catch (err) {
        console.error("Error cargando datos para selects:", err);
        setError("No se pudieron cargar los datos necesarios para crear el ticket. Intente recargar la página.");
      } finally {
        setIsDataLoading(false);
      }
    };
    cargarDatosParaSelects();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!usuarioActual) {
        setError("No se pudo identificar al usuario creador. Por favor, inicie sesión de nuevo.");
        setIsSubmitting(false);
        return;
    }
    if (!clienteId) {
        setError("Debe seleccionar un cliente.");
        setIsSubmitting(false);
        return;
    }

    const participantesIds = selectedParticipantes.map(p => p.value);

    const baseData = {
      titulo,
      descripcion,
      prioridad: Number(prioridad) as PrioridadTicketEnum,
      clienteID: clienteId,
      centroDeCostoID: centroDeCostoId || undefined,
      usuarioResponsableID: usuarioResponsableId || undefined,
      participantesIds: participantesIds.length > 0 ? participantesIds : undefined,
    };

    try {
      let response;
      if (ticketType === 'Soporte') {
        const data: CrearTicketSoporteDto = { ...baseData };
        response = await apiClient.post('/api/tickets/soporte', data);
      } else {
        const data: CrearTicketDesarrolloDto = {
          ...baseData,
          fechaInicioPlanificada: fechaInicioPlanificada || undefined,
          fechaFinPlanificada: fechaFinPlanificada || undefined,
          horasEstimadas: horasEstimadas === '' ? undefined : parseFloat(horasEstimadas),
        };
        response = await apiClient.post('/api/tickets/desarrollo', data);
      }
      
      console.log('Ticket creado:', response.data);
      // Idealmente, mostrar un toast de éxito aquí
      navigate('/tickets'); // Redirigir a la lista de tickets
    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        const errorMessage = typeof apiError === 'string' 
          ? apiError
          : apiError.message || apiError.Message || (apiError.errors && JSON.stringify(apiError.errors)) || (apiError.Errors && apiError.Errors.map((e:any) => e.description || e).join(', ')) || 'Error al crear el ticket.';
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al crear ticket:", err);
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
    .filter(([key, value]) => typeof value === 'number') // Filtrar solo los miembros numéricos del enum
    .map(([key, value]) => ({ value: value as PrioridadTicketEnum, label: key }));

  const usuarioOptions: SelectOption[] = usuarios.map(u => ({ value: u.id, label: u.nombreCompleto || u.username }));


  return (
    <Container className="my-3 my-md-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-sm">
            <Card.Header className="bg-light p-3">
              <h1 className="h4 mb-0 text-dark">Crear Nuevo Ticket</h1>
            </Card.Header>
            <Card.Body className="p-4">
              {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="ticketType">
                  <Form.Label>Tipo de Ticket *</Form.Label>
                  <Form.Select 
                    value={ticketType} 
                    onChange={(e) => setTicketType(e.target.value as TicketType)}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="Soporte">Soporte</option>
                    <option value="Desarrollo">Desarrollo</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3" controlId="titulo">
                  <Form.Label>Título *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Ej: Problema con inicio de sesión"
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
                    placeholder="Detalles del problema o tarea..."
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
                    <Form.Group className="mb-3" controlId="clienteId">
                      <Form.Label>Cliente *</Form.Label>
                      <Form.Select
                        value={clienteId}
                        onChange={(e) => setClienteId(e.target.value)}
                        required
                        disabled={isSubmitting || clientes.length === 0}
                      >
                        <option value="">Seleccione un cliente...</option>
                        {clientes.map(c => (
                          <option key={c.clienteID} value={c.clienteID}>{`${c.nombre} ${c.apellido || ''}`.trim()}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                
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

                <Form.Group className="mb-3" controlId="participantesIds">
                    <Form.Label>Participantes (Opcional)</Form.Label>
                    <Select
                        isMulti
                        options={usuarioOptions}
                        className="basic-multi-select"
                        classNamePrefix="select"
                        placeholder="Seleccione participantes..."
                        onChange={(selected) => setSelectedParticipantes(selected as MultiValue<SelectOption>)}
                        value={selectedParticipantes}
                        isDisabled={isSubmitting}
                        isClearable
                    />
                </Form.Group>


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
                    <Button variant="outline-secondary" onClick={() => navigate('/tickets')} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSubmitting || isDataLoading}>
                        {isSubmitting ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2"/>
                            Creando...
                        </>
                        ) : (
                        'Crear Ticket'
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

export default CrearTicketPage;
