"use client";
import { useId, type InputHTMLAttributes } from "react";
export function TextField({ label, hint, error, id, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  return <div className={`text-field flex min-w-0 flex-col gap-2 ${className}`}><label htmlFor={fieldId} className="text-xs font-bold">{label}</label><input id={fieldId} className="min-h-12 w-full min-w-0 border border-miniu-border bg-miniu-surface px-3 py-3 text-base placeholder:text-xs placeholder:text-miniu-muted aria-invalid:border-[#a73846]" aria-invalid={Boolean(error)} aria-describedby={error || hint ? `${fieldId}-help` : undefined} {...props} />{(error || hint) && <small id={`${fieldId}-help`} className={`text-[11px] ${error ? "text-[#a73846]" : "text-miniu-muted"}`}>{error || hint}</small>}</div>;
}
