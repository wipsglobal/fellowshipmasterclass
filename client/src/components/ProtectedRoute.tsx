import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (adminOnly) {
        window.location.href = "/admin/login";
      } else {
        window.location.href = "/login";
      }
    } else if (!loading && adminOnly && user?.role !== "admin") {
      window.location.href = "/admin/login";
    }
  }, [loading, isAuthenticated, adminOnly, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== "admin") {
    return null;
  }

  return <>{children}</>;
}
