import { JUDGMENT_TYPES, JUDGMENT_STATUS } from "../judgmentTypes.js";

// INPUT SOURCE PRIORITY (이 builder의 소스 우선순위)
// 1순위: vm.interpretationV2.evidenceDepth (canonical 증빙 심도 분석)
// ※ buckets: action/result/scope/ownership/challenge 등 항목별 hit count
// ※ status: "strong" | "moderate" | "weak" | "none" (upstream이 판정)
// ※ narrative: upstream이 생성한 자연어 설명 (generic 여부 확인 필요)
// READY: upstream status가 strong 또는 moderate + bucketCount > 0
// PARTIAL: 그 외

const BUCKET_LABELS = {
  action: "주도 행위",
  result: "성과·수치",
  scope: "규모·범위",
  ownership: "오너십",
  challenge: "문제·과제 맥락",
};

// proofMissing 우선 점검 bucket (중요도 순)
const PRIORITY_BUCKETS = ["action", "result", "ownership"];

function __text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function __isGeneric(value) {
  const text = __text(value).toLowerCase();
  if (!text) return true;
  return /추가 확인|판단이 필요|증빙이 부족|근거 없음/.test(text);
}

function __countBuckets(buckets) {
  if (!buckets || typeof buckets !== "object") return 0;
  return Object.values(buckets).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function __bucketLabel(key) {
  return BUCKET_LABELS[key] || key;
}

function __contextFromEvidenceDepth(status, bucketCount, buckets) {
  if (bucketCount === 0) return null;
  const filled = Object.entries(buckets || {})
    .filter(([, v]) => Number(v) > 0)
    .map(([k]) => __bucketLabel(k));
  if (status === "strong") return `근거 밀도 양호: ${filled.slice(0, 3).join(", ")} 확인됨`;
  if (status === "moderate") return `일부 근거 확인: ${filled.slice(0, 2).join(", ")}`;
  return `근거 부족: ${filled.slice(0, 2).join(", ")} 수준에 머묾`;
}

export function buildEvidenceDensity({ vm = null } = {}) {
  const evidenceDepth = vm?.interpretationV2?.evidenceDepth || null;
  const status = __text(evidenceDepth?.status);
  const narrative = __text(evidenceDepth?.narrative);
  const buckets = evidenceDepth?.buckets && typeof evidenceDepth.buckets === "object" ? evidenceDepth.buckets : null;
  const bucketCount = __countBuckets(buckets);

  if (!status) {
    return {
      key: JUDGMENT_TYPES.EVIDENCE_DENSITY,
      status: JUDGMENT_STATUS.UNAVAILABLE,
      confidence: null,
      sourceFamily: "fallback",
      why: null,
      context: null,
      proofFor: [],
      proofMissing: [],
      actionHint: null,
    };
  }

  // READY: upstream status strong/moderate + bucketCount > 0
  // PARTIAL: 그 외
  const judgmentStatus = bucketCount > 0 && (status === "strong" || status === "moderate")
    ? JUDGMENT_STATUS.READY
    : JUDGMENT_STATUS.PARTIAL;

  // confidence: upstream status 기반 (naive count 아님)
  // moderate + bucketCount >= 2 → medium (READY인데 low만 주는 계약 불일치 방지)
  const confidence = status === "strong" || (status === "moderate" && bucketCount >= 2) ? "medium" : "low";

  // why: narrative가 generic이면 suppress
  const why = !__isGeneric(narrative) ? narrative : null;

  // context: 의미 있는 상태 기술 ("evidence buckets: X" 제거)
  const context = __contextFromEvidenceDepth(status, bucketCount, buckets);

  // proofFor: 채워진 bucket의 한국어 레이블 (최대 3개)
  const proofFor = buckets
    ? Object.entries(buckets)
        .filter(([, v]) => Number(v) > 0)
        .map(([k]) => __bucketLabel(k))
        .slice(0, 3)
    : [];

  // proofMissing: 비어있는 priority bucket만 (최대 2개)
  const proofMissing = buckets
    ? PRIORITY_BUCKETS
        .filter((k) => buckets[k] !== undefined && Number(buckets[k]) === 0)
        .map((k) => __bucketLabel(k))
        .slice(0, 2)
    : [];

  return {
    key: JUDGMENT_TYPES.EVIDENCE_DENSITY,
    status: judgmentStatus,
    confidence,
    sourceFamily: "evidence_depth",
    why,
    context,
    proofFor,
    proofMissing,
    actionHint: proofMissing.length > 0
      ? `${proofMissing[0]} 항목을 수치·맥락·결과까지 붙여 보완합니다.`
      : "대표 사례 1개를 수치·범위·결과까지 붙여 증빙합니다.",
  };
}
