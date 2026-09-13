"use client";
import { useState, type ReactNode } from "react";
import type { PreviewTab } from "@/shared/config/design-system";
import { Badge } from "@/shared/ui/badge";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { BottomTabs } from "@/shared/ui/bottom-tabs";
import { Button } from "@/shared/ui/button";
import { Loading } from "@/shared/ui/loading";
import { TextField } from "@/shared/ui/text-field";
import { Toggle } from "@/shared/ui/toggle";
import { TopBar } from "@/shared/ui/top-bar";

const isDev = process.env.NODE_ENV !== "production";

export function MobileShell({ active, onTabChange, children }: { active: PreviewTab; onTabChange: (tab: PreviewTab) => void; children: ReactNode }) {
  const [sheet, setSheet] = useState(false);
  return <div className="site-frame"><aside className="desktop-note"><span className="desktop-mark">m<span>♥</span></span><p>너를 알아가는<br />아주 작은 세상.</p></aside><div className="mobile-shell"><TopBar /><main id="main-content">{children}</main>{isDev && <div className="foundation-link"><span>MINIU · DEV</span><button type="button" onClick={() => setSheet(true)}>UI 샘플 보기 ↗</button></div>}<BottomTabs active={active} onChange={onTabChange} />{isDev && <BottomSheet open={sheet} onClose={() => setSheet(false)} title="디자인 시스템 샘플"><p className="sheet-description">임시 컬러와 공통 컴포넌트예요. 정식 디자인 에셋으로 교체할 수 있어요.</p><div className="component-samples"><div className="sample-row"><Badge>기본 배지</Badge><Badge tone="pink">새 소식</Badge><Badge tone="green">연결됨</Badge></div><div className="sample-row"><Button onClick={() => setSheet(false)}>확인</Button><Button variant="secondary" onClick={() => setSheet(false)}>닫기</Button><Button disabled>비활성</Button></div><TextField label="이름" placeholder="이름을 입력하세요" hint="입력 필드 샘플 · 저장되지 않아요" /><Toggle label="알림 토글 샘플" defaultChecked /><Loading label="로딩 상태 샘플" /></div></BottomSheet>}</div></div>;
}

