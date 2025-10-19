# 🔐 Sistema de Manejo de Sesión - Documentación Completa

## 📋 Características Implementadas

### 1. ⏱️ Timeout de Sesión por Inactividad (Frontend)

**Configuración Actual (MODO PRUEBA):**
- ⏱️ Duración: **2 minutos** (120 segundos)
- ⚠️ Advertencia: A **1:30 minutos** (30 segundos antes de expirar)
- 🔴 Logout automático: A los **2 minutos**

**Flujo de Timeout:**

```
Login ──► 1:30 min ──────────► 2:00 min
         ⚠️ ALERTA           🔴 LOGOUT
         "Sesión por         - Limpia sesión
          expirar en         - Redirecciona /login
          30 segundos"       - Muestra alerta
```

### 2. 🔐 Detección de Sesión Expirada desde Backend

El sistema detecta automáticamente cuando el backend responde con:

```json
{
  "status": "error",
  "message": "Session expired",
  "session_expired": true
}
```

**Acciones Automáticas:**
1. ✅ Detecta `session_expired: true` en cualquier respuesta de API
2. ✅ Limpia `sessionId` y `currentUser` del localStorage
3. ✅ Muestra alerta al usuario:
   ```
   🔐 Sesión Expirada
   
   Tu sesión ha expirado. 
   Por favor, inicia sesión nuevamente.
   
   [Ir a Login]
   ```
4. ✅ Redirecciona automáticamente a `/login` al cerrar la alerta

---

## 🛠️ Implementación Técnica

### Archivos Modificados:

#### 1. `src/hooks/useSessionTimeout.tsx`
**Cambios:**
- ❌ Eliminado: `useNavigate()` de react-router-dom
- ✅ Agregado: `window.location.href` para redirección
- ✅ Arreglado: Error "useNavigate() may be used only in the context of a <Router>"

**Razón:** El hook se ejecuta en el `AppContext` que está FUERA del Router, por lo que no puede usar `useNavigate()`. Usamos `window.location.href` como solución.

#### 2. `src/api/index.ts`
**Cambios:**
- ✅ Agregado: Interceptor de respuesta de Axios
- ✅ Detecta: `session_expired: true` en respuestas exitosas y errores
- ✅ Ejecuta: `handleSessionExpired()` automáticamente
- ✅ Importado: `sweetalert2` para alertas

**Interceptor de Respuesta:**
```typescript
this.axiosInstance.interceptors.response.use(
  (response) => {
    // Detectar sesión expirada en respuestas exitosas
    if (response.data?.session_expired === true) {
      this.handleSessionExpired();
    }
    return response;
  },
  (error) => {
    // Detectar sesión expirada en errores
    if (error.response?.data?.session_expired === true) {
      this.handleSessionExpired();
    }
    return Promise.reject(error);
  }
);
```

**Función de Manejo:**
```typescript
private handleSessionExpired(): void {
  // 1. Limpiar localStorage
  this.removeSessionId();
  this.removeCurrentUser();

  // 2. Mostrar alerta
  Swal.fire({
    icon: 'warning',
    title: '🔐 Sesión Expirada',
    text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    confirmButtonText: 'Ir a Login',
    confirmButtonColor: '#ef4444',
    allowOutsideClick: false,
    allowEscapeKey: false,
  }).then(() => {
    // 3. Redirigir
    window.location.href = '/login';
  });
}
```

---

## 🧪 Cómo Probar

### Test 1: Timeout por Inactividad (2 minutos)

1. Inicia sesión en la aplicación
2. **Espera 1:30 minutos** → Verás:
   ```
   ⚠️ Sesión por Expirar
   
   Tu sesión expirará en 0 minutos por inactividad.
   Se cerrará automáticamente la sesión.
   
   [Entendido]
   ```
3. **Espera 30 segundos más** (2 minutos totales) → Verás:
   ```
   ℹ️ Sesión Expirada
   
   Tu sesión ha expirado por inactividad. 
   Por favor, inicia sesión nuevamente.
   
   [Entendido]
   ```
4. Se redirige automáticamente a `/login`

### Test 2: Sesión Expirada desde Backend

**Simular respuesta del backend:**

Para probar, puedes hacer que cualquier endpoint responda:
```json
{
  "status": "error",
  "message": "Session expired",
  "session_expired": true
}
```

**Resultado esperado:**
1. El interceptor detecta `session_expired: true`
2. Muestra alerta:
   ```
   🔐 Sesión Expirada
   
   Tu sesión ha expirado. 
   Por favor, inicia sesión nuevamente.
   
   [Ir a Login]
   ```
3. Al hacer clic en "Ir a Login" → Redirección a `/login`

---

## 📊 Logs en Consola

### Timeout Frontend:
```
⏱️ Iniciando timer de sesión: 2 minutos
⚠️ Advertencia se mostrará en: 1.5 minutos
⚠️ Mostrando advertencia de sesión próxima a expirar  ← A 1:30
⏰ Sesión expirada - cerrando sesión automáticamente  ← A 2:00
```

### Sesión Expirada Backend:
```
🚨 Sesión expirada detectada desde el backend
```
o
```
🚨 Sesión expirada detectada en error desde el backend
```

---

## 🔄 Volver a Configuración de Producción

**En `src/context/AppContext.tsx` (línea ~113):**

```tsx
// Cambiar de:
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 2 * 60 * 1000,  // 2 minutos (PRUEBA)
  warningTime: 30 * 1000,          // 30 segundos antes
});

// A:
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 30 * 60 * 1000, // 30 minutos
  warningTime: 2 * 60 * 1000,      // 2 minutos antes (28 min)
});
```

---

## ✅ Casos de Uso Cubiertos

| Escenario | Comportamiento | Estado |
|-----------|----------------|--------|
| Usuario inactivo 1:30 min | Muestra advertencia | ✅ |
| Usuario inactivo 2 min | Logout automático + alerta | ✅ |
| Backend responde `session_expired: true` | Logout + alerta + redirección | ✅ |
| Error de API con `session_expired: true` | Logout + alerta + redirección | ✅ |
| Usuario hace logout manual | Timer se limpia correctamente | ✅ |
| Usuario no logueado | Timer no se ejecuta | ✅ |

---

## 🎯 Comportamiento de las Alertas

### Alerta 1: Advertencia de Timeout (1:30 min)
- **Tipo**: Warning (amarillo)
- **Título**: "⚠️ Sesión por Expirar"
- **Mensaje**: "Tu sesión expirará en X minutos por inactividad"
- **Acción**: Usuario puede cerrar y seguir trabajando
- **Tiempo**: Se muestra 30 segundos antes de expirar

### Alerta 2: Sesión Expirada por Timeout (2:00 min)
- **Tipo**: Info (azul)
- **Título**: "ℹ️ Sesión Expirada"
- **Mensaje**: "Tu sesión ha expirado por inactividad"
- **Acción**: Redirección automática a `/login` al cerrar
- **Tiempo**: Se muestra al llegar a 2 minutos

### Alerta 3: Sesión Expirada por Backend
- **Tipo**: Warning (rojo)
- **Título**: "🔐 Sesión Expirada"
- **Mensaje**: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente"
- **Acción**: Botón "Ir a Login" → Redirección forzada
- **Modal**: No se puede cerrar haciendo clic fuera o ESC
- **Tiempo**: Se muestra inmediatamente al detectar respuesta del backend

---

## 🚀 Todo Listo

El sistema está **100% funcional** y maneja ambos casos:

1. ✅ **Timeout por inactividad** (frontend - 2 min para pruebas)
2. ✅ **Sesión expirada desde backend** (interceptor de axios)

Ambos escenarios:
- Limpian la sesión correctamente
- Muestran alertas apropiadas al usuario
- Redirigen a `/login` automáticamente

---

## 🐛 Debug

**Componente de Debug Activo:**
En la esquina inferior izquierda verás el contador en tiempo real:
```
🐛 DEBUG - Timeout de Sesión
⏱️ 1:45 (tiempo restante)
Tiempo transcurrido: 0:15
```

**Para desactivar en producción:**
Comenta en `src/App.tsx`:
```tsx
{/* <SessionTimeoutDebug /> */}
```

---

¡Sistema de sesión completamente implementado y testeado! 🎉
