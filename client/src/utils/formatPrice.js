const formatPrice = price => {
    const formattedPrice = 
        price
        .toFixed(2)
        .replace(/\.00$/, "")
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")

    return formattedPrice
}

export default formatPrice