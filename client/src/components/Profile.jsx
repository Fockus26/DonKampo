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
} from "antd";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import axios from "axios";
import getFetch from 'utils/getFetch';
import * as XLSX from "xlsx";
import fruits from 'assets/fruits.jpg'
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "css/Profile.css";

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
  
  useEffect(() => {
    const fetchUserData = async () => {
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      if (loginData && loginData.user) {
        try {
          const response = await axios.get(`http://localhost:8080/api/users/${loginData.user.id}`);
          const user = response.data.user;
          setUserData(user);
          form.setFieldsValue(user);

          // Cargar pedidos
          const ordersResponse = await axios.get("http://localhost:8080/api/orders");
          
          
          const userOrders = ordersResponse.data.filter(order => order.order.customer_id === loginData.user.id);
          setOrders(userOrders);

          const userIdOrders = userOrders.map(order => order.order)     
          setFilteredOrders(userIdOrders);

        } catch (error) {
          message.error("Error al cargar los datos.");
          console.error(error);
        };
      } else {
        message.error("Debe iniciar sesión para ver su perfil.");
      }
    };

    fetchUserData();
  }, [form]);

  const handleSaveChanges = async () => {
    try {
      const values = form.getFieldsValue();
      const loginData = JSON.parse(localStorage.getItem("loginData"));
      await axios.put(`http://localhost:8080/api/updateusers/${loginData.user.id}`, values);
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

  const fetchOrderDetailsAndGeneratePDF = async (orderId) => {
    try {
      // Llamar a la API para obtener los detalles de la orden
      const response = await axios.get(`http://localhost:8080/api/orders/${orderId}`);
      const orderData = response.data;


      // Llamar a la API para obtener los tipos de cliente y costos de envío
      const customerTypeResponse = await axios.get("http://localhost:8080/api/customer-types");
      const customerTypes = customerTypeResponse.data.reduce((acc, type) => {
        acc[type.type_name.toLowerCase()] = parseInt(type.shipping_cost, 10);
        return acc;
      }, {});

      // Verificar si existe el campo user_type o type_name en userData
      const userType = orderData.userData?.user_type?.toLowerCase() || orderData.userData?.type_name?.toLowerCase();

      if (!userType) {
        throw new Error("El tipo de usuario (type_name o user_type) no está definido en los datos de la orden.");
      }

      // Obtener el porcentaje de envío y calcular el costo
      const totalValue = orderData.order.total;
      const shippingPercentage = customerTypes[userType] || 0;
      let shippingCost = (totalValue * shippingPercentage) / 100;

      // Aplicar descuento si es la primera orden
      if (orderData.isFirstOrder) {
        shippingCost /= 2;
      }

      // Crear el PDF (el resto del código permanece igual)
      const doc = new jsPDF();
      doc.setFontSize(10);

      // Insertar el logo de la empresa
      const logoUrl = '/images/1.png';
      doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30);

      // Información del remitente
      const senderInfo = ['Don Kampo S.A.S', 'Nit 901.865.742', 'Chía - Cundinamarca', '3117366666'];
      const pageWidth = doc.internal.pageSize.width;
      const senderX = pageWidth - 50;

      doc.setFont('helvetica', 'bold');
      senderInfo.forEach((line, index) => {
        doc.text(line, senderX, 10 + (index * 5));
      });

      // Título del documento
      doc.text("Detalles de la Orden", 10, 35);

      // Información de la orden
      const yOffset = 40;
      const lineHeight = 5;

      doc.setFont('helvetica', 'bold');
      doc.text("ID de Orden:", 10, yOffset);
      doc.setFont('helvetica', 'normal');
      doc.text(`${orderData.order.id}`, 33, yOffset);

      const status = orderData.order.status_id === 1
        ? 'Pendiente'
        : orderData.order.status_id === 2
          ? 'Enviado'
          : orderData.order.status_id === 3
            ? 'Entregado'
            : 'Cancelado';
      doc.setFont('helvetica', 'bold');
      doc.text("Estado:", 10, yOffset + lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(status, 33, yOffset + lineHeight);

      doc.setFont('helvetica', 'bold');
      doc.text("Cliente:", 10, yOffset + 2 * lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(`${orderData.userData.user_name} ${orderData.userData.lastname}`, 33, yOffset + 2 * lineHeight);

      doc.setFont('helvetica', 'bold');
      doc.text("Correo:", 10, yOffset + 3 * lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(orderData.userData.email, 33, yOffset + 3 * lineHeight);

      doc.setFont('helvetica', 'bold');
      doc.text("Teléfono:", 10, yOffset + 4 * lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(orderData.userData.phone, 33, yOffset + 4 * lineHeight);

      doc.setFont('helvetica', 'bold');
      doc.text("Dirección:", 10, yOffset + 5 * lineHeight);
      doc.setFont('helvetica', 'normal');
      doc.text(`${orderData.userData.address}${orderData.userData.neighborhood}, ${orderData.userData.city}`, 33, yOffset + 5 * lineHeight);

      // Datos de los productos y la tabla (sin cambios)
      const productData = orderData.items.map((item) => ({
        "Producto": `${item.product_name} (${item.variation.quality} ${item.variation.quantity})`,
        "Cantidad": item.quantity,
        "Precio Unitario": `$${item.variation.price_home.toLocaleString()}`,
        "Total": `$${(item.quantity * item.variation.price_home).toLocaleString()}`
      }));

      const columns = [
        { title: "Producto", dataKey: "Producto" },
        { title: "Cantidad", dataKey: "Cantidad" },
        { title: "Precio Unitario", dataKey: "Precio Unitario" },
        { title: "Total", dataKey: "Total" }
      ];

      autoTable(doc, {
        head: [columns.map(col => col.title)],
        body: productData.map(item => Object.values(item)),
        startY: yOffset + 6 * lineHeight,
        theme: 'grid',
        margin: { top: 10 },
        styles: {
          head: {
            fillColor: '#00983a',
            textColor: '#ffffff'
          },
          body: {
            justify: 'center',
            textColor: '#000000'
          }
        }
      });

      // Agregar el costo de envío al PDF
      doc.text(`Valor envío: $${shippingCost.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 10);

      // Valor productos
      doc.text(`Valor productos: $${Math.floor(orderData.order.total).toLocaleString()}`, 10, doc.autoTable.previous.finalY + 17);

      // Total de la Orden
      const totalPedido = Math.floor(orderData.order.total + shippingCost); // Suma y elimina los decimales
      doc.text(`Total Pedido: $${totalPedido.toLocaleString()}`, 10, doc.autoTable.previous.finalY + 25);

      // Descargar el PDF
      doc.save(`Orden_${orderData.order.id}.pdf`);
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
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

  const renderProfile = () => (
    <Card title="Perfil de Usuario" className="user-profile-card">
      <Form form={form} layout="vertical" onFinish={handleSaveChanges}>
        <Row gutter={24}>
          <Col xs={24} sm={12}>
            <Form.Item label="Nombre" name="user_name">
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Apellido" name="lastname">
              <Input />
            </Form.Item>
          </Col>
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
  );

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
                onClick={() => fetchOrderDetailsAndGeneratePDF(record.id)}
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
        <Table
          dataSource={filteredOrders}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          onRow={record => ({ onClick: () => renderModal(record) })}
        />
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

  const renderOrderDetailsModal = () =>
    isModalVisible && (
      
      <Modal
        title='Detalles de Orden'
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
      >
        {actualOrder && (
          <div className="modal-content-horizontal">
            <div className="modal-section-horizontal">
              <p><strong>Id de Orden:</strong> {actualOrder.order.id}</p>
              <p><strong>Cliente:</strong> {actualOrder.userData.user_name}</p>
              <p><strong>Email:</strong> {actualOrder.userData.email}</p>
              <p><strong>Telefono:</strong> {actualOrder.userData.phone}</p>
              <p><strong>Direccion:</strong> {actualOrder.userData.address}</p>
              <p>
                <strong>Fecha de Pedido:</strong>{" "}
                {new Date(actualOrder.order.order_date).toLocaleDateString()}
              </p>
              <p>
                <strong>Fecha de Entrega:</strong>{" "}
                {new Date(new Date(actualOrder.order.order_date).setDate(new Date(actualOrder.order.order_date).getDate() + 1)).toLocaleDateString()}
              </p>
              <p className="modal-total-horizontal">
                <strong>Total (incluye envio):</strong> ${parseInt(actualOrder.order.total).toLocaleString()}</p>
              <p>
                <strong>Estado:</strong>{" "}
                {renderStatus(actualOrder.order.status_id)}
              </p>
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
                              const priceHome = parseFloat(item.variation.price_home);
                              const unitPrice = Math.trunc(priceHome);
                              const total = item.quantity * unitPrice;

                              return (
                                  <tr key={index}>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.product_name} ({item.variation.quality} {item.variation.quantity})</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.quantity}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${unitPrice.toLocaleString()}</td>
                                      <td style={{ border: '1px solid #ddd', padding: '8px' }}>${total.toLocaleString()}</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    )

  return (
    <>
      <Header />
      <div className="user-profile-container">
        {view === "welcome" && renderWelcome()}
        {view === "profile" && renderProfile()}
        {view === "orders" && renderOrdersTable()}
        {renderOrderDetailsModal()}
      </div>
      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default Profile;
