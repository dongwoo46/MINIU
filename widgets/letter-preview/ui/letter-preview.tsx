import { LetterListItem } from "@/entities/letter";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
import { mockLetters } from "../model/mock";
export function LetterPreview({ onPreview }: { onPreview: () => void }) {
  return <section className="preview letter-preview" aria-labelledby="letter-title"><div className="page-heading"><span className="eyebrow">A LITTLE NOTE FOR YOU</span><h1 id="letter-title">문자가 도착했어요</h1><p>너의 하루가 담긴, 나만의 우편함.</p></div><div className="mail-illustration" aria-hidden="true"><div className="mail-paper">To. 소영<br /><span>작은 마음을 보냅니다.</span><span className="mail-heart">♥</span></div><div className="mail-envelope"><Icon name="heart" /></div><span className="mail-sparkle">✦</span></div><div className="section-heading"><h2>우리의 문자</h2><span>{mockLetters.length}통</span></div><div className="letter-list">{mockLetters.map(letter => <LetterListItem key={letter.id} {...letter} onClick={onPreview} />)}</div><Button fullWidth onClick={onPreview}><Icon name="plus" width="18" height="18" />문자 쓰기</Button><p className="preview-footnote">샘플 문자로 구성된 프리뷰예요</p></section>;
}
