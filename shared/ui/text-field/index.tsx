"use client";
import { useId, type InputHTMLAttributes } from "react";
export function TextField({ label, description, hint, error, id, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string; hint?: string; error?: string }) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const descriptionId = description ? `${fieldId}-description` : undefined;
  const helpId = error || hint ? `${fieldId}-help` : undefined;
  const describedBy = [descriptionId, helpId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={`text-field flex min-w-0 flex-col gap-2 ${className}`}>
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-xs font-bold">{label}</label>
        {description && (
          <p id={descriptionId} className="m-0 text-caption-s" style={{ color: "var(--color-text-quaternary)" }}>
            {description}
          </p>
        )}
      </div>
      <input id={fieldId} className="min-h-12 w-full min-w-0 border border-miniu-border bg-miniu-surface px-3 py-3 text-base placeholder:text-xs placeholder:text-miniu-muted aria-invalid:border-[#a73846]" aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {(error || hint) && <small id={helpId} className={`text-[11px] ${error ? "text-[#a73846]" : "text-miniu-muted"}`}>{error || hint}</small>}
    </div>
  );
}
