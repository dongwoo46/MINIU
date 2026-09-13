"use client";

import { useEffect, useRef, useState } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import {
  MiniuApiError,
  deleteProfileCard,
  getHouse,
  getPreQuestions,
  listNotifications,
  listProfileCards,
  listRecords,
  updateProfileCard,
  type ProfileCardData,
  type RecordEntry,
} from "@/shared/api/miniu";
import { ProfileCardDeleteDialog } from "@/shared/ui/dialog-window";

const TITLE_BAR =
  "flex items-center justify-between px-2 py-1 border-b-2 border-[#4e5968] bg-gradient-to-r from-[#5376c7] via-[#5c82db] to-[#456cb8] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-xs [&_p]:text-white [&_p]:tracking-[0.3px]";
const WINDOW_BTN =
  "flex items-center justify-center w-4 h-4 p-0 border-2 border-white bg-[#d8dee9] cursor-pointer";
const NAV_ITEM =
  "flex-1 flex flex-col items-center gap-1 px-[10px] py-1.5 border-none bg-transparent no-underline cursor-pointer [&_img]:w-[46px] [&_img]:h-[46px] [&_p]:m-0 [&_p]:font-pixel [&_p]:text-base [&_p]:text-[#191f28]";

const PARTNER_SUMMARY_MAX_LENGTH = 40;

const PARTNER_FILE_CATEGORIES = [
  { id: "likes", label: "좋아하는 것" },
  { id: "dislikes", label: "싫어하는 것" },
  { id: "tendencies", label: "평소 성향" },
  { id: "habits", label: "자주하는 습관" },
  { id: "values", label: "가치관" },
] as const;

type PartnerFileCategory = (typeof PARTNER_FILE_CATEGORIES)[number]["id"];

function calcDDay(startedOn: string | null): number | null {
  if (!startedOn) return null;
  const start = new Date(`${startedOn}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
}

// 카드에는 "10" 같은 배지 개념이 없어서, 카테고리 안에서 created_at 오름차순
// 기준으로 화면에서 번호를 매겨 보여준다(정렬 순서와 무관하게 고정).
function buildCategoryBadgeMap(cards: ProfileCardData[]): Map<string, string> {
  const byCreatedAsc = [...cards].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const map = new Map<string, string>();
  byCreatedAsc.forEach((card, index) => {
    map.set(card.id, String(index + 1).padStart(2, "0"));
  });
  return map;
}

// 기록탭의 "file 01" 배지와 동일한 규칙(전체 기록 중 created_at 오름차순 번호).
function buildRecordBadgeMap(records: RecordEntry[]): Map<string, string> {
  const byCreatedAsc = [...records].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const map = new Map<string, string>();
  byCreatedAsc.forEach((record, index) => {
    map.set(record.id, `file ${String(index + 1).padStart(2, "0")}`);
  });
  return map;
}

function formatUpdateDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} update`;
}

function describeApiError(error: unknown): string {
  if (error instanceof MiniuApiError) {
    if (error.status === 401) return "로그인이 필요해요.";
    if (error.status === 403) return "연인과 연결해 주세요.";
    return error.message;
  }
  return "잠시 후 다시 시도해 주세요.";
}

const SOURCE_TYPE_LABELS: Record<string, string> = {
  record: "기록",
  letter: "문자",
  pre_question: "사전 질문",
};

function buildRefLabel(card: ProfileCardData, recordBadgeMap: Map<string, string>): string | null {
  if (!card.sources.length) return null;
  const groups = new Map<string, string[]>();
  for (const source of card.sources) {
    const label = SOURCE_TYPE_LABELS[source.type] ?? source.type;
    const items = groups.get(label) ?? [];
    if (source.type === "record") {
      items.push(recordBadgeMap.get(source.id) ?? source.id);
    }
    groups.set(label, items);
  }
  return Array.from(groups.entries())
    .map(([label, items]) => (items.length ? `${label} > ${items.join(", ")}` : label))
    .join(" · ");
}

function ProfileFileWindow({
  partnerName,
  initialCategory,
  onClose,
  devMock,
}: {
  partnerName: string;
  initialCategory: PartnerFileCategory;
  onClose: () => void;
  /** 개발용: 백엔드 호출 없이 프로필 카드를 목업 데이터로 바로 보여줄 때만 사용. */
  devMock?: { cards: ProfileCardData[]; records: RecordEntry[] };
}) {
  const [activeTab, setActiveTab] = useState<PartnerFileCategory>(initialCategory);
  const [cards, setCards] = useState<ProfileCardData[]>(devMock?.cards ?? []);
  const [records, setRecords] = useState<RecordEntry[]>(devMock?.records ?? []);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProfileCardData | null>(null);
  const [listThumb, setListThumb] = useState({ top: 0, height: 24, visible: false });
  const listRef = useRef<HTMLDivElement>(null);
  const [editThumb, setEditThumb] = useState({ top: 0, height: 24, visible: false });
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const LIST_MIN_THUMB_HEIGHT = 24;

  function updateListThumbPosition() {
    const el = listRef.current;
    if (!el) return;
    const trackHeight = el.clientHeight;
    const overflowing = el.scrollHeight > el.clientHeight;
    const thumbHeight = Math.max(LIST_MIN_THUMB_HEIGHT, (el.clientHeight / el.scrollHeight) * trackHeight);
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;
    setListThumb({ top: thumbTop, height: thumbHeight, visible: overflowing });
  }

  function updateEditThumbPosition() {
    const el = editTextareaRef.current;
    if (!el) return;
    const trackHeight = el.clientHeight;
    const overflowing = el.scrollHeight > el.clientHeight;
    const thumbHeight = Math.max(LIST_MIN_THUMB_HEIGHT, (el.clientHeight / el.scrollHeight) * trackHeight);
    const maxScrollTop = el.scrollHeight - el.clientHeight;
    const maxThumbTop = trackHeight - thumbHeight;
    const thumbTop = maxScrollTop > 0 ? (el.scrollTop / maxScrollTop) * maxThumbTop : 0;
    setEditThumb({ top: thumbTop, height: thumbHeight, visible: overflowing });
  }

  const tabsDrag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startScrollLeft: 0,
    // 최근 이동 샘플(최대 ~80ms 분량)을 모아뒀다가 놓는 순간의 "직전 한 프레임"이
    // 아니라 최근 구간 전체의 평균 속도로 관성을 계산한다. 큰 폭으로 빠르게 밀 때
    // 손을 떼기 직전 자연히 감속되는 마지막 프레임만 보면 속도가 거의 0으로 잡혀
    // 관성이 안 붙고 뚝 끊기는 것처럼 보이기 때문.
    samples: [] as { x: number; t: number }[],
    rafId: 0,
  });

  function stopTabsMomentum() {
    if (tabsDrag.current.rafId) {
      cancelAnimationFrame(tabsDrag.current.rafId);
      tabsDrag.current.rafId = 0;
    }
  }

  function runTabsMomentum(el: HTMLDivElement, velocity: number) {
    let v = velocity; // px per ms
    let lastTs = performance.now();
    function step(ts: number) {
      const dt = ts - lastTs;
      lastTs = ts;
      v *= Math.pow(0.94, dt / 16.7);
      el.scrollLeft -= v * dt;
      if (Math.abs(v) > 0.02) {
        tabsDrag.current.rafId = requestAnimationFrame(step);
      } else {
        tabsDrag.current.rafId = 0;
      }
    }
    tabsDrag.current.rafId = requestAnimationFrame(step);
  }
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    Promise.all([listProfileCards(), listRecords()])
      .then(([cardData, recordData]) => {
        if (cancelled) return;
        setCards(cardData.cards);
        setRecords(recordData.records);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(describeApiError(error));
      });
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  useEffect(() => stopTabsMomentum, []);

  const recordBadgeMap = buildRecordBadgeMap(records);
  const cardsInTab = cards.filter((card) => card.category === activeTab);
  const categoryBadgeMap = buildCategoryBadgeMap(cardsInTab);
  const sortedCards = [...cardsInTab].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    updateListThumbPosition();
  }, [sortedCards.length, expandedId, editingId]);

  useEffect(() => {
    if (editingId) updateEditThumbPosition();
  }, [editingId, editingContent]);

  function toggleExpand(id: string) {
    setEditingId(null);
    setExpandedId((current) => (current === id ? null : id));
  }

  function startEdit(card: ProfileCardData) {
    setEditingId(card.id);
    setEditingContent(card.content);
  }

  async function saveEdit(card: ProfileCardData) {
    const content = editingContent.trim();
    if (!content) return;
    setActionError(null);
    if (devMock) {
      setCards((current) => current.map((item) => (item.id === card.id ? { ...item, content, updatedAt: new Date().toISOString() } : item)));
      setEditingId(null);
      return;
    }
    try {
      const { card: updated } = await updateProfileCard(card.id, { content });
      setCards((current) => current.map((item) => (item.id === card.id ? updated : item)));
      setEditingId(null);
    } catch (error) {
      setActionError(describeApiError(error));
    }
  }

  async function removeCard(card: ProfileCardData) {
    setActionError(null);
    if (!devMock) {
      try {
        await deleteProfileCard(card.id);
      } catch (error) {
        setActionError(describeApiError(error));
        return;
      }
    }
    setCards((current) => current.filter((item) => item.id !== card.id));
    setExpandedId((current) => (current === card.id ? null : current));
    setEditingId((current) => (current === card.id ? null : current));
  }

  async function confirmRemoveCard() {
    if (!deleteTarget) return;
    const card = deleteTarget;
    setDeleteTarget(null);
    await removeCard(card);
  }

  return (
    <>
      <div className="fixed inset-0 bg-[#111] opacity-80 z-20 cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[21] w-[358px] max-w-[calc(100%-32px)] h-[456px] max-h-[calc(100%-64px)] flex flex-col bg-[#d8dee9] border-2 border-white shadow-[2px_2px_0px_0px_rgba(17,17,17,0.2)] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="연인 파일"
      >
        <div className={TITLE_BAR}>
          <p>{`${partnerName} file.exe - [zip]`}</p>
          <div className="flex items-center gap-0.5">
            <span className={WINDOW_BTN} aria-hidden="true">
              <img src="/home/win-btn-1.svg" alt="" width={10} height={10} />
            </span>
            <img src="/home/win-btn-2.svg" alt="" width={16} height={16} className="shrink-0" aria-hidden="true" />
            <button type="button" className={WINDOW_BTN} onClick={onClose} aria-label="팝업 닫기">
              <img src="/home/win-btn-3.svg" alt="" width={10} height={10} />
            </button>
          </div>
        </div>

        <div
          className="flex items-stretch overflow-x-auto border-b border-[#191f28] bg-white shrink-0 min-w-0 w-full cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onWheel={(event) => {
            // 마우스 휠(세로 스크롤)만 있는 데스크톱에서도 탭을 가로로 넘길 수 있게 한다.
            if (event.deltaY !== 0 && event.deltaX === 0) {
              event.currentTarget.scrollLeft += event.deltaY;
            }
          }}
          onMouseDown={(event) => {
            stopTabsMomentum();
            const now = performance.now();
            tabsDrag.current = {
              active: true,
              moved: false,
              startX: event.pageX,
              startScrollLeft: event.currentTarget.scrollLeft,
              samples: [{ x: event.pageX, t: now }],
              rafId: 0,
            };
          }}
          onMouseMove={(event) => {
            if (!tabsDrag.current.active) return;
            const delta = event.pageX - tabsDrag.current.startX;
            if (Math.abs(delta) > 3) tabsDrag.current.moved = true;
            event.currentTarget.scrollLeft = tabsDrag.current.startScrollLeft - delta;

            const now = performance.now();
            const samples = tabsDrag.current.samples;
            samples.push({ x: event.pageX, t: now });
            while (samples.length > 1 && now - samples[0].t > 80) samples.shift();
          }}
          onMouseUp={(event) => {
            if (tabsDrag.current.active && tabsDrag.current.moved) {
              const samples = tabsDrag.current.samples;
              const first = samples[0];
              const last = samples[samples.length - 1];
              const dt = last.t - first.t;
              const velocity = dt > 0 ? (last.x - first.x) / dt : 0;
              runTabsMomentum(event.currentTarget, velocity);
            }
            tabsDrag.current.active = false;
          }}
          onMouseLeave={(event) => {
            if (tabsDrag.current.active && tabsDrag.current.moved) {
              const samples = tabsDrag.current.samples;
              const first = samples[0];
              const last = samples[samples.length - 1];
              const dt = last.t - first.t;
              const velocity = dt > 0 ? (last.x - first.x) / dt : 0;
              runTabsMomentum(event.currentTarget, velocity);
            }
            tabsDrag.current.active = false;
          }}
          onClickCapture={(event) => {
            // 드래그로 스크롤한 직후에는 그 클릭이 탭 전환으로 이어지지 않게 막는다.
            if (tabsDrag.current.moved) {
              event.preventDefault();
              event.stopPropagation();
              tabsDrag.current.moved = false;
            }
          }}
        >
          {PARTNER_FILE_CATEGORIES.map((item) => {
            const isActive = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setExpandedId(null);
                  setEditingId(null);
                }}
                className={`flex items-center gap-1.5 px-2 py-2 border-r border-[#4e5968] shrink-0 font-pixel text-xs tracking-[0.3px] whitespace-nowrap cursor-pointer ${
                  isActive ? "bg-[#333d4b]" : "bg-[#d8dee9] text-[#191f28]"
                }`}
                // globals.css의 `button { color: inherit }`가 unlayered라 Tailwind
                // 유틸리티 클래스보다 우선순위가 높아 class로는 덮어쓸 수 없다(같은 이유로
                // .miniuButton도 font-family를 별도 지정함). inline style로 강제 적용.
                style={isActive ? { color: "var(--color-common-100)" } : undefined}
              >
                <img src="/minimi/file-tab-icon.svg" alt="" width={12} height={11} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1 min-h-0">
          <div
            ref={listRef}
            className="h-full overflow-y-auto bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={updateListThumbPosition}
          >
          {loadError ? <p className="p-3 font-pixel text-xs text-[#db2777]">{loadError}</p> : null}
          {!loadError && sortedCards.length === 0 ? (
            <p className="p-8 text-center font-pixel text-xs text-[#8b95a1]">아직 저장된 정보가 없어요</p>
          ) : null}
          {sortedCards.map((card) => {
            const isExpanded = expandedId === card.id;
            const isEditing = editingId === card.id;
            return (
              <div
                key={card.id}
                className={`border-b border-dashed border-[#b0b8c1] ${isExpanded ? "px-4 py-4" : "px-2 py-2.5"}`}
                style={isExpanded ? { background: "var(--color-gray-quaternary)" } : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex-1 min-w-0 flex flex-col ${isEditing ? "gap-1.5" : "gap-0.5"}`}>
                    <div className="flex items-center gap-1.5">
                      <span className="shrink-0 px-[5px] py-px bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-[10px] text-[#db2777]">
                        {categoryBadgeMap.get(card.id)}
                      </span>
                      <span className="font-pixel text-xs text-[#6b7684] tracking-[0.3px]">{formatUpdateDate(card.updatedAt)}</span>
                    </div>
                    {isEditing ? (
                      <div className="relative">
                        <textarea
                          ref={editTextareaRef}
                          className="w-full font-pixel text-sm text-[#191f28] tracking-[0.196px] bg-white border-2 border-[#2b1f28] pl-[10px] pr-4 py-2 shadow-[inset_0px_2px_4px_0px_rgba(0,0,0,0.05)] resize-none overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                          rows={2}
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          onScroll={updateEditThumbPosition}
                          aria-label="프로필 카드 내용 수정"
                          autoFocus
                        />
                        {editThumb.visible ? (
                          <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-[#b0b8c1] border-l-2 border-[#2b1f28]" aria-hidden="true">
                            <div
                              className="absolute left-0 w-full bg-white border-t-2 border-b-2 border-[#2b1f28]"
                              style={{ top: `${editThumb.top}px`, height: `${editThumb.height}px` }}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <p className="m-0 font-pixel text-sm text-[#191f28] tracking-[0.196px]">{card.content}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="shrink-0 m-0 p-0 border-none bg-transparent font-pixel text-[10px] cursor-pointer"
                    style={{ color: "var(--color-border-primary)" }}
                    onClick={() => toggleExpand(card.id)}
                    aria-label={isExpanded ? "접기" : "펼치기"}
                  >
                    <span className={`inline-block ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                </div>
                {isExpanded ? (
                  <div className="mt-6 flex items-center justify-between gap-2 font-pixel text-sm tracking-[0.196px]">
                    <span className="flex-1 min-w-0 truncate text-[#6b7684]">{buildRefLabel(card, recordBadgeMap) ?? "직접 관리 중"}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      {isEditing ? (
                        <>
                          {/* globals.css의 `button { color: inherit }`가 unlayered라 Tailwind
                              text-color 유틸리티보다 우선순위가 높아 class로는 덮어쓸 수 없다
                              (탭 active 색상과 동일한 원인) — inline style로 강제 적용. */}
                          <button type="button" className="m-0 p-0 border-none bg-transparent cursor-pointer" style={{ color: "var(--color-text-quinary)" }} onClick={() => setEditingId(null)}>
                            취소
                          </button>
                          <button type="button" className="m-0 p-0 border-none bg-transparent cursor-pointer" style={{ color: "var(--color-text-tertiary)" }} onClick={() => saveEdit(card)}>
                            저장
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" className="m-0 p-0 border-none bg-transparent cursor-pointer" style={{ color: "var(--color-text-tertiary)" }} onClick={() => startEdit(card)}>
                            수정
                          </button>
                          <button type="button" className="m-0 p-0 border-none bg-transparent cursor-pointer" style={{ color: "var(--color-accent-pink)" }} onClick={() => setDeleteTarget(card)}>
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
          {actionError ? <p className="p-2 font-pixel text-xs text-[#db2777]">{actionError}</p> : null}
        </div>
        {listThumb.visible ? (
          <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-[#b0b8c1] border-l-2 border-[#2b1f28]" aria-hidden="true">
            <div
              className="absolute left-0 w-full bg-white border-t-2 border-b-2 border-[#2b1f28]"
              style={{ top: `${listThumb.top}px`, height: `${listThumb.height}px` }}
            />
          </div>
        ) : null}
        </div>
      </div>

      {deleteTarget ? (
        <>
          <div className="fixed inset-0 bg-[#111] opacity-80 z-[22] cursor-pointer" onClick={() => setDeleteTarget(null)} aria-hidden="true" />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[23] w-[358px] max-w-[calc(100%-32px)]">
            <ProfileCardDeleteDialog onDelete={confirmRemoveCard} onCancel={() => setDeleteTarget(null)} />
          </div>
        </>
      ) : null}
    </>
  );
}

export function ProfilePreview({
  onNavigate,
  devMock,
}: {
  onNavigate?: (tab: PreviewTab) => void;
  /** 개발용: 백엔드 호출 없이 연인 정보를 목업 데이터로 바로 보여줄 때만 사용. */
  devMock?: { partnerName: string; dDay: number | null; summary: string; unreadCount: number; cards: ProfileCardData[]; records: RecordEntry[] };
}) {
  const [unreadCount, setUnreadCount] = useState(devMock?.unreadCount ?? 0);
  const [partnerName, setPartnerName] = useState(devMock?.partnerName ?? "연인");
  const [relationshipStartedOn, setRelationshipStartedOn] = useState<string | null>(null);
  const [summary, setSummary] = useState(devMock?.summary ?? "");
  const [selectedCategory, setSelectedCategory] = useState<PartnerFileCategory | null>(null);
  const [openCategory, setOpenCategory] = useState<PartnerFileCategory | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (devMock) return;
    let cancelled = false;
    Promise.all([getHouse(), getPreQuestions(), listNotifications()])
      .then(([house, { preQuestions }, notifications]) => {
        if (cancelled) return;
        if (house.partner.miniu) setPartnerName(house.partner.miniu.name);
        setUnreadCount(notifications.unreadCount);
        if (preQuestions) {
          setRelationshipStartedOn(preQuestions.relationshipStartedOn);
          setSummary(preQuestions.tendencies.join(" ").slice(0, PARTNER_SUMMARY_MAX_LENGTH));
        }
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "연인 정보를 불러오지 못했어요.");
      });
    return () => {
      cancelled = true;
    };
  }, [devMock]);

  const dDay = devMock ? devMock.dDay : calcDDay(relationshipStartedOn);
  const displaySummary = summary.slice(0, PARTNER_SUMMARY_MAX_LENGTH);

  function openFile(category: PartnerFileCategory) {
    setSelectedCategory(category);
    // 클릭모션(텍스트 색 변경)이 잠깐 보이고 나서 팝업이 뜨도록 지연시킨다.
    window.setTimeout(() => setOpenCategory(category), 180);
  }

  return (
    <div className="relative flex flex-col h-dvh w-full bg-gradient-to-b from-[#7cb6f6] via-[#e9f9ff] to-white text-[#191f28]">
      <div className="absolute inset-x-0 top-0 h-[404px] overflow-hidden pointer-events-none" aria-hidden="true">
        <img className="absolute left-[-7px] top-[-3px] w-[404px] h-[404px] object-cover mix-blend-soft-light opacity-30 rotate-180" src="/minimi/bg-soft-light.png" alt="" />
      </div>

      <div className="relative flex items-center justify-between h-[59px] px-4">
        <p className="m-0 font-pixel text-[36px] text-white tracking-[-0.72px] leading-none whitespace-nowrap">MINIU</p>
        <div className="flex items-center gap-2">
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
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 font-pixel text-[9px] text-white bg-[#db2777] border border-white px-1">{unreadCount}</span>}
          </div>
          <div className="relative w-9 h-9" aria-hidden="true">
            <div className="absolute left-[1.93px] top-[1.93px] w-[32.143px] h-[32.143px] overflow-hidden">
              <img className="absolute left-[-83.33%] top-[-71.46%] w-[268%] h-[244.92%] max-w-none" src="/minimi/gear-icon.png" alt="" />
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

      {loadError ? <p className="relative mx-4 mt-2 font-pixel text-xs text-[#db2777]">{loadError}</p> : null}

      <div className="relative flex-1 flex flex-col gap-6 px-4 pb-[130px] mt-2 overflow-y-auto">
        <section className="flex flex-col gap-2.5">
          <p className="m-0 font-pixel text-base text-[#191f28] tracking-[0.16px]">연인 정보</p>
          <div className="flex items-start justify-between gap-2 bg-white border-2 border-[#2b1f28] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] px-[18px] py-4">
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1">
                <span className="relative shrink-0 w-[18px] h-[18px]" aria-hidden="true">
                  <span className="absolute left-[2.81px] top-[1.13px] w-[12.375px] h-[15.75px] overflow-hidden">
                    <img className="absolute left-[-30.46%] top-[-48.85%] w-[254.96%] h-[200.33%] max-w-none" src="/minimi/profile-heart-icon.png" alt="" />
                  </span>
                </span>
                <span className="font-pixel text-sm text-[#191f28] tracking-[0.196px]">{partnerName}</span>
              </div>
              <p className="m-0 font-pixel text-sm text-[#6b7684] tracking-[0.196px]">{displaySummary || "아직 요약이 없어요"}</p>
            </div>
            {dDay !== null && (
              <span className="shrink-0 px-[9px] py-[3px] bg-[#fce7f3] border border-[#f9a8d4] font-pixel text-sm text-[#db2777] tracking-[0.196px] whitespace-nowrap">
                D+{dDay}
              </span>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-0.5">
            <p className="m-0 font-pixel text-base text-[#191f28] tracking-[0.16px]">연인 파일</p>
            <p className="m-0 font-pixel text-sm text-[#6b7684] tracking-[0.196px]">{partnerName}와 관련된 정보가 저장되어 있어요</p>
          </div>
          <div className="flex flex-col items-stretch bg-white border-2 border-[#2b1f28] shadow-[2px_2px_0px_rgba(0,0,0,0.2)] overflow-hidden w-full">
            <div className={TITLE_BAR}>
              <p>{`${partnerName} file.exe - [zip]`}</p>
              <div className="flex items-center gap-0.5">
                <span className={WINDOW_BTN} aria-hidden="true">
                  <img src="/home/win-btn-1.svg" alt="" width={10} height={10} />
                </span>
                <img src="/home/win-btn-2.svg" alt="" width={16} height={16} className="shrink-0" aria-hidden="true" />
                <span className={WINDOW_BTN} aria-hidden="true">
                  <img src="/home/win-btn-3.svg" alt="" width={10} height={10} />
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 pt-1 pb-[5px] bg-[#d8dee9] border-b border-[#4e5968] font-pixel text-[10px] text-[#191f28] w-full [&_p]:m-0">
              <p>파일(F)</p>
              <p>동작(A)</p>
              <p>보기(V)</p>
              <p>도움말(H)</p>
            </div>
            <div className="grid grid-cols-3 gap-x-[26px] gap-y-8 justify-items-center py-6 px-4 w-full">
              {PARTNER_FILE_CATEGORIES.map((item) => {
                const isSelected = selectedCategory === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="flex flex-col items-center gap-1.5 m-0 p-0 border-none bg-transparent cursor-pointer"
                    onClick={() => openFile(item.id)}
                  >
                    <span className="relative block w-[54px] h-12" aria-hidden="true">
                      <img src="/minimi/folder-back.svg" alt="" className="absolute inset-0 w-full h-full" />
                      <span className="absolute inset-x-0 bottom-0 mx-px h-[38px] flex items-center justify-center rounded-[4px] border-[1.286px] border-[#7cb6f6] bg-gradient-to-b from-[#bfdbfe] to-[#60a5fa]">
                        <span className="font-pixel text-xs text-[#333d4b] tracking-[0.3px]">ZIP</span>
                      </span>
                    </span>
                    <span
                      className={`px-1 rounded-[4px] font-pixel text-xs tracking-[0.3px] whitespace-nowrap transition-colors duration-150 ${
                        isSelected ? "bg-[rgba(37,99,235,0.6)] text-white" : "bg-transparent text-[#191f28]"
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[5] mx-auto w-full max-w-[var(--shell-width)] bg-gradient-to-t from-white via-white/95 to-transparent">
        <nav className="flex w-full items-center gap-[10px] px-7 pt-4 pb-[max(20px,env(safe-area-inset-bottom))]">
          <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("home")}>
            <img src="/minimi/nav-home.png" alt="" aria-hidden="true" />
            <p>홈</p>
          </button>
          <button type="button" className={`${NAV_ITEM} opacity-60`} onClick={() => onNavigate?.("record")}>
            <img src="/minimi/nav-record.png" alt="" aria-hidden="true" />
            <p>기록</p>
          </button>
          <button type="button" className={NAV_ITEM} onClick={() => onNavigate?.("profile")}>
            <img src="/minimi/nav-profile.png" alt="" aria-hidden="true" />
            <p>프로필</p>
          </button>
        </nav>
      </div>

      {openCategory ? (
        <ProfileFileWindow
          partnerName={partnerName}
          initialCategory={openCategory}
          onClose={() => setOpenCategory(null)}
          devMock={devMock ? { cards: devMock.cards, records: devMock.records } : undefined}
        />
      ) : null}
    </div>
  );
}
