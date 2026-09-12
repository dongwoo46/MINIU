import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type InventoryItemRow, toInventoryItem } from "@/app/lib/miniu/inventory";
import { patchRows, selectOne } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, booleanField } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = assertObject(await request.json());
    const equipped = booleanField(body, "equipped");

    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const item = await selectOne<InventoryItemRow>("inventory_items", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    if (!item) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "아이템을 찾을 수 없어요.", details: null } }, { status: 404 });
    }

    const [updatedItem] = await patchRows<InventoryItemRow>("inventory_items", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null`, { equipped });
    return ok({ item: toInventoryItem(updatedItem) });
  } catch (error) {
    return fail(error);
  }
}
