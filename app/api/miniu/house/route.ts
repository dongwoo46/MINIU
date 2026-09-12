import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { type InventoryItemRow, toInventoryItem } from "@/app/lib/miniu/inventory";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { selectOne, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const partnerId = couple.userIds.find((id) => id !== user.id);
    if (!partnerId) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const [myMiniu, partnerMiniu, myEquippedItems, partnerEquippedItems] = await Promise.all([
      selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`),
      selectOne<MiniuRow>("minius", `user_id=eq.${partnerId}&deleted_at=is.null&limit=1&select=*`),
      selectRows<InventoryItemRow>("inventory_items", `user_id=eq.${user.id}&equipped=eq.true&deleted_at=is.null&order=created_at.desc&select=*`),
      selectRows<InventoryItemRow>("inventory_items", `user_id=eq.${partnerId}&equipped=eq.true&deleted_at=is.null&order=created_at.desc&select=*`),
    ]);

    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "house_visited" });

    return ok({
      coupleId: couple.id,
      backgroundKey: "default-room",
      me: {
        userId: user.id,
        miniu: myMiniu ? toMiniu(myMiniu) : null,
        equippedItems: myEquippedItems.map(toInventoryItem),
      },
      partner: {
        userId: partnerId,
        miniu: partnerMiniu ? toMiniu(partnerMiniu) : null,
        equippedItems: partnerEquippedItems.map(toInventoryItem),
      },
      locks: {
        canVisit: true,
        canCustomizeMiniu: Boolean(myMiniu),
        canUseInventory: true,
        needsMiniu: !myMiniu,
      },
    });
  } catch (error) {
    return fail(error);
  }
}
