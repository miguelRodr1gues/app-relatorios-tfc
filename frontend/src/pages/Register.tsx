import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mail, User } from "lucide-react";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const { requestRegisterCode } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const challenge = await requestRegisterCode({ firstName, lastName, email });
    setLoading(false);

    if (challenge) {
      navigate(
        `/verify-code?token=${encodeURIComponent(challenge.verificationToken)}&email=${encodeURIComponent(challenge.email)}&purpose=register&first_name=${encodeURIComponent(firstName)}&last_name=${encodeURIComponent(lastName)}`,
        { replace: true }
      );
    } else {
      setError("Nao foi possivel criar a conta. Confirma os dados.");
    }
  };

  return (
    <AuthShell
      title="Registo"
      subtitle="Crie a sua conta para aceder ao dashboard"
      footer={
        <div className="text-center">
          <Link to="/login" className="text-[14px] text-[#2d6a4f] hover:underline font-semibold">
            Já tem conta? Entrar
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
          <input
            type="text"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Primeiro nome"
            className="w-full h-12 pl-12 pr-4 rounded-full bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] text-[14px] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20"
          />
        </div>

        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9ca3af]" />
          <input
            type="text"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Último nome"
            className="w-full h-12 pl-12 pr-4 rounded-full bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] text-[14px] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20"
          />
        </div>

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
          disabled={loading}
          className="w-full h-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white rounded-full text-[14px] font-semibold disabled:opacity-50"
        >
          {loading ? "A enviar código…" : "Criar conta"}
        </button>
      </form>
    </AuthShell>
  );
}

