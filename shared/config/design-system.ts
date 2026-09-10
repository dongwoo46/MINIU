/** Preview registry. CSS is the source of truth for provisional visual tokens. */
export const designSystem = {
  status: "provisional",
  theme: "light",
  viewport: { min: 320, reference: 390, max: 460, referenceHeight: 844 },
  spacing: [4, 8, 12, 16, 24, 32, 48],
  colors: ["bg-base", "bg-sunken", "surface", "border", "text", "text-muted", "text-inverse", "primary", "primary-hover", "primary-active", "accent", "heart", "success", "warning", "danger", "info"],
  assets: { fonts: "/fonts/", icons: "/icons/", minimi: "/minimi/" },
  rules: { data: "mock-only", radius: "small", pixelScale: 2 },
} as const;
export const previewTabs = [
  { id: "home", label: "홈", icon: "home" },
  { id: "letter", label: "문자", icon: "letter" },
  { id: "profile", label: "프로필", icon: "profile" },
] as const;
export type PreviewTab = (typeof previewTabs)[number]["id"];
export const setupScreens = [
  { id: "create", label: "생성" },
  { id: "connect", label: "연결" },
  { id: "invite", label: "초대" },
  { id: "house", label: "집" },
] as const;
export type SetupScreen = (typeof setupScreens)[number]["id"];
// Handoff display filters only; not the product/API taxonomy.
export const previewCategories = ["전체", "음식", "취미", "취향", "관심사"] as const;
export type PreviewCategory = (typeof previewCategories)[number];
