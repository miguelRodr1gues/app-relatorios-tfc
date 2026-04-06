import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    provider?: 'email' | 'google' | 'microsoft';
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    loginWithSocial: (provider: 'google' | 'microsoft') => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock credentials (dev-only)
export const MOCK_USER_CREDENTIALS = {
    email: 'admin@aresdopinhal.pt',
    password: 'admin',
} as const;

export const MOCK_USER: User = {
    id: '1',
    name: 'Admin',
    email: MOCK_USER_CREDENTIALS.email,
    avatar: undefined,
    provider: 'email',
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const login = async (email: string, password: string): Promise<boolean> => {
        // Mock login (em produção, substituir por chamada à API)
        const normalizedEmail = email.trim().toLowerCase();

        if (
            normalizedEmail === MOCK_USER_CREDENTIALS.email.toLowerCase() &&
            password === MOCK_USER_CREDENTIALS.password
        ) {
            setUser(MOCK_USER);
            localStorage.setItem('user', JSON.stringify(MOCK_USER));
            return true;
        }

        return false;
    };

    const loginWithSocial = async (provider: 'google' | 'microsoft'): Promise<boolean> => {
        // Mock social login
        const providerNames: Record<typeof provider, string> = {
            google: 'Google',
            microsoft: 'Microsoft',
        };

        const mockUser: User = {
            id: `${provider}-${Date.now()}`,
            name: `Utilizador ${providerNames[provider]}`,
            email: `user@${provider}.com`,
            avatar: undefined,
            provider: provider,
        };

        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    localStorage.removeItem('user');

    const value = useMemo<AuthContextType>(
        () => ({ user, isAuthenticated: !!user, login, loginWithSocial, logout }),
        [user]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}