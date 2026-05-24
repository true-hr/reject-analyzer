// src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js
// [PRECISE-RISK-V1] 필수요건 미충족 엔진 — must_requirements_gap
// 입력: buildJdResumeFit() 반환 fit object
//
// mustPolicyMode:
//   "raw-fit"           — summary.must_* 그대로 사용 (jdModel.mustHave 오염 없음)
//   "hard-must-guarded" — jdModel.mustHave 기반 miss 재필터링 (오염 방어 적용)

import { createRiskResult } from "./createRiskResult.js";
import certRules from "../ontology/certs/cert_rules.v0.json";
import { resolveMustRequirementAliasMatch } from "./mustRequirementAliasVocabulary.js";

// ── Must cert alias bridge 자산 ───────────────────────────────────────────────
// cert only: tool/task alias는 must risk false positive 위험으로 이번 라운드 제외
const _MUST_CERT_GROUPS = certRules.jdSignalMapping.signals.map(
  (sig) => sig.keywords.map((k) => String(k ?? "").toLowerCase().trim().replace(/\s+/g, " "))
);

/**
 * JD 필수요건 항목이 cert 명칭이고, resume 원문에 해당 cert의
 * 다른 표기가 있으면 true.  cert 사전 외 alias는 허용 안 함.
 */
function _certAliasMatch(reqItem, resumeNorm) {
  if (!resumeNorm) return false;
  const rn = String(reqItem ?? "").toLowerCase().trim().replace(/\s+/g, " ");
  for (const group of _MUST_CERT_GROUPS) {
    if (group.includes(rn)) {
      for (const alias of group) {
        if (alias !== rn && resumeNorm.includes(alias)) return true;
      }
    }
  }
  return false;
}
// ── End must cert alias bridge ────────────────────────────────────────────────

const SUMMARY_TEXT = {
  critical: "JD 필수요건 중 직접 확인되는 항목이 절반에 미치지 않습니다.",
  high: "JD 필수요건 일부가 이력서에서 확인되지 않습니다.",
  medium: "JD 필수요건 중 일부 항목이 명시적으로 드러나지 않습니다.",
  none: "JD 필수요건과의 명확한 불일치는 확인되지 않았습니다.",
};

const DETAIL_TEXT = {
  critical:
    "JD에서 요구하는 필수 역량이나 경험 중 이력서에서 직접 확인되는 항목이 제한적입니다. 지원 자격에 해당하는 경험이 있다면, 이력서에 명시적으로 드러나도록 보완하는 것이 필요해 보입니다.",
  high:
    "일부 필수요건이 이력서에서 직접 확인되지 않습니다. 실제 경험이 있더라도 표현되지 않으면 서류 검토 단계에서 불리하게 작용할 수 있습니다.",
  medium:
    "필수요건 중 일부가 이력서에서 바로 확인되지는 않습니다. 관련 경험이 있다면 표현을 조금 더 직접적으로 바꿔보는 것이 좋습니다.",
  none:
    "필수요건 기준에서 큰 결격 사유는 확인되지 않았습니다.",
};

/**
 * 필수요건 미충족 리스크 엔진.
 * @param {object|null|undefined} fit — buildJdResumeFit() 반환값
 * @returns {import("./createRiskResult.js").RiskResult}
 */
export function buildMustRequirementsGapRisk(fit, resumeRawText = "", roleFitCareerMatch = null, jdRequirementDecomposition = null) {
  // 방어적 추출 — 숫자 없으면 0, 배열 없으면 []
  const mustTotal  = Number(fit?.summary?.must_total) || 0;
  const mustHit    = Number(fit?.summary?.must_hit)   || 0;
  const mustMiss   = Number(fit?.summary?.must_miss)  || 0;
  const hitItems   = Array.isArray(fit?.match?.must?.hits) ? fit.match.must.hits : [];
  const missItems  = Array.isArray(fit?.match?.must?.miss) ? fit.match.must.miss : [];
  const requiredLines = Array.isArray(fit?.jdModel?.sections?.requiredLines)
    ? fit.jdModel.sections.requiredLines
    : [];

  // ── Hard Must 오염 방어 (shape-based guard, NLP 없음) ──────────────────
  // summary.must_* 는 jd.mustItems(pre-filter) 기반 → preferred 오염 위험
  // jdModel.mustHave 는 __filterMustHaveFromPreferred() 적용 후 값
  // mustHave.length < mustTotal 이면 오염 가능성 → miss 항목 재필터링
  const mustHaveFiltered = Array.isArray(fit?.jdModel?.mustHave) ? fit.jdModel.mustHave : null;
  const isContaminated = (
    mustHaveFiltered !== null &&
    mustHaveFiltered.length > 0 &&
    mustHaveFiltered.length < mustTotal
  );

  let effectiveMustTotal = mustTotal;
  let effectiveMustMiss  = mustMiss;
  let effectiveMissItems = missItems;
  let mustPolicyMode     = "raw-fit";

  if (isContaminated) {
    // normalize: null 방어 → lowercase → trim → 연속공백 축소
    // AI 파서 출력에 앞뒤 공백·이중공백이 포함될 수 있어 표기 흔들림 방어에 필요
    const normalize = (s) => String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
    const mustHaveSet = new Set(mustHaveFiltered.map(normalize));
    const guardedMiss = missItems.filter((item) => mustHaveSet.has(normalize(item)));
    effectiveMustTotal = mustHaveFiltered.length;
    effectiveMustMiss  = guardedMiss.length;
    effectiveMissItems = guardedMiss;
    mustPolicyMode     = "hard-must-guarded";
  }
  // ──────────────────────────────────────────────────────────────────────

  // ── Cert alias bridge (conservative — cert aliases only) ──────────────────
  // effectiveMissItems 중 cert jdSignalMapping alias로 resume 원문에서 확인되는 항목은
  // miss에서 제거. tool/task alias는 must risk false positive 위험으로 제외.
  const certAliasResolvedItems = [];
  if (resumeRawText && effectiveMissItems.length > 0) {
    const resumeNormBridge = String(resumeRawText).toLowerCase().trim().replace(/\s+/g, " ");
    const stillMissing = [];
    for (const item of effectiveMissItems) {
      if (_certAliasMatch(item, resumeNormBridge)) {
        certAliasResolvedItems.push(item);
      } else {
        stillMissing.push(item);
      }
    }
    if (certAliasResolvedItems.length > 0) {
      effectiveMissItems = stillMissing;
      effectiveMustMiss  = stillMissing.length;
    }
  }
  // ── End cert alias bridge ─────────────────────────────────────────────────

  // ── T3: role/industry alias bridge (cert alias 다음 단계) ────────────────
  // miss로 남은 항목에 대해 직무/산업/업무 표현 alias로 보정한다.
  // 보정된 항목은 aliasResolvedItems에 기록하고 effectiveMissItems에서 제외해
  // false negative로 인한 severity 과대평가를 줄인다. 단, confidence는 medium
  // 으로 고정해 "보정 근거"로만 표시한다 (완전 hit 아님).
  const aliasResolvedItems = [];
  if (resumeRawText && effectiveMissItems.length > 0) {
    const stillMissingAfterRoleAlias = [];
    for (const item of effectiveMissItems) {
      const aliasResult = resolveMustRequirementAliasMatch({
        jdRequirement: item,
        resumeText: resumeRawText,
      });
      if (aliasResult.matched) {
        aliasResolvedItems.push({
          requirement: item,
          groupId: aliasResult.groupId,
          label: aliasResult.label,
          jdTerm: aliasResult.jdTerm,
          resumeTerms: aliasResult.resumeTerms,
          confidence: aliasResult.confidence,
        });
      } else {
        stillMissingAfterRoleAlias.push(item);
      }
    }
    if (aliasResolvedItems.length > 0) {
      effectiveMissItems = stillMissingAfterRoleAlias;
      effectiveMustMiss  = stillMissingAfterRoleAlias.length;
    }
  }
  // ── End role/industry alias bridge ───────────────────────────────────────

  const effectiveMustHit  = effectiveMustTotal - effectiveMustMiss;
  const missRatio = effectiveMustTotal > 0 ? effectiveMustMiss / effectiveMustTotal : 0;
  const hasMixedMustProfile = effectiveMustHit >= 1 && effectiveMustMiss >= 1;

  // severity 계산 (스펙 판정 규칙 순서 준수)
  let severity;
  if (effectiveMustTotal === 0 || effectiveMustMiss === 0) {
    severity = "none";
  } else if (effectiveMustMiss >= 3 || (effectiveMustTotal >= 3 && missRatio >= 0.5)) {
    severity = "critical";
  } else if (missRatio >= 0.3 || effectiveMustMiss >= 2) {
    severity = "high";
  } else if (effectiveMustMiss === 1) {
    severity = "medium";
  } else {
    severity = "none";
  }

  let triggered = severity !== "none";

  // ── fitUnderstandingPack.comparisonPack 추출 — append-only Round 4-B ──────
  const _cp4b       = fit?.fitUnderstandingPack?.comparisonPack ?? null;
  const _cpMustFit  = _cp4b?.mustRequirementFit ?? null;
  const _cpMissing  = Array.isArray(_cp4b?.missingDirectEvidence) ? _cp4b.missingDirectEvidence : [];
  const _cpMustTrig = _cpMustFit === "missing" && _cpMissing.length > 0;

  // ── comparisonPack 기반 title/summary/detail override ─────────────────────
  let _mustTitleOverride   = null;
  let _mustSummaryOverride = null;
  let _mustDetailOverride  = null;
  if (_cpMustTrig) {
    const _missingShort = _cpMissing.slice(0, 3)
      .map((s) => s.replace(/\s*경험$/, ""))
      .join("·");
    _mustTitleOverride   = "지원 직무가 중요하게 보는 경험이 이력서에서 충분히 드러나지 않음";
    _mustSummaryOverride = `JD의 필수요건 중 ${_missingShort} 경험이 현재 이력서에서 선명하게 확인되지 않습니다.`;
    _mustDetailOverride  = `이 JD가 중요하게 보는 ${_missingShort} 경험이 이력서에서 충분히 드러나지 않습니다. 관련 경험이 있다면 이력서에서 명시적으로 드러내는 것이 필요합니다.`;
  }

  // evidence 구성 — 빈 문자열 금지, createRiskResult에서도 falsy 제거
  const evidence = [];
  evidence.push(`JD 필수요건 ${effectiveMustTotal}개 중 직접 확인 ${effectiveMustHit}개`);
  if (effectiveMustMiss > 0 && effectiveMissItems.length > 0) {
    evidence.push(`이력서에서 직접 확인되지 않은 항목: ${effectiveMissItems.join(", ")}`);
  }
  if (triggered) {
    if (certAliasResolvedItems.length > 0 || aliasResolvedItems.length > 0) {
      evidence.push("필수요건은 과대판정을 막기 위해 더 보수적으로 확인했습니다.");
      evidence.push("자격증·툴 명칭 차이와 일부 직무 표현(VOC↔고객 문의, BD↔파트너십 등)은 별도 보정했지만, 일반 업무 표현은 동일선상에서 인정하지 않았습니다.");
      evidence.push("표현 차이로 보정된 항목은 JD 표현 그대로 보강하면 더 안전합니다. 동일 경험을 과장하지 말고 실제 수행한 범위 안에서 JD 용어를 함께 적어주세요.");
      evidence.push("즉, 현재 미충족으로 남은 항목은 표현 차이를 일부 보정한 뒤에도 직접 근거가 약한 항목입니다.");
    } else {
      evidence.push("필수요건은 과대판정을 막기 위해 더 보수적으로 확인했습니다.");
      evidence.push("현재 미충족으로 남은 항목은 이력서에서 직접 근거가 약하거나 확인되지 않은 항목입니다.");
    }
  }
  if (hasMixedMustProfile) {
    evidence.push("일부 핵심 기반 역량은 확인되지만, 타깃 역할의 직접 수행 근거는 아직 부분적으로만 확인됩니다.");
    evidence.push("전환형 지원이라면 강점 자체보다, 이 강점이 해당 역할에서 어떻게 쓰였는지를 더 구체적으로 연결할 필요가 있습니다.");
  }
  if (requiredLines.length > 0) {
    evidence.push("JD 필수요건 원문 기준으로 판정했습니다.");
  }

  // ── comparisonPack 기반 evidence — append-only Round 4-B ─────────────────
  if (_cpMustTrig) {
    evidence.push(`JD가 중요하게 보는 경험: ${_cpMissing.slice(0, 5).join(", ")}`);
    evidence.push("현재 이력서에서 위 경험이 충분히 드러나지 않습니다.");
    const _cpSigs = Array.isArray(_cp4b?.transferableSignals) ? _cp4b.transferableSignals : [];
    for (const sig of _cpSigs.slice(0, 2)) {
      const _sigText = sig?.caution
        || (sig?.resumeSignal ? `${sig.resumeSignal}은(는) 연결해서 설명할 수 있지만, 연결되는 정도가 부족합니다.` : null);
      if (_sigText) evidence.push(_sigText);
    }
    evidence.push("보완하려면 JD가 요구하는 직무 경험과 연결되는 사례를 이력서에서 구체적으로 드러내야 합니다.");
  }

  // ── P1-B + P1-C: 필수요건 경력 매칭 — append-only P2-1 ───────────────────────
  let _p1cMustApplied = false;
  let _aiMustReqCount = 0;
  let _aiMatchedMustCount = 0;
  let _aiUnmatchedMustTexts = [];
  const _p1bReqs = Array.isArray(jdRequirementDecomposition?.jdRequirements)
    ? jdRequirementDecomposition.jdRequirements
    : [];
  const _p1cMatches = Array.isArray(roleFitCareerMatch?.careerFitMatches)
    ? roleFitCareerMatch.careerFitMatches
    : [];
  if (_p1bReqs.length > 0 && _p1cMatches.length > 0) {
    // P1-B must/critical requirements
    const _aiMustReqs = _p1bReqs.filter((r) =>
      r?.requirementType === "must" ||
      r?.importance === "critical" ||
      (r?.importance === "high" && r?.requirementType !== "preferred" && r?.requirementType !== "bonus")
    );
    // all matched IDs from P1-C across all career entries
    const _matchedIdSet = new Set(
      _p1cMatches.flatMap((m) =>
        Array.isArray(m?.matchedRequirementIds) ? m.matchedRequirementIds : []
      )
    );
    const _aiMatchedReqs   = _aiMustReqs.filter((r) => _matchedIdSet.has(r?.id));
    const _aiUnmatchedReqs = _aiMustReqs.filter((r) => !_matchedIdSet.has(r?.id));
    _aiMustReqCount      = _aiMustReqs.length;
    _aiMatchedMustCount  = _aiMatchedReqs.length;
    _aiUnmatchedMustTexts = _aiUnmatchedReqs.map((r) => String(r?.text || "")).filter(Boolean);

    if (_aiMustReqCount > 0) {
      _p1cMustApplied = true;

      // evidence
      if (_aiMatchedMustCount > 0) {
        evidence.push(`JD 필수요건 중 경력 매칭에서 연결된 항목: ${_aiMatchedMustCount}개`);
      }
      if (_aiUnmatchedMustTexts.length > 0) {
        evidence.push(`경력 매칭 기준으로 아직 연결이 약한 필수요건: ${_aiUnmatchedMustTexts.length}개`);
        evidence.push(`연결이 약한 필수요건 항목: ${_aiUnmatchedMustTexts.slice(0, 3).join(", ")}`);
      }

      // severity escalation — do not set critical from P1-C alone
      const _unmatchedCount = _aiUnmatchedMustTexts.length;
      if (severity === "none") {
        if (_unmatchedCount >= 2) {
          severity  = "high";
          triggered = true;
        } else if (_unmatchedCount === 1) {
          severity  = "medium";
          triggered = true;
        }
      } else if (severity === "medium" && _unmatchedCount >= 2) {
        severity = "high";
      }
      // critical/high: preserved as-is
    }
  }
  // ── End P1-C ──────────────────────────────────────────────────────────────────

  // ── AI-only role-gap semantic split — append-only ─────────────────────────────
  // raw must pipeline 에서 miss 없음 + P1-B/P1-C 에서 핵심 역할 경험 미매칭 → role-fit 갭.
  // 자격요건 미충족(credential gap)과 혼재 방지를 위해 별도 제목 사용.
  const _aiOnlyCriticalGap = (
    _p1cMustApplied &&
    effectiveMustMiss === 0 &&
    _aiUnmatchedMustTexts.length > 0
  );
  let _roleGapTitleOverride   = null;
  let _roleGapSummaryOverride = null;
  let _roleGapDetailOverride  = null;
  if (_aiOnlyCriticalGap && !_cpMustTrig) {
    const _missingPreview = _aiUnmatchedMustTexts.slice(0, 2).join(", ");
    _roleGapTitleOverride   = "핵심 업무 경험 부족";
    _roleGapSummaryOverride = "지원 직무의 핵심 업무 수행 경험이 이력서에서 충분히 드러나지 않습니다.";
    _roleGapDetailOverride  = `JD가 요구하는 핵심 역할 수행 경험(${_missingPreview} 등)이 현재 이력서에서 선명하게 확인되지 않습니다. 실제 수행 경험이 있다면 이력서에서 구체적으로 드러내는 것이 좋습니다.`;
  }
  // ── End AI-only role-gap ──────────────────────────────────────────────────────

  const raw = {
    mustTotal,
    mustHit,
    mustMiss,
    missRatio,
    hitItems,
    missItems,
    requiredLines,
    mustPolicyMode,
    // guard 적용 시 실제 사용한 effective 값도 기록
    effectiveMustTotal,
    effectiveMustMiss,
    effectiveMissItems,
    // cert alias bridge로 재확인된 항목 (UI 참고용)
    certAliasResolvedItems,
    // T3: role/industry alias bridge로 보정된 항목
    // (cert alias와 별도 필드로 두어 UI에서 구분 노출)
    aliasResolvedItems,
  };

  // append-only Round 4-B: fitUnderstandingPack 적용 여부 기록
  if (_cpMustTrig) {
    raw.fitUnderstandingApplied      = true;
    raw.comparisonMustRequirementFit = _cpMustFit;
    raw.missingDirectEvidence        = _cpMissing.slice(0, 5);
  }

  // append-only P2-1: P1-C role-fit context
  if (_p1cMustApplied) {
    raw.roleFitRequirementMatchApplied = true;
    raw.aiMustRequirementCount         = _aiMustReqCount;
    raw.aiMatchedMustRequirementCount  = _aiMatchedMustCount;
    raw.aiUnmatchedMustRequirements    = _aiUnmatchedMustTexts;
  }

  // AI-only role-gap flag for UI layer
  if (_aiOnlyCriticalGap) {
    raw.aiOnlyCriticalGap = true;
  }

  return createRiskResult({
    key: "must_requirements_gap",
    title: _mustTitleOverride ?? _roleGapTitleOverride ?? "필수요건 미충족",
    category: "fatal",
    severity,
    triggered,
    summaryText: _mustSummaryOverride ?? _roleGapSummaryOverride ?? (SUMMARY_TEXT[severity] ?? SUMMARY_TEXT.none),
    detailText: _mustDetailOverride ?? _roleGapDetailOverride ?? (DETAIL_TEXT[severity] ?? DETAIL_TEXT.none),
    evidence,
    raw,
  });
}
