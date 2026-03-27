import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AUTH_ROLES } from "@/constants/auth";

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

function getRedirectByRole(roles: string[]): string {
  if (roles.includes(AUTH_ROLES.ADMIN)) {
    return "/assets";
  }
  if (roles.includes(AUTH_ROLES.HR)) {
    return "/assets";
  }
  if (roles.includes(AUTH_ROLES.MANAGER)) {
    return "/members";
  }
  return "/employee";
}

export function ProtectedRoute({
  allowedRoles,
}: Readonly<ProtectedRouteProps>) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{"Đang xác thực..."}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user) {
    const hasRole = allowedRoles.some(
      (role) =>
        user.roles.includes(role) || user.roles.includes(`ROLE_${role}`),
    );

    if (!hasRole) {
      return <Navigate to={getRedirectByRole(user.roles)} replace />;
    }
  }

  return <Outlet />;
}
