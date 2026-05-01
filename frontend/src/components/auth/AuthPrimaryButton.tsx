import { ButtonHTMLAttributes, ReactNode } from "react";

interface AuthPrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loadingLabel?: string;
  children: ReactNode;
}

export default function AuthPrimaryButton({
  loadingLabel,
  children,
  className = "",
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      {...props}
      className={`w-full h-12 bg-gradient-to-r from-[#2d6a4f] to-[#1b4332] text-white rounded-full text-[14px] font-semibold disabled:opacity-50 ${className}`}
    >
      {props.disabled && loadingLabel ? loadingLabel : children}
    </button>
  );
}

