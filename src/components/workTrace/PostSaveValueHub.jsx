const HUB_ITEMS = [
  {
    key: "analysis",
    label: "분석에서 방향 보기",
    description: "서류탈락 원인과 직무·산업 전환 가능성을 확인해요.",
    tone: "border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100",
  },
  {
    key: "assetMap",
    label: "자산맵에서 강점 보기",
    description: "저장한 기록이 어떤 역량과 직무 방향으로 연결되는지 봅니다.",
    tone: "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100",
  },
  {
    key: "resume",
    label: "이력서 후보 보기",
    description: "저장한 경험을 지원서 문장 재료로 확인합니다.",
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
          저장한 경험, 다음으로 어디에 활용할까요?
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          PASSMAP은 기록을 분석, 자산맵, 이력서 후보로 이어줍니다.
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
    </section>
  );
}
