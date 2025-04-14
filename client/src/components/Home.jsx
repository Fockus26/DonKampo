import React, { useRef, useEffect, useState } from "react";
import {
  Carousel,
  Button,
  Card,
  Typography,
  AutoComplete,
  message,
} from "antd";
import { useNavigate } from "react-router-dom";
import Header from "components/General/Header";
import Footer from "components/General/Footer";
import InstallPrompt from "components/InstallPrompt"
import FloatingButtons from "components/General/FloatingButtons";
import getFetch from 'utils/getFetch.js'
import { getPrice } from "utils/getDataByUserType";
import { userType } from "utils/getUser";

import "css/Home.css";

const { Title, Paragraph } = Typography;

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
];

const Home = () => {  
  const carouselRef = useRef(null);
  const navigate = useNavigate(); 
    
  const [publicity, setPublicity] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [ showInstallPrompt, setShowInstallPrompt ] = useState(true)
  
  const handleSearch = value => navigate(`/products?search=${encodeURIComponent(value)}`);

  const fetchProducts = async query =>
    getFetch('products', `?search=${query}`)
      .then(fetchedProducts => {
        const filteredProducts = fetchedProducts.filter(product => product.name.toLowerCase().includes(query.toLowerCase()));

        setSearchResults(filteredProducts);
      })
      .catch(error => {
        message.error("Error al cargar los productos.");
        console.error("Error al obtener productos:", error);
      })

  const handleSearchChange = value => {
    setSearchValue(value);
    value ? fetchProducts(value) : setSearchResults([])
  }

  const handleSelect = value => {
    const selectedProduct = searchResults.find( product => product.name === value );
    
    selectedProduct && navigate(`/products?search=${encodeURIComponent(selectedProduct.name)}&id=${encodeURIComponent(selectedProduct.product_id)}`)
  };

  // Cargar datos iniciales
  useEffect(() => {
    const updatedUserType = 
      userType === 'home' ? 'hogar' 
      : userType === 'supermarket' ? 'supermercado'
      : userType === 'restuarant' ? 'restaurante'
      : userType


    getFetch('publicidad', '')
      .then(fetchedPublicity => {
        const advertisement = fetchedPublicity.filter(
          advertisement => advertisement.category.toLowerCase() === updatedUserType.toLowerCase()
        );
        setPublicity(advertisement);
      })
  }, []); 

  const handleNavigate = link => navigate(link);  

  return (
    <>
      <Header setShowInstallPrompt={setShowInstallPrompt} />
      <main>
        <div className="background-home" />
        <div className="search-bar">
          <AutoComplete
            className="custom-search-bar" // Agregamos una clase personalizada
            options={searchResults.map((product) => {
              const prices = product.variations.map(variation => getPrice(variation))
                            
              const minPrice = Math.min(...prices);

              return {
                value: product.name,
                key: product.product_id,
                label: (
                  <div className="search-result-item">
                    <div>
                      <img
                        src={product.photo_url}
                        alt={product.name}
                        style={{ width: "50px", marginRight: "10px" }}
                      />
                      <span>{product.name}</span>
                    </div>
                    <span className="range">Desde: {minPrice}</span>
                  </div>
                ),
              };
            })}
            style={{ width: "500px" }} // Esto es opcional, el estilo puede ir en CSS
            onSelect={handleSelect}
            onSearch={handleSearchChange}
            placeholder="Buscar productos, categorías, etc."
            value={searchValue}
            onChange={setSearchValue}
          />

          <Button
            type="primary"
            className="search-button"
            onClick={() => handleSearch(searchValue)}
          >
            Buscar
          </Button>
        </div>

        {/* Carrusel principal */}
        <div className="carousel-wrapper">
          <Carousel autoplay className="home-carousel" ref={carouselRef}>
            {publicity.length > 0 && publicity.map((item, index) => (
              <div key={index} className="carousel-item">
                <img
                  src={item.photo_url}
                  alt={item.title}
                  className="carousel-image"
                />
                <div className="carousel-overlay">
                  <div className="carousel-left">
                    <Title
                      level={2}
                      className="carousel-title"
                      style={{ color: "white" }}
                    >
                      {item.title}
                    </Title>
                    <Paragraph className="carousel-description">
                      {item.description}
                    </Paragraph>
                    <Button
                      type="primary"
                      size="large"
                      className="carousel-button"
                      onClick={() => handleNavigate(`/products?id=${item.related_product_id}`)}
                    >
                      Ver más
                    </Button>
                  </div>
                  <div className="carousel-right">
                    <img
                      src="/images/1.png"
                      alt="Logo"
                      className="carousel-logo"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>

        {/* Categorías destacadas */}
        <section className="categories-section">
          <h3 style={{ color: "#00983a" }}> Explora nuestras categorías </h3>
          <ul>
            {categories.map((category, index) => (
              <li key={index}>
                <a href={category.link}>
                  <Card
                    hoverable
                    cover={<img alt={category.title} src={category.img} />}
                    className="category-card"
                  >
                    <Card.Meta title={category.title} />
                  </Card>
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* sección de información */}
        <section className="info-section">
          <h3>Calidad garantizada</h3>
          <p>
            En Don Kampo, nuestra pasión es brindar productos frescos y de
            calidad excepcional, cultivados con dedicación y respeto por la
            tierra. <br /><br /> Nos enorgullece llevar lo mejor del campo directamente a
            tu mesa, promoviendo un consumo responsable y sostenible que
            apoya a nuestros agricultores y cuida del medio ambiente.
          </p>
          <Button  type="primary" size="50%" >Conoce más sobre nosotros</Button>

          <div />
        </section>

        <section className="delivery-section">
          <h2> No te Preocupes por el Envío! </h2>
          <h2>Te lo llevamos hasta tu puerta</h2>
          <img  alt="Camión Don Kampo" src="/images/37.png"
          />
         
        </section>
      
      </main>
      <Footer setShowInstallPrompt={setShowInstallPrompt} />

      <InstallPrompt showInstallPrompt={showInstallPrompt} setShowInstallPrompt={setShowInstallPrompt} />

      <FloatingButtons />
    </>
  );
};

export default Home;