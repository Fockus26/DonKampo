import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'css/index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      console.log("[SW] Registrado:", registration);

      // Escucha si hay una nueva versión del SW
      registration.onupdatefound = () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.onstatechange = () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Nueva versión detectada
              const shouldUpdate = window.confirm("¡Hay una nueva versión disponible! ¿Deseas actualizar?");
              if (shouldUpdate) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            }
          };
        }
      };
    });

    // Recarga cuando el nuevo SW toma control
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });
}
