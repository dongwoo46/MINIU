"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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

export default function NoteListClient() {
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isWriteOpen, setIsWriteOpen] = useState(false);
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
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(
      now.getDate()
    )} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setNotes((prev) => [
      { id: nextFileNumber, badge: `file ${nextFileNumber}`, date, body: draft.trim() },
      ...prev,
    ]);
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
            <span className="miniuNote__sortArrow">▼</span>
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
        <button
          type="button"
          className="miniuHome__banner miniuNote__writeBanner"
          onClick={handleOpenWrite}
          onWheel={forwardWheelToList}
        >
          <p>기록하기</p>
          <p className="miniuHome__bannerArrow">▼</p>
        </button>

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
            className="miniuHome__dim"
            onClick={handleCloseWrite}
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
              <button
                type="button"
                className={`miniuHome__banner miniuNote__submitBtn${
                  canSubmit ? "" : " miniuNote__submitBtn--disabled"
                }`}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                <p>기록하기</p>
                <p className="miniuHome__bannerArrow">▼</p>
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
