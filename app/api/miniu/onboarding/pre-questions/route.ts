import { requireUser } from "@/app/lib/miniu/auth";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { splitFacts } from "@/app/lib/miniu/facts";
import { fail, ok } from "@/app/lib/miniu/http";
import { insertRows, patchRows, selectOne, selectRows } from "@/app/lib/miniu/supabase";
import type { PreQuestions, ProfileCategory } from "@/app/lib/miniu/types";
import { assertObject, stringArrayField, stringField, validateDate } from "@/app/lib/miniu/validation";

type PreQuestionSetRow = {
  id: string;
  user_id: string;
  relationship_started_on: string;
  created_at: string;
};

type PreQuestionAnswerRow = {
  id: string;
  set_id: string;
  user_id: string;
  category: ProfileCategory;
  content: string;
  created_at: string;
};

type ProfileCardRow = {
  id: string;
  user_id: string;
  category: ProfileCategory;
  content: string;
};

type ProfileCardSourceRow = {
  id: string;
  card_id: string;
  user_id: string;
  source_type: "pre_question" | "record" | "letter";
  source_id: string;
};

const categories = ["likes", "dislikes", "tendencies", "habits", "values"] as const;

function toPreQuestions(set: PreQuestionSetRow, answers: PreQuestionAnswerRow[]): PreQuestions {
  return {
    id: set.id,
    userId: set.user_id,
    relationshipStartedOn: set.relationship_started_on,
    likes: answers.filter((answer) => answer.category === "likes").map((answer) => answer.content),
    dislikes: answers.filter((answer) => answer.category === "dislikes").map((answer) => answer.content),
    tendencies: answers.filter((answer) => answer.category === "tendencies").map((answer) => answer.content),
    habits: answers.filter((answer) => answer.category === "habits").map((answer) => answer.content),
    values: answers.filter((answer) => answer.category === "values").map((answer) => answer.content),
    createdAt: set.created_at,
  };
}

async function softDeletePreviousPreQuestions(userId: string): Promise<void> {
  const now = new Date().toISOString();
  await patchRows("pre_question_answers", `user_id=eq.${userId}&deleted_at=is.null`, { deleted_at: now });
  await patchRows("pre_question_sets", `user_id=eq.${userId}&deleted_at=is.null`, { deleted_at: now });

  const sources = await selectRows<ProfileCardSourceRow>(
    "profile_card_sources",
    `user_id=eq.${userId}&source_type=eq.pre_question&select=*`,
  );
  const cardIds = [...new Set(sources.map((source) => source.card_id))];
  await Promise.all(cardIds.map((cardId) => patchRows("profile_cards", `id=eq.${cardId}&user_id=eq.${userId}&deleted_at=is.null`, { deleted_at: now })));
}

async function addCardsFromAnswers(userId: string, setId: string, answers: Record<ProfileCategory, string[]>): Promise<number> {
  let cardCount = 0;
  const insertedSources = new Set<string>();

  for (const category of categories) {
    for (const answer of answers[category]) {
      for (const fact of splitFacts(answer)) {
        const sameCategoryCards = await selectRows<ProfileCardRow>(
          "profile_cards",
          `user_id=eq.${userId}&category=eq.${category}&deleted_at=is.null&select=id,user_id,category,content`,
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
        const sourceKey = `${cardId}:pre_question:${setId}`;
        if (insertedSources.has(sourceKey)) {
          continue;
        }

        await insertRows("profile_card_sources", {
          card_id: cardId,
          user_id: userId,
          source_type: "pre_question",
          source_id: setId,
        });
        insertedSources.add(sourceKey);
        if (!existingCard) {
          cardCount += 1;
        }
      }
    }
  }

  return cardCount;
}

export async function GET() {
  try {
    const user = await requireUser();
    const set = await selectOne<PreQuestionSetRow>(
      "pre_question_sets",
      `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&limit=1&select=*`,
    );
    if (!set) {
      return ok({ preQuestions: null });
    }

    const answers = await selectRows<PreQuestionAnswerRow>(
      "pre_question_answers",
      `set_id=eq.${set.id}&user_id=eq.${user.id}&deleted_at=is.null&order=created_at.asc&select=*`,
    );
    return ok({ preQuestions: toPreQuestions(set, answers) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const relationshipStartedOn = stringField(body, "relationshipStartedOn");
    validateDate(relationshipStartedOn, "relationshipStartedOn");

    const answers: Record<ProfileCategory, string[]> = {
      likes: stringArrayField(body, "likes"),
      dislikes: stringArrayField(body, "dislikes"),
      tendencies: stringArrayField(body, "tendencies"),
      habits: stringArrayField(body, "habits"),
      values: stringArrayField(body, "values"),
    };

    const user = await requireUser();
    await softDeletePreviousPreQuestions(user.id);
    const [set] = await insertRows<PreQuestionSetRow>("pre_question_sets", {
      user_id: user.id,
      relationship_started_on: relationshipStartedOn,
    });
    await insertRows(
      "pre_question_answers",
      categories.flatMap((category) =>
        answers[category].map((content) => ({
          set_id: set.id,
          user_id: user.id,
          category,
          content,
        })),
      ),
    );
    await patchRows("profiles", `id=eq.${user.id}`, {
      onboarding_step: "home",
    });

    const cardCount = await addCardsFromAnswers(user.id, set.id, answers);
    await logSupabaseEvent({ userId: user.id, name: "pre_questions_completed", metadata: { cardCount } });
    const savedAnswers = await selectRows<PreQuestionAnswerRow>(
      "pre_question_answers",
      `set_id=eq.${set.id}&user_id=eq.${user.id}&deleted_at=is.null&order=created_at.asc&select=*`,
    );

    return ok({ preQuestions: toPreQuestions(set, savedAnswers), cardCount });
  } catch (error) {
    return fail(error);
  }
}
