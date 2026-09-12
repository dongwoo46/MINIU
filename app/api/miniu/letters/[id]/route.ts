import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { fail, ok } from "@/app/lib/miniu/http";
import { getLetterAttachments, markLetterRead, type LetterRow, toLetterForUser } from "@/app/lib/miniu/letters";
import { selectOne } from "@/app/lib/miniu/supabase";
import { ApiError } from "@/app/lib/miniu/validation";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: Context) {
  try {
    const { id } = await context.params;
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const letter = await selectOne<LetterRow>(
      "letters",
      `id=eq.${id}&couple_id=eq.${couple.id}&or=(sender_id.eq.${user.id},recipient_id.eq.${user.id})&deleted_at=is.null&limit=1&select=*`,
    );
    if (!letter) {
      return Response.json({ ok: false, error: { code: "NOT_FOUND", message: "문자를 찾을 수 없어요.", details: null } }, { status: 404 });
    }

    const readLetter = await markLetterRead(letter, user.id);
    const attachments = await getLetterAttachments([readLetter.id]);

    return ok({ letter: toLetterForUser(readLetter, user.id, attachments.get(readLetter.id)) });
  } catch (error) {
    return fail(error);
  }
}
