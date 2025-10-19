# 🧪 Testing Session Timeout

## ⏱️ Sistema de Timeout de Sesión Implementado

El sistema de timeout de sesión está completamente implementado y funcionando con las siguientes características:

### ✅ Características Implementadas:

1. **Duración de sesión**: 30 minutos (1800 segundos)
2. **Advertencia**: A los 28 minutos (2 minutos antes de expirar)
3. **Cierre automático**: A los 30 minutos exactos
4. **Alertas visuales**: Usando SweetAlert2

### 📋 Comportamiento del Sistema:

#### 🟢 Estado Normal (0-28 minutos)
- La sesión funciona normalmente
- No hay notificaciones
- El usuario puede usar la aplicación sin interrupciones

#### 🟡 Estado de Advertencia (28-30 minutos)
- Aparece un **SweetAlert** con:
  - Icono: ⚠️ Warning
  - Título: "⚠️ Sesión por Expirar"
  - Mensaje: "Tu sesión expirará en 2 minutos por inactividad"
  - Botón: "Entendido" (color amarillo)

#### 🔴 Sesión Expirada (30 minutos)
- **Cierre automático de sesión**
- Limpieza de localStorage (sessionId, currentUser)
- Redirección automática a `/login`
- Aparece un **SweetAlert** con:
  - Icono: ℹ️ Info
  - Título: "Sesión Expirada"
  - Mensaje: "Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente."
  - Botón: "Entendido" (color azul)

---

## 🧪 Cómo Testear

### Opción 1: Test Completo (30 minutos reales)
1. Inicia sesión en la aplicación
2. Espera 28 minutos → Verás la alerta de advertencia
3. Espera 2 minutos más → Se cerrará automáticamente la sesión

### Opción 2: Test Rápido (Para Desarrollo)

Si quieres probar más rápido, edita temporalmente los tiempos en `src/context/AppContext.tsx`:

```tsx
// Cambiar estas líneas (línea ~122):
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 2 * 60 * 1000, // 2 minutos para pruebas rápidas
  warningTime: 30 * 1000, // Advertencia 30 segundos antes
});
```

Con estos valores:
- **Sesión total**: 2 minutos
- **Advertencia**: A 1:30 minutos (30 segundos antes de expirar)
- **Cierre**: A los 2 minutos

### Opción 3: Test Ultra-Rápido (15 segundos)

```tsx
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 15 * 1000, // 15 segundos
  warningTime: 5 * 1000, // Advertencia 5 segundos antes (a los 10 seg)
});
```

---

## 📊 Componente de Debug

Incluido un componente `<SessionTimeoutDebug />` que muestra en la esquina inferior izquierda:

- ⏱️ Contador en tiempo real del tiempo restante
- 🟢 Estado normal (verde)
- 🟡 Estado de advertencia (amarillo, 28-30 min)
- 🔴 Estado expirado (rojo)
- Tiempo transcurrido desde el login

**IMPORTANTE**: Este componente es solo para desarrollo. Para producción:
1. Comenta la línea en `src/App.tsx`:
   ```tsx
   {/* <SessionTimeoutDebug /> */}
   ```
2. O elimínala completamente

---

## 🔧 Archivos Modificados/Creados

### Nuevos Archivos:
1. `src/hooks/useSessionTimeout.tsx` - Hook personalizado para timeout
2. `src/components/SessionTimeoutDebug/index.tsx` - Componente de debug
3. `TESTING_SESSION_TIMEOUT.md` - Esta guía

### Archivos Modificados:
1. `src/context/AppContext.tsx` - Integración del hook de timeout
2. `src/App.tsx` - Importación del componente de debug

---

## 🎯 Casos de Uso Cubiertos

✅ Usuario se loguea → Timer inicia automáticamente  
✅ Usuario llega a 28 minutos → Alerta de advertencia  
✅ Usuario llega a 30 minutos → Logout automático + redirección  
✅ Usuario hace logout manual → Timer se limpia correctamente  
✅ Usuario no está logueado → Timer no se ejecuta  

---

## 🔄 Funcionalidad Opcional (Comentada)

En el hook `useSessionTimeout.tsx` hay código comentado para **resetear el timer con actividad del usuario**.

Si quieres que la sesión se **extienda automáticamente** cuando el usuario interactúa (mouse, teclado, scroll):

1. Abre `src/hooks/useSessionTimeout.tsx`
2. Descomenta el segundo `useEffect` (líneas ~92-118)

Esto hará que cada minuto de actividad resetee el contador.

---

## 🚀 Listo para Producción

El sistema está **100% funcional** y listo para producción con los valores configurados:

- ✅ 30 minutos de sesión total
- ✅ Advertencia a los 28 minutos
- ✅ Cierre automático a los 30 minutos
- ✅ Alertas visuales profesionales
- ✅ Limpieza completa de sesión
- ✅ Redirección automática a login

---

## 📝 Notas Adicionales

### Configuración Personalizada

Puedes ajustar los tiempos fácilmente en `AppContext.tsx`:

```tsx
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 45 * 60 * 1000, // 45 minutos
  warningTime: 5 * 60 * 1000,      // Advertir 5 minutos antes
});
```

### Logs en Consola

El sistema imprime logs útiles en la consola:
- `⏱️ Iniciando timer de sesión: X minutos`
- `⚠️ Advertencia se mostrará en: X minutos`
- `⚠️ Mostrando advertencia de sesión próxima a expirar`
- `⏰ Sesión expirada - cerrando sesión automáticamente`
- `🔄 Reiniciando timer de sesión por actividad del usuario` (si está habilitado)

---

¡Todo listo para usar! 🎉
