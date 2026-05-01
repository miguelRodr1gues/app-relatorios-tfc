import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";

import { api } from "../lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  requestLoginCode: (email: string) => Promise<any>;
  requestRegisterCode: (payload: any) => Promise<any>;
  verifyCode: (payload: any) => Promise<boolean>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUser(data: any): User {
  return {
    id: String(data?.id ?? ""),
    name: data?.name ?? data?.email?.split("@")[0] ?? "User",
    email: data?.email ?? "",
    avatar: data?.avatar ?? data?.picture,
  };
}

function extractErrorMessage(error: any, fallback: string) {
  const data = error?.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.detail) {
    return data.detail;
  }

  return error?.message || fallback;
}

function normalizeChallenge(data: any) {
  if (!data) return null;

  return {
    ...data,
    verificationToken: data.verificationToken ?? data.verification_token,
    purpose: data.purpose,
    email: data.email,
    expiresIn: data.expiresIn ?? data.expires_in,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootRef = useRef(false);

  const checkAuth = async (): Promise<boolean> => {
    try {
      const { data } = await api.get("/api/auth/user/");
      setUser(mapUser(data));
      return true;
    } catch {
      setUser(null);
      return false;
    }
  };

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    (async () => {
      await checkAuth();
      setLoading(false);
    })();
  }, []);

  const requestLoginCode = async (email: string) => {
    try {
      const { data } = await api.post("/api/auth/login/", { email });
      return normalizeChallenge(data);
    } catch (error: any) {
      return { error: extractErrorMessage(error, "Nao foi possivel enviar o código.") };
    }
  };

  const requestRegisterCode = async (payload: any) => {
    try {
      const { data } = await api.post("/api/auth/register/", {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
      });

      return normalizeChallenge(data);
    } catch (error: any) {
      return { error: extractErrorMessage(error, "Nao foi possivel criar a conta.") };
    }
  };

  const verifyCode = async ({ verificationToken, code }: any) => {
    try {
      await api.post("/api/auth/verify-code/", {
        verification_token: verificationToken,
        code,
      });
      return await checkAuth();
    } catch {
      setUser(null);
      return false;
    }
  };

  const loginWithGoogle = async (token: string) => {
    try {
      await api.post("/api/auth/google/", { token });
      return await checkAuth();
    } catch {
      setUser(null);
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout/");
    } finally {
      setUser(null);
    }
  };

  const value = useMemo(
      () => ({
        user,
        isAuthenticated: !!user,
        loading,
        requestLoginCode,
        requestRegisterCode,
        verifyCode,
        loginWithGoogle,
        checkAuth,
        logout,
      }),
      [user, loading]
  );

  if (loading) return null;

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}