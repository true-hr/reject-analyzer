const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const MATCH_ORDER = { missing: 0, weak: 1, partial: 2, unclear: 3, strong: 4 };

export const DEFAULT_TOPIC_BUCKETS = [
  {
    key: "renewal_upsell",
    textPattern: /재계약|업셀|추가 서비스|매출 확대/i,
    questionPattern: /재계약|업셀|추가 서비스|매출/i,
  },
  {
    key: "data_risk",
    textPattern: /데이터|사용 데이터|리스크|crm|지표|분석/i,
    questionPattern: /데이터|리스크|crm|지표|분석|고객 사용/i,
  },
  {
    key: "collaboration",
    textPattern: /문의|문제 해결|운영팀|협업|고객 요구사항/i,
    questionPattern: /문의|문제|해결|요구사항/i,
  },
  {
    key: "saas_onboarding",
    textPattern: /saas|온보딩|제품 활용/i,
    questionPattern: /saas|온보딩|제품 활용/i,
  },
];

export const JOB_CALIBRATION_PROFILES = {
  frontend: {
    coreKeywords: [
      /typescript/i,
      /react/i,
      /javascript/i,
      /rest api/i,
      /api 연동/i,
      /비동기/i,
      /git/i,
      /컴포넌트 기반 ui 설계/i,
    ],
    operationalKeywords: [
      /웹 성능/i,
      /성능 최적화/i,
      /크로스 브라우징/i,
      /브라우저 호환/i,
      /lighthouse/i,
      /web vital/i,
      /렌더링 성능/i,
      /레거시/i,
      /리팩토링/i,
      /운영 환경/i,
      /품질 개선/i,
    ],
    topicBuckets: [
      {
        key: "frontend_perf",
        textPattern: /성능 최적화|웹 성능|크로스 브라우징|브라우저 호환|lighthouse|web vital|렌더링 성능/i,
        questionPattern: /성능|최적화|크로스|브라우저|lighthouse|web vital|렌더링/i,
      },
      {
        key: "frontend_stack",
        textPattern: /typescript|react|javascript|rest api|api 연동|비동기|git/i,
        questionPattern: /typescript|react|javascript|api|연동|비동기|git/i,
      },
      {
        key: "frontend_ui",
        textPattern: /figma|ui 구현|화면 구현|컴포넌트|반응형|tailwind|css/i,
        questionPattern: /figma|ui|화면|컴포넌트|반응형|css/i,
      },
      {
        key: "frontend_ux",
        textPattern: /사용자 흐름|입력 단계|결과 페이지|사용성|ux 개선|사용자 피드백/i,
        questionPattern: /사용자|흐름|입력|결과|사용성|ux|피드백/i,
      },
    ],
  },
};

const DEFAULT_PROFILE_KEY = "frontend";

function getProfile(profileKey = DEFAULT_PROFILE_KEY) {
  return JOB_CALIBRATION_PROFILES[profileKey] ?? JOB_CALIBRATION_PROFILES[DEFAULT_PROFILE_KEY];
}

export function getTopicBucket(text, profileKey = DEFAULT_PROFILE_KEY) {
  const t = String(text || "").toLowerCase();
  const profile = getProfile(profileKey);
  for (const bucket of profile.topicBuckets) {
    if (bucket.textPattern.test(t)) return bucket.key;
  }
  for (const bucket of DEFAULT_TOPIC_BUCKETS) {
    if (bucket.textPattern.test(t)) return bucket.key;
  }
  return null;
}

export function getQuestionKeywordForTopic(topic, profileKey = DEFAULT_PROFILE_KEY) {
  const profile = getProfile(profileKey);
  const inProfile = profile.topicBuckets.find((b) => b.key === topic);
  if (inProfile) return inProfile.questionPattern;
  const inDefault = DEFAULT_TOPIC_BUCKETS.find((b) => b.key === topic);
  return inDefault ? inDefault.questionPattern : null;
}

export function isOperationalQualityGap(gap, profileKey = DEFAULT_PROFILE_KEY) {
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")} ${String(gap.riskReason || "")}`.toLowerCase();
  const profile = getProfile(profileKey);
  return profile.operationalKeywords.some((kw) => kw.test(text));
}

export function isCoreRequirementGap(gap, profileKey = DEFAULT_PROFILE_KEY) {
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")}`.toLowerCase();
  const profile = getProfile(profileKey);
  return profile.coreKeywords.some((kw) => kw.test(text));
}

export function getGapPriorityWeight(gap, profileKey = DEFAULT_PROFILE_KEY) {
  if (isCoreRequirementGap(gap, profileKey)) return 0;
  if (isOperationalQualityGap(gap, profileKey)) return 2;
  return 1;
}

export function calibrateMustGapForDisplay(gap, profileKey = DEFAULT_PROFILE_KEY) {
  if (!isOperationalQualityGap(gap, profileKey)) return gap;
  const sev = String(gap.severity || "").toLowerCase();
  if (sev !== "critical" && sev !== "high") return gap;
  return { ...gap, severity: "medium" };
}

export function sortCalibratedMustGaps(gaps, profileKey = DEFAULT_PROFILE_KEY) {
  return [...gaps].sort((a, b) => {
    const wa = getGapPriorityWeight(a, profileKey);
    const wb = getGapPriorityWeight(b, profileKey);
    if (wa !== wb) return wa - wb;
    const oa = SEV_ORDER[String(a.severity || "").toLowerCase()] ?? 99;
    const ob = SEV_ORDER[String(b.severity || "").toLowerCase()] ?? 99;
    if (oa !== ob) return oa - ob;
    const ma = MATCH_ORDER[String(a.matchLevel || "").toLowerCase()] ?? 99;
    const mb = MATCH_ORDER[String(b.matchLevel || "").toLowerCase()] ?? 99;
    return ma - mb;
  });
}

export function getLinkedQuestionForGap(gap, questions, { profileKey = DEFAULT_PROFILE_KEY } = {}) {
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")} ${String(gap.riskReason || "")}`;
  const topic = getTopicBucket(text, profileKey);
  if (!topic) return null;
  const kw = getQuestionKeywordForTopic(topic, profileKey);
  if (!kw) return null;
  return questions.find((q) => kw.test(String(q.question || "").toLowerCase())) || null;
}

export function buildCalibratedMustGaps(mustGaps, { profileKey = DEFAULT_PROFILE_KEY } = {}) {
  return sortCalibratedMustGaps(
    mustGaps.map((gap) => calibrateMustGapForDisplay(gap, profileKey)),
    profileKey,
  );
}
