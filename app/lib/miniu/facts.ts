import type { MiniuDb, ProfileCategory, ProfileSource } from "./types";
import { createId } from "./crypto";

const categoryKeywords: Record<ProfileCategory, string[]> = {
  likes: ["좋아", "선호", "즐겨", "취향", "like", "favorite"],
  dislikes: ["싫어", "불호", "안 좋아", "못 먹", "꺼려", "dislike"],
  values: ["중요", "가치", "생각", "원칙", "믿", "소중"],
  habits: ["자주", "매일", "습관", "항상", "보통", "먼저"],
  tendencies: ["성향", "편", "타입", "내향", "외향", "차분", "활발"],
};

export function splitFacts(text: string): string[] {
  return text
    .split(/[\n,.;。！？!?]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function classifyFact(text: string, fallback?: ProfileCategory): ProfileCategory | null {
  const normalized = text.toLowerCase();
  const match = Object.entries(categoryKeywords).find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)));
  return (match?.[0] as ProfileCategory | undefined) ?? fallback ?? null;
}

export function addProfileCardsFromText(
  db: MiniuDb,
  userId: string,
  text: string,
  source: ProfileSource,
  fallbackCategory?: ProfileCategory,
): number {
  const now = new Date().toISOString();
  let created = 0;

  for (const fact of splitFacts(text)) {
    const category = classifyFact(fact, fallbackCategory);
    if (!category) {
      continue;
    }

    const normalizedFact = fact.toLowerCase();
    const sameCategoryCards = db.profileCards.filter((card) => card.userId === userId && card.category === category);
    const exactCard = sameCategoryCards.find((card) => card.content.toLowerCase() === normalizedFact);
    if (exactCard) {
      exactCard.sources.push(source);
      exactCard.updatedAt = now;
      continue;
    }

    const mergeCandidate = sameCategoryCards.find((card) => {
      const normalizedCard = card.content.toLowerCase();
      return normalizedCard.includes(normalizedFact) || normalizedFact.includes(normalizedCard);
    });

    db.profileCards.push({
      id: createId("card"),
      userId,
      category,
      content: fact,
      sources: [source],
      mergeCandidateOf: mergeCandidate?.id ?? null,
      userEdited: false,
      createdAt: now,
      updatedAt: now,
    });
    created += 1;
  }

  return created;
}

export function logEvent(
  db: MiniuDb,
  input: { userId: string | null; coupleId?: string | null; name: string; metadata?: Record<string, unknown> },
): void {
  db.events.push({
    id: createId("evt"),
    userId: input.userId,
    coupleId: input.coupleId ?? null,
    name: input.name,
    metadata: input.metadata ?? {},
    createdAt: new Date().toISOString(),
  });
}

export function getKstDate(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getNextKstMidnight(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return new Date(Date.UTC(year, month - 1, day + 1, -9, 0, 0)).toISOString();
}
