import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { addProfileCardsFromTextSupabase } from "@/app/lib/miniu/profile-cards";
import { type RecordRow, toRecordEntry } from "@/app/lib/miniu/records";
import { insertRows, patchRows, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, stringField, validateDate, validateRecordContent } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const records = await selectRows<RecordRow>("records", `user_id=eq.${user.id}&deleted_at=is.null&order=created_at.desc&select=*`);
    return ok({ records: records.map(toRecordEntry) });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const content = stringField(body, "content");
    const happenedOn = stringField(body, "happenedOn");
    validateRecordContent(content);
    validateDate(happenedOn, "happenedOn");

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const [createdRecord] = await insertRows<RecordRow>("records", {
      user_id: user.id,
      content,
      happened_on: happenedOn,
      analysis_status: "pending",
    });
    const cardCount = await addProfileCardsFromTextSupabase(user.id, content, { type: "record", id: createdRecord.id });
    const [record] = await patchRows<RecordRow>("records", `id=eq.${createdRecord.id}&user_id=eq.${user.id}`, {
      analysis_status: "complete",
      analysis_error: null,
    });
    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "record_created", metadata: { cardCount } });

    return ok({ record: toRecordEntry(record), cardCount }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
