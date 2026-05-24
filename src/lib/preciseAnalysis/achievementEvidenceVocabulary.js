// src/lib/preciseAnalysis/achievementEvidenceVocabulary.js
// T2: 성과 표현(achievement evidence) 직무·산업 맥락 범주 사전 + 분류 helper
//
// 목적:
//  - buildAchievementEvidenceGapRisk가 단순 "정량 비율"만 보지 않고,
//    이력서의 성과 표현을 직무별 성과 지표 범주(성장/효율/품질/매출/실행/규모)로
//    분류해 사용자가 "어떤 유형 성과는 확인되고, 어떤 유형은 부족한지" 볼 수 있게 한다.
//  - JD 컨텍스트(expectedFromJd 산출)는 이 helper의 책임이 아니다.
//    JD context를 engine에 전달하는 caller-side 변경(App.jsx)이 필요한 작업으로,
//    이번 PR 범위에서는 found 분류만 다룬다. 후속 PR에서 expectedFromJd를 채울 수 있도록
//    bucket 구조와 우선순위는 동일하게 둔다.
//
// 사용 위치: buildAchievementEvidenceGapRisk.js
//
// 주의:
//  - 사전에 등록된 metric 표현을 포함한 텍스트만 bucket에 잡힌다.
//    숫자만 있고 metric 단어가 없으면 분류되지 않는다 (over-claim 방지).

export const ACHIEVEMENT_BUCKETS = Object.freeze({
  growthMetric:     { key: "growthMetric",     label: "성장/전환 지표" },
  efficiencyMetric: { key: "efficiencyMetric", label: "효율/시간 절감" },
  qualityMetric:    { key: "qualityMetric",    label: "품질/안정성" },
  revenueMetric:    { key: "revenueMetric",    label: "매출/수익" },
  deliveryMetric:   { key: "deliveryMetric",   label: "실행/납기" },
  scaleMetric:      { key: "scaleMetric",      label: "규모/범위" },
});

// 우선순위: strongest 결정 시 동률이면 위에서부터 선택.
// "사용자 액션으로 바로 연결되는" 범주를 앞에 둔다.
const BUCKET_PRIORITY = [
  "growthMetric",
  "revenueMetric",
  "efficiencyMetric",
  "qualityMetric",
  "deliveryMetric",
  "scaleMetric",
];

// 모든 entry는 lowercase + trim + 다중 공백 1칸 normalize 기준이다.
// 한 metric은 여러 bucket에 등록될 수 있다 (한 표현이 여러 의미를 가질 수 있어).
// 단, 우선순위 첫 매칭만 잡혀서 over-attribution을 줄인다.
const METRIC_VOCAB = Object.freeze({
  growthMetric: [
    "전환율", "전환", "conversion", "cvr",
    "리텐션", "retention", "잔존",
    "활성", "활성화", "activation", "활성 사용자", "활성사용자",
    "dau", "mau", "wau",
    "퍼널", "funnel", "코호트", "cohort",
    "이탈률", "이탈율", "churn",
    "성장률", "성장율", "growth rate",
    "신규 가입", "회원 가입", "가입 전환",
    "ctr", "클릭률", "클릭율",
  ],

  revenueMetric: [
    "매출", "수익", "거래액", "gmv",
    "객단가", "arpu", "arppu",
    "수주", "계약", "계약률", "계약율",
    "mrr", "arr",
    "구매", "결제", "결제 전환",
    "리드", "lead",
    "재구매", "재구매율",
    "roas", "cac", "ltv", "cpa", "cpc", "cpm",
  ],

  efficiencyMetric: [
    "처리시간", "처리 시간", "응답시간", "응답 시간",
    "리드타임", "lead time",
    "단축", "절감", "감축", "감소",
    "자동화", "automation",
    "효율", "운영 효율",
    "빌드 시간", "빌드시간", "build time",
    "배포 시간", "배포시간",
    "cycle time", "사이클 타임",
    "비용 절감", "원가 절감",
  ],

  qualityMetric: [
    "uptime", "가용성", "안정성",
    "오류율", "에러율", "error rate", "버그 감소",
    "장애", "장애 시간", "장애시간", "장애율", "장애건수",
    "sla", "slo",
    "만족도", "csat", "nps",
    "재문의율", "재문의",
    "테스트 커버리지", "코드 커버리지", "code coverage",
    "성능 개선", "성능개선",
    "latency", "응답 지연",
    "품질", "품질 관리", "품질관리",
  ],

  deliveryMetric: [
    "출시", "런칭", "런치", "launch",
    "배포", "릴리즈", "release", "deploy", "deployment",
    "마이그레이션", "migration",
    "mvp",
    "로드맵", "roadmap",
    "스프린트", "sprint",
    "백로그", "backlog",
    "pr", "pull request",
    "프로토타입", "prototype",
    "정책 수립", "정책수립",
    "프로세스", "프로세스 개선",
    "매뉴얼", "표준화",
    "poc",
  ],

  scaleMetric: [
    "트래픽", "traffic",
    "tps", "qps", "rps",
    "동시접속", "동시 접속",
    "사용자 수", "회원 수", "고객 수", "고객사 수",
    "파트너 수", "협력사 수",
    "세션", "session",
    "방문수", "방문 수", "방문자수", "uv", "pv",
    "데이터량", "데이터 처리량",
    "도달", "노출", "impressions", "reach",
    "팔로워", "follower", "구독자",
    "처리건수", "처리 건수",
  ],
});

function normalize(value) {
  return String(value ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

// 한 텍스트가 어떤 bucket에 속하는지 우선순위 순서로 첫 매칭 bucket을 반환.
// 매칭 규칙: bucket 사전의 entry가 텍스트 안에 포함되어 있으면 매칭.
// entry length >= 2 (한글 단어가 2자 entry도 있어 일반 짧은 영문 noise는 사전에서 거의 배제됨).
function classifyOne(textNorm) {
  if (!textNorm) return null;
  for (const bucketKey of BUCKET_PRIORITY) {
    const entries = METRIC_VOCAB[bucketKey];
    if (!Array.isArray(entries)) continue;
    for (const rawEntry of entries) {
      const entry = normalize(rawEntry);
      if (!entry || entry.length < 2) continue;
      if (textNorm.includes(entry)) return bucketKey;
    }
  }
  return null;
}

/**
 * 이력서 성과 표현 텍스트 배열을 입력받아 bucket별로 분류한다.
 *
 * @param {Object} args
 * @param {string[]} args.texts — achievements + quantified bullets 등 분류 대상 표현
 * @returns {{
 *   achievementBuckets: Array<{ bucket: string, label: string, found: string[] }>,
 *   strongestPresentBucket: { bucket: string, label: string, foundCount: number } | null
 * }}
 */
export function classifyAchievementBuckets({ texts = [] } = {}) {
  const safeTexts = Array.isArray(texts) ? texts : [];

  // bucket key → Set of displayed phrases (Set으로 dedupe)
  const acc = new Map();

  for (const raw of safeTexts) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const n = normalize(trimmed);
    const bucketKey = classifyOne(n);
    if (!bucketKey) continue;
    if (!acc.has(bucketKey)) acc.set(bucketKey, new Set());
    // display 용 원문은 trim만 (chip 단계에서 truncate)
    acc.get(bucketKey).add(trimmed);
  }

  const achievementBuckets = [];
  for (const bucketKey of BUCKET_PRIORITY) {
    const slot = acc.get(bucketKey);
    if (!slot || slot.size === 0) continue;
    achievementBuckets.push({
      bucket: bucketKey,
      label: ACHIEVEMENT_BUCKETS[bucketKey]?.label || bucketKey,
      found: Array.from(slot),
    });
  }

  let strongestPresentBucket = null;
  for (const entry of achievementBuckets) {
    if (!strongestPresentBucket || entry.found.length > strongestPresentBucket.foundCount) {
      strongestPresentBucket = {
        bucket: entry.bucket,
        label: entry.label,
        foundCount: entry.found.length,
      };
    }
  }

  return { achievementBuckets, strongestPresentBucket };
}

// T2.5: JD context를 입력받아 직무·산업 맥락 성과 bucket별 expected[] 산출.
// caller(App.jsx)에서 buildAchievementEvidenceGapRisk 3번째 인자로 전달된 jdContext를
// 이 helper가 받아 raw.achievementBuckets[].expectedFromJd로 합쳐 넣을 수 있게 한다.
//
// 입력 후보 (우선순위 순):
//   1. jdContext.keywordBuckets — T1의 raw.keywordBuckets (matched + missing 합쳐 분류 대상으로 사용)
//   2. jdContext.domainKeywords — fit.jdModel.domainKeywords (이미 normalize 후)
//   3. jdContext.jdText, jdContext.targetRoleInPosting — 1·2 외에 추가 hint (이번 PR에서는 미사용,
//      구조만 노출해 후속 PR이 사전 확장 시 활용)
//
// 출력: [{ bucket, label, expected: string[] }]
// expected는 bucket당 최대 5개, dedupe, normalize 기준 정규화된 표현.
//
// 주의: JD/JD-derived keyword에 실제 등장한 표현만 사용한다. 없는 표현 합성 금지.

const MAX_EXPECTED_PER_BUCKET = 5;
const MAX_EXPECTED_CHIP_LEN = 40;

function dedupeTruncate(values) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(values) ? values : []) {
    if (typeof v !== "string") continue;
    const trimmed = v.trim();
    if (!trimmed) continue;
    const display = trimmed.length > MAX_EXPECTED_CHIP_LEN
      ? `${trimmed.slice(0, MAX_EXPECTED_CHIP_LEN - 1)}…`
      : trimmed;
    const dedupeKey = normalize(display);
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    out.push(display);
  }
  return out;
}

/**
 * JD context에서 직무 맥락 성과 bucket별 expected metric 키워드를 산출.
 *
 * @param {Object} jdContext
 * @param {Array<{ bucket: string, label: string, matched?: string[], missing?: string[], keywords?: string[] }>} [jdContext.keywordBuckets]
 *   — T1 raw.keywordBuckets. metricOutcome bucket의 matched + missing은 보너스 시드로 사용.
 * @param {string[]} [jdContext.domainKeywords]
 *   — fit.jdModel.domainKeywords. METRIC_VOCAB로 분류해 expected 후보로 사용.
 * @param {string} [jdContext.jdText]
 *   — 이번 PR에서는 미사용 (signature only).
 * @param {string} [jdContext.targetRoleInPosting]
 *   — 이번 PR에서는 미사용 (signature only).
 * @returns {Array<{ bucket: string, label: string, expected: string[] }>}
 */
export function deriveExpectedAchievementMetricsFromJd(jdContext = {}) {
  const safeContext = jdContext && typeof jdContext === "object" ? jdContext : {};

  // bucket key → Set (dedupe by normalized form, preserve display)
  const acc = new Map();
  const seenNorm = new Map(); // bucketKey → Set of normalized strings already added

  function pushTo(bucketKey, rawText) {
    if (typeof rawText !== "string") return;
    const trimmed = rawText.trim();
    if (!trimmed) return;
    const n = normalize(trimmed);
    if (!n) return;
    if (!acc.has(bucketKey)) {
      acc.set(bucketKey, []);
      seenNorm.set(bucketKey, new Set());
    }
    const seen = seenNorm.get(bucketKey);
    if (seen.has(n)) return;
    seen.add(n);
    acc.get(bucketKey).push(trimmed);
  }

  // 1차 시드: T1 keywordBuckets metricOutcome bucket
  // (T1의 metricOutcome 사전과 T2 METRIC_VOCAB은 의도적으로 일부 겹친다.
  //  여기서는 metricOutcome bucket 안 키워드를 T2 buckets로 재분류해서
  //  성장/매출/효율/품질 등으로 더 잘게 나눈다.)
  const kwBuckets = Array.isArray(safeContext.keywordBuckets) ? safeContext.keywordBuckets : [];
  for (const entry of kwBuckets) {
    const bucketKey = String(entry?.bucket || "");
    if (bucketKey !== "metricOutcome") continue;
    const seeds = [
      ...(Array.isArray(entry?.matched) ? entry.matched : []),
      ...(Array.isArray(entry?.missing) ? entry.missing : []),
      ...(Array.isArray(entry?.keywords) ? entry.keywords : []),
    ];
    for (const kw of seeds) {
      if (typeof kw !== "string") continue;
      const n = normalize(kw);
      const t2Bucket = classifyOne(n);
      if (t2Bucket) pushTo(t2Bucket, kw);
    }
  }

  // 2차 시드: domainKeywords (fit.jdModel.domainKeywords)
  const domainKws = Array.isArray(safeContext.domainKeywords) ? safeContext.domainKeywords : [];
  for (const kw of domainKws) {
    if (typeof kw !== "string") continue;
    const n = normalize(kw);
    const t2Bucket = classifyOne(n);
    if (t2Bucket) pushTo(t2Bucket, kw);
  }

  // 우선순위 순서로 결과 배열 빌드 (bucket당 최대 5개 + dedupe/truncate)
  const result = [];
  for (const bucketKey of BUCKET_PRIORITY) {
    const list = acc.get(bucketKey);
    if (!list || list.length === 0) continue;
    const expected = dedupeTruncate(list).slice(0, MAX_EXPECTED_PER_BUCKET);
    if (!expected.length) continue;
    result.push({
      bucket: bucketKey,
      label: ACHIEVEMENT_BUCKETS[bucketKey]?.label || bucketKey,
      expected,
    });
  }
  return result;
}

export const __TEST_ONLY__ = {
  BUCKET_PRIORITY,
  METRIC_VOCAB,
  normalize,
  classifyOne,
  dedupeTruncate,
  MAX_EXPECTED_PER_BUCKET,
};
