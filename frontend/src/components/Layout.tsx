import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ReportWizard from './ReportWizard';
import { WizardProvider, useWizard } from '../context/WizardContext';
import { SearchProvider } from '../context/SearchContext';
import { ThemeProvider } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

function LayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOpen, openWizard, closeWizard } = useWizard();
  const { logout } = useAuth();

  useEffect(() => {
    const pathMap: Record<string, string> = {
      '/dashboard': 'dashboard',
      '/relatorios': 'relatorios',
      '/estrutura': 'estrutura',
      '/analises': 'analises',
      '/settings': 'settings',
    };
    setActiveNav(pathMap[location.pathname] || 'dashboard');
  }, [location.pathname]);

  const handleNavChange = async (nav: string) => {
    if (nav === 'logout') {
      await logout();
      navigate('/login');
      return;
    }

    if (nav === 'novo-relatorio') {
      openWizard();
      return;
    }

    const navMap: Record<string, string> = {
      'dashboard': '/dashboard',
      'relatorios': '/relatorios',
      'estrutura': '/estrutura',
      'analises': '/analises',
      'settings': '/settings',
    };

    if (navMap[nav]) {
      navigate(navMap[nav]);
    }

    setActiveNav(nav);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#f5f6f8] dark:bg-[#1a1a1a]">
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <Outlet />
      </div>
      <ReportWizard isOpen={isOpen} onClose={closeWizard} />
    </div>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <SearchProvider>
        <WizardProvider>
          <LayoutContent />
        </WizardProvider>
      </SearchProvider>
    </ThemeProvider>
  );
}