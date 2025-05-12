import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  InputNumber,
  Select,
  Row,
  Col,
  message,
  Tabs,
} from "antd";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";

import validatePriceVariations from "utils/validatePriceVariations";

import "css/CreateProduct.css";

const { Option } = Select;
const { TabPane } = Tabs;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [variations, setVariations] = useState([
    {
      active: true,
      quality: "",
      presentations: [{ presentation: "", price_fruver: null, price_home: null, price_restaurant: null, price_supermarket: null }],
    },
  ]);
  const [values, setValues] = useState({
    name: "",
    category: "",
    description: "",
  });
  const [activePresentationTab, setActivePresentationTab] = useState({});

  const handleImageUpload = ({ file }) => file && setImageFile(file);

  const validateForm = () => {
    // Validar campos principales
    if (!values.name || !values.category || !values.description) {
      message.error("Por favor complete todos los campos del producto");
      return false;
    }

    // Validar que haya al menos una variación
    if (variations.length === 0) {
      message.error("Debe agregar al menos una variación");
      return false;
    }

    // Validar cada variación
    for (let i = 0; i < variations.length; i++) {
      const variation = variations[i];
      
      // Validar que la variación tenga calidad
      if (!variation.quality.trim()) {
        message.error(`La variación ${i + 1} debe tener una calidad especificada`);
        return false;
      }

      // Validar que no se repitan calidades
      const qualityExists = variations.some((v, idx) => 
        v.quality.toLowerCase() === variation.quality.toLowerCase() && idx !== i
      );
      if (qualityExists) {
        message.error(`La calidad "${variation.quality}" ya existe en otra variación`);
        return false;
      }

      // Validar que haya al menos una presentación
      if (variation.presentations.length === 0) {
        message.error(`La variación "${variation.quality}" debe tener al menos una presentación`);
        return false;
      }

      // Validar cada presentación
      for (let j = 0; j < variation.presentations.length; j++) {
        const presentation = variation.presentations[j];
        
        // Validar que la presentación tenga nombre
        if (!presentation.presentation.trim()) {
          message.error(`La presentación ${j + 1} de la variación "${variation.quality}" debe tener un nombre`);
          return false;
        }

        // Validar que no se repitan nombres de presentación en la misma variación
        const presentationExists = variation.presentations.some((p, idx) => 
          p.presentation.toLowerCase() === presentation.presentation.toLowerCase() && idx !== j
        );
        if (presentationExists) {
          message.error(`La presentación "${presentation.presentation}" ya existe en la variación "${variation.quality}"`);
          return false;
        }

        // Validar precios (opcional, puedes ajustar según tus necesidades)
        if (
          presentation.price_home === null &&
          presentation.price_supermarket === null &&
          presentation.price_restaurant === null &&
          presentation.price_fruver === null
        ) {
          message.error(`Complete todos los precios para la presentación "${presentation.presentation}"`);
          return false;
        }
      }
    }

    return true;
  };

  const handleVariationChange = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

  const handlePresentationChange = (variationIndex, presentationIndex, field, value) => {
    setVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      const presentation = updatedVariations[variationIndex].presentations[presentationIndex];
      
      updatedVariations[variationIndex].presentations[presentationIndex] = {
        ...presentation,
        [field]: value
      };
      
      return updatedVariations;
    });
  };

  const addPresentation = (variationIndex) => {
    setVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      updatedVariations[variationIndex].presentations.push({
        presentation: "",
        price_fruver: null,
        price_home: null,
        price_restaurant: null,
        price_supermarket: null,
      });
      
      setActivePresentationTab(prev => ({
        ...prev,
        [variationIndex]: updatedVariations[variationIndex].presentations.length - 1
      }));
      
      return updatedVariations;
    });
  };

  const removePresentation = (variationIndex, presentationIndex) => {
    setVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      updatedVariations[variationIndex].presentations.splice(presentationIndex, 1);
      
      if (activePresentationTab[variationIndex] >= presentationIndex) {
        setActivePresentationTab(prev => ({
          ...prev,
          [variationIndex]: Math.max(0, prev[variationIndex] - 1)
        }));
      }
      
      return updatedVariations;
    });
  };

  const addVariation = () => {
    setVariations([
      ...variations,
      {
        active: true,
        quality: "",
        presentations: [{ presentation: "", price_fruver: null, price_home: null, price_restaurant: null, price_supermarket: null }],
      },
    ]);
  };

  const removeVariation = (index) => {
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
    
    const newActiveTabs = {...activePresentationTab};
    delete newActiveTabs[index];
    setActivePresentationTab(newActiveTabs);
  };

  const handleValues = (key, value) => setValues(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const isValidPriceVariation = validatePriceVariations(variations);

    if (isValidPriceVariation) {
      const productData = {
        name: values.name,
        description: values.description,
        category: values.category,
        active: true,
        promocionar: false,
        variations: variations.map(variation => ({
          active: variation.active,
          quality: variation.quality,
          presentations: variation.presentations.map(presentation => ({
            presentation: presentation.presentation,
            stock: 100,
            price_home: parseInt(presentation.price_home),
            price_supermarket: parseInt(presentation.price_supermarket),
            price_restaurant: parseInt(presentation.price_restaurant),
            price_fruver: parseInt(presentation.price_fruver),
          })),
        })),
      };

      const formData = new FormData();
      imageFile && formData.append("photo_url", imageFile);

      Object.keys(productData).forEach(key => key === "variations" ? 
        formData.append(key, JSON.stringify(productData[key])) : 
        formData.append(key, productData[key])
      );

      try {
          const response = await axios.post("https://don-kampo-api-5vf3.onrender.com/api/createproduct", formData, {
              headers: { "Content-Type": "multipart/form-data" },
          });

          message.success(`Producto creado exitosamente con ID: ${response.data.product_id}`);
          form.resetFields();
          setImageFile(null);
          setVariations([{
              active: true,
              quality: "",
              presentations: [{ presentation: "", price_fruver: null, price_home: null, price_restaurant: null, price_supermarket: null }],
          }]);
          setTimeout(() => window.location.reload(), 1500);
      } catch (error) {
          message.error("Error al crear el producto.");
          console.error(error);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-product">
      <section className="main-data">
        <h2>Crear Producto</h2>

        <div>
          <Form.Item
            name="name"
            label="Nombre del Producto"
            rules={[{ required: true, message: "Por favor ingresa el nombre" }]}
          >
            <Input 
              onChange={(e) => handleValues('name', e.target.value)} 
              placeholder="Nombre del producto" 
              value={values.name}
            />
          </Form.Item>
          <Form.Item
            name="category"
            label="Categoría"
            rules={[{ required: true, message: "Por favor selecciona una categoría" }]}
          >
            <Select 
              onChange={(value) => handleValues('category', value)} 
              placeholder="Selecciona una categoría"
              value={values.category}
            >
              <Option value="Frutas importadas">Frutas importadas</Option>
              <Option value="Verduras">Verduras</Option>
              <Option value="Frutas nacionales">Frutas nacionales</Option>
              <Option value="Cosechas">Cosechas</Option>
              <Option value="Hortalizas">Hortalizas</Option>
              <Option value="Promociones">Promociones</Option>
              <Option value="Otros">Otros</Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item
          name="description"
          label="Descripción"
          rules={[{ required: true, message: "Por favor ingresa una descripción" }]}
        >
          <Input.TextArea 
            onChange={(e) => handleValues('description', e.target.value)} 
            placeholder="Descripción del producto" 
            value={values.description}
          />
        </Form.Item>

        <Form.Item label="Foto del Producto">
          <Upload
            beforeUpload={() => false}
            onChange={handleImageUpload}
            accept="image/*"
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Subir Imagen</Button>
          </Upload>
          {imageFile && (
            <div style={{ marginTop: 10 }}>
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Vista previa"
                style={{
                  width: "100%",
                  maxHeight: "200px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}
        </Form.Item>
      </section>

      <section className="variation-data">
        <h3>Variaciones del Producto</h3>
        {variations.map((variation, indexVariation) => {
          const { presentations, quality } = variation;
          const activeTab = activePresentationTab[indexVariation] || 0;
          
          return (
            <div key={indexVariation} className="variation-fields">
              <h4>Variación {indexVariation + 1}</h4>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Input
                    placeholder="Calidad (Ej: Primera, Segunda)"
                    value={quality}
                    onChange={(e) => handleVariationChange(indexVariation, "quality", e.target.value)}
                    required
                  />
                </Col>
                <Col span={12}>
                  <Button className="addPresentation" onClick={() => addPresentation(indexVariation)}>
                    Añadir Presentación
                  </Button>
                </Col>
              </Row>

              {presentations.length > 0 && (
                <Tabs
                  activeKey={String(activeTab)}
                  onChange={(key) => setActivePresentationTab(prev => ({
                    ...prev,
                    [indexVariation]: parseInt(key)
                  }))}
                  type="card"
                  className="presentationTab"
                  tabBarExtraContent={
                    presentations.length > 1 && (
                      <Button
                        danger
                        size="small"
                        onClick={() => removePresentation(indexVariation, activeTab)}
                      >
                        Eliminar
                      </Button>
                    )
                  }
                >
                  {presentations.map((presentation, indexPresentation) => (
                    <TabPane
                      tab={`Presentación ${indexPresentation + 1}`}
                      key={String(indexPresentation)}
                    >
                      <Row gutter={[16, 16]}>
                        <Col span={24}>
                          <Input
                            placeholder="Nombre de la presentación (Ej: 1kg, 2kg)"
                            value={presentation.presentation}
                            onChange={(e) =>
                              handlePresentationChange(
                                indexVariation,
                                indexPresentation,
                                "presentation",
                                e.target.value
                              )
                            }
                            required
                          />
                        </Col>
                        <Col span={12}>
                          <InputNumber
                            min={0}
                            placeholder="Precio Hogar"
                            value={presentation.price_home}
                            onChange={(value) =>
                              handlePresentationChange(
                                indexVariation,
                                indexPresentation,
                                "price_home",
                                value
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </Col>
                        <Col span={12}>
                          <InputNumber
                            min={0}
                            placeholder="Precio Supermercado"
                            value={presentation.price_supermarket}
                            onChange={(value) =>
                              handlePresentationChange(
                                indexVariation,
                                indexPresentation,
                                "price_supermarket",
                                value
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </Col>
                        <Col span={12}>
                          <InputNumber
                            min={0}
                            placeholder="Precio Restaurante"
                            value={presentation.price_restaurant}
                            onChange={(value) =>
                              handlePresentationChange(
                                indexVariation,
                                indexPresentation,
                                "price_restaurant",
                                value
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </Col>
                        <Col span={12}>
                          <InputNumber
                            min={0}
                            placeholder="Precio Fruver"
                            value={presentation.price_fruver}
                            onChange={(value) =>
                              handlePresentationChange(
                                indexVariation,
                                indexPresentation,
                                "price_fruver",
                                value
                              )
                            }
                            style={{ width: "100%" }}
                          />
                        </Col>
                      </Row>
                    </TabPane>
                  ))}
                </Tabs>
              )}

              {variations.length > 1 && (
                <Button
                  onClick={() => removeVariation(indexVariation)}
                  danger
                  style={{ marginTop: 10 }}
                >
                  Eliminar Variación
                </Button>
              )}
            </div>
          );
        })}
      </section>

      <section className="submit">
        <Button onClick={addVariation} className="variation">
          Añadir Variación
        </Button>

        <Form.Item className="create">
          <Button type="primary" htmlType="submit" block>
            Crear Producto
          </Button>
        </Form.Item>
      </section>
    </form>
  );
};

export default CreateProduct;