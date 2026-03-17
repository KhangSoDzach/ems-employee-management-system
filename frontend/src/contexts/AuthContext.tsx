import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import api from "@/lib/axios";

// ─── Types ─────────────────────────────────────────────────────────────────

type ApiResponse<T> = { status: string; message: string; data: T };

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roles: string[];
}

export interface LoginResult {
  user: UserInfo | null;
  twoFactorRequired: boolean;
}

interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    username: string,
    password: string,
    twoFactorCode?: string,
  ) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch current user from /auth/me.
   * Called on mount (session rehydration) and after login.
   */
  const fetchCurrentUser = useCallback(async (): Promise<UserInfo | null> => {
    try {
      // api interceptor returns response.data (already unwrapped by axios.ts)
      // BE response: { status, message, data: UserInfo }
      const res = (await api.get(
        "/auth/me",
      )) as unknown as ApiResponse<UserInfo>;
      return res.data;
    } catch {
      return null;
    }
  }, []);

  /** Try to rehydrate session from existing tokens on app load */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchCurrentUser()
      .then((userInfo) => setUser(userInfo))
      .finally(() => setIsLoading(false));
  }, [fetchCurrentUser]);

  /**
   * Login: POST /auth/login → save tokens → fetch user profile.
   * Throws on failure so callers can handle the error message.
   */
  const login = useCallback(
    async (
      username: string,
      password: string,
      twoFactorCode?: string,
    ): Promise<LoginResult> => {
      // BE response (already unwrapped by interceptor): { status, message, data: AuthResponse }
      const res = (await api.post("/auth/login", {
        username,
        password,
        twoFactorCode,
      })) as unknown as ApiResponse<{
        twoFactorRequired?: boolean;
        accessToken?: string;
        refreshToken?: string;
      }>;
      const { twoFactorRequired, accessToken, refreshToken } = res.data;

      if (twoFactorRequired) {
        return {
          user: null,
          twoFactorRequired: true,
        };
      }

      if (!accessToken) {
        throw new Error("No access token in response");
      }

      if (!refreshToken) {
        throw new Error("No refresh token in response");
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);

      const userInfo = await fetchCurrentUser();
      if (!userInfo) {
        throw new Error("Failed to fetch user info after login");
      }
      setUser(userInfo);
      return {
        user: userInfo,
        twoFactorRequired: false,
      };
    },
    [fetchCurrentUser],
  );

  /**
   * Logout: POST /auth/logout → clear tokens → reset state.
   */
  const logout = useCallback(async (): Promise<void> => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // Best-effort – always clear local state even if the server call fails
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

/** Must be used inside <AuthProvider> */
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
