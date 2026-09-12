import { Icon } from "@/shared/ui/icon";
export function LetterListItem({ excerpt, date, fresh, onClick }: { excerpt: string; date: string; fresh?: boolean; onClick: () => void }) {
  return <button className="letter-item surface" type="button" onClick={onClick}><span className="letter-stamp"><Icon name="letter" /></span><span className="letter-content"><span className="letter-sender">진우가 보낸 문자 {fresh && <span className="new-dot" aria-label="새 문자" />}</span><span className="letter-excerpt">{excerpt}</span><span className="letter-date">{date}</span></span><Icon name="arrow" width="16" height="16" /></button>;
}
