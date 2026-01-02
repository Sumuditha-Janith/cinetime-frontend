import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContext";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export default function ProtectedRoute({
  children,
  roles
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.some((role) => user.roles?.includes(role))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h2 className="text-2xl font-bold mb-4">⛔ Access Denied</h2>
        <p>You don't have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}