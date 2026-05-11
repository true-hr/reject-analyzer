// src/lib/adapters/buildRecruiterReadContext.js
// v1 deterministic builder for recruiterReadContext.
// Read-path: job ontology + transition-read-meta + major-dependency registries
//             + industry registry (via buildIndustryContext) + industry archetype registry.
// Does NOT connect to rejection-analysis request flow — that is step 3 in the locked sequence.
// See: docs/PASSMAP_REJECTION_ANALYSIS_RECRUITER_READ_CONTEXT_POLICY.md

import { getJobOntologyItemById } from "../../data/job/jobOntology.index.js";
import { getTransitionReadJobMeta } from "../../data/transitionLite/jobTransitionReadMetaRegistry.js";
import { getJobMajorDependencyProfile } from "../../data/transitionLite/jobMajorDependencyRegistry.js";
import { NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE } from "../../data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js";
import { getIndustryRegistryItemById } from "../../data/industry/industryRegistry.index.js";
import { buildIndustryContext } from "./buildIndustryContext.js";
import { getIndustryArchetype } from "../../data/transitionLite/industryArchetypeRegistry.js";

const VERSION = "1.0.0";

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function toStr(value) {
  return value && typeof value === "string" ? value.trim() : null;
}

function buildEmptyJob() {
  return {
    id: null,
    label: null,
    missionType: null,
    outputType: null,
    successMetricType: null,
    majorDependency: { tier: null, reason: null },
    primaryStakeholders: [],
    stakeholderRationale: null,
  };
}

function buildEmptyIndustry() {
  return {
    id: null,
    label: null,
    coreContext: [],
    workContextEvidenceExamples: [],
    interviewPrepSuggestions: [],
  };
}

function resolveJobBlock(jobId) {
  const safeId = toStr(jobId);
  if (!safeId) return { block: buildEmptyJob(), available: false };

  const jobItem = getJobOntologyItemById(safeId);
  if (!jobItem) return { block: buildEmptyJob(), available: false };

  const meta = getTransitionReadJobMeta(safeId);
  const depProfile = getJobMajorDependencyProfile(safeId);

  const sp = meta?.stakeholderPrimary;
  const primaryStakeholders = Array.isArray(sp) ? sp.filter(Boolean) : sp ? [sp] : [];

  // majorDependency: null-out when the job is not registered in the dependency registry
  const tier = depProfile?.matched ? (toStr(depProfile.tier) ?? null) : null;
  const reason = depProfile?.matched ? (toStr(depProfile.reason) ?? null) : null;

  const stakeholderRationale = toStr(
    NEWGRAD_AXIS4_JOB_STAKEHOLDER_RELEVANCE?.[safeId]?.rationale ?? null
  );

  return {
    block: {
      id: toStr(jobItem.id),
      label: toStr(jobItem.label),
      missionType: toStr(meta?.missionType) ?? null,
      outputType: toStr(meta?.outputType) ?? null,
      successMetricType: toStr(meta?.successMetricType) ?? null,
      majorDependency: { tier, reason },
      primaryStakeholders,
      stakeholderRationale,
    },
    available: true,
  };
}

function resolveIndustryBlock(industryId) {
  const safeId = toStr(industryId);
  if (!safeId) return { block: buildEmptyIndustry(), available: false };

  const registryItem = getIndustryRegistryItemById(safeId);
  if (!registryItem) return { block: buildEmptyIndustry(), available: false };

  const ctx = buildIndustryContext(registryItem);

  // workContextEvidenceExamples and interviewPrepSuggestions from archetype registry (lookup by label)
  const archetype = getIndustryArchetype(ctx.label);
  const workContextEvidenceExamples = toArr(archetype?.workContextEvidenceExamples).slice(0, 5);
  const interviewPrepSuggestions = toArr(archetype?.interviewPrepSuggestions).slice(0, 3);

  return {
    block: {
      id: toStr(ctx.id),
      label: toStr(ctx.label),
      coreContext: toArr(ctx.coreContext).slice(0, 6),
      workContextEvidenceExamples,
      interviewPrepSuggestions,
    },
    available: true,
  };
}

// ─────────────────────────────────────────────
// buildRecruiterReadContext
// Input:  { jobId?: string | null, industryId?: string | null }
// Output: recruiterReadContext v1 — always returns a full object, never null
// Fields: only v1 contract fields per SSOT policy
// ─────────────────────────────────────────────
export function buildRecruiterReadContext({ jobId = null, industryId = null } = {}) {
  const { block: job, available: jobContextAvailable } = resolveJobBlock(jobId);
  const { block: industry, available: industryContextAvailable } = resolveIndustryBlock(industryId);

  return {
    version: VERSION,
    job,
    industry,
    provenance: {
      jobContextAvailable,
      industryContextAvailable,
      source: "deterministic_registry",
    },
  };
}
