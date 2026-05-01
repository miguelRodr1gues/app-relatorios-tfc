import { ReactNode, InputHTMLAttributes } from "react";

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: ReactNode;
}

export default function AuthInput({ icon, className = "", ...props }: AuthInputProps) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]">
        {icon}
      </div>
      <input
        {...props}
        className={`w-full h-12 pl-12 pr-4 rounded-2xl bg-[#f9fafb] dark:bg-[#1a1a1a] border border-[#e5e7eb] dark:border-[#3a3a3a] text-[14px] text-[#1f2937] dark:text-white placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#2d6a4f]/20 ${className}`}
      />
    </div>
  );
}

