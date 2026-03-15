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
import {
  buildPolicyInput,
  resolveTypeTitle,
  resolvePassLabels,
  sanitizeReadinessWording,
  sanitizeRiskDescription,
  sanitizeRiskTitle,
} from "../policy/reportLanguagePolicy.js";

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

export function buildSimulationViewModel(riskResults = [], { interactions, careerHistory, careerTimeline, parsedResume, evidenceFitMeta = null } = {}) {
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
    "SENIORITY__UNDER_MIN_YEARS",
    "TITLE_SENIORITY_MISMATCH",
    "RISK__ROLE_LEVEL_MISMATCH",
  ]);
  const __TOP3_DOMAIN_IDS = new Set([
    "DOMAIN__MISMATCH__JOB_FAMILY",
    "GATE__DOMAIN_MISMATCH__JOB_FAMILY",
    "DOMAIN__WEAK__KEYWORD_SPARSE",
    "ROLE_DOMAIN_SHIFT",
    "TITLE_DOMAIN_SHIFT",
    "SIMPLE__DOMAIN_SHIFT",
    "SIMPLE__ROLE_SHIFT",
  ]);
  const __TOP3_EVIDENCE_IDS = new Set([
    "LOW_CONTENT_DENSITY_RISK",
    "IMPACT__PROCESS_ONLY",
    "IMPACT__NO_QUANTIFIED_IMPACT",
    "RISK__EXECUTION_IMPACT_GAP",
    "TASK__EVIDENCE_TOO_WEAK",
    "EVIDENCE_THIN",
    "IMPACT_WEAK",
    "PROOF_WEAK",
    "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
  ]);

  function __getTop3RiskClass(r) {
    if (__isGate(r)) return "gate";

    const id = String(r?.id || "").toUpperCase().trim();
    const layer = String(r?.layer || "").toLowerCase().trim();
    const group = String(r?.group || "").toLowerCase().trim();

    if (layer === "preferred" || group === "preferred") return "preferred";
    if (__TOP3_MUST_HAVE_IDS.has(id)) return "must_have";
    if (__TOP3_SENIORITY_IDS.has(id)) return "seniority";
    if (__TOP3_DOMAIN_IDS.has(id)) return "domain";
    if (__TOP3_EVIDENCE_IDS.has(id)) return "evidence";
    return "default";
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
    if (riskClass === "domain") return 1;
    if (riskClass === "evidence") return -2;
    if (riskClass === "preferred") return -8;
    return 0;
  }

  function __getTop3RankScore(r) {
    return __getPriority(r) + __getTop3ClassBoost(r) + __getTop3SeverityBoost(r);
  }

  function __compareTop3Normals(a, b) {
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

  function __pickHighestSeverity(source) {
    const arr = Array.isArray(source) ? source : [];
    if (!arr.length) return "low";
    return arr.reduce((picked, risk) => {
      const current = __normalizeSeverity(risk);
      const rank = { low: 0, medium: 1, high: 2 };
      return (rank[current] > rank[picked] ? current : picked);
    }, "low");
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
    if (hasCareerHistory && startPoint && currentPoint && startPoint !== currentPoint) {
      summary = `${startPoint}에서 시작해 현재는 ${currentPoint}로 이어집니다.`;
    } else if (hasCareerHistory && currentAxis) {
      summary = `현재 커리어는 ${currentAxis} 축 중심으로 읽힙니다.`;
    }
    if (overallAxis && recentAxis && overallAxis !== recentAxis) {
      summary += ` 전체 축은 ${overallAxis}, 최근 축은 ${recentAxis}입니다.`;
    } else if (overallAxis) {
      summary += ` 전체 축은 ${overallAxis}입니다.`;
    }
    if (hasMultiStepFlow) {
      summary += ` 전환 단계 ${transitionItems.length}회가 확인됩니다.`;
    }
    if (gapConcern) {
      summary += " 이력 사이 간격이 보여 흐름 해석은 보수적으로 유지됩니다.";
    }
    if (String(timeline?.summary || "").trim()) {
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
      ? (hasMultiStepFlow && startPoint && currentAxis
        ? `${startPoint} 경험을 기반으로 ${transitionPart}현재는 ${currentAxis} 중심 커리어로 읽힙니다.`
        : currentAxis
          ? `현재 커리어는 ${currentAxis} 중심 경험으로 읽히며 전체적으로는 ${overallAxis || currentAxis} 축이 반복됩니다.`
          : "현재 커리어 흐름은 하나의 중심축으로 읽기 어렵습니다.")
      : "현재 커리어 흐름은 하나의 중심축으로 읽기 어렵습니다.";
    const mainInterpretation = __limitLength(mainInterpretationRaw);

    return {
      mainInterpretation,
      summary,
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

  function __buildCareerInterpretation({ sorted, top3WithNarrative, explanationPack, candidateType, posPct, hasGateSignal, careerTimelineInput }) {
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
      careerTimeline,
      roleDepth,
      top3: top,
      explanationPack,
      riskView: {
        items: riskViewItems.slice(0, 3),
      },
      candidateType,
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
    });

    return {
      currentLevel: {
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
      },
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
    if (f < 0.45) {
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
  const __topNarratives = buildTopRiskNarratives(top3);
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
  const actionCandidates = buildActionCandidates(sortedWithNarrative);
  const topActions = rankActions(actionCandidates);

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
  const careerInterpretation = __buildCareerInterpretation({
    sorted: sortedWithNarrative,
    top3WithNarrative,
    explanationPack,
    candidateType: __candidateType,
    posPct: __posPct,
    hasGateSignal: __hasGateSignal,
    careerTimelineInput: careerTimeline,
  });
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
        return __top3HintLimit("현재 커리어 흐름은 특정 축으로 읽히지만 JD가 기대하는 역할 방향과 다르면 이 리스크가 커질 수 있습니다.");
      }
      if (/(timeline|career|전환|흐름)/.test(__riskHaystack)) {
        return __top3HintLimit("최근 경력 흐름의 연속성이나 전환 맥락이 충분히 설명되지 않으면 이 리스크가 더 크게 읽힐 수 있습니다.");
      }
      const __axisSource = __currentAxisForTop3 || String(__riskViewByAxis.get("transition")?.title || "").trim();
      if (__axisSource) {
        return __top3HintLimit(
          `현재 커리어는 ${__axisSource} 중심 흐름으로 읽히기 때문에 JD가 기대하는 방향과 차이가 있으면 이 리스크가 커질 수 있습니다.`
        );
      }
    }
    return __top3HintLimit("현재 이력서 해석과 JD 기대 방향 사이 차이가 있을 경우 이 리스크가 커질 수 있습니다.");
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
        return "JD는 보다 선명한 역할 방향성과 직무 축 일치를 기대할 수 있습니다.";
      }
      if (/(timeline|career|전환|흐름)/.test(__riskHaystack)) {
        return "JD는 최근 경력의 연속성과 전환 맥락까지 함께 볼 가능성이 있습니다.";
      }
      return "JD는 보다 선명한 역할 방향성 또는 연속성을 기대할 수 있습니다.";
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
    } catch { /* silent */ }
    return baseHint;
  };

  const __top3WithInterpretation = top3WithNarrative.map((risk) => {
    const relatedAxis = __deriveTop3RelatedAxis(risk);
    return {
      ...(risk && typeof risk === "object" ? risk : {}),
      relatedAxis,
      explanationHint: __appendExpectationHint(
        __buildTop3ExplanationHint(risk, relatedAxis),
        relatedAxis,
        evidenceFitMeta
      ),
      jdGapHint: __buildTop3JdGapHint(risk, relatedAxis),
    };
  });

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
      description: __cappedTypeSubtitle,
    },
    interpretationSafe: {
      ...(interpretation || {}),
      label: __cappedInterpretationLabel || interpretation?.label,
      oneLiner: __cappedInterpretationOneLiner || interpretation?.oneLiner,
    },
  };
  // ✅ SSOT guard (append-only)
  if (!vm.band && typeof vm.score === "number") {
    if (vm.score >= 80) vm.band = "strong";
    else if (vm.score >= 60) vm.band = "competitive";
    else if (vm.score >= 40) vm.band = "weak";
    else vm.band = "high-risk";
  }
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
