import { Badge } from "@/shared/ui/badge";
import { Surface } from "@/shared/ui/surface";
export function ProfileCard({ text, category, symbol }: { text: string; category: string; symbol: string }) {
  return <Surface className="profile-card"><span className="card-symbol" aria-hidden="true">{symbol}</span><div><Badge>{category}</Badge><h3>{text}</h3><p>진우에 대해 알아가는 중</p></div></Surface>;
}
