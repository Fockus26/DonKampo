import React, { useState, useEffect } from "react";
import Header from "components/General/Header";
import FloatingButtons from "components/General/FloatingButtons";
import CustomFooter from "components/General/Footer";
import {
  Table,
  Input,
  Button,
  message,
  Popconfirm,
  Modal,
  Form,
  Row,
  Col,
  InputNumber,
  Tabs,
  Select,
  Switch,
} from "antd";
import { SearchOutlined, EditOutlined, DeleteOutlined, ConsoleSqlOutlined } from "@ant-design/icons";
import axios from "axios";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import CreateProduct from "components/Products/CreateProduct";
import UpdateMultipleProducts from "components/Products/UpdateMultipleProducts";

import validatePriceVariations from "utils/validatePriceVariations"
import getFetch from "utils/getFetch"

import "css/ManageData.css";
import { Orders, UpdateOrderPrices } from "components/Orders";
import SalesReport from "components/SalesReport";
import { Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';


const ManageData = () => {
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPresentations, setSelectedPresentations] = useState({});
  const [selectedIndexPresentation, setSelectedIndexPresentation] = useState(0)

  const [variations, setVariations] = useState([]);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  const fetchProducts = (msg = { success: "Productos cargados correctamente.", error: "Error al cargar los productos." }) => {
    setLoading(true);
    getFetch('products', '')
      .then(fetchedProducts => {
        setProducts(fetchedProducts);
        message.success(msg.success);
      })
      .catch(error => {
        message.error(msg.error);
        console.error(error);
      })
      .finally(setLoading(false))
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        quality: "",
        quantity: "",
        price_home: "",
        price_supermarket: "",
        price_restaurant: "",
        price_fruver: "",
        active: false,
      },
    ]);
  };

  const removeVariation = (index) => {
    const updatedVariations = variations.filter((_, i) => i !== index);
    setVariations(updatedVariations);
  };

  const deleteProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:8080/api/deleteproduct/${productId.toLocaleString()}`);
      fetchProducts({ success: "Producto eliminado correctamente.", error: "Error al eliminar el producto." });
    } catch (error) {
      console.error(error);
    }
  };

  const showEditModal = (product) => {
    setSelectedProduct(product);
    form.setFieldsValue(product); // Inicializa los valores del formulario
    setVariations(product.variations || []);
    setImageFile(null); // Reinicia el estado de la imagen
    setIsModalVisible(true);
  };

  const handleUpdateProduct = async (product) => {
    const isValidPriceVariations = validatePriceVariations(product.variations);

    if (isValidPriceVariations) {
      try {
        const formData = new FormData();

        // Agrega la nueva imagen si se seleccionó una
        if (imageFile) {
          formData.append("photo_url", imageFile);
        }

        // Agrega los demás campos del producto
        Object.keys(product).forEach((key) => {
          if (key === "variations") {
            formData.append(key, JSON.stringify(product[key]));
          } else {
            formData.append(key, product[key]);
          }
        });        
        
        console.log(product)
        // Envía la solicitud al servidor
        await axios.put(
          `http://localhost:8080/api/updateproduct/${selectedProduct.product_id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );

        setIsModalVisible(false);
        fetchProducts({ success: "Producto actualizado correctamente.", error: "Error al actualizar el producto." });
      } catch (error) {
        console.error(error);
      }
    }
  };

  const updateActive = async (checked, product) => {
    const updatedProduct = {
      ...product,
      active: checked
    }

    try {
      await axios.put(
        `http://localhost:8080/api/updateproduct/${updatedProduct.product_id}`,
        updatedProduct
      );
      setIsModalVisible(false);
      fetchProducts({ success: `Producto ${checked ? '' : 'des'}activado correctamente.`, error: "Error al actualizar el producto." });
    } catch (error) {
      console.error(error);
    }
  }

  const filteredProducts = products.filter(product => product.name.toLowerCase().includes(searchText.toLowerCase()));

  const generateExcelFromProducts = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/products", {
        withCredentials: true,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('No se pudieron obtener los productos correctamente.');
      }

      const products = response.data;
      // Hoja de Productos
      const productSheetData = [['Id', 'Nombre', 'Descripcion', 'Categoría', 'Promocionar', 'Activo']];
      products.forEach(product => {
        productSheetData.push([
          product.product_id,
          product.name,
          product.description,
          product.category,
          product.promocionar,
          product.active
        ]);
      });
      const productSheet = XLSX.utils.aoa_to_sheet(productSheetData);

      // Hoja de Variaciones
      const variationSheetData = [['Id Producto', 'Producto', 'Id Variacion', 'Calidad', 'Activo']];
      products.forEach(product => {
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach(variation => {
            variationSheetData.push([
              product.product_id,
              product.name,
              variation.variation_id,
              variation.quality,
              variation.active
            ]);
          });
        }
      });
      const variationSheet = XLSX.utils.aoa_to_sheet(variationSheetData);

      // Hoja de Presentaciones
      const presentationSheetData = [['Id Variacion', 'Presentacion', 'Precio Hogar', 'Precio Supermercado', 'Precio Restaurante', 'Precio Fruver']];
      products.forEach(product => {
        if (product.variations && product.variations.length > 0) {
          product.variations.forEach(variation => {
            if (variation.presentations && variation.presentations.length > 0) {
              variation.presentations.forEach(presentation => {
                presentationSheetData.push([
                  variation.variation_id,
                  presentation.presentation,
                  presentation.price_home,
                  presentation.price_supermarket,
                  presentation.price_restaurant,
                  presentation.price_fruver,
                ]);
              });
            }
          });
        }
      });
      const presentationSheet = XLSX.utils.aoa_to_sheet(presentationSheetData);

      // Crear el libro de Excel y añadir las hojas
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Productos');
      XLSX.utils.book_append_sheet(workbook, variationSheet, 'Variaciones');
      XLSX.utils.book_append_sheet(workbook, presentationSheet, 'Presentaciones');

      // Exportar el archivo
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(blob, 'Productos.xlsx');

    } catch (error) {
      console.error('Error generando el archivo Excel:', error);
    }
  };
  
  const ManageProducts = () => {
    const columns = [
      {
        title: "ID",
        dataIndex: "product_id",
        key: "product_id",
      },
      {
        title: "Nombre",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Descripción",
        dataIndex: "description",
        key: "description",
      },
      {
        title: "Categoría",
        dataIndex: "category",
        key: "category",
      },
      {
        title: "Acciones",
        key: "actions",
        render: (_, record) => (
          <div style={{ display: "flex", justifyContent: 'space-evenly' }}>
            <Switch
              checked={record.active}
              onChange={e => updateActive(e, record)}
              checkedChildren="Activo"
              unCheckedChildren="Inactivo"
            />

            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => showEditModal(record)}
            >
              Editar
            </Button>

            <Popconfirm
              title={`¿Eliminar el producto "${record.name}"?`}
              onConfirm={() => deleteProduct(record.product_id)}
              okText="Sí"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />}>
                Eliminar
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ];

    return (
      <>
        <h2>Gestionar Productos</h2>

        <div className="manage-search">
          <Input
            placeholder="Buscar producto por nombre"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ marginBottom: "16px", width: "300px" }}
          />
          <button onClick={generateExcelFromProducts}>Generar Excel</button>
          <i onClick={fetchProducts} className="fa-solid fa-rotate-right" />
        </div>
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="product_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
        <Modal
          title="Editar Producto"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setImageFile(null); // Reinicia el estado de la imagen
          }}
          footer={null}
          width={800}
        >
          <Form.Item label="Foto del Producto">
            <Upload
              beforeUpload={() => false} // Evita la subida automática
              onChange={({ file }) => setImageFile(file)} // Guarda el archivo seleccionado
              accept="image/*" // Acepta solo imágenes
              maxCount={1} // Permite solo una imagen
            >
              <Button icon={<UploadOutlined />}>Subir Imagen</Button>
            </Upload>
            {imageFile ? (
              <div style={{ marginTop: 10 }}>
                <img
                  src={URL.createObjectURL(imageFile)} // Muestra la vista previa de la nueva imagen
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : selectedProduct?.photo_url ? (
              <div style={{ marginTop: 10 }}>
                <img
                  src={selectedProduct.photo_url} // Muestra la imagen actual del producto
                  alt="Vista previa"
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
              </div>
            ) : null}
          </Form.Item>
          <Form
            form={form}
            onFinish={handleUpdateProduct}
            layout="horizontal"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  label="Nombre"
                  name="name"
                  rules={[{ required: true, message: "Por favor ingresa el nombre del producto" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Categoría"
                  name="category"
                  rules={[{ required: true, message: "Por favor selecciona una categoría" }]}
                >
                  <Select placeholder="Selecciona una categoría">
                    <Select.Option value="Frutas importadas">Frutas importadas</Select.Option>
                    <Select.Option value="Verduras">Verduras</Select.Option>
                    <Select.Option value="Frutas nacionales">Frutas nacionales</Select.Option>
                    <Select.Option value="Cosechas">Cosechas</Select.Option>
                    <Select.Option value="Hortalizas">Hortalizas</Select.Option>
                    <Select.Option value="Promociones">Promociones</Select.Option>
                    <Select.Option value="Otros">Otros</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Form.Item
                  label="Activar"
                  name="active"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Promocionar"
                  name="promocionar"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Promocionar" unCheckedChildren="No Promocionar" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Form.Item
                  label="Descripción"
                  name="description"
                  rules={[{ required: true, message: "Por favor ingresa una descripción" }]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.List name="variations">
              {(variationFields) =>
                variationFields.map(({ key, name: varName, ...varField }) => (
                  <div key={key} style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd' }}>
                    {/* Hidden variation_id */}
                    <Form.Item {...varField} name={[varName, 'variation_id']} hidden>
                      <Input />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col>
                        <Form.Item
                          {...varField}
                          name={[varName, 'quality']}
                          label="Calidad"
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col>
                        <Form.Item
                          {...varField}
                          name={[varName, 'active']}
                          label="Activo"
                          valuePropName="checked"
                        >
                          <Switch />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Lista de presentaciones */}
                    <Form.List name={[varName, 'presentations']}>
                      {(presFields) =>
                        presFields.map(({ key: pKey, name: presName, ...presField }) => (
                          <div key={pKey} style={{ padding: 16, borderBottom: '2px solid #8c8c8c' }}>
                            <Row gutter={16}>
                              <Col>
                                  <Form.Item
                                    {...presField}
                                    name={[presName, 'presentation']}
                                    label="Presentación"
                                    rules={[{ required: true }]}
                                  >
                                    <Input disabled />
                                  </Form.Item>
                              </Col>
                              <Col>
                                <Form.Item
                                  {...presField}
                                  name={[presName, 'stock']}
                                  label="Cantidad"
                                  rules={[{ required: true }]}
                                >
                                  <Input />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col>
                                <Form.Item
                                  {...presField}
                                  name={[presName, 'price_home']}
                                  label="Precio Hogar"
                                >
                                  <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                              <Col>
                                <Form.Item
                                  {...presField}
                                  name={[presName, 'price_supermarket']}
                                  label="Precio Superm."
                                >
                                  <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                            </Row>

                            <Row gutter={16}>
                              <Col>
                                <Form.Item
                                  {...presField}
                                  name={[presName, 'price_restaurant']}
                                  label="Precio Restaurant"
                                >
                                  <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                              <Col>
                                <Form.Item
                                  {...presField}
                                  name={[presName, 'price_fruver']}
                                  label="Precio Fruver"
                                >
                                  <InputNumber style={{ width: '100%' }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </div>
                        ))
                      }
                    </Form.List>
                  </div>
                ))
              }
            </Form.List>

            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Guardar Cambios
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </>
    )
  }

  return (
    <>
      <Header />
      <section className="manage-products-container">
        <Tabs defaultActiveKey="1" items={[
          // Manage Products
          {
            key: "1",
            label: "Gestión Productos",
            children: <ManageProducts />,
          },
          // Create Product
          {
            key: "2",
            label: "Creación Productos",
            children: <CreateProduct />,
          },
          // Update Multiple Products
          {
            key: "3",
            label: "Actualización Productos",
            children: <UpdateMultipleProducts />,
          },
          // Update Order Prices
          {
            key: "4",
            label: "Actualización Ordenes",
            children: <UpdateOrderPrices />,
          },
          // Orders
          {
            key: "5",
            label: "Ordenes",
            children: <Orders />,
          },
          // Sales Report
          {
            key: "6",
            label: "Ventas",
            children: <SalesReport />,
          }
        ]} />
      </section>
      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default ManageData;
