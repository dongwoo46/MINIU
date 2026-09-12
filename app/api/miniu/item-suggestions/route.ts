import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { buildItemCandidates, type ItemSuggestionRow, toItemSuggestion } from "@/app/lib/miniu/inventory";
import { type ProfileCardRow } from "@/app/lib/miniu/profile-cards";
import { insertRows, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const existingSuggestions = await selectRows<ItemSuggestionRow>(
      "item_suggestions",
      `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&select=*`,
    );
    const activeKeywords = new Set(existingSuggestions.filter((suggestion) => suggestion.status !== "rejected").map((suggestion) => suggestion.keyword));
    const cards = await selectRows<ProfileCardRow>("profile_cards", `user_id=eq.${user.id}&deleted_at=is.null&select=content`);

    if (cards.length >= 10) {
      const candidates = buildItemCandidates(cards.map((card) => card.content)).filter((candidate) => !activeKeywords.has(candidate.keyword));
      if (candidates.length > 0) {
        const created = await insertRows<ItemSuggestionRow>(
          "item_suggestions",
          candidates.map((candidate) => ({
            user_id: user.id,
            keyword: candidate.keyword,
            item_name: candidate.itemName,
          })),
        );
        existingSuggestions.unshift(...created);
      }
    }

    return ok({ suggestions: existingSuggestions.map(toItemSuggestion) });
  } catch (error) {
    return fail(error);
  }
}
