// src/constants/auth.ts

/**
 * System-level roles used for backend authentication and frontend permissions.
 * These must match the roles returned by the BE (e.g., via AuthContext).
 */
export const AUTH_ROLES = {
    ADMIN: "ROLE_ADMIN",
    HR: "ROLE_HR",
    MANAGER: "ROLE_MANAGER",
    EMPLOYEE: "ROLE_EMPLOYEE",
} as const;

export type AuthRole = typeof AUTH_ROLES[keyof typeof AUTH_ROLES];
