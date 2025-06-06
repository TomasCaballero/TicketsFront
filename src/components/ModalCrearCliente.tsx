import React, { useState, type FormEvent } from 'react';
import apiClient from '../services/apiClient';
import { TipoClienteEnum } from '../types/tickets';
import type { ClienteParaSelectorDto } from '../types/clientes';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

interface ContactoNuevoDto {
  nombre: string;
  apellido: string;
  email: string;
  telefonoDirecto: string;
  cargo: string;
  esPrincipal: boolean;
}

interface ModalCrearClienteProps {
  show: boolean;
  handleClose: () => void;
  onClienteCreado: (nuevoCliente: ClienteParaSelectorDto) => void;
}

const ModalCrearCliente: React.FC<ModalCrearClienteProps> = ({ 
  show, 
  handleClose, 
  onClienteCreado 
}) => {
  const [nombreCliente, setNombreCliente] = useState('');
  const [tipoCliente, setTipoCliente] = useState<TipoClienteEnum>(TipoClienteEnum.Empresa);
  const [cuitRuc, setCuitRuc] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [emailPrincipal, setEmailPrincipal] = useState('');
  const [contacto, setContacto] = useState<ContactoNuevoDto>({
    nombre: '',
    apellido: '',
    email: '',
    telefonoDirecto: '',
    cargo: '',
    esPrincipal: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const clienteData = {
      nombreCliente,
      tipoCliente,
      cuiT_RUC: cuitRuc,
      direccionFiscal,
      telefonoPrincipal,
      emailPrincipal,
      contactosNuevos: tipoCliente === TipoClienteEnum.Empresa ? [contacto] : []
    };

    try {
      const response = await apiClient.post('api/clientes', clienteData);
      onClienteCreado(response.data);
      handleClose();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error al crear el cliente. Por favor, intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Cliente</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>Nombre del Cliente *</Form.Label>
            <Form.Control
              type="text"
              value={nombreCliente}
              onChange={(e) => setNombreCliente(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Tipo de Cliente *</Form.Label>
            <Form.Select
              value={tipoCliente}
              onChange={(e) => setTipoCliente(Number(e.target.value) as TipoClienteEnum)}
            >
              <option value={TipoClienteEnum.Empresa}>Empresa</option>
              <option value={TipoClienteEnum.PersonaIndividual}>Persona</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>CUIT/RUC *</Form.Label>
            <Form.Control
              type="text"
              value={cuitRuc}
              onChange={(e) => setCuitRuc(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Dirección Fiscal</Form.Label>
            <Form.Control
              type="text"
              value={direccionFiscal}
              onChange={(e) => setDireccionFiscal(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Teléfono Principal</Form.Label>
            <Form.Control
              type="text"
              value={telefonoPrincipal}
              onChange={(e) => setTelefonoPrincipal(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email Principal</Form.Label>
            <Form.Control
              type="email"
              value={emailPrincipal}
              onChange={(e) => setEmailPrincipal(e.target.value)}
            />
          </Form.Group>

          {tipoCliente === TipoClienteEnum.Empresa && (
            <>
              <h5 className="mt-4 mb-3">Contacto Principal</h5>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Contacto *</Form.Label>
                <Form.Control
                  type="text"
                  value={contacto.nombre}
                  onChange={(e) => setContacto({...contacto, nombre: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Apellido del Contacto *</Form.Label>
                <Form.Control
                  type="text"
                  value={contacto.apellido}
                  onChange={(e) => setContacto({...contacto, apellido: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Email del Contacto *</Form.Label>
                <Form.Control
                  type="email"
                  value={contacto.email}
                  onChange={(e) => setContacto({...contacto, email: e.target.value})}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Teléfono Directo</Form.Label>
                <Form.Control
                  type="text"
                  value={contacto.telefonoDirecto}
                  onChange={(e) => setContacto({...contacto, telefonoDirecto: e.target.value})}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  type="text"
                  value={contacto.cargo}
                  onChange={(e) => setContacto({...contacto, cargo: e.target.value})}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                {' Creando...'}
              </>
            ) : (
              'Crear Cliente'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalCrearCliente;