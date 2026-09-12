import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type ItemSuggestionRow, toItemSuggestion } from "@/app/lib/miniu/inventory";
import { patchRows, selectOne } from "@/app/lib/miniu/supabase";
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

    const suggestion = await selectOne<ItemSuggestionRow>("item_suggestions", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    if (!suggestion) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "아이템 제안을 찾을 수 없어요.", details: null } }, { status: 404 });
    }
    if (suggestion.status !== "pending") {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "이미 처리한 제안이에요.", details: null } }, { status: 409 });
    }

    const [rejectedSuggestion] = await patchRows<ItemSuggestionRow>("item_suggestions", `id=eq.${id}&user_id=eq.${user.id}&status=eq.pending&deleted_at=is.null`, {
      status: "rejected",
      decided_at: new Date().toISOString(),
    });

    return ok({ suggestion: toItemSuggestion(rejectedSuggestion) });
  } catch (error) {
    return fail(error);
  }
}
