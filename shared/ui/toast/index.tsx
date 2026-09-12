import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return <div className="toast-region" role="status" aria-live="polite" aria-atomic="true">{message && <div className="toast"><span>{message}</span><Button variant="ghost" aria-label="안내 닫기" onClick={onDismiss}><Icon name="close" width="16" height="16" /></Button></div>}</div>;
}
