import { buildRecommendedActionContext } from "./recommendedActionUtils.js";

function getIntroText(actions = []) {
  if (actions.some((action) => action.targetType === "record_improvement")) {
    return "이번 주에는 기록은 쌓였지만, 결과와 수치가 부족해요.";
  }
  if (actions.some((action) => action.targetType === "project_action")) {
    return "다음에 이어갈 일을 Action으로 남기면 프로젝트 흐름을 보기 쉬워요.";
  }
  return "다음 행동을 하나 정해두면 기록이 끊기지 않아요.";
}

function getButtonLabel(action) {
  return action?.targetType === "record_improvement"
    ? "이 추천 행동으로 기록 보완하기"
    : "이 행동을 Action으로 저장하기";
}

export default function CalendarRecommendationPanel({
  actions = [],
  selectedDate = "",
  today = "",
  onOpenRecordInput,
}) {
  if (!actions.length) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">다음 추천 행동</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{getIntroText(actions)}</p>
      </div>
      <div className="mt-3 space-y-2">
        {actions.map((action) => (
          <div key={action.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{action.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{action.description}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                {action.priority === "high" ? "우선" : "추천"}
              </span>
            </div>
            {onOpenRecordInput ? (
              <button
                type="button"
                className="mt-3 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                onClick={() => onOpenRecordInput(buildRecommendedActionContext(action, { selectedDate, today }))}
              >
                {getButtonLabel(action)}
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
