import { classifyFact, splitFacts } from "./facts";
import { insertRows, selectRows } from "./supabase";
import type { ProfileCard, ProfileCategory, ProfileSource, ProfileSourceType } from "./types";

export type ProfileCardRow = {
  id: string;
  user_id: string;
  category: ProfileCategory;
  content: string;
  user_edited: boolean;
  created_at: string;
  updated_at: string;
};

export type ProfileCardSourceRow = {
  id: string;
  card_id: string;
  user_id: string;
  source_type: "pre_question" | "record" | "letter";
  source_id: string;
  created_at: string;
};

const dbToAppSourceType: Record<ProfileCardSourceRow["source_type"], ProfileSourceType> = {
  pre_question: "preQuestion",
  record: "record",
  letter: "message",
};

const appToDbSourceType: Record<ProfileSourceType, ProfileCardSourceRow["source_type"]> = {
  preQuestion: "pre_question",
  record: "record",
  message: "letter",
};

export function toProfileCard(row: ProfileCardRow, sources: ProfileCardSourceRow[] = []): ProfileCard {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    content: row.content,
    sources: sources.map((source) => ({
      type: dbToAppSourceType[source.source_type],
      id: source.source_id,
    })),
    mergeCandidateOf: null,
    userEdited: row.user_edited,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function addProfileCardsFromTextSupabase(
  userId: string,
  text: string,
  source: ProfileSource,
  fallbackCategory?: ProfileCategory,
): Promise<number> {
  let cardCount = 0;
  const sourceType = appToDbSourceType[source.type];
  const insertedSources = new Set<string>();

  for (const fact of splitFacts(text)) {
    const category = classifyFact(fact, fallbackCategory);
    if (!category) {
      continue;
    }

    const sameCategoryCards = await selectRows<ProfileCardRow>(
      "profile_cards",
      `user_id=eq.${userId}&category=eq.${category}&deleted_at=is.null&select=*`,
    );
    const existingCard = sameCategoryCards.find((card) => card.content.toLowerCase() === fact.toLowerCase());
    const cardId =
      existingCard?.id ??
      (
        await insertRows<ProfileCardRow>("profile_cards", {
          user_id: userId,
          category,
          content: fact,
        })
      )[0].id;

    const sourceKey = `${cardId}:${sourceType}:${source.id}`;
    if (insertedSources.has(sourceKey)) {
      continue;
    }

    const existingSource = await selectRows<ProfileCardSourceRow>(
      "profile_card_sources",
      `card_id=eq.${cardId}&source_type=eq.${sourceType}&source_id=eq.${source.id}&select=id`,
    );
    if (existingSource.length === 0) {
      await insertRows("profile_card_sources", {
        card_id: cardId,
        user_id: userId,
        source_type: sourceType,
        source_id: source.id,
      });
    }
    insertedSources.add(sourceKey);
    if (!existingCard) {
      cardCount += 1;
    }
  }

  return cardCount;
}

export async function getProfileCardSources(userId: string, cardIds: string[]): Promise<ProfileCardSourceRow[]> {
  if (cardIds.length === 0) {
    return [];
  }
  return selectRows<ProfileCardSourceRow>("profile_card_sources", `user_id=eq.${userId}&card_id=in.(${cardIds.join(",")})&select=*`);
}
