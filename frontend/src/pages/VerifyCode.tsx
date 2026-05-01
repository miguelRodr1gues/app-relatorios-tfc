import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { KeyRound, Mail } from "lucide-react";
import AuthShell from "../components/AuthShell";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { verifyCode, requestLoginCode, requestRegisterCode } = useAuth();

  const verificationToken = params.get("token") || "";
  const email = params.get("email") || "";
  const purpose = (params.get("purpose") as "login" | "register") || "login";
  const firstName = params.get("first_name") || "";
  const lastName = params.get("last_name") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  const subtitle = useMemo(() => {
    return purpose === "register"
      ? "Verifique o código enviado para ativar a sua conta"
      : "Verifique o código enviado por email para entrar";
  }, [purpose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await verifyCode({ verificationToken, code });
    setLoading(false);

    if (ok) {
      navigate("/dashboard", { replace: true });
      return;
    }

    setError("Código inválido ou expirado.");
  };

  const handleResend = async () => {
    if (!email) return;
    setError("");
    setResending(true);

    const challenge =
      purpose === "register"
        ? await requestRegisterCode({ firstName, lastName, email })
        : await requestLoginCode(email);

    setResending(false);

    if (!challenge) {
      setError("Não foi possível reenviar o código.");
      return;
    }

    setParams({
      token: challenge.verificationToken,
      email: challenge.email,
      purpose: challenge.purpose,
      ...(purpose === "register" ? { first_name: firstName, last_name: lastName } : {}),
    });
  };

  return (
    <AuthShell
      title="Verificação"
      subtitle={subtitle}
      footer={
        <div className="text-center space-y-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className="text-[14px] text-[#2d6a4f] hover:underline font-semibold disabled:opacity-50"
          >
            {resending ? "A reenviar..." : "Reenviar código"}
          </button>
          <div>
            <Link to={purpose === "register" ? "/register" : "/login"} className="text-[14px] text-[#2d6a4f] hover:underline font-semibold">
              Alterar email
            </Link>
          </div>
        </div>
      }
    >
      <div className="mb-6 rounded-2xl bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] p-4 text-[14px] text-[#6b7280] dark:text-[#9ca3af] flex items-center gap-3">
        <Mail className="w-5 h-5 text-[#2d6a4f]" />
        <span>{email ? `Código enviado para ${email}` : "Introduza o email para continuar"}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Código de 6 dígitos"
            className="w-full h-12 pl-12 pr-4 rounded-full bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] text-[14px] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 tracking-[0.3em] text-center"
          />
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-full px-4 py-3 text-[13px] text-red-700 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !verificationToken || code.length !== 6}
          className="w-full h-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white rounded-full text-[14px] font-semibold disabled:opacity-50"
        >
          {loading ? "A verificar..." : "Verificar e entrar"}
        </button>
      </form>

      <div className="mt-4 text-center text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
        O código expira em 10 minutos.
      </div>
    </AuthShell>
  );
}

