import type { InputHTMLAttributes } from "react";
export function Toggle({ label, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string }) {
  return <label className="toggle"><span>{label}</span><input type="checkbox" role="switch" {...props} /><span className="toggle-track" aria-hidden="true" /></label>;
}
