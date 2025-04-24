import React, { useState, useEffect } from "react";
import { Form, Select, Button, message, Input } from "antd";
import { jsPDF } from "jspdf";
import axios from "axios";
import "css/CreateOrder.css";
import { useNavigate } from "react-router-dom";
import fruits from 'assets/fruits.jpg'

const { Option } = Select;

const CreateOrder = () => {
  const [users, setUsers] = useState([]); // Lista de usuarios
  const [products, setProducts] = useState([]); // Lista de productos
  const [selectedProducts, setSelectedProducts] = useState([]); // Productos seleccionados para la orden
  const [loading, setLoading] = useState(false);
  const [selectedUserData, setSelectedUserData] = useState(null); // Datos del usuario seleccionado
  const [form] = Form.useForm(); // Crea una instancia del formulario
  const [searchText, setSearchText] = useState(""); // Texto para filtrar productos

  const navigate = useNavigate();

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const generatePDF = (orderData) => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Detalles de la Orden", 10, 10);

    doc.text(
      `Usuario: ${orderData.userData.user_name} ${orderData.userData.lastname}`,
      10,
      20
    );
    doc.text(`Correo: ${orderData.userData.email}`, 10, 30);
    doc.text(`Teléfono: ${orderData.userData.phone}`, 10, 40);
    doc.text(
      `Dirección: ${orderData.userData.address}, ${orderData.userData.city}`,
      10,
      50
    );

    doc.text("Productos:", 10, 60);
    let yPosition = 70;
    orderData.cartDetails.forEach((product, index) => {
      doc.text(
        `${index + 1}. ${product.productId} - Cantidad: ${
          product.quantity
        } - Precio: $${product.price}`,
        10,
        yPosition
      );
      yPosition += 10;
    });

    doc.text(`Costo de Envío: $${orderData.shippingCost}`, 10, yPosition + 10);
    doc.text(`Total: $${orderData.total}`, 10, yPosition + 20);

    doc.save(`Orden_${orderData.userId}.pdf`);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/users/${userId}`);
      setSelectedUserData(response.data.user);
    } catch (error) {
      message.error("Error al cargar los datos del usuario.");
      console.error(error);
    }
  };

  const handleUserChange = (userId) => {
    fetchUserDetails(userId);
  };

  useEffect(() => {
    // Fetch usuarios
    const fetchUsers = async () => {
      try {
        const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/users", {
          withCredentials: true,
        });
        setUsers(response.data);
      } catch (error) {
        message.error("Error al cargar los usuarios.");
        console.error(error);
      }
    };

    // Fetch productos
    const fetchProducts = async () => {
      try {
        const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/products", {
          withCredentials: true,
        });
        setProducts(response.data);
      } catch (error) {
        message.error("Error al cargar los productos.");
        console.error(error);
      }
    };

    fetchUsers();
    fetchProducts();
  }, []);

  const handleAddProduct = (productId, quantity) => {
    const product = products.find((p) => p.product_id === productId);
    if (product) {
      setSelectedProducts((prev) => {
        const existingProduct = prev.find((p) => p.product_id === productId);
        if (existingProduct) {
          return prev.map((p) =>
            p.product_id === productId
              ? { ...p, quantity: p.quantity + quantity }
              : p
          );
        }
        return [...prev, { ...product, quantity }];
      });
    }
  };

  const incrementQuantity = (productId) => {
    setSelectedProducts((prevSelected) =>
      prevSelected.map((item) =>
        item.product_id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decrementQuantity = (productId) => {
    setSelectedProducts(
      (prevSelected) =>
        prevSelected
          .map((item) =>
            item.product_id === productId
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0) // Elimina el producto si la cantidad llega a 0
    );
  };

  const handleSubmit = async (values) => {
    if (!selectedUserData) {
      message.error("Debe seleccionar un usuario válido.");
      return;
    }

    const { shippingMethod } = values;

    if (selectedProducts.length === 0) {
      message.error("Debe seleccionar al menos un producto para la orden.");
      return;
    }

    // Determina el costo de envío según el tipo de usuario
    const userType = selectedUserData.user_type.toLowerCase(); // Asegúrate de que esté en minúsculas
    const shippingCostMap = {
      standard: 5000,
      express: 10000,
    };
    const shippingCost = shippingCostMap[shippingMethod] || 5000;

    const total =
      selectedProducts.reduce(
        (sum, product) => sum + product.quantity * product.price_home,
        0
      ) + shippingCost;

    const orderData = {
      userId: selectedUserData.id,// Incluye el user_type en los datos de la orden
      userData: {
        user_name: selectedUserData.user_name,
        lastname: selectedUserData.lastname,
        email: selectedUserData.email,
        phone: selectedUserData.phone,
        address: selectedUserData.address,
        city: selectedUserData.city,
        user_type: selectedUserData.user_type, 
        neighborhood: selectedUserData.neighborhood,
      },
      cartDetails: selectedProducts.map(
        ({ product_id, quantity, price_home }) => ({
          productId: product_id,
          quantity,
          price: price_home,
        })
      ),
      shippingMethod,
      shippingCost,
      total,
      actual_delivery: new Date().toISOString(),
      estimatedDelivery: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    setLoading(true);
    try {
      const response = await axios.post("https://don-kampo-api-5vf3.onrender.com/api/orders/placeOrder", orderData);

      if (response.status === 201) {
        message.success("Orden creada exitosamente.");
        generatePDF(orderData); // Generar el PDF
        form.resetFields(); // Limpiar el formulario
        setSelectedProducts([]); // Limpiar los productos seleccionados
        navigate("/profile");
      } else {
        console.error("Estado inesperado:", response.status);
        message.error("Ocurrió un problema al crear la orden.");
      }
    } catch (error) {
      console.error("Error en el bloque catch:", error);
      message.error("Error al crear la orden.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <img id="fruits" src={fruits} alt="" />
      <div className="create-order-container">
        <h2>Crear Orden Manual</h2>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Usuario"
            name="userId"
            rules={[{ required: true, message: "Por favor seleccione un usuario" }]}
          >
            <Select
              placeholder="Seleccione un usuario"
              onChange={handleUserChange} // Llama a la función cuando cambia el usuario
            >
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.user_name} {user.lastname} - {user.email}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Método de Envío"
            name="shippingMethod"
            rules={[{ required: true, message: "Por favor seleccione un método de envío" }]}
          >
            <Select placeholder="Seleccione un método de envío">
              <Option value="standard">Estándar</Option>
              <Option value="express">Exprés</Option>
            </Select>
          </Form.Item>

          <div className="product-selection">
            <h3>Seleccionar Productos</h3>
            <Input
              placeholder="Buscar producto por nombre"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: "16px" }}
            />
            <div className="products-list">
              {filteredProducts.map((product) => (
                <div key={product.product_id} className="product-card">
                  <h4>{product.name}</h4>
                  <p>Precio: ${product.price_home}</p>
                  <Button onClick={() => handleAddProduct(product.product_id, 1)}>
                    Agregar al carrito
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="selected-products">
            <h3>Productos Seleccionados</h3>
            {selectedProducts.map((product) => (
              <div key={product.product_id} className="selected-product">
                <p>{product.name} - Cantidad: {product.quantity}</p>
                <Button onClick={() => incrementQuantity(product.product_id)}>
                  +
                </Button>
                <Button onClick={() => decrementQuantity(product.product_id)}>
                  -
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ marginTop: "16px" }}
          >
            Crear Orden
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default CreateOrder;
