export const DEFAULT_PROFILE_KEY = "frontend";

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const MATCH_ORDER = { missing: 0, weak: 1, partial: 2, unclear: 3, strong: 4 };

export const JOB_CALIBRATION_PROFILES = {
  frontend: {
    coreKeywords: [
      /typescript/i,
      /react/i,
      /javascript/i,
      /rest api/i,
      /api 연동/i,
      /비동기/i,
      /\bgit\b/i,
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
    ],
  },
  productPlanning: {
    coreKeywords: [
      /prd/i,
      /요구사항 정의/i,
      /요구사항정의/i,
      /기능 정의/i,
      /정책 정의/i,
      /화면설계/i,
      /화면 설계/i,
      /유저 플로우/i,
      /사용자 흐름/i,
      /백로그/i,
      /우선순위/i,
      /스토리보드/i,
      /와이어프레임/i,
      /기획서/i,
      /서비스 기획/i,
      /서비스기획/i,
    ],
    operationalKeywords: [
      /a\/b 테스트/i,
      /ab 테스트/i,
      /퍼널 분석/i,
      /전환율 개선/i,
      /그로스/i,
      /growth/i,
      /실험 설계/i,
      /지표 고도화/i,
      /데이터 기반 의사결정/i,
      /대시보드 고도화/i,
      /자동화/i,
    ],
    topicBuckets: [
      {
        key: "pm_planning",
        textPattern: /prd|요구사항 정의|요구사항정의|기능 정의|정책 정의|화면설계|화면 설계|기획서|서비스 기획|서비스기획/i,
        questionPattern: /prd|요구사항|기능|정책|화면설계|화면 설계|기획서|서비스 기획|서비스기획/i,
      },
      {
        key: "pm_flow",
        textPattern: /유저 플로우|사용자 흐름|사용자 여정|ux 흐름|스토리보드|와이어프레임/i,
        questionPattern: /유저|사용자|흐름|여정|스토리보드|와이어프레임|ux/i,
      },
      {
        key: "pm_backlog",
        textPattern: /백로그|우선순위|스프린트|로드맵|릴리즈|일정 관리/i,
        questionPattern: /백로그|우선순위|스프린트|로드맵|릴리즈|일정/i,
      },
      {
        key: "pm_experiment",
        textPattern: /a\/b 테스트|ab 테스트|퍼널 분석|전환율|그로스|growth|실험 설계|지표 고도화|데이터 기반 의사결정/i,
        questionPattern: /a\/b|ab|퍼널|전환율|그로스|growth|실험|지표|데이터/i,
      },
      {
        key: "pm_collaboration",
        textPattern: /개발자 협업|디자이너 협업|개발팀|디자인팀|이해관계자|stakeholder|cs 협업|마케팅 협업/i,
        questionPattern: /개발자|디자이너|개발팀|디자인팀|이해관계자|stakeholder|cs|마케팅|협업/i,
      },
    ],
  },
};

export function getTopicBucket(text, profileKey = DEFAULT_PROFILE_KEY) {
  const profile = JOB_CALIBRATION_PROFILES[profileKey] ?? JOB_CALIBRATION_PROFILES[DEFAULT_PROFILE_KEY];
  const t = String(text || "").toLowerCase();
  for (const bucket of profile.topicBuckets) {
    if (bucket.textPattern.test(t)) return bucket.key;
  }
  return null;
}

export function getLinkedQuestionForGap(gap, questions, { profileKey = DEFAULT_PROFILE_KEY } = {}) {
  const profile = JOB_CALIBRATION_PROFILES[profileKey] ?? JOB_CALIBRATION_PROFILES[DEFAULT_PROFILE_KEY];
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")} ${String(gap.riskReason || "")}`;
  const topic = getTopicBucket(text, profileKey);
  if (!topic) return null;
  const bucket = profile.topicBuckets.find((b) => b.key === topic);
  if (!bucket) return null;
  return questions.find((q) => bucket.questionPattern.test(String(q.question || "").toLowerCase())) || null;
}

function isOperationalGap(gap, profileKey = DEFAULT_PROFILE_KEY) {
  const profile = JOB_CALIBRATION_PROFILES[profileKey] ?? JOB_CALIBRATION_PROFILES[DEFAULT_PROFILE_KEY];
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")} ${String(gap.riskReason || "")}`.toLowerCase();
  return profile.operationalKeywords.some((kw) => kw.test(text));
}

function isCoreGap(gap, profileKey = DEFAULT_PROFILE_KEY) {
  const profile = JOB_CALIBRATION_PROFILES[profileKey] ?? JOB_CALIBRATION_PROFILES[DEFAULT_PROFILE_KEY];
  const text = `${String(gap.requirement || "")} ${String(gap.jdEvidence || "")}`.toLowerCase();
  return profile.coreKeywords.some((kw) => kw.test(text));
}

function getGapPriorityWeight(gap, profileKey = DEFAULT_PROFILE_KEY) {
  if (isCoreGap(gap, profileKey)) return 0;
  if (isOperationalGap(gap, profileKey)) return 2;
  return 1;
}

function calibrateGapForDisplay(gap, profileKey = DEFAULT_PROFILE_KEY) {
  if (!isOperationalGap(gap, profileKey)) return gap;
  const sev = String(gap.severity || "").toLowerCase();
  if (sev !== "critical" && sev !== "high") return gap;
  return { ...gap, severity: "medium" };
}

export function buildCalibratedMustGaps(mustGaps, { profileKey = DEFAULT_PROFILE_KEY } = {}) {
  return mustGaps
    .map((gap) => calibrateGapForDisplay(gap, profileKey))
    .sort((a, b) => {
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

export function inferCalibrationProfileKey({ jobTitle, targetJob, jdText, resumeText } = {}) {
  const combined = [
    String(jobTitle || ""),
    String(targetJob || ""),
    String(jdText || ""),
    String(resumeText || ""),
  ].join(" ");

  const PM_PATTERN = /서비스기획|서비스 기획|product manager|\bpm\b|\bpo\b|프로덕트 매니저|프로덕트 오너|기획자|화면설계|화면 설계|\bprd\b|요구사항|정책 정의|백로그|유저 플로우/i;
  const FRONTEND_PATTERN = /프론트엔드|frontend|\breact\b|\btypescript\b|\bjavascript\b|ui 개발|웹 개발|rest api/i;

  if (PM_PATTERN.test(combined)) return "productPlanning";
  if (FRONTEND_PATTERN.test(combined)) return "frontend";
  return DEFAULT_PROFILE_KEY;
}
