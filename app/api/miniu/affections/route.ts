import { requireUser } from "@/app/lib/miniu/auth";
import { type AffectionActivityRow, affectionTitle, assertAffectionType, partnerUserId, toAffectionActivity } from "@/app/lib/miniu/affections";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { createNotification } from "@/app/lib/miniu/notifications";
import { insertRows, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, stringField } from "@/app/lib/miniu/validation";

const notificationGroupMs = 1000 * 60 * 5;

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const activities = await selectRows<AffectionActivityRow>(
      "affection_activities",
      `couple_id=eq.${couple.id}&deleted_at=is.null&order=created_at.desc&limit=50&select=*`,
    );

    return ok({ activities: activities.map((activity) => toAffectionActivity(activity, user.id)) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const affectionType = assertAffectionType(stringField(body, "affectionType"));

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const recipientId = partnerUserId(couple, user.id);
    const grouped = await hasRecentSameAffection(couple.id, user.id, recipientId, affectionType);

    const [activity] = await insertRows<AffectionActivityRow>("affection_activities", {
      couple_id: couple.id,
      sender_id: user.id,
      recipient_id: recipientId,
      affection_type: affectionType,
    });

    if (!grouped) {
      await createNotification({
        userId: recipientId,
        coupleId: couple.id,
        type: "affection_received",
        title: affectionTitle(affectionType),
        body: "연인이 애정표현을 남겼어요.",
        metadata: { affectionActivityId: activity.id, affectionType },
      });
    }
    await logSupabaseEvent({
      userId: user.id,
      coupleId: couple.id,
      name: "affection_sent",
      metadata: { affectionType, notificationGrouped: grouped },
    });

    return ok({ activity: toAffectionActivity(activity, user.id), notificationGrouped: grouped }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

async function hasRecentSameAffection(coupleId: string, senderId: string, recipientId: string, affectionType: string): Promise<boolean> {
  const since = new Date(Date.now() - notificationGroupMs).toISOString();
  const rows = await selectRows<{ id: string }>(
    "affection_activities",
    `couple_id=eq.${coupleId}&sender_id=eq.${senderId}&recipient_id=eq.${recipientId}&affection_type=eq.${affectionType}&created_at=gte.${since}&deleted_at=is.null&limit=1&select=id`,
  );
  return rows.length > 0;
}
