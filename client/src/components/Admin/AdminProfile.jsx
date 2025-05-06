import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import {
  Card,
  Button,
  Table,
  Modal,
  message,
  Divider,
  Select,
  Popconfirm,
  Form,
  Input,
  Row,
  Col,
  Upload,
  Progress,
} from "antd";
import Navbar from "components/General/Header";
import CustomFooter from "components/General/Footer";
import ManagePublicity from "./ManagePublicity";
import { ConsoleSqlOutlined, SearchOutlined } from "@ant-design/icons";
import FloatingButtons from "components/General/FloatingButtons";
import axios from "axios";
import getFetch from "utils/getFetch"
import * as XLSX from "xlsx";
import "css/AdminProfile.css";


const { Option } = Select;

const AdminProfile = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [globalSearchText, setGlobalSearchText] = useState("");
  const [products, setProducts] = useState([]); // Datos cargados del Excel
  const [progress, setProgress] = useState(0); // Progreso del envío
  const columns = [
    { title: "Nombre", dataIndex: "name", key: "name" },
    { title: "Descripción", dataIndex: "description", key: "description" },
    { title: "Categoría", dataIndex: "category", key: "category" },
    { title: "Stock", dataIndex: "stock", key: "stock" },
    {
      title: "Estado de Imagen",
      key: "imageStatus",
      render: (_, record) =>
        record.imageFile ? (
          <span style={{ color: "green" }}>Cargada</span>
        ) : (
          <span style={{ color: "red" }}>No cargada</span>
        ),
    },
    {
      title: "Imagen",
      key: "image",
      render: (_, record) => (
        <Upload
          accept="image/*"
          beforeUpload={(file) => {
            handleImageUpload(file, record.key);
            return false;
          }}
          showUploadList={false}
        >
          <Button type="link">Adjuntar Imagen</Button>
        </Upload>
      ),
    },
  ];

  const [shippingCosts, setShippingCosts] = useState({
    hogar: 0,
    fruver: 0,
    supermercado: 0,
    restaurante: 0,
  });

  const [loadingShipping, setLoadingShipping] = useState(false);

  const fetchShippingCosts = async () => {
    try {
      const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/customer-types");
      const costs = response.data.reduce((acc, type) => {
        acc[type.type_name.toLowerCase()] = parseInt(type.shipping_cost);
        return acc;
      }, {});
      setShippingCosts(costs); // Actualiza el estado con los datos cargados
    } catch (error) {
      message.error("Error al cargar los costos de envío.");
      console.error(error);
    }
  };

  const updateShippingCosts = async (values) => {
    setLoadingShipping(true);
    try {
      await axios.put("https://don-kampo-api-5vf3.onrender.com/api/customer-types/shipping-costs", values);
      message.success("Costos de envío actualizados exitosamente.");
      fetchShippingCosts(); // Refresca los datos
    } catch (error) {
      message.error("Error al actualizar los costos de envío.");
      console.error(error);
    } finally {
      setLoadingShipping(false);
    }
  };

  useEffect(() => { fetchShippingCosts(); }, []);
  useEffect(() => { formDelivery.setFieldsValue(shippingCosts); }, [shippingCosts]);

  const handleExcelUpload = (file) => {
    const reader = new FileReader();
  
    reader.onload = (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      const formattedData = jsonData.map((row, index) => {
        let variations = [];
        try {
          if (row["Variaciones"]) {
            // Procesar las variaciones como un JSON válido
            variations = JSON.parse(`[${row["Variaciones"]}]`);
          }
        } catch (error) {
          console.error("Error al procesar las variaciones:", error);
          message.error(`Error en la fila ${index + 1}: Variaciones mal formateadas.`);
        }
  
        // Extraer cada variación en columnas diferentes
        const variationEntries = variations.map((variation, vIndex) => ({
          [`Calidad Variación ${vIndex + 1}`]: variation.quality,
          [`Cantidad Variación ${vIndex + 1}`]: variation.quantity,
          [`Precio Hogar Variación ${vIndex + 1}`]: variation.price_home,
          [`Precio Supermercado Variación ${vIndex + 1}`]: variation.price_supermarket,
          [`Precio Restaurante Variación ${vIndex + 1}`]: variation.price_restaurant,
          [`Precio Fruver Variación ${vIndex + 1}`]: variation.price_fruver,
        }));
  
        return {
          key: index,
          name: row["Nombre"] || "",
          description: row["Descripción"] || "",
          category: row["Categoría"] || "",
          stock: parseInt(row["Stock"] || "0", 10),
          ...variationEntries.reduce((acc, entry) => ({ ...acc, ...entry }), {}),
          imageFile: null,
        };
      });
  
      setProducts(formattedData);
      message.success("Archivo cargado correctamente.");
    };
  
    reader.readAsArrayBuffer(file);
    return false; // Evitar la carga automática del archivo
  };

  const handleSendToAPI = async () => {
    setProgress(0);

    try {
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const formData = new FormData();
        if (product.imageFile) {
          formData.append("photo_url", product.imageFile);
        } else {
          message.warning(
            `El producto ${product.name} no tiene imagen. Saltando...`
          );
          continue;
        }
        formData.append("name", product.name);
        formData.append("description", product.description);
        formData.append("category", product.category);
        formData.append("stock", product.stock);

        // Asegurarse de enviar las variaciones correctamente como una cadena JSON
        formData.append("variations", JSON.stringify(product.variations));

        const response = await axios.post(
          "https://don-kampo-api-5vf3.onrender.com/api/createproduct",
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        if (response.status === 200) {
          setProgress(Math.round(((i + 1) / products.length) * 100));
          message.success(`Producto ${product.name} enviado correctamente.`);
        }
      }

      message.success("Todos los productos se enviaron correctamente.");
    } catch (error) {
      console.error("Error al enviar productos:", error);
      message.error("Ocurrió un error al enviar los productos.");
    } finally {
      setLoading(false);
    }
  };

  const sendProductsToAPI = async (products) => {
    try {
      for (const product of products) {
        const formData = new FormData();

        // Agregar datos básicos del producto
        formData.append("name", product.name);
        formData.append("description", product.description);
        formData.append("category", product.category);
        formData.append("stock", product.stock);

        // Agregar la URL o archivo de la imagen si está disponible
        if (product.photo_url) {
          formData.append("photo_url", product.photo_url);
        }

        // Agregar variaciones como JSON
        formData.append("variations", JSON.stringify(product.variations));

        await axios.post("https://don-kampo-api-5vf3.onrender.com/api/createproduct", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      message.success("Productos enviados exitosamente.");
    } catch (error) {
      message.error("Error al enviar productos a la API.");
      console.error(error);
    }
  };

  const handleImageUpload = (file, key) => {
    const updatedProducts = products.map((product) => {
      if (product.key === key) {
        return { ...product, imageFile: file }; // Asocia el archivo binario con el producto
      }
      return product;
    });

    setProducts(updatedProducts);
    message.success(`Imagen cargada para el producto con clave: ${key}`);
  };

  const getFilteredUsers = () => {
    if (!globalSearchText) return users;
    
    return users.filter((user) => {
      const statusText = renderUserStatus(user.status_id); // Convierte el estado a texto legible
      return (
        (user.user_name &&
          user.user_name.toLowerCase().includes(globalSearchText)) ||
        (user.email && user.email.toLowerCase().includes(globalSearchText)) ||
        (user.user_type &&
          user.user_type.toLowerCase().includes(globalSearchText)) ||
        statusText.toLowerCase().includes(globalSearchText)
      );
    });
  };

  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formDelivery] = Form.useForm();
  const [formUserDetail] = Form.useForm()
  const [formCreateUser] = Form.useForm()
  
  const fetchUsers = async getData =>
    getFetch('users', '')
      .then(fetchedUsers => { 
        if (getData) return fetchedUsers

        else setUsers(fetchedUsers)
      })
      .catch(error => {
        message.error("Error al cargar los usuarios.");
        console.error(error);
      })

  const fetchOrders = async () => {
    try {
        const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/orders");

        // Filtrar órdenes pendientes (status_id = 1)
        const pendingOrders = response.data.filter(item => item.order.status_id === 1);
        
        // Procesar datos de productos de las órdenes pendientes
        const dataPurchaseOrders = pendingOrders.flatMap(item => 
            item.items.map(product => ({
                order_id: item.order.id,  // Agregar la referencia de la orden
                product_id: product.product_id,
                quantity: product.quantity,
                product_name: product.product_name,
                price: product.price,
                variation_id: product.variation_id,
                presentation: product.presentation,
                quality: product.quality,
            }))
        );
        
        // Agrupamos y sumamos las cantidades de los productos por product_id, variation_id y presentation
        const groupedProducts = dataPurchaseOrders.reduce((acc, product) => {
            // Crear una clave única para el grupo de productos
            const key = `${product.product_id}-${product.variation_id}-${product.presentation}`;
            
            if (!acc[key]) {
                // Si el grupo aún no existe, creamos un nuevo grupo
                acc[key] = { 
                    ...product, 
                    totalQuantity: product.quantity // Inicializamos con la cantidad del primer producto
                };
            } else {
                // Si ya existe el grupo, sumamos la cantidad al total
                acc[key].totalQuantity += product.quantity;
            }
            
            return acc;
        }, {});
        
        // Convertimos el objeto de agrupación en un array
        const uniqueGroupedProducts = Object.values(groupedProducts).map(product => {
            const { variation } = product; // Extraemos el objeto variation
        
            if (variation) {
                // Traemos las propiedades al nivel superior
                return {
                    id_producto: product.product_id,
                    cantidad: product.totalQuantity, // Usamos la cantidad total agrupada
                    nombre_producto: product.product_name,
                    id_variacion: product.variation_id,
                    calidad: product.quality,
                    total: product.totalQuantity * product.price // Aquí calculamos el total por producto
                };
            }
        
            return product; // Si no hay variation, devolvemos el producto sin cambios
        });
      
        // Actualizar el estado con las órdenes y productos filtrados
        setPurchaseOrders(uniqueGroupedProducts);
        setOrders(dataPurchaseOrders);
        setFilteredOrders(dataPurchaseOrders);
    } catch (error) {
        message.error("Error al cargar los pedidos.");
        console.error(error);
    }
  }

  // Llamar a fetchOrders al montar el componente
  useEffect(() => {
      fetchUsers(false);
      fetchOrders();
  }, []);


  const uploadProducts = async (products) => {
    setLoading(true);
    try {
      await Promise.all(
        products.map(async (product) => {
          const formData = new FormData();
          formData.append("name", product.name);
          formData.append("description", product.description);
          formData.append("category", product.category);
          formData.append("stock", product.stock);

          // Manejar foto (opcional)
          if (product.photo_url && typeof product.photo_url === "string") {
            const response = await fetch(product.photo_url);
            const blob = await response.blob();
            formData.append("photo_url", blob);
          }

          formData.append("variations", JSON.stringify(product.variations));

          await axios.post("https://don-kampo-api-5vf3.onrender.com/api/createproduct", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        })
      );
      message.success("Productos cargados exitosamente.");
    } catch (error) {
      message.error("Error al cargar los productos.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportExcel = async (file) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const formattedProducts = jsonData.map((row) => ({
        name: row["Nombre"] || "",
        description: row["Descripción"] || "",
        category: row["Categoría"] || "",
        stock: row["Stock"] || 0,
        photo_url: row["URL Imagen"] || null, // Si necesitas cargar binarios, esto se manejará aparte
        variations: [
          {
            quality: row["Calidad"] || "",
            quantity: row["Cantidad"] || 0,
            price_home: parseInt(row["Precio Hogar"] || 0),
            price_supermarket: parseInt(row["Precio Supermercado"] || 0),
            price_restaurant: parseInt(row["Precio Restaurante"] || 0),
            price_fruver: parseInt(row["Precio Fruver"] || 0),
          },
        ],
      }));

      await uploadProducts(formattedProducts);
    };

    reader.readAsArrayBuffer(file);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      // Cambiamos la URL para incluir directamente el id y el nuevo estado
      await axios.put(`https://don-kampo-api-5vf3.onrender.com/api/updatestatus/${orderId}/${newStatus}`);
      message.success("Estado del pedido actualizado correctamente.");
      fetchOrders(); // Refresca la lista de pedidos después de actualizar el estado
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

  const renderUserStatus = (status) => (status ? "Activo" : "Inactivo");

  const openUserModal = async (user) => {
    try {
      const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/users/${user.id}`);
      setSelectedUser(response.data);
      setIsUserModalVisible(true);
      formUserDetail.setFieldsValue(response.data.user); // Actualiza los valores del formulario
    } catch (error) {
      message.error("Error al cargar los detalles del usuario.");
      console.error(error);
    }
  };

  const handleCancelUserModal = () => {
    setIsUserModalVisible(false);
    setSelectedUser(null);
    formUserDetail.resetFields(); // Limpia el formulario
  };

  const openOrderModal = async (orderId) => {
    try {
      const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/orders/${orderId}`);
      // Actualiza el estado con toda la respuesta (incluyendo order, items y shippingInfo)
      
      setSelectedOrder(response.data);
      setIsOrderModalVisible(true);
    } catch (error) {
      message.error("Error al cargar los detalles del pedido.");
      console.error(error);
    }
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    if (value === null) {
      setFilteredOrders(orders);
    } else {
      setFilteredOrders(orders.filter((order) => order.status_id === value));
    }
  };

  const updateUserDetails = async (values) => {    
    try {
      await axios.put(`https://don-kampo-api-5vf3.onrender.com/api/updateusers/${selectedUser.user.id}`, values);
      message.success("Usuario actualizado exitosamente.");
      fetchUsers(false); // Refresca la lista de usuarios después de actualizar
      setIsUserModalVisible(false);
    } catch (error) {
      message.error("Error al actualizar el usuario.");
      console.error(error);
    }
  };

  const openCreateUserModal = () => {
    formCreateUser.resetFields();
    setIsCreateUserModalVisible(true);
  };

  const handleCreateUser = async (values) => {
    setLoading(true);
    try {
      await axios.post("https://don-kampo-api-5vf3.onrender.com/api/createusers", {
        ...values,
        address: " ",
        neighborhood: " ",
      });
      message.success("Usuario creado exitosamente.");
      fetchUsers(false);
      setIsCreateUserModalVisible(false);
    } catch (error) {
      message.error("Error al crear el usuario.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderTypeUsers = () => {
    const typeUsers = [
      { count: 0, type: "hogar" },
      { count: 0, type: "restaurante" },
      { count: 0, type: "supermercado" },
      { count: 0, type: "fruver" },
    ];

    const updatedTypeUsers = typeUsers.map(typeUser => ({
      ...typeUser,
      count: users.filter(userData => userData.user_type === typeUser.type).length
    }));   
    
    return (
      <ul className="listTypeUsers">
        { updatedTypeUsers.map((typeUser, index) => {
          return (
          <li key={index}>
            <span>{typeUser.count}</span>
            <p>{typeUser.type}</p>
          </li>
          )
        })}
      </ul>
    )
  }

  renderTypeUsers()
  const renderUserTable = () => {
    const userColumns = [
      { title: "Nombre", dataIndex: "user_name", key: "user_name" },
      { title: "Apellido", dataIndex: "lastname", key: "lastname" },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
        filterDropdown: ({
          setSelectedKeys,
          selectedKeys,
          confirm,
          clearFilters,
        }) => (
          <div style={{ padding: 8 }}>
            <Input
              placeholder="Buscar por correo"
              value={selectedKeys[0]}
              onChange={(e) =>
                setSelectedKeys(e.target.value ? [e.target.value] : [])
              }
              onPressEnter={confirm}
              style={{ marginBottom: 8, display: "block" }}
            />
            <Button
              type="primary"
              onClick={confirm}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90, marginRight: 8 }}
            >
              Buscar
            </Button>
            <Button onClick={clearFilters} size="small" style={{ width: 90 }}>
              Limpiar
            </Button>
          </div>
        ),
        onFilter: (value, record) =>
          record.email.toLowerCase().includes(value.toLowerCase()),
      },
      { title: "Tipo", dataIndex: "user_type", key: "user_type" },
      {
        title: "Acciones",
        key: "actions",
        render: (_, user) => (
          <Button onClick={() => openUserModal(user)}>Ver Detalles</Button>
        ),
      },
    ];

    return (
      <Card title="Gestión de Usuarios">
        <div className="containerTableUsers">
          <Button
            type="primary"
            onClick={openCreateUserModal}
            className="crearUser"
          >
            Crear Usuario
          </Button>
          <Input
            placeholder="Buscar en todos los campos"
            allowClear
            onChange={(e) => setGlobalSearchText(e.target.value.toLowerCase())}
            style={{ marginBottom: 16, width: 300, marginLeft: 25 }}
            prefix={<SearchOutlined />}
          />
          {renderTypeUsers()}
        </div>
        <Table
            dataSource={getFilteredUsers()}
            columns={userColumns} // Ahora está definido correctamente
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
      </Card>
    );
  };


  const renderPurchaseTable = () => {
    const orderColumns = [
      { title: "ID Producto", dataIndex: "product_id", key: "product_id" },
      { title: "Producto", dataIndex: "product_name", key: "product_name" },
      { title: "ID Variacion", dataIndex: "variation_id", key: "variation_id" },
      { title: "Calidad", dataIndex: "quality", key: "quality" },
      { title: "Presentacion", dataIndex: "presentation", key: "presentation" },
      { title: "Cantidad", dataIndex: "quantity", key: "quantity" },
      { title: "Total a Comprar", dataIndex: "totalQuantity", key:"totalQuantity" }
    ];  

    return (
      <Card title="Gestión de Compras" style={{ marginTop: "20px" }}>
        <Button style={{ marginBottom: '20px' }} type="primary" onClick={exportPurchaseOrdersToExcel}> Descargar Excel </Button>
        <Spin spinning={loading}>
          {" "}
          {/* Muestra la rueda de carga mientras `loading` está activo */}
          <Table
            dataSource={purchaseOrders}
            columns={orderColumns}
            rowKey="id"
            pagination={{ pageSize: 5 }}
          />
        </Spin>
      </Card>
    );
  };
  
  // Función de apoyo para crear columnas de variaciones dinámicamente
  const createVariationColumns = (maxVariations, variations) => {
    const columns = {};
    for (let i = 0; i < maxVariations; i++) {
      const variation = variations[i] || {}; // Usa un objeto vacío si no hay variación
      columns[`Calidad_v${i + 1}`] = variation.quality || '';
      columns[`Cantidad_v${i + 1}`] = variation.quantity || 0;
      columns[`Precio_Hogar_v${i + 1}`] = variation.price_home || 0;
      columns[`Precio_Supermercado_v${i + 1}`] = variation.price_supermarket || 0;
      columns[`Precio_Restaurante_v${i + 1}`] = variation.price_restaurant || 0;
      columns[`Precio_Fruver_v${i + 1}`] = variation.price_fruver || 0;
    }
    return columns;
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
            const response = await axios.get(`https://don-kampo-api-5vf3.onrender.com/api/orders/${order.id}`);
            
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
                Total: `$${orderDetails.total}`,
                Estado:
                  orderDetails.status_id === 1
                    ? "Pendiente"
                    : orderDetails.status_id === 2
                    ? "Enviado"
                    : orderDetails.status_id === 3
                    ? "Entregado"
                    : "Cancelado",
                "ID de Variación": item.product_variation_id,
                "Nombre del Producto": item.product_name,
                Calidad: item.variation.quality,
                Cantidad: item.quantity,
                Precio: `$${item.price}`,
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
  
  const exportPurchaseOrdersToExcel = async () => {
    setLoading(true); // Activamos la rueda de carga

    // Crear hojas de trabajo
    const workbook = XLSX.utils.book_new();
    
    // Reorganizar los datos en el orden deseado
    const orderedPurchaseOrders = purchaseOrders.map(order => ({
      id_producto: order.product_id,
      nombre_producto: order.product_name,
      id_variacion: order.variation_id,
      calidad: order.quality,
      presentacion: order.presentation,
      cantidad: order.quantity,
      total: order.totalQuantity
    }));

    // Convertir a hoja de cálculo con el orden de columnas establecido
    const purchasedWorksheet = XLSX.utils.json_to_sheet(orderedPurchaseOrders);

    XLSX.utils.book_append_sheet(workbook, purchasedWorksheet, "Pedidos a comprar");

    // Guardar el archivo Excel
    XLSX.writeFile(workbook, "Pedidos a comprar.xlsx");

    message.success("Archivo Excel generado exitosamente.");
    setLoading(false); // Desactivamos la rueda de carga
  };

  return (
    <div>
      <Navbar />
      <main> 
        <div className="background-home" /> 
        <div className="admin-profile-container">
          <h2>Bienvenido al Panel de Administración</h2>
          <p>👤 Administra usuarios, 🚚 precios de envíos, 🛒 compras y 📢 publicidad. ¡Todo en un solo lugar! 🎯</p>
          {renderUserTable()}
          
          {renderPurchaseTable()}

          {/* Modal for User Details */}
          <Modal
            title="Detalles de Usuario"
            open={isUserModalVisible}
            onCancel={handleCancelUserModal} // Cambiar la función de cancelación
            footer={null}
          >
            {selectedUser && (
              <Form form={formUserDetail} onFinish={(values) => {
                updateUserDetails(values);
              }} layout="vertical">
                <Form.Item
                  label="Nombre"
                  name="user_name"
                  rules={[
                    { required: true, message: "Por favor ingresa el nombre" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Apellido"
                  name="lastname"
                  rules={[
                    { required: true, message: "Por favor ingresa el apellido" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    {
                      required: true,
                      message: "Por favor ingresa el correo electrónico",
                    },
                    {
                      type: "email",
                      message: "Ingresa un correo electrónico válido",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Teléfono"
                  name="phone"
                  rules={[
                    { required: true, message: "Por favor ingresa el teléfono" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Ciudad"
                  name="city"
                  rules={[
                    { required: true, message: "Por favor ingresa la ciudad" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Dirección"
                  name="address"
                  rules={[
                    { required: true, message: "Por favor ingresa la dirección" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Barrio"
                  name="neighborhood"
                  rules={[
                    { required: true, message: "Por favor ingresa el barrio" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Tipo de Usuario"
                  name="user_type"
                  rules={[
                    {
                      required: true,
                      message: "Por favor selecciona el tipo de usuario",
                    },
                  ]}
                >
                  <Select>
                    <Option value="admin">Administrador</Option>
                    <Option value="hogar">Hogar</Option>
                    <Option value="restaurante">Restaurante</Option>
                    <Option value="supermercado">Supermercado</Option>
                    <Option value="fruver">Fruver</Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" block>
                    Guardar Cambios
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Modal>

          <ManagePublicity />

          {/* Costos Envio */}
          <Form
            form={formDelivery}
            layout="vertical"
            onFinish={updateShippingCosts} // Maneja la actualización de costos
          >
            <Card
              title="Gestión de Costos de Envío"
              bordered={true}
              style={{
                header: {
                  backgroundColor: "#00983a",
                  color: "#fff",
                  textAlign: "center"
                },
                body: {
                  padding: "20px",
                },
                width: "100%",
                marginTop: "20px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <Row gutter={[16, 16]} style={{ textAlign: "center" }}>
                {Object.keys(shippingCosts).map((type) => (
                  <Col span={6} key={type}>
                    <Form.Item
                      label={`Costo para ${
                        type.charAt(0).toUpperCase() + type.slice(1)
                      }`}
                      name={type}
                      rules={[
                        {
                          required: true,
                          message: `Por favor ingresa el costo para ${type}`,
                        },
                      ]}
                    >
                      <Input type="number" step="0.01" />
                    </Form.Item>
                  </Col>
                ))}
              </Row>
              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loadingShipping}
                  style={{ backgroundColor: "#00983a", borderColor: "#007a2f" }}
                >
                  Actualizar Costos
                </Button>
              </div>
            </Card>
          </Form>

          <Modal
            title="Detalles del Pedido"
            open={isOrderModalVisible}
            onCancel={() => setIsOrderModalVisible(false)}
            footer={[
              <Button key="close" onClick={() => setIsOrderModalVisible(false)}>
                Cerrar
              </Button>,
            ]}
          >
            {selectedOrder && selectedOrder.order && (
              <>
                <h3>Información del Pedido</h3>
                <p>
                  <strong>ID:</strong> {selectedOrder.order.id}
                </p>
                <p>
                  <strong>Cliente:</strong> {selectedOrder.order.customer_name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedOrder.order.customer_email}
                </p>
                <p>
                  <strong>Fecha:</strong> {new Date(selectedOrder.order.order_date).toLocaleDateString()}
                </p>
                <p>
                  <strong>Fecha Entrega</strong> {new Date(new Date(selectedOrder.order.order_date).setDate(new Date(selectedOrder.order.order_date).getDate() + 1)).toLocaleDateString()}
                </p>
                <p>
                  <strong>Total:</strong> ${selectedOrder.order.total}
                </p>
                <p>
                  <strong>Estado:</strong>{" "}
                  {selectedOrder.order.status_id === 1
                    ? "Pendiente"
                    : selectedOrder.order.status_id === 2
                    ? "Enviado"
                    : selectedOrder.order.status_id === 3
                    ? "Entregado"
                    : "Cancelado"}
                </p>
                <Divider />

                <h3>Ítems del Pedido</h3>
                {selectedOrder.items.length > 0 ? (
                  <ul>
                    {selectedOrder.items.map((item, index) => (
                      <li key={index}>
                        {item.product_name} - {item.quantity} x ${item.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No hay ítems en este pedido.</p>
                )}
              </>
            )}
          </Modal>

          {/* Modal for Create User */}
          <Modal
            title="Crear Usuario"
            open={isCreateUserModalVisible}
            onCancel={() => setIsCreateUserModalVisible(false)}
            footer={null}
          >
            <Form form={formCreateUser} onFinish={handleCreateUser} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Nombre"
                    name="user_name"
                    rules={[
                      { required: true, message: "Por favor ingresa el nombre" },
                    ]}
                  >
                    <Input placeholder="Nombre" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Apellido"
                    name="lastname"
                    rules={[
                      {
                        required: true,
                        message: "Por favor ingresa el apellido",
                      },
                    ]}
                  >
                    <Input placeholder="Apellido" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Correo Electrónico"
                    name="email"
                    rules={[
                      {
                        required: true,
                        message: "Por favor ingresa el correo electrónico",
                      },
                      {
                        type: "email",
                        message: "Ingresa un correo electrónico válido",
                      },
                    ]}
                  >
                    <Input placeholder="Correo Electrónico" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Teléfono"
                    name="phone"
                    rules={[
                      {
                        required: true,
                        message: "Por favor ingresa el número de teléfono",
                      },
                    ]}
                  >
                    <Input placeholder="Teléfono" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Ciudad"
                    name="city"
                    rules={[
                      {
                        required: true,
                        message: "Por favor selecciona la ciudad",
                      },
                    ]}
                  >
                    <Select placeholder="Selecciona una ciudad">
                      <Option value="Chía">Chía</Option>
                      <Option value="Cajicá">Cajicá</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Contraseña"
                    name="user_password"
                    rules={[
                      {
                        required: true,
                        message: "Por favor ingresa una contraseña",
                      },
                      {
                        min: 6,
                        message: "La contraseña debe tener al menos 6 caracteres",
                      },
                    ]}
                  >
                    <Input.Password placeholder="Contraseña" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                label="Tipo de Usuario"
                name="user_type"
                rules={[
                  {
                    required: true,
                    message: "Por favor selecciona el tipo de usuario",
                  },
                ]}
              >
                <Select placeholder="Selecciona un tipo de usuario">
                  <Option value="admin">Administrador</Option>
                  <Option value="hogar">Hogar</Option>
                  <Option value="restaurante">Restaurante</Option>
                  <Option value="supermercado">Supermercado</Option>
                  <Option value="fruver">Fruver</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Crear Usuario
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </div>
      </main>
      <FloatingButtons />
      <CustomFooter />
    </div>
  );
};

export default AdminProfile;
