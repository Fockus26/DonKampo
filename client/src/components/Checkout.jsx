import React, { useEffect, useState, useCallback } from "react";
import { Select, Form, Input, Button, message, Divider, Modal, Row, Col, Checkbox } from "antd";
import FloatingButtons from "components/General/FloatingButtons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import { useNavigate } from "react-router-dom";
import { useCart } from "components/Products/CartContext";

import getFetch from "utils/getFetch"
import { userData, userType } from "utils/getUser";
import { getShippingCost, getPrice, isAmountCheckout } from "utils/getDataByUserType";

import "css/Checkout.css";
import fruits from 'assets/fruits.jpg'
import formatPrice from 'utils/formatPrice.js'

const Checkout = () => {
  const [actualUser, setActualUser] = useState({});
  const [cartDetails, setCartDetails] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [needsElectronicInvoice, setNeedsElectronicInvoice] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyNit, setCompanyNit] = useState("");
  const [shippingCost, setShippingCost] = useState(0);
  const [discountedShippingCost, setDiscountedShippingCost] = useState(null);

  const { cart, clearCart, addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  const [checkTerms, setCheckTerms] = useState(false);


  useEffect(() => {
    getFetch('customer-types', '')
      .then(fetchedShippingCosts => {
        
        const shippingCost = getShippingCost(fetchedShippingCosts)     
        
        if (userData) {
          getFetch('users', `/${userData.id}`)
          .then(fetchedUser => {
            setActualUser(fetchedUser.user)
            
            if (!fetchedUser.orders.length) {                            
              setIsFirstOrder(true)
              setDiscountedShippingCost(shippingCost / 2);
            } 

            setShippingCost(shippingCost)
          })
          .catch(error => {
            message.error("Error al cargar los datos de usuario.");
            console.error(error);
          })
        } else {
          setShippingCost(shippingCost)
        }
      })
      .catch(error => {
        message.error("Error al cargar los costos de envío.");
        console.error(error);
      })
  }, [])  

  const [loading, setLoading] = useState(true); // Para manejar el estado de carga

  useEffect(() => {
    const fetchCartDetails = async () => {
      try {
        setLoading(true); // Indicar que estamos cargando
        const productDetails = await Promise.all(
          Object.entries(cart).map(async ([key, item]) => {
            const [productId] = key.split('-');

            const response = await axios.get(
              `http://localhost:8080/api/getproduct/${productId}`
            );

            return {
              ...response.data,
              quantity: item.quantity,
              selectedVariation: item.selectedVariation
            };
          })
        );
        const newDetails = productDetails.filter(item => item !== null);
        if (JSON.stringify(newDetails) !== JSON.stringify(cartDetails)) {
          setCartDetails(newDetails);
        }
      } catch (error) {
        message.error("Error al cargar los detalles del carrito.");
        console.error(error);
      } finally {
        setLoading(false); // Marcar como cargado
      }
    };

    fetchCartDetails();
  }, [cart, cartDetails])

  const calculateSubtotal = useCallback(() => {
    return cartDetails.reduce((total, product) => {
      const { selectedVariation: variation } = product
      const { quantity } = variation
      return total + (getPrice(variation) * quantity)
    }, 0);
  }, [cartDetails])
  
  const subtotal = calculateSubtotal()
  const percentageShippingCost = discountedShippingCost ?? shippingCost
  const amountShippingCost = subtotal * percentageShippingCost
  const total = subtotal * (1 + percentageShippingCost)
  
  useEffect(() => {
    if (!loading) {
      const { isAmount, content } = isAmountCheckout(total);
      
      if (!isAmount) {
        navigate('/cart');
        message.warning(content);
      } 
    }
  }, [navigate, total, loading]); 

  const handleInputChange = e => {
    const { name, value } = e.target;
    setActualUser(prevData => ({ ...prevData, [name]: value }));
  };

  const handleUpdateUser = async () => {
    if (userData) {
      try {
        const updatedData = {
          user_name: userData.user_name,
          lastname: userData.lastname,
          email: userData.email,
          phone: userData.phone,
          city: userData.city,
          address: userData.address,
          neighborhood: userData.neighborhood,
        };

        await axios.put(
          `http://localhost:8080/api/updateusers/${userData.id}`,
          updatedData
        );
        message.success("Datos actualizados exitosamente.");
      } catch (error) {
        message.error("Error al actualizar los datos del usuario.");
        console.error(error);
      }
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "user_name",
      "lastname",
      "email",
      "phone",
      "city",
      "address",
      "neighborhood",
    ];
  
    if (needsElectronicInvoice) requiredFields.push("companyName", "companyNit")

    const isValid = requiredFields.every(field =>
      field === "companyName" || field === "companyNit"
        ? needsElectronicInvoice
          ? !!eval(field)
          : true
        : actualUser?.[field]?.trim()
    );

    return isValid;
  };

  const handlePlaceOrder = async () => {
    if (validateForm()) {
      if (checkTerms) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + 1);
        const estimatedDelivery = currentDate.toISOString();
  
        const orderData = {
          userId: userData ? userData.id : '0f8fc459-571f-4e15-b653-4eb4558c6450',
          cartDetails: cartDetails.map((product) => {
            const { product_id: productId, selectedVariation: variation } = product
            const { quantity, presentation, presentation_id, quality } = variation
            const price = getPrice(variation)
            const indexVariation = parseInt(variation.variation_id.split('-')[1])
            const variationId = product.variations[indexVariation].variation_id

            return ({ productId, quantity, variationId, presentation, presentation_id, quality, price })
          }),
          total,
          shippingCost: percentageShippingCost * 100,
          shippingMethod: "Overnight",
          estimatedDelivery: estimatedDelivery,
          actual_delivery: currentDate,
          userData: {
            user_name: actualUser.user_name,
            lastname: actualUser.lastname,
            email: actualUser.email,
            phone: actualUser.phone,
            city: actualUser.city,
            address: actualUser.address,
            user_type: userType,  // Aquí aseguramos que el 'user_type' sea válido
            neighborhood: actualUser.neighborhood,
          },
          needsElectronicInvoice,
          companyName: needsElectronicInvoice ? companyName : "",
          companyNit: needsElectronicInvoice ? companyNit : "",
        };

        try {
          const response = await axios.post(
            "http://localhost:8080/api/orders/placeOrder",
            orderData
          );
          if (response.status === 201) {
            setOrderId(response.data.orderId);
            setIsModalVisible(true);
          } else {
            message.error("Error al realizar el pedido. Inténtalo nuevamente.");
          }
        } catch (error) {
          message.error("Error al realizar el pedido.");
          console.error(error);
        }
      } else {
        message.error("Acepta los terminos y condiciones.");
      }
    } else {
      message.error("Por favor, complete todos los campos antes de realizar el pedido.");
    }
  };  

  const finishOrder = msg => {
    // **Limpiar el carrito y redirigir**
    setIsModalVisible(false)
    clearCart();
    message.success(msg);
    navigate("/products");
  }

  const generateOrderPDF = () => {
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
    const orderDate = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    const deliveryDate = new Date(new Date().setDate(new Date().getDate() + 1))
        .toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text("Fecha de la orden:", 10, 40);
    doc.setFont('helvetica', 'normal');
    doc.text(orderDate, 55, 40);

    doc.setFont('helvetica', 'bold');
    doc.text("Fecha de entrega:", 10, 45);
    doc.setFont('helvetica', 'normal');
    doc.text(deliveryDate, 55, 45);

    doc.setFont('helvetica', 'bold');
    doc.text("ID de la orden:", 10, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${orderId}`, 55, 50);

    doc.setFont('helvetica', 'bold');
    doc.text("Cliente:", 10, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(`${actualUser.user_name} ${actualUser.lastname}`, 55, 55);

    doc.setFont('helvetica', 'bold');
    doc.text("Correo:", 10, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(actualUser.email, 55, 60);

    doc.setFont('helvetica', 'bold');
    doc.text("Teléfono:", 10, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(actualUser.phone, 55, 65);

    doc.setFont('helvetica', 'bold');
    doc.text("Dirección:", 10, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(`${actualUser.address}, ${actualUser.neighborhood}, ${actualUser.city}`, 55, 70);

    // **Configuración de la tabla con los productos**
    const tableColumns = [
        { header: 'Producto', dataKey: 'description' },
        { header: 'Precio Unitario', dataKey: 'unitPrice' },
        { header: 'Cantidad', dataKey: 'quantity' },
        { header: 'Subtotal', dataKey: 'subtotal' },
    ];

    const tableData = cartDetails.map((product) => {
      const { selectedVariation: variation, name } = product
      const { quality, presentation, quantity } = variation
      const sub = (getPrice(variation) * quantity)

      return {
        description: `${name} (${quality} - ${presentation})`,
        unitPrice: `$${formatPrice(getPrice(variation))}`,
        quantity: formatPrice(quantity),
        subtotal: `$${formatPrice(sub)}`,
      }
    });

    // **Renderizar la tabla**
    doc.autoTable({
        columns: tableColumns,
        body: tableData,
        startY: 75, // Comienza justo después de la dirección
        styles: { fontSize: 10, halign: 'center'},
    });

    // **Calcular posición final para totales**
    const finalY = doc.lastAutoTable.finalY + 10;

    // **Agregar subtotales, envío y total al final**
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Subtotal: $${formatPrice(subtotal)}`, 10, finalY);
    doc.text(`Envío (${percentageShippingCost * 100}%): $${formatPrice(amountShippingCost)}`, 10, finalY + 5);
    doc.setFontSize(14);
    doc.text(`Total: $${formatPrice(total)}`, 10, finalY + 10);

    doc.setFontSize(14);
    doc.setTextColor(255, 0, 0);
    doc.text(`Los pedidos pueden ser fluctuantes, por lo tanto pueden variar`, 10, finalY + 15);

    // **Guardar el PDF**
    doc.save(`Resumen_Pedido_${orderId}.pdf`);

    finishOrder("El carrito ha sido vaciado después de generar el PDF.")

  };

  const handleAddToCart = product => 
    product.selectedVariation 
      ? addToCart(product)
      : message.error("Por favor selecciona una variaci��n antes de añadir al carrito.")

  return (
    <div>
      <img id="fruits" src={fruits} alt="" />
      <Header />
      <div className="checkout-container">
        <h2>Finalizar Compra</h2>
        <div className="checkout-content">
          { actualUser && (
            <Form layout="vertical" className="checkout-form">
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Nombre">
                    <Input
                      name="user_name"
                      value={actualUser.user_name}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Apellido">
                    <Input
                      name="lastname"
                      value={actualUser.lastname}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email">
                    <Input
                      name="email"
                      value={actualUser.email}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Teléfono">
                    <Input
                      name="phone"
                      value={actualUser.phone}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Ciudad">
                    <Select
                      name="city"
                      value={actualUser.city}
                      onChange={(value) => handleInputChange({ target: { name: 'city', value } })}
                    >
                      <Select.Option value="Chía">Chía</Select.Option>
                      <Select.Option value="Cajicá">Cajicá</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Dirección">
                    <Input
                      name="address"
                      value={actualUser.address}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label="Barrio">
                    <Input
                      name="neighborhood"
                      value={actualUser.neighborhood}
                      onChange={handleInputChange}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  { userData && (
                    <Button
                      type="primary"
                      className="confirm-data-button"
                      onClick={handleUpdateUser}
                    >
                      Confirmar Datos
                    </Button>
                  )}
                </Col>
              </Row>
            </Form>
          )}
          <div className="order-summary">
            <h3>Resumen del Pedido</h3>
            <Divider />
            { cartDetails.map(product => {
              const { product_id: id, name, selectedVariation: variation } = product
              const { presentation, quality, quantity } = variation

              return (
                <div key={id} className="order-summary-item">
                  <span>{name} ({quality} -{" "} {presentation}) x {formatPrice(quantity)}</span>
                  <div className="quantity-controls">
                    <Button onClick={() => removeFromCart({product})}>-</Button>
                    <span className="quantity-text">{formatPrice(quantity)}</span>
                    <Button onClick={() => handleAddToCart(product)}>+</Button>
                  </div>
                  <span>${formatPrice(getPrice(variation) * quantity)}</span>
                </div>
              )
            })}

            <Divider />
            <p>Subtotal: <span>${formatPrice(subtotal)}</span></p>
            <p>Envío ({percentageShippingCost * 100}%): <span>${formatPrice(amountShippingCost)}</span></p>
            { isFirstOrder && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#FF914D",
                  marginTop: "5px",
                }}
              >
                ¡Descuento aplicado al costo de envío por ser tu primer pedido!
              </p>
            )}
            { userType === "restaurant" && (
              <>
                <Form.Item label="¿Necesita factura electrónica?">
                  <Input
                    type="checkbox"
                    checked={needsElectronicInvoice}
                    onChange={e => setNeedsElectronicInvoice(e.target.checked)}
                  />
                </Form.Item>
                { needsElectronicInvoice && (
                  <>
                    <Form.Item label="Nombre de la empresa">
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </Form.Item>
                    <Form.Item label="NIT de la empresa">
                      <Input value={companyNit} onChange={e => setCompanyNit(e.target.value)} />
                    </Form.Item>
                  </>
                )}
              </>
            )}

            <Divider />
            <h4>Total: <span>${formatPrice(total)}</span></h4>
            <Divider />
            
            <h5 style={{ 
              backgroundColor: '#ffdddd',
              color: '#d8000c',
              border: '1px solid #d8000c',
              padding: '10px',
              borderRadius: '5px',
              fontWeight: 'bold',  
            }}>
              Recuerde que los precios son fluctuantes, por lo tanto pueden variar
            </h5>
            <Divider />

            <Checkbox onChange={e => setCheckTerms(e.target.checked)}>
              Acepto los <a href="/terms" target="_blank">términos y condiciones</a>
            </Checkbox>

            <Button
              type="primary"
              className="place-order-button"
              onClick={handlePlaceOrder}
              disabled={!validateForm()}
            >
              REALIZAR EL PEDIDO
            </Button>

            <Modal
              title="Pedido Confirmado"
              open={isModalVisible}
              onOk={() => {
                setIsModalVisible(false);
                navigate("/products");
              }}
              onCancel={() => finishOrder("Productos Enviados Correctamente")}
              footer={[
                <Button
                  key="pdf"
                  type="default"
                  onClick={generateOrderPDF}
                  style={{ backgroundColor: "#FF914D", color: "#fff" }}
                >
                  Descargar PDF
                </Button>

              ]}
            >
              <div id="order-summary-pdf">
                <p style={{ 
                  backgroundColor: '#ffdddd',
                  color: '#d8000c',
                  border: '1px solid #d8000c',
                  padding: '10px',
                  borderRadius: '5px',
                  fontWeight: 'bold',  
                 }}>
                  Recuerde que los precios son fluctuantes, por lo tanto pueden variar
                </p>
                <p>
                  ¡{actualUser.user_name}, tu pedido ha sido realizado
                  exitosamente!<br />Sera despachado {new Date(new Date().setDate(new Date().getDate() + 1)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p>
                  ID de la orden: <strong>{orderId}</strong>
                </p>
                <Divider />
                <h4>Resumen del Pedido</h4>
                { cartDetails.map(product => {
                  const { product_id: id, name, selectedVariation: variation } = product
                  const { quantity, presentation, quality } = variation
                  
                  return (
                    <div key={id} className="order-summary-item">
                      <span>{name} ({quality} -{" "}{presentation}) x {formatPrice(quantity)}</span>
                      <span>${formatPrice(getPrice(variation) * quantity)}</span>
                    </div>
                  )
                })}
                <Divider />
                <p>Subtotal: ${formatPrice(subtotal)}</p>
                <p>Envío ({percentageShippingCost * 100}%): ${formatPrice(amountShippingCost)}</p>
                <h4>Total: ${formatPrice(total)}</h4>
              </div>
            </Modal>
          </div>
        </div>
      </div>
      <FloatingButtons />
      <CustomFooter />
    </div>
  );
};

export default Checkout;