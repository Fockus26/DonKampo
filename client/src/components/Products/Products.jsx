import React, { useEffect, useCallback, useState } from "react";
import { Card, Button, message, Select, Input, Pagination, Modal } from "antd";
import { useCart } from "./CartContext";
import Header from "components/General/Header";
import CustomFooter from "components/General/Footer";
import FloatingButtons from "components/General/FloatingButtons";
import { userType } from "utils/getUser";
import { getPrice } from "utils/getDataByUserType";
import getFetch from 'utils/getFetch.js';
import "css/Products.css";

const { Option } = Select;

const Products = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVariations, setSelectedVariations] = useState({});
  const [quantities, setQuantities] = useState({});
  const [isVisible, setIsModalVisible] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  const { addToCart } = useCart();

  const filterProducts = useCallback(({category, name, id=null, actualProducts={}}) => {
      let handleProducts = products.length ? products : actualProducts
      const filtered = handleProducts.filter(product => {
        if (id) {          
          return product.product_id === id
        } else {          
          const matchesCategory = category.toLowerCase() === "todas" || product.category.toLowerCase() === category.toLowerCase();
          const matchesSearch = normalizeString(product.name).includes(normalizeString(name));
          return matchesCategory && matchesSearch;
        }
      });
      
      setFilteredProducts(filtered);
      setCurrentPage(1);
  }, [products])

  useEffect(() => {
    getFetch('products', '')
      .then(fetchedProducts => {
        const updatedProducts = fetchedProducts.map(product => ({
          ...product,
          variations: Array.isArray(product.variations)
            ? product.variations.map((variation, index) => ({
                ...variation,
                variation_id: `${product.product_id}-${index}`,
              }))
            : [],
        }));

        setProducts(updatedProducts);

        const urlParams = new URLSearchParams(window.location.search);
        const searchQueryFromUrl = urlParams.get("search") || "";
        const categoryQueryFromUrl = urlParams.get("category") || "Todas";
        const idQueryFromUrl = parseInt(urlParams.get("id")) || null;

        setSelectedCategory(categoryQueryFromUrl.toLowerCase());
        setSearchQuery(searchQueryFromUrl);
        
        filterProducts({category: categoryQueryFromUrl, name: searchQueryFromUrl, id: idQueryFromUrl, actualProducts: updatedProducts});

        const uniqueCategories = [...new Set(updatedProducts.map(product => product.category))];
        setCategories(["Todas", ...uniqueCategories]);
      })
      .catch(error => {
        message.error("Error al cargar los productos.");
        console.error("Error:", error);
      })
      .finally(() => setLoading(false))
  }, []);

  const handleCategoryChange = category => {
    setSelectedCategory(category);
    filterProducts({category, name: searchQuery});
  };

  const handleSearchChange = value => {
    setSearchQuery(value);
    filterProducts({category: selectedCategory, name: value});
  };

  const normalizeString = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const getBase64Image = (photoUrl) => photoUrl || `${import.meta.env.PUBLIC_URL}/images/icon.png`;

  const handleVariationChange = (productId, variationType, value) => {
    setSelectedVariations(prev => {
      const updatedVariations = {
        ...prev,
        [productId]: {
          ...prev[productId],
          [variationType]: value,
        }
      }

      return updatedVariations
    });
  };

  const handleIncrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 1) + 1,
    }));
  };

  const handleDecrement = (productId) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) - 1),
    }));
  };

  const handleAddToCart = (product) => {
    let selectedVariation;
    let selectedPresentation

    if ( userType === "home" ) {
      // Para "hogar", usar la primera variación
      selectedVariation = product.variations[0];
    } else {
      
      const currentVariation = selectedVariations[product.product_id]
      // Para otros tipos de usuario, usar la variación seleccionada
      selectedVariation = product.variations.find(v =>  v.quality === currentVariation?.quality)
      
      if (!selectedVariation) {
        message.error("Por favor selecciona una calidad y presentacion.");
        return;
      }
    }

    selectedPresentation = selectedVariation.presentations.find(p => p.presentation === selectedVariations[product.product_id]?.presentation)

    if (!selectedVariation) {
      message.error("No se encontró una variación válida para este producto.");
      return;
    } else {
      message.success("Producto agregado al carrito.");
    }

    const multiplier = quantities[product.product_id] || 1;    

    const productsToAdd = Array.from({ length: multiplier }, () => ({
      ...product,
      selectedVariation: {
        variation_id: selectedVariation.variation_id,
        quality: selectedVariation.quality,
        active: selectedVariation.active,
        presentation: selectedPresentation.presentation,
        presentation_id: selectedPresentation.presentation_id,
        price_home: selectedPresentation.price_home,
        price_supermarket: selectedPresentation.price_supermarket,
        price_restaurant: selectedPresentation.price_restaurant,
        price_fruver: selectedPresentation.price_fruver,
        quantity: 1,
      },
      totalPrice: getPrice(selectedPresentation),
    }));

    addToCart(productsToAdd);

    setSelectedVariations((prev) => {
      const updatedVariations = { ...prev };
      delete updatedVariations[product.product_id];
      return updatedVariations;
    });

    setQuantities((prev) => {
      const updatedQuantities = { ...prev };
      delete updatedQuantities[product.product_id];
      return updatedQuantities;
    });

    setIsModalVisible(false);
  };

  const openModal = product => {
    setCurrentProduct(product);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setCurrentProduct(null);
  };

  const handleInputChange = (productId, value) => {
    const newValue = Math.max(1, parseInt(value) || 1);
    setQuantities((prev) => ({
      ...prev,
      [productId]: newValue,
    }));
  };  


  return (
    <>
      <Header />
      <article
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          backgroundColor: '#0fb83970',
          borderRadius: '8px',
          margin: '10px auto',
          maxWidth: '1078px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '5%'
        }}
      >
        <Select
          placeholder="Filtrar por categoría"
          style={{ width: 200, marginRight: 16 }}
          onChange={handleCategoryChange}
          value={selectedCategory}
          size="large"
        >
          {categories.map((category) => (
            
            <Option key={category} value={category}>
              {category}
            </Option>
          ))}
        </Select>

        <Input
          placeholder="Buscar productos"
          value={searchQuery}
          onChange={e => handleSearchChange(e.target.value)}
          style={{ width: 300 }}
          allowClear
          size="large"
        />
      </article>
      { currentProducts.length ? 
        <>
          <div className="products-container">
            {loading ? (
              <p>Cargando productos...</p>
            ) : (
              <>
                { currentProducts.map(product => {            
                  const { name, category, description, product_id: id, photo_url: url, promocionar } = product

                  return (
                    <Card
                      key={id}
                      className={`product-card ${promocionar ? 'promo' : ''}`}
                      hoverable
                      onClick={() => openModal(product)}
                      cover={
                        <img
                          alt={name}
                          src={getBase64Image(url)}
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "250px",
                          }}
                        />
                      }
                    >
                      <div className="product-info">
                        <h3 className="product-name">{name}</h3>
                        <p className="product-category">{category}</p>
                        <p className="product-description">{description}</p>

                        <Button type="primary" onClick={() => openModal(product)}>
                          { userType === 'home' ? 'Agregar al carrito' : 'Ver detalles' }
                        </Button> 
                      </div>
                    </Card>
                  );
                })}
              </>
            )}
          </div>

          {!loading && (
            <Pagination
              current={currentPage}
              pageSize={itemsPerPage}
              total={filteredProducts.length}
              onChange={(page) => setCurrentPage(page)}
              className="pagination"
            />
          )}
        </>
        : <span className="noAvailable">No existe el producto</span>
      }

      { currentProduct && 
        <Modal
          title={currentProduct.name}
          open={isVisible}
          onCancel={handleCancelModal}
          footer={null}
          width={400}
        >
          <img
            alt={currentProduct.name}
            src={getBase64Image(currentProduct.photo_url)}
            style={{ width: "100%", height: "300px", objectFit: "cover" }}
          />

          {/* Calidad */}
          <Select
            placeholder="Calidad"
            style={{ width: "100%", marginBottom: "8px" }}
            value={selectedVariations[currentProduct.product_id]?.quality}
            onChange={ value => handleVariationChange(currentProduct.product_id, "quality", value) }
          >
            { currentProduct.variations.map(variation => (
              <Option key={variation.variation_id} value={variation.quality}>
                {variation.quality}
              </Option>
            ))}
          </Select>
          {/* Presentacion */}
          <Select
            disabled={!selectedVariations[currentProduct.product_id]?.quality}
            placeholder="Presentacion"
            style={{ width: "100%", marginBottom: "8px" }}
            value={selectedVariations[currentProduct.product_id]?.presentation}
            onChange={(value) =>
              handleVariationChange(currentProduct.product_id, "presentation", value)
            }
          >
            { selectedVariations[currentProduct.product_id]?.quality &&
              currentProduct.variations 
                .filter((variation) => (
                  selectedVariations[currentProduct['product_id']].quality === variation.quality
                ))[0].presentations.map((presentation, index) => (
                  <Option key={index} value={presentation.presentation}>
                    {presentation.presentation}
                  </Option>
                ))
            }
          </Select>

          <div className="quantity-controls" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button onClick={() => handleDecrement(currentProduct.product_id)}>-</Button>
            <input
              type="number"
              value={quantities[currentProduct.product_id] || 1}
              onChange={(e) => handleInputChange(currentProduct.product_id, e.target.value)}
              style={{
                width: "50px",
                textAlign: "center",
                border: "1px solid #d9d9d9",
                borderRadius: "4px",
                padding: "4px",
              }}
            />
            <Button onClick={() => handleIncrement(currentProduct.product_id)}>+</Button>
          </div>

          <div className="product-price" style={{ marginTop: "8px", textAlign: "center" }}>
            { selectedVariations[currentProduct.product_id]?.quality &&
              selectedVariations[currentProduct.product_id]?.presentation ? (
              <span>
                Precio: $
                {(
                  getPrice(
                    currentProduct.variations
                    .find(v => v.quality === selectedVariations[currentProduct.product_id]?.quality)
                    .presentations.find(p => p.presentation === selectedVariations[currentProduct.product_id].presentation)
                  ) * (quantities[currentProduct.product_id] || 1)
                )
                  .toFixed(2)
                  .replace(/\.00$/, "")
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
              </span>
            ) : (
              <span>Selecciona calidad y presentacion para ver el precio!</span>
            )}
          </div>

          <Button
            type="primary"
            onClick={() => handleAddToCart(currentProduct)}
            style={{ marginTop: "8px", width: "100%" }}
          >
            Añadir al carrito
          </Button>
        </Modal>
      }

      <FloatingButtons />
      <CustomFooter />
    </>
  );
};

export default Products;
