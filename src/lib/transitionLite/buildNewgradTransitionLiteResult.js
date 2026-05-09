import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";
import {
  buildTransitionLiteTargetJobRead,
  buildTransitionLiteTargetIndustryRead,
} from "../../data/transitionLite/targetReadAdapter.js";
import { buildJobContext } from "../adapters/buildJobContext.js";
import { buildIndustryContext } from "../adapters/buildIndustryContext.js";
import { buildTaxonomyContextPack } from "../shared/taxonomy/buildTaxonomyContextPack.js";
import { buildNewgradAxisPack } from "../analysis/buildNewgradAxisPack.js";
import { normalizeNewgradSelfReportTraits } from "./normalizeNewgradSelfReportTraits.js";
import { normalizeNewgradExperienceInput } from "./normalizeNewgradExperienceInput.js";
import {
  getNewgradCertRegistryEntryByLabel,
  getNewgradCertRegistryEntryById,
  evaluateNewgradCertForTarget,
} from "./newgradCertRegistry.js";
import certCatalog from "../ontology/certs/cert_catalog.v0.json" with { type: "json" };
import certRules from "../ontology/certs/cert_rules.v0.json" with { type: "json" };
import roleCertMatrix from "../ontology/certs/role_cert_matrix.v0.json" with { type: "json" };
import { buildNewgradPreparationWhatIfPreviewPack } from "../analysis/whatIf/buildNewgradPreparationWhatIfPreviewPack.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeCertToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

function appendIndexEntry(indexMap, token, entry) {
  if (!token) return;
  const nextItems = indexMap.get(token) || [];
  nextItems.push(entry);
  indexMap.set(token, nextItems);
}

function buildPhase1CertBridgeConfig() {
  const certEntries = Array.isArray(certCatalog?.certs) ? certCatalog.certs : [];
  const matrixEntries = Array.isArray(roleCertMatrix?.matrix) ? roleCertMatrix.matrix : [];
  const ruleSignals = Array.isArray(certRules?.jdSignalMapping?.signals) ? certRules.jdSignalMapping.signals : [];

  const phase1Families = new Set(["role:cloud", "role:security"]);
  const phase1RoleFamiliesByCertId = new Map();
  const allKnownCertIds = new Set();

  for (const matrixEntry of matrixEntries) {
    const roleFamilyId = toStr(matrixEntry?.roleFamilyId);
    for (const section of [matrixEntry?.defaults, ...(Object.values(matrixEntry?.bySeniority || {}))]) {
      for (const bucketName of ["preferred", "optionalPlus"]) {
        for (const item of toArr(section?.[bucketName])) {
          const certId = toStr(item?.certId);
          if (!certId) continue;
          allKnownCertIds.add(certId);
          if (!phase1Families.has(roleFamilyId)) continue;
          const nextFamilies = new Set(phase1RoleFamiliesByCertId.get(certId) || []);
          nextFamilies.add(roleFamilyId === "role:cloud" ? "cloud" : "security");
          phase1RoleFamiliesByCertId.set(certId, [...nextFamilies]);
        }
      }
    }
  }

  const certById = new Map(certEntries.map((item) => [toStr(item?.id), item]));
  const catalogPhase1Index = new Map();
  const catalogAllIndex = new Map();
  const rulesPhase1Index = new Map();

  for (const certEntry of certEntries) {
    const certId = toStr(certEntry?.id);
    if (!certId) continue;
    const isPhase1 = phase1RoleFamiliesByCertId.has(certId);
    const catalogTokens = [];
    const canonicalName = toStr(certEntry?.canonicalName);
    if (canonicalName) {
      catalogTokens.push({ token: canonicalName, matchType: "label_exact" });
      const normalizedToken = normalizeCertToken(canonicalName);
      if (normalizedToken && normalizedToken !== canonicalName) {
        catalogTokens.push({ token: normalizedToken, matchType: "normalized_exact" });
      }
    }
    for (const alias of toArr(certEntry?.aliases)) {
      const aliasText = toStr(alias);
      if (!aliasText) continue;
      catalogTokens.push({ token: aliasText, matchType: "alias_exact" });
      const normalizedToken = normalizeCertToken(aliasText);
      if (normalizedToken && normalizedToken !== aliasText) {
        catalogTokens.push({ token: normalizedToken, matchType: "normalized_exact" });
      }
    }

    for (const entry of catalogTokens) {
      appendIndexEntry(catalogAllIndex, entry.token, { certId, matchType: entry.matchType, source: "catalog" });
      if (isPhase1) {
        appendIndexEntry(catalogPhase1Index, entry.token, { certId, matchType: entry.matchType, source: "catalog" });
      }
    }
  }

  for (const signal of ruleSignals) {
    const certId = toStr(signal?.certId);
    if (!certId || !phase1RoleFamiliesByCertId.has(certId)) continue;
    for (const keyword of toArr(signal?.keywords)) {
      const keywordText = toStr(keyword);
      if (!keywordText) continue;
      appendIndexEntry(rulesPhase1Index, keywordText, { certId, matchType: "normalized_exact", source: "rules" });
      const normalizedToken = normalizeCertToken(keywordText);
      if (normalizedToken && normalizedToken !== keywordText) {
        appendIndexEntry(rulesPhase1Index, normalizedToken, { certId, matchType: "normalized_exact", source: "rules" });
      }
    }
  }

  return {
    certById,
    allKnownCertIds,
    phase1RoleFamiliesByCertId,
    catalogPhase1Index,
    catalogAllIndex,
    rulesPhase1Index,
  };
}

const PHASE1_CERT_BRIDGE = buildPhase1CertBridgeConfig();
const PHASE1_TARGET_ROLE_FAMILY_BY_JOB_ID = {
  JOB_IT_DATA_DIGITAL_DEVOPS_INFRA: "cloud",
  JOB_IT_DATA_DIGITAL_SECURITY: "security",
};

function buildRegistryMappedCertItem(baseItem = {}, registryEntry = null) {
  if (!registryEntry) return baseItem;
  return {
    ...baseItem,
    normalizedLabel: toStr(registryEntry.displayLabel) || baseItem.normalizedLabel,
    canonicalHint: toStr(registryEntry.canonicalId) || null,
    normalizationStatus: "normalized",
    mappingStatus: "mapped",
    mappedFrom: "registry_exact",
    registryCertId: toStr(registryEntry.canonicalId),
    registryFamily: toStr(registryEntry.family),
    registryScoreClass: toStr(registryEntry.scoreClass),
    registryAllowedAxes: toArr(registryEntry.allowedAxes).map((item) => toStr(item)).filter(Boolean),
    duplicateCapGroup: toStr(registryEntry.duplicateCapGroup) || toStr(registryEntry.family),
    explanationVisibility: toStr(registryEntry.explanationVisibility) || "full",
    registryNotes: toStr(registryEntry.notes),
  };
}

function resolveCertCatalogMatch(rawLabel) {
  const label = toStr(rawLabel);
  if (!label) return null;

  const directCatalogMatches = PHASE1_CERT_BRIDGE.catalogPhase1Index.get(label) || [];
  if (directCatalogMatches.length === 1) {
    return { kind: "mapped", ...directCatalogMatches[0] };
  }
  if (directCatalogMatches.length > 1) {
    return { kind: "ambiguous" };
  }

  const normalizedLabel = normalizeCertToken(label);
  const normalizedCatalogMatches = PHASE1_CERT_BRIDGE.catalogPhase1Index.get(normalizedLabel) || [];
  if (normalizedCatalogMatches.length === 1) {
    return { kind: "mapped", ...normalizedCatalogMatches[0] };
  }
  if (normalizedCatalogMatches.length > 1) {
    return { kind: "ambiguous" };
  }

  const directRulesMatches = PHASE1_CERT_BRIDGE.rulesPhase1Index.get(label) || [];
  const normalizedRulesMatches = PHASE1_CERT_BRIDGE.rulesPhase1Index.get(normalizedLabel) || [];
  if (directRulesMatches.length > 0 || normalizedRulesMatches.length > 0) {
    return { kind: "ambiguous" };
  }

  const knownCatalogMatches = [
    ...(PHASE1_CERT_BRIDGE.catalogAllIndex.get(label) || []),
    ...(PHASE1_CERT_BRIDGE.catalogAllIndex.get(normalizedLabel) || []),
  ];
  if (knownCatalogMatches.length > 0) {
    return { kind: "unsupported" };
  }

  return { kind: "raw_only" };
}

function applyPhase1CertMapping(item) {
  if (!item || typeof item !== "object") return item;
  if (item.normalizationStatus === "malformed") {
    return {
      ...item,
      mappingStatus: "malformed",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }
  if (item.normalizationStatus === "unsupported") {
    return {
      ...item,
      mappingStatus: "unsupported",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }

  const resolved = resolveCertCatalogMatch(item.rawLabel);
  if (!resolved || resolved.kind === "raw_only") {
    return {
      ...item,
      mappingStatus: "raw_only",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }
  if (resolved.kind === "unsupported") {
    return {
      ...item,
      mappingStatus: "unsupported",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }
  if (resolved.kind === "ambiguous") {
    return {
      ...item,
      mappingStatus: "ambiguous",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }

  const certEntry = PHASE1_CERT_BRIDGE.certById.get(resolved.certId);
  const phase1RoleFamilies = toArr(PHASE1_CERT_BRIDGE.phase1RoleFamiliesByCertId.get(resolved.certId));
  return {
    ...item,
    normalizedLabel: toStr(certEntry?.canonicalName) || item.normalizedLabel,
    canonicalHint: resolved.certId,
    mappingStatus: "mapped",
    mappedFrom: resolved.matchType,
    phase1RoleFamilies,
    bridgeVersion: "phase1",
  };
}

function normalizeCertJobLabelToken(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()（）]/g, "")
    .replace(/[·ㆍ]/g, "")
    .replace(/[\/\\_-]/g, "");
}

const CERT_TARGET_JOB_LABEL_BY_ID = {
  "JOB_FINANCE_ACCOUNTING_ACCOUNTING": "회계",
  "JOB_FINANCE_ACCOUNTING_TAX": "세무",
  "JOB_FINANCE_ACCOUNTING_FINANCE": "재무",
  "JOB_FINANCE_ACCOUNTING_TREASURY": "자금",
  "JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING": "관리회계",
  "JOB_FINANCE_ACCOUNTING_IR_DISCLOSURE": "IR / 공시",
  "JOB_FINANCE_ACCOUNTING_FP_AND_A": "경영분석 / FP&A",
  "JOB_FINANCE_ACCOUNTING_INTERNAL_CONTROL": "내부회계 / 내부통제",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT": "생산관리",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING": "생산기술",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING": "공정기술",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL": "품질관리(QC)",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA": "품질보증(QA/SQA)",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE": "설비관리 / 유지보수",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL": "설비제어 / 자동제어",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY": "안전환경",
  "JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION": "제조혁신 / 생산혁신",
  "JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN": "기구설계",
  "JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN": "회로설계",
  "JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN": "전장/전기설계",
  "JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT": "소프트웨어개발",
  "JOB_ENGINEERING_DEVELOPMENT_TESTING_VALIDATION": "테스트 / 검증",
  "JOB_ENGINEERING_DEVELOPMENT_RESEARCH_AND_DEVELOPMENT": "연구개발(R&D)",
  "JOB_ENGINEERING_DEVELOPMENT_TECHNICAL_SUPPORT_FIELD_ENGINEERING": "기술지원 / 필드엔지니어",
  "JOB_RESEARCH_PROFESSIONAL_TECHNICAL_RESEARCH": "기술연구",
  "JOB_RESEARCH_PROFESSIONAL_MARKET_INDUSTRY_RESEARCH": "시장/산업연구",
  "JOB_RESEARCH_PROFESSIONAL_CONSULTING": "컨설팅",
  "JOB_RESEARCH_PROFESSIONAL_REGULATORY_AFFAIRS": "규제대응 / RA / 인증",
  "JOB_PUBLIC_ADMINISTRATION_SUPPORT_CIVIL_SERVICE_FIELD_SUPPORT": "민원 / 현장지원",
};

function resolveSubJobRelevanceStatus(registryEntry, targetJobId, targetJobLabel) {
  const directLabels = toArr(registryEntry?.axis2?.directTargetJobLabels).map(toStr).filter(Boolean);
  const adjacentLabels = toArr(registryEntry?.axis2?.adjacentTargetJobLabels).map(toStr).filter(Boolean);
  const strictGating = registryEntry?.axis2?.strictTargetJobGating === true;
  const hasSubJobMapping = directLabels.length > 0 || adjacentLabels.length > 0;
  if (!hasSubJobMapping) return "no_mapping";
  const mappedLabel = CERT_TARGET_JOB_LABEL_BY_ID[toStr(targetJobId)];
  const jobTokens = [mappedLabel, targetJobLabel, targetJobId].filter(Boolean).map(normalizeCertJobLabelToken);
  const isDirectMatch = directLabels.some((label) => {
    const tok = normalizeCertJobLabelToken(label);
    return jobTokens.some((jt) => jt === tok);
  });
  if (isDirectMatch) return "direct";
  const isAdjacentMatch = adjacentLabels.some((label) => {
    const tok = normalizeCertJobLabelToken(label);
    return jobTokens.some((jt) => jt === tok);
  });
  if (isAdjacentMatch) return "adjacent";
  if (strictGating) return "gated_out";
  return "no_mapping";
}

function buildPhase1CertRoleRelevancePack(targetJobId, normalizedCertSelections, targetJobLabel = "") {
  const normalizedTargetJobId = toStr(targetJobId);
  const targetRoleFamily = PHASE1_TARGET_ROLE_FAMILY_BY_JOB_ID[normalizedTargetJobId] || "";
  const sourcePack = normalizedCertSelections && typeof normalizedCertSelections === "object"
    ? normalizedCertSelections
    : { status: "invalid", items: [] };
  const sourceItems = toArr(sourcePack.items);

  const items = sourceItems.map((item) => {
    const safeItem = item && typeof item === "object" ? item : {};
    const registryEntry = getNewgradCertRegistryEntryById(toStr(safeItem.registryCertId));
    if (registryEntry) {
      const registryEvaluation = evaluateNewgradCertForTarget(registryEntry, normalizedTargetJobId, targetJobLabel);
      const scoreClass = toStr(safeItem.registryScoreClass);
      let relevanceStatus = "non_target";
      let relevanceReason = registryEvaluation.axis2Reason;

      if (registryEvaluation.axis2Eligible) {
        const subJobStatus = resolveSubJobRelevanceStatus(registryEntry, normalizedTargetJobId, targetJobLabel);
        if (subJobStatus === "direct") {
          relevanceStatus = "direct_relevant";
          relevanceReason = "sub_job_direct_match";
        } else if (subJobStatus === "adjacent") {
          relevanceStatus = "adjacent_relevant";
          relevanceReason = "sub_job_adjacent_match";
        } else if (subJobStatus === "gated_out") {
          relevanceStatus = "non_target";
          relevanceReason = "sub_job_gating_miss";
        } else {
          relevanceStatus = scoreClass === "domain_specific" ? "direct_relevant" : "adjacent_relevant";
        }
      } else if (scoreClass === "explanation_only") {
        relevanceStatus = "explanation_only";
        relevanceReason = "registry_explanation_only";
      } else if (scoreClass === "exclude_from_score") {
        relevanceStatus = "excluded";
        relevanceReason = "registry_excluded";
      }

      return {
        ...safeItem,
        relevanceStatus,
        relevanceReason,
        axis4CommunicationEligible: registryEvaluation.axis4Eligible,
        axis4CommunicationReason: registryEvaluation.axis4Reason,
        axis4CommunicationWeight: registryEvaluation.axis4Weight,
        adapterVersion: "newgrad_registry_v1",
      };
    }

    const mappingStatus = toStr(safeItem.mappingStatus);
    const phase1RoleFamilies = toArr(safeItem.phase1RoleFamilies);

    if (!targetRoleFamily) {
      return {
        ...safeItem,
        relevanceStatus: mappingStatus === "malformed" ? "malformed" : "unsupported",
        relevanceReason: mappingStatus === "malformed" ? "source_malformed" : "target_job_out_of_phase1_scope",
        adapterVersion: "phase1",
      };
    }

    if (mappingStatus === "malformed") {
      return {
        ...safeItem,
        relevanceStatus: "malformed",
        relevanceReason: "source_malformed",
        adapterVersion: "phase1",
      };
    }

    if (mappingStatus !== "mapped") {
      return {
        ...safeItem,
        relevanceStatus: "unsupported",
        relevanceReason: `mapping_${mappingStatus || "unknown"}`,
        adapterVersion: "phase1",
      };
    }

    if (phase1RoleFamilies.includes(targetRoleFamily)) {
      return {
        ...safeItem,
        relevanceStatus: "direct_relevant",
        relevanceReason: "role_family_exact",
        adapterVersion: "phase1",
      };
    }

    return {
      ...safeItem,
      relevanceStatus: "non_target",
      relevanceReason: "phase1_role_family_mismatch",
      adapterVersion: "phase1",
    };
  });

  const total = items.length;
  const directRelevantCount = items.filter((item) => item.relevanceStatus === "direct_relevant").length;
  const adjacentRelevantCount = items.filter((item) => item.relevanceStatus === "adjacent_relevant").length;
  const nonTargetCount = items.filter((item) => item.relevanceStatus === "non_target").length;
  const unsupportedCount = items.filter((item) => item.relevanceStatus === "unsupported").length;
  const malformedCount = items.filter((item) => item.relevanceStatus === "malformed").length;

  let status = "ok";
  if (total <= 0) {
    status = "empty";
  } else if (!targetRoleFamily) {
    status = malformedCount === total ? "invalid" : "unsupported";
  } else if (malformedCount === total) {
    status = "invalid";
  } else if (unsupportedCount > 0 || malformedCount > 0) {
    status = "partial";
  }

  return {
    status,
    targetJobId: normalizedTargetJobId,
    targetRoleFamily: targetRoleFamily || null,
    items,
    meta: {
      total,
      directRelevantCount,
      adjacentRelevantCount,
      nonTargetCount,
      unsupportedCount,
      malformedCount,
    },
  };
}

function buildCertEvidencePack({
  certifications,
  normalizedCertSelections,
  certRoleRelevancePack,
} = {}) {
  const normalizedPack = normalizedCertSelections && typeof normalizedCertSelections === "object"
    ? normalizedCertSelections
    : { status: "invalid", items: [] };
  const relevancePack = certRoleRelevancePack && typeof certRoleRelevancePack === "object"
    ? certRoleRelevancePack
    : { status: "invalid", items: [], meta: {} };
  const sourceRows = toArr(normalizedPack.items);
  const relevanceItems = toArr(relevancePack.items);
  const rows = sourceRows.map((item, index) => {
    const relevanceItem = relevanceItems[index] && typeof relevanceItems[index] === "object"
      ? relevanceItems[index]
      : {};
    const rawLabel = toStr(item?.rawLabel);
    const normalizedLabel = toStr(item?.normalizedLabel);
    const displayLabel = normalizedLabel || rawLabel;
    const relevanceStatus = toStr(relevanceItem?.relevanceStatus);
    return {
      rowIndex: index,
      rawLabel,
      normalizedLabel,
      displayLabel,
      rawCategory: toStr(item?.rawCategory),
      rawSubcategory: toStr(item?.rawSubcategory),
      canonicalHint: toStr(item?.canonicalHint),
      normalizationStatus: toStr(item?.normalizationStatus),
      mappingStatus: toStr(item?.mappingStatus),
      mappedFrom: toStr(item?.mappedFrom),
      phase1RoleFamilies: toArr(item?.phase1RoleFamilies).map((family) => toStr(family)).filter(Boolean),
      registryCertId: toStr(item?.registryCertId || item?.canonicalHint),
      registryFamily: toStr(item?.registryFamily),
      registryScoreClass: toStr(item?.registryScoreClass),
      registryAllowedAxes: toArr(item?.registryAllowedAxes).map((axis) => toStr(axis)).filter(Boolean),
      duplicateCapGroup: toStr(item?.duplicateCapGroup),
      explanationVisibility: toStr(item?.explanationVisibility) || "full",
      registryNotes: toStr(item?.registryNotes),
      relevanceStatus,
      relevanceReason: toStr(relevanceItem?.relevanceReason),
      axis4CommunicationEligible: relevanceItem?.axis4CommunicationEligible === true,
      axis4CommunicationReason: toStr(relevanceItem?.axis4CommunicationReason),
      axis4CommunicationWeight: toStr(relevanceItem?.axis4CommunicationWeight),
      axisFitHints: {
        axis2: {
          aligned: relevanceStatus === "direct_relevant",
          weak: ["adjacent_relevant", "non_target"].includes(relevanceStatus),
          label: displayLabel,
        },
      },
    };
  });
  const sortedAxis2Candidates = rows
    .filter((row) =>
      ["direct_relevant", "adjacent_relevant"].includes(row.relevanceStatus)
      && !["explanation_only", "exclude_from_score", "communication_support"].includes(row.registryScoreClass)
    )
    .sort((left, right) => {
      const scorePriority = { domain_specific: 3, domain_adjacent: 2, tool_readiness: 1 };
      const weightPriority = { medium: 3, low: 2, very_low: 1, none: 0 };
      const leftEntry = getNewgradCertRegistryEntryById(left.registryCertId);
      const rightEntry = getNewgradCertRegistryEntryById(right.registryCertId);
      const leftWeight = toStr(leftEntry?.axis2?.weight);
      const rightWeight = toStr(rightEntry?.axis2?.weight);
      const leftScore = (scorePriority[left.registryScoreClass] || 0) * 10 + (weightPriority[leftWeight] || 0);
      const rightScore = (scorePriority[right.registryScoreClass] || 0) * 10 + (weightPriority[rightWeight] || 0);
      return rightScore - leftScore;
    });

  const appliedCountByGroup = new Map();
  const scoredRowMap = new Map();
  for (const row of sortedAxis2Candidates) {
    const groupKey = toStr(row.duplicateCapGroup || row.registryFamily || row.registryCertId || row.displayLabel);
    const appliedCount = Number(appliedCountByGroup.get(groupKey) || 0);
    let axis2ScoreSlot = "full";
    if (appliedCount >= 2) axis2ScoreSlot = "capped";
    else if (appliedCount >= 1) axis2ScoreSlot = "partial";
    appliedCountByGroup.set(groupKey, appliedCount + 1);
    scoredRowMap.set(row.rowIndex, { ...row, axis2ScoreSlot });
  }

  const cappedRows = rows.map((row) => scoredRowMap.get(row.rowIndex) || { ...row, axis2ScoreSlot: "none" });
  const alignedRows = cappedRows.filter((row) => row.axis2ScoreSlot === "full");
  const partialRows = cappedRows.filter((row) => row.axis2ScoreSlot === "partial");
  const weakRows = cappedRows.filter((row) => row.axis2ScoreSlot === "partial" || row.relevanceStatus === "non_target");
  const unsupportedRows = cappedRows.filter((row) => ["unsupported", "malformed", "excluded"].includes(row.relevanceStatus));
  const axis4CommunicationRows = cappedRows.filter((row) => row.axis4CommunicationEligible === true);

  return {
    version: "newgradCertEvidence.v1",
    source: Array.isArray(certifications) ? certifications : [],
    rows: cappedRows,
    scoringSummary: {
      eligibleCount: alignedRows.length + partialRows.length,
      alignedCount: alignedRows.length,
      weakCount: partialRows.length,
      unsupportedCount: unsupportedRows.length,
      alignedLevel: alignedRows.length > 0 ? "aligned" : partialRows.length > 0 ? "weak" : "none",
      familyCapApplied: cappedRows.some((row) => row.axis2ScoreSlot === "capped"),
    },
    axisFitHints: {
      axis2: {
        alignedCertLabels: firstUniqueLabels(alignedRows.map((row) => row.displayLabel), 3),
        weakCertLabels: firstUniqueLabels(weakRows.map((row) => row.displayLabel), 3),
      },
      axis4: {
        communicationCertLabels: firstUniqueLabels(axis4CommunicationRows.map((row) => row.displayLabel), 2),
      },
    },
    visibilityEvidence: {
      whyThisReadEligibleRows: cappedRows
        .filter((row) => row.explanationVisibility !== "hidden")
        .slice(0, 2)
        .map((row) => ({
        label: row.displayLabel,
        relevanceStatus: row.relevanceStatus,
      })).filter((row) => row.label),
      axisReadSummaryLabels: firstUniqueLabels(
        cappedRows
          .filter((row) => row.explanationVisibility !== "hidden")
          .map((row) => row.displayLabel),
        3
      ),
    },
  };
}

function buildSelfReportEvidencePack({
  strengths,
  workStyleNotes,
  selfReportProfile,
} = {}) {
  const profile = selfReportProfile && typeof selfReportProfile === "object"
    ? selfReportProfile
    : {};
  const strengthRows = toArr(profile.strengthEntries).map((entry) => ({
    id: toStr(entry?.id),
    label: toStr(entry?.label),
    axisFitHints: {
      axis5: {
        aligned: true,
        label: toStr(entry?.label),
      },
      axis4: {
        support: toArr(entry?.explanationEligibleAxes).includes("customerType"),
        label: toStr(entry?.label),
      },
    },
  })).filter((row) => row.id || row.label);
  const workStyleRows = toArr(profile.workStyleEntries).map((entry) => ({
    id: toStr(entry?.id),
    label: toStr(entry?.label),
    interactionEligible: entry?.interactionEligible === true,
    axisFitHints: {
      axis5: {
        aligned: true,
        label: toStr(entry?.label),
      },
      axis4: {
        support: entry?.interactionEligible === true,
        label: toStr(entry?.label),
      },
    },
  })).filter((row) => row.id || row.label);
  const noteItems = toArr(profile.rawWorkStyleLabels).map((label) => toStr(label)).filter(Boolean);

  return {
    version: "newgradSelfReportEvidence.v1",
    source: {
      strengths: Array.isArray(strengths) ? strengths : [],
      workStyleNotes: toStr(workStyleNotes),
    },
    strengthRows,
    workStyleRows,
    notesSummary: {
      rawLabels: noteItems,
      noteCount: noteItems.length,
      hasNotes: noteItems.length > 0,
    },
    scoringSummary: {
      strengthCount: strengthRows.length,
      workStyleCount: workStyleRows.length,
      hasAxis5Signal: strengthRows.length > 0 || workStyleRows.length > 0,
      axis4SupportStrengthCount: toArr(profile.axis4SupportStrengthLabels).length,
      interactionEligibleWorkStyleCount: toArr(profile.interactionEligibleWorkStyleKeys).length,
    },
    axisFitHints: {
      axis4: {
        supportStrengthLabels: toArr(profile.axis4SupportStrengthLabels).map((item) => toStr(item)).filter(Boolean),
        interactionEligibleWorkStyleLabels: toArr(profile.interactionEligibleWorkStyleLabels).map((item) => toStr(item)).filter(Boolean),
      },
      axis5: {
        strengthLabels: strengthRows.map((row) => row.label).filter(Boolean),
        workStyleLabels: workStyleRows.map((row) => row.label).filter(Boolean),
      },
    },
    visibilityEvidence: {
      whyThisReadEligibleRows: [
        ...strengthRows.slice(0, 2).map((row) => ({ kind: "strength", label: row.label })),
        ...workStyleRows.slice(0, 2).map((row) => ({ kind: "workstyle", label: row.label })),
      ].filter((row) => row.label),
      axisReadSummaryLabels: firstUniqueLabels([
        ...strengthRows.map((row) => row.label),
        ...workStyleRows.map((row) => row.label),
      ], 4),
    },
  };
}

function normalizeMajor(value) {
  if (value && typeof value === "object") {
    return toStr(value?.label || value?.subcategory || value?.category);
  }
  return toStr(value);
}

function normalizeEvidenceArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => {
    if (typeof item === "string") return Boolean(toStr(item));
    if (!item || typeof item !== "object") return false;
    return Object.values(item).some((entry) => {
      if (Array.isArray(entry)) return entry.length > 0;
      return Boolean(toStr(entry));
    });
  });
}

function summarizeCount(prefix, count) {
  if (!Number.isFinite(count) || count <= 0) return "";
  return `${prefix} ${count}건`;
}

function firstUniqueLabels(items, maxCount = 3) {
  const result = [];
  const seen = new Set();
  for (const item of toArr(items)) {
    const label = toStr(item);
    if (!label || seen.has(label)) continue;
    seen.add(label);
    result.push(label);
    if (result.length >= maxCount) break;
  }
  return result;
}

function getExperienceRowDisplayLabel(row) {
  const roleLabel = toStr(row?.normalizedRoleLabel);
  const typeLabel = toStr(row?.normalizedTypeLabel);
  const stakeholderLabel = toStr(row?.normalizedStakeholderLabel);
  if (roleLabel && stakeholderLabel) return `${roleLabel} · ${stakeholderLabel}`;
  return roleLabel || stakeholderLabel || typeLabel;
}

function buildExperienceEvidencePack(normalizedExperienceInput) {
  const safeInput = normalizedExperienceInput && typeof normalizedExperienceInput === "object"
    ? normalizedExperienceInput
    : {};
  const projectRows = toArr(safeInput.normalizedProjects);
  const internshipRows = toArr(safeInput.normalizedInternships);
  const contractRows = toArr(safeInput.normalizedPartTimeExperience).length > 0
    ? toArr(safeInput.normalizedPartTimeExperience)
    : toArr(safeInput.normalizedContractExperiences);
  const canonicalWorkRows = toArr(safeInput.canonicalWorkRows).length > 0
    ? toArr(safeInput.canonicalWorkRows)
    : [...internshipRows, ...contractRows];
  // Summary/visibility용 병합 행이다. scorer primary source로 쓰지 않는다.
  const mergedExperienceRows = toArr(safeInput.mergedExperienceRows).length > 0
    ? toArr(safeInput.mergedExperienceRows)
    : [...projectRows, ...canonicalWorkRows];

  const axis1DirectRoleLabels = firstUniqueLabels(
    [
      ...projectRows
        .filter((row) => toArr(row?.roleAxisEligible).includes("jobStructure"))
        .map((row) => row?.normalizedRoleLabel),
      ...internshipRows
        .filter((row) => toArr(row?.roleAxisEligible).includes("jobStructure"))
        .map((row) => row?.normalizedRoleLabel),
    ],
    3
  );
  const topRoleLabels = firstUniqueLabels(
    mergedExperienceRows.map((row) => row?.normalizedRoleLabel),
    3
  );
  const strongContextLabels = firstUniqueLabels(
    canonicalWorkRows
      .filter((row) => ["strong", "high"].includes(toStr(row?.stakeholderIndustryContextWeight)) || toStr(row?.industrySignalLevel) === "strong")
      .map((row) => getExperienceRowDisplayLabel(row)),
    3
  );
  const supportContextLabels = firstUniqueLabels(
    canonicalWorkRows
      .filter((row) => {
        const contextWeight = toStr(row?.stakeholderIndustryContextWeight);
        const industrySignal = toStr(row?.industrySignalLevel);
        if (["strong", "high"].includes(contextWeight) || industrySignal === "strong") return false;
        return Boolean(contextWeight && contextWeight !== "none")
          || (Boolean(industrySignal) && industrySignal !== "none");
      })
      .map((row) => getExperienceRowDisplayLabel(row)),
    3
  );
  const projectIndustryLabels = firstUniqueLabels(
    projectRows
      .filter((row) => {
        const signal = toStr(row?.industrySignalLevel);
        return Boolean(signal) && signal !== "none";
      })
      .map((row) => getExperienceRowDisplayLabel(row)),
    3
  );
  const topDurationLabels = firstUniqueLabels(
    canonicalWorkRows.map((row) => row?.normalizedDurationLabel),
    3
  );
  const topOutcomeLabels = firstUniqueLabels(
    projectRows.map((row) => row?.normalizedOutcomeLabel),
    3
  );
  const directStakeholderLabels = firstUniqueLabels(
    canonicalWorkRows
      .filter((row) => ["direct", "high"].includes(toStr(row?.stakeholderInteractionWeight)))
      .map((row) => row?.normalizedStakeholderLabel),
    3
  );
  const supportStakeholderLabels = firstUniqueLabels(
    canonicalWorkRows
      .filter((row) => {
        const weight = toStr(row?.stakeholderInteractionWeight);
        return Boolean(weight) && weight !== "none" && !["direct", "high"].includes(weight);
      })
      .map((row) => row?.normalizedStakeholderLabel),
    3
  );
  const whyThisReadEligibleRows = [
    ...projectRows.slice(0, 1),
    ...canonicalWorkRows.slice(0, 1),
  ].map((row) => ({
    sourceKind: toStr(row?.sourceKind),
    label: getExperienceRowDisplayLabel(row),
  })).filter((item) => item.label);
  const summaryEligibleRows = mergedExperienceRows
    .slice(0, 3)
    .map((row) => ({
      sourceKind: toStr(row?.sourceKind),
      label: getExperienceRowDisplayLabel(row),
    }))
    .filter((item) => item.label);

  return {
    version: "newgradExperienceEvidence.v1",
    projectRows,
    internshipRows,
    contractRows,
    canonicalWorkRows,
    mergedExperienceRows,
    roleEvidenceSummary: {
      axis1DirectRoleLabels,
      axis1AdjacentRoleLabels: [],
      topRoleLabels,
    },
    industryContextSummary: {
      strongContextLabels,
      supportContextLabels,
      projectIndustryLabels,
    },
    durationSummary: {
      topDurationLabels,
      maxDurationRank: canonicalWorkRows.reduce((max, row) => Math.max(max, Number(row?.durationRank || 0)), 0),
    },
    outcomeSummary: {
      topOutcomeLabels,
      maxOutcomeRank: projectRows.reduce((max, row) => Math.max(max, Number(row?.outcomeRank || 0)), 0),
    },
    stakeholderSummary: {
      directStakeholderLabels,
      supportStakeholderLabels,
    },
    axisFitHints: {
      axis1: {
        projectCount: projectRows.length,
        internshipCount: internshipRows.length,
        directRoleLabels: axis1DirectRoleLabels,
      },
      axis2: {
        workContextCount: canonicalWorkRows.length,
        strongContextLabels,
        supportContextLabels,
        projectIndustryLabels,
      },
      axis3: {
        projectCount: projectRows.length,
        workCount: canonicalWorkRows.length,
        topOutcomeLabels,
        topDurationLabels,
      },
      axis4: {
        workCount: canonicalWorkRows.length,
        directStakeholderLabels,
        supportStakeholderLabels,
      },
    },
    axis4InteractionEvidenceList: toArr(normalizedExperienceInput?.axis4InteractionEvidenceList),
    visibilityEvidence: {
      whyThisReadEligibleRows,
      summaryEligibleRows,
      comparisonHighlightLabels: firstUniqueLabels(
        [...projectIndustryLabels, ...topOutcomeLabels, ...directStakeholderLabels, ...topDurationLabels],
        4
      ),
    },
  };
}

function normalizeNewgradCertSelectionItem(item) {
  if (!item || typeof item !== "object") {
    const rawLabel = toStr(item);
    return {
      rawCategory: "",
      rawSubcategory: "",
      rawLabel,
      normalizedLabel: "",
      canonicalHint: null,
      normalizationStatus: rawLabel ? "unsupported" : "malformed",
      mappingStatus: rawLabel ? "unsupported" : "malformed",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }

  const rawCategory = toStr(item.category);
  const rawSubcategory = toStr(item.subcategory);
  const rawLabel = toStr(item.label);
  const registryEntry = rawLabel ? getNewgradCertRegistryEntryByLabel(rawLabel) : null;
  const hasKnownShapeField = Boolean(rawCategory || rawSubcategory || rawLabel);
  const hasAnyValue = Object.values(item).some((entry) => {
    if (Array.isArray(entry)) return entry.length > 0;
    return Boolean(toStr(entry));
  });

  if (!hasAnyValue) {
    return {
      rawCategory: "",
      rawSubcategory: "",
      rawLabel: "",
      normalizedLabel: "",
      canonicalHint: null,
      normalizationStatus: "malformed",
      mappingStatus: "malformed",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }

  if (!hasKnownShapeField) {
    return {
      rawCategory: "",
      rawSubcategory: "",
      rawLabel: "",
      normalizedLabel: "",
      canonicalHint: null,
      normalizationStatus: "unsupported",
      mappingStatus: "unsupported",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    };
  }

  if (rawCategory && rawSubcategory && rawLabel) {
    return buildRegistryMappedCertItem({
      rawCategory,
      rawSubcategory,
      rawLabel,
      normalizedLabel: rawLabel,
      canonicalHint: null,
      normalizationStatus: "raw_only",
      mappingStatus: "raw_only",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    }, registryEntry);
  }

  if (rawLabel && !rawCategory && !rawSubcategory) {
    return buildRegistryMappedCertItem({
      rawCategory: "",
      rawSubcategory: "",
      rawLabel,
      normalizedLabel: rawLabel,
      canonicalHint: null,
      normalizationStatus: "raw_only",
      mappingStatus: "raw_only",
      mappedFrom: null,
      phase1RoleFamilies: [],
      bridgeVersion: "phase1",
    }, registryEntry);
  }

  return {
    rawCategory,
    rawSubcategory,
    rawLabel,
    normalizedLabel: "",
    canonicalHint: null,
    normalizationStatus: "malformed",
    mappingStatus: "malformed",
    mappedFrom: null,
    phase1RoleFamilies: [],
    bridgeVersion: "phase1",
  };
}

function buildNormalizedCertSelections(certifications = []) {
  const source = Array.isArray(certifications) ? certifications : [];
  const items = source.map((item) => applyPhase1CertMapping(normalizeNewgradCertSelectionItem(item)));
  const normalizedCount = items.filter((item) => item.normalizationStatus === "normalized").length;
  const rawOnlyCount = items.filter((item) => item.normalizationStatus === "raw_only").length;
  const unsupportedCount = items.filter((item) => item.normalizationStatus === "unsupported").length;
  const malformedCount = items.filter((item) => item.normalizationStatus === "malformed").length;
  const mappedCount = items.filter((item) => item.mappingStatus === "mapped").length;
  const ambiguousCount = items.filter((item) => item.mappingStatus === "ambiguous").length;
  const phase1CoveredCount = items.filter((item) => toArr(item.phase1RoleFamilies).length > 0).length;
  const total = items.length;

  let status = "ok";
  if (total <= 0) {
    status = "empty";
  } else if (malformedCount === total) {
    status = "invalid";
  } else if (normalizedCount !== total) {
    status = "partial";
  }

  return {
    source,
    items,
    status,
    meta: {
      total,
      normalizedCount,
      mappedCount,
      ambiguousCount,
      rawOnlyCount,
      unsupportedCount,
      malformedCount,
      phase1CoveredCount,
    },
  };
}

function validateNewgradTransitionLiteInput(payload = {}) {
  // Empty structured arrays are a normal newgrad state. Keep them as safe, non-error inputs.
  const normalizedPartTime = normalizeEvidenceArray(payload?.partTimeExperience);
  const normalizedContract = normalizeEvidenceArray(payload?.contractExperiences);
  const mergeKeyOfWorkExperience = (item) => {
    const safeItem = item && typeof item === "object" ? item : {};
    return [
      toStr(safeItem.type),
      toStr(safeItem.roleFamily),
      toStr(safeItem.stakeholderType),
      toStr(safeItem.duration),
      toStr(safeItem.summary),
    ].join("||");
  };
  const mergedContractExperiences = [];
  const seenContractExperienceKeys = new Set();
  for (const item of [...normalizedContract, ...normalizedPartTime]) {
    const dedupeKey = mergeKeyOfWorkExperience(item);
    if (seenContractExperienceKeys.has(dedupeKey)) continue;
    seenContractExperienceKeys.add(dedupeKey);
    mergedContractExperiences.push(item);
  }
  const input = {
    targetJobId: toStr(payload?.targetJobId),
    targetIndustryId: toStr(payload?.targetIndustryId),
    major: normalizeMajor(payload?.major),
    coursework: toArr(payload?.coursework),
    projects: normalizeEvidenceArray(payload?.projects),
    internships: normalizeEvidenceArray(payload?.internships),
    certifications: normalizeEvidenceArray(payload?.certifications),
    extracurriculars: toArr(payload?.extracurriculars),
    // Keep both legacy keys for compatibility, but canonicalize them to the same merged source.
    contractExperiences: mergedContractExperiences,
    partTimeExperience: mergedContractExperiences,
    domainInterestEvidence: toArr(payload?.domainInterestEvidence),
    strengths: toArr(payload?.strengths),
    workStyleNotes: toStr(payload?.workStyleNotes),
  };

  return {
    ok: Boolean(input.targetJobId && input.targetIndustryId),
    input,
  };
}

const _REPAIR_SIGNAL_TITLES = {
  jobStructure:        "전공-직무 연결 보강 포인트",
  industryContext:     "산업 연관성 보강 포인트",
  responsibilityScope: "실전 경험 설명 보강 포인트",
  customerType:        "협업·커뮤니케이션 보강 포인트",
  roleCharacter:       "강점 표현 보강 포인트",
};

const _REPAIR_SIGNAL_AXIS_ORDER = [
  "jobStructure",
  "industryContext",
  "responsibilityScope",
  "customerType",
  "roleCharacter",
];

function buildTopRepairSignals(axisPack) {
  if (!axisPack || typeof axisPack !== "object" || !axisPack.axes) return [];
  const bandPriority = { very_low: 0, low: 1 };
  const candidates = [];
  for (const axisKey of _REPAIR_SIGNAL_AXIS_ORDER) {
    const axis = axisPack.axes[axisKey];
    if (!axis || typeof axis !== "object") continue;
    const band = String(axis.band || "");
    if (band !== "very_low" && band !== "low") continue;
    const gaps = Array.isArray(axis.explanation?.gaps) ? axis.explanation.gaps.filter(Boolean) : [];
    if (gaps.length === 0) continue;
    const title = _REPAIR_SIGNAL_TITLES[axisKey] || `${String(axis.label || "")} 보강 포인트`;
    candidates.push({
      axisKey,
      axisLabel: String(axis.label || ""),
      band,
      title,
      body: gaps[0],
      _priority: bandPriority[band],
    });
  }
  candidates.sort((a, b) => a._priority - b._priority);
  return candidates.slice(0, 3).map(({ _priority: _p, ...item }) => item);
}

// ─── evidence selection helpers ────────────────────────────────────────────

function pickPrimaryProjectEvidence(normalizedProjects) {
  const pool = Array.isArray(normalizedProjects) ? normalizedProjects.filter(Boolean) : [];
  if (pool.length === 0) return null;
  let best = null;
  let bestScore = -1;
  for (const p of pool) {
    if (!p || typeof p !== "object") continue;
    const hasRole = Boolean(toStr(p.normalizedRoleLabel));
    const outcomeRank = Number(p.outcomeRank) || 0;
    const score = outcomeRank * 2 + (hasRole ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function pickPrimaryWorkExperienceEvidence(normalizedInternships, normalizedContractExperiences) {
  const pool = [
    ...toArr(normalizedInternships),
    ...toArr(normalizedContractExperiences),
  ].filter(Boolean);
  if (pool.length === 0) return null;
  let best = null;
  let bestScore = -1;
  for (const item of pool) {
    if (!item || typeof item !== "object") continue;
    const hasStakeholder = Boolean(toStr(item.normalizedStakeholderLabel));
    const hasRole = Boolean(toStr(item.normalizedRoleLabel));
    const durationRank = Number(item.durationRank) || 0;
    const score = (hasStakeholder ? 4 : 0) + durationRank * 2 + (hasRole ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = item; }
  }
  return best;
}

function pickPrimaryStrengthEvidence(roleChar, selfReportProfile) {
  const matchedStrengths = Array.isArray(roleChar?.signals?.matchedStrengthLabels)
    ? roleChar.signals.matchedStrengthLabels.filter(Boolean) : [];
  const matchedWorkStyles = Array.isArray(roleChar?.signals?.matchedWorkStyleLabels)
    ? roleChar.signals.matchedWorkStyleLabels.filter(Boolean) : [];
  const allStrengths = Array.isArray(selfReportProfile?.normalizedStrengthLabels)
    ? selfReportProfile.normalizedStrengthLabels.filter(Boolean) : [];
  if (matchedStrengths.length > 0) return { label: matchedStrengths[0], kind: "strength" };
  if (matchedWorkStyles.length > 0) return { label: matchedWorkStyles[0], kind: "workstyle" };
  if (allStrengths.length > 0) return { label: allStrengths[0], kind: "fallback" };
  return null;
}

function getPackLabel(item) {
  return toStr(item?.label || item?.displayLabel);
}

function buildNewgradVisibilityPackSources(validatedInput = {}) {
  const experiencePack = validatedInput?.experienceEvidencePack && typeof validatedInput.experienceEvidencePack === "object"
    ? validatedInput.experienceEvidencePack
    : null;
  const certPack = validatedInput?.certEvidencePack && typeof validatedInput.certEvidencePack === "object"
    ? validatedInput.certEvidencePack
    : null;
  const selfReportPack = validatedInput?.selfReportEvidencePack && typeof validatedInput.selfReportEvidencePack === "object"
    ? validatedInput.selfReportEvidencePack
    : null;

  const axis1ProjectRow = toArr(experiencePack?.projectRows).find((row) => toStr(row?.normalizedRoleLabel) || toStr(row?.normalizedTypeLabel)) || null;
  const axis1WorkRow = toArr(experiencePack?.canonicalWorkRows).find((row) => toStr(row?.normalizedRoleLabel) || toStr(row?.normalizedTypeLabel)) || null;
  const axis2ExperienceLabels = firstUniqueLabels([
    ...toArr(experiencePack?.axisFitHints?.axis2?.strongContextLabels),
    ...toArr(experiencePack?.axisFitHints?.axis2?.supportContextLabels),
    ...toArr(experiencePack?.axisFitHints?.axis2?.projectIndustryLabels),
  ], 3);
  const axis2CertAlignedLabels = firstUniqueLabels(toArr(certPack?.axisFitHints?.axis2?.alignedCertLabels), 2);
  const axis2CertWeakLabels = firstUniqueLabels(toArr(certPack?.axisFitHints?.axis2?.weakCertLabels), 2);
  const axis3OutcomeLabels = firstUniqueLabels(toArr(experiencePack?.axisFitHints?.axis3?.topOutcomeLabels), 2);
  const axis3DurationLabels = firstUniqueLabels(toArr(experiencePack?.axisFitHints?.axis3?.topDurationLabels), 2);
  const axis4StakeholderLabels = firstUniqueLabels([
    ...toArr(experiencePack?.axisFitHints?.axis4?.directStakeholderLabels),
    ...toArr(experiencePack?.axisFitHints?.axis4?.supportStakeholderLabels),
  ], 2);
  const axis4CommunicationCertLabels = firstUniqueLabels(toArr(certPack?.axisFitHints?.axis4?.communicationCertLabels), 2);
  const axis4SelfReportLabels = firstUniqueLabels([
    ...toArr(selfReportPack?.axisFitHints?.axis4?.interactionEligibleWorkStyleLabels),
    ...toArr(selfReportPack?.axisFitHints?.axis4?.supportStrengthLabels),
  ], 2);
  const axis5StrengthLabels = firstUniqueLabels(toArr(selfReportPack?.axisFitHints?.axis5?.strengthLabels), 2);
  const axis5WorkStyleLabels = firstUniqueLabels(toArr(selfReportPack?.axisFitHints?.axis5?.workStyleLabels), 2);

  return {
    experiencePack,
    certPack,
    selfReportPack,
    axis1ProjectLabel: getPackLabel(axis1ProjectRow) || firstUniqueLabels(toArr(experiencePack?.roleEvidenceSummary?.axis1DirectRoleLabels), 1)[0] || "",
    axis1WorkLabel: getPackLabel(axis1WorkRow),
    axis2ExperienceLabels,
    axis2CertAlignedLabels,
    axis2CertWeakLabels,
    axis3OutcomeLabels,
    axis3DurationLabels,
    axis4StakeholderLabels,
    axis4CommunicationCertLabels,
    axis4SelfReportLabels,
    axis5StrengthLabels,
    axis5WorkStyleLabels,
  };
}

function buildNewgradWhyThisReadFromPacks(validatedInput = {}) {
  const sources = buildNewgradVisibilityPackSources(validatedInput);
  const majorLabel = toStr(validatedInput?.major);
  const items = [];

  if (majorLabel) {
    items.push(`Axis1은 ${majorLabel} 전공을 직무 연결의 기초 신호로 읽었습니다.`);
  }

  if (sources.axis2ExperienceLabels.length > 0 || sources.axis2CertAlignedLabels.length > 0 || sources.axis2CertWeakLabels.length > 0) {
    const expPart = sources.axis2ExperienceLabels.length > 0 ? `경험 근거 ${sources.axis2ExperienceLabels.join(", ")}` : "";
    const certPart = sources.axis2CertAlignedLabels.length > 0
      ? `자격 보조 ${sources.axis2CertAlignedLabels.join(", ")}`
      : sources.axis2CertWeakLabels.length > 0
        ? `자격 보조 ${sources.axis2CertWeakLabels.join(", ")}`
        : "";
    items.push(`Axis2는 ${[expPart, certPart].filter(Boolean).join(" + ")} 기준으로 읽었습니다.`);
  }

  if (sources.axis3OutcomeLabels.length > 0 || sources.axis3DurationLabels.length > 0) {
    items.push(`Axis3는 ${[sources.axis3OutcomeLabels[0], sources.axis3DurationLabels[0]].filter(Boolean).join(" / ")} 중심으로 실행 깊이를 읽었습니다.`);
  }

  if (sources.axis4CommunicationCertLabels.length > 0) {
    items.push(`Axis4는 ${sources.axis4CommunicationCertLabels.join(", ")}을 소통 보조 신호로만 약하게 읽었습니다.`);
  }

  if (sources.axis4StakeholderLabels.length > 0 || sources.axis4SelfReportLabels.length > 0) {
    const primaryPart = sources.axis4StakeholderLabels.length > 0 ? `경험 근거 ${sources.axis4StakeholderLabels.join(", ")}` : "경험 근거 제한적";
    const supportPart = sources.axis4SelfReportLabels.length > 0 ? `자기보고 보조 ${sources.axis4SelfReportLabels.join(", ")}` : "";
    items.push(`Axis4는 ${[primaryPart, supportPart].filter(Boolean).join(" + ")} 기준으로 읽었습니다.`);
  }

  if (sources.axis5StrengthLabels.length > 0 || sources.axis5WorkStyleLabels.length > 0) {
    items.push(`Axis5는 ${[sources.axis5StrengthLabels[0], sources.axis5WorkStyleLabels[0]].filter(Boolean).join(" / ")} 자기보고 신호를 중심으로 읽었습니다.`);
  }

  return items.filter(Boolean).slice(0, 5);
}

// ─── inputEvidenceRead ───────────────────────────────────────────────────────

function buildInputEvidenceRead(axisPack, validatedInput) {
  if (!axisPack?.axes) return null;
  const axes = axisPack.axes;
  const items = [];

  // major → jobStructure axis
  const majorLabel = toStr(validatedInput.major);
  if (majorLabel) {
    const axis = axes.jobStructure;
    const supportLine = toStr(axis?.signals?.experienceSupportLine);
    items.push({
      type: "major",
      label: majorLabel,
      linkedAxisLabels: [toStr(axis?.label)].filter(Boolean),
      interpretation: supportLine || "전공 기반 직무 연결성 판단의 기초 신호로 반영됐습니다.",
    });
  }

  // project → responsibilityScope axis (best by outcomeRank + role clarity)
  const bestProject = pickPrimaryProjectEvidence(validatedInput.normalizedProjects);
  const pRoleLabel = toStr(bestProject?.normalizedRoleLabel);
  const pTypeLabel = toStr(bestProject?.normalizedTypeLabel);
  const projectLabel = pRoleLabel && pTypeLabel
    ? `${pRoleLabel} · ${pTypeLabel}`
    : pRoleLabel || pTypeLabel;
  if (projectLabel) {
    const axis = axes.responsibilityScope;
    const supportLine = toStr(axis?.signals?.experienceSupportLine);
    const hasOutcome = Number(bestProject?.outcomeRank) > 0;
    const interpretation = supportLine
      ? supportLine
      : hasOutcome
        ? "역할 설명이 비교적 선명한 프로젝트라 실전 경험 판단의 대표 근거로 읽혔습니다."
        : "프로젝트에서 맡은 역할이 실전 경험 축 해석에 반영됐습니다.";
    items.push({
      type: "project",
      label: projectLabel,
      linkedAxisLabels: [toStr(axis?.label)].filter(Boolean),
      interpretation,
    });
  }

  // internship/contract → customerType axis (best by stakeholder > duration > role)
  const bestWork = pickPrimaryWorkExperienceEvidence(
    validatedInput.normalizedInternships,
    validatedInput.normalizedContractExperiences
  );
  const wRoleLabel = toStr(bestWork?.normalizedRoleLabel);
  const wStakeholderLabel = toStr(bestWork?.normalizedStakeholderLabel);
  const wTypeLabel = toStr(bestWork?.normalizedTypeLabel);
  const workLabel = wRoleLabel && wStakeholderLabel
    ? `${wRoleLabel} · ${wStakeholderLabel}`
    : wRoleLabel || wStakeholderLabel || wTypeLabel;
  if (workLabel) {
    const axis = axes.customerType;
    const supportLine = toStr(axis?.signals?.experienceSupportLine);
    const hasStakeholder = Boolean(wStakeholderLabel);
    const interpretation = supportLine
      ? supportLine
      : hasStakeholder
        ? "이해관계자 접점이 보여 협업·커뮤니케이션 축 해석에 반영됐습니다."
        : "기간과 역할 범위가 비교적 선명해 실전 경험 판단의 대표 근거로 읽혔습니다.";
    items.push({
      type: "internship",
      label: workLabel,
      linkedAxisLabels: [toStr(axis?.label)].filter(Boolean),
      interpretation,
    });
  }

  // strength/workstyle → roleCharacter axis (matched first, then fallback)
  const bestStrength = pickPrimaryStrengthEvidence(axes.roleCharacter, validatedInput.selfReportProfile);
  if (bestStrength) {
    const interpretation = bestStrength.kind === "workstyle"
      ? "직무 성격과 맞닿는 일하는 방식으로 반영됐습니다."
      : bestStrength.kind === "strength"
        ? "목표 직무에서 직접 활용 설명이 쉬운 강점으로 읽혔습니다."
        : "목표 직무와 연결 가능한 강점으로 읽혀 강점·재능 축 해석에 반영됐습니다.";
    items.push({
      type: "strength",
      label: bestStrength.label,
      linkedAxisLabels: [toStr(axes.roleCharacter?.label)].filter(Boolean),
      interpretation,
    });
  }

  if (items.length === 0) return null;
  return { items };
}

// ─── axisReadSummary ─────────────────────────────────────────────────────────

const _AXIS_SUMMARY_MAX_LEN = 90;

function buildAxisReadSummary(axisPack, validatedInput) {
  if (!axisPack?.axes) return null;
  const axes = axisPack.axes;
  const items = [];

  const majorLabel = toStr(validatedInput?.major);
  const bestProject = pickPrimaryProjectEvidence(validatedInput?.normalizedProjects);
  const projectLabel = toStr(bestProject?.normalizedRoleLabel || bestProject?.normalizedTypeLabel);
  const bestWork = pickPrimaryWorkExperienceEvidence(
    validatedInput?.normalizedInternships,
    validatedInput?.normalizedContractExperiences
  );
  const workLabel = toStr(
    bestWork?.normalizedRoleLabel || bestWork?.normalizedStakeholderLabel || bestWork?.normalizedTypeLabel
  );
  const hasStakeholderOnWork = Boolean(toStr(bestWork?.normalizedStakeholderLabel));
  const bestStrength = pickPrimaryStrengthEvidence(axes.roleCharacter, validatedInput?.selfReportProfile);
  const strengthLabel = toStr(bestStrength?.label);

  for (const axisKey of _REPAIR_SIGNAL_AXIS_ORDER) {
    const axis = axes[axisKey];
    if (!axis || typeof axis !== "object") continue;
    const fallback = toStr(axis.explanation?.summary);
    let summary = "";

    if (axisKey === "jobStructure") {
      const ref = projectLabel || workLabel;
      if (majorLabel && ref) {
        summary = `${majorLabel} 전공과 함께 ${ref} 경험이 직무 연결성 해석에 반영됐습니다.`;
      } else if (majorLabel) {
        summary = `${majorLabel} 전공이 직무 연결성 판단의 기초 신호로 반영됐습니다.`;
      } else if (ref) {
        summary = `${ref} 경험이 전공보다 더 직접적인 연결 근거로 읽혔습니다.`;
      } else {
        summary = fallback;
      }
    } else if (axisKey === "industryContext") {
      const ref = projectLabel || workLabel;
      summary = ref
        ? `${ref} 경험을 바탕으로 산업 맥락 적합성을 읽었습니다.`
        : fallback || "산업 직접 경험보다 맥락 이해 신호가 제한적으로 반영됐습니다.";
    } else if (axisKey === "responsibilityScope") {
      const ref = projectLabel || workLabel;
      summary = ref
        ? `${ref} 경험이 실전 경험 깊이 판단의 대표 근거가 됐습니다.`
        : fallback || "실전 경험은 있으나 결과 수준이나 책임 범위는 보수적으로 읽혔습니다.";
    } else if (axisKey === "customerType") {
      if (workLabel && hasStakeholderOnWork) {
        summary = `${workLabel} 경험이 협업·커뮤니케이션 축 해석에 반영됐습니다.`;
      } else if (workLabel) {
        summary = `${workLabel} 경험이 이해관계자 접점 신호로 이 축 해석에 반영됐습니다.`;
      } else {
        summary = fallback || "이해관계자 접점 신호가 제한적이라 이 축은 보수적으로 읽혔습니다.";
      }
    } else if (axisKey === "roleCharacter") {
      if (strengthLabel) {
        summary = `${strengthLabel} 성향이 강점·재능 축 해석에 반영됐습니다.`;
      } else {
        const matchedCount = (axes.roleCharacter?.signals?.matchedStrengthLabels?.length || 0)
          + (axes.roleCharacter?.signals?.matchedWorkStyleLabels?.length || 0);
        summary = matchedCount > 0
          ? "직무와 연결되는 강점/일하는 방식이 이 축 해석에 반영됐습니다."
          : fallback || "";
      }
    }

    if (!summary) continue;
    if (summary.length > _AXIS_SUMMARY_MAX_LEN) {
      summary = summary.slice(0, _AXIS_SUMMARY_MAX_LEN).trimEnd() + "…";
    }
    items.push({ axisKey, axisLabel: toStr(axis.label), band: toStr(axis.band), summary });
  }

  if (items.length === 0) return null;
  return { items };
}

function buildStrengthEvidenceRead(axisPack, allStrengthLabels) {
  const safeAllStrengthLabels = Array.isArray(allStrengthLabels) ? allStrengthLabels.filter(Boolean) : [];
  const roleCharacter = axisPack?.axes?.roleCharacter;
  const matchedStrengthLabels = Array.isArray(roleCharacter?.signals?.matchedStrengthLabels)
    ? roleCharacter.signals.matchedStrengthLabels.filter(Boolean)
    : [];
  const matchedWorkStyleLabels = Array.isArray(roleCharacter?.signals?.matchedWorkStyleLabels)
    ? roleCharacter.signals.matchedWorkStyleLabels.filter(Boolean)
    : [];
  const hasDirectMatch = matchedStrengthLabels.length > 0 || matchedWorkStyleLabels.length > 0;
  if (!hasDirectMatch && safeAllStrengthLabels.length === 0) return null;
  return {
    matchedStrengthLabels,
    matchedWorkStyleLabels,
    allStrengthLabels: safeAllStrengthLabels,
    hasDirectMatch,
  };
}

function buildStrengthEvidenceReadFromPacks(axisPack, validatedInput) {
  const safeInput = validatedInput && typeof validatedInput === "object" ? validatedInput : {};
  const selfReportPack = safeInput.selfReportEvidencePack && typeof safeInput.selfReportEvidencePack === "object"
    ? safeInput.selfReportEvidencePack
    : null;
  const roleCharacter = axisPack?.axes?.roleCharacter;
  const matchedStrengthLabels = Array.isArray(roleCharacter?.signals?.matchedStrengthLabels)
    ? roleCharacter.signals.matchedStrengthLabels.filter(Boolean)
    : [];
  const matchedWorkStyleLabels = Array.isArray(roleCharacter?.signals?.matchedWorkStyleLabels)
    ? roleCharacter.signals.matchedWorkStyleLabels.filter(Boolean)
    : [];
  const allStrengthLabels = firstUniqueLabels([
    ...toArr(selfReportPack?.axisFitHints?.axis5?.strengthLabels),
    ...toArr(safeInput?.selfReportProfile?.normalizedStrengthLabels),
  ], 5);
  const hasDirectMatch = matchedStrengthLabels.length > 0 || matchedWorkStyleLabels.length > 0;
  if (!hasDirectMatch && allStrengthLabels.length === 0) return null;
  return {
    matchedStrengthLabels,
    matchedWorkStyleLabels,
    allStrengthLabels,
    hasDirectMatch,
  };
}

function buildInputEvidenceReadFromPacks(axisPack, validatedInput) {
  if (!axisPack?.axes) return null;
  const axes = axisPack.axes;
  const sources = buildNewgradVisibilityPackSources(validatedInput);
  const majorLabel = toStr(validatedInput?.major);
  const items = [];

  if (majorLabel) {
    items.push({
      type: "major",
      label: majorLabel,
      linkedAxisLabels: [toStr(axes.jobStructure?.label)].filter(Boolean),
      interpretation: toStr(axes.jobStructure?.signals?.experienceSupportLine) || "전공 기반 직무 연결성 판단의 기초 신호로 반영됐습니다.",
    });
  }

  const axis3Label = sources.axis3OutcomeLabels[0] || sources.axis3DurationLabels[0] || sources.axis2ExperienceLabels[0];
  if (axis3Label) {
    items.push({
      type: "project",
      label: axis3Label,
      linkedAxisLabels: [toStr(axes.responsibilityScope?.label)].filter(Boolean),
      interpretation: toStr(axes.responsibilityScope?.signals?.experienceSupportLine) || `${axis3Label} 근거가 실행 깊이 판단에 반영됐습니다.`,
    });
  }

  const axis4Label = sources.axis4StakeholderLabels[0] || sources.axis2ExperienceLabels[0];
  if (axis4Label) {
    items.push({
      type: "internship",
      label: axis4Label,
      linkedAxisLabels: [toStr(axes.customerType?.label)].filter(Boolean),
      interpretation: toStr(axes.customerType?.signals?.experienceSupportLine) || `${axis4Label} 경험이 상호작용 근거 해석에 반영됐습니다.`,
    });
  }

  const axis5Label = sources.axis5StrengthLabels[0] || sources.axis5WorkStyleLabels[0];
  if (axis5Label) {
    items.push({
      type: "strength",
      label: axis5Label,
      linkedAxisLabels: [toStr(axes.roleCharacter?.label)].filter(Boolean),
      interpretation: sources.axis5StrengthLabels.length > 0
        ? "자기보고 강점 신호가 강점·재능 축 해석에 반영됐습니다."
        : "자기보고 일하는 방식 신호가 강점·재능 축 해석에 반영됐습니다.",
    });
  }

  if (items.length === 0) return null;
  return { items };
}

function buildAxisReadSummaryFromPacks(axisPack, validatedInput) {
  if (!axisPack?.axes) return null;
  const axes = axisPack.axes;
  const sources = buildNewgradVisibilityPackSources(validatedInput);
  const items = [];
  const majorLabel = toStr(validatedInput?.major);

  const summaryByAxis = {
    jobStructure: majorLabel
      ? `${majorLabel} 전공을 직무 연결의 기초 신호로 읽었습니다.`
      : "",
    industryContext: sources.axis2ExperienceLabels.length > 0 || sources.axis2CertAlignedLabels.length > 0 || sources.axis2CertWeakLabels.length > 0
      ? `${[sources.axis2ExperienceLabels[0], sources.axis2CertAlignedLabels[0] || sources.axis2CertWeakLabels[0]].filter(Boolean).join(" + ")} 기준으로 산업 이해를 읽었습니다.`
      : "",
    responsibilityScope: sources.axis3OutcomeLabels.length > 0 || sources.axis3DurationLabels.length > 0
      ? `${[sources.axis3OutcomeLabels[0], sources.axis3DurationLabels[0]].filter(Boolean).join(" / ")} 중심으로 실행 깊이를 읽었습니다.`
      : "",
    customerType: sources.axis4StakeholderLabels.length > 0 || sources.axis4SelfReportLabels.length > 0 || sources.axis4CommunicationCertLabels.length > 0
      ? `${[sources.axis4StakeholderLabels[0], sources.axis4SelfReportLabels[0], sources.axis4CommunicationCertLabels[0]].filter(Boolean).join(" + ")} 기준으로 상호작용 근거를 읽었습니다.`
      : "",
    roleCharacter: sources.axis5StrengthLabels.length > 0 || sources.axis5WorkStyleLabels.length > 0
      ? `${[sources.axis5StrengthLabels[0], sources.axis5WorkStyleLabels[0]].filter(Boolean).join(" / ")} 자기보고 신호를 중심으로 읽었습니다.`
      : "",
  };

  for (const axisKey of _REPAIR_SIGNAL_AXIS_ORDER) {
    const axis = axes[axisKey];
    if (!axis || typeof axis !== "object") continue;
    let summary = summaryByAxis[axisKey] || toStr(axis.explanation?.summary);
    if (!summary) continue;
    if (summary.length > _AXIS_SUMMARY_MAX_LEN) {
      summary = summary.slice(0, _AXIS_SUMMARY_MAX_LEN).trimEnd() + "…";
    }
    items.push({ axisKey, axisLabel: toStr(axis.label), band: toStr(axis.band), summary });
  }

  if (items.length === 0) return null;
  return { items };
}

function summarizeEvidenceLabels(items = [], maxCount = 2) {
  const labels = firstUniqueLabels(items, Math.max(1, maxCount));
  const totalUniqueCount = firstUniqueLabels(items, 99).length;
  if (labels.length === 0) return "아직 입력한 내용 없음";
  if (totalUniqueCount <= labels.length) return labels.join(", ");
  return `${labels.join(", ")} 외 ${totalUniqueCount - labels.length}개`;
}

function isMissingEvidenceText(value) {
  if (value == null) return true;
  if (Array.isArray(value)) {
    if (value.length === 0) return true;
    return value.every((item) => isMissingEvidenceText(item));
  }
  if (typeof value === "object") {
    const candidateKeys = ["text", "label", "title", "body", "summary", "value", "content"];
    const candidateValues = candidateKeys
      .map((key) => value?.[key])
      .filter((item) => typeof item !== "undefined");
    if (candidateValues.length === 0) return true;
    return candidateValues.every((item) => isMissingEvidenceText(item));
  }

  const text = toStr(value);
  if (!text) return true;
  return text === "아직 입력한 내용 없음"
    || text === "입력한 내용 없음"
    || text === "내용 없음";
}

function buildGoalComparisonRow(rowKey, itemLabel, evidence, jobLinkage = "", industryLinkage = "") {
  const safeEvidence = toStr(evidence);
  if (isMissingEvidenceText(safeEvidence)) return null;

  return {
    rowKey,
    itemLabel,
    label: itemLabel,
    evidence: safeEvidence,
    jobLinkage: toStr(jobLinkage),
    industryLinkage: toStr(industryLinkage),
  };
}

const NEWGRAD_GOAL_TABLE_V2 = "newgrad_goal_table_v2";

function buildNewgradGoalComparisonTable(validatedInput, targetJobLabel, targetIndustryLabel) {
  const safeInput = validatedInput && typeof validatedInput === "object" ? validatedInput : {};
  const certRows = toArr(safeInput?.certEvidencePack?.rows);
  const projectRows = toArr(safeInput?.normalizedProjects);
  const internshipRows = toArr(safeInput?.normalizedInternships);
  const contractRows = toArr(safeInput?.normalizedPartTimeExperience).length > 0
    ? toArr(safeInput?.normalizedPartTimeExperience)
    : toArr(safeInput?.normalizedContractExperiences);
  const strengthRows = toArr(safeInput?.selfReportEvidencePack?.strengthRows);
  const workStyleRows = toArr(safeInput?.selfReportEvidencePack?.workStyleRows);
  const safeTargetJobLabel = toStr(targetJobLabel) || "희망 직무";
  const safeTargetIndustryLabel = toStr(targetIndustryLabel) || "희망 산업";
  const majorLabel = toStr(safeInput?.major);
  const targetIndustryLinkageLabel = toStr(targetIndustryLabel);

  const certificationEvidenceLabels = certRows
    .filter((row) => row?.relevanceStatus === "direct_relevant")
    .map((row) => row?.displayLabel)
    .filter(Boolean);
  const fallbackCertificationEvidenceLabels = certRows
    .map((row) => row?.displayLabel)
    .filter(Boolean);
  const projectEvidenceLabels = projectRows
    .map((row) => toStr(row?.normalizedRoleLabel || row?.normalizedTypeLabel || row?.normalizedOutcomeLabel))
    .filter(Boolean);
  const internshipEvidenceLabels = internshipRows
    .map((row) => getExperienceRowDisplayLabel(row) || toStr(row?.normalizedDurationLabel))
    .filter(Boolean);
  const contractEvidenceLabels = contractRows
    .map((row) => getExperienceRowDisplayLabel(row) || toStr(row?.normalizedDurationLabel))
    .filter(Boolean);
  const strengthEvidenceLabels = [
    ...strengthRows.map((row) => row?.label),
    ...workStyleRows.map((row) => row?.label),
  ].filter(Boolean);
  const newTableTitle = "입력한 내용으로 보는 직무·산업 연결";
  const newTableDescription = "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요.";
  const newTableEmptyStateText = "입력한 내용 중 목표 직무·산업 연결로 정리할 항목이 아직 없어요.";
  const newTableColumns = {
    item: "입력 항목",
    evidence: "내가 입력한 내용",
    jobLinkage: "직무 쪽 해석",
    industryLinkage: "산업 쪽 해석",
  };

  const rows = [
    buildGoalComparisonRow(
      "major",
      "전공",
      majorLabel,
      majorLabel ? `${majorLabel} 전공에서 배운 내용과 문제 해결 방식은 ${safeTargetJobLabel}에 연결해서 설명할 수 있어요.` : "",
      majorLabel && targetIndustryLinkageLabel
        ? `${majorLabel} 전공이 ${safeTargetIndustryLabel} 산업과 바로 이어지지는 않아도 참고 근거로는 활용할 수 있어요.`
        : ""
    ),
    buildGoalComparisonRow(
      "certifications",
      "자격증",
      summarizeEvidenceLabels(
        certificationEvidenceLabels.length > 0 ? certificationEvidenceLabels : fallbackCertificationEvidenceLabels
      ),
      certificationEvidenceLabels.length > 0
        ? `자격증은 ${safeTargetJobLabel} 준비도나 관심을 보여주는 근거로 설명할 수 있어요.`
        : fallbackCertificationEvidenceLabels.length > 0
          ? `${safeTargetJobLabel}와 바로 맞닿은 근거는 아니지만 참고 자료로는 쓸 수 있어요.`
          : "",
      targetIndustryLinkageLabel && (certificationEvidenceLabels.length > 0 || fallbackCertificationEvidenceLabels.length > 0)
        ? `${safeTargetIndustryLabel} 산업을 이해하려고 준비한 흔적으로도 볼 수 있어요.`
        : ""
    ),
    buildGoalComparisonRow(
      "projects",
      "프로젝트",
      summarizeEvidenceLabels(projectEvidenceLabels),
      projectEvidenceLabels.length > 0
        ? `프로젝트에서 맡은 역할과 만든 결과는 ${safeTargetJobLabel} 경험으로 연결해서 설명할 수 있어요.`
        : "",
      projectEvidenceLabels.length > 0 && targetIndustryLinkageLabel
        ? `${safeTargetIndustryLabel}와 같은 주제는 아니어도, 내용에 따라 산업 관심을 보여주는 근거가 될 수 있어요.`
        : ""
    ),
    buildGoalComparisonRow(
      "internships",
      "인턴십",
      summarizeEvidenceLabels(internshipEvidenceLabels),
      internshipEvidenceLabels.length > 0
        ? `인턴십 경험은 ${safeTargetJobLabel}의 실제 일 방식과 맥락을 이해한 근거로 설명할 수 있어요.`
        : "",
      internshipEvidenceLabels.length > 0 && targetIndustryLinkageLabel
        ? `${safeTargetIndustryLabel}와 비슷한 환경을 다뤘다면 산업 이해 경험으로도 볼 수 있어요.`
        : ""
    ),
    buildGoalComparisonRow(
      "contract_experience",
      "아르바이트·계약경험",
      summarizeEvidenceLabels(contractEvidenceLabels),
      contractEvidenceLabels.length > 0
        ? `실무를 꾸준히 해본 경험으로 ${safeTargetJobLabel}와 연결해서 설명할 수 있어요.`
        : "",
      contractEvidenceLabels.length > 0 && targetIndustryLinkageLabel
        ? `${safeTargetIndustryLabel} 관련 내용이 드러나면 산업 근거가 되고, 아니면 연결은 크지 않을 수 있어요.`
        : ""
    ),
    buildGoalComparisonRow(
      "strengths_workstyle",
      "강점·업무스타일",
      summarizeEvidenceLabels(strengthEvidenceLabels),
      strengthEvidenceLabels.length > 0
        ? `강점과 업무스타일은 ${safeTargetJobLabel}에 맞는 일하는 방식으로 연결해 설명할 수 있어요.`
        : "",
      strengthEvidenceLabels.length > 0 && targetIndustryLinkageLabel
        ? `업무스타일만으로 ${safeTargetIndustryLabel} 산업 연결을 설명하기는 어려워요.`
        : ""
    ),
  ].filter(Boolean);

  const newgradGoalTableV2 = {
    version: NEWGRAD_GOAL_TABLE_V2,
    title: newTableTitle,
    description: newTableDescription,
    metaNote: "",
    emptyStateText: newTableEmptyStateText,
    meta: {
      targetJobLabel: safeTargetJobLabel,
      targetIndustryLabel: safeTargetIndustryLabel,
    },
    columns: newTableColumns,
    rows,
  };

  try {
    if (typeof globalThis !== "undefined") {
      globalThis.__NEWGRAD_GOAL_TABLE_BUILD__ = {
        at: Date.now(),
        version: NEWGRAD_GOAL_TABLE_V2,
        title: "입력한 내용으로 보는 직무·산업 연결",
        columns: {
          item: "입력 항목",
          evidence: "내가 입력한 내용",
          jobLinkage: "직무 쪽 해석",
          industryLinkage: "산업 쪽 해석",
        },
        title: newTableTitle,
        columns: newTableColumns,
        rowCountAfter: rows.length,
        rows: rows.slice(0, 10).map((row) => ({
          rowKey: row?.rowKey || "",
          itemLabel: row?.itemLabel || row?.label || "",
          label: row?.label || "",
          evidence: row?.evidence || "",
          jobLinkage: row?.jobLinkage || "",
          industryLinkage: row?.industryLinkage || "",
          linkage: row?.linkage || "",
        })),
      };
    }
  } catch {}

  if (rows.length === 0) {
    return {
      version: NEWGRAD_GOAL_TABLE_V2,
      emptyStateText: newTableEmptyStateText,
    };
  }

  return newgradGoalTableV2;

  return {
    title: "입력한 내용으로 보는 직무·산업 연결",
    description: "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요.",
    metaNote: "",
    emptyStateText: "입력한 내용이 아직 적어서 연결해서 볼 항목이 많지 않아요.",
    meta: {
      targetJobLabel: safeTargetJobLabel,
      targetIndustryLabel: safeTargetIndustryLabel,
    },
    columns: {
      item: "입력 항목",
      evidence: "내가 입력한 내용",
      jobLinkage: "직무 쪽 해석",
      industryLinkage: "산업 쪽 해석",
    },
    rows,
  };
}

function makeEmptyVm() {
  return {
    heroSummary: "",
    topRisks: [],
    topRepairSignals: [],
    certEvidencePack: null,
    experienceEvidencePack: null,
    selfReportEvidencePack: null,
    strengthEvidenceRead: null,
    inputEvidenceRead: null,
    axisReadSummary: null,
    whyThisRead: [],
    strengths: [],
    whyThisReadSupportLine: "",
    validationReadBlock: null,
    newgradGoalComparisonTable: null,
    transitionReadBlock: {
      sectionTitle: "신입 적합성 요약",
      intro: "",
      cards: [],
      meta: {
        currentJobLabel: "",
        targetJobLabel: "",
      },
    },
    targetJobRead: {
      title: "",
      summary: "",
      body: "",
      bullets: [],
      source: "",
    },
    targetIndustryRead: {
      label: "",
      title: "",
      summary: "",
      bullets: [],
    },
    targetIndustryLabel: "",
    industryTraitsAsset: null,
    buyingMotionPanel: null,
    axisPack: null,
  };
}

export function buildNewgradTransitionLiteResult(payload = {}) {
  const validated = validateNewgradTransitionLiteInput(payload);
  if (!validated.ok) return makeEmptyVm();

  const targetJobItem = getJobOntologyItemById(validated.input.targetJobId);
  const targetIndustryItem = getIndustryRegistryItemById(validated.input.targetIndustryId);
  if (!targetJobItem || !targetIndustryItem) return makeEmptyVm();

  const targetJobContext = buildJobContext(targetJobItem);
  const targetIndustryContext = buildIndustryContext(targetIndustryItem);
  validated.input.normalizedCertSelections = buildNormalizedCertSelections(validated.input.certifications);
  validated.input.certRoleRelevancePack = buildPhase1CertRoleRelevancePack(
    validated.input.targetJobId,
    validated.input.normalizedCertSelections,
    toStr(targetJobItem?.label)
  );
  validated.input.certEvidencePack = buildCertEvidencePack({
    certifications: validated.input.certifications,
    normalizedCertSelections: validated.input.normalizedCertSelections,
    certRoleRelevancePack: validated.input.certRoleRelevancePack,
  });
  validated.input.selfReportProfile = normalizeNewgradSelfReportTraits({
    strengths: validated.input.strengths,
    workStyleNotes: validated.input.workStyleNotes,
  });
  validated.input.selfReportEvidencePack = buildSelfReportEvidencePack({
    strengths: validated.input.strengths,
    workStyleNotes: validated.input.workStyleNotes,
    selfReportProfile: validated.input.selfReportProfile,
  });
  validated.input.normalizedExperienceInput = normalizeNewgradExperienceInput(validated.input);
  validated.input.normalizedProjects = validated.input.normalizedExperienceInput.normalizedProjects;
  validated.input.normalizedInternships = validated.input.normalizedExperienceInput.normalizedInternships;
  validated.input.normalizedContractExperiences = validated.input.normalizedExperienceInput.normalizedContractExperiences;
  validated.input.normalizedPartTimeExperience = validated.input.normalizedExperienceInput.normalizedPartTimeExperience;
  validated.input.exploratoryExperienceRows = validated.input.normalizedExperienceInput.exploratoryExperienceRows;
  validated.input.practicalExperienceRows = validated.input.normalizedExperienceInput.practicalExperienceRows;
  validated.input.experienceEvidencePack = buildExperienceEvidencePack(validated.input.normalizedExperienceInput);
  const axisPack = buildNewgradAxisPack(validated.input);

  const evidenceSummary = [
    summarizeCount("프로젝트", validated.input.projects.length),
    summarizeCount("인턴", validated.input.internships.length),
    summarizeCount("산업 연관 활동", validated.input.domainInterestEvidence.length),
  ].filter(Boolean);

  const whyThisRead = [
    validated.input.major ? `전공: ${validated.input.major}` : "",
    evidenceSummary.length > 0 ? `확인된 신입 증거: ${evidenceSummary.join(", ")}` : "",
    validated.input.selfReportProfile.normalizedWorkStyleLabels.length > 0
      ? `일하는 방식 입력: ${validated.input.selfReportProfile.normalizedWorkStyleLabels.slice(0, 2).join(", ")}`
      : "",
  ].filter(Boolean);
  const packEvidenceSummary = firstUniqueLabels([
    ...toArr(validated.input.experienceEvidencePack?.visibilityEvidence?.comparisonHighlightLabels),
    ...toArr(validated.input.certEvidencePack?.visibilityEvidence?.axisReadSummaryLabels),
    ...toArr(validated.input.selfReportEvidencePack?.visibilityEvidence?.axisReadSummaryLabels),
  ], 4);
  const whyThisReadFromPacks = buildNewgradWhyThisReadFromPacks(validated.input);
  if (whyThisReadFromPacks.length === 0 && packEvidenceSummary.length > 0) {
    whyThisReadFromPacks.push(`확인된 핵심 근거: ${packEvidenceSummary.join(", ")}`);
  }
  const newgradGoalComparisonTable = buildNewgradGoalComparisonTable(
    validated.input,
    toStr(targetJobItem?.label),
    toStr(targetIndustryItem?.label)
  );
  const taxonomyContextPack = buildTaxonomyContextPack({
    jobItem: targetJobItem,
    industryItem: targetIndustryItem,
    rawJobLabel: targetJobContext.displayLabel ?? toStr(targetJobItem?.label),
    rawIndustryLabel: targetIndustryContext.displayLabel ?? toStr(targetIndustryItem?.label),
    source: "newgrad_transition_lite_result_vm",
  });

  return {
    ...makeEmptyVm(),
    heroSummary: `${toStr(targetJobItem?.label)} 신입 적합성을 5축 기준으로 읽었습니다.`,
    whyThisRead: whyThisReadFromPacks.length > 0 ? whyThisReadFromPacks : whyThisRead,
    whyThisReadSupportLine: "신입 경로는 현재 직무 대신 전공, 프로젝트, 인턴, 산업 연관 활동, 강점/일하는 방식 기반으로 읽습니다.",
    strengths: (toArr(validated.input.selfReportEvidencePack?.axisFitHints?.axis5?.strengthLabels).length > 0
      ? toArr(validated.input.selfReportEvidencePack?.axisFitHints?.axis5?.strengthLabels)
      : validated.input.selfReportProfile.normalizedStrengthLabels).slice(0, 5),
    certEvidencePack: validated.input.certEvidencePack,
    experienceEvidencePack: validated.input.experienceEvidencePack,
    selfReportEvidencePack: validated.input.selfReportEvidencePack,
    topRepairSignals: buildTopRepairSignals(axisPack),
    strengthEvidenceRead: buildStrengthEvidenceReadFromPacks(axisPack, validated.input),
    inputEvidenceRead: buildInputEvidenceReadFromPacks(axisPack, validated.input),
    axisReadSummary: buildAxisReadSummaryFromPacks(axisPack, validated.input),
    newgradGoalComparisonTable,
    transitionReadBlock: {
      sectionTitle: "신입 전환 판독, 한눈에 보는 해석",
      intro: "현재 직무 전환이 아닌 신입 관점에서, 보유 증거가 목표 직무와 얼마나 이어지는지 5축으로 확인합니다.",
      cards: [],
      meta: {
        currentJobLabel: "신입 경로",
        targetJobLabel: toStr(targetJobItem?.label),
      },
    },
    targetJobRead: buildTransitionLiteTargetJobRead(targetJobItem, targetJobContext),
    targetIndustryRead: buildTransitionLiteTargetIndustryRead(targetIndustryItem, targetIndustryContext),
    targetIndustryLabel: toStr(targetIndustryItem?.label),
    targetJobDisplayLabel: targetJobContext.displayLabel ?? toStr(targetJobItem?.label),
    targetIndustryDisplayLabel: targetIndustryContext.displayLabel ?? toStr(targetIndustryItem?.label),
    taxonomyContextPack,
    axisPack,
    whatIfPreparationPack: buildNewgradPreparationWhatIfPreviewPack({ axisPack }),
  };
}

export default buildNewgradTransitionLiteResult;
