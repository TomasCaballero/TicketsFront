import React, { useState, type FormEvent } from 'react';
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../../services/apiClient';
import type { UsuarioAdminDto } from '../../types/admin';
import PasswordInput from '../common/PasswordInput'; // Reutilizamos nuestro componente

interface ModalProps {
  show: boolean;
  handleClose: () => void;
  usuario: UsuarioAdminDto | null;
  onSuccess: (message: string) => void;
}

const ModalCambiarContrasena: React.FC<ModalProps> = ({ show, handleClose, usuario, onSuccess }) => {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (nuevaPassword.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await apiClient.post('/api/admin/usuarios/cambiar-contrasena', {
        usuarioId: usuario.id,
        nuevaPassword: nuevaPassword
      });
      onSuccess(response.data.message || `Contraseña para ${usuario.userName} actualizada.`);
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Cambiar Contraseña para: <span className="fw-bold">{usuario?.userName}</span></Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form.Group className="mb-3">
            <Form.Label>Nueva Contraseña</Form.Label>
            <PasswordInput value={nuevaPassword} onChange={e => setNuevaPassword(e.target.value)} required autoComplete="new-password" />
          </Form.Group>
          <Form.Group>
            <Form.Label>Confirmar Nueva Contraseña</Form.Label>
            <PasswordInput value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} required autoComplete="new-password" />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" /> : 'Guardar Contraseña'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCambiarContrasena;