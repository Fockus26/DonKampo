import React, { useEffect, useState } from "react";
import "css/InstallPrompt.css";
import "font-awesome/css/font-awesome.min.css";

const InstallPrompt = ({ showInstallPrompt, setShowInstallPrompt }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  
  
  useEffect(() => {
    // Verificar si la app está instalada (funciona dentro del PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;  
    if (isStandalone !== undefined) setIsInstalled(isStandalone);

    // Escuchar cambios en el display-mode
    window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
      setIsInstalled(e.matches);
    });

    setIsInstalled(true)
    // Capturar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      setIsInstalled(false)
      e.preventDefault();
      setDeferredPrompt(e);
    };


    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  if (!showInstallPrompt) return

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <i className="fa-solid fa-xmark close" onClick={() => setShowInstallPrompt(false)} />

        <h2>{!isInstalled ? "¿Quieres instalar esta aplicación?" : "Ya tienes esta app instalada"}</h2>
        <p>
          {!isInstalled
            ? "¡Puedes instalar esta aplicación en tu dispositivo para un acceso más rápido y una experiencia más cómoda!"
            : "Parece que ya tienes esta aplicación instalada. Puedes abrirla desde tu lista de aplicaciones."
          }
        </p>

        <ul>
          {['android', 'apple', 'windows'].map((icon, index) => (
            <li key={index}><i className={`fa fa-${icon}`} /></li>
          ))}
        </ul>

        <div className="modal-actions">
          <button onClick={() => setShowInstallPrompt(false)}>Cerrar</button>
          {!isInstalled && <button onClick={handleInstall}>Instalar</button>}
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
