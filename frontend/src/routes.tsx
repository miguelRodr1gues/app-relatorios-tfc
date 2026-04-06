// src/router.jsx
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./pages/Relatorios";
import Estrutura from "./pages/Estrutura";
import Analises from "./pages/Analises";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

// Bloqueia rotas privadas
function RequireAuth() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Redireciona "/" para login ou dashboard
function IndexRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

function RedirectIfAuthenticated({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

export const router = createBrowserRouter([
  // Entrada da app
  { path: "/", element: <IndexRedirect /> },

  // Rotas públicas
  { path: "/login", element: (
      <RedirectIfAuthenticated>
        <Login />
      </RedirectIfAuthenticated>
    )
  },

  // Rotas privadas
  {
    element: <RequireAuth />, // todas dentro precisam de login
    children: [
      {
        Component: Layout, // Layout comum
        children: [
          { path: "/dashboard", Component: Dashboard },
          { path: "/relatorios", Component: Relatorios },
          { path: "/estrutura", Component: Estrutura },
          { path: "/analises", Component: Analises },
          { path: "/settings", Component: Settings },
        ],
      },
    ],
  },

  // 404 → deixa o IndexRedirect decidir
  { path: "*", element: <Navigate to="/" replace /> },
]);