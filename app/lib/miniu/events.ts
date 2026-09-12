import { insertRows } from "./supabase";

export async function logSupabaseEvent(input: {
  userId: string | null;
  coupleId?: string | null;
  name: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await insertRows("event_logs", {
    user_id: input.userId,
    couple_id: input.coupleId ?? null,
    event_name: input.name,
    metadata: input.metadata ?? {},
  });
}
