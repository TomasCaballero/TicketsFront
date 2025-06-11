import React, { useState } from 'react';
import { Form, Button, InputGroup, type FormControlProps } from 'react-bootstrap';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons';

const PasswordInput: React.FC<FormControlProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <Form.Control
        {...props}
        type={showPassword ? 'text' : 'password'}
      />
      <Button
        variant="outline-secondary"
        onClick={() => setShowPassword(!showPassword)}
        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? <EyeSlashFill /> : <EyeFill />}
      </Button>
    </InputGroup>
  );
};

export default PasswordInput;