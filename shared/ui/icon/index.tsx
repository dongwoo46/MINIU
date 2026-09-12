import type { SVGProps } from "react";
const paths = {
  home: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
  letter: "M3 5h18v14H3zM3 6l9 7 9-7",
  profile: "M8 3h8v8H8zM4 21v-6h16v6",
  plus: "M12 4v16M4 12h16",
  back: "M15 5 8 12l7 7",
  arrow: "M4 12h16M14 6l6 6-6 6",
  chevron: "m9 6 6 6-6 6",
  copy: "M8 8h10v12H8zM5 16H4V4h12v1",
  image: "M4 5h16v14H4zM7 15l4-4 3 3 2-2 3 3M8 9h1",
  heart: "M12 20 3 11V5h6l3 3 3-3h6v6z",
  close: "m5 5 14 14M19 5 5 19",
  sparkle: "M12 2v5l5 5-5 5v5M2 12h5l5-5 5 5h5M7 12l5 5 5-5",
} as const;
export type IconName = keyof typeof paths;
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter" aria-hidden="true" {...props}><path d={paths[name]} /></svg>;
}
