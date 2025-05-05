import React, { useEffect, useState } from "react";
import { Menu, Drawer, Button, Badge } from "antd";
import {
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useCart } from "components/Products/CartContext"; // Importa el hook de contexto de carrito
import "css/General.css";
import { FaMobileAlt } from "react-icons/fa";

const Header = ({ setShowInstallPrompt, setForceShow }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Obtener el cartValue y cartCount desde el contexto del carrito
  const { cartValue } = useCart();

  // Obtener el loginData del localStorage
  const loginData = JSON.parse(localStorage.getItem("loginData"));
  const isLoggedIn = Boolean(loginData && loginData.user);
  const isAdmin = isLoggedIn && loginData.user.user_type === "admin"; // Verifica si el usuario es admin

  // Estado para la ruta seleccionada y para el drawer en pantallas pequeñas
  const [selectedKey, setSelectedKey] = useState(localStorage.getItem("selectedKey") || "home");
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Efecto para actualizar la ruta seleccionada en el menú
  useEffect(() => {
    const path = location.pathname;
    switch (path) {
      case "/":
        setSelectedKey("home");
        break;
      case "/products":
        setSelectedKey("products");
        break;
      case "/profile":
        setSelectedKey("profile");
        break;
      case "/login":
        setSelectedKey("login");
        break;
      case "/register":
        setSelectedKey("register");
        break;
      case "/cart":
        setSelectedKey("cart");
        break;
      case "/createproduct":
        setSelectedKey("createproduct");
        break;
      case "/createorder":
        setSelectedKey("createorder");
        break;
      case "/manageData":
        setSelectedKey("manageData");
        break;
      case "/checkout":
        setSelectedKey("checkout");
        break;
      case "/adminprofile":
        setSelectedKey("adminprofile");
        break;
      default:
        setSelectedKey("home");
        break;
    }
  }, [location.pathname]);

  // Función para manejar el clic en el menú y cambiar la ruta
  const handleMenuClick = (key) => {
    navigate(`/${key}`);
    setDrawerVisible(false); // Cierra el Drawer si se selecciona un elemento
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("loginData");
    localStorage.removeItem("cart");
    handleMenuClick("login");
    window.location.reload();
  };

  return (
    <header className="header">
      <div>
        <a href="/">
          <img src="/images/1.png" alt="Don Kampo Logo" />
        </a>

        <div
          className="cart-icon"
          style={{ display: "flex", alignItems: "center" }}
          onClick={() => handleMenuClick("cart")}
        >
          <Badge
            count={
              cartValue > 99999
                ? `${(cartValue / 1000).toFixed(1)}K`
                : `$${cartValue.toLocaleString()}`
            }
            offset={[10, 0]}
            style={{
              backgroundColor: "#52c41a",
              fontSize: "14px",
              padding: "0 8px",
            }}
          >
            <ShoppingCartOutlined
              style={{ fontSize: "24px", color: "white", cursor: "pointer" }}
            />
          </Badge>
        </div>
      </div>

      {/* Menú para pantallas grandes */}
      <nav>
        <ul>
          <li>
            <a className="app" href="#" onClick={() => { setShowInstallPrompt(true); setForceShow(true) }}>
              <i className="fa-solid fa-mobile-screen" /> App
            </a>
          </li>
          <li>
            <a
              className={`${selectedKey === "home" ? "selected" : ""}`}
              href="/"
              onClick={() => handleMenuClick("")}
            >
              <i className="fa-solid fa-house" /> Inicio
            </a>
          </li>
          <li className="cosechas">
            <a href="/products?category=Cosechas">Cosechas</a>
          </li>
          <li>
            <a
              className={`${selectedKey === "products" ? "selected" : ""}`}
              href="/products"
              onClick={() => handleMenuClick("products")}
            >
              <i className="fa-solid fa-grip" /> Productos
            </a>
          </li>
          {isLoggedIn ? (
            <>
              {isAdmin && (
                <li>
                  <a
                    className={`${selectedKey === "manageData" ? "selected" : ""}`}
                    href="/manageData"
                    onClick={() => handleMenuClick("manageData")}
                  >
                    <i className="fa-solid fa-sliders" /> Gestión
                  </a>
                </li>
              )}
              <li>
                <a
                  className={`${selectedKey === "profile" ? "selected" : ""}`}
                  href="/profile"
                  onClick={() => handleMenuClick("profile")}
                >
                  <i className="fa-regular fa-user" /> {loginData.user.user_name}
                </a>
              </li>
              <li>
                <a onClick={handleLogout}>
                  <i className="fa-solid fa-right-from-bracket" /> Cerrar Sesión
                </a>
              </li>
            </>
          ) : (
            <>
              <li>
                <a
                  className={`${selectedKey === "login" ? "selected" : ""}`}
                  href="/login"
                  onClick={() => handleMenuClick("login")}
                >
                  <i className="fa-solid fa-user" /> Iniciar Sesión
                </a>
              </li>
              <li>
                <a
                  className={`${selectedKey === "register" ? "selected" : ""}`}
                  href="/register"
                  onClick={() => handleMenuClick("register")}
                >
                  <i className="fa-regular fa-circle-user" /> Registrarse
                </a>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Ícono de menú para pantallas pequeñas */}
      <button onClick={() => setDrawerVisible(true)}>
        <i className="fa-solid fa-bars" />
      </button>

      {/* Drawer para menú en pantallas pequeñas */}
      <Drawer
        title="Menú"
        placement="left"
        closable
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={200}
      >
        <Menu theme="light" mode="vertical" selectedKeys={[selectedKey]}>
          <Menu.Item
            key="home"
            icon={<HomeOutlined />}
            onClick={() => handleMenuClick("")}
          >
            Inicio
          </Menu.Item>
          <Menu.Item
            key="products"
            icon={<AppstoreOutlined />}
            onClick={() => handleMenuClick("products")}
          >
            Productos
          </Menu.Item>

          {isLoggedIn ? (
            <>
              {isAdmin && (
                <Menu.Item
                  key="createproduct"
                  icon={<PlusOutlined />}
                  onClick={() => handleMenuClick("createproduct")}
                >
                  Agregar Productos
                </Menu.Item>
              )}
              <Menu.Item
                key="profile"
                icon={<UserOutlined />}
                onClick={() => handleMenuClick("profile")}
              >
                {loginData.user.user_name}
              </Menu.Item>
              <Menu.Item
                key="logout"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                Cerrar Sesión
              </Menu.Item>
            </>
          ) : (
            <>
              <Menu.Item
                key="login"
                onClick={() => handleMenuClick("login")}
              >
                Iniciar Sesión
              </Menu.Item>
              <Menu.Item
                key="register"
                onClick={() => handleMenuClick("register")}
              >
                Registrarse
              </Menu.Item>
            </>
          )}

          <Menu.Item
            key="app"
            icon={<AppstoreOutlined />}
            onClick={() => { setShowInstallPrompt(true); setForceShow(true) }}
          >
            App
          </Menu.Item>
        </Menu>
      </Drawer>
    </header>
  );
};

export default Header;