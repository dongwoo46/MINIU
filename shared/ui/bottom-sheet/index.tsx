"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon";
export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !open) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [open]);
  return <dialog ref={ref} className="bottom-sheet" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }}><div className="sheet-handle" /><div className="sheet-heading"><h2 id={titleId}>{title}</h2><Button variant="ghost" onClick={onClose} aria-label="닫기"><Icon name="close" /></Button></div>{children}</dialog>;
}
