import type { SVGProps } from "react";
const paths = {
  home: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
  letter: "M3 5h18v14H3zM3 6l9 7 9-7",
  profile: "M8 3h8v8H8zM4 21v-6h16v6",
  note: "M5 3h14v16l-4-3-3 3-3-3-4 3zM8 8h8M8 12h5",
  plus: "M12 4v16M4 12h16",
  back: "M15 5 8 12l7 7",
  arrow: "M4 12h16M14 6l6 6-6 6",
  chevron: "m9 6 6 6-6 6",
  copy: "M8 8h10v12H8zM5 16H4V4h12v1",
  image: "M4 5h16v14H4zM7 15l4-4 3 3 2-2 3 3M8 9h1",
  heart: "M12 20 3 11V5h6l3 3 3-3h6v6z",
  sparkle: "M12 2v5l5 5-5 5v5M2 12h5l5-5 5 5h5M7 12l5 5 5-5",
  eye: "M2 12l5-5h10l5 5-5 5H7zM11 11h2v2h-2z",
  "eye-off": "M2 12l5-5h10l5 5-5 5H7zM11 11h2v2h-2zM4 4l16 16",
  refresh: "M4 12a8 8 0 0 1 14.5-4.5M20 12a8 8 0 0 1-14.5 4.5M18.5 3v4.5H14M5.5 21v-4.5H10",
} as const;
// Pixel-art glyphs exported from Figma (fill-based, unit-square strokes) — kept exact so they read as "pixel" icons, unlike the line-drawn set above.
const pixelIcons = {
  check: {
    viewBox: "0 0 20 20",
    d: "M8.33333 15H6.66634V13.333H8.33333V15ZM6.66634 13.333H5.00033V11.667H6.66634V13.333ZM10.0003 11.667V13.333H8.33333V11.667H10.0003ZM5.00033 11.667H3.33333V10H5.00033V11.667ZM11.6663 11.667H10.0003V10H11.6663V11.667ZM13.3333 10H11.6663V8.33301H13.3333V10ZM15.0003 8.33301H13.3333V6.66699H15.0003V8.33301ZM16.6663 6.66699H15.0003V5H16.6663V6.66699Z",
  },
  close: {
    viewBox: "0 0 24 24",
    d: "M7 19H5V17H7V19ZM19 19H17V17H19V19ZM9 15V17H7V15H9ZM17 17H15V15H17V17ZM11 15H9V13H11V15ZM15 15H13V13H15V15ZM13 13H11V11H13V13ZM11 11H9V9H11V11ZM15 11H13V9H15V11ZM9 9H7V7H9V9ZM17 9H15V7H17V9ZM7 7H5V5H7V7ZM19 7H17V5H19V7Z",
  },
} as const;
export type IconName = keyof typeof paths | keyof typeof pixelIcons;
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  if (name in pixelIcons) {
    const { viewBox, d } = pixelIcons[name as keyof typeof pixelIcons];
    return <svg width="24" height="24" viewBox={viewBox} fill="currentColor" aria-hidden="true" {...props}><path d={d} /></svg>;
  }
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter" aria-hidden="true" {...props}><path d={paths[name as keyof typeof paths]} /></svg>;
}
