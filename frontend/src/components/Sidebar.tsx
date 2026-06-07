import { LayoutDashboard, FileText, PlusSquare, Network, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import logo from '../assets/logo.png';

interface SidebarProps {
  activeNav: string;
  onNavChange: (nav: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ activeNav, onNavChange, collapsed = false, onToggleCollapse }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'relatorios', icon: FileText, label: 'Relatórios', path: '/relatorios' },
    { id: 'novo-relatorio', icon: PlusSquare, label: 'Novo Relatório', action: true },
    { id: 'estrutura', icon: Network, label: 'Estrutura', path: '/estrutura' },
  ];

  const generalItems = [
    { id: 'settings', icon: Settings, label: 'Definições', path: '/settings' },
    { id: 'logout', icon: LogOut, label: 'Logout' },
  ];

  return (
    <aside className={`${collapsed ? 'w-[80px] min-w-[80px]' : 'w-[280px] min-w-[280px]'} bg-white dark:bg-[#2a2a2a] flex flex-col h-screen border-r border-[#f3f4f6] dark:border-[#3a3a3a] transition-all duration-300`}>
      {/* Logo */}
      <div className={`flex pt-6 pb-8 ${collapsed ? 'flex-col items-center gap-3 px-0' : 'items-center justify-between gap-3 px-6'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] flex items-center justify-center flex-shrink-0 shadow-sm">
              <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
            </div>
            <div className="font-bold text-[16px] text-[#1f2937] dark:text-white">Ares do Pinhal</div>
          </div>
        )}

        {collapsed && (
          <div className="w-10 h-10 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] flex items-center justify-center flex-shrink-0 shadow-sm">
            <img src={logo} alt="Logo" className="w-6 h-6 object-contain" />
          </div>
        )}

        {/* Button to toggle collapse */}
        <button
            onClick={onToggleCollapse}
            className="flex items-center justify-center w-10 h-10 rounded-full text-[#6b7280] dark:text-[#9ca3af] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] hover:text-[#374051] dark:hover:text-white transition-all"
            title={collapsed ? 'Expandir' : 'Minimizar'}
        >
          {collapsed ? (
              <ChevronRight className="w-5 h-5" />
          ) : (
              <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu Section */}
      <div className="px-4 flex-1">
        {!collapsed && (
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] px-3 mb-3">
            MENU
          </div>
        )}
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-[14px] font-medium cursor-pointer transition-all mb-1 ${
                isActive
                  ? 'text-[#2d6a4f] bg-[#f0fdf4] dark:bg-[#1b4332] dark:text-[#86efac]'
                  : 'text-[#6b7280] dark:text-[#9ca3af] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] hover:text-[#374051] dark:hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              onClick={() => onNavChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#2d6a4f] dark:text-[#86efac]' : 'text-[#9ca3af] dark:text-[#6b7280]'}`} />
              {!collapsed && <span className="flex-1">{item.label}</span>}
            </div>
          );
        })}

        <div className="h-px bg-[#f3f4f6] dark:bg-[#3a3a3a] my-5"></div>

        {/* General Section */}
        {!collapsed && (
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#9ca3af] dark:text-[#6b7280] px-3 mb-3">
            GENERAL
          </div>
        )}
        {generalItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          const isLogout = item.id === 'logout';
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-[14px] font-medium cursor-pointer transition-all mb-1 ${
                isActive
                  ? 'text-[#2d6a4f] bg-[#f0fdf4] dark:bg-[#1b4332] dark:text-[#86efac]'
                  : isLogout
                    ? 'text-[#dc2626] hover:bg-[#fef2f2] dark:hover:bg-[#3a1a1a] hover:text-[#b91c1c]'
                    : 'text-[#6b7280] dark:text-[#9ca3af] hover:bg-[#f9fafb] dark:hover:bg-[#3a3a3a] hover:text-[#374151] dark:hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              onClick={() => onNavChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#2d6a4f] dark:text-[#86efac]' : isLogout ? 'text-[#dc2626]' : 'text-[#9ca3af] dark:text-[#6b7280]'}`} />
              {!collapsed && <span>{item.label}</span>}
            </div>
          );
        })}
      </div>

    </aside>
  );
}
