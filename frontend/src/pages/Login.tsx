import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import AuthShell from "../components/AuthShell";

export default function Login() {
    const navigate = useNavigate();
    const { requestLoginCode, loginWithGoogle } = useAuth();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);

    const handleGoogleLogin = () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        const redirectUri = `${window.location.origin}/login`;
        const scope = "openid profile email";
        const nonce = Math.random().toString(36).slice(2);

        const googleAuthUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${encodeURIComponent(clientId)}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=token%20id_token` +
            `&response_mode=fragment` +
            `&scope=${encodeURIComponent(scope)}` +
            `&nonce=${encodeURIComponent(nonce)}` +
            `&prompt=select_account`;

        window.location.href = googleAuthUrl;
    };

    useEffect(() => {
        const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
        const params = new URLSearchParams(hash);
        const token = params.get("id_token") || params.get("access_token");

        if (!token) return;

        (async () => {
            setError("");
            setSocialLoading("google");
            const ok = await loginWithGoogle(token);
            setSocialLoading(null);
            window.history.replaceState(null, "", "/login");

            if (ok) navigate("/dashboard", { replace: true });
            else setError("Nao foi possivel entrar com Google");
        })();
    }, [loginWithGoogle, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const challenge = await requestLoginCode(email.trim());
        setLoading(false);

        if (challenge) {
            navigate(
                `/verify-code?token=${encodeURIComponent(challenge.verificationToken)}&email=${encodeURIComponent(challenge.email)}&purpose=login`,
                { replace: true }
            );
        } else {
            setError("Nao foi possivel enviar o código. Confirma o email.");
        }
    };

    return (
        <AuthShell
            title="Login"
            subtitle="Faça login para aceder ao dashboard"
            footer={
                <div className="text-center">
                    <Link to="/register" className="text-[14px] text-[#2d6a4f] hover:underline font-semibold">
                        Ainda não tem conta? Registe-se
                    </Link>
                </div>
            }
        >
            <div className="space-y-3 mb-6">
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading || !!socialLoading}
                    className="w-full h-12 rounded-full border-[2px] border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white text-[14px] font-semibold hover:border-[#2d6a4f] hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {socialLoading === "google" ? (
                        <div className="w-5 h-5 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <FcGoogle className="w-5 h-5" />
                            <span>Continuar com Google</span>
                        </>
                    )}
                </button>
            </div>

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

            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
                <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
                    <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full h-12 pl-12 pr-4 rounded-full bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] text-[14px] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20"
                    />
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full px-4 py-3 text-[13px] text-red-700 dark:text-red-400 text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading || !!socialLoading}
                    className="w-full h-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white rounded-full text-[14px] font-semibold disabled:opacity-50"
                >
                    {loading ? "A enviar código…" : "Continuar"}
                </button>
            </form>
        </AuthShell>
    );
}