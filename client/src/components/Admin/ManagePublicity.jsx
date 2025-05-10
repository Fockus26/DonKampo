import React, { useState, useEffect } from "react";
import axios from "axios";

import getFetch from "utils/getFetch"

import "css/ManagePublicity.css";

const ManagePublicity = () => {
  const [advertisements, setAdvertisements] = useState([]);
  const [filteredAdvertisements, setFilteredAdvertisements] = useState([]);
  const [newAd, setNewAd] = useState({
    category: "",
    title: "",
    description: "",
    related_product_id: "",
    photo_url: null,
    previewURL: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  // Obtener todas las publicidades
  const fetchAdvertisements = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("http://localhost:8080/api/publicidad");
      setAdvertisements(response.data);
      setFilteredAdvertisements(response.data);
    } catch (error) {
      console.error("Error al obtener las publicidades:", error);
      alert("No se pudo cargar la lista de publicidades.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  useEffect(() => {
    if (categoryFilter) {
      setFilteredAdvertisements(
        advertisements.filter((ad) => ad.category === categoryFilter)
      );
    } else {
      setFilteredAdvertisements(advertisements);
    }
  }, [categoryFilter, advertisements]);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
  
    setNewAd((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
      previewUrl: files ? URL.createObjectURL(files[0]) : prev.previewUrl, // Agrega la vista previa
    }));
  };

  // Función para crear publicidad
  const createAdvertisement = async () => {
    if (!newAd.category || !newAd.title || !newAd.description || !newAd.photo_url || !newAd.related_product_id) {
      alert("Por favor, complete todos los campos antes de enviar.");
      return;
    }

    try {
      setIsLoading(true);

      const productId = newAd.related_product_id
      console.log(newAd)

      // Obtener el producto
      const product = await getFetch('getproduct/' + productId, '');      

      if (product) {
          // Preparar los datos del formulario
        const formData = new FormData();
        Object.keys(newAd).forEach((key) => formData.append(key, newAd[key]));

        await axios.post("http://localhost:8080/api/publicidad", formData);
        alert("Publicidad creada exitosamente.");
        setNewAd({ category: "", title: "", description: "", photo_url: null, related_product_id: "" });
        fetchAdvertisements();
      }

    } catch (error) {
        console.error('Error', error)
        alert("El Id del Producto no existe")
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAdvertisement = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta publicidad?")) return;

    try {
      await axios.delete(`http://localhost:8080/api/publicidad/${id}`);
      alert("Publicidad eliminada correctamente.");
      fetchAdvertisements();
    } catch (error) {
      console.error("Error al eliminar la publicidad:", error);
      alert("No se pudo eliminar la publicidad.");
    }
  };

  const openEditModal = (ad) => {
    setEditingAd(ad);
    setNewAd({
      category: ad.category,
      title: ad.title,
      description: ad.description,
      photo_url: ad.photo_url,
      related_product_id: ad.related_product_id || "", // Asignar el product_id si existe
    });
    setShowModal(true);
  };

  const editAdvertisement = async () => {
    if (!newAd.title || !newAd.description || !newAd.related_product_id) {
      alert("Por favor, complete todos los campos antes de enviar.");
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", newAd.title);
      formData.append("description", newAd.description);
      if (newAd.photo_url && newAd.photo_url instanceof File) {
        formData.append("photo_url", newAd.photo_url);
      } else if (editingAd.photo_url) {
        formData.append("photo_url", editingAd.photo_url);
      }
      formData.append("category", newAd.category);
      formData.append("related_product_id", newAd.related_product_id);

      await axios.put(
        `http://localhost:8080/api/publicidad/${editingAd.advertisement_id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      alert("Publicidad actualizada exitosamente.");
      setShowModal(false);
      setNewAd({ category: "", title: "", description: "", photo_url: null, related_product_id: "" });
      fetchAdvertisements();
    } catch (error) {
      console.error("Error al editar la publicidad:", error);
      alert("Ocurrió un error al editar la publicidad.");
    } finally {
      setIsLoading(false);
    }
  };

  const openImageModal = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalImage(null);
  };

  return (
    <section className="manage-publicity">
      <h2>Gestión de Publicidad</h2>

      <div className="container-publicity">
        {/* Crear nueva publicidad */}
        <div className="create-advertisement">
          <h5>Crear Nueva Publicidad</h5>
          <select name="category" value={newAd.category} onChange={handleInputChange}>
            <option value="">Selecciona una categoría</option>
            <option value="hogar">Hogar</option>
            <option value="supermercado">Supermercado</option>
            <option value="restaurante">Restaurante</option>
            <option value="fruver">Fruver</option>
          </select>
          <input
            type="text"
            name="title"
            placeholder="Título"
            value={newAd.title}
            onChange={handleInputChange}
          />
          <input
            type="number"
            name="related_product_id"
            placeholder="Id del Producto"
            value={newAd.related_product_id}
            onChange={handleInputChange}
          />
          <textarea
            name="description"
            placeholder="Descripción"
            value={newAd.description}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="related_product_id"
            placeholder="ID del Producto Relacionado"
            value={newAd.related_product_id}
            onChange={handleInputChange}
          />
          {newAd.previewUrl && (
            <img src={newAd.previewUrl} alt="Vista previa" style={{ width: "100%", maxWidth: '300px', maxHeight: '300px', marginTop: "10px", borderRadius: '8px' }} />
          )}
          <div style={{ marginTop: '20px' }}>
            <label htmlFor="fileInput" className="custom-file-upload">
              Subir imágenes
            </label>
            <input
              id="fileInput"
              type="file"
              name="photo_url"
              accept="image/*"
              placeholder="Subir imagen"
              onChange={handleInputChange}
              style={{ display: "none" }}
            />
          </div>
          <button
            onClick={createAdvertisement}
            className="create-button"
            disabled={isLoading}
          >
            {isLoading ? "Creando..." : "Crear Publicidad"}
          </button>
        </div>

        {/* Filtro por categoría */}
        <div className="category-filter">
          <label htmlFor="categoryFilter">Filtrar por categoría:</label>
          <select
            id="categoryFilter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas</option>
            <option value="hogar">Hogar</option>
            <option value="supermercado">Supermercado</option>
            <option value="restaurante">Restaurante</option>
            <option value="fruver">Fruver</option>
          </select>
        </div>

        {/* Lista de publicidades filtradas */}
        <div className="advertisements-list">
          {filteredAdvertisements.length > 0 ? (
            filteredAdvertisements.map((ad) => (
              <div key={ad.advertisement_id} className="advertisement-item">
                <img
                  src={ad.photo_url}
                  alt={ad.title}
                  className="advertisement-image"
                  onClick={() => openImageModal(ad.photo_url)}
                />
                <div className="advertisement-info">
                  <h4>{ad.title}</h4>
                  <p><strong>Id Producto:</strong> {ad.related_product_id}</p>
                  <p><strong>Categoría:</strong> {ad.category}</p>
                  <p><strong>Descripcion:</strong> {ad.description}</p>
                </div>
                <div className="advertisement-actions">
                  <button
                    onClick={() => deleteAdvertisement(ad.advertisement_id)}
                    className="delete-button"
                  >
                    Eliminar
                  </button>
                  <button
                    onClick={() => openEditModal(ad)}
                    className="edit-button"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No hay publicidades disponibles.</p>
          )}
        </div>
      </div>

      {/* Modal para la imagen */}
      {showModal && modalImage && (
        <div className="modal">
          <div className="modal-content">
            <button onClick={closeModal} className="close-button">X</button>
            <img src={modalImage} alt="Publicidad" className="modal-image" />
          </div>
        </div>
      )}

      {/* Modal para editar publicidad */}
      {showModal && !modalImage && (
        <div className="modal">
          <div className="modal-content">
            <h3>Editar Publicidad</h3>
            <select name="category" value={newAd.category} onChange={handleInputChange}>
              <option value="">Selecciona una categoría</option>
              <option value="hogar">Hogar</option>
              <option value="supermercado">Supermercado</option>
              <option value="restaurante">Restaurante</option>
              <option value="fruver">Fruver</option>
            </select>
            <input
              type="text"
              name="title"
              placeholder="Título"
              value={newAd.title}
              onChange={handleInputChange}
            />
            <input
              type="number"
              name="related_product_id"
              placeholder="Id del Producto"
              value={newAd.related_product_id}
              onChange={handleInputChange}
            />
            <textarea
              name="description"
              placeholder="Descripción"
              value={newAd.description}
              onChange={handleInputChange}
            />
            <div className="buttons">
              <button
                className="edit-button"
                onClick={editAdvertisement}
                disabled={isLoading}
              >
                {isLoading ? "Actualizando..." : "Actualizar Publicidad"}
              </button>
              <button onClick={closeModal} className="close-button">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ManagePublicity;
