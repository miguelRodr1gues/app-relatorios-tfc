import { createBrowserRouter, Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./context/AuthContext";

import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Relatorios from "./pages/Relatorios";
import Estrutura from "./pages/Estrutura";
import Analises from "./pages/Analises";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyCode from "./pages/VerifyCode";

function AuthGate({
                      children,
                      requireAuth,
                  }: {
    children: ReactNode;
    requireAuth: boolean;
}) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) return null;

    if (requireAuth && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!requireAuth && isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Navigate to="/dashboard" replace />,
    },

    {
        path: "/login",
        element: (
            <AuthGate requireAuth={false}>
                <Login />
            </AuthGate>
        ),
    },

    {
        path: "/register",
        element: (
            <AuthGate requireAuth={false}>
                <Register />
            </AuthGate>
        ),
    },

    {
        path: "/verify-code",
        element: (
            <AuthGate requireAuth={false}>
                <VerifyCode />
            </AuthGate>
        ),
    },

    {
        element: (
            <AuthGate requireAuth={true}>
                <Layout />
            </AuthGate>
        ),
        children: [
            { path: "/dashboard", element: <Dashboard /> },
            { path: "/relatorios", element: <Relatorios /> },
            { path: "/estrutura", element: <Estrutura /> },
            { path: "/analises", element: <Analises /> },
            { path: "/settings", element: <Settings /> },
        ],
    },

    { path: "*", element: <Navigate to="/" replace /> },
]);