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

export interface AuthChallenge {
  verificationToken: string;
  email: string;
  purpose: "register" | "login";
  expiresIn: number;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
}

export interface VerifyCodePayload {
  verificationToken: string;
  code: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  requestLoginCode: (email: string) => Promise<AuthChallenge | null>;
  requestRegisterCode: (payload: RegisterPayload) => Promise<AuthChallenge | null>;
  verifyCode: (payload: VerifyCodePayload) => Promise<boolean>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

// ----------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ----------------------------
function mapUser(data: any): User {
  const email = data?.email ?? "";
  const name = data?.name?.trim() || (email ? email.split("@")[0] : "User");

  return {
    id: String(data?.id ?? ""),
    name,
    email,
    avatar: data?.avatar ?? data?.picture,
  };
}

// ----------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootRef = useRef(false);

  // ----------------------------
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

  // ----------------------------
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    (async () => {
      await checkAuth();
      setLoading(false);
    })();
  }, []);

  // ----------------------------
  const requestLoginCode = async (email: string): Promise<AuthChallenge | null> => {
    try {
      const { data } = await api.post("/api/auth/login-email/", { email });
      return {
        verificationToken: data.verification_token,
        email: data.email,
        purpose: data.purpose,
        expiresIn: data.expires_in,
      };
    } catch {
      return null;
    }
  };

  const requestRegisterCode = async (payload: RegisterPayload): Promise<AuthChallenge | null> => {
    try {
      const { data } = await api.post("/api/auth/register/", {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
      });

      return {
        verificationToken: data.verification_token,
        email: data.email,
        purpose: data.purpose,
        expiresIn: data.expires_in,
      };
    } catch {
      return null;
    }
  };

  const verifyCode = async ({ verificationToken, code }: VerifyCodePayload) => {
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

  // ----------------------------
  const logout = async () => {
    try {
      await api.post("/api/auth/logout/");
    } finally {
      setUser(null);
    }
  };

  // ----------------------------
  const value = useMemo<AuthContextType>(
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

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
  );
}

// ----------------------------
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}