import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "blue",
  className
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "red" | "gold" | "dark" | "cyan";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-[8px] px-3 py-1 text-xs font-black uppercase tracking-normal",
        tone === "blue" && "bg-blue-50 text-cobalt ring-1 ring-blue-100",
        tone === "green" && "bg-emerald-50 text-verdict ring-1 ring-emerald-100",
        tone === "red" && "bg-red-50 text-signal ring-1 ring-red-100",
        tone === "gold" && "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
        tone === "dark" && "bg-ink text-white",
        tone === "cyan" && "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100",
        className
      )}
    >
      {children}
    </span>
  );
}
