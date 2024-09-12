import './index.css'
import App from './App.tsx'
import { createRoot } from 'react-dom/client'
import { AppProvider } from '@context/AppContext';  // Asegúrate de que la ruta es correcta

createRoot(document.getElementById('root')!).render(
  <AppProvider>
    <App />
  </AppProvider>
)