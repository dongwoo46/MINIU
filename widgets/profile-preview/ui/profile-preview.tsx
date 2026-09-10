"use client";
import { useState } from "react";
import { MinimiAvatar } from "@/entities/minimi";
import { ProfileCard } from "@/entities/profile-card";
import { previewCategories, type PreviewCategory } from "@/shared/config/design-system";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { EmptyState } from "@/shared/ui/empty-state";
import { Icon } from "@/shared/ui/icon";
import { mockProfileCards } from "../model/mock";
export function ProfilePreview({ onPreview }: { onPreview: () => void }) {
  const [category, setCategory] = useState<PreviewCategory>("전체");
  const cards = mockProfileCards.filter(card => category === "전체" || card.category === category);
  return <section className="preview profile-preview" aria-labelledby="profile-title"><div className="page-heading"><span className="eyebrow">GETTING TO KNOW YOU</span><h1 id="profile-title">내가 아는 너</h1><p>하나씩 모아가는 진우의 조각들.</p></div><div className="profile-summary"><div className="profile-avatar"><MinimiAvatar small /></div><div><Badge tone="pink">연인</Badge><h2>최진우</h2><p>알아갈수록 더 좋아지는 사람</p></div><Icon name="heart" /></div><div className="section-heading"><h2>진우에 대한 작은 기억</h2><span>{mockProfileCards.length}개</span></div><div className="chip-list" role="group" aria-label="프로필 카테고리">{previewCategories.map(item => <Chip key={item} selected={item === category} onClick={() => setCategory(item)}>{item}</Chip>)}</div><div className="profile-cards">{cards.length ? cards.map(card => <ProfileCard key={card.id} {...card} />) : <EmptyState title="아직 모아둔 기억이 없어요" description="진우의 취향을 하나씩 알아가요." />}</div><Button variant="secondary" fullWidth onClick={onPreview}><Icon name="plus" width="18" height="18" />추가하기</Button><p className="preview-footnote">나만 볼 수 있는, 연인에 대한 기억</p></section>;
}
