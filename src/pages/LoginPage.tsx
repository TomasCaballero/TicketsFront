// src/pages/LoginPage.tsx (o donde prefieras ubicar tus páginas)
import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext'; // Ajusta la ruta si es necesario
import { useNavigate } from 'react-router-dom'; // Para la redirección después del login
import type { LoginDto } from '../types/auth'; // Ajusta la ruta si es necesario

// Importar componentes de React-Bootstrap
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { login } = useAuth();
  const navigate = useNavigate(); // Hook para la navegación programática

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const loginData: LoginDto = { email, password };

    try {
      await login(loginData);
      navigate('/dashboard'); // Redirige a una página de dashboard
    } catch (err: any) {
      if (err.response && err.response.data) {
        const errorMessage = typeof err.response.data === 'string' 
          ? err.response.data
          : err.response.data.message || err.response.data.Message || (err.response.data.Errors && err.response.data.Errors.join(', ')) || 'Error en el inicio de sesión.';
        setError(errorMessage);
      } else {
        setError('Error de red o el servidor no responde. Inténtalo más tarde.');
      }
      console.error('Error en el componente LoginPage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                {/* Puedes poner tu logo aquí */}
                {/* <img className="mx-auto h-12 w-auto" src="/path-to-your-logo.png" alt="Logo" /> */}
                <h2 className="mt-3 h3 font-weight-bold text-dark">
                  Bienvenido de Nuevo
                </h2>
                <p className="text-muted">
                  Por favor, inicia sesión en tu cuenta.
                </p>
              </div>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email-address">
                  <Form.Label visuallyHidden>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Correo Electrónico"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label visuallyHidden>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Contraseña"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </Form.Group>

                {error && (
                  <Alert variant="danger" className="mt-3">
                    <Alert.Heading as="h6" className="mb-1">Error al iniciar sesión</Alert.Heading>
                    <p className="mb-0" style={{ fontSize: '0.9rem' }}>{error}</p>
                  </Alert>
                )}

                {/* <Form.Group className="mb-3 d-flex justify-content-between align-items-center" controlId="formBasicCheckbox">
                  <Form.Check type="checkbox" label="Recordarme" disabled={isLoading} />
                  <a href="#" className="text-sm text-primary">
                    ¿Olvidaste tu contraseña?
                  </a>
                </Form.Group> */}

                <Button
                  variant="primary"
                  type="submit"
                  disabled={isLoading}
                  className="w-100 mt-3"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Ingresando...
                    </>
                  ) : (
                    'Ingresar'
                  )}
                </Button>
              </Form>
              <p className="mt-4 text-center text-sm text-muted">
                ¿No tienes una cuenta?{' '}
                <a href="/register" className="font-weight-medium text-primary"> {/* Usa Link de react-router-dom si /register es una ruta interna */}
                  Regístrate
                </a>
              </p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
