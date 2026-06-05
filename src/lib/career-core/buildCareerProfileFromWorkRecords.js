import { buildCareerProfileFromResumeProfile } from "./buildCareerProfileFromResumeProfile.js";
import { createCareerSignal } from "./careerSignalModel.js";
import { normalizeCareerProfile } from "./careerProfileModel.js";

const ADAPTER_SCHEMA_VERSION = "passmap.workRecordsCareerProfileAdapter.v0";
const SOURCE = "work_records";
const DURATION_PRECISION = "record_based_reference";
const RECORD_DATE_WARNING = "record_date_is_not_duration";
const MISSING_DURATION_WARNING = "work_record_duration_unknown";

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeString(value) {
  return String(value ?? "").trim();
}

function safeArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null && safeString(item) !== "");
  const text = safeString(value);
  return text ? [text] : [];
}

function safeRawPayload(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return safeObject(parsed);
    } catch {
      return {};
    }
  }
  return {};
}

function uniqueStrings(values, limit = 30) {
  const out = [];
  const seen = new Set();
  for (const value of values.flatMap((item) => safeArray(item))) {
    const text = safeString(value);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function compactTextParts(parts, limit = 1600) {
  const text = uniqueStrings(parts, 80).join(" ").trim();
  return text.length > limit ? text.slice(0, limit).trim() : text;
}

function readCandidates(raw) {
  return Array.isArray(raw.acceptedCandidates) ? raw.acceptedCandidates.filter(Boolean) : [];
}

function includesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

function readWorkRecordSourceText(record) {
  const raw = safeRawPayload(record?.raw_payload ?? record?.rawPayload);
  return compactTextParts([
    record?.content,
    record?.description,
    record?.task,
    record?.result,
    raw.summary,
  ], 1200);
}

function readWorkRecordSourceRecordId(record, index) {
  return safeString(record?.sourceRecordId) || safeString(record?.id) || `work-record-${index + 1}`;
}

function readWorkRecordRecordDate(record) {
  return safeString(record?.recordDate) || safeString(record?.record_date);
}

function readWorkRecordCreatedAt(record) {
  return safeString(record?.createdAt) || safeString(record?.created_at);
}

function sourceTraceForWorkRecord(record, index) {
  const sourceText = readWorkRecordSourceText(record);
  const sourceRecordId = readWorkRecordSourceRecordId(record, index);
  const recordDate = readWorkRecordRecordDate(record);
  const createdAt = readWorkRecordCreatedAt(record);

  return {
    sourceText,
    sourceRecordId,
    ...(recordDate ? { recordDate } : {}),
    ...(createdAt ? { createdAt } : {}),
    sourceField: "content",
  };
}

function hasRequiredStrengthSource(trace) {
  return Boolean(trace.sourceText && trace.sourceRecordId && (trace.recordDate || trace.createdAt));
}

function missingEvidenceItem(signal, label, clarificationQuestion) {
  return {
    signal,
    label,
    clarificationQuestion,
  };
}

function controlledWorkRecordSignalSource(signal, trace) {
  return {
    type: "controlled_work_record_signal",
    refId: safeString(signal),
    field: safeString(trace?.sourceField) || "content",
  };
}

function toControlledWorkRecordCareerSignal(signal, type, trace, evidenceLevel, reasonCode = null) {
  return {
    ...createCareerSignal({
      type,
      label: signal,
      source: controlledWorkRecordSignalSource(signal, trace),
      evidenceText: trace.sourceText,
      confidence: type === "strength_hint" ? 0.82 : 0.74,
      weight: type === "strength_hint" ? 0.72 : 0.6,
    }),
    controlledWorkRecordSignalCandidate: true,
    evidenceLevel,
    evidenceLevels: [evidenceLevel],
    reasonCode,
    sourceTraces: [trace],
  };
}

function uniqueSignals(signals) {
  const out = [];
  const seen = new Set();

  for (const signal of signals) {
    const key = [signal.type, signal.label, signal.source?.refId, signal.evidenceText].join("::");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(signal);
  }

  return out;
}

function classifyControlledWorkRecord(record, index) {
  const trace = sourceTraceForWorkRecord(record, index);
  const text = trace.sourceText;
  const strengthSignals = [];
  const riskSignals = [];
  const missingEvidence = [];

  const addStrength = (signal, evidenceLevel) => {
    if (!hasRequiredStrengthSource(trace)) return;
    strengthSignals.push(toControlledWorkRecordCareerSignal(signal, "strength_hint", trace, evidenceLevel));
  };
  const addRisk = (signal, evidenceLevel, reasonCode) => {
    riskSignals.push(toControlledWorkRecordCareerSignal(signal, "risk_hint", trace, evidenceLevel, reasonCode));
  };

  if (!text) {
    addRisk("missing_context", "missing_context", "missing_work_record_source_text");
    missingEvidence.push(missingEvidenceItem("missing_context", "work_purpose", "어떤 업무를 어떤 목적과 기준으로 수행했나요?"));
    return { strengthSignals, riskSignals, missingEvidence };
  }

  if (includesAny(text, [/PO가\s*담당/, /PO\s*가\s*담당/i, /최종\s*요구사항.*PO/, /우선순위\s*결정.*PO/])) {
    addRisk("contradicted_ownership", "contradicted_ownership", "ownership_claim_contradicted");
    missingEvidence.push(
      missingEvidenceItem("user_role", "user_role", "회의 참여 중 본인이 직접 정리하거나 결정한 요구사항 범위는 무엇인가요?"),
      missingEvidenceItem("judgment_criteria", "judgment_criteria", "PO가 결정한 항목과 별도로 본인이 판단한 기준은 무엇인가요?")
    );
    return { strengthSignals, riskSignals, missingEvidence };
  }

  if (includesAny(text, [/PM이\s*정한/, /개선\s*요청\s*목록/, /노션.*정리/, /개발팀.*전달/])) {
    addRisk("product_ownership_unclear", "inferred_weak_activity", "ambiguous_ownership");
    addRisk("insufficient_ownership_evidence", "inferred_weak_activity", "insufficient_ownership_evidence");
    missingEvidence.push(
      missingEvidenceItem("user_role", "user_role", "개선 요청 목록에서 본인이 직접 정의하거나 결정한 범위는 무엇인가요?"),
      missingEvidenceItem("judgment_criteria", "judgment_criteria", "전달 전에 우선순위나 판단 기준을 본인이 설정했나요?")
    );
    return { strengthSignals, riskSignals, missingEvidence };
  }

  if (includesAny(text, [/엑셀.*자료.*정리/, /월별\s*매출\s*자료.*정리/, /리포트\s*정리\s*완료/, /대시보드.*정리/])) {
    addRisk("insufficient_ownership_evidence", "inferred_weak_activity", "insufficient_ownership_evidence");
    missingEvidence.push(
      missingEvidenceItem("work_purpose", "work_purpose", "자료를 어떤 목적과 기준으로 정리했나요?"),
      missingEvidenceItem("judgment_criteria", "judgment_criteria", "자료 정리 과정에서 본인이 분석하거나 판단한 항목은 무엇인가요?"),
      missingEvidenceItem("result_or_usage", "result_or_usage", "정리한 자료가 어떤 의사결정이나 후속 행동에 사용되었나요?")
    );
    return { strengthSignals, riskSignals, missingEvidence };
  }

  if (includesAny(text, [/회의.*참석/, /회의\s*내용.*정리/])) {
    addRisk("ownership_unclear", "inferred_weak_activity", "ambiguous_ownership");
    missingEvidence.push(
      missingEvidenceItem("user_role", "user_role", "회의에서 본인이 조율하거나 결정한 쟁점은 무엇인가요?"),
      missingEvidenceItem("next_action", "next_action", "회의 정리 이후 본인이 맡은 후속 행동은 무엇인가요?")
    );
    return { strengthSignals, riskSignals, missingEvidence };
  }

  if (includesAny(text, [/온보딩\s*이탈/, /퍼널\s*데이터/, /고객\s*문의/, /개선\s*우선순위/])) {
    addStrength("problem_definition", "explicit_ownership");
    addStrength("prioritization", "explicit_judgment");
  }

  if (includesAny(text, [/전환율\s*하락/, /SQL/, /이벤트\s*로그/, /유입\s*채널/, /원인으로\s*보고/])) {
    addStrength("root_cause_analysis", "explicit_judgment");
    addStrength("sql_query_design", "explicit_judgment");
    addStrength("decision_support", "explicit_impact");
  }

  if (strengthSignals.length === 0 && includesAny(text, [/불명확|모호|원인\s*미상|영향\s*불명/])) {
    addRisk("missing_context", "missing_context", "missing_context");
    missingEvidence.push(missingEvidenceItem("impact_metric", "impact_metric", "성과나 영향은 어떤 지표로 확인했나요?"));
  }

  return { strengthSignals, riskSignals, missingEvidence };
}

function buildControlledWorkRecordSignalCandidates(workRecords, options) {
  if (options?.enableControlledWorkRecordSignals !== true) {
    return {
      strengthSignals: [],
      riskSignals: [],
      missingEvidence: [],
      integrationStatus: "disabled",
      appliedToCareerProfile: false,
    };
  }

  const classified = workRecords.map(classifyControlledWorkRecord);

  return {
    strengthSignals: uniqueSignals(classified.flatMap((item) => item.strengthSignals)),
    riskSignals: uniqueSignals(classified.flatMap((item) => item.riskSignals)),
    missingEvidence: classified.flatMap((item) => item.missingEvidence).filter((item) => item.clarificationQuestion),
    integrationStatus: "read_only_candidate",
    appliedToCareerProfile: false,
  };
}

function readCandidateSkills(candidate) {
  return uniqueStrings([
    candidate?.skills,
  ], 20);
}

function readCandidateJobTags(candidate) {
  return uniqueStrings([
    candidate?.job_tags,
    candidate?.jobTags,
  ], 20);
}

function readCandidateIndustryTags(candidate) {
  return uniqueStrings([
    candidate?.industry_tags,
    candidate?.industryTags,
  ], 20);
}

function readCandidateEvidenceTexts(candidate) {
  return uniqueStrings([
    candidate?.suggestedResumeBullet,
    candidate?.result,
    candidate?.resultCandidate,
    candidate?.actions,
    candidate?.evidenceTexts,
  ], 20);
}

function evidenceTypeForCandidate(candidate) {
  const confidence = safeString(candidate?.confidenceLevel).toLowerCase();
  const potential = safeString(candidate?.resumePotential).toLowerCase();
  if (confidence === "high" || potential === "high") return "strong";
  if (confidence === "low" || potential === "low") return "weak";
  return "unknown";
}

function buildCandidateBullets(candidate, candidateIndex) {
  const texts = readCandidateEvidenceTexts(candidate);
  const tags = uniqueStrings([
    readCandidateSkills(candidate),
    readCandidateJobTags(candidate),
    readCandidateIndustryTags(candidate),
  ], 30);
  const riskHints = uniqueStrings([
    candidate?.riskNotes,
    candidate?.missingInfoQuestions,
  ], 10);

  const bullets = texts.map((text, index) => ({
    id: `candidate-${candidateIndex + 1}:bullet-${index + 1}`,
    text: compactTextParts([text, tags], 900),
    evidenceType: evidenceTypeForCandidate(candidate),
  }));

  if (bullets.length === 0 && tags.length > 0) {
    bullets.push({
      id: `candidate-${candidateIndex + 1}:tags`,
      text: tags.join(" "),
      evidenceType: "unknown",
    });
  }

  if (riskHints.length > 0) {
    bullets.push({
      id: `candidate-${candidateIndex + 1}:risk`,
      text: riskHints.join(" "),
      evidenceType: "weak",
    });
  }

  return bullets;
}

function hasMonth(value) {
  return /^\d{4}[-/.]\d{1,2}/.test(safeString(value));
}

function readExplicitStart(raw, record) {
  const value = raw.startDate ?? raw.start_date ?? record.startDate ?? record.start_date ?? null;
  return hasMonth(value) ? safeString(value).replace(/[/.]/g, "-") : "";
}

function readExplicitEnd(raw, record) {
  const value = raw.endDate ?? raw.end_date ?? record.endDate ?? record.end_date ?? null;
  return hasMonth(value) ? safeString(value).replace(/[/.]/g, "-") : "";
}

function buildExperienceFromWorkRecord(record, index, warnings) {
  const safeRecord = safeObject(record);
  const raw = safeRawPayload(safeRecord.raw_payload ?? safeRecord.rawPayload);
  const candidates = readCandidates(raw);
  const candidateSkills = candidates.flatMap(readCandidateSkills);
  const candidateJobTags = candidates.flatMap(readCandidateJobTags);
  const candidateIndustryTags = candidates.flatMap(readCandidateIndustryTags);
  const candidateTitles = candidates.map((candidate) => safeString(candidate?.title)).filter(Boolean);
  const candidateRoles = candidates.map((candidate) => safeString(candidate?.role)).filter(Boolean);
  const candidateBullets = candidates.flatMap(buildCandidateBullets);
  const experienceSignalLabels = safeArray(raw.experienceSignals)
    .flatMap((signal) => [signal?.label, signal?.evidenceText, signal?.suggestedResumeAngle]);

  const id = safeString(safeRecord.id) || `work-record-${index + 1}`;
  const recordTitle = safeString(safeRecord.title);
  const titleParts = uniqueStrings([
    recordTitle,
    safeRecord.task,
    raw.summary,
    raw.assetJobTags,
    candidateTitles,
    candidateRoles,
    candidateJobTags,
  ], 20);

  const companyParts = uniqueStrings([
    raw.sourceLabel,
    raw.sourceMode,
    candidateIndustryTags,
  ], 12);

  const recordEvidenceText = compactTextParts([
    safeRecord.description,
    safeRecord.task,
    safeRecord.result,
    raw.summary,
    raw.assetSkills,
    raw.assetJobTags,
    raw.assetCollaborationTags,
    safeRecord.strength_tags,
    safeRecord.skill_tags,
    experienceSignalLabels,
  ]);

  const bullets = [...candidateBullets];
  if (recordEvidenceText) {
    bullets.unshift({
      id: `${id}:record-summary`,
      text: recordEvidenceText,
      evidenceType: "unknown",
    });
  }

  const startDate = readExplicitStart(raw, safeRecord);
  const endDate = readExplicitEnd(raw, safeRecord);
  if (!startDate || !endDate) {
    warnings.push({
      experienceId: id,
      warning: MISSING_DURATION_WARNING,
    });
  }
  if (safeString(safeRecord.record_date)) {
    warnings.push({
      experienceId: id,
      warning: RECORD_DATE_WARNING,
      recordDate: safeString(safeRecord.record_date),
    });
  }

  return {
    id,
    company: companyParts.join(" ") || SOURCE,
    title: titleParts.join(" ") || recordTitle || "Work record",
    ...(startDate && endDate ? { startDate, endDate } : {}),
    bullets,
  };
}

function buildResumeProfileLike(workRecords, warnings) {
  const experiences = workRecords.map((record, index) =>
    buildExperienceFromWorkRecord(record, index, warnings)
  );
  const skills = {
    skills: uniqueStrings(workRecords.flatMap((record) => {
      const raw = safeRawPayload(record?.raw_payload ?? record?.rawPayload);
      const candidates = readCandidates(raw);
      return [
        record?.strength_tags,
        record?.skill_tags,
        raw.assetSkills,
        raw.assetJobTags,
        raw.assetCollaborationTags,
        candidates.flatMap(readCandidateSkills),
        candidates.flatMap(readCandidateJobTags),
        candidates.flatMap(readCandidateIndustryTags),
      ];
    }), 80),
  };

  return {
    schemaVersion: ADAPTER_SCHEMA_VERSION,
    headline: {
      summary: "Career profile derived from PASSMAP work records.",
      keywords: skills.skills,
    },
    experiences,
    skills,
  };
}

export function buildCareerProfileFromWorkRecords(workRecords, options = {}) {
  const adapterWarnings = [];
  const rows = Array.isArray(workRecords) ? workRecords.filter((item) => item && typeof item === "object") : [];
  const resumeProfileLike = buildResumeProfileLike(rows, adapterWarnings);

  const profile = buildCareerProfileFromResumeProfile(resumeProfileLike, options);
  const existingWarnings = Array.isArray(profile?.meta?.warnings) ? profile.meta.warnings : [];
  const controlledCandidates = buildControlledWorkRecordSignalCandidates(rows, options);

  return normalizeCareerProfile({
    ...profile,
    signals: {
      ...profile.signals,
      strengthSignals: [
        ...profile.signals.strengthSignals,
        ...controlledCandidates.strengthSignals,
      ],
      riskSignals: [
        ...profile.signals.riskSignals,
        ...controlledCandidates.riskSignals,
      ],
    },
    meta: {
      ...profile.meta,
      source: SOURCE,
      adapterSchemaVersion: ADAPTER_SCHEMA_VERSION,
      adapterInputCount: rows.length,
      resumeProfileSchemaVersion: ADAPTER_SCHEMA_VERSION,
      durationPrecision: DURATION_PRECISION,
      warnings: [
        ...existingWarnings,
        ...adapterWarnings,
      ],
      ...(options?.enableControlledWorkRecordSignals === true ? {
        controlledWorkRecordSignalCandidates: {
          integrationStatus: controlledCandidates.integrationStatus,
          appliedToCareerProfile: controlledCandidates.appliedToCareerProfile,
          missingEvidence: controlledCandidates.missingEvidence,
        },
      } : {}),
    },
  });
}

export default buildCareerProfileFromWorkRecords;
