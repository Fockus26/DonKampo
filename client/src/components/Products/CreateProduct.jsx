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
} from "antd";
import axios from "axios";
import { UploadOutlined } from "@ant-design/icons";

import validatePriceVariations from "utils/validatePriceVariations";

import "css/CreateProduct.css"; 

const { Option } = Select;

const CreateProduct = () => {
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);
  const [variations, setVariations] = useState([
    {
      active: true,
      quality: "",
      presentations: [],
    },
  ]);
  const [values, setValues] = useState({
    name: "",
    category: "",
    description: "",
  });

  const handleImageUpload = ({ file }) => file && setImageFile(file);

  const handleVariationChange = (index, field, value) => {
    const updatedVariations = [...variations];
    updatedVariations[index] = { ...updatedVariations[index], [field]: value };
    setVariations(updatedVariations);
  };

  const handlePresentationChange = (variationIndex, field, value) => { 
    setVariations(prevVariations => {
      const updatedVariations = [...prevVariations];
      const variationPresentation = updatedVariations[variationIndex].presentations;

      let newValue = value;
      if (field === "presentation") {
        newValue = newValue.length < variationPresentation.length ? undefined : value[value.length - 1]; // Obtiene la última presentación ingresada
      }
  

      const indexPresentation = variationPresentation.length > 0 ? variationPresentation.length - 1 : -1;
      
      if (field === "presentation") {
        if (newValue === undefined) {
          // Si newValue es undefined, eliminar la presentación si existe
          if (indexPresentation !== -1) variationPresentation.splice(indexPresentation, 1);

        } else {
          // Verificar si la presentación ya existe
          const index = variationPresentation.findIndex(p => p.presentation === newValue)
          if (index !== -1) {
            message.error("Esa presentación ya existe para esta variación.");
            return prevVariations; // No modifica el estado
          }

          // Agregar nueva presentación
          variationPresentation.push({
            presentation: newValue,
            price_fruver: 0,
            price_home: 0,
            price_restaurant: 0,
            price_supermarket: 0,
          });
        }
      } else {
        // Si el campo es un precio y la presentación existe, modificarla
        variationPresentation[indexPresentation][field] = newValue;
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
        presentations: [],
      },
    ]);
  };


  const removeVariation = (index) => {
    const updatedVariations = [...variations];
    updatedVariations.splice(index, 1);
    setVariations(updatedVariations);
  };

  const handleValues = (key, value) => setValues(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValues = Object.keys(values).every(key => ![null, undefined, ''].includes(values[key]));

    if (!isValues) {
        message.error('No se ingresaron los datos del producto');
        return;
    }

    const isValidPriceVariation = validatePriceVariations(variations)

    if (isValidPriceVariation) {

      const productData = {
        name: values.name,
        description: values.description,
        category: values.category,
        active: true,
        promocionar: false,
        variations: variations.map(variation => ({
          active: variation.active,
          quality: variation.quality || null,
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
          const response = await axios.post("http://localhost:8080/api/createproduct", formData, {
              headers: { "Content-Type": "multipart/form-data" },
          });

          message.success(`Producto creado exitosamente con ID: ${response.data.product_id}`);
          form.resetFields();
          setImageFile(null);
          setVariations([{
              active: true,
              quality: "",
              presentations: [],
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
            <Input onChange={(e) => handleValues('name', e.target.value)} placeholder="Nombre del producto" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Categoría"
            rules={[{ required: true, message: "Por favor selecciona una categoría" }]}
          >
            <Select onChange={(value) => handleValues('category', value)} placeholder="Selecciona una categoría">
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
          <Input.TextArea onChange={(e) => handleValues('description', e.target.value)} placeholder="Descripción del producto" />
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
          const { presentations, quality } = variation
          const actualPresentation = presentations.length ? presentations[presentations.length - 1] : null
          return (
            <div key={indexVariation} className="variation-fields">
              <h4>{indexVariation + 1}</h4>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Input
                    placeholder="Calidad (Ej: Primera, Segunda)"
                    value={quality}
                    onChange={(e) => handleVariationChange(indexVariation, "quality", e.target.value)}
                  />
                </Col>
                <Col span={12}>
                  <Select
                    className="tag"
                    mode="tags"
                    placeholder="Presentaciones (Ej: 1kg, 2kg)"
                    value={presentations.map(p => p.presentation)} 
                    onChange={value => handlePresentationChange(indexVariation, "presentation", value)}
                  />
                </Col>
              </Row>

              {presentations.length > 0 && 
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <InputNumber
                      min={0}
                      placeholder="Precio Hogar"
                      value={actualPresentation.price_home}
                      onChange={(value) =>
                        handlePresentationChange(indexVariation, "price_home", value)
                      }
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col span={12}>
                    <InputNumber
                      min={0}
                      placeholder="Precio Supermercado"
                      value={actualPresentation.price_supermarket}
                      onChange={(value) =>
                        handlePresentationChange(indexVariation, "price_supermarket", value)
                      }
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col span={12}>
                    <InputNumber
                      min={0}
                      placeholder="Precio Restaurante"
                      value={actualPresentation.price_restaurant}
                      onChange={(value) =>
                        handlePresentationChange(indexVariation, "price_restaurant", value)

                      }
                      style={{ width: "100%" }}
                    />
                  </Col>
                  <Col span={12}>
                    <InputNumber
                      min={0}
                      placeholder="Precio Fruver"
                      value={actualPresentation.price_fruver}
                      onChange={(value) =>
                        handlePresentationChange(indexVariation, "price_fruver", value)
                      }
                      style={{ width: "100%" }}
                    />
                  </Col>
                </Row>
              }

              {indexVariation > 0 && (
                <Button
                  onClick={() => removeVariation(indexVariation)}
                  type="danger"
                  style={{ marginTop: 10, color: "#ff4d4f" }}
                >
                  Eliminar Variación
                </Button>
              )}
            </div>
          )
      })}
      </section>

      <section className="submit">
        <Button onClick={addVariation} className="variation"> Añadir Variación </Button>

        <Form.Item className="create">
          <Button type="primary" htmlType="submit" block> Crear Producto </Button>
        </Form.Item>
      </section>
    </form>
  );
};

export default CreateProduct;
