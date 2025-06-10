import React, { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import type { UsuarioAdminDto } from '../../types/admin'; 
import type { RolDto } from '../../types/roles';    

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';

interface ModalGestionarRolesUsuarioProps {
  show: boolean;
  handleClose: () => void;
  usuario: UsuarioAdminDto | null; 
  onRolesActualizados: (usuarioId: string) => void;
}

const ModalGestionarRolesUsuario: React.FC<ModalGestionarRolesUsuarioProps> = ({
  show,
  handleClose,
  usuario,
  onRolesActualizados,
}) => {
  const [todosLosRoles, setTodosLosRoles] = useState<RolDto[]>([]);
  const [rolesAsignadosOriginalmente, setRolesAsignadosOriginalmente] = useState<Set<string>>(new Set());
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Set<string>>(new Set());
  
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && usuario) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        try {
          const [todosRolesRes, rolesUsuarioRes] = await Promise.all([
            apiClient.get<RolDto[]>('/api/roles'), 
            apiClient.get<string[]>(`/api/roles/usuario/${usuario.id}/roles`), 
          ]);
          
          setTodosLosRoles(todosRolesRes.data.sort((a,b) => a.nombre.localeCompare(b.nombre)));
          
          const asignadosSet = new Set(rolesUsuarioRes.data);
          setRolesAsignadosOriginalmente(new Set(asignadosSet));
          setRolesSeleccionados(new Set(asignadosSet)); 

        } catch (err: any) {
          console.error('Error cargando datos de roles para el usuario:', err);
          setError(err.response?.data?.message || 'Error al cargar los datos de roles.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else {
      setTodosLosRoles([]);
      setRolesSeleccionados(new Set());
      setRolesAsignadosOriginalmente(new Set());
      setError(null);
    }
  }, [show, usuario]);

  const handleRolChange = (nombreRol: string) => {
    setRolesSeleccionados((prevSeleccionados) => {
      const nuevosSeleccionados = new Set(prevSeleccionados);
      if (nuevosSeleccionados.has(nombreRol)) {
        nuevosSeleccionados.delete(nombreRol);
      } else {
        nuevosSeleccionados.add(nombreRol);
      }
      return nuevosSeleccionados;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!usuario) return;

    setIsSubmitting(true);
    setError(null);

    const rolesParaAgregar = Array.from(rolesSeleccionados).filter(
      (rol) => !rolesAsignadosOriginalmente.has(rol)
    );
    const rolesParaQuitar = Array.from(rolesAsignadosOriginalmente).filter(
      (rol) => !rolesSeleccionados.has(rol)
    );

    try {
      for (const nombreRol of rolesParaAgregar) {
        await apiClient.post('/api/roles/asignar-rol', {
          usuarioId: usuario.id,
          nombreRol: nombreRol,
        });
      }

      for (const nombreRol of rolesParaQuitar) {
        await apiClient.post('/api/roles/remover-rol', {
          usuarioId: usuario.id,
          nombreRol: nombreRol,
        });
      }

      onRolesActualizados(usuario.id);
      handleClose();
    } catch (err: any) {
      console.error('Error actualizando roles del usuario:', err);
      setError(err.response?.data?.message || 'Error al actualizar los roles del usuario.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" keyboard={false} centered>
      <Modal.Header closeButton>
        <Modal.Title>Gestionar Roles para: <span className="fw-bold">{usuario?.userName}</span></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {isLoadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando roles...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {todosLosRoles.length === 0 && !isLoadingData && <p className="text-muted text-center">No hay roles disponibles para asignar.</p>}
            
            <p className="mb-2 text-muted">Seleccione los roles para este usuario:</p>
            <ListGroup style={{ maxHeight: '40vh', overflowY: 'auto' }} className="border rounded">
              {todosLosRoles.map((rol) => (
                <ListGroup.Item key={rol.id} className="px-3 py-2">
                  <Form.Check
                    type="checkbox" 
                    id={`rol-${rol.id}-${usuario?.id}`} 
                    label={rol.nombre}
                    checked={rolesSeleccionados.has(rol.nombre)}
                    onChange={() => handleRolChange(rol.nombre)}
                    disabled={isSubmitting}
                  />
                </ListGroup.Item>
              ))}
            </ListGroup>
            <div className="d-flex justify-content-end mt-4">
              <Button variant="outline-secondary" onClick={handleClose} disabled={isSubmitting} className="me-2">
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting || isLoadingData}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios de Roles'
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ModalGestionarRolesUsuario;