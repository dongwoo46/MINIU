"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import {
  MiniuApiError,
  createRecord,
  deleteRecord,
  listMergeCandidates,
  listRecords,
  mergeProfileCard,
  rejectMergeCandidate,
  type ProfileMergeCandidate,
  type RecordEntry,
} from "@/shared/api/miniu";
import { ButtonPrimary } from "@/shared/ui/pixel-button";
import { Window01 } from "@/shared/ui/dialog-window";

const MAX_NOTE_LENGTH = 150;

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const NAV_ITEM =
  "flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer pointer-events-auto [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]";

// 서버 기록에는 "file 16" 같은 배지 개념이 없어서, created_at 오름차순
// 기준으로 화면에서 번호를 매겨 보여준다(정렬 순서와 무관하게 고정).
function buildBadgeMap(records: RecordEntry[]): Map<string, string> {
  const byCreatedAsc = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const map = new Map<string, string>();
  byCreatedAsc.forEach((record, index) => {
    map.set(record.id, `file ${String(index + 1).padStart(2, "0")}`);
  });
  return map;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function describeApiError(error: unknown): string {
  if (error instanceof MiniuApiError) {
    if (error.status === 401) return "로그인이 필요해요.";
    if (error.status === 403) return "연인과 연결해 주세요.";
    return error.message;
  }
  return "잠시 후 다시 시도해 주세요.";
}

export function RecordPreview({ onNavigate }: { onNavigate?: (tab: PreviewTab) => void }) {
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [mergeCandidate, setMergeCandidate] = useState<ProfileMergeCandidate | null>(null);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [draft, isWriteOpen]);

  useEffect(() => {
    let cancelled = false;
    listRecords()
      .then(({ records }) => {
        if (!cancelled) setRecords(records);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(describeApiError(error));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const badgeByRecordId = useMemo(() => buildBadgeMap(records), [records]);

  const sortedRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sortOrder === "latest" ? sorted.reverse() : sorted;
  }, [records, sortOrder]);

  const nextFileNumber = records.length + 1;
  const canSubmit = draft.trim().length > 0;

  async function handleDelete(id: string) {
    const prev = records;
    setRecords((current) => current.filter((record) => record.id !== id));
    try {
      await deleteRecord(id);
    } catch (error) {
      setRecords(prev);
      setLoadError(describeApiError(error));
    }
  }

  function handleToggleSort() {
    setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"));
  }

  function handleOpenWrite() {
    setDraft("");
    setSubmitError(null);
    setIsWriteOpen(true);
  }

  function handleCloseWrite() {
    setIsWriteOpen(false);
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    const content = draft.trim();
    setSubmitError(null);
    try {
      const { record } = await createRecord({ content, happenedOn: toDateInputValue(new Date()) });
      // 기록탭에는 유사 여부와 상관없이 항상 기록된다. 병합 여부는
      // 프로필 카드(프로필 탭)를 합칠지에만 영향을 준다.
      setRecords((prev) => [record, ...prev]);
      setDraft("");

      const { candidates } = await listMergeCandidates().catch(() => ({ candidates: [] as ProfileMergeCandidate[] }));
      const pending = candidates.find((candidate) => candidate.status === "pending");
      if (pending) {
        setMergeCandidate(pending);
      } else {
        setIsWriteOpen(false);
      }
    } catch (error) {
      setSubmitError(describeApiError(error));
    }
  }

  async function handleMergeConfirm() {
    if (!mergeCandidate) return;
    try {
      await mergeProfileCard(mergeCandidate.sourceCardId, mergeCandidate.targetCardId);
    } catch (error) {
      setLoadError(describeApiError(error));
    }
    setMergeCandidate(null);
    setIsWriteOpen(false);
  }

  async function handleMergeDismiss() {
    if (!mergeCandidate) return;
    try {
      await rejectMergeCandidate(mergeCandidate.id);
    } catch (error) {
      setLoadError(describeApiError(error));
    }
    // 병합을 취소해도 새 기록은 이미 기록탭에 저장된 상태 그대로 남는다.
    setMergeCandidate(null);
    setIsWriteOpen(false);
  }

  return (
    <div className="relative flex flex-col min-h-dvh w-full bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28]">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <div className="relative flex items-center justify-between h-[59px] px-4">
        <p className="m-0 font-pixel text-[28px] text-white tracking-[-0.5px] leading-none whitespace-nowrap">MINIU</p>
      </div>

      <div className="relative flex items-center justify-between h-[21px] mt-2 mx-4 font-pixel text-sm text-[#191f28]">
        <p className="m-0">
          총 <span className="text-[#db2777]">{records.length}</span>개 기록
        </p>
        <button type="button" className="flex items-center gap-1 m-0 p-0 border-none bg-transparent font-pixel text-sm text-[#191f28] cursor-pointer" onClick={handleToggleSort}>
          <span>{sortOrder === "latest" ? "최신순" : "오래된순"}</span>
        </button>
      </div>

      {loadError ? <p className="relative mx-4 mt-2 font-pixel text-xs text-[#db2777]">{loadError}</p> : null}

      <div className="relative flex-1 flex flex-col gap-2 mt-3 mx-4 pb-[220px]">
        {sortedRecords.map((record) => (
          <article key={record.id} className="flex flex-col gap-1.5 px-3 py-3.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_rgba(17,17,17,0.2)]">
            <div className="flex items-center gap-1.5 pb-[9px] border-b border-dashed border-[#d1d6db]">
              <span className="shrink-0 px-[5px] py-px bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-[10px] text-[#db2777] whitespace-nowrap">
                {badgeByRecordId.get(record.id)}
              </span>
              <div className="flex-1 min-w-0 flex items-center justify-between font-pixel text-xs tracking-[0.3px] text-[#8b95a1]">
                <span>{formatDisplayDate(record.createdAt)}</span>
                <button type="button" className="m-0 p-0 border-none bg-transparent font-pixel text-xs text-[#8b95a1] cursor-pointer" onClick={() => handleDelete(record.id)}>
                  삭제
                </button>
              </div>
            </div>
            <p className="m-0 font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#191f28]">{record.content}</p>
          </article>
        ))}
        {records.length === 0 && !loadError && (
          <p className="font-pixel text-xs text-[#8b95a1] text-center py-8">아직 기록이 없어요</p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[5] mx-auto w-full max-w-[var(--shell-width)] pt-8 px-4 pb-[max(20px,env(safe-area-inset-bottom))] bg-gradient-to-t from-white via-white/90 to-transparent">
        <ButtonPrimary label="기록하기" onClick={handleOpenWrite} />

        <nav className="flex items-center gap-[10px] w-full mt-2">
          <button type="button" className={NAV_ITEM} onClick={() => onNavigate?.("home")}>
            <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
            <p>홈</p>
          </button>
          <button type="button" className={NAV_ITEM} onClick={() => onNavigate?.("record")}>
            <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
            <p>기록</p>
          </button>
          <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("profile")}>
            <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
            <p>프로필</p>
          </button>
        </nav>
      </div>

      {isWriteOpen ? (
        <>
          <div
            className={mergeCandidate ? "fixed inset-0 bg-[#111] opacity-80 z-[12] cursor-pointer" : "fixed inset-0 bg-[#111] opacity-80 z-10 cursor-pointer"}
            onClick={mergeCandidate ? undefined : handleCloseWrite}
            aria-hidden="true"
          />

          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[358px] max-w-[calc(100%-32px)] flex flex-col items-stretch bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] z-[11]"
            role="dialog"
            aria-modal="true"
            aria-label="기록 작성"
          >
            <div className={TITLE_BAR}>
              <p>{`miniu note.exe - [file ${String(nextFileNumber).padStart(2, "0")}]`}</p>
              <div className="flex items-center gap-0.5">
                <span className={WINDOW_BTN} aria-hidden="true"><span className="w-2 h-2 border-[1.5px] border-[#111] box-border" /></span>
                <button type="button" className={WINDOW_BTN} onClick={handleCloseWrite} aria-label="팝업 닫기">
                  ×
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-1 pb-[5px] bg-[#d8dee9] border-b border-[#4e5968] font-pixel text-[10px] text-[#191f28]">
              <div className="flex gap-3 [&_p]:m-0">
                <p>파일(F)</p>
                <p>동작(A)</p>
                <p>보기(V)</p>
                <p>도움말(H)</p>
              </div>
              <span className="tracking-[0.3px]">{draft.length}/{MAX_NOTE_LENGTH}자</span>
            </div>

            <div className="p-1 bg-[#d8dee9]">
              <div className="relative w-full h-[200px] bg-white border-2 border-[#2b1f28] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
                <textarea
                  ref={textareaRef}
                  className="block w-full h-full m-0 pt-2 pr-4 pb-2 pl-2 border-none outline-none resize-none bg-transparent font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#191f28] overflow-y-auto box-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="내 연인을 기록해 보세요!"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  aria-label="기록 내용 (최대 150자)"
                />
              </div>
            </div>

            <div className="relative w-full min-h-[65px] box-border p-2 bg-[#d8dee9]">
              {submitError ? <p className="m-0 mb-1 font-pixel text-[10px] text-[#db2777]">{submitError}</p> : null}
              <ButtonPrimary label="기록하기" onClick={handleSubmit} disabled={!canSubmit} />
            </div>
          </div>

          {mergeCandidate ? (
            <div className="fixed left-1/2 top-[calc(50%+180px)] -translate-x-1/2 z-[13] w-[358px] max-w-[calc(100%-32px)]">
              <Window01
                refLabel={`Ref. ${mergeCandidate.targetCard?.content ?? ""}`}
                primaryLabel="병합하기"
                secondaryLabel="취소"
                onMerge={handleMergeConfirm}
                onDismiss={handleMergeDismiss}
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
