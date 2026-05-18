/**
 * QA script: 신입 직무×산업 조합 설명 합리성 실제 출력 수집
 * Step 3 artifact — source modification is NOT performed here
 * Run: node scripts/qa-newgrad-job-industry-combinations.mjs
 */

import { buildNewgradTransitionLiteResult } from "../src/lib/transitionLite/buildNewgradTransitionLiteResult.js";
import fs from "fs";
import path from "path";

// ─────────────────────────────────────────────
// 12 QA case inputs
// ─────────────────────────────────────────────
const QA_CASES = [
  {
    caseId: "BIZ_MEDIA_01_STRONG",
    caseName: "사업기획 × 미디어/광고",
    targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
    targetJobLabel: "사업기획",
    targetIndustryId: "IND_MEDIA_CONTENT_EDUCATION_MEDIA_ADVERTISING",
    targetIndustryLabel: "미디어 / 광고",
    major: "경영학",
    projects: [
      "광고 캠페인 성과 분석 — 매체별 ROAS 비교 및 예산 재배분 시뮬레이션",
      "미디어 스타트업 수익모델 분석 — 광고주 직접 계약 vs 광고 네트워크 구조 비교",
    ],
    internships: [
      "디지털 미디어 기업 사업기획 인턴 — 광고 상품 라인업 정리, 시장조사 보고서 작성",
    ],
    certifications: [],
    domainInterestEvidence: [
      "매체사 비즈니스 모델 스터디 — 광고주, 에이전시, 미디어렙 구조 분석",
    ],
    strengths: ["구조 파악", "수치 분석"],
    workStyleNotes: "숫자로 판단하는 것을 선호, 근거 없는 주장을 불편해함",
    inputStrength: "strong",
    passKeywords: ["광고 상품", "매체", "광고주", "캠페인", "수익모델", "ROAS", "플랫폼", "광고 지표"],
    failKeywords: ["콘텐츠 제작 일반", "조회수", "구독", "편집", "생산공정", "품질관리"],
  },
  {
    caseId: "PERF_SAAS_02_MED",
    caseName: "퍼포먼스마케팅 × B2B SaaS",
    targetJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    targetJobLabel: "퍼포먼스마케팅",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetIndustryLabel: "B2B SaaS",
    major: "통계학",
    projects: [
      "Google Ads 캠페인 최적화 실습 — 키워드 입찰 전략, CTR/CVR 개선",
    ],
    internships: [],
    certifications: ["Google Ads 인증"],
    domainInterestEvidence: [
      "SaaS 구독 모델 스터디 — 온보딩, 리텐션, 이탈 원인 분석 자료 조사",
    ],
    strengths: ["데이터 기반 판단"],
    workStyleNotes: "숫자 변화에 민감, 반복 테스트를 좋아함",
    inputStrength: "medium",
    passKeywords: ["리드", "CAC", "전환 퍼널", "데모", "세일즈 연계", "CRM", "LTV", "리텐션"],
    failKeywords: ["SaaS 온보딩 일반", "리드 없음", "이커머스 구매전환만"],
  },
  {
    caseId: "SVC_DHC_03_STRONG",
    caseName: "서비스기획 × 디지털 헬스케어",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetJobLabel: "서비스기획",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_DIGITAL_HEALTHCARE",
    targetIndustryLabel: "디지털 헬스케어",
    major: "바이오메디컬공학",
    projects: [
      "헬스케어 앱 UX 개선 프로젝트 — 환자 여정 맵핑, 개인정보 처리 흐름 설계",
      "원격의료 규제 분석 및 서비스 기능 정의 스터디",
    ],
    internships: [
      "디지털 헬스케어 스타트업 기획 인턴 — 사용자 피드백 수집, 기능 우선순위 정리",
    ],
    certifications: [],
    domainInterestEvidence: ["의료데이터 개인정보 법령 분석"],
    strengths: ["사용자 관점", "꼼꼼함"],
    workStyleNotes: "기능 정의 전에 사용자 맥락을 먼저 파악하는 편",
    inputStrength: "strong",
    passKeywords: ["환자", "의료진", "건강 데이터", "개인정보", "규제", "신뢰성", "UX", "기능정의"],
    failKeywords: ["헬스케어 일반론만", "사용자 여정 없음", "기능정의 없음"],
  },
  {
    caseId: "DATA_DHC_04_WEAK",
    caseName: "데이터분석 × 디지털 헬스케어",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetJobLabel: "데이터분석",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_DIGITAL_HEALTHCARE",
    targetIndustryLabel: "디지털 헬스케어",
    major: "통계학",
    projects: [],
    internships: [],
    certifications: ["ADsP"],
    domainInterestEvidence: ["건강 관련 앱 사용 경험"],
    strengths: ["분석적 사고"],
    workStyleNotes: "데이터를 보면서 가설을 세우는 것을 즐김",
    inputStrength: "weak",
    passKeywords: ["건강 데이터", "의료 데이터", "개인정보", "보안", "임상 지표", "데이터 신뢰성", "규제"],
    failKeywords: ["데이터분석 일반론만", "헬스케어 일반론만", "의료 데이터 특수성 없음"],
  },
  {
    caseId: "QC_PHARMA_05_STRONG",
    caseName: "품질관리(QC) × 제약",
    targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
    targetJobLabel: "품질관리(QC)",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_PHARMACEUTICALS",
    targetIndustryLabel: "제약",
    major: "약학",
    projects: [
      "완제의약품 규격 설정 연구 — USP 기준 대비 안정성시험 조건 설계",
    ],
    internships: [
      "제약회사 QC 부서 인턴 — 완제품 시험검사, OOS 처리 절차 경험",
    ],
    certifications: ["위험물산업기사"],
    domainInterestEvidence: ["GMP 자율점검 체크리스트 정리"],
    strengths: ["정밀성", "기준 준수"],
    workStyleNotes: "규정 범위 내에서 정확하게 처리하는 것을 중요시",
    inputStrength: "strong",
    passKeywords: ["GMP", "시험", "검사", "기준 적합성", "문서화", "OOS", "일탈", "배치", "출하"],
    failKeywords: ["제약 일반론만", "QC 맥락 없음"],
  },
  {
    caseId: "QC_BIO_06_MED",
    caseName: "품질관리(QC) × 바이오",
    targetJobId: "JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL",
    targetJobLabel: "품질관리(QC)",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_BIO",
    targetIndustryLabel: "바이오",
    major: "생명과학",
    projects: [
      "바이오의약품 품질 관리 체계 분석 — 원액/완제 시험 기준 비교 정리",
    ],
    internships: [],
    certifications: ["바이오화학제품제조기사"],
    domainInterestEvidence: ["세포치료제 품질 기준 관련 학술 자료 정리"],
    strengths: ["정밀성"],
    workStyleNotes: "실험 데이터 이상 여부를 꼼꼼하게 확인",
    inputStrength: "medium",
    passKeywords: ["바이오 생산", "품질", "시험", "검사", "품질 기준", "문서화", "안정성", "규제", "QC"],
    failKeywords: ["바이오 연구 일반론만", "QC 맥락 없음", "치료제", "임상", "파트너십"],
  },
  {
    caseId: "BIZ_COMM_07_MED",
    caseName: "사업기획 × 온라인 커머스",
    targetJobId: "JOB_BUSINESS_BUSINESS_PLANNING",
    targetJobLabel: "사업기획",
    targetIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetIndustryLabel: "온라인 커머스",
    major: "경영학",
    projects: [
      "오픈마켓 수익성 분석 — 카테고리별 마진율 비교, 프로모션 효과 측정",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["커머스 플랫폼 비즈니스 모델 비교 스터디 (쿠팡 vs 네이버쇼핑)"],
    strengths: ["수익 구조 파악"],
    workStyleNotes: "매출과 마진을 항상 같이 봐야 한다고 생각",
    inputStrength: "medium",
    passKeywords: ["상품", "카테고리", "구매전환", "프로모션", "객단가", "마진", "재고", "배송", "수익성", "사업모델"],
    failKeywords: ["상품 운영만", "사업기획 관점 없음", "단순 마케팅", "단순 CS"],
  },
  {
    caseId: "SVC_COMM_08_WEAK",
    caseName: "서비스기획 × 온라인 커머스",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetJobLabel: "서비스기획",
    targetIndustryId: "IND_DISTRIBUTION_COMMERCE_CONSUMER_GOODS_ONLINE_COMMERCE",
    targetIndustryLabel: "온라인 커머스",
    major: "산업디자인",
    projects: [],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["온라인 쇼핑 앱 UX 개선 제안서 작성 (개인 프로젝트)"],
    strengths: ["사용자 관점"],
    workStyleNotes: "쇼핑할 때 UI 불편함을 자주 분석",
    inputStrength: "weak",
    passKeywords: ["상품 탐색", "장바구니", "결제", "구매전환", "리뷰", "추천", "판매자 UX", "구매자 UX", "기능정의"],
    failKeywords: ["사업기획 설명과 구분 안 됨", "서비스 흐름 없음", "UX 없음"],
  },
  {
    caseId: "CONT_MEDIA_09_STRONG",
    caseName: "콘텐츠마케팅 × 미디어/광고",
    targetJobId: "JOB_MARKETING_CONTENT_MARKETING",
    targetJobLabel: "콘텐츠마케팅",
    targetIndustryId: "IND_MEDIA_CONTENT_EDUCATION_MEDIA_ADVERTISING",
    targetIndustryLabel: "미디어 / 광고",
    major: "광고홍보학",
    projects: [
      "광고 캠페인 기획 실습 — 브랜드 메시지 전략, 타깃 오디언스 설정, 매체 배분",
    ],
    internships: [
      "광고대행사 콘텐츠 팀 인턴 — SNS 콘텐츠 제작 및 광고주 브리핑 보조",
    ],
    certifications: ["GTQ"],
    domainInterestEvidence: ["매체별 광고 효율 분석 스터디 (Meta vs YouTube vs TikTok)"],
    strengths: ["크리에이티브 감각", "기획력"],
    workStyleNotes: "기획 단계에서 타깃을 먼저 정하고 콘텐츠를 역설계하는 편",
    inputStrength: "strong",
    passKeywords: ["콘텐츠 기획", "캠페인", "브랜드 메시지", "매체 특성", "타깃 오디언스", "광고주", "브랜드 목적"],
    failKeywords: ["콘텐츠 제작 일반론만", "광고 없음", "캠페인 없음", "브랜드 목적 없음"],
  },
  {
    caseId: "PMM_SAAS_10_WEAK",
    caseName: "PMM × B2B SaaS",
    targetJobId: "JOB_MARKETING_PRODUCT_MARKETING_PMM",
    targetJobLabel: "PMM",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetIndustryLabel: "B2B SaaS",
    major: "경제학",
    projects: [],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["B2B SaaS 비즈니스 모델 블로그 글 읽음"],
    strengths: ["논리적 사고"],
    workStyleNotes: "제품의 차별점을 설명하는 데 관심이 많음",
    inputStrength: "weak",
    passKeywords: ["제품 가치 제안", "고객 세그먼트", "런칭", "세일즈 enablement", "경쟁 분석", "포지셔닝"],
    failKeywords: ["리드/CAC만", "SaaS 일반론만", "PMM 특화 없음", "포지셔닝 없음"],
  },
  {
    caseId: "B2B_HR_11_MED",
    caseName: "B2B영업 × HR/채용",
    targetJobId: "JOB_SALES_B2B_SALES",
    targetJobLabel: "B2B영업",
    targetIndustryId: "IND_PROFESSIONAL_B2B_SERVICES_HR_RECRUITING_SERVICES",
    targetIndustryLabel: "HR / 채용 / 인사서비스",
    major: "경영학",
    projects: [
      "기업 채용 프로세스 분석 — 헤드헌팅 vs 직접 채용 비용/효과 비교",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["채용 플랫폼 비즈니스 구조 분석 (원티드, 사람인 비교)"],
    strengths: ["관계 형성"],
    workStyleNotes: "고객사와 장기적으로 신뢰를 쌓는 영업을 선호",
    inputStrength: "medium",
    passKeywords: ["기업고객", "채용 니즈", "제안", "계약", "후보자", "채용담당자", "장기 관계", "채용 프로세스"],
    failKeywords: ["일반 영업 설명만", "HR 맥락 없음", "채용 맥락 없음"],
  },
  {
    caseId: "GOV_ARTS_12_WEAK",
    caseName: "공공사업 운영 × 콘텐츠/엔터테인먼트",
    targetJobId: "JOB_PUBLIC_ADMINISTRATION_SUPPORT_PUBLIC_PROGRAM_OPERATIONS",
    targetJobLabel: "공공사업 운영",
    targetIndustryId: "IND_MEDIA_CONTENT_EDUCATION_CONTENT_ENTERTAINMENT",
    targetIndustryLabel: "콘텐츠 / 엔터테인먼트",
    major: "행정학",
    projects: [],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["문화예술 기관 인턴십 지원을 위한 사업계획서 양식 분석"],
    strengths: ["규정 이해", "꼼꼼함"],
    workStyleNotes: "공문서 작성과 정산 처리를 정확하게 하는 것을 중요시",
    inputStrength: "weak",
    passKeywords: ["사업계획", "예산", "공고", "운영", "정산", "결과보고", "이해관계자", "공공성"],
    failKeywords: ["일반 행정 설명만", "문화예술 맥락 없음", "사업운영 흐름 없음", "예산/정산 없음"],
  },

  // ── Double-major / multi-major Axis1 regression cases ──────────────────
  {
    caseId: "SINGLE_MAJOR_BASELINE_CS_SVC",
    caseName: "[단일전공 baseline] 컴퓨터공학 × 서비스기획",
    targetJobId: "JOB_BUSINESS_SERVICE_PLANNING",
    targetJobLabel: "서비스기획",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetIndustryLabel: "IT 서비스 (B2C 플랫폼)",
    major: "컴퓨터공학",
    projects: [
      "모바일 앱 기능 기획 및 요구사항 정의 프로젝트 — 사용자 시나리오 작성",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["앱 서비스 UX 개선 사례 스터디"],
    strengths: ["논리적 구조화", "사용자 관점"],
    workStyleNotes: "기능 정의 시 개발 가능 여부를 같이 고려하는 편",
    inputStrength: "medium",
    passKeywords: ["컴퓨터", "IT", "서비스", "기획", "요구사항", "사용자"],
    failKeywords: ["전공 불일치", "전혀 무관"],
  },
  {
    caseId: "DOUBLE_MAJOR_CS_BIZ_IT_PLANNING",
    caseName: "[복수전공] 컴퓨터공학, 경영학 × IT기획",
    targetJobId: "JOB_IT_DATA_DIGITAL_IT_PLANNING",
    targetJobLabel: "IT기획",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2B_SAAS",
    targetIndustryLabel: "B2B SaaS",
    major: "컴퓨터공학, 경영학",
    projects: [
      "IT 서비스 기획서 작성 — 시스템 요구사항 정의 및 비즈니스 연계 로직 설계",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["B2B SaaS 온보딩 흐름 분석"],
    strengths: ["기술-비즈니스 연결", "문서화"],
    workStyleNotes: "기술 구조를 비즈니스 맥락으로 풀어내는 것을 선호",
    inputStrength: "medium",
    passKeywords: ["IT", "기획", "시스템", "비즈니스", "요구사항", "서비스", "SaaS"],
    failKeywords: ["전공 불일치", "관련 경험 없음"],
  },
  {
    caseId: "DOUBLE_MAJOR_STAT_MKT_PERF",
    caseName: "[복수전공] 통계학 + 마케팅 × 퍼포먼스마케팅",
    targetJobId: "JOB_MARKETING_PERFORMANCE_MARKETING",
    targetJobLabel: "퍼포먼스마케팅",
    targetIndustryId: "IND_IT_SOFTWARE_PLATFORM_B2C_PLATFORM",
    targetIndustryLabel: "IT 서비스 (B2C 플랫폼)",
    major: "통계학 + 마케팅",
    projects: [
      "SNS 광고 A/B 테스트 분석 — 통계적 유의성 검증 및 성과 개선 방향 도출",
    ],
    internships: [],
    certifications: ["Google Analytics 인증"],
    domainInterestEvidence: ["퍼포먼스 마케팅 지표 분석 스터디"],
    strengths: ["데이터 기반 판단", "수치 분석"],
    workStyleNotes: "숫자에서 인사이트를 찾는 것을 즐김",
    inputStrength: "medium",
    passKeywords: ["통계", "데이터", "마케팅", "광고", "분석", "전환", "성과"],
    failKeywords: ["전공 불일치", "수치 경험 없음"],
  },
  {
    caseId: "SLASH_MAJOR_BIO_DS_HEALTHCARE",
    caseName: "[슬래시전공] 생명과학 / 데이터사이언스 × 데이터분석",
    targetJobId: "JOB_IT_DATA_DIGITAL_DATA_ANALYSIS",
    targetJobLabel: "데이터분석",
    targetIndustryId: "IND_HEALTHCARE_PHARMA_BIO_DIGITAL_HEALTHCARE",
    targetIndustryLabel: "디지털 헬스케어",
    major: "생명과학 / 데이터사이언스",
    projects: [
      "의료 데이터 분석 프로젝트 — 환자 재방문율 예측 모델 구현 (Python, scikit-learn)",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["헬스케어 데이터 분석 사례 조사"],
    strengths: ["데이터 해석", "도메인 이해"],
    workStyleNotes: "의료 데이터의 특수성을 고려한 분석을 선호",
    inputStrength: "medium",
    passKeywords: ["데이터", "분석", "헬스케어", "의료", "생명", "모델", "예측"],
    failKeywords: ["전공 불일치", "경험 없음"],
  },
  {
    caseId: "SLASH_LABEL_REGRESSION_EE_ELEC",
    caseName: "[레지스트리 슬래시 회귀] 전자 / 전기 × 전기설계",
    targetJobId: "JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN",
    targetJobLabel: "전기설계",
    targetIndustryId: "IND_MANUFACTURING_ELECTRONICS_APPLIANCES",
    targetIndustryLabel: "전기전자 / 가전",
    major: "전자 / 전기",
    projects: [
      "전력 시스템 설계 실습 — 회로 설계 및 시뮬레이션",
    ],
    internships: [],
    certifications: [],
    domainInterestEvidence: ["전기 설계 표준 학습"],
    strengths: ["기술 이해", "꼼꼼함"],
    workStyleNotes: "설계 시 안전 기준 준수를 최우선으로 함",
    inputStrength: "medium",
    passKeywords: ["전기", "전자", "설계", "회로", "전력"],
    failKeywords: ["전공 불일치", "비전공"],
  },
];

// ─────────────────────────────────────────────
// Safe field extractors
// ─────────────────────────────────────────────
function safeStr(val) {
  if (val === null || val === undefined) return "missing";
  if (typeof val === "string") return val || "(empty)";
  if (typeof val === "object") return JSON.stringify(val).slice(0, 200);
  return String(val);
}

function extractIndustryContextRows(result) {
  try {
    const rows = result?.axisPack?.axes?.industryContext?.comparisonBlock?.rows;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      rowKey: safeStr(row?.rowKey),
      label: safeStr(row?.label),
      verdictText: safeStr(row?.verdictText),
      limitText: safeStr(row?.limitText),
      missingEvidenceLabels: row?.missingEvidenceLabels
        ? JSON.stringify(row.missingEvidenceLabels).slice(0, 300)
        : "missing",
    }));
  } catch {
    return [];
  }
}

function extractGoalTableRows(result) {
  try {
    const rows = result?.newgradGoalComparisonTable?.rows;
    if (!Array.isArray(rows)) return [];
    return rows.map((row) => ({
      itemLabel: safeStr(row?.itemLabel ?? row?.label ?? row?.rowKey),
      evidence: safeStr(row?.evidence),
      jobLinkage: safeStr(row?.jobLinkage),
      industryLinkage: safeStr(row?.industryLinkage),
    }));
  } catch {
    return [];
  }
}

function checkKeywords(text, keywords) {
  if (!text || typeof text !== "string") return [];
  return keywords.filter((kw) => text.includes(kw));
}

function collectAllText(result) {
  const parts = [];
  try {
    const ic = result?.axisPack?.axes?.industryContext;
    if (ic) {
      parts.push(safeStr(ic?.band));
      const rows = ic?.comparisonBlock?.rows;
      if (Array.isArray(rows)) {
        rows.forEach((r) => {
          parts.push(safeStr(r?.verdictText));
          parts.push(safeStr(r?.limitText));
          parts.push(safeStr(r?.summaryText));
        });
      }
      const exp = ic?.explanation;
      if (exp) {
        parts.push(safeStr(exp?.body));
        parts.push(safeStr(exp?.lead));
        parts.push(safeStr(exp?.summary));
        if (Array.isArray(exp?.gaps)) parts.push(...exp.gaps.map(safeStr));
      }
    }
    const gt = result?.newgradGoalComparisonTable?.rows;
    if (Array.isArray(gt)) {
      gt.forEach((r) => {
        parts.push(safeStr(r?.jobLinkage));
        parts.push(safeStr(r?.industryLinkage));
      });
    }
    parts.push(safeStr(result?.targetJobRead?.summary));
    parts.push(safeStr(result?.targetIndustryRead?.summary));
  } catch {}
  return parts.filter((p) => p && p !== "missing" && p !== "(empty)").join(" ");
}

function autoJudge(allText, passKws, failKws) {
  const passHits = checkKeywords(allText, passKws);
  const failHits = checkKeywords(allText, failKws);
  if (failHits.length >= 2) return "FAIL";
  if (passHits.length >= 3) return "PASS";
  if (passHits.length >= 1) return "WARN";
  return "FAIL";
}

// ─────────────────────────────────────────────
// Run all cases
// ─────────────────────────────────────────────
const results = [];

for (const c of QA_CASES) {
  let result = null;
  let error = null;
  try {
    result = buildNewgradTransitionLiteResult({
      targetJobId: c.targetJobId,
      targetIndustryId: c.targetIndustryId,
      major: c.major,
      projects: c.projects || [],
      internships: c.internships || [],
      certifications: c.certifications || [],
      extracurriculars: [],
      contractExperiences: [],
      domainInterestEvidence: c.domainInterestEvidence || [],
      strengths: c.strengths || [],
      workStyleNotes: c.workStyleNotes || "",
    });
  } catch (e) {
    error = e.message;
  }

  const icBand = result?.axisPack?.axes?.industryContext?.band ?? "missing";
  const icRows = extractIndustryContextRows(result);
  const gtRows = extractGoalTableRows(result);
  const allText = result ? collectAllText(result) : "";
  const passHits = checkKeywords(allText, c.passKeywords);
  const failHits = checkKeywords(allText, c.failKeywords);
  const autoJudgement = error
    ? "FAIL(runtime)"
    : !result?.axisPack
    ? "FAIL(empty)"
    : autoJudge(allText, c.passKeywords, c.failKeywords);

  results.push({
    caseId: c.caseId,
    caseName: c.caseName,
    inputStrength: c.inputStrength,
    targetJobId: c.targetJobId,
    targetIndustryId: c.targetIndustryId,
    error,
    icBand,
    icRows,
    gtRows,
    targetJobReadSummary: safeStr(result?.targetJobRead?.summary),
    targetIndustryReadSummary: safeStr(result?.targetIndustryRead?.summary),
    passHits,
    failHits,
    autoJudgement,
    riskSignals: result?.topRisks ?? [],
    rawResultKeys: result ? Object.keys(result) : [],
  });

  console.log(`[${autoJudgement}] ${c.caseId} — ${c.caseName}`);
}

// ─────────────────────────────────────────────
// Write JSON artifact
// ─────────────────────────────────────────────
const jsonPath = path.resolve("docs/reports/newgrad-job-industry-combination-output-qa-2026-05-13.json");
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), "utf-8");
console.log(`\nJSON written: ${jsonPath}`);

// ─────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────
const pass = results.filter((r) => r.autoJudgement === "PASS").length;
const warn = results.filter((r) => r.autoJudgement === "WARN").length;
const fail = results.filter((r) => r.autoJudgement.startsWith("FAIL")).length;

console.log(`\n═══ QA Summary ═══`);
console.log(`PASS: ${pass} / WARN: ${warn} / FAIL: ${fail}`);
console.log("Results per case:");
results.forEach((r) => {
  console.log(`  ${r.autoJudgement.padEnd(14)} ${r.caseId}`);
  if (r.passHits.length) console.log(`    PASS hits: ${r.passHits.join(", ")}`);
  if (r.failHits.length) console.log(`    FAIL hits: ${r.failHits.join(", ")}`);
  if (r.icBand !== "missing") console.log(`    industryContext band: ${r.icBand}`);
  if (r.icRows.length) {
    r.icRows.slice(0, 2).forEach((row) => {
      console.log(`    [${row.rowKey}] verdictText: ${String(row.verdictText).slice(0, 120)}`);
    });
  }
  if (r.gtRows.length) {
    r.gtRows.slice(0, 1).forEach((row) => {
      console.log(`    goalTable jobLinkage: ${String(row.jobLinkage).slice(0, 100)}`);
      console.log(`    goalTable industryLinkage: ${String(row.industryLinkage).slice(0, 100)}`);
    });
  }
  if (r.error) console.log(`    ERROR: ${r.error}`);
});
