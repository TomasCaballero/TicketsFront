import React, { useState, type FormEvent } from 'react';
import apiClient from '../services/apiClient';
import { TipoClienteEnum } from '../types/tickets'; // Asumiendo que TipoClienteEnum está en tickets.ts
// Asegúrate de tener estos tipos definidos en un archivo como src/types/clientes.ts
import type { 
    ClienteParaSelectorDto, 
    CrearClienteConContactosDto, 
    CrearContactoParaClienteDto,
    ClienteCreadoDto 
} from '../types/clientes';

import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Alert from 'react-bootstrap/Alert';
import Spinner from 'react-bootstrap/Spinner';

interface ModalCrearClienteProps {
  show: boolean;
  handleClose: () => void;
  // La función callback que se ejecuta cuando el cliente se crea con éxito
  onClienteCreado: (nuevoCliente: ClienteParaSelectorDto) => void;
}

const ModalCrearCliente: React.FC<ModalCrearClienteProps> = ({ 
  show, 
  handleClose, 
  onClienteCreado 
}) => {
  // Estados para el formulario del Cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [tipoCliente, setTipoCliente] = useState<TipoClienteEnum>(TipoClienteEnum.Empresa);
  const [cuitRuc, setCuitRuc] = useState('');
  const [direccionFiscal, setDireccionFiscal] = useState('');
  const [telefonoPrincipal, setTelefonoPrincipal] = useState('');
  const [emailPrincipal, setEmailPrincipal] = useState('');
  
  // Estados para el primer Contacto (si es Empresa)
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoApellido, setContactoApellido] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [contactoTelefono, setContactoTelefono] = useState('');
  const [contactoCargo, setContactoCargo] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setNombreCliente('');
    setTipoCliente(TipoClienteEnum.Empresa);
    setCuitRuc('');
    setDireccionFiscal('');
    setTelefonoPrincipal('');
    setEmailPrincipal('');
    setContactoNombre('');
    setContactoApellido('');
    setContactoEmail('');
    setContactoTelefono('');
    setContactoCargo('');
    setError(null);
  };

  const handleModalClose = () => {
    resetForm();
    handleClose();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validaciones
    if (tipoCliente === TipoClienteEnum.Empresa && (!contactoNombre.trim() || !contactoApellido.trim() || !contactoEmail.trim())) {
      setError("Para clientes de tipo Empresa, el nombre, apellido y email del primer contacto son obligatorios.");
      setIsSubmitting(false);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailPrincipal && !emailRegex.test(emailPrincipal)) {
      setError("El formato del Email Principal del cliente no es válido.");
      setIsSubmitting(false);
      return;
    }
    if (tipoCliente === TipoClienteEnum.Empresa && contactoEmail && !emailRegex.test(contactoEmail)) {
      setError("El formato del Email del Contacto no es válido.");
      setIsSubmitting(false);
      return;
    }

    const contactosParaEnviar: CrearContactoParaClienteDto[] = [];
    if (tipoCliente === TipoClienteEnum.Empresa) {
      contactosParaEnviar.push({
        nombre: contactoNombre,
        apellido: contactoApellido,
        email: contactoEmail,
        telefonoDirecto: contactoTelefono || undefined,
        cargo: contactoCargo || undefined,
        esPrincipal: true,
      });
    }
    
    const clienteData: CrearClienteConContactosDto = {
      nombreCliente,
      tipoCliente,
      cuit_RUC: cuitRuc || undefined,
      direccionFiscal: direccionFiscal || undefined,
      telefonoPrincipal: telefonoPrincipal || undefined,
      emailPrincipal: emailPrincipal || undefined,
      contactosNuevos: contactosParaEnviar,
    };

    try {
      const response = await apiClient.post<ClienteCreadoDto>('/api/clientes', clienteData);
      
      const nuevoClienteParaSelector: ClienteParaSelectorDto = {
          clienteID: response.data.clienteID,
          nombreCliente: response.data.nombreCliente,
          tipoCliente: response.data.tipoCliente,
          cuit_RUC: response.data.cuit_RUC,
          contactos: response.data.contactos?.map(c => ({
              contactoID: c.contactoID,
              nombre: c.nombre,
              apellido: c.apellido,
              email: c.email
          })) || []
      };

      onClienteCreado(nuevoClienteParaSelector);
      handleModalClose();
    } catch (err: any) {
      const apiError = err.response?.data;
      let errorMessage = "Error al crear el cliente. Por favor, intente nuevamente.";
      if (apiError) {
          if (typeof apiError === 'string') errorMessage = apiError;
          else if (apiError.message) errorMessage = apiError.message;
          else if (apiError.Message) errorMessage = apiError.Message;
          else if (apiError.title && typeof apiError.errors === 'object') {
               errorMessage = `${apiError.title}: ` + Object.values(apiError.errors).flat().join(' ');
          }
      }
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Crear Nuevo Cliente</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>}
          
          <h5 className="mb-3 text-primary">Datos del Cliente</h5>
          <Row>
            <Col md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Nombre del Cliente *</Form.Label>
                    <Form.Control
                    type="text"
                    value={nombreCliente}
                    autoComplete="off"
                    onChange={(e) => setNombreCliente(e.target.value)}
                    required
                    />
                </Form.Group>
            </Col>
            <Col md={6}>
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
            </Col>
          </Row>

          {tipoCliente === TipoClienteEnum.Empresa && (
            <Form.Group className="mb-3">
                <Form.Label>CUIT/RUC (Opcional)</Form.Label>
                <Form.Control
                type="text"
                autoComplete="off"
                placeholder="Ej: 30-12345678-9"
                value={cuitRuc}
                onChange={(e) => setCuitRuc(e.target.value)}
                />
            </Form.Group>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Dirección Fiscal (Opcional)</Form.Label>
            <Form.Control
              type="text"
              autoComplete="off"
              value={direccionFiscal}
              onChange={(e) => setDireccionFiscal(e.target.value)}
            />
          </Form.Group>
          
          <Row>
            <Col md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Teléfono Principal (Opcional)</Form.Label>
                    <Form.Control
                    type="text"
                    autoComplete="off"
                    value={telefonoPrincipal}
                    onChange={(e) => setTelefonoPrincipal(e.target.value)}
                    />
                </Form.Group>
            </Col>
            <Col md={6}>
                <Form.Group className="mb-3">
                    <Form.Label>Email Principal (Opcional)</Form.Label>
                    <Form.Control
                    type="email"
                    autoComplete="off"
                    value={emailPrincipal}
                    onChange={(e) => setEmailPrincipal(e.target.value)}
                    />
                </Form.Group>
            </Col>
          </Row>


          {tipoCliente === TipoClienteEnum.Empresa && (
            <>
              <hr className="my-4" />
              <h5 className="mb-3 text-primary">Primer Contacto de la Empresa</h5>
              <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nombre del Contacto *</Form.Label>
                        <Form.Control
                        type="text"
                        autoComplete="off"
                        value={contactoNombre}
                        onChange={(e) => setContactoNombre(e.target.value)}
                        required={tipoCliente === TipoClienteEnum.Empresa}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                     <Form.Group className="mb-3">
                        <Form.Label>Apellido del Contacto *</Form.Label>
                        <Form.Control
                        type="text"
                        autoComplete="off"
                        value={contactoApellido}
                        onChange={(e) => setContactoApellido(e.target.value)}
                        required={tipoCliente === TipoClienteEnum.Empresa}
                        />
                    </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email del Contacto *</Form.Label>
                        <Form.Control
                        type="email"
                        autoComplete="off"
                        value={contactoEmail}
                        onChange={(e) => setContactoEmail(e.target.value)}
                        required={tipoCliente === TipoClienteEnum.Empresa}
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Teléfono Directo (Opcional)</Form.Label>
                        <Form.Control
                        type="text"
                        autoComplete="off"
                        value={contactoTelefono}
                        onChange={(e) => setContactoTelefono(e.target.value)}
                        />
                    </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Cargo (Opcional)</Form.Label>
                <Form.Control
                  type="text"
                  autoComplete="off"
                  value={contactoCargo}
                  onChange={(e) => setContactoCargo(e.target.value)}
                />
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleModalClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                Creando...
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