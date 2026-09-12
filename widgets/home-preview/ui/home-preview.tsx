"use client";
import { MinimiAvatar } from "@/entities/minimi";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { TextField } from "@/shared/ui/text-field";
export function HomePreview({ onPreview }: { onPreview: () => void }) {
  return <section className="preview home-preview" aria-labelledby="home-title"><div className="page-heading"><span className="eyebrow">OUR LITTLE WORLD</span><h1 id="home-title">오늘도 놀러왔네!</h1><p>작은 순간들이 모여, 더 가까운 우리.</p></div><div className="room"><div className="room-name"><Icon name="home" width="16" height="16" /> 진우의 집 <Badge tone="green">함께하는 중</Badge></div><div className="room-window" aria-hidden="true"><span>✦</span></div><span className="room-picture" aria-hidden="true">♥</span><div className="room-plant" aria-hidden="true">♣</div><div className="room-rug" aria-hidden="true" /><div className="room-character"><div className="speech-bubble">네가 오길 기다렸어 <span>♥</span></div><MinimiAvatar /></div><span className="room-caption">진우의 작은 세상</span></div><div className="home-note"><Icon name="heart" width="18" height="18" /><span>오늘은 진우에게 어떤 이야기를 해줄까?</span></div><form className="chat-preview" onSubmit={event => { event.preventDefault(); onPreview(); }}><TextField label="진우에게 한마디" placeholder="진우와 대화를 해보세요" maxLength={150} /><Button type="submit" aria-label="대화 프리뷰 안내"><Icon name="arrow" /></Button></form><p className="preview-footnote">디자인 프리뷰 · 대화는 전송되지 않아요</p></section>;
}
