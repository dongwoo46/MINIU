import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { type ProfileCardRow } from "@/app/lib/miniu/profile-cards";
import { selectRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, optionalStringField } from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const customPhrase = optionalStringField(body, "customPhrase");

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    if (customPhrase && customPhrase.length > 40) {
      throw new ApiError(400, "VALIDATION_ERROR", "대표 문구는 40자 이하로 적어 주세요.", { customPhrase: "max_40" });
    }

    const cards = await selectRows<ProfileCardRow>("profile_cards", `user_id=eq.${user.id}&deleted_at=is.null&order=updated_at.desc&limit=10&select=*`);
    const suggestions = customPhrase ? [] : buildPhraseSuggestions(cards.map((card) => card.content));

    await logSupabaseEvent({
      userId: user.id,
      coupleId: couple.id,
      name: "share_phrases_requested",
      metadata: { suggestionCount: suggestions.length, hasCustomPhrase: Boolean(customPhrase) },
    });

    return ok({
      phrases: {
        suggestions,
        customPhrase: customPhrase || null,
        canUseCustomPhrase: true,
      },
    });
  } catch (error) {
    return fail(error);
  }
}

function buildPhraseSuggestions(contents: string[]): string[] {
  return contents
    .map((content) => content.replace(/[.!?。！？]+$/g, "").trim())
    .filter((content) => content.length > 0 && content.length <= 24)
    .slice(0, 3)
    .map((content) => `${content} 좋아하는 우리`);
}
