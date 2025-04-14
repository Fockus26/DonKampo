import React, { useState } from "react";
import { Form, Input, Button, Modal, message } from "antd";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomFooter from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import "css/Login.css";
import Header from "components/General/Header";
import fruits from 'assets/fruits.jpg'

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isResetModalVisible, setIsResetModalVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  const onFinish = async (values) => {   
    const { email, user_password } = values;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/login",
        { email, user_password },
        { withCredentials: true } // Permite enviar cookies si el backend lo requiere
      );
      // Guarda los datos de inicio de sesión en localStorage
      localStorage.setItem("loginData", JSON.stringify(response.data));
      message.success(response.data.message);
    
      // Redirige al usuario
      const redirectTo = localStorage.getItem("redirectTo") || "/";
      navigate(redirectTo, { replace: true });
      localStorage.removeItem("redirectTo");
    } catch (error) {
      message.error("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
    
  };

  const handleForgotPassword = async () => {
    if (!email) {
      message.warning("Por favor ingresa tu correo electrónico.");
      return;
    }

    setForgotPasswordLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/request-password-reset",
        {
          email,
        },
        {
          withCredentials: true, // Incluye cookies si el backend requiere autenticación
          headers: {
            "Content-Type": "application/json", // Asegúrate de que coincida con lo esperado en el backend
          },
        }
        
      );
      message.success(
        response.data.message ||
          "Solicitud enviada. Por favor revisa tu correo electrónico."
      );
      setIsModalVisible(false);
      setIsResetModalVisible(true);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Ocurrió un error al solicitar el restablecimiento de contraseña."
      );
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code || !newPassword) {
      message.warning("Por favor ingresa el código y la nueva contraseña.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/verify-code-and-reset-password",
        {
          email,
          code,
          newPassword,
        },
        {
          withCredentials: true, // Incluye cookies si el backend requiere autenticación
          headers: {
            "Content-Type": "application/json", // Asegúrate de que coincida con lo esperado en el backend
          },
        }
      );
      message.success(
        response.data.message || "Contraseña restablecida exitosamente."
      );
      setIsResetModalVisible(false);
    } catch (error) {
      message.error(
        error.response?.data?.message ||
          "Ocurrió un error al restablecer la contraseña."
      );
    }
  };

  return (
    <>
      <img id="fruits" src={fruits} alt="" />
      <Header />
      <div className="login-container">
        <h2>Inicio de Sesión</h2>
        <Form name="login_form" onFinish={onFinish} layout="vertical">
          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[
              {
                required: true,
                message: "Por favor ingresa tu correo electrónico",
              },
            ]}
          >
            <Input type="email" placeholder="Correo Electrónico" />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="user_password"
            rules={[
              { required: true, message: "Por favor ingresa tu contraseña" },
            ]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Iniciar Sesión
            </Button>
          </Form.Item>
          <div
            className="forgot-password"
            onClick={() => setIsModalVisible(true)}
          >
            Olvidé mi contraseña
          </div>
        </Form>
      </div>

      <Modal
        title="Recuperar Contraseña"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleForgotPassword} layout="vertical">
          <Form.Item
            label="Correo Electrónico"
            name="email"
            rules={[
              {
                required: true,
                message: "Por favor ingresa tu correo electrónico",
              },
            ]}
          >
            <Input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={forgotPasswordLoading}
              block
            >
              Enviar Solicitud
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Restablecer Contraseña"
        open={isResetModalVisible}
        onCancel={() => setIsResetModalVisible(false)}
        footer={null}
      >
        <Form onFinish={handleResetPassword} layout="vertical">
          <Form.Item
            label="Código de Verificación"
            name="code"
            rules={[
              {
                required: true,
                message: "Por favor ingresa el código enviado a tu correo",
              },
            ]}
          >
            <Input
              placeholder="Código de Verificación"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="Nueva Contraseña"
            name="newPassword"
            rules={[
              {
                required: true,
                message: "Por favor ingresa tu nueva contraseña",
              },
            ]}
          >
            <Input.Password
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Restablecer Contraseña
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default Login;
