import { useEffect, useState, useRef } from "react";
import IndustrySelector from "./IndustrySelector";
import RoleSelector from "./RoleSelector";
import CareerQuestions from "./CareerQuestions";
import JDInput from "./JDInput";
import ResumeInput from "./ResumeInput";
import { ChevronLeft } from "lucide-react";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";

// flowStep: App.jsx??`step` 蹂?섏? 異⑸룎 諛⑹?瑜??꾪빐 蹂꾨룄 ?ㅼ엫 ?ъ슜
const FLOW = {
  INTRO: 0,
  INDUSTRY_CURRENT: 1,
  INDUSTRY_TARGET: 2,
  ROLE: 3,
  CAREER: 4,
  COMPENSATION: 5,
  JD: 6,
  RESUME: 7,
  ANALYZE: 8,
};

// KSCO major 직무군 (1차 선택)
const KSCO_MAJOR_OPTIONS = [
  { v: "unknown", t: "모름/기타" },
  { v: "ksco_2", t: "전문가 및 관련 종사자 (IT 개발, 기획, 연구, 의료, 교육 전문직)" },
  { v: "ksco_3", t: "사무 종사자 (일반 사무, 행정, 회계, 인사, 경영 지원)" },
  { v: "ksco_5", t: "판매영업 (보험영업, 매장 관리, 온/오프라인 판매)" },
  { v: "ksco_8", t: "장치기계 조작 및 조립 (공장 생산, 기계 운전, 조립, 운전원)" },
];
const KSCO_MAJOR_LABELS = {
  unknown: "모름/기타",
  ksco_2: "전문가 및 관련 종사자",
  ksco_3: "사무 종사자",
  ksco_5: "판매영업",
  ksco_8: "장치기계 조작 및 조립",
};
const KSCO_MAJOR_SUB_LABELS = {
  unknown: "직무가 애매하면 먼저 선택",
  ksco_2: "개발 / 데이터 / 엔지니어 / 연구 / 전략기획",
  ksco_3: "회계 / 인사 / 총무 / 영업관리 / 운영관리",
  ksco_5: "세일즈 / 영업 / 고객 유치",
  ksco_8: "생산 / 설비 / 공정 / 기계조작",
};

// ksco_3(사무 종사자) 세부 직무 (2차 선택)
const OFFICE_SUB_OPTIONS = [
  { v: "office_general", t: "일반 사무" },
  { v: "office_admin", t: "행정" },
  { v: "office_accounting", t: "회계" },
  { v: "office_hr", t: "인사" },
  { v: "office_bizsupport", t: "경영 지원" },
  { v: "office_finance", t: "재무" },
  { v: "office_planning", t: "기획" },
  { v: "office_opsSupport", t: "운영 지원" },
  { v: "office_sales", t: "영업(국내/해외/기술)" },
  { v: "office_marketing", t: "마케팅" },
  { v: "office_procurement", t: "구매/조달" },
];

function __pmSafeSubInput(value) {
  return String(value ?? "").trimStart();
}

export default function InputFlow({
  state,
  setState,
  onAnalyze,
  onGoDoc,
  onExtract,
  inputFlowUiState,
  onInputFlowUiStateChange,
}) {
  const __renderCountRef = useRef(0);
  const __toAppPushCountRef = useRef(0);
  const __lastToAppPayloadRef = useRef(null);
  const __skipNextToAppRef = useRef(false);
  const __didInitialHydrateRef = useRef(false);
  const __allowExternalHydrateRef = useRef(false);
  const __stableStringify = (obj) => {
    const o = (obj && typeof obj === "object") ? obj : {};
    const keys = Object.keys(o).sort();
    const out = {};
    for (const k of keys) out[k] = o[k];
    try {
      return JSON.stringify(out);
    } catch {
      return "";
    }
  };
  const __normalizeUiPayload = (v) => {
    const n = (v && typeof v === "object") ? v : {};
    return {
      flowStep: Number.isFinite(Number(n.flowStep)) ? Number(n.flowStep) : FLOW.INDUSTRY_CURRENT,
      roleMajorStep: n.roleMajorStep ?? "current-major",
      roleMajorSelected: n.roleMajorSelected ?? "",
      currentMajorSelected: n.currentMajorSelected ?? "",
    };
  };
  const __isSameUiState = (a, b) => {
    const x = (a && typeof a === "object") ? a : {};
    const y = (b && typeof b === "object") ? b : {};
    return (
      x.flowStep === y.flowStep &&
      x.roleMajorStep === y.roleMajorStep &&
      x.roleMajorSelected === y.roleMajorSelected &&
      x.currentMajorSelected === y.currentMajorSelected
    );
  };
  const __pushLoopTrace = (source, payload) => {
    try {
      if (typeof window === "undefined") return;
      if (!Array.isArray(window.__PASSMAP_LOOP_TRACE__)) window.__PASSMAP_LOOP_TRACE__ = [];
      window.__PASSMAP_LOOP_TRACE__.push({
        source,
        ts: Date.now(),
        payload: payload || null,
      });
      if (window.__PASSMAP_LOOP_TRACE__.length > 200) {
        window.__PASSMAP_LOOP_TRACE__ = window.__PASSMAP_LOOP_TRACE__.slice(-200);
      }
    } catch { }
  };
  const __ui = (inputFlowUiState && typeof inputFlowUiState === "object") ? inputFlowUiState : {};
  const [flowStep, setFlowStep] = useState(
    Number.isFinite(Number(__ui.flowStep)) ? Number(__ui.flowStep) : FLOW.INTRO
  );
  const [submitError, setSubmitError] = useState("");
  // ROLE 단계 내부 상태: "current-major" / "current-sub" / "target-major" / "target-sub"
  const [roleMajorStep, setRoleMajorStep] = useState(__ui.roleMajorStep ?? "current-major");
  const [roleMajorSelected, setRoleMajorSelected] = useState(__ui.roleMajorSelected ?? "");
  const [currentMajorSelected, setCurrentMajorSelected] = useState(__ui.currentMajorSelected ?? "");
  // append-only: 泥⑤? ?곹깭 ?쒖떆??  const [attachedFileName, setAttachedFileName] = useState(null);
  const [attachedFileName, setAttachedFileName] = useState(null);
  const fileInputRef = useRef(null);

  const totalSteps = 7;
  const progress = Math.round(((flowStep - 1) / totalSteps) * 100);
  const isEntryLevelMode = Boolean(state?.entryLevelMode);
  const __safeKscoOptions = Array.isArray(KSCO_MAJOR_OPTIONS)
    ? KSCO_MAJOR_OPTIONS
      .filter(Boolean)
      .map((item) => ({
        v: String(item?.v ?? ""),
        t: String(item?.t ?? ""),
      }))
      .filter((item) => item.v && item.t)
    : [];

  useEffect(() => {
    __renderCountRef.current += 1;
    const count = __renderCountRef.current;
    try { if (typeof window !== "undefined") window.__INPUTFLOW_RENDER_COUNT__ = count; } catch { }
    console.log("[INPUTFLOW_RENDER]", {
      count,
      flowStep,
      roleMajorStep,
      roleMajorSelected,
      currentMajorSelected,
    });
    __pushLoopTrace("INPUTFLOW_RENDER", {
      count,
      flowStep,
      roleMajorStep,
      roleMajorSelected,
      currentMajorSelected,
    });
  });

  useEffect(() => {
    const n = (inputFlowUiState && typeof inputFlowUiState === "object") ? inputFlowUiState : {};

    const nextFlowStep = Number.isFinite(Number(n.flowStep)) ? Number(n.flowStep) : FLOW.INDUSTRY_CURRENT;
    const nextRoleMajorStep = n.roleMajorStep ?? "current-major";
    const nextRoleMajorSelected = n.roleMajorSelected ?? "";
    const nextCurrentMajorSelected = n.currentMajorSelected ?? "";
    const willChange = {
      flowStep: nextFlowStep !== flowStep,
      roleMajorStep: nextRoleMajorStep !== roleMajorStep,
      roleMajorSelected: nextRoleMajorSelected !== roleMajorSelected,
      currentMajorSelected: nextCurrentMajorSelected !== currentMajorSelected,
    };
    const hasAnyChange =
      willChange.flowStep ||
      willChange.roleMajorStep ||
      willChange.roleMajorSelected ||
      willChange.currentMajorSelected;
    const nextUiPayload = {
      flowStep: nextFlowStep,
      roleMajorStep: nextRoleMajorStep,
      roleMajorSelected: nextRoleMajorSelected,
      currentMajorSelected: nextCurrentMajorSelected,
    };
    const currentLocalPayload = {
      flowStep,
      roleMajorStep,
      roleMajorSelected,
      currentMajorSelected,
    };
    const isIncomingSameAsLastSent = __isSameUiState(__lastToAppPayloadRef.current, nextUiPayload);
    const isLocalDifferentFromIncoming = !__isSameUiState(currentLocalPayload, nextUiPayload);
    const isStaleParentPayload = isIncomingSameAsLastSent && isLocalDifferentFromIncoming;
    const isStepBackflow = nextFlowStep < flowStep;
    const isStaleParentBackflow = isStaleParentPayload && isStepBackflow;
    if (isStaleParentBackflow) {
      console.log("[INPUTFLOW_PARENT_SYNC_SKIP_BACKFLOW]", {
        reason: "incoming_equals_last_sent_and_step_backflow",
        nextUiPayload,
        currentLocalPayload,
      });
      __pushLoopTrace("INPUTFLOW_PARENT_SYNC_SKIP_BACKFLOW", {
        reason: "incoming_equals_last_sent_and_step_backflow",
        nextUiPayload,
        currentLocalPayload,
      });
      return;
    }
    if (isStaleParentPayload) {
      console.log("[INPUTFLOW_PARENT_SYNC_SKIP_STALE]", {
        reason: "incoming_equals_last_sent_but_local_is_newer",
        nextUiPayload,
        currentLocalPayload,
      });
      __pushLoopTrace("INPUTFLOW_PARENT_SYNC_SKIP_STALE", {
        reason: "incoming_equals_last_sent_but_local_is_newer",
        nextUiPayload,
        currentLocalPayload,
      });
      return;
    }
    const isResetPayload =
      nextFlowStep === FLOW.INDUSTRY_CURRENT &&
      nextRoleMajorStep === "current-major" &&
      nextRoleMajorSelected === "" &&
      nextCurrentMajorSelected === "";
    if (isResetPayload) {
      __allowExternalHydrateRef.current = true;
    }
    const shouldHydrate =
      !__didInitialHydrateRef.current || __allowExternalHydrateRef.current;
    if (!shouldHydrate) {
      return;
    }
    __allowExternalHydrateRef.current = false;
    if (!__didInitialHydrateRef.current) {
      __didInitialHydrateRef.current = true;
    }
    console.log("[INPUTFLOW_PARENT_SYNC]", {
      incoming: n,
      local: { flowStep, roleMajorStep, roleMajorSelected, currentMajorSelected },
      willChange,
    });
    __pushLoopTrace("INPUTFLOW_PARENT_SYNC", {
      incoming: n,
      local: { flowStep, roleMajorStep, roleMajorSelected, currentMajorSelected },
      willChange,
    });
    const __setterDecision = {
      flowStep: { prev: flowStep, next: nextFlowStep, willSet: nextFlowStep !== flowStep },
      roleMajorStep: { prev: roleMajorStep, next: nextRoleMajorStep, willSet: nextRoleMajorStep !== roleMajorStep },
      roleMajorSelected: { prev: roleMajorSelected, next: nextRoleMajorSelected, willSet: nextRoleMajorSelected !== roleMajorSelected },
      currentMajorSelected: { prev: currentMajorSelected, next: nextCurrentMajorSelected, willSet: nextCurrentMajorSelected !== currentMajorSelected },
    };
    console.log("[INPUTFLOW_PARENT_SYNC_DECISION]", __setterDecision);
    __pushLoopTrace("INPUTFLOW_PARENT_SYNC_DECISION", __setterDecision);
    if (nextRoleMajorStep !== roleMajorStep) {
      console.log("[ROLESTEP_OVERWRITE]", {
        source: "parentSync",
        flowStepPrev: flowStep,
        flowStepNext: nextFlowStep,
        roleMajorStepPrev: roleMajorStep,
        roleMajorStepNext: nextRoleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      __pushLoopTrace("ROLESTEP_OVERWRITE", {
        source: "parentSync",
        flowStepPrev: flowStep,
        flowStepNext: nextFlowStep,
        roleMajorStepPrev: roleMajorStep,
        roleMajorStepNext: nextRoleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
    }
    if (hasAnyChange) __skipNextToAppRef.current = true;

    if (nextFlowStep !== flowStep) setFlowStep(nextFlowStep);
    if (nextRoleMajorStep !== roleMajorStep) setRoleMajorStep(nextRoleMajorStep);
    if (nextRoleMajorSelected !== roleMajorSelected) setRoleMajorSelected(nextRoleMajorSelected);
    if (nextCurrentMajorSelected !== currentMajorSelected) setCurrentMajorSelected(nextCurrentMajorSelected);
  }, [
    inputFlowUiState,
    flowStep,
    roleMajorStep,
    roleMajorSelected,
    currentMajorSelected,
  ]);

  useEffect(() => {
    if (typeof onInputFlowUiStateChange !== "function") return;
    if (__skipNextToAppRef.current) {
      __skipNextToAppRef.current = false;
      console.log("[INPUTFLOW_TO_APP_SKIP_PARENT_HYDRATE]", { reason: "parent_hydrate_once" });
      __pushLoopTrace("INPUTFLOW_TO_APP_SKIP_PARENT_HYDRATE", { reason: "parent_hydrate_once" });
      return;
    }
    const payload = {
      flowStep,
      roleMajorStep,
      roleMajorSelected,
      currentMajorSelected,
    };
    const currentPayload = __normalizeUiPayload(payload);
    const lastPayload = __normalizeUiPayload(__lastToAppPayloadRef.current);
    const payloadKeys = Object.keys(payload).sort();
    const sameAsLastByString = __stableStringify(currentPayload) === __stableStringify(lastPayload);
    const sameAsLast = __isSameUiState(__lastToAppPayloadRef.current, payload);
    console.log("[INPUTFLOW_TO_APP_PRECHECK]", {
      currentPayload,
      lastPayload,
      sameAsLast,
      sameAsLastByString,
      payloadKeys,
      willCall: !sameAsLast,
    });
    __pushLoopTrace("INPUTFLOW_TO_APP_PRECHECK", {
      currentPayload,
      lastPayload,
      sameAsLast,
      sameAsLastByString,
      payloadKeys,
      willCall: !sameAsLast,
    });
    if (sameAsLast) {
      console.log("[INPUTFLOW_TO_APP_SKIP]", { payload, sameAsLast: true });
      __pushLoopTrace("INPUTFLOW_TO_APP_SKIP", { payload, sameAsLast: true });
      return;
    }
    __lastToAppPayloadRef.current = { ...payload };
    __toAppPushCountRef.current += 1;
    try { if (typeof window !== "undefined") window.__INPUTFLOW_UISTATE_PUSH_COUNT__ = __toAppPushCountRef.current; } catch { }
    console.log("[INPUTFLOW_TO_APP]", {
      count: __toAppPushCountRef.current,
      payload,
      sameAsLast,
    });
    __pushLoopTrace("INPUTFLOW_TO_APP", {
      count: __toAppPushCountRef.current,
      payload,
      sameAsLast,
    });
    console.log("[INPUTFLOW_TO_APP_CALL]", {
      count: __toAppPushCountRef.current,
      payload,
      sameAsLast,
      call: true,
    });
    __pushLoopTrace("INPUTFLOW_TO_APP_CALL", {
      count: __toAppPushCountRef.current,
      payload,
      sameAsLast,
      call: true,
    });
    onInputFlowUiStateChange(payload);
  }, [
    flowStep,
    roleMajorStep,
    roleMajorSelected,
    currentMajorSelected,
    onInputFlowUiStateChange,
  ]);
  useEffect(() => {
    console.log("RENDER_BUTTON_BLOCK: InputFlow", {
      flowStep,
      roleMajorStep,
    });
  }, [flowStep, roleMajorStep]);
  useEffect(() => {
    if (flowStep !== FLOW.ROLE) return;
    console.log("RENDER_BUTTON_BLOCK: KSCO_OPTIONS", {
      rawIsArray: Array.isArray(KSCO_MAJOR_OPTIONS),
      rawCount: Array.isArray(KSCO_MAJOR_OPTIONS) ? KSCO_MAJOR_OPTIONS.length : "not-array",
      safeCount: __safeKscoOptions.length,
      roleMajorStep,
    });
  }, [flowStep, roleMajorStep, __safeKscoOptions.length]);

  function getNextStep(step) {
    if (step === FLOW.INDUSTRY_CURRENT) return FLOW.INDUSTRY_TARGET;
    if (step === FLOW.INDUSTRY_TARGET) return FLOW.ROLE;
    if (step === FLOW.ROLE) return FLOW.CAREER;
    if (step === FLOW.CAREER) return FLOW.COMPENSATION;
    if (step === FLOW.COMPENSATION) return FLOW.JD;
    if (step === FLOW.JD) return FLOW.RESUME;
    if (step === FLOW.RESUME) return FLOW.ANALYZE;
    return step;
  }

  function getPrevStep(step) {
    if (step === FLOW.ANALYZE) return FLOW.RESUME;
    if (step === FLOW.RESUME) return FLOW.JD;
    if (step === FLOW.JD) return FLOW.COMPENSATION;
    if (step === FLOW.COMPENSATION) return FLOW.CAREER;
    if (step === FLOW.CAREER) return FLOW.ROLE;
    if (step === FLOW.ROLE) return FLOW.INDUSTRY_TARGET;
    if (step === FLOW.INDUSTRY_TARGET) return FLOW.INDUSTRY_CURRENT;
    return step;
  }

  const handleIndustryCurrent = (v) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      industryCurrent: v,
      industryCurrentSub: "",
    }));
  };

  const handleIndustryTarget = (v) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      industryTarget: v,
      industryTargetSub: "",
    }));
  };

  const handleIndustryCurrentNext = () => {
    setSubmitError("");
    setFlowStep(FLOW.INDUSTRY_TARGET);
  };

  const handleIndustryTargetNext = () => {
    setSubmitError("");
    const __observedRoleCurrent = state?.roleCurrent ?? "";
    const __observedCurrentRole = state?.currentRole ?? "";
    const __observedCurrentRoleResolved = String(__observedRoleCurrent || __observedCurrentRole || "").trim();
    const __observedHasCurrentRole = !!__observedCurrentRoleResolved;
    const __nextRoleMajorStep = "current-major";
    console.log("[ROLE_ENTRY_DECISION]", {
      source: "handleIndustryTarget",
      flowStep,
      roleMajorStepPrev: roleMajorStep,
      roleMajorStepNext: __nextRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
      observedCurrentRoleResolved: __observedCurrentRoleResolved,
      observedHasCurrentRole: __observedHasCurrentRole,
      observedStateCurrentRole: __observedCurrentRole,
      observedStateRoleCurrent: __observedRoleCurrent,
      stateRoleTarget: state?.roleTarget ?? "",
    });
    __pushLoopTrace("ROLE_ENTRY_DECISION", {
      source: "handleIndustryTarget",
      flowStep,
      roleMajorStepPrev: roleMajorStep,
      roleMajorStepNext: __nextRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
      observedCurrentRoleResolved: __observedCurrentRoleResolved,
      observedHasCurrentRole: __observedHasCurrentRole,
      observedStateCurrentRole: __observedCurrentRole,
      observedStateRoleCurrent: __observedRoleCurrent,
      stateRoleTarget: state?.roleTarget ?? "",
    });
    setRoleMajorStep(__nextRoleMajorStep);
    setFlowStep(FLOW.ROLE);
  };

  const handleEntryLevelModeChange = (checked) => {
    setSubmitError("");
    setState((prev) => {
      const __prev = (prev && typeof prev === "object") ? prev : {};
      const __snapshot =
        (__prev.__entryLevelRestoreSnapshot && typeof __prev.__entryLevelRestoreSnapshot === "object")
          ? __prev.__entryLevelRestoreSnapshot
          : null;

    if (checked) {
      const __nextSnapshot = __prev.entryLevelMode
        ? (__snapshot || null)
        : {
          careerTotalYears: __prev?.career?.totalYears ?? 0,
          careerGapMonths: __prev?.career?.gapMonths ?? 0,
          careerJobChanges: __prev?.career?.jobChanges ?? 0,
          careerLastTenureMonths: __prev?.career?.lastTenureMonths ?? 0,
          careerLeadershipLevel: __prev?.career?.leadershipLevel ?? "individual",
          industryCurrent: __prev?.industryCurrent ?? "",
          industryCurrentSub: __prev?.industryCurrentSub ?? "",
          currentRole: __prev?.currentRole ?? "",
          roleCurrent: __prev?.roleCurrent ?? "",
          roleCurrentSub: __prev?.roleCurrentSub ?? "",
          currentRoleKscoMajor: __prev?.currentRoleKscoMajor ?? "unknown",
          currentRoleKscoOfficeSub: __prev?.currentRoleKscoOfficeSub ?? "",
          salaryCurrent: __prev?.salaryCurrent ?? "",
          companySizeCandidate: __prev?.companySizeCandidate ?? "unknown",
        };

        return {
          ...__prev,
          entryLevelMode: true,
          __entryLevelRestoreSnapshot: __nextSnapshot,
          career: {
            ...(__prev?.career || {}),
            totalYears: 0,
            gapMonths: 0,
            jobChanges: 0,
            lastTenureMonths: 0,
            leadershipLevel: "individual",
          },
          industryCurrent: "unknown",
          industryCurrentSub: "",
          currentRole: "",
          roleCurrent: "",
          roleCurrentSub: "",
          currentRoleKscoMajor: "unknown",
          currentRoleKscoOfficeSub: "",
          salaryCurrent: "",
          companySizeCandidate: "unknown",
        };
      }

      return {
        ...__prev,
        entryLevelMode: false,
      __entryLevelRestoreSnapshot: null,
      career: {
        ...(__prev?.career || {}),
        totalYears:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "careerTotalYears")
            ? __snapshot.careerTotalYears
            : (__prev?.career?.totalYears ?? 0),
        gapMonths:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "careerGapMonths")
            ? __snapshot.careerGapMonths
            : (__prev?.career?.gapMonths ?? 0),
        jobChanges:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "careerJobChanges")
            ? __snapshot.careerJobChanges
            : (__prev?.career?.jobChanges ?? 0),
        lastTenureMonths:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "careerLastTenureMonths")
            ? __snapshot.careerLastTenureMonths
            : (__prev?.career?.lastTenureMonths ?? 0),
        leadershipLevel:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "careerLeadershipLevel")
            ? (__snapshot.careerLeadershipLevel ?? "individual")
            : (__prev?.career?.leadershipLevel ?? "individual"),
      },
      industryCurrent:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "industryCurrent")
          ? (__snapshot.industryCurrent ?? "")
          : (__prev?.industryCurrent ?? ""),
      industryCurrentSub:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "industryCurrentSub")
          ? (__snapshot.industryCurrentSub ?? "")
          : (__prev?.industryCurrentSub ?? ""),
        currentRole:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "currentRole")
            ? (__snapshot.currentRole ?? "")
            : (__prev?.currentRole ?? ""),
      roleCurrent:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "roleCurrent")
          ? (__snapshot.roleCurrent ?? "")
          : (__prev?.roleCurrent ?? ""),
      roleCurrentSub:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "roleCurrentSub")
          ? (__snapshot.roleCurrentSub ?? "")
          : (__prev?.roleCurrentSub ?? ""),
      currentRoleKscoMajor:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "currentRoleKscoMajor")
          ? (__snapshot.currentRoleKscoMajor ?? "unknown")
          : (__prev?.currentRoleKscoMajor ?? "unknown"),
      currentRoleKscoOfficeSub:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "currentRoleKscoOfficeSub")
          ? (__snapshot.currentRoleKscoOfficeSub ?? "")
          : (__prev?.currentRoleKscoOfficeSub ?? ""),
      salaryCurrent:
        __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "salaryCurrent")
          ? (__snapshot.salaryCurrent ?? "")
          : (__prev?.salaryCurrent ?? ""),
        companySizeCandidate:
          __snapshot && Object.prototype.hasOwnProperty.call(__snapshot, "companySizeCandidate")
            ? (__snapshot.companySizeCandidate ?? "unknown")
            : (__prev?.companySizeCandidate ?? "unknown"),
      };
    });
    if (checked) {
      setSalaryImeBuffer((prev) => ({ ...prev, salaryCurrent: "" }));
      setRoleMajorStep("target-major");
      setCurrentMajorSelected("");
      if (flowStep === FLOW.INDUSTRY_CURRENT) {
        setFlowStep(FLOW.INDUSTRY_TARGET);
      }
    }
  };

  const handleCurrentRole = (label, major, sub) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      roleCurrent: label,
      roleCurrentSub: String(sub ?? "").trim() ? sub : prev?.roleCurrentSub ?? "",
      currentRoleKscoMajor: major ?? "unknown",
      currentRoleKscoOfficeSub: sub ?? "",
    }));
    setCurrentMajorSelected("");
    setRoleMajorStep("target-major");
  };

  const handleRole = (roleLabel, major, sub) => {
    setSubmitError("");
    setState((prev) => ({
      ...prev,
      roleTarget: roleLabel,
      roleTargetSub: String(sub ?? "").trim() ? sub : prev?.roleTargetSub ?? "",
      roleKscoMajor: major ?? "unknown",
      roleKscoOfficeSub: sub ?? "",
    }));
    setRoleMajorStep("current-major");
    setRoleMajorSelected("");
    setFlowStep(FLOW.CAREER);
  };

  // CareerQuestions??onChange濡?state瑜?吏곸젒 ?낅뜲?댄듃?섎?濡? onDone? ?⑥닚 ?대룞
  const handleCareerDone = () => {
    setSubmitError("");
    setFlowStep(FLOW.COMPENSATION);
  };

  const handleCompensationDone = () => {
    setSubmitError("");
    setFlowStep((prev) => getNextStep(prev));
  };

  // JDInput / ResumeInput??onChange濡?吏곸젒 ?낅뜲?댄듃?섎?濡?onDone? ?⑥닚 ?대룞
  const handleJDDone = () => {
    setSubmitError("");
    setFlowStep((prev) => getNextStep(prev));
  };

  const handleResumeDone = () => {
    setSubmitError("");
    setFlowStep(FLOW.ANALYZE);
  };

  const [salaryImeBuffer, setSalaryImeBuffer] = useState({ salaryCurrent: "", salaryTarget: "" });
  const [salaryComposing, setSalaryComposing] = useState({ salaryCurrent: false, salaryTarget: false });

  useEffect(() => {
    if (!isEntryLevelMode) return;
    if (flowStep === FLOW.ROLE) {
      console.log("[ROLE_ENTRYLEVEL_GUARD_SKIP]", {
        source: "entryLevelEffect",
        reason: "role-step-visible",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      __pushLoopTrace("ROLE_ENTRYLEVEL_GUARD_SKIP", {
        source: "entryLevelEffect",
        reason: "role-step-visible",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      return;
    }
    if (roleMajorStep === "current-major" || roleMajorStep === "current-sub") {
      console.log("[ROLE_ENTRYLEVEL_GUARD_SKIP]", {
        source: "entryLevelEffect",
        reason: "current-step-preserved",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      __pushLoopTrace("ROLE_ENTRYLEVEL_GUARD_SKIP", {
        source: "entryLevelEffect",
        reason: "current-step-preserved",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      return;
    }
    if (flowStep !== FLOW.INDUSTRY_TARGET) {
      console.log("[ROLE_ENTRYLEVEL_GUARD_SKIP]", {
        source: "entryLevelEffect",
        reason: "not-entrylevel-target-flow",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      __pushLoopTrace("ROLE_ENTRYLEVEL_GUARD_SKIP", {
        source: "entryLevelEffect",
        reason: "not-entrylevel-target-flow",
        flowStep,
        roleMajorStep,
        entryLevelMode: isEntryLevelMode,
      });
      return;
    }
    if (roleMajorStep !== "target-major" && roleMajorStep !== "target-sub") {
      console.log("[ROLESTEP_OVERWRITE]", {
        source: "entryLevelEffect",
        flowStep,
        roleMajorStepPrev: roleMajorStep,
        roleMajorStepNext: "target-major",
        entryLevelMode: isEntryLevelMode,
      });
      __pushLoopTrace("ROLESTEP_OVERWRITE", {
        source: "entryLevelEffect",
        flowStep,
        roleMajorStepPrev: roleMajorStep,
        roleMajorStepNext: "target-major",
        entryLevelMode: isEntryLevelMode,
      });
      setRoleMajorStep("target-major");
      setCurrentMajorSelected("");
    }
  }, [isEntryLevelMode, roleMajorStep, flowStep]);

  const normalizedRoleMajorStep =
    roleMajorStep === "current-major" ||
      roleMajorStep === "current-sub" ||
      roleMajorStep === "target-major" ||
      roleMajorStep === "target-sub"
      ? roleMajorStep
      : "current-major";

  useEffect(() => {
    if (flowStep !== FLOW.ROLE) return;
    const __branch =
      normalizedRoleMajorStep === "current-major"
        ? "current-major"
        : normalizedRoleMajorStep === "current-sub"
          ? "current-sub"
          : normalizedRoleMajorStep === "target-sub"
            ? "target-sub"
            : "target-major";
    console.log("[ROLE_STEP_NORMALIZED]", {
      source: "roleRender",
      flowStep,
      roleMajorStepRaw: roleMajorStep,
      roleMajorStepNormalized: normalizedRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
    });
    console.log("[ROLE_RENDER_BRANCH]", {
      source: "roleRender",
      flowStep,
      roleMajorStep: normalizedRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
      branch: __branch,
    });
    __pushLoopTrace("ROLE_STEP_NORMALIZED", {
      flowStep,
      roleMajorStepRaw: roleMajorStep,
      roleMajorStepNormalized: normalizedRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
    });
    __pushLoopTrace("ROLE_RENDER_BRANCH", {
      flowStep,
      roleMajorStep: normalizedRoleMajorStep,
      entryLevelMode: isEntryLevelMode,
      branch: __branch,
    });
  }, [flowStep, roleMajorStep, normalizedRoleMajorStep, isEntryLevelMode]);

  const getSalaryValue = (key) => {
    const hasBuffer = salaryImeBuffer[key] !== "";
    return hasBuffer ? salaryImeBuffer[key] : String(state?.[key] ?? "");
  };

  const commitSalary = (key, raw) => {
    const v = String(raw ?? "");
    setState((prev) => ({
      ...prev,
      [key]: v,
      ...(key === "salaryTarget" ? { salaryExpected: v } : {}),
    }));
    setSalaryImeBuffer((prev) => ({ ...prev, [key]: "" }));
  };

  // append-only: JD 泥⑤? ?곹깭
  const [jdAttachedFileName, setJdAttachedFileName] = useState(null);
  const jdFileInputRef = useRef(null);
  const [jdFileError, setJdFileError] = useState("");
  const [resumeFileError, setResumeFileError] = useState("");
  // append-only: JD URL 불러오기 상태
  const [jdUrl, setJdUrl] = useState("");
  const [jdUrlLoadStatus, setJdUrlLoadStatus] = useState("idle"); // idle | loading | success | error
  const [jdUrlError, setJdUrlError] = useState("");

  const JD_URL_HOST_ALLOW = new Set([
    "saramin.co.kr",
    "www.saramin.co.kr",
    "jobkorea.co.kr",
    "www.jobkorea.co.kr",
  ]);

  const getJdUrlErrorMessage = (code) => {
    if (code === "UNSUPPORTED_DOMAIN") return "현재는 잡코리아 링크만 지원합니다.";
    if (code === "FETCH_FAILED") return "링크에서 채용공고를 불러오지 못했습니다.";
    if (code === "TEXT_TOO_SHORT") {
      return "채용공고 내용을 충분히 추출하지 못했습니다. 텍스트 붙여넣기 또는 파일 첨부를 이용해 주세요.";
    }
    // append-only: NOT_JOB_DESCRIPTION는 "올바른 링크" 오탐 방지를 위해 별도 메시지로 분리
    if (code === "NOT_JOB_DESCRIPTION") {
      return "공고 본문을 읽지 못했습니다. 텍스트 붙여넣기 또는 파일 첨부를 이용해 주세요.";
    }
    return "올바른 채용공고 링크를 입력해 주세요.";
  };

  const getFileExtractErrorMessage = (res, file) => {
    const code = String(res?.error || res?.message || "").trim().toUpperCase();
    const warning = Array.isArray(res?.meta?.warnings)
      ? String(res.meta.warnings.find(Boolean) || "").trim()
      : "";
    const ext = String(file?.name || "").toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || "";
    const mime = String(file?.type || "").toLowerCase();
    const isImage = ["png", "jpg", "jpeg", "webp"].includes(ext) || mime.startsWith("image/");
    const isDocLike =
      ext === "pdf" ||
      ext === "docx" ||
      ext === "txt" ||
      mime === "application/pdf" ||
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime.startsWith("text/");

    if (code === "OCR_ENDPOINT_UNREACHABLE") return "OCR 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    if (code === "OCR_REQUEST_FAILED") return "OCR 요청에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    if (code === "OCR_EMPTY_TEXT") return "이미지에서 텍스트를 읽지 못했습니다. 더 선명한 이미지로 다시 시도해 주세요.";
    if (isDocLike) return "PDF/Word 텍스트 추출에 실패했습니다. 파일 형식을 확인하거나 다른 파일로 시도해 주세요.";
    if (!isImage && !isDocLike) {
      return "지원하지 않는 형식이거나 파일을 읽지 못했습니다. (PDF, DOCX, TXT, PNG, JPG, JPEG, WEBP 지원)";
    }
    if (warning) return warning;
    return "파일에서 텍스트를 추출하지 못했습니다. 파일 형식/내용을 확인해 주세요.";
  };

  // append-only: 踰꾪듉??泥⑤? ?몃뱾??(resume)
  const handleAttachFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setResumeFileError("");
    const res = await extractTextFromFile(file, "resume");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      console.log("[InputFlow.onExtract]", {
        field: "resume",
        textLen: res?.text?.length
      });
      onExtract("resume", res.text, res.meta);
      setAttachedFileName(file.name);
      setResumeFileError("");
    } else if (res.ok && !res.text?.trim()) {
      setAttachedFileName(null);
      setResumeFileError("파일에서 텍스트를 추출하지 못했습니다. 다른 파일로 다시 시도해 주세요.");
    } else if (!res.ok) {
      setAttachedFileName(null);
      setResumeFileError(getFileExtractErrorMessage(res, file));
    }
    if (e.target) e.target.value = "";
  };

  // append-only: 踰꾪듉??泥⑤? ?몃뱾??(jd)
  const handleAttachJDFile = async (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setJdFileError("");
    const res = await extractTextFromFile(file, "jd");
    if (res.ok && res.text?.trim() && typeof onExtract === "function") {
      console.log("[OCR->InputFlow]", {
        ok: res?.ok,
        textLen: typeof res?.text === "string" ? res.text.length : null,
        textPreview: typeof res?.text === "string" ? res.text.slice(0, 120) : null,
        kind: "jd",
      });
      console.log("[InputFlow.onExtract]", {
        field: "jd",
        textLen: res?.text?.length
      });
      onExtract("jd", res.text, res.meta);
      setJdAttachedFileName(file.name);
      setJdFileError("");
    } else if (res.ok && !res.text?.trim()) {
      setJdAttachedFileName(null);
      setJdFileError("파일에서 텍스트를 추출하지 못했습니다. 다른 파일로 다시 시도해 주세요.");
    } else if (!res.ok) {
      setJdAttachedFileName(null);
      setJdFileError(getFileExtractErrorMessage(res, file));
    }
    if (e.target) e.target.value = "";
  };

  // append-only: URL로 JD 불러오기 (MVP)
  const handleLoadJDFromUrl = async () => {
    const raw = String(jdUrl || "").trim();
    if (!raw) {
      setJdUrlLoadStatus("error");
      setJdUrlError("올바른 채용공고 링크를 입력해 주세요.");
      return;
    }

    let parsed = null;
    try {
      parsed = new URL(raw);
    } catch {
      setJdUrlLoadStatus("error");
      setJdUrlError("올바른 채용공고 링크를 입력해 주세요.");
      return;
    }

    const host = String(parsed.hostname || "").toLowerCase();
    if (!JD_URL_HOST_ALLOW.has(host)) {
      setJdUrlLoadStatus("error");
      setJdUrlError("현재는 잡코리아 링크만 지원합니다.");
      return;
    }

    setJdUrlLoadStatus("loading");
    setJdUrlError("");
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || "";
      const endpoint = `${API_BASE}/api/extract-job-posting`;
      const requestHeaders = { "Content-Type": "application/json" };
      const requestPayload = { url: raw };
      const serializedBody = JSON.stringify(requestPayload);

      // DEBUG: 삭제 필요 — JD URL submit 시 실제 전달 url 확인
      console.log("[JD_URL.submit]", { url: raw, endpoint });
      console.log("[JD_URL.request]", {
        endpoint,
        method: "POST",
        headers: requestHeaders,
        bodyType: typeof serializedBody,
        serializedBodyPreview: String(serializedBody || "").slice(0, 300),
        url: raw,
      });
      try { window.__PASSMAP_JD_URL_DEBUG__ = { at: Date.now(), step: "submit", url: raw, endpoint }; } catch { }
      try {
        window.__PASSMAP_JD_URL_DEBUG__ = {
          ...window.__PASSMAP_JD_URL_DEBUG__,
          step: "request",
          endpoint,
          method: "POST",
          headers: requestHeaders,
          bodyType: typeof serializedBody,
          serializedBodyPreview: String(serializedBody || "").slice(0, 300),
          url: raw,
        };
      } catch { }

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: requestHeaders,
        body: serializedBody,
      });
      const data = await resp.json().catch(() => null);

      // DEBUG: 삭제 필요 — API 응답 원문 핵심 필드 확인
      console.log("[JD_URL.response]", {
        httpStatus: resp.status,
        ok: data?.ok,
        error: data?.error,
        extractionMode: data?.meta?.extractionMode,
        textLength: typeof data?.text === "string" ? data.text.length : null,
        ocrTextLength: typeof data?.ocrText === "string" ? data.ocrText.length : null,
        finalTextLength: typeof data?.finalText === "string" ? data.finalText.length : null,
        textPreview: typeof data?.text === "string" ? data.text.slice(0, 120) : null,
        meta: data?.meta ?? null,
      });
      try {
        window.__PASSMAP_JD_URL_DEBUG__ = {
          ...window.__PASSMAP_JD_URL_DEBUG__,
          step: "response",
          httpStatus: resp.status,
          ok: data?.ok,
          error: data?.error,
          extractionMode: data?.meta?.extractionMode,
          textLength: typeof data?.text === "string" ? data.text.length : null,
          ocrTextLength: typeof data?.ocrText === "string" ? data.ocrText.length : null,
          finalTextLength: typeof data?.finalText === "string" ? data.finalText.length : null,
          textPreview: typeof data?.text === "string" ? data.text.slice(0, 120) : null,
          meta: data?.meta ?? null,
        };
      } catch { }

      if (!resp.ok || !data?.ok || !String(data?.finalText || data?.text || "").trim()) {
        setJdUrlLoadStatus("error");
        setJdUrlError(getJdUrlErrorMessage(String(data?.error || "")));
        return;
      }

      // ✅ P0 (append-only): finalText 우선 반영 — text는 fallback
      const nextText = String(data.finalText || data.text || "").trim();

      // DEBUG: 삭제 필요 — onExtract 경유 확인
      console.log("[JD_URL.onExtract]", {
        note: "onExtract 경유로 통일 (파일 첨부/OCR 경로와 동일)",
        usedField: data?.finalText ? "finalText" : "text",
        nextTextLength: nextText.length,
        nextTextPreview: nextText.slice(0, 120),
      });
      try {
        window.__PASSMAP_JD_URL_DEBUG__ = {
          ...window.__PASSMAP_JD_URL_DEBUG__,
          step: "onExtract",
          note: "onExtract 경유로 통일",
          usedField: data?.finalText ? "finalText" : "text",
          nextTextLength: nextText.length,
          nextTextPreview: nextText.slice(0, 120),
        };
      } catch { }

      // append-only: 기존 setState 직접 호출 → onExtract 경유로 통일 (imeCommit 브리지 재사용)
      if (typeof onExtract === "function") {
        onExtract("jd", nextText, { source: "jd-url", ...data.meta });
      } else {
        setState((prev) => ({ ...prev, jd: nextText }));
      }
      setJdUrlLoadStatus("success");
      setJdUrlError("");
    } catch (err) {
      // DEBUG: 삭제 필요 — 예외 catch 경로 확인
      console.log("[JD_URL.response]", { step: "catch", error: err?.message ?? String(err) });
      try {
        window.__PASSMAP_JD_URL_DEBUG__ = {
          ...window.__PASSMAP_JD_URL_DEBUG__,
          step: "catch",
          error: err?.message ?? String(err),
        };
      } catch { }
      setJdUrlLoadStatus("error");
      setJdUrlError("링크에서 채용공고를 불러오지 못했습니다.");
    }
  };

  const getSubmitValidationMessage = (intent) => {
    const targetRoleRaw = state?.roleTarget ?? state?.targetRole ?? "";
    const currentRoleRaw = state?.roleCurrent ?? state?.currentRole ?? "";
    const legacyRoleRaw = state?.role ?? "";
    const hasTargetRole =
      !!String(targetRoleRaw).trim() ||
      (!!String(legacyRoleRaw).trim() && !String(currentRoleRaw).trim());
    const hasIndustryCurrent = !!String(state?.industryCurrent || state?.currentIndustry || "").trim();
    const hasIndustryTarget = !!String(state?.industryTarget || state?.targetIndustry || "").trim();
    const hasCareerObject = !!(state?.career && typeof state.career === "object");
    const totalYearsRaw = state?.career?.totalYears;
    const hasCareerYearsInput =
      totalYearsRaw !== null &&
      totalYearsRaw !== undefined &&
      String(totalYearsRaw).trim() !== "";
    const totalYears = hasCareerYearsInput ? Number(totalYearsRaw) : NaN;
    const hasCareerYears = hasCareerYearsInput && Number.isFinite(totalYears) && totalYears >= 0;
    const hasJd = !!String(state?.jd || state?.jdText || "").trim();
    const hasResume = !!String(state?.resume || state?.resumeText || "").trim();
    const entryLevelMode = Boolean(state?.entryLevelMode);

    if (!hasTargetRole) return "지원 직무를 먼저 선택해주세요.";
    if (!hasIndustryTarget) return "지원 산업을 먼저 선택해주세요.";
    if (!entryLevelMode && !hasIndustryCurrent) return "현재 산업을 먼저 선택해주세요.";
    if (!hasCareerObject || !hasCareerYears) {
      return "경력 정보가 비어 있어 분석 정확도가 크게 떨어질 수 있습니다. 총 경력을 먼저 입력해주세요.";
    }
    if (intent === "analyze" && !hasJd) {
      return "JD를 붙여넣거나 첨부한 뒤 정밀 분석을 진행해주세요.";
    }
    if (intent === "analyze" && !hasResume) {
      return "이력서를 붙여넣거나 첨부한 뒤 정밀 분석을 진행해주세요.";
    }
    return "";
  };

  const handleAnalyzeClick = async () => {
    const validationMessage = getSubmitValidationMessage("analyze");
    if (validationMessage) {
      setSubmitError(validationMessage);
      return;
    }
    setSubmitError("");
    if (typeof onAnalyze !== "function") {
      setSubmitError("분석 기능을 다시 불러온 뒤 시도해주세요.");
      return;
    }
    try {
      await Promise.resolve(onAnalyze());
    } catch (err) {
      setSubmitError("분석 요청 중 오류가 발생했습니다. 입력값을 확인한 뒤 다시 시도해주세요.");
      // TMP_DEBUG: remove after confirm
      try {
        globalThis.__INPUTFLOW_SUBMIT_ERR__ = {
          at: Date.now(),
          where: "InputFlow.handleAnalyzeClick",
          message: err?.message || String(err),
          stack: err?.stack || null,
          flowStep,
        };
      } catch { }
    }
  };

  return (
    <div className="flex flex-col gap-6 px-1 pb-10">
      {/* ?곷떒 ?ㅻ뜑 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {flowStep > FLOW.INDUSTRY_CURRENT && (
            <button
              className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setFlowStep((s) => getPrevStep(s))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <span className="text-xs text-slate-400">
            {flowStep > FLOW.INTRO && flowStep < FLOW.ANALYZE ? `${flowStep} / ${totalSteps}` : ""}
          </span>
        </div>
        {/* 湲곗〈 ?낅젰 諛⑹떇?쇰줈 留곹겕 ?쒓굅 (SHOW_LEGACY_JOB_INPUTS = false ?뺤콉???곕씪 ?곴뎄 ?④?) */}
      </div>

      {flowStep === FLOW.INTRO ? (
        <div className="rounded-3xl border border-slate-200 bg-white px-5 py-6 shadow-sm">
          <div className="text-xs font-semibold tracking-wide text-slate-500">정밀 분석</div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            JD와 이력서를 함께 반영하는 분석 흐름으로 진행합니다.
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            JD와 이력서를 함께 바탕으로, 면접관이 실제로 걸릴 수 있는 포인트를 더 정확하게 분석합니다.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px]">01</span>
                분석 단계
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">매칭 리스크 분석</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">채용 공고와 이력서를 비교해 합격을 막을 수 있는 핵심 리스크를 먼저 진단합니다.</p>
            </div>
            <div className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px]">02</span>
                신호 요약
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">신호 TOP3 요약</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">면접관이 실제로 의심할 가능성이 높은 신호 세 가지를 우선순위로 정리합니다.</p>
            </div>
            <div className="group rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[11px]">03</span>
                보완 가이드
              </div>
              <div className="mt-2 text-sm font-semibold text-slate-900">이력서 보완 가이드</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">합격 확률을 높이기 위해 가장 먼저 수정해야 할 이력서 포인트를 제안합니다.</p>
            </div>
          </div>
          <button
            type="button"
            className="mt-5 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white"
            onClick={() => {
              setFlowStep(FLOW.INDUSTRY_CURRENT);
              requestAnimationFrame(() => {
                const el = document.getElementById("passmap-precise-start");
                if (el && typeof el.scrollIntoView === "function") {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              });
            }}
          >
            정밀 분석 시작하기
          </button>
        </div>
      ) : null}

      {/* 吏꾪뻾 諛?*/}
      {flowStep > FLOW.INTRO && flowStep < FLOW.ANALYZE && (
        <div className="h-1 w-full rounded-full bg-slate-100">
          <div
            className="h-1 rounded-full bg-slate-900 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {flowStep >= FLOW.INDUSTRY_CURRENT && (
        <label className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span className="flex items-center gap-2 font-medium text-slate-900">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isEntryLevelMode}
              onChange={(e) => handleEntryLevelModeChange(e.target.checked)}
            />
            신입이거나 현재 재직 정보가 없습니다
          </span>
          <span className="mt-2 block text-xs text-slate-500">
            이 경우 현재 산업, 현재 직무, 현재 연봉, 현재 기업규모는 입력하지 않아도 됩니다.
          </span>
          <span className="block text-xs text-slate-500">
            분석 시 해당 정보는 모름 기준으로 처리됩니다.
          </span>
        </label>
      )}

      {/* ?④퀎蹂?而댄룷?뚰듃 */}
      {flowStep === FLOW.INDUSTRY_CURRENT && (
        <div id="passmap-precise-start">
          {isEntryLevelMode ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4">
              <div className="text-sm text-slate-600">
                신입/현재 정보 없음 모드에서는 현재 산업 입력을 건너뜁니다.
              </div>
              <button
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white self-start"
                onClick={() => setFlowStep(FLOW.INDUSTRY_TARGET)}
              >
                다음
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <IndustrySelector label="현재 재직 중인 산업" onSelect={handleIndustryCurrent} />
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">현재 산업 중분류</span>
                <input
                  type="text"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                  placeholder="예: B2B SaaS, 이커머스 플랫폼, 반도체 장비"
                  value={state?.industryCurrentSub ?? ""}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      industryCurrentSub: __pmSafeSubInput(e.target.value),
                    }))
                  }
                />
              </label>
              <button
                className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white self-start"
                onClick={handleIndustryCurrentNext}
                disabled={!String(state?.industryCurrent || "").trim()}
              >
                다음
              </button>
            </div>
          )}
        </div>
      )}
      {flowStep === FLOW.INDUSTRY_TARGET && (
        <div className="flex flex-col gap-4">
          <IndustrySelector label="지원하는 산업" onSelect={handleIndustryTarget} />
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-slate-700">지원 산업 중분류</span>
            <input
              type="text"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
              placeholder="예: 핀테크, 소비재 브랜드, 물류 운영"
              value={state?.industryTargetSub ?? ""}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  industryTargetSub: __pmSafeSubInput(e.target.value),
                }))
              }
            />
          </label>
          <button
            className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white self-start"
            onClick={handleIndustryTargetNext}
            disabled={!String(state?.industryTarget || "").trim()}
          >
            다음
          </button>
        </div>
      )}
      {flowStep === FLOW.ROLE && (
        !isEntryLevelMode && normalizedRoleMajorStep === "current-major" ? (
          <div className="flex flex-col gap-4">
            <div className="text-lg font-semibold text-slate-900">
              현재 직무를 선택하세요{" "}
              <span className="text-sm font-normal text-slate-400">(선택)</span>
            </div>
            {__safeKscoOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {__safeKscoOptions.map(({ v, t }) => (
                  <button
                    key={v}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                    onClick={() => {
                      if (v === "ksco_3") {
                        setCurrentMajorSelected(v);
                        setRoleMajorStep("current-sub");
                      } else {
                        handleCurrentRole(t, v, "");
                      }
                    }}
                  >
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-slate-900">
                        {KSCO_MAJOR_LABELS[v] || t}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 leading-tight">
                        {KSCO_MAJOR_SUB_LABELS[v] || ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                직무 옵션을 불러오지 못했습니다.
              </div>
            )}
          </div>
        ) : !isEntryLevelMode && normalizedRoleMajorStep === "current-sub" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => { setRoleMajorStep("current-major"); setCurrentMajorSelected(""); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">현재 세부 직무를 선택하세요</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OFFICE_SUB_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => handleCurrentRole(t, currentMajorSelected, v)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">현재 직무 중분류 직접 입력</span>
              <input
                type="text"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                placeholder="선택지에 없으면 직접 입력"
                value={state?.roleCurrentSub ?? ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    roleCurrentSub: __pmSafeSubInput(e.target.value),
                  }))
                }
              />
            </label>
          </div>
        ) : normalizedRoleMajorStep === "target-sub" ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => { setRoleMajorStep("target-major"); setRoleMajorSelected(""); }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">지원 세부 직무를 선택하세요</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OFFICE_SUB_OPTIONS.map(({ v, t }) => (
                <button
                  key={v}
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                  onClick={() => handleRole(t, roleMajorSelected, v)}
                >
                  {t}
                </button>
              ))}
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">지원 직무 중분류 직접 입력</span>
              <input
                type="text"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                placeholder="선택지에 없으면 직접 입력"
                value={state?.roleTargetSub ?? ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    roleTargetSub: __pmSafeSubInput(e.target.value),
                  }))
                }
              />
            </label>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <button
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                onClick={() => {
                  if (isEntryLevelMode) {
                    setFlowStep(FLOW.INDUSTRY_TARGET);
                    return;
                  }
                  setRoleMajorStep("current-major");
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-lg font-semibold text-slate-900">지원 직무를 선택하세요</div>
            </div>
            {__safeKscoOptions.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {__safeKscoOptions.map(({ v, t }) => (
                  <button
                    key={v}
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-left transition-colors hover:border-slate-900 hover:bg-slate-50"
                    onClick={() => {
                      if (v === "ksco_3") {
                        setRoleMajorSelected(v);
                        setRoleMajorStep("target-sub");
                      } else {
                        handleRole(t, v, "");
                      }
                    }}
                  >
                    <div className="leading-tight">
                      <div className="text-sm font-medium text-slate-900">
                        {KSCO_MAJOR_LABELS[v] || t}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500 leading-tight">
                        {KSCO_MAJOR_SUB_LABELS[v] || ""}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                직무 옵션을 불러오지 못했습니다.
              </div>
            )}
          </div>
        )
      )}
      {flowStep === FLOW.CAREER && (
        <CareerQuestions
          state={state}
          setState={setState}
          onDone={handleCareerDone}
          entryLevelMode={isEntryLevelMode}
        />
      )}
      {flowStep === FLOW.COMPENSATION && (
        <div className="flex flex-col gap-5">
          <div className="text-lg font-semibold text-slate-900">연봉/기업규모/나이</div>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">나이</span>
              <input
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                value={state?.age ?? ""}
                onChange={(e) => setState((prev) => ({ ...prev, age: e.target.value }))}
                placeholder="예: 30"
              />
            </label>

            {!isEntryLevelMode && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">현재 기업 규모</span>
                <select
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                  value={state?.companySizeCandidate || "unknown"}
                  onChange={(e) => setState((prev) => ({ ...prev, companySizeCandidate: e.target.value }))}
                >
                  <option value="unknown">선택 안 함</option>
                  <option value="startup">스타트업</option>
                  <option value="small_mid">중소/강소기업</option>
                  <option value="mid_large">중견기업</option>
                  <option value="large">대기업</option>
                  <option value="public">공공/기관</option>
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">지원 회사 기업 규모</span>
              <select
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900 bg-white"
                value={state?.companySizeTarget || "unknown"}
                onChange={(e) => setState((prev) => ({ ...prev, companySizeTarget: e.target.value }))}
              >
                <option value="unknown">선택 안 함</option>
                <option value="startup">스타트업</option>
                <option value="small_mid">중소/강소기업</option>
                <option value="mid_large">중견기업</option>
                <option value="large">대기업</option>
                <option value="public">공공/기관</option>
              </select>
            </label>

            {!isEntryLevelMode && (
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-700">현재 연봉(만원)</span>
                <input
                  inputMode="numeric"
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                  placeholder="예: 4500"
                  value={getSalaryValue("salaryCurrent")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSalaryImeBuffer((prev) => ({ ...prev, salaryCurrent: v }));
                    if (!salaryComposing.salaryCurrent) {
                      setState((prev) => ({ ...prev, salaryCurrent: v }));
                    }
                  }}
                  onCompositionStart={() => setSalaryComposing((prev) => ({ ...prev, salaryCurrent: true }))}
                  onCompositionEnd={(e) => {
                    setSalaryComposing((prev) => ({ ...prev, salaryCurrent: false }));
                    commitSalary("salaryCurrent", e.currentTarget.value);
                  }}
                  onBlur={(e) => commitSalary("salaryCurrent", e.currentTarget.value)}
                />
              </label>
            )}

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-slate-700">목표 연봉(만원)</span>
              <input
                inputMode="numeric"
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-900"
                placeholder="예: 6000"
                value={getSalaryValue("salaryTarget")}
                onChange={(e) => {
                  const v = e.target.value;
                  setSalaryImeBuffer((prev) => ({ ...prev, salaryTarget: v }));
                  if (!salaryComposing.salaryTarget) {
                    setState((prev) => ({ ...prev, salaryTarget: v, salaryExpected: v }));
                  }
                }}
                onCompositionStart={() => setSalaryComposing((prev) => ({ ...prev, salaryTarget: true }))}
                onCompositionEnd={(e) => {
                  setSalaryComposing((prev) => ({ ...prev, salaryTarget: false }));
                  commitSalary("salaryTarget", e.currentTarget.value);
                }}
                onBlur={(e) => commitSalary("salaryTarget", e.currentTarget.value)}
              />
            </label>
          </div>

          <button
            className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white"
            onClick={handleCompensationDone}
          >
            다음
          </button>
        </div>
      )}
      {flowStep === FLOW.JD && (
        <div className="flex flex-col gap-4">
          {/* append-only: JD URL 입력 블록 */}
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4">
            <div className="text-sm font-semibold text-slate-900">채용공고 링크로 가져오기</div>
            <p className="text-xs text-slate-500">
              잡코리아 채용공고 링크를 붙여넣으면 채용공고 텍스트를 자동으로 가져옵니다.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                placeholder="잡코리아 채용공고 URL 붙여넣기"
                value={jdUrl}
                onChange={(e) => {
                  setJdUrl(e.target.value);
                  if (jdUrlLoadStatus !== "idle") setJdUrlLoadStatus("idle");
                  if (jdUrlError) setJdUrlError("");
                }}
              />
              <button
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLoadJDFromUrl}
                disabled={jdUrlLoadStatus === "loading"}
              >
                {jdUrlLoadStatus === "loading" ? "불러오는 중..." : "불러오기"}
              </button>
            </div>
            {/* 지원 사이트 바로가기 */}
            <div className="flex flex-col gap-2 mt-3">
              <span className="text-xs text-slate-400 font-medium">채용공고 사이트 바로가기</span>
              <div className="flex gap-2">
                <a
                  href="https://www.jobkorea.co.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  JobKorea
                  <span className="opacity-80">잡코리아</span>
                </a>
              </div>
              <span className="text-xs text-slate-400">사이트에서 채용공고를 연 뒤, 상단 주소(URL)를 복사해서 붙여넣어 주세요.</span>
            </div>
            {jdUrlLoadStatus === "success" && !jdUrlError && (
              <div className="text-xs text-emerald-700">채용공고 내용을 불러왔습니다. 아래에서 바로 수정할 수 있습니다.</div>
            )}
            {jdUrlError && <div className="text-xs text-red-600">{jdUrlError}</div>}
          </div>
          <JDInput state={state} setState={setState} onDone={handleJDDone} />
          {/* append-only: JD 踰꾪듉??泥⑤? UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={jdFileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleAttachJDFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => jdFileInputRef.current?.click()}
            >
              {jdAttachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {jdAttachedFileName && (
              <span className="text-xs text-slate-500 truncate">{jdAttachedFileName} 쨌 泥⑤? ?꾨즺</span>
            )}
            {jdFileError && (
              <div className="text-xs text-red-600">{jdFileError}</div>
            )}
          </div>
        </div>
      )}
      {flowStep === FLOW.RESUME && (
        <div className="flex flex-col gap-4">
          <ResumeInput state={state} setState={setState} onDone={handleResumeDone} />
          {/* append-only: 踰꾪듉??泥⑤? UI */}
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={handleAttachFile}
            />
            <button
              className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              {attachedFileName ? "다시 첨부" : "📎 첨부하기"}
            </button>
            {attachedFileName && (
              <span className="text-xs text-slate-500 truncate">{attachedFileName} 쨌 泥⑤? ?꾨즺</span>
            )}
            {resumeFileError && (
              <div className="text-xs text-red-600">{resumeFileError}</div>
            )}
          </div>
        </div>
      )}

      {/* 최종 분석 단계 — CTA 2개로 분기 */}
      {flowStep === FLOW.ANALYZE && (
        <div className="flex flex-col items-center gap-6 py-8">
          <div className="text-xl font-semibold text-slate-900">정밀 분석 준비 완료</div>
          <p className="text-sm text-slate-500 text-center">
            JD와 이력서를 바탕으로 합격 리스크와 면접관 관점의 핵심 포인트를 분석합니다.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {submitError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {submitError}
              </div>
            ) : null}
            <button
              className="rounded-full bg-slate-900 px-10 py-3 font-semibold text-white"
              onClick={handleAnalyzeClick}
            >
              정밀 분석 실행하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
