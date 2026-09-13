"use client";

import { useEffect, useMemo, useState } from "react";
import { MinimiAvatar } from "@/entities/minimi";
import { deleteProfileCard, listProfileCards, updateProfileCard, type ProfileCardData } from "@/shared/api/miniu";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Icon } from "@/shared/ui/icon";
import { Surface } from "@/shared/ui/surface";

const categories = [
  { id: "all", label: "전체", symbol: "✦" },
  { id: "likes", label: "좋아함", symbol: "♥" },
  { id: "dislikes", label: "싫어함", symbol: "!" },
  { id: "values", label: "가치관", symbol: "◆" },
  { id: "habits", label: "습관", symbol: "♣" },
  { id: "tendencies", label: "성향", symbol: "●" },
] as const;

type CategoryId = (typeof categories)[number]["id"];

function categoryLabel(category: ProfileCardData["category"]): string {
  return categories.find((item) => item.id === category)?.label ?? category;
}

function categorySymbol(category: ProfileCardData["category"]): string {
  return categories.find((item) => item.id === category)?.symbol ?? "✦";
}

export function ProfilePreview({ onAddRecord }: { onAddRecord: () => void }) {
  const [category, setCategory] = useState<CategoryId>("all");
  const [cards, setCards] = useState<ProfileCardData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listProfileCards()
      .then((data) => {
        if (!cancelled) {
          setCards(data.cards);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "프로필 카드를 불러오지 못했어요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCards = useMemo(
    () => cards.filter((card) => category === "all" || card.category === category),
    [cards, category],
  );

  function startEdit(card: ProfileCardData) {
    setEditingId(card.id);
    setEditingContent(card.content);
  }

  async function saveEdit(card: ProfileCardData) {
    const content = editingContent.trim();
    if (!content) {
      setStatus("내용을 입력해 주세요.");
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const data = await updateProfileCard(card.id, { content });
      setCards((current) => current.map((item) => (item.id === card.id ? data.card : item)));
      setEditingId(null);
      setEditingContent("");
      setStatus("프로필 카드를 수정했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "프로필 카드를 수정하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function removeCard(card: ProfileCardData) {
    setPending(true);
    setStatus("");
    try {
      await deleteProfileCard(card.id);
      setCards((current) => current.filter((item) => item.id !== card.id));
      setStatus("프로필 카드를 삭제했어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "프로필 카드를 삭제하지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="preview profile-preview" aria-labelledby="profile-title">
      <div className="page-heading">
        <span className="eyebrow">GETTING TO KNOW YOU</span>
        <h1 id="profile-title">내가 아는 너</h1>
        <p>하나씩 모아가는 연인의 조각들.</p>
      </div>
      <div className="profile-summary">
        <div className="profile-avatar"><MinimiAvatar small /></div>
        <div><Badge tone="pink">연인</Badge><h2>프로필 카드</h2><p>기록과 문자에서 자동으로 모여요</p></div>
        <Icon name="heart" />
      </div>
      {status && <p className="preview-footnote">{status}</p>}
      <div className="section-heading"><h2>연인에 대한 작은 기억</h2><span>{cards.length}개</span></div>
      <div className="chip-list" role="group" aria-label="프로필 카테고리">
        {categories.map((item) => <Chip key={item.id} selected={item.id === category} onClick={() => setCategory(item.id)}>{item.label}</Chip>)}
      </div>
      <div className="profile-cards">
        {filteredCards.length ? (
          filteredCards.map((card) => (
            <Surface key={card.id} className="profile-card">
              <span className="card-symbol" aria-hidden="true">{categorySymbol(card.category)}</span>
              <div>
                <Badge>{categoryLabel(card.category)}</Badge>
                {editingId === card.id ? (
                  <>
                    <input className="field-box-input" value={editingContent} onChange={(event) => setEditingContent(event.target.value)} />
                    <div className="chip-list">
                      <Button disabled={pending} onClick={() => saveEdit(card)}>저장</Button>
                      <Button variant="ghost" disabled={pending} onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3>{card.content}</h3>
                    <p>{card.sources.length ? `${card.sources.length}개 근거에서 생성됨` : "직접 관리 중"}</p>
                    <div className="chip-list">
                      <Button variant="secondary" disabled={pending} onClick={() => startEdit(card)}>수정</Button>
                      <Button variant="ghost" disabled={pending} onClick={() => removeCard(card)}>삭제</Button>
                    </div>
                  </>
                )}
              </div>
            </Surface>
          ))
        ) : (
          <EmptyState title="아직 모아둔 기억이 없어요" description="기록이나 문자를 남기면 카드가 생겨요." />
        )}
      </div>
      <Button variant="secondary" fullWidth onClick={onAddRecord}><Icon name="plus" width="18" height="18" />기록에서 추가하기</Button>
      <p className="preview-footnote">프로필 카드 조회, 수정, 삭제가 실제 API와 연결됐어요</p>
    </section>
  );
}
