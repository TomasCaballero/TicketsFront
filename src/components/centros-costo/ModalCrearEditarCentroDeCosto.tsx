import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../services/apiClient';
import { type CentroDeCostoDto, type CrearCentroDeCostoDto, type ActualizarCentroDeCostoDto } from '../../types/centrosCosto';
import { TipoCentroCosto } from '../../types/tickets';
import type { UsuarioSimpleDto } from '../../types/auth';
import { Modal, Form, Button, Spinner, Alert, Row, Col } from 'react-bootstrap';
import Select, { type MultiValue } from 'react-select';
import RichTextEditor from '../editor/RichTextEditor';

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  onSuccess: (nuevoCentroDeCosto?: CentroDeCostoDto) => void;
  centroDeCostoAEditar?: CentroDeCostoDto | null;
}

const ModalCrearEditarCentroDeCosto: React.FC<ModalProps> = ({ show, handleClose, onSuccess, centroDeCostoAEditar }) => {
  const isEditMode = !!centroDeCostoAEditar;

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<TipoCentroCosto>(TipoCentroCosto.PROYECTO);
  const [responsableId, setResponsableId] = useState<string | null>(null);
  const [participantes, setParticipantes] = useState<MultiValue<{ value: string; label: string }>>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioSimpleDto[]>([]);

  const opcionesUsuarios = useMemo(() => usuarios.map(u => ({ value: u.id, label: u.nombreCompleto || u.username })), [usuarios]);

  useEffect(() => {
    if (show) {
      setError(null);
      setIsSubmitting(false);
      apiClient.get<UsuarioSimpleDto[]>('/api/usuarios')
        .then(res => setUsuarios(res.data))
        .catch(err => {
          console.error("Error al cargar usuarios:", err);
          setError("No se pudieron cargar los usuarios para los selectores.");
        });
    }
  }, [show]);

  useEffect(() => {
    if (show) {
      if (isEditMode && centroDeCostoAEditar) {
        setNombre(centroDeCostoAEditar.nombre);
        setDescripcion(centroDeCostoAEditar.descripcion || '');
        setTipo(centroDeCostoAEditar.tipo);
        setResponsableId(centroDeCostoAEditar.usuarioResponsable?.id || null);

        if (opcionesUsuarios.length > 0) {
          const idsParticipantesActuales = new Set(centroDeCostoAEditar.participantes.map(p => p.id));
          setParticipantes(opcionesUsuarios.filter(opt => idsParticipantesActuales.has(opt.value)));
        }
      } else {
        setNombre('');
        setDescripcion('');
        setTipo(TipoCentroCosto.PROYECTO);
        setResponsableId(null);
        setParticipantes([]);
      }
    }
  }, [show, isEditMode, centroDeCostoAEditar, usuarios, opcionesUsuarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const participantesIds = participantes.map(p => p.value);

    try {
      if (isEditMode && centroDeCostoAEditar) {
        const payload: ActualizarCentroDeCostoDto = { nombre, descripcion, tipo };
        await apiClient.put(`/api/centrosdecosto/${centroDeCostoAEditar.centroDeCostoID}`, payload);
        await apiClient.post(`/api/centrosdecosto/${centroDeCostoAEditar.centroDeCostoID}/responsable`, { usuarioResponsableId: responsableId });
        await apiClient.post(`/api/centrosdecosto/${centroDeCostoAEditar.centroDeCostoID}/participantes`, { participantesIds });
        onSuccess();
      } else {
        const payload: CrearCentroDeCostoDto = { nombre, descripcion, tipo, usuarioResponsableId: responsableId, participantesIds };
        const response = await apiClient.post<CentroDeCostoDto>('/api/centrosdecosto', payload);
        onSuccess(response.data);
      }
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el centro de costo.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEditMode ? 'Editar' : 'Nuevo'} Centro de Costo</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3" controlId="nombre">
            <Form.Label>Nombre *</Form.Label>
            <Form.Control type="text" value={nombre} onChange={e => setNombre(e.target.value)} required disabled={isSubmitting} autoComplete="off" />
          </Form.Group>
          <Form.Group className="mb-4" controlId="descripcion">
            <Form.Label>Descripción</Form.Label>

            <RichTextEditor
              content={descripcion}
              onChange={(newContent) => setDescripcion(newContent)}
            />
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="tipo">
                <Form.Label>Tipo *</Form.Label>
                <Form.Select value={tipo} onChange={e => setTipo(Number(e.target.value) as TipoCentroCosto)} required disabled={isSubmitting}>
                  <option value={TipoCentroCosto.PROYECTO}>Proyecto</option>
                  <option value={TipoCentroCosto.PRODUCTO}>Producto</option>
                  <option value={TipoCentroCosto.CONTRATO}>Contrato</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="responsable">
                <Form.Label>Responsable</Form.Label>
                <Select options={opcionesUsuarios} value={opcionesUsuarios.find(o => o.value === responsableId) || null} onChange={opt => setResponsableId(opt ? opt.value : null)} isClearable placeholder="Seleccionar responsable..." isDisabled={isSubmitting} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="participantes">
            <Form.Label>Participantes</Form.Label>
            <Select isMulti options={opcionesUsuarios} value={participantes} onChange={opts => setParticipantes(opts as MultiValue<{ value: string; label: string }>)} placeholder="Añadir participantes..." isDisabled={isSubmitting} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner as="span" size="sm" /> : 'Guardar'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCrearEditarCentroDeCosto;