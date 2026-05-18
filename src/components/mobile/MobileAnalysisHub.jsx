import { Suspense, lazy, useState } from "react";
import { BarChart3, ClipboardList, FileSearch, ChevronLeft } from "lucide-react";

const TransitionLiteInput = lazy(() => import("@/components/input/TransitionLiteInput.jsx"));
const NewgradTransitionLiteInput = lazy(() => import("@/components/input/NewgradTransitionLiteInput.jsx"));

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

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-3 flex items-center gap-1 text-xs font-medium text-slate-500 active:opacity-70"
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      분석 목록으로
    </button>
  );
}

export default function MobileAnalysisHub({
  onStartJobAnalysis,
  onStartRejectAnalysis,
  onViewResults,
  activeAnalysisMode,
  onExecuteAnalysis,
  onClearMobileAnalysisMode,
  onSubmitTransitionLite,
  careerBaseline,
}) {
  const [audienceMode, setAudienceMode] = useState("experienced");
  const [resetKey, setResetKey] = useState(0);

  const settings = careerBaseline?.settings;
  const experiencedInitialValues =
    settings?.targetJobMajor || settings?.targetJobSub ||
    settings?.targetIndustryMajor || settings?.targetIndustrySub
      ? {
          targetJobMajor: settings.targetJobMajor || "",
          targetJobSub: settings.targetJobSub || "",
          targetIndustryMajor: settings.targetIndustryMajor || "",
          targetIndustrySub: settings.targetIndustrySub || "",
        }
      : undefined;

  const handlers = {
    "job-analysis":    onStartJobAnalysis    ?? (() => {}),
    "reject-analysis": onStartRejectAnalysis ?? (() => {}),
    "recent-results":  onViewResults         ?? (() => {}),
  };

  function switchAudience(next) {
    setAudienceMode(next);
    setResetKey((k) => k + 1);
  }

  // 직무·산업 분석: TransitionLiteInput 직접 임베드
  if (activeAnalysisMode === "job") {
    return (
      <div className="flex flex-col pb-24 pt-4">
        <div className="px-4">
          <BackButton onClick={onClearMobileAnalysisMode} />
          <h2 className="text-lg font-bold text-slate-900">직무·산업 분석</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            희망 직무와 산업을 입력하면 현재 이력과의 연결성을 확인할 수 있어요.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchAudience("experienced")}
              className={[
                "rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                audienceMode === "experienced"
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              경력/이직
            </button>
            <button
              type="button"
              onClick={() => switchAudience("newgrad")}
              className={[
                "rounded-2xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                audienceMode === "newgrad"
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-700",
              ].join(" ")}
            >
              신입
            </button>
          </div>
        </div>
        <div className="mt-4 px-2">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                분석 입력 화면을 불러오는 중입니다...
              </div>
            }
          >
            {audienceMode === "newgrad" ? (
              <NewgradTransitionLiteInput
                key={`mobile-newgrad-${resetKey}`}
                onSubmit={onSubmitTransitionLite ?? (() => {})}
                onStartAnalysis={() => {}}
                onInputsCompleted={() => {}}
              />
            ) : (
              <TransitionLiteInput
                key={`mobile-experienced-${resetKey}`}
                onSubmit={onSubmitTransitionLite ?? (() => {})}
                onStartAnalysis={() => {}}
                onStepCompleted={() => {}}
                onInputsCompleted={() => {}}
                onBackToDefault={onClearMobileAnalysisMode}
                initialValues={experiencedInitialValues}
              />
            )}
          </Suspense>
        </div>
      </div>
    );
  }

  // 서류탈락 분석: PreciseAnalysisFlow로 직접 진입
  if (activeAnalysisMode === "reject") {
    return (
      <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
        <div>
          <BackButton onClick={onClearMobileAnalysisMode} />
          <h2 className="text-lg font-bold text-slate-900">서류탈락 원인 분석</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
            JD와 이력서를 함께 보는 분석으로, 서류에서 걸릴 수 있는 지점을 확인합니다.
          </p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <FileSearch className="h-7 w-7" />
        </div>
        <button
          type="button"
          onClick={onExecuteAnalysis ?? (() => {})}
          className="self-start rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-opacity active:opacity-70"
        >
          서류 탈락 분석 시작하기 →
        </button>
      </div>
    );
  }

  // 최근 분석 결과: 결과 화면으로 이동
  if (activeAnalysisMode === "results") {
    return (
      <div className="flex flex-col gap-5 px-4 pb-24 pt-4">
        <div>
          <BackButton onClick={onClearMobileAnalysisMode} />
          <h2 className="text-lg font-bold text-slate-900">최근 분석 결과</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            이전에 확인한 분석 결과를 이어서 확인합니다.
          </p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <button
          type="button"
          onClick={onExecuteAnalysis}
          className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition-opacity active:opacity-70"
        >
          결과 확인하기
        </button>
      </div>
    );
  }

  // 기본 카드 허브
  return (
    <div className="flex flex-col gap-4 px-4 pb-24 pt-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">분석</h2>
        <p className="mt-0.5 text-xs text-slate-500">내 경험과 목표 직무의 연결성을 분석해 보세요.</p>
      </div>
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
