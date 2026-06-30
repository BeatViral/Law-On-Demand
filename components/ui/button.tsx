import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  icon?: ReactNode;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  icon,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[8px] font-black transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,#155dfc,#02c7ee)] text-white shadow-legal-glow hover:translate-y-[-1px] focus-visible:outline-cobalt",
        variant === "secondary" &&
          "border border-slate-200 bg-white text-ink shadow-sm hover:border-cobalt hover:text-cobalt focus-visible:outline-cobalt",
        variant === "danger" &&
          "bg-signal text-white shadow-[0_18px_40px_rgba(239,68,68,0.24)] hover:brightness-95 focus-visible:outline-signal",
        variant === "ghost" &&
          "bg-transparent text-graphite hover:bg-slate-100 focus-visible:outline-cobalt",
        variant === "dark" &&
          "bg-ink text-white shadow-panel hover:bg-slate-800 focus-visible:outline-ink",
        size === "sm" && "min-h-10 px-3 text-sm",
        size === "md" && "min-h-12 px-5 text-base",
        size === "lg" && "min-h-14 px-6 text-lg",
        size === "icon" && "h-11 w-11 p-0",
        className
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
