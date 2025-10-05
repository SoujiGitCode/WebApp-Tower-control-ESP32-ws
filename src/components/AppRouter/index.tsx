import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import LoginPage from "../../views/LoginPage";
import Dashboard from "../../views/Dashboard";
import RealTimeData from "../../views/RealTimeData";
import AdminPanel from "../../views/AdminPanel";

// Componente para proteger rutas que requieren autenticación
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { loggedIn } = useAppContext();

  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Componente para redireccionar si ya está logueado
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { loggedIn } = useAppContext();

  if (loggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Wrapper component para manejar la ruta raíz
const RootRoute = () => {
  const { loggedIn } = useAppContext();
  return <Navigate to={loggedIn ? "/dashboard" : "/login"} replace />;
};

// Wrapper component para manejar la catch-all route
const CatchAllRoute = () => {
  const { loggedIn } = useAppContext();
  return <Navigate to={loggedIn ? "/dashboard" : "/login"} replace />;
};

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Ruta de login - solo accesible si no está logueado */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        {/* Ruta raíz - redirige según estado de autenticación */}
        <Route path="/" element={<RootRoute />} />

        {/* Ruta específica del dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Ruta de datos en tiempo real con parámetro deviceId */}
        <Route
          path="/real-time-data/:deviceId"
          element={
            <ProtectedRoute>
              <RealTimeData />
            </ProtectedRoute>
          }
        />

        {/* Ruta del panel de administración */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        {/* Ruta catch-all - redirecciona a dashboard si está logueado, sino a login */}
        <Route path="*" element={<CatchAllRoute />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
