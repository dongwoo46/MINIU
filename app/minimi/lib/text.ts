const BUBBLE_MAX_CHARS = 40;
const ELLIPSIS = "…";

/**
 * 말풍선 텍스트를 최대 길이(기본 40자)로 자른다.
 * 길이를 초과하면 말줄임표를 붙여 정확히 maxChars 길이로 맞춘다.
 */
export function truncateBubbleText(
  text: string,
  maxChars: number = BUBBLE_MAX_CHARS
): string {
  if (text.length <= maxChars) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxChars - ELLIPSIS.length))}${ELLIPSIS}`;
}
