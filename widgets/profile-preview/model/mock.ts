import type { PreviewCategory } from "@/shared/config/design-system";
export const mockProfileCards: { id: string; text: string; category: Exclude<PreviewCategory, "전체">; symbol: string }[] = [
  { id: "guitar", text: "기타를 배우고 있음", category: "취미", symbol: "♫" },
  { id: "food", text: "매운 음식을 잘 못 먹음", category: "음식", symbol: "♨" },
  { id: "baseball", text: "요즘 야구 보는 걸 좋아함", category: "관심사", symbol: "⚾" },
];
