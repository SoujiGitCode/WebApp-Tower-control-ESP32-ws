# 🔐 Persistencia de Sesión - Documentación

## ✅ Cambios Implementados

### 1. 🎨 Color del Toast Cambiado

**Antes:** Naranja horrible 🟠
```css
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%)
border-bottom: 3px solid #b45309
```

**Ahora:** Rojo elegante 🔴
```css
background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%)
border-bottom: 3px solid #991b1b
```

### 2. 💾 Persistencia de Sesión en localStorage

#### Datos Guardados:
1. **`session_start_time`**: Timestamp del inicio de sesión
2. **`session_warning_shown`**: Si ya se mostró la advertencia

#### Comportamiento:

##### Escenario 1: Primera vez (Login)
```javascript
Login → session_start_time = Date.now()
      → Inicia timer de 2 minutos
```

##### Escenario 2: Usuario refresca la página
```javascript
Refresh → Lee session_start_time del localStorage
        → Calcula tiempo transcurrido
        → Ajusta timers según tiempo restante
        → Restaura estado de advertencia si ya se mostró
```

##### Escenario 3: Sesión expirada antes del refresh
```javascript
Refresh → timeElapsed >= sessionDuration
        → Logout inmediato
        → Redirección a /login
```

---

## 🧪 Casos de Uso

### Caso 1: Usuario normal (no refresca)
```
0:00 Login
1:00 Toast rojo: "Expirará en 1 minuto"
2:00 Toast error + Logout
```

### Caso 2: Usuario refresca a los 0:30
```
0:00 Login
0:30 REFRESH → Detecta 30s transcurridos
     → Quedan 1:30 de sesión
     → Timer ajustado a 1:30
1:30 Toast: "Expirará en 1 minuto" (30s después del refresh)
2:00 Logout
```

### Caso 3: Usuario refresca a 1:30 (después de ver warning)
```
0:00 Login
1:00 Toast: "Expirará en 1 minuto"
1:30 REFRESH → Detecta 1:30 transcurridos
     → warning_shown = true (no muestra de nuevo)
     → Quedan 0:30 de sesión
     → Timer ajustado a 0:30
2:00 Logout
```

### Caso 4: Usuario refresca después de 2:00 (sesión expirada)
```
0:00 Login
2:00 Usuario no estaba en la app
2:30 REFRESH → Detecta 2:30 transcurridos (> 2:00)
     → Logout inmediato
     → Toast error
     → Redirección a /login
```

---

## 📊 Logs en Consola

### Primera sesión:
```
⏱️ Iniciando nueva sesión: 2 minutos
⏱️ Tiempo restante de sesión: 2 min 0s
⚠️ Advertencia se mostrará en: 1 min 0s
```

### Sesión restaurada (refresh a 0:45):
```
🔄 Sesión existente detectada. Tiempo transcurrido: 45s
⏱️ Tiempo restante de sesión: 1 min 15s
⚠️ Advertencia se mostrará en: 0 min 15s
```

### Sesión expirada (refresh después de 2:00):
```
🔄 Sesión existente detectada. Tiempo transcurrido: 135s
⏰ La sesión ya expiró antes del refresh
⏰ Sesión expirada - cerrando sesión automáticamente
```

---

## 🔑 localStorage Keys

```javascript
// Timestamp de inicio de sesión (milisegundos)
session_start_time: "1729368000000"

// Si ya se mostró la advertencia
session_warning_shown: "true" | null
```

---

## 🎯 Ventajas de la Implementación

✅ **Persistencia**: El usuario no pierde su sesión al refrescar  
✅ **Precisión**: Calcula exactamente el tiempo transcurrido  
✅ **Inteligente**: No muestra la advertencia múltiples veces  
✅ **Seguro**: Expira correctamente incluso si el usuario está fuera  
✅ **Limpio**: Limpia localStorage al hacer logout o al expirar  

---

## 🚀 Producción (30 minutos)

Para configurar 30 minutos en producción:

```typescript
// src/context/AppContext.tsx
useSessionTimeout({
  isLoggedIn: loggedIn,
  logout: logout,
  sessionDuration: 30 * 60 * 1000, // 30 minutos
  warningTime: 1 * 60 * 1000,      // Warning 1 minuto antes
});
```

**Comportamiento:**
```
0:00 Login
29:00 Toast rojo: "Expirará en 1 minuto"
30:00 Logout
```

Si el usuario refresca a los 15 minutos:
```
15:00 REFRESH → Detecta 15 min transcurridos
      → Quedan 15 min de sesión
      → Warning se mostrará en 14 min
29:00 Toast warning
30:00 Logout
```

---

## 🎨 Colores del Toast

### Warning (1 minuto antes):
- **Fondo**: Degradado rojo (#ef4444 → #dc2626)
- **Borde inferior**: Rojo oscuro (#991b1b)
- **Texto**: Blanco
- **Icono**: ⚠️

### Error (sesión expirada):
- **Fondo**: Rojo de error (toast.error nativo)
- **Texto**: Blanco
- **Icono**: 🔐

---

¡Sistema de persistencia completamente funcional! 🎉
