import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Button, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import axios from "axios";
import { saveAs } from "file-saver";
import "css/UpdateMultipleProducts.css";

const UpdateMultipleProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processExcel, setProcessExcel] = useState({ message: "", status: "" });
  const [messageButton, setMessageButton] = useState("Continuar");
  const [updateProducts, setUpdateProducts] = useState([]);

  const processingExcel = async (file) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    setIsLoading(true);
    setProcessExcel({ message: "Procesando archivo Excel", status: "" });
    await sleep(2000);
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // 1. Leer la hoja "Products"
        const productSheet = workbook.Sheets["Productos"];
        if (!productSheet) {
          setProcessExcel({ message: "La hoja Products no existe.", status: "error" });
          throw new Error("La hoja Products no existe en el archivo Excel.");
        }
        const productData = XLSX.utils.sheet_to_json(productSheet, { header: 1 });
        if (productData.length < 2) {
          setProcessExcel({ message: "La hoja Products no contiene datos.", status: "error" });
          throw new Error("La hoja Products no contiene datos suficientes.");
        }
        const productHeaders = productData[0];
        const productRows = productData.slice(1).filter((row) => row.length > 0);
        // Convertir filas a objetos para productos
        const excelProducts = productRows.map((row) => {
          const product = {};
          productHeaders.forEach((header, index) => {
            product[header] = row[index];
          });
          return {
            product_id: product["Id"],
            name: product["Nombre"],
            description: product["Descripcion"],
            category: product["Categoria"],
            promocionar: product["Promocionar"],
            active: product["Activo"],
            variations: []
          };
        });

        setProcessExcel({ message: "Productos obtenidos de Excel.", status: "" });
        await sleep(1000);

        // Para actualizar, solo nos interesa aquellos productos que existan en la BD
        const response = await axios.get("https://don-kampo-api-5vf3.onrender.com/api/products", { withCredentials: true });
        const dbProducts = response.data;
        const totalExcelProducts = excelProducts.filter((excelProduct) =>
          dbProducts.some((p) => p.product_id === excelProduct.product_id)
        );

        // 2. Leer la hoja única "Variaciones"
        const variationSheet = workbook.Sheets["Variaciones"];
        if (variationSheet) {
          const variationData = XLSX.utils.sheet_to_json(variationSheet, { header: 1 });
          if (variationData.length < 2) {
            console.warn("La hoja Variaciones no contiene datos suficientes.");
            setProcessExcel({ message: "La hoja Variaciones no contiene datos suficientes.", status: "warning" });
          } else {
            const variationHeaders = variationData[0];
            const variationRows = variationData.slice(1);
            variationRows.forEach((row) => {
              const variationObj = {};
              variationHeaders.forEach((header, index) => {
                variationObj[header] = row[index];
              });
              // Se espera que la hoja tenga columnas: "Id Product", "Producto", "Id Variation", "Calidad", "Activo" (y opcionalmente otros campos)
              const product = totalExcelProducts.find((p) => p.product_id === variationObj["Id Producto"]);
              if (product) {
                product.variations.push({
                  variation_id: variationObj["Id Variacion"],
                  quality: variationObj["Calidad"],
                  active: variationObj["Activo"],
                  presentations: [] // Se llenará en la siguiente sección
                });
              }
            });
          }
        } else {
          console.warn("La hoja Variaciones no existe en el archivo Excel.");
        }

        setProcessExcel({ message: "Variaciones obtenidas de Excel.", status: "" });
        await sleep(1000);

        // 3. Leer la hoja "Presentations"
        const presentationSheet = workbook.Sheets["Presentaciones"];
        if (presentationSheet) {
          const presentationData = XLSX.utils.sheet_to_json(presentationSheet, { header: 1 });
          if (presentationData.length >= 2) {
            const presHeaders = presentationData[0];
            const presRows = presentationData.slice(1);
            presRows.forEach((row) => {
              const presObj = {};
              presHeaders.forEach((header, index) => {
                presObj[header] = row[index];
              });
              // Se espera que la hoja tenga columnas: "Id Variación", "Presentación", "Precio Hogar", "Precio Supermercado", "Precio Restaurante", "Precio Fruver"
              totalExcelProducts.forEach((product) => {
                if (product.variations && product.variations.length > 0) {
                  product.variations.forEach((variation) => {
                    if (variation.variation_id === presObj["Id Variacion"]) {
                      variation.presentations.push({
                        presentation_id: presObj["Id Presentacion"],
                        presentation: presObj["Presentacion"],
                        price_home: presObj["Precio Hogar"],
                        price_supermarket: presObj["Precio Supermercado"],
                        price_restaurant: presObj["Precio Restaurante"],
                        price_fruver: presObj["Precio Fruver"]
                      });
                    }
                  });
                }
              });
            });
          } else {
            console.warn("La hoja Presentations no contiene datos suficientes.");
          }
        } else {
          console.warn("La hoja Presentations no existe en el archivo Excel.");
        }

        setProcessExcel({ message: `${totalExcelProducts.length} de ${excelProducts.length} productos por actualizar.`, status: "info" });
        setMessageButton("Actualizar Productos");
        setUpdateProducts(totalExcelProducts);
      } catch (error) {
        console.error("Error procesando el archivo Excel:", error);
        setProcessExcel({ message: "Error procesando el archivo Excel: " + error, status: "error" });
        setMessageButton("Cancelar");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const uploadProps = {
    accept: ".xlsx, .xls",
    beforeUpload: (file) => {
      processingExcel(file);
      return false;
    },
  };

  const updatingProducts = (event) => {
    event.preventDefault();
    setProcessExcel({ message: "Actualizando productos", status: "" });
    axios
      .put("https://don-kampo-api-5vf3.onrender.com/api/updatemultipleproducts", updateProducts, {
        headers: { "Content-Type": "application/json" },
      })
      .then((response) => {
        setProcessExcel({ message: "Productos actualizados exitosamente", status: "success" });
        setMessageButton("Continuar");
      })
      .catch((error) => {
        console.error("Error actualizando productos:", error);
        setProcessExcel({ message: "Error actualizando productos", status: "error" });
        setMessageButton("Cancelar");
      });
  };

  const closeModal = () => {
    setIsLoading(false);
    if (processExcel.status === "success") window.location.reload();
  };

  return (
    <div className="update-multiple-products">
      <h2>Actualización Múltiple de Productos</h2>
      <Alert
        message="El archivo Excel de actualización es el que se genera en Gestión de Productos."
        type="info"
        showIcon
        style={{ marginBottom: "20px" }}
      />
      <Upload {...uploadProps}>
        <Button className="excel" icon={<UploadOutlined />}>
          Actualizar múltiples productos (EXCEL)
        </Button>
      </Upload>
      {isLoading && (
        <div className="isLoading">
          <div className={processExcel.status}>
            <i
              className={`fa-solid fa-${
                processExcel.status === "success"
                  ? "circle-check"
                  : processExcel.status === "error"
                  ? "circle-xmark"
                  : processExcel.status === "info"
                  ? "circle-info"
                  : "spinner"
              } ${processExcel.status === "" && "spin"}`}
            />
            <span>{processExcel.message}</span>
            {processExcel.status === "info" && <button onClick={updatingProducts}>{messageButton}</button>}
            {processExcel.status === "info" && <button onClick={closeModal}>Cancelar</button>}
            {(processExcel.status === "success" || processExcel.status === "error") && (
              <button onClick={closeModal}>{messageButton}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateMultipleProducts;
