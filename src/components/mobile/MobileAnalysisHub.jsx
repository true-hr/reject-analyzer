import { BarChart3, ClipboardList, FileSearch } from "lucide-react";

const CARDS = [
  {
    id: "job-analysis",
    Icon: BarChart3,
    title: "직무·산업 분석",
    description: "신입/경력 기준으로 목표 직무와 산업의 연결성을 확인합니다.",
    action: "분석 시작",
    color: "bg-violet-50 text-violet-600",
  },
  {
    id: "reject-analysis",
    Icon: FileSearch,
    title: "서류탈락 원인 분석",
    description: "이력서와 JD 기준으로 서류 탈락 가능 원인을 점검합니다.",
    action: "점검하기",
    color: "bg-rose-50 text-rose-600",
  },
  {
    id: "recent-results",
    Icon: ClipboardList,
    title: "최근 분석 결과",
    description: "이전에 확인한 분석 결과를 이어서 봅니다.",
    action: "결과 보기",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export default function MobileAnalysisHub({ onStartJobAnalysis, onStartRejectAnalysis, onViewResults }) {
  const handlers = {
    "job-analysis":   onStartJobAnalysis   ?? (() => {}),
    "reject-analysis": onStartRejectAnalysis ?? (() => {}),
    "recent-results": onViewResults         ?? (() => {}),
  };

  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">분석</h2>
        <p className="mt-0.5 text-xs text-slate-500">내 경험과 목표 직무의 연결성을 분석해 보세요.</p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {CARDS.map(({ id, Icon, title, description, action, color }) => (
          <div
            key={id}
            className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm"
          >
            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
              </div>
              <button
                type="button"
                onClick={handlers[id]}
                className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-opacity active:opacity-70"
              >
                {action}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
