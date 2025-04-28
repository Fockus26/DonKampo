import React from "react";
import "css/General.css";

const categories = [
  {
    title: "Frutas Nacionales",
    img: "/images/mangostino.webp",
    link: "/products?category=Frutas nacionales",
  },
  { title: "Verduras", 
    img: "/images/verdurasProducto.jpg", 
    link: "/products?category=Verduras" },
  {
    title: "Frutas Importadas",
    img: "/images/frutasImportadas.jpg",
    link: "/products?category=Frutas importadas",
  },
  { title: "Hortalizas", 
    img: "/images/hortalizas.jpg", 
    link: "/products?category=Hortalizas" 
  },
  { title: "Cosechas", 
    img: "/images/organicas.webp", 
    link: "/products?category=Cosechas" 
  },
];

const Footer = props => {
  const { setShowInstallPrompt, setForceShow } = props
  
  return (
    <footer className="footer">
      <h3>Explora nuestras categorías</h3>

      <nav>
        <ul>
        {categories.map((category, index) => (
          <li key={index}>
            <a href={category.link}>
              <img src={category.img} alt={category.title} />
              <p>{category.title}</p>
            </a>
          </li>
        ))}
        </ul>
      </nav>

      <ul className="contact-info">
        <li className="contact">
          <a href="https://wa.me/3117366666" target="_blank" rel="noopener noreferrer"> <i className="fa-brands fa-whatsapp" /> +573117366666 </a>
          <a href="mailto:info@donkampo.com"><i className="fa-regular fa-envelope" /> info@donkampo.com </a>
          
        </li>
        <li className="copy">
        <span> Diseñado y Desarrollado por <a href="https://www.cre8tive.pro/" target="_blank" rel="noopener noreferrer" className="company"> Cre8tive Agency </a></span>
          <span>&copy; { new Date().getFullYear() } Don Kampo. Todos los derechos reservados</span>
        </li>

        <li className="legalInfo">
          <a href="/terms" rel="noopener noreferrer"> Terminos y Condiciones </a>
          <a href="/privacy-politicy" rel="noopener noreferrer"> Politica de Privacidad </a>
        </li>
      </ul>
      <button onClick={() => { setShowInstallPrompt(true); setForceShow(true) }}><i className="fa-solid fa-mobile-screen"/>Instalar App</button>
    </footer>
  );
};

export default Footer;
