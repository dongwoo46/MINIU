import type { ReactNode } from "react";
import { Icon } from "@/shared/ui/icon";
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="empty-state"><Icon name="sparkle" /><h3>{title}</h3>{description && <p>{description}</p>}{action}</div>;
}
