function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeText(value) {
  return toStr(value).toLowerCase();
}

function uniqueStrings(items = []) {
  const seen = new Set();
  return toArr(items)
    .map((item) => toStr(item))
    .filter((item) => {
      if (!item) return false;
      const key = item.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getPrimaryFamily(jobItem) {
  const families = toArr(jobItem?.families);
  return families.length > 0 && families[0] && typeof families[0] === "object" ? families[0] : null;
}

function getJobResponsibilityHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.responsibilityHints));
}

function getJobLevelHints(jobItem) {
  return toArr(jobItem?.roles).flatMap((role) => toArr(role?.levelHints));
}

function includesAny(source, candidates = []) {
  const text = normalizeText(source);
  return candidates.some((candidate) => text.includes(normalizeText(candidate)));
}

function countSignalHits(sourceSignals = [], candidates = []) {
  return sourceSignals.reduce(
    (count, item) => (includesAny(item, candidates) ? count + 1 : count),
    0
  );
}

function takeCurrentSourceTexts(currentJobItem) {
  return uniqueStrings([
    ...toArr(getPrimaryFamily(currentJobItem)?.strongSignals),
    ...getJobResponsibilityHints(currentJobItem),
    ...getJobLevelHints(currentJobItem),
    toStr(getPrimaryFamily(currentJobItem)?.summaryTemplate),
  ]);
}

function pickSourceExperienceType(currentJobItem) {
  const sourceSignals = takeCurrentSourceTexts(currentJobItem);

  if (sourceSignals.some((item) => includesAny(item, ["협업", "조율", "이해관계자", "커뮤니케이션", "보고"]))) {
    return "STAKEHOLDER_COORDINATION";
  }

  if (sourceSignals.some((item) => includesAny(item, ["우선순위", "리스크", "이슈", "범위", "일정"]))) {
    return "PRIORITY_HANDLING";
  }

  if (sourceSignals.some((item) => includesAny(item, ["절차", "기준", "프로세스", "통제", "점검", "정합성", "품질"]))) {
    return "PROCESS_DISCIPLINE";
  }

  if (sourceSignals.some((item) => includesAny(item, ["모니터링", "운영", "현장", "흐름", "병목"]))) {
    return "FLOW_OBSERVATION";
  }

  if (sourceSignals.some((item) => includesAny(item, ["분석", "원인", "문의", "VOC", "문제 정의", "해석"]))) {
    return "REPEATED_ISSUE_READING";
  }

  return "PRIORITY_HANDLING";
}

function pickSourceExperienceNuance(currentJobItem) {
  const sourceSignals = takeCurrentSourceTexts(currentJobItem);
  const customerKeywords = ["고객", "사용자", "유저", "문의", "VOC", "상담", "안내", "피드백", "여정"];
  const crossFunctionalKeywords = ["협업", "이해관계자", "유관부서", "조율", "핸드오프", "에스컬레이션", "파트너", "커뮤니케이션", "보고"];
  const complianceStrongKeywords = ["감사", "통제", "준수", "정합", "오류", "규정", "내부회계", "컴플라이언스", "RCM"];
  const complianceSupportKeywords = ["절차", "기준", "정확", "점검", "리스크", "정책"];
  const operationsKeywords = ["운영", "프로세스", "흐름", "병목", "모니터링", "SLA", "큐", "일정", "처리", "현황"];

  const customerHits = countSignalHits(sourceSignals, customerKeywords);
  const crossFunctionalHits = countSignalHits(sourceSignals, crossFunctionalKeywords);
  const complianceStrongHits = countSignalHits(sourceSignals, complianceStrongKeywords);
  const complianceSupportHits = countSignalHits(sourceSignals, complianceSupportKeywords);
  const operationsHits = countSignalHits(sourceSignals, operationsKeywords);

  if (customerHits >= 2) {
    return "CUSTOMER_FACING";
  }

  if (crossFunctionalHits >= 2) {
    return "CROSS_FUNCTIONAL";
  }

  if (
    complianceStrongHits >= 2 ||
    (complianceStrongHits >= 1 &&
      complianceSupportHits >= 2 &&
      customerHits === 0 &&
      crossFunctionalHits === 0)
  ) {
    return "COMPLIANCE_SENSITIVE";
  }

  if (customerHits >= 1) {
    return "CUSTOMER_FACING";
  }

  if (crossFunctionalHits >= 1) {
    return "CROSS_FUNCTIONAL";
  }

  if (operationsHits >= 1) {
    return "OPERATIONS";
  }

  return "";
}

function pickTargetStructureTags(targetIndustry = {}) {
  const tags = [];
  const regulationBarrier = normalizeText(targetIndustry?.regulationBarrier);
  const buyingMotion = uniqueStrings(toArr(targetIndustry?.buyingMotion).length > 0 ? targetIndustry.buyingMotion : [targetIndustry?.buyingMotion]).join(" ");
  const decisionStructure = uniqueStrings(toArr(targetIndustry?.decisionStructure).length > 0 ? targetIndustry.decisionStructure : [targetIndustry?.decisionStructure]).join(" ");
  const customerMarket = normalizeText(targetIndustry?.customerMarket);
  const salesCycle = normalizeText(targetIndustry?.salesCycle);
  const coreContext = uniqueStrings(toArr(targetIndustry?.coreContext)).join(" ");

  if (/high|medium_high|규제|인허가|법령|감사|조달|정산|내부통제/.test(regulationBarrier)) {
    tags.push("REGULATED");
  }

  if (/long|mid_long/.test(salesCycle)) {
    tags.push("LONG_CYCLE");
  }

  if (
    /b2g/.test(customerMarket) ||
    /공공|예산|정책|조달|감사|승인/.test(`${decisionStructure} ${regulationBarrier}`)
  ) {
    tags.push("PUBLIC_PROCESS");
  }

  if (
    /제안|계약|프로젝트형|자문계약형|검토|경영진|구매부서|구매팀|구매 담당|구매 의사결정|구매 검토|도입 검토|승인 절차|투자|의사결정/.test(`${buyingMotion} ${decisionStructure}`)
  ) {
    tags.push("EXPERT_BUYING");
  }

  if (
    /현장|운영|안전|품질|설비|sla|전환 리스크|업무 연속성|프로젝트 단계/.test(`${regulationBarrier} ${coreContext}`)
  ) {
    tags.push("FIELD_CONSTRAINT");
  }

  return uniqueStrings(tags);
}

function pickPrimaryRiskKey(classification = {}, selectedQuestionCardMeta = {}) {
  const boundaryTaxonomyId = toStr(selectedQuestionCardMeta?.boundaryTaxonomyId);
  const evidenceTaxonomyId = toStr(selectedQuestionCardMeta?.evidenceTaxonomyId);
  const industryDistance = toStr(classification?.industryDistance);
  const jobDistance = toStr(classification?.jobDistance);
  const responsibilityShift = toStr(classification?.responsibilityShift);

  if (boundaryTaxonomyId === "INDUSTRY_SPECIALIZED_ROLE_SHIFT" || (jobDistance === "same" && industryDistance !== "same")) {
    return "RISK_INDUSTRY_CONTEXT_SHIFT";
  }

  if (
    boundaryTaxonomyId === "ADJACENT_ROLE_SHIFT" ||
    evidenceTaxonomyId === "RELATIONSHIP_POSITION_PROOF_SHIFT" ||
    responsibilityShift === "slightly_up" ||
    responsibilityShift === "meaningfully_up"
  ) {
    return "RISK_SCOPE_REINTERPRETATION";
  }

  return "RISK_JOB_EXPECTATION_SHIFT";
}

function pickPromptFamily(primaryRiskKey, targetStructureTags = []) {
  if (primaryRiskKey === "RISK_INDUSTRY_CONTEXT_SHIFT") return "INDUSTRY_CONTEXT";
  if (primaryRiskKey === "RISK_SCOPE_REINTERPRETATION") return "SCOPE_TRANSLATION";
  if (targetStructureTags.includes("PUBLIC_PROCESS")) return "PUBLIC_TRANSLATION";
  return "GENERAL_TRANSLATION";
}

export function buildTransitionLiteGenerationTags({
  classification,
  selectedQuestionCardMeta,
  currentJobItem,
  targetJobItem,
  targetIndustry,
} = {}) {
  const primaryRiskKey = pickPrimaryRiskKey(classification, selectedQuestionCardMeta);
  const sourceExperienceType = pickSourceExperienceType(currentJobItem);
  const sourceExperienceNuance = pickSourceExperienceNuance(currentJobItem);
  const targetStructureTags = pickTargetStructureTags(targetIndustry);

  return {
    primaryRiskKey,
    sourceExperienceType,
    sourceExperienceNuance,
    targetStructureTags,
    promptFamily: pickPromptFamily(primaryRiskKey, targetStructureTags),
    boundaryTaxonomyId: toStr(selectedQuestionCardMeta?.boundaryTaxonomyId),
    evidenceTaxonomyId: toStr(selectedQuestionCardMeta?.evidenceTaxonomyId),
    targetJobFamilyId: toStr(getPrimaryFamily(targetJobItem)?.id),
    targetIndustrySector: toStr(targetIndustry?.sector),
  };
}

export default buildTransitionLiteGenerationTags;
