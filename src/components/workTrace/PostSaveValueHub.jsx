const HUB_ITEMS = [
  {
    key: "analysis",
    label: "분석 보기",
    description: "직무·산업 방향과 서류에서 걸릴 수 있는 이유를 점검해요.",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  },
  {
    key: "assetMap",
    label: "내 커리어 자산 보기",
    description: "저장한 기록에서 나온 강점과 업무 맥락을 봅니다.",
    tone: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
  {
    key: "resume",
    label: "이력서 후보 보기",
    description: "저장한 경험을 이력서 문장 재료로 봅니다.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
];

const POST_SAVE_CONTEXT_TOUR_INTENT_KEY = "passmap:post-save-context-tour-intent:v1";
const POST_SAVE_CONTEXT_TOUR_TARGETS = {
  analysis: "analysis",
  assetMap: "asset-map",
  resume: "resume",
};

function writePostSaveContextTourIntent(intent) {
  if (typeof window === "undefined") return;
  if (!Object.values(POST_SAVE_CONTEXT_TOUR_TARGETS).includes(intent)) return;
  try {
    window.sessionStorage.setItem(POST_SAVE_CONTEXT_TOUR_INTENT_KEY, intent);
  } catch {
    return;
  }
}

export default function PostSaveValueHub({
  onOpenAnalysis = null,
  onOpenAssetMap = null,
  onOpenResumeView = null,
  variant = "web",
  className = "",
  tourIds = {},
}) {
  const actions = {
    analysis: onOpenAnalysis,
    assetMap: onOpenAssetMap,
    resume: onOpenResumeView,
  };
  const visibleItems = HUB_ITEMS.filter((item) => typeof actions[item.key] === "function");

  if (visibleItems.length === 0) return null;

  const isMobile = variant === "mobile";

  return (
    <section
      className={[
        "rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm",
        isMobile ? "space-y-3" : "space-y-4",
        className,
      ].filter(Boolean).join(" ")}
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">
          저장했어요. 다음 가치 흐름을 확인해 보세요.
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          경험 흐름에 쌓인 기록은 분석, 내 커리어 자산, 이력서 후보로 이어집니다.
        </p>
      </div>
      <div className={isMobile ? "flex flex-col gap-2" : "grid gap-2 sm:grid-cols-3"}>
        {visibleItems.map((item) => (
          <button
            key={item.key}
            type="button"
            data-tour-id={tourIds[item.key]}
            onClick={() => {
              if (item.key === "analysis") {
                writePostSaveContextTourIntent(POST_SAVE_CONTEXT_TOUR_TARGETS.analysis);
              }
              if (item.key === "assetMap") {
                writePostSaveContextTourIntent(POST_SAVE_CONTEXT_TOUR_TARGETS.assetMap);
              }
              if (item.key === "resume") {
                writePostSaveContextTourIntent(POST_SAVE_CONTEXT_TOUR_TARGETS.resume);
              }
              actions[item.key]?.();
            }}
            className={[
              "rounded-xl border px-3 py-3 text-left transition",
              "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2",
              item.tone,
            ].join(" ")}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-1 block text-[11px] leading-5 opacity-80">{item.description}</span>
          </button>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <p className="text-[11px] font-semibold text-slate-700">
          이미 기록해둔 자료가 있다면
        </p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          경험 흐름의 연동 설정에서 Notion 가져오기와 캘린더 파일 내보내기를 사용할 수 있어요.
          캘린더 파일로 내보내거나, 설정된 환경에서는 Google Calendar 연동도 사용할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
