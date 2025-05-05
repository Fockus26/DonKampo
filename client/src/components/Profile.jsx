import React, { useEffect, useState } from "react";
import {
  Card,
  Button,
  message,
  Form,
  Input,
  Select,
  Divider,
  Row,
  Col,
  Table,
  Modal,
  DatePicker,
  Badge,
  Spin,
  Alert,
} from "antd";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import axios from "axios";
import * as XLSX from "xlsx";
import fruits from 'assets/fruits.jpg'
import "css/Profile.css";
import formatPrice from 'utils/formatPrice.js'
import { getShippingCost } from "utils/getDataByUserType";
import getFetch from "utils/getFetch";

import generateOrderPDF from "utils/generateOrderPDF.js"

const { Option } = Select;
const { RangePicker } = DatePicker;

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [view, setView] = useState("welcome"); // 'welcome', 'profile', 'orders'
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState([]);
  const [actualOrder, setActualOrder] = useState(null)
  const [loading, setLoading] = useState(false);
  const [shippingPercentage, setShippingPercentage] = useState(0)
  
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      if (loginData && loginData.user) {
        try {
          const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/users/${loginData.user.id}`);
          const user = response.data.user;
          setUserData(user);
          form.setFieldsValue(user);

          // Cargar pedidos
          const ordersResponse = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/orders");
          
          
          const userOrders = ordersResponse.data.filter(order => order.order.customer_id === loginData.user.id);
          setOrders(userOrders);

          const userIdOrders = userOrders.map(order => order.order)     
          setFilteredOrders(userIdOrders);

        } catch (error) {
          message.error("Error al cargar los datos.");
          console.error(error);
        } finally {
          setLoading(false)
        }
      } else {
        message.error("Debe iniciar sesión para ver su perfil.");
      }
    };

    fetchUserData();

    const fetchShippingCosts = async () => {
      // Llamar a la API para obtener los tipos de cliente y costos de envío
      const customerTypeResponse = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/customer-types");

      const shippingPercentage = getShippingCost(customerTypeResponse.data)

      setShippingPercentage(shippingPercentage)
    }

    fetchShippingCosts()
  }, [form]);

  const handleSaveChanges = async () => {
    try {
      const values = form.getFieldsValue();
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      await axios.put(`https://don-kampo-api-5vf3.onrender.com/api/updateusers/${loginData.user.id}`, values);
      setUserData(values);
      message.success("Datos actualizados exitosamente.");
    } catch (error) {
      message.error("Error al actualizar los datos.");
      console.error(error);
    }
  };

  // Función para renderizar el estado con color
  const renderStatus = (statusId) => {
    let statusText = "";
    let color = "";

    switch (statusId) {
      case 1:
        statusText = "Pendiente";
        color = "orange";
        break;
      case 2:
        statusText = "Enviado";
        color = "blue";
        break;
      case 3:
        statusText = "Entregado";
        color = "green";
        break;
      case 4:
        statusText = "Cancelado";
        color = "red";
        break;
      default:
        statusText = "Desconocido";
        color = "grey";
    }

    return <Badge color={color} text={statusText} />;
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    filterOrders(value, dateRange);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    filterOrders(searchTerm, dates);
  };

  const filterOrders = (term, range) => {
    const filtered = orders.filter((order) => {
      const matchTerm =
        order.id.toString().includes(term) ||
        renderStatus(order.status_id).props.text.toLowerCase().includes(term);

      const matchDate =
        !range ||
        range.length === 0 ||
        (new Date(order.order_date) >= range[0].startOf("day").toDate() &&
          new Date(order.order_date) <= range[1].endOf("day").toDate());

      return matchTerm && matchDate;
    });
    setFilteredOrders(filtered);
  };

  const handleExportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredOrders);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pedidos");
    XLSX.writeFile(workbook, "Historial_Pedidos.xlsx");
  };

  const renderWelcome = () => (
    <div className="welcome-section">
      <h2 className="welcome-message" style={{ marginBottom: "4%" }}>
        Bienvenido a tu perfil, {userData?.user_name}!
      </h2>
      <p className="profile-description">
        Selecciona una de las opciones a continuación para ver o editar tu
        información personal o revisar tu historial de pedidos.
      </p>
      <Button
        type="primary"
        onClick={() => setView("profile")}
        className="profile-button"
      >
        Editar Perfil
      </Button>
      <Button
        type="default"
        onClick={() => setView("orders")}
        className="orders-button"
      >
        Ver Pedidos
      </Button>
    </div>
  );

  const renderProfile = () => {
    const isHome = userData.user_type === 'hogar'

    return (
      <Card title="Perfil de Usuario" className="user-profile-card">
        <Form form={form} layout="vertical" onFinish={handleSaveChanges}>
          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item label={`Nombre ${isHome ? '' : 'Comercial'}`} name="user_name">
                <Input />
              </Form.Item>
            </Col>
            { isHome && 
              <Col xs={24} sm={12}>
                <Form.Item label="Apellido" name="lastname">
                  <Input />
                </Form.Item>
              </Col>
            }
            <Col xs={24} sm={12}>
              <Form.Item label="Email" name="email">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Teléfono" name="phone">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Ciudad" name="city">
                <Select>
                  <Option value="Chía">Chía</Option>
                  <Option value="Cajicá">Cajicá</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Dirección" name="address">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Barrio" name="neighborhood">
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <div className="buttons-container">
            <Button type="primary" htmlType="submit" className="save-button">
              Guardar Cambios
            </Button>
            <Button
              type="default"
              onClick={() => setView("welcome")}
              className="back-button"
            >
              Volver
            </Button>
          </div>
        </Form>
      </Card>
    )
  };

  const renderModal = order => {
    const filter = orders.filter(newOrder => newOrder.order.id === order.id)[0]
    
    setActualOrder(filter)
    setIsModalVisible(true)    
  }

  const renderOrdersTable = () => {
    const orderColumns = [
      {
        title: "ID de Orden",
        dataIndex: "id",
        key: "id",
      },
      {
        title: "Fecha",
        dataIndex: "order_date",
        key: "order_date",
        render: (date) => new Date(date).toLocaleDateString(),
      },
      {
        title: "Estado",
        dataIndex: "status_id",
        key: "status_id",
        render: renderStatus,
        sorter: (a, b) => a.status_id - b.status_id,
        defaultSortOrder: 'ascend'
      },
      {
        title: "Total",
        dataIndex: "total",
        key: "total",
        render: (total) => `$${parseInt(total).toLocaleString()}`,
      },
      {
        title: "Acciones",
        key: "actions",
        render: (_, record) => (
          <>          
              <Divider type="vertical" />
              <Button
                type="link"
                className="link-button-2"
                onClick={(e) => {
                  e.stopPropagation();
                  generateOrderPDF(record.id);
                }}
              >
                Generar PDF
              </Button>              
          </>
        ),
      },
    ];

    return (
      <Card title="Historial de Pedidos" className="user-orders-card">
        <img id="fruits" src={fruits} alt="" />
        <div className="table-controls">
          <Input
            placeholder="Buscar por ID o Estado"
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: 200, marginRight: "10px" }}
          />
          <RangePicker
            onChange={handleDateRangeChange}
            style={{ marginRight: "10px" }}
          />
          <Button onClick={handleExportToExcel}>Exportar a Excel</Button>
        </div>
        <Spin spinning={loading}>    
          <Table
            dataSource={filteredOrders}
            columns={orderColumns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            onRow={record => ({ onClick: () => renderModal(record) })}
          />
        </Spin>
        <Button
          type="default"
          onClick={() => setView("welcome")}
          className="back-button"
        >
          Volver
        </Button>
      </Card>
    );
  };

  const renderOrderDetailsModal = () => {
    const {userData, order, items} = actualOrder || {};
    const {user_name, email, phone, address} = userData || {};
    const {id, order_date, status_id, requires_electronic_billing} = order || {};
    const date = new Date(order_date).toLocaleDateString()
    const deliveryDate = new Date(new Date(order_date).setDate(new Date(order_date).getDate() + 1)).toLocaleDateString()
    
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shippingCost = subtotal * shippingPercentage
    const total = formatPrice(subtotal + shippingCost)

    return (
      <Modal
        title='Detalles de Orden'
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
            <Button key={1} onClick={() => generateOrderPDF(id)}>
                Generar PDF
            </Button>,
        ]}
      >
        {actualOrder && (
          <div className="modal-content-horizontal">
            <div className="modal-section-horizontal">
              <p><strong>Id de Orden:</strong> {id}</p>
              <p><strong>Cliente:</strong> {user_name}</p>
              <p><strong>Email:</strong> {email}</p>
              <p><strong>Telefono:</strong> {phone}</p>
              <p><strong>Direccion:</strong> {address}</p>
              <p>
                <strong>Fecha de Pedido:</strong>{" "}{date}
              </p>
              <p>
                <strong>Fecha de Entrega:</strong>{" "}{deliveryDate}
              </p>
              <p className="modal-total-horizontal">
                <strong>Total (incluye envio):</strong> ${total}</p>
              <p>
                <strong>Estado:</strong>{" "}
                {renderStatus(status_id)}
              </p>
              <p><strong>Requiere Factura Electrónica:</strong> {requires_electronic_billing ? "Sí" : "No"}</p>
            </div>
            <div className="modal-section-horizontal">
              <h4>Productos:</h4>
              <div className="modal-product-list-horizontal">
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                      <thead>
                          <tr>
                              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Producto</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Cantidad</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Precio Unitario</th>
                              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Total</th>
                          </tr>
                      </thead>
                      <tbody>
                          {actualOrder.items.map((item, index) => {
                              const { product_name, quantity, quality, price } = item
                                                            
                              const unitPrice = parseInt(price)
                              const total = item.quantity * unitPrice;

                              return (
                                  <tr key={index}>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{product_name} ({quality} - {formatPrice(quantity)})</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatPrice(quantity)}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${formatPrice(unitPrice)}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${formatPrice(total)}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                </table>
              </div>
            </div>

            <Alert
              message="Información importante"
              description="El precio del envío se calcula automáticamente y se incluye en el PDF."
              type="warning"
              showIcon
              style={{
                  marginTop: '16px',
                  marginBottom: '16px',
                  backgroundColor: '#fffbe6',
                  padding: '4px 8px', // Padding más pequeño
                  fontSize: '12px',   // Tamaño de fuente más pequeño
              }}
              className="small-alert" // Clase adicional para personalización
            />
          </div>
        )}
      </Modal>
    )
  }

  return (
    <>
      <Header />
      <div className="user-profile-container">
        {view === "welcome" && renderWelcome()}
        {view === "profile" && renderProfile()}
        {view === "orders" && renderOrdersTable()}
        {actualOrder && renderOrderDetailsModal()}
      </div>
      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default Profile;
