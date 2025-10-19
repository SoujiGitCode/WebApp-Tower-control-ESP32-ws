// 🧪 TEST RÁPIDO - Solo para desarrollo
// Reemplaza temporalmente el useSessionTimeout en AppContext.tsx con estos valores

useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 15 * 1000, // 15 segundos total
  warningTime: 5 * 1000,      // Alerta a los 10 segundos (5 seg antes)
});

// FLUJO DE PRUEBA:
// 1. Inicia sesión
// 2. Espera 10 segundos → Verás SweetAlert de advertencia ⚠️
// 3. Espera 5 segundos más → Logout automático + redirección 🔴

// Para volver a producción:
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 30 * 60 * 1000, // 30 minutos
  warningTime: 2 * 60 * 1000,      // Alerta a los 28 minutos
});
