// src/components/admin/ModalCrearUsuario.tsx
import React, { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import type { RolDto } from '../../types/roles';
import type { CrearUsuarioPorAdminDto } from '../../types/admin';
import type { UsuarioAdminDto } from '../../types/admin';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import Select, { type MultiValue } from 'react-select';
import { Col, Row } from 'react-bootstrap';
import PasswordInput from '../common/PasswordInput';

interface SelectOption {
  value: string;
  label: string;
}

interface ModalCrearUsuarioProps {
  show: boolean;
  handleClose: () => void;
  onUsuarioCreado: (nuevoUsuario: UsuarioAdminDto) => void;
}

const ModalCrearUsuario: React.FC<ModalCrearUsuarioProps> = ({
  show,
  handleClose,
  onUsuarioCreado,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [estaActivo, setEstaActivo] = useState<boolean>(true);
  const [selectedRoles, setSelectedRoles] = useState<MultiValue<SelectOption>>([]);

  const [todosLosRoles, setTodosLosRoles] = useState<RolDto[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show) {
      setUsername('');
      setEmail('');
      setPassword('');
      setNombre('');
      setApellido('');
      setEstaActivo(true);
      setSelectedRoles([]);
      setError(null);
      setIsSubmitting(false);

      const fetchRolesDisponibles = async () => {
        setIsLoadingRoles(true);
        try {
          const response = await apiClient.get<RolDto[]>('/api/roles');
          setTodosLosRoles(response.data);
        } catch (err) {
          console.error("Error cargando roles:", err);
          setError("No se pudieron cargar los roles disponibles.");
        } finally {
          setIsLoadingRoles(false);
        }
      };
      fetchRolesDisponibles();
    }
  }, [show]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim() || !nombre.trim() || !apellido.trim()) {
      setError("Todos los campos marcados con * son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    const dto: CrearUsuarioPorAdminDto = {
      username: username.trim(),
      email: email.trim(),
      password: password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      estaActivo,
      roles: selectedRoles.map(option => option.value),
    };

    try {
      const response = await apiClient.post<UsuarioAdminDto>('/api/admin/usuarios', dto);
      onUsuarioCreado(response.data);
      handleClose();
    } catch (err: any) {
      if (err.response && err.response.data) {
        const apiError = err.response.data;
        let errorMessage = 'Error al crear el usuario.';
        if (apiError.errors && Array.isArray(apiError.errors)) {
          errorMessage = apiError.errors.map((e: any) => e.description || e.code || JSON.stringify(e)).join(', ');
        } else if (apiError.title) {
          errorMessage = apiError.title;
        } else if (apiError.message || apiError.Message) {
          errorMessage = apiError.message || apiError.Message;
        } else if (typeof apiError === 'string') {
          errorMessage = apiError;
        }
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde.');
      }
      console.error("Error al crear usuario:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const rolOptions: SelectOption[] = todosLosRoles.map(r => ({ value: r.nombre, label: r.nombre }));

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="nombreUsuario">
                <Form.Label>Nombre *</Form.Label>
                <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required disabled={isSubmitting} autoComplete="off"/>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="apellidoUsuario">
                <Form.Label>Apellido *</Form.Label>
                <Form.Control type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required disabled={isSubmitting} autoComplete="off"/>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="usernameUsuario">
                <Form.Label>Nombre de Usuario *</Form.Label>
                <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required disabled={isSubmitting} autoComplete="off"/>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3" controlId="emailUsuario">
                <Form.Label>Email *</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isSubmitting} autoComplete="off"/>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="passwordUsuario">
            <Form.Label>Contraseña *</Form.Label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              autoComplete="off"
            />
            <Form.Text className="text-muted">Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas y números.</Form.Text>
          </Form.Group>

          <Form.Group className="mb-3" controlId="rolesUsuario">
            <Form.Label>Roles (Opcional)</Form.Label>
            <Select
              isMulti
              options={rolOptions}
              isLoading={isLoadingRoles}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Seleccione roles..."
              onChange={(selected) => setSelectedRoles(selected as MultiValue<SelectOption>)}
              value={selectedRoles}
              isDisabled={isSubmitting || isLoadingRoles}
              isClearable
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="estaActivoUsuario">
            <Form.Check
              type="switch"
              id="esta-activo-switch"
              label="Usuario Activo"
              checked={estaActivo}
              onChange={(e) => setEstaActivo(e.target.checked)}
              disabled={isSubmitting}
            />
            <Form.Text className="text-muted">
              Si no está activo, el usuario no podrá iniciar sesión.
            </Form.Text>
          </Form.Group>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting} className="me-2">
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingRoles}>
              {isSubmitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                  Creando Usuario...
                </>
              ) : (
                'Crear Usuario'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ModalCrearUsuario;
