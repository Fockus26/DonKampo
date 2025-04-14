import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "components/Login";
import Register from "components/Register";
import Products from "components/Products/Products";
import Cart from "components/Cart.jsx";
import Checkout from "components/Checkout.jsx";
import CreateProduct from "components/Products/CreateProduct.jsx";
import Profile from "components/Profile.jsx";
import AdminProfile from "components/Admin/AdminProfile.jsx";
import ManageData from "components/Admin/ManageData.jsx";
import CreateOrder from "components/CreateOrder.jsx";
import Home from "components/Home.jsx";
import { CartProvider } from "components/Products/CartContext.jsx";
import { TermsAndConditions, PrivacyPoliticy } from "components/LegalInfo";
import { userType, isAdmin } from "utils/getUser"

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false); // Establecer que ya no se está cargando
  }, []);

  // Registrar el Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
    }
  }, []);

  if (isLoading) {
    // Mostrar una pantalla de carga mientras se recupera el tipo de usuario
    return <div className="cargandoPaginas"><img src="/images/1.png" alt="Don Kampo Logo"/></div>;
  }

  return (
    <Router>
      <CartProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy-politicy" element={<PrivacyPoliticy />} />

          {/* Rutas protegidas para usuarios admin */}
          <Route
            path="/createproduct"
            element={
              isAdmin ? (
                <CreateProduct />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/manageData"
            element={
              isAdmin ? (
                <ManageData />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Ruta protegida para crear órdenes */}
          <Route
            path="/createorder"
            element={
              userType ? (
                <CreateOrder />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Ruta para el perfil del usuario */}
          <Route
            path="/profile"
            element={
              isAdmin ? (
                <AdminProfile />
              ) : userType ? (
                <Profile />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </CartProvider>
    </Router>
  );
};

export default App;
