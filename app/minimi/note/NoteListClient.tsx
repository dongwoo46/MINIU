"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ButtonPrimary } from "../components/Buttons";
import { Window01 } from "../components/DialogWindows";

const MAX_NOTE_LENGTH = 150;

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
    <div className="miniuHome">
      <div className="miniuHome__softlight">
        <img src="/minimi/bg-soft-light.png" alt="" aria-hidden="true" />
      </div>

      <div className="miniuHome__gnb">
        <p className="miniuHome__logo">MINIU</p>

        <div className="miniuHome__gnbIcons">
          <div className="miniuHome__bellIcon" aria-hidden="true">
            <span className="miniuHome__bellRect miniuHome__bellRect--1" />
            <span className="miniuHome__bellRect miniuHome__bellRect--2" />
            <span className="miniuHome__bellRect miniuHome__bellRect--3" />
            <span className="miniuHome__bellRect miniuHome__bellRect--4" />
            <span className="miniuHome__bellRect miniuHome__bellRect--5" />
            <span className="miniuHome__bellRect miniuHome__bellRect--6" />
            <span className="miniuHome__bellRect miniuHome__bellRect--7" />
            <span className="miniuHome__bellRect miniuHome__bellRect--8" />
            <span className="miniuHome__bellRect miniuHome__bellRect--9" />
            <span className="miniuHome__bellRect miniuHome__bellRect--10" />
            <span className="miniuHome__bellRect miniuHome__bellRect--11" />
          </div>

          <div className="miniuHome__gearIcon" aria-hidden="true">
            <div className="miniuHome__gearCrop">
              <img
                className="miniuHome__gearImg"
                src="/minimi/gear-icon.png"
                alt=""
              />
            </div>
            <span className="miniuHome__gearTick miniuHome__gearTick--1" />
            <span className="miniuHome__gearTick miniuHome__gearTick--2" />
            <span className="miniuHome__gearTick miniuHome__gearTick--3" />
            <span className="miniuHome__gearTick miniuHome__gearTick--4" />
            <span className="miniuHome__gearTick miniuHome__gearTick--5" />
            <span className="miniuHome__gearTick miniuHome__gearTick--6" />
            <span className="miniuHome__gearTick miniuHome__gearTick--7" />
            <span className="miniuHome__gearTick miniuHome__gearTick--8" />
          </div>
        </div>
      </div>

      <div className="miniuNote__scrollArea" ref={scrollAreaRef}>
        <div className="miniuNote__top">
          <p className="miniuNote__count">
            총 <span className="miniuNote__countNumber">{notes.length}</span>개
            기록
          </p>
          <button
            type="button"
            className="miniuNote__sort"
            onClick={handleToggleSort}
          >
            <span>{sortOrder === "latest" ? "최신순" : "오래된순"}</span>
            <svg
              className="miniuNote__sortIcon"
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

        <div className="miniuNote__list">
          {sortedNotes.map((note) => (
            <article key={note.id} className="miniuNote__card">
              <div className="miniuNote__cardHeader">
                <span className="miniuNote__cardBadge">{note.badge}</span>
                <div className="miniuNote__cardMeta">
                  <span>{note.date}</span>
                  <button
                    type="button"
                    className="miniuNote__cardDelete"
                    onClick={() => handleDelete(note.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="miniuNote__cardBody">{note.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="miniuNote__footer">
        {FOOTER_BLUR_LAYERS.map(({ blur, maskFrom, maskTo }) => (
          <div
            key={blur}
            className="miniuNote__footerBlurLayer"
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
          className="miniuNote__footerTint"
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
          className="miniuNote__writeBanner"
          onClick={handleOpenWrite}
          onWheel={forwardWheelToList}
        />

        <nav className="miniuHome__nav" onWheel={forwardWheelToList}>
          <Link
            href="/minimi"
            className="miniuHome__navItem miniuHome__navItem--inactive"
          >
            <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
            <p>홈</p>
          </Link>
          <button type="button" className="miniuHome__navItem">
            <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
            <p>기록</p>
          </button>
          <button
            type="button"
            className="miniuHome__navItem miniuHome__navItem--inactive"
          >
            <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
            <p>프로필</p>
          </button>
        </nav>

        <div className="miniuHome__homeIndicator">
          <div className="miniuHome__homeIndicatorBar" />
        </div>
      </div>

      {isWriteOpen ? (
        <>
          <div
            className={
              mergeCandidate
                ? "miniuHome__dim miniuNote__dim--aboveWritePopup"
                : "miniuHome__dim"
            }
            onClick={mergeCandidate ? undefined : handleCloseWrite}
            aria-hidden="true"
          />

          <div
            className="miniuNote__popupWindow"
            role="dialog"
            aria-modal="true"
            aria-label="기록 작성"
          >
            <div className="miniuHome__titleBar">
              <p>{`miniu note.exe - [file ${String(nextFileNumber).padStart(
                2,
                "0"
              )}]`}</p>
              <div className="miniuHome__titleBarControls">
                <button type="button" className="miniuHome__windowBtn">
                  <img src="/minimi/window-btn-min.svg" alt="최소화" />
                </button>
                <span className="miniuHome__windowBtn">
                  <span
                    className="miniuHome__windowBtnSquareIcon"
                    aria-hidden="true"
                  />
                </span>
                <button
                  type="button"
                  className="miniuHome__windowBtn"
                  onClick={handleCloseWrite}
                >
                  <img
                    className="miniuHome__windowBtnCloseIcon"
                    src="/minimi/window-btn-close.svg"
                    alt="팝업 닫기"
                  />
                </button>
              </div>
            </div>

            <div className="miniuNote__menuStrip">
              <div className="miniuNote__menuStripLabels">
                <p>파일(F)</p>
                <p>동작(A)</p>
                <p>보기(V)</p>
                <p>도움말(H)</p>
              </div>
              <span className="miniuNote__counter">
                {draft.length}/{MAX_NOTE_LENGTH}자
              </span>
            </div>

            <div className="miniuNote__popupImgArea">
              <div className="miniuNote__textBox">
                <textarea
                  ref={textareaRef}
                  className="miniuNote__textarea"
                  maxLength={MAX_NOTE_LENGTH}
                  placeholder="내 연인을 기록해 보세요!"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onScroll={syncScrollThumb}
                  aria-label="기록 내용 (최대 150자)"
                />
                {isTextOverflowing ? (
                  <div className="miniuNote__scrollTrack" aria-hidden="true">
                    <div
                      className="miniuNote__scrollThumb"
                      style={{
                        top: `${thumbStyle.top}px`,
                        height: `${thumbStyle.height}px`,
                      }}
                    />
                  </div>
                ) : null}
              </div>
            </div>

            <div className="miniuNote__popupUnderbar">
              <ButtonPrimary
                label="기록하기"
                className="miniuNote__submitBtn"
                onClick={handleSubmit}
                disabled={!canSubmit}
              />
            </div>
          </div>

          {mergeCandidate ? (
            <Window01
              className="miniuNote__mergeDialog"
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
