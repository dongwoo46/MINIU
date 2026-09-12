import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { decideMergeCandidate } from "@/app/lib/miniu/profile-merge-candidates";
import {
  getProfileCardSources,
  type ProfileCardRow,
  type ProfileCardSourceRow,
  toProfileCard,
} from "@/app/lib/miniu/profile-cards";
import { insertRows, patchRows, selectOne } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, stringField } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = assertObject(await request.json());
    const targetCardId = stringField(body, "targetCardId");

    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const source = await selectOne<ProfileCardRow>("profile_cards", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&select=*`);
    const target = await selectOne<ProfileCardRow>("profile_cards", `id=eq.${targetCardId}&user_id=eq.${user.id}&deleted_at=is.null&select=*`);
    if (!source || !target || source.category !== target.category) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "병합할 카드를 찾을 수 없어요.", details: null } }, { status: 404 });
    }

    const sourceSources = await getProfileCardSources(user.id, [source.id]);
    const targetSources = await getProfileCardSources(user.id, [target.id]);
    const targetSourceKeys = new Set(targetSources.map((sourceRow) => `${sourceRow.source_type}:${sourceRow.source_id}`));
    const missingSources = sourceSources.filter((sourceRow) => !targetSourceKeys.has(`${sourceRow.source_type}:${sourceRow.source_id}`));
    if (missingSources.length > 0) {
      await insertRows<ProfileCardSourceRow>(
        "profile_card_sources",
        missingSources.map((sourceRow) => ({
          card_id: target.id,
          user_id: user.id,
          source_type: sourceRow.source_type,
          source_id: sourceRow.source_id,
        })),
      );
    }

    const [updatedTarget] = await patchRows<ProfileCardRow>("profile_cards", `id=eq.${target.id}&user_id=eq.${user.id}&deleted_at=is.null`, {
      updated_at: new Date().toISOString(),
    });
    await patchRows("profile_cards", `id=eq.${source.id}&user_id=eq.${user.id}&deleted_at=is.null`, {
      deleted_at: new Date().toISOString(),
    });
    const pendingCandidates = await selectOne<{ id: string }>(
      "profile_merge_candidates",
      `user_id=eq.${user.id}&source_card_id=eq.${source.id}&target_card_id=eq.${target.id}&status=eq.pending&select=id`,
    );
    if (pendingCandidates) {
      await decideMergeCandidate(user.id, pendingCandidates.id, "accepted");
    }
    const sources = await getProfileCardSources(user.id, [updatedTarget.id]);

    return ok({ card: toProfileCard(updatedTarget, sources) });
  } catch (error) {
    return fail(error);
  }
}
