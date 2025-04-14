import React, { createContext, useContext, useState, useEffect } from "react";
import { userType } from "utils/getUser";

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart"));
    return storedCart || {};
  });

  const [quantities, setQuantities] = useState({});
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const cartValue = Object.values(cart).reduce(
    (total, item) => total + item.selectedVariation.quantity * (item.selectedVariation.price || 0),
    0
  );

  // Validar si la variación tiene un precio válido antes de agregar al carrito
  const isValidVariation = (product) => {    
    if (!product?.selectedVariation) {
      return false;
    }
    
    const price = product.selectedVariation[`price_${userType}`]
    return price > 0 && price !== null;
  };

  const addToCart = (products) => {
    if (!Array.isArray(products)) {
      console.error("Error: 'products' debe ser un array.");
      products = [products];  // Si no es un array, lo convertimos en uno
    }   

    setCart((prevCart) => {
      const newCart = { ...prevCart };

      products.forEach((product) => {
        // Validar si la variación es válida antes de añadir al carrito
        if (!isValidVariation(product)) {
          setErrorMessage("Una de las variaciones seleccionadas no está disponible.");
          return;  // No añadir el producto al carrito
        }        

        const { selectedVariation: variation } = product
        const cartKey = `${product.product_id}-${variation.variation_id}-${variation.presentation}`;
        const quantitySelected = quantities[product.product_id] || 1;
        
        const pricePerUnit = product.selectedVariation[`price_${userType}`]
        const totalPrice = product.totalPrice;        

        if (newCart[cartKey]) {
          newCart[cartKey] = {
            ...newCart[cartKey],
            selectedVariation: {
              ...newCart[cartKey].selectedVariation,
              quantity: newCart[cartKey].selectedVariation.quantity + quantitySelected,
            },
            totalPrice: newCart[cartKey].totalPrice + totalPrice,
          };
        } else {
          newCart[cartKey] = {
            product_id: product.product_id,
            selectedVariation: {
              ...product.selectedVariation,
              quantity: quantitySelected,
              price: pricePerUnit
            },
            totalPrice,
          };
        }
      });

      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const removeFromCart = ({ product, deleteAll=false }) =>
    product.selectedVariation 
      ? setCart(prevCart => {
        const { selectedVariation: variation } = product
        const newCart = { ...prevCart };
        const cartKey = `${product.product_id}-${variation.variation_id}-${variation.presentation}`;
        
        if (newCart[cartKey]) {
          if ( deleteAll || newCart[cartKey].quantity === 1) {
            delete newCart[cartKey];
          } else {   
            newCart[cartKey] = {
              ...newCart[cartKey],
              selectedVariation: {
                ...newCart[cartKey].selectedVariation,
                quantity: newCart[cartKey].selectedVariation.quantity - 1,
              }
            } 
          }
        }
  
        return newCart;
      })
      : console.error("La variación seleccionada no está definida.")

  const updateQuantity = (product, quantity) => {
    setCart((prevCart) => {
      const { selectedVariation: variation } = product
      const newCart = { ...prevCart };
      const cartKey = `${product.product_id}-${variation.variation_id}-${variation.presentation}`;

      if (newCart[cartKey]) {
        newCart[cartKey] = {
          ...newCart[cartKey],
          selectedVariation: {
            ...newCart[cartKey].selectedVariation,
            quantity,
          }
        }
      }
      return newCart;
    });
  };

  const cartCount = Object.values(cart).reduce(
    (total, item) => total + (item.quantity || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartValue,
        cartCount,
        quantities,
        updateQuantity,
        errorMessage, // Pasar el mensaje de error
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export default CartContext;
