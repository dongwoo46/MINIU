import { previewTabs, type PreviewTab } from "@/shared/config/design-system";
import { Icon } from "@/shared/ui/icon";
export function BottomTabs({ active, onChange }: { active: PreviewTab; onChange: (tab: PreviewTab) => void }) {
  return <nav className="bottom-tabs" aria-label="주 메뉴">{previewTabs.map(tab => <button type="button" key={tab.id} aria-current={active === tab.id ? "page" : undefined} onClick={() => onChange(tab.id)}><Icon name={tab.icon} /><span>{tab.label}</span><span className="tab-dot" /></button>)}</nav>;
}
