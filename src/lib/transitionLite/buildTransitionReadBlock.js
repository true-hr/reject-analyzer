import { INTERACTION_SUBCATEGORY_ADJACENT_ROLE_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/adjacent_role_shift.js";
import { INTERACTION_SUBCATEGORY_ANALYTICAL_VS_EXECUTIONAL_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/analytical_vs_executional_shift.js";
import { INTERACTION_SUBCATEGORY_EXTERNAL_INTERNAL_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/external_internal_shift.js";
import { INTERACTION_SUBCATEGORY_INDUSTRY_SPECIALIZED_ROLE_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/industry_specialized_role_shift.js";
import { INTERACTION_SUBCATEGORY_OPERATIONAL_STRATEGIC_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/operational_strategic_shift.js";
import { INTERACTION_SUBCATEGORY_SAME_ROLE_FAMILY_SHIFT } from "../../data/interaction/taxonomy/boundary_shift_hints/same_role_family_shift.js";
import { INTERACTION_SUBCATEGORY_COLLABORATION_STRUCTURE_AMPLIFICATION } from "../../data/interaction/taxonomy/cross_amplification/collaboration_structure_amplification.js";
import { INTERACTION_SUBCATEGORY_DECISION_STRUCTURE_AMPLIFICATION } from "../../data/interaction/taxonomy/cross_amplification/decision_structure_amplification.js";
import { INTERACTION_SUBCATEGORY_DOMAIN_KNOWLEDGE_AMPLIFICATION } from "../../data/interaction/taxonomy/cross_amplification/domain_knowledge_amplification.js";
import { INTERACTION_SUBCATEGORY_WORK_CONTENT_AMPLIFICATION } from "../../data/interaction/taxonomy/cross_amplification/work_content_amplification.js";
import { INTERACTION_SUBCATEGORY_DOMAIN_FIT_PROOF_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/domain_fit_proof_shift.js";
import { INTERACTION_SUBCATEGORY_OUTPUT_EVIDENCE_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/output_evidence_shift.js";
import { INTERACTION_SUBCATEGORY_PERFORMANCE_METRIC_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/performance_metric_shift.js";
import { INTERACTION_SUBCATEGORY_PROCESS_PROOF_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/process_proof_shift.js";
import { INTERACTION_SUBCATEGORY_RELATIONSHIP_POSITION_PROOF_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/relationship_position_proof_shift.js";
import { INTERACTION_SUBCATEGORY_RESULT_EVIDENCE_SHIFT } from "../../data/interaction/taxonomy/evidence_mode_shift/result_evidence_shift.js";
import { INTERACTION_SUBCATEGORY_ABSTRACT_CAPABILITY_KEYWORD_WEAKENING } from "../../data/interaction/taxonomy/weakening_signals/abstract_capability_keyword_weakening.js";
import { INTERACTION_SUBCATEGORY_DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING } from "../../data/interaction/taxonomy/weakening_signals/domain_irrelevant_experience_weakening.js";
import { INTERACTION_SUBCATEGORY_OUTPUT_PERSUASIVENESS_WEAKENING } from "../../data/interaction/taxonomy/weakening_signals/output_persuasiveness_weakening.js";
import { INTERACTION_SUBCATEGORY_PERFORMANCE_LANGUAGE_WEAKENING } from "../../data/interaction/taxonomy/weakening_signals/performance_language_weakening.js";
import { INTERACTION_SUBCATEGORY_TASK_CONTENT_WEAKENING } from "../../data/interaction/taxonomy/weakening_signals/task_content_weakening.js";
import { buildTransitionLiteGenerationTags } from "./buildTransitionLiteGenerationTags.js";

const SECTION_TITLE = "면접관은 보통 이 부분을 먼저 봅니다";
const MAX_TOTAL_CARD_COUNT = 3;
const MAX_POINT_COUNT = 3;
const VALIDATION_SECTION_TITLE = "이 전환에서 먼저 검증되는 포인트";

const BOUNDARY_TAXONOMY_MAP = Object.freeze({
  INDUSTRY_SPECIALIZED_ROLE_SHIFT: INTERACTION_SUBCATEGORY_INDUSTRY_SPECIALIZED_ROLE_SHIFT,
  SAME_ROLE_FAMILY_SHIFT: INTERACTION_SUBCATEGORY_SAME_ROLE_FAMILY_SHIFT,
  OPERATIONAL_STRATEGIC_SHIFT: INTERACTION_SUBCATEGORY_OPERATIONAL_STRATEGIC_SHIFT,
  ANALYTICAL_VS_EXECUTIONAL_SHIFT: INTERACTION_SUBCATEGORY_ANALYTICAL_VS_EXECUTIONAL_SHIFT,
  EXTERNAL_INTERNAL_SHIFT: INTERACTION_SUBCATEGORY_EXTERNAL_INTERNAL_SHIFT,
  ADJACENT_ROLE_SHIFT: INTERACTION_SUBCATEGORY_ADJACENT_ROLE_SHIFT,
});

const EVIDENCE_TAXONOMY_MAP = Object.freeze({
  DOMAIN_FIT_PROOF_SHIFT: INTERACTION_SUBCATEGORY_DOMAIN_FIT_PROOF_SHIFT,
  PERFORMANCE_METRIC_SHIFT: INTERACTION_SUBCATEGORY_PERFORMANCE_METRIC_SHIFT,
  PROCESS_PROOF_SHIFT: INTERACTION_SUBCATEGORY_PROCESS_PROOF_SHIFT,
  RESULT_EVIDENCE_SHIFT: INTERACTION_SUBCATEGORY_RESULT_EVIDENCE_SHIFT,
  OUTPUT_EVIDENCE_SHIFT: INTERACTION_SUBCATEGORY_OUTPUT_EVIDENCE_SHIFT,
  RELATIONSHIP_POSITION_PROOF_SHIFT: INTERACTION_SUBCATEGORY_RELATIONSHIP_POSITION_PROOF_SHIFT,
});

const CROSS_TAXONOMY_MAP = Object.freeze({
  DECISION_STRUCTURE_AMPLIFICATION: INTERACTION_SUBCATEGORY_DECISION_STRUCTURE_AMPLIFICATION,
  DOMAIN_KNOWLEDGE_AMPLIFICATION: INTERACTION_SUBCATEGORY_DOMAIN_KNOWLEDGE_AMPLIFICATION,
  WORK_CONTENT_AMPLIFICATION: INTERACTION_SUBCATEGORY_WORK_CONTENT_AMPLIFICATION,
  COLLABORATION_STRUCTURE_AMPLIFICATION: INTERACTION_SUBCATEGORY_COLLABORATION_STRUCTURE_AMPLIFICATION,
});

const AXIS = Object.freeze({
  DOMAIN_TRANSLATION: "domain_translation",
  PROBLEM_STRUCTURE: "problem_structure",
  DECISION_CRITERIA: "decision_criteria",
  PROCESS_REPLAY: "process_replay",
  METRIC_FRAME: "metric_frame",
  RESULT_IMPACT: "result_impact",
  DELIVERABLE_INFLUENCE: "deliverable_influence",
  OUTPUT_QUALITY: "output_quality",
  STAKEHOLDER_POSITION: "stakeholder_position",
  ALIGNMENT_ROLE: "alignment_role",
  WORK_CONTENT: "work_content",
});

const AXIS_GROUP = Object.freeze({
  [AXIS.DOMAIN_TRANSLATION]: "domain_context",
  [AXIS.PROBLEM_STRUCTURE]: "domain_context",
  [AXIS.DECISION_CRITERIA]: "decision",
  [AXIS.PROCESS_REPLAY]: "process",
  [AXIS.METRIC_FRAME]: "result_metric",
  [AXIS.RESULT_IMPACT]: "result_metric",
  [AXIS.DELIVERABLE_INFLUENCE]: "output",
  [AXIS.OUTPUT_QUALITY]: "output",
  [AXIS.STAKEHOLDER_POSITION]: "alignment",
  [AXIS.ALIGNMENT_ROLE]: "alignment",
  [AXIS.WORK_CONTENT]: "work_content",
});

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeText(value) {
  return toStr(value).replace(/\s+/g, " ").trim();
}

function uniqueStrings(items = []) {
  const seen = new Set();
  return toArr(items)
    .map((item) => normalizeText(item))
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function ensureSentence(value) {
  const text = normalizeText(value).replace(/[.?!]+$/g, "");
  return text ? `${text}.` : "";
}

function ensureQuestion(value) {
  const text = normalizeText(value).replace(/[.?!]+$/g, "");
  return text ? `${text}?` : "";
}

function takeFirstLine(value) {
  if (typeof value === "string") return normalizeText(value);
  return toArr(value).map((item) => normalizeText(item)).find(Boolean) || "";
}

function makeCard(key, title, body) {
  const bodyLines = uniqueStrings(body);
  if (!toStr(title) || bodyLines.length === 0) return null;
  return { key, title: toStr(title), body: bodyLines };
}

function compactValidationSnippet(value, maxLength = 42) {
  const text = normalizeText(value)
    .replace(/^(이 직무는|이 산업은|지원 산업은|지원 직무는)\s*/g, "")
    .replace(/[.?!]+$/g, "");
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function buildValidationSupportLine(prefix, sourceValue) {
  const snippet = compactValidationSnippet(sourceValue);
  if (!prefix || !snippet) return "";
  return ensureSentence(`${prefix} ${snippet}`);
}

function buildValidationIntro({
  targetJobLabel,
  targetIndustryLabel,
  targetJobRead,
  industryTraitsAsset,
} = {}) {
  const jobLabel = toStr(targetJobLabel) || "지원 직무";
  const industryLabel = toStr(targetIndustryLabel) || toStr(industryTraitsAsset?.label) || "지원 산업";
  const jobPoint = toArr(targetJobRead?.bullets)[0] || toStr(targetJobRead?.body);
  const industryPoint =
    toArr(industryTraitsAsset?.evaluationCriteria)[0] ||
    toArr(industryTraitsAsset?.transitionInterpretationPoints)[0] ||
    toArr(industryTraitsAsset?.whyIndustryMatters)[0];
  const lines = [];

  lines.push(ensureSentence(`이 전환에서는 ${jobLabel} 기준과 ${industryLabel}의 평가 문맥이 함께 먼저 읽힙니다`));

  if (jobPoint || industryPoint) {
    const fragments = [];
    const compactJob = compactValidationSnippet(jobPoint, 50);
    const compactIndustry = compactValidationSnippet(industryPoint, 50);
    if (compactJob) fragments.push(`${jobLabel} 쪽에서는 ${compactJob}`);
    if (compactIndustry) fragments.push(`${industryLabel} 쪽에서는 ${compactIndustry}`);
    if (fragments.length > 0) {
      lines.push(ensureSentence(`${fragments.join(", ")} 같은 기준이 먼저 드러납니다`));
    }
  }

  return uniqueStrings(lines).filter(Boolean).slice(0, 2).join(" ");
}

function buildValidationCards({
  targetJobLabel,
  targetIndustryLabel,
  targetJobRead,
  targetIndustryRead,
  industryTraitsAsset,
} = {}) {
  const jobLabel = toStr(targetJobLabel) || "지원 직무";
  const industryLabel = toStr(targetIndustryLabel) || toStr(industryTraitsAsset?.label) || "지원 산업";
  const transitionPoints = toArr(industryTraitsAsset?.transitionInterpretationPoints);
  const evaluationCriteria = toArr(industryTraitsAsset?.evaluationCriteria);
  const whyIndustryMatters = toArr(industryTraitsAsset?.whyIndustryMatters);
  const jobBullets = toArr(targetJobRead?.bullets);
  const industryBullets = toArr(targetIndustryRead?.bullets);
  const cards = [];

  const card1 = makeCard(
    "validation_job_focus",
    `${jobLabel} 기준으로 역할의 무게를 읽는지`,
    [
      ensureSentence(`${jobLabel}에서 실제로 더 중요하게 보는 역할 기준을 먼저 확인하게 됩니다`),
      buildValidationSupportLine(`${jobLabel} 쪽 기준에서는`, transitionPoints[0] || jobBullets[0] || targetJobRead?.body),
      buildValidationSupportLine(`하단 참고 정보보다 앞단에서 먼저 보이는 것은`, jobBullets[1] || transitionPoints[1]),
    ]
  );
  if (card1) cards.push(card1);

  const card2 = makeCard(
    "validation_industry_criteria",
    `${industryLabel}의 평가 기준을 같은 언어로 이해하는지`,
    [
      ensureSentence(`${industryLabel}에서는 성과보다 판단 기준과 책임 구조를 함께 보는 경우가 많습니다`),
      buildValidationSupportLine(`${industryLabel} 자산에서는`, evaluationCriteria[0] || whyIndustryMatters[0] || industryBullets[0]),
      buildValidationSupportLine(`그래서 먼저 드러나는 기준도`, evaluationCriteria[1] || whyIndustryMatters[1]),
    ]
  );
  if (card2) cards.push(card2);

  const card3 = makeCard(
    "validation_transition_translation",
    `직무 설명을 ${industryLabel} 문맥까지 연결하는지`,
    [
      ensureSentence(`같은 업무 표현이라도 ${industryLabel} 문맥에 맞게 해석되는지가 이 전환에서는 중요하게 작동합니다`),
      buildValidationSupportLine(`전환 해석 포인트에서는`, transitionPoints[1] || whyIndustryMatters[0] || industryBullets[0]),
      buildValidationSupportLine(`지원 직무 기준과 함께 읽히는 산업 문맥은`, whyIndustryMatters[1] || evaluationCriteria[0] || jobBullets[0]),
    ]
  );
  if (card3) cards.push(card3);

  return cards.slice(0, 3);
}

export function buildValidationReadBlock(context = {}) {
  return buildValidationReadBlockRefined(context);
}

function buildValidationPointSnippet(value, maxLength = 34) {
  const text = normalizeText(value)
    .replace(/^(이 직무는|지원 직무는|이 산업은|지원 산업은)\s*/g, "")
    .replace(/[.?!]+$/g, "");
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3).trim()}...`;
}

function buildValidationIntroRefined({ targetJobLabel, targetIndustryLabel, targetJobRead, industryTraitsAsset } = {}) {
  const jobLabel = toStr(targetJobLabel) || "지원 직무";
  const industryLabel = toStr(targetIndustryLabel) || toStr(industryTraitsAsset?.label) || "지원 산업";
  const lines = [ensureSentence(`이 전환에서는 ${jobLabel}의 역할 기준과 ${industryLabel}의 평가 문맥을 각각 확인합니다`)];

  return uniqueStrings(lines).filter(Boolean).slice(0, 1).join(" ");
}

function buildValidationCardsRefined({ targetJobLabel, targetIndustryLabel, targetJobRead, targetIndustryRead, industryTraitsAsset } = {}) {
  const jobLabel = toStr(targetJobLabel) || "지원 직무";
  const industryLabel = toStr(targetIndustryLabel) || toStr(industryTraitsAsset?.label) || "지원 산업";
  const transitionPoints = toArr(industryTraitsAsset?.transitionInterpretationPoints);
  const evaluationCriteria = toArr(industryTraitsAsset?.evaluationCriteria);
  const whyIndustryMatters = toArr(industryTraitsAsset?.whyIndustryMatters);
  const fallbackIndustryBullets = industryTraitsAsset ? [] : toArr(targetIndustryRead?.bullets);
  const jobBullet = toArr(targetJobRead?.bullets)[0] || "";
  const used = new Set();
  const pickPoint = (...candidates) => {
    for (const candidate of candidates) {
      const snippet = buildValidationPointSnippet(candidate);
      if (!snippet) continue;
      const key = snippet.toLowerCase();
      if (used.has(key)) continue;
      used.add(key);
      return snippet;
    }
    return "";
  };

  const jobPoint = pickPoint(transitionPoints[0], evaluationCriteria[0], whyIndustryMatters[0], jobBullet);
  const industryPoint = pickPoint(evaluationCriteria[0], transitionPoints[1], whyIndustryMatters[0], fallbackIndustryBullets[0]);
  const bridgePoint = pickPoint(transitionPoints[1], whyIndustryMatters[1], evaluationCriteria[1], fallbackIndustryBullets[1]);
  const cards = [];

  if (jobPoint) {
    cards.push(
      makeCard("validation_job_focus", `${jobLabel} 기준을 어떤 무게로 읽는지`, [
        ensureSentence(`먼저 보는 것은 ${jobLabel}에서 더 핵심으로 읽히는 역할 기준입니다`),
        ensureSentence(`${jobPoint} 같은 포인트가 상단에서 먼저 해석됩니다`),
      ])
    );
  }

  if (industryPoint) {
    cards.push(
      makeCard("validation_industry_criteria", `${industryLabel} 평가 문맥을 맞게 읽는지`, [
        ensureSentence(`먼저 보는 것은 ${industryLabel}에서 실무를 어떤 기준으로 평가하는지입니다`),
        ensureSentence(`${industryPoint} 같은 기준은 이 전환의 적응 가능성을 빨리 가르는 포인트가 됩니다`),
      ])
    );
  }

  if (bridgePoint) {
    cards.push(
      makeCard("validation_transition_translation", `${jobLabel} 설명을 ${industryLabel} 문맥으로 연결하는지`, [
        ensureSentence(`먼저 보는 것은 직무 설명이 ${industryLabel} 문맥까지 이어지는지입니다`),
        ensureSentence(`${bridgePoint} 같은 해석 포인트가 직무 판단과 함께 읽힙니다`),
      ])
    );
  }

  return cards.filter(Boolean).slice(0, 3);
}

function buildValidationReadBlockRefined(context = {}) {
  const targetJobRead =
    context?.targetJobRead && typeof context.targetJobRead === "object" ? context.targetJobRead : {};
  const targetIndustryRead =
    context?.targetIndustryRead && typeof context.targetIndustryRead === "object" ? context.targetIndustryRead : {};
  const industryTraitsAsset =
    context?.industryTraitsAsset && typeof context.industryTraitsAsset === "object" ? context.industryTraitsAsset : null;
  const hasSourceSignal = Boolean(
    toStr(targetJobRead?.body) ||
      toArr(targetJobRead?.bullets)[0] ||
      toStr(industryTraitsAsset?.summaryTemplate) ||
      toArr(industryTraitsAsset?.transitionInterpretationPoints)[0] ||
      toArr(industryTraitsAsset?.evaluationCriteria)[0] ||
      toArr(industryTraitsAsset?.whyIndustryMatters)[0] ||
      (!industryTraitsAsset && toArr(targetIndustryRead?.bullets)[0])
  );
  if (!hasSourceSignal) return null;
  const cards = buildValidationCardsRefined({
    targetJobLabel: context?.targetJobLabel,
    targetIndustryLabel: context?.targetIndustryLabel,
    targetJobRead,
    targetIndustryRead,
    industryTraitsAsset,
  });
  const intro = buildValidationIntroRefined({
    targetJobLabel: context?.targetJobLabel,
    targetIndustryLabel: context?.targetIndustryLabel,
    targetJobRead,
    industryTraitsAsset,
  });

  if (!intro && cards.length === 0) return null;

  const jobBullet = toArr(targetJobRead?.bullets)[0] || "";

  return {
    sectionTitle: VALIDATION_SECTION_TITLE,
    intro,
    cards,
    meta: {
      sourceFamilies: uniqueStrings([
        toArr(industryTraitsAsset?.transitionInterpretationPoints).length > 0 ? "industry_transition" : "",
        toArr(industryTraitsAsset?.evaluationCriteria).length > 0 ? "industry_evaluation" : "",
        toArr(industryTraitsAsset?.whyIndustryMatters).length > 0 ? "industry_context" : "",
        jobBullet ? "job_read_once" : "",
        !industryTraitsAsset && toArr(targetIndustryRead?.bullets).length > 0 ? "industry_read_fallback" : "",
      ]),
      usedSources: uniqueStrings([
        toArr(industryTraitsAsset?.transitionInterpretationPoints).length > 0 ? "industryTraitsAsset.transitionInterpretationPoints" : "",
        toArr(industryTraitsAsset?.evaluationCriteria).length > 0 ? "industryTraitsAsset.evaluationCriteria" : "",
        toArr(industryTraitsAsset?.whyIndustryMatters).length > 0 ? "industryTraitsAsset.whyIndustryMatters" : "",
        jobBullet ? "targetJobRead.bullets" : "",
        !industryTraitsAsset && toArr(targetIndustryRead?.bullets).length > 0 ? "targetIndustryRead.bullets" : "",
      ]),
      derivation: "validation_point_summary_v2",
    },
  };
}

function makeAxisPoint(axisKey, text, options = {}) {
  const normalized = normalizeText(text);
  if (!axisKey || !normalized) return null;
  return {
    axisKey,
    axisGroup: AXIS_GROUP[axisKey] || axisKey,
    isCore: options.isCore === true,
    text: normalized,
  };
}

function pickBoundaryTaxonomy({ classification, patternResult }) {
  const jobDistance = toStr(classification?.jobDistance) || "cross";
  const industryDistance = toStr(classification?.industryDistance) || "cross";
  const roleWeightShift = toStr(classification?.roleWeightShift) || "similar";
  const debug = patternResult?.debug && typeof patternResult.debug === "object" ? patternResult.debug : {};

  if (industryDistance !== "same" && jobDistance === "same") return BOUNDARY_TAXONOMY_MAP.INDUSTRY_SPECIALIZED_ROLE_SHIFT;
  if (roleWeightShift === "strategy_to_execution" || roleWeightShift === "execution_to_strategy") {
    return BOUNDARY_TAXONOMY_MAP.OPERATIONAL_STRATEGIC_SHIFT;
  }
  if (roleWeightShift === "operator_to_coordinator" || roleWeightShift === "coordinator_to_operator") {
    return BOUNDARY_TAXONOMY_MAP.ANALYTICAL_VS_EXECUTIONAL_SHIFT;
  }
  if (debug.stakeholderSame === false && jobDistance === "same") return BOUNDARY_TAXONOMY_MAP.EXTERNAL_INTERNAL_SHIFT;
  if (jobDistance === "same") return BOUNDARY_TAXONOMY_MAP.SAME_ROLE_FAMILY_SHIFT;
  if (jobDistance === "adjacent") return BOUNDARY_TAXONOMY_MAP.ADJACENT_ROLE_SHIFT;
  if (industryDistance !== "same") return BOUNDARY_TAXONOMY_MAP.INDUSTRY_SPECIALIZED_ROLE_SHIFT;
  return BOUNDARY_TAXONOMY_MAP.ADJACENT_ROLE_SHIFT;
}

function pickEvidenceTaxonomy({ classification, patternResult, boundaryTaxonomy }) {
  const jobDistance = toStr(classification?.jobDistance) || "cross";
  const industryDistance = toStr(classification?.industryDistance) || "cross";
  const roleWeightShift = toStr(classification?.roleWeightShift) || "similar";
  const responsibilityShift = toStr(classification?.responsibilityShift) || "similar";
  const debug = patternResult?.debug && typeof patternResult.debug === "object" ? patternResult.debug : {};
  const boundaryId = toStr(boundaryTaxonomy?.id);

  if (boundaryId === "INDUSTRY_SPECIALIZED_ROLE_SHIFT" || industryDistance !== "same") {
    return EVIDENCE_TAXONOMY_MAP.DOMAIN_FIT_PROOF_SHIFT;
  }
  if (
    boundaryId === "OPERATIONAL_STRATEGIC_SHIFT" ||
    boundaryId === "ANALYTICAL_VS_EXECUTIONAL_SHIFT" ||
    roleWeightShift !== "similar"
  ) {
    return EVIDENCE_TAXONOMY_MAP.PROCESS_PROOF_SHIFT;
  }
  if (
    responsibilityShift === "slightly_up" ||
    responsibilityShift === "meaningfully_up" ||
    debug.stakeholderSame === false
  ) {
    return EVIDENCE_TAXONOMY_MAP.RELATIONSHIP_POSITION_PROOF_SHIFT;
  }
  if (debug.metricSame === false) return EVIDENCE_TAXONOMY_MAP.PERFORMANCE_METRIC_SHIFT;
  if (debug.outputSame === false) return EVIDENCE_TAXONOMY_MAP.OUTPUT_EVIDENCE_SHIFT;
  if (debug.horizonSame === false || jobDistance === "adjacent") return EVIDENCE_TAXONOMY_MAP.RESULT_EVIDENCE_SHIFT;
  return EVIDENCE_TAXONOMY_MAP.PERFORMANCE_METRIC_SHIFT;
}

function pickCrossTaxonomy({ classification, patternResult, evidenceTaxonomy }) {
  const industryDistance = toStr(classification?.industryDistance) || "cross";
  const roleWeightShift = toStr(classification?.roleWeightShift) || "similar";
  const responsibilityShift = toStr(classification?.responsibilityShift) || "similar";
  const debug = patternResult?.debug && typeof patternResult.debug === "object" ? patternResult.debug : {};
  const evidenceId = toStr(evidenceTaxonomy?.id);

  if (evidenceId === "DOMAIN_FIT_PROOF_SHIFT" && industryDistance !== "same") {
    return CROSS_TAXONOMY_MAP.DOMAIN_KNOWLEDGE_AMPLIFICATION;
  }
  if (evidenceId === "PROCESS_PROOF_SHIFT" && roleWeightShift !== "similar") {
    return CROSS_TAXONOMY_MAP.DECISION_STRUCTURE_AMPLIFICATION;
  }
  if (
    evidenceId === "RELATIONSHIP_POSITION_PROOF_SHIFT" &&
    (responsibilityShift === "slightly_up" || responsibilityShift === "meaningfully_up" || debug.stakeholderSame === false)
  ) {
    return CROSS_TAXONOMY_MAP.COLLABORATION_STRUCTURE_AMPLIFICATION;
  }
  if (evidenceId === "OUTPUT_EVIDENCE_SHIFT" || debug.outputSame === false) {
    return CROSS_TAXONOMY_MAP.WORK_CONTENT_AMPLIFICATION;
  }
  return null;
}

function pickWeakeningTaxonomies({ evidenceTaxonomy, boundaryTaxonomy }) {
  const selected = [
    INTERACTION_SUBCATEGORY_ABSTRACT_CAPABILITY_KEYWORD_WEAKENING,
    INTERACTION_SUBCATEGORY_PERFORMANCE_LANGUAGE_WEAKENING,
    INTERACTION_SUBCATEGORY_TASK_CONTENT_WEAKENING,
  ];

  if (toStr(boundaryTaxonomy?.id) === "INDUSTRY_SPECIALIZED_ROLE_SHIFT") {
    selected.push(INTERACTION_SUBCATEGORY_DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING);
  }
  if (toStr(evidenceTaxonomy?.id) === "OUTPUT_EVIDENCE_SHIFT") {
    selected.push(INTERACTION_SUBCATEGORY_OUTPUT_PERSUASIVENESS_WEAKENING);
  }

  return selected;
}

function buildIntroLine({ evidenceTaxonomy, boundaryTaxonomy, labels }) {
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  if (toStr(boundaryTaxonomy?.id) === "INDUSTRY_SPECIALIZED_ROLE_SHIFT") {
    return `이 전환에서는 ${targetIndustryLabel} 맥락 연결 여부를 먼저 확인합니다`;
  }

  switch (toStr(evidenceTaxonomy?.id)) {
    case "PROCESS_PROOF_SHIFT":
      return "이 전환에서는 실행 경험보다 판단 구조를 어떻게 설명하는지가 먼저 확인됩니다";
    case "RELATIONSHIP_POSITION_PROOF_SHIFT":
      return "이 전환에서는 누구와 어떤 위치에서 일했는지가 먼저 확인됩니다";
    case "PERFORMANCE_METRIC_SHIFT":
      return "이 전환에서는 어떤 기준으로 성과를 판단했는지가 먼저 확인됩니다";
    case "OUTPUT_EVIDENCE_SHIFT":
      return "이 전환에서는 산출물이 실제 판단에 어떻게 쓰였는지가 먼저 확인됩니다";
    case "RESULT_EVIDENCE_SHIFT":
      return "이 전환에서는 결과 변화와 영향 범위가 먼저 확인됩니다";
    default:
      return "이 전환에서는 핵심 검증 질문부터 먼저 확인합니다";
  }
}

function buildQuestionTitle({ evidenceTaxonomy, labels }) {
  const targetJobLabel = toStr(labels?.targetJobLabel) || "목표 역할";
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  switch (toStr(evidenceTaxonomy?.id)) {
    case "DOMAIN_FIT_PROOF_SHIFT":
      return `${targetIndustryLabel} 맥락으로 경험을 번역할 수 있나요`;
    case "PERFORMANCE_METRIC_SHIFT":
      return `${targetJobLabel}의 성과 기준으로 다시 말할 수 있나요`;
    case "PROCESS_PROOF_SHIFT":
      return `${targetJobLabel} 기준으로 실행 과정을 설명할 수 있나요`;
    case "RESULT_EVIDENCE_SHIFT":
      return `${targetJobLabel}에서 의미 있는 결과로 증명할 수 있나요`;
    case "OUTPUT_EVIDENCE_SHIFT":
      return `${targetJobLabel}에서 쓰일 산출물로 설명할 수 있나요`;
    case "RELATIONSHIP_POSITION_PROOF_SHIFT":
      return `${targetJobLabel}에서 필요한 조율 위치를 설명할 수 있나요`;
    default:
      return `${targetJobLabel} 기준 질문에 답할 수 있나요`;
  }
}

function buildQuestionDescription({ boundaryTaxonomy }) {
  switch (toStr(boundaryTaxonomy?.id)) {
    case "INDUSTRY_SPECIALIZED_ROLE_SHIFT":
      return "이번 이직은 산업 문법 적합성이 먼저 읽힙니다";
    case "OPERATIONAL_STRATEGIC_SHIFT":
      return "이번 이직은 운영 경험보다 전략 판단 구조를 더 봅니다";
    case "EXTERNAL_INTERNAL_SHIFT":
      return "이번 이직은 외부 접점 경험을 내부 정렬 경험으로 번역할 수 있는지가 중요합니다";
    case "ANALYTICAL_VS_EXECUTIONAL_SHIFT":
      return "이번 이직은 실행 경험보다 판단 기준을 어떻게 설명하는지가 중요합니다";
    case "SAME_ROLE_FAMILY_SHIFT":
      return "이번 이직은 같은 직무군 안의 세부 초점을 먼저 봅니다";
    case "ADJACENT_ROLE_SHIFT":
    default:
      return "이번 이직은 인접 역할 언어로 다시 설명할 수 있는지가 중요합니다";
  }
}

function buildEvidencePointSlots({ evidenceTaxonomy, labels }) {
  const targetJobLabel = toStr(labels?.targetJobLabel) || "목표 역할";
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  switch (toStr(evidenceTaxonomy?.id)) {
    case "DOMAIN_FIT_PROOF_SHIFT":
      return [
        makeAxisPoint(AXIS.DOMAIN_TRANSLATION, `${targetIndustryLabel}의 고객·시장 문맥으로 경험을 다시 설명할 수 있는가`, { isCore: true }),
        makeAxisPoint(AXIS.PROBLEM_STRUCTURE, `${targetIndustryLabel}의 문제 구조와 연결해 설명할 수 있는가`, { isCore: true }),
      ];
    case "PROCESS_PROOF_SHIFT":
      return [
        makeAxisPoint(AXIS.DECISION_CRITERIA, "어떤 기준과 순서로 실행했는가", { isCore: true }),
        makeAxisPoint(AXIS.PROCESS_REPLAY, "반복 가능하게 설명되는가", { isCore: true }),
      ];
    case "PERFORMANCE_METRIC_SHIFT":
      return [
        makeAxisPoint(AXIS.METRIC_FRAME, `${targetJobLabel}의 성과 기준으로 다시 말할 수 있는가`, { isCore: true }),
        makeAxisPoint(AXIS.DECISION_CRITERIA, "무엇으로 개선과 성과를 판단했는가", { isCore: true }),
      ];
    case "RESULT_EVIDENCE_SHIFT":
      return [
        makeAxisPoint(AXIS.RESULT_IMPACT, "실제 결과 변화가 있었는가", { isCore: true }),
        makeAxisPoint(AXIS.METRIC_FRAME, "무엇으로 결과와 영향을 판단했는가", { isCore: true }),
      ];
    case "OUTPUT_EVIDENCE_SHIFT":
      return [
        makeAxisPoint(AXIS.DELIVERABLE_INFLUENCE, "산출물이 실제 판단 근거로 기능했는가", { isCore: true }),
        makeAxisPoint(AXIS.OUTPUT_QUALITY, "결과물의 형식과 완성도가 왜 중요했는가", { isCore: true }),
      ];
    case "RELATIONSHIP_POSITION_PROOF_SHIFT":
      return [
        makeAxisPoint(AXIS.STAKEHOLDER_POSITION, "누구와 어떤 위치에서 조율했는가", { isCore: true }),
        makeAxisPoint(AXIS.ALIGNMENT_ROLE, "단순 소통이 아니라 어떤 정렬 역할을 맡았는가", { isCore: true }),
      ];
    default:
      return [
        makeAxisPoint(AXIS.DECISION_CRITERIA, "무엇을 기준으로 설명할 수 있는가", { isCore: true }),
        makeAxisPoint(AXIS.RESULT_IMPACT, "어떤 결과로 검증할 수 있는가", { isCore: true }),
      ];
  }
}

function buildCrossPointSlot({ crossTaxonomy, evidenceTaxonomy, labels }) {
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  switch (toStr(evidenceTaxonomy?.id)) {
    case "DOMAIN_FIT_PROOF_SHIFT":
      if (toStr(crossTaxonomy?.id) !== "DOMAIN_KNOWLEDGE_AMPLIFICATION") return null;
      return makeAxisPoint(AXIS.DOMAIN_TRANSLATION, `${targetIndustryLabel}의 산업 문법을 실제 업무 설명에 연결할 수 있는가`);
    case "PROCESS_PROOF_SHIFT":
      if (toStr(crossTaxonomy?.id) !== "DECISION_STRUCTURE_AMPLIFICATION") return null;
      return makeAxisPoint(AXIS.DECISION_CRITERIA, "어떤 기준과 trade-off로 우선순위를 정했는가");
    case "PERFORMANCE_METRIC_SHIFT":
      if (toStr(crossTaxonomy?.id) === "DECISION_STRUCTURE_AMPLIFICATION") {
        return makeAxisPoint(AXIS.DECISION_CRITERIA, "어떤 기준으로 성과 우선순위를 정했는가");
      }
      return null;
    case "RESULT_EVIDENCE_SHIFT":
      return null;
    case "OUTPUT_EVIDENCE_SHIFT":
      if (toStr(crossTaxonomy?.id) !== "WORK_CONTENT_AMPLIFICATION") return null;
      return makeAxisPoint(AXIS.WORK_CONTENT, "지원 직무에서 더 핵심으로 읽히는 업무가 무엇이었는가");
    case "RELATIONSHIP_POSITION_PROOF_SHIFT":
      if (toStr(crossTaxonomy?.id) !== "COLLABORATION_STRUCTURE_AMPLIFICATION") return null;
      return makeAxisPoint(AXIS.ALIGNMENT_ROLE, "누구와 어떤 협업 구조로 실행을 연결했는가");
    default:
      return null;
  }
}

function containsForbiddenInference(text) {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return false;

  return [
    "company scale",
    "조직 크기",
    "조직 규모",
    "인원 관리",
    "예산 권한",
    "보고선",
    "팀 규모",
    "headcount",
    "budget",
  ].some((token) => normalized.includes(token));
}

function matchesGenericWeakening(text, weakeningTaxonomies = []) {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) return true;

  const hasAbstractWeakening = weakeningTaxonomies.some((taxonomy) => toStr(taxonomy?.id) === "ABSTRACT_CAPABILITY_KEYWORD_WEAKENING");
  const hasPerformanceWeakening = weakeningTaxonomies.some((taxonomy) => toStr(taxonomy?.id) === "PERFORMANCE_LANGUAGE_WEAKENING");
  const hasTaskWeakening = weakeningTaxonomies.some((taxonomy) => toStr(taxonomy?.id) === "TASK_CONTENT_WEAKENING");
  const hasDomainWeakening = weakeningTaxonomies.some((taxonomy) => toStr(taxonomy?.id) === "DOMAIN_IRRELEVANT_EXPERIENCE_WEAKENING");
  const hasOutputWeakening = weakeningTaxonomies.some((taxonomy) => toStr(taxonomy?.id) === "OUTPUT_PERSUASIVENESS_WEAKENING");

  if (containsForbiddenInference(normalized)) return true;
  if (hasAbstractWeakening && /(커뮤니케이션|문제 해결|리더십|역량|적응 가능)/.test(normalized)) return true;
  if (hasPerformanceWeakening && /(열심히|잘 해냈|수행했|진행했|경험이 있)/.test(normalized)) return true;
  if (hasTaskWeakening && /(지원성 업무|운영 보조|보조 업무|단순 지원)/.test(normalized)) return true;
  if (hasDomainWeakening && /(유사한 경험|어느 산업이든|적응 가능)/.test(normalized)) return true;
  if (hasOutputWeakening && /(자료를 만들|문서를 써본|문서 작성)/.test(normalized)) return true;
  return false;
}

function finalizeQuestionLines(pointSlots = [], weakeningTaxonomies = []) {
  const seenAxisKeys = new Set();
  const seenAxisGroups = new Set();
  const selected = [];

  toArr(pointSlots)
    .filter(Boolean)
    .filter((slot) => !matchesGenericWeakening(slot.text, weakeningTaxonomies))
    .forEach((slot) => {
      const axisKey = toStr(slot.axisKey);
      const axisGroup = toStr(slot.axisGroup);
      if (!axisKey || !slot.text) return;
      if (seenAxisKeys.has(axisKey)) return;
      if (!slot.isCore && seenAxisGroups.has(axisGroup)) return;
      seenAxisKeys.add(axisKey);
      seenAxisGroups.add(axisGroup);
      selected.push({
        axisKey,
        axisGroup,
        text: ensureQuestion(slot.text),
      });
    });

  return selected.slice(0, MAX_POINT_COUNT);
}

function buildInterviewPromptTitle({ generationTags, labels, evidenceTaxonomy }) {
  const targetJobLabel = toStr(labels?.targetJobLabel) || "목표 직무";
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  if (toStr(generationTags?.promptFamily) === "INDUSTRY_CONTEXT") {
    return `${targetIndustryLabel}처럼 고객 구조와 의사결정 방식이 다른 환경에서도, 지금 경험을 바로 연결할 수 있다고 보시는 이유가 무엇인가요`;
  }

  if (toStr(generationTags?.promptFamily) === "SCOPE_TRANSLATION") {
    return `${targetJobLabel} 기준으로 봤을 때, 지금까지 맡아 온 역할 중 어디까지를 직접 책임졌다고 설명하실 건가요`;
  }

  switch (toStr(evidenceTaxonomy?.id)) {
    case "PROCESS_PROOF_SHIFT":
      return `${targetJobLabel}에서 필요한 판단 방식과 실행 순서를, 지금 경험으로 어떻게 설명하실 건가요`;
    case "OUTPUT_EVIDENCE_SHIFT":
      return `${targetJobLabel}에서 바로 쓸 수 있는 결과물을, 지금 경험 안에서 무엇으로 보여주실 건가요`;
    case "PERFORMANCE_METRIC_SHIFT":
      return `${targetJobLabel} 기준에서 의미 있는 성과로, 지금 경험을 어떻게 다시 말하실 건가요`;
    default:
      return `${targetJobLabel}에 맞는 사람이라는 점을, 지금 경험으로 가장 먼저 어떻게 설명하실 건가요`;
  }
}

function buildInterviewAnswerPoint({ generationTags, labels }) {
  const targetJobLabel = toStr(labels?.targetJobLabel) || "목표 직무";
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";
  const targetStructureTags = toArr(generationTags?.targetStructureTags);
  const sourceExperienceType = toStr(generationTags?.sourceExperienceType);

  if (toStr(generationTags?.promptFamily) === "INDUSTRY_CONTEXT") {
    if (targetStructureTags.includes("PUBLIC_PROCESS")) {
      return `답변에서는 빠르게 처리한 경험보다 기준을 맞추고 설명 책임까지 챙긴 방식으로 풀어야 ${targetIndustryLabel} 맥락과 연결됩니다.`;
    }
    if (targetStructureTags.includes("EXPERT_BUYING")) {
      return `답변에서는 단순 수행보다 고객의 질문을 어떻게 구조화했고, 여러 검토 단계를 어떻게 버텼는지로 풀어야 ${targetIndustryLabel} 쪽 설득력이 생깁니다.`;
    }
    return `답변에서는 익숙한 업계 경험이 아니라, 낯선 맥락에서도 고객 구조와 운영 문맥을 읽고 일한 방식이 있었다는 점을 먼저 보여줘야 합니다.`;
  }

  if (toStr(generationTags?.promptFamily) === "SCOPE_TRANSLATION") {
    return `답변에서는 한 일을 길게 나열하지 말고, ${targetJobLabel} 기준으로 어디까지 판단했고 누구와 조율했는지를 먼저 꺼내는 편이 좋습니다.`;
  }

  if (sourceExperienceType === "STAKEHOLDER_COORDINATION") {
    return `답변에서는 여러 요청을 받아 처리했다는 설명보다, 이해관계자 요구를 묶어 실행 기준으로 정리한 장면을 먼저 말하는 편이 좋습니다.`;
  }

  if (sourceExperienceType === "PROCESS_DISCIPLINE") {
    return `답변에서는 성실하게 수행했다는 표현보다, 기준과 절차를 지키면서도 결과를 놓치지 않게 운영한 장면을 먼저 말하는 편이 좋습니다.`;
  }

  return `답변에서는 경험 유무보다 문제를 어떻게 나눠 보고 실행으로 연결했는지를 먼저 보여주는 편이 좋습니다.`;
}

function buildInterviewIntentLine({ generationTags, labels }) {
  const targetIndustryLabel = toStr(labels?.targetIndustryLabel) || "목표 산업";

  if (toStr(generationTags?.promptFamily) === "INDUSTRY_CONTEXT") {
    return `면접관은 ${targetIndustryLabel} 직접 경험 유무보다, 낯선 산업 문맥도 빠르게 해석해 자기 경험으로 번역할 수 있는지를 확인합니다.`;
  }

  if (toStr(generationTags?.promptFamily) === "SCOPE_TRANSLATION") {
    return "면접관은 업무 참여 여부보다, 역할 범위와 책임 깊이를 스스로 선명하게 구분해 설명하는지를 확인합니다.";
  }

  if (toStr(generationTags?.sourceExperienceType) === "REPEATED_ISSUE_READING") {
    return "면접관은 단순 수행 경험보다, 반복되는 문제를 읽고 원인을 구조화하는 해석 능력이 있는지를 확인합니다.";
  }

  return "면접관은 직접 경험의 양보다, 지금까지의 경험을 목표 맥락에 맞게 다시 설명하는 힘이 있는지를 먼저 확인합니다.";
}

function buildInterviewerQuestionCard(context = {}) {
  const boundaryTaxonomy = pickBoundaryTaxonomy(context);
  const evidenceTaxonomy = pickEvidenceTaxonomy({
    ...context,
    boundaryTaxonomy,
  });
  const crossTaxonomy = pickCrossTaxonomy({
    ...context,
    evidenceTaxonomy,
  });
  const weakeningTaxonomies = pickWeakeningTaxonomies({
    evidenceTaxonomy,
    boundaryTaxonomy,
  });

  const description = ensureSentence(buildQuestionDescription({ boundaryTaxonomy }));
  const pointSlots = [
    ...buildEvidencePointSlots({ evidenceTaxonomy, labels: context.labels }),
  ];
  const crossPoint = buildCrossPointSlot({
    crossTaxonomy,
    evidenceTaxonomy,
    labels: context.labels,
  });
  if (crossPoint) pointSlots.push(crossPoint);

  const finalizedPoints = finalizeQuestionLines(pointSlots, weakeningTaxonomies);
  const meta = {
    boundaryTaxonomyId: toStr(boundaryTaxonomy?.id),
    evidenceTaxonomyId: toStr(evidenceTaxonomy?.id),
    crossTaxonomyId: toStr(crossTaxonomy?.id),
    weakeningTaxonomyIds: weakeningTaxonomies.map((taxonomy) => toStr(taxonomy?.id)).filter(Boolean),
    boundaryDefinition: takeFirstLine(boundaryTaxonomy?.definition || boundaryTaxonomy?.boundaryShift),
    evidenceProofShift: takeFirstLine(evidenceTaxonomy?.proofShift),
    evidenceSignals: toArr(evidenceTaxonomy?.exampleSignals).slice(0, 2),
    crossSignals: toArr(crossTaxonomy?.exampleSignals).slice(0, 1),
    strengthFocusCandidates: uniqueStrings(toArr(crossTaxonomy?.whatGetsAmplified).slice(0, 2)),
    strengthFocusFallbackCandidates: uniqueStrings(toArr(evidenceTaxonomy?.whatGetsAmplified).slice(0, 2)),
    strengthProofCandidates: uniqueStrings(toArr(evidenceTaxonomy?.proofShift).slice(0, 2)),
    strengthSignalCandidates: uniqueStrings([
      ...toArr(evidenceTaxonomy?.exampleSignals).slice(0, 1),
      ...toArr(crossTaxonomy?.exampleSignals).slice(0, 1),
    ]).slice(0, 2),
    pointAxes: finalizedPoints.map((point) => point.axisKey),
    pointAxisGroups: finalizedPoints.map((point) => point.axisGroup),
  };
  const generationTags = buildTransitionLiteGenerationTags({
    classification: context.classification,
    selectedQuestionCardMeta: meta,
    currentJobItem: context.currentJobItem,
    targetJobItem: context.targetJobItem,
    targetIndustry: context.targetIndustry,
  });
  const title = ensureQuestion(buildInterviewPromptTitle({ generationTags, labels: context.labels, evidenceTaxonomy }));
  const answerPoint = ensureSentence(buildInterviewAnswerPoint({ generationTags, labels: context.labels }));
  const intentLine = ensureSentence(buildInterviewIntentLine({ generationTags, labels: context.labels }));

  return {
    intro: ensureSentence(
      buildIntroLine({
        evidenceTaxonomy,
        boundaryTaxonomy,
        labels: context.labels,
      })
    ),
    card:
      title && answerPoint && intentLine
        ? makeCard(
            "interviewer_verification",
            title,
            [answerPoint, intentLine, ...finalizedPoints.map((point) => point.text)].slice(0, 3)
          )
        : null,
    meta: {
      ...meta,
      generationTags,
    },
  };
}

export function buildTransitionReadBlock({
  currentJobLabel,
  targetJobLabel,
  currentIndustryLabel,
  targetIndustryLabel,
  classification,
  patternResult,
  currentJobItem,
  targetJobItem,
  targetIndustry,
} = {}) {
  const labels = {
    currentJobLabel: toStr(currentJobLabel) || "현재 직무",
    targetJobLabel: toStr(targetJobLabel) || "목표 직무",
    currentIndustryLabel: toStr(currentIndustryLabel),
    targetIndustryLabel: toStr(targetIndustryLabel),
  };

  const mainPattern = toStr(patternResult?.mainPattern);
  const supportPatterns = uniqueStrings(
    toArr(patternResult?.supportPatterns).map((patternKey) => toStr(patternKey))
  ).slice(0, 2);
  const questionCardResult = buildInterviewerQuestionCard({
    classification,
    patternResult,
    labels,
    currentJobItem,
    targetJobItem,
    targetIndustry,
  });

  return {
    sectionTitle: SECTION_TITLE,
    intro: questionCardResult.intro,
    cards: questionCardResult.card ? [questionCardResult.card].slice(0, MAX_TOTAL_CARD_COUNT) : [],
    meta: {
      mainPattern,
      displaySupportPatterns: supportPatterns,
      currentJobLabel: labels.currentJobLabel,
      targetJobLabel: labels.targetJobLabel,
      currentIndustryLabel: labels.currentIndustryLabel,
      targetIndustryLabel: labels.targetIndustryLabel,
      classification:
        classification && typeof classification === "object"
          ? { ...classification }
          : null,
      selectedQuestionCard: questionCardResult.meta,
    },
  };
}

export default buildTransitionReadBlock;
