import React, { useState } from "react";
import { Form, Input, Button, message, Select, Modal } from "antd";
import axios from "axios";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import { useNavigate } from "react-router-dom";
import "css/Register.css";
import fruits from "assets/fruits.jpg";

const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [ userTypeSelected, setUserTypeSelected ] = useState('');
  const navigate = useNavigate();

  const handleCancel = () => {
    navigate(-1); // Navega a la página anterior si el usuario cancela
  };

  const renderUserTypeSelection = () => {
  
    const categories = ['hogar', 'restaurante', 'supermercado', 'fruver'];
    return (
      <Modal
        title="Escoge tu tipo de usuario"
        open={!userTypeSelected.length}
        footer={null}
        onCancel={handleCancel}
        width={800}
        className="chooseUserType"
      >
        <div className="categories">
          {categories.map((category, index) => (
            <div
              key={index}
              className="category"
              onClick={() => setUserTypeSelected(category)}
            >
              {category}
            </div>
          ))}
        </div>
      </Modal>
    );
  };

  const onFinish = async (values) => {    
    const {
      user_name,
      email,
      phone,
      city,
      user_password,
    } = values;

    const user_type = userTypeSelected
    const lastname = values.lastname || ''

    setLoading(true);
    try {
      const response = await axios.post(
        "https://don-kampo-api-5vf3.onrender.com/api/createusers",
        {
          user_name,
          lastname,
          email,
          phone,
          city,
          address: " ",
          neighborhood: " ",
          user_password,
          user_type,
        }
      );

      message.success(response.data.msg);

      const redirectTo = localStorage.getItem("redirectTo") || "/";
      navigate(redirectTo === "/cart" ? "/login" : "/login", { replace: true });
    } catch (error) {
      message.error(
        error.response?.data?.msg ||
          "Error al registrar el usuario. Inténtalo nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      { userTypeSelected.length ? (
        <>
          <img id="fruits" src={fruits} alt="" />
          <Header />
          <div className="register-container">
            <h2>Registro de Usuario</h2>
            <Form
              name="register_form"
              onFinish={onFinish}
              layout="vertical"
              className="register-form"
            >
              <div className="form-row">
                {/* Nombre */}
                <Form.Item
                  label={`Nombre ${userTypeSelected !== 'hogar' ? 'de Empresa' : ''}`}
                  name="user_name"
                  rules={[{ required: true, message: `Por favor ingresa tu nombre ${userTypeSelected !== 'Hogar' ? 'de Empresa' : ''}` }]}
                >
                  <Input placeholder={`Nombre ${userTypeSelected !== 'hogar' ? 'de Empresa' : ''}`} />
                </Form.Item>

                {/* Apellido */}
                { userTypeSelected === 'hogar' &&
                  <Form.Item
                    label="Apellidos"
                    name="lastname"
                    rules={[{ required: false, message: "Por favor ingresa tu apellido" }]}
                  >
                    <Input placeholder="Apellido" />
                  </Form.Item>
                }
              </div>

              <div className="form-row">
                {/* Correo Electrónico */}
                <Form.Item
                  label="Correo Electrónico"
                  name="email"
                  rules={[
                    { required: true, message: "Por favor ingresa tu correo electrónico" },
                    { type: "email", message: "Ingresa un correo electrónico válido" },
                  ]}
                >
                  <Input placeholder="Correo Electrónico" />
                </Form.Item>

                {/* Teléfono */}
                <Form.Item
                  label="Teléfono"
                  name="phone"
                  rules={[
                    { required: true, message: "Por favor ingresa tu número de teléfono" },
                  ]}
                >
                  <Input placeholder="Teléfono" />
                </Form.Item>
              </div>

              <div className="form-row">
                {/* Ciudad */}
                <Form.Item
                  label="Ciudad / Municipio"
                  name="city"
                  rules={[
                    { required: true, message: "Por favor selecciona tu ciudad" },
                  ]}
                >
                  <Select placeholder="Selecciona una ciudad">
                    <Option value="Chía">Chía</Option>
                    <Option value="Cajicá">Cajicá</Option>
                  </Select>
                </Form.Item>

                {/* Contraseña */}
                <Form.Item
                  label="Contraseña"
                  name="user_password"
                  rules={[
                    { required: true, message: "Por favor ingresa una contraseña" },
                    { min: 6, message: "La contraseña debe tener al menos 6 caracteres" },
                    {
                      pattern: /^(?=.*[a-zA-Z])(?=.*\d)[A-Za-z\d]{6,}$/,
                      message: "La contraseña debe ser alfanumérica",
                    },
                  ]}
                >
                  <Input.Password placeholder="Contraseña" />
                </Form.Item>
              </div>

              {/* Botón de Registro */}
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Registrar
                </Button>
              </Form.Item>
            </Form>
          </div>
          <FloatingButtons />
          <CustomFooter />
        </>
        ) : (
          renderUserTypeSelection()
        )
      }
    </>
  );
};

export default Register;
