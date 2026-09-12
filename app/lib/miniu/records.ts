import type { RecordEntry } from "./types";

export type RecordRow = {
  id: string;
  user_id: string;
  content: string;
  happened_on: string;
  analysis_status: "pending" | "complete" | "failed_temporary" | "failed_permanent";
  analysis_error: string | null;
  created_at: string;
};

const statusToApp: Record<RecordRow["analysis_status"], RecordEntry["analysisStatus"]> = {
  pending: "pending",
  complete: "complete",
  failed_temporary: "failedTemporary",
  failed_permanent: "failedPermanent",
};

export function toRecordEntry(row: RecordRow): RecordEntry {
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    happenedOn: row.happened_on,
    analysisStatus: statusToApp[row.analysis_status],
    analysisError: row.analysis_error,
    createdAt: row.created_at,
  };
}
