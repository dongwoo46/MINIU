import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { getProfileCardSources, type ProfileCardRow, toProfileCard } from "@/app/lib/miniu/profile-cards";
import { patchRows, selectOne } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, optionalStringField, validateCategory } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const body = assertObject(await request.json());
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Couple connection is required.");
    }
    const existing = await selectOne<ProfileCardRow>("profile_cards", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&select=*`);
    if (!existing) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "Profile card was not found.", details: null } }, { status: 404 });
    }

    const values: Record<string, string | boolean> = { user_edited: true };
    const content = optionalStringField(body, "content");
    const category = optionalStringField(body, "category");
    if (content) {
      values.content = content;
    }
    if (category) {
      values.category = validateCategory(category);
    }
    const [card] = await patchRows<ProfileCardRow>("profile_cards", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null`, values);
    const sources = await getProfileCardSources(user.id, [card.id]);

    return ok({ card: toProfileCard(card, sources) });
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    if (!(await getSupabaseConnectedCouple(user.id))) {
      throw new ApiError(403, "FORBIDDEN", "Couple connection is required.");
    }
    const existing = await selectOne<ProfileCardRow>("profile_cards", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null&select=id`);
    if (!existing) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "Profile card was not found.", details: null } }, { status: 404 });
    }

    await patchRows("profile_cards", `id=eq.${id}&user_id=eq.${user.id}&deleted_at=is.null`, {
      deleted_at: new Date().toISOString(),
    });
    return ok({ deletedCardId: id });
  } catch (error) {
    return fail(error);
  }
}
