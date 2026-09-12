import type { ButtonHTMLAttributes } from "react";
export function Chip({ selected = false, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return <button type="button" aria-pressed={selected} className={`chip min-h-11 border px-3 py-2 text-[11px] ${selected ? "border-miniu-text bg-miniu-text text-[#fffefa]" : "border-miniu-border bg-miniu-surface text-miniu-text"} ${className}`} {...props} />;
}
