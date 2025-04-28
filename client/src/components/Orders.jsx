import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Button, Select, Popconfirm, Spin, message, Card, DatePicker, Modal, Alert, notification } from 'antd';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import "css/Orders.css";

import getFetch from "utils/getFetch"
import { getShippingCost } from 'utils/getDataByUserType';
import formatPrice from 'utils/formatPrice.js'
import { isString } from 'antd/es/button';

const { RangePicker } = DatePicker;

const Orders = () => {
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [statusFilter, setStatusFilter] = useState(0);
    const [dateRange, setDateRange] = useState([null, null]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [orderDetails, setOrderDetails] = useState(null);

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await axios.get("http://localhost:8080/api/orders");

            // Procesar datos de órdenes
            const dataOrders = response.data.map(item => {
                const total = formatPrice(item.items.reduce((acc, item) => acc + item.price * item.quantity, 0))
                return {
                    ...item.order,
                    email: item.userData?.email || '',
                    total
                }
            });

            setOrders(dataOrders); // Establecer órdenes procesadas
            setFilteredOrders(dataOrders); // Inicialmente, mostrar todas las órdenes
            setLoading(false)
        } catch (error) {
            message.error("Error al cargar los pedidos.");
            console.error(error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(() => {
        let filtered = [...orders]; 
        if (statusFilter !== 0) filtered = filtered.filter(order => order.status_id === statusFilter);

        if (dateRange[0] && dateRange[1]) {
            const [start, end] = dateRange;
            filtered = filtered.filter(order => {
                const orderDate = new Date(order.order_date);
                return orderDate >= start && orderDate <= end;
            });
        }
        
        setFilteredOrders(filtered);
    }, [statusFilter, dateRange, orders]);

    const handleStatusFilterChange = (value) => {
        setStatusFilter(value); // Actualiza el estado del filtro
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates || [null, null]);
    };

    const showModal = async (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);

        try {
            const response = await axios.get(`http://localhost:8080/api/orders/${order.id}`);
            setOrderDetails(response.data); // Almacenar los detalles de la orden
        } catch (error) {
            message.error("Error al cargar los detalles de la orden.");
            console.error(error);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const renderModalContent = () => {
        if (!orderDetails) return null; // Si no hay detalles de la orden, no renderizar nada

        const { order, items, userData } = orderDetails;        

        const total = formatPrice(items.reduce((prev, curr) => (curr.price * curr.quantity) + prev, 0))

        return (
            <div>
                <p><strong>ID de Orden:</strong> {order.id}</p>
                <p><strong>Cliente:</strong> {userData.user_name} {userData.lastname}</p>
                <p><strong>Correo:</strong> {userData.email}</p>
                <p><strong>Teléfono:</strong> {userData.phone}</p>
                <p><strong>Dirección:</strong> {userData.address}, {userData.neighborhood}, {userData.city}</p>
                <p><strong>Fecha de Pedido:</strong> {new Date(order.order_date).toLocaleDateString()}</p>
                <p><strong>Total:</strong> ${total}</p>
                <p><strong>Estado:</strong>
                    {order.status_id === 1
                        ? "Pendiente"
                        : order.status_id === 2
                            ? "Enviado"
                            : order.status_id === 3
                                ? "Entregado"
                                : "Cancelado"}
                </p>

                <h3>Productos:</h3>
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
                        {items.map((item, index) => {
                            const price = item.price
                            const quantity = formatPrice(item.quantity)
                            const unitPrice = formatPrice(Math.trunc(price));
                            const total = formatPrice(quantity * unitPrice);

                            return (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{item.product_name} ({item.quality} - {item.presentation})</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{quantity}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${unitPrice}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${total}</td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
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

        );
    };

    const exportFilteredOrdersToExcel = async () => {
        const failedOrders = []; // Lista para almacenar los detalles de órdenes fallidas
        const detailedOrders = []; // Lista para almacenar los detalles exitosos

        setLoading(true); // Activamos la rueda de carga

        try {
            // Realizar todas las solicitudes en paralelo
            const responses = await Promise.all(
                filteredOrders.map(async (order) => {
                    try {
                        const response = await axios.get(`http://localhost:8080/api/orders/${order.id}`);
                        
                        const { order: orderDetails, items, userData: { city, phone, address } } = response.data;
                        // Crear filas por cada ítem y variación
                        items.forEach((item) => {
                            detailedOrders.push({
                                "ID de Orden": orderDetails.id,
                                Cliente: orderDetails.customer_name,
                                Ciudad: city,
                                Teléfono: phone,
                                Dirección: address,
                                "Correo Cliente": orderDetails.customer_email,
                                "Fecha de Pedido": new Date(orderDetails.order_date).toLocaleDateString(),
                                Estado:
                                    orderDetails.status_id === 1
                                        ? "Pendiente"
                                        : orderDetails.status_id === 2
                                            ? "Enviado"
                                            : orderDetails.status_id === 3
                                                ? "Entregado"
                                                : "Cancelado",
                                "Nombre del Producto": item.product_name,
                                Calidad: item.variation.quality,
                                Cantidad: item.quantity,
                                Precio: `$${item.price}`,
                                Total: `$${orderDetails.total}`
                            });
                        });
                    } catch (error) {
                        // Captura el detalle del error para la hoja de errores
                        failedOrders.push({
                            "ID de Orden": order.id,
                            Error: error.response
                                ? error.response.data.message || "Error desconocido"
                                : "No se pudo conectar con la API",
                        });
                    }
                })
            );

            // Crear hojas de trabajo
            const workbook = XLSX.utils.book_new();

            if (detailedOrders.length > 0) {
                const detailedWorksheet = XLSX.utils.json_to_sheet(detailedOrders);
                XLSX.utils.book_append_sheet(
                    workbook,
                    detailedWorksheet,
                    "Pedidos Detallados"
                );
            }

            if (failedOrders.length > 0) {
                const failedWorksheet = XLSX.utils.json_to_sheet(failedOrders);
                XLSX.utils.book_append_sheet(workbook, failedWorksheet, "Errores");
            }

            // Guardar el archivo Excel
            XLSX.writeFile(workbook, "Pedidos_Detallados_y_Errores.xlsx");

            // Mensajes al usuario
            if (detailedOrders.length > 0) {
                message.success("Archivo Excel generado exitosamente.");
            }
            if (failedOrders.length > 0) {
                message.warning(
                    `Algunas órdenes fallaron. Revisa la hoja de errores en el Excel.`
                );
            }
        } catch (error) {
            message.error("Error general al generar el archivo Excel.");
            console.error(error);
        } finally {
            setLoading(false); // Desactivamos la rueda de carga
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            // Cambiamos la URL para incluir directamente el id y el nuevo estado
            await axios.put(`http://localhost:8080/api/updatestatus/${orderId}/${newStatus}`);
            message.success("Estado del pedido actualizado correctamente.");
            fetchOrders(); // Refresca la lista de pedidos después de actualizar el estado
        } catch (error) {
            message.error("Error al actualizar el estado del pedido.");
            console.error(error);
        }
    };

    // Eliminar un pedido
    const deleteOrder = async (orderId) => {
        try {
            await axios.delete(`http://localhost:8080/api/deleteorders/${orderId}`);
            message.success("Pedido eliminado correctamente.");
            fetchOrders();
        } catch (error) {
            message.error("Error al eliminar el pedido.");
            console.error(error);
        }
    };

    const fetchOrderDetailsAndGeneratePDF = async (orderId) => {
        try {
            // Llamar a la API para obtener los detalles de la orden
            const response = await axios.get(`http://localhost:8080/api/orders/${orderId}`);
            const orderData = response.data;
            const { userData: { user_type } } = response.data
            
            let shippingCost = 0;
            let discountedShippingCost = null;

            // Obtener costos de envío
            const fetchedShippingCosts = await getFetch('customer-types', '');
            shippingCost = getShippingCost(fetchedShippingCosts, user_type);

            // Obtener datos del usuario
            try {
                const fetchedUser = await getFetch('users', `/${orderData.order.customer_id}`);
                if (fetchedUser.orders.length === 1) discountedShippingCost = shippingCost / 2;
            } catch (error) {
                discountedShippingCost = shippingCost
            }

            const percentageShippingCost = discountedShippingCost ?? shippingCost
            const total = orderData.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
            
            const amountShippingCost = total * percentageShippingCost
            
            const subtotal = total + amountShippingCost;

            const doc = new jsPDF();
            doc.setFontSize(10);
        
            // **Insertar el logo de la empresa**
            const logoUrl = '/images/1.png';
            doc.addImage(logoUrl, 'PNG', 10, 5, 50, 30);
        
            // **Información del remitente**
            const senderInfo = ['Don Kampo S.A.S', 'Nit 901.865.742', 'Chía - Cundinamarca', '3117366666'];
            const pageWidth = doc.internal.pageSize.width;
            const senderX = pageWidth - 50;
        
            doc.setFont('helvetica', 'bold');
            senderInfo.forEach((line, index) => {
                doc.text(line, senderX, 10 + (index * 5));
            });
        
            // **Título del documento y fecha**
            doc.setFontSize(14);
            doc.text("Detalles de la Orden", 10, 35);
        
            doc.setFont('helvetica', 'bold');
            doc.text("ID de la orden:", 10, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.order.id}`, 55, 50);

            const status = orderData.order.status_id === 1
            ? 'Pendiente' : orderData.order.status_id === 2
                ? 'Enviado' : orderData.order.status_id === 3
                    ? 'Entregado' : 'Cancelado';
            doc.setFont('helvetica', 'bold');
            doc.text("Estado:", 10, 55);
            doc.setFont('helvetica', 'normal');
            doc.text(`${status}`, 55, 55);
        
            doc.setFont('helvetica', 'bold');
            doc.text("Cliente:", 10, 60);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.user_name} ${orderData.userData.lastname}`, 55, 60);
        
            doc.setFont('helvetica', 'bold');
            doc.text("Correo:", 10, 65);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.email, 55, 65);
        
            doc.setFont('helvetica', 'bold');
            doc.text("Teléfono:", 10, 70);
            doc.setFont('helvetica', 'normal');
            doc.text(orderData.userData.phone, 55, 70);
        
            doc.setFont('helvetica', 'bold');
            doc.text("Dirección:", 10, 75);
            doc.setFont('helvetica', 'normal');
            doc.text(`${orderData.userData.address}${orderData.userData.neighborhood}, ${orderData.userData.city}`, 55, 75);
        
            // **Configuración de la tabla con los productos**
            const tableColumns = [
                { header: 'Producto', dataKey: 'description' },
                { header: 'Precio Unitario', dataKey: 'unitPrice' },
                { header: 'Cantidad', dataKey: 'quantity' },
                { header: 'Subtotal', dataKey: 'subtotal' },
            ];
        
            const tableData = orderData.items.flatMap((item) => {
                const price = isString(item.price) ? parseInt(item.price) : item.price

                return {
                description: `${item.product_name} (${item.quality} ${item.presentation})`,
                unitPrice: formatPrice(price),
                quantity: formatPrice(item.quantity),
                subtotal: formatPrice(price * item.quantity)
                };
            });
              
            // **Renderizar la tabla**
            doc.autoTable({
                columns: tableColumns,
                body: tableData,
                startY: 80, // Comienza justo después de la dirección
                styles: { fontSize: 10, halign: 'center' },
            });
        
            // **Calcular posición final para totales**
            const finalY = doc.lastAutoTable.finalY + 10;
        
            // **Agregar subtotales, envío y total al final**
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Valor envio: (${percentageShippingCost * 100}%): $${formatPrice(amountShippingCost)}`, 10, finalY + 5);
            doc.text(`Valor Productos: $${formatPrice(total)}`, 10, finalY);
            doc.setFontSize(14);
            doc.text(`Total Pedido: $${formatPrice(subtotal)}`, 10, finalY + 10);

            doc.setTextColor(255, 0, 0);
            doc.text(`Los pedidos pueden ser fluctuantes, por lo tanto pueden variar`, 10, finalY + 15);
        
            // Descargar el PDF
            doc.save(`Orden_${orderData.order.id}.pdf`);
        } catch (error) {
            console.error("Error al generar el PDF:", error);
        }
    };

     const orderColumns = [
        { title: 'ID de Orden', dataIndex: 'id', key: 'id' },
        { title: 'Cliente', dataIndex: 'email', key: 'email' },
        {
            title: 'Fecha',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(b.order_date) - new Date(a.order_date),
        },
        { title: 'Total', dataIndex: 'total', key: 'total' },
        {
            title: 'Estado',
            dataIndex: 'status_id',
            key: 'status_id',
            render: (status) => {
                const statusLabels = {
                    1: 'Pendiente',
                    2: 'Enviado',
                    3: 'Entregado',
                    4: 'Cancelado',
                    5: 'Pagado',
                };
                return statusLabels[status] || 'Desconocido';
            },
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, order) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                        defaultValue={order.status_id}
                        onChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                        style={{ width: 120 }}
                        onClick={(e) => e.stopPropagation()} // Evita que el evento burbujee
                    >
                        <Select.Option value={1}>Pendiente</Select.Option>
                        <Select.Option value={2}>Enviado</Select.Option>
                        <Select.Option value={3}>Entregado</Select.Option>
                        <Select.Option value={4}>Cancelado</Select.Option>
                        <Select.Option value={5}>Pagado</Select.Option>
                    </Select>
                    <Popconfirm
                        title="¿Estás seguro de eliminar este pedido?"
                        onConfirm={(e) => {
                            e.stopPropagation();
                            deleteOrder(order.id)
                        }}
                        onCancel={(e) => e.stopPropagation()}
                        okText="Sí"
                        cancelText="No"
                    >
                        <Button danger onClick={(e) => e.stopPropagation()}>Eliminar</Button>
                    </Popconfirm>
                    <Button onClick={(e) => {
                        e.stopPropagation();
                        fetchOrderDetailsAndGeneratePDF(order.id);
                    }}>
                        Generar PDF
                    </Button>
                </div>
            ),
        },
        
    ];

    return (
        <Card title="Gestión de Pedidos" style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '16px' }}>
                <Select
                    placeholder="Filtrar por estado"
                    allowClear
                    onChange={handleStatusFilterChange}
                    value={statusFilter}
                    style={{ width: 200 }}
                >
                    <Select.Option value={0}>Todos</Select.Option>
                    <Select.Option value={1}>Pendiente</Select.Option>
                    <Select.Option value={2}>Enviado</Select.Option>
                    <Select.Option value={3}>Entregado</Select.Option>
                    <Select.Option value={4}>Cancelado</Select.Option>
                    <Select.Option value={5}>Pagado</Select.Option>
                </Select>
                <RangePicker
                    onChange={handleDateRangeChange}
                    format="YYYY-MM-DD"
                />
                <Button type="primary" onClick={exportFilteredOrdersToExcel}>
                    Descargar Excel
                </Button>
            </div>
            <Spin spinning={loading}>
                <Table
                    dataSource={filteredOrders}
                    columns={orderColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    onRow={(record) => ({
                        onClick: () => showModal(record),
                    })}
                />
            </Spin>
            <Modal
                title="Detalles de la Orden"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key={1} onClick={() => fetchOrderDetailsAndGeneratePDF(selectedOrder.id)}>
                        Generar PDF
                    </Button>,
                ]}
                width={800}
            >
                {renderModalContent()}
            </Modal>
        </Card>
    );
};

const UpdateOrderPrices = () => {
    const [loading, setLoading] = useState(false);
  
    const handleUpdatePrices = async () => {
      setLoading(true);
  
      try {
        const response = await axios.put("http://localhost:8080/api/orders/updatePrices");
        notification.success({
          message: "Éxito",
          description: response.data.msg || "Los precios se han actualizado correctamente.",
        });
      } catch (error) {
        console.error("Error al actualizar los precios:", error);
        notification.error({
          message: "Error",
          description: error.response?.data?.msg || "Hubo un problema al actualizar los precios.",
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      
      <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2>Actualización de Órdenes en estado pendiente </h2>
        <span style={{ fontSize: "20px", color: "#333" }}>
        Este proceso actualizará los precios de las órdenes en estado <strong>pendiente </strong> 
        con los precios más recientes registrados en el sistema. 
        </span>
        <Alert
          message="Atención"
          description={
            <span style={{ fontSize: "14px", lineHeight: "1.6", color: "#555"  }}>
              Este proceso es delicado y afectará las órdenes <strong style={{ fontSize: "18px" }}>pendientes</strong>.
              Asegúrate de que los precios actuales en el sistema sean correctos antes de continuar.
            </span>
          }
          type="warning"
          showIcon
          style={{ marginBottom: "24px", textAlign: "left" }}
        />
        <Button
          type="primary"
          onClick={handleUpdatePrices}
          disabled={loading}
          style={{ padding: "12px 24px", fontSize: "16px", fontWeight: "bold" }}
        >
          {loading ? <Spin /> : "Actualizar Órdenes Pendientes"}
        </Button>
      </div>
    );
};
  
export { Orders, UpdateOrderPrices };