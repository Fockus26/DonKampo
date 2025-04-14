import React from "react";
import { FloatingWhatsApp } from "react-floating-whatsapp";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ShoppingCartOutlined } from "@ant-design/icons";

const FloatButton = () => {
  const navigate = useNavigate()

  const goToCart = () => {
    navigate('/cart')
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const styleFloatButton = {
    position: "fixed",
    bottom: '120px',
    right: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ee7723',
    border: '2px solid white',
    borderRadius: '50%',
    width: '60px',
    height: '60px',
    zIndex: 1000,
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={goToCart}
      className={`fixed bottom-20 right-4 p-4 rounded-full shadow-lg flex items-center justify-center`} 
      style={styleFloatButton}
    >
      <ShoppingCartOutlined style={{ fontSize: "28px", color: "#f9f9f9" }} />
    </motion.button>
  )
}

const FloatWhatsApp = () => {
  let userMessage;
  const phoneNumber = "573117366666";
  const welcomeMessage = "¡Hola! Bienvenido a Don Kampo, ¿en qué podemos ayudarte?";

  const createWhatsAppLink = () => {
    const encodedMessage = encodeURIComponent(userMessage);
    const phoneNumber = "573117366666"; // Tu número de WhatsApp
    const messageUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    return messageUrl;
  }; 

  return (
    < FloatingWhatsApp
      phoneNumber={phoneNumber}
      accountName="Don Kampo"
      avatar="/images/icon.png"
      statusMessage="En línea"
      chatMessage={welcomeMessage}
      placeholder="Escribe tu mensaje..."
      darkMode={false}
      allowClickAway={true}
      color="white"
      url={createWhatsAppLink()} 
    />
  )
}

const FloatingButtons = () => {
  return (
    <>
      <FloatButton />
      <FloatWhatsApp />
    </>
  )
}

export default FloatingButtons