import { BarChart3, FileText, LayoutDashboard, PenLine, Settings, Target } from "lucide-react";

const TABS = [
  { id: "home",      label: "홈",    Icon: LayoutDashboard },
  { id: "analysis",  label: "분석",  Icon: BarChart3 },
  { id: "asset-map", label: "자산 맵", Icon: Target },
  { id: "record",    label: "기록",  Icon: PenLine },
  { id: "resume",    label: "이력서", Icon: FileText },
  { id: "settings",  label: "설정",  Icon: Settings },
];

export default function MobileBottomTab({ activeTab, onTabChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-200 bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors ${
              active ? "text-violet-600" : "text-slate-400"
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? "stroke-violet-600" : "stroke-slate-400"}`} />
            {label}
          </button>
        );
      })}
    </nav>
  );
}
