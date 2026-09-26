import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import type { AuthRole } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactElement;
  requiredRole?: AuthRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, hasRole } = useAuth();
  const location = useLocation();

  // Still loading Firebase auth state — show nothing (avoids flash)
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-terminal-bg">
        <div className="rounded-2xl border border-terminal-border/80 bg-terminal-panel px-6 py-4 text-xs font-medium text-terminal-muted shadow-sm">
          Platform hazırlanıyor...
        </div>
      </div>
    );
  }

  // Not logged in — redirect to /login, preserving the intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/home" replace state={{ authDenied: requiredRole }} />;
  }

  return children;
}
