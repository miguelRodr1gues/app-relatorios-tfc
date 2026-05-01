import { ButtonHTMLAttributes, ReactNode } from "react";

interface AuthSocialButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  children: ReactNode;
}

export default function AuthSocialButton({ icon, children, className = "", ...props }: AuthSocialButtonProps) {
  return (
    <button
      {...props}
      className={`w-full h-12 rounded-full border-[2px] border-[#e5e7eb] dark:border-[#3a3a3a] bg-white dark:bg-[#1a1a1a] text-[#1f2937] dark:text-white text-[14px] font-semibold hover:border-[#2d6a4f] hover:bg-[#f9fafb] dark:hover:bg-[#2a2a2a] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
      {children}
    </button>
  );
}

