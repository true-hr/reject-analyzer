// ✅ PATCH (append-only): Top3 리스크 ID별 Action 제안 — narrative 없는 리스크용
const __ACTION_BY_RISK = {
  ROLE_SKILL__MUST_HAVE_MISSING: [
    "JD에서 요구하는 핵심 역량과 직접 연결되는 경험 문장을 추가하는 것이 좋습니다.",
    "이력서 상단 주요 프로젝트에 해당 역량이 사용된 사례를 명시해 주세요.",
  ],
  LOW_CONTENT_DENSITY_RISK: [
    "각 프로젝트에 수행 범위와 결과를 명확히 드러내는 문장을 추가하는 것이 좋습니다.",
    "성과 수치나 결과 지표를 포함하면 신뢰도를 높일 수 있습니다.",
  ],
  JD_KEYWORD_MISSING: [
    "JD에서 반복적으로 등장하는 핵심 키워드를 이력서 경험 문장에 반영하는 것이 좋습니다.",
    "동일 의미의 경험이라도 JD 표현과 맞춰 서술하면 적합성이 높게 읽힐 수 있습니다.",
  ],
  ROLE_DIRECTION_MISMATCH: [
    "현재 커리어 흐름이 지원 직무와 어떻게 연결되는지 설명 문장을 추가하는 것이 좋습니다.",
    "지원 직무와 연결되는 경험을 상단에 배치해 방향성을 명확히 해 주세요.",
  ],
  // ✅ PATCH R30 (append-only): DOMAIN_ROLE_MISMATCH 전용 도메인 브릿지 action
  DOMAIN_ROLE_MISMATCH: [
    "전략소싱·구매·SCM 관련 유관 경험(협상, 운영조율, 원가·KPI 관리 등)을 이력서 bullet로 재서술해 도메인 브릿지 근거로 강조하세요.",
    "프로필 요약 또는 경력기술 첫 문단에서 기존 경험이 이 직무와 어떻게 연결되는지 전환 연결 문장을 명시하세요.",
    "JD 핵심 업무 용어(소싱, 벤더 협상, 공급망 운영 등)를 이력서에서 직접 경험한 맥락과 함께 언급하면 도메인 적합성 판단에 도움이 됩니다.",
  ],
};

function __safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function __safeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function __looksBrokenText(value) {
  const text = __safeText(value);
  if (!text) return false;
  if (/\?{3,}/.test(text)) return true;
  if (/�/.test(text)) return true;
  return false;
}

function __pushUnique(bucket, value, max = 4) {
  const text = __safeText(value);
  if (!text) return;
  if (!bucket.includes(text) && bucket.length < max) bucket.push(text);
}

function __pickTopEvidenceItems(evidenceByLevel, dominantLevel) {
  const source = evidenceByLevel && typeof evidenceByLevel === "object"
    ? __safeArray(evidenceByLevel[dominantLevel])
    : [];
  const decisionItems = source.filter((item) => __safeText(item?.sourceType) === "decision_signal");
  const achievementItems = source.filter((item) => __safeText(item?.sourceType) === "achievement_scope");
  const bulletItems = source.filter((item) => __safeText(item?.sourceType) === "bullet_task");
  const titleItems = source.filter((item) => __safeText(item?.sourceType) === "title");
  return [
    ...decisionItems.slice(0, 1),
    ...achievementItems.slice(0, 1),
    ...bulletItems.slice(0, 1),
    ...titleItems.slice(0, 1),
  ].slice(0, 3);
}

function __pickNarrativeEvidence(evidenceByLevel, dominantLevel) {
  const levels = [
    dominantLevel,
    "ownership",
    "lead",
    "strategic",
    "execution",
  ].filter(Boolean);
  let picked = [];
  let pickedScore = -1;
  for (const level of levels) {
    const items = __pickTopEvidenceItems(evidenceByLevel, level);
    const nonTitleCount = items.filter((item) => __safeText(item?.sourceType) !== "title").length;
    const score = nonTitleCount * 10 + items.length;
    if (score > pickedScore) {
      picked = items;
      pickedScore = score;
    }
  }
  return picked;
}

function __countSourceTypes(items) {
  const counts = {
    title: 0,
    bullet_task: 0,
    achievement_scope: 0,
    decision_signal: 0,
  };
  __safeArray(items).forEach((item) => {
    const key = __safeText(item?.sourceType);
    if (Object.prototype.hasOwnProperty.call(counts, key)) counts[key] += 1;
  });
  return counts;
}

function __buildGapPattern(careerTimeline) {
  const gaps = __safeArray(careerTimeline?.gaps);
  const months = gaps
    .map((item) => Number(item?.months))
    .filter((value) => Number.isFinite(value));
  return {
    hasGapConcern: Boolean(careerTimeline?.hasGapConcern),
    gapCount: gaps.length,
    maxGapMonths: months.length ? Math.max(...months) : 0,
  };
}

function __buildSenioritySignal({ senioritySignal, top3, riskView }) {
  const fromCaller = senioritySignal && typeof senioritySignal === "object" ? senioritySignal : {};
  const levelRiskIds = __safeArray(fromCaller.levelRiskIds).map((item) => __safeText(item)).filter(Boolean);
  const top3Levelish = __safeArray(top3).some((item) => {
    const id = __safeText(item?.id).toUpperCase();
    return /SENIORITY|LEVEL|TITLE_SENIORITY|ROLE_LEVEL|AGE_SENIORITY/.test(id);
  });
  const riskViewLevelish = __safeArray(riskView?.items).some((item) => __safeText(item?.relatedAxis) === "level");
  return {
    hasLevelRisk: Boolean(fromCaller.hasLevelRisk || top3Levelish || riskViewLevelish),
    hasSeniorityMismatch: Boolean(fromCaller.hasSeniorityMismatch),
    levelRiskIds: levelRiskIds.slice(0, 4),
    count: Number(fromCaller.count || levelRiskIds.length || 0),
  };
}

function __buildTransitionSignal(top3, riskView, careerAxis = {}, meta = {}) {
  const topIds = __safeArray(top3).map((item) => __safeText(item?.id).toUpperCase());
  const transitionCount = Number(meta?.transitionCount || 0);
  const recentAxis = __safeText(careerAxis?.recentAxis);
  const overallAxis = __safeText(careerAxis?.overallAxis);
  const hasAxisDivergence = Boolean(recentAxis && overallAxis && recentAxis !== overallAxis);
  const hasStructuredShiftRisk = topIds.some((id) =>
    /TIMELINE|HOPPING|TRANSITION|TITLE_DOMAIN_SHIFT|ROLE_DOMAIN_SHIFT|DOMAIN_ROLE_MISMATCH|POSITION_BLUR/.test(id)
  );
  const hasDomainShift =
    hasStructuredShiftRisk ||
    (hasAxisDivergence && topIds.some((id) => /DOMAIN|ROLE_SHIFT|POSITION/.test(id))) ||
    transitionCount >= 2;
  const hasTransitionRisk = __safeArray(riskView?.items).some((item) => __safeText(item?.relatedAxis) === "transition");
  return {
    hasDomainShift,
    hasTransitionRisk,
  };
}

function __describeEvidenceMix(sourceTypeCounts) {
  const counts = sourceTypeCounts && typeof sourceTypeCounts === "object" ? sourceTypeCounts : {};
  if ((counts.decision_signal || 0) > 0 && (counts.achievement_scope || 0) > 0) {
    return "직함보다 성과와 판단 흔적에서 읽히는 근거가 더 선명합니다.";
  }
  if ((counts.achievement_scope || 0) > 0 && (counts.bullet_task || 0) > 0) {
    return "단순 직함보다 bullet과 성과 표현에서 확인되는 역할 범위가 더 먼저 읽힙니다.";
  }
  if ((counts.bullet_task || 0) > 0 && (counts.title || 0) > 0) {
    return "직함은 출발점으로 보이지만, 실제 읽힘은 bullet 기준으로 형성됩니다.";
  }
  if ((counts.title || 0) > 0) {
    return "현재는 직함 표현이 먼저 보이지만, 그것만으로 범위를 강하게 확정할 단계는 아닙니다.";
  }
  return "";
}

function __hasStrategicKeyword(text) {
  return /(strategy|strategic|planning|roadmap|priority|기획|전략|로드맵|우선순위)/i.test(__safeText(text));
}

function __hasStrongStrategicKeyword(text) {
  return /(strategy|strategic|roadmap|priority|전략|로드맵|우선순위)/i.test(__safeText(text));
}

function __isFakeStrategic(roleDepth) {
  const evidenceSummary = __safeArray(roleDepth?.evidenceSummary);
  const sourceTypeCounts = roleDepth?.sourceTypeCounts || {};
  const strongKeywordCount = evidenceSummary.filter((item) => __hasStrongStrategicKeyword(item)).length;
  const weakKeywordCount = evidenceSummary.filter((item) => __hasStrategicKeyword(item)).length;
  return (strongKeywordCount >= 1 || weakKeywordCount >= 2) && Number(sourceTypeCounts.decision_signal || 0) === 0;
}

function __buildRoleTone(dominantLevel, sourceTypeCounts) {
  if ((sourceTypeCounts.decision_signal || 0) > 0) {
    return "실행을 넘어서 우선순위나 판단에 닿는 장면이 부분적으로 보입니다.";
  }
  if ((sourceTypeCounts.achievement_scope || 0) > 0) {
    return "직접 수행을 넘어 맡은 범위를 넓혀온 흔적이 비교적 선명합니다.";
  }
  if ((sourceTypeCounts.bullet_task || 0) > 0) {
    return "실제 수행 문장에서 반복적으로 확인되는 역할 범위가 먼저 읽힙니다.";
  }
  if (dominantLevel === "unknown") {
    return "현재 이력서만으로는 하나의 역할 범위로 모아 읽기 어렵습니다.";
  }
  return "현재 이력서에서는 특정 역할 축이 약하게만 드러납니다.";
}

function __buildTrajectorySignal({ careerAxis, domainSignal, transitionSignal, meta }) {
  const recentAxis = __safeText(careerAxis?.recentAxis);
  const overallAxis = __safeText(careerAxis?.overallAxis);
  const transitionCount = Number(meta?.transitionCount || 0);
  const hasDomainShiftFeel = Boolean(domainSignal?.hasDomainShiftFeel);
  const hasTransitionRisk = Boolean(transitionSignal?.hasTransitionRisk);

  let type = "mixed_path";
  if (hasDomainShiftFeel) type = "domain_shift_feel";
  else if (transitionCount >= 2) type = "mixed_path";
  else if (recentAxis && overallAxis && recentAxis === overallAxis) type = "same_track_growth";
  else if (recentAxis && overallAxis && recentAxis !== overallAxis && !hasTransitionRisk) type = "adjacent_shift";
  else if (recentAxis && overallAxis && recentAxis !== overallAxis) type = "function_shift";

  let summary = "";
  if (type === "same_track_growth") summary = "같은 축의 경험을 이어오면서 범위와 난도를 조금씩 넓혀온 흐름으로 읽힙니다.";
  else if (type === "adjacent_shift") summary = "완전히 다른 방향으로 꺾이기보다, 인접한 역할로 축을 옮겨온 흐름에 가깝습니다.";
  else if (type === "function_shift") summary = "역할 이름은 이어져 보여도 실제로는 맡는 기능과 기대 장면이 달라진 이동으로 읽힐 수 있습니다.";
  else if (type === "domain_shift_feel") summary = "역할 축은 일부 이어지더라도, 산업이나 업무 맥락이 달라져 연결 설명이 필요한 흐름으로 보일 수 있습니다.";
  else summary = "한 방향의 심화라기보다 몇 번의 이동을 거치며 현재 축으로 정리된 경로에 가깝습니다.";

  return { type, summary };
}

function __buildContinuitySignal({ careerTimeline, gapPattern, careerAxis, meta }) {
  const recentAxis = __safeText(careerAxis?.recentAxis);
  const overallAxis = __safeText(careerAxis?.overallAxis);
  const hasGapConcern = Boolean(gapPattern?.hasGapConcern);
  const transitionCount = Number(meta?.transitionCount || 0);
  const currentPoint = __safeText(meta?.currentPoint);
  const maxGapMonths = Number(gapPattern?.maxGapMonths || 0);
  const hasReturnRecovery = hasGapConcern && Boolean(currentPoint);
  const isStableFlow = !hasGapConcern && transitionCount <= 1;

  let strength = "medium";
  if (isStableFlow && recentAxis && overallAxis && recentAxis === overallAxis) strength = "high";
  else if (hasGapConcern && maxGapMonths >= 6) strength = "low";

  let summary = "";
  if (hasGapConcern && hasReturnRecovery) summary = "공백 자체보다도 그 이후 흐름이 어떤 축으로 다시 연결됐는지가 함께 읽히는 상태입니다.";
  else if (hasGapConcern) summary = "이동 사이 간격이 보여 흐름 해석은 보수적으로 유지될 수 있습니다.";
  else if (isStableFlow) summary = "경력 흐름은 비교적 안정적으로 이어져 읽힙니다.";
  else summary = "이동은 있었지만 큰 단절보다는 연결 가능한 흐름으로 보입니다.";

  return {
    isStableFlow,
    hasGapConcern,
    hasReturnRecovery,
    strength,
    summary,
  };
}

function __buildScopeSignal({ roleDepth }) {
  const dominantScope = __safeText(roleDepth?.dominantLevel) || "execution";
  const sourceTypeCounts = roleDepth?.sourceTypeCounts || {};
  const confidence =
    (sourceTypeCounts.decision_signal || 0) > 0 ? "high"
      : ((sourceTypeCounts.achievement_scope || 0) > 0 && (sourceTypeCounts.bullet_task || 0) > 0) ? "medium"
        : "low";

  let summary = "";
  if (dominantScope === "lead") summary = "실무 수행만이 아니라 조율과 리딩 장면까지 일부 읽히는 상태입니다.";
  else if (dominantScope === "ownership") summary = "직접 수행을 넘어 맡은 범위를 책임지는 장면이 비교적 선명합니다.";
  else summary = "현재는 역할 범위보다 수행 장면과 실행 경험이 먼저 읽힙니다.";

  return {
    dominantScope: dominantScope === "strategic" ? "lead" : dominantScope,
    confidence,
    summary,
  };
}

function __buildResumeFitNarrative({ trajectorySignal, continuitySignal, scopeSignal, domainSignal, roleDepth }) {
  const strongestReading = scopeSignal?.summary || "";
  const cautiousReading = __safeText(roleDepth?.conservativeReasons?.[0]) || continuitySignal?.summary || "";
  let profileTone = "균형형";
  if (trajectorySignal?.type === "same_track_growth" && continuitySignal?.isStableFlow) profileTone = "안정 심화형";
  else if (trajectorySignal?.type === "domain_shift_feel") profileTone = "전환 설명형";
  else if (continuitySignal?.hasGapConcern) profileTone = "회복 연결형";
  else if (scopeSignal?.dominantScope === "lead") profileTone = "범위 확장형";

  let explanationNeed = "";
  if (continuitySignal?.hasGapConcern && continuitySignal?.hasReturnRecovery) explanationNeed = "공백보다도 그 이후 흐름이 어떻게 이어졌는지 짧게 연결해 주는 설명이 중요합니다.";
  else if (domainSignal?.hasDomainShiftFeel) explanationNeed = "같은 역할명이라도 산업·업무 맥락 차이가 읽힐 수 있어, 지금 경험이 어디까지 이어지는지 설명이 필요합니다.";
  else if (scopeSignal?.dominantScope === "execution") explanationNeed = "수행 경험을 넘어 어디까지 맡아봤는지가 함께 보이면 해석이 더 넓어질 수 있습니다.";
  else explanationNeed = "핵심 경험이 어떤 범위에서 반복됐는지를 먼저 드러내면 해석이 안정됩니다.";

  return {
    profileTone,
    strongestReading,
    cautiousReading,
    explanationNeed,
  };
}

export function extractInterpretationFactors({
  careerHistory,
  careerTimeline,
  roleDepth,
  top3,
  explanationPack,
  riskView,
  candidateType,
  senioritySignal,
  domainSignal,
  procurementDomainHint = null, // ✅ PATCH R44 (append-only)
  explanationMode = "default",  // ✅ PATCH R45 (append-only)
  procurementDomains = null,    // ✅ PATCH R47 (append-only)
} = {}) {
  const safeRoleDepth = roleDepth && typeof roleDepth === "object" ? roleDepth : {};
  const dominantLevel = __safeText(safeRoleDepth?.dominantLevel) || "unknown";
  const dominantEvidence = __pickNarrativeEvidence(safeRoleDepth?.evidence, dominantLevel);
  const sourceTypeCounts = __countSourceTypes(dominantEvidence);
  const safeDomainSignal = domainSignal && typeof domainSignal === "object" ? domainSignal : {};
  const careerAxis = {
    recentAxis: __safeText(careerTimeline?.recentAxis),
    overallAxis: __safeText(careerTimeline?.overallAxis),
  };
  const roleDepthFactor = {
    dominantLevel,
    overrideEligible: Boolean(safeRoleDepth?.overrideEligible),
    evidence: safeRoleDepth?.evidence && typeof safeRoleDepth.evidence === "object" ? safeRoleDepth.evidence : {},
    evidenceSummary: dominantEvidence.map((item) => __safeText(item?.text)).filter(Boolean),
    sourceTypeCounts,
    conservativeReasons: __safeArray(safeRoleDepth?.conservativeReasons).slice(0, 4),
    missingForNextLevel: __safeArray(safeRoleDepth?.missingForNextLevel).slice(0, 4),
  };
  const gapPattern = __buildGapPattern(careerTimeline);
  const domainFactor = {
    hasDomainShiftFeel: Boolean(safeDomainSignal?.hasDomainShiftFeel),
    strength: __safeText(safeDomainSignal?.strength) || null,
    reasonTags: __safeArray(safeDomainSignal?.reasonTags).map((item) => __safeText(item)).filter(Boolean).slice(0, 4),
    relatedRiskIds: __safeArray(safeDomainSignal?.relatedRiskIds).map((item) => __safeText(item)).filter(Boolean).slice(0, 4),
    summary: __safeText(safeDomainSignal?.summary),
  };
  const transitionSignal = __buildTransitionSignal(top3, riskView, careerAxis, {
    transitionCount: __safeArray(careerTimeline?.transitions).length,
  });
  const meta = {
    candidateType: __safeText(candidateType),
    topSignalId: __safeText(explanationPack?.topSignals?.[0]?.id),
    transitionCount: __safeArray(careerTimeline?.transitions).length,
    startPoint: __safeText(careerTimeline?.startPoint),
    currentPoint: __safeText(careerTimeline?.currentPoint),
    careerStepCount: __safeArray(careerHistory).length || __safeArray(careerTimeline?.steps).length,
    // ✅ PATCH R44 (append-only): procurement domain hint for hiringLens
    procurementDomainHint: procurementDomainHint || null,
    // ✅ PATCH R45 (append-only): explanation mode
    explanationMode: explanationMode || "default",
    // ✅ PATCH R47 (append-only): procurement domains array
    procurementDomains: Array.isArray(procurementDomains) ? procurementDomains : null,
  };
  const trajectorySignal = __buildTrajectorySignal({ careerAxis, domainSignal: domainFactor, transitionSignal, meta });
  const continuitySignal = __buildContinuitySignal({ careerTimeline, gapPattern, careerAxis, meta });
  const scopeSignal = __buildScopeSignal({ roleDepth: roleDepthFactor });
  const resumeFitNarrative = __buildResumeFitNarrative({
    trajectorySignal,
    continuitySignal,
    scopeSignal,
    domainSignal: domainFactor,
    roleDepth: roleDepthFactor,
  });

  return {
    careerAxis,
    roleDepth: roleDepthFactor,
    senioritySignal: __buildSenioritySignal({ senioritySignal, top3, riskView }),
    gapPattern,
    domainSignal: domainFactor,
    transitionSignal,
    trajectorySignal,
    continuitySignal,
    scopeSignal,
    resumeFitNarrative,
    meta,
  };
}

export function buildCareerStory(factors = {}, { careerTimeline, interpretationPack } = {}) {
  // ── Phase 9-6: assembly-v1 sentence layer (wrapper) ──
  // Prefers sectionSentences.careerAccumulation if available and usable; falls back to legacy.
  const _caBlock = interpretationPack?.sectionSentences?.careerAccumulation;
  if (
    _caBlock?.generationMode === "assembly-v1" &&
    (_caBlock.shortSummary || (Array.isArray(_caBlock.narrativeLines) && _caBlock.narrativeLines.length > 0))
  ) {
    const _parts = [
      _caBlock.shortSummary,
      ...(Array.isArray(_caBlock.narrativeLines) ? _caBlock.narrativeLines : []),
      _caBlock.cautionLine || "",
    ].filter(Boolean);
    return _parts.join(" ");
  }
  // ── legacy fallback ──

  const trajectorySignal = factors?.trajectorySignal || {};
  const continuitySignal = factors?.continuitySignal || {};
  const resumeFitNarrative = factors?.resumeFitNarrative || {};
  const scopeSignal = {};
  const fakeStrategic = true;
  const recentAxis = __safeText(factors?.careerAxis?.recentAxis);
  const overallAxis = __safeText(factors?.careerAxis?.overallAxis);
  const gapPattern = factors?.gapPattern || {};
  const transitionCount = Number(factors?.meta?.transitionCount || 0);
  const roleDepth = factors?.roleDepth || {};
  const dominantLevel = __safeText(roleDepth?.dominantLevel);
  const sourceTypeCounts = roleDepth?.sourceTypeCounts || {};
  const startPoint = __safeText(factors?.meta?.startPoint || careerTimeline?.startPoint);
  const currentPoint = __safeText(factors?.meta?.currentPoint || careerTimeline?.currentPoint);
  const lines = [];

  if (recentAxis && overallAxis && recentAxis === overallAxis) {
    if (gapPattern.hasGapConcern) {
      lines.push(`현재 커리어는 ${recentAxis} 축 안에서 다시 이어 붙인 흐름에 가까워, 같은 축을 유지하되 연결 맥락을 함께 보게 되는 형태로 읽힙니다.`);
    } else if (dominantLevel === "lead") {
      lines.push(`현재 커리어는 ${recentAxis} 축 안에서 수행보다 조율과 리딩 비중이 조금씩 커진 흐름으로 읽힙니다.`);
    } else if (dominantLevel === "execution" && (sourceTypeCounts.achievement_scope || 0) > 0) {
      lines.push(`현재 커리어는 ${recentAxis} 축 안에서 실무 수행을 반복하는 데 그치기보다, 맡는 범위를 조금씩 넓혀온 흐름에 가깝습니다.`);
    } else if (dominantLevel === "execution") {
      lines.push(`현재 커리어는 ${recentAxis} 축 안에서 수행 경험을 누적해 온 흐름에 더 가깝게 읽힙니다.`);
    } else {
      lines.push(`현재 커리어는 ${recentAxis} 축 안에서 같은 방향의 경험을 이어 오며 범위를 조정해 온 흐름으로 읽힙니다.`);
    }
  } else if (recentAxis && overallAxis && recentAxis !== overallAxis) {
    lines.push(`현재 커리어 흐름을 보면 전체적으로는 ${overallAxis} 축이 반복되지만, 최근에는 ${recentAxis} 쪽의 경험이 더 전면에 보입니다.`);
  } else if (startPoint && currentPoint && startPoint !== currentPoint) {
    lines.push(`초기 경력의 ${startPoint} 경험이 완전히 끊기기보다는, 최근의 ${currentPoint} 경험으로 번져온 흐름에 가깝게 읽힙니다.`);
  } else if (recentAxis) {
    lines.push(`현재 이력서에서는 ${recentAxis} 쪽 경험이 최근 커리어의 중심축으로 보입니다.`);
  } else {
    lines.push("현재 이력서에서는 하나의 고정된 커리어 축보다 최근 경험 조각이 먼저 읽힙니다.");
  }

  if (transitionCount >= 2) {
    lines.push("직무나 환경 이동이 한 번에 크게 꺾였다기보다, 몇 차례 전환을 거치며 현재 축으로 정리된 흐름에 가깝습니다.");
  } else if (transitionCount === 1 && recentAxis && overallAxis && recentAxis !== overallAxis) {
    lines.push("최근 축이 달라 보이더라도 완전히 다른 방향으로 꺾였다기보다 기존 경험을 옮겨온 전환으로 읽힐 여지가 있습니다.");
  }

  if (gapPattern.hasGapConcern && gapPattern.maxGapMonths > 0) {
    lines.push(`다만 경력 사이 간격이 최대 ${gapPattern.maxGapMonths}개월 수준으로 보여, 흐름을 해석할 때는 연결 맥락을 함께 보게 될 가능성이 있습니다.`);
  }

  if (trajectorySignal.summary && !lines.some((line) => String(line || "").includes(trajectorySignal.summary))) {
    lines.push(trajectorySignal.summary);
  }
  if (
    continuitySignal.summary &&
    continuitySignal.hasReturnRecovery &&
    !lines.some((line) => String(line || "").includes(continuitySignal.summary))
  ) {
    lines.push(continuitySignal.summary);
  }
  if (resumeFitNarrative.profileTone && !lines.length) {
    lines.push(`현재 이력서는 ${resumeFitNarrative.profileTone}에 가까운 흐름으로 읽힙니다.`);
  }

  if (scopeSignal.summary && !lines.some((line) => String(line || "").includes(scopeSignal.summary))) {
    lines.unshift(scopeSignal.summary);
  }
  if (
    resumeFitNarrative.cautiousReading &&
    !fakeStrategic &&
    !lines.some((line) => String(line || "").includes(resumeFitNarrative.cautiousReading))
  ) {
    lines.push(`다만 현재 이력서만으로는 ${resumeFitNarrative.cautiousReading.replace(/\.$/, "")} 쪽의 확인 포인트가 남습니다.`);
  }

  if (scopeSignal.summary && !lines.some((line) => String(line || "").includes(scopeSignal.summary))) {
    lines.unshift(scopeSignal.summary);
  }
  if (
    resumeFitNarrative.cautiousReading &&
    !fakeStrategic &&
    !lines.some((line) => String(line || "").includes(resumeFitNarrative.cautiousReading))
  ) {
    lines.push(`다만 현재 이력서만으로는 ${resumeFitNarrative.cautiousReading.replace(/\.$/, "")} 쪽의 확인 포인트가 남습니다.`);
  }

  if (scopeSignal.summary && !lines.some((line) => String(line || "").includes(scopeSignal.summary))) {
    lines.unshift(scopeSignal.summary);
  }
  if (
    resumeFitNarrative.cautiousReading &&
    !fakeStrategic &&
    !lines.some((line) => String(line || "").includes(resumeFitNarrative.cautiousReading))
  ) {
    lines.push(`다만 현재 이력서만으로는 ${resumeFitNarrative.cautiousReading.replace(/\.$/, "")} 쪽의 확인 포인트가 남습니다.`);
  }

  return lines.join(" ");
}

export function buildRoleInterpretation(factors = {}) {
  const roleDepth = factors?.roleDepth || {};
  const scopeSignal = factors?.scopeSignal || {};
  const resumeFitNarrative = factors?.resumeFitNarrative || {};
  const evidenceSummary = __safeArray(roleDepth?.evidenceSummary);
  const sourceTypeCounts = roleDepth?.sourceTypeCounts || {};
  const dominantLevel = __safeText(roleDepth?.dominantLevel);
  const lines = [__buildRoleTone(dominantLevel, sourceTypeCounts)];
  const fakeStrategic = __isFakeStrategic(roleDepth);

  const evidenceLine = (() => {
    const decision = sourceTypeCounts.decision_signal || 0;
    const achievement = sourceTypeCounts.achievement_scope || 0;
    const bullet = sourceTypeCounts.bullet_task || 0;
    const title = sourceTypeCounts.title || 0;
    if (decision > 0 && evidenceSummary.length > 0) {
      return `특히 ${evidenceSummary.slice(0, 2).join(", ")} 같은 표현에서 단순 참여보다 범위를 판단한 흔적이 먼저 잡힙니다.`;
    }
    if (achievement > 0 && bullet > 0 && evidenceSummary.length > 0) {
      return `근거는 ${evidenceSummary.slice(0, 2).join(", ")}처럼 bullet과 성과 문장이 함께 있을 때 더 설득력 있게 읽힙니다.`;
    }
    if (bullet > 0 && evidenceSummary.length > 0) {
      return `직함보다 ${evidenceSummary.slice(0, 2).join(", ")} 같은 수행 문장에서 실제 역할 범위가 더 분명하게 보입니다.`;
    }
    if (title > 0 && evidenceSummary.length > 0) {
      return `다만 현재는 ${evidenceSummary[0]} 같은 직함 표현이 먼저 보여, 역할 범위를 강하게 확정하기에는 근거가 얇게 읽힐 수 있습니다.`;
    }
    return "";
  })();
  if (evidenceLine) lines.push(evidenceLine);

  const mixLine = __describeEvidenceMix(sourceTypeCounts);
  if (mixLine) lines.push(mixLine);
  if (fakeStrategic) {
    lines.push("전략이나 기획 관련 표현은 보이지만, 실제 우선순위 판단이나 방향 설정을 맡았다는 근거까지는 현재 이력서에서 반복적으로 확인되진 않습니다.");
  }

  return lines.join(" ");
}

export function buildHiringLens(factors = {}, { explanationPack } = {}) {
  const roleDepth = factors?.roleDepth || {};
  const senioritySignal = factors?.senioritySignal || {};
  const transitionSignal = factors?.transitionSignal || {};
  const gapPattern = factors?.gapPattern || {};
  const domainSignal = factors?.domainSignal || {};
  const trajectorySignal = factors?.trajectorySignal || {};
  const continuitySignal = factors?.continuitySignal || {};
  const resumeFitNarrative = factors?.resumeFitNarrative || {};
  const sourceTypeCounts = roleDepth?.sourceTypeCounts || {};
  const dominantLevel = __safeText(roleDepth?.dominantLevel);
  const fakeStrategic = __isFakeStrategic(roleDepth);
  const lines = [];

  // ✅ PATCH R45 (append-only): fit_reinforcement 모드 — "적합→보강" 프레임
  const __explanationMode = __safeText(factors?.meta?.explanationMode) || "default";
  const __procHint = __safeText(factors?.meta?.procurementDomainHint);
  if (__explanationMode === "fit_reinforcement" && !gapPattern.hasGapConcern) {
    lines.push("구매 도메인 적합성이 확인됩니다.");
    if (__procHint) {
      const __domParts = __procHint.split(" / ").map((s) => s.trim()).filter(Boolean);
      for (const part of __domParts.slice(0, 2)) {
        lines.push(part);
      }
    }
    lines.push("현재 리스크는 도메인 부적합보다는 성과 범위와 영향 수준 증명에 가깝습니다.");
  } else if (gapPattern.hasGapConcern) {
    // gap branch stays later; do not let domain-specific language override it here.
  } else if (fakeStrategic) {
    lines.push("전략 관련 표현이 있더라도 실제 판단이나 방향 설정 흔적이 약하면, 채용 측은 지원·실행 역할에 더 가깝게 읽을 가능성이 있습니다.");
  } else if (domainSignal.hasDomainShiftFeel) {
    lines.push("같은 직무명이라도 최근 경험이 쌓인 산업·업무 맥락이 지원 포지션과 다르게 읽히면, 채용 측은 이 경험이 실제로 어떻게 이어지는지부터 확인하려 할 가능성이 있습니다.");
  } else if (transitionSignal.hasDomainShift && !gapPattern.hasGapConcern) {
    lines.push("채용 측에서는 최근 경험 축이 지원 방향과 어떻게 이어지는지부터 확인하려 할 가능성이 있습니다.");
  } else if (dominantLevel === "lead") {
    lines.push("채용 측에서는 단순 수행보다 조율과 리딩 범위가 실제로 반복됐는지를 먼저 보게 될 가능성이 있습니다.");
  } else if ((sourceTypeCounts.achievement_scope || 0) > 0 && (sourceTypeCounts.bullet_task || 0) > 0) {
    lines.push("채용 측에서는 맡은 범위를 스스로 끌고 간 경험이 실제 성과와 함께 보이는지부터 확인하려 할 가능성이 있습니다.");
  } else if ((sourceTypeCounts.decision_signal || 0) > 0) {
    lines.push("채용 측에서는 단순 실행형보다는, 일부 범위를 판단하거나 조율한 경험까지는 열어 두고 읽을 가능성이 있습니다.");
  } else if ((sourceTypeCounts.bullet_task || 0) > 0 || (sourceTypeCounts.achievement_scope || 0) > 0) {
    lines.push("채용 측에서는 현재 이력서를 실무 수행 범위가 먼저 보이는 프로필로 읽을 가능성이 있습니다.");
  } else {
    lines.push("채용 측에서는 현재 이력서에 적힌 직함보다 실제로 어디까지 맡았는지를 다시 확인하려 할 가능성이 있습니다.");
  }

  if (senioritySignal.hasSeniorityMismatch) {
    lines.push("연차 자체보다도 그 기간 동안 어디까지 주도했는지를 더 보수적으로 볼 가능성이 있습니다.");
  } else if (senioritySignal.hasLevelRisk) {
    lines.push("현재 이력서가 목표 역할의 책임 범위까지 자연스럽게 이어지는지는 추가 확인 포인트로 남을 수 있습니다.");
  }

  if ((transitionSignal.hasDomainShift || transitionSignal.hasTransitionRisk) && !lines.some((line) => /지원 방향과 어떻게 이어지는지부터 확인/.test(line))) {
    lines.push("또한 최근 경험 축이 지원 방향과 어떻게 이어지는지까지 함께 설명돼야 해석이 더 안정될 가능성이 있습니다.");
  }

  if (gapPattern.hasGapConcern) {
    lines.push("경력 간격이 있다면 공백 자체보다 그 이후 흐름이 어떻게 다시 연결됐는지를 확인하려 할 수 있습니다.");
  }

  if (
    trajectorySignal.summary &&
    trajectorySignal.type !== "same_track_growth" &&
    !lines.some((line) => String(line || "").includes(trajectorySignal.summary))
  ) {
    lines.push(trajectorySignal.summary);
  }
  if (
    continuitySignal.summary &&
    continuitySignal.hasReturnRecovery &&
    !lines.some((line) => String(line || "").includes(continuitySignal.summary))
  ) {
    lines.push(continuitySignal.summary);
  }

  const primaryReason = __safeText(explanationPack?.primaryReason);
  if (
    primaryReason &&
    !__looksBrokenText(primaryReason) &&
    !/^[A-Z0-9_]+$/.test(primaryReason) &&
    !/핵심 리스크|재확인/.test(primaryReason) &&
    lines.length < 4
  ) {
    lines.push(primaryReason);
  }

  if (
    resumeFitNarrative.explanationNeed &&
    !__looksBrokenText(resumeFitNarrative.explanationNeed) &&
    !lines.some((line) => String(line || "").includes(resumeFitNarrative.explanationNeed))
  ) {
    lines.push(resumeFitNarrative.explanationNeed);
  }

  return lines.join(" ");
}

export function buildNextMove(factors = {}, input = {}) {
  const roleDepth = factors?.roleDepth || {};
  const senioritySignal = factors?.senioritySignal || {};
  const gapPattern = factors?.gapPattern || {};
  const domainSignal = factors?.domainSignal || {};
  const continuitySignal = factors?.continuitySignal || {};
  const scopeSignal = factors?.scopeSignal || {};
  const resumeFitNarrative = factors?.resumeFitNarrative || {};
  const fakeStrategic = __isFakeStrategic(roleDepth);
  const lines = [];

  const primaryMissing = __safeArray(roleDepth?.missingForNextLevel).slice(0, 2);
  // ✅ PATCH R46 (append-only): fit_reinforcement → "적합→보강" 보강 포인트 프레임
  const __nextMoveMode = __safeText(factors?.meta?.explanationMode) || "default";
  const __nextMoveProcHint = __safeText(factors?.meta?.procurementDomainHint);
  if (__nextMoveMode === "fit_reinforcement" && !gapPattern.hasGapConcern) {
    const _hintSuffix = __nextMoveProcHint ? ` (${__nextMoveProcHint})` : "";
    lines.push(`구매 도메인 적합성은 확인됩니다. 다음 단계로 더 강하게 읽히려면 수행 성과와 영향 범위를 수치 중심으로 더 선명히 드러낼 필요가 있습니다${_hintSuffix}.`);
  } else if (gapPattern.hasGapConcern) {
    lines.push("다음 단계로 더 강하게 읽히려면 기획·전략이라는 단어보다 실제 우선순위 판단이나 방향 설정에 관여한 장면이 먼저 보여야 합니다.");
  } else if (fakeStrategic) {
    lines.push("다음 단계로 넘어가려면 역할 범위 자체보다도 경력 흐름이 어떻게 다시 연결됐는지가 먼저 설명될 필요가 있습니다.");
  } else if (domainSignal.hasDomainShiftFeel) {
    lines.push("역할 범위를 넓혔다는 표현만으로는 부족하고, 현재 경험이 지원 포지션의 산업·업무 맥락과 어떻게 이어지는지 먼저 보여줄 필요가 있습니다.");
    lines.push("같은 역할명이라도 도메인 차이가 읽힐 수 있으므로, 고객군·업무 구조·문제 해결 맥락을 구체적으로 드러내 두는 편이 안전합니다.");
  } else if (primaryMissing.length > 0) {
    lines.push(`다음 단계로 더 강하게 읽히려면 ${primaryMissing.join(", ")} 같은 근거가 지금보다 먼저 보일 필요가 있습니다.`);
  }

  if (gapPattern.hasGapConcern && lines.length > 0) {
    lines[0] = "다음 단계로 넘어가려면 역할 범위 자체보다도 경력 흐름이 어떻게 다시 연결됐는지가 먼저 설명될 필요가 있습니다.";
  } else if (fakeStrategic && lines.length > 0) {
    lines[0] = "다음 단계로 더 강하게 읽히려면 기획·전략이라는 단어보다 실제 우선순위 판단이나 방향 설정에 관여한 장면이 먼저 보여야 합니다.";
  }

  if (__safeArray(roleDepth?.conservativeReasons).length > 0) {
    const reason = __safeText(roleDepth.conservativeReasons[0]);
    if (reason) {
      lines.push(`현재는 ${reason.replace(/\.$/, "")}라는 보수 해석이 남아 있어, 한 단계 위 역할로 곧바로 읽히기보다는 확인 포인트가 남습니다.`);
    }
  }

  if (senioritySignal.hasSeniorityMismatch || senioritySignal.hasLevelRisk) {
    lines.push("수행 경험 자체보다 맡은 범위와 판단 장면을 더 직접적으로 보여주면 해석이 달라질 여지가 있습니다.");
  }

  if (gapPattern.hasGapConcern) {
    lines.push("경력 간격이 있었다면 그 시기보다 이후에 어떤 축으로 복귀했는지를 짧게 연결해 두는 편이 안전합니다.");
  }

  if (
    continuitySignal.hasReturnRecovery &&
    resumeFitNarrative.explanationNeed &&
    !lines.some((line) => String(line || "").includes(resumeFitNarrative.explanationNeed))
  ) {
    lines.push(resumeFitNarrative.explanationNeed);
  } else if (
    !gapPattern.hasGapConcern &&
    !domainSignal.hasDomainShiftFeel &&
    scopeSignal.dominantScope === "execution"
  ) {
    lines.push("수행 경험은 보이지만 범위를 넓혀 맡았던 장면이 더 분명해지면 읽힘이 한 단계 달라질 수 있습니다.");
  }

  if (lines.length === 0) {
    lines.push("현재 가장 선명한 경험 축과 그 축을 뒷받침하는 bullet 또는 성과 근거를 상단에 붙이면 해석이 더 또렷해질 수 있습니다.");
  }

  // ✅ PATCH (append-only): Top1 리스크 ID 기반 actions 생성
  const topRiskId = String(input?.top3?.[0]?.id || "").trim();
  const actions = __safeArray(__ACTION_BY_RISK[topRiskId] || []);

  // ✅ PATCH R30 (append-only): DOMAIN_ROLE_MISMATCH top1 시 summary 도메인 브릿지 취지로 우선 교체
  if (topRiskId === "DOMAIN_ROLE_MISMATCH") {
    return {
      summary: "이력서에서 쌓아온 경험의 도메인과 JD가 요구하는 도메인 사이의 거리가 읽힙니다. 단순 스킬 보강보다 기존 경험이 이 직무와 어떻게 연결되는지 브릿지 근거를 먼저 만드는 것이 핵심입니다.",
      actions,
    };
  }

  // ✅ PATCH R47/R48 (append-only): fit_reinforcement → procurement-aware actions + rewrite hints
  const __r47Mode = __safeText(factors?.meta?.explanationMode) || "default";
  if (__r47Mode === "fit_reinforcement") {
    const _r47Doms = new Set(Array.isArray(factors?.meta?.procurementDomains) ? factors.meta.procurementDomains : []);
    const _r47Actions = [];
    const _r48Hints = [];

    if (_r47Doms.has("strategic_sourcing")) {
      _r47Actions.push("전략소싱 범위를 담당 품목/벤더 수/글로벌 여부 중심으로 드러내세요.");
      _r48Hints.push("[품목/카테고리] 전략소싱 체계 수립 — [기간] 동안 [N]개 카테고리 담당");
      _r48Hints.push("[국내/글로벌] 공급업체 발굴 및 평가 주도 — 최종 [N]개사 선정");
    }
    if (_r47Doms.has("contract_commercial") || _r47Doms.has("vendor_management")) {
      _r47Actions.push("협상 참여가 아니라 주도한 범위와 계약 조건 개선 결과를 명시하세요.");
      _r48Hints.push("핵심 벤더 단가/계약 협상 주도 — 계약 조건 재설계로 [성과] 확보");
      _r48Hints.push("cross-functional 협업 하에 협상 리드 — [부서/팀] 조율하여 [결과] 달성");
    }
    if (_r47Doms.has("cost_management") || _r47Doms.has("purchasing_analytics")) {
      _r47Actions.push("연간 구매원가 절감률, 협상 타결 규모, KPI 개선 수치를 bullet에 직접 넣어 보강하세요.");
      _r48Hints.push("연간 구매원가 [수치]% 절감 — [기간] 동안 [절감액] 규모 달성");
      _r48Hints.push("구매 KPI [지표]를 [수치]만큼 개선 — SAP/데이터 기반 분석 근거");
    }
    if (_r47Doms.has("manufacturing_materials") || _r47Doms.has("direct_procurement")) {
      _r47Actions.push("자재 조달 안정화 결과, 공급 차질 대응 성과를 수치로 드러내세요.");
      _r48Hints.push("원부자재 [품목] 조달 운영 — 납기 준수율 [수치]% 유지");
      _r48Hints.push("공급 차질 대응 체계 구축 — 대체 공급처 [N]개사 확보로 리스크 해소");
    }
    if (_r47Actions.length === 0) {
      _r47Actions.push("절감률/절감액, 협상 결과, KPI 개선치, 공급 안정화 결과를 bullet에 직접 넣어 보강하세요.");
      _r48Hints.push("주요 벤더 재협상을 통해 [성과] 달성 — [기간] 내 [절감액/조건개선] 확보");
    }
    return { summary: lines.join(" "), actions: _r47Actions, rewriteHints: _r48Hints };
  }

  return { summary: lines.join(" "), actions };
}

export function generateCareerInterpretationV1(input = {}) {
  const factors = extractInterpretationFactors(input);
  return {
    factors: {
      careerAxis: factors.careerAxis,
      roleDepth: factors.roleDepth,
      senioritySignal: factors.senioritySignal,
      gapPattern: factors.gapPattern,
      domainSignal: factors.domainSignal,
      trajectorySignal: factors.trajectorySignal,
      continuitySignal: factors.continuitySignal,
      scopeSignal: factors.scopeSignal,
      resumeFitNarrative: factors.resumeFitNarrative,
    },
    blocks: {
      careerStory: buildCareerStory(factors, input),
      roleInterpretation: buildRoleInterpretation(factors, input),
      hiringLens: buildHiringLens(factors, input),
      nextMove: buildNextMove(factors, input),
    },
  };
}
