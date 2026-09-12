import { requireUser } from "@/app/lib/miniu/auth";
import { getSupabaseConnectedCouple } from "@/app/lib/miniu/couples";
import { logSupabaseEvent } from "@/app/lib/miniu/events";
import { fail, ok } from "@/app/lib/miniu/http";
import {
  getLetterAttachments,
  insertLetterAttachments,
  partnerUserId,
  readAttachmentInputs,
  type LetterRow,
  toLetterForUser,
  validateLetterContent,
} from "@/app/lib/miniu/letters";
import { createNotification } from "@/app/lib/miniu/notifications";
import { addProfileCardsFromTextSupabase } from "@/app/lib/miniu/profile-cards";
import { insertRows, selectRows } from "@/app/lib/miniu/supabase";
import { ApiError, assertObject, stringField } from "@/app/lib/miniu/validation";

export async function GET() {
  try {
    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }

    const letters = await selectRows<LetterRow>("letters", `couple_id=eq.${couple.id}&deleted_at=is.null&order=created_at.desc&select=*`);
    const attachments = await getLetterAttachments(letters.map((letter) => letter.id));

    return ok({
      letters: letters.map((letter) => toLetterForUser(letter, user.id, attachments.get(letter.id))),
      unreadCount: letters.filter((letter) => letter.recipient_id === user.id && !letter.read_at).length,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = assertObject(await request.json());
    const content = stringField(body, "content");
    validateLetterContent(content);
    const attachments = readAttachmentInputs(body);

    const user = await requireUser();
    const couple = await getSupabaseConnectedCouple(user.id);
    if (!couple) {
      throw new ApiError(403, "FORBIDDEN", "연인과 연결해 주세요.");
    }
    const recipientId = partnerUserId(couple, user.id);

    const [letter] = await insertRows<LetterRow>("letters", {
      couple_id: couple.id,
      sender_id: user.id,
      recipient_id: recipientId,
      content,
    });
    const savedAttachments = await insertLetterAttachments(letter.id, user.id, attachments);
    const cardCount = await addProfileCardsFromTextSupabase(recipientId, content, { type: "message", id: letter.id });

    await createNotification({
      userId: recipientId,
      coupleId: couple.id,
      type: "letter_received",
      title: "문자가 도착했어요.",
      body: content.length > 40 ? `${content.slice(0, 40)}...` : content,
      metadata: { letterId: letter.id },
    });
    await logSupabaseEvent({
      userId: user.id,
      coupleId: couple.id,
      name: "letter_sent",
      metadata: { attachmentCount: savedAttachments.length, cardCount },
    });

    return ok({ letter: toLetterForUser(letter, user.id, savedAttachments), failedAttachmentCount: 0, cardCount }, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
