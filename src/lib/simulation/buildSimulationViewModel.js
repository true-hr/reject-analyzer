// src/lib/simulation/buildSimulationViewModel.js

import {
  buildExplanationPack,
  deriveMustHaveFitFromRisks,
  resolveCandidateTypeCeiling,
} from "../explanation/buildExplanationPack.js";
import { buildTopRiskNarratives } from "../explanation/buildTopRiskNarratives.js";
import { buildActionCandidates } from "../actions/buildActionCandidates.js";
import { rankActions } from "../actions/rankActions.js";
import { buildCareerTimeline } from "./buildCareerTimeline.js";
import { generateCareerInterpretationV1 } from "./careerInterpretation.js";
import { buildResumeInterpretation } from "../fit/resumeInterpretationEngine.js";
import {
  buildPolicyInput,
  resolveTypeTitle,
  resolvePassLabels,
  sanitizeReadinessWording,
  sanitizeRiskDescription,
  sanitizeRiskTitle,
} from "../policy/reportLanguagePolicy.js";
import { buildReportPack } from "../analysis/buildReportPack.js";
import { buildJudgmentPack } from "../interpretation/judgments/buildJudgmentPack.js";
import { buildHeadlineFromJudgments } from "../interpretation/renderers/buildHeadlineFromJudgments.js";
import { buildTopRisksFromJudgments } from "../interpretation/renderers/buildTopRisksFromJudgments.js";

// ✅ PATCH (append-only): Top3 리스크 ID별 기본 interviewerView — narrative 없는 리스크용
const __TOP3_INTERVIEWER_VIEW = {
  ROLE_SKILL__MUST_HAVE_MISSING:
    "JD에서 요구하는 핵심 역량이 이력서에서 명확히 확인되지 않을 경우 면접관은 해당 경험을 먼저 확인하려는 흐름이 나타날 수 있습니다.",
  LOW_CONTENT_DENSITY_RISK:
    "이력서 내용이 간략하게 작성되어 있을 경우 실제 수행 범위와 성과를 면접에서 추가로 확인하려는 질문이 나올 수 있습니다.",
  JD_KEYWORD_MISSING:
    "JD에서 강조된 핵심 키워드가 이력서에서 충분히 확인되지 않을 경우 관련 경험을 먼저 질문하는 흐름이 나타날 수 있습니다.",
  ROLE_DIRECTION_MISMATCH:
    "현재 커리어 흐름이 JD가 기대하는 역할 방향과 다르게 읽힐 경우 면접에서 역할 적합성을 먼저 확인하려는 질문이 나올 수 있습니다.",
};

function mapType(group) {
  const typeMap = {
    salary: {
      code: "SALARY_ALERT",
      title: " 연봉 역전 경계형",
      description: "보상 기대치와 조직 밴드 정합성 리스크가 높게 해석될 수 있습니다.",
    },
    domain: {
      code: "DOMAIN_SHIFT",
      title: " 도메인 전환 설득 실패형",
      description: "산업 전환의 전이 근거가 약하면 검증 비용이 커집니다.",
    },
    impact: {
      code: "IMPACT_WEAK",
      title: " 성과 검증 불가형",
      description: "정량 성과가 부족하면 주장형으로 오해될 수 있습니다.",
    },
    structure: {
      code: "STRUCTURE_WEAK",
      title: " 추상 서술형",
      description: "핵심 근거가 흐리면 면접관이 확인할 게 많아집니다.",
    },
  };

  return typeMap[group] || {
    code: "MIXED",
    title: "혼합 리스크형",
    description: "여러 리스크가 동시에 작동하고 있습니다.",
  };
}

function buildDecisionLogs(topRisks) {
  //  MVP: group 기반 1줄 로그만 (확장 시 explain/semantic/selfCheck 반영 가능)
  const decisionLogMap = {
    salary: "연봉 조정 실패 시 이탈 가능성 계산  보수적으로 해석",
    domain: "산업 전환인데 전이 근거 약함  검증 비용 증가",
    impact: "성과 수치 부족  검증 불가로 분류될 가능성",
    structure: "주장만 있고 근거가 약함  확인 질문 증가",
  };

  return topRisks
    .map((r) => {
      const g = r?.group;
      const msg = decisionLogMap[g];
      return msg ? `${msg}` : null;
    })
    .filter(Boolean)
    .slice(0, 3);
}

function __rcText(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function __rcList(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function __rcUnique(values) {
  return [...new Set(__rcList(values).map((value) => String(value || "").trim()).filter(Boolean))];
}

function __rcStatusByPresence({ hasCore = false, hasSupport = false } = {}) {
  if (hasCore && hasSupport) return "ready";
  if (hasCore) return "partial";
  if (hasSupport) return "sparse";
  return "unavailable";
}

function __rcFirstSentence(value) {
  const text = __rcText(value);
  if (!text) return null;
  const normalized = text.replace(/\s+/g, " ").trim();
  const match = normalized.match(/^.+?[.!?](?=\s|$)/);
  return __rcText(match ? match[0] : normalized);
}

function __rcComposeText(parts, maxParts = 2) {
  const normalized = __rcUnique(parts);
  if (!normalized.length) return null;
  return __rcText(normalized.slice(0, maxParts).join(" "));
}

function __isGenericFlowUnreadableText(value) {
  const text = __rcText(value);
  if (!text) return false;
  return [
    "현재 이력서만으로는 커리어 흐름을 한 줄로 읽기 어렵습니다.",
    "현재 커리어 흐름은 하나의 중심축으로 읽기 어렵습니다.",
  ].includes(text);
}

// ── interpretationV2 contract (Round 2 — real derivation, no consumer switch) ──
// Strict separation of concerns:
//   axisRead       → axis identity only (NOT jd gap, NOT proof burden, NOT whyThisType/bridgeSummary)
//   evidenceDepth  → evidence bucket depth only (NOT axis identity)
//   jdCompetitiveness → jd drivers only (NOT axis readability)
//   surfaces       → candidate texts for future consumer switch (Rounds 3-5)
//   diagnostics    → genericRiskOverfire probe for 경력근거희박 / 의미유사도 overfire investigation
//
// Consumers must NOT switch to this until round-specific switch is announced.
function __buildInterpretationV2({
  interpretationPack = null,
  careerInterpretation = null,
  causePack = null,
  careerTimeline = null,
  evidenceFitMeta = null,
} = {}) {
  const __safeArr = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);
  const __safeStr = (v) => (v && typeof v === "string" ? v.trim() : "");

  try {
    // ── axisRead: axis identity derivation ────────────────────────────
    // Sources: candidateAxisPack.narrativeContext, careerTimeline axis fields
    // Must NOT consume: whyThisType, bridgeSummary, proofBurden, jdGap, jdConflict
    const __axispack = interpretationPack?.secondarySources?.candidateAxisPack ?? null;
    const __axisNc   = __axispack?.narrativeContext ?? null;
    const __axisSummary  = __safeStr(__axisNc?.axisSummary);
    const __primaryAxisKey = __safeStr(__axisNc?.primaryAxisKey || __axispack?.primaryAxisKey);
    const __timelineRecentAxis  = __safeStr(careerTimeline?.recentAxis);
    const __timelineOverallAxis = __safeStr(careerTimeline?.overallAxis);
    const __ciAxisKey = __safeStr(careerInterpretation?.currentFlow?.axisKey);

    const __resolvedAxisKey = __primaryAxisKey || __ciAxisKey || __timelineRecentAxis || __timelineOverallAxis || null;
    const __resolvedNarrative = __axisSummary || null;
    // status: "readable" = clear axis key + summary, "partial" = at least one, "unclear" = neither
    const __axisReadStatus = (__resolvedAxisKey && __resolvedNarrative)
      ? "readable"
      : (__resolvedAxisKey || __resolvedNarrative)
        ? "partial"
        : "unclear";

    const axisRead = {
      status: __axisReadStatus,
      axisKey: __resolvedAxisKey,
      narrative: __resolvedNarrative,
      diagnostics: {
        hasAxisPack: !!__axispack,
        hasNarrativeContext: !!__axisNc,
        usedCurrentAxis: !!__ciAxisKey,
        usedOverallAxis: !!__timelineOverallAxis && !__primaryAxisKey && !__ciAxisKey && !__timelineRecentAxis,
      },
    };

    // ── evidenceDepth: evidence bucket derivation ──────────────────────
    // Sources: interpretationPack.sections.careerAccumulation.slots only
    // Must NOT overwrite axis identity or include JD competitiveness text
    const __caSlots = interpretationPack?.sections?.careerAccumulation?.slots ?? {};
    const __rsSlots = interpretationPack?.sections?.riskSummary?.slots ?? {};
    const __ownershipSignals  = __safeArr(__caSlots.relatedCareerSignals).length;
    const __scopeSignals      = __safeArr(__caSlots.consistencySignals).length;
    const __continuitySignals = __safeArr(__caSlots.continuitySignals).length;
    const __transitionSignals = __safeArr(__caSlots.transitionReadinessSignals).length;
    // quantifiedImpact: no dedicated slot — proxy via supportDrivers from riskSummary
    const __quantifiedSignals = __safeArr(__rsSlots.supportDrivers).length;
    const __totalSignals = __ownershipSignals + __scopeSignals + __continuitySignals + __quantifiedSignals;

    const __evidenceStatus = __totalSignals >= 8
      ? "strong"
      : __totalSignals >= 4
        ? "moderate"
        : __totalSignals >= 1
          ? "light"
          : "thin";

    const __evidenceNarrative = __evidenceStatus === "strong"
      ? "경력 근거(소유권·범위·연속성)가 전반적으로 충분히 확인됩니다."
      : __evidenceStatus === "moderate"
        ? "일부 경력 근거는 확인되나, 소유권이나 정량적 성과 근거가 더 필요합니다."
        : __evidenceStatus === "light"
          ? "경력 근거가 제한적으로 확인됩니다. 주요 역할 증거가 더 명확해질 필요가 있습니다."
          : "경력 근거 신호가 거의 감지되지 않습니다. 역할·성과·연속성 증거가 필요합니다.";

    const evidenceDepth = {
      status: __evidenceStatus,
      buckets: {
        ownership:       __ownershipSignals,
        scope:           __scopeSignals,
        quantifiedImpact: __quantifiedSignals,
        continuity:      __continuitySignals,
      },
      narrative: __evidenceNarrative,
      diagnostics: {
        slotCounts: {
          relatedCareer: __ownershipSignals,
          consistency:   __scopeSignals,
          continuity:    __continuitySignals,
          transition:    __transitionSignals,
          supportDrivers: __quantifiedSignals,
        },
        ownershipSignals:   __ownershipSignals,
        scopeSignals:       __scopeSignals,
        quantifiedSignals:  __quantifiedSignals,
        continuitySignals:  __continuitySignals,
      },
    };

    // ── jdCompetitiveness: JD driver derivation ────────────────────────
    // Sources: causePack.currentFlow jdConflict fields, evidenceFitMeta directness hints
    // Must NOT overwrite axis readability text
    const __cfCause = causePack?.currentFlow ?? null;
    const __jdConflictPoints = __safeArr(__cfCause?.jdConflictPoints);
    const __jdConflictSummary = __safeStr(__cfCause?.jdConflictSummary);
    const __domainDirectnessHint = __safeStr(evidenceFitMeta?.domainDirectnessHint);
    const __directConnectionHint = __safeStr(evidenceFitMeta?.directConnectionHint || evidenceFitMeta?.jdFocusSummary);

    // detect semantic similarity signal presence (overfire probe)
    const __semanticSimilaritySignals = __jdConflictPoints.filter(
      (p) => /의미 유사도|semantic|유사도/.test(String(p))
    );
    const __usedSemanticSimilarity = __semanticSimilaritySignals.length > 0;

    const __jdDrivers = [
      ...__jdConflictPoints.map((p) => ({ type: "conflict", text: String(p) })),
      __domainDirectnessHint ? { type: "domainDirectness", text: __domainDirectnessHint } : null,
      __directConnectionHint ? { type: "directConnection", text: __directConnectionHint } : null,
    ].filter(Boolean);

    // status: "strong" = no conflicts + directness present, "weak" = ≥2 conflicts, else "mixed"
    const __hasDirectnessHint = !!__domainDirectnessHint || !!__directConnectionHint;
    const __jdStatus = (__jdConflictPoints.length === 0 && __hasDirectnessHint)
      ? "strong"
      : (__jdConflictPoints.length >= 2 || (__jdConflictPoints.length >= 1 && !__hasDirectnessHint))
        ? "weak"
        : "mixed";

    const __jdNarrative = __jdStatus === "strong"
      ? "JD 핵심 역할과 직접 연결된 경험 근거가 확인됩니다."
      : __jdStatus === "weak"
        ? "JD 핵심 책임과 직접 연결된 경험 근거가 제한적입니다."
        : "JD 적합성 판단에 일부 충돌 신호가 있으나 연결 근거도 일부 존재합니다.";

    const jdCompetitiveness = {
      status: __jdStatus,
      drivers: __jdDrivers,
      narrative: __jdNarrative,
      diagnostics: {
        jdDriverCount:            __jdDrivers.length,
        jdConflictCount:          __jdConflictPoints.length,
        usedSemanticSimilarity:   __usedSemanticSimilarity,
        usedDirectConnectionHint: !!__directConnectionHint,
        usedDomainDirectness:     !!__domainDirectnessHint,
      },
    };

    // ── genericRiskOverfire diagnostics ───────────────────────────────
    // Probes why 경력 근거(성과/스코프) 희박 and JD-이력서 의미 유사도 낮음 may overfire.
    // Does NOT change risk output — diagnostic only.
    const __weakEvidenceLikely = __evidenceStatus === "thin" ||
      (__ownershipSignals === 0 && __continuitySignals === 0);
    const __semanticSimilarityLikely = __usedSemanticSimilarity ||
      (__jdConflictPoints.length > 0 && __jdConflictPoints.every(
        (p) => /유사도|semantic|유사|매칭/.test(String(p))
      ));
    const __overfireReasons = [];
    if (__weakEvidenceLikely && __totalSignals === 0) __overfireReasons.push("zero evidence signals — risk may fire on absence rather than actual mismatch");
    if (__weakEvidenceLikely && __axisReadStatus === "readable") __overfireReasons.push("axis is readable but evidence count is thin — risk may overstate weakness");
    if (__semanticSimilarityLikely) __overfireReasons.push("jd conflict driven primarily by semantic similarity, not structural role gap");
    if (__jdConflictPoints.length >= 1 && __directConnectionHint) __overfireReasons.push("jd conflict present but direct connection hint also present — net gap may be smaller than risk implies");

    const overFireDiagnostics = {
      genericRiskOverfire: {
        weakEvidenceLikely: __weakEvidenceLikely,
        semanticSimilarityLikely: __semanticSimilarityLikely,
        reasons: __overfireReasons,
        sourceCounts: {
          evidenceSignals:           __totalSignals,
          jdDrivers:                 __jdDrivers.length,
          semanticSimilaritySignals: __semanticSimilaritySignals.length,
        },
      },
    };

    // ── surfaces: headline candidate (Round 3) ────────────────────────
    // Source: axisRead ONLY — identity text, never burden/gap/JD text
    // Case 1: readable + axisKey   → clear identity headline
    // Case 2: partial  + axisKey   → softer identity headline
    // Case 3: unclear  / no axisKey → null (legacy fallback handles it)
    const __hcAxisKey = axisRead.axisKey;
    const __hcStatus  = axisRead.status;
    const headlineCandidate = (__hcAxisKey && __hcStatus === "readable")
      ? `${__hcAxisKey} 중심의 프로필`
      : (__hcAxisKey && __hcStatus === "partial")
        ? `${__hcAxisKey} 축이 읽히는 프로필`
        : null;

    // ── surfaces: supportingDescription candidate (Round 4) ──────────────
    // Source: axisRead + evidenceDepth + jdCompetitiveness
    // Meaning: "how strongly is the axis supported, and how directly does it connect to JD?"
    // Must NOT be another headline / careerFlow / generic collapse sentence
    const __sdAxS = axisRead.status;
    const __sdEvS = evidenceDepth.status;
    let supportingDescriptionCandidate = null;
    if (__sdAxS === "readable") {
      if (__sdEvS === "strong") {
        supportingDescriptionCandidate = "중심 축은 비교적 또렷하며, 현재 JD와의 직접 연결도 무난하게 읽힙니다.";
      } else if (__sdEvS === "moderate") {
        supportingDescriptionCandidate = "중심 축은 읽히지만, 성과·스코프 근거를 조금 더 선명하게 보여주면 설득력이 높아집니다.";
      } else {
        // light or thin — axis readable but evidence weak
        supportingDescriptionCandidate = "축 자체는 읽히지만, 이를 뒷받침하는 성과·스코프와 현재 JD 직접성은 추가 보강이 필요합니다.";
      }
    } else if (__sdAxS === "partial") {
      supportingDescriptionCandidate = "관련 축은 일부 읽히지만, 경력 축적의 일관성과 현재 JD 연결 근거는 더 또렷해질 필요가 있습니다.";
    }
    // unclear → null: let legacy fallback handle

    // ── surfaces: careerFlow candidate (Round 5) ──────────────────────
    // Source: sectionAssemblies.careerAccumulation.primaryThesis (path shape signal)
    // Meaning: how the path accumulated / transitioned over time
    // Must NOT repeat headline or supportingDescription wording
    const __cfThesis = interpretationPack?.sectionAssemblies?.careerAccumulation?.primaryThesis ?? null;
    let careerFlowCandidate = null;
    if (__cfThesis === "strong-accumulation") {
      careerFlowCandidate = "경력 흐름은 한 축을 따라 비교적 안정적으로 축적돼 왔고, 현재 JD와도 자연스럽게 이어집니다.";
    } else if (__cfThesis === "transition-building") {
      careerFlowCandidate = "직무 이동 성격은 있으나, 누적된 경험과 일부 공통 기반 덕분에 준비된 전환으로 읽힙니다.";
    } else if (__cfThesis === "related-but-fragmented") {
      careerFlowCandidate = "기존 경험은 인접 영역으로 확장되는 흐름에 가깝고, 현재 JD도 그 연장선에서 해석될 여지가 있습니다.";
    } else if (__cfThesis === "continuity-risk") {
      careerFlowCandidate = "경력 요소들은 일부 연결되지만, 축적 흐름의 일관성과 현재 JD로 이어지는 경로는 아직 다소 느슨합니다.";
    }
    // "unclear" / null → null: let legacy fallback handle true ambiguity

    // ── surfaces: currentType candidate (Round 7) ────────────────────
    // Source: axisRead + evidenceDepth + jdCompetitiveness + careerAccumulation thesis
    // Meaning: compact "how this profile is being read" classification for evaluator lens
    // Must NOT repeat headline or supportingDescription wording. Single label only.
    const __ctAxS  = axisRead.status;
    const __ctEvS  = evidenceDepth.status;
    const __ctJdS  = jdCompetitiveness.status;
    const __ctThes = __cfThesis; // already derived above
    let currentTypeCandidate = null;
    if (__ctAxS === "unclear") {
      currentTypeCandidate = null; // legacy fallback for true ambiguity
    } else if (__ctThes === "transition-building" && __ctJdS !== "strong") {
      currentTypeCandidate = "전환 설득형";
    } else if (__ctAxS === "readable" && __ctEvS === "strong" && (__ctJdS === "strong" || __ctJdS === "mixed")) {
      currentTypeCandidate = "축 명확형";
    } else if (__ctAxS === "readable" && __ctEvS === "moderate") {
      currentTypeCandidate = "축 잠재형";
    } else if (__ctAxS === "partial" || __ctEvS === "thin" || (__ctAxS === "readable" && __ctJdS === "weak")) {
      currentTypeCandidate = "맥락 보강형";
    } else if (__ctAxS === "readable") {
      currentTypeCandidate = "축 잠재형"; // safe default for readable cases not matched above
    }

    // ── surfaces: typeDetail candidate (Round 8) ─────────────────────
    // Source: currentTypeCandidate (anchor) + V2 meaning inputs
    // Meaning: why the evaluator would read the profile as that type — 1–2 sentences max
    // Must NOT repeat headline/supportingDescription/careerFlow wording
    const __TYPE_DETAIL_MAP = {
      "축 명확형":  "핵심 경험의 방향과 축적 근거가 비교적 선명해, 면접관은 이 프로필을 일관된 축을 가진 지원자로 읽을 가능성이 높습니다.",
      "축 잠재형":  "경험의 중심축은 보이지만, 이를 확신으로 바꾸려면 성과와 책임 범위의 제시가 조금 더 구체화될 필요가 있습니다.",
      "전환 설득형": "직무 이동 성격은 있으나 완전히 단절된 전환은 아니어서, 공통 기반과 연결 근거를 얼마나 설득력 있게 제시하느냐가 핵심이 됩니다.",
      "맥락 보강형": "관련성은 일부 읽히지만, 현재 JD와 직접 맞닿는 맥락과 경력 축적의 연결고리는 추가 설명이 있어야 더 또렷해집니다.",
    };
    const typeDetailCandidate = currentTypeCandidate
      ? (__TYPE_DETAIL_MAP[currentTypeCandidate] ?? null)
      : null;

    const surfaces = {
      headlineCandidate,                    // Round 3: identity-only axis headline
      supportingDescriptionCandidate,       // Round 4: axis support + JD directness read
      careerFlowCandidate,                  // Round 5: path shape accumulation read
      currentTypeCandidate,                 // Round 7: compact evaluator-lens type label
      typeDetailCandidate,                  // Round 8: why-this-type explanation (subordinate)
    };

    return {
      version: "interpretation-v2-r7",
      status: "derived",
      axisRead,
      evidenceDepth,
      jdCompetitiveness,
      surfaces,
      diagnostics: overFireDiagnostics,
    };
  } catch {
    return {
      version: "interpretation-v2-r7",
      status: "unavailable",
      axisRead:          { status: "unavailable", axisKey: null, narrative: null, diagnostics: {} },
      evidenceDepth:     { status: "unavailable", buckets: null, narrative: null, diagnostics: {} },
      jdCompetitiveness: { status: "unavailable", drivers: null, narrative: null, diagnostics: {} },
      surfaces: { headlineCandidate: null, supportingDescriptionCandidate: null, careerFlowCandidate: null },
      diagnostics: { genericRiskOverfire: { weakEvidenceLikely: false, semanticSimilarityLikely: false, reasons: [], sourceCounts: { evidenceSignals: 0, jdDrivers: 0, semanticSimilaritySignals: 0 } } },
    };
  }
}

function __buildReportCanonicalV1({
  vm = null,
  top3WithInterpretation = null,
  careerInterpretation = null,
  causePack = null,
  reportPack = null,
  passmapType = null,
  typeSsot = null,
} = {}) {
  const __careerSection = reportPack?.sections?.careerAccumulation ?? null;
  const __riskSection = reportPack?.sections?.riskSummary ?? null;
  const __causeType = causePack?.type && typeof causePack.type === "object"
    ? causePack.type
    : (vm?.causePack?.type && typeof vm.causePack.type === "object" ? vm.causePack.type : null);
  const __causeCurrentFlow = causePack?.currentFlow && typeof causePack.currentFlow === "object"
    ? causePack.currentFlow
    : (vm?.currentFlowCause && typeof vm.currentFlowCause === "object" ? vm.currentFlowCause : null);
  const __careerCurrentFlow = careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object"
    ? careerInterpretation.currentFlow
    : null;
  const __careerCurrentLevel = careerInterpretation?.currentLevel && typeof careerInterpretation.currentLevel === "object"
    ? careerInterpretation.currentLevel
    : null;
  const __careerSummary = __rcText(__careerSection?.summaryText);
  const __riskSummary = __rcText(__riskSection?.summaryText);
  const __careerThesis = __rcText(__careerSection?.primaryThesis);
  const __riskThesis = __rcText(__riskSection?.primaryThesis);
  const __typeId = __rcText(typeSsot?.id) || __rcText(passmapType?.id);
  const __typeLabel = __rcText(typeSsot?.label) || __rcText(passmapType?.label);
  const __typeDescription = __rcText(typeSsot?.oneLiner) || __rcText(passmapType?.oneLiner);
  // path/transition fallback only — jdConflictPoints/jdConflictSummary blocked from path slot
  const __careerFlowBullets = __rcUnique([
    ...__rcList(__careerCurrentFlow?.breakpoints),
    ...__rcList(__causeCurrentFlow?.breakpoints),
    ...__rcList(__careerCurrentFlow?.transitions),
  ]).slice(0, 3);
  const __headlineFromThesis = (() => {
    const CAREER_THESIS_LABEL = {
      "strong-accumulation": "축적형 커리어",
      "related-but-fragmented": "연결 약한 누적형",
      "continuity-risk": "연속성 리스크형",
      "transition-building": "전환 준비형",
    };
    const RISK_THESIS_LABEL = {
      "risk-led": "리스크 주도형",
      "support-led": "근거 우세형",
      "balanced": "혼합 신호형",
      "conflicted": "상충 신호형",
    };
    if (__careerThesis && CAREER_THESIS_LABEL[__careerThesis]) return CAREER_THESIS_LABEL[__careerThesis];
    if (__riskThesis && RISK_THESIS_LABEL[__riskThesis]) return RISK_THESIS_LABEL[__riskThesis];
    return null;
  })();
  const __headlineFromRichInterpretation = (() => {
    // identity-family fallback only — transitionNarrative blocked from identity slot
    // identity-only fallback: typeIdentityNarrative first, whyThisType as compat-last
    // Forbidden: transitionNarrative, proofBurdenNarrative, jdGapNarrative
    const __causeHeadline = __rcFirstSentence(
      __causeType?.typeIdentityNarrative ||
      __causeType?.whyThisType
    );
    if (__causeHeadline) {
      return {
        status: "ready",
        text: __causeHeadline,
        sourceFamily: "cause_pack",
        sourceKeys: __rcUnique([
          __rcText(__causeType?.typeIdentityNarrative) ? "causePack.type.typeIdentityNarrative" : null,
          !__rcText(__causeType?.typeIdentityNarrative) && __rcText(__causeType?.whyThisType) ? "causePack.type.whyThisType" : null,
        ]),
        sparseReason: null,
      };
    }
    const __levelHeadline = __rcFirstSentence(
      __careerCurrentLevel?.interpretedSummary ||
      __careerCurrentLevel?.causeSummary
    );
    if (__levelHeadline) {
      return {
        status: "partial",
        text: __levelHeadline,
        sourceFamily: "career_interpretation",
        sourceKeys: __rcUnique([
          __rcText(__careerCurrentLevel?.interpretedSummary) ? "careerInterpretation.currentLevel.interpretedSummary" : null,
          !__rcText(__careerCurrentLevel?.interpretedSummary) && __rcText(__careerCurrentLevel?.causeSummary) ? "careerInterpretation.currentLevel.causeSummary" : null,
        ]),
        sparseReason: null,
      };
    }
    return null;
  })();

  // ── Round 3: V2 headline primary switch ──────────────────────────────
  // interpretationV2.surfaces.headlineCandidate is identity-only (axis text, no burden/gap).
  // Legacy chain stays as fallback.
  const __v2HeadlineCandidate = vm?.interpretationV2?.surfaces?.headlineCandidate ?? null;
  const __judgmentHeadline = (vm?.judgmentRender?.headline && typeof vm.judgmentRender.headline === "object")
    ? vm.judgmentRender.headline
    : null;
  const headline = __judgmentHeadline?.status === "ready"
    ? __judgmentHeadline
    : __v2HeadlineCandidate
    ? {
      status: "ready",
      text: __v2HeadlineCandidate,
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.surfaces.headlineCandidate"],
      sparseReason: null,
    }
    : __headlineFromRichInterpretation
    ? __headlineFromRichInterpretation
    : (__headlineFromThesis
      ? {
        status: "partial",
        text: __headlineFromThesis,
        sourceFamily: "report_pack",
        sourceKeys: __careerThesis
          ? ["reportPack.sections.careerAccumulation.primaryThesis"]
          : ["reportPack.sections.riskSummary.primaryThesis"],
        sparseReason: "rich_interpretation_headline_unavailable",
      }
      : (__typeLabel
        ? {
          status: "sparse",
          text: __typeLabel,
          sourceFamily: "type_ssot",
          sourceKeys: __rcUnique([
            __rcText(typeSsot?.label) ? "typeSsot.label" : null,
            __rcText(passmapType?.label) ? "passmapType.label" : null,
          ]),
          sparseReason: "rich_interpretation_headline_unavailable",
        }
        : {
          status: "unavailable",
          text: null,
          sourceFamily: "unavailable",
          sourceKeys: [],
          sparseReason: "no_rich_headline_material",
        }));

  const __supportingDescriptionFromRichInterpretation = (() => {
    // burden/JD-gap fallback: proofBurdenNarrative + jdGapNarrative primary
    // transitionNarrative optional secondary (transition cost meaning only)
    // Forbidden: typeIdentityNarrative as primary, raw whyThisType as first choice
    const __causeNarrative = __rcComposeText([
      __causeType?.proofBurdenNarrative,
      __causeType?.jdGapNarrative,
      __causeType?.transitionNarrative,
    ], 2);
    if (__causeNarrative) {
      return {
        status: __rcStatusByPresence({
          hasCore: Boolean(__rcText(__causeType?.proofBurdenNarrative) || __rcText(__causeType?.jdGapNarrative)),
          hasSupport: Boolean(__causeNarrative),
        }),
        text: __causeNarrative,
        sourceFamily: "cause_pack",
        sourceKeys: __rcUnique([
          __rcText(__causeType?.proofBurdenNarrative) ? "causePack.type.proofBurdenNarrative" : null,
          __rcText(__causeType?.jdGapNarrative) ? "causePack.type.jdGapNarrative" : null,
          __rcText(__causeType?.transitionNarrative) ? "causePack.type.transitionNarrative" : null,
        ]),
        sparseReason: null,
      };
    }
    const __careerNarrative = __rcComposeText([
      __careerCurrentLevel?.causeSummary,
      __careerCurrentLevel?.interpretedSummary,
      __careerCurrentFlow?.bridgeSummary,
    ], 2);
    if (__careerNarrative) {
      return {
        status: __rcStatusByPresence({
          hasCore: Boolean(__rcText(__careerCurrentLevel?.causeSummary) || __rcText(__careerCurrentLevel?.interpretedSummary)),
          hasSupport: Boolean(__careerNarrative),
        }),
        text: __careerNarrative,
        sourceFamily: "career_interpretation",
        sourceKeys: __rcUnique([
          __rcText(__careerCurrentLevel?.causeSummary) ? "careerInterpretation.currentLevel.causeSummary" : null,
          __rcText(__careerCurrentLevel?.interpretedSummary) ? "careerInterpretation.currentLevel.interpretedSummary" : null,
          __rcText(__careerCurrentFlow?.bridgeSummary) ? "careerInterpretation.currentFlow.bridgeSummary" : null,
        ]),
        sparseReason: null,
      };
    }
    return null;
  })();

  // ── Round 4: V2 supportingDescription primary switch ────────────────
  // V2 candidate = axis readability + evidence depth + JD directness read.
  // Legacy chain stays as fallback.
  const __v2SupportingCandidate = vm?.interpretationV2?.surfaces?.supportingDescriptionCandidate ?? null;
  const supportingDescription = __v2SupportingCandidate
    ? {
      status: "ready",
      text: __v2SupportingCandidate,
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.surfaces.supportingDescriptionCandidate"],
      sparseReason: null,
    }
    : __supportingDescriptionFromRichInterpretation
    ? __supportingDescriptionFromRichInterpretation
    : (__careerSummary
      ? {
        status: "partial",
        text: __careerSummary,
        sourceFamily: "report_pack",
        sourceKeys: ["reportPack.sections.careerAccumulation.summaryText"],
        sparseReason: "rich_supporting_description_unavailable",
      }
      : {
        // riskSummary.summaryText deliberately excluded from supportingDescription:
        // purple summary is the sole owner of compact risk enumeration (R12-C).
        status: "unavailable",
        text: null,
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "no_rich_supporting_description_material",
      });

  const __topRiskItems = __rcList(top3WithInterpretation).slice(0, 3).map((risk, index) => {
    const __id = __rcText(risk?.id) || __rcText(risk?.raw?.id) || `top-risk-${index + 1}`;
    const __headline = __rcText(risk?.canonicalCard?.headline);
    const __summary = __rcText(risk?.canonicalCard?.summary);
    const __evidence = __rcText(risk?.canonicalCard?.supportingEvidence);
    if (!__headline || (!__summary && !__evidence)) {
      return {
        id: __id,
        title: __headline || null,
        description: null,
        sourceFamily: "unavailable",
        sourceKeys: [],
        evidence: [],
        rank: index + 1,
      };
    }
    return {
      id: __id,
      title: __headline,
      description: __summary,
      sourceFamily: "top3_canonical",
      sourceKeys: __rcUnique([
        __summary ? "top3[].canonicalCard.summary" : null,
        __headline ? "top3[].canonicalCard.headline" : null,
        __evidence ? "top3[].canonicalCard.supportingEvidence" : null,
      ]),
      evidence: __evidence ? [__evidence] : [],
      rank: index + 1,
    };
  });
  const __availableTopRiskItems = __topRiskItems.filter((item) => item.sourceFamily === "top3_canonical");
  const __genericRiskIds = new Set([
    "LOW_CONTENT_DENSITY_RISK",
    "TASK__CORE_COVERAGE_LOW",
  ]);
  const __genericRiskText = (text) => {
    const s = String(text || "").trim();
    if (!s) return false;
    return [
      /상반된 신호/,
      /단정적 해석이 어렵/,
      /핵심 리스크 구조/,
      /선명하게 분류되지/,
      /혼합형 해석/,
      /방향이 상충/,
    ].some((re) => re.test(s));
  };
  const __deriveRiskFamily = (risk) => {
    const id = String(risk?.id || risk?.raw?.id || "").trim().toUpperCase();
    const key = String(risk?.canonicalCard?.sourceKey || "").trim().toLowerCase();
    const haystack = [
      id,
      risk?.title,
      risk?.displayTitle,
      risk?.displaySummary,
      risk?.interviewerView,
      risk?.canonicalCard?.headline,
      risk?.canonicalCard?.summary,
      risk?.canonicalCard?.supportingEvidence,
      key,
    ].map((value) => String(value || "").toLowerCase()).join(" ");
    if (__genericRiskIds.has(id)) return "generic_filler";
    if (/(year|seniority|under_min_years|title_seniority|role_level|age_seniority|연차|경력 년수|레벨)/.test(haystack)) return "years_seniority";
    if (/(must_have|core_coverage|필수|must-have|핵심 역량|required years|자격)/.test(haystack)) return "must_have_gap";
    if (/(ownership|leadership|lead|주도|리드|책임 범위|decision|scope)/.test(haystack)) return "leadership_scope";
    if (/(domain|industry|semantic|role_skill|position_blur|role distance|직무 축|도메인|산업|포지션)/.test(haystack)) return "role_domain_distance";
    if (/(timeline|transition|gap|career|흐름|전환|공백|이동)/.test(haystack)) return "timeline_transition";
    if (/(salary|compensation|연봉|보상)/.test(haystack)) return "compensation";
    if (/(education|학력)/.test(haystack)) return "education";
    return id ? `risk:${id}` : "unknown";
  };
  const __isConcreteStructuredFamily = (family) =>
    family !== "generic_filler" && family !== "unknown";
  const __riskHasReadableEvidence = (risk) => {
    const canonicalEvidence = __rcText(risk?.canonicalCard?.supportingEvidence);
    const resumeEvidence = __rcList(risk?.resumeEvidence);
    const jdEvidence = __rcList(risk?.jdEvidence);
    const sourceKey = String(risk?.canonicalCard?.sourceKey || "").trim();
    return Boolean(
      canonicalEvidence ||
      resumeEvidence.length > 0 ||
      jdEvidence.length > 0 ||
      risk?.gateTriggered === true ||
      ["resumeEvidence", "jdEvidence", "jdGapHint", "displaySummary"].includes(sourceKey)
    );
  };
  const __overfireDiag = vm?.interpretationV2?.diagnostics?.genericRiskOverfire ?? null;
  const __supportedTopRiskItems = __rcList(top3WithInterpretation)
    .map((risk, index) => {
      const canonical = __availableTopRiskItems[index] ?? null;
      const family = __deriveRiskFamily(risk);
      const title = __rcText(canonical?.title);
      const description = __rcText(canonical?.description);
      const evidence = __rcList(canonical?.evidence);
      const sourceKey = String(risk?.canonicalCard?.sourceKey || "").trim();
      const hasReadableEvidence = __riskHasReadableEvidence(risk);
      const isSemanticOnly =
        family === "role_domain_distance" &&
        sourceKey === "explanationHint" &&
        evidence.length === 0 &&
        Array.isArray(risk?.jdEvidence) &&
        risk.jdEvidence.length === 0 &&
        Array.isArray(risk?.resumeEvidence) &&
        risk.resumeEvidence.length === 0 &&
        __overfireDiag?.semanticSimilarityLikely === true;
      const isSupported =
        family !== "generic_filler" &&
        title &&
        description &&
        !__genericRiskText(title) &&
        !__genericRiskText(description) &&
        !isSemanticOnly &&
        (hasReadableEvidence || __isConcreteStructuredFamily(family));
      return isSupported ? {
        id: canonical?.id || __rcText(risk?.id) || `top-risk-${index + 1}`,
        title,
        description,
        sourceFamily: "top3_canonical",
        sourceKeys: Array.isArray(canonical?.sourceKeys) ? canonical.sourceKeys : [],
        evidence,
        rank: index + 1,
        riskFamily: family,
      } : null;
    })
    .filter(Boolean)
    .filter((item, index, arr) => arr.findIndex((x) => x.riskFamily === item.riskFamily) === index)
    .slice(0, 3)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // ── Round 6: V2 topRisks primary switch ──────────────────────────────
  // Build risk cards from V2 dimensions (evidenceDepth / jdCompetitiveness / careerAccumulation thesis).
  // Each card must belong to a distinct family. Legacy chain stays as fallback.
  const __v2Ctx         = vm?.interpretationV2 ?? null;
  const __v2EvDepth     = __v2Ctx?.evidenceDepth ?? null;
  const __v2JdComp      = __v2Ctx?.jdCompetitiveness ?? null;
  const __caThesisV2    = reportPack?.sections?.careerAccumulation?.primaryThesis ?? null;

  const __v2RiskPool = [];

  const __v2EvidenceSignals = Number(__overfireDiag?.sourceCounts?.evidenceSignals || 0);
  const __v2JdDrivers = Number(__overfireDiag?.sourceCounts?.jdDrivers || __v2JdComp?.diagnostics?.jdDriverCount || 0);
  const __v2SemanticOnly = Boolean(__overfireDiag?.semanticSimilarityLikely) &&
    Number(__overfireDiag?.sourceCounts?.semanticSimilaritySignals || 0) >= __v2JdDrivers &&
    __v2JdDrivers > 0;

  // family: evidence / proof density
  if ((__v2EvDepth?.status === "thin" || __v2EvDepth?.status === "light") && __v2EvidenceSignals > 0) {
    __v2RiskPool.push({
      id: "v2-evidence-density", riskFamily: "evidence_density",
      title: "성과·스코프 근거",
      description: "핵심 역량의 방향성은 보이지만, 이를 뒷받침할 구체 성과와 책임 범위 제시는 더 보강될 필요가 있습니다.",
      sourceFamily: "interpretation_v2", sourceKeys: ["interpretationV2.evidenceDepth"], evidence: [__v2EvDepth?.narrative].filter(Boolean),
      _priority: __v2EvDepth.status === "thin" ? 10 : 8,
    });
  }

  // family: JD directness
  if (__v2JdComp?.status === "weak" && __v2JdDrivers > 0 && !__v2SemanticOnly) {
    __v2RiskPool.push({
      id: "v2-jd-directness", riskFamily: "jd_directness",
      title: "현재 JD 직접성",
      description: "보유 경험이 완전히 어긋난 것은 아니지만, 공고의 핵심 요구와 바로 맞닿는 근거는 아직 충분히 선명하지 않습니다.",
      sourceFamily: "interpretation_v2", sourceKeys: ["interpretationV2.jdCompetitiveness"], evidence: __rcList(__v2JdComp?.drivers).map((driver) => __rcText(driver?.text)).filter(Boolean).slice(0, 1),
      _priority: 9,
    });
  } else if (__v2JdComp?.status === "mixed" && __v2JdDrivers > 0 && !__v2SemanticOnly) {
    __v2RiskPool.push({
      id: "v2-jd-directness", riskFamily: "jd_directness",
      title: "현재 JD 직접성",
      description: "경험과 공고 사이 연결 가능성은 있으나, 핵심 요구와의 직접 매칭 근거는 좀 더 구체화될 필요가 있습니다.",
      sourceFamily: "interpretation_v2", sourceKeys: ["interpretationV2.jdCompetitiveness"], evidence: __rcList(__v2JdComp?.drivers).map((driver) => __rcText(driver?.text)).filter(Boolean).slice(0, 1),
      _priority: 6,
    });
  }

  // family: level / scope mismatch (ownership signals absent + evidence not strong)
  if ((__v2EvDepth?.buckets?.ownership ?? 1) === 0 && __v2EvDepth?.status !== "strong" && (__v2EvidenceSignals > 0 || __v2JdDrivers > 0)) {
    __v2RiskPool.push({
      id: "v2-level-scope", riskFamily: "level_scope",
      title: "레벨 기대치",
      description: "직무 방향은 맞더라도, 현재 공고가 기대하는 책임 범위와 주도 수준을 보여주는 근거는 추가 확인이 필요합니다.",
      sourceFamily: "interpretation_v2", sourceKeys: ["interpretationV2.evidenceDepth.buckets"], evidence: [__v2EvDepth?.narrative].filter(Boolean),
      _priority: 7,
    });
  }

  // select up to 3 distinct-family cards by priority desc
  const __v2SeenFamilies = new Set();
  const __v2TopRiskItems = __v2RiskPool
    .sort((a, b) => b._priority - a._priority)
    .filter((card) => {
      if (__v2SeenFamilies.has(card.riskFamily)) return false;
      __v2SeenFamilies.add(card.riskFamily);
      return true;
    })
    .slice(0, 3)
    .map(({ _priority: _p, ...card }, index) => ({ ...card, rank: index + 1 }));

  const __judgmentTopRisks = (vm?.judgmentRender?.topRisks && typeof vm.judgmentRender.topRisks === "object")
    ? vm.judgmentRender.topRisks
    : null;
  const topRisks = (__judgmentTopRisks?.status === "ready" || __judgmentTopRisks?.status === "partial")
    ? __judgmentTopRisks
    : __supportedTopRiskItems.length > 0
    ? {
      status: __supportedTopRiskItems.length === 3 ? "ready" : "sparse",
      items: __supportedTopRiskItems,
      sourceFamily: "top3_canonical",
      sourceKeys: ["top3[].canonicalCard"],
      sparseReason: __supportedTopRiskItems.length < 3 ? "supported_risk_pool_partial" : null,
    }
    : __v2TopRiskItems.length > 0
    ? {
      status: __v2TopRiskItems.length === 3 ? "ready" : "sparse",
      items: __v2TopRiskItems,
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.evidenceDepth", "interpretationV2.jdCompetitiveness", "reportPack.sections.careerAccumulation.primaryThesis"],
      sparseReason: __v2TopRiskItems.length < 3 ? "v2_risk_pool_partial" : null,
    }
    : {
      status: "unavailable",
      items: [],
      sourceFamily: "unavailable",
      sourceKeys: [],
      sparseReason: "no_supported_risk_cards",
    };

  // ── Round 7: V2 currentType primary switch ───────────────────────────
  // V2 candidate = compact evaluator-lens label from interpretationV2.surfaces.currentTypeCandidate.
  // Legacy type_ssot chain stays as fallback.
  const __v2TypeCandidate = vm?.interpretationV2?.surfaces?.currentTypeCandidate ?? null;
  const currentType = __v2TypeCandidate
    ? {
      status: "ready",
      key: "interpretation_v2",
      label: __v2TypeCandidate,
      title: __v2TypeCandidate,
      description: null,
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.surfaces.currentTypeCandidate"],
      evidence: [],
      sparseReason: null,
    }
    : (__typeLabel || __typeDescription || __typeId)
    ? {
      status: (__typeLabel && __typeDescription) ? "ready" : "partial",
      key: __typeId,
      label: __typeLabel,
      title: __typeLabel,
      description: __typeDescription,
      sourceFamily: "type_ssot",
      sourceKeys: __rcUnique([
        __rcText(typeSsot?.id) ? "typeSsot.id" : null,
        __rcText(typeSsot?.label) ? "typeSsot.label" : null,
        __rcText(typeSsot?.oneLiner) ? "typeSsot.oneLiner" : null,
        !__rcText(typeSsot?.label) && __rcText(passmapType?.label) ? "passmapType.label" : null,
        !__rcText(typeSsot?.oneLiner) && __rcText(passmapType?.oneLiner) ? "passmapType.oneLiner" : null,
      ]),
      evidence: __rcUnique([
        __careerThesis ? `careerThesis:${__careerThesis}` : null,
        __riskThesis ? `riskThesis:${__riskThesis}` : null,
      ]),
      sparseReason: (__typeLabel && __typeDescription) ? null : "type_ssot_description_incomplete",
    }
    : {
      status: "unavailable",
      key: null,
      label: null,
      title: null,
      description: null,
      sourceFamily: "unavailable",
      sourceKeys: [],
      evidence: [],
      sparseReason: "no_type_ssot_material",
    };

  const __careerTitle = __rcText(__careerSection?.title) || "현재 커리어 흐름 해석";
  const __careerFlowFromInterpretation = (() => {
    // path/transition fallback only — jdConflictSummary and bridgeSummary blocked from path slot
    // R11: bridgeSummary is bridge-family, not path-family; routed to supportingDescription context instead
    const __body = __rcComposeText([
      __careerCurrentFlow?.summary,
      __careerCurrentFlow?.transitionNarrative,
    ], 2);
    if (__body || __careerFlowBullets.length > 0) {
      return {
        status: __rcStatusByPresence({
          hasCore: Boolean(__rcText(__careerCurrentFlow?.summary) || __rcText(__careerCurrentFlow?.transitionNarrative)),
          hasSupport: Boolean(__body || __careerFlowBullets.length > 0),
        }),
        title: __careerTitle,
        body: __body,
        bullets: __careerFlowBullets,
        sourceFamily: "career_interpretation",
        sourceKeys: __rcUnique([
          __rcText(__careerCurrentFlow?.summary) ? "careerInterpretation.currentFlow.summary" : null,
          __rcText(__careerCurrentFlow?.transitionNarrative) ? "careerInterpretation.currentFlow.transitionNarrative" : null,
          Array.isArray(__careerCurrentFlow?.breakpoints) && __careerCurrentFlow.breakpoints.length > 0 ? "careerInterpretation.currentFlow.breakpoints" : null,
          Array.isArray(__careerCurrentFlow?.transitions) && __careerCurrentFlow.transitions.length > 0 ? "careerInterpretation.currentFlow.transitions" : null,
        ]),
        sparseReason: null,
      };
    }
    // path/transition fallback only — jdConflictPoints blocked from path slot
    const __causeFlowBody = __rcComposeText([
      __causeCurrentFlow?.readableFlow,
    ], 2);
    const __causeFlowBullets = __rcUnique([
      ...__rcList(__causeCurrentFlow?.breakpoints),
    ]).slice(0, 3);
    if (__causeFlowBody || __causeFlowBullets.length > 0) {
      return {
        status: __rcStatusByPresence({
          hasCore: Boolean(__rcText(__causeCurrentFlow?.readableFlow)),
          hasSupport: Boolean(__causeFlowBody || __causeFlowBullets.length > 0),
        }),
        title: __careerTitle,
        body: __causeFlowBody,
        bullets: __causeFlowBullets,
        sourceFamily: "cause_pack",
        sourceKeys: __rcUnique([
          __rcText(__causeCurrentFlow?.readableFlow) ? "causePack.currentFlow.readableFlow" : null,
          Array.isArray(__causeCurrentFlow?.breakpoints) && __causeCurrentFlow.breakpoints.length > 0 ? "causePack.currentFlow.breakpoints" : null,
        ]),
        sparseReason: null,
      };
    }
    return null;
  })();
  // ── Round 5: V2 careerFlow primary switch ────────────────────────────
  // V2 candidate = path shape from sectionAssemblies.careerAccumulation.primaryThesis.
  // Legacy chain stays as fallback.
  const __v2CareerFlowCandidate = vm?.interpretationV2?.surfaces?.careerFlowCandidate ?? null;
  const careerFlow = __v2CareerFlowCandidate
    ? {
      status: "ready",
      title: __careerTitle,
      body: __v2CareerFlowCandidate,
      bullets: [],
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.surfaces.careerFlowCandidate"],
      sparseReason: null,
    }
    : __careerFlowFromInterpretation
    ? __careerFlowFromInterpretation
    : (__careerSummary
      ? {
        status: "sparse",
        title: __careerTitle,
        body: __careerSummary,
        bullets: [],
        sourceFamily: "report_pack",
        sourceKeys: ["reportPack.sections.careerAccumulation.summaryText"],
        sparseReason: "rich_career_flow_material_unavailable",
      }
      : {
        status: "unavailable",
        title: __careerTitle,
        body: null,
        bullets: [],
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "no_rich_career_flow_material",
      });

  // ── Round 8: V2 typeDetail primary switch ────────────────────────────
  // V2 candidate = family-aligned explanation of currentTypeCandidate.
  // Legacy stub stays as fallback (was always unavailable anyway).
  const __v2TypeDetailCandidate = vm?.interpretationV2?.surfaces?.typeDetailCandidate ?? null;
  const typeDetail = __v2TypeDetailCandidate
    ? {
      status: "ready",
      title: vm?.interpretationV2?.surfaces?.currentTypeCandidate ?? null,
      body: __v2TypeDetailCandidate,
      sections: [],
      sourceFamily: "interpretation_v2",
      sourceKeys: ["interpretationV2.surfaces.typeDetailCandidate"],
      sparseReason: null,
    }
    : {
      status: "unavailable",
      title: __typeLabel || __headlineFromThesis || null,
      body: null,
      sections: [],
      sourceFamily: "unavailable",
      sourceKeys: [],
      sparseReason: "dedicated_type_detail_canonical_block_not_assembled_yet",
    };

  const __surfaceStatuses = {
    headline: headline.status,
    supportingDescription: supportingDescription.status,
    topRisks: topRisks.status,
    currentType: currentType.status,
    careerFlow: careerFlow.status,
    typeDetail: typeDetail.status,
  };
  const __unresolvedSurfaces = Object.entries(__surfaceStatuses)
    .filter(([, status]) => status !== "ready")
    .map(([key]) => key);
  const __sourceFamiliesUsed = __rcUnique([
    headline.sourceFamily,
    supportingDescription.sourceFamily,
    topRisks.sourceFamily,
    currentType.sourceFamily,
    careerFlow.sourceFamily,
    typeDetail.sourceFamily,
  ].filter((family) => family && family !== "unavailable"));
  const __legacyBypassed = !__sourceFamiliesUsed.some((family) => family === "legacy" || family === "generic" || family === "mixed");
  const __readySurfaceCount = Object.values(__surfaceStatuses).filter((status) => status === "ready").length;
  const __nonUnavailableSurfaceCount = Object.values(__surfaceStatuses).filter((status) => status !== "unavailable").length;

  return {
    version: "report-canonical-v1",
    status: __rcStatusByPresence({
      hasCore: __readySurfaceCount >= 5,
      hasSupport: __nonUnavailableSurfaceCount >= 1,
    }),
    diagnostics: {
      hasSpecificSurface: __nonUnavailableSurfaceCount > 0,
      legacyBypassed: __legacyBypassed,
      unresolvedSurfaces: __unresolvedSurfaces,
      sourceFamiliesUsed: __sourceFamiliesUsed,
    },
    headline,
    supportingDescription,
    topRisks,
    currentType,
    careerFlow,
    typeDetail,
  };
}

// ── Phase 9-5B: Legacy Fallback Isolation helpers ──
// Internal runtime posture helpers. No prose generation. No UI changes.

// isNarrativeFrameUsable (Phase 9-5B)
// Conservative usability check for a section's narrativeFrame.
function isNarrativeFrameUsable(interpretationPack, sectionKey) {
  try {
    const section = interpretationPack?.sections?.[sectionKey];
    if (!section) return false;
    const frame = section.narrativeFrame;
    if (!frame) return false;
    if (frame.status === "empty") return false;
    const hasPrimaryAngle = typeof frame.primaryAngle === "string" && frame.primaryAngle.length > 0;
    const hasDominantSignals = Array.isArray(frame.dominantSignalKeys) && frame.dominantSignalKeys.length > 0;
    return hasPrimaryAngle || hasDominantSignals;
  } catch {
    return false;
  }
}

// getLegacyAuditDecisionForSection (Phase 9-5B)
// Reads legacyNarrativeAudit to find the decision for a given legacyKey.
function getLegacyAuditDecisionForSection(interpretationPack, legacyKey) {
  try {
    const entries = interpretationPack?.legacyNarrativeAudit?.entries;
    if (!Array.isArray(entries)) return null;
    const entry = entries.find((e) => e?.legacyKey === legacyKey);
    return entry?.decision ?? null;
  } catch {
    return null;
  }
}

// resolveNarrativeRuntimePosture (Phase 9-5B)
// Computes runtime posture for one target path.
// Returns: "prefer_interpretation_then_fallback_legacy" | "unchanged"
function resolveNarrativeRuntimePosture(interpretationPack, sectionKey, legacyKey) {
  try {
    const auditDecision = getLegacyAuditDecisionForSection(interpretationPack, legacyKey);
    const frameUsable   = isNarrativeFrameUsable(interpretationPack, sectionKey);
    if (auditDecision === "fallback_only" && frameUsable) {
      return "prefer_interpretation_then_fallback_legacy";
    }
    return "unchanged";
  } catch {
    return "unchanged";
  }
}

// ── Phase 9-8B: SentenceDraft Rollout Gating helpers ──
// Reads existing interpretationPack + legacyRuntimePosture metadata.
// No prose generation. No UI changes.

const __FIRST_WAVE_SECTIONS = new Set(["careerAccumulation", "riskSummary"]);

// Section → legacyKey mapping (for audit posture)
const __SECTION_TO_LEGACY_KEY = {
  careerAccumulation: "legacy_buildCareerStory",
  riskSummary:        "legacy_buildTopRiskNarratives",
};

// Section → legacyRuntimePosture target name mapping
const __SECTION_TO_RUNTIME_TARGET = {
  careerAccumulation: "careerStory",
  riskSummary:        "topRiskNarratives",
};

// getSectionSentenceDrafts (Phase 9-8B)
function getSectionSentenceDrafts(interpretationPack, sectionKey) {
  try {
    const drafts = interpretationPack?.sections?.[sectionKey]?.sentenceDrafts;
    return Array.isArray(drafts) ? drafts : [];
  } catch { return []; }
}

// hasEnabledSentenceDrafts (Phase 9-8B)
function hasEnabledSentenceDrafts(interpretationPack, sectionKey) {
  return getSectionSentenceDrafts(interpretationPack, sectionKey).some((d) => d?.enabled === true);
}

// getSectionAuditPosture (Phase 9-8B)
// Returns legacyNarrativeAudit decision for the section's mapped legacyKey.
function getSectionAuditPosture(interpretationPack, sectionKey) {
  try {
    const legacyKey = __SECTION_TO_LEGACY_KEY[sectionKey] ?? null;
    if (!legacyKey) return null;
    return getLegacyAuditDecisionForSection(interpretationPack, legacyKey);
  } catch { return null; }
}

// getSectionRuntimePosture (Phase 9-8B)
// Returns legacyRuntimePosture decision for the section's mapped target.
function getSectionRuntimePosture(legacyRuntimePosture, sectionKey) {
  try {
    const targetName = __SECTION_TO_RUNTIME_TARGET[sectionKey] ?? null;
    if (!targetName) return null;
    return legacyRuntimePosture?.targets?.[targetName]?.decision ?? null;
  } catch { return null; }
}

// resolveSentenceDraftRolloutState (Phase 9-8B)
// Returns rolloutState: "consumer_ready" | "fallback_only" | "monitor" | "internal_only"
function resolveSentenceDraftRolloutState({ sectionKey, hasEnabled, frameUsable, auditPosture, runtimePosture }) {
  if (!__FIRST_WAVE_SECTIONS.has(sectionKey)) {
    // Non-first-wave: never consumer_ready this round
    if (hasEnabled && frameUsable) return "fallback_only";
    if (hasEnabled) return "monitor";
    return "internal_only";
  }
  // First-wave: all conditions must pass for consumer_ready
  const allPass = (
    hasEnabled &&
    frameUsable &&
    auditPosture === "fallback_only" &&
    runtimePosture === "prefer_interpretation_then_fallback_legacy"
  );
  if (allPass) return "consumer_ready";
  if (hasEnabled && frameUsable) return "fallback_only";
  if (hasEnabled) return "monitor";
  return "internal_only";
}

// buildSentenceDraftRolloutSectionEntry (Phase 9-8B)
// Assembles one section's rollout entry.
function buildSentenceDraftRolloutSectionEntry(interpretationPack, sectionKey, legacyRuntimePosture) {
  try {
    const drafts         = getSectionSentenceDrafts(interpretationPack, sectionKey);
    const hasEnabled     = drafts.some((d) => d?.enabled === true);
    const frameUsable    = isNarrativeFrameUsable(interpretationPack, sectionKey);
    const primaryAngle   = interpretationPack?.sections?.[sectionKey]?.narrativeFrame?.primaryAngle ?? null;
    const auditPosture   = getSectionAuditPosture(interpretationPack, sectionKey);
    const runtimePosture = getSectionRuntimePosture(legacyRuntimePosture, sectionKey);

    const rolloutState = resolveSentenceDraftRolloutState({
      sectionKey, hasEnabled, frameUsable, auditPosture, runtimePosture,
    });

    const consumerModeMap = {
      consumer_ready: "prefer_draft_then_legacy",
      fallback_only:  "legacy_only",
      monitor:        "internal_only",
      internal_only:  "internal_only",
    };

    return {
      rolloutState,
      hasEnabledDrafts:          hasEnabled,
      draftCount:                drafts.length,
      primaryAngle,
      auditPosture,
      runtimePosture,
      recommendedConsumerMode:   consumerModeMap[rolloutState] ?? "internal_only",
    };
  } catch {
    return {
      rolloutState:            "internal_only",
      hasEnabledDrafts:        false,
      draftCount:              0,
      primaryAngle:            null,
      auditPosture:            null,
      runtimePosture:          null,
      recommendedConsumerMode: "internal_only",
    };
  }
}

// buildSentenceDraftRollout (Phase 9-8B)
// Builds the full sentenceDraftRollout object for VM attachment.
function buildSentenceDraftRollout(interpretationPack, legacyRuntimePosture) {
  const SECTION_KEYS = [
    "careerAccumulation", "levelPositionFit", "compensationMobility",
    "workStyleExecution", "industryContext", "riskSummary",
  ];

  const sections = {};
  for (const key of SECTION_KEYS) {
    sections[key] = buildSentenceDraftRolloutSectionEntry(interpretationPack, key, legacyRuntimePosture);
  }

  const firstWaveSections = SECTION_KEYS.filter(
    (k) => sections[k]?.rolloutState === "consumer_ready" || (
      __FIRST_WAVE_SECTIONS.has(k) && sections[k]?.rolloutState === "fallback_only"
    )
  );
  const deferredSections = SECTION_KEYS.filter((k) => !firstWaveSections.includes(k));

  return {
    version: "rollout-gating-v1",
    sections,
    globalRecommendation: {
      firstWaveSections,
      deferredSections,
      notes: [
        "first_wave_restricted_to_careerAccumulation_and_riskSummary",
        "consumer_ready_requires_all_conditions_pass",
        "no_ui_replacement_this_round",
      ],
    },
  };
}

export function buildSimulationViewModel(riskResults = [], { interactions, careerHistory, careerTimeline, parsedResume, evidenceFitMeta = null, leadershipGapSignals = null, careerSignals = null, interpretationPack = null } = {}) {
  const __isQuickNoResume = false;
  const __quickCheckItemsFinal = [];
  const __careerHistorySafe = (() => {
    const __normalizeYm = (value) => {
      const raw = String(value || "").trim();
      if (!raw || /^present$/i.test(raw)) return raw.toLowerCase() === "present" ? "present" : "";
      const m = raw.match(/^(\d{4})[-./](\d{1,2})$/);
      if (!m) return "";
      const y = Number(m[1]);
      const mo = Number(m[2]);
      if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return "";
      return `${y}-${String(mo).padStart(2, "0")}`;
    };
    const __normalizeCareerItem = (item) => {
      const row = (item && typeof item === "object") ? item : {};
      const role =
        typeof row.role === "string" && row.role.trim()
          ? row.role
          : (typeof row.title === "string" && row.title.trim()
            ? row.title
            : (typeof row.position === "string" && row.position.trim() ? row.position : null));
      const startDate =
        typeof row.startDate === "string" && row.startDate.trim()
          ? row.startDate
          : __normalizeYm(row.start);
      const endDate =
        typeof row.endDate === "string" && row.endDate.trim()
          ? row.endDate
          : __normalizeYm(row.end);
      return {
        ...row,
        role,
        startDate,
        endDate,
      };
    };

    return (Array.isArray(careerHistory) ? careerHistory : [])
      .map(__normalizeCareerItem)
      .filter((item) => item && typeof item === "object");
  })();
  function __safeNum(v, fb = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fb;
  }

  function __clamp01(v) {
    const n = __safeNum(v, 0);
    return n < 0 ? 0 : n > 1 ? 1 : n;
  }

  function __getPriority(r) {
    // [CONTRACT] 정렬 기준은 정규화된 r.priority 단독.
    // raw.priority fallback 사용 금지 — 정규화 계약에 따라 priority는 항상 존재해야 함.
    return __safeNum(r?.priority, 0);
  }

  function __getScore01(r) {
    // riskResults.score는 0~1로 들어오는 전제 (없으면 0)
    return __clamp01(r?.score ?? r?.raw?.score ?? 0);
  }

  // [CONTRACT] gate 판정 기준: 정규화된 r.layer === "gate" 단독.
  // raw.layer fallback 금지, id prefix("GATE__") 기반 판정 금지.
  // 정규화(__normalizeRiskResults) 이후에는 layer가 항상 설정되어 있어야 함.
  function __isGate(r) {
    return String(r?.layer || "").toLowerCase() === "gate";
  }
  // ✅ PATCH (append-only): strength/label helpers for Top3 grouping (표시용 only)
  function __getStrengthCode(r) {
    // 다양한 케이스 흡수 (A/B/C/D or 1~4 등)
    const s =
      r?.strength ??
      r?.raw?.strength ??
      r?.grade ??
      r?.raw?.grade ??
      r?.level ??
      r?.raw?.level ??
      null;

    if (s == null) return null;

    const str = String(s).trim().toUpperCase();

    // 숫자 등급 대응(있으면)
    if (str === "4" || str === "3") return "A";
    if (str === "2") return "B";
    if (str === "1" || str === "0") return "C";

    // 이미 A/B/C/D면 그대로
    if (str === "A" || str === "B" || str === "C" || str === "D") return str;

    return null;
  }

  function __levelForTop3(r) {
    // 1) Gate는 무조건 critical
    if (__isGate(r)) return "critical";

    // 2) strength 기반
    const sc = __getStrengthCode(r);
    if (sc === "A") return "critical";
    if (sc === "B") return "warning";

    return "neutral";
  }

  // ✅ PATCH (append-only): Top3 ranking class boost — view-only
  // - 기존 priority는 유지하고, 사용자 체감상 "더 치명적인" 리스크가
  //   Top3 normals에서 앞서도록 소폭 보정한다.
  // - analyzer/decision priority, score, gate 계산에는 무영향
  const __TOP3_MUST_HAVE_IDS = new Set([
    "ROLE_SKILL__MUST_HAVE_MISSING",
    "ROLE_SKILL__JD_KEYWORD_ABSENCE",
    "TASK__CORE_COVERAGE_LOW",
  ]);
  const __TOP3_SENIORITY_IDS = new Set([
    "SENIORITY_GAP",
    "SENIORITY__UNDER_MIN_YEARS",
    "TITLE_SENIORITY_MISMATCH",
    "RISK__ROLE_LEVEL_MISMATCH",
    "AGE_SENIORITY_GAP",
  ]);
  const __TOP3_DOMAIN_HARD_IDS = new Set([
    "DOMAIN__MISMATCH__JOB_FAMILY",
    "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
    "ROLE_DOMAIN_SHIFT",
    "TITLE_DOMAIN_SHIFT",
    "SIMPLE__DOMAIN_SHIFT",
    "SIMPLE__ROLE_SHIFT",
    "DOMAIN_ROLE_MISMATCH", // ✅ PATCH R38 (append-only): non-gate 경로 classBoost +1 보강
  ]);
  const __TOP3_STRUCTURAL_SOFT_IDS = new Set([
    "DOMAIN__WEAK__KEYWORD_SPARSE",
    "RISK__OWNERSHIP_LEADERSHIP_GAP",
    "OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO",
    "OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL",
    "OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL",
    "EXP__LEADERSHIP__MISSING",
    "EXP__SCOPE__TOO_SHALLOW",
    "HR_ALIGNMENT_GAP",
    "STRATEGIC_SCOPE_GAP",
  ]);
  const __TOP3_PRESENTATION_IDS = new Set([
    "LOW_CONTENT_DENSITY_RISK",
    "IMPACT__PROCESS_ONLY",
    "IMPACT__NO_QUANTIFIED_IMPACT",
    "RISK__EXECUTION_IMPACT_GAP",
    "TASK__EVIDENCE_TOO_WEAK",
    "EVIDENCE_THIN",
    "IMPACT_WEAK",
    "PROOF_WEAK",
    "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
    "WEAK_ASSERTION_RISK",
    "PASSIVE_VOICE_OVERUSE_RISK",
    "LOW_CONFIDENCE_LANGUAGE_RISK",
    "HEDGE_LANGUAGE_RISK",
  ]);

  function __getTop3RiskClass(r) {
    if (__isGate(r)) return "gate";

    const id = String(r?.id || "").toUpperCase().trim();
    const layer = String(r?.layer || "").toLowerCase().trim();
    const group = String(r?.group || "").toLowerCase().trim();

    if (layer === "preferred" || group === "preferred") return "preferred";
    if (__TOP3_MUST_HAVE_IDS.has(id)) return "must_have";
    if (__TOP3_SENIORITY_IDS.has(id)) return "seniority";
    if (__TOP3_DOMAIN_HARD_IDS.has(id)) return "domain_hard";
    if (__TOP3_STRUCTURAL_SOFT_IDS.has(id)) return "structural_soft";
    if (__TOP3_PRESENTATION_IDS.has(id)) return "presentation";
    return "default";
  }

  function __getTop3BandRank(r) {
    const riskClass = __getTop3RiskClass(r);
    if (riskClass === "gate") return 0;
    if (riskClass === "must_have" || riskClass === "seniority" || riskClass === "domain_hard") return 1;
    if (riskClass === "structural_soft") return 2;
    if (riskClass === "default") return 3;
    if (riskClass === "presentation") return 4;
    if (riskClass === "preferred") return 5;
    return 6;
  }

  function __getTop3SeverityBoost(r) {
    const tier = String(r?.severityTier || "").toUpperCase().trim();
    if (tier === "S") return 1.5;
    if (tier === "A") return 1.0;
    if (tier === "B") return 0.4;
    const level = __levelForTop3(r);
    if (level === "critical") return 1.0;
    if (level === "warning") return 0.3;
    return 0;
  }

  function __getTop3ClassBoost(r) {
    const riskClass = __getTop3RiskClass(r);
    if (riskClass === "must_have") return 6;
    if (riskClass === "seniority") return 5;
    if (riskClass === "domain_hard") return 4;
    if (riskClass === "structural_soft") return 2;
    if (riskClass === "presentation") return -3;
    if (riskClass === "preferred") return -8;
    return 0;
  }

  function __getTop3RankScore(r) {
    return __getPriority(r) + __getTop3ClassBoost(r) + __getTop3SeverityBoost(r);
  }

  function __compareTop3Normals(a, b) {
    const __bandDiff = __getTop3BandRank(a) - __getTop3BandRank(b);
    if (__bandDiff !== 0) return __bandDiff;

    const diff = __getTop3RankScore(b) - __getTop3RankScore(a);
    if (diff !== 0) return diff;

    const priorityDiff = __getPriority(b) - __getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    return __getScore01(b) - __getScore01(a);
  }

  function __normalizeSeverity(risk) {
    if (__isGate(risk)) return "high";
    const score = __getScore01(risk);
    const tier = String(risk?.severityTier || "").toUpperCase().trim();
    const level = String(risk?.severity || "").toLowerCase().trim();
    if (tier === "S" || tier === "A" || level === "critical" || level === "high" || score >= 0.75) return "high";
    if (tier === "B" || level === "medium" || level === "moderate" || score >= 0.45) return "medium";
    return "low";
  }

  function __pushEvidenceLine(bucket, value) {
    if (Array.isArray(value)) {
      value.forEach((item) => __pushEvidenceLine(bucket, item));
      return;
    }
    const row = value && typeof value === "object" ? value : null;
    const text = String(row?.text || value || "").trim();
    if (!text) return;
    if (!bucket.includes(text)) bucket.push(text);
  }

  function __collectEvidenceLines(risk, explain) {
    const out = [];
    const evidenceObj = explain?.evidence && typeof explain.evidence === "object" ? explain.evidence : null;
    __pushEvidenceLine(out, explain?.summary);
    __pushEvidenceLine(out, explain?.interviewerView);
    __pushEvidenceLine(out, explain?.userReason);
    __pushEvidenceLine(out, explain?.note);
    __pushEvidenceLine(out, risk?.summary);
    __pushEvidenceLine(out, risk?.interviewerView);
    __pushEvidenceLine(out, risk?.userExplanation);
    __pushEvidenceLine(out, risk?.userReason);
    __pushEvidenceLine(out, evidenceObj?.note);
    __pushEvidenceLine(out, evidenceObj?.jd);
    __pushEvidenceLine(out, evidenceObj?.resume);
    __pushEvidenceLine(out, risk?.raw?.explain?.why);
    __pushEvidenceLine(out, risk?.raw?.explain?.evidence);
    return out.slice(0, 3);
  }

  const __LEVEL_OWNERSHIP_IDS = new Set([
    "RISK__OWNERSHIP_LEADERSHIP_GAP",
    "OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO",
    "OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL",
    "OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL",
  ]);
  const __LEVEL_LEAD_IDS = new Set([
    "EXP__LEADERSHIP__MISSING",
    "SENIORITY__UNDER_MIN_YEARS",
    "TITLE_SENIORITY_MISMATCH",
    "RISK__ROLE_LEVEL_MISMATCH",
    "AGE_SENIORITY_GAP",
    "IX__ROLE_LEVEL_X_COMPANY_JUMP",
  ]);
  const __LEVEL_EXECUTION_IDS = new Set([
    "ROLE_TASK__CORE_TASK_MISSING",
    "TASK__CORE_COVERAGE_LOW",
    "TASK__EVIDENCE_TOO_WEAK",
    "IMPACT__NO_QUANTIFIED_IMPACT",
    "IMPACT__LOW_IMPACT_VERBS",
    "IMPACT__PROCESS_ONLY",
    "RISK__EXECUTION_IMPACT_GAP",
    "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
  ]);
  const __LEVEL_STRATEGIC_IDS = new Set([
  ]);
  const __LEVEL_POSITION_BLUR_IDS = new Set([
    "DOMAIN__MISMATCH__JOB_FAMILY",
    "ROLE_DOMAIN_SHIFT",
    "TITLE_DOMAIN_SHIFT",
    "SIMPLE__DOMAIN_SHIFT",
    "DOMAIN__WEAK__KEYWORD_SPARSE",
    "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
    "SIMPLE__ROLE_SHIFT",
  ]);
  const __LEVEL_TIMELINE_IDS = new Set([
    "TIMELINE_INSTABILITY_RISK",
    "HIGH_SWITCH_PATTERN",
    "EXTREME_JOB_HOPPING_PATTERN",
    "FREQUENT_INDUSTRY_SWITCH_PATTERN",
  ]);

  function __countRiskId(source, ids) {
    const arr = Array.isArray(source) ? source : [];
    return arr.filter((risk) => ids.has(String(risk?.id || "").toUpperCase().trim())).length;
  }

  function __findRiskByIds(source, ids) {
    const arr = Array.isArray(source) ? source : [];
    return arr.filter((risk) => ids.has(String(risk?.id || "").toUpperCase().trim()));
  }

  function __normalizeFlowAxisLabel(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function __isSameFlowAxis(a, b) {
    const left = __normalizeFlowAxisLabel(a);
    const right = __normalizeFlowAxisLabel(b);
    return !!left && !!right && left === right;
  }

  function __hasCollapsedFlowAxis(values) {
    const uniq = [...new Set((Array.isArray(values) ? values : [])
      .map((value) => __normalizeFlowAxisLabel(value))
      .filter(Boolean))];
    return uniq.length <= 1;
  }

  function __pickHighestSeverity(source) {
    const arr = Array.isArray(source) ? source : [];
    if (!arr.length) return "low";
    return arr.reduce((picked, risk) => {
      const current = __normalizeSeverity(risk);
      const rank = { low: 0, medium: 1, high: 2 };
      return (rank[current] > rank[picked] ? current : picked);
    }, "low");
  }

  function __buildDomainSignal({ sourceRisks, riskViewItems, interpretationSignals }) {
    const source = Array.isArray(sourceRisks) ? sourceRisks : [];
    const viewItems = Array.isArray(riskViewItems) ? riskViewItems : [];
    const signalProxy = interpretationSignals && typeof interpretationSignals === "object"
      ? interpretationSignals
      : {};
    const domainRiskIds = new Set([
      "DOMAINSHIFTRISK",
      "SIMPLE__DOMAIN_SHIFT",
      "SIMPLE__ROLE_SHIFT",
      "DOMAIN__MISMATCH__JOB_FAMILY",
      "DOMAIN__WEAK__KEYWORD_SPARSE",
      "ROLE_DOMAIN_SHIFT",
      "TITLE_DOMAIN_SHIFT",
    ]);
    const coreDomainRiskIds = new Set([
      "DOMAINSHIFTRISK",
      "SIMPLE__DOMAIN_SHIFT",
      "DOMAIN__MISMATCH__JOB_FAMILY",
      "DOMAIN__WEAK__KEYWORD_SPARSE",
      "TITLE_DOMAIN_SHIFT",
    ]);
    const relatedRisks = source.filter((risk) => {
      const id = String(risk?.id || "").toUpperCase().trim();
      return domainRiskIds.has(id);
    });
    const hasPositionBlur = viewItems.some((item) => String(item?.id || "").trim() === "position_blur");
    const domainShiftScore = __clamp01(signalProxy?.domainShift ?? 0);
    const hasCoreDomainRisk = relatedRisks.some((risk) => {
      const id = String(risk?.id || "").toUpperCase().trim();
      return coreDomainRiskIds.has(id);
    });
    const hasDomainShiftFeel =
      hasCoreDomainRisk ||
      domainShiftScore >= 0.25 ||
      (hasPositionBlur && (hasCoreDomainRisk || domainShiftScore >= 0.25));

    let strength = null;
    if (hasDomainShiftFeel) {
      if (relatedRisks.some((risk) => __isGate(risk)) || domainShiftScore >= 0.6) strength = "high";
      else if (relatedRisks.filter((risk) => {
        const id = String(risk?.id || "").toUpperCase().trim();
        return coreDomainRiskIds.has(id);
      }).length >= 2 || hasPositionBlur || domainShiftScore >= 0.4) strength = "medium";
      else strength = "low";
    }

    const reasonTags = [];
    if (relatedRisks.some((risk) => String(risk?.id || "").toUpperCase().includes("MISMATCH"))) reasonTags.push("industry_mismatch");
    if (relatedRisks.some((risk) => {
      const id = String(risk?.id || "").toUpperCase();
      return id.includes("ROLE_SHIFT") || id.includes("ROLE_DOMAIN_SHIFT");
    })) reasonTags.push("role_shift");
    if (relatedRisks.some((risk) => String(risk?.id || "").toUpperCase().includes("DOMAIN_SHIFT"))) reasonTags.push("domain_shift");
    if (hasPositionBlur) reasonTags.push("position_blur");
    if (domainShiftScore >= 0.25) reasonTags.push("domain_proxy");

    const relatedRiskIds = relatedRisks
      .map((risk) => String(risk?.id || "").trim())
      .filter(Boolean)
      .slice(0, 4);

    const summarySource =
      String(viewItems.find((item) => String(item?.id || "").trim() === "position_blur")?.summary || "").trim() ||
      String(relatedRisks[0]?.summary || "").trim() ||
      String(relatedRisks[0]?.interviewerView || "").trim() ||
      String(relatedRisks[0]?.title || "").trim() ||
      "";

    return {
      hasDomainShiftFeel,
      strength,
      reasonTags: reasonTags.slice(0, 4),
      relatedRiskIds,
      summary: summarySource,
    };
  }

  function __buildCurrentFlow(careerTimelineInput) {
    const timeline =
      careerTimelineInput && Array.isArray(careerTimelineInput?.steps)
        ? careerTimelineInput
        : buildCareerTimeline(careerTimelineInput);

    const hasCareerHistory = Array.isArray(timeline?.steps) && timeline.steps.length > 0;
    const transitionItems = Array.isArray(timeline?.transitions)
      ? timeline.transitions.filter((item) => item && typeof item === "object")
      : [];
    const transitions = transitionItems.map((item) => String(item?.summary || "").trim()).filter(Boolean);
    const switchPattern = transitionItems.length > 0;
    const gapConcern = !!timeline?.hasGapConcern;

    const startPoint = hasCareerHistory ? String(timeline?.startPoint || "").trim() : "";
    const currentPoint = hasCareerHistory ? String(timeline?.currentPoint || "").trim() : "";
    const recentAxis = hasCareerHistory ? String(timeline?.recentAxis || "").trim() : "";
    const overallAxis = hasCareerHistory ? String(timeline?.overallAxis || "").trim() : "";
    const currentAxis = hasCareerHistory
      ? String(timeline?.recentAxis || timeline?.currentPoint || "").trim()
      : "";
    const hasCollapsedAxis = __hasCollapsedFlowAxis([startPoint, currentPoint, recentAxis, overallAxis, currentAxis]);
    const hasMultiStepFlow = transitions.length > 0;
    const transitionPhrase = hasMultiStepFlow
      ? (transitions[0] || "역할이나 환경 이동")
      : "";
    const __transitionNeedsConnector = !/(흐름|이동|전환|확장)$/.test(transitionPhrase);
    const transitionPart = transitionPhrase
      ? (__transitionNeedsConnector
        ? `${transitionPhrase}을 거쳐 `
        : `${transitionPhrase} `)
      : "";
    const __limitLength = (text, max = 150) =>
      text.length > max ? text.slice(0, max).trim() + "..." : text;

    let summary = "현재 이력서만으로는 커리어 흐름을 한 줄로 읽기 어렵습니다.";
    if (hasCareerHistory && startPoint && currentPoint && !__isSameFlowAxis(startPoint, currentPoint)) {
      summary = `${startPoint}에서 시작해 현재는 ${currentPoint}로 이어집니다.`;
    } else if (hasCareerHistory && currentAxis) {
      summary = `현재 커리어는 ${currentAxis} 축 중심으로 읽힙니다.`;
    } else if (hasCareerHistory && overallAxis) {
      summary = `현재 커리어는 ${overallAxis} 관련 경험 축이 보이지만, 최근 역할 연결은 문서에서 더 명확해질 필요가 있습니다.`;
    } else if (hasCareerHistory && currentPoint) {
      summary = `현재 커리어는 ${currentPoint} 경험을 중심으로 읽히지만, 역할 축 설명은 문서에서 더 또렷해질 필요가 있습니다.`;
    }
    if (!hasCollapsedAxis && overallAxis && recentAxis && !__isSameFlowAxis(overallAxis, recentAxis)) {
      summary += ` 전체 축은 ${overallAxis}, 최근 축은 ${recentAxis}입니다.`;
    } else if (!hasCollapsedAxis && overallAxis && !__isSameFlowAxis(overallAxis, currentAxis)) {
      summary += ` 전체 축은 ${overallAxis}입니다.`;
    }
    if (hasMultiStepFlow && !hasCollapsedAxis) {
      summary += ` 전환 단계 ${transitionItems.length}회가 확인됩니다.`;
    }
    if (gapConcern) {
      summary += " 이력 사이 간격이 보여 흐름 해석은 보수적으로 유지됩니다.";
    }
    if (String(timeline?.summary || "").trim() && !__isGenericFlowUnreadableText(timeline?.summary)) {
      summary = `${String(timeline.summary || "").trim()} ${summary}`.trim();
    }

    const evidence = [];
    if (startPoint) evidence.push(`출발점: ${startPoint}`);
    if (currentPoint) evidence.push(`현재 지점: ${currentPoint}`);
    if (recentAxis) evidence.push(`최근 축: ${recentAxis}`);
    if (overallAxis) evidence.push(`전체 축: ${overallAxis}`);
    if (transitions.length > 0) evidence.push(`이동 단계 ${transitions.length}회가 확인됩니다.`);
    if (gapConcern) evidence.push("이력 사이 간격이 보여 흐름 해석이 보수적으로 될 수 있습니다.");

    const mainInterpretationRaw = hasCareerHistory
      ? (hasMultiStepFlow && startPoint && currentAxis && !__isSameFlowAxis(startPoint, currentAxis)
        ? `${startPoint} 경험을 기반으로 ${transitionPart}현재는 ${currentAxis} 중심 커리어로 읽힙니다.`
        : currentAxis
          ? (hasCollapsedAxis
            ? `현재 커리어는 ${currentAxis} 축 중심으로 읽힙니다.`
            : `현재 커리어는 ${currentAxis} 중심 경험으로 읽히며 최근 흐름과 전체 축 사이 차이가 일부 보입니다.`)
          : (() => {
              // Phase 12-D: no-axis fallback — derive from available signals; generic is last-resort only
              if (hasMultiStepFlow && overallAxis) return "관련 경험은 이어지지만 JD 핵심 역할로의 직접 연결은 아직 약합니다.";
              if (gapConcern && hasMultiStepFlow)  return "이동 경로는 있으나 이력 간격으로 인해 흐름을 하나의 축으로 읽기 어렵습니다.";
              if (gapConcern)                       return "경험 축은 이어지지만 커리어 흐름에는 아직 분절이 남아 있습니다.";
              if (overallAxis)                      return `${overallAxis} 경험은 있으나 현재 지원 역할과의 직접 연결이 문서에서 선명하지 않습니다.`;
              return "현재 커리어 흐름은 하나의 중심축으로 읽기 어렵습니다."; // last-resort
            })())
      : "현재 커리어 흐름은 하나의 중심축으로 읽기 어렵습니다.";
    const mainInterpretation = __limitLength(mainInterpretationRaw);
    const bridgeSummary = hasCareerHistory && currentAxis && hasCollapsedAxis
      ? "같은 경험 축은 보이지만 JD 핵심 역할과 직접 연결되는 근거 보강이 필요합니다."
      : "";

    return {
      mainInterpretation,
      summary,
      bridgeSummary,
      startPoint,
      currentPoint,
      transitions: transitions.slice(0, 2),
      currentAxis,
      recentAxis,
      overallAxis,
      evidence: evidence.slice(0, 4),
      careerTimeline: timeline,
      hasGapConcern: gapConcern,
      flags: {
        hasCareerHistory,
        hasMultiStepFlow,
        hasGapConcern: gapConcern,
        hasSwitchPattern: switchPattern,
      },
    };
  }

  function __buildRoleDepthEngine({ careerTimelineInput, parsedResumeInput, sourceRisks, hasGateSignal, scoreBand }) {
    const __safeArray = (value) => Array.isArray(value) ? value : [];
    const __normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
    const __pushUnique = (bucket, value, max = 6) => {
      const text = __normalizeText(value);
      if (!text) return;
      if (!bucket.includes(text) && bucket.length < max) bucket.push(text);
    };
    const __pushStructuredEvidence = (bucket, value, max = 6) => {
      const row = value && typeof value === "object" ? value : null;
      const text = __normalizeText(row?.text || value);
      const sourceType = String(row?.sourceType || "").trim() || "bullet_task";
      const strengthRaw = Number(row?.strength);
      const strength = Number.isFinite(strengthRaw) ? strengthRaw : undefined;
      if (!text) return;
      const exists = bucket.some((item) => (
        item &&
        typeof item === "object" &&
        String(item?.text || "").trim() === text &&
        String(item?.sourceType || "").trim() === sourceType
      ));
      if (!exists && bucket.length < max) {
        bucket.push(strength == null ? { text, sourceType } : { text, sourceType, strength });
      }
    };
    const __readList = (...values) => {
      const out = [];
      for (const value of values) {
        if (Array.isArray(value)) {
          value.forEach((item) => __pushUnique(out, item, 24));
          continue;
        }
        if (typeof value === "string") {
          String(value || "")
            .split(/\n|•|·|▪|■|\/{2}/)
            .map((item) => __normalizeText(item))
            .filter(Boolean)
            .forEach((item) => __pushUnique(out, item, 24));
        }
      }
      return out;
    };
    const __extractEntryEvidenceItems = (item) => {
      const row = item && typeof item === "object" ? item : {};
      const out = [];
      const __pushField = (sourceType, strength, ...values) => {
        __readList(...values).forEach((text) => {
          __pushStructuredEvidence(out, { text, sourceType, strength }, 40);
        });
      };
      __pushField("title", 0.72, row.role, row.title, row.position);
      __pushField("bullet_task", 0.84, row.summary, row.description, row.responsibilities, row.tasks, row.highlights, row.bullets, row.details);
      __pushField("achievement_scope", 0.92, row.scope, row.achievements, row.projects);
      return out;
    };
    const __makeEvidenceLine = (item, text) => {
      const role = __normalizeText(item?.role || item?.title || item?.position || "");
      const company = __normalizeText(item?.company || "");
      const prefix = role && company ? `${role} @ ${company}: ` : (role ? `${role}: ` : "");
      return `${prefix}${__normalizeText(text)}`.trim();
    };
    const __withEntryContext = (item, evidenceItem) => {
      const row = evidenceItem && typeof evidenceItem === "object" ? evidenceItem : {};
      return {
        text: __makeEvidenceLine(item, row?.text || ""),
        sourceType: String(row?.sourceType || "").trim() || "bullet_task",
        strength: Number.isFinite(Number(row?.strength)) ? Number(row.strength) : undefined,
      };
    };
    const __countEvidenceSourceTypes = (items) => {
      const out = new Set();
      __safeArray(items).forEach((item) => {
        const sourceType = String(item?.sourceType || "").trim();
        if (sourceType) out.add(sourceType);
      });
      return out.size;
    };
    const __countEvidenceBySourceType = (items, sourceType) => (
      __safeArray(items).filter((item) => String(item?.sourceType || "").trim() === String(sourceType || "").trim()).length
    );
    const __addRawScore = (bucketKey, evidenceItem, baseScore) => {
      const strength = Number.isFinite(Number(evidenceItem?.strength)) ? Number(evidenceItem.strength) : 1;
      rawScores[bucketKey] += baseScore * strength;
    };
    const __keywordSets = {
      execution: [
        /개발|구현|운영|실행|제작|분석|작성|테스트|자동화|설치|구축|개선|모니터링|대응|관리|deliver|build|execute|implement|operate|analy[sz]e|launch|optimi[sz]e|support/i,
      ],
      ownership: [
        /주도|담당|오너|owner|ownership|end[\s-]?to[\s-]?end|e2e|책임|총괄|리딩|리드|설계부터|기획부터|운영까지|defined|drove|owned|managed|coordinate|coordinated/i,
      ],
      lead: [
        /리드|lead|leader|팀장|파트장|멘토|mentor|코칭|코치|관리자|manager|매니저|cross[\s-]?functional|협업 조율|stakeholder|조직|팀 운영/i,
      ],
      strategic: [
        /전략|strategy|strategic|로드맵|roadmap|우선순위|priority|포트폴리오|사업 방향|의사결정|decision|budget|예산|go[\s-]?to[\s-]?market|gtm|조직 설계|planning/i,
      ],
    };
    const __entries = [];
    const __timelineSource = __safeArray(careerTimelineInput?.steps).length > 0
      ? __safeArray(careerTimelineInput.steps)
      : __careerHistorySafe;
    __safeArray(__timelineSource).forEach((item) => {
      const lines = __extractEntryEvidenceItems(item);
      if (!lines.length && !__normalizeText(item?.role || item?.title || item?.position || "")) return;
      __entries.push({
        ...item,
        __lines: lines,
      });
    });
    __safeArray(parsedResumeInput?.timeline).forEach((item) => {
      const lines = __extractEntryEvidenceItems(item);
      if (!lines.length && !__normalizeText(item?.role || item?.title || item?.position || "")) return;
      __entries.push({
        ...item,
        source: item?.source || "parsedResume.timeline",
        __lines: lines,
      });
    });
    const __resumeWideLines = [];
    __readList(parsedResumeInput?.summary, parsedResumeInput?.experience).forEach((text) => {
      __pushStructuredEvidence(__resumeWideLines, { text, sourceType: "bullet_task", strength: 0.8 }, 40);
    });
    __readList(parsedResumeInput?.achievements, parsedResumeInput?.projects).forEach((text) => {
      __pushStructuredEvidence(__resumeWideLines, { text, sourceType: "achievement_scope", strength: 0.9 }, 40);
    });
    const evidence = {
      execution: [],
      ownership: [],
      lead: [],
      strategic: [],
    };
    const rawScores = {
      execution: 0,
      ownership: 0,
      lead: 0,
      strategic: 0,
    };

    for (const entry of __entries) {
      const roleLabel = __normalizeText(entry?.role || entry?.title || entry?.position || "");
      if (roleLabel) {
        const __titleEvidence = __withEntryContext(entry, {
          text: roleLabel,
          sourceType: "title",
          strength: 0.72,
        });
        if (/lead|leader|manager|head|director|리드|팀장|파트장|매니저/i.test(roleLabel)) {
          __addRawScore("lead", __titleEvidence, 0.12);
          __pushStructuredEvidence(evidence.lead, __titleEvidence);
        }
        if (/director|head|strategy|strateg|planner|pm|product|사업|전략|기획/i.test(roleLabel)) {
          __addRawScore("strategic", __titleEvidence, 0.1);
          __pushStructuredEvidence(evidence.strategic, __titleEvidence);
        }
        if (/owner|ownership|담당|총괄|주도/i.test(roleLabel)) {
          __addRawScore("ownership", __titleEvidence, 0.08);
          __pushStructuredEvidence(evidence.ownership, __titleEvidence);
        }
        rawScores.execution += 0.08;
        __pushStructuredEvidence(evidence.execution, __titleEvidence);
      }

      for (const line of __safeArray(entry?.__lines)) {
        const __lineText = __normalizeText(line?.text || "");
        if (!__lineText) continue;
        const __lineEvidence = __withEntryContext(entry, line);
        for (const key of Object.keys(__keywordSets)) {
          if (__keywordSets[key].some((pattern) => pattern.test(__lineText))) {
            __addRawScore(
              key,
              __lineEvidence,
              key === "execution" ? 0.08 : key === "ownership" ? 0.09 : 0.1
            );
            __pushStructuredEvidence(evidence[key], __lineEvidence);
          }
        }
      }

      const teamSize = Number(entry?.teamSize ?? entry?.team_count ?? entry?.teamMembers ?? entry?.headcount);
      if (Number.isFinite(teamSize) && teamSize >= 2) {
        const __teamEvidence = __withEntryContext(entry, {
          text: `팀 규모 ${teamSize}명 기준으로 역할 범위가 드러납니다.`,
          sourceType: "decision_signal",
          strength: teamSize >= 5 ? 1 : 0.9,
        });
        __addRawScore("lead", __teamEvidence, teamSize >= 5 ? 0.16 : 0.1);
        __pushStructuredEvidence(evidence.lead, __teamEvidence);
      }
      const budget = Number(entry?.budget ?? entry?.budgetAmount);
      if (Number.isFinite(budget) && budget > 0) {
        const __budgetEvidence = __withEntryContext(entry, {
          text: `예산 또는 투자 규모 ${budget} 관련 책임이 보입니다.`,
          sourceType: "decision_signal",
          strength: 1,
        });
        __addRawScore("strategic", __budgetEvidence, 0.14);
        __pushStructuredEvidence(evidence.strategic, __budgetEvidence);
      }
    }

    for (const line of __resumeWideLines) {
      const __lineText = __normalizeText(line?.text || "");
      if (!__lineText) continue;
      const __lineEvidence = {
        text: __lineText,
        sourceType: String(line?.sourceType || "").trim() || "bullet_task",
        strength: Number.isFinite(Number(line?.strength)) ? Number(line.strength) : 0.8,
      };
      if (/\d+[%억만천kKmMbB]|roi|revenue|growth|매출|전환율|효율|절감|성과/i.test(__lineText)) {
        __addRawScore("execution", __lineEvidence, 0.08);
        __pushStructuredEvidence(evidence.execution, __lineEvidence);
      }
      if (/주도|담당|owner|ownership|end[\s-]?to[\s-]?end|책임/i.test(__lineText)) {
        __addRawScore("ownership", __lineEvidence, 0.08);
        __pushStructuredEvidence(evidence.ownership, __lineEvidence);
      }
      if (/리드|lead|mentor|manager|stakeholder|cross[\s-]?functional/i.test(__lineText)) {
        const __leadEvidence = /roadmap|우선순위|의사결정|decision|planning|strategy|전략/i.test(__lineText)
          ? { ...__lineEvidence, sourceType: "decision_signal", strength: 0.95 }
          : __lineEvidence;
        __addRawScore("lead", __leadEvidence, 0.08);
        __pushStructuredEvidence(evidence.lead, __leadEvidence);
      }
      if (/전략|roadmap|우선순위|의사결정|budget|portfolio|사업/i.test(__lineText)) {
        const __strategicEvidence = {
          ...__lineEvidence,
          sourceType: "decision_signal",
          strength: Math.max(Number(__lineEvidence.strength || 0), 0.95),
        };
        __addRawScore("strategic", __strategicEvidence, 0.08);
        __pushStructuredEvidence(evidence.strategic, __strategicEvidence);
      }
    }

    const __levelGate = {
      ownership: (
        evidence.ownership.length >= 2 ||
        __countEvidenceSourceTypes(evidence.ownership) >= 2
      ),
      lead: (
        evidence.lead.length >= 2 &&
        __countEvidenceSourceTypes(evidence.lead) >= 2
      ),
      strategic: (
        __countEvidenceBySourceType(evidence.strategic, "decision_signal") >= 1 &&
        evidence.strategic.length >= 2 &&
        (evidence.strategic.length - __countEvidenceBySourceType(evidence.strategic, "decision_signal")) >= 1
      ),
    };

    const conservativeReasons = [];
    const missingForNextLevel = [];
    const __riskSource = Array.isArray(sourceRisks) ? sourceRisks : [];
    const __riskCount = (ids) => __countRiskId(__riskSource, ids);
    if (hasGateSignal) conservativeReasons.push("게이트 신호가 남아 있어 상위 역할 해석은 보수적으로 유지됩니다.");
    if (__riskCount(__LEVEL_EXECUTION_IDS) > 0) conservativeReasons.push("실행 근거 관련 리스크가 남아 있어 표현 신뢰도를 일부 깎습니다.");
    if (__riskCount(__LEVEL_OWNERSHIP_IDS) > 0) conservativeReasons.push("오너십 리스크가 있어 맡은 범위를 더 좁게 읽을 수 있습니다.");
    if (__riskCount(__LEVEL_LEAD_IDS) > 0) conservativeReasons.push("리드/레벨 리스크가 있어 조직 단위 책임으로 바로 올려 읽기 어렵습니다.");
    if (__safeArray(careerTimelineInput?.gaps).some((item) => item?.isConcern)) {
      conservativeReasons.push("타임라인 공백이 있어 역할 상승 해석은 보수적으로 유지됩니다.");
    }
    if (evidence.lead.length === 0) conservativeReasons.push("팀 조율·리드 표현이 부족해 lead 해석 근거가 약합니다.");
    if (evidence.strategic.length === 0) conservativeReasons.push("방향 설정·우선순위·의사결정 표현이 부족해 strategic 해석 근거가 약합니다.");
    if (!__levelGate.ownership && evidence.ownership.length > 0) conservativeReasons.push("ownership은 단일 키워드만으로 승격하지 않도록 보수적으로 유지됩니다.");
    if (!__levelGate.lead && evidence.lead.length > 0) conservativeReasons.push("lead는 서로 다른 sourceType 2개 이상과 근거 2건 이상이 있어야 승격됩니다.");
    if (!__levelGate.strategic && evidence.strategic.length > 0) conservativeReasons.push("strategic은 decision/planning signal과 추가 근거가 함께 있어야 승격됩니다.");

    const scores = {
      execution: __clamp01(0.18 + rawScores.execution + (__safeArray(__entries).length > 0 ? 0.08 : 0)),
      ownership: __clamp01(
        (!__levelGate.ownership ? 0.1 : 0.1) +
        (!__levelGate.ownership ? Math.min(rawScores.ownership, 0.08) : rawScores.ownership) -
        (__riskCount(__LEVEL_OWNERSHIP_IDS) > 0 ? 0.14 : 0)
      ),
      lead: __clamp01(
        (!__levelGate.lead ? 0.04 : 0.06) +
        (!__levelGate.lead ? Math.min(rawScores.lead, 0.06) : rawScores.lead) -
        (__riskCount(__LEVEL_LEAD_IDS) > 0 ? 0.16 : 0)
      ),
      strategic: __clamp01(
        (!__levelGate.strategic ? 0.03 : 0.04) +
        (!__levelGate.strategic ? Math.min(rawScores.strategic, 0.05) : rawScores.strategic) -
        (__riskCount(__LEVEL_LEAD_IDS) > 0 ? 0.08 : 0) -
        (hasGateSignal ? 0.06 : 0)
      ),
    };

    let dominantLevel = "execution";
    let dominantScore = scores.execution;
    for (const key of ["ownership", "lead", "strategic"]) {
      if (key !== "ownership" && !__levelGate[key]) continue;
      if (key === "ownership" && !__levelGate.ownership) continue;
      if (scores[key] > dominantScore) {
        dominantLevel = key;
        dominantScore = scores[key];
      }
    }
    if (dominantScore < 0.2 && evidence.execution.length === 0) dominantLevel = "execution";
    const overrideEligible =
      dominantLevel === "ownership"
        ? __levelGate.ownership
        : dominantLevel === "lead"
          ? __levelGate.lead
          : dominantLevel === "strategic"
            ? __levelGate.strategic
            : false;

    const __missingMap = {
      execution: [
        "맡은 영역을 끝까지 책임졌다는 표현",
        "단독 담당 범위나 의사결정 관여 문장",
      ],
      ownership: [
        "팀 조율 또는 리드 역할을 직접 보여주는 문장",
        "우선순위 결정이나 범위 설정 근거",
      ],
      lead: [
        "조직 단위 의사결정 또는 전략 방향 설정 문장",
        "예산·사업 영향·로드맵 책임 근거",
      ],
      strategic: [],
    };
    __missingMap[dominantLevel].forEach((item) => __pushUnique(missingForNextLevel, item, 4));
    if (dominantLevel === "execution" && evidence.ownership.length === 0) {
      __pushUnique(missingForNextLevel, "주도적으로 정의하거나 끝까지 오너십을 가진 사례", 4);
    }
    if (dominantLevel !== "strategic" && scoreBand < 70) {
      __pushUnique(missingForNextLevel, "사업 영향 또는 의사결정 범위를 더 직접 드러내는 표현", 4);
    }

    return {
      scores,
      dominantLevel,
      evidence: {
        execution: evidence.execution.slice(0, 4),
        ownership: evidence.ownership.slice(0, 4),
        lead: evidence.lead.slice(0, 4),
        strategic: evidence.strategic.slice(0, 4),
      },
      conservativeReasons: conservativeReasons.slice(0, 4),
      missingForNextLevel: missingForNextLevel.slice(0, 4),
      overrideEligible,
    };
  }

  function __buildCareerInterpretation({ sorted, top3WithNarrative, explanationPack, candidateType, posPct, hasGateSignal, careerTimelineInput, procurementDomainHint = null, explanationMode = "default" }) {
    const source = Array.isArray(sorted) ? sorted : [];
    const top = Array.isArray(top3WithNarrative) ? top3WithNarrative : [];
    const ownershipCount = __countRiskId(source, __LEVEL_OWNERSHIP_IDS);
    const leadCount = __countRiskId(source, __LEVEL_LEAD_IDS);
    const executionCount = __countRiskId(source, __LEVEL_EXECUTION_IDS);
    const strategicCount = __countRiskId(source, __LEVEL_STRATEGIC_IDS);
    const hasStrategicSignals = __LEVEL_STRATEGIC_IDS.size > 0 && strategicCount > 0;
    const positionBlurRisks = __findRiskByIds(source, __LEVEL_POSITION_BLUR_IDS);
    const timelineRisks = __findRiskByIds(source, __LEVEL_TIMELINE_IDS);
    const scoreBand = Number.isFinite(posPct) ? posPct : 0;
    const careerTimeline =
      careerTimelineInput && Array.isArray(careerTimelineInput?.steps)
        ? careerTimelineInput
        : buildCareerTimeline(__careerHistorySafe);
    const currentFlow = __buildCurrentFlow(careerTimeline);
    const roleDepth = __buildRoleDepthEngine({
      careerTimelineInput: careerTimeline,
      parsedResumeInput: parsedResume,
      sourceRisks: source,
      hasGateSignal,
      scoreBand,
    });

    const evidenceScores = {
      execution: __clamp01(
        0.52 +
        (executionCount > 0 ? 0.18 : 0.06) +
        (ownershipCount === 0 ? 0.05 : -0.04) +
        (hasGateSignal ? -0.08 : 0)
      ),
      ownership: __clamp01(
        0.38 +
        (ownershipCount === 0 ? 0.22 : -0.24) +
        (executionCount === 0 ? 0.05 : 0) +
        (scoreBand >= 60 ? 0.05 : 0)
      ),
      lead: __clamp01(
        0.26 +
        (leadCount === 0 ? 0.24 : -0.22) +
        (ownershipCount === 0 ? 0.07 : -0.06) +
        (scoreBand >= 68 ? 0.08 : 0)
      ),
      strategic: __clamp01(
        hasStrategicSignals
          ? (
            0.16 +
            (leadCount === 0 && ownershipCount === 0 ? 0.14 : -0.08) +
            (strategicCount === 0 ? 0.06 : -0.08) +
            (!hasGateSignal && scoreBand >= 78 ? 0.08 : 0)
          )
          : 0
      ),
    };
    const resolvedEvidenceScores = (
      roleDepth &&
      roleDepth.scores &&
      typeof roleDepth.scores === "object"
    ) ? roleDepth.scores : evidenceScores;

    let dominantLevel = "execution";
    let dominantScore = resolvedEvidenceScores.execution;
    const __levelCandidates = hasStrategicSignals
      ? ["ownership", "lead", "strategic"]
      : ["ownership", "lead"];
    for (const key of __levelCandidates) {
      const score = resolvedEvidenceScores[key];
      if (score > dominantScore) {
        dominantLevel = key;
        dominantScore = score;
      }
    }
    if (roleDepth?.overrideEligible && roleDepth?.dominantLevel) {
      dominantLevel = roleDepth.dominantLevel;
      dominantScore = resolvedEvidenceScores[dominantLevel] ?? dominantScore;
    } else {
      if (dominantLevel === "strategic" && strategicCount > 0) dominantLevel = "lead";
      if (dominantLevel === "lead" && leadCount > 0 && ownershipCount > 0) dominantLevel = "execution";
      if (dominantScore < 0.34) dominantLevel = "unknown";
    }

    const titleMap = {
      execution: "실무 중심으로 먼저 읽힙니다",
      ownership: "담당 영역을 맡아온 주도형으로 읽힙니다",
      lead: "실행보다 주도 역할이 함께 보입니다",
      strategic: "전략판단 역할로 연결될 여지가 보입니다",
      unknown: "현재 정보만으로는 레벨 해석이 조심스럽습니다",
    };
    const summaryMap = {
      execution: "현재 이력서만 보면 운영·실행 경험은 비교적 선명하지만, 상위 역할 신호는 상대적으로 약하게 보일 수 있습니다. 그래서 일부 채용에서는 리드형보다 실무 중심으로 해석될 가능성이 있습니다.",
      ownership: "실무 수행을 넘어 특정 업무를 맡아온 흐름은 보이지만, 조직 단위 리딩까지는 아직 강하게 드러나지 않을 수 있습니다. 그래서 독립 수행형에는 자연스럽지만 상위 레벨 채용에서는 범위를 더 확인하려 할 수 있습니다.",
      lead: "현재 이력서에서는 실무 수행뿐 아니라 조율·주도 역할도 함께 읽힙니다. 다만 리드 범위가 팀 단위인지 조직 단위인지는 조금 더 선명해질 여지가 있습니다.",
      strategic: "현재 이력서에서는 단순 실행보다 방향 설정이나 판단 역할로 이어질 수 있는 신호가 일부 보입니다. 다만 실제 의사결정 범위와 사업 영향까지 드러나면 해석이 더 강해질 수 있습니다.",
      unknown: "이력서 안의 역할 신호가 한 방향으로 충분히 모이지 않아, 현재 단계에서는 특정 레벨로 단정하기보다 추가 맥락을 함께 보는 편이 안전합니다.",
    };

    const positiveEvidence = [];
    __pushEvidenceLine(positiveEvidence, roleDepth?.evidence?.[dominantLevel]);
    if (executionCount === 0) positiveEvidence.push("핵심 업무 수행을 직접 막는 실행 리스크가 상위 결과에서 두드러지지 않았습니다.");
    if (ownershipCount === 0 && scoreBand >= 55) positiveEvidence.push("오너십 결손 신호가 상위 결과에서 약해 현재 역할 근거가 일정 수준 유지됩니다.");
    if (leadCount === 0 && scoreBand >= 65) positiveEvidence.push("리드 레벨을 막는 직접 리스크가 상대적으로 약해 상위 역할 해석이 완전히 닫히지 않았습니다.");
    if (hasStrategicSignals && !hasGateSignal && strategicCount === 0 && scoreBand >= 75) {
      positiveEvidence.push("조건 차단 신호가 약해 보다 높은 레벨 해석 여지는 남아 있습니다.");
    }

    const gapEvidence = [];
    __pushEvidenceLine(gapEvidence, roleDepth?.conservativeReasons);
    __pushEvidenceLine(gapEvidence, roleDepth?.missingForNextLevel);
    if (ownershipCount > 0) gapEvidence.push(`오너십 계열 리스크 ${ownershipCount}건이 현재 읽힘을 보수적으로 만들고 있습니다.`);
    if (leadCount > 0) gapEvidence.push(`리드/레벨 계열 리스크 ${leadCount}건이 현재 해석을 한 단계 낮추고 있습니다.`);
    if (executionCount > 0) gapEvidence.push(`실행 근거 계열 리스크 ${executionCount}건이 현재 읽힘을 실무 중심으로 끌어당깁니다.`);
    const primaryReason = String(explanationPack?.primaryReason || "").trim();
    if (primaryReason) gapEvidence.push(primaryReason);
    const __positiveSummary = String(positiveEvidence[0] || "").trim() || "실행과 역할 근거가 먼저 보입니다.";
    const __gapSummary = String(gapEvidence[0] || "").trim() || "상위 역할까지는 추가 확인이 필요할 수 있습니다.";
    const __dominantLevelInterpretationMap = {
      execution: "채용 측에서는 실무 중심 레벨로 읽힐 가능성이 있습니다.",
      ownership: "채용 측에서는 담당 영역을 맡아온 주도형 레벨로 읽힐 가능성이 있습니다.",
      lead: "채용 측에서는 실행보다 주도 역할이 함께 보이는 레벨로 읽힐 가능성이 있습니다.",
      strategic: "채용 측에서는 방향 설정이나 판단 역할까지 이어질 수 있는 레벨로 읽힐 가능성이 있습니다.",
      unknown: "채용 측에서는 특정 레벨로 단정하기보다 추가 맥락을 함께 확인하려 할 가능성이 있습니다.",
    };
    const currentLevelMainInterpretation = [
      "현재 이력서에서는",
      __positiveSummary,
      "",
      "다만",
      __gapSummary,
      "",
      "그래서",
      __dominantLevelInterpretationMap[dominantLevel] || __dominantLevelInterpretationMap.unknown,
    ].join("\n");

    const levelConservativeSource = source.filter((risk) => (
      __LEVEL_OWNERSHIP_IDS.has(String(risk?.id || "").toUpperCase().trim()) ||
      __LEVEL_LEAD_IDS.has(String(risk?.id || "").toUpperCase().trim()) ||
      __LEVEL_EXECUTION_IDS.has(String(risk?.id || "").toUpperCase().trim())
    ));
    const buildRiskSummary = (signal, interpretation, concern) =>
      [
        signal,
        "",
        "그래서 채용 측에서는",
        interpretation,
        "",
        concern,
      ].join("\n");
    const currentAxisLabel = String(currentFlow?.currentAxis || "").trim();
    const buildAxisAwareRiskSummary = ({ signal, interpretation, concern, relatedAxis, riskId }) => {
      if (relatedAxis === "transition" && currentAxisLabel) {
        if (riskId === "position_blur") {
          return buildRiskSummary(
            signal,
            `${currentAxisLabel} 중심 흐름과 JD 요구 방향 사이에 차이가 있을 수 있으며`,
            "채용 측에서는 경험 축이 완전히 맞지 않는 것으로 해석할 수 있습니다."
          );
        }
        if (riskId === "timeline_or_transition_concern") {
          return buildRiskSummary(
            signal,
            "최근 커리어 흐름이 완전히 연속적이지 않은 것으로 해석될 수 있으며",
            "이동 배경이나 전환 맥락을 추가로 확인하려 할 가능성이 있습니다."
          );
        }
      }
      if (relatedAxis === "level") {
        const positiveHint = String(positiveEvidence[0] || "").trim();
        const gapHint = String(gapEvidence[0] || "").trim();
        if (dominantLevel === "execution") {
          return buildRiskSummary(
            positiveHint || signal,
            "실행 중심 경험이 먼저 보이기 때문에",
            "JD가 요구하는 리드 수준보다 보수적으로 평가될 가능성이 있습니다."
          );
        }
        if (dominantLevel === "ownership") {
          return buildRiskSummary(
            positiveHint || signal,
            "담당 영역 경험은 보이지만 아직 조직 단위 리드 경험까지는 단정하기 어렵고",
            gapHint || "조직 리드 경험은 추가 확인이 필요할 수 있습니다."
          );
        }
        if (dominantLevel === "lead") {
          return buildRiskSummary(
            positiveHint || signal,
            "리드 경험 신호는 보이지만 조직 규모나 책임 범위까지는 추가 확인이 필요하고",
            gapHint || "조직 규모나 책임 범위를 추가 확인하려 할 가능성이 있습니다."
          );
        }
        return buildRiskSummary(
          gapHint || signal,
          `현재 이력서는 ${currentAxisLabel || "특정 역할"} 중심 경험으로 읽히기 때문에`,
          "JD가 요구하는 레벨보다 보수적으로 평가될 가능성이 있습니다."
        );
      }
      return buildRiskSummary(signal, interpretation, concern);
    };
    const riskViewItems = [];
    if (levelConservativeSource.length > 0) {
      riskViewItems.push({
        id: "level_conservative_read",
        title: "레벨 보수 해석",
        summary: buildAxisAwareRiskSummary({
          signal: leadCount > 0
            ? "리드·레벨 관련 신호가 함께 보입니다."
            : ownershipCount > 0
              ? "담당 범위를 뒷받침하는 신호가 약하게 보입니다."
              : "실행 근거가 충분히 드러나지 않습니다.",
          interpretation: leadCount > 0
            ? "상위 역할 경험이 아직 부족한 것으로 해석할 수 있으며"
            : ownershipCount > 0
              ? "주도형보다 실무형에 가까운 경험으로 해석할 수 있으며"
              : "실제 수행 수준이 기대보다 낮다고 해석할 수 있으며",
          concern: leadCount > 0
            ? "상위 역할 경험을 추가로 확인하려 할 가능성이 있습니다."
            : ownershipCount > 0
              ? "맡았던 범위를 다시 확인하려 할 가능성이 있습니다."
              : "보수적인 평가로 이어질 가능성이 있습니다.",
          relatedAxis: "level",
          riskId: "level_conservative_read",
        }),
        severity: __pickHighestSeverity(levelConservativeSource),
        relatedAxis: "level",
        jdGapHint: "JD는 현재 이력서에서 읽히는 수준보다 더 높은 역할 범위를 기대할 수 있습니다.",
      });
    }
    if (positionBlurRisks.length > 0) {
      riskViewItems.push({
        id: "position_blur",
        title: "포지션 중심축 흔들림",
        summary: buildAxisAwareRiskSummary({
          signal: "도메인이나 역할 이동 신호가 함께 보입니다.",
          interpretation: "지금 어떤 축의 후보인지 한 번에 선명하지 않은 이력으로 해석할 수 있으며",
          concern: "포지션 적합성을 추가로 확인하려 할 가능성이 있습니다.",
          relatedAxis: "transition",
          riskId: "position_blur",
        }),
        severity: __pickHighestSeverity(positionBlurRisks),
        relatedAxis: "transition",
        jdGapHint: "JD는 보다 선명한 역할 방향성을 기대할 수 있습니다.",
      });
    }
    if (timelineRisks.length > 0) {
      riskViewItems.push({
        id: "timeline_or_transition_concern",
        title: "이동 흐름/전환 이력 주의",
        summary: buildAxisAwareRiskSummary({
          signal: "커리어 이동 흐름이나 전환 패턴에서 확인 포인트가 보입니다.",
          interpretation: "최근 커리어 흐름이 완전히 연속적이지 않은 것으로 해석될 수 있으며",
          concern: "이동 배경이나 전환 맥락을 추가로 확인하려 할 가능성이 있습니다.",
          relatedAxis: "transition",
          riskId: "timeline_or_transition_concern",
        }),
        severity: __pickHighestSeverity(timelineRisks),
        relatedAxis: "transition",
        jdGapHint: "JD는 최근 경력의 연속성과 전환 맥락까지 함께 볼 가능성이 있습니다.",
      });
    }

    const generator = generateCareerInterpretationV1({
      careerHistory: __careerHistorySafe,
      careerTimeline,
      roleDepth,
      top3: top,
      explanationPack,
      riskView: {
        items: riskViewItems.slice(0, 3),
      },
      candidateType,
      // ✅ PATCH R44 (append-only): procurement domain hint
      procurementDomainHint: procurementDomainHint || undefined,
      // ✅ PATCH R45 (append-only): explanation mode
      explanationMode: explanationMode || "default",
      // ✅ PATCH R47 (append-only): procurement domains array
      procurementDomains: evidenceFitMeta?.dominantProcurementDomains || null,
      senioritySignal: {
        hasLevelRisk: levelConservativeSource.length > 0,
        hasSeniorityMismatch: source.some((risk) => {
          const id = String(risk?.id || "").toUpperCase().trim();
          return (
            id === "SENIORITY__UNDER_MIN_YEARS" ||
            id === "TITLE_SENIORITY_MISMATCH" ||
            id === "RISK__ROLE_LEVEL_MISMATCH" ||
            id === "AGE_SENIORITY_GAP"
          );
        }),
        levelRiskIds: levelConservativeSource.map((risk) => String(risk?.id || "").trim()).filter(Boolean).slice(0, 4),
        count: levelConservativeSource.length,
      },
      domainSignal: __buildDomainSignal({
        sourceRisks: source,
        riskViewItems,
        interpretationSignals: interpretation?.signals,
      }),
      // ── Phase 9.6-B: pass-through for sentence layer wrappers ──
      interpretationPack,
    });

    const currentLevel = {
      dominantLevel,
      title: titleMap[dominantLevel] || titleMap.unknown,
      summary: summaryMap[dominantLevel] || summaryMap.unknown,
      mainInterpretation: currentLevelMainInterpretation,
      positiveEvidence: positiveEvidence.filter(Boolean).slice(0, 4),
      gapEvidence: gapEvidence.filter(Boolean).slice(0, 4),
      evidence: [
        ...positiveEvidence.filter(Boolean).slice(0, 2),
        ...gapEvidence.filter(Boolean).slice(0, 2),
      ],
      evidenceScores: resolvedEvidenceScores,
      roleDepth,
    };
    return {
      currentLevel,
      generator,
      riskView: {
        items: riskViewItems.slice(0, 3),
      },
      currentFlow,
      careerTimeline,
      meta: {
        ownershipCount,
        leadCount,
        executionCount,
        strategicCount,
        positionBlurCount: positionBlurRisks.length,
        timelineConcernCount: timelineRisks.length,
        candidateType: String(candidateType || "").trim(),
      },
    };
  }

  // 제목/한줄근거: 가능한 한 riskResult 내부 필드 우선
  function __getTitle(r) {
    const raw = (
      r?.title ??
      r?.label ??
      r?.name ??
      r?.raw?.title ??
      r?.raw?.label ??
      r?.raw?.name ??
      String(r?.id || "")
    );
    return sanitizeRiskTitle(r?.id, raw);
  }

  function __getOneLiner(r) {
    const raw = (
      r?.oneLiner ??
      r?.reasonShort ??
      r?.summary ??
      r?.raw?.oneLiner ??
      r?.raw?.reasonShort ??
      r?.raw?.summary ??
      null
    );
    return sanitizeRiskDescription(r?.id, raw);
  }
  function __byId(rr, id) {
    const hit = (rr || []).find((x) => String(x?.id || "") === String(id || ""));
    return hit ? __getScore01(hit) : null;
  }

  function __avgScore01(rr) {
    const arr = (rr || []).map(__getScore01);
    if (!arr.length) return 0;
    return arr.reduce((s, x) => s + x, 0) / arr.length;
  }

  function __pickTop2(rrSorted) {
    const gates = (rrSorted || []).filter(__isGate);
    const normals = (rrSorted || []).filter((r) => !__isGate(r));

    const rank = (a, b) => {
      // [CONTRACT] 정렬 기준: priority 단독.
      // score/raw.score tiebreaker 제거 — 동순위는 삽입 순서(stable sort)로 처리.
      return __getPriority(b) - __getPriority(a);
    };

    const g2 = [...gates].sort(rank).slice(0, 2);
    if (g2.length >= 2) return g2;

    const need = 2 - g2.length;
    const n2 = [...normals].sort(rank).slice(0, need);
    return [...g2, ...n2].slice(0, 2);
  }

  function __derivePosition({ posRaw, gateMax }) {
    // 게이트가 강하면 포지션 라벨은 하드로 내려야 "테스트형"에서 설득력이 생김
    const __gate01 = __clamp01(gateMax);
    if (__gate01 >= 0.85) {
      return { label: "❄️ 구조적 탈락권", band: "fail_hard", pct: Math.round(__clamp01(posRaw) * 100) };
    }

    const p = __clamp01(posRaw);
    const pct = Math.round(p * 100);

    if (pct < 20) return { label: "❄️ 구조적 탈락권", band: "fail", pct };
    if (pct < 40) return { label: "🧊 보류 관망권", band: "hold", pct };
    if (pct < 60) return { label: "⚖️ 경합 구간", band: "edge", pct };
    if (pct < 80) return { label: "🚀 우선 검토권", band: "shortlist", pct };
    if (__gate01 >= 0.25) return { label: "🚀 우선 검토권", band: "shortlist", pct };
    return { label: "🏆 합격 유력권", band: "strong", pct };
  }

  function __determineType({
    gateMax,
    posRaw,
    trust,
    fit,
    risk,
    top2,
    top3,
    topRisks,
    docAvg,
    lowRelevanceSummary = null,
    sameFamilyContinuity = false,
  }) {
    const gm = __clamp01(gateMax);
    const pr = __clamp01(posRaw);
    const t = __clamp01(trust);
    const f = __clamp01(fit);
    const r = __clamp01(risk);
    const __lowRelevanceCount = Number(lowRelevanceSummary?.count || 0);
    const __hasMustHaveGap = Boolean(lowRelevanceSummary?.hasMustHaveGap);
    const __hasKeywordGap = Boolean(lowRelevanceSummary?.hasKeywordGap);
    const __hasLowEvidence = Boolean(lowRelevanceSummary?.hasLowEvidence);
    const __blockStableAvg = __hasMustHaveGap && __hasKeywordGap && __hasLowEvidence;
    const __sameFamilyContinuity = Boolean(sameFamilyContinuity);
    const __transitionEvidencePool = [
      ...(Array.isArray(top2) ? top2 : []),
      ...(Array.isArray(top3) ? top3 : []),
      ...(Array.isArray(topRisks) ? topRisks : []),
    ];
    const __hasActualTransitionEvidence = __transitionEvidencePool.some((item) => {
      const id = String(item?.id || "").toUpperCase().trim();
      if (!id) return false;
      if (id.includes("TIMELINE") || id.includes("HOPPING") || id.includes("TRANSITION")) return true;
      if (id.includes("POSITION_BLUR") || id.includes("DOMAIN_ROLE_MISMATCH")) return true;
      if (id.includes("TITLE_DOMAIN_SHIFT") || id.includes("ROLE_DOMAIN_SHIFT")) return true;
      if (id.includes("SIMPLE__ROLE_SHIFT")) return true;
      return false;
    });
    const __hasBroadMismatchOnly =
      __transitionEvidencePool.length > 0 &&
      __transitionEvidencePool.every((item) => {
        const id = String(item?.id || "").toUpperCase().trim();
        if (!id) return true;
        return (
          id === "DOMAIN__WEAK__KEYWORD_SPARSE" ||
          id === "DOMAIN__MISMATCH__JOB_FAMILY" ||
          id === "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY" ||
          id === "ROLE_SKILL__JD_KEYWORD_ABSENCE"
        );
      });

    // 1) 게이트 우선
    if (gm >= 0.82) {
      if (pr < 0.35) {
        return {
          typeId: "TYPE_GATE_BLOCK",
          emoji: "🚧",
          label: "구조적 차단형",
          oneLiner: "역량보다 조건/게이트가 먼저 걸립니다.",
          userTypeCompat: {
            code: "TYPE_GATE_BLOCK",
            title: "🚧 구조적 차단형",
            description: "면접 설득 이전에 조건(게이트) 해소가 우선입니다.",
          },
        };
      }
      return {
        typeId: "TYPE_CONDITION_CONFLICT",
        emoji: "🪞",
        label: "조건 충돌형",
        oneLiner: "역량은 괜찮지만 조건에서 충돌이 납니다.",
        userTypeCompat: {
          code: "TYPE_CONDITION_CONFLICT",
          title: "🪞 조건 충돌형",
          description: "실력과 별개로 연령/보상/조건에서 필터링될 수 있습니다.",
        },
      };
    }

    // 2) 전환/적합도 중심
    if (f < 0.45 && !__sameFamilyContinuity && __hasActualTransitionEvidence && !__hasBroadMismatchOnly) {
      return {
        typeId: "TYPE_SHIFT_TRIAL",
        emoji: "🔁",
        label: "전환 시험대형",
        oneLiner: "전환 설득 근거를 테스트받는 구간입니다.",
        userTypeCompat: {
          code: "TYPE_SHIFT_TRIAL",
          title: "🔁 전환 시험대형",
          description: "도메인/직무 전환의 전이 근거가 핵심 쟁점이 됩니다.",
        },
      };
    }

    // 3) 강세권 즉전감 (기본: 저리스크, 보조: 상위 조합일 때만 리스크 컷 완화)
    // + VETO: 전환/연차/타임라인/게이트 성격 신호가 상위 리스크에 있으면 즉전형 금지
    const __readyVetoPool = [...(Array.isArray(top2) ? top2 : []), ...(Array.isArray(top3) ? top3 : []), ...(Array.isArray(topRisks) ? topRisks : [])];
    const __readyVetoById = __readyVetoPool.some((x) => {
      const id = String(x?.id || "").toUpperCase();
      if (!id) return false;
      if (id.includes("GATE__")) return true;
      if (id.includes("DOMAIN")) return true;
      if (id.includes("SHIFT")) return true;
      if (id.includes("ROLE_LEVEL")) return true;
      if (id.includes("ROLE_MISMATCH")) return true;
      if (id.includes("SENIORITY")) return true;
      if (id.includes("TIMELINE")) return true;
      if (id.includes("HOPPING")) return true;
      return false;
    });
    // 점수 veto 우선순위: gateMax 하드 veto 우선, docAvg는 보조 veto
    const __readyVetoByGate = gm >= 0.25;
    const __readyVetoByDoc = __clamp01(docAvg) >= 0.35;
    const __readyVetoByScore = __readyVetoByGate || __readyVetoByDoc;

    const __isReadyCoreStrong =
      pr >= 0.75 && gm < 0.35 && f >= 0.65 && t >= 0.72;
    const __isReadyCoreRiskOk =
      r <= 0.25 || (pr >= 0.82 && f >= 0.72 && t >= 0.78 && r <= 0.30);
    if (__isReadyCoreStrong && __isReadyCoreRiskOk && !__readyVetoById && !__readyVetoByScore) {
      const __readyLabel = "즉전 투입형";
      const __readyTitle = "🔥 즉전 투입형";
      const __readyDesc = "검증 비용이 낮고, 즉시 투입 가능한 인상입니다.";
      return {
        typeId: "TYPE_READY_CORE",
        emoji: "🔥",
        label: __readyLabel,
        oneLiner: "핵심 역량 정합성이 높게 관찰됩니다.",
        userTypeCompat: {
          code: "TYPE_READY_CORE",
          title: __readyTitle,
          description: __readyDesc,
        },
      };
    }

    // 4) 신뢰/설득 중심
    if (t < 0.55 && f > 0.65) {
      return {
        typeId: "TYPE_PERSUASION_WEAK",
        emoji: "📉",
        label: "설득 부족형",
        oneLiner: "경험은 맞는데 임팩트/근거가 약하게 보입니다.",
        userTypeCompat: {
          code: "TYPE_PERSUASION_WEAK",
          title: "📉 설득 부족형",
          description: "성과 밀도(정량/맥락/기여)가 약하면 질문이 늘어납니다.",
        },
      };
    }

    // 5) 무난 통과형은 명시 조건형(기본 + 고점-준양호 보조 진입 1개)
    const __isStableAvgBase =
      pr >= 0.58 && gm < 0.6 && f >= 0.55 && t >= 0.5 && r < 0.45;
    const __isStableAvgHighPos =
      pr >= 0.70 && gm < 0.70 && f >= 0.58 && t >= 0.58 && r < 0.60;
    if ((__isStableAvgBase || __isStableAvgHighPos) && !__blockStableAvg) {
      return {
        typeId: "TYPE_STABLE_AVG",
        emoji: "🧊",
        label: "무난 통과형",
        oneLiner: "큰 결함은 없지만 인상은 약할 수 있습니다.",
        userTypeCompat: {
          code: "TYPE_STABLE_AVG",
          title: "🧊 무난 통과형",
          description: "안정적이지만, 차별 포인트가 약하면 우선순위가 내려갈 수 있습니다.",
        },
      };
    }

    // 6) 경합 구간형
    if (pr >= 0.45 && pr < 0.6) {
      return {
        typeId: "TYPE_EDGE_BALANCE",
        emoji: "⚖️",
        label: "줄타기 관망형",
        oneLiner: "가능성은 보이지만 확신은 부족합니다.",
        userTypeCompat: {
          code: "TYPE_EDGE_BALANCE",
          title: "⚖️ 줄타기 관망형",
          description: "결정적 한 방(근거/정합성)이 없으면 보류될 수 있습니다.",
        },
      };
    }

    // 7) 최종 fallback: 중립 혼합형
    return {
      typeId: "TYPE_MIXED_NEUTRAL",
      emoji: "🫥",
      label: "중립 혼합형",
      oneLiner: "강한 장점도 치명적 결함도 아직 선명하지 않습니다.",
      userTypeCompat: {
        code: "TYPE_MIXED_NEUTRAL",
        title: "🫥 중립 혼합형",
        description: "강한 장점도 치명적 결함도 아직 선명하지 않습니다.",
      },
    };

  }

  // ✅ PATCH: Top3 display cluster mapper (execution/impact 중복만 국소 처리)
  function __getTop3DisplayClusterId(risk) {
    const id = String(risk?.id || "");
    if (id === "HR_ALIGNMENT_GAP" || id === "STRATEGIC_SCOPE_GAP") {
      return id;
    }
    if (
      id === "DOMAIN__MISMATCH__JOB_FAMILY" ||
      id === "DOMAIN_ROLE_MISMATCH" ||
      id === "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY" ||
      id === "ROLE_SKILL__JD_KEYWORD_ABSENCE"
    ) {
      return "CLUSTER__ROLE_ALIGNMENT_SURFACE";
    }
    if (
      id === "RISK__EXECUTION_IMPACT_GAP" ||
      id === "EXP__SCOPE__TOO_SHALLOW" ||
      id === "LOW_CONTENT_DENSITY_RISK"
    ) {
      return "CLUSTER__EXECUTION_IMPACT_SURFACE";
    }
    return String(risk?.group || id);
  }

  function __dedupeTop3NormalsByDisplayCluster(normals) {
    const out = [];
    const seen = new Set();
    for (const r of Array.isArray(normals) ? normals : []) {
      const cid = __getTop3DisplayClusterId(r);
      if (seen.has(cid)) continue;
      seen.add(cid);
      out.push(r);
    }
    return out;
  }

  const sorted = [...(riskResults || [])].sort((a, b) => __getPriority(b) - __getPriority(a));
  const __lowRelevanceSignalIds = new Set([
    "ROLE_SKILL__MUST_HAVE_MISSING",
    "ROLE_SKILL__JD_KEYWORD_ABSENCE",
    "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
    "LOW_CONTENT_DENSITY_RISK",
    "IMPACT__NO_QUANTIFIED_IMPACT",
    "IMPACT__PROCESS_ONLY",
  ]);
  const __lowRelevanceHits = sorted.filter((r) => __lowRelevanceSignalIds.has(String(r?.id || "")));
  const __lowRelevanceTopHits = __lowRelevanceHits.slice(0, 4);
  const __lowRelevanceSummary = {
    count: __lowRelevanceTopHits.length,
    hasMustHaveGap: __lowRelevanceTopHits.some((r) => String(r?.id || "") === "ROLE_SKILL__MUST_HAVE_MISSING"),
    hasKeywordGap: __lowRelevanceTopHits.some((r) => String(r?.id || "") === "ROLE_SKILL__JD_KEYWORD_ABSENCE"),
    hasLowEvidence: __lowRelevanceTopHits.some((r) => {
      const id = String(r?.id || "");
      return (
        id === "LOW_CONTENT_DENSITY_RISK" ||
        id === "IMPACT__NO_QUANTIFIED_IMPACT" ||
        id === "IMPACT__PROCESS_ONLY"
      );
    }),
  };
  // ✅ PATCH: "컷 신호 TOP3"는 gate를 우선 포함 (최대 3개), 부족분은 일반 리스크로 채움
  const __gates = sorted.filter(__isGate);
  const __normals = sorted.filter((r) => !__isGate(r));
  const __need = Math.max(0, 3 - Math.min(3, __gates.length));
  // [PATCH] Top3 Display Dedupe v1 — display-level만 처리 (riskResults 원본 보존)
  // GATE__CRITICAL_EXPERIENCE_GAP가 Top3 gate에 포함되면
  // ROLE_SKILL__MUST_HAVE_MISSING은 동일 데이터(mustHave.missing)를 중복 노출하므로 normals에서 제외
  const __gateIds = new Set(__gates.slice(0, 3).map((r) => String(r?.id || "")));
  const __normalsGateDeduped = __gateIds.has("GATE__CRITICAL_EXPERIENCE_GAP")
    ? __normals.filter((r) => String(r?.id || "") !== "ROLE_SKILL__MUST_HAVE_MISSING")
    : __normals;
  const __normalsRanked = [...__normalsGateDeduped].sort(__compareTop3Normals);
  const __normalsDeduped = __dedupeTop3NormalsByDisplayCluster(__normalsRanked);
  const top3 = [...__gates.slice(0, 3), ...__normalsDeduped.slice(0, __need)].slice(0, 3);
  const __topNarratives = buildTopRiskNarratives(top3, { interpretationPack });
  const __topNarrativeMap = new Map(__topNarratives.map((entry) => [entry.id, entry.narrative]));
  const __attachNarrative = (risk) => {
    const id = String(risk?.id || risk?.__id || risk?.code || "").trim();
    if (!id || !__topNarrativeMap.has(id)) return risk;
    const narrative = __topNarrativeMap.get(id);
    return {
      ...(risk && typeof risk === "object" ? risk : {}),
      narrative,
      headline: narrative?.headline,
      interviewerView: narrative?.interviewerView,
      userExplanation: narrative?.userExplanation,
      interviewPrepHint: narrative?.interviewPrepHint,
      severityTone: narrative?.severityTone,
      actionHint: narrative?.interviewPrepHint || risk?.actionHint,
    };
  };
  const top3WithNarrative = top3.map(__attachNarrative);
  const sortedWithNarrative = sorted.map(__attachNarrative);
  const __alignedTopRiskIds = top3.map((risk) => String(risk?.id || "").trim()).filter(Boolean);
  const __explanationPackRaw = buildExplanationPack(riskResults || [], {
    alignedTopRiskIds: __alignedTopRiskIds,
    // ✅ PATCH R37 (append-only): DOMAIN_ROLE_MISMATCH evidence에 criticalMissingItems 연결
    criticalMissingItems: Array.isArray(evidenceFitMeta?.criticalMissingItems)
      ? evidenceFitMeta.criticalMissingItems.filter(Boolean).slice(0, 3)
      : [],
  });
  const explanationPack = {
    ...(typeof __explanationPackRaw === "object" && __explanationPackRaw ? __explanationPackRaw : {}),
    primaryReason: String(__explanationPackRaw?.primaryReason || "").trim(),
    primaryReasonAction: String(__explanationPackRaw?.primaryReasonAction || "").trim(),
    evidence:
      __explanationPackRaw?.evidence ??
      __explanationPackRaw?.primaryReasonEvidence ??
      null,
  };
  const __topSignalId = String(explanationPack?.topSignals?.[0]?.id || "").trim();
  const __isTaskOntologyTop =
    __topSignalId === "TASK__CORE_COVERAGE_LOW" ||
    __topSignalId === "TASK__EVIDENCE_TOO_WEAK";
  const __taskOntologyTitle =
    __topSignalId === "TASK__CORE_COVERAGE_LOW"
      ? "핵심 업무 근거 부족"
      : __topSignalId === "TASK__EVIDENCE_TOO_WEAK"
        ? "업무 근거 강도 약함"
        : "";
  const __expTopSignalsById = new Map(
    (Array.isArray(explanationPack?.topSignals) ? explanationPack.topSignals : [])
      .map((signal) => [String(signal?.id || "").trim(), signal])
      .filter(([id]) => Boolean(id))
  );

  // ---------- interpretation (유형 테스트 엔진: riskResults 기반, AI 없음) ----------
  const gateScores = __gates.map(__getScore01);
  const gateMax = gateScores.length ? Math.max(...gateScores) : 0;

  const __domainWeak = __byId(sorted, "DOMAIN__WEAK__KEYWORD_SPARSE");
  const __domainMismatch = __byId(sorted, "DOMAIN__MISMATCH__JOB_FAMILY");
  const domainShift = __clamp01((__domainWeak ?? 0) > 0 ? (__domainWeak ?? 0) : (__domainMismatch ?? 0));

  const __roleSemantic = __byId(sorted, "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY");
  const __roleKeyword = __byId(sorted, "ROLE_SKILL__JD_KEYWORD_ABSENCE");
  const roleShift = __clamp01((__roleSemantic ?? 0) > 0 ? (__roleSemantic ?? 0) : (__roleKeyword ?? 0));

  const docOnly = sorted.filter((r) => !__isGate(r));
  const docAvg = __avgScore01(docOnly);

  // overallScore가 여기로 안 넘어오므로, riskResults 기반 posRaw(0~1) 프록시
  // - gate가 있으면 거의 그게 결정
  // - gate 없으면 docAvg가 결정
  const posRaw = __clamp01(1 - (0.78 * __clamp01(gateMax) + 0.22 * __clamp01(docAvg)));

  const fit = __clamp01(1 - __clamp01(0.65 * __clamp01(domainShift) + 0.35 * __clamp01(roleShift)));
  const risk = __clamp01(0.85 * __clamp01(gateMax) + 0.15 * __clamp01(docAvg));
  const trust = __clamp01(0.60 * (1 - __clamp01(docAvg)) + 0.40 * (1 - __clamp01(gateMax) * 0.60));
  const __HR_FAMILY_DOMAIN_SET = new Set([
    "hr",
    "talent_acquisition",
    "hr_operations",
    "compensation_performance",
    "hrbp_er",
    "learning_development",
  ]);
  const __dominantHrDomainsForType = Array.isArray(evidenceFitMeta?.dominantHrDomains)
    ? evidenceFitMeta.dominantHrDomains.map((d) => String(d || "").trim()).filter((d) => __HR_FAMILY_DOMAIN_SET.has(d))
    : [];
  const __hrTransitionTypeForType = String(evidenceFitMeta?.hrTransitionType || "").trim();
  const __transitionDecisionTypeForType = String(evidenceFitMeta?.transitionDecisionType || "").trim();
  const __sameFamilyContinuityForType =
    evidenceFitMeta?.hrFamilyFit === true ||
    evidenceFitMeta?.hrTransitionFit === true ||
    __dominantHrDomainsForType.length > 0 ||
    __transitionDecisionTypeForType === "CAREER_LADDER_TRANSITION" ||
    __hrTransitionTypeForType === "within_hr_transition" ||
    __hrTransitionTypeForType === "operations_to_hrbp" ||
    __hrTransitionTypeForType === "operations_to_compensation" ||
    __hrTransitionTypeForType === "recruiting_to_hrbp";

  const position = __derivePosition({ posRaw, gateMax });

  const top2 = __pickTop2(sorted);
  const topRisksForType = sorted.slice(0, 5);
  const type = __determineType({
    gateMax,
    posRaw,
    trust,
    fit,
    risk,
    top2,
    top3: top3WithNarrative,
    topRisks: topRisksForType,
    docAvg,
    lowRelevanceSummary: __lowRelevanceSummary,
    sameFamilyContinuity: __sameFamilyContinuityForType,
  });

  const interpretation = {
    typeId: type?.typeId || "TYPE_MIXED",
    emoji: type?.emoji || "🧩",
    label: type?.label || "혼합 리스크형",
    oneLiner: type?.oneLiner || "여러 리스크가 동시에 작동하고 있습니다.",
    positionLabel: position?.label || "⚖️ 경합 구간",
    positionPct: __safeNum(position?.pct, Math.round(posRaw * 100)),
    signals: {
      gateMax: __clamp01(gateMax),
      domainShift: __clamp01(domainShift),
      roleShift: __clamp01(roleShift),
      docAvg: __clamp01(docAvg),
      posRaw: __clamp01(posRaw),
      trust: __clamp01(trust),
      fit: __clamp01(fit),
      risk: __clamp01(risk),
    },
    top2: top2.map((x) => x?.id).filter(Boolean),
  };
  const __domainMismatchDetected = sorted.some((x) => {
    const id = String(x?.id || "").toUpperCase();
    return id.includes("DOMAIN_MISMATCH") || id.includes("JOB_FAMILY_DIFFERENT");
  });
  const __evidenceTop = explanationPack?.topSignals?.[0]?.evidence;
  const __hasTopEvidence =
    __evidenceTop &&
    (Array.isArray(__evidenceTop?.jd) ||
      Array.isArray(__evidenceTop?.resume) ||
      String(__evidenceTop?.note || "").trim().length > 0);
  const __policyInput = buildPolicyInput({
    score: __safeNum(position?.pct, Math.round(posRaw * 100)),
    gateMax,
    domainMismatch: __domainMismatchDetected,
    hasEvidence: __hasTopEvidence,
    quickNoResume: false,
  });

  // 기존 group 기반은 보조로만 남김(메타/디버그 용)
  const primaryGroup = top3[0]?.group || null;

  // ✅ userType을 "유형 테스트 결과"로 교체(기존 UI 그대로여도 타입이 다양하게 보이게)
  const userType = __isTaskOntologyTop
    ? {
      code: __topSignalId || "TASK__ONTOLOGY",
      title: __taskOntologyTitle || "핵심 업무 근거 부족",
      description:
        String(explanationPack?.primaryReason || "").trim() ||
        "JD 핵심 업무 기준으로 직접 수행 근거 보강이 필요합니다.",
      subtitle:
        String(explanationPack?.primaryReasonAction || "").trim() ||
        "직접 설계/주도/개선 성과가 드러나는 핵심 항목 보강이 필요합니다.",
      evidence: explanationPack?.primaryReasonEvidence || undefined,
    }
    : (type?.userTypeCompat || mapType(primaryGroup));
  const __safeTypeTitle = resolveTypeTitle(__policyInput, userType?.title || "");
  const __safeTypeSubtitle = sanitizeReadinessWording(
    __policyInput,
    String(userType?.description || "").trim(),
    __policyInput?.evidenceStrength === "low"
      ? "현재 근거 기준 탐색 결과입니다."
      : "근거 확인이 필요한 상태입니다."
  );
  const __safeInterpretationLabel = resolveTypeTitle(__policyInput, type?.label || "");
  const __safeInterpretationOneLiner = sanitizeReadinessWording(
    __policyInput,
    type?.oneLiner || "",
    __policyInput?.evidenceStrength === "low"
      ? "현재 근거 기준 탐색 단계입니다."
      : "핵심 근거 확인이 필요합니다."
  );

  const logs = buildDecisionLogs(top3WithNarrative);
  const __actionContext = {
    primaryRiskId: String(top3WithNarrative?.[0]?.id || "").trim(),
    supportRiskIds: top3WithNarrative.slice(1, 3).map((r) => String(r?.id || "").trim()).filter(Boolean),
    topRiskIds: top3WithNarrative.map((r) => String(r?.id || "").trim()).filter(Boolean),
  };
  const actionCandidates = buildActionCandidates(sortedWithNarrative, __actionContext);
  const __primaryExact = actionCandidates.filter((a) => a?.isPrimaryRiskAction);
  const __primaryFamily = actionCandidates.filter((a) => !a?.isPrimaryRiskAction && a?.isPrimaryRiskFamilyAction);
  const __supportAligned = actionCandidates.filter((a) =>
    !a?.isPrimaryRiskAction &&
    !a?.isPrimaryRiskFamilyAction &&
    (a?.isSupportRiskAction || a?.isSupportRiskFamilyAction)
  );
  const __fallback = actionCandidates.filter((a) =>
    !a?.isPrimaryRiskAction &&
    !a?.isPrimaryRiskFamilyAction &&
    !a?.isSupportRiskAction &&
    !a?.isSupportRiskFamilyAction
  );
  const __ACTION_FALLBACK_SAFE_LIMIT = 4;
  const __alignedActionCandidates = [
    ...__primaryExact,
    ...__primaryFamily,
    ...__supportAligned,
    ...__fallback.slice(0, __ACTION_FALLBACK_SAFE_LIMIT),
  ];
  const topActions = rankActions(__alignedActionCandidates);

  const avgPriority = top3WithNarrative.reduce((s, r) => s + __getPriority(r), 0) / (top3WithNarrative.length || 1);

  // ✅ NEW (append-only): pass position payload for UI (SimulatorLayout compatibility)
  // 점수 톤 정책(자존감 박살 방지):
  // - 정말 안 맞는 케이스도 30점대부터 시작
  // - 평범(무난) 구간이 60~70점대에 오도록 완만하게 매핑
  // 기존 posRaw(0~1)는 "리스크 기반 프록시"라서 너무 박하게 나올 수 있음 → UI용 점수로 변환
  const __posRaw01 = __clamp01(__safeNum(posRaw, 0.35));

  // basePct(참고용): 기존 계산(직접 노출 X)
  const __basePct = __safeNum(interpretation?.positionPct, Math.round(__posRaw01 * 100));

  // generousPct(노출용): 30 ~ 85 범위 중심으로 스케일
  // - posRaw=0.00 → 30
  // - posRaw=0.55 → 60
  // - posRaw=0.73 → 70
  // - posRaw=1.00 → 85
  const __lowRelevancePenalty = (() => {
    if (__lowRelevanceSummary.count < 2) return 0;
    if (__lowRelevanceSummary.hasMustHaveGap && __lowRelevanceSummary.hasKeywordGap && __lowRelevanceSummary.hasLowEvidence) {
      return 12;
    }
    if (__lowRelevanceSummary.hasMustHaveGap && __lowRelevanceSummary.hasKeywordGap) return 8;
    if ((__lowRelevanceSummary.hasMustHaveGap || __lowRelevanceSummary.hasKeywordGap) && __lowRelevanceSummary.hasLowEvidence) {
      return __lowRelevanceSummary.count >= 3 ? 6 : 4;
    }
    return 0;
  })();
  const __generousPct = __clamp01((30 + 55 * __posRaw01 - __lowRelevancePenalty) / 100);
  const __posPct = Math.max(30, Math.min(95, Math.round(__generousPct * 100)));
  // "면접관 해석 유형" 표현과 맞추기: pass.bandLabel은 position이 아니라 interpretation 타입 라벨을 우선 사용
  // - 예: "🚧 구조적 차단형"
  const __bandLabelRaw =
    (interpretation?.label ? `${interpretation.emoji || ""} ${interpretation.label}`.trim() : null) ||
    (userType?.title ? String(userType.title).trim() : null) ||
    (position?.label ? String(position.label).trim() : null) ||
    "🎯 해석 중";

  // upliftHint도 “면접관 해석 유형” 톤으로: 조직은 잠재력을 보지만… / 판단: 설득 포인트 탐색 중
  const __upliftHint =
    interpretation?.oneLiner ||
    "조직은 잠재력을 보지만, “이 경험이 여기서도 통할까?”를 궁금해하고 있습니다.";
  const __passLabels = resolvePassLabels(__policyInput, {
    preliminary: false,
    bandLabel: __bandLabelRaw,
    headline: "🎯 현재 면접관 해석 유형",
    judgementLabel: "판단: 설득 포인트 탐색 중",
  });
  const __hasGateSignal = Array.isArray(sorted) && sorted.some((r) => __isGate(r));
  const __hasHighRiskSignal = Array.isArray(sorted) && sorted.some((r) => {
    if (__isGate(r)) return false;
    const id = String(r?.id || "").toUpperCase();
    const sc = __getScore01(r);
    return id.includes("HIGH_RISK") || id.includes("STRUCTURAL") || sc >= 0.85;
  });
  const __mustHaveFit = deriveMustHaveFitFromRisks(sorted);
  const __candidateType = resolveCandidateTypeCeiling({
    highRiskSignal: __hasHighRiskSignal,
    gateSignal: __hasGateSignal,
    score: __posPct,
    mustHaveFit: __mustHaveFit,
  });

  // [PATCH] PASSMAP 16유형 SSOT (append-only)
  // intro/header 카피 SSOT는 typeDescriptions.js를 사용하고, oneLiner는 legacy/compatibility 메타로 유지한다.
  const __passmapType = resolvePassmapType16({
    sorted,
    signals: interpretation.signals,
    gateMax,
    posRaw,
    fit,
    trust,
    risk,
    veto: false,
    mustHaveFit: __mustHaveFit,
    typeId: interpretation.typeId,
  });
  const __typeSsotPack = {
    scope: "passmap_type",
    id: String(__passmapType?.id || "").trim() || null,
    family: String(__passmapType?.family || __passmapType?.dominantFamily || "").trim() || null,
    dominantRiskId: String(__passmapType?.dominantRiskId || "").trim() || null,
    label: String(__passmapType?.label || "").trim() || null,
    oneLiner: String(__passmapType?.oneLiner || "").trim() || null,
  };
  const __riskIdsForBase = new Set(
    (Array.isArray(sorted) ? sorted : [])
      .map((risk) => String(risk?.id || risk?.raw?.id || "").trim().toUpperCase())
      .filter(Boolean)
  );
  const __familyDistanceSamples = (Array.isArray(sorted) ? sorted : [])
    .map((risk) => {
      const direct = Number(risk?.taskOntologyMeta?.familyDistance);
      if (Number.isFinite(direct)) return direct;
      const meta = Number(risk?.meta?.familyDistance);
      if (Number.isFinite(meta)) return meta;
      const rawMeta = Number(risk?.raw?.meta?.familyDistance);
      return Number.isFinite(rawMeta) ? rawMeta : null;
    })
    .filter((n) => Number.isFinite(n));
  const __closestFamilyDistance = __familyDistanceSamples.length > 0
    ? Math.min(...__familyDistanceSamples)
    : null;
  const __maxFamilyDistance = __familyDistanceSamples.length > 0
    ? Math.max(...__familyDistanceSamples)
    : null;
  const __transitionSignal =
    __sameFamilyContinuityForType === true ||
    __transitionDecisionTypeForType === "CAREER_LADDER_TRANSITION" ||
    Boolean(evidenceFitMeta?.hrTransitionFit) ||
    __closestFamilyDistance === 1;
  const __hardDomainMismatch =
    __riskIdsForBase.has("DOMAIN__MISMATCH__JOB_FAMILY") ||
    __riskIdsForBase.has("GATE__DOMAIN_MISMATCH__JOB_FAMILY") ||
    __maxFamilyDistance >= 2;
  const __criticalGateMismatch =
    __gates.some((risk) => {
      const id = String(risk?.id || "").trim().toUpperCase();
      return (
        id === "GATE__CRITICAL_EXPERIENCE_GAP" ||
        id === "GATE__MUST_HAVE_SKILL" ||
        id === "GATE__DOMAIN_MISMATCH__JOB_FAMILY"
      );
    });
  const __mustHaveGapStrong =
    __riskIdsForBase.has("ROLE_SKILL__MUST_HAVE_MISSING") ||
    __riskIdsForBase.has("GATE__MUST_HAVE_SKILL") ||
    (Number.isFinite(Number(__mustHaveFit)) && Number(__mustHaveFit) < 0.45);
  const __mustHaveGapSoft =
    !__mustHaveGapStrong &&
    Number.isFinite(Number(__mustHaveFit)) &&
    Number(__mustHaveFit) < 0.75;
  const __levelGapStrong = __riskIdsForBase.has("RISK__ROLE_LEVEL_MISMATCH");
  const __ownershipGapStrong =
    __riskIdsForBase.has("RISK__OWNERSHIP_LEADERSHIP_GAP") ||
    __riskIdsForBase.has("OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO") ||
    __riskIdsForBase.has("OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL") ||
    __riskIdsForBase.has("OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL");
  const __evidenceGapStrong =
    __riskIdsForBase.has("TASK__EVIDENCE_TOO_WEAK") ||
    __riskIdsForBase.has("LOW_CONTENT_DENSITY_RISK") ||
    __riskIdsForBase.has("PROCESS_ONLY_RISK") ||
    __riskIdsForBase.has("QUANTIFIED_IMPACT_RISK") ||
    __riskIdsForBase.has("EXECUTION_IMPACT_GAP_RISK") ||
    docAvg >= 0.45 ||
    !__hasTopEvidence;
  const __sameOrAdjacentFamily =
    __sameFamilyContinuityForType === true ||
    __closestFamilyDistance === 0 ||
    __closestFamilyDistance === 1;
  const __strongFitProtected =
    __gates.length === 0 &&
    __hardDomainMismatch !== true &&
    __mustHaveGapStrong !== true &&
    __levelGapStrong !== true &&
    __ownershipGapStrong !== true &&
    __posPct >= 68 &&
    (Number.isFinite(Number(__mustHaveFit)) ? Number(__mustHaveFit) >= 0.8 : true) &&
    docAvg < 0.32 &&
    __hasTopEvidence === true;
  const __nearFitProtected =
    __gates.length === 0 &&
    __hardDomainMismatch !== true &&
    __mustHaveGapStrong !== true &&
    __posPct >= 55 &&
    (Number.isFinite(Number(__mustHaveFit)) ? Number(__mustHaveFit) >= 0.6 : true);
  let __passmapBaseType = null;
  if (__hardDomainMismatch || __criticalGateMismatch) {
    __passmapBaseType = {
      id: "BASE_MISMATCH",
      label: "방향 불일치형",
      oneLiner: "현재 경험 축과 목표 JD 방향이 직접적으로 어긋나 있어, 우선 전환 근거 자체를 다시 세워야 하는 상태입니다.",
    };
  } else if (__transitionSignal && __sameOrAdjacentFamily && !__hardDomainMismatch) {
    __passmapBaseType = {
      id: "BASE_ADJACENT_TRANSITION",
      label: "인접 전환형",
      oneLiner: "같은 family 또는 인접 역할로의 전환 흐름은 읽히며, 연결 증명과 책임 범위 보강이 핵심입니다.",
    };
  } else if (__strongFitProtected) {
    __passmapBaseType = {
      id: "BASE_STRONG_FIT",
      label: "무난 적합형",
      oneLiner: "핵심 방향과 요구 근거가 전반적으로 맞아, 큰 병목 없이 검토 가능한 상태입니다.",
    };
  } else if (__nearFitProtected && !(__mustHaveGapStrong || __levelGapStrong || __ownershipGapStrong || __hardDomainMismatch)) {
    __passmapBaseType = {
      id: "BASE_NEAR_FIT",
      label: "보완 후 유력형",
      oneLiner: "전반적 방향은 맞고 치명 병목은 없지만, 몇 가지 보강 포인트를 선명하게 해주면 해석이 더 강해지는 상태입니다.",
    };
  } else if (__mustHaveGapStrong || __mustHaveGapSoft || __levelGapStrong || __ownershipGapStrong || (__evidenceGapStrong && __hardDomainMismatch !== true)) {
    __passmapBaseType = {
      id: "BASE_CONDITIONAL_FIT",
      label: "조건부 적합형",
      oneLiner: "방향 자체는 완전히 어긋나지 않지만, 핵심 병목을 해소해야 적합 해석이 가능해지는 상태입니다.",
    };
  } else {
    __passmapBaseType = {
      id: "BASE_NEAR_FIT",
      label: "보완 후 유력형",
      oneLiner: "치명 리스크는 강하지 않지만, 핵심 포인트를 조금 더 직접적으로 보강할 필요가 있습니다.",
    };
  }
  const __modifierCandidatesV1 = [
    {
      id: "LEVEL_GAP",
      label: "레벨 간극",
      active: __levelGapStrong,
      weight: 100,
    },
    {
      id: "OWNERSHIP_GAP",
      label: "오너십 간극",
      active: __ownershipGapStrong,
      weight: 92,
    },
    {
      id: "MUST_HAVE_GAP",
      label: "필수요건 간극",
      active: __mustHaveGapStrong || __mustHaveGapSoft,
      weight: __mustHaveGapStrong ? 98 : 78,
    },
    {
      id: "DOMAIN_GAP",
      label: "도메인 간극",
      active: __hardDomainMismatch || (__closestFamilyDistance === 1 && __transitionSignal !== true),
      weight: __hardDomainMismatch ? 96 : 72,
    },
    {
      id: "EVIDENCE_GAP",
      label: "근거 부족",
      active: __evidenceGapStrong,
      weight: 68,
    },
  ];
  let __modifierV1 = __modifierCandidatesV1
    .filter((item) => item.active)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map(({ id, label }) => ({ id, label }));
  const __allowExecutionReady =
    (__passmapBaseType?.id === "BASE_STRONG_FIT" || __passmapBaseType?.id === "BASE_NEAR_FIT") &&
    __gates.length === 0 &&
    __hardDomainMismatch !== true &&
    __mustHaveGapStrong !== true &&
    __levelGapStrong !== true &&
    __ownershipGapStrong !== true &&
    __evidenceGapStrong !== true &&
    (Number.isFinite(Number(__mustHaveFit)) ? Number(__mustHaveFit) >= 0.75 : true) &&
    __posPct >= 65;
  if (__allowExecutionReady && __modifierV1.length < 2) {
    __modifierV1 = [{ id: "EXECUTION_READY", label: "즉시 실행 가능" }, ...__modifierV1].slice(0, 2);
  }
  const __baseTypeReasonPack = {
    gateCount: __gates.length,
    hardDomainMismatch: __hardDomainMismatch,
    criticalGateMismatch: __criticalGateMismatch,
    transitionSignal: __transitionSignal,
    closestFamilyDistance: __closestFamilyDistance,
    maxFamilyDistance: __maxFamilyDistance,
    mustHaveFit: Number.isFinite(Number(__mustHaveFit)) ? Number(__mustHaveFit) : null,
    mustHaveGapStrong: __mustHaveGapStrong,
    levelGap: __levelGapStrong,
    ownershipGap: __ownershipGapStrong,
    evidenceGap: __evidenceGapStrong,
    hasTopEvidence: __hasTopEvidence,
    scorePct: __posPct,
    protection: {
      strongFit: __strongFitProtected,
      nearFit: __nearFitProtected,
      adjacentTransition: __transitionSignal && __sameOrAdjacentFamily && !__hardDomainMismatch,
    },
  };
  const __baseExpressionLevel = __normalizeExpressionLevelFromBand(__passLabels.bandLabel, __posPct);
  const __baseRank = __expressionRank(__baseExpressionLevel);
  let __ceilingRank = __baseRank;
  if (__hasGateSignal) __ceilingRank = Math.min(__ceilingRank, 3);
  if (__hasHighRiskSignal) __ceilingRank = Math.min(__ceilingRank, 2);
  if (__posPct < 45) __ceilingRank = Math.min(__ceilingRank, 1);
  if (__posPct < 30) __ceilingRank = 0;
  const __expressionLevel = __levelFromRank(__ceilingRank);
  const __headlineCap = __expressionLevel;
  const __bandLabelByExpression = {
    strong: __passLabels.bandLabel,
    competitive: "경합 검토형",
    cautious: "근거 확인 필요",
    weak: "보완 필요",
    "high-risk": "리스크 높음",
  };
  const __cappedBandLabel = __bandLabelByExpression[__expressionLevel] || __passLabels.bandLabel;
  const __cappedHeadline = __applyExpressionCeilingText(__passLabels.headline, __expressionLevel);
  const __cappedJudgementLabel = __applyExpressionCeilingText(__passLabels.judgementLabel, __expressionLevel);
  const __cappedTypeTitle = __candidateType || (() => {
    if (__expressionLevel === "strong" || __expressionLevel === "competitive") return __safeTypeTitle;
    if (__expressionLevel === "cautious") return "근거 확인형";
    if (__expressionLevel === "weak") return "보완 필요형";
    return "리스크 높음";
  })();
  const __cappedTypeSubtitle = __applyExpressionCeilingText(__safeTypeSubtitle, __expressionLevel);
  const __cappedInterpretationLabel =
    __applyExpressionCeilingText(__safeInterpretationLabel || interpretation?.label, __expressionLevel);
  const __cappedInterpretationOneLiner =
    __applyExpressionCeilingText(__safeInterpretationOneLiner || interpretation?.oneLiner, __expressionLevel);

  // [PATCH] Interaction hint v1 — append-only, read-only, Top3 정렬 무영향
  const interactionHint = (() => {
    const __arr = Array.isArray(interactions) ? interactions : [];
    if (__arr.length === 0) return null;
    const __ix = __arr[0];
    const __msg =
      __ix?.explain?.why?.[0] ||
      (__ix?.title ? String(__ix.title) : null) ||
      (__ix?.id ? String(__ix.id) : null) ||
      null;
    if (!__msg) return null;
    return { title: "복합 판단", message: __msg };
  })();
  // ✅ PATCH R44 (append-only): derive procurement signals for career interpretation + candidate type label
  const __R44_DOMAIN_LABEL = {
    strategic_sourcing: "전략소싱 중심 구매 경력",
    contract_commercial: "벤더 협상/계약 축",
    purchasing_analytics: "SAP 기반 구매 데이터 분석 축",
    manufacturing_materials: "제조업 자재조달/공급망 문맥",
    direct_procurement: "직접 자재 구매 축",
    indirect_procurement: "간접 구매 운영 축",
    vendor_management: "공급업체/협력사 관리 축",
    cost_management: "원가 절감 축",
    scm_planning: "수급/공급 계획 축",
    supply_risk: "공급망 리스크 관리 축",
    inventory_logistics: "재고/물류 관리 축",
    category_management: "카테고리 전략 관리 축",
  };
  const __procurementDomainHintStr = (() => {
    if (!evidenceFitMeta?.procurementStrongFit) return null;
    const _doms = Array.isArray(evidenceFitMeta.dominantProcurementDomains) ? evidenceFitMeta.dominantProcurementDomains : [];
    const labels = _doms.map((d) => __R44_DOMAIN_LABEL[d]).filter(Boolean).slice(0, 2);
    return labels.length > 0 ? labels.join(" / ") : null;
  })();
  // ✅ PATCH R45 (append-only): explanationMode — procurement strong-fit일 때 "적합→보강" 프레임
  const __explanationMode = (
    evidenceFitMeta?.procurementStrongFit === true &&
    Array.isArray(evidenceFitMeta?.dominantProcurementDomains) &&
    evidenceFitMeta.dominantProcurementDomains.length > 0 &&
    !__hasGateSignal
  ) ? "fit_reinforcement" : (
    evidenceFitMeta?.hrStrongFit === true &&
      Array.isArray(evidenceFitMeta?.dominantHrDomains) &&
      evidenceFitMeta.dominantHrDomains.length > 0 &&
      !__hasGateSignal
  ) ? "hr_fit_reinforcement" : (
    evidenceFitMeta?.hrTransitionFit === true &&
      !__hasGateSignal
  ) ? "hr_transition_reinforcement" : "default";
  const __procurementCandidateTypeLabel = (() => {
    if (!evidenceFitMeta?.procurementStrongFit) return null;
    const _doms = new Set(Array.isArray(evidenceFitMeta.dominantProcurementDomains) ? evidenceFitMeta.dominantProcurementDomains : []);
    if (_doms.size === 0) return null;
    if (_doms.has("strategic_sourcing")) return "전략소싱 적합형";
    if (_doms.has("contract_commercial") && _doms.has("vendor_management")) return "협상/벤더관리 강점형";
    if (_doms.has("purchasing_analytics")) return "구매분석 강점형";
    if (_doms.has("manufacturing_materials") || _doms.has("direct_procurement")) return "제조 자재조달 적합형";
    if (_doms.has("contract_commercial")) return "계약협상 강점형";
    if (_doms.has("vendor_management")) return "벤더관리 강점형";
    if (_doms.has("cost_management")) return "원가절감 강점형";
    return "구매/SCM 적합형";
  })();
  const __hrCandidateTypeLabel = (() => {
    if (!evidenceFitMeta?.hrStrongFit) return null;
    const _doms = new Set(Array.isArray(evidenceFitMeta.dominantHrDomains) ? evidenceFitMeta.dominantHrDomains : []);
    if (_doms.size === 0) return null;
    if (_doms.has("talent_acquisition")) return "채용 실행 강점형";
    if (_doms.has("hr_operations")) return "인사운영 안정형";
    if (_doms.has("compensation_performance")) return "보상/평가 운영형";
    if (_doms.has("hrbp_er")) return "HRBP 조직지원형";
    if (_doms.has("learning_development")) return "교육 운영형";
    return "HR 적합형";
  })();
  const __hrTransitionCandidateTypeLabel = (() => {
    if (!evidenceFitMeta?.hrTransitionFit) return null;
    const _transitionType = String(evidenceFitMeta?.hrTransitionType || "").trim();
    if (_transitionType === "operations_to_hrbp") return "HRBP 전환 준비형";
    if (_transitionType === "operations_to_compensation") return "보상/평가 전환 준비형";
    if (_transitionType === "recruiting_to_hrbp") return "HRBP 전환 탐색형";
    if (_transitionType === "within_hr_transition") return "HR 직무 전환 준비형";
    return "HR 전환 준비형";
  })();
  const __transitionDecisionType = String(evidenceFitMeta?.transitionDecisionType || "").trim();
  const __transitionDecisionPassmapType = (() => {
    if (__transitionDecisionType === "CAREER_LADDER_TRANSITION") {
      return {
        id: "CAREER_LADDER_TRANSITION",
        label: "커리어 확장 전환형",
        description: "현재 JD는 인접 상위 역할로의 전환 케이스로 읽히며, 적합 여부와 별개로 추가 증명 포인트가 함께 검토됩니다.",
      };
    }
    return null;
  })();

  const careerInterpretation = __buildCareerInterpretation({
    sorted: sortedWithNarrative,
    top3WithNarrative,
    explanationPack,
    candidateType: __candidateType,
    posPct: __posPct,
    hasGateSignal: __hasGateSignal,
    careerTimelineInput: careerTimeline,
    // ✅ PATCH R44 (append-only): procurement domain hint for hiringLens text
    procurementDomainHint: __procurementDomainHintStr || undefined,
    // ✅ PATCH R45 (append-only): explanation mode
    explanationMode: __explanationMode,
  });
  // [PATCH] Resume Interpretation Engine v1 (append-only)
  let resumeInterpretation = null;
  try {
    resumeInterpretation = buildResumeInterpretation({
      parsedResume: parsedResume || null,
      roleDepth: null, // careerInterpretation 내부에서 추출
      careerInterpretation,
      leadershipGapSignals: leadershipGapSignals || null,
      careerSignals: careerSignals || null,
      domainSignal: null, // careerInterpretation.generator.factors에서 추출
      structuralPatterns: null,
    });
  } catch { }
  // [PATCH] resumeReadView — UI 표시용 얇은 파생 (append-only)
  let resumeReadView = null;
  try {
    if (resumeInterpretation && typeof resumeInterpretation === "object") {
      const __ri = resumeInterpretation;
      const __seniorityLabel = {
        execution: "실무 수행 중심으로 읽히는 편입니다",
        ownership: "실무를 넘어 일부 주도 경험까지 보이는 편입니다",
        lead: "리드 수준 경험이 비교적 드러나는 편입니다",
        strategic: "전략/의사결정 관여 경험이 비교적 선명합니다",
      };
      const __scopeLabel = {
        individual: "개인 실행 경험 중심으로 읽힙니다",
        cross_functional: "유관부서 협업 범위까지 일부 보입니다",
        team_or_org: "팀 또는 조직 단위 범위가 일부 확인됩니다",
      };
      const __transitionLabel = {
        linear: "커리어 흐름은 비교적 일관되게 이어집니다",
        adjacent_shift: "완전한 전환보다는 인접 영역 이동에 가깝습니다",
        domain_shift: "직무 또는 도메인 이동이 보이는 흐름입니다",
        mixed: "여러 성격의 이동이 함께 보입니다",
      };
      const __items = [];
      const __overallLabel = String(__ri.overallAxis?.label || "").trim();
      if (__overallLabel) __items.push({ key: "overallAxis", text: `전반적 역할: ${__overallLabel}` });
      const __recentLabel = String(__ri.recentAxis?.label || "").trim();
      if (__recentLabel && __recentLabel !== __overallLabel) __items.push({ key: "recentAxis", text: `최근 역할: ${__recentLabel}` });
      const __senLevel = String(__ri.seniorityRead?.level || "").trim();
      if (__senLevel && __seniorityLabel[__senLevel]) __items.push({ key: "seniorityRead", text: __seniorityLabel[__senLevel] });
      const __scopeLevel = String(__ri.scopeRead?.level || "").trim();
      if (__scopeLevel && __scopeLabel[__scopeLevel]) __items.push({ key: "scopeRead", text: __scopeLabel[__scopeLevel] });
      const __transPattern = String(__ri.transitionSummary?.pattern || "").trim();
      if (__transPattern && __transitionLabel[__transPattern]) __items.push({ key: "transitionSummary", text: __transitionLabel[__transPattern] });
      // ✅ PATCH (append-only): richer source prepend — roleDepth evidence + perRiskEvidence.resume
      const __richerItems = [];
      // 1) roleDepth dominantLevel bucket [0].text, 없으면 첫 non-empty bucket
      const __rdEv = (roleDepth?.evidence && typeof roleDepth.evidence === "object") ? roleDepth.evidence : {};
      const __dominantLv = String(roleDepth?.dominantLevel || "").trim();
      const __bucketOrder = __dominantLv
        ? [__dominantLv, ...["strategic", "lead", "ownership", "execution"].filter((b) => b !== __dominantLv)]
        : ["strategic", "lead", "ownership", "execution"];
      for (const __bucket of __bucketOrder) {
        const __arr = Array.isArray(__rdEv[__bucket]) ? __rdEv[__bucket] : [];
        const __ev0 = __arr[0];
        const __evText = String((__ev0 && typeof __ev0 === "object" ? __ev0.text : __ev0) || "").trim();
        if (__evText) { __richerItems.push({ key: "roleDepthEvidence", text: __evText }); break; }
      }
      // 2) perRiskEvidence.resume[0] for top1 risk
      const __top1RiskId = String(top3WithNarrative?.[0]?.id || "").trim();
      const __preTop1 = (__top1RiskId && explanationPack?.perRiskEvidence?.[__top1RiskId] && typeof explanationPack.perRiskEvidence[__top1RiskId] === "object")
        ? explanationPack.perRiskEvidence[__top1RiskId] : {};
      const __preResume0 = String(Array.isArray(__preTop1?.resume) ? (__preTop1.resume[0] || "") : "").trim();
      if (__preResume0) __richerItems.push({ key: "perRiskResume", text: __preResume0 });
      // 중복 제거 후 최대 4개
      const __seenRrvTexts = new Set();
      const __mergedItems = [...__richerItems, ...__items].filter((item) => {
        const t = String(item?.text || "").trim();
        if (!t || __seenRrvTexts.has(t)) return false;
        __seenRrvTexts.add(t);
        return true;
      });
      resumeReadView = {
        title: "현재 이력서는 이렇게 읽힙니다",
        items: __mergedItems.slice(0, 4),
        strengths: Array.isArray(__ri.strengths) ? __ri.strengths.slice(0, 2) : [],
        concerns: Array.isArray(__ri.concerns) ? __ri.concerns.slice(0, 2) : [],
      };
    }
  } catch { }
  const __top3HintLimit = (text, max = 120) => {
    const value = String(text || "").trim();
    return value.length > max ? `${value.slice(0, max).trim()}...` : value;
  };
  const __deriveTop3RelatedAxis = (risk) => {
    const haystack = [
      risk?.id,
      risk?.title,
      risk?.label,
      risk?.name,
      risk?.summary,
      risk?.interviewerView,
      risk?.note,
    ].map((value) => String(value || "").toLowerCase()).join(" ");
    if (/(seniority|level|execution|ownership|lead|연차|리드|주도|레벨)/.test(haystack)) return "level";
    if (/(domain|role|position|career|timeline|전환|도메인|역할|포지션|흐름)/.test(haystack)) return "transition";
    return "";
  };
  const __currentAxisForTop3 = String(careerInterpretation?.currentFlow?.currentAxis || "").trim();
  const __currentLevelLines = String(
    careerInterpretation?.currentLevel?.mainInterpretation ||
    careerInterpretation?.currentLevel?.summary ||
    ""
  )
    .split("\n")
    .map((line) => String(line || "").trim())
    .filter((line) => line && line !== "현재 이력서에서는" && line !== "다만" && line !== "그래서");
  const __currentLevelCore = __currentLevelLines[0] || "현재 이력서 해석";
  const __riskViewByAxis = new Map(
    (Array.isArray(careerInterpretation?.riskView?.items) ? careerInterpretation.riskView.items : [])
      .map((item) => [String(item?.relatedAxis || "").trim(), item])
      .filter(([key]) => key)
  );
  const __buildTop3ExplanationHint = (risk, relatedAxis) => {
    const __riskHaystack = [
      risk?.id,
      risk?.title,
      risk?.label,
      risk?.name,
      risk?.summary,
      risk?.interviewerView,
      risk?.note,
    ].map((value) => String(value || "").toLowerCase()).join(" ");
    if (relatedAxis === "level") {
      if (/(seniority|연차|level|레벨)/.test(__riskHaystack)) {
        return __top3HintLimit("현재 이력서는 상위 역할보다 실행 또는 담당 범위 중심으로 먼저 읽힐 수 있어 이 리스크가 더 보수적으로 해석될 수 있습니다.");
      }
      if (/(lead|ownership|주도|리드)/.test(__riskHaystack)) {
        return __top3HintLimit("주도 경험 신호는 보이더라도 조직 단위 책임 범위까지 바로 연결되지 않으면 이 리스크가 커질 수 있습니다.");
      }
      return __top3HintLimit(
        `현재 이력서는 ${__currentLevelCore} 쪽으로 읽히기 때문에 이 리스크가 더 보수적으로 해석될 수 있습니다.`
      );
    }
    if (relatedAxis === "transition") {
      if (/(domain|role|position|포지션|도메인)/.test(__riskHaystack)) {
        return __top3HintLimit("현재 경험 축과 JD 핵심 역할 축이 직접 맞물리지 않으면 이 리스크가 커질 수 있습니다.");
      }
      if (/(timeline|career|전환|흐름)/.test(__riskHaystack)) {
        return __top3HintLimit("전환 맥락이나 최근 흐름 설명이 약하면 이 리스크가 더 크게 읽힐 수 있습니다.");
      }
      const __axisSource = __currentAxisForTop3 || String(__riskViewByAxis.get("transition")?.title || "").trim();
      if (__axisSource) {
        return __top3HintLimit(
          `현재 경험은 ${__axisSource} 축으로 읽혀 JD 핵심 역할과 연결이 약하면 이 리스크가 커질 수 있습니다.`
        );
      }
    }
    return __top3HintLimit("현재 경험 축과 JD 핵심 역할 사이 연결이 약하면 이 리스크가 커질 수 있습니다.");
  };
  const __buildTop3JdGapHint = (risk, relatedAxis) => {
    const __riskHaystack = [
      risk?.id,
      risk?.title,
      risk?.label,
      risk?.name,
      risk?.summary,
      risk?.interviewerView,
      risk?.note,
    ].map((value) => String(value || "").toLowerCase()).join(" ");
    if (relatedAxis === "level") {
      if (/(seniority|연차|level|레벨)/.test(__riskHaystack)) {
        return "JD는 현재 이력서에서 읽히는 수준보다 더 높은 역할 범위나 리드 경험을 기대할 수 있습니다.";
      }
      if (/(lead|ownership|주도|리드)/.test(__riskHaystack)) {
        return "JD는 담당 경험을 넘어 조직 단위 책임 범위까지 기대할 수 있습니다.";
      }
      return "JD는 현재 이력서에서 읽히는 수준보다 더 높은 역할 범위를 기대할 수 있습니다.";
    }
    if (relatedAxis === "transition") {
      if (/(domain|role|position|포지션|도메인)/.test(__riskHaystack)) {
        return "JD 핵심 역할과 직접 연결되는 경험 근거를 기대할 수 있습니다.";
      }
      if (/(timeline|career|전환|흐름)/.test(__riskHaystack)) {
        return "JD는 전환 이유와 최근 경험의 직접 연결 근거를 함께 볼 수 있습니다.";
      }
      return "JD 핵심 역할과 연결되는 최근 경험 근거를 기대할 수 있습니다.";
    }
    return "";
  };
  // ✅ PATCH (append-only): evidenceFitMeta 기반 explanation 보강 helper
  // 판정/score 변경 없음 — 설명 문장 뒤에 hint만 append
  // meta 없으면 완전 동일 동작 유지
  const __appendExpectationHint = (baseHint, relatedAxis, efMeta) => {
    if (!efMeta || typeof efMeta !== "object" || !efMeta.jdExpectationApplied) return baseHint;
    try {
      // level 리스크: seniorityGapHint 우선
      if (relatedAxis === "level" && efMeta.seniorityGapHint) {
        const base = String(baseHint || "").trim();
        const suffix = String(efMeta.seniorityGapHint).trim();
        return base ? `${base}\n\n${suffix}` : suffix;
      }
      // level/transition 리스크: scopeHint (seniorityGapHint 없을 때만)
      if ((relatedAxis === "level" || relatedAxis === "transition") && efMeta.scopeHint) {
        const base = String(baseHint || "").trim();
        const suffix = String(efMeta.scopeHint).trim();
        return base ? `${base}\n\n${suffix}` : suffix;
      }
      // ✅ PATCH (append-only): criticalMissing 해석문 — 판정용 아닌 설명용
      // seniority/scope hint가 없고, criticalMissing이 1개 이상일 때만 보수적으로 append
      // ✅ PATCH R34: array 소비 → criticalMissingItems 우선, fallback은 criticalMissing(array인 경우만)
      const criticalMissing = Array.isArray(efMeta.criticalMissingItems) ? efMeta.criticalMissingItems
        : (Array.isArray(efMeta.criticalMissing) ? efMeta.criticalMissing : []);
      if (criticalMissing.length > 0) {
        const base = String(baseHint || "").trim();
        // 대표 조건 1개만 자연어화, 나열 금지
        const rep = String(criticalMissing[0] || "").trim();
        const suffix = rep
          ? `이 JD가 중요하게 보는 조건 중 일부는 현재 이력서에서 근거가 약하게 보일 수 있습니다. 특히 ${rep} 관련 표현은 채용 측이 바로 확인하기 어려울 수 있습니다.`
          : "이 JD가 중요하게 보는 조건 중 일부는 현재 이력서에서 직접적인 근거가 약하게 보일 수 있습니다.";
        return base ? `${base}\n\n${suffix}` : suffix;
      }
    } catch { /* silent */ }
    return baseHint;
  };

  // ✅ PATCH (append-only): __buildInterpretationMaterial — 후보자별 원재료 수집
  function __buildInterpretationMaterial({ efMeta, roleDepthObj, careerTimelineObj, top3Arr, expPack }) {
    const __s = (v) => String(v || "").trim();
    const __a = (v) => (Array.isArray(v) ? v : []);
    const __o = (v) => (v && typeof v === "object" ? v : {});
    const ef = __o(efMeta);
    const rd = __o(roleDepthObj);
    const rdEv = __o(rd.evidence);
    const ct = __o(careerTimelineObj);
    const topSignal0 = __o(__a(expPack?.topSignals)[0]);
    const topSignalEv = __o(topSignal0.evidence);
    return {
      jdGap: {
        seniorityGapHint: __s(ef.seniorityGapHint),
        scopeHint: __s(ef.scopeHint),
        // ✅ PATCH R34: criticalMissingItems(array) 우선 소비, 기존 criticalMissing(number) 계약은 건드리지 않음
        criticalMissing: __a(ef.criticalMissingItems).filter(Boolean).slice(0, 3),
        criticalMissingItems: __a(ef.criticalMissingItems).filter(Boolean).slice(0, 5),
        requirementPrioritySummary: __s(ef.requirementPrioritySummary),
      },
      resumeStrength: {
        executionEvidence: __a(rdEv.execution).slice(0, 3),
        ownershipEvidence: __a(rdEv.ownership).slice(0, 3),
        leadEvidence: __a(rdEv.lead).slice(0, 3),
        strategicEvidence: __a(rdEv.strategic).slice(0, 3),
        conservativeReasons: __a(rd.conservativeReasons).filter(Boolean).slice(0, 3),
        missingForNextLevel: __a(rd.missingForNextLevel).filter(Boolean).slice(0, 3),
      },
      careerFlow: {
        startPoint: __s(ct.startPoint),
        currentPoint: __s(ct.currentPoint),
        recentAxis: __s(ct.recentAxis),
        overallAxis: __s(ct.overallAxis),
        transitions: __a(ct.transitions).map((t) => __s(t?.summary || t)).filter(Boolean).slice(0, 3),
        hasGapConcern: Boolean(ct.hasGapConcern),
      },
      top3Narratives: __a(top3Arr).map((risk) => {
        const n = __o(risk?.narrative);
        return {
          riskId: __s(risk?.id),
          headline: __s(n.headline),
          interviewerView: __s(n.interviewerView || risk?.interviewerView),
          interviewPrepHint: __s(n.interviewPrepHint || risk?.interviewPrepHint),
        };
      }),
      jdEvidenceRaw: __a(topSignalEv.jd).filter(Boolean).slice(0, 3),
      resumeEvidenceRaw: __a(topSignalEv.resume).filter(Boolean).slice(0, 3),
    };
  }

  // ✅ PATCH (append-only): __buildCausePack — 슬롯별 해석 재료 구조화
  function __buildCausePack({ intMat, currentFlowObj, top3Arr }) {
    const __s = (v) => String(v || "").trim();
    const __a = (v) => (Array.isArray(v) ? v : []);
    const __o = (v) => (v && typeof v === "object" ? v : {});
    const mat = __o(intMat);
    const jdGap = __o(mat.jdGap);
    const rs = __o(mat.resumeStrength);
    const cf = __o(mat.careerFlow);
    const currentFlow = __o(currentFlowObj);
    const readableFlow = (() => {
      if (cf.startPoint && cf.currentPoint && cf.startPoint !== cf.currentPoint) return `${cf.startPoint} → ${cf.currentPoint}`;
      const _axis = cf.recentAxis || "";
      const _summary = __s(currentFlow?.summary);
      const _bridge = __s(currentFlow?.bridgeSummary);
      if (_axis && (_summary.includes(_axis) || _bridge.includes(_axis))) return "";
      return _axis;
    })();
    const resumeReadAs = (() => {
      for (const bucket of [rs.strategicEvidence, rs.leadEvidence, rs.ownershipEvidence, rs.executionEvidence]) {
        const text = __s(__a(bucket)[0]?.text || __a(bucket)[0]);
        if (text) return text;
      }
      return "";
    })();
    const __candidateFlowHint = [
      __isGenericFlowUnreadableText(currentFlow?.summary) ? "" : __s(currentFlow?.summary),
      __isGenericFlowUnreadableText(currentFlow?.bridgeSummary) ? "" : __s(currentFlow?.bridgeSummary),
      readableFlow,
      resumeReadAs,
    ].filter(Boolean)[0] || "";
    const whyThisType = (() => {
      // ✅ PATCH (append-only): candidate-side story 우선 — flow/resumeReadAs > human-readable risk > JD gap
      const __top1Id = __s(__a(mat.top3Narratives)[0]?.riskId || __a(top3Arr)[0]?.id);
      if (__candidateFlowHint) return __candidateFlowHint;
      const __nar0Headline = __s(__a(mat.top3Narratives)[0]?.headline);
      if (__nar0Headline) return __nar0Headline;
      const __nar0View = __s(__a(mat.top3Narratives)[0]?.interviewerView);
      if (__nar0View) return __nar0View;
      const __perEv = (explanationPack?.perRiskEvidence?.[__top1Id] && typeof explanationPack.perRiskEvidence[__top1Id] === "object") ? explanationPack.perRiskEvidence[__top1Id] : {};
      const __perRs0 = __s(__a(__perEv?.resume)[0]);
      if (__perRs0) return __perRs0;
      const __perJd0 = __s(__a(__perEv?.jd)[0]);
      // ✅ PATCH R31 (append-only): DOMAIN_ROLE_MISMATCH top1 — jd+resume 합쳐 브릿지 증거 부족 진단으로 완성
      if (__top1Id === "DOMAIN_ROLE_MISMATCH") {
        // ✅ PATCH R36: explain.userReason → interviewerView → perRiskEvidence 순 우선순위
        const __top1Risk = __o(__a(top3Arr)[0]);
        const __userReason = __s(__top1Risk?.explain?.userReason);
        if (__userReason) return __userReason;
        const __interviewerView = __s(__top1Risk?.interviewerView);
        if (__interviewerView) return __interviewerView;
        if (__perJd0) {
          const __perRs0 = __s(__a(__perEv?.resume)[0]);
          return __perRs0
            ? `${__perJd0} 반면 ${__perRs0} — 도메인 브릿지 증거가 필요합니다.`
            : `${__perJd0} — 도메인 브릿지 증거가 필요합니다.`;
        }
      }
      if (__perJd0) return __perJd0;
      // ✅ PATCH R34: requirementPrioritySummary — 구체 문장 있을 때 seniorityGapHint보다 우선
      if (jdGap.requirementPrioritySummary) return jdGap.requirementPrioritySummary;
      if (jdGap.seniorityGapHint) return jdGap.seniorityGapHint;
      if (jdGap.scopeHint) return jdGap.scopeHint;
      const crit = __a(jdGap.criticalMissing);
      if (crit.length > 0) return `이 JD에서는 ${crit[0]} 관련 경험을 중요하게 볼 수 있습니다.`;
      return "";
    })();
    const __fallbackJdConflictPoints = (() => {
      const __ef = evidenceFitMeta && typeof evidenceFitMeta === "object" ? evidenceFitMeta : null;
      if (!readableFlow || !__ef) return [];
      const __jdFocusSummary = __s(__ef.jdFocusSummary);
      if (__jdFocusSummary) return [__jdFocusSummary];
      const __domainDirectnessHint = __s(__ef.domainDirectnessHint);
      if (__domainDirectnessHint) return [__domainDirectnessHint];
      return ["JD 핵심 책임과 직접 연결된 경험 근거가 약합니다."];
    })();
    // ── Round 9: causePack.type semantic decomposition ───────────────────
    // Each slot owns ONE semantic domain. whyThisType becomes compatibility alias only.
    //
    // typeIdentityNarrative: identity/axis read — NOT burden, NOT JD gap, NOT transition cost
    const typeIdentityNarrative = __candidateFlowHint || resumeReadAs || "";

    // proofBurdenNarrative: evidence/proof weakness — NOT identity, NOT JD gap
    const proofBurdenNarrative = __a(rs.missingForNextLevel).slice(0, 2).join(" / ");

    // jdGapNarrative: JD directness / must-have alignment — NOT identity, NOT generic burden
    const jdGapNarrative = jdGap.requirementPrioritySummary
      || [jdGap.seniorityGapHint, jdGap.scopeHint].filter(Boolean).join(" / ")
      || (__a(jdGap.criticalMissing).length > 0
        ? `이 JD에서는 ${__a(jdGap.criticalMissing)[0]} 관련 경험을 중요하게 볼 수 있습니다.`
        : "");

    // transitionNarrative: pivot/adjacency/transition cost — NOT identity, NOT proof burden
    const transitionNarrative = (() => {
      const __transitions = __a(cf.transitions).slice(0, 2)
        .map((t) => __s(t?.summary || t)).filter(Boolean);
      if (__transitions.length > 0) return __transitions.join(" → ");
      const __bridge = __s(currentFlow?.bridgeSummary);
      return (__bridge && !__isGenericFlowUnreadableText(__bridge)) ? __bridge : "";
    })();

    return {
      type: {
        // ── compatibility alias (identity-first; mixed blob as final fallback only) ──
        whyThisType: typeIdentityNarrative || whyThisType,
        narrative:   typeIdentityNarrative || whyThisType,
        // ── decomposed semantic slots ──
        typeIdentityNarrative,
        proofBurdenNarrative,
        jdGapNarrative,
        transitionNarrative,
        // ── existing fields preserved ──
        jdGap: [jdGap.seniorityGapHint, jdGap.scopeHint].filter(Boolean).concat(__a(jdGap.criticalMissing).slice(0, 2)).slice(0, 2).join(" / "),
        resumeReadAs,
        proofBurden: __a(rs.missingForNextLevel).slice(0, 2).join(" / "),
      },
      currentFlow: {
        readableFlow,
        breakpoints: __a(cf.transitions).slice(0, 3),
        // ✅ PATCH (append-only): DOMAIN_ROLE_MISMATCH top1 시 perRiskEvidence.jd[0] 우선 주입
        jdConflictPoints: (() => {
          const __top1Id = __s(__a(mat.top3Narratives)[0]?.riskId || __a(top3Arr)[0]?.id);
          if (__top1Id === "DOMAIN_ROLE_MISMATCH") {
            // ✅ PATCH R36: explain.userReason → interviewerView → perRiskEvidence 순 우선순위
            const __dmRisk = __o(__a(top3Arr)[0]);
            const __dmUserReason = __s(__dmRisk?.explain?.userReason);
            const __dmInterviewerView = __s(__dmRisk?.interviewerView);
            const __dmEv = (explanationPack?.perRiskEvidence?.[__top1Id] && typeof explanationPack.perRiskEvidence[__top1Id] === "object")
              ? explanationPack.perRiskEvidence[__top1Id] : {};
            const __dmJd0 = __s(__a(__dmEv?.jd)[0]);
            const __dmResume0 = __s(__a(__dmEv?.resume)[0]);
            const __dmFirst = __dmInterviewerView || __dmJd0;
            const __dmSecond = __dmResume0 || __dmUserReason;
            // ✅ PATCH R29: jd[0] + resume[0] 양쪽 반영 → R36: interviewerView 우선 적용
            if (__dmFirst) return [__dmFirst, ...(__dmSecond ? [__dmSecond] : [jdGap.seniorityGapHint, jdGap.scopeHint].filter(Boolean))].slice(0, 2);
          }
          // ✅ PATCH R34: requirementPrioritySummary 우선, 없으면 기존 fallback
          const __base = [jdGap.requirementPrioritySummary || jdGap.seniorityGapHint, jdGap.scopeHint].filter(Boolean).slice(0, 2);
          return __base.length > 0 ? __base : __fallbackJdConflictPoints;
        })(),
      },
      top3: __a(mat.top3Narratives).map((n, __i) => {
        const __rawRisk = __o(__a(top3Arr)[__i]);
        const __perJd = __a(__rawRisk.jdEvidence).filter(Boolean).slice(0, 2);
        const __perResume = __a(__rawRisk.resumeEvidence).filter(Boolean).slice(0, 2);
        return {
          riskId: n.riskId,
          headline: n.headline,
          interviewerView: n.interviewerView,
          interviewPrepHint: n.interviewPrepHint,
          // ✅ PATCH (append-only): per-risk evidence 우선, 없으면 shared fallback
          jdEvidence: __perJd.length ? __perJd : __a(mat.jdEvidenceRaw).slice(0, 2),
          resumeEvidence: __perResume.length ? __perResume : __a(mat.resumeEvidenceRaw).slice(0, 2),
        };
      }),
      action: (() => {
        // ✅ PATCH R31 (append-only): DOMAIN_ROLE_MISMATCH top1 시 evidence-based bridge action 우선 주입
        const __actTop1Id = __s(__a(mat.top3Narratives)[0]?.riskId || __a(top3Arr)[0]?.id);
        if (__actTop1Id === "DOMAIN_ROLE_MISMATCH") {
          // ✅ PATCH R36: interviewPrepHint 최우선 → perRiskEvidence 기반 bridge → generic fallback
          const __actRisk = __o(__a(top3Arr)[0]);
          const __actPrepHint = __s(__actRisk?.interviewPrepHint);
          const __actTransitionBurden = __s(__actRisk?.transitionBurden);
          const __actEv = (explanationPack?.perRiskEvidence?.["DOMAIN_ROLE_MISMATCH"] && typeof explanationPack.perRiskEvidence["DOMAIN_ROLE_MISMATCH"] === "object")
            ? explanationPack.perRiskEvidence["DOMAIN_ROLE_MISMATCH"] : {};
          const __actJdStr = __s(__a(__actEv?.jd)[0]);
          const __actRsStr = __s(__a(__actEv?.resume)[0]);
          const __actNote = __s(__actEv?.note);
          const __bridgeActions = [
            __actPrepHint || null,
            __actTransitionBurden || null,
            !__actPrepHint && __actJdStr ? `${__actJdStr} — 이 도메인에서 요구하는 업무 맥락을 이력서 bullet에서 먼저 확인하게 됩니다.` : null,
            !__actPrepHint && __actRsStr ? `${__actRsStr} — 기존 경험 중 JD 도메인과 연결 가능한 장면을 구체적으로 드러내세요.` : null,
            __actNote ? `(참고: ${__actNote})` : null,
          ].filter(Boolean);
          return {
            linkedSuspicions: __bridgeActions.length ? __bridgeActions.slice(0, 3) : __a(mat.top3Narratives).map((n) => n.interviewPrepHint).filter(Boolean).slice(0, 3),
            linkedMissingProof: __a(rs.missingForNextLevel).slice(0, 3),
          };
        }
        return {
          linkedSuspicions: __a(mat.top3Narratives).map((n) => n.interviewPrepHint).filter(Boolean).slice(0, 3),
          linkedMissingProof: __a(rs.missingForNextLevel).slice(0, 3),
        };
      })(),
    };
  }

  const __top3WithInterpretation = top3WithNarrative.map((risk) => {
    const relatedAxis = __deriveTop3RelatedAxis(risk);
    const __displayRelabelMeta = (() => {
      const __riskId = String(risk?.id || "").trim();
      if (__riskId !== "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY") return null;
      if (relatedAxis !== "transition") return null;

      const __ef = evidenceFitMeta && typeof evidenceFitMeta === "object" ? evidenceFitMeta : null;
      if (!__ef) return null;
      const __overlay = __ef.responsibilityOverlay && typeof __ef.responsibilityOverlay === "object"
        ? __ef.responsibilityOverlay
        : null;
      if (__overlay?.familyAligned !== true) return null;

      const __hasOwnershipOrStrategicGap =
        String(__overlay?.ownershipGapLevel || "").trim() === "moderate" ||
        String(__overlay?.ownershipGapLevel || "").trim() === "high" ||
        __overlay?.strategicGap === true;
      if (!__hasOwnershipOrStrategicGap) return null;

      return {
        displayTitle: "동일 직무군 내 책임 확장 근거 부족",
        displaySummary: "동일 직무군 내 이동 자체는 자연스럽지만, JD가 요구하는 책임 범위와 의사결정 스코프를 보여주는 근거는 아직 부족합니다.",
      };
    })();
    const __riskTopSignal = __expTopSignalsById.get(String(risk?.id || "").trim()) || null;
    const __narrativeHeadline = __top3HintLimit(String(risk?.narrative?.headline || "").trim());
    const __narrativeInterviewerView = __top3HintLimit(String(risk?.narrative?.interviewerView || risk?.interviewerView || "").trim());
    const __efHint = (() => {
      const __ef = evidenceFitMeta && typeof evidenceFitMeta === "object" ? evidenceFitMeta : null;
      if (!__ef) return "";
      const __candidates = [
        __ef.seniorityGapHint,
        __ef.scopeHint,
        Array.isArray(__ef.criticalMissing) ? __ef.criticalMissing[0] : "",
      ];
      for (const __candidate of __candidates) {
        const __text = __top3HintLimit(String(__candidate || "").trim());
        if (__text) return __text;
      }
      return "";
    })();
    const __evidenceLinkHint = (() => {
      const __jdText = String(
        (__riskTopSignal?.evidence && Array.isArray(__riskTopSignal.evidence.jd)
          ? __riskTopSignal.evidence.jd[0]
          : risk?.jdEvidence?.[0]) || ""
      ).trim();
      const __resumeText = String(
        (__riskTopSignal?.evidence && Array.isArray(__riskTopSignal.evidence.resume)
          ? __riskTopSignal.evidence.resume[0]
          : risk?.resumeEvidence?.[0]) || ""
      ).trim();
      const __parts = [];
      if (__jdText) __parts.push(`JD: ${__jdText}`);
      if (__resumeText) __parts.push(`이력서: ${__resumeText}`);
      return __top3HintLimit(__parts.join(" / ").trim());
    })();
    const __preferredExplanationHint =
      __narrativeHeadline ||
      __narrativeInterviewerView ||
      __efHint ||
      __evidenceLinkHint;
    // ✅ PATCH (append-only): interviewerView — narrative > risk 원본 > ID 기반 상수 > null
    const __interviewerView =
      String(risk?.narrative?.interviewerView || "").trim() ||
      String(risk?.interviewerView || "").trim() ||
      __TOP3_INTERVIEWER_VIEW[String(risk?.id || "").trim()] ||
      null;
    // ✅ PATCH (append-only): per-risk evidence SSOT — perRiskEvidence(ALL) > __riskTopSignal(top3) > []
    const __riskId = String(risk?.id || "").trim();
    const __perRiskEv = (explanationPack?.perRiskEvidence?.[__riskId] && typeof explanationPack.perRiskEvidence[__riskId] === "object") ? explanationPack.perRiskEvidence[__riskId] : {};
    const __canonicalHeadline =
      String(__displayRelabelMeta?.displayTitle || risk?.displayTitle || risk?.title || risk?.label || risk?.name || "").trim() || null;
    const __canonicalSummarySource = (() => {
      const __displaySummary = String(__displayRelabelMeta?.displaySummary || risk?.displaySummary || "").trim();
      if (__displaySummary) return { key: "displaySummary", text: __displaySummary };

      const __hintSummary = String(
        __appendExpectationHint(
          __preferredExplanationHint || __buildTop3ExplanationHint(risk, relatedAxis),
          relatedAxis,
          evidenceFitMeta
        ) || ""
      ).trim();
      if (__hintSummary) return { key: "explanationHint", text: __hintSummary };

      const __localInterviewerView = String(risk?.narrative?.interviewerView || risk?.interviewerView || "").trim();
      if (__localInterviewerView && __localInterviewerView !== (__TOP3_INTERVIEWER_VIEW[__riskId] || "")) {
        return { key: "interviewerView", text: __localInterviewerView };
      }

      return { key: null, text: null };
    })();
    const __canonicalSupportingEvidenceSource = (() => {
      const __resumeEv = Array.isArray(__perRiskEv?.resume) ? String(__perRiskEv.resume[0] || "").trim() : "";
      if (__resumeEv) return { key: "resumeEvidence", text: __resumeEv };

      const __jdEv = Array.isArray(__perRiskEv?.jd) ? String(__perRiskEv.jd[0] || "").trim() : "";
      if (__jdEv) return { key: "jdEvidence", text: __jdEv };

      const __riskSignalResume = Array.isArray(__riskTopSignal?.evidence?.resume) ? String(__riskTopSignal.evidence.resume[0] || "").trim() : "";
      if (__riskSignalResume) return { key: "resumeEvidence", text: __riskSignalResume };

      const __riskSignalJd = Array.isArray(__riskTopSignal?.evidence?.jd) ? String(__riskTopSignal.evidence.jd[0] || "").trim() : "";
      if (__riskSignalJd) return { key: "jdEvidence", text: __riskSignalJd };

      const __jdGapHint = String(__buildTop3JdGapHint(risk, relatedAxis) || "").trim();
      if (__jdGapHint) return { key: "jdGapHint", text: __jdGapHint };

      return { key: null, text: null };
    })();
    const __canonicalCard = {
      headline: __canonicalHeadline,
      summary: __canonicalSummarySource.text,
      supportingEvidence: __canonicalSupportingEvidenceSource.text,
      sourceKey: __canonicalSummarySource.key || __canonicalSupportingEvidenceSource.key || null,
    };
    return {
      ...(risk && typeof risk === "object" ? risk : {}),
      relatedAxis,
      displayTitle: __displayRelabelMeta?.displayTitle || risk?.displayTitle,
      displaySummary: __displayRelabelMeta?.displaySummary || risk?.displaySummary,
      explanationHint: __appendExpectationHint(
        __preferredExplanationHint || __buildTop3ExplanationHint(risk, relatedAxis),
        relatedAxis,
        evidenceFitMeta
      ),
      jdGapHint: __buildTop3JdGapHint(risk, relatedAxis),
      interviewerView: __interviewerView,
      jdEvidence: Array.isArray(__perRiskEv?.jd) ? __perRiskEv.jd.filter(Boolean).slice(0, 2)
        : Array.isArray(__riskTopSignal?.evidence?.jd) ? __riskTopSignal.evidence.jd.filter(Boolean).slice(0, 2)
        : [],
      resumeEvidence: Array.isArray(__perRiskEv?.resume) ? __perRiskEv.resume.filter(Boolean).slice(0, 2)
        : Array.isArray(__riskTopSignal?.evidence?.resume) ? __riskTopSignal.evidence.resume.filter(Boolean).slice(0, 2)
        : [],
      canonicalCard: __canonicalCard,
    };
  });

  // ✅ PATCH (append-only): interpretationMaterial + causePack 수집
  const interpretationMaterial = __buildInterpretationMaterial({
    efMeta: evidenceFitMeta,
    roleDepthObj: careerInterpretation?.currentLevel?.roleDepth,
    careerTimelineObj: careerInterpretation?.careerTimeline,
    top3Arr: top3WithNarrative,
    expPack: explanationPack,
  });
  const causePack = __buildCausePack({
    intMat: interpretationMaterial,
    currentFlowObj: careerInterpretation?.currentFlow,
    top3Arr: __top3WithInterpretation,
  });
  const __fixPriorityTop3V1 = (() => {
    const src = Array.isArray(__top3WithInterpretation) ? __top3WithInterpretation : [];
    if (__passmapBaseType?.id === "BASE_STRONG_FIT") {
      return src.filter((item) => {
        const sc = __getScore01(item);
        const pr = __getPriority(item);
        return item?.gateTriggered === true || sc >= 0.45 || pr >= 75;
      }).slice(0, 2);
    }
    if (__passmapBaseType?.id === "BASE_NEAR_FIT") {
      return src.filter((item) => {
        const sc = __getScore01(item);
        const pr = __getPriority(item);
        return item?.gateTriggered === true || sc >= 0.35 || pr >= 65;
      }).slice(0, 2);
    }
    return src.slice(0, 3);
  })();

  // ✅ PATCH (append-only): causePack → Type / currentFlow 슬롯 연결
  // 기존 title/typeId/summary는 유지 — hint/jdGapSummary/proofBurden/bridgeSummary 등 새 필드만 추가
  try {
    const __cpType = causePack?.type && typeof causePack.type === "object" ? causePack.type : {};

    // userType에 해석 재료 연결 (기존 title/description 유지)
    if (userType && typeof userType === "object") {
      if (__cpType.whyThisType) userType.hint = String(__cpType.whyThisType).trim();
      if (__cpType.jdGap) userType.jdGapSummary = String(__cpType.jdGap).trim();
      if (__cpType.resumeReadAs) userType.resumeReadAs = String(__cpType.resumeReadAs).trim();
      if (__cpType.proofBurden) userType.proofBurden = String(__cpType.proofBurden).trim();
      if (__cpType.narrative) userType.typeNarrative = String(__cpType.narrative).trim();
    }

    // careerInterpretation.currentLevel에 해석 재료 연결
    if (__cpType.whyThisType && careerInterpretation?.currentLevel && typeof careerInterpretation.currentLevel === "object") {
      const __cl = careerInterpretation.currentLevel;
      // interpretedSummary: whyThisType 우선, fallback → 기존 summary
      if (!__cl.interpretedSummary) {
        __cl.interpretedSummary = String(__cpType.whyThisType).trim() || __cl.summary;
      }
      // causeSummary: whyThisType + proofBurden 조합
      if (!__cl.causeSummary) {
        const __csParts = [String(__cpType.whyThisType || "").trim(), String(__cpType.proofBurden || "").trim()].filter(Boolean);
        if (__csParts.length > 0) __cl.causeSummary = __csParts.join(" ");
      }
    }

    // careerInterpretation.currentFlow에 해석 재료 연결
    const __cpCf = causePack?.currentFlow && typeof causePack.currentFlow === "object" ? causePack.currentFlow : {};
    if (careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
      const __cf = careerInterpretation.currentFlow;
        // ✅ PATCH (append-only): bridgeSummary — candidate flow only
        if (!__cf.bridgeSummary) {
          const __trans0 = String(interpretationMaterial?.careerFlow?.transitions?.[0] || "").trim();
          const __rf = String(__cpCf.readableFlow || "").trim();
          const __flowSummary = String(careerInterpretation?.currentFlow?.summary || "").trim();
          const __sameAxisFlow = __hasCollapsedFlowAxis([
            __cf?.startPoint,
            __cf?.currentPoint,
            __cf?.recentAxis,
            __cf?.overallAxis,
            __cpCf.readableFlow,
          ]);
          const __bridgeSource = __sameAxisFlow
            ? "같은 경험 축은 보이지만 JD 핵심 역할과 직접 연결되는 근거 보강이 필요합니다."
            : (__trans0 || __rf || __flowSummary);
          if (__bridgeSource) __cf.bridgeSummary = __bridgeSource;
        }
      // jdConflictSummary: 첫 번째 JD 충돌 포인트
      if (!__cf.jdConflictSummary && __cpCf.jdConflictPoints?.length) {
        __cf.jdConflictSummary = String(__cpCf.jdConflictPoints[0] || "").trim();
      }
      // breakpoints: careerFlow transition 요약
      if (!__cf.breakpoints && Array.isArray(__cpCf.breakpoints) && __cpCf.breakpoints.length > 0) {
        __cf.breakpoints = __cpCf.breakpoints.slice(0, 3);
      }
    }
  } catch { /* silent — 기존 슬롯 동작 보호 */ }

  // ✅ PATCH R63 (append-only): HR narrative priority override
  try {
    if (__explanationMode === "hr_fit_reinforcement") {
      const _meta = evidenceFitMeta || {};
      const _hrNarrative = String(_meta.hrNarrative || "").trim();
      const _hrIdentity = String(_meta.hrFunctionalIdentity || "").trim();
      const _hrScope = String(_meta.hrScopeHint || "").trim();
      const _hrBurden = String(_meta.hrProofBurdenHint || "").trim();
      const _hrDirectness = String(_meta.hrDomainDirectnessHint || "").trim();

      if (_hrIdentity && userType && typeof userType === "object") {
        userType.hrFunctionalIdentity = _hrIdentity;
      }

      if (_hrNarrative && causePack?.type && typeof causePack.type === "object") {
        causePack.type.whyThisType = _hrNarrative;
      }

      if (_hrScope || _hrBurden) {
        const _flowText = [_hrScope, _hrBurden].filter(Boolean).join(" ").trim();
        if (_flowText && careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
          careerInterpretation.currentFlow.summary = _flowText;
        }
      }

      if (_hrDirectness && causePack?.type && typeof causePack.type === "object") {
        const _existing = String(causePack.type.whyThisType || "").trim();
        if (!_existing.includes(_hrDirectness)) {
          causePack.type.whyThisType = (_existing ? `${_existing} ${_hrDirectness}` : _hrDirectness).trim();
        }
      }
    }
  } catch {
    // silent fallback
  }

  // PATCH R68 (append-only): HR transition narrative priority override
  try {
    if (__explanationMode === "hr_transition_reinforcement") {
      const _transitionType = String(evidenceFitMeta?.hrTransitionType || "").trim();
      const _transitionGap = String(evidenceFitMeta?.hrTransitionGap || "").trim();
      const _hrNarrative = String(evidenceFitMeta?.hrNarrative || "").trim();
      const _hrDirectness = String(evidenceFitMeta?.hrDomainDirectnessHint || "").trim();
      const _hrScope = String(evidenceFitMeta?.hrScopeHint || "").trim();
      const _hrBurden = String(evidenceFitMeta?.hrProofBurdenHint || "").trim();
      const _hrIdentity = String(evidenceFitMeta?.hrFunctionalIdentity || "").trim();
      const _doms = Array.isArray(evidenceFitMeta?.dominantHrDomains)
        ? evidenceFitMeta.dominantHrDomains.map((d) => String(d || "").trim()).filter(Boolean)
        : [];
      const _domLabelMap = {
        talent_acquisition: "채용 실행",
        hr_operations: "HR Operations",
        compensation_performance: "성과/보상 운영",
        hrbp_er: "HRBP/ER",
        learning_development: "교육 운영",
      };
      const _domLabel = _doms.map((d) => _domLabelMap[d]).filter(Boolean).slice(0, 2).join(", ");
      let _transitionNarrative = "";
      let _flowSummary = "";

      if (_transitionType === "operations_to_hrbp") {
        _transitionNarrative = _hrNarrative || "현재 이력서는 HR Operations 중심 경험으로 읽히지만, 이 JD는 HRBP 수준의 조직, 성과, 보상, ER ownership을 요구합니다. 따라서 같은 HR군 내 전환 후보이며, 전략 및 인력 운영 책임 범위 보강이 핵심입니다.";
        _flowSummary = [_hrScope, _hrBurden].filter(Boolean).join(" ").trim() || "운영형 HR 경험은 확인되지만, 조직 전략, 성과관리, 보상, ER ownership은 추가 증명이 필요합니다.";
      } else if (_transitionType === "operations_to_compensation") {
        _transitionNarrative = "현재 이력서는 HR Operations 중심 경험으로 읽히지만, 이 JD는 평가 및 보상 운영 ownership을 직접 요구합니다. 따라서 같은 HR군 내 전환 후보이며, 성과관리 체계와 보상 운영 범위 보강이 핵심입니다.";
        _flowSummary = "HR 운영 경험은 확인되지만, 평가 체계 운영과 보상 review ownership은 추가 증명이 필요합니다.";
      } else if (_transitionType === "recruiting_to_hrbp") {
        _transitionNarrative = "현재 이력서는 채용 실행 중심 경험으로 읽히지만, 이 JD는 HRBP 수준의 조직 지원과 employee relations ownership을 요구합니다. 따라서 같은 HR군 내 전환 후보이며, 조직 지원 범위 보강이 핵심입니다.";
        _flowSummary = "채용 실행 경험은 확인되지만, 조직 지원과 employee relations ownership은 추가 증명이 필요합니다.";
      } else {
        const _identityPrefix = _hrIdentity || (_domLabel ? `${_domLabel} 중심 경험` : "현재 HR 경험");
        _transitionNarrative = `${_identityPrefix}으로 읽히지만, 이 JD는 같은 HR family 안에서도 인접한 다른 책임 범위를 요구합니다. 따라서 HR 전환 후보이며, JD 핵심 ownership을 직접 연결하는 설명 보강이 필요합니다.`;
        _flowSummary = "현재 HR 실행 경험은 확인되지만, JD 핵심 책임 범위 ownership은 추가 증명이 필요합니다.";
      }

      if (_transitionGap) {
        _transitionNarrative = `${_transitionNarrative} ${_transitionGap}`.trim();
        _flowSummary = `${_flowSummary} ${_transitionGap}`.trim();
      }

      if (_transitionNarrative && causePack?.type && typeof causePack.type === "object") {
        causePack.type.transitionNarrative = _transitionNarrative;
      }

      if (_flowSummary && careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
        careerInterpretation.currentFlow.summary = _flowSummary;
        if (_transitionType === "operations_to_hrbp" && _hrDirectness) {
          careerInterpretation.currentFlow.bridgeSummary = _hrDirectness;
        }
      }
    }
  } catch {
    // silent fallback
  }

  // ✅ PATCH R43 (append-only): procurement domain strong-fit → description 보강
  // procurementStrongFit 케이스에서 generic 문장 대신 domain-specific 축 드러내기
  try {
    if (evidenceFitMeta?.procurementStrongFit === true) {
      const _doms = Array.isArray(evidenceFitMeta.dominantProcurementDomains) ? evidenceFitMeta.dominantProcurementDomains : [];
      const _DOMAIN_LABEL = {
        strategic_sourcing: "전략소싱 중심 구매 경력",
        contract_commercial: "벤더 협상/계약 축",
        purchasing_analytics: "SAP 기반 구매 데이터 분석 축",
        manufacturing_materials: "제조업 자재조달/공급망 문맥",
        direct_procurement: "직접 자재 구매 축",
        indirect_procurement: "간접 구매 운영 축",
        vendor_management: "공급업체/협력사 관리 축",
        cost_management: "원가 절감 축",
        scm_planning: "수급/공급 계획 축",
        supply_risk: "공급망 리스크 관리 축",
        inventory_logistics: "재고/물류 관리 축",
        category_management: "카테고리 전략 관리 축",
      };
      const _domLabels = _doms.map((d) => _DOMAIN_LABEL[d]).filter(Boolean);
      if (_domLabels.length > 0) {
        const _procHint = _domLabels.slice(0, 2).join(" / ");
        // userType에 procurement domain hint 추가 (기존 hint/description 유지)
        if (userType && typeof userType === "object") {
          userType.procurementDomainHint = _procHint;
          if (!userType.hint) userType.hint = _procHint;
        }
        // careerInterpretation.currentFlow.bridgeSummary에 주입 (비어있는 경우만)
        if (careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object"
            && !careerInterpretation.currentFlow.bridgeSummary) {
          careerInterpretation.currentFlow.bridgeSummary = _procHint;
        }
      }
    }
  } catch { /* silent — procurement domain hint 실패 시 기존 슬롯 보호 */ }

  // ── Phase 11-3 (complete): narrativeContext → currentFlow summary precedence switch ──
  // new-primary when summary is empty OR generic/fallback; legacy-fallback when summary is specific.
  // No score/gate/UI structure change.
  try {
    // Generic/fallback detector for Surface A summary.
    // Returns true when the text is clearly non-specific and safe to override.
    // Conservative: only exact known generic fallback phrases — no over-broad matching.
    const __isGenericFlowSummary = (text) => {
      const s = String(text || "").trim();
      if (!s) return true;
      const __genericPatterns = [
        /하나의 중심축으로 읽기 어렵/,
        /상반된 신호가 함께 존재/,
        /단정적 해석이 어렵/,
        /현재 이력서만으로는/,
      ];
      return __genericPatterns.some((re) => re.test(s));
    };

    const __nc = interpretationPack?.secondarySources?.candidateAxisPack?.narrativeContext ?? null;
    if (__nc && careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
      const __cf = careerInterpretation.currentFlow;
      const __existingSummary = String(__cf.summary || "").trim();
      const __dist = __nc.familyDistance ?? "unclear_family";
      const __friction = Array.isArray(__nc.boundaryFrictionSignals) ? __nc.boundaryFrictionSignals : [];
      const __sharedFamilies = Array.isArray(__nc.sharedFamilies) ? __nc.sharedFamilies : [];

      if (__dist !== "unclear_family") {
        const __distLabel = {
          same_family:       "같은 직무군 내 이동",
          adjacent_family:   "인접 직무군 간 전환",
          bridgeable_family: "같은 직무 카테고리 내 기능 전환",
          distant_family:    "직무 카테고리 간 이동",
        }[__dist] || "";

        const __frictionMap = {
          ownership_gap:          "ownership 범위 근거 연결이 필요합니다",
          domain_gap:             "도메인 연결 근거 보강이 필요합니다",
          evidence_thin:          "직접 경험 근거가 얇아 보완이 필요합니다",
          level_gap:              "경력 수준 차이 설명이 필요합니다",
          function_overlap:       "기능 공통점은 있으나 JD 직접 연결 근거 보강이 필요합니다",
          transferable_execution: "실행 연속성은 확인되나 ownership 근거 연결이 필요합니다",
          tool_overlap:           "도구 공통점은 있으나 역할 범위 연결 근거 보강이 필요합니다",
        };
        const __frictionSuffix = __friction.length > 0
          ? (__frictionMap[__friction[0]] || null)
          : null;
        const __sharedNote = __sharedFamilies.length > 1
          ? " 복수 직무군 공통 경험이 연결 재료가 될 수 있습니다." : "";

        const __ncSummary = __frictionSuffix
          ? `${__distLabel}으로 읽히며, ${__frictionSuffix}.${__sharedNote}`.trim()
          : (__distLabel ? `${__distLabel}으로 읽힙니다.${__sharedNote}`.trim() : "");

        if (__ncSummary) {
          // Phase 11-4B: canonical-wins guard
          // skip currentFlow.summary write when sectionSentences canonical path is active
          // (sectionSentences → buildReportPack → __preferredCareerSummaryText already wins in VM)
          const __ncSsActive = interpretationPack?.sectionSentences?.careerAccumulation?.generationMode === "assembly-v1";
          // new-primary: override summary when empty OR generic/fallback (and canonical is not handling it)
          // legacy stays when it is already specific and informative
          if (!__ncSsActive && __isGenericFlowSummary(__existingSummary)) {
            __cf.summary = __ncSummary;
          }
          // always enrich bridgeSummary (other consumers may use it regardless of canonical path)
          if (!String(__cf.bridgeSummary || "").trim()) {
            __cf.bridgeSummary = __ncSummary;
          }
        }
      }
    }
  } catch { /* silent — nc injection must not break existing flow */ }

  const vm = {
    top3: __top3WithInterpretation,
    // ✅ append-only alias for UI compatibility
    signalsTop3: __top3WithInterpretation,
    explanationPack,
    topRiskNarratives: __topNarratives,
    // [PATCH] interaction hint (append-only)
    interactionHint,
    userType,
    logs,
    nextActions: topActions,
    // ✅ new: interpretation (테스트형 결과)
    interpretation,
    careerInterpretation,
    // [PATCH] Resume Interpretation Engine v1 (append-only)
    resumeInterpretation,
    // [PATCH] UI 표시용 파생 뷰 (append-only)
    resumeReadView,
    // ✅ PATCH (append-only): 후보자별 원재료 + 슬롯별 해석 재료
    interpretationMaterial,
    causePack,
    currentFlowCause: causePack?.currentFlow || null,
    careerTimeline: careerInterpretation?.careerTimeline || null,
    // ✅ SSOT fields for UI
    score: __posPct,
    band: __cappedBandLabel,
    risks: sortedWithNarrative,
    signals: sortedWithNarrative,
    expressionLevel: __expressionLevel,
    headlineCap: __headlineCap,
    headlineTone: __headlineCap,
    candidateType: __candidateType,
    candidateTypeContext: {
      highRiskSignal: __hasHighRiskSignal,
      gateSignal: __hasGateSignal,
      mustHaveFit: __mustHaveFit,
      score: __posPct,
    },

    // [PATCH] PASSMAP 16유형 SSOT (append-only)
    passmapType: __passmapType,
    passmapBaseType: __passmapBaseType,
    modifierV1: __modifierV1,
    baseTypeReasonPack: __baseTypeReasonPack,
    typeSsot: __typeSsotPack,

    // ✅ NEW (append-only): score fields for Pass position UI
    passProbability: __posPct,
    pass: {
      percent: __posPct,
      percentText: `${__posPct}%`,
      bandLabel: __cappedBandLabel,
      upliftHint: sanitizeReadinessWording(__policyInput, __upliftHint, __upliftHint),
      confidenceLevel: "normal",
      confidenceReason: null,
      preliminary: false,
      // (append-only) 리포트 “면접관 해석 유형” 섹션과 문구/구조 맞추기용
      headline: __cappedHeadline,
      stageLabel: __candidateType,
      judgementLabel: __cappedJudgementLabel,
      labels: {
        sectionTag: __passLabels.sectionTag,
        sectionTitle: __passLabels.sectionTitle,
        metricCaption: __passLabels.metricCaption,
        currentLabel: __passLabels.currentLabel,
        percentileCaption: __passLabels.percentileCaption,
      },
      // (debug/tuning) 원본 프록시도 남김
      basePct: __basePct,
      posRaw: __posRaw01,
    },

    meta: {
      avgPriority,
      primaryGroup,
      totalCount: (riskResults || []).length,
      // ✅ extra meta for tuning/debug
      gateMax: interpretation?.signals?.gateMax ?? 0,
      posPct: interpretation?.positionPct ?? null,
      fit: interpretation?.signals?.fit ?? null,
      trust: interpretation?.signals?.trust ?? null,
      risk: interpretation?.signals?.risk ?? null,
      top2: interpretation?.top2 ?? [],
      quickNoResume: false,
      quickCheckItems: [],
      languagePolicyInput: __policyInput,
      hasGateSignal: __hasGateSignal,
      hasHighRiskSignal: __hasHighRiskSignal,
      mustHaveFit: __mustHaveFit,
      candidateType: __candidateType,
    },
    // append-only: policy-safe aliases for UI consumers
    userTypeSafe: {
      ...(userType || {}),
      title: __cappedTypeTitle,
      description: String(causePack?.type?.whyThisType || __cappedTypeSubtitle || "").trim() || __cappedTypeSubtitle,
    },
    interpretationSafe: {
      ...(interpretation || {}),
      label: __cappedInterpretationLabel || interpretation?.label,
      oneLiner: __cappedInterpretationOneLiner || interpretation?.oneLiner,
    },
    typeNarrative:
      String(causePack?.type?.narrative || causePack?.type?.whyThisType || "").trim() || null,
    fixPriorityTop3: __fixPriorityTop3V1,
  };
  // ✅ SSOT guard (append-only)
  if (!vm.band && typeof vm.score === "number") {
    if (vm.score >= 80) vm.band = "strong";
    else if (vm.score >= 60) vm.band = "competitive";
    else if (vm.score >= 40) vm.band = "weak";
    else vm.band = "high-risk";
  }

  // ✅ PATCH R45 (append-only): vm.explanationMode
  vm.explanationMode = __explanationMode;

  // ✅ PATCH R47 (append-only): fit_reinforcement → vm.nextActions procurement override
  try {
    if (__explanationMode === "fit_reinforcement") {
      const _r47Doms = new Set(Array.isArray(evidenceFitMeta?.dominantProcurementDomains)
        ? evidenceFitMeta.dominantProcurementDomains : []);
      const _r47ProcActions = [];
      if (_r47Doms.has("strategic_sourcing")) {
        _r47ProcActions.push({ id: "proc_sourcing_scope", label: "전략소싱 범위를 담당 품목/벤더 수/글로벌 여부 중심으로 드러내세요.", category: "evidence_upgrade" });
      }
      if (_r47Doms.has("contract_commercial") || _r47Doms.has("vendor_management")) {
        _r47ProcActions.push({ id: "proc_negotiation_lead", label: "협상 참여가 아니라 주도한 범위와 계약 조건 개선 결과를 명시하세요.", category: "evidence_upgrade" });
      }
      if (_r47Doms.has("cost_management") || _r47Doms.has("purchasing_analytics")) {
        _r47ProcActions.push({ id: "proc_kpi_quantify", label: "연간 구매원가 절감률, 협상 타결 규모, KPI 개선 수치를 bullet에 직접 넣어 보강하세요.", category: "evidence_upgrade" });
      }
      if (_r47Doms.has("manufacturing_materials") || _r47Doms.has("direct_procurement")) {
        _r47ProcActions.push({ id: "proc_supply_result", label: "자재 조달 안정화 결과, 공급 차질 대응 성과를 수치로 드러내세요.", category: "evidence_upgrade" });
      }
      if (_r47ProcActions.length === 0) {
        _r47ProcActions.push({ id: "proc_general_quantify", label: "절감률/절감액, 협상 결과, KPI 개선치, 공급 안정화 결과를 bullet에 직접 넣어 보강하세요.", category: "evidence_upgrade" });
      }
      vm.procurementNextActions = _r47ProcActions;
      if (Array.isArray(vm.nextActions)) {
        const _procIds = new Set(_r47ProcActions.map((a) => a.id));
        const _filtered = vm.nextActions.filter((a) => !_procIds.has(String(a?.id || "")));
        vm.nextActions = [..._r47ProcActions, ..._filtered].slice(0, 5);
      }
    }
  } catch { /* silent — R47 must not break existing flow */ }

  // ✅ PATCH R48 (append-only): vm.procurementRewriteHints — bullet skeleton 노출
  try {
    if (__explanationMode === "fit_reinforcement") {
      const _r48Hints = Array.isArray(
        careerInterpretation?.generator?.blocks?.nextMove?.rewriteHints
      ) ? careerInterpretation.generator.blocks.nextMove.rewriteHints : [];
      vm.procurementRewriteHints = _r48Hints.filter(Boolean).slice(0, 6);
    }
  } catch { /* silent — R48 must not break existing flow */ }

  // ✅ PATCH R58 (append-only): hr_fit_reinforcement → vm.hrRewriteHints
  try {
    if (__explanationMode === "hr_fit_reinforcement") {
      const _hrDoms = new Set(Array.isArray(evidenceFitMeta?.dominantHrDomains)
        ? evidenceFitMeta.dominantHrDomains : []);
      const _hrHints = [];
      if (_hrDoms.has("talent_acquisition")) {
        _hrHints.push("채용 KPI, sourcing 채널 운영, ATS 관리, interview coordination 범위를 bullet에 직접 넣어 보강하세요.");
      }
      if (_hrDoms.has("hr_operations")) {
        _hrHints.push("입퇴사, 근태, 4대보험, HRIS 운영 범위와 처리 정확도/안정화 결과를 문장에 직접 드러내세요.");
      }
      if (_hrDoms.has("compensation_performance")) {
        _hrHints.push("평가 운영, calibration, 보상 review, 성과관리 사이클 운영 범위를 명확히 적어 보강하세요.");
      }
      if (_hrDoms.has("hrbp_er")) {
        _hrHints.push("employee relations, headcount planning, 조직개편 지원, 구성원 이슈 대응 범위를 JD 언어와 직접 연결해 쓰세요.");
      }
      if (_hrDoms.has("learning_development")) {
        _hrHints.push("교육 프로그램 운영, curriculum, 온보딩/리더십 교육 기획 범위를 결과와 함께 드러내세요.");
      }
      if (_hrHints.length === 0) {
        _hrHints.push("HR 핵심 업무 범위와 운영 결과를 JD 표현에 맞춰 직접 연결하는 bullet로 보강하세요.");
      }
      vm.hrRewriteHints = _hrHints.slice(0, 6);
    }
  } catch { /* silent — R58 HR hints must not break existing flow */ }

  // ✅ PATCH R44 (append-only): procurement strong-fit → candidate type override + Top3 generic risk demote
  try {
    if (evidenceFitMeta?.procurementStrongFit === true) {
      // candidate type override (append-only: add procurementCandidateType; override vm.candidateType only when falsy)
      if (__procurementCandidateTypeLabel) {
        vm.procurementCandidateType = __procurementCandidateTypeLabel;
        if (!vm.candidateType) {
          vm.candidateType = __procurementCandidateTypeLabel;
          if (vm.pass) vm.pass.stageLabel = __procurementCandidateTypeLabel;
        }
        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.procurementCandidateType = __procurementCandidateTypeLabel;
        }
      }
      // Top3 generic risk demote: move LOW_CONTENT_DENSITY_RISK / TASK__CORE_COVERAGE_LOW below non-generic
      const _GENERIC_IDS = new Set(["LOW_CONTENT_DENSITY_RISK", "TASK__CORE_COVERAGE_LOW"]);
      const _top3Src = Array.isArray(vm.top3) ? [...vm.top3] : [];
      const _nonGeneric = _top3Src.filter((r) => !_GENERIC_IDS.has(String(r?.id || "")));
      const _generic = _top3Src.filter((r) => _GENERIC_IDS.has(String(r?.id || "")));
      if (_generic.length > 0 && _nonGeneric.length > 0) {
        const _reordered = [..._nonGeneric, ..._generic].slice(0, 3);
        vm.top3 = _reordered;
        vm.signalsTop3 = _reordered;
        if (vm.meta && typeof vm.meta === "object") vm.meta.procurementTop3Adjusted = true;
      }
    }
  } catch { /* silent — R44 procurement injection must not break existing flow */ }

  // ✅ PATCH R58 (append-only): hr strong-fit → candidate type override only
  try {
    if (evidenceFitMeta?.hrStrongFit === true) {
      if (__hrCandidateTypeLabel) {
        vm.hrCandidateType = __hrCandidateTypeLabel;
        if (!vm.candidateType) {
          vm.candidateType = __hrCandidateTypeLabel;
          if (vm.pass) vm.pass.stageLabel = __hrCandidateTypeLabel;
        }
        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.hrCandidateType = __hrCandidateTypeLabel;
        }
      }
    }
  } catch { /* silent — R58 HR candidate type must not break existing flow */ }

  // ✅ PATCH R59 (append-only): hr_fit_reinforcement → summary narrative reinforcement
  try {
    if (__explanationMode === "hr_fit_reinforcement") {
      const _hrDoms = new Set(Array.isArray(evidenceFitMeta?.dominantHrDomains)
        ? evidenceFitMeta.dominantHrDomains
        : []);

      let _hrSummary = null;

      if (_hrDoms.has("talent_acquisition")) {
        _hrSummary = "채용 운영과 채용 프로세스 실행 경험이 JD 요구와 비교적 직접적으로 연결되는 프로필입니다.";
      }

      else if (_hrDoms.has("hr_operations")) {
        _hrSummary = "인사운영 실무 범위와 운영 안정성이 JD 요구와 비교적 직접적으로 맞물리는 프로필입니다.";
      }

      else if (_hrDoms.has("compensation_performance")) {
        _hrSummary = "평가 및 보상 운영 경험이 JD의 성과관리 요구와 비교적 자연스럽게 연결되는 편입니다.";
      }

      else if (_hrDoms.has("hrbp_er")) {
        _hrSummary = "조직 지원, 구성원 이슈 대응, 인력 운영 축이 HRBP형 강점으로 읽히는 프로필입니다.";
      }

      else if (_hrDoms.has("learning_development")) {
        _hrSummary = "교육 프로그램 운영과 인재개발 활동 경험이 JD 요구와 비교적 직접적으로 연결됩니다.";
      }

      else {
        _hrSummary = "HR 운영 경험과 JD 요구 사이에 비교적 직접적인 연결이 읽히는 프로필입니다.";
      }

      if (_hrSummary) {
        vm.hrSummary = _hrSummary;

        if (!vm.summary) {
          vm.summary = _hrSummary;
        }

        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.hrSummary = _hrSummary;
        }
      }
    }
  } catch { /* silent — HR summary reinforcement must not break flow */ }

  // PATCH R68 (append-only): hr_transition_reinforcement -> summary narrative reinforcement
  try {
    if (__explanationMode === "hr_transition_reinforcement") {
      const _transitionType = String(evidenceFitMeta?.hrTransitionType || "").trim();
      const _transitionGap = String(evidenceFitMeta?.hrTransitionGap || "").trim();
      const _hrNarrative = String(evidenceFitMeta?.hrNarrative || "").trim();
      const _hrDirectness = String(evidenceFitMeta?.hrDomainDirectnessHint || "").trim();
      const _hrScope = String(evidenceFitMeta?.hrScopeHint || "").trim();
      const _hrBurden = String(evidenceFitMeta?.hrProofBurdenHint || "").trim();
      const _transitionTypeLabel =
        __hrTransitionCandidateTypeLabel ||
        String(vm.hrTransitionCandidateType || "").trim() ||
        String(vm.candidateType || "").trim() ||
        "HR 내부 확장 전환형";
      const _GENERIC_FLOW_SUMMARY = "현재 이력서만으로는 커리어 흐름을 한 줄로 읽기 어렵습니다.";
      let _summary = null;

      if (_transitionType === "operations_to_hrbp") {
        _summary = [_hrNarrative, _hrDirectness].filter(Boolean).join(" ").trim() || "HR Operations 경험을 기반으로 HRBP 축으로 이동 가능한 전환 후보로 읽히지만, 조직/성과/보상/ER ownership 보강이 핵심입니다.";
      } else if (_transitionType === "operations_to_compensation") {
        _summary = "HR Operations 경험을 기반으로 보상/평가 축으로 이동 가능한 전환 후보로 읽히지만, 성과관리와 보상 운영 ownership 보강이 핵심입니다.";
      } else if (_transitionType === "recruiting_to_hrbp") {
        _summary = "채용 실행 경험을 기반으로 HRBP 축으로 이동 가능한 전환 후보로 읽히지만, 조직 지원과 ER ownership 보강이 핵심입니다.";
      } else {
        _summary = "현재 HR 경험은 확인되지만, 목표 JD 책임 범위로 넘어가기 위한 전환 근거 보강이 필요한 프로필입니다.";
      }

      if (_transitionGap) {
        _summary = `${_summary} ${_transitionGap}`.trim();
      }
      if (_transitionType === "operations_to_hrbp" && (_hrScope || _hrBurden)) {
        _summary = [_summary, _hrScope, _hrBurden].filter(Boolean).join(" ").trim();
      }

      if (_summary) {
        vm.hrTransitionSummary = _summary;

        if (!vm.summary) {
          vm.summary = _summary;
        }

        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.hrTransitionSummary = _summary;
        }
        if (userType && typeof userType === "object") {
          userType.title = _transitionTypeLabel;
          userType.description = _summary;
          userType.hint = _summary;
        }
        if (vm.userTypeSafe && typeof vm.userTypeSafe === "object") {
          vm.userTypeSafe.title = _transitionTypeLabel;
          vm.userTypeSafe.description = _summary;
          vm.userTypeSafe.hint = _summary;
        }
        if (causePack?.type && typeof causePack.type === "object") {
          const _existingWhy = String(causePack.type.whyThisType || "").trim();
          if (!_existingWhy || _existingWhy === _GENERIC_FLOW_SUMMARY) {
            causePack.type.whyThisType = _summary;
          }
        }
        if (careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
          const _existingFlowSummary = String(careerInterpretation.currentFlow.summary || "").trim();
          if (!_existingFlowSummary || _existingFlowSummary === _GENERIC_FLOW_SUMMARY) {
            careerInterpretation.currentFlow.summary = _summary;
          }
          if (_transitionType === "operations_to_hrbp" && _hrDirectness) {
            careerInterpretation.currentFlow.bridgeSummary = _hrDirectness;
          }
        }
      }
    }
  } catch { /* silent */ }

  // ✅ PATCH R59 (append-only): hr_fit_reinforcement → candidateType reinforcement
  try {
    if (__explanationMode === "hr_fit_reinforcement") {
      if (vm.hrCandidateType) {
        vm.candidateType = vm.hrCandidateType;

        if (vm.pass && typeof vm.pass === "object") {
          vm.pass.stageLabel = vm.hrCandidateType;
        }
      }
    }
  } catch { /* silent */ }

  // PATCH R67 (append-only): hr_transition_reinforcement -> candidate type bridge
  try {
    if (__explanationMode === "hr_transition_reinforcement") {
      if (__hrTransitionCandidateTypeLabel) {
        vm.hrTransitionCandidateType = __hrTransitionCandidateTypeLabel;
        vm.candidateType = __hrTransitionCandidateTypeLabel;
        if (vm.pass) vm.pass.stageLabel = __hrTransitionCandidateTypeLabel;
        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.hrTransitionCandidateType = __hrTransitionCandidateTypeLabel;
        }
      }
    }
  } catch { /* silent */ }

  // PATCH R80 (append-only): Type System V2 transition decision priority bridge
  try {
    if (__transitionDecisionType === "CAREER_LADDER_TRANSITION") {
      const _GENERIC_FLOW_SUMMARY = "현재 이력서만으로는 커리어 흐름을 한 줄로 읽기 어렵습니다.";
      const _transitionTypeLabel =
        __hrTransitionCandidateTypeLabel ||
        String(vm.hrTransitionCandidateType || "").trim() ||
        "커리어 확장 전환형";
      const _transitionSummaryFallback =
        __transitionTypeLabel === "HRBP 전환 준비형"
          ? "HR Operations 경험을 기반으로 HRBP 방향 확장을 시도하는 흐름은 읽히지만, 조직/성과/보상/ER ownership 보강이 필요합니다."
          : "같은 family 내부 확장 흐름은 읽히지만, 목표 JD 책임 범위에 맞춘 ownership 보강이 필요합니다.";
      const _transitionSummary = String(
        vm.hrTransitionSummary ||
        evidenceFitMeta?.hrTransitionGap ||
        vm.summary ||
        _transitionSummaryFallback
      ).trim();

      if (__transitionDecisionPassmapType) {
        vm.passmapType = {
          ...(vm.passmapType && typeof vm.passmapType === "object" ? vm.passmapType : {}),
          ...__transitionDecisionPassmapType,
        };
        if (vm.typeSsot && typeof vm.typeSsot === "object") {
          vm.typeSsot = {
            ...vm.typeSsot,
            id: String(vm.passmapType?.id || vm.typeSsot.id || "").trim() || null,
            label: String(vm.passmapType?.label || vm.typeSsot.label || "").trim() || null,
            oneLiner: String(vm.passmapType?.oneLiner || vm.typeSsot.oneLiner || "").trim() || null,
          };
        }
      }

      vm.candidateType = _transitionTypeLabel;
      if (vm.pass && typeof vm.pass === "object") {
        vm.pass.stageLabel = _transitionTypeLabel;
      }

      if (_transitionSummary) {
        vm.transitionNarrative = _transitionSummary;
        vm.hrTransitionSummary = String(vm.hrTransitionSummary || _transitionSummary).trim();
        if (careerInterpretation?.currentFlow && typeof careerInterpretation.currentFlow === "object") {
          careerInterpretation.currentFlow.transitionNarrative = _transitionSummary;
          const _existingFlowSummary = String(careerInterpretation.currentFlow.summary || "").trim();
          if (!_existingFlowSummary || _existingFlowSummary === _GENERIC_FLOW_SUMMARY) {
            careerInterpretation.currentFlow.summary = _existingFlowSummary || _transitionSummary;
          }
        }
      }
      if (vm.meta && typeof vm.meta === "object") {
        vm.meta.transitionDecisionType = __transitionDecisionType;
        vm.meta.transitionDecisionFamily = String(evidenceFitMeta?.transitionDecisionFamily || "").trim() || null;
        vm.meta.transitionDecisionConfidence = String(evidenceFitMeta?.transitionDecisionConfidence || "").trim() || null;
      }
    }
  } catch { /* silent */ }

  // ✅ PATCH R63 (append-only): HR functional identity candidateType priority
  try {
    if (__explanationMode === "hr_fit_reinforcement") {
      const _hrIdentity = String(evidenceFitMeta?.hrFunctionalIdentity || "").trim();
      if (_hrIdentity) {
        vm.candidateType = _hrIdentity;
        if (vm.meta && typeof vm.meta === "object") {
          vm.meta.candidateType = _hrIdentity;
        }
      }
    }
  } catch { /* silent */ }

  // ✅ PATCH R46 (append-only): procurement strong-fit → Top3 displayTitle / displaySummary 주입
  // risk.id / priority / ranking은 유지. display용 override 필드만 추가.
  try {
    if (__explanationMode === "fit_reinforcement") {
      const _r46Doms = Array.isArray(evidenceFitMeta?.dominantProcurementDomains)
        ? evidenceFitMeta.dominantProcurementDomains : [];
      const _r46DomSet = new Set(_r46Doms);

      const __getProcurementTop3DisplayTitle = (riskId, domSet) => {
        if (riskId === "LOW_CONTENT_DENSITY_RISK") return "성과 수치화 보강 필요";
        if (riskId === "TASK__CORE_COVERAGE_LOW") {
          if (domSet.has("strategic_sourcing")) return "전략소싱 범위 증명 필요";
          if (domSet.has("contract_commercial")) return "협상/계약 영향 범위 보강 필요";
          if (domSet.has("purchasing_analytics")) return "구매 분석 성과 증명 필요";
          return "핵심 구매 경험 범위 보강 필요";
        }
        if (riskId === "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY") {
          return "구매 경험의 JD 직접 연결 표현 보강 필요";
        }
        const _id = riskId.toUpperCase();
        if (_id.includes("LEADERSHIP") || _id.includes("LEAD") || _id.includes("SCOPE")) {
          if (domSet.has("contract_commercial") || domSet.has("vendor_management")) return "협상 리드 범위 보강 필요";
          return "벤더 운영 주도 범위 보강 필요";
        }
        return null;
      };

      const __getProcurementTop3DisplaySummary = (riskId, domSet) => {
        if (riskId === "LOW_CONTENT_DENSITY_RISK") {
          return "도메인 부적합보다는 구매 성과를 수치와 결과 중심으로 더 명확히 증명할 필요가 있습니다.";
        }
        if (riskId === "TASK__CORE_COVERAGE_LOW") {
          if (domSet.has("strategic_sourcing")) return "전략소싱 수행 범위와 실제 영향 수준이 더 선명하게 드러날 필요가 있습니다.";
          if (domSet.has("contract_commercial")) return "계약·협상 결과와 영향 범위를 구체적으로 증명할 필요가 있습니다.";
          if (domSet.has("purchasing_analytics")) return "구매 데이터 분석 결과와 활용 성과를 더 명확히 드러낼 필요가 있습니다.";
          return "핵심 구매 업무 수행 범위를 직접 증명하는 문장 보강이 필요합니다.";
        }
        if (riskId === "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY") {
          return "구매 적합 신호는 충분하지만, 전략소싱·벤더 운영·SAP 구매 분석 경험이 JD 역할 언어로 바로 읽히는 정도는 아직 약합니다. 수행 범위와 결과를 더 직접적으로 연결해 드러낼 필요가 있습니다.";
        }
        const _id = riskId.toUpperCase();
        if (_id.includes("LEADERSHIP") || _id.includes("LEAD") || _id.includes("SCOPE")) {
          return "구매 협상 또는 벤더 운영에서 주도한 범위와 성과를 구체적으로 보강하면 해석이 강해집니다.";
        }
        return null;
      };

      const _r46Top3 = Array.isArray(vm.top3) ? vm.top3 : [];
      const _r46Updated = _r46Top3.map((item) => {
        const _riskId = String(item?.id || "").trim();
        const _dt = __getProcurementTop3DisplayTitle(_riskId, _r46DomSet);
        const _ds = __getProcurementTop3DisplaySummary(_riskId, _r46DomSet);
        if (!_dt && !_ds) return item;
        return { ...item, displayTitle: _dt || item.title, displaySummary: _ds || item.summary };
      });
      vm.top3 = _r46Updated;
      vm.signalsTop3 = _r46Updated;
    }
  } catch { /* silent — R46 display label injection must not break existing flow */ }

  // ✅ PATCH R82 (append-only): 최종 사용자 표시용 타입 SSOT
  try {
    const __displayBaseType = (vm?.passmapBaseType && typeof vm.passmapBaseType === "object")
      ? vm.passmapBaseType
      : (__passmapBaseType && typeof __passmapBaseType === "object" ? __passmapBaseType : null);
    const __displayTypeSsot = (vm?.typeSsot && typeof vm.typeSsot === "object") ? vm.typeSsot : null;
    const __displayPassmapType = (vm?.passmapType && typeof vm.passmapType === "object")
      ? vm.passmapType
      : (__passmapType && typeof __passmapType === "object" ? __passmapType : null);
    let __displayType = null;

    if (__displayBaseType && typeof __displayBaseType === "object") {
      __displayType = {
        id: String(__displayBaseType.id || "").trim() || "DISPLAY_PASSMAP_BASE_TYPE",
        title: String(__displayBaseType.label || "").trim() || null,
        description: String(__displayBaseType.oneLiner || "").trim() || null,
        hint: String(__displayBaseType.oneLiner || "").trim() || null,
        source: "passmap_base_type_ssot",
        ssot: "passmapBaseType",
      };
    } else if (__displayPassmapType && typeof __displayPassmapType === "object") {
      __displayType = {
        id: String(__displayPassmapType.id || "").trim() || "DISPLAY_PASSMAP_TYPE",
        title:
          String(__displayPassmapType.label || "").trim() ||
          String(__displayTypeSsot?.label || "").trim() ||
          null,
        description:
          String(__displayPassmapType.oneLiner || "").trim() ||
          String(__displayTypeSsot?.oneLiner || "").trim() ||
          null,
        hint:
          String(__displayPassmapType.oneLiner || "").trim() ||
          String(__displayTypeSsot?.oneLiner || "").trim() ||
          null,
        source: "passmap_type_ssot",
        ssot: "passmapType",
      };
    }

    if (__displayType) {
      vm.displayType = __displayType;
    }
  } catch { /* silent */ }

  // ── Phase 9-5B: legacyRuntimePosture (append-only, internal metadata) ──
  try {
    const _careerStoryPosture    = resolveNarrativeRuntimePosture(interpretationPack, "careerAccumulation", "legacy_buildCareerStory");
    const _topRiskPosture        = resolveNarrativeRuntimePosture(interpretationPack, "riskSummary", "legacy_buildTopRiskNarratives");
    vm.legacyRuntimePosture = {
      version: "fallback-isolation-v1",
      targets: {
        careerStory: {
          decision:              _careerStoryPosture,
          auditDecision:         getLegacyAuditDecisionForSection(interpretationPack, "legacy_buildCareerStory"),
          sectionKey:            "careerAccumulation",
          interpretationReady:   isNarrativeFrameUsable(interpretationPack, "careerAccumulation"),
          legacyAvailable:       true,
        },
        topRiskNarratives: {
          decision:              _topRiskPosture,
          auditDecision:         getLegacyAuditDecisionForSection(interpretationPack, "legacy_buildTopRiskNarratives"),
          sectionKey:            "riskSummary",
          interpretationReady:   isNarrativeFrameUsable(interpretationPack, "riskSummary"),
          legacyAvailable:       true,
        },
      },
    };
  } catch { /* silent — posture metadata must not break existing flow */ }

  // ── Phase 9-8B: sentenceDraftRollout gating (append-only, internal metadata) ──
  try {
    vm.sentenceDraftRollout = buildSentenceDraftRollout(
      interpretationPack,
      vm.legacyRuntimePosture ?? null
    );
  } catch { /* silent — rollout gating must not break existing flow */ }

  // ── Phase 10: reportPack translation layer (append-only) ──
  try {
    vm.reportPack = buildReportPack({
      interpretationPack,
      legacyRuntimePosture: vm.legacyRuntimePosture ?? null,
      sentenceDraftRollout:  vm.sentenceDraftRollout ?? null,
      currentJobLabel:       null,
      targetJobLabel:        null,
      currentIndustryLabel:  null,
      targetIndustryLabel:   null,
    });
  } catch { /* silent — reportPack must not break existing flow */ }

  // ── Phase 12-C: primaryThesis propagation into reportPack sections (append-only) ──
  // Bridges sectionAssemblies.primaryThesis (built by buildInterpretationPack) into
  // vm.reportPack.sections so that SimulatorLayout can read canonical type synthesis
  // without accessing internal interpretationPack structures.
  // Fires only when vm.reportPack.sections is already present.
  try {
    const __careerThesis = interpretationPack?.sectionAssemblies?.careerAccumulation?.primaryThesis ?? null;
    const __riskThesis   = interpretationPack?.sectionAssemblies?.riskSummary?.primaryThesis   ?? null;
    if (__careerThesis && vm.reportPack?.sections?.careerAccumulation) {
      vm.reportPack.sections.careerAccumulation.primaryThesis = String(__careerThesis).trim();
    }
    if (__riskThesis && vm.reportPack?.sections?.riskSummary) {
      vm.reportPack.sections.riskSummary.primaryThesis = String(__riskThesis).trim();
    }
  } catch { /* silent */ }

  // ── interpretationV2 (Round 3 — must run BEFORE reportCanonical so headline V2 switch works) ──
  try {
    vm.interpretationV2 = __buildInterpretationV2({
      interpretationPack,
      careerInterpretation,
      causePack: causePack ?? null,
      careerTimeline: careerTimeline ?? careerInterpretation?.careerTimeline ?? null,
      evidenceFitMeta: evidenceFitMeta ?? null,
    });
  } catch { /* silent */ }
  // Wave 1a~1e: expose candidateAxisPack on vm so judgment builders can read ontology signals
  // candidateAxisPack lives in interpretationPack.secondarySources — builders read vm.candidateAxisPack
  try { vm.candidateAxisPack = interpretationPack?.secondarySources?.candidateAxisPack ?? null; } catch { /* silent */ }
  try {
    vm.judgmentPack = buildJudgmentPack({
      vm,
      interpretationPack,
      top3WithInterpretation: Array.isArray(vm?.top3) ? vm.top3 : (Array.isArray(top3WithNarrative) ? top3WithNarrative : []),
      careerInterpretation,
      evidenceFitMeta: evidenceFitMeta ?? null,
    });
    vm.judgmentRender = {
      headline: buildHeadlineFromJudgments({ judgmentPack: vm.judgmentPack }),
      topRisks: buildTopRisksFromJudgments({ judgmentPack: vm.judgmentPack }),
    };
  } catch {
    vm.judgmentPack = {
      version: "judgment-pack-v1",
      status: "unavailable",
      items: {},
      ranking: { headline: [], topRisks: [] },
      diagnostics: { emittedKeys: [], unavailableKeys: [] },
    };
    vm.judgmentRender = {
      headline: {
        status: "unavailable",
        text: null,
        sourceFamily: "fallback",
        sourceKeys: [],
        sparseReason: "judgment_build_failed",
      },
      topRisks: {
        status: "unavailable",
        items: [],
        sourceFamily: "fallback",
        sourceKeys: [],
        sparseReason: "judgment_build_failed",
      },
    };
  }

  // ── Phase 12-RC: producer-first report-wide canonical SSOT (append-only) ──
  // Reads vm.interpretationV2.surfaces.headlineCandidate (set above) for V2 headline switch.
  try {
    vm.reportCanonical = __buildReportCanonicalV1({
      vm,
      top3WithInterpretation: Array.isArray(vm?.top3) ? vm.top3 : __top3WithInterpretation,
      careerInterpretation,
      causePack,
      reportPack: vm.reportPack ?? null,
      passmapType: vm.passmapType ?? __passmapType ?? null,
      typeSsot: vm.typeSsot ?? __typeSsotPack ?? null,
    });
  } catch {
    vm.reportCanonical = {
      version: "report-canonical-v1",
      status: "unavailable",
      diagnostics: {
        hasSpecificSurface: false,
        legacyBypassed: true,
        unresolvedSurfaces: [
          "headline",
          "supportingDescription",
          "topRisks",
          "currentType",
          "careerFlow",
          "typeDetail",
        ],
        sourceFamiliesUsed: [],
      },
      headline: {
        status: "unavailable",
        text: null,
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "report_canonical_build_failed",
      },
      supportingDescription: {
        status: "unavailable",
        text: null,
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "report_canonical_build_failed",
      },
      topRisks: {
        status: "unavailable",
        items: [],
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "report_canonical_build_failed",
      },
      currentType: {
        status: "unavailable",
        key: null,
        label: null,
        title: null,
        description: null,
        sourceFamily: "unavailable",
        sourceKeys: [],
        evidence: [],
        sparseReason: "report_canonical_build_failed",
      },
      careerFlow: {
        status: "unavailable",
        title: null,
        body: null,
        bullets: [],
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "report_canonical_build_failed",
      },
      typeDetail: {
        status: "unavailable",
        title: null,
        sections: [],
        sourceFamily: "unavailable",
        sourceKeys: [],
        sparseReason: "report_canonical_build_failed",
      },
    };
  }

  // ── Round 10-6: semanticDiagnostics (append-only, diagnostics-only) ──
  try {
    const __rc = vm.reportCanonical;

    // Intended semantic family per surface slot
    const __SLOT_INTENT = {
      headline: "identity",
      supportingDescription: "proofBurden",
      careerFlow: "path",
      currentType: "identity",
      typeDetail: "identity",
      topRisks: "risk",
    };

    // Map (surface, sourceFamily, sourceKeys) → semantic family label
    // R11: "bridge" added as distinct family for bridgeSummary-driven composition
    const __resolveSemanticFamily = (surface, sourceFamily, sourceKeys) => {
      if (!sourceFamily || sourceFamily === "unavailable") return "unknown";
      if (sourceFamily === "interpretation_v2") return __SLOT_INTENT[surface] ?? "unknown";
      if (sourceFamily === "type_ssot") return "identity";
      if (sourceFamily === "top3_canonical") return "risk";
      if (sourceFamily === "career_interpretation") {
        if (surface === "careerFlow") return "path";   // after R10-3 guard; bridgeSummary removed R11
        if (surface === "headline") return "identity";
        if (surface === "supportingDescription") {
          // R11: bridgeSummary in supportingDescription → bridge family
          const hasBridge = Array.isArray(sourceKeys) && sourceKeys.some((k) => typeof k === "string" && k.includes("bridgeSummary"));
          return hasBridge ? "bridge" : "unknown";
        }
        return "unknown";
      }
      if (sourceFamily === "cause_pack") {
        if (surface === "headline" || surface === "currentType" || surface === "typeDetail") return "identity";
        if (surface === "supportingDescription") return "proofBurden"; // after R10-2 relock
        if (surface === "careerFlow") return "path";   // after R10-3 guard
        return "unknown";
      }
      return "unknown";
    };

    const __makeSurfaceDiag10_6 = (surface, obj) => {
      const sf = obj?.sourceFamily ?? "unavailable";
      const sk = Array.isArray(obj?.sourceKeys) ? obj.sourceKeys : [];
      const usedFallback = sf !== "interpretation_v2";
      // R11: pass sk so career_interpretation/supportingDescription can classify as bridge
      const semanticFamily = __resolveSemanticFamily(surface, sf, sk);
      const intendedFamily = __SLOT_INTENT[surface];

      // blockedKeys: careerFlow explicitly guards jdConflict* (R10-3) and bridgeSummary (R11)
      const blockedKeys = (surface === "careerFlow" && usedFallback)
        ? ["jdConflictSummary", "jdConflictPoints", "bridgeSummary"]
        : [];

      const mismatchFlags = [];
      if (semanticFamily !== "unknown" && intendedFamily && semanticFamily !== intendedFamily) {
        // R11: bridge / proofBurden / jdGap are all acceptable for supportingDescription
        const isAcceptable =
          (surface === "supportingDescription" && (semanticFamily === "jdGap" || semanticFamily === "proofBurden" || semanticFamily === "bridge")) ||
          (surface === "careerFlow" && semanticFamily === "transition");
        if (!isAcceptable) {
          mismatchFlags.push(`expected_${intendedFamily}_got_${semanticFamily}`);
        }
      }

      return { sourceFamily: semanticFamily, sourceKeys: sk, usedFallback, blockedKeys, mismatchFlags };
    };

    const __diagHL = __makeSurfaceDiag10_6("headline",            __rc?.headline);
    const __diagSD = __makeSurfaceDiag10_6("supportingDescription", __rc?.supportingDescription);
    const __diagCF = __makeSurfaceDiag10_6("careerFlow",           __rc?.careerFlow);
    const __diagCT = __makeSurfaceDiag10_6("currentType",          __rc?.currentType);
    const __diagTD = __makeSurfaceDiag10_6("typeDetail",           __rc?.typeDetail);
    const __diagTR = __makeSurfaceDiag10_6("topRisks",             __rc?.topRisks);

    const __allMismatches10_6 = [
      ...__diagHL.mismatchFlags,
      ...__diagSD.mismatchFlags,
      ...__diagCF.mismatchFlags,
      ...__diagCT.mismatchFlags,
      ...__diagTD.mismatchFlags,
      ...__diagTR.mismatchFlags,
    ];

    vm.semanticDiagnostics = {
      version: "round-10-6",
      surfaces: {
        headline:            __diagHL,
        supportingDescription: __diagSD,
        careerFlow:          __diagCF,
        currentType:         __diagCT,
        typeDetail:          __diagTD,
        topRisks:            __diagTR,
      },
      summary: {
        causePackMixingDetected: [__diagHL, __diagSD, __diagCF, __diagCT, __diagTD, __diagTR]
          .some((d) => d.mismatchFlags.length > 0 && d.sourceKeys.length > 1),
        consumerFamilyMismatch: __allMismatches10_6.length > 0,
        fallbackSemanticViolation: __allMismatches10_6.some(
          (f) => f.includes("expected_path_got_jdGap") ||
                 f.includes("expected_identity_got_risk") ||
                 f.includes("expected_risk_got_identity")
        ),
        identityRiskCrossLeak: __allMismatches10_6.some(
          (f) => f.includes("expected_identity_got_risk") || f.includes("expected_risk_got_identity")
        ),
        careerFlowBridgeLeak: __diagCF.mismatchFlags.length > 0 ||
          Boolean(__rc?.careerFlow?.sourceKeys?.some((k) => typeof k === "string" && k.includes("bridgeSummary"))),
      },
    };
  } catch { /* diagnostics-only, never surfaces */ }

  // ── Report V2: risk-first scaffold (append-only, parallel-only) ────────────
  // New-engine-native read path only. Must NOT consume V1 local resolver chains
  // or reportPack/reportCanonical prose as primary surface owners.
  try {
    const __v2Pack = (interpretationPack && typeof interpretationPack === "object")
      ? interpretationPack
      : null;
    const __v2Sections = (__v2Pack?.sectionAssemblies && typeof __v2Pack.sectionAssemblies === "object")
      ? __v2Pack.sectionAssemblies
      : {};
    const __v2CareerAsm = (__v2Sections.careerAccumulation && typeof __v2Sections.careerAccumulation === "object")
      ? __v2Sections.careerAccumulation
      : null;
    const __v2LevelAsm = (__v2Sections.levelPositionFit && typeof __v2Sections.levelPositionFit === "object")
      ? __v2Sections.levelPositionFit
      : null;
    const __v2IndustryAsm = (__v2Sections.industryContext && typeof __v2Sections.industryContext === "object")
      ? __v2Sections.industryContext
      : null;
    const __v2Decision = (__v2Pack?.primarySource?.interactionDecision && typeof __v2Pack.primarySource.interactionDecision === "object")
      ? __v2Pack.primarySource.interactionDecision
      : null;
    const __v2AxisPack = (__v2Pack?.secondarySources?.candidateAxisPack && typeof __v2Pack.secondarySources.candidateAxisPack === "object")
      ? __v2Pack.secondarySources.candidateAxisPack
      : null;
    const __v2Diag = (vm?.semanticDiagnostics && typeof vm.semanticDiagnostics === "object")
      ? vm.semanticDiagnostics
      : null;
    const __v2Int = (vm?.interpretationV2 && typeof vm.interpretationV2 === "object")
      ? vm.interpretationV2
      : null;
    const __v2Top3 = Array.isArray(vm?.top3) ? vm.top3 : [];

    const __v2Text = (value) => (typeof value === "string" ? value.trim() : "");
    const __v2Arr = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
    const __v2Has = (value) => __v2Text(value).length > 0;
    const __v2Unique = (items) => {
      const seen = new Set();
      return __v2Arr(items).filter((item) => {
        const key = typeof item === "string" ? item.trim() : JSON.stringify(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };
    const __v2Title = (value, fallback) => __v2Text(value) || fallback;
    const __v2Norm = (value) => __v2Text(value).toLowerCase().replace(/\s+/g, " ").trim();
    const __v2Sentence = (value) => {
      const text = __v2Text(value);
      if (!text) return "";
      const first = text.split(/(?<=[.!?])\s+/)[0];
      return __v2Text(first || text);
    };
    const __v2FirstLine = (value) => __v2Text(value)
      .split(/\n+/)
      .map((line) => __v2Sentence(line))
      .find(Boolean) || "";
    const __v2Similarity = (a, b) => {
      const aa = __v2Norm(a);
      const bb = __v2Norm(b);
      if (!aa || !bb) return 0;
      if (aa === bb) return 1;
      if (aa.includes(bb) || bb.includes(aa)) return 0.92;
      const ta = aa.split(/[\s,/|()]+/).filter((token) => token.length >= 2);
      const tb = bb.split(/[\s,/|()]+/).filter((token) => token.length >= 2);
      if (ta.length === 0 || tb.length === 0) return 0;
      const shared = ta.filter((token) => tb.includes(token));
      return shared.length / Math.max(ta.length, tb.length);
    };
    const __v2GenericText = (value) => {
      const s = __v2Text(value);
      if (!s) return true;
      return [
        /주의 필요/,
        /보완 필요/,
        /상반된 신호/,
        /단정적 해석이 어렵/,
        /핵심 리스크 구조/,
        /한 줄로 읽기 어렵/,
      ].some((re) => re.test(s));
    };
    const __v2RiskFamily = (risk) => {
      const haystack = [
        risk?.id,
        risk?.canonicalCard?.sourceKey,
        risk?.canonicalCard?.headline,
        risk?.canonicalCard?.summary,
        risk?.interviewerView,
      ].map((value) => __v2Text(value).toLowerCase()).join(" ");
      if (/(year|seniority|role_level|연차|시니어리티|레벨)/.test(haystack)) return "years_seniority";
      if (/(must_have|필수|핵심 역량|required)/.test(haystack)) return "must_have_gap";
      if (/(ownership|leadership|scope|오너십|리더십|책임 범위)/.test(haystack)) return "ownership_scope";
      if (/(domain|industry|semantic|role_skill|직무|도메인|산업)/.test(haystack)) return "directness_context";
      if (/(timeline|transition|전환|흐름|공백)/.test(haystack)) return "transition_path";
      return __v2Text(risk?.id) ? `risk:${__v2Text(risk.id)}` : "unknown";
    };
    const __v2AttentionLevel = (riskFamily) => {
      const riskCount = __v2Arr(__v2Decision?.riskDrivers).length;
      const jdStatus = __v2Text(__v2Int?.jdCompetitiveness?.status);
      if (riskFamily === "must_have_gap" || riskFamily === "years_seniority") return "high_attention";
      if (jdStatus === "weak" || riskCount >= 2) return "high_attention";
      if (jdStatus === "mixed" || riskCount >= 1) return "moderate_attention";
      return "review_needed";
    };
    const __v2EvidenceState = (risk) => {
      const jdCount = __v2Arr(risk?.jdEvidence).length;
      const resumeCount = __v2Arr(risk?.resumeEvidence).length;
      if (jdCount > 0 && resumeCount > 0) return "direct";
      if (jdCount > 0 || resumeCount > 0) return "partial";
      return "thin";
    };
    const __v2ReviewSuggestion = (risk) => {
      const directHint = __v2Text(risk?.interviewPrepHint || risk?.actionHint);
      if (directHint) return directHint;
      const family = __v2RiskFamily(risk);
      if (family === "ownership_scope") return "담당 범위와 의사결정 수준을 한 문장으로 더 직접 연결해 설명할 준비가 필요합니다.";
      if (family === "directness_context") return "현재 경험 중 목표 역할과 바로 맞닿는 장면을 1~2개로 압축해 준비하는 편이 안전합니다.";
      if (family === "transition_path") return "전환 이유보다 먼저 이어지는 과업 구조와 재사용 가능한 성과를 설명할 준비가 필요합니다.";
      if (family === "must_have_gap") return "공고 핵심 요구와 직접 맞닿는 경험을 실제 수행 사례로만 정리해두는 편이 좋습니다.";
      return "가장 먼저 확인될 가능성이 높은 포인트에 대해 직접 수행 장면과 결과를 함께 설명할 준비가 필요합니다.";
    };
    const __v2SupportedTop = __v2Top3
      .map((risk, index) => {
        const headline = __v2Text(risk?.canonicalCard?.headline);
        const summary = __v2Text(risk?.canonicalCard?.summary);
        const family = __v2RiskFamily(risk);
        const jdEvidence = __v2Arr(risk?.jdEvidence).map((item) => __v2Text(item)).filter(Boolean);
        const resumeEvidence = __v2Arr(risk?.resumeEvidence).map((item) => __v2Text(item)).filter(Boolean);
        const supportingEvidence = __v2Text(risk?.canonicalCard?.supportingEvidence);
        const posture = summary || __v2Text(risk?.interviewerView);
        if (!headline || __v2GenericText(headline) || !posture || __v2GenericText(posture)) return null;
        return {
          id: __v2Text(risk?.id) || `report-v2-risk-${index + 1}`,
          riskFamily: family,
          headline,
          posture,
          summary,
          supportingEvidence,
          jdEvidence,
          resumeEvidence,
          evidenceState: __v2EvidenceState(risk),
          reviewSuggestion: __v2ReviewSuggestion(risk),
          actionHint: __v2Text(risk?.interviewPrepHint || risk?.actionHint) || null,
          sourceFamily: "top3_canonical",
          sourceKeys: __v2Unique([
            "top3[].canonicalCard.headline",
            summary ? "top3[].canonicalCard.summary" : null,
            supportingEvidence ? "top3[].canonicalCard.supportingEvidence" : null,
            jdEvidence.length > 0 ? "top3[].jdEvidence" : null,
            resumeEvidence.length > 0 ? "top3[].resumeEvidence" : null,
          ]),
        };
      })
      .filter(Boolean)
      .filter((item, index, arr) => arr.findIndex((x) => x.riskFamily === item.riskFamily) === index)
      .slice(0, 3);

    const __heroRisk = __v2SupportedTop[0] || null;
    const __heroRiskFamily = __heroRisk?.riskFamily || null;
    const __jdDriverRows = __v2Arr(__v2Int?.jdCompetitiveness?.drivers)
      .map((driver) => ({
        type: __v2Text(driver?.type || driver?.kind),
        text: __v2Sentence(driver?.text || driver),
      }))
      .filter((driver) => driver.text);
    const __jdConflictDriver = __jdDriverRows.find((driver) => driver.type === "conflict") || null;
    const __jdDirectDriver = __jdDriverRows.find((driver) => driver.type === "directConnection") || null;
    const __jdDomainDriver = __jdDriverRows.find((driver) => driver.type === "domainDirectness") || null;
    const __heroDisplay = (() => {
      if (!__heroRisk) {
        return {
          headline: null,
          posture: null,
          sourceFamily: "unavailable",
          sourceLabel: "unavailable",
          sourceKeys: [],
          responseCategory: null,
        };
      }
      const __conflictText = __v2FirstLine(__jdConflictDriver?.text);
      const __directText = __v2FirstLine(__jdDirectDriver?.text);
      const __domainText = __v2FirstLine(__jdDomainDriver?.text);
      const __safeOwnerNarrative = __v2FirstLine(__v2Text(__v2Int?.jdCompetitiveness?.narrative));
      const __isHeroJudgmentSentence = (value) => {
        const text = __v2FirstLine(value);
        if (!text || __v2GenericText(text)) return false;
        if (!/[가-힣]/.test(text)) return false;
        if (/리스크$|확인 리스크$|증빙 리스크$|부족 리스크$/.test(text)) return false;
        return /(습니다|입니다|읽힙니다|읽혀|보입니다|보여|부족|약하|필요|맞지만|하지만|이력서|문서|근거|직접|충족)/.test(text) || text.length >= 24;
      };
      const __isHeroCategoryHeadline = (value) => {
        const text = __v2FirstLine(value);
        if (!text) return false;
        return !__isHeroJudgmentSentence(text) && /(리스크|요건|직접성|증빙|부족|확인)/.test(text);
      };
      const __pickHeroSentence = (items) => __v2Unique(items.map(__v2FirstLine)).find((text) => __isHeroJudgmentSentence(text)) || null;
      const __deriveHeroHeadline = () => {
        const __jdRequirement = __v2FirstLine(__heroRisk.jdEvidence?.[0]);
        const __resumeRead = __v2FirstLine(__heroRisk.resumeEvidence?.[0] || __heroRisk.supportingEvidence || __heroRisk.posture);
        if (!__jdRequirement) return null;
        if (__resumeRead) return `관련 경험은 보이지만, ${__jdRequirement} 기준을 직접 충족했다는 근거는 현재 이력서에서 약하게 읽힙니다.`;
        return `현재 이력서에서는 ${__jdRequirement} 기준을 직접 충족했다는 근거가 약하게 읽힙니다.`;
      };
      const __headlineFromDrivers = __pickHeroSentence([__conflictText, __directText]);
      const __headlineFromOwnerSummary = __pickHeroSentence([
        __heroRisk.posture,
        __heroRisk.summary,
        __heroRisk.supportingEvidence,
        __heroRisk.resumeEvidence?.[0],
        __heroRisk.headline,
      ]);
      const __headlineFromInterpretation = __pickHeroSentence([__safeOwnerNarrative, __domainText, __deriveHeroHeadline()]);
      const __fallbackHeadline = __isHeroCategoryHeadline(__heroRisk.headline) ? null : __v2FirstLine(__heroRisk.headline);
      const __categoryFallbackHeadline = __v2FirstLine(__heroRisk.headline);
      const __preferredHeadline = __headlineFromDrivers
        || __headlineFromOwnerSummary
        || __headlineFromInterpretation
        || __fallbackHeadline
        || __categoryFallbackHeadline;
      const __pickHeroPosture = (headline) => __v2Unique([
        __heroRisk.posture,
        __heroRisk.supportingEvidence,
        __heroRisk.resumeEvidence?.[0],
        __heroRisk.jdEvidence?.[0],
        __safeOwnerNarrative,
        __domainText,
        __directText,
        __conflictText,
      ].map(__v2FirstLine))
        .find((text) => text && !__v2GenericText(text) && __v2Similarity(text, headline) < 0.88) || __heroRisk.posture;
      const __sourceKeys = __v2Unique([
        ...__v2Arr(__heroRisk.sourceKeys),
        __conflictText ? "interpretationV2.jdCompetitiveness.drivers.conflict" : null,
        __directText ? "interpretationV2.jdCompetitiveness.drivers.directConnection" : null,
        __domainText ? "interpretationV2.jdCompetitiveness.drivers.domainDirectness" : null,
      ]);
      if (__heroRiskFamily === "must_have_gap" || __heroRiskFamily === "directness_context") {
        if (__headlineFromDrivers && /유관부서|전사|협업|범위/.test(__v2Norm(__conflictText))) {
          return {
            headline: __preferredHeadline,
            posture: __pickHeroPosture(__preferredHeadline),
            sourceFamily: "jd_competitiveness",
            sourceLabel: "jd competitiveness",
            sourceKeys: __sourceKeys,
            responseCategory: "clarify_scope",
          };
        }
        if (__headlineFromDrivers && /재무|회계|모델링|엑셀/.test(__v2Norm(__conflictText))) {
          return {
            headline: __preferredHeadline,
            posture: __pickHeroPosture(__preferredHeadline),
            sourceFamily: "jd_competitiveness",
            sourceLabel: "jd competitiveness",
            sourceKeys: __sourceKeys,
            responseCategory: "strengthen_directness_proof",
          };
        }
        if (__headlineFromDrivers) {
          return {
            headline: __preferredHeadline,
            posture: __pickHeroPosture(__preferredHeadline),
            sourceFamily: "jd_competitiveness",
            sourceLabel: "jd competitiveness",
            sourceKeys: __sourceKeys,
            responseCategory: "strengthen_directness_proof",
          };
        }
        if (__headlineFromInterpretation === __domainText) {
          return {
            headline: __preferredHeadline,
            posture: __pickHeroPosture(__preferredHeadline),
            sourceFamily: "jd_competitiveness",
            sourceLabel: "jd competitiveness",
            sourceKeys: __sourceKeys,
            responseCategory: "translate_domain_context",
          };
        }
      }
      return {
        headline: __preferredHeadline,
        posture: __pickHeroPosture(__preferredHeadline),
        sourceFamily: (__headlineFromDrivers || __headlineFromInterpretation === __domainText)
          ? "jd_competitiveness"
          : (__heroRisk.sourceFamily || "top3_canonical"),
        sourceLabel: (__headlineFromDrivers || __headlineFromInterpretation === __domainText)
          ? "jd competitiveness"
          : (__heroRisk.sourceFamily === "top3_canonical" ? "supported risk" : (__heroRisk.sourceFamily || "supported risk")),
        sourceKeys: __sourceKeys,
        responseCategory: null,
      };
    })();
    const __heroStatus = __heroRisk
      ? (__v2Text(__v2Decision?.status) === "provisional" ? "partial" : "ready")
      : (__v2Arr(__v2Decision?.riskDrivers).length > 0 ? "partial" : "unavailable");
    const __heroHeadline = __heroDisplay.headline || (__v2Arr(__v2Decision?.riskDrivers).length > 0
      ? "우선 확인될 가능성이 높은 리스크 축"
      : null);
    const __heroPosture = __heroDisplay.posture || (__v2Text(__v2Int?.jdCompetitiveness?.narrative) || null);
    const __heroAttention = __heroRisk
      ? __v2AttentionLevel(__heroRiskFamily)
      : (__v2Text(__v2Decision?.status) === "provisional" ? "provisional" : "review_needed");
    const __heroHeadlineNorm = __v2Norm(__heroHeadline);
    const __heroPostureNorm = __v2Norm(__heroPosture);
    const __whyCandidateFamilyKeys = [];
    const __whySuppressedFamilies = [];
    const __whySpecificitySummary = __v2FirstLine(__jdConflictDriver?.text || __jdDirectDriver?.text);
    const __hasExecutionSpecificity = /crm|sql|excel|모델링|자동화|리포트|분석|기획|tool|툴|경험 3년 이상|활용 능숙/.test(__v2Norm(__whySpecificitySummary));
    const __hasDomainTranslationNeed = !!__jdDomainDriver?.text;
    const __hasReadinessGap = __v2Text(__v2CareerAsm?.primaryThesis) === "transition-building" ||
      __v2Text(__v2CareerAsm?.primaryThesis) === "continuity-risk" ||
      __v2Arr(careerInterpretation?.currentFlow?.transitions).length > 0;
    const __ownershipGapDetected = ((__v2Int?.evidenceDepth?.buckets?.ownership ?? 1) === 0);

    const __whyRows = [];
    const __pushWhyRow = (row) => {
      if (!row?.family) return;
      __whyCandidateFamilyKeys.push(row.family);
      __whyRows.push(row);
    };
    if ((__jdConflictDriver?.text || __jdDirectDriver?.text || __v2Text(__v2Int?.jdCompetitiveness?.narrative)) && (
      __v2Text(__v2Int?.jdCompetitiveness?.status) === "weak" ||
      __v2Text(__v2Int?.jdCompetitiveness?.status) === "mixed" ||
      __heroRiskFamily === "directness_context" ||
      __heroRiskFamily === "must_have_gap"
    )) {
      __pushWhyRow({
        family: "directness",
        label: "Directness",
        state: __v2Text(__v2Int?.jdCompetitiveness?.status) || "partial",
        summary:
          __v2FirstLine(__jdConflictDriver?.text) ||
          __v2FirstLine(__jdDirectDriver?.text) ||
          (__v2Text(__v2Int?.jdCompetitiveness?.status) === "weak"
            ? "목표 역할과 바로 맞닿는 수행 근거가 충분한지 먼저 확인하려는 구조입니다."
            : "목표 역할과 현재 경험 사이 직접 연결성은 보이나, 핵심 책임 단위의 확인 질문이 먼저 붙을 수 있습니다."),
        sourceKeys: __v2Unique([
          "interpretationV2.jdCompetitiveness",
          __jdConflictDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.conflict" : null,
          __jdDirectDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.directConnection" : null,
        ]),
      });
    }
    if (__hasDomainTranslationNeed) {
      __pushWhyRow({
        family: "domainTranslation",
        label: "Domain Translation",
        state: __v2Text(__v2Int?.jdCompetitiveness?.status) || "partial",
        summary: __v2FirstLine(__jdDomainDriver?.text) || "도메인 차이를 설명하는 방식 자체가 확인 포인트로 올라올 수 있습니다.",
        sourceKeys: ["interpretationV2.jdCompetitiveness.drivers.domainDirectness"],
      });
    }
    if (__hasExecutionSpecificity) {
      __pushWhyRow({
        family: "executionSpecificity",
        label: "Execution Specificity",
        state: __v2Text(__v2Int?.evidenceDepth?.status) || "partial",
        summary: __whySpecificitySummary || "핵심 요구를 실제로 어떤 장면에서 수행했는지 구체도가 먼저 확인될 수 있습니다.",
        sourceKeys: __v2Unique([
          __jdConflictDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.conflict" : null,
          __jdDirectDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.directConnection" : null,
        ]),
      });
    }
    const __levelAsmNote = __v2Text(__v2LevelAsm?.notes?.[0]);
    const __hasMeaningfulLevelAsm = __v2Has(__levelAsmNote) && !/leadership evidence limited/.test(__v2Norm(__levelAsmNote));
    if (
      __ownershipGapDetected ||
      (__v2LevelAsm && (
        __v2Text(__v2LevelAsm.primaryThesis) === "decision-distance-gap" ||
        __v2Arr(__v2LevelAsm.conflictKeys).length > 0 ||
        __v2Arr(__v2LevelAsm.unresolvedKeys).length > 0 ||
        __heroRiskFamily === "ownership_scope" ||
        __hasMeaningfulLevelAsm
      ))
    ) {
      const __ownershipSummary = (__hasMeaningfulLevelAsm ? __levelAsmNote : "") ||
        ((__v2Int?.evidenceDepth?.buckets?.ownership ?? 1) === 0
          ? "담당 범위와 주도 수준을 읽을 표현이 적어, 실제로 어디까지 책임졌는지 먼저 확인될 수 있습니다."
          : "책임 범위와 주도 수준을 바로 확인하려는 흐름이 먼저 형성될 수 있습니다.");
      __pushWhyRow({
        family: "ownershipScope",
        label: "Ownership / Scope",
        state: __v2Text(__v2LevelAsm?.confidence) || "partial",
        summary: /leadership|scope|책임|주도/.test(__v2Norm(__ownershipSummary))
          ? __ownershipSummary
          : "업무를 해본 적이 있는지보다, 어느 범위까지 책임졌는지를 먼저 확인하려는 구조입니다.",
        sourceKeys: __v2Unique([
          __v2Text(__v2LevelAsm?.primaryThesis) ? "sectionAssemblies.levelPositionFit.primaryThesis" : null,
          __v2Arr(__v2LevelAsm?.conflictKeys).length > 0 ? "sectionAssemblies.levelPositionFit.conflictKeys" : null,
          __v2Arr(__v2LevelAsm?.unresolvedKeys).length > 0 ? "sectionAssemblies.levelPositionFit.unresolvedKeys" : null,
          ((__v2Int?.evidenceDepth?.buckets?.ownership ?? 1) === 0) ? "interpretationV2.evidenceDepth.buckets.ownership" : null,
        ]),
      });
    }
    if (__jdDomainDriver?.text || (__v2IndustryAsm && (
      __v2Text(__v2IndustryAsm.primaryThesis) !== "unclear" ||
      __v2Text(__v2AxisPack?.narrativeContext?.familyDistance) ||
      __heroRiskFamily === "directness_context" ||
      __heroRiskFamily === "transition_path"
    ))) {
      const __contextSummary =
        __v2FirstLine(__jdDomainDriver?.text) ||
        __v2Text(__v2IndustryAsm?.notes?.[0]) ||
        __v2Text(__v2AxisPack?.narrativeContext?.axisSummary) ||
        "현재 축과 목표 맥락 사이의 연결 방식을 추가로 설명해야 하는 구조입니다.";
      __pushWhyRow({
        family: "contextGap",
        label: "Context Gap",
        state: __v2Text(__v2IndustryAsm?.confidence) || "partial",
        summary: __contextSummary,
        sourceKeys: __v2Unique([
          __jdDomainDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.domainDirectness" : null,
          __v2Text(__v2IndustryAsm?.primaryThesis) ? "sectionAssemblies.industryContext.primaryThesis" : null,
          __v2Text(__v2AxisPack?.narrativeContext?.familyDistance) ? "candidateAxisPack.narrativeContext.familyDistance" : null,
        ]),
      });
    }
    if (__hasReadinessGap) {
      __pushWhyRow({
        family: "readinessGap",
        label: "Readiness Gap",
        state: __v2Text(__v2CareerAsm?.confidence) || "partial",
        summary: __v2Text(__v2CareerAsm?.primaryThesis) === "continuity-risk"
          ? "경력 연결은 보이지만, 지금 지원 역할로 바로 이어지는 준비도는 추가 설명이 필요할 수 있습니다."
          : "전환 의도는 읽히지만, 현재 시점에서 왜 준비된 이동인지 먼저 확인될 수 있습니다.",
        sourceKeys: __v2Unique([
          __v2Text(__v2CareerAsm?.primaryThesis) ? "sectionAssemblies.careerAccumulation.primaryThesis" : null,
          __v2Arr(careerInterpretation?.currentFlow?.transitions).length > 0 ? "careerInterpretation.currentFlow.transitions" : null,
        ]),
      });
    }
    if ((__v2Text(__v2Int?.evidenceDepth?.status) === "light" || __v2Text(__v2Int?.evidenceDepth?.status) === "thin") && (
      !__hasExecutionSpecificity ||
      !__hasDomainTranslationNeed ||
      __whyRows.length < 2
    )) {
      __pushWhyRow({
        family: "evidenceDepth",
        label: "Evidence Depth",
        state: __v2Text(__v2Int?.evidenceDepth?.status),
        summary: __v2Text(__v2Int?.evidenceDepth?.narrative) || "직접 근거 깊이가 얕아 추가 확인이 필요한 상태입니다.",
        sourceKeys: ["interpretationV2.evidenceDepth"],
      });
    }
    const __whyPriority = {
      domainTranslation: __heroDisplay.responseCategory === "translate_domain_context" ? 100 : 78,
      executionSpecificity: __heroDisplay.responseCategory === "strengthen_directness_proof" ? 96 : 76,
      readinessGap: __heroDisplay.responseCategory === "prepare_interview_answer" ? 92 : 74,
      ownershipScope: __heroDisplay.responseCategory === "clarify_scope" ? 98 : (__ownershipGapDetected ? 88 : 68),
      directness: (__heroRiskFamily === "must_have_gap" || __heroRiskFamily === "directness_context") ? 90 : 70,
      contextGap: __hasDomainTranslationNeed ? 72 : 66,
      evidenceDepth: 40,
    };
    const __whyThisRiskRows = __whyRows
      .map((row) => {
        const __structuralSummary = __v2Sentence(row.summary);
        return {
          ...row,
          summary: __structuralSummary,
          priority: __whyPriority[row.family] ?? 50,
        };
      })
      .filter((row) => {
        const scoreVsHeadline = __v2Similarity(row.summary, __heroHeadlineNorm);
        const scoreVsPosture = __v2Similarity(row.summary, __heroPostureNorm);
        const keep = scoreVsHeadline < 0.72 && scoreVsPosture < 0.8;
        if (!keep) __whySuppressedFamilies.push(`${row.family}:hero_similarity`);
        return keep;
      })
      .filter((row, index, arr) => arr.findIndex((item) => item.family === row.family) === index)
      .sort((a, b) => (b.priority - a.priority))
      .filter((row, index, arr) => {
        if (row.family === "evidenceDepth" && arr.some((item) => (
          item.family === "domainTranslation" ||
          item.family === "executionSpecificity" ||
          item.family === "readinessGap"
        ))) {
          __whySuppressedFamilies.push("evidenceDepth:specific_family_available");
          return false;
        }
        if (row.family === "contextGap" && arr.some((item) => item.family === "domainTranslation")) {
          __whySuppressedFamilies.push("contextGap:domainTranslation_preferred");
          return false;
        }
        return true;
      })
      .slice(0, 4)
      .map(({ priority, ...row }) => row);

    const __careerPrimaryAxis = __v2Text(__v2Int?.axisRead?.axisKey) || __v2Text(__v2AxisPack?.primaryAxisKey) || null;
    const __careerAxisNarrative = __v2Text(__v2Int?.axisRead?.narrative) || __v2Text(__v2AxisPack?.narrativeContext?.axisSummary);
    const __careerThesis = __v2Text(__v2CareerAsm?.primaryThesis);
    const __careerTransitions = __v2Arr(careerInterpretation?.currentFlow?.transitions).map((item) => __v2Text(item)).filter(Boolean).slice(0, 3);
    const __careerFamilyDistance = __v2Text(__v2AxisPack?.narrativeContext?.familyDistance);
    const __careerIndustryNote = __v2Text(__v2IndustryAsm?.notes?.[0]);
    const __careerDisplayThesis = (() => {
      if (__careerThesis === "continuity-risk") {
        return {
          key: "transition_context_active",
          text: "연속성보다 이동 맥락과 전환 배경이 함께 읽히는 경력 구조입니다.",
          reason: "upstream continuity-risk thesis preserved",
        };
      }
      if (__careerThesis === "transition-building") {
        return {
          key: "transition_building_visible",
          text: "전환을 준비하는 축으로 읽히며, 기존 경험의 재배치가 핵심 맥락이 됩니다.",
          reason: "upstream transition-building thesis preserved",
        };
      }
      if (__careerThesis === "strong-accumulation") {
        return {
          key: "stable_axis_accumulation",
          text: "누적된 경력 축이 비교적 안정적으로 이어지는 편입니다.",
          reason: "upstream strong-accumulation thesis preserved",
        };
      }
      if (__careerThesis === "related-but-fragmented") {
        if (__hasDomainTranslationNeed) {
          return {
            key: "adjacent_domain_bridge",
            text: "기존 축은 인접하게 이어지지만, 도메인 문법을 다시 번역해 보여줘야 하는 경력 맥락입니다.",
            reason: "related-but-fragmented + domain directness signal",
          };
        }
        if (__heroDisplay.responseCategory === "strengthen_directness_proof" || /재무|회계|모델링|엑셀/.test(__v2Norm(__jdConflictDriver?.text))) {
          return {
            key: "role_leap_with_related_base",
            text: "관련 기반은 있으나, 목표 역할 핵심 수행으로는 한 단계 도약하는 경력 맥락으로 읽힙니다.",
            reason: "related-but-fragmented + directness proof demand",
          };
        }
        if (__ownershipGapDetected) {
          return {
            key: "scope_thin_related_path",
            text: "관련 축은 이어지지만, 담당 범위와 주도 수준이 얇게 남아 있는 경력 맥락입니다.",
            reason: "related-but-fragmented + ownership gap",
          };
        }
        return {
          key: "fragmented_related_path",
          text: "관련 축은 확인되지만, 경력 연결 방식은 구간별로 나뉘어 읽힐 수 있습니다.",
          reason: "upstream related-but-fragmented thesis preserved",
        };
      }
      return {
        key: __careerThesis || "unavailable",
        text: __careerAxisNarrative || null,
        reason: __careerAxisNarrative ? "axis narrative fallback" : "no_display_refinement_signal",
      };
    })();
    const __careerSummaryParts = [
      __careerAxisNarrative,
      __careerDisplayThesis.text,
      (__careerDisplayThesis.key === "adjacent_domain_bridge" && __careerFamilyDistance)
        ? `현재 축과 목표 맥락의 거리는 ${__careerFamilyDistance} 수준으로 읽힙니다.`
        : "",
      (__careerDisplayThesis.key === "role_leap_with_related_base" && __whySpecificitySummary)
        ? "기존 경험의 공통 기반은 보이지만, 목표 역할 핵심 수행 장면을 더 직접 연결해야 합니다."
        : "",
      (__careerDisplayThesis.key === "transition_context_active" && __careerTransitions.length > 0)
        ? "전환 신호가 실제 경력 이동 설명과 함께 읽힙니다."
        : "",
      (__careerDisplayThesis.key === "scope_thin_related_path" && __careerIndustryNote)
        ? __careerIndustryNote
        : "",
    ].map(__v2Text).filter(Boolean);
    const __careerSummary = __careerSummaryParts
      .filter((part) => {
        const norm = __v2Norm(part);
        if (!norm) return false;
        if (/리스크|검토 포인트|우선 확인/.test(norm)) return false;
        if (__v2Similarity(norm, __heroPostureNorm) >= 0.72) return false;
        // Phase 5 clamp: suppress raw ontology-format strings (e.g. "sector_shift / IND_X → IND_Y")
        if (/ → /.test(part) || /\/\s*[A-Z_]{3}/.test(part)) return false;
        return true;
      })
      .slice(0, 2)
      .join(" ");

    const __reviewSuppressed = [];
    const __whyFamilies = new Set(__whyThisRiskRows.map((row) => row.family));
    const __reviewPointsBase = __v2SupportedTop
      .map((item, index) => ({
        id: item.id,
        riskFamily: item.riskFamily,
        label: item.headline,
        whyItSurfaced: __v2Sentence(item.posture),
        evidenceState: item.evidenceState,
        reviewSuggestion: item.reviewSuggestion,
        sourceKeys: item.sourceKeys,
        rank: index + 1,
      }))
      .filter((item) => {
        if (item.riskFamily === __heroRiskFamily) {
          __reviewSuppressed.push("dominant_family_duplicate");
          return false;
        }
        if (
          (item.riskFamily === "directness_context" && (__whyFamilies.has("directness") || __whyFamilies.has("contextGap"))) ||
          (item.riskFamily === "ownership_scope" && __whyFamilies.has("ownershipScope")) ||
          ((item.riskFamily === "must_have_gap" || item.riskFamily === "years_seniority") && __whyFamilies.has("evidenceDepth")) ||
          (item.riskFamily === "transition_path" && (__careerThesis === "transition-building" || __careerThesis === "continuity-risk"))
        ) {
          __reviewSuppressed.push("surface_family_duplicate");
          return false;
        }
        if (__v2Similarity(item.whyItSurfaced, __heroPostureNorm) >= 0.8 || __v2Similarity(item.label, __heroHeadlineNorm) >= 0.92) {
          __reviewSuppressed.push("hero_text_duplicate");
          return false;
        }
        return true;
      })
      .slice(0, 3)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    const __reviewFallbackFromWhy = __reviewPointsBase.length === 0
      ? __whyThisRiskRows
        .map((row) => {
          if (row.family === "directness") {
            return {
              id: "v2-review-directness",
              riskFamily: "review_directness_probe",
              label: "핵심 업무 직접 수행 장면 확인",
              whyItSurfaced: row.summary,
              evidenceState: __v2Text(__v2Int?.jdCompetitiveness?.status) || "partial",
              reviewSuggestion: "JD 문장과 바로 대응되는 실제 수행 장면 1개를 문제-행동-결과 구조로 준비하는 편이 안전합니다.",
              sourceKeys: row.sourceKeys,
              sourceFamily: "why_rows_probe",
              rank: 1,
            };
          }
          if (row.family === "ownershipScope") {
            return {
              id: "v2-review-scope",
              riskFamily: "review_scope_probe",
              label: "담당 범위·의사결정 수준 확인",
              whyItSurfaced: row.summary,
              evidenceState: ((__v2Int?.evidenceDepth?.buckets?.ownership ?? 1) === 0) ? "thin" : "partial",
              reviewSuggestion: "개인이 직접 결정한 범위와 협업 범위를 분리해 한 문장으로 설명할 준비가 필요합니다.",
              sourceKeys: row.sourceKeys,
              sourceFamily: "why_rows_probe",
              rank: 1,
            };
          }
          if (row.family === "contextGap") {
            return {
              id: "v2-review-context",
              riskFamily: "review_context_probe",
              label: "도메인/맥락 전환 설명 확인",
              whyItSurfaced: row.summary,
              evidenceState: "partial",
              reviewSuggestion: "업종명이 아니라 이어지는 업무 구조와 재사용 가능한 경험부터 연결해두는 편이 안전합니다.",
              sourceKeys: row.sourceKeys,
              sourceFamily: "why_rows_probe",
              rank: 1,
            };
          }
          if (row.family === "evidenceDepth") {
            return {
              id: "v2-review-evidence",
              riskFamily: "review_evidence_probe",
              label: "대표 사례 1개로 증빙 가능한지 확인",
              whyItSurfaced: row.summary,
              evidenceState: __v2Text(__v2Int?.evidenceDepth?.status) || "thin",
              reviewSuggestion: "설명 폭을 넓히기보다 대표 사례 1개를 수치·범위·결과까지 붙여 준비하는 편이 낫습니다.",
              sourceKeys: row.sourceKeys,
              sourceFamily: "why_rows_probe",
              rank: 1,
            };
          }
          return null;
        })
        .filter(Boolean)
        .filter((item, index, arr) => arr.findIndex((x) => x.riskFamily === item.riskFamily) === index)
        .slice(0, 3)
        .map((item, index) => ({ ...item, rank: index + 1 }))
      : [];
    const __reviewPoints = (__reviewPointsBase.length > 0 ? __reviewPointsBase : __reviewFallbackFromWhy)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    const __groundingDuplicateBucket = [];
    const __groundingSeedRisks = __reviewPointsBase.length > 0
      ? __reviewPointsBase
        .map((item) => __v2SupportedTop.find((risk) => risk.id === item.id) || null)
        .filter(Boolean)
      : [__heroRisk, ...__v2SupportedTop.filter((risk) => risk.id !== __heroRisk?.id).slice(0, 1)].filter(Boolean);
    const __groundingRowsBase = __groundingSeedRisks
      .map((risk) => {
        const __jd = __v2FirstLine(__jdConflictDriver?.text || __jdDirectDriver?.text || risk?.jdEvidence?.[0] || risk?.headline);
        const __resume = __v2FirstLine(risk?.resumeEvidence?.[0] || risk?.supportingEvidence || risk?.posture);
        if (!__jd && !__resume) return null;
        const __hasDirectProof = __v2Has(risk?.jdEvidence?.[0]) && __v2Has(risk?.resumeEvidence?.[0]);
        const __confidence = __hasDirectProof
          ? "high"
          : (__jd && __resume)
            ? "medium"
            : "low";
        return {
          comparisonItem: risk?.id === __heroRisk?.id ? (__heroHeadline || risk?.headline) : (risk?.headline || "검토 포인트"),
          jdExpects: __jd || "직접 JD 근거는 제한적입니다.",
          resumeShows: __resume || "직접 이력서 근거는 제한적입니다.",
          note: __hasDirectProof
            ? "JD와 이력서 양쪽에서 직접 확인 가능한 포인트입니다."
            : "직접 증빙이 부족해, 현재는 JD 요구와 이력서 설명 사이 비교 신호 중심으로 읽히고 있습니다.",
          confidence: __confidence,
          sourceFamily: __hasDirectProof ? "per_risk_evidence" : "top3_canonical_support",
          provenanceTier: __hasDirectProof ? "direct_proof" : "contextual_support",
          sourceKeys: __v2Unique([
            __jdConflictDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.conflict" : null,
            __jdDirectDriver?.text ? "interpretationV2.jdCompetitiveness.drivers.directConnection" : null,
            __v2Has(risk?.jdEvidence?.[0]) ? "top3[].jdEvidence" : null,
            __v2Has(risk?.resumeEvidence?.[0]) ? "top3[].resumeEvidence" : null,
            risk?.supportingEvidence ? "top3[].canonicalCard.supportingEvidence" : null,
          ]),
        };
      })
      .filter(Boolean);

    const __groundingRowsSupport = [];
    if (__v2LevelAsm && (
      __v2Text(__v2LevelAsm.primaryThesis) ||
      __v2Arr(__v2LevelAsm.primaryEvidenceKeys).length > 0 ||
      __v2Arr(__v2LevelAsm.unresolvedKeys).length > 0
    )) {
      __groundingRowsSupport.push({
        comparisonItem: "Ownership / Scope",
        jdExpects: "목표 역할에서 어느 범위까지 직접 책임졌는지 확인 가능한 근거",
        resumeShows: __v2Text(__v2LevelAsm.notes?.[0]) || "책임 범위와 주도 수준 관련 신호가 부분적으로만 확인됩니다.",
        note: __v2Arr(__v2LevelAsm.unresolvedKeys).length > 0
          ? "역할 범위 신호는 있으나, 주도 수준을 더 직접 연결할 필요가 있습니다."
          : "범위/레벨 정합성을 비교하는 데 사용된 구조 신호입니다.",
        confidence: __v2Text(__v2LevelAsm.confidence) || "low",
        sourceFamily: "section_assembly_level_position_fit",
        provenanceTier: "contextual_support",
        sourceKeys: __v2Unique([
          __v2Text(__v2LevelAsm.primaryThesis) ? "sectionAssemblies.levelPositionFit.primaryThesis" : null,
          __v2Arr(__v2LevelAsm.primaryEvidenceKeys).length > 0 ? "sectionAssemblies.levelPositionFit.primaryEvidenceKeys" : null,
          __v2Arr(__v2LevelAsm.unresolvedKeys).length > 0 ? "sectionAssemblies.levelPositionFit.unresolvedKeys" : null,
        ]),
      });
    }
    if (__v2AxisPack?.narrativeContext && (
      __v2Text(__v2AxisPack?.narrativeContext?.familyDistance) ||
      __v2Text(__v2AxisPack?.narrativeContext?.axisSummary)
    )) {
      __groundingRowsSupport.push({
        comparisonItem: "Role / Domain Context",
        jdExpects: "목표 역할·도메인과 현재 축이 어떻게 이어지는지 설명 가능한 연결 근거",
        resumeShows: __v2Text(__v2AxisPack?.narrativeContext?.axisSummary) || "축 연결성은 있으나, 맥락 설명이 더 필요합니다.",
        note: __v2Text(__v2AxisPack?.narrativeContext?.familyDistance)
          ? `family distance: ${__v2Text(__v2AxisPack.narrativeContext.familyDistance)}`
          : "candidate axis pack 기반 연결 구조입니다.",
        confidence: __v2Text(__v2Int?.axisRead?.status) === "readable" ? "medium" : "low",
        sourceFamily: "candidate_axis_pack",
        provenanceTier: "contextual_support",
        sourceKeys: __v2Unique([
          __v2Text(__v2AxisPack?.narrativeContext?.axisSummary) ? "candidateAxisPack.narrativeContext.axisSummary" : null,
          __v2Text(__v2AxisPack?.narrativeContext?.familyDistance) ? "candidateAxisPack.narrativeContext.familyDistance" : null,
        ]),
      });
    }
    if (__v2CareerAsm && (
      __v2Text(__v2CareerAsm.primaryThesis) ||
      __v2Arr(__v2CareerAsm.primaryEvidenceKeys).length > 0
    )) {
      __groundingRowsSupport.push({
        comparisonItem: "Career Continuity",
        jdExpects: "지금 지원 역할로 이어지는 누적 경로 또는 전환 맥락",
        resumeShows: __careerSummary || "경력 축은 읽히지만 연결 설명은 더 필요할 수 있습니다.",
        note: __careerTransitions.length > 0
          ? `전환 신호 ${__careerTransitions.length}개가 함께 확인됩니다.`
          : "career accumulation assembly 기반 비교입니다.",
        confidence: __v2Text(__v2CareerAsm.confidence) || "low",
        sourceFamily: "section_assembly_career_accumulation",
        provenanceTier: "contextual_support",
        sourceKeys: __v2Unique([
          __v2Text(__v2CareerAsm.primaryThesis) ? "sectionAssemblies.careerAccumulation.primaryThesis" : null,
          __v2Arr(__v2CareerAsm.primaryEvidenceKeys).length > 0 ? "sectionAssemblies.careerAccumulation.primaryEvidenceKeys" : null,
        ]),
      });
    }
    if (__v2Decision && __v2Arr(__v2Decision.riskDrivers).length > 0) {
      __groundingRowsSupport.push({
        comparisonItem: "Interaction Decision",
        jdExpects: "현재 공고에서 우선 검증될 축이 무엇인지 구조적으로 드러나는가",
        resumeShows: __v2Text(__v2Decision.riskDrivers?.[0]?.text || __v2Decision.riskDrivers?.[0]) || "risk driver가 구조적으로 감지되었습니다.",
        note: __v2Text(__v2Decision.status) ? `decision status: ${__v2Text(__v2Decision.status)}` : "interaction decision 기반 fallback row입니다.",
        confidence: __v2Text(__v2Decision.confidence) || "low",
        sourceFamily: "interaction_decision",
        provenanceTier: "diagnostic_fallback",
        sourceKeys: ["interactionDecision.riskDrivers", "interactionDecision.status"],
      });
    }
    // Phase 14-14: top1-scoped grounding rows — REQUIREMENT_PROOF_COMPARISON + DIRECT_EVIDENCE_CUE
    const __groundingRowsTop1 = [];
    if (__top1RequirementProofRelation && __heroRiskFamily) {
      const __reqLabel = __heroRiskFamily.replace(/_/g, " ");
      const __proofStateNote = __top1EvidenceState === "direct"
        ? "현재 직접 수행 근거가 양쪽에서 확인됩니다."
        : __top1EvidenceState === "partial"
          ? "관련 근거가 부분적으로 확인되어 있으나, 직접 대응 증빙이 더 필요한 상태입니다."
          : "현재 직접 수행 근거가 충분히 확인되지 않아, 이 축이 우선 점검 포인트로 읽히고 있습니다.";
      __groundingRowsTop1.push({
        comparisonItem: "요구-증빙 비교",
        jdExpects: __reqLabel + " 관련 직접 수행 근거 또는 대응 경험",
        resumeShows: __top1ProofForText || "현재 문서에서 직접 수행 근거는 제한적입니다.",
        note: __proofStateNote,
        confidence: __top1EvidenceState === "direct" ? "high" : __top1EvidenceState === "partial" ? "medium" : "low",
        sourceFamily: "top1_req_proof_relation",
        provenanceTier: "top1_req_proof",
        sourceKeys: ["topRiskRead.structured.top1RequirementProofRelation", "topRiskRead.structured.top1ProofForText"],
      });
    }
    if (__top1EvidenceCue && __top1ProofMissingText
      && __v2Text(__top1EvidenceCue) !== __v2Text(__top1ProofForText)) {
      __groundingRowsTop1.push({
        comparisonItem: "직접 증거 수준",
        jdExpects: __v2Text(__heroRisk?.jdEvidence?.[0]) || "공고 기준 직접 수행 요건",
        resumeShows: __top1EvidenceCue,
        note: __top1ProofMissingText + " — 이 격차가 현재 증거 수준 차이로 이어지고 있습니다.",
        confidence: __top1EvidenceState === "direct" ? "medium" : "low",
        sourceFamily: "top1_direct_evidence",
        provenanceTier: "top1_direct_evidence",
        sourceKeys: ["topRiskRead.structured.top1EvidenceCue", "topRiskRead.structured.top1ProofMissingText"],
      });
    }
    const __groundingRowsMerged = [...__groundingRowsTop1, ...__groundingRowsBase, ...__groundingRowsSupport]
      .filter((row) => {
        const dupKey = [__v2Norm(row.comparisonItem), __v2Norm(row.jdExpects), __v2Norm(row.resumeShows)].join("|");
        const hasDup = __groundingDuplicateBucket.some((existing) => __v2Similarity(existing, dupKey) >= 0.88);
        if (hasDup) return false;
        __groundingDuplicateBucket.push(dupKey);
        return true;
      });
    const __top1ReqProofRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "top1_req_proof");
    const __top1DirectEvidenceRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "top1_direct_evidence");
    const __directProofRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "direct_proof");
    const __candidateProofRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "candidate_proof");
    const __contextualSupportRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "contextual_support");
    const __diagnosticFallbackRows = __groundingRowsMerged.filter((row) => row.provenanceTier === "diagnostic_fallback");
    const __proofCapacity = __top1ReqProofRows.length + __top1DirectEvidenceRows.length + __directProofRows.length + __candidateProofRows.length;
    const __contextualCap = __proofCapacity > 0 ? __proofCapacity : 1;
    const __diagnosticCap = __proofCapacity > 0 ? 1 : 1;
    const __groundingRows = [
      ...__top1ReqProofRows,
      ...__top1DirectEvidenceRows,
      ...__directProofRows,
      ...__candidateProofRows,
      ...__contextualSupportRows.slice(0, __contextualCap),
      ...__diagnosticFallbackRows.slice(0, __diagnosticCap),
    ].slice(0, __proofCapacity > 0 ? 5 : 2);

    const __categoryByFamily = {
      ownership_scope: "clarify_scope",
      directness_context: "translate_domain_context",
      must_have_gap: "strengthen_directness_proof",
      years_seniority: "prepare_interview_answer",
      transition_path: "prepare_interview_answer",
    };
    const __whyCategoryByFamily = {
      directness: "strengthen_directness_proof",
      ownershipScope: "clarify_scope",
      contextGap: "translate_domain_context",
      evidenceDepth: "prepare_interview_answer",
    };
    const __v2ActionFromNext = __v2Arr(vm?.nextActions)
      .map((action) => {
        const title = __v2Text(action?.title);
        const description = __v2Text(action?.description || action?.why);
        if (!title && !description) return null;
        return {
          category: "prepare_interview_answer",
          title: title || "설명 준비 포인트",
          instruction: description || title,
          linkedRiskFamily: __heroRiskFamily,
          linkedEvidenceFamily: __heroRisk?.evidenceState || null,
        };
      })
      .filter(Boolean);
    const __v2ActionPrimary = (() => {
      const __hint = __v2Text(__v2Top3?.[0]?.interviewPrepHint || vm?.causePack?.action?.linkedSuspicions?.[0]);
      if (__hint) {
        return {
          category: __heroDisplay.responseCategory || __categoryByFamily[__heroRiskFamily] || "prepare_interview_answer",
          title: "우선 설명 준비",
          instruction: __hint,
          linkedRiskFamily: __heroRiskFamily,
          linkedEvidenceFamily: __heroRisk?.evidenceState || null,
        };
      }
      if (__v2ActionFromNext[0]) return __v2ActionFromNext[0];
      return null;
    })();
    const __v2ActionSecondary = __v2Unique([
      ...__v2ActionFromNext.slice(__v2ActionPrimary ? 1 : 0),
      ...__whyThisRiskRows.map((row) => ({
        category: __whyCategoryByFamily[row.family] || "prepare_interview_answer",
        title:
          row.family === "directness" ? "직접 수행 장면 준비" :
          row.family === "ownershipScope" ? "담당 범위 구분 준비" :
          row.family === "contextGap" ? "도메인 맥락 번역 준비" :
          "대표 사례 압축 준비",
        instruction:
          row.family === "directness" ? "JD 핵심 문장과 바로 대응되는 수행 사례 1개를 먼저 준비합니다." :
          row.family === "ownershipScope" ? "개인이 직접 책임진 범위와 협업 범위를 구분해 설명할 준비가 필요합니다." :
          row.family === "contextGap" ? "도메인 차이를 설명하기보다 이어지는 업무 구조와 재사용 가능한 경험을 먼저 연결합니다." :
          "대표 사례 1개를 문제-행동-결과 구조로 압축해 증빙 포인트로 준비합니다.",
        linkedRiskFamily: __heroRiskFamily,
        linkedEvidenceFamily: row.family,
      })),
      ...__v2Arr(vm?.causePack?.action?.linkedMissingProof).slice(0, 2).map((item) => ({
        category: "strengthen_directness_proof",
        title: "보강 근거 준비",
        instruction: __v2Text(item),
        linkedRiskFamily: __heroRiskFamily,
        linkedEvidenceFamily: "missing_proof",
      })),
    ])
      .filter((item) => item && __v2Has(item.instruction))
      .filter((item, index, arr) => arr.findIndex((x) => `${x.category}|${__v2Norm(x.title)}` === `${item.category}|${__v2Norm(item.title)}`) === index)
      .filter((item) => !(__v2ActionPrimary && item.category === __v2ActionPrimary.category && __v2Norm(item.title) === __v2Norm(__v2ActionPrimary.title)))
      .slice(0, 2);
    const __actionUseWhenByCategory = {
      clarify_scope: "담당 범위나 의사결정 수준을 먼저 확인하는 질문이 들어올 때",
      translate_domain_context: "도메인 전환 맥락이나 업종 차이를 먼저 설명해야 할 때",
      strengthen_directness_proof: "JD 핵심 업무를 실제로 해봤는지 직접 묻는 질문이 나올 때",
      prepare_interview_answer: "대표 사례 하나로 바로 증명해 달라는 질문이 들어올 때",
    };
    const __actionAvoidByCategory = {
      clarify_scope: "전체적으로 다 했습니다",
      translate_domain_context: "업종만 다를 뿐 다 비슷합니다",
      strengthen_directness_proof: "정확히 같진 않지만 할 수 있을 것 같습니다",
      prepare_interview_answer: "여러 가지를 조금씩 했습니다",
    };

    // Phase 5: judgment-owned surface builders — typeReadV2 + proofSummaryV2
    const __judgItems = vm?.judgmentPack?.items ?? {};
    const __j = (key) => (__judgItems[key] && typeof __judgItems[key] === "object") ? __judgItems[key] : null;
    const __typeReadLabelMap = {
      targetRoleFit: "직무 적합성", industryContinuity: "도메인 연속성",
      levelPositionFit: "레벨 포지션 적합성", transitionReadiness: "전환 준비 상태",
      evidenceDensity: "증빙 밀도", ownershipDepth: "오너십 깊이",
    };
    // Phase 6: raw ontology string guard — context must not expose raw IDs (consistent with careerFlow clamp)
    const __isRawOntology = (s) => typeof s === "string" && (/ → /.test(s) || /\/\s*[A-Z_]{3}/.test(s));
    const __safeCtx = (s) => (s && !__isRawOntology(s)) ? s : null;
    const __typeReadRolePrimaryKeys = ["targetRoleFit", "industryContinuity", "levelPositionFit", "ownershipDepth"];
    const __typeReadRoleItems = __typeReadRolePrimaryKeys
      .map(__j)
      .filter((j) => j && j.status !== "unavailable" && (j.why || j.context));
    const __typeReadRolePrimary = __typeReadRoleItems.find((j) => j.why || j.context) || null;
    const __typeReadRoleSupportItems = __typeReadRoleItems
      .filter((j) => j && j !== __typeReadRolePrimary)
      .map((j) => ({
        key: j.key,
        label: __typeReadLabelMap[j.key] ?? j.key,
        status: j.status,
        sourceFamily: j.sourceFamily || "judgment_pack",
        posture: j.why || null,
        context: __safeCtx(j.context) || null,
        confidence: j.confidence || null,
        evidenceStrength: __v2Text(j.evidenceStrength) || null,
      }));
    const __typeReadRolePrimarySurface = __typeReadRolePrimary ? {
      key: __typeReadRolePrimary.key,
      label: __typeReadLabelMap[__typeReadRolePrimary.key] ?? __typeReadRolePrimary.key,
      status: __typeReadRolePrimary.status,
      sourceFamily: __typeReadRolePrimary.sourceFamily || "judgment_pack",
      posture: __typeReadRolePrimary.why || null,
      context: __safeCtx(__typeReadRolePrimary.context) || null,
      confidence: __typeReadRolePrimary.confidence || null,
      evidenceStrength: __v2Text(__typeReadRolePrimary.evidenceStrength) || null,
    } : null;
    const __typeReadV2 = {
      status: __typeReadRolePrimary ? __typeReadRolePrimary.status : "unavailable",
      sourceFamily: __typeReadRolePrimary ? (__typeReadRolePrimary.sourceFamily || "judgment_pack") : "fallback",
      label: __typeReadRolePrimary ? (__typeReadLabelMap[__typeReadRolePrimary.key] ?? __typeReadRolePrimary.key) : null,
      posture: __typeReadRolePrimary?.why || null,
      context: __safeCtx(__typeReadRolePrimary?.context) || null,
      badge: __typeReadRolePrimary ? __typeReadRolePrimary.status.replace(/_/g, " ") : null,
      confidence: __typeReadRolePrimary?.confidence || null,
      evidenceStrength: __v2Text(__typeReadRolePrimary?.evidenceStrength) || null,
      dominantJudgment: __typeReadRolePrimary?.key || null,
      roleReadPrimary: __typeReadRolePrimarySurface,
      roleReadSupport: {
        items: __typeReadRoleSupportItems,
        unavailableReason: __typeReadRoleSupportItems.length > 0 ? null : "role_read_support 없음",
      },
      unavailableReason: __typeReadRolePrimary ? null : "role_read_primary 없음",
    };
    const __proofPrimaryKeys = ["evidenceDensity", "ownershipDepth", "achievementProof", "toolProof"];
    const __proofSupportKeys = ["targetRoleFit", "levelPositionFit"];
    const __proofAllJudgments = [...__proofPrimaryKeys, ...__proofSupportKeys].map(__j).filter(Boolean);
    const __proofStrengths = __proofAllJudgments
      .filter((j) => j.status !== "unavailable" && (__v2Arr(j.proofFor).length > 0 || j.why))
      .map((j) => {
        const __rawProofText = __v2Arr(j.proofFor)[0] || j.why;
        // Phase 6 consistency: apply same raw-ontology guard used in typeReadV2.context
        // roleSummary internal path strings (e.g. "same_role_family / DISCOVERY_STRATEGY_PM") must not surface here
        const __proofText = __isRawOntology(__rawProofText) ? null : __rawProofText;
        return {
          judgment: j.key,
          text: __proofText,
          confidence: j.confidence || null,
          evidenceStrength: __v2Text(j.evidenceStrength) || null,
        };
      })
      .filter((s) => s.text);
    const __proofMissing = __proofAllJudgments
      .filter((j) => (j.status === "partial" || j.status === "unavailable") && (__v2Arr(j.proofMissing).length > 0 || j.actionHint))
      .map((j) => ({
        judgment: j.key,
        text: __v2Arr(j.proofMissing)[0] || j.actionHint,
        confidence: j.confidence || null,
        evidenceStrength: __v2Text(j.evidenceStrength) || null,
      }))
      .filter((s) => s.text);
    const __proofSummaryV2 = {
      status: __proofStrengths.length > 0 ? "ready" : (__proofMissing.length > 0 ? "partial" : "unavailable"),
      sourceFamily: (__proofStrengths.length > 0 || __proofMissing.length > 0) ? "judgment_pack" : "fallback",
      strengths: __proofStrengths,
      missing: __proofMissing,
      unavailableReason: __proofStrengths.length === 0 && __proofMissing.length === 0 ? "judgment 기반 증빙 신호 없음" : null,
    };

    // Phase 6: topRiskRead meta alignment — prefer judgment-owned sourceFamily/confidence when typeReadV2 active
    const __topRiskSourceFamily = (__typeReadV2.status !== "unavailable" && __typeReadV2.sourceFamily && __typeReadV2.sourceFamily !== "fallback")
      ? __typeReadV2.sourceFamily
      : (__heroRisk ? (__heroDisplay.sourceFamily || "top3_canonical") : (__v2Arr(__v2Decision?.riskDrivers).length > 0 ? "interaction_decision" : "unavailable"));
    const __topRiskConfidence = (__typeReadV2.status !== "unavailable" && __typeReadV2.confidence)
      ? __typeReadV2.confidence
      : (__v2Text(__v2Decision?.confidence) || (__heroRisk ? __heroRisk.evidenceState : null));
    const __topRiskEvidenceStrength = (__typeReadV2.status !== "unavailable" && __typeReadV2.evidenceStrength)
      ? __typeReadV2.evidenceStrength
      : null;

    // Phase 14-10: risk-first hero lock — topRiskRead hero copy stays risk-owned
    const __heroHeadlineJ = __heroHeadline;
    const __heroPostureJ = __heroPosture;
    const __topRiskOwnerItems = __v2SupportedTop
      .map((item, index) => {
        const __isHeroItem = item.id === __heroRisk?.id;
        const __headline = __isHeroItem ? (__heroHeadlineJ || item.headline) : item.headline;
        const __posture = __isHeroItem ? (__heroPostureJ || item.posture || item.summary) : (item.posture || item.summary);
        const __reasonLines = __v2Unique([
          __v2FirstLine(__posture),
          __v2FirstLine(item.supportingEvidence),
          __v2FirstLine(item.resumeEvidence?.[0]),
          __v2FirstLine(item.jdEvidence?.[0]),
        ]).filter(Boolean).slice(0, 3);
        const __whyItems = __isHeroItem
          ? __whyThisRiskRows.map((row) => __v2Sentence(row.summary)).filter(Boolean).slice(0, 2)
          : [];
        const __evidenceLines = __v2Unique([
          __v2FirstLine(item.jdEvidence?.[0]),
          __v2FirstLine(item.resumeEvidence?.[0]),
          __v2FirstLine(item.supportingEvidence),
        ]).filter(Boolean).slice(0, 2);
        return {
          id: item.id,
          rank: index + 1,
          riskFamily: item.riskFamily,
          label: __headline,
          headline: __headline,
          posture: __posture,
          summary: item.summary || __posture,
          sourceFamilyLabel: __isHeroItem ? (__heroDisplay.sourceLabel || "supported risk") : "supported risk",
          confidenceLabel: __isHeroItem ? __topRiskConfidence : (item.evidenceState || null),
          strengthLabel: __isHeroItem ? __heroAttention.replace(/_/g, " ") : (item.evidenceState || null),
          evidenceStrength: __isHeroItem ? (__v2Text(__topRiskEvidenceStrength) || null) : (__v2Text(item.evidenceStrength) || null),
          whyThisRiskItems: __whyItems,
          reasonLines: __reasonLines,
          evidenceLines: __evidenceLines,
          reviewSuggestion: item.reviewSuggestion || null,
          detailBody: __v2Unique([
            __v2Sentence(__posture),
            __v2Sentence(item.supportingEvidence),
            __v2Sentence(item.reviewSuggestion),
          ]).filter(Boolean).slice(0, 3),
          sourceKeys: item.sourceKeys,
        };
      })
      .filter((item) => item.headline && item.posture);

    const __surfaceContract = ({
      semanticMode,
      sourceFamily,
      status,
      evidenceStrength = null,
      hiddenReason = null,
      unavailableReason = null,
      duplicationGuardHint,
      text,
      structured,
    }) => ({
      semanticMode,
      sourceFamily,
      status,
      evidenceStrength: __v2Text(evidenceStrength) || null,
      hiddenReason,
      unavailableReason,
      duplicationGuardHint,
      text: (text && typeof text === "object") ? text : {},
      structured: (structured && typeof structured === "object") ? structured : {},
    });

    // Phase 14-10.4 slice: hero-risk-specific (top1-scoped) materialization — replaces global-approximation sources
    // top1ProofForText: derived from hero risk evidence fields (not from global judgmentPack.proofFor[0])
    const __top1ProofForText = __heroRisk
      ? (__v2Text(__heroRisk.resumeEvidence?.[0]) || __v2Text(__heroRisk.supportingEvidence) || null)
      : null;
    // top1ProofMissingText: from hero actionHint (= narrative.interviewPrepHint) — exactly top1-bound
    const __top1ProofMissingText = __heroRisk ? (__heroRisk.actionHint || null) : null;
    // top1EvidenceCue: strongest direct evidence cue from hero risk
    const __top1EvidenceCue = __heroRisk
      ? (__v2Text(__heroRisk.jdEvidence?.[0]) || __v2Text(__heroRisk.resumeEvidence?.[0]) || __v2Text(__heroRisk.supportingEvidence) || null)
      : null;
    // top1RequirementProofRelation: composed entirely from __heroRisk fields (no global judgment mix)
    const __top1EvidenceState = __heroRisk?.evidenceState || null;
    const __top1RequirementProofRelation = __heroRiskFamily ? {
      requirementLabel: __heroRiskFamily,
      proofState: __top1EvidenceState || "thin",
      sourceLabel: __heroRisk ? (__heroDisplay.sourceLabel || "supported risk") : null,
      relationKind: __top1EvidenceState === "direct" ? "satisfied" : "gap",
    } : null;
    // top1Precision: owner-path provenance metadata — do not expose directly to UI
    const __top1Precision = {
      proofForText: __top1ProofForText ? "derived_from_top1_fields" : "absent",
      proofMissingText: __top1ProofMissingText ? "exact" : "absent",
      requirementProofRelation: __top1RequirementProofRelation
        ? (__top1EvidenceState ? "derived_from_top1_fields" : "coarse_family_level")
        : "absent",
    };

    const __reportV2 = {
      version: "v2",
      status: (__heroStatus === "ready" || __heroStatus === "partial") ? "ready" : "partial",
      availability: {
        topRiskRead: __heroStatus,
        whyThisRisk: __whyThisRiskRows.length >= 2 ? "ready" : (__whyThisRiskRows.length === 1 ? "partial" : "unavailable"),
        careerContext: (__careerSummaryParts.length > 0 || __careerTransitions.length > 0) ? "ready" : "unavailable",
        supportedReviewPoints: __reviewPoints.length >= 2 ? "ready" : (__reviewPoints.length === 1 ? "partial" : "unavailable"),
        evidenceGrounding: __groundingRows.length >= 2 ? "ready" : (__groundingRows.length === 1 ? "partial" : "unavailable"),
        actionResponse: (__v2ActionPrimary || __v2ActionSecondary.length > 0) ? "ready" : "unavailable",
      },
      diagnostics: {
        sourceMap: {
          topRiskRead: __heroRisk ? __heroRisk.sourceKeys : (__v2Arr(__v2Decision?.riskDrivers).length > 0 ? ["interactionDecision.riskDrivers"] : []),
          whyThisRisk: __whyThisRiskRows.flatMap((row) => row.sourceKeys || []),
          careerContext: __v2Unique([
            __careerThesis ? "sectionAssemblies.careerAccumulation.primaryThesis" : null,
            __careerAxisNarrative ? "interpretationV2.axisRead" : null,
            __careerTransitions.length > 0 ? "careerInterpretation.currentFlow.transitions" : null,
          ]),
          supportedReviewPoints: __reviewPoints.flatMap((item) => item.sourceKeys || []),
          evidenceGrounding: __groundingRows.flatMap((row) => row.sourceKeys || []),
          actionResponse: __v2Unique([
            __v2ActionPrimary ? "top3[].interviewPrepHint" : null,
            __v2ActionFromNext.length > 0 ? "vm.nextActions" : null,
            __v2Arr(vm?.causePack?.action?.linkedSuspicions).length > 0 ? "causePack.action.linkedSuspicions" : null,
            __v2Arr(vm?.causePack?.action?.linkedMissingProof).length > 0 ? "causePack.action.linkedMissingProof" : null,
          ]),
        },
        duplicatedFamilies: __v2Unique([
          __heroRiskFamily && __whyThisRiskRows.some((row) => row.family === "contextGap") && __heroRiskFamily === "directness_context"
            ? "topRiskRead:directness_context|whyThisRisk:contextGap"
            : null,
        ]),
        bannedSourceLeak: [],
        candidateEvidenceUnavailable: true,
        evidenceBucketsUnavailable: true,
      },
      topRiskRead: __surfaceContract({
        semanticMode: "hybrid",
        sourceFamily: __topRiskSourceFamily,
        status: __heroStatus,
        evidenceStrength: __topRiskEvidenceStrength,
        unavailableReason: __heroRisk ? null : "no_supported_top_risk",
        duplicationGuardHint: "hero_risk_only",
        text: {
          headline: __heroHeadlineJ,
          posture: __heroPostureJ,
          badge: __heroAttention.replace(/_/g, " "),
          confidence: __topRiskConfidence,
          evidenceStrength: __topRiskEvidenceStrength,
          sourceLabel: __heroRisk ? (__heroDisplay.sourceLabel || "supported risk") : (__v2Arr(__v2Decision?.riskDrivers).length > 0 ? "interaction decision" : "unavailable"),
        },
        structured: {
          riskId: __heroRisk?.id || null,
          riskFamily: __heroRiskFamily,
          attentionLevel: __heroAttention,
          confidence: __topRiskConfidence,
          evidenceStrength: __topRiskEvidenceStrength,
          sourceKeys: __heroRisk ? (__heroDisplay.sourceKeys || __heroRisk.sourceKeys) : ["interactionDecision.riskDrivers"],
          headline: __heroHeadlineJ,
          postureSummary: __heroPostureJ,
          strengthLabel: __heroAttention.replace(/_/g, " "),
          confidenceLabel: __topRiskConfidence,
          sourceFamilyLabel: __heroRisk ? (__heroDisplay.sourceLabel || "supported risk") : (__v2Arr(__v2Decision?.riskDrivers).length > 0 ? "interaction decision" : "unavailable"),
          actionHint: __heroRisk?.actionHint || null,
          familyDistance: __v2Text(__v2AxisPack?.narrativeContext?.familyDistance) || "",
          // Phase 14-10.4 slice: top1-scoped fields (replaces global-approximation from Phase 14-13.6)
          proofForText: __top1ProofForText,
          proofMissingText: __top1ProofMissingText,
          requirementProofRelation: __top1RequirementProofRelation,
          // Explicit top1-named fields — consumer can distinguish exact vs coarse via top1Precision
          top1ProofForText: __top1ProofForText,
          top1ProofMissingText: __top1ProofMissingText,
          top1RequirementProofRelation: __top1RequirementProofRelation,
          top1RequirementLabel: __heroRiskFamily || null,
          top1SourceLabel: __heroRisk ? (__heroDisplay.sourceLabel || __heroRisk.sourceFamily || null) : null,
          top1EvidenceCue: __top1EvidenceCue,
          top1Precision: __top1Precision,
          items: __topRiskOwnerItems,
        },
      }),
      whyThisRisk: __surfaceContract({
        semanticMode: "selection-first",
        sourceFamily: __whyThisRiskRows.length > 0 ? "section_assemblies" : "unavailable",
        status: __whyThisRiskRows.length >= 2 ? "ready" : (__whyThisRiskRows.length === 1 ? "partial" : "unavailable"),
        evidenceStrength: __topRiskEvidenceStrength,
        unavailableReason: __whyThisRiskRows.length > 0 ? null : "no_structural_cause_rows",
        duplicationGuardHint: "risk_cause_only",
        text: {
          title: "Why This Risk Emerged",
          summary: null,
        },
        structured: {
          summaryLine: null,
          rows: __whyThisRiskRows.map((row) => ({
            label: row.label,
            value: row.summary,
            status: row.state,
            note: row.family,
            sourceKeys: row.sourceKeys,
          })),
          diagnostics: {
            candidateFamilyKeys: __v2Unique(__whyCandidateFamilyKeys),
            emittedFamilyKeys: __whyThisRiskRows.map((row) => row.family),
            suppressedFamilyKeys: __v2Unique(__whySuppressedFamilies),
          },
        },
      }),
      careerContext: __surfaceContract({
        semanticMode: "hybrid",
        sourceFamily: (__careerSummaryParts.length > 0 || __careerTransitions.length > 0) ? "career_accumulation" : "unavailable",
        status: (__careerSummaryParts.length > 0 || __careerTransitions.length > 0) ? "ready" : "unavailable",
        unavailableReason: (__careerSummaryParts.length > 0 || __careerTransitions.length > 0) ? null : "no_readable_career_context",
        duplicationGuardHint: "career_context_only",
        text: {
          title: __careerPrimaryAxis ? `${__careerPrimaryAxis} 기반 경력 맥락` : "Career Read / Positioning Context",
          summary: __careerSummary || null,
        },
        structured: {
          mainThesis: __careerSummary || __careerDisplayThesis.text || null,
          supportingPoints: __v2Unique([
            ...__careerTransitions.slice(0, 2),
            (__careerPrimaryAxis && __careerDisplayThesis.key !== "adjacent_domain_bridge") ? `${__careerPrimaryAxis} 축 기반으로 읽힙니다.` : null,
            (__careerDisplayThesis.key === "adjacent_domain_bridge" && __careerFamilyDistance) ? `도메인 거리는 ${__careerFamilyDistance} 수준으로 해석됩니다.` : null,
          ]).slice(0, 2),
          sourceFamilyLabel: (__careerSummaryParts.length > 0 || __careerTransitions.length > 0) ? "career accumulation" : "unavailable",
          primaryAxis: __careerPrimaryAxis,
          primaryThesis: __careerThesis || null,
          continuity: __v2Arr(__v2CareerAsm?.primaryEvidenceKeys),
          transitions: __careerTransitions,
          readability: __v2Text(__v2Int?.axisRead?.status) || null,
          diagnostics: {
            upstreamThesisKey: __careerThesis || null,
            displayThesisKey: __careerDisplayThesis.key || null,
            displayRefinementReason: __careerDisplayThesis.reason || null,
          },
        },
      }),
      supportedReviewPoints: __surfaceContract({
        semanticMode: "hybrid",
        sourceFamily: __reviewPoints.length > 0 ? (__reviewPointsBase.length > 0 ? "top3_canonical" : "why_rows_probe") : "unavailable",
        status: __reviewPoints.length >= 2 ? "ready" : (__reviewPoints.length === 1 ? "partial" : "unavailable"),
        unavailableReason: __reviewPoints.length > 0 ? null : "no_supported_review_points",
        duplicationGuardHint: "review_cards_only",
        text: {
          summary: __reviewPoints.length > 0 ? "우선 확인될 가능성이 높은 포인트만 남겼습니다." : null,
        },
        structured: {
          items: __reviewPoints.map((item) => ({
            ...item,
            sourceFamily: item.sourceFamily || (__reviewPointsBase.length > 0 ? "top3_canonical" : "why_rows_probe"),
          })),
          diagnostics: {
            removedAsDuplicateCount: __reviewSuppressed.length,
            emittedCount: __reviewPoints.length,
            suppressedReasonSummary: __v2Unique(__reviewSuppressed),
          },
        },
      }),
      evidenceGrounding: __surfaceContract({
        semanticMode: "text-first",
        sourceFamily: __groundingRows.length > 0 ? "per_risk_evidence" : "unavailable",
        status: __groundingRows.length >= 2 ? "ready" : (__groundingRows.length === 1 ? "partial" : "unavailable"),
        unavailableReason: __groundingRows.length > 0 ? null : "no_proof_rows",
        duplicationGuardHint: "proof_board_only",
        text: {
          title: "Evidence Grounding",
        },
        structured: {
          rows: __groundingRows,
          diagnostics: {
            directProofRowCount: __groundingRows.filter((row) => row.provenanceTier === "direct_proof").length,
            candidateProofRowCount: __groundingRows.filter((row) => row.provenanceTier === "candidate_proof").length,
            contextualSupportRowCount: __groundingRows.filter((row) => row.provenanceTier === "contextual_support").length,
            diagnosticFallbackRowCount: __groundingRows.filter((row) => row.provenanceTier === "diagnostic_fallback").length,
            suppressedDuplicateCount: Math.max(0, (__groundingRowsBase.length + __groundingRowsSupport.length) - __groundingRows.length),
          },
        },
      }),
      actionResponse: __surfaceContract({
        semanticMode: "response-layer",
        sourceFamily: (__v2ActionPrimary || __v2ActionSecondary.length > 0) ? "risk_linked_response" : "unavailable",
        status: (__v2ActionPrimary || __v2ActionSecondary.length > 0) ? "ready" : "unavailable",
        unavailableReason: (__v2ActionPrimary || __v2ActionSecondary.length > 0) ? null : "no_risk_linked_action",
        duplicationGuardHint: "response_only",
        text: {
          title: "Action / Interview Response",
        },
        structured: {
          items: [
            ...(__v2ActionPrimary ? [{
              category: __v2ActionPrimary.category,
              title: __v2ActionPrimary.title,
              actionText: __v2ActionPrimary.instruction,
              evidenceNeed: __v2ActionPrimary.linkedEvidenceFamily || null,
              priority: "high",
              useWhen: __actionUseWhenByCategory[__v2ActionPrimary.category] || "핵심 확인 질문이 먼저 들어올 때",
              avoidSaying: __actionAvoidByCategory[__v2ActionPrimary.category] || "막연하게 가능성만 강조하는 표현",
            }] : []),
            ...__v2ActionSecondary.map((item, index) => ({
              category: item.category,
              title: item.title,
              actionText: item.instruction,
              evidenceNeed: item.linkedEvidenceFamily || null,
              priority: index === 0 ? "medium" : "low",
              useWhen: __actionUseWhenByCategory[item.category] || "추가 확인 질문이 이어질 때",
              avoidSaying: __actionAvoidByCategory[item.category] || "방어적으로만 들리는 표현",
            })),
          ].slice(0, 4),
          primaryAction: __v2ActionPrimary,
          secondaryActions: __v2ActionSecondary,
        },
      }),
      typeReadV2: __typeReadV2,
      proofSummaryV2: __proofSummaryV2,
    };

    vm.reportV2 = __reportV2;
  } catch {
    vm.reportV2 = {
      version: "v2",
      status: "unavailable",
      availability: {
        topRiskRead: "unavailable",
        whyThisRisk: "unavailable",
        careerContext: "unavailable",
        supportedReviewPoints: "unavailable",
        evidenceGrounding: "unavailable",
        actionResponse: "unavailable",
      },
      diagnostics: {
        sourceMap: {},
        duplicatedFamilies: [],
        bannedSourceLeak: ["report_v2_build_failed"],
      },
      topRiskRead: { semanticMode: "hybrid", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "hero_risk_only", text: {}, structured: {} },
      whyThisRisk: { semanticMode: "selection-first", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "risk_cause_only", text: {}, structured: {} },
      careerContext: { semanticMode: "hybrid", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "career_context_only", text: {}, structured: {} },
      supportedReviewPoints: { semanticMode: "hybrid", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "review_cards_only", text: {}, structured: {} },
      evidenceGrounding: { semanticMode: "text-first", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "proof_board_only", text: {}, structured: {} },
      actionResponse: { semanticMode: "response-layer", sourceFamily: "unavailable", status: "unavailable", hiddenReason: null, unavailableReason: "report_v2_build_failed", duplicationGuardHint: "response_only", text: {}, structured: {} },
      typeReadV2: {
        status: "unavailable",
        sourceFamily: "fallback",
        label: null,
        posture: null,
        context: null,
        badge: null,
        confidence: null,
        dominantJudgment: null,
        roleReadPrimary: null,
        roleReadSupport: { items: [], unavailableReason: "report_v2_build_failed" },
        unavailableReason: "report_v2_build_failed",
      },
      proofSummaryV2: { status: "unavailable", sourceFamily: "fallback", strengths: [], missing: [], unavailableReason: "report_v2_build_failed" },
    };
  }

  // ── Round 12-A/C: readable-vs-aligned split + final risk SSOT binding ──────
  // A/B: readable axis but weak JD alignment → prevent collapse into unreadable surface
  // C:   final supported-risk count → SSOT for purple risk summary (0/1/2/3 states)
  // Does NOT change score/gate/V2 producer. Consumer post-processing only.
  try {
    const __v2post      = vm?.interpretationV2;
    const __postAxisSt  = String(__v2post?.axisRead?.status ?? "");
    const __postJdSt    = String(__v2post?.jdCompetitiveness?.status ?? "");
    const __postAxisKey = String(__v2post?.axisRead?.axisKey ?? "").trim();
    const __postAxisNarr = String(__v2post?.axisRead?.narrative ?? "").trim();
    const __postJdNarr  = String(__v2post?.jdCompetitiveness?.narrative ?? "").trim();

    const __postAxisReadable  = __postAxisSt === "readable" || __postAxisSt === "partial";
    const __postTargetAligned = __postJdSt === "strong" || __postJdSt === "mixed";
    const __readableNotAligned = __postAxisReadable && !__postTargetAligned;

    // axis-derived path label — generic template, not domain-literal
    const __pathLabel = __postAxisKey ? `${__postAxisKey} 축 경력` : "현재 경력 경로";

    // hoist final supported-risk count — needed by A/B restraint guards and C SSOT
    const __finalItemsPost = Array.isArray(vm?.reportCanonical?.topRisks?.items)
      ? vm.reportCanonical.topRisks.items
      : [];
    const __finalCountPost = __finalItemsPost.length;

    if (__readableNotAligned) {
      const __axisReadable = __postAxisReadable && (__postAxisKey || __postAxisNarr);

      // A. headline: inject readable identity sentence when unavailable/sparse
      // count=0: drop JD-distance qualifier to stay consistent with restrained purple summary
      // count>0: include restrained qualifier (purple summary owns the concrete risk enumeration)
      if (__axisReadable && vm?.reportCanonical?.headline) {
        const __hl = vm.reportCanonical.headline;
        if (__hl.status === "unavailable" || __hl.status === "sparse") {
          const __hlText = __finalCountPost === 0
            ? "읽히는 경력 경로가 확인됩니다. 추가 근거와 함께 더 구체적인 해석이 가능합니다."
            : "읽히는 경력 경로가 있지만, 현재 JD 핵심 역할과의 직접 연결 근거는 추가 확인이 필요합니다.";
          vm.reportCanonical.headline = {
            ...__hl,
            status: "partial",
            text: __hlText,
            sourceFamily: "readable_axis_distance",
            sourceKeys: ["interpretationV2.axisRead", "interpretationV2.jdCompetitiveness"],
            sparseReason: "readable_axis_jd_distance",
          };
        }
      }

      // B. careerFlow: suppress generic unreadable body when axis IS readable
      // Uses path-focused distance phrase — NOT __postJdNarr (purple summary already owns that)
      if (vm?.reportCanonical?.careerFlow) {
        const __cf = vm.reportCanonical.careerFlow;
        const __cfBodyStr = String(__cf.body ?? "").trim();
        const __cfIsGeneric = !__cfBodyStr || [
          "한 줄로 읽기 어렵",
          "하나의 중심축으로 읽기 어렵",
          "상반된 신호",
          "단정적 해석이 어렵",
          "현재 이력서만으로는",
        ].some((pat) => __cfBodyStr.includes(pat));
        if (__cf.status === "unavailable" || __cfIsGeneric) {
          // count=0: softer — no risk implication; count>0: restrained path-distance phrase
          const __cfDistPart = __finalCountPost === 0
            ? "현재 JD와의 연결 경로는 추가 근거와 함께 더 구체화될 수 있습니다."
            : "현재 JD 핵심 역할과의 연결 경로는 추가 근거와 함께 더 선명해질 수 있습니다.";
          vm.reportCanonical.careerFlow = {
            ...__cf,
            status: "partial",
            // axis-derived path label + path-focused distance phrase (not risk enumeration)
            body: `${__pathLabel}은 읽히지만, ${__cfDistPart}`,
            sourceFamily: "readable_axis_distance",
            sourceKeys: ["interpretationV2.axisRead", "interpretationV2.jdCompetitiveness"],
            sparseReason: "readable_axis_jd_distance",
          };
        }
      }
    }

    // C. purple risk summary — SSOT: bound to final supported risk count (all cases)
    // Replaces generic conflict sentinel with honest count-based synthesis.
    if (vm?.reportPack?.sections?.riskSummary) {
      const __rsText = String(vm.reportPack.sections.riskSummary.summaryText ?? "").trim();
      const __isGenericSummary = !__rsText || [
        "상반된 신호가 함께 존재",
        "단정적 해석이 어렵",
      ].some((p) => __rsText.includes(p));

      if (__isGenericSummary) {
        const __finalItems = __finalItemsPost;
        const __finalCount = __finalCountPost;

        // family → human-readable label for synthesis
        const __familyLabel = (family) => ({
          years_seniority:    "경력 연차·시니어리티",
          must_have_gap:      "핵심 역량 충족도",
          leadership_scope:   "리더십·오너십 범위",
          role_domain_distance: "직무·도메인 거리",
          timeline_transition: "경력 전환·흐름",
          compensation:       "보상 조건",
          education:          "학력",
        })[String(family || "")] ?? null;

        let __newSummary = "";
        let __newSource  = "";

        if (__finalCount === 0) {
          // count 0: restrained insufficient-evidence — no fabricated implication
          __newSummary = "현재 근거 수준으로는 핵심 리스크를 특정하기 어렵습니다. 역할·성과·연속성 근거가 추가될 때 더 명확한 검토가 가능합니다.";
          __newSource  = "no_supported_risk_summary";
        } else if (__finalCount === 1) {
          const __l1 = __familyLabel(__finalItems[0]?.riskFamily);
          __newSummary = __l1
            ? `검토 포인트는 주로 ${__l1}에 집중됩니다.`
            : "한 가지 핵심 검토 포인트가 확인됩니다.";
          __newSource  = "concrete_single_risk_summary";
        } else if (__finalCount === 2) {
          const __l1 = __familyLabel(__finalItems[0]?.riskFamily);
          const __l2 = __familyLabel(__finalItems[1]?.riskFamily);
          __newSummary = (__l1 && __l2)
            ? `${__l1}·${__l2}의 두 가지 검토 포인트가 확인됩니다.`
            : "두 가지 핵심 검토 포인트가 확인됩니다.";
          __newSource  = "concrete_two_risk_summary";
        } else {
          const __l1 = __familyLabel(__finalItems[0]?.riskFamily);
          const __l2 = __familyLabel(__finalItems[1]?.riskFamily);
          const __l3 = __familyLabel(__finalItems[2]?.riskFamily);
          const __lbls = [__l1, __l2, __l3].filter(Boolean);
          __newSummary = __lbls.length === 3
            ? `${__lbls[0]}·${__lbls[1]}·${__lbls[2]}의 세 가지 검토 포인트가 확인됩니다.`
            : "세 가지 핵심 검토 포인트가 확인됩니다.";
          __newSource  = "concrete_multi_risk_summary";
        }

        // If readable-but-misaligned, append JD-distance qualifier (count > 0 only)
        if (__readableNotAligned && __finalCount > 0 && __postJdNarr) {
          __newSummary += ` ${__postJdNarr}`;
        }

        vm.reportPack.sections.riskSummary.summaryText   = __newSummary;
        vm.reportPack.sections.riskSummary.summarySource = __newSource;
      }
    }

    // D. supportingDescription ownership guard
    // Prevents report_pack careerAccumulation fallback from duplicating careerFlow body.
    // riskSummary fallback already removed upstream (Patch 1); this guards careerSummary overlap.
    if (vm?.reportCanonical?.supportingDescription) {
      const __sd = vm.reportCanonical.supportingDescription;
      const __sdText = String(__sd.text ?? "").trim();
      if (__sdText && __sd.sourceFamily === "report_pack") {
        const __cfBody = String(vm?.reportCanonical?.careerFlow?.body ?? "").trim();
        if (__cfBody && __sdText === __cfBody) {
          vm.reportCanonical.supportingDescription = {
            ...__sd,
            status: "unavailable",
            text: null,
            sourceFamily: "unavailable",
            sourceKeys: [],
            sparseReason: "supportingDescription_careerFlow_duplicate_suppressed",
          };
        }
      }
    }

    // E. supportingDescription bridge-only lock
    // Suppresses text that violates bridge-only ownership:
    //   1) generic conflict absorber phrases
    //   2) risk-enumeration-like phrases (purple summary's job)
    //   3) count=0 + career_interpretation level summary that may overclaim
    // interpretation_v2 primary is always trusted as bridge-valid.
    if (vm?.reportCanonical?.supportingDescription) {
      const __sdE = vm.reportCanonical.supportingDescription;
      const __sdEText = String(__sdE.text ?? "").trim();
      const __sdEFamily = String(__sdE.sourceFamily ?? "");

      if (__sdEText && __sdEFamily !== "unavailable" && __sdEFamily !== "interpretation_v2") {
        const __sdEGenericConflict = [
          "상반된 신호",
          "단정적 해석이 어렵",
          "한 줄로 읽기 어렵",
          "하나의 중심축으로 읽기 어렵",
          "현재 이력서만으로는",
        ].some((p) => __sdEText.includes(p));

        const __sdERiskLike = [
          "검토 포인트가 확인",
          "리스크 신호",
          "리스크 구조",
        ].some((p) => __sdEText.includes(p));

        // count=0: career_interpretation level summaries (causeSummary/interpretedSummary)
        // may overclaim without any supported evidence backing
        const __sdELevelOverclaim = __finalCountPost === 0 &&
          __sdEFamily === "career_interpretation" &&
          Array.isArray(__sdE.sourceKeys) &&
          __sdE.sourceKeys.some((k) => {
            const ks = String(k);
            return ks.includes("causeSummary") || ks.includes("interpretedSummary");
          });

        if (__sdEGenericConflict || __sdERiskLike || __sdELevelOverclaim) {
          vm.reportCanonical.supportingDescription = {
            ...__sdE,
            status: "unavailable",
            text: null,
            sourceFamily: "unavailable",
            sourceKeys: [],
            sparseReason: "supportingDescription_bridge_only_lock_suppressed",
          };
        }
      }
    }
  } catch { /* readable-vs-aligned + risk SSOT guard — never surfaces */ }

  return vm;

}

function __expressionRank(level) {
  const order = {
    "high-risk": 0,
    weak: 1,
    cautious: 2,
    competitive: 3,
    strong: 4,
  };
  return order[String(level || "").toLowerCase()] ?? 1;
}

function __levelFromRank(rank) {
  if (rank >= 4) return "strong";
  if (rank >= 3) return "competitive";
  if (rank >= 2) return "cautious";
  if (rank >= 1) return "weak";
  return "high-risk";
}

function __normalizeExpressionLevelFromBand(bandLabel, scorePct) {
  const b = String(bandLabel || "").toLowerCase();
  if (b.includes("high-risk") || b.includes("탈락") || b.includes("차단") || b.includes("리스크")) return "high-risk";
  if (b.includes("weak") || b.includes("보류") || b.includes("관망")) return "weak";
  if (b.includes("cautious") || b.includes("확인 필요") || b.includes("보완 필요")) return "cautious";
  if (b.includes("competitive") || b.includes("경합") || b.includes("검토")) return "competitive";
  if (b.includes("strong") || b.includes("유력") || b.includes("우세") || b.includes("즉전")) return "strong";

  const s = Number.isFinite(Number(scorePct)) ? Number(scorePct) : 0;
  if (s >= 80) return "strong";
  if (s >= 60) return "competitive";
  if (s >= 45) return "cautious";
  if (s >= 30) return "weak";
  return "high-risk";
}

function __applyExpressionCeilingText(text, level) {
  const t = String(text || "").trim();
  if (!t) return t;
  const rank = __expressionRank(level);
  if (rank >= 3) return t;
  let out = t;
  out = out.replace(/즉전(형|감| 투입형| 투입)?/g, "근거 확인");
  out = out.replace(/합격권|합격 유력권|유력|우세권|실전 투입/g, "검토 필요");
  return out;
}

// ===== [PATCH] PASSMAP 16유형 engine (append-only) =====

const __RISK_FAMILY_MAP = {
  GATE__AGE:                           "gate_hard",
  GATE__EDUCATION_GATE_FAIL:           "gate_hard",
  GATE__CRITICAL_EXPERIENCE_GAP:       "gate_hard",
  GATE__SALARY_MISMATCH:               "gate_hard",
  SENIORITY__UNDER_MIN_YEARS:          "gate_hard",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY:   "gate_hard",
  GATE__MUST_HAVE_SKILL:               "gate_hard",
  PRESSURE__GATE_BOOST:                "gate_hard",   // synthetic — excluded from STEP3 pool

  MUST__SKILL__MISSING:                "gate_requirement",
  MUST__CERT__MISSING:                 "gate_requirement",
  ROLE_TOOL__MISSING:                  "gate_requirement",
  ROLE_CERTIFICATION__MISSING:         "gate_requirement",

  TASK__ROLE_FAMILY_MISMATCH:          "shift_domain",
  DOMAIN__MISMATCH__JOB_FAMILY:        "shift_domain",
  DOMAIN__WEAK__KEYWORD_SPARSE:        "shift_domain",
  SIMPLE__DOMAIN_SHIFT:                "shift_domain",
  RISK__COMPANY_SIZE_JUMP:             "shift_domain",
  HIGH_RISK__COMPANY_SIZE_JUMP_COMPOSITE: "shift_domain",
  DOMAIN__EDUCATION_CONTEXT:           "shift_domain",

  RISK__ROLE_LEVEL_MISMATCH:           "shift_role",
  TITLE_SENIORITY_MISMATCH:            "shift_role",
  AGE_SENIORITY_GAP:                   "shift_role",
  SIMPLE__ROLE_SHIFT:                  "shift_role",
  ROLE_SKILL__LOW_SEMANTIC_SIMILARITY: "shift_role",
  ROLE_SKILL__JD_KEYWORD_ABSENCE:      "shift_role",

  ROLE_TASK__CORE_TASK_MISSING:        "evidence",
  TASK__CORE_COVERAGE_LOW:             "evidence",
  TASK__EVIDENCE_TOO_WEAK:             "evidence",

  RISK__OWNERSHIP_LEADERSHIP_GAP:      "ownership_leadership",
  EXP__LEADERSHIP__MISSING:            "ownership_leadership",

  RISK__EXECUTION_IMPACT_GAP:          "execution_scope",
  EXP__SCOPE__TOO_SHALLOW:             "execution_scope",

  JOB_HOPPING_DENSITY:                 "stability_timeline",

  PREF__TOOL__MATCH:                   "positive_pref",
  PREF__DOMAIN__MATCH:                 "positive_pref",

  SIMPLE__BASELINE_GUIDE:              "mixed_other",
};

// tie-break 우선순위 (낮은 index = 높은 우선순위)
const __PM_TIE_BREAK = [
  "shift_domain",
  "shift_role",
  "evidence",
  "execution_scope",
  "ownership_leadership",
  "stability_timeline",
  "mixed_other",
];

export function resolveDominantFamily(sorted) {
  const arr = Array.isArray(sorted) ? sorted : [];

  // STEP 1 — gate layer 존재 시 즉시 반환
  if (arr.some((r) => String(r?.layer || "").toLowerCase() === "gate")) {
    return "gate_hard";
  }

  // STEP 2 — must layer 존재 시 즉시 반환
  if (arr.some((r) => String(r?.layer || "").toLowerCase() === "must")) {
    return "gate_requirement";
  }

  // STEP 3 — pool 필터 후 family별 max score
  const __excluded = new Set(["PRESSURE__GATE_BOOST", "SIMPLE__BASELINE_GUIDE"]);
  const pool = arr.filter((r) => {
    const layer = String(r?.layer || "").toLowerCase();
    const id = String(r?.id || "");
    return layer !== "preferred" && !__excluded.has(id);
  });

  const familyScore = {};
  for (const r of pool) {
    const id = String(r?.id || "");
    const family = __RISK_FAMILY_MAP[id] || "mixed_other";
    // gate_hard / gate_requirement는 STEP1/2에서 처리 — STEP3 제외
    if (family === "gate_hard" || family === "gate_requirement" || family === "positive_pref") continue;
    const sc = typeof r?.score === "number" ? r.score : 0;
    if (!(family in familyScore) || sc > familyScore[family]) {
      familyScore[family] = sc;
    }
  }

  if (Object.keys(familyScore).length === 0) return "mixed_other";

  // STEP 4 — argmax, 동점 시 __PM_TIE_BREAK 순서로 결정
  const maxScore = Math.max(...Object.values(familyScore));
  for (const f of __PM_TIE_BREAK) {
    if ((familyScore[f] ?? -1) >= maxScore) return f;
  }

  return "mixed_other";
}

/**
 * PASSMAP 16유형 SSOT
 * oneLiner는 intro/header SSOT가 아니라 legacy/compatibility용 요약 메타를 유지한다.
 * @returns {{ id, family, dominantFamily, oneLiner, dominantRiskId }}
 */
export function resolvePassmapType16({
  sorted = [],
  signals = {},
  gateMax = 0,
  posRaw = 0,
  fit = 0,
  trust = 0,
  risk = 0,
  veto = false,
  mustHaveFit = null,
  typeId = "TYPE_MIXED_NEUTRAL",
} = {}) {
  const dominantFamily = resolveDominantFamily(sorted);

  const hasPositivePref = Array.isArray(sorted) && sorted.some(
    (r) => String(r?.layer || "").toLowerCase() === "preferred"
  );

  const dominantRiskId = Array.isArray(sorted) && sorted.length > 0
    ? String(sorted[0]?.id || "")
    : "";

  const primary = String(typeId || "TYPE_MIXED_NEUTRAL");

  let id, oneLiner;

  switch (primary) {
    case "TYPE_GATE_BLOCK":
      if (dominantFamily === "gate_hard") {
        id = "PM01";
        oneLiner = "게이트/조건에 의해 전형 진입 자체가 차단된 상태입니다.";
      } else {
        id = "PM02";
        oneLiner = "필수 요건 충족이 먼저이며, 역량 설득은 그 이후입니다.";
      }
      break;

    case "TYPE_CONDITION_CONFLICT":
      if (trust >= 0.55) {
        id = "PM03";
        oneLiner = "역량은 검증되었으나 조건 충돌이 남아 있습니다.";
      } else {
        id = "PM04";
        oneLiner = "역량 신뢰도와 조건이 동시에 부딪히는 구간입니다.";
      }
      break;

    case "TYPE_SHIFT_TRIAL":
      if (dominantFamily === "shift_domain") {
        id = "PM05";
        oneLiner = "도메인 이동의 전이 근거가 핵심 심사 대상입니다.";
      } else {
        id = "PM06";
        oneLiner = "역할 전환의 연결 논리가 아직 불충분합니다.";
      }
      break;

    case "TYPE_READY_CORE":
      if (hasPositivePref) {
        id = "PM08";
        oneLiner = "핵심 역량과 우대 조건이 함께 충족된 상태입니다.";
      } else {
        id = "PM07";
        oneLiner = "즉시 투입 가능한 정합성이 확인됩니다.";
      }
      break;

    case "TYPE_PERSUASION_WEAK":
      if (dominantFamily === "evidence") {
        id = "PM09";
        oneLiner = "경험은 맞지만 정량/맥락 근거가 약합니다.";
      } else {
        id = "PM10";
        oneLiner = "역할 정의와 기여 범위를 더 명확히 해야 합니다.";
      }
      break;

    case "TYPE_STABLE_AVG":
      if (risk < 0.30) {
        id = "PM11";
        oneLiner = "결함은 적지만 차별 포인트가 약할 수 있습니다.";
      } else {
        id = "PM12";
        oneLiner = "전반적으로 안정적이나 개선 여지가 남아 있습니다.";
      }
      break;

    case "TYPE_EDGE_BALANCE":
      if (dominantFamily === "mixed_other") {
        id = "PM13";
        oneLiner = "가능성은 보이지만 결정적 근거가 아직 없습니다.";
      } else {
        id = "PM14";
        oneLiner = "한 가지 보완이 판세를 바꿀 수 있는 구간입니다.";
      }
      break;

    case "TYPE_MIXED_NEUTRAL":
    default:
      if (posRaw < 0.40) {
        id = "PM15";
        oneLiner = "현재 구간에서는 추가 탐색이 먼저 필요합니다.";
      } else {
        id = "PM16";
        oneLiner = "강한 장점도 치명적 결함도 아직 선명하지 않습니다.";
      }
      break;
  }

  return {
    id,
    family: dominantFamily,
    dominantFamily,
    oneLiner,
    dominantRiskId,
  };
}

// ===== /PATCH =====
