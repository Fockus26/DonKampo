import React, { useEffect, useState } from "react";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import { useCart } from "components/Products/CartContext";
import { Card, Button, message, Divider } from "antd";
import { DeleteOutlined } from '@ant-design/icons'; // Icono de la papelera (basura)
import FloatingButtons from "components/General/FloatingButtons";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import getFetch from "utils/getFetch";
import { getShippingCost, getPrice, isAmountCheckout } from "utils/getDataByUserType";

import "css/Cart.css";
import fruits from 'assets/fruits.jpg'
import formatPrice from 'utils/formatPrice.js'

const Cart = () => {
  const { cart, removeFromCart, addToCart, clearCart } = useCart();
  const [cartDetails, setCartDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shippingCost, setShippingCost] = useState(0);

  useEffect(() => {
    getFetch('customer-types', '')
      .then(fetchedShippingCosts => setShippingCost(getShippingCost(fetchedShippingCosts)))
      .catch(error => {
        message.error("Error al cargar los costos de envío.")
        console.error(error)
      })
  }, [])

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartDetails = async () => {
      setLoading(true);
      try {
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

        setCartDetails(productDetails.filter(item => item !== null));
      } catch (error) {
        message.error("Error al cargar los detalles del carrito.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartDetails();
  }, [cart]);

  const calculateSubtotal = () => {
    return cartDetails.reduce((total, product) => { 
      const { selectedVariation: variation } = product
      const { quantity } = variation
      return total + (getPrice(variation) * quantity)
    }, 0);
  };
  
  const subtotal = calculateSubtotal()
  const total = subtotal * (1 + shippingCost);

  const handleAddToCart = product => 
    product.selectedVariation 
      ? addToCart(product)
      : message.error("Por favor selecciona una variaci��n antes de añadir al carrito.")

      
  const handleCheckout = () => {
        
    if (cartDetails.length) {
      const { isAmount, content } = isAmountCheckout(total)

      isAmount ? navigate("/checkout") : message.warning(content)
    } else {
      message.warning("No tienes productos en el carrito.")
    }
  }

  return (
    <>  
      <Header />
      <main id='cart'>
        <div className="background-home" />
      
        <div className="cart-container">
          <h2 className="cart-title">Resumen del Carrito</h2>
          {loading ? (
            <p>Cargando...</p>
          ) : cartDetails.length === 0 ? (
            <p className="empty-cart-message">El carrito está vacío.</p>
          ) : (
            <div className="cart-content">
              <div className="cart-items">
                { cartDetails.map(product => {
                  const { category, product_id: id, photo_url: photo, selectedVariation: variation, name } = product
                  const { quantity, quality, presentation } = variation
                  
                  return (
                    <Card key={`${id}-${variation.variation_id}`} className="cart-item">
                      <div className="cart-item-layout">
                        <div className="cart-item-details">
                          <img
                            alt={name}
                            src={photo}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <h4>{name}</h4>
                            <p>Categoría: {category}</p>
                            <p>Calidad: {quality}</p>
                            <p>Cantidad: {formatPrice(quantity)}</p>
                            <p>Presentacion: {presentation}</p>
                            <p>Precio: ${formatPrice(getPrice(variation))}</p>
                            <p>Subtotal: ${formatPrice(getPrice(variation) * quantity)}</p>
                          </div>
                        </div>
                        <div className="cart-item-quantity">
                          <Button onClick={() => removeFromCart({product})}>-</Button>
                          <span>{formatPrice(quantity)}</span>
                          <Button onClick={() => handleAddToCart(product)}>+</Button>
                        </div>
                        <div className="cart-item-delete">
                          <Button danger icon={<DeleteOutlined />} onClick={() => removeFromCart({product, deleteAll:true})}/>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
              <div className="cart-summary">
                <h3>Total del Carrito</h3>
                <Divider />
                <p>Subtotal: ${formatPrice(calculateSubtotal())}</p>
                {/* <p><strong>Total: ${formatPrice(total)}</strong></p> */}
                <Button
                  type="primary"
                  className="checkout-button"
                  onClick={handleCheckout}
                >
                  Finalizar Compra
                </Button>
                <Button
                  type="secondary"
                  className="checkout-button "
                  onClick={() => navigate('/products')}
                >
                  Continuar Comprando
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <FloatingButtons />
      <CustomFooter />
    </>
  );
};  

export default Cart;
