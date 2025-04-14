const loginData = JSON.parse(localStorage.getItem("loginData"))

const userData = loginData?.user

let userType = userData?.user_type;

const isAdmin = userType === 'admin'

userType = 
    (userType === 'hogar' || userType === undefined) ? 'home' 
    : userType === 'supermercado' ? 'supermarket'
    : userType === 'restaurante' ? 'restaurant'
    : 'fruver'

export { userData, userType, isAdmin }