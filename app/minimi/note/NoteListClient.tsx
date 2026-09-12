"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "../components/Buttons";
import { Window01 } from "../components/DialogWindows";

const MAX_NOTE_LENGTH = 150;

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const NAV_ITEM =
  "flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer pointer-events-auto [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]";

// 단일 backdrop-filter로는 블러 세기 자체에 그라데이션을 줄 수 없어서
// (mask는 알파만 가릴 뿐 blur 반경은 그대로다), 블러 세기가 다른 레이어를
// 여러 장 겹치고 각각 다른 지점부터 mask로 드러나게 해서 위→아래로
// 블러가 점점 강해지는 것처럼 보이게 한다.
const FOOTER_BLUR_LAYERS = [
  { blur: 12, maskFrom: 0, maskTo: 25 },
  { blur: 10, maskFrom: 20, maskTo: 45 },
  { blur: 18, maskFrom: 40, maskTo: 65 },
  { blur: 30, maskFrom: 60, maskTo: 85 },
];

type Note = {
  id: number;
  badge: string;
  date: string;
  body: string;
};

const INITIAL_NOTES: Note[] = [
  {
    id: 16,
    badge: "file 16",
    date: "2026.09.20 14:20",
    body: "오늘 같이 걷다가 알았는데 지수는 민트초코를 극도로 싫어하고 치즈케이크를 제일 좋아함.",
  },
  {
    id: 15,
    badge: "file 15",
    date: "2026.09.19 09:30",
    body: "어제는 비 오는 날이라서 카페에서 오랜만에 만났는데, 수지는 여전히 커피보다 차를 더 좋아함.",
  },
  {
    id: 14,
    badge: "file 14",
    date: "2026.09.18 11:45",
    body: "지난 주말에는 친구들과 바베큐를 했는데, 동수는 고기를 좋아하지만 야채는 싫어함.",
  },
  {
    id: 13,
    badge: "file 13",
    date: "2026.09.17 16:00",
    body: "최근에 본 영화에 대해 이야기했는데, 지영은 액션 영화보다 드라마를 선호함.",
  },
  {
    id: 12,
    badge: "file 12",
    date: "2026.09.15 18:15",
    body: "이번 여름 여행에서 만난 친구가 일본 음식을 정말 좋아했는데, 초밥은 별로였음.",
  },
];

// AI 유사 기록 판별은 아직 붙지 않아서, 단어 겹침 비율로 유사도를 어림하는
// 임시 휴리스틱을 대신 쓴다(2인 사이드프로젝트 규모의 목업).
function textSimilarity(a: string, b: string): number {
  const tokenize = (text: string) =>
    new Set(
      text
        .replace(/[.,!?~]/g, "")
        .split(/\s+/)
        .filter(Boolean)
    );
  const setA = tokenize(a);
  const setB = tokenize(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.5;

// TODO: 병합 팝업 확인용 임시 스위치. 확인 끝나면 false로 되돌릴 것.
const ALWAYS_SHOW_MERGE_FOR_TESTING = true;

function findSimilarNote(body: string, notes: Note[]): Note | undefined {
  let best: Note | undefined;
  let bestScore = 0;
  for (const note of notes) {
    const score = textSimilarity(body, note.body);
    if (score > bestScore) {
      bestScore = score;
      best = note;
    }
  }
  if (ALWAYS_SHOW_MERGE_FOR_TESTING) return best ?? notes[0];
  return bestScore >= SIMILARITY_THRESHOLD ? best : undefined;
}

export default function NoteListClient() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [mergeCandidate, setMergeCandidate] = useState<Note | null>(null);
  const [draft, setDraft] = useState("");
  const [isTextOverflowing, setIsTextOverflowing] = useState(false);
  const [thumbStyle, setThumbStyle] = useState({ top: 0, height: 37 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const MIN_THUMB_HEIGHT = 24;

  // footer(배너/네비)는 리스트 위에 겹쳐 있고 버튼 부분은 클릭을 받아야
  // 해서 pointer-events:auto다. 그 위에서 휠을 굴리면 버튼이 이벤트를
  // 가로채 리스트로 전달되지 않으므로, 휠 스크롤을 수동으로 리스트에
  // 넘겨준다.
  function forwardWheelToList(e: React.WheelEvent) {
    scrollAreaRef.current?.scrollBy({ top: e.deltaY });
  }

  function syncScrollThumb() {
    const el = textareaRef.current;
    if (!el) return;
    const overflowing = el.scrollHeight > el.clientHeight;
    setIsTextOverflowing(overflowing);
    if (!overflowing) return;

    const trackHeight = el.clientHeight;
    const thumbHeight = Math.max(
      MIN_THUMB_HEIGHT,
      (el.clientHeight / el.scrollHeight) * trackHeight
    );
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop =
      maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;

    setThumbStyle({ top: thumbTop, height: thumbHeight });
  }

  useEffect(() => {
    syncScrollThumb();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, isWriteOpen]);

  const sortedNotes = useMemo(() => {
    const sorted = [...notes].sort((a, b) => a.id - b.id);
    return sortOrder === "latest" ? sorted.reverse() : sorted;
  }, [notes, sortOrder]);

  const nextFileNumber =
    notes.reduce((max, note) => Math.max(max, note.id), 0) + 1;

  const canSubmit = draft.trim().length > 0;

  function handleDelete(id: number) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  function handleToggleSort() {
    setSortOrder((prev) => (prev === "latest" ? "oldest" : "latest"));
  }

  function handleOpenWrite() {
    setDraft("");
    setIsWriteOpen(true);
  }

  function handleCloseWrite() {
    setIsWriteOpen(false);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    const body = draft.trim();
    const similar = findSimilarNote(body, notes);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    // 기록탭에는 유사 여부와 상관없이 항상 기록된다. 병합 여부는
    // 프로필 탭으로 보낼 정보를 고를 때만 영향을 준다.
    setNotes((prev) => [
      { id: nextFileNumber, badge: `file ${nextFileNumber}`, date, body },
      ...prev,
    ]);
    setDraft("");
    if (similar) {
      setMergeCandidate(similar);
    } else {
      setIsWriteOpen(false);
    }
  }

  function handleMergeConfirm() {
    // TODO: 프로필 탭 정보 병합은 아직 연결 전이라 다이얼로그만 닫는다.
    setMergeCandidate(null);
    setIsWriteOpen(false);
  }

  function handleMergeDismiss() {
    // 병합을 취소해도 새 기록은 이미 기록탭에 저장된 상태 그대로 남는다.
    setMergeCandidate(null);
    setIsWriteOpen(false);
  }

  return (
    <div className="relative w-[390px] h-[844px] mx-auto overflow-hidden bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28] font-[Arial,Helvetica,sans-serif]">
      <div className="absolute left-0 top-0 w-[390px] h-[844px] overflow-hidden">
        <img
          className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180"
          src="/minimi/bg-soft-light.png"
          alt=""
          aria-hidden="true"
        />
      </div>

      <div className="absolute left-0 top-[59px] w-[390px] h-[50px] overflow-hidden">
        <p className="absolute left-4 top-1/2 -translate-y-1/2 m-0 font-pixel text-[36px] text-white tracking-[-0.72px] leading-none whitespace-nowrap">
          MINIU
        </p>

        <div className="absolute left-[294px] top-[7px] flex items-center gap-2">
          <div className="relative w-9 h-9" aria-hidden="true">
            <span className="absolute bg-white left-[14.5px] right-[14.5px] top-[6.33px] bottom-[27.33px]" />
            <span className="absolute bg-white left-[12.17px] right-[21.5px] top-[8.67px] bottom-[25px]" />
            <span className="absolute bg-white left-[21.5px] right-[12.17px] top-[8.67px] bottom-[25px]" />
            <span className="absolute bg-white left-[9.83px] right-[23.83px] top-[11px] bottom-[16.83px]" />
            <span className="absolute bg-white left-[23.83px] right-[9.83px] top-[11px] bottom-[16.83px]" />
            <span className="absolute bg-white left-[7.5px] right-[26.17px] top-[19.17px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[26.17px] right-[7.5px] top-[19.17px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[7.5px] right-[7.5px] top-[21.5px] bottom-[12.17px]" />
            <span className="absolute bg-white left-[13.33px] right-[20.33px] top-[25px] bottom-[8.67px]" />
            <span className="absolute bg-white left-[20.33px] right-[13.33px] top-[25px] bottom-[8.67px]" />
            <span className="absolute bg-white left-[13.33px] right-[13.33px] top-[27.33px] bottom-[6.33px]" />
          </div>

          <div className="relative w-9 h-9" aria-hidden="true">
            <div className="absolute left-[1.93px] top-[1.93px] w-[32.143px] h-[32.143px] overflow-hidden">
              <img
                className="absolute left-[-83.33%] top-[-71.46%] w-[268%] h-[244.92%] max-w-none"
                src="/minimi/gear-icon.png"
                alt=""
              />
            </div>
            <span className="absolute bg-white left-[13.19px] top-[16.36px] w-[1.957px] h-[3.842px]" />
            <span className="absolute bg-white left-[21.25px] top-[16.36px] w-[1.957px] h-[3.842px]" />
            <span className="absolute bg-white left-[16.44px] top-[13.25px] w-[3.601px] h-[1.957px]" />
            <span className="absolute bg-white left-[19.98px] top-[14.83px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[19.98px] top-[20.1px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[14.91px] top-[20.1px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[14.91px] top-[14.83px] w-[1.531px] h-[1.529px]" />
            <span className="absolute bg-white left-[16.44px] top-[21.39px] w-[3.601px] h-[1.957px]" />
          </div>
        </div>
      </div>

      {/*
        GNB(로고+아이콘)는 화면에 고정, 아래(총 N개 기록/정렬 + 리스트)만
        스크롤된다. 높이를 화면 맨 아래(844)까지 확장해서 리스트가 실제로
        footer(back gradation) 뒤로 지나갈 수 있게 한다.
      */}
      <div
        className="absolute left-0 top-[109px] w-[390px] h-[735px] overflow-y-auto [-webkit-overflow-scrolling:touch] [overscroll-behavior:contain]"
        ref={scrollAreaRef}
      >
        <div className="flex items-center justify-between h-[21px] mt-2 mx-4 font-pixel text-sm text-[#191f28]">
          <p className="m-0">
            총 <span className="text-[#db2777]">{notes.length}</span>개 기록
          </p>
          <button
            type="button"
            className="flex items-center gap-1 m-0 p-0 border-none bg-transparent font-pixel text-sm text-[#191f28] cursor-pointer"
            onClick={handleToggleSort}
          >
            <span>{sortOrder === "latest" ? "최신순" : "오래된순"}</span>
            <svg
              className="shrink-0 text-[#191f28]"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="13.3333"
                y="10.6666"
                width="1.33333"
                height="10.6667"
                transform="rotate(90 13.3333 10.6666)"
                fill="currentColor"
              />
              <rect
                x="6.66669"
                y="9.33337"
                width="1.33333"
                height="2.66667"
                transform="rotate(90 6.66669 9.33337)"
                fill="currentColor"
              />
              <rect
                x="6.66669"
                y="8"
                width="1.33333"
                height="1.33333"
                transform="rotate(90 6.66669 8)"
                fill="currentColor"
              />
              <rect
                x="6.66669"
                y="12"
                width="1.33333"
                height="2.66667"
                transform="rotate(90 6.66669 12)"
                fill="currentColor"
              />
              <rect
                x="6.66669"
                y="13.3334"
                width="1.33333"
                height="1.33333"
                transform="rotate(90 6.66669 13.3334)"
                fill="currentColor"
              />
              <rect
                width="1.33333"
                height="10.6667"
                transform="matrix(-4.37114e-08 1 1 4.37114e-08 2.66663 4)"
                fill="currentColor"
              />
              <rect
                width="1.33333"
                height="2.66667"
                transform="matrix(-4.37114e-08 1 1 4.37114e-08 9.33331 2.66663)"
                fill="currentColor"
              />
              <rect
                width="1.33333"
                height="1.33333"
                transform="matrix(-4.37114e-08 1 1 4.37114e-08 9.33331 1.33337)"
                fill="currentColor"
              />
              <rect
                width="1.33333"
                height="2.66667"
                transform="matrix(-4.37114e-08 1 1 4.37114e-08 9.33331 5.33337)"
                fill="currentColor"
              />
              <rect
                width="1.33333"
                height="1.33333"
                transform="matrix(-4.37114e-08 1 1 4.37114e-08 9.33331 6.66663)"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2 mt-3 mx-4 pb-[200px]">
          {sortedNotes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col gap-1.5 px-3 py-3.5 bg-white border-2 border-[#2b1f28] drop-shadow-[2px_2px_0px_rgba(17,17,17,0.2)]"
            >
              <div className="flex items-center gap-1.5 pb-[9px] border-b border-dashed border-[#d1d6db]">
                <span className="shrink-0 px-[5px] py-px bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-[10px] text-[#db2777] whitespace-nowrap">
                  {note.badge}
                </span>
                <div className="flex-1 min-w-0 flex items-center justify-between font-pixel text-xs tracking-[0.3px] text-[#8b95a1]">
                  <span>{note.date}</span>
                  <button
                    type="button"
                    className="m-0 p-0 border-none bg-transparent font-pixel text-xs text-[#8b95a1] cursor-pointer"
                    onClick={() => handleDelete(note.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="m-0 font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#191f28]">
                {note.body}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="absolute left-0 top-[634px] w-[390px] h-[210px] pointer-events-none">
        {FOOTER_BLUR_LAYERS.map(({ blur, maskFrom, maskTo }) => (
          <div
            key={blur}
            className="absolute inset-0"
            aria-hidden="true"
            style={{
              backdropFilter: `blur(${blur}px)`,
              WebkitBackdropFilter: `blur(${blur}px)`,
              maskImage: `linear-gradient(to bottom, transparent ${maskFrom}%, black ${maskTo}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${maskFrom}%, black ${maskTo}%)`,
            }}
          />
        ))}
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 100%)",
          }}
        />
        <ButtonPrimary
          label="기록하기"
          className="absolute left-4 top-[31px] w-[358px]! pointer-events-auto"
          onClick={handleOpenWrite}
          onWheel={forwardWheelToList}
        />

        <nav
          className="absolute left-0 bottom-[34px] flex items-center gap-[10px] w-[390px] px-7"
          onWheel={forwardWheelToList}
        >
          <Link href="/minimi" className={`${NAV_ITEM} opacity-60`}>
            <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
            <p>홈</p>
          </Link>
          <button type="button" className={NAV_ITEM}>
            <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
            <p>기록</p>
          </button>
          <button type="button" className={`${NAV_ITEM} opacity-60`}>
            <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
            <p>프로필</p>
          </button>
        </nav>

        <div className="absolute left-0 bottom-0 w-[390px] h-[34px]">
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 w-[134px] h-[5px] rounded-[100px] bg-black" />
        </div>
      </div>

      {isWriteOpen ? (
        <>
          <div
            className={
              mergeCandidate
                ? "absolute left-0 top-0 w-[390px] h-[844px] bg-[#111] opacity-80 z-[12] cursor-pointer"
                : "absolute left-0 top-0 w-[390px] h-[844px] bg-[#111] opacity-80 z-10 cursor-pointer"
            }
            onClick={mergeCandidate ? undefined : handleCloseWrite}
            aria-hidden="true"
          />

          <div
            className="absolute left-4 top-[259px] w-[358px] flex flex-col items-stretch bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] z-[11]"
            role="dialog"
            aria-modal="true"
            aria-label="기록 작성"
          >
            <div className={TITLE_BAR}>
              <p>{`miniu note.exe - [file ${String(nextFileNumber).padStart(
                2,
                "0"
              )}]`}</p>
              <div className="flex items-center gap-0.5">
                <button type="button" className={WINDOW_BTN}>
                  <img
                    className="w-[10px] h-[10px]"
                    src="/minimi/window-btn-min.svg"
                    alt="최소화"
                  />
                </button>
                <span className={WINDOW_BTN}>
                  <span
                    className="w-2 h-2 border-[1.5px] border-[#111] box-border"
                    aria-hidden="true"
                  />
                </span>
                <button
                  type="button"
                  className={WINDOW_BTN}
                  onClick={handleCloseWrite}
                >
                  <img
                    className="w-[6.124px] h-[6.124px]"
                    src="/minimi/window-btn-close.svg"
                    alt="팝업 닫기"
                  />
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
              <span className="tracking-[0.3px]">
                {draft.length}/{MAX_NOTE_LENGTH}자
              </span>
            </div>

            <div className="p-1 bg-[#d8dee9]">
              <div className="relative w-[338px] mx-auto h-[200px] bg-white border-2 border-[#2b1f28] shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)]">
                <textarea
                  ref={textareaRef}
                  className="block w-full h-full m-0 pt-2 pr-4 pb-2 pl-2 border-none outline-none resize-none bg-transparent font-pixel text-xs tracking-[0.3px] leading-[1.3] text-[#191f28] overflow-y-auto box-border [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&::placeholder]:text-[#8b8b8b]"
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="내 연인을 기록해 보세요!"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onScroll={syncScrollThumb}
                  aria-label="기록 내용 (최대 150자)"
                />
                {isTextOverflowing ? (
                  <div
                    className="absolute right-0 top-0 bottom-0 w-2 bg-[#b0b8c1] border-l-2 border-[#2b1f28]"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute left-0 w-full bg-white border-t-2 border-b-2 border-[#2b1f28]"
                      style={{
                        top: `${thumbStyle.top}px`,
                        height: `${thumbStyle.height}px`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative w-[354px] h-[65px] box-border p-2 bg-[#d8dee9]">
              <ButtonPrimary
                label="기록하기"
                className="w-[338px]! mx-auto"
                onClick={handleSubmit}
                disabled={!canSubmit}
              />
            </div>
          </div>

          {mergeCandidate ? (
            <Window01
              className="absolute left-4 top-[306px] z-[13]"
              refLabel={`Ref. ${mergeCandidate.badge}`}
              primaryLabel="병합하기"
              secondaryLabel="취소"
              onMerge={handleMergeConfirm}
              onDismiss={handleMergeDismiss}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
