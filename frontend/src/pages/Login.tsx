import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MOCK_USER_CREDENTIALS } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import logo from '../assets/logo.png'
import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    Sun,
    Moon,
} from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const { login, loginWithSocial } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<
        string | null
    >(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (!email || !password) {
            setError("Por favor, preencha todos os campos");
            setLoading(false);
            return;
        }

        const success = await login(email, password);
        setLoading(false);

        if (success) {
            navigate("/dashboard");
        } else {
            setError("Email ou password incorretos");
        }
    };

    const handleSocialLogin = async (
        provider: "google" | "microsoft",
    ) => {
        setError("");
        setSocialLoading(provider);

        // Simular delay de autenticação
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const success = await loginWithSocial(provider);
        setSocialLoading(null);

        if (success) {
            navigate("/dashboard");
        } else {
            setError(`Erro ao autenticar com ${provider}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-[#1a1a1a] flex items-center justify-center px-4 transition-colors duration-300">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] hover:text-[#2d6a4f] dark:hover:text-[#2d6a4f] transition-all hover:shadow-lg"
            >
                {isDarkMode ? (
                    <Sun className="w-5 h-5" />
                ) : (
                    <Moon className="w-5 h-5" />
                )}
            </button>

            <div className="w-full max-w-[440px]">
                {/* Logo */}
                <div className="flex flex-col items-center mb-4">

                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] shadow-lg">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-12 h-12 object-contain"
                        />
                    </div>

                    <p className="mt-4 text-[14px] text-center text-[#6b7280] dark:text-[#9ca3af]">
                        Faça login para aceder ao dashboard
                    </p>

                </div>

                {/* Login Card */}
                <div className="bg-white dark:bg-[#2a2a2a] rounded-xl border border-[#e5e7eb] dark:border-[#3a3a3a] p-8 shadow-lg">
                    {/* Social Login Buttons */}
                    <div className="space-y-3 mb-6">
                        <button
                            onClick={() => handleSocialLogin("google")}
                            disabled={loading || !!socialLoading}
                            className="w-full h-12 rounded-full border-[2px] border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white text-[14px] font-semibold hover:border-[#2d6a4f] hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {socialLoading === "google" ? (
                                <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                            )}
                            <span>Continuar com Google</span>
                        </button>

                        <button
                            onClick={() => handleSocialLogin("microsoft")}
                            disabled={loading || !!socialLoading}
                            className="w-full h-12 rounded-full border-[2px] border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white text-[14px] font-semibold hover:border-[#2d6a4f] hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {socialLoading === "microsoft" ? (
                                <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-5 h-5" viewBox="0 0 23 23">
                                    <path fill="#f25022" d="M0 0h11v11H0z" />
                                    <path fill="#00a4ef" d="M12 0h11v11H12z" />
                                    <path fill="#7fba00" d="M0 12h11v11H0z" />
                                    <path fill="#ffb900" d="M12 12h11v11H12z" />
                                </svg>
                            )}
                            <span>Continuar com Microsoft</span>
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#e5e7eb] dark:border-[#3a3a3a]"></div>
                        </div>
                        <div className="relative flex justify-center text-[12px]">
              <span className="px-4 bg-white dark:bg-[#2a2a2a] text-[#9ca3af] dark:text-[#6b7280] font-semibold uppercase">
                Ou
              </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Input */}
                        <div>
                            <label className="block text-[13px] font-semibold text-[#1f2937] dark:text-white mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#9ca3af]">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seu@email.com"
                                    className="w-full h-12 pl-12 pr-4 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                                    disabled={loading || !!socialLoading}
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-[13px] font-semibold text-[#1f2937] dark:text-white mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#9ca3af]">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-12 pl-12 pr-12 rounded-full border border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] dark:placeholder:text-[#6b7280] text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all"
                                    disabled={loading || !!socialLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] dark:text-[#9ca3af] hover:text-[#2d6a4f] dark:hover:text-[#2d6a4f] transition-colors"
                                    disabled={loading || !!socialLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full px-4 py-3 text-[13px] text-red-700 dark:text-red-400 text-center">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !!socialLoading}
                            className="w-full h-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white rounded-full text-[14px] font-semibold"
                        >
                            {loading ? "Autenticando..." : "Entrar"}
                        </button>
                    </form>

                    {/* Forgot Password */}
                    <div className="mt-6 text-center">
                        <button className="text-[14px] text-[#2d6a4f] hover:underline font-semibold">
                            Esqueceu-se da password?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}