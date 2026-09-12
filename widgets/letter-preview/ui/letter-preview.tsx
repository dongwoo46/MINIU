"use client";

import { useEffect, useState, type FormEvent } from "react";
import { LetterListItem } from "@/entities/letter";
import { createLetter, listLetters, markLetterRead, type Letter } from "@/shared/api/miniu";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { Icon } from "@/shared/ui/icon";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function LetterPreview({ onPreview }: { onPreview: () => void }) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listLetters()
      .then((data) => {
        if (!cancelled) {
          setLetters(data.letters);
          setUnreadCount(data.unreadCount);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "문자를 불러오지 못했어요.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function submitLetter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) {
      return;
    }
    setPending(true);
    setStatus("");
    try {
      const data = await createLetter(content);
      setLetters((current) => [data.letter, ...current]);
      setDraft("");
      setStatus("문자를 보냈어요.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "문자를 보내지 못했어요.");
    } finally {
      setPending(false);
    }
  }

  async function openLetter(letter: Letter) {
    onPreview();
    if (letter.isMine || letter.isReadByMe) {
      return;
    }
    try {
      const data = await markLetterRead(letter.id);
      setLetters((current) => current.map((item) => (item.id === letter.id ? data.letter : item)));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "문자를 읽음 처리하지 못했어요.");
    }
  }

  return (
    <section className="preview letter-preview" aria-labelledby="letter-title">
      <div className="page-heading">
        <span className="eyebrow">A LITTLE NOTE FOR YOU</span>
        <h1 id="letter-title">문자가 도착했어요</h1>
        <p>너의 하루가 담긴, 나만의 우편함.</p>
      </div>
      <div className="mail-illustration" aria-hidden="true">
        <div className="mail-paper">To. 연인<br /><span>작은 마음을 보냅니다.</span><span className="mail-heart">♥</span></div>
        <div className="mail-envelope"><Icon name="heart" /></div>
        <span className="mail-sparkle">✦</span>
      </div>
      <div className="section-heading">
        <h2>우리의 문자</h2>
        <span>{letters.length}통 · 안 읽은 {unreadCount}통</span>
      </div>
      {status && <p className="preview-footnote">{status}</p>}
      <div className="letter-list">
        {letters.length ? (
          letters.map((letter) => (
            <LetterListItem
              key={letter.id}
              excerpt={letter.content}
              date={formatDate(letter.createdAt)}
              fresh={!letter.isMine && !letter.isReadByMe}
              onClick={() => openLetter(letter)}
            />
          ))
        ) : (
          <EmptyState title="아직 문자가 없어요" description="첫 문자를 보내보세요." />
        )}
      </div>
      <form className="chat-preview" onSubmit={submitLetter}>
        <input className="field-box-input" maxLength={1000} placeholder="문자를 적어 주세요" value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Button type="submit" disabled={pending || !draft.trim()} aria-label="문자 보내기"><Icon name="plus" width="18" height="18" /></Button>
      </form>
      <p className="preview-footnote">문자 목록, 발송, 읽음 처리가 실제 API와 연결됐어요</p>
    </section>
  );
}
