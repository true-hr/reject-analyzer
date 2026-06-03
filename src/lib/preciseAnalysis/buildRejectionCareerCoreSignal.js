import { buildCareerProfileFromResumeProfile } from "../career-core/index.js";
import { buildCareerCoreTargetFromJdFit } from "../resume/buildCareerCoreTargetFromJdFit.js";

const SIGNAL_STATUS = Object.freeze({
  READY: "ready",
  SKIPPED: "skipped",
});

const COPY = Object.freeze({
  label: "Career Core v0 reference signal",
  caution:
    "Career Core v0 참고 신호입니다. 직무/산업 신호 기준의 보조 분류이며 탈락 원인 확정이 아닌 참고용 해석입니다.",
  description: "직무/산업 신호 기준의 보조 분류",
  classificationBasisLabel: "경험 항목 기준 합산",
  bucketLabels: Object.freeze({
    direct: "직접 유관",
    adjacent: "인접",
    transferable: "전환 가능",
    unrelated: "비유관",
    unknown: "판단 보류",
  }),
});

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function hasResumeProfile(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function buildSkippedSignal(reason) {
  return {
    status: SIGNAL_STATUS.SKIPPED,
    reason,
    source: "career_core_v0",
    target: null,
    primaryFitLevel: "unknown",
    monthBuckets: {
      direct: 0,
      adjacent: 0,
      transferable: 0,
      unrelated: 0,
      unknown: 0,
      total: 0,
    },
    classificationBasis: "experience_duration_sum",
    copy: COPY,
    fit: null,
  };
}

function buildMonthBuckets(summary = {}) {
  const source = safeObject(summary);
  return {
    direct: source.directlyRelevantMonths ?? 0,
    adjacent: source.adjacentRelevantMonths ?? 0,
    transferable: source.transferableMonths ?? 0,
    unrelated: source.unrelatedMonths ?? 0,
    unknown: source.unknownMonths ?? 0,
    total: source.totalClassifiedMonths ?? 0,
  };
}

export function buildRejectionCareerCoreSignal({
  resumeProfile,
  profile,
  jdText,
  fit,
  targetRole,
  targetCompany,
  targetIndustry,
  currentDate,
} = {}) {
  const sourceProfile = resumeProfile ?? profile;
  if (!hasResumeProfile(sourceProfile)) {
    return buildSkippedSignal("missing_resume_profile");
  }

  const target = buildCareerCoreTargetFromJdFit({
    fit,
    jdText,
    targetRole,
    targetCompany,
    targetIndustry,
  });

  if (!target) {
    return buildSkippedSignal("target_not_inferred");
  }

  const careerProfile = buildCareerProfileFromResumeProfile(sourceProfile, {
    currentDate,
    target,
  });
  const careerFit = careerProfile?.fit;

  if (!careerFit) {
    return buildSkippedSignal("career_fit_not_available");
  }

  return {
    status: SIGNAL_STATUS.READY,
    source: "career_core_v0",
    target: careerFit.target,
    primaryFitLevel: careerFit.summary.primaryFitLevel,
    monthBuckets: buildMonthBuckets(careerFit.summary),
    classificationBasis: careerFit.summary.classificationBasis,
    copy: COPY,
    fit: careerFit,
  };
}

export default buildRejectionCareerCoreSignal;
