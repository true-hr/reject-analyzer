// src/lib/explanation/buildExplanationPack.js
import {
  sanitizeRiskDescription,
  sanitizeRiskTitle,
} from "../policy/reportLanguagePolicy.js";

const RISK_EXPLANATION = {
  ROLE_SKILL__MUST_HAVE_MISSING: {
    group: "must_have",
    priority: 100,
    templates: {
      hard: {
        signal: "JD 필수 역량 대비 이력서 근거가 구조적으로 부족하게 읽힙니다.",
        userReason: "필수 항목별 직접 증빙 내용이 약해 초반 필터 질문이 늘 수 있습니다.",
        interviewerView: "필수요건 충족 여부를 초반에 먼저 확인하려는 흐름이 강해집니다.",
      },
      medium: {
        signal: "JD 필수 역량 대비 이력서 근거가 다소 부족합니다.",
        userReason: "필수 항목별 증빙 경험을 더 직접적으로 연결해 보완할 필요가 있습니다.",
        interviewerView: "필수요건 정합성을 확인하는 질문이 늘어날 수 있습니다.",
      },
      soft: {
        signal: "JD 필수 역량과 이력서 근거의 직접 연결이 약합니다.",
        userReason: "필수 항목 연결 문장을 보강하면 설명력이 개선될 수 있습니다.",
        interviewerView: "필수요건 확인 질문이 일부 추가될 수 있습니다.",
      },
    },
    signal: "JD 필수 역량 대비 이력서 근거가 부족합니다.",
    userReason: "필수 항목별로 직접 증빙되는 경험 항목을 보강해야 합니다.",
    interviewerView: "필수요건 충족 여부를 먼저 확인하려는 질문이 늘어납니다.",
  },
  ROLE_SKILL__JD_KEYWORD_ABSENCE: {
    group: "must_have",
    priority: 80,
    templates: {
      hard: {
        signal: "JD 핵심 키워드와 이력서 연결이 구조적으로 약하게 보입니다.",
        userReason: "핵심 키워드 단위의 직접 증빙이 부족해 보완 우선순위가 높습니다.",
        interviewerView: "요구 역량과 실제 경험 정합성을 먼저 확인하려는 질문이 강해집니다.",
      },
      medium: {
        signal: "JD 핵심 키워드와 이력서 연결 근거가 부족합니다.",
        userReason: "키워드를 실제 수행 맥락과 함께 연결해 설득력을 높여야 합니다.",
        interviewerView: "요구 역량 정합성 확인 질문이 늘어날 수 있습니다.",
      },
      soft: {
        signal: "JD 핵심 키워드와 이력서 연결이 다소 약합니다.",
        userReason: "핵심 키워드 연결 문장을 보강하면 이해도가 올라갈 수 있습니다.",
        interviewerView: "핵심 경험 확인 질문이 일부 추가될 수 있습니다.",
      },
    },
    signal: "JD 핵심 키워드와 이력서 연결 근거가 약합니다.",
    userReason: "JD 키워드를 실제 수행 경험 문장으로 직접 연결해야 합니다.",
    interviewerView: "요구 역량과 실제 경험의 정합성을 먼저 검증하려는 질문이 생깁니다.",
  },
  ROLE_SKILL__LOW_SEMANTIC_SIMILARITY: {
    group: "role_fit",
    priority: 60,
    templates: {
      hard: {
        signal: "JD와 이력서 문맥의 의미적 일치도가 낮게 해석됩니다.",
        userReason: "직무 맥락 연결이 약해 역할 적합성 설득이 어렵게 보일 수 있습니다.",
        interviewerView: "직무 적합성보다 맥락 불일치 검증이 먼저 진행될 가능성이 큽니다.",
      },
      medium: {
        signal: "JD와 이력서 문맥 일치도가 다소 낮습니다.",
        userReason: "JD 언어로 수행 경험을 재정렬해 역할 연결성을 높여야 합니다.",
        interviewerView: "맥락 정합성 확인 질문이 늘어날 수 있습니다.",
      },
      soft: {
        signal: "JD와 이력서 문맥 연결이 약한 편입니다.",
        userReason: "경험 문장을 JD 표현에 맞춰 정리하면 전달력이 개선될 수 있습니다.",
        interviewerView: "직무 맥락 확인 질문이 일부 추가될 수 있습니다.",
      },
    },
    signal: "JD와 이력서 문맥의 의미적 일치도가 낮습니다.",
    userReason: "같은 업무를 수행했다는 근거를 JD 언어로 맞춰 재작성해야 합니다.",
    interviewerView: "직무 적합성보다 맥락 불일치 여부를 먼저 확인하려는 흐름이 생깁니다.",
  },
  GATE__DOMAIN_MISMATCH__JOB_FAMILY: {
    group: "domain_fit",
    priority: 90,
    templates: {
      hard: {
        signal: "JD 직무군과 이력서 직무군 연결이 구조적으로 약하게 감지됩니다.",
        userReason: "도메인 전이 근거가 부족해 초반 필터 단계에서 보수적으로 해석될 수 있습니다.",
        interviewerView: "직무 적합성보다 전이 가능성 검증을 먼저 진행하려는 경향이 강합니다.",
      },
      medium: {
        signal: "JD 직무군과 이력서 직무군의 직접 연결이 약합니다.",
        userReason: "전이 가능한 경험을 같은 키워드로 재구성해 연결 근거를 보강해야 합니다.",
        interviewerView: "전이 가능성 확인 질문이 늘어날 수 있습니다.",
      },
      soft: {
        signal: "JD 직무군과 이력서 직무군 연결이 다소 약합니다.",
        userReason: "관련 경험 연결 문장을 보강하면 정합성 인식이 개선될 수 있습니다.",
        interviewerView: "직무군 연결성 확인 질문이 일부 추가될 수 있습니다.",
      },
    },
    signal: "JD 직무군과 이력서 직무군의 직접 연결이 약합니다.",
    userReason: "전이 가능한 경험을 동일 키워드로 재구성해 연결 근거를 보여줘야 합니다.",
    interviewerView: "직무 적합성보다 전환 리스크를 먼저 검증하려는 경향이 강해집니다.",
  },
  RISK__ROLE_LEVEL_MISMATCH: {
    group: "seniority",
    priority: 85,
    signal: "현재 역할 수준과 목표 역할 레벨 간 간극이 감지됩니다.",
    userReason: "목표 레벨에 해당하는 책임 범위와 의사결정 사례를 보강해야 합니다.",
    interviewerView: "레벨 적합성과 역할 확장 가능성을 먼저 검증하려는 질문이 늘어납니다.",
  },
  TITLE_SENIORITY_MISMATCH: {
    group: "seniority",
    priority: 85,
    signal: "직급/연차 대비 목표 역할 수준의 정합성이 약합니다.",
    userReason: "직급보다 실제 수행 수준을 증빙하는 사례 중심으로 설명해야 합니다.",
    interviewerView: "현재 레벨에서 목표 역할을 수행할 준비도가 충분한지 확인하려는 경향이 있습니다.",
  },
  SENIORITY__UNDER_MIN_YEARS: {
    group: "seniority",
    priority: 85,
    signal: "요구 연차 대비 경력 구간이 부족하게 해석됩니다.",
    userReason: "연차 공백보다 실제 책임 수준과 성과 밀도를 먼저 증명해야 합니다.",
    interviewerView: "최소 연차 요건 충족 여부를 보수적으로 판단할 가능성이 큽니다.",
  },
  GATE__AGE: {
    group: "seniority",
    priority: 85,
    signal: "연차/레벨 대비 연령 정합성 신호가 보수적으로 해석됩니다.",
    userReason: "직급 수준의 책임 범위와 결과를 구조적으로 설명해야 합니다.",
    interviewerView: "직무 레벨 대비 적정 밴드인지 먼저 확인하려는 질문이 나옵니다.",
  },
  GATE__SALARY_MISMATCH: {
    group: "compensation",
    priority: 85,
    signal: "희망 보상과 조직 밴드 정합성이 낮게 잡혔습니다.",
    userReason: "희망 보상 근거를 성과/시장가와 함께 제시해 정합성을 높여야 합니다.",
    interviewerView: "보상 기대치와 레벨 적합성을 우선 검증하려는 흐름이 생깁니다.",
  },
  JOB_HOPPING_DENSITY: {
    group: "seniority",
    priority: 85,
    signal: "최근 경력에서 재직 기간이 짧은 이동이 반복된 것으로 보일 수 있습니다.",
    userReason: "경력 이동 자체보다, 짧은 재직이 연속되어 보이는 인상이 리스크로 작용할 수 있습니다.",
    interviewerView: "짧게 종료된 구간이 반복되면 안정성과 맥락 일관성을 먼저 확인하려는 질문이 늘어날 수 있습니다.",
  },
};

const RISK_ACTION_HINT = {
  ROLE_SKILL__MUST_HAVE_MISSING: "JD 필수 기술과 직접 연결되는 경험 항목을 이력서 상단에 추가하세요.",
  ROLE_SKILL__JD_KEYWORD_ABSENCE: "JD 핵심 키워드와 동일한 표현을 경험 항목/요약문에 1~2회 반영하세요.",
  ROLE_SKILL__LOW_SEMANTIC_SIMILARITY: "JD 핵심 업무 문장과 이력서 수행 문장을 1:1로 재정렬해 역할 정합 근거를 보강하세요.",
  DOMAIN__MISMATCH__JOB_FAMILY: "이전 도메인 경험 중 공통 과업/지표를 먼저 제시해 전환 가능성을 선명하게 설명하세요.",
  DOMAIN__WEAK__KEYWORD_SPARSE: "JD 핵심 키워드를 이력서 요약/경험 항목에 직접 반영해 도메인 정합 근거를 보강하세요.",
  SIMPLE__DOMAIN_SHIFT: "도메인 전환 사유보다 전이 가능한 문제 해결 방식과 성과 지표를 먼저 제시하세요.",
  TITLE_DOMAIN_SHIFT: "직무 타이틀 차이보다 실제 수행 과업의 유사성과 결과를 중심으로 연결 근거를 작성하세요.",
  ROLE_DOMAIN_SHIFT: "직무/도메인 전환 시 공통 KPI와 검증 가능한 성과를 1:1로 매칭해 설명하세요.",
  RISK__ROLE_LEVEL_MISMATCH: "목표 레벨에서 요구되는 책임 범위와 의사결정 사례를 상단 항목으로 먼저 고정하세요.",
  TITLE_SENIORITY_MISMATCH: "직급명보다 실제 리드 범위·의사결정·성과를 숫자와 함께 제시해 레벨 오해를 줄이세요.",
  SENIORITY__UNDER_MIN_YEARS: "총 경력보다 해당 직무 연관 경험 기간과 성과를 먼저 보이게 정리하세요.",
  GATE__AGE: "연차/레벨 적합성 질문에 대비해 실제 책임 범위와 리딩 성과를 근거 중심으로 정리하세요.",
  RISK__TIMELINE_MISMATCH: "경력 타임라인의 공백/전환 구간은 사실-이유-성과 순으로 짧게 정리해 의문을 줄이세요.",
  RISK__JOB_HOPPING: "짧은 재직 이력은 이직 사유보다 각 구간의 성과와 역할 확장 근거를 먼저 제시하세요.",
  JOB_HOPPING_DENSITY: "짧게 끝난 역할은 왜 종료됐는지보다 그 기간에 무엇을 만들었는지가 먼저 보여야 합니다. 각 이동의 배경, 종료 사유, 다음 선택의 합리성이 함께 설명되면 방어력이 높아집니다.",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY: "이전 산업 경험 중 현재 JD와 겹치는 업무 공통점을 첫 요약문에 명시하세요.",
  GATE__SALARY_MISMATCH: "희망연봉 근거를 성과·경력 수준과 함께 제시하거나 범위를 유연하게 조정하세요.",
  GATE__CRITICAL_EXPERIENCE_GAP: "필수 경험 공백 항목을 JD 기준으로 분해해 대체 가능 근거와 유사 성과를 먼저 제시하세요.",
  TOOL_MISSING: "JD 필수 도구는 실사용 맥락·기간·성과를 함께 써서 즉시 검증 가능한 근거를 보강하세요.",
  EVIDENCE_THIN: "성과 항목에 수치·기간·본인 기여를 함께 적어 검증 가능한 증거 밀도를 높이세요.",
  LOW_CONTENT_DENSITY_RISK: "핵심 경험 2~3개를 우선 선정해 문제-행동-결과 구조로 밀도 있게 재작성하세요.",
};

function __safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function __clamp01(v) {
  const n = __safeNum(v, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function __uniq(arr) {
  return Array.from(new Set(Array.isArray(arr) ? arr.filter(Boolean) : []));
}

function __fallbackSignal(r) {
  const raw = (
    r?.oneLiner ||
    r?.reasonShort ||
    r?.summary ||
    sanitizeRiskTitle(r?.id, r?.title) ||
    String(r?.id || "")
  );
  return sanitizeRiskDescription(r?.id, raw);
}

function __fallbackGroup(id) {
  const up = String(id || "").toUpperCase();
  if (up.includes("MUST_HAVE") || up.includes("ROLE_SKILL")) return "must_have";
  if (up.includes("DOMAIN")) return "domain_fit";
  if (up.includes("SENIOR") || up.includes("YEAR") || up.includes("AGE") || up.includes("LEVEL")) return "seniority";
  if (up.includes("SALARY")) return "compensation";
  return "other";
}

function __severityTier(score) {
  const s = __safeNum(score, 0);
  if (s >= 0.85) return "hard";
  if (s >= 0.65) return "medium";
  return "soft";
}

function __toList(v) {
  return Array.isArray(v) ? v : [];
}

function __toShortList(v) {
  return __toList(v)
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 2);
}

function __pickFirstNum(...vals) {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function __toScorePct(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 0;
  if (n <= 1) return Math.round(__clamp01(n) * 100);
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function __getRiskScore01(risk) {
  const raw = __pickFirstNum(risk?.score, risk?.raw?.score);
  if (raw === null) return 0;
  if (raw > 1) return __clamp01(raw / 100);
  return __clamp01(raw);
}

function __toFlatTextList(...vals) {
  const out = [];
  for (const v of vals) {
    if (Array.isArray(v)) {
      for (const item of v) {
        const s = String(item || "").trim();
        if (s) out.push(s);
      }
      continue;
    }
    if (v && typeof v === "object") {
      const label = String(v.label || v.name || v.title || v.id || "").trim();
      if (label) out.push(label);
      continue;
    }
    const s = String(v || "").trim();
    if (s) out.push(s);
  }
  return out;
}

function __normalizeRequirementText(input) {
  const s = String(input || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  const parts = s
    .split(/\s{2,}|[,\n/|]+/)
    .map((x) => x.trim())
    .filter(Boolean);
  const candidate = parts.find((x) => x.length >= 2) || s;
  return candidate.replace(/^[\-*•·:()\[\]]+|[\-*•·:()\[\]]+$/g, "").trim();
}

function __pickRequirementFragment(list = []) {
  const items = __toFlatTextList(list)
    .map(__normalizeRequirementText)
    .filter(Boolean)
    .filter((x) => x.toLowerCase() !== "unknown");

  for (const item of items) {
    if (item.length <= 80) return item;
  }
  for (const item of items) {
    if (item.length <= 140) return item;
  }
  return items[0] || "";
}

function __buildMappedActionHint(risk, ctx = {}) {
  const id = String(risk?.id || "").toUpperCase();
  const ev = risk?.evidence && typeof risk.evidence === "object" ? risk.evidence : {};
  const detail = risk?.detail && typeof risk.detail === "object" ? risk.detail : {};
  const meta = risk?.meta && typeof risk.meta === "object" ? risk.meta : {};
  const explain = risk?.explain && typeof risk.explain === "object" ? risk.explain : {};
  const group = String(ctx?.group || __fallbackGroup(id)).toLowerCase();

  if (group === "must_have" || id.includes("MUST_HAVE") || id.includes("ROLE_SKILL__JD_KEYWORD_ABSENCE")) {
    const requirement = __pickRequirementFragment([
      detail?.missing,
      ev?.requiredMissing,
      ev?.missing,
      meta?.missing,
      ev?.jdEvidence,
      ev?.requiredLines,
    ]);
    if (requirement) {
      return `"${requirement}" 경험을 프로젝트 결과 중심으로 한 문장으로 정리해 JD 요구와 직접 연결하는 것이 좋습니다.`;
    }
  }

  if (group === "domain_fit" || id.includes("DOMAIN") || id.includes("SHIFT")) {
    const keyword = __pickRequirementFragment([
      detail?.domainKeywords,
      ev?.domainKeywords,
      meta?.domainKeywords,
      ev?.jdEvidence,
      ev?.requiredLines,
    ]);
    const family = __pickRequirementFragment([
      detail?.jobFamily,
      ev?.jdFamily,
      meta?.jobFamily,
      meta?.jdFamily,
      explain?.jobFamily,
    ]);
    if (keyword) {
      return `"${keyword}"와 연결되는 경험을 업종이 아니라 실제 수행 업무와 결과 중심으로 다시 써 JD 도메인 요구와 직접 맞추는 것이 좋습니다.`;
    }
    if (family) {
      return `"${family}" 직무군과 맞닿는 업무 경험을 첫 항목에서 바로 드러내 JD 직무 맥락과의 연결을 선명하게 만드는 것이 좋습니다.`;
    }
  }

  if (
    group === "seniority" ||
    id.includes("SENIORITY") ||
    id.includes("LEVEL") ||
    id.includes("AGE") ||
    id.includes("TIMELINE") ||
    id.includes("HOPPING")
  ) {
    const minYears = __pickFirstNum(
      ev?.jdMinYears,
      ev?.requiredYears?.min,
      detail?.requiredYears?.min,
      explain?.requiredYears?.min,
      meta?.requiredYears?.min
    );
    const levelRequirement = __pickRequirementFragment([
      detail?.requiredLevel,
      ev?.requiredLevel,
      meta?.requiredLevel,
      explain?.requiredLevel,
      detail?.level,
      meta?.level,
    ]);
    if (minYears !== null) {
      return `JD 요구 ${Math.round(minYears)}년 수준에 맞는 책임 범위와 성과를 한 문장으로 먼저 제시해 연차보다 실제 수행 수준이 보이도록 정리하는 것이 좋습니다.`;
    }
    if (levelRequirement) {
      return `"${levelRequirement}" 수준에 맞는 책임 범위와 의사결정 경험을 먼저 드러내 JD 기대 레벨과 직접 연결하는 것이 좋습니다.`;
    }
  }

  if (group === "compensation" || id.includes("SALARY") || id.includes("COMPENSATION")) {
    const expected = __pickFirstNum(ev?.salaryExpected, ev?.expectedSalary, meta?.salaryExpected, meta?.salaryTarget);
    const current = __pickFirstNum(ev?.salaryCurrent, ev?.currentSalary, meta?.salaryCurrent);
    if (expected !== null && current !== null) {
      return `희망 보상 ${Math.round(expected)}만원 수준을 뒷받침할 수 있도록 현재 ${Math.round(current)}만원 대비 확장된 책임 범위와 성과 근거를 한 문장으로 먼저 정리하는 것이 좋습니다.`;
    }
    if (expected !== null) {
      return `희망 보상 ${Math.round(expected)}만원 수준에 맞는 책임 범위와 성과를 먼저 명시해 JD 보상 기대와 직접 연결하는 것이 좋습니다.`;
    }
  }

  return "";
}

export function deriveMustHaveFitFromRisks(riskResults = []) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  const coverage = [];
  let hasMustHaveMissingSignal = false;

  for (const r of arr) {
    const id = String(r?.id || r?.raw?.id || "").toUpperCase();
    const isMustHaveSignal =
      id.includes("MUST_HAVE") ||
      id.includes("ROLE_SKILL__MUST_HAVE_MISSING") ||
      id.includes("ROLE_SKILL__JD_KEYWORD_ABSENCE") ||
      id.includes("MUST__SKILL__MISSING");
    if (!isMustHaveSignal) continue;

    hasMustHaveMissingSignal =
      hasMustHaveMissingSignal ||
      id.includes("MUST_HAVE_MISSING") ||
      id.includes("MUST__SKILL__MISSING");

    const cov = __pickFirstNum(
      r?.detail?.coverage,
      r?.evidence?.requiredCoverage,
      r?.meta?.requiredCoverage,
      r?.raw?.detail?.coverage,
      r?.raw?.evidence?.requiredCoverage,
      r?.raw?.meta?.requiredCoverage
    );
    if (cov !== null) {
      const normalized = cov > 1 ? cov / 100 : cov;
      coverage.push(__clamp01(normalized));
    }
  }

  if (coverage.length > 0) return Math.min(...coverage);
  if (hasMustHaveMissingSignal) return 0;
  return null;
}

export function resolveCandidateTypeCeiling({
  highRiskSignal = false,
  gateSignal = false,
  score = 0,
  mustHaveFit = null,
} = {}) {
  const scorePct = __toScorePct(score);
  const fit = Number.isFinite(Number(mustHaveFit)) ? __clamp01(Number(mustHaveFit)) : null;

  if (Boolean(highRiskSignal)) return "구조적 리스크형";
  if (Boolean(gateSignal)) return "조건 미충족형";
  if (scorePct < 45) return "탐색 구간";
  if (scorePct >= 70 && fit !== null && fit >= 0.8) return "바로 활용 가능 후보";
  return "성장 가능 후보";
}

export function deriveCandidateTypeFromRisks(riskResults = [], { score = 0 } = {}) {
  const arr = Array.isArray(riskResults) ? riskResults : [];
  const isGateRisk = (r) => {
    const id = String(r?.id || r?.raw?.id || "").toUpperCase();
    const layer = String(r?.layer || r?.raw?.layer || "").toLowerCase();
    return layer === "gate" || id.startsWith("GATE__");
  };
  const gateSignal = arr.some((r) => {
    return isGateRisk(r);
  });
  const highRiskSignal = arr.some((r) => {
    if (isGateRisk(r)) return false;
    const id = String(r?.id || r?.raw?.id || "").toUpperCase();
    const score01 = __getRiskScore01(r);
    if (id.includes("HIGH_RISK")) return true;
    if (id.includes("STRUCTURAL")) return true;
    return score01 >= 0.85;
  });
  const mustHaveFit = deriveMustHaveFitFromRisks(arr);
  const candidateType = resolveCandidateTypeCeiling({
    highRiskSignal,
    gateSignal,
    score,
    mustHaveFit,
  });
  return {
    candidateType,
    highRiskSignal,
    gateSignal,
    mustHaveFit,
    score: __toScorePct(score),
  };
}

function __buildActionHintForRisk(risk, ctx = {}) {
  const id = String(risk?.id || "");
  const mapped = __buildMappedActionHint(risk, ctx);
  if (mapped) return mapped;
  const direct = RISK_ACTION_HINT[id];
  if (direct) return direct;

  const group = String(ctx?.group || __fallbackGroup(id)).toLowerCase();
  if (group === "must_have" || id.includes("MUST_HAVE") || id.includes("ROLE_SKILL")) {
    return "JD 필수요건을 2~3개로 압축하고 각 요건마다 이력서 근거 항목을 1개씩 직접 연결하세요.";
  }
  if (group === "domain_fit" || id.includes("DOMAIN") || id.includes("SHIFT")) {
    return "전환 이력은 공통 과업·공통 KPI·검증 성과 순서로 정리해 전이 가능성을 먼저 증명하세요.";
  }
  if (
    group === "seniority" ||
    id.includes("SENIORITY") ||
    id.includes("LEVEL") ||
    id.includes("AGE") ||
    id.includes("TIMELINE") ||
    id.includes("HOPPING")
  ) {
    return "연차/레벨/타임라인 이슈는 사실-책임범위-성과를 한 줄씩 고정해 보수 해석을 줄이세요.";
  }
  if (group === "compensation" || id.includes("SALARY")) {
    return "보상 조건은 희망 범위와 근거(성과·시장가·레벨 적합성)를 함께 제시해 조건 충돌을 줄이세요.";
  }

  const hasEvidence =
    (Array.isArray(ctx?.evidence?.jd) && ctx.evidence.jd.length > 0) ||
    (Array.isArray(ctx?.evidence?.resume) && ctx.evidence.resume.length > 0);
  if (hasEvidence) {
    return "JD 요구 근거와 이력서 증빙 문장을 1:1로 맞춰 상단 핵심 항목부터 보강하세요.";
  }
  return "상위 리스크 신호를 기준으로 JD 요구와 이력서 근거를 직접 연결하는 보완 문장을 먼저 추가하세요.";
}

function __buildEvidenceForRisk(risk) {
  const id = String(risk?.id || "");
  const ev = risk?.evidence && typeof risk.evidence === "object" ? risk.evidence : {};
  const detail = risk?.detail && typeof risk.detail === "object" ? risk.detail : {};

  const out = { jd: [], resume: [], note: "" };

  if (id === "ROLE_SKILL__MUST_HAVE_MISSING" || id === "ROLE_SKILL__JD_KEYWORD_ABSENCE") {
    const missing = __toShortList(
      detail?.missing || ev?.requiredMissing || ev?.missing || risk?.meta?.missing
    );
    const covered = __toShortList(
      detail?.covered || ev?.requiredCovered || ev?.covered || risk?.meta?.covered
    );
    const cov = __pickFirstNum(detail?.coverage, ev?.requiredCoverage, risk?.meta?.requiredCoverage);
    out.jd = missing;
    out.resume = covered;
    if (cov !== null) out.note = `요건 커버리지 약 ${Math.round(cov * 100)}%`;
  } else if (id === "SENIORITY__UNDER_MIN_YEARS") {
    const jdMin = __pickFirstNum(ev?.jdMinYears, ev?.requiredYears?.min, risk?.explain?.requiredYears?.min);
    const resumeY = __pickFirstNum(ev?.resumeYears);
    const gapM = __pickFirstNum(ev?.gapMonthsAbs, ev?.gapMonthsSigned);
    if (jdMin !== null) out.jd = [`최소 연차 ${jdMin}년`];
    if (resumeY !== null) out.resume = [`이력서 연차 ${resumeY}년`];
    if (gapM !== null) out.note = `연차 간극 약 ${Math.abs(Math.round(gapM))}개월`;
  } else if (id === "GATE__DOMAIN_MISMATCH__JOB_FAMILY") {
    const jdFam = String(ev?.jdFamily || "").trim();
    const rsFam = String(ev?.resumeTopFamily || "").trim();
    const kw = __pickFirstNum(ev?.resumeJdFamilyKwCount);
    if (jdFam) out.jd = [`JD 직무군: ${jdFam}`];
    if (rsFam) out.resume = [`이력서 직무군: ${rsFam}`];
    if (kw !== null) out.note = `직무군 연결 키워드 ${kw}개`;
  } else if (id === "GATE__SALARY_MISMATCH") {
    const cur = __pickFirstNum(ev?.salaryCurrent, ev?.currentSalary, risk?.meta?.salaryCurrent);
    const exp = __pickFirstNum(ev?.salaryExpected, ev?.expectedSalary, risk?.meta?.salaryExpected);
    const ratio = __pickFirstNum(ev?.ratio, risk?.meta?.ratio);
    if (cur !== null) out.resume = [`현재 연봉 ${Math.round(cur)}만원`];
    if (exp !== null) out.jd = [`희망 연봉 ${Math.round(exp)}만원`];
    if (ratio !== null) out.note = `보상 비율 약 ${Math.round(ratio * 100)}%`;
  } else if (id === "TASK__CORE_COVERAGE_LOW" || id === "TASK__EVIDENCE_TOO_WEAK") {
    const meta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};
    const missingRaw = Array.isArray(meta?.missingCriticalTasks) ? meta.missingCriticalTasks : [];
    const weakRaw = Array.isArray(meta?.weakMatchedTasks) ? meta.weakMatchedTasks : [];
    const missingLabels = missingRaw
      .map((x) => (x && typeof x === "object" ? String(x.label || x.id || "").trim() : String(x || "").trim()))
      .filter(Boolean)
      .slice(0, 2);
    const weakLabels = weakRaw
      .map((x) => (x && typeof x === "object" ? String(x.label || x.id || "").trim() : String(x || "").trim()))
      .filter(Boolean)
      .slice(0, 2);

    if (missingLabels.length > 0) out.jd = [`누락된 핵심 업무: ${missingLabels.join(", ")}`];
    if (weakLabels.length > 0) out.resume = [`관련 경험은 있으나 지원/보조 수준 표현 비중이 높은 업무: ${weakLabels.join(", ")}`];
    if (id === "TASK__CORE_COVERAGE_LOW") {
      out.note = "JD 핵심 업무 대비 직접 수행 근거가 부족합니다.";
    } else {
      out.note = "관련 경험은 있으나 지원/보조 수준 표현 비중이 높습니다.";
    }
  } else if (id === "DOMAIN_ROLE_MISMATCH") {
    // ✅ PATCH (append-only): DOMAIN_ROLE_MISMATCH 전용 — family/keyword 기반 근거 문장
    // ✅ PATCH R29: family key → 사용자 노출 label 변환
    const __DOMAIN_LABEL = {
      procurement_scm: "전략소싱·구매·공급망",
      product_service_planning: "서비스/프로덕트 기획",
    };
    const jdFamKey = String(ev?.jdFamily || "").trim();
    const rsFamKey = String(ev?.resumeFamily || "").trim();
    const jdFam = __DOMAIN_LABEL[jdFamKey] || jdFamKey;
    const rsFam = __DOMAIN_LABEL[rsFamKey] || rsFamKey;
    const jdKws = Array.isArray(detail?.jdKeywords) ? detail.jdKeywords.filter(Boolean).slice(0, 4) : [];
    const rsKws = Array.isArray(detail?.resumeKeywords) ? detail.resumeKeywords.filter(Boolean).slice(0, 4) : [];
    const jdKwStr = jdKws.join(", ");
    const rsKwStr = rsKws.join(", ");
    if (jdFam) out.jd = [jdKwStr ? `JD는 ${jdFam} 도메인을 요구합니다 (${jdKwStr})` : `JD 도메인: ${jdFam}`];
    if (rsFam) out.resume = [rsKwStr ? `이력서는 ${rsFam} 도메인으로 읽힙니다 (${rsKwStr})` : `이력서 도메인: ${rsFam}`];
    const simScore = typeof ev?.similarityScore === "number" ? ev.similarityScore : null;
    if (simScore !== null) out.note = `도메인 유사도 ${Math.round(simScore * 100)}%`;
  } else {
    // generic fallback: existing evidence arrays/notes only
    out.jd = __toShortList(ev?.jdEvidence || ev?.requiredLines);
    out.resume = __toShortList(ev?.resumeEvidence || ev?.requiredCovered);
    out.note = String(ev?.note || "").trim();
  }

  if (!out.jd.length && !out.resume.length && !out.note) return null;
  return out;
}

function __buildTaskOntologyNarrative(risk) {
  const id = String(risk?.id || "");
  if (id !== "TASK__CORE_COVERAGE_LOW" && id !== "TASK__EVIDENCE_TOO_WEAK") return null;
  const meta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};
  const missing = Array.isArray(meta?.missingCriticalTasks) ? meta.missingCriticalTasks : [];
  const weak = Array.isArray(meta?.weakMatchedTasks) ? meta.weakMatchedTasks : [];
  const strong = Array.isArray(meta?.topMatchedTasks)
    ? meta.topMatchedTasks.filter((x) => String(x?.strengthLabel || "").toLowerCase() === "strong")
    : [];

  const missingHints = missing
    .map((x) => String(x?.rewriteHint || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const weakHints = weak
    .map((x) => String(x?.rewriteHint || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const strongHints = strong
    .map((x) => `${String(x?.label || x?.id || "").trim()} 근거는 유지하되 결과 지표를 한 줄 더 보강하세요.`)
    .filter(Boolean)
    .slice(0, 2);

  const taskRewriteGuides = {
    missing: missingHints,
    weak: weakHints,
    strong: strongHints,
  };

  if (id === "TASK__CORE_COVERAGE_LOW") {
    const missingLabels = missing
      .map((x) => String(x?.label || x?.id || "").trim())
      .filter(Boolean)
      .slice(0, 2);
    const missingLine = missingLabels.length ? `누락된 핵심 업무: ${missingLabels.join(", ")}.` : "";
    const hintLine = missingHints.length ? `보강 힌트: ${missingHints.join(" / ")}` : "";
    return {
      signal: "JD 핵심 업무 대비 직접 수행 근거가 부족합니다.",
      userReason: [missingLine, "누락된 핵심 업무를 중심으로 직접 수행 사례를 보강해야 합니다."].filter(Boolean).join(" "),
      interviewerView: "핵심 업무 수행 여부를 과제 단위로 확인하려는 질문이 늘어날 수 있습니다.",
      actionHint: [hintLine, "직접 설계/주도/개선 성과가 드러나는 핵심 항목 보강이 필요합니다."].filter(Boolean).join(" "),
      taskRewriteGuides,
    };
  }

  const weakLabels = weak
    .map((x) => String(x?.label || x?.id || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const weakLine = weakLabels.length ? `약한 근거 업무: ${weakLabels.join(", ")}.` : "";
  const weakReasonLine = (() => {
    const merged = weak
      .flatMap((x) => (Array.isArray(x?.weakReasons) ? x.weakReasons : []))
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const uniq = __uniq(merged).slice(0, 3);
    return uniq.length ? `약한 이유: ${uniq.join(", ")}.` : "";
  })();
  const hintLine = weakHints.length ? `보강 힌트: ${weakHints.join(" / ")}` : "";
  const strongRef = strong.length
    ? `유지할 강한 근거: ${strong.map((x) => String(x?.label || x?.id || "").trim()).filter(Boolean).slice(0, 2).join(", ")}.`
    : "";
  return {
    signal: "관련 경험은 있으나 지원/보조 수준 표현 비중이 높습니다.",
    userReason: [weakLine, weakReasonLine, "같은 업무라도 직접 책임 범위와 수행 결과를 분명히 드러내야 합니다."].filter(Boolean).join(" "),
    interviewerView: "직접 수행 범위와 책임 수준을 확인하는 질문이 늘어날 수 있습니다.",
    actionHint: [hintLine, strongRef, "직접 설계/주도/개선 성과가 드러나는 핵심 항목 보강이 필요합니다."].filter(Boolean).join(" "),
    taskRewriteGuides,
  };
}

function __buildTaskRewriteCandidatesSafe(risk) {
  const id = String(risk?.id || "");
  if (id !== "TASK__CORE_COVERAGE_LOW" && id !== "TASK__EVIDENCE_TOO_WEAK") {
    return { weak: [], missing: [] };
  }
  const meta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};
  const weakRaw = Array.isArray(meta?.weakMatchedTasks) ? meta.weakMatchedTasks : [];
  const missingRaw = Array.isArray(meta?.missingCriticalTasks) ? meta.missingCriticalTasks : [];

  const weak = weakRaw.slice(0, 2).map((x) => ({
    id: String(x?.id || "").trim(),
    label: String(x?.label || x?.id || "").trim(),
    group: String(x?.group || "").trim(),
    original: String(x?.original || x?.sentence || "").trim(),
    weakReasons: Array.isArray(x?.weakReasons) ? x.weakReasons.map((r) => String(r || "").trim()).filter(Boolean) : [],
    rewriteHint: String(x?.rewriteHint || "").trim(),
    rewriteSkeleton: Array.isArray(x?.rewriteSkeleton) ? x.rewriteSkeleton.map((s) => String(s || "").trim()).filter(Boolean) : [],
    rewriteExample: String(x?.rewriteExample || "").trim(),
    caution: String(x?.caution || "없는 성과/책임을 만들어내지 말고 실제 수행한 범위만 강조하세요.").trim(),
  }));

  const missing = missingRaw.slice(0, 2).map((x) => ({
    id: String(x?.id || "").trim(),
    label: String(x?.label || x?.id || "").trim(),
    group: String(x?.group || "").trim(),
    rewriteHint: String(x?.rewriteHint || "").trim(),
    addBulletGuide: Array.isArray(x?.addBulletGuide) ? x.addBulletGuide.map((s) => String(s || "").trim()).filter(Boolean) : [],
    exampleStem: String(x?.exampleStem || "").trim(),
    caution: String(x?.caution || "없는 성과/책임을 만들어내지 말고 실제 수행한 범위만 강조하세요.").trim(),
  }));

  return { weak, missing };
}

const __QUALIFICATION_RE = /(대졸|학사|석사|박사|학위|전공|졸업|전문학사|전문대|관련학과|전공자|자격증|면허|certification|certificate|degree|major|phd|master|bachelor|gpa|학점|신입|경력무관|인턴|병역|어학|toeic|toefl|opic)/i;
const __PREFERENCE_RE = /(우대|preferred|nice\s*to\s*have|plus|preferred qualification|우대사항|가점|선호)/i;
const __ACTION_TEXT_RE = /(경험|프로젝트|수행|운영|설계|개발|분석|검증|측정|개선|도출|구축|작성|주도|운용|협업|테스트|최적화|관리|기획|활용|simulation|design|develop|analy|measure|test|verify|operate|build|lead|improve|deliver)/i;

function __classifyRewriteRequirement(x) {
  const explicit = String(x?.requirementType || "").trim().toLowerCase();
  if (explicit) return explicit;
  const raw = [
    x?.label,
    x?.original,
    x?.sentence,
    x?.rewriteHint,
    x?.rewriteExample,
    x?.exampleStem,
  ].map((v) => String(v || "").trim()).filter(Boolean).join(" ");
  if (!raw) return "action_requirement";
  if (__PREFERENCE_RE.test(raw)) return "preference_requirement";
  if (__QUALIFICATION_RE.test(raw) && !__ACTION_TEXT_RE.test(raw)) return "qualification_requirement";
  return "action_requirement";
}

function __hasResumeRewriteEvidence(x) {
  const original = String(x?.original || x?.sentence || "").trim();
  if (original.length >= 12) return true;
  const label = String(x?.label || "").trim();
  const skeleton = Array.isArray(x?.rewriteSkeleton) ? x.rewriteSkeleton.map((s) => String(s || "").trim()).filter(Boolean) : [];
  const weakReasons = Array.isArray(x?.weakReasons) ? x.weakReasons.map((s) => String(s || "").trim()) : [];
  const actionSignal =
    __ACTION_TEXT_RE.test(label) ||
    skeleton.some((s) => __ACTION_TEXT_RE.test(s)) ||
    weakReasons.some((s) => /ownership|deliverable|outcome|metric/i.test(s));
  return actionSignal;
}

function __looksLikeJdPhraseDump(text) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return false;
  if (__ACTION_TEXT_RE.test(s)) return false;
  if (__QUALIFICATION_RE.test(s) || __PREFERENCE_RE.test(s)) return true;
  return /[,/|]|(?:\s{2,})/.test(s);
}

function __sanitizeRewriteText(text, { allowList = false } = {}) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s) return "";
  if (!allowList && __looksLikeJdPhraseDump(s)) return "";
  return s;
}

function __buildTaskRewriteCandidates(risk) {
  const id = String(risk?.id || "");
  if (id !== "TASK__CORE_COVERAGE_LOW" && id !== "TASK__EVIDENCE_TOO_WEAK") {
    return { weak: [], missing: [] };
  }
  const meta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};
  const weakRaw = Array.isArray(meta?.weakMatchedTasks) ? meta.weakMatchedTasks : [];
  const missingRaw = Array.isArray(meta?.missingCriticalTasks) ? meta.missingCriticalTasks : [];

  const weak = weakRaw
    .filter((x) => __classifyRewriteRequirement(x) === "action_requirement")
    .slice(0, 2)
    .map((x) => ({
      id: String(x?.id || "").trim(),
      label: __sanitizeRewriteText(x?.label, { allowList: true }) || String(x?.id || "").trim(),
      group: String(x?.group || "").trim(),
      requirementType: __classifyRewriteRequirement(x),
      original: String(x?.original || x?.sentence || "").trim(),
      sentence: String(x?.sentence || x?.original || "").trim(),
      weakReasons: Array.isArray(x?.weakReasons) ? x.weakReasons.map((r) => String(r || "").trim()).filter(Boolean) : [],
      rewriteHint: __sanitizeRewriteText(x?.rewriteHint),
      rewriteSkeleton: Array.isArray(x?.rewriteSkeleton)
        ? x.rewriteSkeleton.map((s) => __sanitizeRewriteText(s, { allowList: true })).filter(Boolean)
        : [],
      rewriteExample: __sanitizeRewriteText(x?.rewriteExample),
      caution: String(x?.caution || "?녿뒗 ?깃낵/梨낆엫??留뚮뱾?대궡吏 留먭퀬 ?ㅼ젣 ?섑뻾??踰붿쐞留?媛뺤“?섏꽭??").trim(),
    }))
    .filter((x) => __hasResumeRewriteEvidence(x));

  const missing = missingRaw
    .filter((x) => __classifyRewriteRequirement(x) === "action_requirement")
    .slice(0, 2)
    .map((x) => ({
      id: String(x?.id || "").trim(),
      label: __sanitizeRewriteText(x?.label, { allowList: true }) || String(x?.id || "").trim(),
      group: String(x?.group || "").trim(),
      requirementType: __classifyRewriteRequirement(x),
      rewriteHint: "현재 이력서에서 직접 연결되는 근거가 약합니다. 실제 수행 경험이 있을 때만 보완하세요.",
      addBulletGuide: [],
      exampleStem: "",
      caution: String(x?.caution || "?녿뒗 ?깃낵/梨낆엫??留뚮뱾?대궡吏 留먭퀬 ?ㅼ젣 ?섑뻾??踰붿쐞留?媛뺤“?섏꽭??").trim(),
    }));

  return { weak, missing };
}

function __buildTaskOntologyNarrativeSafe(risk) {
  const id = String(risk?.id || "");
  if (id !== "TASK__CORE_COVERAGE_LOW" && id !== "TASK__EVIDENCE_TOO_WEAK") return null;
  const meta = risk?.taskOntologyMeta && typeof risk.taskOntologyMeta === "object" ? risk.taskOntologyMeta : {};
  const missing = (Array.isArray(meta?.missingCriticalTasks) ? meta.missingCriticalTasks : [])
    .filter((x) => __classifyRewriteRequirement(x) === "action_requirement");
  const weak = (Array.isArray(meta?.weakMatchedTasks) ? meta.weakMatchedTasks : [])
    .filter((x) => __classifyRewriteRequirement(x) === "action_requirement");
  const strong = Array.isArray(meta?.topMatchedTasks)
    ? meta.topMatchedTasks.filter((x) => String(x?.strengthLabel || "").toLowerCase() === "strong")
    : [];

  const missingHints = ["현재 이력서에서 직접 연결되는 근거가 약합니다."];
  const weakHints = weak
    .map((x) => __sanitizeRewriteText(x?.rewriteHint))
    .filter(Boolean)
    .slice(0, 2);
  const strongHints = strong
    .map((x) => `${String(x?.label || x?.id || "").trim()} 근거와 연결된 결과 중심 문장으로 보강하세요.`)
    .filter((x) => !__looksLikeJdPhraseDump(x))
    .slice(0, 2);

  const taskRewriteGuides = {
    missing: missingHints,
    weak: weakHints,
    strong: strongHints,
  };

  if (id === "TASK__CORE_COVERAGE_LOW") {
    const missingLabels = missing
      .map((x) => __sanitizeRewriteText(x?.label, { allowList: true }) || String(x?.id || "").trim())
      .filter(Boolean)
      .slice(0, 2);
    const missingLine = missingLabels.length ? `보강이 필요한 핵심 업무: ${missingLabels.join(", ")}.` : "";
    const hintLine = "현재 이력서에서 직접 연결되는 근거가 약합니다.";
    return {
      signal: "JD 핵심 업무 대비 직접 수행 근거가 부족합니다.",
      userReason: [missingLine, "직접 수행한 경험이 확인될 때만 보완 문장을 추가해야 합니다."].filter(Boolean).join(" "),
      interviewerView: "핵심 업무를 실제로 수행했는지 근거 중심으로 다시 확인하게 됩니다.",
      actionHint: [hintLine, "JD 문구를 그대로 옮기지 말고 실제 수행 경험이 있는 항목만 연결하세요."].filter(Boolean).join(" "),
      taskRewriteGuides,
    };
  }

  const weakLabels = weak
    .map((x) => __sanitizeRewriteText(x?.label, { allowList: true }) || String(x?.id || "").trim())
    .filter(Boolean)
    .slice(0, 2);
  const weakLine = weakLabels.length ? `보완이 필요한 기존 경험: ${weakLabels.join(", ")}.` : "";
  const weakReasonLine = (() => {
    const merged = weak
      .flatMap((x) => (Array.isArray(x?.weakReasons) ? x.weakReasons : []))
      .map((x) => String(x || "").trim())
      .filter(Boolean);
    const uniq = __uniq(merged).slice(0, 3);
    return uniq.length ? `약한 이유: ${uniq.join(", ")}.` : "";
  })();
  const hintLine = weakHints.length ? `보완 힌트: ${weakHints.join(" / ")}` : "";
  const strongRef = strongHints.length ? `참고 방향: ${strongHints.join(" / ")}` : "";
  return {
    signal: "관련 경험은 있지만 직접 수행 범위와 결과 표현이 약합니다.",
    userReason: [weakLine, weakReasonLine, "JD noun list를 반복하지 말고 본인 행동과 결과를 문장으로 드러내야 합니다."].filter(Boolean).join(" "),
    interviewerView: "직접 수행 범위와 결과가 실제로 확인되는지 다시 보게 됩니다.",
    actionHint: [hintLine, strongRef, "행동 + 도구/환경 또는 결과/산출물 구조로만 재작성하세요."].filter(Boolean).join(" "),
    taskRewriteGuides,
  };
}

function __weakReasonSeverity(weakReasons = []) {
  const arr = Array.isArray(weakReasons) ? weakReasons : [];
  let s = 0;
  if (arr.includes("ownership 부재")) s += 3;
  if (arr.includes("deliverable 부재")) s += 3;
  if (arr.includes("outcome/metric 부재")) s += 2;
  if (arr.includes("지원/보조 표현")) s += 1;
  if (arr.includes("broad alias only")) s += 1;
  return s;
}

function __missingPriority(x) {
  const imp = String(x?.importance || "").toLowerCase();
  const impScore = imp === "must" ? 3 : imp === "core" ? 2 : 0;
  const hasGuide =
    Boolean(String(x?.rewriteHint || "").trim()) ||
    (Array.isArray(x?.addBulletGuide) && x.addBulletGuide.length > 0) ||
    Boolean(String(x?.exampleStem || "").trim());
  return impScore * 10 + (hasGuide ? 2 : 0);
}

function __buildTaskRewritePresentation(taskRewriteCandidates) {
  const raw = taskRewriteCandidates && typeof taskRewriteCandidates === "object"
    ? taskRewriteCandidates
    : { weak: [], missing: [] };
  const weakRaw = Array.isArray(raw?.weak) ? raw.weak : [];
  const missingRaw = Array.isArray(raw?.missing) ? raw.missing : [];

  const weakItems = [...weakRaw]
    .sort((a, b) => __weakReasonSeverity(b?.weakReasons) - __weakReasonSeverity(a?.weakReasons))
    .slice(0, 2)
    .map((x) => ({
      original: String(x?.original || "").trim(),
      weakReasons: Array.isArray(x?.weakReasons) ? x.weakReasons.map((v) => String(v || "").trim()).filter(Boolean) : [],
      rewriteHint: String(x?.rewriteHint || "").trim(),
      rewriteSkeleton: Array.isArray(x?.rewriteSkeleton) ? x.rewriteSkeleton.map((v) => String(v || "").trim()).filter(Boolean) : [],
      rewriteExample: String(x?.rewriteExample || "").trim(),
      caution: String(x?.caution || "").trim(),
    }));

  const missingItems = [...missingRaw]
    .sort((a, b) => __missingPriority(b) - __missingPriority(a))
    .slice(0, 2)
    .map((x) => ({
      label: String(x?.label || x?.id || "").trim(),
      rewriteHint: String(x?.rewriteHint || "").trim(),
      addBulletGuide: Array.isArray(x?.addBulletGuide) ? x.addBulletGuide.map((v) => String(v || "").trim()).filter(Boolean) : [],
      exampleStem: String(x?.exampleStem || "").trim(),
      caution: String(x?.caution || "실제 수행 경험이 있는 업무만 추가하세요. 없는 성과/책임은 작성하지 마세요.").trim(),
    }));

  return {
    weak: {
      title: "기존 문장 개선",
      guide: "현재 문장을 책임 범위, 산출물, 결과 중심으로 보강해 주세요.",
      items: weakItems,
    },
    missing: {
      title: "새 항목 추가 검토",
      guide: "누락된 핵심 업무는 실제 수행 경험이 있을 때만 보강하세요.",
      items: missingItems,
    },
  };
}

export function buildExplanationPack(riskResults = [], options = {}) {
  // explanation 내부 candidateType은 UI 주표시 SSOT가 아니라 reference/meta 성격을 유지한다.
  // 주표시 candidateType은 simulation VM의 vm.candidateType을 기준으로 본다.
  const candidateTypeContext = deriveCandidateTypeFromRisks(riskResults, { score: 0 });
  const __alignedTopRiskIds = Array.isArray(options?.alignedTopRiskIds)
    ? options.alignedTopRiskIds.map((id) => String(id || "").trim()).filter(Boolean)
    : [];
  const candidates = [...(Array.isArray(riskResults) ? riskResults : [])].map((r) => {
    const id = String(r?.id || "");
    const mapped = RISK_EXPLANATION[id] || null;
    const group = String(mapped?.group || __fallbackGroup(id));
    const severity = __severityTier(r?.score);
    const tpl = mapped?.templates?.[severity] || null;
    const taskNarrative = __buildTaskOntologyNarrativeSafe(r);
    const signal = taskNarrative?.signal || tpl?.signal || mapped?.signal || __fallbackSignal(r);
    const userReason = taskNarrative?.userReason || tpl?.userReason || mapped?.userReason || __fallbackSignal(r);
    const interviewerView = taskNarrative?.interviewerView || tpl?.interviewerView || mapped?.interviewerView || __fallbackSignal(r);
    const evidence = __buildEvidenceForRisk(r);
    const actionHint = taskNarrative?.actionHint || __buildActionHintForRisk(r, { group, evidence, signal, userReason });
    const taskRewriteCandidates = __buildTaskRewriteCandidatesSafe(r);
    return {
      id,
      score: __safeNum(r?.score, 0),
      severity,
      group,
      priority: __safeNum(r?.priority, __safeNum(mapped?.priority, 0)),
      signal,
      userReason,
      interviewerView,
      evidence,
      actionHint,
      taskRewriteGuides: taskNarrative?.taskRewriteGuides || undefined,
      taskRewriteCandidates,
    };
  });

  // group 중복 제거: score 우선, 동점이면 dictionary priority 우선
  const sorted = candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.priority - a.priority;
  });

  const pickedByGroup = new Map();
  for (const c of sorted) {
    if (!pickedByGroup.has(c.group)) pickedByGroup.set(c.group, c);
  }

  const __candidateById = new Map(candidates.map((c) => [c.id, c]));
  const __alignedTopCandidates = __alignedTopRiskIds
    .map((id) => __candidateById.get(id))
    .filter(Boolean);
  const __fallbackTopCandidates = [...pickedByGroup.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    });
  const __topSignalCandidates = [...__alignedTopCandidates];
  const __seenTopSignalIds = new Set(__topSignalCandidates.map((x) => x.id));
  for (const candidate of __fallbackTopCandidates) {
    if (__topSignalCandidates.length >= 3) break;
    if (__seenTopSignalIds.has(candidate.id)) continue;
    __seenTopSignalIds.add(candidate.id);
    __topSignalCandidates.push(candidate);
  }

  const topSignals = __topSignalCandidates
    .slice(0, 3)
    .map((x) => ({
      id: x.id,
      message: x.signal,
      severity: x.severity,
      group: x.group,
      signal: x.signal,
      userReason: x.userReason,
      interviewerView: x.interviewerView,
      evidence: x.evidence || undefined,
      actionHint: x.actionHint || undefined,
      taskRewriteGuides: x.taskRewriteGuides || undefined,
      taskRewriteCandidates: x.taskRewriteCandidates || undefined,
    }));

  const primaryReason = topSignals[0]?.userReason || "핵심 리스크 신호를 재확인해 주세요.";
  const primaryReasonEvidence = topSignals[0]?.evidence || undefined;
  const primaryReasonAction = topSignals[0]?.actionHint || undefined;
  const primaryReasonItem = topSignals[0]
    ? {
      id: topSignals[0].id,
      message: topSignals[0].userReason,
      severity: topSignals[0].severity,
      group: topSignals[0].group,
      evidence: topSignals[0].evidence || undefined,
      actionHint: topSignals[0].actionHint || undefined,
    }
    : undefined;
  const interviewInsight = __uniq([
    topSignals[0]?.interviewerView || null,
    topSignals[1]?.interviewerView || null,
  ]).slice(0, 2);
  const __taskRewriteSignalIds = new Set(["TASK__CORE_COVERAGE_LOW", "TASK__EVIDENCE_TOO_WEAK"]);
  const __rewriteSource =
    topSignals.find((x) => __taskRewriteSignalIds.has(String(x?.id || ""))) ||
    candidates.find((x) => __taskRewriteSignalIds.has(String(x?.id || "")));
  const taskRewriteCandidates = __rewriteSource?.taskRewriteCandidates || { weak: [], missing: [] };
  const taskRewritePresentation = __buildTaskRewritePresentation(taskRewriteCandidates);

  // ✅ PATCH (append-only): ALL candidates 대상 per-risk evidence 맵 — topSignals group-dedup 한계 보완
  const perRiskEvidence = Object.fromEntries(
    candidates.map((c) => [String(c.id || "").trim(), c.evidence || { jd: [], resume: [], note: "" }])
  );
  // ✅ PATCH R37 (append-only): DOMAIN_ROLE_MISMATCH evidence에 criticalMissingItems 연결
  try {
    const __dmMissing = Array.isArray(options?.criticalMissingItems)
      ? options.criticalMissingItems.filter(Boolean).slice(0, 2)
      : [];
    if (__dmMissing.length > 0 && perRiskEvidence["DOMAIN_ROLE_MISMATCH"]) {
      const __dmEv = perRiskEvidence["DOMAIN_ROLE_MISMATCH"];
      if (!Array.isArray(__dmEv.jd)) __dmEv.jd = [];
      __dmEv.jd.push(
        `JD에서 직접 요구되는 핵심 경험(${__dmMissing.join(", ")})이 이력서에서 바로 확인되지 않습니다.`
      );
    }
  } catch { /* silent */ }

  return {
    primaryReason,
    primaryReasonEvidence,
    primaryReasonAction,
    primaryReasonItem,
    topSignals,
    interviewInsight,
    candidateType: candidateTypeContext.candidateType,
    candidateTypeContext,
    taskRewriteGuides: __rewriteSource?.taskRewriteGuides || undefined,
    taskRewriteCandidates,
    taskRewritePresentation,
    perRiskEvidence,
  };
}
