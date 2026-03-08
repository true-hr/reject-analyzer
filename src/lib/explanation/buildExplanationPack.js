// src/lib/explanation/buildExplanationPack.js

const RISK_EXPLANATION = {
  ROLE_SKILL__MUST_HAVE_MISSING: {
    group: "must_have",
    priority: 100,
    templates: {
      hard: {
        signal: "JD 필수 역량 대비 이력서 근거가 구조적으로 부족하게 읽힙니다.",
        userReason: "필수 항목별 직접 증빙 bullet이 약해 초반 필터 질문이 늘 수 있습니다.",
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
    userReason: "필수 항목별로 직접 증빙되는 경험 bullet을 보강해야 합니다.",
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
};

const RISK_ACTION_HINT = {
  ROLE_SKILL__MUST_HAVE_MISSING: "JD 필수 기술과 직접 연결되는 경험 bullet을 이력서 상단에 추가하세요.",
  ROLE_SKILL__JD_KEYWORD_ABSENCE: "JD 핵심 키워드와 동일한 표현을 경험 bullet/요약문에 1~2회 반영하세요.",
  SENIORITY__UNDER_MIN_YEARS: "총 경력보다 해당 직무 연관 경험 기간과 성과를 먼저 보이게 정리하세요.",
  GATE__DOMAIN_MISMATCH__JOB_FAMILY: "이전 산업 경험 중 현재 JD와 겹치는 업무 공통점을 첫 요약문에 명시하세요.",
  GATE__SALARY_MISMATCH: "희망연봉 근거를 성과·경력 수준과 함께 제시하거나 범위를 유연하게 조정하세요.",
};

function __safeNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function __uniq(arr) {
  return Array.from(new Set(Array.isArray(arr) ? arr.filter(Boolean) : []));
}

function __fallbackSignal(r) {
  return (
    r?.oneLiner ||
    r?.reasonShort ||
    r?.summary ||
    r?.title ||
    String(r?.id || "")
  );
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

function __buildActionHintForRisk(risk) {
  const id = String(risk?.id || "");
  return RISK_ACTION_HINT[id] || undefined;
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
  } else {
    // generic fallback: existing evidence arrays/notes only
    out.jd = __toShortList(ev?.jdEvidence || ev?.requiredLines);
    out.resume = __toShortList(ev?.resumeEvidence || ev?.requiredCovered);
    out.note = String(ev?.note || "").trim();
  }

  if (!out.jd.length && !out.resume.length && !out.note) return null;
  return out;
}

export function buildExplanationPack(riskResults = []) {
  const candidates = [...(Array.isArray(riskResults) ? riskResults : [])].map((r) => {
    const id = String(r?.id || "");
    const mapped = RISK_EXPLANATION[id] || null;
    const severity = __severityTier(r?.score);
    const tpl = mapped?.templates?.[severity] || null;
    return {
      id,
      score: __safeNum(r?.score, 0),
      severity,
      group: String(mapped?.group || __fallbackGroup(id)),
      priority: __safeNum(mapped?.priority, 0),
      signal: tpl?.signal || mapped?.signal || __fallbackSignal(r),
      userReason: tpl?.userReason || mapped?.userReason || __fallbackSignal(r),
      interviewerView: tpl?.interviewerView || mapped?.interviewerView || __fallbackSignal(r),
      evidence: __buildEvidenceForRisk(r),
      actionHint: __buildActionHintForRisk(r),
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

  const topSignals = [...pickedByGroup.values()]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.priority - a.priority;
    })
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

  return {
    primaryReason,
    primaryReasonEvidence,
    primaryReasonAction,
    primaryReasonItem,
    topSignals,
    interviewInsight,
  };
}
