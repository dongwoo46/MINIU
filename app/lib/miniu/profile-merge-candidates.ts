import { insertRows, patchRows, selectRows } from "./supabase";
import type { ProfileCardRow } from "./profile-cards";

export type ProfileMergeCandidateRow = {
  id: string;
  user_id: string;
  source_card_id: string;
  target_card_id: string;
  status: "pending" | "accepted" | "rejected";
  reason: string | null;
  created_at: string;
  decided_at: string | null;
};

export function toProfileMergeCandidate(row: ProfileMergeCandidateRow, cards: ProfileCardRow[]) {
  return {
    id: row.id,
    userId: row.user_id,
    sourceCardId: row.source_card_id,
    targetCardId: row.target_card_id,
    status: row.status,
    reason: row.reason,
    sourceCard: cards.find((card) => card.id === row.source_card_id) ?? null,
    targetCard: cards.find((card) => card.id === row.target_card_id) ?? null,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
  };
}

export async function ensureMergeCandidates(userId: string, cards: ProfileCardRow[]): Promise<ProfileMergeCandidateRow[]> {
  const existing = await selectRows<ProfileMergeCandidateRow>("profile_merge_candidates", `user_id=eq.${userId}&status=eq.pending&select=*`);
  const existingPairs = new Set(existing.map((candidate) => pairKey(candidate.source_card_id, candidate.target_card_id)));
  const newCandidates: Array<Pick<ProfileMergeCandidateRow, "user_id" | "source_card_id" | "target_card_id" | "reason">> = [];

  for (const source of cards) {
    for (const target of cards) {
      if (source.id === target.id || source.category !== target.category || existingPairs.has(pairKey(source.id, target.id))) {
        continue;
      }
      const reason = mergeReason(source.content, target.content);
      if (!reason) {
        continue;
      }
      newCandidates.push({
        user_id: userId,
        source_card_id: source.id,
        target_card_id: target.id,
        reason,
      });
      existingPairs.add(pairKey(source.id, target.id));
    }
  }

  if (newCandidates.length === 0) {
    return existing;
  }
  const created = await insertRows<ProfileMergeCandidateRow>("profile_merge_candidates", newCandidates);
  return [...created, ...existing];
}

export async function decideMergeCandidate(userId: string, id: string, status: "accepted" | "rejected"): Promise<ProfileMergeCandidateRow[]> {
  return patchRows<ProfileMergeCandidateRow>("profile_merge_candidates", `id=eq.${id}&user_id=eq.${userId}&status=eq.pending`, {
    status,
    decided_at: new Date().toISOString(),
  });
}

function pairKey(sourceCardId: string, targetCardId: string): string {
  return [sourceCardId, targetCardId].sort().join(":");
}

function mergeReason(source: string, target: string): string | null {
  const sourceText = normalize(source);
  const targetText = normalize(target);
  if (sourceText.length < 2 || targetText.length < 2) {
    return null;
  }
  if (sourceText === targetText) {
    return "같은 문장으로 보여요.";
  }
  if (sourceText.includes(targetText) || targetText.includes(sourceText)) {
    return "한 카드가 다른 카드 내용을 포함해요.";
  }
  return null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "");
}
