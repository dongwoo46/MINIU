import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { getProfileCardSources, type ProfileCardRow, toProfileCard } from "@/app/lib/miniu/profile-cards";
import { selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const cards = await selectRows<ProfileCardRow>("profile_cards", `user_id=eq.${user.id}&deleted_at=is.null&order=updated_at.desc&select=*`);
    const sources = await getProfileCardSources(user.id, cards.map((card) => card.id));

    return ok({
      cards: cards.map((card) => toProfileCard(card, sources.filter((source) => source.card_id === card.id))),
    });
  } catch (error) {
    return fail(error);
  }
}
