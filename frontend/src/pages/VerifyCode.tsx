import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { Mail } from 'lucide-react';
import AuthShell from '../components/AuthShell';
import AuthInput from '../components/auth/AuthInput';
import AuthPrimaryButton from '../components/auth/AuthPrimaryButton';

export default function VerifyCode() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { verifyCode, requestLoginCode, requestRegisterCode } = useAuth();

  const verificationToken = params.get('token') || '';
  const email = params.get('email') || '';
  const purpose = (params.get('purpose') as 'login' | 'register') || 'login';
  const firstName = params.get('first_name') || '';
  const lastName = params.get('last_name') || '';

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');

  const subtitle = useMemo(() => {
    return purpose === 'register'
      ? 'Confirme o código enviado para ativar a sua conta'
      : 'Confirme o código enviado para entrar na aplicação';
  }, [purpose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const ok = await verifyCode({ verificationToken, code });
    setLoading(false);

    if (ok) {
      navigate('/dashboard', { replace: true });
      return;
    }

    setError('Código inválido ou expirado.');
  };

  const handleResend = async () => {
    if (!email) return;
    setError('');
    setResending(true);

    const challenge =
      purpose === 'register'
        ? await requestRegisterCode({ firstName, lastName, email })
        : await requestLoginCode(email);

    setResending(false);

    if (!challenge?.verificationToken) {
      setError(challenge?.error || 'Não foi possível reenviar o código.');
      return;
    }

    setParams({
      token: challenge.verificationToken,
      email: challenge.email || email,
      purpose: challenge.purpose || purpose,
      ...(purpose === 'register' ? { first_name: firstName, last_name: lastName } : {}),
    });
  };

  return (
    <AuthShell
      subtitle={subtitle}
      footer={
        <div className="space-y-3 text-center">
          <p className="text-[13px] text-[#6b7280] dark:text-[#9ca3af]">
            Não recebeu o código?
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="text-[14px] font-semibold text-[#2d6a4f] transition hover:text-[#1b4332] disabled:opacity-50"
            >
              {resending ? 'A reenviar...' : 'Reenviar código'}
            </button>
            <span className="h-4 w-px bg-[#e5e7eb] dark:bg-[#3a3a3a]" />
            <Link
              to={purpose === 'register' ? '/register' : '/login'}
              className="text-[14px] font-semibold text-[#2d6a4f] transition hover:text-[#1b4332]"
            >
              Alterar email
            </Link>
          </div>
        </div>
      }
    >
      <div className="mb-6 text-center">
        <h1 className="text-[24px] font-bold tracking-tight text-[#172132] dark:text-white">
          Introduza o código
        </h1>
        <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-6 text-[#667085] dark:text-[#9ca3af]">
          Enviámos um código de 6 dígitos para confirmar a sua identidade.
        </p>
      </div>

      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#e8ecf0] bg-[#f8faf9] px-4 py-3 text-[13px] text-[#4b5563] dark:border-[#3a3a3a] dark:bg-[#1a1a1a] dark:text-[#9ca3af]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#2d6a4f] shadow-sm dark:bg-[#242424]">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8fa899] dark:text-[#6b7280]">
            Código enviado para
          </div>
          <div className="truncate font-semibold text-[#1f2937] dark:text-white">
            {email || 'o seu email'}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthInput
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          aria-label="Introduza o código"
          className="h-14 rounded-[20px] border-[#dfe7e3] pl-12 pr-6 text-center text-[24px] font-bold tracking-[0.35em] placeholder:text-[#d1d5db] focus:border-[#2d6a4f]"
        />

        <div className="text-center text-[12px] leading-5 text-[#8fa899] dark:text-[#6b7280]">
          O código tem 6 dígitos e é válido por alguns minutos.
        </div>

        {error && (
          <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <AuthPrimaryButton
          type="submit"
          disabled={loading || !verificationToken || code.length !== 6}
        >
          Continuar
        </AuthPrimaryButton>
      </form>
    </AuthShell>
  );
}
