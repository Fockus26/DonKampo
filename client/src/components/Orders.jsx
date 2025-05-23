import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Table, 
  Button, 
  Select, 
  Popconfirm, 
  Spin, 
  message, 
  Card, 
  DatePicker, 
  Modal, 
  Alert, 
  Checkbox,
  notification
} from 'antd';
import * as XLSX from 'xlsx';
import "css/Orders.css";

import { getShippingCost } from 'utils/getDataByUserType';
import formatPrice from 'utils/formatPrice.js'
import generateOrderPDF from 'utils/generateOrderPDF';

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
    const [shippingPercentage, setShippingPercentage] = useState(null);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isBulkModalVisible, setIsBulkModalVisible] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(null);

    useEffect(() => {
        if (isModalVisible) fetchShippingCosts()
        else setShippingPercentage(null)
    }, [isModalVisible]);

    const fetchOrders = async () => {
        setLoading(true)
        try {
            const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/orders");

            const dataOrders = response.data.map(item => {
                const total = formatPrice(item.items.reduce((acc, item) => acc + item.price * item.quantity, 0))
                return {
                    ...item.order,
                    email: item.userData?.email || '',
                    total
                }
            });

            setOrders(dataOrders);
            setFilteredOrders(dataOrders);
            setLoading(false)
        } catch (error) {
            message.error("Error al cargar los pedidos.");
            console.error(error);
        }
    };

    const fetchShippingCosts = async () => {
        const customerTypeResponse = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/customer-types");
        const shippingPercentage = getShippingCost(customerTypeResponse.data)
        setShippingPercentage(shippingPercentage);
    }

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
        setStatusFilter(value);
    };

    const handleDateRangeChange = (dates) => {
        setDateRange(dates || [null, null]);
    };

    const showModal = async (order) => {
        setSelectedOrder(order);
        setIsModalVisible(true);

        try {
            const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/orders/${order.id}`);
            setOrderDetails(response.data);
        } catch (error) {
            message.error("Error al cargar los detalles de la orden.");
            console.error(error);
        }
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const rowSelection = {
        selectedRowKeys: selectedOrders,
        onChange: (selectedRowKeys) => {
            setSelectedOrders(selectedRowKeys);
        },
    };

  const handleBulkUpdate = async () => {
    if (!selectedStatus) {
        message.error('Por favor selecciona un estado');
        return;
    }

    try {
        setLoading(true);
        await axios.put('https://don-kampo-api-5vf3.onrender.com/api/update-bulk-orders', {
            orderIds: selectedOrders,
            newStatus: selectedStatus
        });
        
        // Actualizar el estado local sin necesidad de recargar toda la página
        setOrders(prevOrders => prevOrders.map(order => {
            if (selectedOrders.includes(order.id)) {
                return { ...order, status_id: selectedStatus };
            }
            return order;
        }));
        
        message.success(`Actualizadas ${selectedOrders.length} órdenes correctamente`);
        setSelectedOrders([]);
        setIsBulkModalVisible(false);
        setSelectedStatus(null);
    } catch (error) {
        message.error('Error al actualizar órdenes');
        console.error(error);
    } finally {
        setLoading(false);
    }
};

    const renderModalContent = () => {
        if (!orderDetails) return <Spin spinning={true} />;

        const { order, items, userData } = orderDetails;
        const { id, status_id, order_date, requires_electronic_billing } = order;
        const { user_name, lastname, email, phone, address, neighborhood, city } = userData

        const subtotal = items.reduce((prev, curr) => (curr.price * curr.quantity) + prev, 0)

        if (!shippingPercentage) {
            return <Spin spinning={true} />;
        }

        const shippingCost = subtotal * shippingPercentage
        const total = formatPrice(subtotal + shippingCost)

        return (
            <div>
                <p><strong>ID de Orden:</strong> {id}</p>
                <p><strong>Cliente:</strong> {user_name} {lastname}</p>
                <p><strong>Correo:</strong> {email}</p>
                <p><strong>Teléfono:</strong> {phone}</p>
                <p><strong>Dirección:</strong> {address}, {neighborhood}, {city}</p>
                <p><strong>Fecha de Pedido:</strong> {new Date(order_date).toLocaleDateString()}</p>
                <p><strong>Total (incluye envio):</strong> ${total}</p>
                <p><strong>Estado:</strong>
                    { status_id === 1
                        ? "Pendiente" : status_id === 2
                            ? "Enviado" : status_id === 3
                                ? "Entregado" : "Cancelado"
                    }
                </p>
                <p><strong>Requiere Factura Electrónica:</strong> {requires_electronic_billing ? "Sí" : "No"}</p>

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
                            const { price, quantity, product_name, quality, presentation } = item
                            const unitPrice = parseInt(price)
                            const total = formatPrice(quantity * unitPrice);

                            return (
                            <tr key={index}>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{product_name} ({quality} - {presentation})</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatPrice(quantity)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '8px' }}>${formatPrice(unitPrice)}</td>
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
                        padding: '4px 8px',
                        fontSize: '12px',
                    }}
                    className="small-alert"
                />
            </div>
        );
    };

    const exportFilteredOrdersToExcel = async () => {
        const failedOrders = [];
        const detailedOrders = [];

        setLoading(true);

        try {
            const responses = await Promise.all(
                filteredOrders.map(async (order) => {
                    try {
                        const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/orders/${order.id}`);
                        
                        const { order: orderDetails, items, userData: { city, phone, address } } = response.data;
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
                        failedOrders.push({
                            "ID de Orden": order.id,
                            Error: error.response
                                ? error.response.data.message || "Error desconocido"
                                : "No se pudo conectar con la API",
                        });
                    }
                })
            );

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

            XLSX.writeFile(workbook, "Pedidos_Detallados_y_Errores.xlsx");

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
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await axios.put(`https://don-kampo-api-5vf3.onrender.com/api/updatestatus/${orderId}/${newStatus}`);
            message.success("Estado del pedido actualizado correctamente.");
            fetchOrders();
        } catch (error) {
            message.error("Error al actualizar el estado del pedido.");
            console.error(error);
        }
    };

    const deleteOrder = async (orderId) => {
        try {
            await axios.delete(`https://don-kampo-api-5vf3.onrender.com/api/deleteorders/${orderId}`);
            message.success("Pedido eliminado correctamente.");
            fetchOrders();
        } catch (error) {
            message.error("Error al eliminar el pedido.");
            console.error(error);
        }
    };

    const orderColumns = [
        { 
            title: 'ID de Orden', 
            dataIndex: 'id', 
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        { 
            title: 'Cliente', 
            dataIndex: 'email', 
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Fecha',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date) => new Date(date).toLocaleDateString(),
            sorter: (a, b) => new Date(b.order_date) - new Date(a.order_date),
        },
        { 
            title: 'Total', 
            dataIndex: 'total', 
            key: 'total',
            sorter: (a, b) => parseFloat(a.total.replace('$', '')) - parseFloat(b.total.replace('$', '')),
        },
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
            sorter: (a, b) => a.status_id - b.status_id,
            defaultSortOrder: 'ascend'
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (_, order) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Select
                        value={order.status_id}
                        key={order.status_id}
                        defaultValue={order.status_id}
                        onChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                        style={{ width: 120 }}
                        onClick={(e) => e.stopPropagation()}
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
                        generateOrderPDF(order.id);
                    }}>
                        Generar PDF
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <Card title="Gestión de Pedidos" style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                {selectedOrders.length >= 2 && (
                    <Button 
                        type="primary" 
                        onClick={() => setIsBulkModalVisible(true)}
                        style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}
                    >
                        Actualizar Ordenes ({selectedOrders.length})
                    </Button>
                )}
                
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

            <Modal
                title={`Actualizar ${selectedOrders.length} órdenes seleccionadas`}
                open={isBulkModalVisible}
                onCancel={() => {
                    setIsBulkModalVisible(false);
                    setSelectedStatus(null);
                }}
                footer={[
                    <Button key="cancel" onClick={() => {
                        setIsBulkModalVisible(false);
                        setSelectedStatus(null);
                    }}>
                        Cancelar
                    </Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        onClick={handleBulkUpdate}
                        disabled={!selectedStatus}
                        loading={loading}
                    >
                        Actualizar
                    </Button>,
                ]}
                centered
                className="modal-blur-backdrop"
                styles={{
                    content: {
                        maxWidth: '500px',
                        margin: '0 auto',
                    },
                    header: {
                        textAlign: 'center',
                        borderBottom: '1px solid #f0f0f0',
                    },
                    body: {
                        padding: '20px',
                    }
                }}
            >
                <Select
                    placeholder="Seleccionar nuevo estado"
                    style={{ width: '100%' }}
                    onChange={(value) => setSelectedStatus(value)}
                    value={selectedStatus}
                >
                    <Select.Option value={1}>Pendiente</Select.Option>
                    <Select.Option value={2}>Enviado</Select.Option>
                    <Select.Option value={3}>Entregado</Select.Option>
                    <Select.Option value={4}>Cancelado</Select.Option>
                    <Select.Option value={5}>Pagado</Select.Option>
                </Select>
            </Modal>

            <Spin spinning={loading}>
                <Table
                    dataSource={filteredOrders}
                    columns={orderColumns}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys: selectedOrders,
                        onChange: (selectedRowKeys) => {
                            setSelectedOrders(selectedRowKeys);
                        },
                    }}
                    onRow={(record) => ({
                        onClick: () => showModal(record),
                    })}
                />
            </Spin>

            <Modal
                title="Detalles de la Orden"
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={[
                    <Button key={1} onClick={() => generateOrderPDF(selectedOrder.id)}>
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
        const response = await axios.put("https://don-kampo-api-5vf3.onrender.com/api/orders/updatePrices");
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