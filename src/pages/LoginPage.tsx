// src/pages/LoginPage.tsx (o donde prefieras ubicar tus páginas)
import React, { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { LoginDto, RegistroDto } from '../types/auth';
import { Form, Button, Alert, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import PasswordInput from '../components/common/PasswordInput';


// --- Componente interno para el formulario de Login ---
const LoginForm: React.FC<{ onSwitchToRegister: () => void }> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el inicio de sesión.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <h2 className="h3">Bienvenido de Nuevo</h2>
        <p className="text-muted">Por favor, inicia sesión en tu cuenta.</p>
      </div>
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Control type="email" placeholder="Correo Electrónico" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
        </Form.Group>
        <Form.Group className="mb-3">
          <PasswordInput placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button variant="primary" type="submit" disabled={isLoading} className="w-100 mt-3">
          {isLoading ? <Spinner as="span" size="sm" /> : 'Ingresar'}
        </Button>
      </Form>
      <p className="mt-4 text-center text-sm text-muted">
        ¿No tienes una cuenta?{' '}
        <Button variant="link" onClick={onSwitchToRegister} className="p-0">Regístrate</Button>
      </p>
    </>
  );
};

const RegisterForm: React.FC<{ onSwitchToLogin: () => void }> = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState<RegistroDto>({ nombre: '', apellido: '', username: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // --- 4. VALIDACIÓN: Comprobar que las contraseñas coincidan ---
    if (formData.password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setIsLoading(false);
      return;
    }

    try {
      await register(formData);
      setSuccess("¡Registro exitoso! Tu cuenta está pendiente de activación por un administrador.");
    } catch (err: any) {
      setError(err.response?.data?.errors?.map((e: any) => e.description).join(', ') || 'Error en el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-4">
        <h2 className="h3">Crear una Cuenta</h2>
        <p className="text-muted">Completa tus datos para registrarte.</p>
      </div>
      {success ? <Alert variant="success">{success}</Alert> : (
        <Form onSubmit={handleSubmit}>
          <Row><Col><Form.Control className="mb-3" name="nombre" placeholder="Nombre" onChange={handleChange} required /></Col><Col><Form.Control className="mb-3" name="apellido" placeholder="Apellido" onChange={handleChange} required /></Col></Row>
          <Form.Control className="mb-3" name="username" placeholder="Nombre de usuario" onChange={handleChange} required />
          <Form.Control className="mb-3" type="email" name="email" placeholder="Correo Electrónico" onChange={handleChange} required />
          <Form.Group className="mb-3">
            <PasswordInput name="password" placeholder="Contraseña" onChange={handleChange} required />
          </Form.Group>
          <Form.Group className="mb-3">
            <PasswordInput placeholder="Confirmar Contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
          </Form.Group>
          {error && <Alert variant="danger">{error}</Alert>}
          <Button variant="primary" type="submit" disabled={isLoading} className="w-100 mt-3">
            {isLoading ? <Spinner as="span" size="sm" /> : 'Registrarse'}
          </Button>
        </Form>
      )}
      <p className="mt-4 text-center text-sm text-muted">
        ¿Ya tienes una cuenta?{' '}
        <Button variant="link" onClick={onSwitchToLogin} className="p-0">Ingresa con tu cuenta</Button>
      </p>
    </>
  );
};

const LoginPage: React.FC = () => {
  // 1. Estado para alternar entre formularios
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <Row className="justify-content-center w-100">
        <Col xs={12} sm={10} md={8} lg={6} xl={4}>
          <Card className="shadow-lg">
            <Card.Body className="p-4 p-md-5">
              {/* 2. Lógica principal que renderiza uno u otro formulario */}
              {isRegistering ? (
                <RegisterForm onSwitchToLogin={() => setIsRegistering(false)} />
              ) : (
                <LoginForm onSwitchToRegister={() => setIsRegistering(true)} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginPage;
