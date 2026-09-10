import type { ReactNode } from "react";
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "pink" | "green" }) {
  const tones = {
    neutral: "bg-miniu-sunken text-miniu-muted",
    pink: "bg-[#f7e3e5] text-[#904452]",
    green: "bg-[#e6ede1] text-[#497559]",
  } satisfies Record<typeof tone, string>;
  return <span className={`badge inline-block px-1.5 py-0.5 text-[10px] leading-relaxed ${tones[tone]}`}>{children}</span>;
}
