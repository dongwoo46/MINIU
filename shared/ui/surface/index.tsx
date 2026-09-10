import type { HTMLAttributes } from "react";
export function Surface({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`surface border border-miniu-border bg-miniu-surface ${className}`} {...props} />;
}
