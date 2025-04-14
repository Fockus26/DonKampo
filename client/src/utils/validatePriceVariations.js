import { message } from "antd";

const validatePriceVariations = variations => {
    const validPrice = price => price !== "" && price !== null && price !== undefined && price > 0;

    for (let variationIndex = 0; variationIndex < variations.length; variationIndex++) {
        const variation = variations[variationIndex];

        for (let presentation of variation.presentations) {
            const { presentation: presentationName, price_home, price_supermarket, price_restaurant, price_fruver } = presentation;

            const presentationPrices = [price_home, price_supermarket, price_restaurant, price_fruver];
            const hasValidPrice = presentationPrices.some(validPrice);

            if (!hasValidPrice) {
                message.error(`La presentación "${presentationName}" en la variación ${variationIndex + 1} debe tener al menos un precio mayor a 0.`);
                return false; // Detiene la función inmediatamente
            }
        }
    }

    return true; // Si ninguna presentación tiene errores, retorna true
};

export default validatePriceVariations;
