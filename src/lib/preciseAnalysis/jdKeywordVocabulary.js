// src/lib/preciseAnalysis/jdKeywordVocabulary.js
// T1: JD 키워드 범주 사전 + 분류 helper
//
// 목적:
//  - jd_keyword_coverage_gap의 matched/missing 키워드를 직무·산업 맥락 범주로 나눠
//    UI/메시지에서 "그래서 어떤 종류 표현이 부족한지" 보이도록 한다.
//  - 신규 engine/taxonomy 추가 없이, 기존 raw에 additive로 정보만 더한다.
//
// 사용 위치: buildJdKeywordCoverageGapRisk.js
//
// 주의:
//  - 키워드가 어디에도 해당하지 않으면 buckets에 들어가지 않는다 (over-claim 방지).
//  - JD에 없던 표현을 새로 만들어내지 않는다.

export const KEYWORD_BUCKETS = Object.freeze({
  coreTask:       { key: "coreTask",       label: "핵심 업무" },
  toolSkill:      { key: "toolSkill",      label: "툴/기술" },
  domainIndustry: { key: "domainIndustry", label: "산업/도메인" },
  metricOutcome:  { key: "metricOutcome",  label: "성과 지표" },
  collaboration:  { key: "collaboration",  label: "협업/커뮤니케이션" },
  qualification:  { key: "qualification",  label: "자격/요건" },
});

// 우선순위: 한 키워드가 여러 bucket에 걸릴 경우 위에서부터 골라 한 bucket에만 배정한다.
// metricOutcome 우선 → 가장 사용자 체감 큰 영역, 사용자 액션으로 바로 연결.
const BUCKET_PRIORITY = [
  "metricOutcome",
  "qualification",
  "toolSkill",
  "coreTask",
  "domainIndustry",
  "collaboration",
];

// 모든 entry는 lowercase normalized 기준으로 비교한다.
// 이 사전은 "JD에 등장한 키워드를 분류"하는 사전이지, 새 키워드를 만들어내는 사전이 아니다.
const VOCAB = Object.freeze({
  metricOutcome: [
    // 공통
    "전환율", "리텐션", "retention", "활성", "activation", "퍼널", "funnel", "코호트", "cohort",
    "성과", "지표", "kpi", "okr", "성장",
    // 그로스/마케팅
    "roas", "cac", "ltv", "ctr", "cvr", "cpa", "cpm", "cpi", "arpu", "arppu",
    "dau", "mau", "wau", "체류시간", "방문수",
    // 영업/매출
    "매출", "수주", "거래액", "gmv", "거래대금", "객단가", "리드수", "계약률",
    // 운영/CS
    "처리시간", "응답률", "응답속도", "만족도", "csat", "nps", "재문의율", "이탈률", "해지율", "churn", "sla",
    // 개발/품질
    "latency", "throughput", "uptime", "오류율", "성능 개선", "성능개선", "장애 시간", "장애시간", "tps", "qps",
    // 기타 수치 표현
    "절감", "증가율", "감소율", "개선율",
  ],

  qualification: [
    "학사", "석사", "박사", "전공", "전문대", "유사 전공",
    "자격증", "공인", "license", "certified",
    "lpic", "rhce", "cka", "ckad",
    "aws certified", "aws 공인", "gcp 공인", "azure 공인",
    "sqld", "adsp", "정보처리기사", "정보보안기사", "산업안전기사",
    "토익", "toeic", "opic", "오픽", "텝스",
  ],

  toolSkill: [
    // 디자인/문서
    "figma", "피그마", "sketch", "스케치", "miro", "notion", "노션", "confluence", "jira", "asana", "trello",
    "google docs", "google sheet", "google sheets", "google slides",
    "excel", "엑셀", "powerpoint", "파워포인트", "word",
    "powerbi", "power bi", "tableau", "looker", "redash", "metabase", "데이터 스튜디오", "data studio",
    // 분석/광고/마테크
    "ga", "ga4", "google analytics", "amplitude", "mixpanel", "appsflyer",
    "meta ads", "facebook ads", "google ads", "naver 광고", "kakao 광고", "search console",
    "braze", "appier", "ironsource", "moengage", "salesforce marketing cloud",
    // CRM
    "salesforce", "세일즈포스", "hubspot", "허브스팟", "zendesk", "젠데스크", "freshdesk", "intercom", "channeltalk", "채널톡",
    // DB/쿼리
    "sql", "mysql", "postgresql", "postgres", "mssql", "oracle", "mongodb", "redis", "bigquery", "snowflake", "redshift",
    // 백엔드
    "node", "node.js", "express", "nest", "nestjs",
    "java", "spring", "spring boot", "kotlin", "scala",
    "python", "django", "fastapi", "flask",
    "go", "golang", "rust", "elixir", "phoenix",
    "ruby", "rails", "php", "laravel",
    // 프론트
    "react", "next", "next.js", "nextjs", "vue", "nuxt", "svelte", "angular",
    "typescript", "javascript", "html", "css", "tailwind",
    // 인프라/데브옵스
    "aws", "gcp", "azure", "docker", "kubernetes", "k8s", "terraform", "ansible",
    "jenkins", "github actions", "gitlab ci", "argo", "argo cd", "argocd",
    "grafana", "prometheus", "datadog", "sentry", "elk", "elastic",
    // 데이터/ml
    "spark", "airflow", "dbt", "kafka", "rabbitmq",
    "pytorch", "tensorflow", "scikit", "sklearn", "huggingface",
    // 협업/형상
    "git", "github", "gitlab", "bitbucket",
  ],

  coreTask: [
    // 기획/PM/PO
    "기획", "요구사항", "정책", "ia", "user flow", "유저 플로우", "유저플로우",
    "화면설계", "와이어프레임", "wireframe", "스토리보드",
    "백로그", "backlog", "로드맵", "roadmap", "스프린트", "sprint", "mvp", "릴리즈",
    // UX/Design
    "프로토타입", "prototype", "디자인 시스템", "디자인시스템", "리서치", "user research",
    // 마케팅
    "캠페인", "콘텐츠", "퍼포먼스 마케팅", "퍼포먼스마케팅", "performance marketing",
    "광고", "광고 운영", "광고운영", "크리에이티브", "seo", "sem", "바이럴", "인플루언서", "제휴",
    // 개발
    "api", "api 설계", "rest", "graphql", "마이크로서비스", "microservice",
    "서버", "백엔드", "프론트엔드", "ios", "android", "모바일",
    "배포", "ci/cd", "ci", "cd", "테스트", "유닛 테스트", "단위 테스트", "통합 테스트", "e2e",
    "장애", "장애 대응", "장애대응", "온콜", "on call", "oncall",
    // 운영/CS
    "운영", "voc", "고객 응대", "고객응대", "문의 응대", "문의응대", "민원",
    "프로세스", "프로세스 개선", "매뉴얼", "정책 운영", "운영 정책",
    "품질 관리", "품질관리", "qc", "qa",
    // 영업/BD
    "제안", "rfp", "rfi", "수주", "계약", "파이프라인", "pipeline",
    "리드", "리드 발굴", "고객 관리", "고객관리", "파트너십", "제휴", "사업 개발", "사업개발",
    // 데이터/분석
    "데이터 분석", "데이터분석", "분석", "리서치", "지표 분석", "지표분석", "ab 테스트", "a/b 테스트", "실험 설계",
  ],

  domainIndustry: [
    "b2b", "b2c", "b2g", "d2c",
    "커머스", "이커머스", "ecommerce", "e-commerce", "리테일", "리테일테크",
    "saas", "paas", "iaas",
    "핀테크", "fintech", "결제", "페이먼츠", "payments",
    "헬스케어", "메디테크", "의료", "바이오",
    "에듀테크", "edutech", "이러닝",
    "물류", "logistics", "유통",
    "제조", "manufacturing", "스마트팩토리",
    "게임", "엔터테인먼트",
    "퍼블릭", "공공", "공기관",
  ],

  collaboration: [
    "협업", "유관부서", "유관 부서", "이해관계자", "stakeholder", "stakeholders",
    "커뮤니케이션", "커뮤니케이션 스킬",
    "개발자", "디자이너", "기획자", "qa", "데이터 분석가",
    "코드리뷰", "code review", "문서화", "documentation",
    "고객사", "현장", "파트너사", "외주", "벤더",
    "보고", "프레젠테이션", "presentation",
  ],
});

// substring 매칭에서 너무 짧은 entry는 noise를 만들 수 있어 최소 길이 조건을 둔다.
// 단, 사전에 일부러 등록한 2자 entry (ga, ia, qa, qc, ci, cd, ai, sql 등)는
// keyword === entry exact일 때만 허용해 false positive를 막는다.
const MIN_SUBSTRING_LEN = 3;

function normalize(value) {
  return String(value ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

// 한 키워드가 어떤 bucket에 속하는지 찾는다. 매칭되는 첫 bucket(우선순위 순서)을 반환.
// 매칭 규칙:
//  - exact: keyword === entry
//  - substring: entry.length >= MIN_SUBSTRING_LEN 이고 keyword.includes(entry)
//  - entry가 더 긴 케이스(예: keyword="react", entry="react native")는 분류하지 않는다.
//    (JD가 "react"라고만 했으면 toolSkill로 잡히는 게 더 정확)
function classifyOne(keywordNorm) {
  if (!keywordNorm) return null;
  for (const bucketKey of BUCKET_PRIORITY) {
    const entries = VOCAB[bucketKey];
    if (!Array.isArray(entries)) continue;
    for (const rawEntry of entries) {
      const entry = normalize(rawEntry);
      if (!entry) continue;
      if (entry === keywordNorm) return bucketKey;
      if (entry.length >= MIN_SUBSTRING_LEN && keywordNorm.includes(entry)) return bucketKey;
    }
  }
  return null;
}

/**
 * matched/missing 키워드 배열을 입력받아 bucket별로 분류한 결과를 반환한다.
 * 빈 bucket은 결과에서 제외한다.
 *
 * @param {Object} args
 * @param {string[]} args.matched
 * @param {string[]} args.missing
 * @returns {{
 *   keywordBuckets: Array<{ bucket: string, label: string, matched: string[], missing: string[] }>,
 *   strongestMissingBucket: { bucket: string, label: string, missingCount: number } | null
 * }}
 */
export function classifyKeywordBuckets({ matched = [], missing = [] } = {}) {
  const safeMatched = Array.isArray(matched) ? matched : [];
  const safeMissing = Array.isArray(missing) ? missing : [];

  // bucket key → { matched: Set, missing: Set } (Set으로 dedupe 보장)
  const acc = new Map();
  function pushTo(bucketKey, side, value) {
    if (!acc.has(bucketKey)) acc.set(bucketKey, { matched: new Set(), missing: new Set() });
    acc.get(bucketKey)[side].add(value);
  }

  for (const raw of safeMatched) {
    const n = normalize(raw);
    if (!n) continue;
    const bucketKey = classifyOne(n);
    if (bucketKey) pushTo(bucketKey, "matched", n);
  }
  for (const raw of safeMissing) {
    const n = normalize(raw);
    if (!n) continue;
    const bucketKey = classifyOne(n);
    if (bucketKey) pushTo(bucketKey, "missing", n);
  }

  // 우선순위 순서로 결과 배열 빌드
  const keywordBuckets = [];
  for (const bucketKey of BUCKET_PRIORITY) {
    const slot = acc.get(bucketKey);
    if (!slot) continue;
    const matchedArr = Array.from(slot.matched);
    const missingArr = Array.from(slot.missing);
    if (matchedArr.length === 0 && missingArr.length === 0) continue;
    keywordBuckets.push({
      bucket: bucketKey,
      label: KEYWORD_BUCKETS[bucketKey]?.label || bucketKey,
      matched: matchedArr,
      missing: missingArr,
    });
  }

  // strongestMissingBucket: missing count가 가장 큰 bucket을 우선순위 순서로 골라 tiebreak.
  let strongest = null;
  for (const entry of keywordBuckets) {
    if (entry.missing.length === 0) continue;
    if (!strongest || entry.missing.length > strongest.missingCount) {
      strongest = {
        bucket: entry.bucket,
        label: entry.label,
        missingCount: entry.missing.length,
      };
    }
  }

  return {
    keywordBuckets,
    strongestMissingBucket: strongest,
  };
}

export const __TEST_ONLY__ = {
  BUCKET_PRIORITY,
  MIN_SUBSTRING_LEN,
  normalize,
  classifyOne,
};
