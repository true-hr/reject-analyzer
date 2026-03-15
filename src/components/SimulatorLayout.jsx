import React, { useEffect, useMemo, useState } from "react";
import GlassHeroCard from "./ui/GlassHeroCard.jsx";
import { resolveCandidateTypeCeiling } from "../lib/explanation/buildExplanationPack.js";
import {
  getModifierLabel,
  resolveModifier,
  resolveActionText,
  resolveSubtitleText,
} from "../lib/policy/simulatorExpressionPolicy.js";
import {
  buildPolicyInput,
  resolveTypeTitle,
  sanitizeRiskDescription,
  sanitizeRiskTitle,
} from "../lib/policy/reportLanguagePolicy.js";
// [PATCH] PM01–PM16 유형 설명 SSOT (append-only)
import { PASSMAP_TYPE_DESCRIPTIONS } from "../lib/passmap/typeDescriptions.js";
// [PATCH] G01~G11 리스크 그룹 SSOT (append-only)
import { getGroupByKey, getGroupDetailByKey } from "../lib/passmap/riskGroupSsot.js";

// append-only: Layer 3 modifier ✅ passProbability band 기반 (base character에 누적)
function getModifier(p) {
  return getModifierLabel(p);
}

// append-only: Layer 2 ✅ 리스크 신호 기반 캐릭터 산출 (v2)
// ?곗꽑?쒖쐞 洹몃９: gate 2媛쒋넁 > 蹂댁셿??> ?먰봽??> 媛쒖쿃??> ?좎옱?ν삎 > ?뺢탳???ㅼ쟾媛 > 洹좏삎??
const __CHARACTER_PRIORITY = [
  {
    character: "보완형 도전자",
    keys: new Set(["MUST_HAVE_MISSING", "ROLE_SKILL__MUST_HAVE_MISSING", "TOOL_MISSING"]),
  },
  {
    character: "점프형 도전자",
    keys: new Set(["SENIORITY__UNDER_MIN_YEARS", "TITLE_SENIORITY_MISMATCH", "RISK__ROLE_LEVEL_MISMATCH"]),
  },
  {
    character: "개척형 전환가",
    keys: new Set(["ROLE_DOMAIN_SHIFT", "DOMAIN__MISMATCH__JOB_FAMILY", "DOMAIN__WEAK__KEYWORD_SPARSE", "GATE__DOMAIN_MISMATCH__JOB_FAMILY", "TITLE_DOMAIN_SHIFT", "SIMPLE__DOMAIN_SHIFT"]),
  },
  {
    character: "잠재력형 후보",
    keys: new Set(["EVIDENCE_THIN"]),
  },
];

function __extractSignalKey(signal) {
  // ?곗꽑?쒖쐞: canonicalKey > rawRiskId > id
  return String(
    signal?.canonicalKey || signal?.rawRiskId || signal?.id || signal?.raw?.id || ""
  ).toUpperCase().trim();
}

function deriveCharacterFromSignals(topSignals, gateCount) {
  const signals = Array.isArray(topSignals) ? topSignals : [];
  const gc = Number.isFinite(Number(gateCount)) ? Number(gateCount) : 0;
  // gate 2媛??댁긽 ???꾨㈃ ?ъ꽕怨꾪삎
  if (gc >= 2) return "정면 보수형";
  // ?쒓렇???놁쓬 ???뺢탳???ㅼ쟾媛
  if (signals.length === 0) return "탐색 후보";
  // 怨좎젙 ?곗꽑?쒖쐞 洹몃９ ?쒖꽌濡?留ㅼ묶 (top1 ?쒖꽌 臾닿?)
  for (const { character, keys } of __CHARACTER_PRIORITY) {
    for (const signal of signals) {
      const key = __extractSignalKey(signal);
      if (!key) continue;
      for (const k of keys) {
        if (key.includes(k)) return character;
      }
    }
  }
  // 留ㅼ묶 ?놁쓬 ??洹좏삎??吏?먯옄
  return "탐색 후보";
}

function __applyHeadlineCeilingText(text, level) {
  const t = String(text || "").trim();
  if (!t) return t;
  const lv = String(level || "").toLowerCase();
  if (lv === "strong" || lv === "competitive") return t;
  return t
    .replace(/즉전(형|감| 투입형| 투입)?/g, "근거 확인")
    .replace(/합격권|합격 유력권|유력|우세권|실전 투입/g, "검토 필요");
}

export default function SimulatorLayout({ simVM, hideNextStep = false }) {
  const vm = simVM || {};
  const __passPercent = useMemo(() => {
    if (Number.isFinite(Number(vm?.pass?.percent))) {
      return Math.round(Number(vm.pass.percent));
    }
    const parsed = parseInt(String(vm?.pass?.percentText || "").trim(), 10);
    return Number.isFinite(parsed) ? parsed : null;
  }, [vm?.pass?.percent, vm?.pass?.percentText]);

  const __policyInput = useMemo(() => {
    if (vm?.meta?.languagePolicyInput) return vm.meta.languagePolicyInput;
    const __gateMax = Number(vm?.interpretation?.signals?.gateMax);
    const __domainMismatch = (Array.isArray(vm?.top3) ? vm.top3 : []).some((x) =>
      String(x?.id || "").toUpperCase().includes("DOMAIN_MISMATCH")
    );
    const __hasEvidence = Boolean(vm?.explanationPack?.topSignals?.[0]?.evidence);
    return buildPolicyInput({
      score: Number.isFinite(__passPercent) ? __passPercent : 0,
      gateMax: Number.isFinite(__gateMax) ? __gateMax : 0,
      domainMismatch: __domainMismatch,
      hasEvidence: __hasEvidence,
      quickNoResume: Boolean(vm?.pass?.preliminary || vm?.meta?.quickNoResume),
    });
  }, [vm, __passPercent]);

  const __vmScore = Number.isFinite(__passPercent) ? __passPercent : null;
  const __vmBand = String(vm?.band || "").trim();
  const __vmRisks = Array.isArray(vm?.risks) ? vm.risks : [];
  const __vmSignals = Array.isArray(vm?.signals) ? vm.signals : [];
  const __vmTop3 =
    Array.isArray(vm?.top3) && vm.top3.length
      ? vm.top3
      : __vmSignals.length
        ? __vmSignals.slice(0, 3)
        : [];

  const __vmTop3Cards =
    Array.isArray(vm?.risks) && vm.risks.length
      ? vm.risks.slice(0, 3)
      : __vmTop3;

  const __top3ExplainSource = [
    ...(Array.isArray(vm?.explanationPack?.topSignals) ? vm.explanationPack.topSignals : []),
    ...(Array.isArray(vm?.top3) ? vm.top3 : []),
    ...(Array.isArray(vm?.signals) ? vm.signals : []),
  ];

  const __top3ExplainLookup = __top3ExplainSource.reduce((acc, item) => {
    const id = String(
      item?.id ||
      item?.__id ||
      item?.code ||
      ""
    ).trim();

    if (!id) return acc;
    if (!acc[id]) acc[id] = item;
    return acc;
  }, {});

  const __top3RiskCards = (__vmTop3Cards || []).slice(0, 3).map((risk) => {
    const explain = __top3ExplainLookup[
      String(risk?.id || risk?.__id || risk?.code || "").trim()
    ] || {};
    const narrative = (risk?.narrative && typeof risk.narrative === "object")
      ? risk.narrative
      : (explain?.narrative && typeof explain.narrative === "object" ? explain.narrative : null);

    const pickText = (...values) => {
      for (const value of values) {
        const text = String(value || "").trim();
        if (text) return text;
      }
      return "";
    };

    const title = pickText(
      narrative?.headline,
      risk?.title,
      explain?.title,
      risk?.label,
      explain?.label,
      risk?.name,
      explain?.name
    );

    const interviewerView = pickText(
      narrative?.interviewerView,
      risk?.interviewerView,
      explain?.interviewerView,
      risk?.reasonShort,
      explain?.reasonShort,
      risk?.oneLiner,
      explain?.oneLiner,
      risk?.reason,
      explain?.reason,
      risk?.description,
      explain?.description,
      risk?.summary,
      explain?.summary,
      risk?.note,
      explain?.note,
      risk?.userReason,
      explain?.userReason
    );

    const userReason = pickText(
      narrative?.userExplanation,
      risk?.userReason,
      explain?.userReason,
      risk?.reason,
      explain?.reason,
      risk?.description,
      explain?.description,
      risk?.summary,
      explain?.summary,
      risk?.note,
      explain?.note,
      interviewerView
    );

    const note = pickText(
      narrative?.interviewPrepHint,
      risk?.note,
      explain?.note,
      risk?.description,
      explain?.description,
      risk?.reason,
      explain?.reason,
      risk?.summary,
      explain?.summary,
      interviewerView,
      userReason
    );

    return {
      __id: pickText(
        risk?.id,
        risk?.__id,
        risk?.code,
        explain?.id,
        explain?.__id,
        explain?.code
      ),
      title,
      interviewerView,
      userReason,
      note,
      actionHint: pickText(
        narrative?.interviewPrepHint,
        risk?.actionHint,
        explain?.actionHint,
        explain?.primaryReasonAction
      ),
      severityTone: pickText(
        narrative?.severityTone,
        risk?.severityTone,
        explain?.severityTone
      ),
      relatedAxis: pickText(
        risk?.relatedAxis,
        explain?.relatedAxis
      ),
      explanationHint: pickText(
        risk?.explanationHint,
        explain?.explanationHint
      ),
      jdGapHint: pickText(
        risk?.jdGapHint,
        explain?.jdGapHint
      ),
      narrative,
    };
  });

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      window.__PASSMAP_VM_TOP3_RAW__ = (__vmTop3Cards || []).slice(0, 3).map((risk, index) => ({
        index,
        risk,
        raw: risk?.raw || null,
        __id: String(
          risk?.__id ||
          risk?.id ||
          risk?.code ||
          risk?.raw?.id ||
          risk?.raw?.code ||
          ""
        ).trim(),
        title: String(
          risk?.title ||
          risk?.label ||
          risk?.name ||
          risk?.raw?.title ||
          risk?.raw?.label ||
          risk?.raw?.name ||
          ""
        ).trim(),
        interviewerView: String(
          risk?.interviewerView ||
          risk?.raw?.interviewerView ||
          ""
        ).trim(),
        userReason: String(
          risk?.userReason ||
          risk?.raw?.userReason ||
          ""
        ).trim(),
        note: String(
          risk?.note ||
          risk?.raw?.note ||
          ""
        ).trim(),
        reasonShort: String(
          risk?.reasonShort ||
          risk?.raw?.reasonShort ||
          ""
        ).trim(),
        oneLiner: String(
          risk?.oneLiner ||
          risk?.raw?.oneLiner ||
          ""
        ).trim(),
        reason: String(
          risk?.reason ||
          risk?.raw?.reason ||
          ""
        ).trim(),
        description: String(
          risk?.description ||
          risk?.raw?.description ||
          ""
        ).trim(),
        summary: String(
          risk?.summary ||
          risk?.raw?.summary ||
          ""
        ).trim(),
      }));
    } catch (e) {
      if (typeof window !== "undefined") {
        window.__PASSMAP_VM_TOP3_RAW_ERROR__ = String(e?.message || e || "");
      }
    }
  }, [__vmTop3Cards]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      window.__PASSMAP_TOP3_NORMALIZED__ = (__top3RiskCards || []).map((card, index) => ({
        index,
        __id: card?.__id || "",
        title: String(card?.title || "").trim(),
        interviewerView: String(card?.interviewerView || "").trim(),
        userReason: String(card?.userReason || "").trim(),
        note: String(card?.note || "").trim(),
      }));
    } catch (e) {
      if (typeof window !== "undefined") {
        window.__PASSMAP_TOP3_NORMALIZED_ERROR__ = String(e?.message || e || "");
      }
    }
  }, [__top3RiskCards]);
  useEffect(() => {
    try {
      const payload = __top3RiskCards.map((card) => ({
        __id: card?.__id || "",
        title: card?.title || "",
        interviewerView: card?.interviewerView || "",
        userReason: card?.userReason || "",
        note: card?.note || "",
      }));
      console.log("[PASSMAP][TOP3][RiskCard props]", payload);
      window.__PASSMAP_TOP3_RISKCARDS__ = payload;
    } catch { }
  }, [__top3RiskCards]);
  const __candidateType = useMemo(() => {
    const direct = String(vm?.candidateType || "").trim();
    if (direct) return direct;
    // candidateType SSOT는 VM이다.
    // Layout 재계산은 compact/share payload처럼 candidateType이 잘린 안전장치 경로에서만 허용한다.
    const __hasFullVmMarkers =
      Boolean(String(vm?.pass?.stageLabel || "").trim()) ||
      Boolean(vm?.meta && typeof vm.meta === "object") ||
      Boolean(vm?.candidateTypeContext && typeof vm.candidateTypeContext === "object") ||
      Boolean(String(vm?.band || "").trim()) ||
      Boolean(String(vm?.headlineCap || "").trim()) ||
      Array.isArray(vm?.signals) ||
      Array.isArray(vm?.risks) ||
      Boolean(vm?.interpretation && typeof vm.interpretation === "object");
    const __looksCompactSharePayload =
      !__hasFullVmMarkers &&
      (Number.isFinite(Number(vm?.passProbability)) ||
        Array.isArray(vm?.top3) ||
        Boolean(vm?.userType && typeof vm.userType === "object"));
    if (!__looksCompactSharePayload) return "";
    const score = Number.isFinite(__passPercent) ? __passPercent : 0;
    const gateSignal = Boolean(vm?.meta?.hasGateSignal || vm?.candidateTypeContext?.gateSignal);
    const highRiskSignal = Boolean(vm?.meta?.hasHighRiskSignal || vm?.candidateTypeContext?.highRiskSignal);
    const rawFit = Number(vm?.meta?.mustHaveFit ?? vm?.candidateTypeContext?.mustHaveFit);
    const mustHaveFit = Number.isFinite(rawFit) ? rawFit : null;
    return resolveCandidateTypeCeiling({ score, gateSignal, highRiskSignal, mustHaveFit });
  }, [vm, __passPercent]);
  const __headlineCap = String(vm?.headlineCap || vm?.expressionLevel || "weak").toLowerCase();
  const __capStageLabel = {
    strong: "우선 검토",
    competitive: "경합 검토",
    cautious: "근거 확인",
    weak: "보완 필요",
    "high-risk": "리스크 높음",
  }[__headlineCap] || "보완 필요";
  const __capBadgeLabel = {
    strong: "판단: 정합성 우수",
    competitive: "판단: 비교 검토 단계",
    cautious: "판단: 근거 확인 필요",
    weak: "판단: 보완 필요",
    "high-risk": "판단: 리스크 우선",
  }[__headlineCap] || "판단: 보완 필요";
  const __resolvedStageLabel = String(vm?.pass?.stageLabel || __candidateType || __capStageLabel).trim();
  const __expTopSignals = Array.isArray(vm?.explanationPack?.topSignals)
    ? vm.explanationPack.topSignals
    : [];
  const __expInterviewInsight = Array.isArray(vm?.explanationPack?.interviewInsight)
    ? vm.explanationPack.interviewInsight
    : [];
  try { window.__LAST_SIM_VM__ = vm; } catch { }
  const __userTypeDisplay = useMemo(() => {
    const __typeId =
      String(
        vm?.userType?.type ||
        vm?.userType?.code ||
        vm?.userType?.typeId ||
        vm?.interpretation?.typeId ||
        ""
      ).trim();

    const __map = {
      TYPE_READY_CORE: {
        title: resolveTypeTitle(__policyInput, "즉전 투입형"),
        subtitle: "핵심 역량 정합성이 높게 관찰됩니다.",
      },
      TYPE_SHIFT_TRIAL: {
        title: "전환 시험대형",
        subtitle: "전환 설득 근거를 테스트받는 구간입니다.",
      },
      TYPE_STABLE_AVG: {
        title: resolveTypeTitle(__policyInput, "무난 통과형"),
        subtitle: "큰 결함은 없지만 인상은 약할 수 있습니다.",
      },
      TYPE_MIXED_NEUTRAL: {
        title: "중립 혼합형",
        subtitle: "강한 장점도 치명적 결함도 아직 선명하지 않습니다.",
      },
    };

    const __hit = __map[__typeId] || null;
    return {
      title: resolveTypeTitle(
        __policyInput,
        String(vm?.userTypeSafe?.title || "").trim() ||
        String(__hit?.title || "").trim() ||
        String(vm?.userType?.title || "").trim() ||
        ""
      ),
      subtitle:
        String(vm?.userTypeSafe?.description || "").trim() ||
        resolveSubtitleText({
          typeId: __typeId,
          top3: __vmTop3,
          mappedSubtitle: String(__hit?.subtitle || "").trim(),
          userTypeSubtitle: String(vm?.userType?.subtitle || "").trim(),
          userTypeDescription: String(vm?.userType?.description || "").trim(),
        }),
    };
  }, [vm, __policyInput, __vmTop3]);
  // ✅ PATCH (append-only): "노트북" 기능 꺼진 리스크 열기/닫기 (메인에서 return 이전, 닫기 가능)
  // [CONTRACT] gate 판정 기준: 반드시 layer === "gate" 체크.
  // raw.layer fallback 금지, group("gates") 기반 판정 금지.
  const __top3List = (__vmTop3.length ? __vmTop3 : [])
    .filter((x) => String(x?.layer || "").toLowerCase() === "gate")
    .slice(0, 3);
  // ??PATCH (append-only): Report summary hero inputs (no engine changes)
  const __passPct =
    Number.isFinite(__passPercent) ? __passPercent : null;

  const __typeIdForModifier = String(
    vm?.interpretation?.typeId ||
    vm?.userType?.typeId ||
    vm?.userType?.code ||
    vm?.userType?.type ||
    ""
  ).trim().toUpperCase();
  const __taskTopSignalId = String(__expTopSignals?.[0]?.id || "").trim();
  const __taskTopSignalTitle =
    __taskTopSignalId === "TASK__CORE_COVERAGE_LOW"
      ? "핵심 업무 근거 부족"
      : __taskTopSignalId === "TASK__EVIDENCE_TOO_WEAK"
        ? "업무 근거 강도 약함"
        : "";
  // append-only: passProbability SSOT 기반으로 사용 (기존 bandLabel 사용 금지)
  const __band = String(__vmBand || __taskTopSignalTitle || vm?.pass?.bandLabel || "").trim();

  // append-only: Layer 2 ✅ gateCount는 top3 배열 기준으로 계산 - gateTriggered===true 신호만 기준
  const __gateTriggeredCount = (__vmTop3 || [])
    .filter((x) => x?.gateTriggered === true).length;
  const __character = deriveCharacterFromSignals(
    __vmTop3,
    __gateTriggeredCount
  );
  const __isQuickNoResume = Boolean(vm?.pass?.preliminary || vm?.meta?.quickNoResume);
  const __confidenceText = "";
  const __bandDisplay = __candidateType || __band || "판단 유형 미정";
  const __quickUncertaintyLine = "";
  // append-only: modifier ✅ passProbability band 기반, base character에 누적 SSOT
  const __modifier = resolveModifier({
    passProbability: __vmScore,
    typeId: __typeIdForModifier,
    gateTriggeredCount: __gateTriggeredCount,
  });

  // ??PATCH (append-only): score cap reason (vm explanation 기반)
  const __capReasonText = useMemo(() => {
    const top = __top3RiskCards?.[0] || null;
    return String(
      top?.interviewerView ||
      top?.reasonShort ||
      top?.oneLiner ||
      top?.summary ||
      top?.description ||
      top?.note ||
      top?.message ||
      ""
    ).trim();
  }, [__top3RiskCards]);

  // [PATCH] PASSMAP 16유형 SSOT 파생값 (append-only)
  const __passmapType = vm?.passmapType || null;
  const __passmapTypeLabel = String(__passmapType?.label || "").trim();
  const __passmapTypeId = String(__passmapType?.id || "").trim();
  // [PATCH] PM 설명 SSOT (append-only)
  const __pmTypeDesc = (__passmapTypeId && PASSMAP_TYPE_DESCRIPTIONS)
    ? (PASSMAP_TYPE_DESCRIPTIONS[__passmapTypeId] || null)
    : null;
  const __pmHeroSummary = String(__pmTypeDesc?.profile?.heroSummary || "").trim();
  const __pmDescription = String(__pmTypeDesc?.description || "").trim();

  const __legacyTypeLabel =
    String(__userTypeDisplay?.title || __candidateType || "").trim();

  // [PATCH] typeDescriptions.js label SSOT 우선 — vm.passmapType.label(구 label) 우선순위 하강
  const __resolvedMainType =
    (__passmapTypeId && __pmTypeDesc?.label)
      ? __pmTypeDesc.label
      : (__passmapTypeLabel || __legacyTypeLabel || "판단 유형 미정");
  // [PATCH] PASSMAP intro copy SSOT = typeDescriptions.js; engine oneLiner는 헤더 소개에 쓰지 않음
  const __resolvedMainTypeOneLiner =
    __pmHeroSummary || __pmDescription || String(__userTypeDisplay?.subtitle || "").trim();

  const __top3Keywords = (
    __vmTop3.length ? __vmTop3 : []
  )
    .slice(0, 3)
    .map((x) =>
    (typeof x === "string"
      ? sanitizeRiskDescription("", x)
      : sanitizeRiskTitle(x?.id, (x?.label || x?.title || x?.id || "")))
    )
    .map((s) => (s || "").toString().trim())
    .filter(Boolean);
  const __careerInterpretation = (vm?.careerInterpretation && typeof vm.careerInterpretation === "object")
    ? vm.careerInterpretation
    : null;
  const __currentLevel = (__careerInterpretation?.currentLevel && typeof __careerInterpretation.currentLevel === "object")
    ? __careerInterpretation.currentLevel
    : null;
  const __currentFlow = (__careerInterpretation?.currentFlow && typeof __careerInterpretation.currentFlow === "object")
    ? __careerInterpretation.currentFlow
    : null;
  const __currentLevelPositiveEvidence = Array.isArray(__currentLevel?.positiveEvidence)
    ? __currentLevel.positiveEvidence.slice(0, 2)
    : Array.isArray(__currentLevel?.evidence)
      ? __currentLevel.evidence.slice(0, 2)
      : [];
  const __currentLevelGapEvidence = Array.isArray(__currentLevel?.gapEvidence)
    ? __currentLevel.gapEvidence.slice(0, 2)
    : [];
  const __riskViewItems = Array.isArray(__careerInterpretation?.riskView?.items)
    ? __careerInterpretation.riskView.items.slice(0, 2)
    : [];
  const __flowTransitions = Array.isArray(__currentFlow?.transitions)
    ? __currentFlow.transitions.slice(0, 2)
    : [];
  const __flowEvidence = Array.isArray(__currentFlow?.evidence)
    ? __currentFlow.evidence.slice(0, 2)
    : [];
  const __humanizeCareerText = (value) =>
    String(value || "")
      .replace(/\bmismatch\b/gi, "차이가 있습니다")
      .replace(/\bgap\b/gi, "부족하게 보일 수 있습니다")
      .replace(/\bdomain\b/gi, "경험 영역")
      .replace(/\brole\b/gi, "역할")
      .trim();
  const __flowMainTitle = (() => {
    const main = String(__currentFlow?.mainInterpretation || "").trim();
    if (main) return main;
    const axis = String(__currentFlow?.currentAxis || "").trim();
    if (axis) return axis;
    const start = String(__currentFlow?.startPoint || "").trim();
    if (start) return `현재 커리어 흐름은 ${start} 중심 경험으로 읽힙니다`;
    return "커리어 흐름 해석";
  })();
  const __flowBadgeText = __currentFlow?.flags?.hasMultiStepFlow ? "여러 단계 흐름" : "단일 축 흐름";
  const __severityLabel = (severity) => {
    const s = String(severity || "").trim();
    if (s === "high") return "주요 리스크";
    if (s === "medium") return "주의 신호";
    return "참고 신호";
  };
  const __levelToneClass = (() => {
    const lv = String(__currentLevel?.dominantLevel || "").trim();
    if (lv === "strategic") return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
    if (lv === "lead") return "bg-sky-50 text-sky-700 border-sky-200/80";
    if (lv === "ownership") return "bg-amber-50 text-amber-700 border-amber-200/80";
    if (lv === "execution") return "bg-slate-100 text-slate-700 border-slate-200/80";
    return "bg-slate-100 text-slate-500 border-slate-200/80";
  })();
  const __riskSeverityClass = (severity) => {
    const s = String(severity || "").trim();
    if (s === "high") return "border-rose-200/80 bg-rose-50/80 text-rose-700";
    if (s === "medium") return "border-amber-200/80 bg-amber-50/80 text-amber-700";
    return "border-slate-200/80 bg-slate-50/80 text-slate-600";
  };

  // optional: if you already carry any "potential" in vm (hover/preview etc.)
  const __potentialPct =
    Number.isFinite(Number(vm?.pass?.potentialPct))
      ? Math.round(Number(vm.pass.potentialPct))
      : (Number.isFinite(Number(vm?.potentialScore)) ? Math.round(Number(vm.potentialScore)) : null);

  const __delta =
    (__passPct != null && __potentialPct != null) ? (__potentialPct - __passPct) : null;
  const [detailOpen, setDetailOpen] = useState(false);
  // ✅ PATCH (append-only): Analyzer Issues "노트북" 리스크 열기
  const [issuesOpen, setIssuesOpen] = useState(false);
  try {
    // 브라우저에서 window.__OPEN_DETAIL__("GATE__AGE") 호출 시 실제 모달 열기 가능
    window.__OPEN_DETAIL__ = (id) => openDetail(String(id || "").trim());
  } catch { }
  const [detailId, setDetailId] = useState(__top3List?.[0]?.id || "");

  const openDetail = (id) => {
    const nextId = String(id || "").trim();
    setDetailId(nextId || String(((Array.isArray(__viewRisks) && __viewRisks.length && (__viewRisks[0]?.id || __viewRisks[0]?.raw?.id)) || (__top3List?.[0]?.id || __top3List?.[0]?.raw?.id) || "") || "").trim());
    setDetailOpen(true);
  };

  const closeDetail = () => setDetailOpen(false);

  // ✅ PATCH (append-only): candidateType 상세보기 state
  const [typeDetailOpen, setTypeDetailOpen] = useState(false);
  const openTypeDetail = () => setTypeDetailOpen(true);
  const closeTypeDetail = () => setTypeDetailOpen(false);

  // ✅ PATCH (append-only): explanationPack SSOT 기반 면접관 마인드셋
  const __flagsCtx = useMemo(() => {
    const reasonsDoc = __expTopSignals
      .map((x) => String(x?.signal || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    const reasonsInt = __expInterviewInsight
      .map((x) => String(x || "").trim())
      .filter(Boolean)
      .slice(0, 3);

    return {
      flags: [],
      summaryForAI: String(vm?.explanationPack?.primaryReason || "").trim(),
      docMind: [
        "지원자 이야기가 좋아 보여도, 검증 가능한 근거가 먼저 보이는지 확인해야 합니다.",
        "핵심을 확인하는 질문을 먼저 하겠습니다.",
      ],
      intMind: [
        "표현이 좋아 보여도 실제 권한과 결정 범위를 먼저 확인해야 합니다.",
        "책임 범위를 명확히 확인하겠습니다.",
      ],
      reasonsDoc: reasonsDoc.length ? reasonsDoc : ["근거 문장이 얕아 보여 확인 질문이 필요합니다."],
      reasonsInt: reasonsInt.length ? reasonsInt : ["의사결정/책임 범위가 모호하면 실무 검증 질문이 필요합니다."],
      qDoc: [
        "그래서 구체적으로 어떤 개선을 만들었나요?",
        "JD 필수 요건은 어디에서 어떻게 증명할 수 있나요?",
      ],
      qInt: [
        "본인이 직접 결정한 것은 무엇이었나요?",
        "리스크나 갈등 상황에서 어떤 판단을 했나요?",
      ],
      fixDoc: [
        "JD 핵심 요건 3개를 골라 각 요건당 1~2개 근거 항목을 붙이세요.",
        "성과는 기간/수치가 포함된 Before/After로 제시하세요.",
      ],
      fixInt: [
        "각 프로젝트 첫 줄에 본인 권한과 결정 1개를 고정해 쓰세요.",
        "결과보다 판단과 실행 과정을 함께 설명하세요.",
      ],
    };
  }, [__expTopSignals, __expInterviewInsight, vm?.explanationPack?.primaryReason]);
  // ✅ PATCH (append-only): 노트북 기능 꺼진 프로파일 사전 정의 + 자동 생성 디버그
  // - 기본값은 __flagsCtx(doc/int)에서 참조 (정적이지 않음)
  // - 위 목록에 rawId(=risk id)가 없으면 찾아서 "노트북 기능 사용 불가"가 나타남
  const __NOTE_TEMPLATES = useMemo(() => {
    return {
      SIMPLE__BASELINE_GUIDE: {
        codename: "(The baseline guide case)",
        mind: [
          "자료가 부족하면 판단이 보수적으로 흐를 수 있습니다.",
          "사실 확인 질문을 먼저 진행하겠습니다.",
        ],
        reasons: [
          "JD와 이력서의 직접 연결 근거가 약하면 서류 단계에서 보수적으로 해석됩니다.",
          "핵심 요구조건 대비 증빙이 약하면 평가가 쉽게 올라가지 않습니다.",
        ],
        questions: [
          "지원 직무와 맞는 대표 성과 1~2개를 숫자로 설명해 주실 수 있나요?",
          "JD 필수 요건을 어디에서 어떻게 증명할 수 있나요?",
        ],
        fixes: [
          "JD 필수 요건 3개를 골라 각 요건별 증거 항목을 1~2개씩 추가하세요.",
          "성과는 Before/After(기간, 수치) 형태로 최소 1개 이상 제시하세요.",
        ],
      },
      GATE__AGE: {
        codename: "(The seniority-fit check case)",
        mind: [
          "연차와 직급 밴드의 정합성을 먼저 확인합니다.",
          "조건이 맞지 않으면 초기 단계에서 보수적으로 판단됩니다.",
        ],
        reasons: [
          "연차 구간 대비 기대 레벨 차이가 크면 리스크로 해석될 수 있습니다.",
          "서류 단계에서 빠르게 컷오프될 신호로 작동할 수 있습니다.",
        ],
        questions: [
          "현재 연차 기준으로 맡은 책임 수준을 설명해 주실 수 있나요?",
          "해당 레벨에 맞는 리드 경험이 있나요?",
        ],
        fixes: [
          "본인이 맡은 권한/의사결정/리딩 범위를 항목 형태로 명확히 쓰세요.",
          "직급 수준에 맞는 성과를 수치 중심으로 제시하세요.",
        ],
      },
      GATE__SALARY_MISMATCH: {
        codename: "(The compensation mismatch case)",
        mind: [
          "희망연봉이 밴드 밖이면 진행 자체가 어려워질 수 있습니다.",
          "연봉 적합성을 우선 확인합니다.",
        ],
        reasons: [
          "보상 밴드 불일치는 초기 단계의 주요 탈락 사유가 됩니다.",
          "밴드 근거가 약하면 레벨 과다요구로 해석될 수 있습니다.",
        ],
        questions: [
          "희망연봉의 근거(시장가, 성과, 현재 보상)를 설명해 주실 수 있나요?",
          "이 직무 수준에서 수용 가능한 보상 범위는 어떻게 보시나요?",
        ],
        fixes: [
          "희망연봉 범위를 제시하고 근거를 함께 명시하세요.",
          "레벨에 맞는 임팩트 사례를 먼저 제시해 보상 근거를 강화하세요.",
        ],
      },
      SIMPLE__DOMAIN_SHIFT: {
        codename: "(The domain transition check case)",
        mind: [
          "도메인이 다르면 전이 가능성 근거를 우선 확인합니다.",
          "추가 학습 비용을 보수적으로 반영할 수 있습니다.",
        ],
        reasons: [
          "도메인 차이가 크면 즉시전력성에 의문이 생길 수 있습니다.",
          "전이 논리가 약하면 적합성 리스크로 연결됩니다.",
        ],
        questions: [
          "기존 경험이 이 포지션 문제 해결에 어떻게 전이되는지 설명해 주세요.",
          "새 도메인에서 빠르게 성과를 내기 위한 접근을 설명해 주세요.",
        ],
        fixes: [
          "기존 경험 1개와 JD 핵심 과업 1개를 1:1로 연결해 작성하세요.",
          "도메인 지식보다 문제 해결 방식의 공통점을 강조하세요.",
        ],
      },
      SIMPLE__ROLE_SHIFT: {
        codename: "(The role transition check case)",
        mind: [
          "직무 전환의 실제 수행 가능성을 먼저 확인합니다.",
          "언어만 유사하고 실무가 다르면 리스크가 커집니다.",
        ],
        reasons: [
          "직무 전환은 과업/성과/프로세스 정합성에서 빠르게 판별됩니다.",
          "직무 언어가 부족하면 실행 가능성이 낮게 평가될 수 있습니다.",
        ],
        questions: [
          "이 직무의 핵심 KPI를 어떻게 정의하시나요?",
          "현재 역할에서 해당 KPI에 연결된 성과가 있나요?",
        ],
        fixes: [
          "JD 핵심 KPI 3개에 대해 본인 증거 항목을 매칭해 작성하세요.",
          "프로세스 경험은 입력-처리-산출물 구조로 설명하세요.",
        ],
      },
    };
  }, []);
  // ✅ PATCH (append-only): 프로파일이 없는 "missing id" 자동 감지/디버그
  // - vm.signals / vm.risks 경로만 사용
  const __DBG_NOTE_MISSING = useMemo(() => {
    const __idSet = new Set();

    const __addFromList = (list) => {
      const arr = Array.isArray(list) ? list : [];
      for (const r of arr) {
        const id = String(r?.id || r?.raw?.id || r?.code || r?.raw?.code || "").trim();
        if (id) __idSet.add(id);
      }
    };

    __addFromList(__vmSignals);
    __addFromList(__vmTop3);
    __addFromList(__vmRisks);

    const allIds = Array.from(__idSet);

    // "프로파일이 없는 id" = exact match 기준
    const missing = allIds.filter((id) => !(__NOTE_TEMPLATES && __NOTE_TEMPLATES[id]) && !(String(id).startsWith("DRIVER__DOCUMENT__") || String(id).startsWith("DRIVER__INTERVIEW__")));

    return {
      allIds,
      missing,
      counts: { all: allIds.length, missing: missing.length, templates: Object.keys(__NOTE_TEMPLATES || {}).length },
      updatedAt: Date.now(),
    };
  }, [__vmSignals, __vmTop3, __vmRisks, __NOTE_TEMPLATES]);

  // window 등록 + 브라우저 로그(개발 전용)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.__DBG_NOTE_MISSING__ = __DBG_NOTE_MISSING;
        window.__DBG_NOTE_TEMPLATES__ = __NOTE_TEMPLATES;
      }
    } catch {
      // ignore
    }

    try {
      const m = __DBG_NOTE_MISSING?.missing || [];
      // console output removed
    } catch {
      // ignore
    }
  }, [__DBG_NOTE_MISSING, __NOTE_TEMPLATES]);
  // ✅ PATCH (append-only): missing ids 자동 프로파일 스켈레톤 코드 자동 생성
  // - window.__DBG_NOTE_TEMPLATE_SKELETON__.code 를 복사해서 __NOTE_TEMPLATES 안에 붙여넣기
  const __DBG_NOTE_TEMPLATE_SKELETON = useMemo(() => {
    const missing = Array.isArray(__DBG_NOTE_MISSING?.missing) ? __DBG_NOTE_MISSING.missing : [];

    const __mkStub = (id) => {
      const isGate = String(id).startsWith("GATE__");
      const isSimple = String(id).startsWith("SIMPLE__");
      const isDriverDoc = String(id).startsWith("DRIVER__DOCUMENT__");
      const isDriverInt = String(id).startsWith("DRIVER__INTERVIEW__");

      const codename =
        isGate ? "(The 조건 필터 케이스)" :
          isDriverInt ? "(The 면접 검증 케이스)" :
            isDriverDoc ? "(The 서류 근거 케이스)" :
              isSimple ? "(The 간단 분석 케이스)" :
                "(The 기타 프로파일 케이스)";

      const mind0 =
        isGate ? "현재 구간에서 먼저 보는 조건 신호입니다." :
          isDriverInt ? "현재 구간/책임/역할 범위를 확인합니다." :
            "서류에서 확인할 핵심 근거가 부족합니다.";

      const mind1 =
        isGate ? "이 조건이 충족되어야 다음 구간 판단으로 넘어갑니다." :
          "서류 이력서에서 확인 가능한 근거가 부족합니다.";

      const reasons0 =
        isGate ? "서류/1차에서 빠르게 필터링될 조건 신호로 작동할 수 있습니다." :
          isDriverInt ? "면접에서 논리 점프가 보이면 실무에서 설명 비용이 커질 위험으로 봅니다." :
            "근거 문장이 얕아 보여 주장형 서술로 보일 수 있습니다.";

      const q0 =
        isGate ? "이 조건(연차/레벨/연봉)을 어떻게 맞췄는지 근거를 설명해 주세요." :
          isDriverInt ? "현재 구간 설명의 앞뒤가 맞나요? 기준이 어디서 바뀌었는지 말로 정리해보세요." :
            "구체적으로 어떤 개선을 만들었는지, JD와 어떻게 연결되는지 설명해주세요.";

      const fix0 =
        isGate ? "조건 정합성 근거(레벨/책임/성과/시장가)를 먼저 제시해 판단 가능한 상태를 만드세요." :
          isDriverInt ? "각 프로젝트 항목에 직접 권한/결정 1개를 고정해 명시하고 적절한 레벨 범위를 표시하세요." :
            "JD 필수 요건 1개당 1~2개 근거 항목을 추가하고, Before/After 형태로 근거를 제시하세요.";

      return `      ${JSON.stringify(id)}: {
        codename: ${JSON.stringify(codename)},
        mind: [
          ${JSON.stringify(mind0)},
          ${JSON.stringify(mind1)},
        ],
        reasons: [
          ${JSON.stringify(reasons0)},
        ],
        questions: [
          ${JSON.stringify(q0)},
        ],
        fixes: [
          ${JSON.stringify(fix0)},
        ],
      },`;
    };

    const code =
      missing.length === 0
        ? "// (missing 없음) 현재 모든 프로파일이 정의되어 있습니다."
        : [
          "// -----------------------",
          "// ??AUTO-GENERATED: missing template stubs",
          "// - 이 코드를 __NOTE_TEMPLATES return 객체 안에 복사해 붙여넣고, 실제 내용으로 채우세요.",
          "// -----------------------",
          ...missing.map(__mkStub),
        ].join("\n");

    return {
      missing,
      code,
      updatedAt: Date.now(),
    };
  }, [__DBG_NOTE_MISSING]);

  // window 등록 + 브라우저 로그(개발 전용)
  // 필요없으면 빈 상태에서도 useEffect는 실행 가능
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        window.__DBG_NOTE_TEMPLATE_SKELETON__ = __DBG_NOTE_TEMPLATE_SKELETON;
      }
    } catch {
      // ignore
    }

    try {
      const c = String(__DBG_NOTE_TEMPLATE_SKELETON?.code || "");
      // console output removed
    } catch {
      // ignore
    }
  }, [__DBG_NOTE_TEMPLATE_SKELETON]);
  const __pickNotebookTemplate = (rawId, layerGuess) => {
    const id = String(rawId || "").trim();
    const layer = String(layerGuess || "").trim().toLowerCase();

    // 1) exact match
    if (id && __NOTE_TEMPLATES[id]) return __NOTE_TEMPLATES[id];
    // 1.5) DRIVER (특수 처리 프로파일) - fallback 없이 id로만 생성
    // - analyzer.js: id = `DRIVER__${layer.toUpperCase()}__${idx}`
    // - layer: document / interview
    {
      const m = id.match(/^DRIVER__(DOCUMENT|INTERVIEW)__(\d+)$/);
      if (m) {
        const kind = String(m[1] || "").toUpperCase(); // DOCUMENT | INTERVIEW
        const idx = Number(m[2] || 0);

        const title = String((__vmRisks.find((x) => String(x?.id || "").trim() === id)?.title || "")).trim();

        const label = kind === "DOCUMENT" ? "문서/근거" : "질문/답변";
        const codename = `(The ${label} 리스크 드라이버 #${idx + 1})`;

        return {
          codename,
          mind: [
            `이번 ${label}에서 '찜찜한 원인'이 하나 걸린 케이스입니다.`,
            title ? `특히 "${title}" 이 문장이 방아쇠로 작동했습니다.` : "지금 보이는 단서가 무엇인지 먼저 분해해야 합니다.",
          ],
          reasons: [
            kind === "DOCUMENT"
              ? "문서에서 '근거 없이 주장만 있는 문장'이 보이면 검증 비용이 급증해 보수적으로 판단됩니다."
              : "면접에서 논리 점프/답변 붕괴가 보이면 실무에서 설명 비용이 커질 위험으로 봅니다.",
            `DRIVER 계열은 idx가 클수록 '부차적이지만 누적되면 치명적인' 신호로 봅니다.`,
          ],
          questions: [
            kind === "DOCUMENT"
              ? "이 문장을 증명해주는 재료/수치/전후 비교가 하나라도 있나요?"
              : "지금 설명의 앞뒤가 맞나요? 기준/우선순위/의사결정이 어디서 바뀌었는지 말로 정리해보세요.",
            title
              ? `"${title}" 주장에 대해 1)상황 2)행동 3)결과(수치) 4)내 기여를 30초로 말해보면?`
              : "가장 강한 근거 1개만 뽑아 30초 안에 설득 가능한 형태로 말해보면?",
          ],
          fixes: [
            kind === "DOCUMENT"
              ? "해당 문장을 '근거 문장(수치/링크/산출물) + 해석(내 기여) + 결과' 구조로 재작성하세요."
              : "설명 구조를 '문제 -> 맥락 -> 결정(이유) -> 실행 -> 결과 -> 배운 점' 6문장으로 고정하세요.",
            title
              ? `지금 쓰는 "${title}" 같은 문장에는 반드시 바로 아래에 '증거 1줄'을 붙이세요.`
              : "추상적 슬로건 문장(혁신/전략) 대신 사실+수치로 구체화하세요.",
          ],
        };
      }
    }
    // 2) prefix / group fallbacks (append-only)
    if (id.startsWith("GATE__")) {
      return {
        codename: "(The 조건 필터 케이스)",
        mind: [
          "현재 구간에서 먼저 보는 조건 신호입니다.",
          "이 조건이 충족되어야 다음 구간 판단으로 넘어갈 수 있습니다.",
        ],
        reasons: ["서류 단계에서 빠르게 필터링될 조건 신호로 작동할 수 있습니다."],
        questions: ["이 조건(연차/레벨/연봉)을 어떻게 맞췄는지 근거를 설명해 주세요."],
        fixes: ["조건 정합성 근거(레벨/책임/성과/시장가)를 먼저 제시해 엔진이 판단 가능한 상태를 만드세요."],
      };
    }

    if (id.startsWith("DRIVER__INTERVIEW__") || layer === "interview") {
      return {
        codename: "(The 질문 검증 지원자)",
        mind: __flagsCtx.intMind,
        reasons: __flagsCtx.reasonsInt,
        questions: __flagsCtx.qInt,
        fixes: __flagsCtx.fixInt,
      };
    }

    // default: document
    return {
      codename: "(The 문서 중심 지원자)",
      mind: __flagsCtx.docMind,
      reasons: __flagsCtx.reasonsDoc,
      questions: __flagsCtx.qDoc,
      fixes: __flagsCtx.fixDoc,
    };
  };
  // ??PATCH (append-only): NOTE_TEMPLATES coverage report (debug only)
  // - 각 id가 "실제 프로파일 정의" vs "prefix fallback" vs "default fallback"인지 확인
  // - UI/디버그 추적용, 브라우저 로그 + window.__DBG_NOTE_COVERAGE__ 등록
  const __noteCoverage = useMemo(() => {
    try {
      const merged = [...__vmTop3, ...__vmSignals, ...__vmRisks];

      const pickId = (r) => String(r?.id || r?.raw?.id || "").trim();
      const pickLayer = (r) => String(r?.layer || r?.raw?.layer || "").trim().toLowerCase();

      const seen = new Set();
      const rows = [];

      for (const r of merged) {
        const id = pickId(r);
        if (!id || seen.has(id)) continue;
        seen.add(id);

        const layer = pickLayer(r) || (id.startsWith("GATE__") ? "gate" : "");
        const hasExact = Boolean(__NOTE_TEMPLATES && __NOTE_TEMPLATES[id]);
        const hasDriverDynamic = id.startsWith("DRIVER__DOCUMENT__") || id.startsWith("DRIVER__INTERVIEW__");

        const matchType = (hasExact || hasDriverDynamic)
          ? "exact"
          : id.startsWith("GATE__")
            ? "fallback:gatePrefix"
            : "fallback:default";

        const templateKey = hasExact ? id : (id.startsWith("GATE__") ? "GATE__*" : "DEFAULT");

        rows.push({
          id,
          layer: layer || "(unknown)",
          matchType,
          templateKey,
        });
      }

      return rows;
    } catch {
      return [];
    }
  }, [__vmTop3, __vmSignals, __vmRisks, __NOTE_TEMPLATES]);

  useEffect(() => {
    try {
      if (!Array.isArray(__noteCoverage)) return;

      // console output removed (NOTE_TEMPLATES coverage)

      if (typeof window !== "undefined") {
        window.__DBG_NOTE_COVERAGE__ = {
          at: Date.now(),
          count: __noteCoverage.length,
          rows: __noteCoverage,
        };
      }
    } catch { }
  }, [__noteCoverage]);
  // ??PATCH (append-only): viewRisks (detail modal source)
  // - vm.risks SSOT 우선, 없으면 vm.signals fallback
  const __viewRisks = useMemo(() => {
    return __vmRisks.length ? __vmRisks : (__vmSignals.length ? __vmSignals : __vmTop3);
  }, [__vmRisks, __vmSignals, __vmTop3]);

  const __detail = useMemo(() => {
    const id = String(detailId || "").trim();

    const __pickId = (x) => String(x?.id || x?.raw?.id || "").trim();

    const viewList =
      (Array.isArray(__viewRisks) && __viewRisks.length ? __viewRisks : null);

    const picked =
      (viewList ? viewList.find((x) => __pickId(x) === id) : null) ||
      __top3List.find((x) => __pickId(x) === id) ||
      (viewList ? viewList[0] : null) ||
      __top3List[0] ||
      null;

    const rawId = __pickId(picked);
    const layerGuess =
      String(picked?.layer || picked?.raw?.layer || "").toLowerCase() ||
      (rawId.startsWith("DRIVER__INTERVIEW__") ? "interview" : "document");

    // [PATCH] G01~G11 그룹 상세 조회 — 있으면 modal 데이터 소스로 우선 사용
    const __groupDetail = rawId ? getGroupDetailByKey(rawId) : null;

    const title = String(__groupDetail?.title || picked?.title || picked?.message || rawId || "리스크 신호 보기").trim();

    // 노트북 프로파일 선택 (없으면 기존 flagsCtx 참조)
    const __tpl =
      (typeof __NOTE_TEMPLATES === "object" && __NOTE_TEMPLATES && rawId &&
        __NOTE_TEMPLATES[rawId])
        ? __NOTE_TEMPLATES[rawId]
        : null;

    // ✅ codename에 린터가 "줄 기준" 에러 표시 (이전 에러 표시 참조)
    const codename = String(
      (__tpl && __tpl.codename) ||
      (layerGuess === "interview" ? "(The 질문 검증 지원자)" : "(The 문서 중심 지원자)")
    ).trim();

    // interviewerNote가 실제 존재하면 더 나은 현재 노트를 사용하고,
    // 없으면 기존 프로파일 flags fallback에서 가져옵니다.
    const __explainObj =
      (picked?.explain && typeof picked.explain === "object")
        ? picked.explain
        : ((picked?.raw?.explain && typeof picked.raw.explain === "object") ? picked.raw.explain : null);
    const __ivNote =
      (__explainObj?.interviewerNote && typeof __explainObj.interviewerNote === "object")
        ? __explainObj.interviewerNote
        : null;
    const __ivConcerns = Array.isArray(__ivNote?.concerns)
      ? __ivNote.concerns.map((x) => String(x || "").trim()).filter(Boolean)
      : [];
    const __ivEvidenceLine = String(__ivNote?.evidenceLine || "").trim();
    const __ivUsable = (__ivConcerns.length >= 1) || !!__ivEvidenceLine;

    const __mindFromIv =
      __ivUsable && String(__ivNote?.oneLiner || "").trim()
        ? [String(__ivNote.oneLiner).trim(), "면접관 판단 메모(리스크 엔진 기반)"]
        : [];
    const __reasonsFromIv = (() => {
      if (!__ivUsable) return [];
      const out = __ivConcerns.slice(0, 2);
      if (__ivEvidenceLine) out.push(`근거: ${__ivEvidenceLine}`);
      return out;
    })();

    // [PATCH] 그룹 SSOT 1순위 → interviewerNote → template → flagsCtx fallback
    const mind =
      (__groupDetail?.mind?.length
        ? __groupDetail.mind
        : (__mindFromIv.length
          ? __mindFromIv
          : (Array.isArray(__tpl?.mind) && __tpl.mind.length
            ? __tpl.mind
            : (layerGuess === "interview" ? __flagsCtx.intMind : __flagsCtx.docMind))));

    const reasons =
      (__groupDetail?.reasons?.length
        ? __groupDetail.reasons
        : (__reasonsFromIv.length
          ? __reasonsFromIv
          : (Array.isArray(__tpl?.reasons) && __tpl.reasons.length
            ? __tpl.reasons
            : (layerGuess === "interview" ? __flagsCtx.reasonsInt : __flagsCtx.reasonsDoc))));

    const questions =
      (__groupDetail?.questions?.length
        ? __groupDetail.questions
        : (Array.isArray(__tpl?.questions) && __tpl.questions.length
          ? __tpl.questions
          : (layerGuess === "interview" ? __flagsCtx.qInt : __flagsCtx.qDoc)));

    const __directFixes = (() => {
      const __cands = [
        picked?.explain?.action,
        picked?.raw?.explain?.action,
      ];
      const __seen = new Set();
      const __out = [];
      for (const arr of __cands) {
        if (!Array.isArray(arr)) continue;
        for (const x of arr) {
          const t = String(x || "").trim();
          if (!t) continue;
          if (__seen.has(t)) continue;
          __seen.add(t);
          __out.push(t);
          if (__out.length >= 3) return __out;
        }
      }
      return __out;
    })();

    // [PATCH] 그룹 SSOT 1순위 → directFixes → template → flagsCtx fallback
    const fixes =
      (__groupDetail?.fixes?.length
        ? __groupDetail.fixes
        : (__directFixes.length
          ? __directFixes
          : (Array.isArray(__tpl?.fixes) && __tpl.fixes.length
            ? __tpl.fixes
            : (layerGuess === "interview" ? __flagsCtx.fixInt : __flagsCtx.fixDoc))));

    const signalLabel = (() => {
      // [PATCH] G01~G11 그룹 이름을 우선 사용, 매핑 없으면 기존 로직 유지
      const rid = String(rawId || "").trim();
      const __group = rid ? getGroupByKey(rid) : null;
      if (__group?.name) return __group.name;
      const t = String(title || "").trim();
      if (t) return t;
      if (!rid) return "";
      const readable = rid
        .replace(/^.*__/, "")
        .replace(/_/g, " ")
        .trim();
      return readable || rid;
    })();

    const signalSummary = (() => {
      const __seen = new Set();
      const __out = [];
      const __pushLine = (v) => {
        const t = String(v || "").replace(/\s+/g, " ").trim();
        if (!t) return;
        if (__seen.has(t)) return;
        __seen.add(t);
        __out.push(t.length > 160 ? `${t.slice(0, 159)}...` : t);
      };
      const __pushList = (arr) => {
        if (!Array.isArray(arr)) return;
        for (const x of arr) __pushLine(x);
      };
      const __pushEvidence = (ev) => {
        if (!ev) return;
        if (Array.isArray(ev)) {
          __pushList(ev);
          return;
        }
        if (typeof ev === "string") {
          __pushLine(ev);
          return;
        }
        if (typeof ev === "object") {
          for (const v of Object.values(ev)) {
            if (Array.isArray(v)) __pushList(v);
            else __pushLine(v);
          }
        }
      };

      __pushList(picked?.explain?.why);
      __pushList(picked?.raw?.explain?.why);
      __pushEvidence(picked?.raw?.evidence);
      __pushList(picked?.raw?.explain?.jdEvidence);
      __pushList(picked?.raw?.explain?.resumeEvidence);
      __pushList(picked?.explain?.jdEvidence);
      __pushList(picked?.explain?.resumeEvidence);
      __pushList(picked?.explain?.evidence);
      __pushList(picked?.raw?.explain?.evidence);

      return __out.slice(0, 2);
    })();

    const __pickEvidenceLine = (() => {
      const __collect = (src, out) => {
        if (!src) return;
        if (Array.isArray(src)) {
          for (const v of src) __collect(v, out);
          return;
        }
        if (typeof src === "object") {
          for (const v of Object.values(src)) __collect(v, out);
          return;
        }
        const t = String(src || "").replace(/\s+/g, " ").trim();
        if (!t) return;
        out.push(t.length > 120 ? `${t.slice(0, 119)}...` : t);
      };
      return (sources, avoid = new Set()) => {
        const list = [];
        for (const s of sources) __collect(s, list);
        const seen = new Set();
        for (const t of list) {
          if (!t || seen.has(t) || avoid.has(t)) continue;
          seen.add(t);
          return t;
        }
        return "";
      };
    })();

    const jdNeedLine = __pickEvidenceLine([
      picked?.raw?.explain?.jdEvidence,
      picked?.explain?.jdEvidence,
      picked?.raw?.explain?.why,
      picked?.explain?.why,
      picked?.raw?.evidence,
      picked?.raw?.explain?.evidence,
      picked?.explain?.evidence,
    ]);

    const resumeGapLine = __pickEvidenceLine([
      picked?.raw?.explain?.resumeEvidence,
      picked?.explain?.resumeEvidence,
      picked?.raw?.explain?.why,
      picked?.explain?.why,
      picked?.raw?.evidence,
      picked?.raw?.explain?.evidence,
      picked?.explain?.evidence,
    ], new Set(jdNeedLine ? [jdNeedLine] : []));

    return { id: rawId, layer: layerGuess, title, codename, mind, reasons, questions, fixes, signalLabel, signalSummary, jdNeedLine, resumeGapLine };
  }, [detailId, __top3List, __viewRisks, __flagsCtx]);
  return (
    // ??embed-friendly light theme (no full-page dark, no min-h-screen)
    <div className="relative w-full overflow-hidden bg-gradient-to-b from-slate-50 via-slate-50 to-white text-slate-900">
      {/* ??UI-only: subtle premium backdrop (no engine impact) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* soft color bloom (very low saturation) */}
        <div className="absolute -inset-24 bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.08),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(99,102,241,0.08),transparent_60%)]" />
        {/* gentle base tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-white to-slate-50" />
        {/* micro grain (texture, not color) */}
        <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(2,6,23,0.9)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
      </div>
      {/* page container */}
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-6 sm:py-8">
        {/* header */}
        <div className="mb-6">
          <div className="text-sm text-slate-500">분석 시뮬레이션</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            🎯 지금 면접관이 보는 신호를 정리해드립니다
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            현재 구간의 판단은
            <span className="text-indigo-600"> 정량 근거</span>를 중심으로 보이게 됩니다.
          </p>
        </div>
        {/* ??PATCH (append-only): Report summary hero (top) */}
        <section className="mb-5">
          <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                  현재 면접관 해석 유형
                </div>
                <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {__resolvedMainType}
                </div>
                {__top3Keywords.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {__top3Keywords.map((k, idx) => (
                      <span
                        key={`reason-chip-${idx}`}
                        className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                        title={k}
                      >
                        <span className="mr-1 text-slate-400">#{idx + 1}</span>
                        <span className="truncate">{k}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* ✅ PATCH (append-only): 리포트 요약 상세보기 버튼 */}
              <div className="shrink-0 self-start">
                <button
                  type="button"
                  onClick={openTypeDetail}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
                >
                  상세보기 <span className="text-slate-400">›</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {false /* [PATCH 1.6.1] 현재 레벨 해석 / 리스크 해석 요약 카드 렌더 제거 */ ? (
          <section className="mb-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                      현재 레벨 해석
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                      {String(__currentLevel?.title || "레벨 해석 보류").trim()}
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${__levelToneClass}`}>
                    {String(__currentLevel?.dominantLevel || "unknown").trim()}
                  </span>
                </div>
                {String(__currentLevel?.summary || "").trim() ? (
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {String(__currentLevel.summary || "").trim()}
                  </p>
                ) : null}
                {__currentLevelPositiveEvidence.length ? (
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                      현재 이력서에서 강하게 읽히는 점
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {__currentLevelPositiveEvidence.map((item, idx) => (
                        <span
                          key={`career-level-positive-${idx}`}
                          className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          title={item}
                        >
                          <span className="truncate">{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
                {__currentLevelGapEvidence.length ? (
                  <div className="mt-4">
                    <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                      보수적으로 읽힐 수 있는 지점
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {__currentLevelGapEvidence.map((item, idx) => (
                        <span
                          key={`career-level-gap-${idx}`}
                          className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                          title={item}
                        >
                          <span className="truncate">{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                  리스크 해석 요약
                </div>
                <div className="mt-3 grid gap-3">
                  {__riskViewItems.length ? __riskViewItems.map((item, idx) => (
                    <div
                      key={`career-risk-view-${item?.id || idx}`}
                      className={`rounded-xl border p-3 shadow-sm ${__riskSeverityClass(item?.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">
                            {String(item?.title || "리스크 신호").trim()}
                          </div>
                          {String(item?.summary || "").trim() ? (
                            <div className="mt-1 text-sm leading-6">
                              {String(item.summary || "").trim()}
                            </div>
                          ) : null}
                        </div>
                        <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                          {String(item?.severity || "low").trim()}
                        </span>
                      </div>
                      {Array.isArray(item?.evidence) && item.evidence.length ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.evidence.slice(0, 3).map((evidence, evidenceIdx) => (
                            <span
                              key={`career-risk-evidence-${idx}-${evidenceIdx}`}
                              className="inline-flex max-w-full items-center rounded-full bg-white/80 px-2 py-1 text-[11px] font-medium"
                              title={evidence}
                            >
                              <span className="truncate">{evidence}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )) : (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 text-sm text-slate-600">
                      상단 리스크를 재조합할 수 있는 요약 항목이 아직 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {__careerInterpretation ? (
          <section className="mb-5">
            <div className="grid gap-4">
              {__currentFlow ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                        현재 커리어 흐름 해석
                      </div>
                      <div className="mt-2 text-xl font-semibold tracking-tight text-slate-900">
                        {__flowMainTitle}
                      </div>
                    </div>
                    {__currentFlow?.flags?.hasCareerHistory ? (
                      <span className="inline-flex shrink-0 items-center rounded-full border border-slate-200/80 bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {__flowBadgeText}
                      </span>
                    ) : null}
                  </div>
                  {String(__currentFlow?.summary || "").trim() ? (
                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {String(__currentFlow.summary || "").trim()}
                    </p>
                  ) : null}
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {String(__currentFlow?.startPoint || "").trim() ? (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">시작점</div>
                        <div className="mt-1 text-sm leading-6 text-slate-800">
                          {String(__currentFlow.startPoint || "").trim()}
                        </div>
                      </div>
                    ) : null}
                    {__flowTransitions.length ? (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:col-span-2">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">이동 흐름</div>
                        <ul className="mt-2 space-y-2">
                          {__flowTransitions.map((item, idx) => (
                            <li key={`career-flow-transition-${idx}`} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                              <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                              <span>{__humanizeCareerText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {String(__currentFlow?.currentAxis || "").trim() ? (
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:col-span-3">
                        <div className="text-[11px] font-semibold tracking-wide text-slate-500">현재 중심축</div>
                        <div className="mt-1 text-sm leading-6 text-slate-800">
                          {String(__currentFlow.currentAxis || "").trim()}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  {__flowEvidence.length ? (
                    <div className="mt-4">
                      <div className="text-[11px] font-semibold tracking-wide text-slate-500">
                        해석 근거
                      </div>
                      <ul className="mt-2 space-y-2">
                        {__flowEvidence.map((item, idx) => (
                          <li key={`career-flow-evidence-${idx}`} className="flex items-start gap-2 text-sm leading-6 text-slate-700">
                            <span className="mt-[0.45rem] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />
                            <span>{__humanizeCareerText(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* 3) Top3 signals */}
        <section className="-mt-1 sm:mt-0 mb-5">
          <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 sm:p-6 shadow-sm backdrop-blur">
            <div>
              <div>
                <div className="mt-0.5 text-base font-semibold tracking-tight text-slate-900">
                  핵심 리스크 3가지
                </div>
              </div>
            </div>

            {/* ✅ append-only: capReason 사용 가능한 경우 표시 (crash-safe) */}
            {(() => {
              const top = __top3RiskCards?.[0] || null;
              const __msg = String(
                top?.interviewerView ||
                top?.note ||
                top?.userReason ||
                ""
              ).trim();
              if (!__msg) return null;
              return (
                <div className="mt-3 rounded-2xl border border-violet-200/70 bg-violet-50/70 p-4 shadow-sm">
                  <div className="text-sm font-semibold text-violet-900">
                    핵심 해석 요약
                  </div>
                  <div className="mt-1 text-sm text-violet-900/90">
                    {__msg}
                  </div>
                </div>
              );
            })()}
            <div className="mt-4">
              <div className="text-xs text-slate-500">
                추가 확인 가능성이 높은 핵심 리스크입니다
              </div>
              <div className="mt-2 grid gap-3">
                {(__top3RiskCards || []).slice(0, 3).map((x, idx) => {
                  const __id = String(x?.__id || x?.id || "").trim();
                  const __title =
                    String(x?.title || x?.label || x?.name || "").trim() || "리스크 신호";

                  return (
                    <button
                      type="button"
                      key={`risk-card-${idx}-${__id}`}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/55 px-4 py-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/25 focus-visible:ring-offset-2 active:translate-y-[1px] active:bg-slate-100/80"
                      onClick={() => openDetail(__id)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="shrink-0">
                            <span className="inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full bg-white px-1.5 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                              {idx + 1}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pl-1 text-sm font-semibold leading-5 text-slate-900 whitespace-normal break-words sm:truncate">
                            {__title}
                          </div>
                        </div>
                        {String(x?.explanationHint || "").trim() ? (
                          <div className="mt-2 pl-8 text-xs leading-5 text-slate-500">
                            {String(x.explanationHint || "").trim()}
                          </div>
                        ) : null}
                        {String(x?.jdGapHint || "").trim() ? (
                          <div className="mt-2 pl-8 text-xs leading-5 text-slate-500">
                            {String(x.jdGapHint || "").trim()}
                          </div>
                        ) : null}
                      </div>
                      <div className="shrink-0 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-slate-500 ring-1 ring-slate-200/80 sm:gap-1.5 sm:px-2.5 sm:text-[11px]">
                        <span className="sm:hidden">보기</span>
                        <span className="hidden sm:inline">상세 보기</span>
                        <span aria-hidden="true" className="text-sm leading-none text-slate-400">{">"}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            {(() => {
              const nextActions = Array.isArray(vm?.nextActions) ? vm.nextActions : [];
              if (!nextActions.length) return null;
              const __normalizeActionText = (value) =>
                String(value || "")
                  .replace(/\s+/g, " ")
                  .trim();
              const __displayActionTitle = (action) => {
                const actionId = String(action?.id || "").trim();
                const rawTitle = __normalizeActionText(action?.title);
                const mappedTitle =
                  {
                    rewrite_jd_link: "JD 핵심 업무 문장 추가",
                    write_transition_bridge: "이전 경험과 지원 직무 연결 문장 추가",
                  }[actionId] || rawTitle;
                return mappedTitle || "바로 수정할 액션";
              };
              const __buildActionWhy = (action) => {
                const category = String(action?.category || "").trim();
                const sourceSignal = String(action?.sourceSignal || "").trim();
                if (
                  category === "objection" ||
                  category === "requirement_bridge" ||
                  String(action?.dedupeGroup || "").trim() === "year_gap"
                ) {
                  return "상단에서 조건 리스크를 먼저 완충해야 이후 경험 문장이 더 설득력 있게 읽힙니다.";
                }
                if (
                  category === "transition" ||
                  String(action?.dedupeGroup || "").trim() === "domain_bridge" ||
                  String(action?.dedupeGroup || "").trim() === "transition_bridge"
                ) {
                  return "이전 경험이 지원 직무와 어떻게 이어지는지 먼저 보이도록 연결 문장을 보강하는 단계입니다.";
                }
                if (
                  category === "evidence" ||
                  category === "tool_evidence" ||
                  String(action?.dedupeGroup || "").trim() === "quant" ||
                  String(action?.dedupeGroup || "").trim() === "ownership"
                ) {
                  return "경험 자체보다 성과, 산출물, 기여 근거가 약하게 보일 수 있어 증거 밀도를 올리는 액션입니다.";
                }
                if (category === "ordering" || category === "clarity") {
                  return "핵심 경험은 있지만 현재는 배치와 표현 때문에 실행력이 약하게 읽혀 우선 정리가 필요합니다.";
                }
                if (
                  category === "jd_link" ||
                  sourceSignal === "TASK__CORE_COVERAGE_LOW" ||
                  sourceSignal === "TASK__EVIDENCE_TOO_WEAK"
                ) {
                  return "JD 핵심 과업과 바로 맞닿는 행동 문장이 부족해 먼저 연결 문장을 보강해야 합니다.";
                }
                return "현재 이력서에서 바로 손볼 수 있는 우선 액션입니다.";
              };
              const primaryAction = nextActions[0] || null;
              const secondaryActions = nextActions.slice(1, 3);
              return (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
                  <div className="text-sm font-semibold text-slate-900">다음 액션 추천</div>
                  <div className="mt-1 text-xs text-slate-500">설명보다 먼저, 바로 수정할 행동부터 확인하세요.</div>
                  <div className="mt-3 space-y-3">
                    {primaryAction ? (() => {
                      const action = primaryAction;
                      const displayTitle = __displayActionTitle(action);
                      const task = __normalizeActionText(action?.task);
                      const example = __normalizeActionText(action?.example);
                      const why = __normalizeActionText(__buildActionWhy(action));
                      return (
                        <div className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-[linear-gradient(180deg,rgba(238,242,255,0.92),rgba(255,255,255,0.96))] p-4 shadow-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="rounded-full bg-indigo-600 px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] text-white">
                              TOP1 ACTION
                            </div>
                            <div className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-indigo-700 ring-1 ring-indigo-100">
                              FIRST PRIORITY
                            </div>
                          </div>
                          <div className="mt-3 text-base font-semibold tracking-tight text-slate-900">
                            {displayTitle}
                          </div>
                          {task ? (
                            <div className="mt-3 rounded-xl border border-indigo-100 bg-white/90 px-4 py-3">
                              <div className="text-[11px] font-semibold tracking-wide text-indigo-600">
                                지금 할 일
                              </div>
                              <div className="mt-1 text-sm leading-relaxed text-slate-800">
                                {task}
                              </div>
                            </div>
                          ) : null}
                          {why && why !== task ? (
                            <div className="mt-3 rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-sm leading-relaxed text-slate-600">
                              {why}
                            </div>
                          ) : null}
                          {example ? (
                            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/75 px-4 py-3">
                              <div className="text-[11px] font-semibold tracking-wide text-emerald-700">
                                예시
                              </div>
                              <div className="mt-1 text-sm leading-relaxed text-emerald-900">
                                {example}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })() : null}
                    {secondaryActions.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {secondaryActions.map((action, idx) => {
                          const actionId = String(action?.id || "").trim();
                          const displayTitle = __displayActionTitle(action);
                          const task = __normalizeActionText(action?.task);
                          const example = __normalizeActionText(action?.example);
                          const why = __normalizeActionText(__buildActionWhy(action));
                          return (
                            <div key={`next-action-${idx + 1}-${actionId}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="text-xs font-semibold text-slate-700">TOP{idx + 2}</div>
                                <div className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-500 ring-1 ring-slate-200/80">
                                  ACTION
                                </div>
                              </div>
                              <div className="mt-2 text-sm font-semibold leading-snug text-slate-900">
                                {displayTitle}
                              </div>
                              {task ? (
                                <div className="mt-2 text-xs leading-relaxed text-slate-600">
                                  {task}
                                </div>
                              ) : null}
                              {example ? (
                                <div className="mt-2 rounded-lg border border-emerald-100 bg-white/80 px-3 py-2 text-xs leading-relaxed text-emerald-900">
                                  {example}
                                </div>
                              ) : why && why !== task ? (
                                <div className="mt-2 text-xs leading-relaxed text-slate-500">
                                  {why}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    {nextActions.slice(3).map((action, idx) => {
                      const actionId = String(action?.id || "").trim();
                      const displayTitle = __displayActionTitle(action);
                      const task = __normalizeActionText(action?.task);
                      const example = __normalizeActionText(action?.example);
                      const why = __normalizeActionText(__buildActionWhy(action));
                      return (
                        <div key={`next-action-${idx + 3}-${actionId}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                          <div className="flex items-center gap-2">
                            <div className="text-xs font-semibold text-indigo-700">TOP{idx + 4}</div>
                            <div className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-slate-600">
                              ACTION
                            </div>
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{displayTitle}</div>
                          {task ? (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800">
                              <span className="font-semibold text-slate-900">지금 할 일</span>
                              <span className="ml-2">{task}</span>
                            </div>
                          ) : null}
                          {example ? (
                            <div className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900">
                              <span className="font-semibold">예시</span>
                              <span className="ml-2">{example}</span>
                            </div>
                          ) : null}
                          {why && why !== task ? (
                            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/55 px-3 py-2 text-xs leading-5 text-slate-600">
                              {why}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {null}
        {/* 3.5) Semantic Match (moved from App.jsx) */}
        {(() => {
          try {
            const meta = vm?.semanticMeta || vm?.semantic?.meta || null;
            const match = vm?.semanticMatch || vm?.semantic?.match || null;

            const status = String(meta?.status || "").trim();
            const ok = meta?.ok === true;
            const matches = Array.isArray(match?.matches) ? match.matches : [];
            const toNum01 = (v) => {
              const n = Number(v);
              if (!Number.isFinite(n)) return 0;
              return Math.max(0, Math.min(1, n));
            };
            const similarityLabel = (v) => {
              const s = toNum01(v);
              if (s >= 0.9) return "매우 강한 유사";
              if (s >= 0.82) return "강한 유사";
              if (s >= 0.74) return "부분 유사";
              if (s >= 0.66) return "약한 유사";
              return "직접 매칭 근거 약함";
            };
            const semanticThreshold = toNum01(
              Number.isFinite(Number(vm?.semanticThreshold)) ? vm.semanticThreshold : 0.78
            );
            const semanticScore = toNum01(
              Number.isFinite(Number(vm?.semanticScore))
                ? vm.semanticScore
                : (Number.isFinite(Number(meta?.avgSimilarity)) ? meta.avgSimilarity : 0)
            );
            const domainMismatch = vm?.domainMismatch === true;
            const show =
              Boolean(match) &&
              domainMismatch !== true &&
              semanticScore >= semanticThreshold;

            const pickDisplayMatches = (src, limit = 1, threshold = semanticThreshold) => {
              const list = Array.isArray(src) ? src : [];
              const usedResume = new Set();
              const out = [];
              const norm = (s) =>
                String(s || "")
                  .replace(/\u00A0/g, " ")
                  .replace(/\s+/g, " ")
                  .trim()
                  .toLowerCase();

              for (const m of list) {
                const candidates = Array.isArray(m?.candidates) ? m.candidates : [];
                const best = (m?.best && typeof m.best === "object") ? m.best : null;

                let chosen = best;
                const bestTextKey = norm(best?.text ?? best?.resumeText ?? "");
                if (bestTextKey && usedResume.has(bestTextKey)) {
                  const alt = candidates.find((c) => {
                    const k = norm(c?.text ?? c?.resumeText ?? "");
                    return Boolean(k) && !usedResume.has(k);
                  });
                  if (alt) chosen = alt;
                }

                const resumeText = String(
                  chosen?.text ??
                  chosen?.resumeText ??
                  m?.best?.text ??
                  m?.best?.resumeText ??
                  m?.resumeText ??
                  m?.resume ??
                  ""
                );
                const resumeKey = norm(resumeText);

                const scoreRaw = Number(chosen?.score ?? m?.best?.score ?? m?.score ?? 0);
                const score = toNum01(scoreRaw);
                if (score < threshold) continue;
                if (resumeKey) usedResume.add(resumeKey);

                out.push({
                  jdText: String(m?.jdText ?? m?.jd ?? ""),
                  resumeText,
                  score,
                  scoreText: `유사도 ${score.toFixed(2)}`,
                  label: similarityLabel(score),
                  candidateCount: candidates.length,
                });

                if (out.length >= limit) break;
              }

              return out;
            };
            const displayMatches = pickDisplayMatches(matches, 1, semanticThreshold);
            try {
              globalThis.__SEMANTIC_SECTION_DBG__ = {
                ts: Date.now(),
                hasMatch: Boolean(match),
                meta,
                ok,
                status,
                matchesLength: matches.length,
                displayMatchesLength: displayMatches.length,
                semanticScore,
                semanticThreshold,
                domainMismatch,
                show,
                matchPreview: matches.slice(0, 5).map((m) => ({
                  jd: String(m?.jd ?? ""),
                  jdText: String(m?.jdText ?? ""),
                  bestScore: Number(m?.best?.score ?? NaN),
                  candidatesLength: Array.isArray(m?.candidates) ? m.candidates.length : 0,
                })),
              };
            } catch { }
            // [PATCH 1.6.2] 카드 shell 표시와 상세 리스트 표시를 분리
            // - 카드 shell: semantic 데이터가 존재하면 항상 표시
            // - 상세 매칭 리스트: 기존 threshold/domainMismatch 기준 유지
            const hasSemanticData = Boolean(meta || match);
            if (!hasSemanticData) return null;
            const showDetailList = show && displayMatches.length > 0;

            return (
              <section className="mb-5">
                {/* light premium wrapper */}
                <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white/70 shadow-lg backdrop-blur
  transition-[border-color,box-shadow] duration-200
  hover:border-violet-300/60 hover:ring-1 hover:ring-violet-400/15 hover:shadow-lg
  focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-400/15">
                  {/* soft gradient tint (B2C) */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                  >
                    <div className="absolute -inset-24 bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,0.10),transparent_55%),radial-gradient(circle_at_82%_22%,rgba(99,102,241,0.08),transparent_55%),radial-gradient(circle_at_50%_95%,rgba(124,58,237,0.05),transparent_60%)]" />
                    <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/60 to-white/80" />
                  </div>

                  <div className="relative px-4 py-3 sm:px-5 sm:py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="mt-1 text-base font-semibold text-slate-900">
                          의미 기반 JD-이력서 매칭 {ok ? "" : (status || "pending")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-700">
                      {ok ? (
                        <span>
                          Top 매칭 {displayMatches.length}쌍 생성됨 (표시 임계값 {semanticThreshold.toFixed(2)})
                        </span>
                      ) : (
                        <span>실행 실패: {String(meta?.error || status || "unknown")}</span>
                      )}
                    </div>

                    {showDetailList ? (
                      <div className="mt-4 space-y-3">
                        {displayMatches.map((m, idx) => {
                          return (
                            <div
                              key={idx}
                              className="rounded-3xl border border-slate-200/60 bg-white/70 p-5 shadow-lg backdrop-blur
  transition-[border-color,box-shadow] duration-200
  hover:border-violet-300/60 hover:ring-1 hover:ring-violet-400/15 hover:shadow-lg
  focus-within:border-violet-300/60 focus-within:ring-1 focus-within:ring-violet-400/15"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-baseline gap-2">
                                  <div className="text-base font-extrabold text-slate-900 tracking-tight">
                                    {m.label}
                                  </div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    {m.scoreText}
                                  </div>
                                </div>

                                <div className="text-[11px] font-medium text-slate-500">
                                  유사 후보 {m.candidateCount}개
                                </div>
                              </div>

                              <div className="mt-4 space-y-4">

                                {/* JD 문구 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    JD 문구
                                  </div>
                                  <div className="mt-1 rounded-xl bg-slate-100/70 p-3 text-[13px] leading-relaxed text-slate-900">
                                    {m.jdText.slice(0, 120)}
                                  </div>
                                </div>

                                {/* 연결 표시 */}
                                <div className="flex items-center justify-center">
                                  <span className="text-slate-400 text-sm">↔</span>
                                </div>

                                {/* 이력서 문구 */}
                                <div>
                                  <div className="text-[11px] font-medium text-slate-500">
                                    이력서 문구
                                  </div>
                                  <div className="mt-1 rounded-xl border border-violet-200/50 bg-violet-50/60 p-3 text-[13px] leading-relaxed text-slate-900">
                                    {m.resumeText.slice(0, 120)}
                                  </div>
                                </div>

                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-3 rounded-xl border border-slate-200/60 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 leading-relaxed">
                        상세 일치 항목이 충분히 확보되지 않았습니다.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          } catch (e) {
            try {
              globalThis.__SEMANTIC_SECTION_DBG__ = {
                ts: Date.now(),
                error: String(e?.message ?? e),
                phase: "semantic_section_catch",
              };
            } catch { }
            return null;
          }
        })()}

        {/* 5.5) Coaching CTA (migrated from App.jsx) */}
        {!hideNextStep && (
          <section className="mb-6">
            <div className="overflow-hidden rounded-3xl bg-white/70 backdrop-blur shadow-[0_18px_55px_rgba(2,6,23,0.10)] ring-1 ring-black/5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/60 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-300/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-300/25">
                      선택 다음 단계(옵션)
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">
                      원하시면 여기에서 바로 다음 단계로 이어갈 수 있습니다.
                    </span>
                  </div>

                  <div className="mt-2 text-base font-semibold tracking-tight text-slate-900 sm:text-[17px]">
                    상세 보완과 실전 단계 액션으로 이동합니다
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    리포트의 취약/강점에 맞춘 안내 카드입니다.
                  </div>
                </div>

                <div className="shrink-0">
                  <span className="inline-flex items-center rounded-full bg-indigo-600/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-600/15">
                    Guide
                  </span>
                </div>
              </div>

              {/* Body (기존 사용 불가: 배경색/여백 변경) */}
              <div className="px-5 py-4 sm:px-6">
                <div className="rounded-2xl bg-slate-50/70 p-4 ring-1 ring-slate-200/70">
                  <div className="text-xs font-semibold text-slate-600">
                    아래 항목 중 해당되는 것을 골라주세요
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    (문장/구조를 어떻게 고칠지 제안 중심으로 바뀝니다)
                  </div>

                  {/* ✅ 아래 내용은 현재 사용 중인 JSX 범위입니다. 꼭 필요한 부분만 보관.
                      위 div 안쪽의 기존 내용을 바꿔 쓰려면 여기에 내용을 넣어야 합니다. */}
                  <div className="mt-3">
                    {/* ORIGINAL CTA BODY START */}
                    {/* 아래 내용은 <div className="mt-4 rounded-xl border bg-slate-50/60 p-4"> ... </div>
                        사용 불가 - 더 이상 사용하지 않습니다. */}
                    {/* ORIGINAL CTA BODY END */}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(79,70,229,0.25)] hover:bg-indigo-700"
                    onClick={() => {
                      try { window.__DBG_CTA_CLICK__ = { at: Date.now(), kind: "strategy_session" }; } catch { }
                    }}
                  >
                    다음 단계 액션 알아보기
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-600/20 hover:bg-indigo-600/5"
                    onClick={() => {
                      try { window.__DBG_CTA_CLICK__ = { at: Date.now(), kind: "chat" }; } catch { }
                    }}
                  >
                    가볍게 문의하기
                  </button>
                  <span className="text-xs text-slate-500">
                    (선택/입력 정보 중심 근거 기반 안내)
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ✅ PATCH (append-only): Top3 "노트북" 기능 꺼진 리스크 열기 */}
        {detailOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              onClick={closeDetail}
            />
            <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-4 sm:py-8">
              <div className="mx-auto w-[min(720px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="p-5 sm:p-6">
                  <SecretNotebookSheet
                    stamp="면접관 내부 메모"
                    title={`${__detail.title} ${__detail.codename}`}
                    subtitle="왜 그렇게 보였는지와 어떤 부분을 바꾸면 달라지는지를 면접관 관점으로 정리했습니다."
                    metaRight="Top3 · private"
                    mind={__detail.mind}
                    reasons={__detail.reasons}
                    questions={__detail.questions}
                    fixes={__detail.fixes}
                    signalLabel={__detail.signalLabel}
                    signalSummary={__detail.signalSummary}
                    jdNeedLine={__detail.jdNeedLine}
                    resumeGapLine={__detail.resumeGapLine}
                    onClose={closeDetail}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ PATCH (append-only): candidateType 상세보기 overlay */}
        {typeDetailOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
              onClick={closeTypeDetail}
            />
            <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-4 sm:py-8">
              <div className="mx-auto w-[min(720px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
                <div className="p-5 sm:p-6">
                  <CandidateTypeSheet
                    candidateType={__resolvedMainType}
                    passmapTypeId={__passmapTypeId}
                    topRiskCards={__top3RiskCards}
                    detailData={__detail}
                    onClose={closeTypeDetail}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ PATCH (append-only): candidateType 상세 설명 메타
const __CANDIDATE_TYPE_META = {
  "즉전감형": {
    description: "핵심 역량과 경험이 JD 요구 사항과 맞아 있어, 면접관이 즉시 활용 가능한 후보로 읽을 가능성이 높습니다.",
    interviewerView: "지금 역할에 바로 투입 가능한 근거가 보입니다. 경험 확인보다 조율 단계로 빠르게 넘어가는 흐름입니다.",
    actionHint: "강점이 잘 드러나 있습니다. 면접에서 수치 중심 근거 문장을 추가로 준비해두면 좋습니다.",
  },
  "바로 활용 가능 후보": {
    description: "필수 요건과 핵심 역량이 모두 충족되어 있어, 면접관이 긍정적으로 읽을 가능성이 높습니다.",
    interviewerView: "리스크보다 강점이 먼저 눈에 띄는 상태입니다. 검증 질문보다 조율 단계로 넘어갈 수 있습니다.",
    actionHint: "현재 구성을 유지하고, 면접 시 구체적 수치와 결과 중심으로 답변을 준비하세요.",
  },
  "성장 가능 후보": {
    description: "핵심 역량 방향은 맞지만, 일부 영역에서 추가 근거가 필요한 상태입니다.",
    interviewerView: "가능성은 보이지만 확신이 생기기 전에 확인 질문이 먼저 나올 수 있습니다.",
    actionHint: "신호 TOP3에서 약한 항목을 중심으로 근거 문장을 보완하면 통과 가능성이 높아집니다.",
  },
  "구조적 리스크형": {
    description: "직무 계열 또는 경험 구조상 주요 리스크가 관찰되어, 면접관이 우선적으로 확인 질문을 가져갈 수 있습니다.",
    interviewerView: "전환이나 역할 이동이 명확하게 설명되지 않으면 의구심이 먼저 생기는 상태입니다.",
    actionHint: "직무 전환 또는 경력 연결 근거를 이력서 상단에서 미리 설명하는 문장이 필요합니다.",
  },
  "핵심 역량 공백형": {
    description: "JD가 요구하는 핵심 업무 경험이 이력서에서 충분히 확인되지 않아, 적합도 판단이 어려운 상태입니다.",
    interviewerView: "이 역할을 실제로 해봤는지 확인하기 어렵습니다. 경험이 있더라도 문장으로 보이지 않으면 없는 것과 같습니다.",
    actionHint: "JD 핵심 업무와 직결되는 항목을 추가하세요. 스친 경험도 구체화하면 달라 보입니다.",
  },
  "근거 보강형": {
    description: "방향은 맞지만 근거 문장이 얕아, 면접관이 확신을 갖기 전에 추가 검증을 요청할 가능성이 있습니다.",
    interviewerView: "경험은 있어 보이지만 어떻게, 얼마나가 보이지 않아 판단이 유보됩니다.",
    actionHint: "기존 문장에 수치나 결과, 본인 기여 범위를 추가하면 신뢰도가 올라갑니다.",
  },
  "조건 미충족형": {
    description: "연차, 자격, 근무 조건 등 기본 요건에서 불일치가 발견되어 게이트 단계에서 걸릴 수 있습니다.",
    interviewerView: "경험 평가 이전에 기본 조건 확인이 먼저 이루어집니다. 조건 리스크가 해소되지 않으면 다음 단계로 넘어가기 어렵습니다.",
    actionHint: "가장 큰 조건 불일치부터 확인하세요. 일부는 설명 문장으로 완충할 수 있습니다.",
  },
  "탐색 구간": {
    description: "현재 점수와 신호 구성상 방향성이 아직 정해지지 않은 상태입니다. 보완 포인트가 여러 곳에 분산되어 있습니다.",
    interviewerView: "이 역할에 왜 지원했는지가 명확하게 읽히지 않는 상태입니다.",
    actionHint: "신호 TOP3에서 가장 임팩트 있는 항목 하나부터 집중 보완하세요.",
  },
  "검토 필요형": {
    description: "판단을 내리기 전에 추가 확인이 필요한 상태입니다. 강점도, 명확한 리스크도 지배적이지 않습니다.",
    interviewerView: "판단을 유보하는 상태입니다. 긍정 신호가 더 선명해지면 통과 가능성이 생깁니다.",
    actionHint: "핵심 역량 문장을 좀 더 직접적으로 표현하면 판단이 빨라집니다.",
  },
  "근거 확인형": {
    description: "방향은 인식되지만 근거가 충분히 선명하지 않아, 면접관이 확인 질문을 가져올 가능성이 있습니다.",
    interviewerView: "맞을 수도 있다는 느낌은 있지만 확신이 없어 검증이 먼저 나옵니다.",
    actionHint: "가장 강한 경험 1~2개를 구체화하면 전체 인상이 달라집니다.",
  },
  "보완 필요형": {
    description: "여러 영역에서 보완이 필요한 상태입니다. 이력서 구성이나 핵심 역량 문장을 전반적으로 점검해야 합니다.",
    interviewerView: "설득력 있는 부분보다 의문점이 먼저 눈에 띄는 상태입니다.",
    actionHint: "신호 TOP3에서 우선순위가 높은 항목을 먼저 확인하고 하나씩 보완하세요.",
  },
  "리스크 높음": {
    description: "주요 리스크 신호가 복합적으로 관찰되어, 이 상태로는 통과 확률이 낮게 읽힐 수 있습니다.",
    interviewerView: "긍정 신호보다 리스크 신호가 먼저 눈에 들어오는 상태입니다.",
    actionHint: "가장 강한 리스크 신호 1개부터 집중 보완하세요. 작은 변화가 전체 인상을 바꿀 수 있습니다.",
  },
};

// ✅ PATCH (append-only): candidateType 상세 경량 시트
function CandidateTypeSheet({ candidateType, passmapTypeId, onClose }) {
  const __pmId = String(passmapTypeId || "").trim();
  const __pmMeta = (__pmId && PASSMAP_TYPE_DESCRIPTIONS && PASSMAP_TYPE_DESCRIPTIONS[__pmId]) || null;

  const key = String(candidateType || "").trim();
  const meta = __pmMeta || (__CANDIDATE_TYPE_META && __CANDIDATE_TYPE_META[key]) || null;
  const description = meta?.description || "현재 분석 결과를 기반으로 한 유형입니다.";
  const interviewerView = meta?.interviewerView || "면접관 해석 정보를 불러오는 중입니다.";

  const profile = __pmMeta?.profile ?? null;
  if (!profile) return null;

  const hasToneTags = Array.isArray(profile.toneTags) && profile.toneTags.length > 0;
  const hasFirstImpression = Array.isArray(profile.firstImpression) && profile.firstImpression.length > 0;
  const hasWhenItAppears = Array.isArray(profile.whenItAppears) && profile.whenItAppears.length > 0;
  const hasStrengths = Array.isArray(profile.strengths) && profile.strengths.length > 0;
  const hasHesitationPoints = Array.isArray(profile.hesitationPoints) && profile.hesitationPoints.length > 0;
  const hasPersuasionTips = Array.isArray(profile.persuasionTips) && profile.persuasionTips.length > 0;

  const BulletList = ({ items }) => (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((x, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-0.5 text-slate-300">•</span>
          <span>{x}</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            PASSMAP 유형 분석
          </div>
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-slate-950 sm:text-[1.95rem]">
            {meta?.label || key || "판단 유형 미정"}
          </h2>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            닫기
          </button>
        </div>
      </div>

      {profile.heroSummary ? (
        <section className="rounded-2xl border border-indigo-100 bg-[linear-gradient(180deg,rgba(238,242,255,0.88),rgba(255,255,255,0.98))] px-5 py-5 shadow-sm shadow-slate-200/40">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            핵심 해석
          </div>
          <p className="mt-3 text-[15px] font-medium leading-7 text-slate-900 sm:text-base">
            {profile.heroSummary}
          </p>
        </section>
      ) : null}

      {hasToneTags ? (
        <div className="flex flex-wrap gap-2">
          {profile.toneTags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {(hasFirstImpression || description || interviewerView) ? (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm shadow-slate-200/30">
          <div className="text-sm font-semibold text-slate-900">
            이 유형은 이렇게 읽힐 수 있습니다
          </div>
          <div className="mt-3 space-y-4">
            {description ? (
              <p className="text-sm leading-7 text-slate-600">{description}</p>
            ) : null}
            {hasFirstImpression ? <BulletList items={profile.firstImpression} /> : null}
            {interviewerView ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                  읽는 사람의 보조 시선
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{interviewerView}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasWhenItAppears ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-5">
          <div className="text-sm font-semibold text-slate-900">
            이 유형은 보통 이런 상황에서 나타납니다
          </div>
          <div className="mt-3">
            <BulletList items={profile.whenItAppears} />
          </div>
        </section>
      ) : null}

      {hasStrengths ? (
        <section className="rounded-2xl border border-emerald-100 bg-[linear-gradient(180deg,rgba(236,253,245,0.9),rgba(255,255,255,0.98))] px-5 py-5">
          <div className="text-sm font-semibold text-slate-900">이 유형의 강점</div>
          <div className="mt-3">
            <BulletList items={profile.strengths} />
          </div>
        </section>
      ) : null}

      {hasHesitationPoints ? (
        <section className="rounded-2xl border border-amber-100 bg-[linear-gradient(180deg,rgba(255,251,235,0.92),rgba(255,255,255,0.98))] px-5 py-5">
          <div className="text-sm font-semibold text-slate-900">
            조금 더 설명이 필요할 수 있는 부분
          </div>
          <div className="mt-3">
            <BulletList items={profile.hesitationPoints} />
          </div>
        </section>
      ) : null}

      {(hasPersuasionTips || profile.closingLine) ? (
        <section className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,1))] px-5 py-5 shadow-sm shadow-slate-200/20">
          <div className="text-sm font-semibold text-slate-900">이렇게 보완하면 좋습니다</div>
          {hasPersuasionTips ? (
            <div className="mt-3">
              <BulletList items={profile.persuasionTips} />
            </div>
          ) : null}
          {profile.closingLine ? (
            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-4">
              <p className="text-sm font-semibold leading-6 text-slate-900">{profile.closingLine}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="text-[11px] text-slate-400">
        이 해석은 이력서·JD 입력 기반 분석 결과입니다. 실제 면접 결과와 다를 수 있습니다.
      </div>
    </div>
  );
}

function SignalBadge({ label }) {
  const t = String(label || "").trim();

  const cls =
    t.includes("많이")
      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
      : t.includes("자주")
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : t.includes("즉시")
          ? "border-slate-200 bg-slate-50 text-slate-700"
          : "border-slate-200 bg-white text-slate-700";

  return (
    <div
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${cls}`}
    >
      {t || "관찰 요소"}
    </div>
  );
}

function looksLikeRawId(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return true;
  if (trimmed.includes(" ")) return false;
  if (!/[a-z]/.test(trimmed) && trimmed === trimmed.toUpperCase()) {
    return /__|[A-Z0-9]+/.test(trimmed);
  }
  return false;
}

function ensureFriendlyTitle(id, raw) {
  const trimmed = String(raw || "").trim();
  if (trimmed && !looksLikeRawId(trimmed)) return trimmed;
  const upId = String(id || "").toUpperCase();
  if (upId.includes("MUST_HAVE") || upId.includes("REQUIRED")) return "필수 요건 보완 필요";
  if (upId.includes("SKILL") && upId.includes("MISSING")) return "핵심 적합도 점검 필요";
  if (upId.includes("SALARY")) return "보상 정합성 점검 필요";
  if (upId.includes("DOMAIN") || upId.includes("SHIFT")) return "전환 근거 보완 필요";
  if (upId.includes("RISK") || upId.includes("GATE")) return "즉시전력성 근거 보완 필요";
  if (upId) return "핵심 적합도 점검 필요";
  return "리스크 요약";
}

function RiskCard({ card, onOpenDetail }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const current = Array.isArray(window.__PASSMAP_RISKCARD_INPUTS__)
        ? window.__PASSMAP_RISKCARD_INPUTS__
        : [];

      const snapshot = {
        __id: String(card?.__id || card?.id || "").trim(),
        title: String(card?.title || "").trim(),
        interviewerView: String(card?.interviewerView || "").trim(),
        userReason: String(card?.userReason || "").trim(),
        note: String(card?.note || "").trim(),
      };

      window.__PASSMAP_RISKCARD_INPUTS__ = [...current, snapshot].slice(-20);
    } catch (e) {
      if (typeof window !== "undefined") {
        window.__PASSMAP_RISKCARD_INPUTS_ERROR__ = String(e?.message || e || "");
      }
    }
  }, [card]);
  const cardId = String(card?.__id || card?.id || "").trim();
  const interviewerView = String(card?.interviewerView || "").trim();
  const userReason = String(card?.userReason || "").trim();
  const noteReason = sanitizeRiskDescription(cardId, card?.note) || "";
  const primaryCollapsedReason = interviewerView || userReason || noteReason || "";
  const actionHintSummary = String(card?.actionHint || "").trim();

  const truncateLine = (text, max) => {
    const value = String(text || "").replace(/\s+/g, " ").trim();
    if (!value) return "";
    return value.length > max ? `${value.slice(0, Math.max(0, max - 3)).trim()}...` : value;
  };
  const normalizeLine = (text) =>
    String(text || "")
      .replace(/\s+/g, " ")
      .replace(/[.:]/g, "")
      .trim();
  const overviewInterviewer = (
    interviewerView ||
    String(card?.userReason || "").trim() ||
    String(card?.note || "").trim() ||
    sanitizeRiskDescription(cardId, card?.note) ||
    ""
  );
  const overviewAction = (
    actionHintSummary ||
    String(card?.primaryReasonAction || "").trim() ||
    String(card?.__expActionHint || "").trim() ||
    ""
  );
  const expandedReason = overviewInterviewer
    ? sanitizeRiskDescription(cardId, overviewInterviewer)
    : "";
  const expandedAction = overviewAction
    ? sanitizeRiskDescription(cardId, overviewAction)
    : "";

  const toggleExpanded = (e) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  const collapsedReason = truncateLine(overviewInterviewer, 80);
  const collapsedAction = truncateLine(overviewAction, 100);


  const rawTitle = String(card?.title || "").trim();
  const safeTitle =
    rawTitle || ensureFriendlyTitle(cardId, sanitizeRiskTitle(cardId, cardId));
  const normalizedTitle = normalizeLine(safeTitle);
  const normalizedCollapsedReason = normalizeLine(collapsedReason);
  const normalizedExpandedReason = normalizeLine(expandedReason);

  const displayCollapsedReason = collapsedReason || "";
  const displayExpandedReason = expandedReason || "";

  const normalizedCollapsedAction = normalizeLine(collapsedAction);
  const normalizedExpandedAction = normalizeLine(expandedAction);

  const displayCollapsedAction =
    normalizedCollapsedAction &&
      normalizedCollapsedAction !== normalizeLine(displayCollapsedReason)
      ? collapsedAction
      : "";

  const displayExpandedAction =
    normalizedExpandedAction &&
      normalizedExpandedAction !== normalizeLine(displayExpandedReason)
      ? expandedAction
      : "";

  const showCollapsedActionLine = Boolean(
    displayCollapsedAction &&
    normalizeLine(displayCollapsedAction) !== normalizeLine(displayCollapsedReason)
  );

  const showExpandedActionLine = Boolean(
    displayExpandedAction &&
    normalizeLine(displayExpandedAction) !== normalizeLine(displayExpandedReason)
  );

  const hasOverview = Boolean(
    overviewInterviewer ||
    displayCollapsedReason ||
    displayExpandedReason
  );

  const usedLines = new Set(
    [
      safeTitle,
      displayExpandedReason,
      displayExpandedAction,
    ]
      .map((v) => normalizeLine(sanitizeRiskDescription(cardId, v)))
      .filter(Boolean)
  );
  const detailChunks = [
    card?.userReason,
    card?.note,
    card?.primaryReasonAction,
    card?.__expActionHint,
  ]
    .map((t) => (typeof t === "string" ? t.trim() : ""))
    .filter(Boolean)
    .map((line) => sanitizeRiskDescription(cardId, line))
    .filter(Boolean)
    .filter((line, idx, arr) => arr.indexOf(line) === idx)
    .filter((line) => !usedLines.has(normalizeLine(line)));
  const extraDetail = detailChunks[0] || "";
  const hasExpandedContent = Boolean(
    displayExpandedReason || displayExpandedAction || extraDetail
  );

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
      onClick={onOpenDetail}
    >
      <div className="space-y-3">
        <div className="min-w-0 space-y-3">
          <div className="text-sm font-semibold">
            {safeTitle}
          </div>
          {!expanded ? (
            <div className="mt-2 space-y-2">
              <div className="text-sm font-semibold text-slate-900">
                {safeTitle || "리스크 신호"}
              </div>

              {displayCollapsedReason ? (
                <p className="text-sm leading-relaxed text-slate-600 line-clamp-1">
                  {displayCollapsedReason}
                </p>
              ) : (
                <p className="text-xs text-slate-500">상세 보기에서 확인 가능</p>
              )}
            </div>
          ) : null}
        </div>
        {!expanded ? (
          <button
            type="button"
            onClick={toggleExpanded}
            className="text-[11px] font-semibold text-slate-500 transition hover:text-slate-700"
          >
            자세히 보기
          </button>
        ) : null}
      </div>
      {expanded && hasExpandedContent && (
        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          {displayExpandedReason ? (
            <div className="mt-2 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                면접관
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                {displayExpandedReason}
              </p>
            </div>
          ) : null}
          {showExpandedActionLine ? (
            <div className="mt-2 space-y-1">
              <div className="text-[11px] font-medium tracking-wide text-slate-400">
                보완
              </div>
              <p className="text-sm leading-relaxed text-slate-500">
                {displayExpandedAction}
              </p>
            </div>
          ) : null}
          {extraDetail ? (
            <p className="leading-relaxed text-slate-600">
              {extraDetail}
            </p>
          ) : null}
          {String(card?.__expEvidenceLine || "").trim() ? (
            <div className="text-xs text-slate-500">{card.__expEvidenceLine}</div>
          ) : null}
          <button
            type="button"
            onClick={toggleExpanded}
            className="pt-1 text-[11px] font-semibold text-slate-500 transition hover:text-slate-700"
          >
            접기
          </button>
        </div>
      )}
    </div>
  );
}


function SecretNotebookSheet({
  stamp,
  title,
  subtitle,
  metaRight,
  mind,
  reasons,
  questions,
  fixes,
  signalLabel,
  signalSummary,
  jdNeedLine,
  resumeGapLine,
  onClose,
}) {
  const __primaryMind = Array.isArray(mind) && mind.length ? String(mind[0] || "").trim() : "";
  const __secondaryMind =
    Array.isArray(mind) && mind.length > 1 ? String(mind[1] || "").trim() : "";
  const __reasons = Array.isArray(reasons) ? reasons.filter(Boolean) : [];
  const __questions = Array.isArray(questions) ? questions.filter(Boolean) : [];
  const __fixes = Array.isArray(fixes) ? fixes.filter(Boolean) : [];
  const __signalSummary = Array.isArray(signalSummary) ? signalSummary.filter(Boolean) : [];
  const __hasSupportCard = Boolean(signalLabel || __signalSummary.length || jdNeedLine || resumeGapLine);
  return (
    <div
      data-modal="detail"
      role="dialog"
      aria-modal="true"
      className="
      relative overflow-hidden rounded-2xl border border-slate-200 bg-[#fffdf7]
      shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]
      bg-[repeating-linear-gradient(to_bottom,transparent_0px,transparent_26px,rgba(59,130,246,0.10)_27px,transparent_28px)]
      after:pointer-events-none after:absolute after:inset-0
      after:bg-[radial-gradient(circle_at_10%_10%,rgba(0,0,0,0.035),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(0,0,0,0.03),transparent_50%),radial-gradient(circle_at_30%_80%,rgba(0,0,0,0.02),transparent_55%)]
      after:opacity-80
      before:absolute before:inset-y-0 before:left-10 before:w-px before:bg-rose-300/70
    "
    >
      <div className="relative pl-14 pr-5 py-5 sm:pl-16 sm:pr-6 sm:py-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-rose-700">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500/80" />
              {stamp || "면접관 내부 메모"}
            </div>

            <h3 className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
              {title || "리스크 신호 보기"}
            </h3>
            <p className="mt-1 text-sm text-slate-600 leading-relaxed">
              {subtitle || ""}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[11px] text-slate-500 font-mono">{metaRight || "private"}</div>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              닫기
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="rounded-2xl border border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,235,0.95),rgba(255,247,237,0.92))] px-4 py-4 shadow-sm sm:px-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-amber-700">
              핵심 해석
            </div>
            <div className="mt-3 text-[16px] font-semibold leading-relaxed text-slate-900 sm:text-[17px]">
              {__primaryMind || "지원자 강점은 보이지만 검증 질문이 먼저 필요해 보입니다."}
            </div>
            {__secondaryMind ? (
              <div className="mt-2 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                {__secondaryMind}
              </div>
            ) : null}
          </div>

          {__reasons.length ? (
            <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">왜 이런 신호로 보이나</div>
                <div className="text-[11px] text-slate-500">신호/근거</div>
              </div>
              <div className="px-4 py-4">
                <ul className="space-y-2.5">
                  {__reasons.map((t, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500/60" />
                      <span className="text-sm leading-relaxed text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          {__questions.length ? (
            <div className="rounded-xl border border-slate-200 bg-white/60 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">면접에서 이렇게 질문할 수 있어요</div>
                <div className="text-[11px] text-slate-500">Q</div>
              </div>
              <div className="px-4 py-4">
                <ul className="space-y-2.5">
                  {__questions.map((t, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-500/60" />
                      <span className="text-sm leading-relaxed text-slate-700">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="space-y-3">
            {__hasSupportCard ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-4 shadow-sm">
                <div className="text-xs font-semibold tracking-wide text-slate-500">
                  보조 정보
                </div>
                {signalLabel ? (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-3">
                    <div className="text-[11px] font-semibold text-slate-500">핵심 신호</div>
                    <div className="mt-1 text-sm font-medium leading-relaxed text-slate-800">
                      {signalLabel}
                    </div>
                    {__signalSummary.length ? (
                      <div className="mt-2 space-y-1.5">
                        {__signalSummary.map((t, i) => (
                          <div key={i} className="text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                            {t}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : __signalSummary.length ? (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-white/80 px-3 py-3">
                    <div className="text-[11px] font-semibold text-slate-500">핵심 신호</div>
                    <div className="mt-2 space-y-1.5">
                      {__signalSummary.map((t, i) => (
                        <div key={i} className="text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                {(jdNeedLine || resumeGapLine) ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {jdNeedLine ? (
                      <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="text-[11px] font-semibold text-slate-500">JD에서 보이는 포인트</div>
                        <div className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                          {jdNeedLine}
                        </div>
                      </div>
                    ) : null}
                    {resumeGapLine ? (
                      <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-3">
                        <div className="text-[11px] font-semibold text-slate-500">이력서에서 더 확인할 포인트</div>
                        <div className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-[13px]">
                          {resumeGapLine}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {__fixes.length ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-4">
                <div className="text-xs font-semibold tracking-wide text-indigo-700">
                  바로 보완할 수 있는 포인트
                </div>
                <div className="mt-2 space-y-2.5">
                  {__fixes.map((t, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-indigo-500/70" />
                      <span className="text-sm leading-relaxed text-slate-700">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">내부 메모를 면접 실전에 바로 쓸 수 있는 문장으로 요약했습니다.</div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
