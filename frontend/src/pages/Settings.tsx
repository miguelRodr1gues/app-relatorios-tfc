import { useState } from 'react';
import { Moon, Sun, Bell, Lock, User, Mail, Globe, Save } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Settings() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto px-8 py-8 bg-[#fafafa] dark:bg-[#1a1a1a]">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[#1f2937] dark:text-white leading-tight">Configurações</h1>
        <p className="text-[14px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
          Personalize a sua experiência no dashboard.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Appearance Section */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f3f4f6] dark:border-[#3a3a3a]">
            <h2 className="text-[17px] font-semibold text-[#1f2937] dark:text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#2d6a4f]" />
              Aparência
            </h2>
            <p className="text-[13px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
              Escolha o tema que prefere para o dashboard.
            </p>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isDarkMode ? (
                  <Moon className="w-5 h-5 text-[#9ca3af] dark:text-[#6b7280]" />
                ) : (
                  <Sun className="w-5 h-5 text-[#9ca3af]" />
                )}
                <div>
                  <div className="text-[14px] font-medium text-[#1f2937] dark:text-white">
                    {isDarkMode ? 'Modo Escuro' : 'Modo Claro'}
                  </div>
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                    {isDarkMode ? 'Interface escura para reduzir fadiga visual' : 'Interface clara e limpa'}
                  </div>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-[#2d6a4f]' : 'bg-[#e5e7eb]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f3f4f6] dark:border-[#3a3a3a]">
            <h2 className="text-[17px] font-semibold text-[#1f2937] dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#2d6a4f]" />
              Notificações
            </h2>
            <p className="text-[13px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
              Gerencie como recebe notificações.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#9ca3af] dark:text-[#6b7280]" />
                <div>
                  <div className="text-[14px] font-medium text-[#1f2937] dark:text-white">
                    Notificações Push
                  </div>
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                    Receber notificações no navegador
                  </div>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  notifications ? 'bg-[#2d6a4f]' : 'bg-[#e5e7eb] dark:bg-[#3a3a3a]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-[#f3f4f6] dark:border-[#3a3a3a]">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#9ca3af] dark:text-[#6b7280]" />
                <div>
                  <div className="text-[14px] font-medium text-[#1f2937] dark:text-white">
                    Notificações por Email
                  </div>
                  <div className="text-[12px] text-[#9ca3af] dark:text-[#6b7280]">
                    Receber atualizações por email
                  </div>
                </div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  emailNotifications ? 'bg-[#2d6a4f]' : 'bg-[#e5e7eb] dark:bg-[#3a3a3a]'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f3f4f6] dark:border-[#3a3a3a]">
            <h2 className="text-[17px] font-semibold text-[#1f2937] dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-[#2d6a4f]" />
              Conta
            </h2>
            <p className="text-[13px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
              Gerencie as informações da sua conta.
            </p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[13px] font-medium text-[#6b7280] dark:text-[#9ca3af] block mb-2">
                Nome
              </label>
              <input
                type="text"
                defaultValue="Administrador"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6b7280] dark:text-[#9ca3af] block mb-2">
                Email
              </label>
              <input
                type="email"
                defaultValue="admin@aresdopinhal.pt"
                className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white placeholder-[#9ca3af] focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-[#6b7280] dark:text-[#9ca3af] block mb-2">
                Idioma
              </label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9ca3af] dark:text-[#6b7280]" />
                <select className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] text-[#1f2937] dark:text-white focus:outline-none focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all appearance-none cursor-pointer">
                  <option>Português (PT)</option>
                  <option>English (EN)</option>
                  <option>Español (ES)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white dark:bg-[#2a2a2a] rounded-[20px] shadow-sm border border-[#f3f4f6] dark:border-[#3a3a3a] overflow-hidden">
          <div className="px-6 py-5 border-b border-[#f3f4f6] dark:border-[#3a3a3a]">
            <h2 className="text-[17px] font-semibold text-[#1f2937] dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2d6a4f]" />
              Segurança
            </h2>
            <p className="text-[13px] text-[#9ca3af] dark:text-[#6b7280] mt-1">
              Proteja a sua conta com configurações de segurança.
            </p>
          </div>
          <div className="px-6 py-5">
            <button className="w-full px-4 py-2.5 bg-white dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] rounded-full text-[14px] font-medium text-[#1f2937] dark:text-white hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] transition-all">
              Alterar Password
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button className="flex items-center gap-2 bg-[#2d6a4f] text-white border-none rounded-full px-8 py-3 text-[14px] font-semibold cursor-pointer transition-all hover:bg-[#1b4332] hover:shadow-md">
            <Save className="w-4 h-4" />
            Guardar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}