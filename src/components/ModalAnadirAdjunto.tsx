import React, { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Image from 'react-bootstrap/Image';
import { Col, Row } from 'react-bootstrap';

interface ModalAnadirAdjuntoProps {
  show: boolean;
  handleClose: () => void;
  onAdjuntoAnadido: (archivo: File, descripcion: string) => void;
}

const ModalAnadirAdjunto: React.FC<ModalAnadirAdjuntoProps> = ({
  show,
  handleClose,
  onAdjuntoAnadido,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [descripcion, setDescripcion] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (show) {
      setSelectedFile(null);
      setDescripcion('');
      setPreviewUrl(null);
      setError(null);
    }
  }, [show]);
  
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Por favor, selecciona un archivo.');
      return;
    }
    onAdjuntoAnadido(selectedFile, descripcion);
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Añadir Nuevo Adjunto</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          <Row>
            <Col md={previewUrl ? 7 : 12}>
              <Form.Group controlId="fileInput" className="mb-3">
                <Form.Label>Seleccionar archivo *</Form.Label>
                <Form.Control type="file" onChange={handleFileChange} required />
              </Form.Group>
              <Form.Group controlId="fileDescription">
                <Form.Label>Descripción (Opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </Form.Group>
            </Col>
            {previewUrl && (
              <Col md={5} className="text-center">
                <p className="text-muted mb-1">Previsualización:</p>
                <Image src={previewUrl} alt="Previsualización" thumbnail fluid style={{ maxHeight: '200px' }} />
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={!selectedFile}>
            Añadir a la lista
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ModalAnadirAdjunto;