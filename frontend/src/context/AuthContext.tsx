import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiRequest,
  ApiError,
  type AuthTokens,
  type RequestOptions,
  type UserRole,
} from "@/lib/api";

interface AuthUser {
  first_name: any;
  last_name: any;
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: string;
  phone?: string;
  profile_picture?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  phone?: string;
  profile_picture?: string;
  first_name?: string;
  last_name?: string;
}

interface LoginResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

interface RegisterResponse {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: string;
}

interface StoredAuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  role: UserRole | null;
}

interface AuthContextValue extends StoredAuthState {
  isAuthenticated: boolean;
  login: (role: UserRole, payload: LoginPayload) => Promise<AuthUser>;
  register: (role: UserRole, payload: RegisterPayload) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  updateUser: (user: AuthUser) => void;
  clearSession: () => void;
  authorizedRequest: <T>(path: string, options?: RequestOptions) => Promise<T>;
}

const STORAGE_KEY = "stylegenie.auth";

const defaultStoredState: StoredAuthState = {
  user: null,
  tokens: null,
  role: null,
};

const getInitialState = (): StoredAuthState => {
  if (typeof window === "undefined") {
    return defaultStoredState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultStoredState;
    }
    const parsed = JSON.parse(raw) as StoredAuthState;
    return {
      user: parsed.user ?? null,
      tokens: parsed.tokens ?? null,
      role: parsed.role ?? null,
    };
  } catch {
    return defaultStoredState;
  }
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<StoredAuthState>(getInitialState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!state.tokens) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const clearSession = useCallback(() => {
    setState(defaultStoredState);
  }, []);

  const login = useCallback(
    async (role: UserRole, payload: LoginPayload) => {
      const response = await apiRequest<LoginResponse>(`/${role}/auth/login/`, {
        method: "POST",
        data: payload,
      });

      const normalizedRole = response.user.role || role;

      setState({
        user: response.user,
        tokens: response.tokens,
        role: normalizedRole,
      });

      return response.user;
    },
    []
  );

  const register = useCallback(
    async (role: UserRole, payload: RegisterPayload) => {
      const response = await apiRequest<RegisterResponse>(`/${role}/auth/register/`, {
        method: "POST",
        data: payload,
      });

      return response;
    },
    []
  );

  const logout = useCallback(async () => {
    if (!state.tokens || !state.role) {
      clearSession();
      return;
    }

    try {
      await apiRequest<void>(`/${state.role}/auth/logout/`, {
        method: "POST",
        token: state.tokens.access,
        data: { refresh: state.tokens.refresh },
      });
    } finally {
      clearSession();
    }
  }, [state.tokens, state.role, clearSession]);

  const refreshAccessToken = useCallback(async () => {
    if (!state.tokens || !state.role) {
      return null;
    }

    try {
      const response = await apiRequest<{ access: string }>(
        `/${state.role}/auth/token/refresh/`,
        {
          method: "POST",
          data: { refresh: state.tokens.refresh },
        }
      );

      setState((current) => ({
        ...current,
        tokens: current.tokens
          ? {
              ...current.tokens,
              access: response.access,
            }
          : current.tokens,
      }));

      return response.access;
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        clearSession();
      }
      return null;
    }
  }, [state.tokens, state.role, clearSession]);

  const updateUser = useCallback((user: AuthUser) => {
    setState((current) => ({
      ...current,
      user,
    }));
  }, []);

  const authorizedRequest = useCallback(
    async <T,>(path: string, options: RequestOptions = {}) => {
      if (!state.tokens) {
        throw new Error("Not authenticated");
      }

      try {
        return await apiRequest<T>(path, {
          ...options,
          token: state.tokens.access,
        });
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          const newAccess = await refreshAccessToken();
          if (!newAccess) {
            throw error;
          }

          return apiRequest<T>(path, {
            ...options,
            token: newAccess,
          });
        }

        throw error;
      }
    },
    [state.tokens, refreshAccessToken]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      isAuthenticated: Boolean(state.tokens?.access),
      login,
      register,
      logout,
      refreshAccessToken,
      updateUser,
      clearSession,
      authorizedRequest,
    }),
    [state, login, register, logout, refreshAccessToken, updateUser, clearSession, authorizedRequest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export type { AuthUser, LoginPayload, RegisterPayload };
