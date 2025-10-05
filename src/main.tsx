import './index.css'
import App from './App.tsx'
import { createRoot } from 'react-dom/client'
import { AppProvider } from '@context/AppContext';
import { setAppConfig } from './config/appConfig';

// ⚙️ CONFIGURACIÓN DE APLICACIÓN
// Puedes modificar estas variables para configurar las IPs y el modo de la aplicación
const APP_SETTINGS = {
  // Modo de desarrollo: true = MockAPI, false = ESP32 real
  developmentMode: false, // 🔧 Cambia a true para usar MockAPI
  
  // IPs para producción y desarrollo
  productionIP: "192.168.4.1",  // 🔧 IP del ESP32 en producción
  developmentIP: "192.168.50.22",   // 🔧 IP del ESP32 en desarrollo (hotspot)
};

// Aplicar configuración antes de renderizar
setAppConfig({
  defaultMode: APP_SETTINGS.developmentMode ? 'development' : 'production',
  production: {
    esp32IP: APP_SETTINGS.productionIP,
  },
  development: {
    esp32IP: APP_SETTINGS.developmentIP,
  },
});

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>
)