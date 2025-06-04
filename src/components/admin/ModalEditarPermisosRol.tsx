import React, { useState, useEffect, type FormEvent } from 'react';
import apiClient from '../../services/apiClient';
import type { RolDto } from '../../types/roles'; // Para la prop del rol
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';
import ListGroup from 'react-bootstrap/ListGroup';

interface ModalEditarPermisosRolProps {
  show: boolean;
  handleClose: () => void;
  rol: RolDto | null; // Rol seleccionado para editar sus permisos
  onPermisosActualizados: (rolNombre: string) => void; // Callback para notificar éxito
}

const ModalEditarPermisosRol: React.FC<ModalEditarPermisosRolProps> = ({
  show,
  handleClose,
  rol,
  onPermisosActualizados,
}) => {
  const [todosLosPermisos, setTodosLosPermisos] = useState<string[]>([]);
  const [permisosAsignados, setPermisosAsignados] = useState<Set<string>>(new Set());
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (show && rol) {
      const fetchData = async () => {
        setIsLoadingData(true);
        setError(null);
        setPermisosAsignados(new Set()); // Limpiar permisos previos al cargar
        setTodosLosPermisos([]); // Limpiar lista de permisos disponibles
        try {
          const [permisosDisponiblesRes, permisosRolRes] = await Promise.all([
            apiClient.get<string[]>('/api/roles/permisos-disponibles'),
            apiClient.get<string[]>(`/api/roles/${rol.nombre}/permisos`),
          ]);
          setTodosLosPermisos(permisosDisponiblesRes.data.sort());
          setPermisosAsignados(new Set(permisosRolRes.data));
        } catch (err: any) {
          console.error('Error cargando datos de permisos:', err);
          setError(err.response?.data?.message || 'Error al cargar los datos de permisos.');
        } finally {
          setIsLoadingData(false);
        }
      };
      fetchData();
    } else {
      // Resetear cuando el modal se cierra o no hay rol
      setTodosLosPermisos([]);
      setPermisosAsignados(new Set());
      setError(null);
    }
  }, [show, rol]);

  const handlePermisoChange = (permiso: string) => {
    setPermisosAsignados((prevPermisos) => {
      const nuevosPermisos = new Set(prevPermisos);
      if (nuevosPermisos.has(permiso)) {
        nuevosPermisos.delete(permiso);
      } else {
        nuevosPermisos.add(permiso);
      }
      return nuevosPermisos;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!rol) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.put(`/api/roles/${rol.nombre}/permisos`, {
        permisos: Array.from(permisosAsignados),
      });
      onPermisosActualizados(rol.nombre); // Notificar al padre
      handleClose();
    } catch (err: any) {
      console.error('Error actualizando permisos del rol:', err);
      setError(err.response?.data?.message || 'Error al actualizar los permisos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static" keyboard={false} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Editar Permisos para el Rol: <span className="fw-bold">{rol?.nombre}</span></Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
        {isLoadingData ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando permisos...</p>
          </div>
        ) : (
          <Form onSubmit={handleSubmit}>
            {todosLosPermisos.length === 0 && !isLoadingData && <p className="text-muted text-center">No hay permisos definidos en el sistema o no se pudieron cargar.</p>}
            
            <p className="mb-2 text-muted">Seleccione los permisos que desea asignar a este rol:</p>
            <ListGroup style={{ maxHeight: '60vh', overflowY: 'auto' }} className="border rounded">
              {todosLosPermisos.map((permiso) => (
                <ListGroup.Item key={permiso} className="px-3 py-2 d-flex justify-content-between align-items-center">
                  <span style={{ wordBreak: 'break-all' }}>{permiso.replace(/^Permisos\./, '')}</span> {/* Opcional: quitar prefijo "Permisos." */}
                  <Form.Check
                    type="switch"
                    id={`permiso-${permiso.replace(/\./g, '-')}`} 
                    // label={permiso} // El label ya está al lado
                    checked={permisosAsignados.has(permiso)}
                    onChange={() => handlePermisoChange(permiso)}
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
                  'Guardar Permisos'
                )}
              </Button>
            </div>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ModalEditarPermisosRol;
