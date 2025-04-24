import axios from "axios";
import getValidProducts from 'utils/getValidProducts'

const getFetch = async (endpoint, params) => {  
    const response = await axios.get(`http://localhost:8080/api/${endpoint}${params}`, { withCredentials: true });
    
    if (response.data) {
        if (endpoint === 'products') return getValidProducts(response.data)
        else return response.data
    } 
};

export default getFetch