import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ReportWizard from "./ReportWizard";
import { WizardProvider } from "../context/WizardContext";
import { useWizard } from "../context/useWizard";
import { SearchProvider } from "../context/SearchContext";
import { ThemeProvider } from "../context/ThemeContext";
import { useAuth } from "../context/useAuth";

function LayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { isOpen, openWizard, closeWizard } = useWizard();
  const { logout } = useAuth();

  const pathMap: Record<string, string> = {
    "/dashboard": "dashboard",
    "/relatorios": "relatorios",
    "/estrutura": "estrutura",
    "/settings": "settings",
  };
  const activeNav = pathMap[location.pathname] || "dashboard";

  const handleNavChange = async (nav: string) => {
    if (nav === "logout") {
      await logout();
      navigate("/login");
      return;
    }

    if (nav === "novo-relatorio") {
      openWizard();
      return;
    }

    const navMap: Record<string, string> = {
      dashboard: "/dashboard",
      relatorios: "/relatorios",
      estrutura: "/estrutura",
      settings: "/settings",
    };

    if (navMap[nav]) navigate(navMap[nav]);
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
