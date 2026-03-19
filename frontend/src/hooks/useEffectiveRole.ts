import { useAuth } from "@/contexts/AuthContext"

export type EffectiveRole = "admin" | "hr" | "manager" | "employee"

/**
 * Resolves the effective sidebar/permission role for the current user.
 * If `sidebarRole` is explicitly provided (from route), it takes priority.
 * Otherwise, derives from the user's roles in AuthContext.
 */
export function useEffectiveRole(
    sidebarRole?: EffectiveRole
): EffectiveRole {
    const { user } = useAuth()

    if (sidebarRole) return sidebarRole

    if (user?.roles.includes("ROLE_ADMIN")) return "admin"
    if (user?.roles.includes("ROLE_HR")) return "hr"
    if (user?.roles.includes("ROLE_MANAGER")) return "manager"
    return "employee"
}
