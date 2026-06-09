import { FormEvent, useEffect, useState } from 'react';
import { Moon, Save, Sun, User } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { api } from '../lib/api';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user?.name]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Indique o nome que pretende usar.');
      return;
    }

    try {
      setIsSaving(true);
      await api.patch('/api/auth/user/', { name: trimmedName });
      await checkAuth();
      setMessage('Nome atualizado com sucesso.');
    } catch {
      setError('Não foi possível guardar o nome.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] px-8 py-8 dark:bg-[#1a1a1a]">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold leading-tight text-[#1f2937] dark:text-white">
          Definições
        </h1>
        <p className="mt-1 text-[14px] text-[#9ca3af] dark:text-[#6b7280]">
          Atualize o seu nome e personalize a aparência da aplicação.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <form
          onSubmit={handleSubmit}
          className="overflow-hidden rounded-[24px] border border-[#f3f4f6] bg-white shadow-sm dark:border-[#3a3a3a] dark:bg-[#2a2a2a]"
        >
          <div className="border-b border-[#f3f4f6] px-6 py-5 dark:border-[#3a3a3a]">
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#1f2937] dark:text-white">
              <User className="h-5 w-5 text-[#2d6a4f]" />
              Perfil
            </h2>
            <p className="mt-1 text-[13px] text-[#9ca3af] dark:text-[#6b7280]">
              Este nome será apresentado na aplicação e nos relatórios exportados.
            </p>
          </div>

          <div className="space-y-5 px-6 py-6">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#4b5563] dark:text-[#d1d5db]">
                Nome de utilizador
              </label>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Introduza o seu nome"
                className="w-full rounded-full border border-[#e5e7eb] bg-white px-4 py-3 text-[14px] text-[#1f2937] transition-all placeholder:text-[#9ca3af] focus:border-[#2d6a4f] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 dark:border-[#3a3a3a] dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>

            {message && (
              <div className="rounded-full border border-[#bbf7d0] bg-[#ecfdf3] px-4 py-3 text-center text-[13px] font-medium text-[#166534] dark:border-[#245a43] dark:bg-[#153326] dark:text-[#bbf7d0]">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-full border border-red-200 bg-red-50 px-4 py-3 text-center text-[13px] font-medium text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 rounded-full border-none bg-[#2d6a4f] px-7 py-3 text-[14px] font-semibold text-white transition-all hover:bg-[#1b4332] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'A guardar...' : 'Guardar nome'}
              </button>
            </div>
          </div>
        </form>

        <div className="overflow-hidden rounded-[24px] border border-[#f3f4f6] bg-white shadow-sm dark:border-[#3a3a3a] dark:bg-[#2a2a2a]">
          <div className="border-b border-[#f3f4f6] px-6 py-5 dark:border-[#3a3a3a]">
            <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#1f2937] dark:text-white">
              <Sun className="h-5 w-5 text-[#2d6a4f]" />
              Aparência
            </h2>
            <p className="mt-1 text-[13px] text-[#9ca3af] dark:text-[#6b7280]">
              Escolha o tema que prefere usar.
            </p>
          </div>

          <div className="px-6 py-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f6f4] text-[#2d6a4f] dark:bg-[#1a1a1a]">
                  {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#1f2937] dark:text-white">
                    {isDarkMode ? 'Modo escuro' : 'Modo claro'}
                  </div>
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                    {isDarkMode ? 'Interface com fundo escuro' : 'Interface com fundo claro'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Alterar tema"
                className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-[#2d6a4f]' : 'bg-[#e5e7eb]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
