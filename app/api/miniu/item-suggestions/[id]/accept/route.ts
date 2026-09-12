import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { assetKeyForKeyword, type InventoryItemRow, type ItemSuggestionRow, toInventoryItem, toItemSuggestion } from "@/app/lib/miniu/inventory";
import { insertRows, patchRows, selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const suggestion = await selectOne<ItemSuggestionRow>("item_suggestions", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    if (!suggestion) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "아이템 제안을 찾을 수 없어요.", details: null } }, { status: 404 });
    }
    if (suggestion.status !== "pending") {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "이미 처리한 제안이에요.", details: null } }, { status: 409 });
    }

    const currentItems = await selectRows<InventoryItemRow>("inventory_items", `user_id=eq.${user.id}&deleted_at=is.null&select=id`);
    if (currentItems.length >= 10) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "아이템은 최대 10개까지 보유할 수 있어요.", details: null } }, { status: 409 });
    }

    const now = new Date().toISOString();
    const [acceptedSuggestion] = await patchRows<ItemSuggestionRow>("item_suggestions", `id=eq.${id}&user_id=eq.${user.id}&status=eq.pending&deleted_at=is.null`, {
      status: "accepted",
      decided_at: now,
    });
    const [item] = await insertRows<InventoryItemRow>("inventory_items", {
      user_id: user.id,
      suggestion_id: acceptedSuggestion.id,
      item_name: acceptedSuggestion.item_name,
      asset_key: assetKeyForKeyword(acceptedSuggestion.keyword),
    });
    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "item_suggestion_accepted", metadata: { suggestionId: id } });

    return ok({ suggestion: toItemSuggestion(acceptedSuggestion), item: toInventoryItem(item) }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
