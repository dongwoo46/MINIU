import Link from "next/link";
import { Icon } from "@/shared/ui/icon";
export function TopBar() {
  return <header className="top-bar"><Link href="/" aria-label="MINIU 홈" className="wordmark">miniu<span className="wordmark-dot">◆</span></Link><span className="top-bar-caption"><Icon name="heart" width="14" height="14" /> 너를 알아가는 작은 세상</span></header>;
}
