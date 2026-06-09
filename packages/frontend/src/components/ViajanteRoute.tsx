import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import type { ReactNode } from "react";

export function ViajanteRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isViajante, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isViajante) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
