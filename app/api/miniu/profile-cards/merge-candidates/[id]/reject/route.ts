import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { decideMergeCandidate, toProfileMergeCandidate } from "@/app/lib/miniu/profile-merge-candidates";
import { type ProfileCardRow } from "@/app/lib/miniu/profile-cards";
import { selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const [candidate] = await decideMergeCandidate(user.id, id, "rejected");
    if (!candidate) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "병합 후보를 찾을 수 없어요.", details: null } }, { status: 404 });
    }
    const cards = await selectRows<ProfileCardRow>(
      "profile_cards",
      `user_id=eq.${user.id}&id=in.(${candidate.source_card_id},${candidate.target_card_id})&select=*`,
    );

    return ok({ candidate: toProfileMergeCandidate(candidate, cards) });
  } catch (error) {
    return fail(error);
  }
}
