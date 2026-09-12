"use client";
import { useState } from "react";
import { MinimiAvatar } from "@/entities/minimi";
import { setupScreens, type SetupScreen } from "@/shared/config/design-system";
import { Button } from "@/shared/ui/button";
import { Chip } from "@/shared/ui/chip";
import { Icon } from "@/shared/ui/icon";
import { TextField } from "@/shared/ui/text-field";

export function SetupPreview({ onPreview }: { onPreview: () => void }) {
  const [screen, setScreen] = useState<SetupScreen>("create");
  return <section className="setup-preview" aria-labelledby="setup-preview-title">
    <div className="setup-switch" aria-label="미니미 생성 화면 프리뷰 선택">
      {setupScreens.map(item => <Chip key={item.id} selected={screen === item.id} onClick={() => setScreen(item.id)}>{item.label}</Chip>)}
    </div>
    {screen === "create" && <CreateMinimiScreen onPreview={onPreview} />}
    {screen === "connect" && <CoupleConnectScreen onPreview={onPreview} />}
    {screen === "invite" && <InviteCodeScreen onPreview={onPreview} />}
    {screen === "house" && <HouseScreen onPreview={onPreview} />}
  </section>;
}

function PhoneStatus() {
  return <div className="phone-status" aria-hidden="true"><strong>9:41</strong><span /><i /><i /><i /></div>;
}

function ScreenHeader({ title }: { title: string }) {
  return <><PhoneStatus /><div className="app-header"><button type="button" aria-label="뒤로가기"><Icon name="back" /></button><h2>{title}</h2><span /></div></>;
}

function CreateMinimiScreen({ onPreview }: { onPreview: () => void }) {
  return <article className="mock-phone mock-phone--plain" aria-labelledby="setup-preview-title">
    <ScreenHeader title="미니미 생성" />
    <div className="mock-content">
      <div className="plain-title"><h1 id="setup-preview-title">연인의 말투를 알려주세요</h1><p>최근 나눈 대화를 살짝 보여주세요.</p></div>
      <div className="choice-list">
        <button type="button" onClick={onPreview}><Icon name="image" /><span><strong>이미지 업로드</strong><small>카카오톡, 문자, dm 캡처 등</small></span></button>
        <button type="button" onClick={onPreview}><Icon name="letter" /><span><strong>텍스트로 붙여넣기</strong><small>어디서든 가져온 텍스트</small></span></button>
      </div>
    </div>
  </article>;
}

function CoupleConnectScreen({ onPreview }: { onPreview: () => void }) {
  return <article className="mock-phone mock-phone--rose">
    <div className="compact-title"><h1>커플 연결</h1><p>두 사람 모두 미니미를 만든 뒤, 앱의 코드로 연결해서 시작할 수 있어요.</p></div>
    <section className="code-card" aria-label="내 초대 코드">
      <span>내 초대 코드</span><strong>K7M2QP9A</strong>
      <div><Button variant="secondary" onClick={onPreview}>코드 복사</Button><Button variant="secondary" onClick={onPreview}>초대 링크 복사</Button></div>
      <p>상대방이 이 코드를 입력하면 커플이 연결돼요. 코드는 7일간 유효합니다.</p>
    </section>
    <section className="connect-card">
      <TextField label="받은 초대 코드 입력" defaultValue="K7M2QP9A" />
      <p>상대방에게 전달받은 코드를 입력해 주세요.</p>
      <Button fullWidth onClick={onPreview}>커플 연결하기</Button>
    </section>
    <button className="logout-preview" type="button" onClick={onPreview}>로그아웃</button>
  </article>;
}

function InviteCodeScreen({ onPreview }: { onPreview: () => void }) {
  return <article className="mock-phone mock-phone--plain">
    <ScreenHeader title="미니미 생성" />
    <div className="mock-content invite-flow">
      <h1>이제 연인을 초대해 볼까요?</h1>
      <p>아래 코드를 공유하거나 상대방 코드를 입력해 주세요.</p>
      <div className="invite-block">
        <label>나의 코드</label>
        <div className="copy-field"><span>k14khvazb</span><button type="button" onClick={onPreview} aria-label="내 코드 복사"><Icon name="copy" /></button></div>
        <Button fullWidth className="dark-action" onClick={onPreview}>내 코드 보내기</Button>
      </div>
      <div className="invite-divider" />
      <div className="invite-block">
        <label>연인의 코드를 알고있다면?</label>
        <div className="copy-field copy-field--input"><span>상대방 코드 입력</span><Icon name="chevron" /></div>
      </div>
    </div>
  </article>;
}

function HouseScreen({ onPreview }: { onPreview: () => void }) {
  return <article className="mock-phone mock-phone--house">
    <ScreenHeader title="진우의 집" />
    <div className="house-stage">
      <div className="soft-bubble soft-bubble--top">이제 소영이가 꼬옥 안아주고 갔어요</div>
      <div className="soft-bubble soft-bubble--left">쓰담쓰담...</div>
      <div className="soft-bubble soft-bubble--right">히헷 🥰</div>
      <span className="music-note" aria-hidden="true">♪</span>
      <div className="home-minimi"><MinimiAvatar /></div>
      <div className="guitar" aria-hidden="true">♬</div>
      <div className="house-actions"><button type="button" onClick={onPreview}>뽀뽀하기</button><button type="button" onClick={onPreview}>안아주기</button><button type="button" onClick={onPreview}>쓰다듬기</button></div>
    </div>
  </article>;
}
