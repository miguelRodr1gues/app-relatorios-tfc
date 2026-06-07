import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

type AuthGateProps = {
  children: ReactNode;
  requireAuth: boolean;
};

export default function AuthGate({ children, requireAuth }: AuthGateProps) {
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
