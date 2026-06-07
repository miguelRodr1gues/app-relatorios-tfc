import { createContext } from "react";

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
}

export type AuthChallenge = {
  verificationToken?: string;
  purpose?: string;
  email?: string;
  expiresIn?: number;
  error?: string;
};

export type RegisterCodePayload = {
  firstName: string;
  lastName: string;
  email?: string;
};

export type VerifyCodePayload = {
  verificationToken?: string;
  code: string;
};

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  requestLoginCode: (email: string) => Promise<AuthChallenge | null>;
  requestRegisterCode: (payload: RegisterCodePayload) => Promise<AuthChallenge | null>;
  verifyCode: (payload: VerifyCodePayload) => Promise<boolean>;
  loginWithGoogle: (token: string) => Promise<boolean>;
  checkAuth: () => Promise<boolean>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
