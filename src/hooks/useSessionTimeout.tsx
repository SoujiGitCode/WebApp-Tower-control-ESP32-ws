import { useEffect, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

// Claves para localStorage
const SESSION_START_KEY = 'session_start_time';
const SESSION_WARNING_SHOWN_KEY = 'session_warning_shown';

interface UseSessionTimeoutProps {
  isLoggedIn: boolean;
  logout: () => void;
  sessionDuration?: number; // en milisegundos
  warningTime?: number; // tiempo antes de expirar para mostrar advertencia (en milisegundos)
}

/**
 * Hook personalizado para manejar el timeout de sesión
 * - Usa polling (setInterval) para revisar el tiempo constantemente
 * - Persiste en localStorage para sobrevivir refreshes
 * - Controla el tiempo máximo de sesión
 * - Muestra advertencia antes de cerrar sesión
 * - Cierra sesión automáticamente al expirar
 */
export const useSessionTimeout = ({
  isLoggedIn,
  logout,
  sessionDuration = 30 * 60 * 1000, // 30 minutos por defecto
  warningTime = 2 * 60 * 1000, // 2 minutos antes por defecto
}: UseSessionTimeoutProps) => {
  const pollingIntervalRef = useRef<number | null>(null);
  const showedWarningRef = useRef(false);

  // Solo detiene el polling, NO limpia localStorage
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      window.clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Limpia TODO: polling + localStorage (solo en logout real)
  const clearSession = () => {
    stopPolling();
    showedWarningRef.current = false;
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(SESSION_WARNING_SHOWN_KEY);
    console.log('🧹 Sesión limpiada completamente');
  };

  const handleLogout = () => {
    console.log('⏰ Sesión expirada - cerrando sesión automáticamente');
    clearSession();
    logout();
    
    // Mostrar toast de sesión expirada
    toast.error('🔐 Tu sesión ha expirado. Redirigiendo al login...', {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
    });
    
    // Redirigir después de mostrar el toast
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  };

  const showWarning = () => {
    if (showedWarningRef.current) {
      return; // Ya se mostró
    }
    
    showedWarningRef.current = true;
    localStorage.setItem(SESSION_WARNING_SHOWN_KEY, 'true');
    console.log('⚠️ Mostrando advertencia de sesión próxima a expirar');
    
    const warningMinutes = Math.ceil(warningTime / 60000);
    
    toast.warning(
      `⚠️ Tu sesión expirará en ${warningMinutes} minuto${warningMinutes > 1 ? 's' : ''}. Se cerrará automáticamente.`,
      {
        position: "top-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: false,
        className: 'session-warning-toast',
        bodyClassName: 'session-warning-toast-body',
        progressClassName: 'session-warning-toast-progress',
      }
    );
  };

  const checkSessionStatus = () => {
    const savedSessionStart = localStorage.getItem(SESSION_START_KEY);
    
    if (!savedSessionStart) {
      console.log('🔍 No hay sesión guardada');
      return;
    }

    const sessionStart = parseInt(savedSessionStart, 10);
    const timeElapsed = Date.now() - sessionStart;
    const timeRemaining = sessionDuration - timeElapsed;

    console.log(`� Check: Transcurrido ${Math.floor(timeElapsed / 1000)}s, Restante ${Math.floor(timeRemaining / 1000)}s`);

    // Verificar si la sesión ya expiró
    if (timeElapsed >= sessionDuration) {
      console.log('⏰ Sesión expirada - ejecutando logout');
      handleLogout();
      return;
    }

    // Verificar si debe mostrar advertencia
    const timeUntilWarning = sessionDuration - warningTime - timeElapsed;
    if (timeUntilWarning <= 0 && !showedWarningRef.current) {
      console.log('⚠️ Tiempo de mostrar advertencia');
      
      // Verificar si ya se mostró en una sesión anterior
      const savedWarningShown = localStorage.getItem(SESSION_WARNING_SHOWN_KEY);
      if (savedWarningShown !== 'true') {
        showWarning();
      } else {
        showedWarningRef.current = true;
      }
    }
  };

  const startSessionPolling = () => {
    console.log('🚀 startSessionPolling llamado - isLoggedIn:', isLoggedIn);
    console.log('📦 localStorage ANTES de stopPolling:', {
      session_start_time: localStorage.getItem(SESSION_START_KEY),
      session_warning_shown: localStorage.getItem(SESSION_WARNING_SHOWN_KEY)
    });
    
    stopPolling(); // Solo detiene el interval, NO borra localStorage

    console.log('📦 localStorage DESPUÉS de stopPolling:', {
      session_start_time: localStorage.getItem(SESSION_START_KEY),
      session_warning_shown: localStorage.getItem(SESSION_WARNING_SHOWN_KEY)
    });

    if (!isLoggedIn) {
      console.log('👤 Usuario no está logueado - abortando');
      return;
    }

    // Verificar si hay sesión guardada
    let savedSessionStart = localStorage.getItem(SESSION_START_KEY);
    console.log('💾 localStorage check:', savedSessionStart ? `Sesión existente (${savedSessionStart})` : 'Sin sesión guardada');
    
    if (!savedSessionStart) {
      console.log('⚠️ No hay session_start_time en localStorage - esperando a que se cree en login');
      // No crear nueva sesión aquí - el login lo hará
      // Solo iniciar el polling para verificar cuando aparezca
    } else {
      // Sesión existente - verificar si ya expiró
      const sessionStart = parseInt(savedSessionStart, 10);
      const timeElapsed = Date.now() - sessionStart;
      
      console.log(`🔄 Sesión existente detectada. Tiempo transcurrido: ${Math.floor(timeElapsed / 1000)}s`);
      
      if (timeElapsed >= sessionDuration) {
        console.log('⏰ La sesión ya expiró');
        handleLogout();
        return;
      }

      // Restaurar estado de warning si se mostró
      const savedWarningShown = localStorage.getItem(SESSION_WARNING_SHOWN_KEY);
      if (savedWarningShown === 'true') {
        showedWarningRef.current = true;
        console.log('ℹ️ Advertencia ya fue mostrada anteriormente');
      }
    }

    // Hacer check inmediato
    checkSessionStatus();

    // Iniciar polling cada 1 segundo
    pollingIntervalRef.current = window.setInterval(() => {
      checkSessionStatus();
    }, 1000); // Check cada segundo para mayor precisión

    console.log('✅ Polling de sesión iniciado (cada 1 segundo)');
  };

  // Iniciar polling cuando el usuario se loguea
  useEffect(() => {
    if (isLoggedIn) {
      startSessionPolling();
    } else {
      clearSession(); // Usuario hizo logout → limpiar TODO
    }

    // Cleanup solo detiene el interval, NO limpia localStorage
    return () => {
      stopPolling();
    };
  }, [isLoggedIn]);

  return {
    clearSession,
  };
};

export default useSessionTimeout;
