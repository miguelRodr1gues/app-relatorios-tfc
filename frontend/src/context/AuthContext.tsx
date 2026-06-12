import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, extractApiErrorMessage } from "../lib/api";
import {
  AuthChallenge,
  AuthContext,
  AuthContextType,
  RegisterCodePayload,
  User,
  VerifyCodePayload,
} from "./AuthContextCore";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function mapUser(data: unknown): User {
  const userData = isRecord(data) ? data : {};
  const email = asString(userData.email);
  const name = asString(userData.name, email.includes("@") ? email.split("@")[0] : "User");

  return {
    id: String(userData.id ?? ""),
    name,
    email,
    avatar: asString(userData.avatar, asString(userData.picture)) || undefined,
  };
}

function normalizeChallenge(data: unknown): AuthChallenge | null {
  if (!isRecord(data)) return null;

  return {
    verificationToken: asString(data.verificationToken, asString(data.verification_token)) || undefined,
    purpose: asString(data.purpose) || undefined,
    email: asString(data.email) || undefined,
    expiresIn: typeof data.expiresIn === "number" ? data.expiresIn : typeof data.expires_in === "number" ? data.expires_in : undefined,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const bootRef = useRef(false);

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const { data } = await api.get("/api/auth/user/");
      setUser(mapUser(data));
      return true;
    } catch {
      setUser(null);
      return false;
    }
  }, []);

  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;

    void (async () => {
      await checkAuth();
      setLoading(false);
    })();
  }, [checkAuth]);

  const requestLoginCode = useCallback(async (email: string) => {
    try {
      const { data } = await api.post("/api/auth/login/", { email });
      return normalizeChallenge(data);
    } catch (error: unknown) {
      return { error: extractApiErrorMessage(error, "Nao foi possivel enviar o codigo.") };
    }
  }, []);

  const requestRegisterCode = useCallback(async (payload: RegisterCodePayload) => {
    try {
      const { data } = await api.post("/api/auth/register/", {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
      });

      return normalizeChallenge(data);
    } catch (error: unknown) {
      return { error: extractApiErrorMessage(error, "Nao foi possivel criar a conta.") };
    }
  }, []);

  const verifyCode = useCallback(async ({ verificationToken, code }: VerifyCodePayload) => {
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
  }, [checkAuth]);

  const loginWithGoogle = useCallback(async (token: string) => {
    try {
      await api.post("/api/auth/google/", {
        token,
      });

      return await checkAuth();
    } catch {
      setUser(null);
      return false;
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout/");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      requestLoginCode,
      requestRegisterCode,
      verifyCode,
      loginWithGoogle,
      checkAuth,
      logout,
    }),
    [user, loading, requestLoginCode, requestRegisterCode, verifyCode, loginWithGoogle, checkAuth, logout]
  );

  if (loading) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
