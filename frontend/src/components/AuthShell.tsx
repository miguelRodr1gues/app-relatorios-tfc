import { ReactNode } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import logo from "../assets/logo.png";

interface AuthShellProps {
  title?: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#1a1a1a] flex items-center justify-center px-4 transition-colors duration-300">
      <button
        onClick={toggleTheme}
        className="fixed top-6 right-6 w-12 h-12 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] flex items-center justify-center text-[#6b7280] dark:text-[#9ca3af] hover:text-[#2d6a4f] dark:hover:text-[#2d6a4f] transition-all hover:shadow-lg"
      >
        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="w-full max-w-[440px]">
        <div className="flex flex-col items-center mb-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white dark:bg-[#2a2a2a] border border-[#e5e7eb] dark:border-[#3a3a3a] shadow-lg">
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          </div>

          <p className="mt-4 text-[14px] text-center text-[#6b7280] dark:text-[#9ca3af]">
            {subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] rounded-xl border border-[#e5e7eb] dark:border-[#3a3a3a] p-8 shadow-lg">
          {title ? (
            <h1 className="text-[20px] font-semibold text-[#1f2937] dark:text-white text-center mb-6">
              {title}
            </h1>
          ) : null}
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

