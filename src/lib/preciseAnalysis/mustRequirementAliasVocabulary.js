// src/lib/preciseAnalysis/mustRequirementAliasVocabulary.js
// T3: 직무·산업별 must requirement alias 사전 + 보정 helper
//
// 목적:
//  - buildMustRequirementsGapRisk에서 JD 필수요건과 이력서 표현이 의미상 같은데
//    표기만 달라 누락(miss)으로 잡히는 false negative를 줄인다.
//  - 기존 cert/tool alias bridge는 건드리지 않는다. 이 helper는 그 다음 단계로,
//    miss로 남은 항목에 대해서만 직무/산업/업무 표현 alias로 보정한다.
//  - alias 보정은 "완전 hit"이 아닌 "보정 근거"로만 기록한다 (UI에서 neutral chip).
//
// 사용 위치: buildMustRequirementsGapRisk.js
//
// 주의:
//  - 짧은 약어(PM, CS, QA, BD, BI 등)는 단독 매칭 false positive 위험이 크다.
//    SHORT_TOKEN_GUARD에 등록된 짧은 term은 단어 경계(word boundary)로만 매칭.
//  - JD requirement에 group term이 있고, resume text에 같은 group의 "다른" term이
//    있어야 매칭 (양쪽에 같은 term만 있으면 alias 보정 의미가 없다).
//  - 결과는 confidence: "medium" 고정 (over-claim 회피).

export const MUST_REQUIREMENT_ALIAS_GROUPS = Object.freeze([
  {
    id: "customer_voc",
    label: "VOC/고객 문의",
    terms: [
      "voc", "voice of customer",
      "고객 문의", "고객문의", "고객의 소리",
      "고객 불만", "고객불만", "민원",
      "고객 피드백", "고객피드백",
      "cs 데이터", "cs데이터", "고객 데이터",
      "문의 분석", "문의분석",
      "리뷰 분석", "리뷰분석",
    ],
  },
  {
    id: "business_development",
    label: "사업개발/BD",
    terms: [
      "bd", "business development",
      "사업 개발", "사업개발",
      "제휴", "파트너십", "partnership",
      "신사업", "신규 사업",
      "제안", "rfp", "rfi",
      "계약 체결", "계약체결",
    ],
  },
  {
    id: "data_analysis",
    label: "데이터 분석",
    terms: [
      "데이터 분석", "데이터분석", "data analysis", "data analytics",
      "sql 분석", "쿼리 분석",
      "리포트", "보고서 작성",
      "대시보드", "dashboard",
      "지표 분석", "지표분석",
      "bi", "business intelligence",
      "tableau", "looker", "redash", "metabase",
    ],
  },
  {
    id: "product_planning",
    label: "서비스/프로덕트 기획",
    terms: [
      "서비스 기획", "프로덕트 기획", "프로덕트기획",
      "pm", "po", "product manager", "product owner",
      "요구사항 정의", "요구사항 분석", "요구사항",
      "정책서", "정책 설계",
      "화면 설계", "화면설계", "스토리보드", "wireframe", "와이어프레임",
      "ia", "information architecture",
      "user flow", "유저 플로우", "유저플로우",
      "backlog", "백로그",
    ],
  },
  {
    id: "performance_marketing",
    label: "퍼포먼스 마케팅",
    terms: [
      "퍼포먼스 마케팅", "퍼포먼스마케팅", "performance marketing",
      "광고 운영", "광고운영", "매체 운영", "매체운영",
      "캠페인 운영", "캠페인운영", "캠페인 기획",
      "roas", "cac", "ctr", "cvr", "cpa",
      "meta ads", "facebook ads", "google ads",
      "네이버 광고", "카카오 광고",
    ],
  },
  {
    id: "frontend_development",
    label: "프론트엔드 개발",
    terms: [
      "프론트엔드", "프론트엔드 개발", "frontend", "front-end", "front end",
      "react", "vue", "next.js", "nextjs", "nuxt",
      "ui 개발", "웹 개발",
      "컴포넌트 개발", "컴포넌트개발",
    ],
  },
  {
    id: "backend_development",
    label: "백엔드 개발",
    terms: [
      "백엔드", "백엔드 개발", "backend", "back-end", "back end",
      "api 개발", "api 설계",
      "서버 개발", "서버개발",
      "spring", "spring boot",
      "node.js", "nodejs", "express", "nest", "nestjs",
      "db 설계", "데이터베이스 설계",
      "인프라",
    ],
  },
  {
    id: "service_operation",
    label: "서비스 운영",
    terms: [
      "서비스 운영", "서비스운영",
      "운영 프로세스", "운영프로세스",
      "운영 매뉴얼", "운영매뉴얼", "매뉴얼 작성",
      "sla",
      "품질 관리", "품질관리",
      "정산",
      "어드민", "백오피스", "back office",
    ],
  },
]);

// 단독 매칭 false positive 위험이 큰 짧은 약어 — 단어 경계로만 매칭
// (앞뒤가 알파벳/숫자/한글이 아닌 경우에만 hit)
const SHORT_TOKEN_GUARD = new Set([
  "pm", "po", "bd", "bi", "ia", "qa", "qc", "cs",
  "ci", "cd", "ux", "ui", "ga",
  "ctr", "cvr", "cpa", "cac", "ltv", "sla", "voc",
]);

function normalize(value) {
  return String(value ?? "").toLowerCase().trim().replace(/\s+/g, " ");
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 텍스트 안에 term이 등장하는지 확인. SHORT_TOKEN_GUARD에 속한 짧은 term은
// 단어 경계 기준으로만 매칭 (앞뒤가 [a-z0-9가-힣]이면 reject).
function _textHasTerm(textNorm, term) {
  if (!textNorm || !term) return false;
  if (SHORT_TOKEN_GUARD.has(term)) {
    const re = new RegExp(`(^|[^a-z0-9가-힣])${escapeRegExp(term)}(?![a-z0-9가-힣])`);
    return re.test(textNorm);
  }
  return textNorm.includes(term);
}

// 한 group이 JD requirement와 매칭되는 jdTerm을 찾는다.
function _findJdTerm(group, requirementNorm) {
  for (const rawTerm of group.terms) {
    const term = normalize(rawTerm);
    if (!term) continue;
    if (_textHasTerm(requirementNorm, term)) return term;
  }
  return null;
}

// 한 group이 resume text에서 hit하는 term들을 찾는다 (jdTerm은 제외).
// 최대 2개까지만 수집해 chip 길이를 제어.
function _findResumeTerms(group, resumeNorm, jdTerm) {
  if (!resumeNorm) return [];
  const seen = new Set();
  const out = [];
  for (const rawTerm of group.terms) {
    const term = normalize(rawTerm);
    if (!term || term === jdTerm || seen.has(term)) continue;
    if (_textHasTerm(resumeNorm, term)) {
      seen.add(term);
      out.push(term);
      if (out.length >= 2) break;
    }
  }
  return out;
}

/**
 * 한 JD requirement에 대해 직무/산업/업무 alias 보정을 시도한다.
 *
 * @param {Object} args
 * @param {string} args.jdRequirement — miss로 잡힌 JD 필수요건 원문
 * @param {string} [args.resumeText]  — 이력서 raw text (normalize 전이어도 됨)
 * @param {Object|null} [args.parsedResume] — parseWithAI() 결과 (signature only, 이번 PR 미사용)
 * @param {string} [args.targetRoleInPosting] — (signature only, 이번 PR 미사용)
 * @returns {{
 *   matched: boolean,
 *   groupId: string,
 *   label: string,
 *   jdTerm: string,
 *   resumeTerms: string[],
 *   confidence: "medium"
 * } | { matched: false }}
 */
export function resolveMustRequirementAliasMatch({
  jdRequirement,
  resumeText,
  // parsedResume — reserved for future expansion
  // targetRoleInPosting — reserved for future expansion
} = {}) {
  const reqNorm = normalize(jdRequirement);
  const resumeNorm = normalize(resumeText);
  if (!reqNorm || !resumeNorm) return { matched: false };

  for (const group of MUST_REQUIREMENT_ALIAS_GROUPS) {
    const jdTerm = _findJdTerm(group, reqNorm);
    if (!jdTerm) continue;
    const resumeTerms = _findResumeTerms(group, resumeNorm, jdTerm);
    if (resumeTerms.length === 0) continue;
    return {
      matched: true,
      groupId: group.id,
      label: group.label,
      jdTerm,
      resumeTerms,
      confidence: "medium",
    };
  }
  return { matched: false };
}

export const __TEST_ONLY__ = {
  SHORT_TOKEN_GUARD,
  normalize,
  _textHasTerm,
  _findJdTerm,
  _findResumeTerms,
};
