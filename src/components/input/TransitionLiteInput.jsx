import { useEffect, useMemo, useRef, useState } from "react";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "./categoryOptions";
import { findJobOntologyByUiSelection, findIndustryRegistryByUiSelection } from "../../data/job/jobLookup.index.js";

const TRANSITION_LITE_ANALYSIS_TYPE = "transition_lite";

function findCategory(options, value) {
  return (Array.isArray(options) ? options : []).find((item) => item?.v === value) || null;
}

function renderValue(value) {
  return String(value || "").trim() || "-";
}

function renderSummaryLabel(majorLabel, subLabel) {
  const major = renderValue(majorLabel);
  const sub = renderValue(subLabel);
  if (major === "-" && sub === "-") return "\uBBF8\uC120\uD0DD";
  if (sub === "-") return major;
  return `${major} > ${sub}`;
}

const JOB_SUBCATEGORY_LOOKUP_ALIASES = Object.freeze({
  "프로젝트관리(PM)": "프로젝트관리",
  "Key Account Management(KAM)": "Key Account Management",
  "고객성공(CSM)": "고객성공",
  "평가보상(C&B)": "평가보상",
  "HR 운영(HR Ops)": "HR 운영",
  "품질관리(QC)": "품질관리",
  "품질보증(QA)": "품질보증",
  "연구개발(R&D)": "연구개발",
});

function resolveJobSelection({ majorCategory, subcategory }) {
  const direct = findJobOntologyByUiSelection({ majorCategory, subcategory });
  if (direct?.id) return direct;

  const fallbackSubcategory = JOB_SUBCATEGORY_LOOKUP_ALIASES[String(subcategory || "").trim()];
  if (fallbackSubcategory) {
    const fallback = findJobOntologyByUiSelection({
      majorCategory,
      subcategory: fallbackSubcategory,
    });
    if (fallback?.id) return fallback;
  }

  return direct;
}

function buildTransitionPair(payload) {
  const currentJobId = String(payload?.currentJobId || "").trim();
  const currentIndustryId = String(payload?.currentIndustryId || "").trim();
  const targetJobId = String(payload?.targetJobId || "").trim();
  const targetIndustryId = String(payload?.targetIndustryId || "").trim();
  if (!currentJobId || !currentIndustryId || !targetJobId || !targetIndustryId) return "";
  return `${currentJobId}__${currentIndustryId}__TO__${targetJobId}__${targetIndustryId}`;
}

export default function TransitionLiteInput({ onSubmit, onStartAnalysis, onStepCompleted, onInputsCompleted }) {
  const [uiState, setUiState] = useState({
    currentJobMajor: "",
    currentJobSub: "",
    currentIndustryMajor: "",
    currentIndustrySub: "",
    targetJobMajor: "",
    targetJobSub: "",
    targetIndustryMajor: "",
    targetIndustrySub: "",
    submitError: "",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isMobileSelectionSummaryOpen, setIsMobileSelectionSummaryOpen] = useState(false);
  const stepEventKeysRef = useRef(new Set());
  const inputsCompletedKeyRef = useRef("");

  const currentJobCategory = findCategory(JOB_CATEGORY_OPTIONS, uiState.currentJobMajor);
  const targetJobCategory = findCategory(JOB_CATEGORY_OPTIONS, uiState.targetJobMajor);
  const currentIndustryCategory = findCategory(INDUSTRY_CATEGORY_OPTIONS, uiState.currentIndustryMajor);
  const targetIndustryCategory = findCategory(INDUSTRY_CATEGORY_OPTIONS, uiState.targetIndustryMajor);

  const resolvedPayload = useMemo(() => {
    const currentJob = resolveJobSelection({
      majorCategory: uiState.currentJobMajor,
      subcategory: uiState.currentJobSub,
    });
    const currentIndustry = findIndustryRegistryByUiSelection({
      sector: uiState.currentIndustryMajor,
      subSector: uiState.currentIndustrySub,
    });
    const targetJob = resolveJobSelection({
      majorCategory: uiState.targetJobMajor,
      subcategory: uiState.targetJobSub,
    });
    const targetIndustry = findIndustryRegistryByUiSelection({
      sector: uiState.targetIndustryMajor,
      subSector: uiState.targetIndustrySub,
    });

    return {
      currentJobId: typeof currentJob?.id === "string" ? currentJob.id : "",
      currentIndustryId: typeof currentIndustry?.id === "string" ? currentIndustry.id : "",
      targetJobId: typeof targetJob?.id === "string" ? targetJob.id : "",
      targetIndustryId: typeof targetIndustry?.id === "string" ? targetIndustry.id : "",
    };
  }, [
    uiState.currentJobMajor,
    uiState.currentJobSub,
    uiState.currentIndustryMajor,
    uiState.currentIndustrySub,
    uiState.targetJobMajor,
    uiState.targetJobSub,
    uiState.targetIndustryMajor,
    uiState.targetIndustrySub,
  ]);

  function patchUi(nextPatch) {
    setUiState((prev) => ({
      ...prev,
      submitError: "",
      ...nextPatch,
    }));
  }

  const stepCompletion = {
    1: Boolean(uiState.currentJobMajor && uiState.currentJobSub),
    2: Boolean(uiState.targetJobMajor && uiState.targetJobSub),
    3: Boolean(uiState.currentIndustryMajor && uiState.currentIndustrySub),
    4: Boolean(uiState.targetIndustryMajor && uiState.targetIndustrySub),
  };

  const allStepsComplete = Boolean(stepCompletion[1] && stepCompletion[2] && stepCompletion[3] && stepCompletion[4]);
  const payloadReady = Boolean(
    resolvedPayload.currentJobId &&
      resolvedPayload.currentIndustryId &&
      resolvedPayload.targetJobId &&
      resolvedPayload.targetIndustryId
  );
  const transitionPair = buildTransitionPair(resolvedPayload);

  const stepAnalytics = useMemo(() => ([
    { step_name: "current_job", step_index: 1, param_key: "current_job_id", selected_id: resolvedPayload.currentJobId },
    { step_name: "target_job", step_index: 2, param_key: "target_job_id", selected_id: resolvedPayload.targetJobId },
    { step_name: "current_industry", step_index: 3, param_key: "current_industry_id", selected_id: resolvedPayload.currentIndustryId },
    { step_name: "target_industry", step_index: 4, param_key: "target_industry_id", selected_id: resolvedPayload.targetIndustryId },
  ]), [
    resolvedPayload.currentIndustryId,
    resolvedPayload.currentJobId,
    resolvedPayload.targetIndustryId,
    resolvedPayload.targetJobId,
  ]);

  useEffect(() => {
    if (typeof onStepCompleted !== "function") return;

    for (const step of stepAnalytics) {
      const selectedId = String(step?.selected_id || "").trim();
      if (!selectedId) continue;

      const eventKey = `${step.step_name}:${selectedId}`;
      if (stepEventKeysRef.current.has(eventKey)) continue;

      stepEventKeysRef.current.add(eventKey);
      onStepCompleted({
        analysis_type: TRANSITION_LITE_ANALYSIS_TYPE,
        step_name: step.step_name,
        step_index: step.step_index,
        [step.param_key]: selectedId,
      });
    }
  }, [onStepCompleted, stepAnalytics]);

  useEffect(() => {
    if (typeof onInputsCompleted !== "function") return;
    if (!allStepsComplete || !payloadReady || !transitionPair) return;
    if (inputsCompletedKeyRef.current === transitionPair) return;

    inputsCompletedKeyRef.current = transitionPair;
    onInputsCompleted({
      analysis_type: TRANSITION_LITE_ANALYSIS_TYPE,
      current_job_id: resolvedPayload.currentJobId,
      current_industry_id: resolvedPayload.currentIndustryId,
      target_job_id: resolvedPayload.targetJobId,
      target_industry_id: resolvedPayload.targetIndustryId,
      transition_pair: transitionPair,
    });
  }, [
    allStepsComplete,
    onInputsCompleted,
    payloadReady,
    resolvedPayload.currentIndustryId,
    resolvedPayload.currentJobId,
    resolvedPayload.targetIndustryId,
    resolvedPayload.targetJobId,
    transitionPair,
  ]);

  const maxUnlockedStep =
    !stepCompletion[1] ? 1 :
      !stepCompletion[2] ? 2 :
        !stepCompletion[3] ? 3 :
          !stepCompletion[4] ? 4 : 4;

  const stepCards = [
    {
      step: 1,
      shortLabel: "현재 직무",
      title: "현재 직무를 선택해주세요",
      description: "대분류를 먼저 선택한 후 세부 직무를 고르세요.",
      majorValue: uiState.currentJobMajor,
      subValue: uiState.currentJobSub,
      majorLabel: currentJobCategory?.t || currentJobCategory?.v,
      subLabel: (currentJobCategory?.subs || []).find((item) => item?.v === uiState.currentJobSub)?.t || uiState.currentJobSub,
      majorOptions: JOB_CATEGORY_OPTIONS,
      subOptions: currentJobCategory?.subs || [],
      onSelectMajor: (value) => patchUi({ currentJobMajor: value, currentJobSub: "" }),
      onSelectSub: (value) => patchUi({ currentJobSub: value }),
    },
    {
      step: 2,
      shortLabel: "목표 직무",
      title: "목표 직무를 선택해주세요",
      description: "이동하고 싶은 직무 방향으로 선택하세요.",
      majorValue: uiState.targetJobMajor,
      subValue: uiState.targetJobSub,
      majorLabel: targetJobCategory?.t || targetJobCategory?.v,
      subLabel: (targetJobCategory?.subs || []).find((item) => item?.v === uiState.targetJobSub)?.t || uiState.targetJobSub,
      majorOptions: JOB_CATEGORY_OPTIONS,
      subOptions: targetJobCategory?.subs || [],
      onSelectMajor: (value) => patchUi({ targetJobMajor: value, targetJobSub: "" }),
      onSelectSub: (value) => patchUi({ targetJobSub: value }),
    },
    {
      step: 3,
      shortLabel: "현재 산업",
      title: "현재 산업을 선택해주세요",
      description: "현재 소속되어 있거나 일하고 있는 산업을 선택하세요.",
      majorValue: uiState.currentIndustryMajor,
      subValue: uiState.currentIndustrySub,
      majorLabel: currentIndustryCategory?.t || currentIndustryCategory?.v,
      subLabel: (currentIndustryCategory?.subs || []).find((item) => item?.v === uiState.currentIndustrySub)?.t || uiState.currentIndustrySub,
      majorOptions: INDUSTRY_CATEGORY_OPTIONS,
      subOptions: currentIndustryCategory?.subs || [],
      onSelectMajor: (value) => patchUi({ currentIndustryMajor: value, currentIndustrySub: "" }),
      onSelectSub: (value) => patchUi({ currentIndustrySub: value }),
    },
    {
      step: 4,
      shortLabel: "목표 산업",
      title: "목표 산업을 선택해주세요",
      description: "앞으로 이동하고 싶은 목표 산업을 선택하세요.",
      majorValue: uiState.targetIndustryMajor,
      subValue: uiState.targetIndustrySub,
      majorLabel: targetIndustryCategory?.t || targetIndustryCategory?.v,
      subLabel: (targetIndustryCategory?.subs || []).find((item) => item?.v === uiState.targetIndustrySub)?.t || uiState.targetIndustrySub,
      majorOptions: INDUSTRY_CATEGORY_OPTIONS,
      subOptions: targetIndustryCategory?.subs || [],
      onSelectMajor: (value) => patchUi({ targetIndustryMajor: value, targetIndustrySub: "" }),
      onSelectSub: (value) => patchUi({ targetIndustrySub: value }),
    },
  ];

  const summaryItems = [
    { label: "\uD604\uC7AC \uC9C1\uBB34", value: renderSummaryLabel(currentJobCategory?.t || currentJobCategory?.v, stepCards[0].subLabel) },
    { label: "\uBAA9\uD45C \uC9C1\uBB34", value: renderSummaryLabel(targetJobCategory?.t || targetJobCategory?.v, stepCards[1].subLabel) },
    { label: "\uD604\uC7AC \uC0B0\uC5C5", value: renderSummaryLabel(currentIndustryCategory?.t || currentIndustryCategory?.v, stepCards[2].subLabel) },
    { label: "\uBAA9\uD45C \uC0B0\uC5C5", value: renderSummaryLabel(targetIndustryCategory?.t || targetIndustryCategory?.v, stepCards[3].subLabel) },
  ];
  const completedSummaryCount = summaryItems.filter((item) => item.value !== "\uBBF8\uC120\uD0DD").length;
  const compactSummaryLine = summaryItems
    .map((item) => `${item.label}: ${item.value === "\uBBF8\uC120\uD0DD" ? "\uC120\uD0DD \uC804" : item.value}`)
    .join("  \u00B7  ");

  const activeStepCard = stepCards.find((item) => item.step === currentStep) || stepCards[0];

  function getValidationMessage() {
    if (!uiState.currentJobMajor || !uiState.currentJobSub) return "현재 직무를 빠짐없이 선택해주세요.";
    if (!uiState.targetJobMajor || !uiState.targetJobSub) return "목표 직무를 빠짐없이 선택해주세요.";
    if (!uiState.currentIndustryMajor || !uiState.currentIndustrySub) return "현재 산업을 빠짐없이 선택해주세요.";
    if (!uiState.targetIndustryMajor || !uiState.targetIndustrySub) return "목표 산업을 빠짐없이 선택해주세요.";

    if (
      !resolvedPayload.currentJobId ||
      !resolvedPayload.currentIndustryId ||
      !resolvedPayload.targetJobId ||
      !resolvedPayload.targetIndustryId
    ) {
      return "선택값을 canonical id로 확정하지 못했습니다. 다시 선택해주세요.";
    }

    return "";
  }

  function handleSubmit() {
    const message = getValidationMessage();
    if (message) {
      patchUi({ submitError: message });
      return;
    }
    if (typeof onSubmit !== "function") {
      patchUi({ submitError: "전달 함수를 찾지 못했습니다." });
      return;
    }
    try {
      onStartAnalysis?.({
        analysis_type: TRANSITION_LITE_ANALYSIS_TYPE,
        page_type: "landing",
        entry_cta_name: "transition_lite_result_submit",
      });
    } catch { }
    onSubmit({
      currentJobId: resolvedPayload.currentJobId,
      currentIndustryId: resolvedPayload.currentIndustryId,
      targetJobId: resolvedPayload.targetJobId,
      targetIndustryId: resolvedPayload.targetIndustryId,
    });
  }

  function goToPrevStep() {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }

  function goToNextStep() {
    if (!stepCompletion[currentStep]) return;
    setCurrentStep((prev) => Math.min(stepCards.length, prev + 1));
  }

  function handleStepTabClick(step) {
    if (step <= maxUnlockedStep) setCurrentStep(step);
  }

  const tabButtonClass = (step) => {
    const isActive = currentStep === step;
    const isDone = stepCompletion[step];
    const isUnlocked = step <= maxUnlockedStep;

    if (isActive) {
      return "rounded-full border border-violet-600 bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_6px_20px_rgba(124,58,237,0.18)] md:px-3.5 md:py-2 md:text-xs";
    }
    if (isDone) {
      return "rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700 md:px-3.5 md:py-2 md:text-xs";
    }
    if (isUnlocked) {
      return "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 md:px-3.5 md:py-2 md:text-xs";
    }
    return "rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-300 md:px-3.5 md:py-2 md:text-xs";
  };

  const optionButtonClass = (selected) =>
    selected
      ? "rounded-xl border border-violet-600 bg-violet-600/95 px-2.5 py-2 text-left text-[13px] font-semibold text-white shadow-[0_8px_24px_rgba(124,58,237,0.18)] md:rounded-2xl md:px-4 md:py-3.5 md:text-sm"
      : "rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left text-[13px] font-medium text-slate-700 transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:bg-slate-50 md:rounded-2xl md:px-4 md:py-3.5 md:text-sm";

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_344px]">
      {/* left: main card */}
      <div className="min-w-0 rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)] md:rounded-[28px] md:p-6">
        <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-violet-700">
          TRANSITION LITE
        </div>
        <div className="mt-2.5 text-[24px] font-semibold tracking-[-0.03em] leading-[1.15] text-slate-950 md:mt-3 md:text-[28px] md:leading-none">
          {"\uC9C1\uBB34\u00B7\uC0B0\uC5C5 \uC804\uD658 \uAC04\uB2E8 \uBD84\uC11D"}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-[1.65] text-slate-600 md:leading-6 hidden md:block">
          {"\uD604\uC7AC 4\uB2E8\uACC4\uB9CC \uC120\uD0DD\uD558\uBA74 \uAC01 \uD56D\uBAA9\uC758 canonical id\uB97C \uC21C\uC11C\uB300\uB85C \uD655\uC815\uD569\uB2C8\uB2E4."}
        </p>

        <div className="mt-4 flex flex-wrap gap-2 md:mt-5 md:gap-2.5">
          {stepCards.map((item) => (
            <button
              key={`step-tab-${item.step}`}
              type="button"
              className={tabButtonClass(item.step)}
              onClick={() => handleStepTabClick(item.step)}
            >
              {item.step}. {item.shortLabel}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-[20px] border border-slate-200 bg-white md:mt-6 md:rounded-[28px]">
          <div className="h-1.5 w-full bg-violet-600" />
          <div className="bg-[linear-gradient(180deg,rgba(245,243,255,0.92)_0%,rgba(255,255,255,1)_38%)] p-2 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-violet-700">
                  STEP {activeStepCard.step}
                </div>
                <div className="mt-2 text-[18px] font-semibold tracking-[-0.03em] leading-[1.2] text-slate-950 md:mt-3 md:text-[22px] md:leading-none">
                  {activeStepCard.title}
                </div>
                <p className="mt-1.5 text-sm leading-[1.65] text-slate-600 md:leading-6 hidden md:block">{activeStepCard.description}</p>
              </div>

              {stepCompletion[currentStep] ? (
                <div className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  선택 완료
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2 md:mt-6 md:rounded-3xl md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-wide text-slate-700">대분류</div>
                <div className="text-[11px] text-slate-400">먼저 대분류를 선택해주세요</div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 md:gap-2.5">
                {activeStepCard.majorOptions.map(({ v, t }) => (
                  <button
                    key={`major-${activeStepCard.step}-${v}`}
                    type="button"
                    className={optionButtonClass(activeStepCard.majorValue === v)}
                    onClick={() => activeStepCard.onSelectMajor(v)}
                  >
                    {t || v}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-2 rounded-xl border border-slate-200 bg-white p-2 md:mt-4 md:rounded-3xl md:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-semibold tracking-wide text-slate-700">세부 선택</div>
                <div className="text-[11px] text-slate-400">
                  선택된 대분류: {renderValue(activeStepCard.majorLabel)}
                </div>
              </div>

              {activeStepCard.majorValue ? (
                <div className="mt-2 grid grid-cols-2 gap-1.5 md:gap-2.5">
                  {activeStepCard.subOptions.map(({ v, t }) => (
                    <button
                      key={`sub-${activeStepCard.step}-${v}`}
                      type="button"
                      className={optionButtonClass(activeStepCard.subValue === v)}
                      onClick={() => activeStepCard.onSelectSub(v)}
                    >
                      {t || v}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3.5 py-4 text-sm leading-[1.65] text-slate-500 md:rounded-2xl md:px-4 md:py-5 md:leading-6">
                  대분류를 먼저 선택하면 세부항목이 나타납니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {uiState.submitError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {uiState.submitError}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 md:mt-6 md:gap-3">
          <div className="flex flex-row justify-end gap-3">
            <button
              type="button"
              className={
                currentStep === 1
                  ? "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-300"
                  : "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              }
              onClick={goToPrevStep}
              disabled={currentStep === 1}
            >
              이전
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                className={
                  stepCompletion[currentStep]
                    ? "rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition-transform hover:-translate-y-[1px]"
                    : "rounded-full bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-400"
                }
                onClick={goToNextStep}
                disabled={!stepCompletion[currentStep]}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className={
                  allStepsComplete && payloadReady
                    ? "rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(124,58,237,0.22)] transition-transform hover:-translate-y-[1px]"
                    : "rounded-full bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-400"
                }
                onClick={handleSubmit}
                disabled={!allStepsComplete || !payloadReady}
              >
                간편 분석 시작
              </button>
            )}
          </div>

          {!allStepsComplete ? (
            <div className="text-xs leading-5 text-slate-500">
              모든 단계를 완료하면 분석 시작 버튼이 활성화됩니다.
            </div>
          ) : null}
        </div>
      </div>

      {/* right: 선택 현황 — 큰 카드 바깥 오른쪽 column */}
      <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 md:rounded-3xl md:p-4 lg:self-start lg:h-fit lg:sticky lg:top-6">
        <div className="flex items-center justify-between gap-3">
          <div className="text-[11px] font-semibold tracking-[0.08em] text-slate-500">{"\uC120\uD0DD \uD604\uD669"}</div>
          <div className="text-[11px] font-medium text-slate-400">{"\uC785\uB825 \uC694\uC57D"}</div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-slate-900">
              {completedSummaryCount} / {summaryItems.length} {"\uC644\uB8CC"}
            </div>
            <button
              type="button"
              className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700"
              onClick={() => setIsMobileSelectionSummaryOpen((prev) => !prev)}
            >
              {isMobileSelectionSummaryOpen ? "\uC811\uAE30" : "STEP " + currentStep}
            </button>
          </div>
          <div className="mt-2 text-[12px] leading-5 text-slate-600">
            {compactSummaryLine}
          </div>
        </div>

        <div className={`${isMobileSelectionSummaryOpen ? "mt-3 grid gap-2.5" : "hidden"} md:mt-3 md:grid md:gap-3 md:grid-cols-2`}>
          {summaryItems.map((item, index) => {
            const isCurrent = currentStep === index + 1;

            return (
              <div
                key={item.label}
                className={
                  isCurrent
                    ? "rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:rounded-2xl md:px-4 md:py-3"
                    : "rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 md:rounded-2xl md:px-4 md:py-3"
                }
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold tracking-wide text-slate-500">{item.label}</div>
                  {isCurrent ? (
                    <div className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700">
                      {"\uC120\uD0DD \uC911"}
                    </div>
                  ) : null}
                </div>
                <div className="mt-1.5 text-sm font-medium leading-[1.55] text-slate-800 md:mt-2 md:leading-6">{item.value}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
