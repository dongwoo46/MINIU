import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { type InventoryItemRow, toInventoryItem } from "@/app/lib/miniu/inventory";
import { selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const items = await selectRows<InventoryItemRow>("inventory_items", `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&select=*`);
    return ok({ items: items.map(toInventoryItem), limit: 10 });
  } catch (error) {
    return fail(error);
  }
}
