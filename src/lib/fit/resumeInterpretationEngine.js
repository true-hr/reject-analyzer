// src/lib/fit/resumeInterpretationEngine.js
// PASSMAP Resume Interpretation Engine v1
// append-only 신규 파일 — 기존 구조 변경 없음
// 출력: buildResumeInterpretation({ parsedResume, roleDepth, careerInterpretation,
//         leadershipGapSignals, careerSignals, domainSignal, structuralPatterns })

function _safeArr(v) {
  return Array.isArray(v) ? v : [];
}

function _safeStr(v) {
  return typeof v === "string" ? v.trim() : String(v != null ? v : "").trim();
}

// ─────────────────────────────────────────────────────────────
// overallAxis
// 1순위: careerInterpretation.generator.factors.careerAxis.overallAxis
// 2순위: parsedResume 기반 보수 fallback
// ─────────────────────────────────────────────────────────────
function _buildOverallAxis(careerInterpretation, parsedResume) {
  const factorsAxis = careerInterpretation?.generator?.factors?.careerAxis;
  const val = _safeStr(factorsAxis?.overallAxis);
  if (val) {
    const recentVal = _safeStr(factorsAxis?.recentAxis);
    return {
      label: val,
      confidence: "high",
      evidence: recentVal ? [recentVal] : [],
    };
  }

  // 2순위: parsedResume fallback
  const summaryText = _safeStr(parsedResume?.summary);
  const achievementTexts = _safeArr(parsedResume?.achievements)
    .slice(0, 2)
    .map(_safeStr)
    .filter(Boolean);
  const evidenceFallback = [summaryText, ...achievementTexts]
    .filter(Boolean)
    .slice(0, 2);
  if (evidenceFallback.length > 0) {
    return { label: null, confidence: "low", evidence: evidenceFallback };
  }

  return { label: null, confidence: "low", evidence: [] };
}

// ─────────────────────────────────────────────────────────────
// recentAxis
// 1순위: careerInterpretation.generator.factors.careerAxis.recentAxis
// 2순위: 최근 timeline 1~2개 role/bullets fallback
// ─────────────────────────────────────────────────────────────
function _buildRecentAxis(careerInterpretation, parsedResume) {
  const factorsAxis = careerInterpretation?.generator?.factors?.careerAxis;
  const val = _safeStr(factorsAxis?.recentAxis);
  if (val) {
    return { label: val, confidence: "high", evidence: [] };
  }

  const timeline = _safeArr(parsedResume?.timeline);
  const recentItems = timeline.slice(0, 2);
  const evidence = recentItems
    .flatMap((item) => {
      const lines = [];
      const roleText = _safeStr(item?.role);
      if (roleText) lines.push(roleText);
      _safeArr(item?.bullets)
        .slice(0, 1)
        .forEach((b) => {
          const bt = _safeStr(b);
          if (bt) lines.push(bt);
        });
      return lines;
    })
    .filter(Boolean)
    .slice(0, 3);

  if (evidence.length > 0) {
    return { label: null, confidence: "low", evidence };
  }
  return { label: null, confidence: "low", evidence: [] };
}

// ─────────────────────────────────────────────────────────────
// seniorityRead
// SSOT: roleDepth
// leadershipGapSignals는 confidence 보조만
// ─────────────────────────────────────────────────────────────
function _buildSeniorityRead(roleDepth, leadershipGapSignals) {
  const rd = roleDepth && typeof roleDepth === "object" ? roleDepth : null;
  const level = _safeStr(rd?.dominantLevel) || null;
  const evidenceSummary = _safeArr(rd?.evidenceSummary);
  const evidenceFlat = Object.values(
    rd?.evidence && typeof rd.evidence === "object" ? rd.evidence : {}
  )
    .flatMap((arr) => _safeArr(arr))
    .map(_safeStr)
    .filter(Boolean)
    .slice(0, 3);
  const evidence = [...evidenceSummary.slice(0, 3), ...evidenceFlat]
    .filter(Boolean)
    .slice(0, 4);

  const missingForNextLevel = _safeArr(rd?.missingForNextLevel).slice(0, 4);
  const conservativeReasons = _safeArr(rd?.conservativeReasons).slice(0, 4);

  // confidence: evidence 수 + source 품질
  let confidence = "low";
  if (rd && level && level !== "unknown") {
    if (evidence.length >= 2) confidence = "high";
    else if (evidence.length === 1) confidence = "medium";
  }

  // leadershipGapSignals — confidence 보조: 불일치면 medium으로 보수화
  const lgLevel = _safeStr(leadershipGapSignals?.resumeLevel).toLowerCase();
  if (
    confidence === "high" &&
    lgLevel &&
    lgLevel !== "unknown" &&
    level &&
    !lgLevel.includes(level)
  ) {
    confidence = "medium";
  }

  return { level, confidence, evidence, missingForNextLevel, conservativeReasons };
}

// ─────────────────────────────────────────────────────────────
// scopeRead
// 보수 휴리스틱: individual / cross_functional / team_or_org / unknown
// title만으로 team_or_org 판정 금지
// ─────────────────────────────────────────────────────────────
function _buildScopeRead(roleDepth, parsedResume) {
  const rd = roleDepth && typeof roleDepth === "object" ? roleDepth : {};
  const stc =
    rd.sourceTypeCounts && typeof rd.sourceTypeCounts === "object"
      ? rd.sourceTypeCounts
      : {};
  const evidence = Object.values(
    rd.evidence && typeof rd.evidence === "object" ? rd.evidence : {}
  )
    .flatMap((arr) => _safeArr(arr))
    .map(_safeStr)
    .filter(Boolean);
  const bullets = _safeArr(parsedResume?.timeline)
    .flatMap((item) => _safeArr(item?.bullets))
    .map(_safeStr)
    .filter(Boolean);
  const combined = [...evidence, ...bullets].join(" ");

  const orgPattern =
    /전사|사업부|본부|조직\s*전체|org[\s-]?wide|company[\s-]?wide/i;
  const crossPattern =
    /유관부서|cross[\s-]?functional|stakeholder|협업|coordination|business\s*partner/i;
  const teamOrgPattern =
    /팀\s*관리|팀\s*리드|팀원\s*관리|인력\s*관리|채용|조직\s*관리/i;
  const individualPattern =
    /수행|운영|담당|처리|execute|implement|실무|단독/i;

  const ownershipCount =
    Number(stc.decision_signal || 0) + Number(stc.achievement_scope || 0);
  const bulletCount = Number(stc.bullet_task || 0);

  let level = "unknown";
  let confidence = "low";
  const evidenceOut = [];

  if (orgPattern.test(combined) && ownershipCount > 0) {
    level = "team_or_org";
    confidence = "medium";
    evidenceOut.push("전사/사업부급 범위 표현 + 오너십 근거");
  } else if (teamOrgPattern.test(combined) && ownershipCount > 0) {
    level = "team_or_org";
    confidence = "medium";
    evidenceOut.push("팀관리/조직리딩 + 오너십 근거");
  } else if (crossPattern.test(combined)) {
    level = "cross_functional";
    confidence = "medium";
    evidenceOut.push("유관부서 협업/stakeholder 표현 감지");
  } else if (individualPattern.test(combined) || bulletCount > 0) {
    level = "individual";
    confidence = ownershipCount === 0 ? "medium" : "low";
    evidenceOut.push("개인 실행/실무 중심 표현");
  }

  return { level, confidence, evidence: evidenceOut };
}

// ─────────────────────────────────────────────────────────────
// transitionSummary
// pattern: linear / adjacent_shift / domain_shift / mixed / unclear
// negative 단정문 금지, 패턴 설명 중심
// ─────────────────────────────────────────────────────────────
function _buildTransitionSummary(careerInterpretation, domainSignal, careerSignals) {
  const gapPattern =
    careerInterpretation?.generator?.factors?.gapPattern || {};
  const ds =
    domainSignal && typeof domainSignal === "object" ? domainSignal : {};

  // pattern 결정
  let pattern = "unclear";
  if (ds.hasDomainShiftFeel) {
    pattern = "domain_shift";
  } else {
    const transType = _safeStr(careerSignals?.transitionType).toLowerCase();
    if (transType.includes("linear")) pattern = "linear";
    else if (transType.includes("adjacent")) pattern = "adjacent_shift";
    else if (transType.includes("domain") || transType.includes("shift"))
      pattern = "domain_shift";
    else if (transType.includes("mixed")) pattern = "mixed";
  }

  const hasGapConcern = Boolean(gapPattern.hasGapConcern);
  const gapCount = Number(gapPattern.gapCount || 0);
  const maxGapMonths = Number(gapPattern.maxGapMonths || 0);

  // notes 조합
  const notes = [];
  const dsTags = _safeArr(ds.reasonTags).filter(Boolean);
  if (dsTags.length > 0) notes.push(dsTags.slice(0, 2).join(", "));
  const transNarrative = _safeStr(careerSignals?.transitionNarrative);
  if (transNarrative) notes.push(transNarrative);
  if (hasGapConcern && maxGapMonths >= 6) {
    notes.push(`공백 최대 ${maxGapMonths}개월 패턴 확인`);
  }

  return {
    pattern,
    hasGapConcern,
    gapCount,
    maxGapMonths,
    notes: notes.slice(0, 3),
  };
}

// ─────────────────────────────────────────────────────────────
// strengths (2~4개 이내)
// ─────────────────────────────────────────────────────────────
function _buildStrengths(
  overallAxis,
  recentAxis,
  seniorityRead,
  transitionSummary,
  roleDepth
) {
  const out = [];
  const rd = roleDepth || {};

  // 축 일관성
  if (
    overallAxis.label &&
    recentAxis.label &&
    overallAxis.label === recentAxis.label
  ) {
    out.push(
      `커리어 전반(${overallAxis.label})과 최근 역할이 일관된 축으로 읽힙니다.`
    );
  } else if (overallAxis.label) {
    out.push(`전반적 역할 축: ${overallAxis.label}`);
  }

  // roleDepth evidenceSummary 첫 항목
  const evidSummary = _safeArr(rd.evidenceSummary).filter(Boolean);
  if (evidSummary.length > 0) out.push(evidSummary[0]);

  // linear / adjacent_shift
  if (transitionSummary.pattern === "linear") {
    out.push("커리어 전환 패턴이 직선적으로 이어집니다.");
  } else if (transitionSummary.pattern === "adjacent_shift") {
    out.push("인접 도메인으로의 전환 패턴으로 연속성이 확인됩니다.");
  }

  // ownership evidence 첫 항목
  const ownershipEvidence = _safeArr(rd.evidence?.ownership).filter(Boolean);
  if (ownershipEvidence.length > 0 && out.length < 4) {
    out.push(_safeStr(ownershipEvidence[0]));
  }

  return out.filter(Boolean).slice(0, 4);
}

// ─────────────────────────────────────────────────────────────
// concerns (2~4개 이내)
// ─────────────────────────────────────────────────────────────
function _buildConcerns(
  seniorityRead,
  domainSignal,
  transitionSummary,
  leadershipGapSignals
) {
  const out = [];
  const ds =
    domainSignal && typeof domainSignal === "object" ? domainSignal : {};

  // missingForNextLevel 첫 항목
  if (seniorityRead.missingForNextLevel.length > 0) {
    out.push(seniorityRead.missingForNextLevel[0]);
  }

  // conservativeReasons 첫 항목
  if (seniorityRead.conservativeReasons.length > 0) {
    out.push(seniorityRead.conservativeReasons[0]);
  }

  // domainSignal.reasonTags 첫 항목
  const dsTags = _safeArr(ds.reasonTags).filter(Boolean);
  if (dsTags.length > 0) out.push(dsTags[0]);

  // gapPattern concern
  if (
    transitionSummary.hasGapConcern &&
    transitionSummary.maxGapMonths >= 6
  ) {
    out.push(
      `커리어 공백(최대 ${transitionSummary.maxGapMonths}개월)이 확인됩니다.`
    );
  }

  // leadershipGapSignals.notes 첫 항목 (공간 있을 때만)
  const lgNotes = _safeArr(leadershipGapSignals?.notes).filter(Boolean);
  if (lgNotes.length > 0 && out.length < 4) out.push(lgNotes[0]);

  return out.filter(Boolean).slice(0, 4);
}

// ─────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────
const _EMPTY = {
  overallAxis: { label: null, confidence: "low", evidence: [] },
  recentAxis: { label: null, confidence: "low", evidence: [] },
  seniorityRead: {
    level: null,
    confidence: "low",
    evidence: [],
    missingForNextLevel: [],
    conservativeReasons: [],
  },
  scopeRead: { level: "unknown", confidence: "low", evidence: [] },
  transitionSummary: {
    pattern: "unclear",
    hasGapConcern: false,
    gapCount: 0,
    maxGapMonths: 0,
    notes: [],
  },
  strengths: [],
  concerns: [],
  meta: {
    used: {
      roleDepth: false,
      careerAxis: false,
      leadershipGapSignals: false,
      careerSignals: false,
      domainSignal: false,
      structuralPatterns: false,
      parsedResume: false,
    },
  },
};

export function buildResumeInterpretation({
  parsedResume = null,
  roleDepth = null,
  careerInterpretation = null,
  leadershipGapSignals = null,
  careerSignals = null,
  domainSignal = null,
  structuralPatterns = null,
} = {}) {
  try {
    // roleDepth: 직접 param 우선, 없으면 careerInterpretation에서 추출
    const _roleDepth =
      roleDepth || careerInterpretation?.currentLevel?.roleDepth || null;
    // domainSignal: 직접 param 우선, 없으면 generator.factors에서 추출
    const _domainSignal =
      domainSignal ||
      careerInterpretation?.generator?.factors?.domainSignal ||
      null;

    const overallAxis = _buildOverallAxis(careerInterpretation, parsedResume);
    const recentAxis = _buildRecentAxis(careerInterpretation, parsedResume);
    const seniorityRead = _buildSeniorityRead(_roleDepth, leadershipGapSignals);
    const scopeRead = _buildScopeRead(_roleDepth, parsedResume);
    const transitionSummary = _buildTransitionSummary(
      careerInterpretation,
      _domainSignal,
      careerSignals
    );
    const strengths = _buildStrengths(
      overallAxis,
      recentAxis,
      seniorityRead,
      transitionSummary,
      _roleDepth
    );
    const concerns = _buildConcerns(
      seniorityRead,
      _domainSignal,
      transitionSummary,
      leadershipGapSignals
    );

    return {
      overallAxis,
      recentAxis,
      seniorityRead,
      scopeRead,
      transitionSummary,
      strengths,
      concerns,
      meta: {
        used: {
          roleDepth: Boolean(_roleDepth),
          careerAxis: Boolean(
            careerInterpretation?.generator?.factors?.careerAxis
          ),
          leadershipGapSignals: Boolean(leadershipGapSignals),
          careerSignals: Boolean(careerSignals),
          domainSignal: Boolean(_domainSignal),
          structuralPatterns: Boolean(structuralPatterns),
          parsedResume: Boolean(parsedResume),
        },
      },
    };
  } catch {
    return { ..._EMPTY };
  }
}
