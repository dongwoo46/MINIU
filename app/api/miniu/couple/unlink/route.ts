import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { deletionWindow, unlinkCoupleForDeletion } from "@/app/lib/miniu/deletion";
import { fail, ok } from "@/app/lib/miniu/http";
import { ApiError, assertObject, booleanField } from "@/app/lib/miniu/validation";

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const confirmed = booleanField(body, "confirmed");
    if (!confirmed) {
      return Response.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "해제 확인이 필요해요.", details: { confirmed: "required" } } },
        { status: 400 },
      );
    }

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const { deletedAt, purgeAfter } = deletionWindow();
    await unlinkCoupleForDeletion({
      couple,
      requestedByUserId: user.id,
      deletedAt,
      purgeAfter,
      eventName: "couple_unlink_requested",
    });

    return ok({ coupleId: couple.id, purgeAfter });
  } catch (error) {
    return fail(error);
  }
}
