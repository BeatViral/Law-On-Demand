import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-slate-200 bg-white shadow-panel",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
