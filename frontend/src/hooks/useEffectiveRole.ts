import { useAuth } from "@/contexts/AuthContext";
import { AUTH_ROLES } from "@/constants/auth";

export type EffectiveRole = "admin" | "hr" | "manager" | "employee";

/**
 * Resolves the effective sidebar/permission role for the current user.
 * If `sidebarRole` is explicitly provided (from route), it takes priority.
 * Otherwise, derives from the user's roles in AuthContext.
 */
export function useEffectiveRole(sidebarRole?: EffectiveRole): EffectiveRole {
  const { user } = useAuth();

  if (sidebarRole) {
    return sidebarRole;
  }

  const roles = user?.roles || [];

  if (roles.includes(AUTH_ROLES.ADMIN)) {
    return "admin";
  }
  if (roles.includes(AUTH_ROLES.HR)) {
    return "hr";
  }
  if (roles.includes(AUTH_ROLES.MANAGER)) {
    return "manager";
  }

  return "employee";
}
