import { userType } from "./getUser";

const getPrice = presentation => {
    if (presentation) {
        const price = presentation[`price_${userType === 'admin' ? 'fruver' : userType}`]
        return parseInt(price);
    } else return null
};

const getShippingCost = shippingData => {        
    const formattedUserType = 
        userType === 'home' ? 'Hogar'
        : userType === 'supermarket' ? 'Supermercado'
        : userType === 'restaurant' ? 'Restaurante'
        : 'Fruver'
 
    if (formattedUserType === 'Hogar') return 3 / 100
    const shippingCost = shippingData.filter(data => data.type_name === formattedUserType)[0].shipping_cost
    return shippingCost / 100
}

const isAmountCheckout = amount => { 
    const isAmount = (userType === 'home' && amount >= 50000) || amount >= 100000
    let content
    if (!isAmount) content = `Necesitas un minimo de $${userType === 'home' ? '5' : '10'}0.000`
    return { isAmount, content }
}

export { getPrice, getShippingCost, isAmountCheckout }