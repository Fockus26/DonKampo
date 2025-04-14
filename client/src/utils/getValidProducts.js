import { userType, isAdmin } from "./getUser";

const getValidProducts = (products) => {
  if (isAdmin) {
    return products;
  } else {
    return products
      .map((product) => {
        // Filtrar solo variaciones activas
        const activeVariations = product.variations.filter(
          (variation) => variation.active
        );

        // Filtrar presentaciones con precio mayor a 0 según userType
        const validVariations = activeVariations
          .map((variation) => {
            const validPresentations = variation.presentations.filter(
              (presentation) => presentation[`price_${userType}`] && presentation[`price_${userType}`] > 0
            );

            // Solo conservar variaciones con al menos una presentación válida
            return validPresentations.length > 0
              ? { ...variation, presentations: validPresentations }
              : null;
          })
          .filter((variation) => variation !== null);

        // Retornar el producto solo si tiene variaciones válidas
        return validVariations.length > 0
          ? { ...product, variations: validVariations }
          : null;
      })
      .filter((product) => product !== null && product.active); // Eliminar productos sin variaciones válidas y solo incluir productos activos
  }
};

export default getValidProducts;
