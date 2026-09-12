import type { ButtonHTMLAttributes } from "react";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; fullWidth?: boolean };
export function Button({ variant = "primary", fullWidth, className = "", type = "button", ...props }: Props) {
  const variants = {
    primary: "border-[color:var(--color-border-primary)] bg-miniu-primary shadow-[2px_2px_0_var(--color-border-primary)] hover:brightness-95 active:brightness-90",
    secondary: "border-miniu-border bg-miniu-surface shadow-miniu hover:bg-miniu-sunken",
    ghost: "border-transparent bg-transparent shadow-none hover:bg-miniu-sunken",
    danger: "border-[#a73846] bg-[#a73846] text-[#fffefa] shadow-none hover:brightness-90 active:brightness-90",
  } satisfies Record<NonNullable<Props["variant"]>, string>;
  return <button type={type} className={`button inline-flex min-h-11 items-center justify-center gap-2 border px-4 py-3 text-xs font-bold transition-[background,transform] duration-150 ease-linear active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`} {...props} />;
}
