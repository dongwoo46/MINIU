import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import { type MiniuRow, toMiniu } from "@/app/lib/miniu/minius";
import { insertRows, patchRows, selectOne } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, optionalStringField, stringField } from "@/app/lib/miniu/validation";

const miniuDefaults = {
  preset: "basic",
  hairStyle: "short",
  hairColor: "brown",
  skinTone: "warm",
  faceShape: "round",
  expression: "smile",
};

export async function GET() {
  try {
    const user = await requireUser();
    const miniu = await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    return ok({ miniu: miniu ? toMiniu(miniu) : null });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const name = stringField(body, "name");

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    if (await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=id`)) {
      return Response.json({ ok: false, error: { code: "CONFLICT", message: "이미 미니유가 있어요.", details: null } }, { status: 409 });
    }

    const [miniu] = await insertRows<MiniuRow>("minius", {
      user_id: user.id,
      name,
      preset: optionalStringField(body, "preset") || miniuDefaults.preset,
      hair_style: optionalStringField(body, "hairStyle") || miniuDefaults.hairStyle,
      hair_color: optionalStringField(body, "hairColor") || miniuDefaults.hairColor,
      skin_tone: optionalStringField(body, "skinTone") || miniuDefaults.skinTone,
      face_shape: optionalStringField(body, "faceShape") || miniuDefaults.faceShape,
      expression: optionalStringField(body, "expression") || miniuDefaults.expression,
    });
    await logSupabaseEvent({ userId: user.id, coupleId: couple.id, name: "miniu_created" });
    return ok({ miniu: toMiniu(miniu) });
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = assertObject(await request.json());
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const existing = await selectOne<MiniuRow>("minius", `user_id=eq.${user.id}&deleted_at=is.null&limit=1&select=*`);
    if (!existing) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "미니유를 찾을 수 없어요.", details: null } }, { status: 404 });
    }

    const values: Record<string, string> = {};
    const fields = {
      name: "name",
      preset: "preset",
      hairStyle: "hair_style",
      hairColor: "hair_color",
      skinTone: "skin_tone",
      faceShape: "face_shape",
      expression: "expression",
    } as const;
    for (const [inputField, column] of Object.entries(fields)) {
      const value = optionalStringField(body, inputField);
      if (value) {
        values[column] = value;
      }
    }
    if (Object.keys(values).length === 0) {
      return ok({ miniu: toMiniu(existing) });
    }

    const [miniu] = await patchRows<MiniuRow>("minius", `id=eq.${existing.id}&user_id=eq.${user.id}&deleted_at=is.null`, values);
    return ok({ miniu: toMiniu(miniu) });
  } catch (error) {
    return fail(error);
  }
}
