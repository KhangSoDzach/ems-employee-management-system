import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
    allowedRoles?: string[];
}

/**
 * Wraps protected routes.
 * - While session is being rehydrated (isLoading): show spinner
 * - If not authenticated: redirect to /login
 * - If role-based access is required: check if user has the role
 * - Otherwise: render child routes via <Outlet />
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Đang xác thực...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Role-based check
    if (allowedRoles && user) {
        // user.roles usually starts with ROLE_ from Spring Security
        const hasRole = allowedRoles.some(role => 
            user.roles.includes(role) || user.roles.includes(`ROLE_${role}`)
        );
        
        if (!hasRole) {
            // Redirect to a forbidden/dashboard page if unauthorized
            return <Navigate to="/employee" replace />; 
        }
    }

    return <Outlet />;
}
