#!/usr/bin/env node
/**
 * PASSMAP cap 경로 점검 스크립트
 * 실행: node scripts/inspect_cap_path.mjs fa-01 fa-06
 *       node scripts/inspect_cap_path.mjs --cluster false_accept_high
 *       node scripts/inspect_cap_path.mjs fa-01 fa-02 fa-03 fa-04 fa-05 fa-06
 *
 * analyzer.js / canonicalRoleMap.js 수정 금지 — 관찰 전용
 */
import { analyze } from "../src/lib/analyzer.js";
import {
  inferCanonicalFamily,
  inferMarketingSubFamily,
  inferBizSubFamily,
  inferDevSubFamily,
  inferFinanceSubFamily,
} from "../src/lib/decision/roleOntology/computeRoleDistance.js";

// ─────────────────────────────────────────────────────────────
// inline case store (66개 — collect_error_map.mjs 와 동일 스키마)
// ─────────────────────────────────────────────────────────────
const CASES = [
  // ── seniority_gap (5개) ──────────────────────────────────────
  {
    id: "sg-01", cluster: "seniority_gap",
    jd: `퍼포먼스 마케팅 팀장 / 리드\n\n주요 업무\n- 퍼포먼스 마케팅 전략 총괄 및 예산 책임\n- 팀원 코칭 및 KPI 설계\n- 채널별 성과 최적화 및 경영진 보고\n\n자격 요건\n- 퍼포먼스 마케팅 경력 7년 이상\n- 팀 리딩 경험 필수\n- 연간 예산 10억 이상 운영 경험`,
    resume: `퍼포먼스 마케팅 담당 (1년 4개월)\n\n- 메타·구글 광고 캠페인 운영 및 일일 성과 모니터링\n- 광고 리포트 작성 및 팀장 보고\n- 소재 A/B 테스트 보조`,
    expectedBand: "<=44",
  },
  {
    id: "sg-02", cluster: "seniority_gap",
    jd: `전략기획 시니어 매니저\n\n주요 업무\n- 전사 중장기 전략 수립 리드\n- 사업부별 KPI 설계 총괄\n- 이사회 보고 자료 작성 및 프레젠테이션\n\n자격 요건\n- 전략기획 또는 컨설팅 경력 8년 이상\n- MBA 우대\n- 조직 리딩 경험`,
    resume: `전략기획 주임 (2년 1개월)\n\n- 시장 조사 및 경쟁사 분석 자료 작성\n- 팀장 보고용 PPT 작성 보조\n- 분기별 KPI 현황 집계`,
    expectedBand: "<=44",
  },
  {
    id: "sg-03", cluster: "seniority_gap",
    jd: `데이터 엔지니어링 리드\n\n주요 업무\n- 데이터 파이프라인 아키텍처 설계 총괄\n- 데이터 플랫폼 로드맵 수립\n- 팀원 기술 리뷰 및 코드 리뷰 리드\n\n자격 요건\n- 데이터 엔지니어링 경력 6년 이상\n- Spark / Airflow / dbt 실무 운영 경험\n- 팀 리딩 경험`,
    resume: `데이터 엔지니어 (1년 8개월)\n\n- Python 기반 ETL 파이프라인 유지보수\n- Airflow DAG 스케줄링 보조\n- 데이터 품질 모니터링 지원`,
    expectedBand: "<=44",
  },
  {
    id: "sg-04", cluster: "seniority_gap",
    jd: `HR 파트너 / HRBP 시니어\n\n주요 업무\n- 조직설계 및 인력운영 전략 수립\n- 경영진 및 사업부장 파트너링\n- 인사제도 개선 프로젝트 리드\n\n자격 요건\n- HR 경력 7년 이상\n- 사업부 파트너링 경험 필수\n- 노사관계 경험 우대`,
    resume: `HR 담당자 (1년 10개월)\n\n- 채용 공고 등록 및 서류 검토\n- 입사 온보딩 자료 준비\n- 급여 데이터 집계 및 보고 보조`,
    expectedBand: "<=44",
  },
  {
    id: "sg-05", cluster: "seniority_gap",
    jd: `PM 그룹장 / 프로덕트 디렉터\n\n주요 업무\n- 프로덕트 비전 및 로드맵 총괄\n- 멀티 스쿼드 운영 및 우선순위 결정\n- C-레벨 보고 및 비즈니스 목표 연계\n\n자격 요건\n- PM 경력 8년 이상\n- 스쿼드 리딩 경험\n- B2C SaaS 도메인 경험 우대`,
    resume: `주니어 PM (1년 3개월)\n\n- 기능 스펙 문서 작성 및 개발팀 커뮤니케이션\n- 사용자 피드백 정리 및 보고\n- QA 테스트 케이스 관리`,
    expectedBand: "<=44",
  },

  // ── domain_mismatch_text_only (5개) ──────────────────────────
  {
    id: "dm-01", cluster: "domain_mismatch_text_only",
    jd: `전략기획 담당\n\n주요 업무\n- 전사 사업 전략 수립 및 실행 로드맵 작성\n- 신규 사업 타당성 검토\n- 경영진 보고 자료 작성`,
    resume: `B2B 영업 / 어카운트 매니저 (3년)\n\n- 신규 기업 고객 발굴 및 영업 파이프라인 관리\n- 고객사 제안서 작성 및 계약 협상\n- 월별 영업 실적 관리`,
    expectedBand: "<=43",
  },
  {
    id: "dm-02", cluster: "domain_mismatch_text_only",
    jd: `재무기획 담당\n\n주요 업무\n- 연간 예산 계획 수립 및 실적 분석\n- 투자 타당성 검토 및 재무 모델링\n- 경영진 재무 보고`,
    resume: `콘텐츠 마케터 (2년 6개월)\n\n- 브랜드 SNS 콘텐츠 기획 및 운영\n- 콘텐츠 KPI 분석 및 성과 보고\n- 외부 크리에이터 협업 관리`,
    expectedBand: "<=43",
  },
  {
    id: "dm-03", cluster: "domain_mismatch_text_only",
    jd: `공급망 관리(SCM) 담당\n\n주요 업무\n- 원자재 조달 계획 수립 및 공급업체 관리\n- 재고 최적화 및 물류 프로세스 개선\n- 원가 절감 프로젝트 리드`,
    resume: `UI/UX 디자이너 (3년)\n\n- 모바일 앱 화면 설계 및 프로토타입 제작\n- 사용자 조사 및 UX 리서치\n- 디자인 시스템 구축`,
    expectedBand: "<=43",
  },
  {
    id: "dm-04", cluster: "domain_mismatch_text_only",
    jd: `임상시험 프로젝트 매니저\n\n주요 업무\n- 임상시험 계획 수립 및 진행 관리\n- CRO 및 병원 관계자 커뮤니케이션\n- 규제 문서 관리 및 제출`,
    resume: `IT 인프라 엔지니어 (4년)\n\n- 온프레미스 서버 운영 및 네트워크 관리\n- 클라우드(AWS) 인프라 구성 및 유지보수\n- 장애 대응 및 보안 점검`,
    expectedBand: "<=43",
  },
  {
    id: "dm-05", cluster: "domain_mismatch_text_only",
    jd: `MD(상품기획) 담당\n\n주요 업무\n- 시즌별 상품 기획 및 구성 관리\n- 바이어 미팅 및 협력사 발굴\n- 상품 판매 실적 분석 및 재발주 결정`,
    resume: `백엔드 개발자 (3년)\n\n- Node.js / Java Spring 기반 API 서버 개발\n- 데이터베이스 설계 및 쿼리 최적화\n- CI/CD 파이프라인 구축`,
    expectedBand: "<=43",
  },

  // ── role_confusion (5개) ─────────────────────────────────────
  {
    id: "rc-01", cluster: "role_confusion",
    jd: `데이터 분석가\n\n주요 업무\n- 비즈니스 KPI 분석 및 인사이트 도출\n- SQL 기반 데이터 추출 및 시각화\n- 분석 보고서 작성 및 의사결정 지원`,
    resume: `재무 분석가 (3년)\n\n- 재무제표 분석 및 수익성 모델링\n- 예산 실적 분석 및 편차 원인 파악\n- 재무 데이터 기반 경영진 리포트 작성`,
    expectedBand: "<=43",
  },
  {
    id: "rc-02", cluster: "role_confusion",
    jd: `마케팅 기획 담당\n\n주요 업무\n- 브랜드 마케팅 전략 수립\n- 캠페인 기획 및 성과 관리\n- 마케팅 예산 운영`,
    resume: `사업기획 / 전략기획 담당 (3년)\n\n- 신규 사업 타당성 분석 및 사업계획서 작성\n- 투자자 IR 자료 작성\n- 중장기 전략 로드맵 수립`,
    expectedBand: "<=43",
  },
  {
    id: "rc-03", cluster: "role_confusion",
    jd: `영업 관리자 (Sales Manager)\n\n주요 업무\n- 영업팀 성과 관리 및 코칭\n- 영업 파이프라인 운영 및 CRM 관리\n- 고객사 계약 협상 및 클로징`,
    resume: `운영 관리자 (Operations Manager) (4년)\n\n- 물류 프로세스 최적화 및 KPI 관리\n- 협력업체 계약 관리 및 SLA 운영\n- 내부 운영 효율화 프로젝트 리드`,
    expectedBand: "<=43",
  },
  {
    id: "rc-04", cluster: "role_confusion",
    jd: `HR 채용 담당\n\n주요 업무\n- 포지션별 채용 전략 수립\n- 후보자 소싱 및 인터뷰 운영\n- 채용 브랜딩 강화`,
    resume: `콘텐츠 마케터 (2년)\n\n- 채용 공고 콘텐츠 제작 (취업 플랫폼 운영)\n- 구직자 대상 커리어 콘텐츠 기획\n- SNS 채널 운영`,
    expectedBand: "<=43",
  },
  {
    id: "rc-05", cluster: "role_confusion",
    jd: `프로덕트 매니저 (B2B SaaS)\n\n주요 업무\n- 제품 로드맵 수립 및 스프린트 관리\n- 고객 인터뷰 및 요구사항 정의\n- 개발팀·디자인팀 협업 리드`,
    resume: `프로젝트 매니저 (IT 컨설팅) (3년)\n\n- ERP 구축 프로젝트 일정·리스크 관리\n- 고객사 요구사항 수집 및 사양서 작성\n- PMO 운영 및 이해관계자 보고`,
    expectedBand: "<=43",
  },

  // ── must_have_paraphrase_miss (5개) ──────────────────────────
  {
    id: "mh-01", cluster: "must_have_paraphrase_miss",
    jd: `데이터 분석가\n\n자격 요건\n- SQL 필수\n- 데이터 시각화 툴 사용 경험 (Tableau 또는 Power BI)\n- Python 기초 이상`,
    resume: `데이터 분석 담당 (2년)\n\n- DB 쿼리를 활용한 데이터 추출 및 집계\n- 엑셀 피벗 및 차트 기반 리포트 작성\n- 데이터 기반 인사이트 보고`,
    expectedBand: "<=42",
  },
  {
    id: "mh-02", cluster: "must_have_paraphrase_miss",
    jd: `백엔드 개발자\n\n자격 요건\n- Java 또는 Kotlin 필수\n- RESTful API 설계 경험\n- AWS 서비스 활용 경험`,
    resume: `서버 개발자 (2년 6개월)\n\n- Spring 프레임워크 기반 서버 개발\n- HTTP 인터페이스 설계 및 구현\n- 클라우드 인프라 환경 배포 경험`,
    expectedBand: "<=42",
  },
  {
    id: "mh-03", cluster: "must_have_paraphrase_miss",
    jd: `재무 회계 담당\n\n자격 요건\n- 전산세무회계 또는 ERP(SAP/Oracle) 사용 경험 필수\n- 결산 업무 경험 3년 이상\n- 세무 신고 업무 경험`,
    resume: `경리/회계 담당 (3년)\n\n- 월별 장부 마감 및 재무제표 작성\n- 부가세 및 법인세 신고 보조\n- 회계 프로그램(더존) 활용`,
    expectedBand: "<=42",
  },
  {
    id: "mh-04", cluster: "must_have_paraphrase_miss",
    jd: `콘텐츠 마케터\n\n자격 요건\n- 영상 편집 툴 필수 (Premiere Pro 또는 Final Cut)\n- 카피라이팅 경험\n- SNS 채널 운영 경험 2년 이상`,
    resume: `SNS 운영 담당 (2년)\n\n- 영상 촬영 및 편집 (모바일 편집 앱 활용)\n- 인스타그램·유튜브 채널 콘텐츠 게시\n- 홍보 문구 작성 및 해시태그 기획`,
    expectedBand: "<=42",
  },
  {
    id: "mh-05", cluster: "must_have_paraphrase_miss",
    jd: `ML 엔지니어\n\n자격 요건\n- Python 필수\n- PyTorch 또는 TensorFlow 경험 필수\n- MLOps 경험 우대`,
    resume: `AI 모델 개발 담당 (2년)\n\n- 딥러닝 프레임워크를 활용한 모델 학습\n- 데이터 전처리 및 피처 엔지니어링\n- 모델 서빙 파이프라인 구축`,
    expectedBand: "<=42",
  },

  // ── biz_subfamily_mismatch (5개) ─────────────────────────────
  {
    id: "bs-01", cluster: "biz_subfamily_mismatch",
    jd: `전략기획 포지션\n\n주요 업무\n- 경영전략 수립 및 사업 전략 방향 설정\n- 전사 전략 로드맵 작성\n- 경영진 전략 보고`,
    resume: `사업기획 담당자 (3년)\n\n- 중장기 계획 수립 및 경영기획 업무 수행\n- 연간 사업계획서 작성\n- 사업 계획 수립 및 운영`,
    expectedBand: "<=44",
  },
  {
    id: "bs-02", cluster: "biz_subfamily_mismatch",
    jd: `사업기획 담당\n\n주요 업무\n- 중장기 사업계획 수립\n- 사업 계획 수립 및 예산 기획\n- 경영기획 업무 수행`,
    resume: `전략기획 팀원 (2년)\n\n- 전략 수립 및 사업 전략 방향 담당\n- 경영전략 보조 업무\n- 전략기획 리서치`,
    expectedBand: "<=44",
  },
  {
    id: "bs-03", cluster: "biz_subfamily_mismatch",
    jd: `전략기획 시니어 (리드급)\n\n주요 업무\n- 경영전략 수립 총괄\n- 전략기획 리드\n- 전사 전략 방향 수립`,
    resume: `전략기획 주임 (2년)\n\n- 전략기획 보조 업무\n- 사업 전략 방향 리서치\n- 전략 수립 지원`,
    expectedBand: "<=44",
  },
  {
    id: "bs-04", cluster: "biz_subfamily_mismatch",
    jd: `전략기획 포지션. 경영전략 수립 및 사업 전략 담당.`,
    resume: `사업 컨설턴트. 컨설팅 업무 담당. 다양한 고객사 지원 경력.`,
    expectedBand: "<=44",
  },
  {
    id: "bs-05", cluster: "biz_subfamily_mismatch",
    jd: `전략기획 리드. 경영전략 수립 10년+. 시니어 포지션.`,
    resume: `사업기획 주니어. 경영기획 경험 2년.`,
    expectedBand: "<=44",
  },

  // ── stability_or_shape_issue (5개) ───────────────────────────
  {
    id: "si-01", cluster: "stability_or_shape_issue",
    jd: "전략기획 담당",
    resume: "전략기획 경험 3년",
    ai: { semanticMatches: null },
    expectedBand: ">44",
  },
  {
    id: "si-02", cluster: "stability_or_shape_issue",
    jd: "마케팅 담당",
    resume: "마케팅 경험 2년",
    ai: { semanticMatches: { matchRate: "not-a-number" } },
    expectedBand: ">44",
  },
  {
    id: "si-03", cluster: "stability_or_shape_issue",
    jd: "데이터 분석가",
    resume: "SQL 및 Python 기반 데이터 분석 3년",
    ai: { semanticMatches: { matchRate: 1.5 } },
    expectedBand: ">44",
  },
  {
    id: "si-04", cluster: "stability_or_shape_issue",
    jd: "백엔드 개발자",
    resume: "Node.js 서버 개발 2년",
    ai: {},
    expectedBand: ">44",
  },
  {
    id: "si-05", cluster: "stability_or_shape_issue",
    jd: "HR 채용 담당",
    resume: "채용 운영 담당 1년",
    ai: { semanticMatches: { matchRate: 0.85 }, keywordMatchV2: { matchRate: 0.9 } },
    expectedBand: ">44",
  },

  // ── same_family_hidden_mismatch (10개) ───────────────────────
  {
    id: "sf-01", cluster: "same_family_hidden_mismatch",
    jd: `데이터 분석가\n주요 업무\n- SQL 기반 데이터 추출 및 KPI 분석\n- 대시보드 구축 및 리포트 작성\n자격 요건\n- SQL/Python 필수\n- Tableau 경험 우대`,
    resume: `데이터 엔지니어 (3년)\n- Spark/Airflow 기반 ETL 파이프라인 구축\n- 데이터 플랫폼 운영 및 스키마 설계\n- 대용량 데이터 처리 최적화`,
    expectedBand: "<=44",
  },
  {
    id: "sf-02", cluster: "same_family_hidden_mismatch",
    jd: `프론트엔드 개발자\n주요 업무\n- React 기반 웹 UI 개발\n- 디자인 시스템 구현\n자격 요건\n- React/TypeScript 필수\n- 웹 접근성 경험 우대`,
    resume: `백엔드 개발자 (3년)\n- Spring Boot 기반 REST API 개발\n- MySQL DB 설계 및 쿼리 최적화\n- 마이크로서비스 아키텍처 구축`,
    expectedBand: "<=44",
  },
  {
    id: "sf-03", cluster: "same_family_hidden_mismatch",
    jd: `iOS 모바일 개발자\n주요 업무\n- Swift 기반 iOS 앱 개발\n- 앱스토어 배포 및 유지보수\n자격 요건\n- Swift/Objective-C 필수`,
    resume: `웹 프론트엔드 개발자 (3년)\n- Vue.js/React 기반 웹 서비스 개발\n- JavaScript/TypeScript 실무 경험\n- PWA 개발 경험`,
    expectedBand: "<=44",
  },
  {
    id: "sf-04", cluster: "same_family_hidden_mismatch",
    jd: `HR 채용 전문가\n주요 업무\n- 포지션별 채용 전략 수립 및 실행\n- 후보자 소싱 및 인터뷰 운영\n자격 요건\n- IT 채용 경험 3년+`,
    resume: `HRD/인재개발 담당 (3년)\n- 임직원 교육 프로그램 기획 및 운영\n- 역량 모델 개발 및 성과 평가 지원\n- 온보딩 프로세스 구축`,
    expectedBand: "<=44",
  },
  {
    id: "sf-05", cluster: "same_family_hidden_mismatch",
    jd: `퍼포먼스 마케팅 담당\n주요 업무\n- 메타/구글 광고 운영 및 ROAS 관리\n- 퍼포먼스 마케팅 전략 수립\n자격 요건\n- 퍼포먼스 마케팅 경력 3년+`,
    resume: `SNS 콘텐츠 마케터 (3년)\n- 인스타그램/유튜브 콘텐츠 기획 및 제작\n- 소셜 미디어 채널 운영 및 팔로워 성장\n- 에디토리얼 콘텐츠 관리`,
    expectedBand: "<=44",
  },
  {
    id: "sf-06", cluster: "same_family_hidden_mismatch",
    jd: `FP&A 재무기획 담당\n주요 업무\n- 연간 예산 계획 및 실적 분석\n- 투자 타당성 검토 및 재무 모델링\n자격 요건\n- FP&A 또는 재무기획 3년+`,
    resume: `세무 담당자 (3년)\n- 법인세/부가세 신고 및 세무 조정\n- 이전가격 검토 및 세무 리스크 관리\n- 세무조사 대응`,
    expectedBand: "<=44",
  },
  {
    id: "sf-07", cluster: "same_family_hidden_mismatch",
    jd: `SCM/물류 담당\n주요 업무\n- 공급망 계획 수립 및 공급업체 관리\n- 재고 최적화 및 물류 비용 절감\n자격 요건\n- SCM 또는 물류 경력 3년+`,
    resume: `품질관리(QC) 담당 (3년)\n- 제품 품질 검사 및 불량 원인 분석\n- 품질 개선 프로젝트 리드\n- ISO 9001 심사 대응`,
    expectedBand: "<=44",
  },
  {
    id: "sf-08", cluster: "same_family_hidden_mismatch",
    jd: `B2B SaaS PM\n주요 업무\n- 엔터프라이즈 제품 로드맵 수립\n- 고객 인터뷰 및 요구사항 정의\n자격 요건\n- B2B SaaS 도메인 PM 경험 3년+`,
    resume: `B2C 앱 서비스 기획 (3년)\n- 소비자 대상 앱 기능 기획 및 출시\n- 사용자 리텐션 개선 및 A/B 테스트\n- MAU/DAU 지표 관리`,
    expectedBand: "<=44",
  },
  {
    id: "sf-09", cluster: "same_family_hidden_mismatch",
    jd: `반도체 설계 엔지니어\n주요 업무\n- 아날로그/디지털 회로 설계\n- ASIC 설계 및 검증\n자격 요건\n- 반도체 또는 회로설계 경력 3년+`,
    resume: `소프트웨어 R&D 엔지니어 (3년)\n- 딥러닝 알고리즘 연구 및 모델 최적화\n- 논문 작성 및 특허 출원\n- AI 솔루션 프로토타입 개발`,
    expectedBand: "<=44",
  },
  {
    id: "sf-10", cluster: "same_family_hidden_mismatch",
    jd: `전략기획 시니어\n주요 업무\n- 전사 경영전략 수립 및 사업 전략 방향 설정\n- M&A 및 신사업 기회 발굴\n자격 요건\n- 전략기획 또는 컨설팅 경력 5년+`,
    resume: `경영기획 담당 (3년)\n- 연간 사업계획서 작성 및 예산 편성\n- 경영진 보고 자료 작성\n- 중장기 계획 수립 보조`,
    expectedBand: "<=44",
  },

  // ── must_have_paraphrase (8개) ────────────────────────────────
  {
    id: "mp-01", cluster: "must_have_paraphrase",
    jd: `백엔드 개발자\n자격 요건\n- Python 필수\n- Django 또는 FastAPI 경험\n- AWS 활용 경험`,
    resume: `서버 개발자 (2년)\n- 파이썬 기반 API 서버 개발\n- 클라우드 환경 배포 경험\n- REST API 설계 및 구현`,
    expectedBand: "<=42",
  },
  {
    id: "mp-02", cluster: "must_have_paraphrase",
    jd: `데이터 분석가\n자격 요건\n- SQL 필수\n- Tableau 또는 Looker 경험\n- Excel 고급 활용`,
    resume: `데이터 담당 (2년)\n- DB 쿼리를 활용한 데이터 추출\n- 시각화 툴 기반 대시보드 작성\n- 엑셀 피벗테이블 분석`,
    expectedBand: "<=42",
  },
  {
    id: "mp-03", cluster: "must_have_paraphrase",
    jd: `프론트엔드 개발자\n자격 요건\n- React 필수\n- TypeScript 필수\n- Git 활용 필수`,
    resume: `웹 개발자 (2년)\n- 리액트 기반 웹 개발 경험\n- 타입스크립트 활용 프로젝트 참여\n- 버전관리 도구 사용`,
    expectedBand: "<=42",
  },
  {
    id: "mp-04", cluster: "must_have_paraphrase",
    jd: `DevOps 엔지니어\n자격 요건\n- Docker/Kubernetes 필수\n- CI/CD 파이프라인 구축 경험\n- Linux 서버 운영 경험`,
    resume: `인프라 담당 (2년)\n- 컨테이너 환경 운영 경험\n- 자동화 배포 파이프라인 관리\n- 리눅스 기반 서버 운영`,
    expectedBand: "<=42",
  },
  {
    id: "mp-05", cluster: "must_have_paraphrase",
    jd: `마케팅 담당\n자격 요건\n- Google Analytics 필수\n- Meta Ads/Google Ads 운영 경험\n- Excel 데이터 분석 능력`,
    resume: `디지털 마케터 (2년)\n- GA를 활용한 트래픽 분석 경험\n- 소셜 광고 집행 및 최적화\n- 스프레드시트 기반 성과 분석`,
    expectedBand: "<=42",
  },
  {
    id: "mp-06", cluster: "must_have_paraphrase",
    jd: `영업/CRM 담당\n자격 요건\n- Salesforce 또는 HubSpot 사용 경험 필수\n- 파이프라인 관리 경험\n- 영업 실적 분석 능력`,
    resume: `B2B 영업 담당 (2년)\n- CRM 툴을 활용한 고객 관리\n- 영업 파이프라인 추적 및 보고\n- 매출 실적 엑셀 분석`,
    expectedBand: "<=42",
  },
  {
    id: "mp-07", cluster: "must_have_paraphrase",
    jd: `PM/기획자\n자격 요건\n- Jira/Confluence 사용 필수\n- 애자일/스크럼 방법론 경험\n- Figma 협업 경험`,
    resume: `서비스 기획자 (2년)\n- 협업 툴 기반 스프린트 관리 경험\n- 애자일 방식의 프로젝트 진행\n- 디자인 협업 툴 사용 경험`,
    expectedBand: "<=42",
  },
  {
    id: "mp-08", cluster: "must_have_paraphrase",
    jd: `ML 엔지니어\n자격 요건\n- PyTorch 또는 TensorFlow 필수\n- MLflow 또는 Kubeflow 경험\n- GPU 클러스터 운영 경험`,
    resume: `AI 개발자 (2년)\n- 딥러닝 프레임워크 기반 모델 개발\n- 모델 실험 관리 및 버전 추적 경험\n- 분산 학습 환경 운영`,
    expectedBand: "<=42",
  },

  // ── false_accept_high (6개) ──────────────────────────────────
  {
    id: "fa-01", cluster: "false_accept_high",
    jd: `CTO / 기술 총괄\n주요 업무\n- 전사 기술 전략 수립 및 아키텍처 총괄\n- 개발 조직 빌딩 및 리더십\n자격 요건\n- 개발 경력 10년 이상\n- 기술 조직 리딩 경험 필수`,
    resume: `주니어 백엔드 개발자 (1년)\n- Spring 기반 API 개발 보조\n- 코드 리뷰 참여 및 버그 수정\n- 사내 스터디 참여`,
    expectedBand: "<=42",
  },
  {
    id: "fa-02", cluster: "false_accept_high",
    jd: `해외영업 담당 (글로벌)\n주요 업무\n- 해외 파트너사 발굴 및 계약 협상\n- 영어 능통 필수\n- 글로벌 출장 다수`,
    resume: `국내 영업 담당 (3년)\n- 국내 중소기업 대상 B2B 영업\n- 한국어 제안서 작성 및 미팅\n- 국내 영업 실적 달성`,
    expectedBand: "<=43",
  },
  {
    id: "fa-03", cluster: "false_accept_high",
    jd: `바이오텍/임상시험 PM\n주요 업무\n- 임상시험 계획 수립 및 진행 관리\n- CRO 및 병원 커뮤니케이션\n자격 요건\n- 임상시험 경력 3년+`,
    resume: `IT 프로젝트 매니저 (3년)\n- ERP 구축 프로젝트 일정 관리\n- 이해관계자 커뮤니케이션\n- 리스크 관리 및 보고`,
    expectedBand: "<=43",
  },
  {
    id: "fa-04", cluster: "false_accept_high",
    jd: `재무 이사 (CFO 후보)\n주요 업무\n- 전사 재무 전략 수립 총괄\n- IR 및 투자자 관계 관리\n자격 요건\n- 재무 경력 12년 이상\n- 상장사 경험`,
    resume: `신입 경리 담당 (6개월)\n- 매입매출 전표 입력\n- 급여 계산 보조\n- 비품 구매 및 총무 지원`,
    expectedBand: "<=42",
  },
  {
    id: "fa-05", cluster: "false_accept_high",
    jd: `프로덕트 디렉터\n주요 업무\n- 멀티 프로덕트 라인 총괄\n- C-레벨 보고 및 전략 연계\n자격 요건\n- PM 경력 8년+ 및 조직 리딩 경험`,
    resume: `UX/UI 디자이너 (3년)\n- 와이어프레임 및 프로토타입 제작\n- 사용자 조사 및 디자인 개선\n- 디자인 시스템 구축`,
    expectedBand: "<=43",
  },
  {
    id: "fa-06", cluster: "false_accept_high",
    jd: `글로벌 세일즈 리드\n주요 업무\n- APAC/EMEA 시장 영업 총괄\n- 글로벌 파트너십 전략 수립\n자격 요건\n- 글로벌 B2B 세일즈 경력 7년+`,
    resume: `국내 B2C 판매 담당 (2년)\n- 오프라인 매장 판매 관리\n- 고객 상담 및 CS 처리\n- 재고 관리 및 진열`,
    expectedBand: "<=42",
  },

  // ── false_reject_low (6개) ────────────────────────────────────
  {
    id: "fr-01", cluster: "false_reject_low",
    jd: `마케팅 매니저\n주요 업무\n- 마케팅 전략 수립 및 캠페인 기획\n- 브랜드 아이덴티티 관리\n자격 요건\n- 마케팅 경력 4년+`,
    resume: `브랜드 마케터 (4년)\n- 브랜드 마케팅 전략 수립 및 실행\n- 마케팅 캠페인 기획 및 성과 관리\n- 브랜드 아이덴티티 관리`,
    expectedBand: ">44",
  },
  {
    id: "fr-02", cluster: "false_reject_low",
    jd: `소프트웨어 엔지니어\n주요 업무\n- 백엔드 서비스 개발 및 운영\n- 코드 품질 관리 및 리뷰\n자격 요건\n- 개발 경력 3년+`,
    resume: `개발자 (3년)\n- 백엔드 서비스 개발 및 운영\n- 코드 리뷰 및 기술 개선\n- REST API 설계 및 구현`,
    expectedBand: ">44",
  },
  {
    id: "fr-03", cluster: "false_reject_low",
    jd: `HR 파트너 / HRBP\n주요 업무\n- 사업부 HR 파트너링\n- 인사제도 운영 및 개선\n자격 요건\n- HR 경력 4년+`,
    resume: `인사담당자 (4년)\n- 사업부 인사 파트너링 업무 수행\n- 인사 제도 운영 및 개선 프로젝트\n- 채용 및 온보딩 관리`,
    expectedBand: ">44",
  },
  {
    id: "fr-04", cluster: "false_reject_low",
    jd: `전략기획 담당\n주요 업무\n- 전사 사업 전략 수립\n- 신규 사업 기회 분석\n자격 요건\n- 전략기획 또는 컨설팅 경력 3년+`,
    resume: `경영 컨설턴트 (3년)\n- 사업 전략 수립 프로젝트 수행\n- 신규 사업 타당성 분석 및 제안\n- 경영 전략 보고서 작성`,
    expectedBand: ">44",
  },
  {
    id: "fr-05", cluster: "false_reject_low",
    jd: `데이터 분석가\n주요 업무\n- 비즈니스 KPI 분석 및 인사이트 도출\n- 데이터 기반 의사결정 지원\n자격 요건\n- 데이터 분석 경력 3년+`,
    resume: `비즈니스 애널리스트 (3년)\n- 비즈니스 KPI 분석 및 인사이트 도출\n- 데이터 기반 전략 수립 지원\n- SQL/Python 기반 분석`,
    expectedBand: ">44",
  },
  {
    id: "fr-06", cluster: "false_reject_low",
    jd: `영업 팀장\n주요 업무\n- 영업팀 성과 관리 및 코칭\n- 고객사 관계 유지 및 확대\n자격 요건\n- 영업 경력 5년+, 팀 리딩 경험`,
    resume: `Sales Manager (5년)\n- 영업팀 퍼포먼스 관리 및 코칭\n- Key Account 관리 및 매출 확대\n- 팀 목표 설정 및 달성`,
    expectedBand: ">44",
  },

  // ── text_domain_only (6개) ────────────────────────────────────
  {
    id: "td-01", cluster: "text_domain_only",
    jd: `B2B SaaS 마케팅 담당\n주요 업무\n- B2B SaaS 플랫폼 마케팅 전략 수립\n- 기업 고객 대상 콘텐츠 마케팅\n- 리드 제너레이션 캠페인 운영`,
    resume: `B2C 이커머스 마케터 (3년)\n- 온라인몰 프로모션 기획 및 운영\n- 소비자 대상 캠페인 집행\n- 이커머스 플랫폼 상품 페이지 최적화`,
    expectedBand: "<=44",
  },
  {
    id: "td-02", cluster: "text_domain_only",
    jd: `핀테크 서비스 기획 PM\n주요 업무\n- 금융 서비스 프로덕트 로드맵 수립\n- 규제 대응 및 금융 당국 커뮤니케이션\n자격 요건\n- 핀테크 또는 금융 도메인 경험`,
    resume: `제조업 공정 기획 담당 (3년)\n- 생산 공정 개선 기획 및 실행\n- 설비 투자 계획 수립\n- 원가 절감 프로젝트 리드`,
    expectedBand: "<=44",
  },
  {
    id: "td-03", cluster: "text_domain_only",
    jd: `헬스케어/디지털 헬스 PM\n주요 업무\n- 의료기기 소프트웨어 인허가 관리\n- 병원/의사 대상 제품 기획\n자격 요건\n- 헬스케어 도메인 경험 필수`,
    resume: `패션 이커머스 MD (3년)\n- 시즌별 패션 상품 기획 및 구성\n- 브랜드 파트너십 관리\n- 패션 트렌드 분석 및 바잉`,
    expectedBand: "<=44",
  },
  {
    id: "td-04", cluster: "text_domain_only",
    jd: `엔터프라이즈 소프트웨어 영업\n주요 업무\n- 대기업/공공기관 대상 솔루션 영업\n- 기업고객 RFP 대응 및 제안\n자격 요건\n- 엔터프라이즈 B2B 영업 경력 3년+`,
    resume: `소비재 B2C 영업 담당 (3년)\n- 대형마트/편의점 채널 영업 관리\n- 소비자 대상 프로모션 기획\n- 리테일 파트너 관계 관리`,
    expectedBand: "<=44",
  },
  {
    id: "td-05", cluster: "text_domain_only",
    jd: `이커머스 플랫폼 운영 담당\n주요 업무\n- 온라인몰 상품 운영 및 매출 관리\n- 이커머스 파트너 관리\n자격 요건\n- 이커머스 운영 경력 3년+`,
    resume: `오프라인 리테일 운영 담당 (3년)\n- 오프라인 매장 운영 및 재고 관리\n- 매장 직원 교육 및 고객 서비스\n- 매장별 매출 목표 관리`,
    expectedBand: "<=44",
  },
  {
    id: "td-06", cluster: "text_domain_only",
    jd: `글로벌 IT 기업 HR 담당\n주요 업무\n- 글로벌 인사 정책 수립 및 현지화\n- 다국적 팀 HRBP 파트너링\n자격 요건\n- 글로벌 HR 경험 또는 영어 능통`,
    resume: `중소기업 인사 담당 (3년)\n- 국내 임직원 채용 및 인사관리\n- 취업규칙 관리 및 노무 행정\n- 급여 계산 및 4대 보험 처리`,
    expectedBand: "<=44",
  },
];

// ─────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ─────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const ids = [];
  let cluster = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--cluster" && argv[i + 1]) {
      cluster = argv[++i];
    } else if (!argv[i].startsWith("--")) {
      ids.push(argv[i]);
    }
  }
  return { ids, cluster };
}

// ─────────────────────────────────────────────────────────────
// 규칙 적격성 / 차단 판단
// ─────────────────────────────────────────────────────────────
const WEAK_RULES = new Set([
  "C2_domain_text_mismatch",
  "B2_marketing_subfamily_mismatch",
  "B3_biz_subfamily_mismatch",
  "B4_dev_subfamily_mismatch",
  "B5_finance_subfamily_mismatch",
]);

function computeRuleSummary({
  capsApplied,
  expGap,
  expLevel,
  matchScore,
  textFamJd,
  textFamResume,
  textFamSame,
  structFamCurrent,
  structFamTarget,
  keywordSignals,
}) {
  const fired  = new Set(capsApplied.map((c) => c.rule));
  const result = {};

  // 공통 신호
  const matchNum    = typeof matchScore === "number" ? matchScore : 1;
  const expGapNum   = typeof expGap === "number" ? expGap : null;
  const expLevelNum = typeof expLevel === "number" ? expLevel : 1;

  // [A] must-have missing
  const aMissingCritical =
    Array.isArray(keywordSignals?.missingCritical) && keywordSignals.missingCritical.length > 0;
  result["A"] = fired.has("A_must_have_missing")
    ? "fired (cap=42)"
    : aMissingCritical
    ? "eligible — unknown-blocked"
    : "not eligible";

  // [B] role mismatch
  const bStructMismatch =
    structFamCurrent && structFamCurrent !== "UNKNOWN" &&
    structFamTarget  && structFamTarget  !== "UNKNOWN" &&
    structFamCurrent !== structFamTarget;
  const bTextMismatch =
    textFamJd !== "UNKNOWN" && textFamResume !== "UNKNOWN" && textFamJd !== textFamResume;
  const bEligible = bStructMismatch || bTextMismatch;
  result["B"] = fired.has("B_role_mismatch")
    ? "fired (cap=43)"
    : bEligible
    ? "eligible-but-blocked (allowHardRoleMismatchCap or path)"
    : "not eligible";

  // [C] domain mismatch (structured — 내부 도메인 신호 불투명)
  result["C"] = fired.has("C_domain_mismatch")
    ? "fired (cap=43)"
    : "unknown (internal domain signal required)";

  // [C2] domain text mismatch (내부 신호 불투명)
  result["C2"] = fired.has("C2_domain_text_mismatch")
    ? "fired (cap=44)"
    : "unknown (internal domain signal required)";

  // [D] seniority severe
  // 조건: expGap < 0 && expLevel < 0.5 && matchScore < 0.5
  //       && !strongerFired (A/B 미발화)
  //       && !textFamilySame (same family이면 D 발화 안 함)
  const dSeniorityEligible =
    expGapNum !== null &&
    expGapNum < 0 &&
    expLevelNum < 0.5 &&
    matchNum < 0.5;
  const dBlockedBySameFamily = textFamSame;
  const dBlockedByStronger   = fired.has("A_must_have_missing") || fired.has("B_role_mismatch");
  result["D"] = fired.has("D_seniority_severe")
    ? "fired (cap=44)"
    : dSeniorityEligible
    ? dBlockedBySameFamily
      ? "eligible-but-blocked (textFamilySame=true → D 발화 안 함)"
      : dBlockedByStronger
      ? "eligible-but-blocked (A/B already fired)"
      : "eligible-but-blocked (unknown)"
    : `not eligible (expGap=${expGapNum}, expLevel=${expLevelNum?.toFixed(2)}, match=${matchNum?.toFixed(2)})`;

  // [E] same-family seniority
  // 조건: textFamilySame && expGap < -4 && expLevel < 0.2 && matchScore < 0.5
  //       && !anyFired (weak rules 제외)
  const eGapEligible =
    expGapNum !== null && expGapNum < -4 && expLevelNum < 0.2 && matchNum < 0.5;
  const eEligible = textFamSame && eGapEligible;
  const eBlockedByStrong = [...fired].some((r) => !WEAK_RULES.has(r));
  result["E"] = fired.has("E_same_family_seniority")
    ? "fired (cap=44)"
    : eEligible
    ? eBlockedByStrong
      ? `eligible-but-blocked (anyFired: ${[...fired].filter((r) => !WEAK_RULES.has(r)).join(", ")})`
      : "eligible — should have fired (bug?)"
    : textFamSame
    ? `not eligible (same family but expGap=${expGapNum}, expLevel=${expLevelNum?.toFixed(2)}, match=${matchNum?.toFixed(2)})`
    : "not eligible (textFamilySame=false)";

  // [B2] MARKETING sub-family
  const b2Eligible = textFamSame && textFamJd === "MARKETING";
  result["B2"] = fired.has("B2_marketing_subfamily_mismatch")
    ? "fired (cap=44)"
    : b2Eligible
    ? "eligible — sub-family lookup needed to confirm block"
    : "not eligible (jdFam≠MARKETING or !sameFamily)";

  // [B3] BIZ sub-family
  const b3Eligible = textFamSame && textFamJd === "BIZ";
  result["B3"] = fired.has("B3_biz_subfamily_mismatch")
    ? "fired (cap=44)"
    : b3Eligible
    ? "eligible — sub-family lookup needed to confirm block"
    : "not eligible (jdFam≠BIZ or !sameFamily)";

  // [B4] DEV sub-family
  const b4Eligible = textFamSame && textFamJd === "DEV";
  result["B4"] = fired.has("B4_dev_subfamily_mismatch")
    ? "fired (cap=44)"
    : b4Eligible
    ? "eligible — sub-family lookup needed to confirm block"
    : "not eligible (jdFam≠DEV or !sameFamily)";

  // [B5] FINANCE sub-family
  const b5Eligible = textFamSame && textFamJd === "FINANCE";
  result["B5"] = fired.has("B5_finance_subfamily_mismatch")
    ? "fired (cap=44)"
    : b5Eligible
    ? "eligible — sub-family lookup needed to confirm block"
    : "not eligible (jdFam≠FINANCE or !sameFamily)";

  return result;
}

// ─────────────────────────────────────────────────────────────
// 분석 힌트 자동 분류
// ─────────────────────────────────────────────────────────────
function computeAnalysisHint({ capsApplied, textFamSame, textFamJd, textFamResume, expGap, matchScore }) {
  const fired = new Set(capsApplied.map((c) => c.rule));

  // same family + E fired → extreme_seniority_inversion
  if (textFamSame && fired.has("E_same_family_seniority")) return "extreme_seniority_inversion";

  // family mismatch + B fired + no A → role_seniority_compound
  if (!textFamSame && fired.has("B_role_mismatch") && !fired.has("A_must_have_missing")) {
    if (typeof expGap === "number" && expGap < -3) return "role_seniority_compound";
  }

  // D fired without B/A → role_seniority_compound (domain mismatch + seniority)
  if (fired.has("D_seniority_severe") && !fired.has("B_role_mismatch") && !fired.has("A_must_have_missing")) {
    return "role_seniority_compound";
  }

  // no cap at all + expGap is null → market_context_mismatch (no years in JD)
  if (capsApplied.length === 0 && expGap === null) return "market_context_mismatch";

  // no strong cap + text families known but mismatch → market_context_mismatch (domain-only)
  if (capsApplied.length === 0 && textFamJd !== "UNKNOWN" && textFamResume !== "UNKNOWN" && textFamJd === textFamResume) {
    return "market_context_mismatch";
  }

  // subfamily mismatch rules → same_family_incompatible
  if (fired.has("B2_marketing_subfamily_mismatch") || fired.has("B3_biz_subfamily_mismatch") ||
      fired.has("B4_dev_subfamily_mismatch") || fired.has("B5_finance_subfamily_mismatch")) {
    return "same_family_incompatible";
  }

  return "unknown";
}

// ─────────────────────────────────────────────────────────────
// rolePathUsed 추론
// ─────────────────────────────────────────────────────────────
function inferRolePath(structFamCurrent, structFamTarget, textFamJd, textFamResume) {
  const structBothKnown =
    structFamCurrent && structFamCurrent !== "UNKNOWN" &&
    structFamTarget  && structFamTarget  !== "UNKNOWN";
  if (structBothKnown) return "structured";

  const textBothKnown =
    textFamJd !== "UNKNOWN" && textFamResume !== "UNKNOWN";
  if (textBothKnown) return "text";

  return "none";
}

// ─────────────────────────────────────────────────────────────
// subfamilyDetected 요약
// ─────────────────────────────────────────────────────────────
function computeSubfamilyInfo(jdText, resumeText, textFamJd) {
  const parts = [];
  try {
    if (textFamJd === "MARKETING") {
      const j = inferMarketingSubFamily(jdText);
      const r = inferMarketingSubFamily(resumeText);
      parts.push(`MKT: JD=${j} / resume=${r}`);
    } else if (textFamJd === "BIZ") {
      const j = inferBizSubFamily(jdText);
      const r = inferBizSubFamily(resumeText);
      parts.push(`BIZ: JD=${j} / resume=${r}`);
    } else if (textFamJd === "DEV") {
      const j = inferDevSubFamily(jdText);
      const r = inferDevSubFamily(resumeText);
      parts.push(`DEV: JD=${j} / resume=${r}`);
    } else if (textFamJd === "FINANCE") {
      const j = inferFinanceSubFamily(jdText);
      const r = inferFinanceSubFamily(resumeText);
      parts.push(`FIN: JD=${j} / resume=${r}`);
    }
  } catch { /* noop */ }
  return parts.length > 0 ? parts.join(", ") : "none";
}

// ─────────────────────────────────────────────────────────────
// 케이스 점검 및 출력
// ─────────────────────────────────────────────────────────────
function inspectCase(c) {
  let r, err;
  try {
    r = analyze({ jd: c.jd, resume: c.resume }, c.ai ?? null);
  } catch (e) {
    err = e.message;
  }

  const SEP  = "═".repeat(80);
  const SEP2 = "─".repeat(80);

  console.log("\n" + SEP);
  console.log(`  [${c.id}]  cluster: ${c.cluster}  expectedBand: ${c.expectedBand ?? "?"}`);
  console.log(SEP);

  if (err) {
    console.log(`  ⚠  ERROR: ${err}`);
    return;
  }

  // ── 기본 점수 신호 ──────────────────────────────────────────
  const score      = r?.hireability?.final?.hireabilityScore ?? null;
  const capsApplied = r?.hireability?.final?.capsApplied ?? [];
  const capValue   = r?.hireability?.final?.capValue ?? null;
  const matchScore = r?.keywordSignals?.matchScore ?? null;

  // ── careerSignals ────────────────────────────────────────────
  const expGap     = r?.careerSignals?.experienceGap ?? null;
  const expLevel   = r?.careerSignals?.experienceLevelScore ?? null;
  const reqYears   = r?.careerSignals?.requiredYears ?? null;
  const jdMinYears = reqYears?.min ?? null;
  const jdMaxYears = reqYears?.max ?? null;
  const resumeYears =
    typeof expGap === "number" && typeof jdMinYears === "number"
      ? (expGap + jdMinYears).toFixed(1)
      : "N/A";

  // ── 구조적 family ────────────────────────────────────────────
  const structFamCurrent = String(r?.objective?.canonicalCurrentFamily || "UNKNOWN").toUpperCase();
  const structFamTarget  = String(r?.objective?.canonicalTargetFamily  || "UNKNOWN").toUpperCase();

  // ── 텍스트 family ────────────────────────────────────────────
  const textFamJd     = String(inferCanonicalFamily(c.jd)     || "UNKNOWN").toUpperCase();
  const textFamResume = String(inferCanonicalFamily(c.resume)  || "UNKNOWN").toUpperCase();
  const textFamSame   = textFamJd !== "UNKNOWN" && textFamResume !== "UNKNOWN" && textFamJd === textFamResume;

  // ── rolePathUsed ─────────────────────────────────────────────
  const rolePathUsed = inferRolePath(structFamCurrent, structFamTarget, textFamJd, textFamResume);

  // ── subfamily ───────────────────────────────────────────────
  const subfamilyInfo = computeSubfamilyInfo(c.jd, c.resume, textFamJd);

  // ── passmapType ──────────────────────────────────────────────
  const simVM = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const pmId  = simVM?.passmapType?.id ?? null;

  // ── topRiskSignals ───────────────────────────────────────────
  const topRisks = Array.isArray(simVM?.top3Risks)
    ? simVM.top3Risks.slice(0, 3).map((ri) => ri?.title ?? ri?.id ?? String(ri)).join(", ")
    : "(없음)";

  // ── 실제 band ───────────────────────────────────────────────
  const actualBand =
    score === null ? "unknown"
    : score <= 42  ? "<=42"
    : score <= 43  ? "<=43"
    : score <= 44  ? "<=44"
    : ">44";
  const bandOk = c.expectedBand && actualBand === c.expectedBand ? "✅ PASS" : "❌ FAIL";

  // ── 규칙 요약 ────────────────────────────────────────────────
  const ruleSummary = computeRuleSummary({
    capsApplied,
    expGap,
    expLevel,
    matchScore,
    textFamJd,
    textFamResume,
    textFamSame,
    structFamCurrent,
    structFamTarget,
    keywordSignals: r?.keywordSignals,
  });

  // ── 분석 힌트 ────────────────────────────────────────────────
  const hint = computeAnalysisHint({ capsApplied, textFamSame, textFamJd, textFamResume, expGap, matchScore });

  // ──────────── 출력 ───────────────────────────────────────────
  console.log(`  score       : ${score}   capValue=${capValue}   actualBand=${actualBand}  ${bandOk}`);
  console.log(`  capsApplied : ${capsApplied.length > 0 ? capsApplied.map((c) => `${c.rule}(${c.cap})`).join(" + ") : "none"}`);
  console.log(`  passmapType : ${pmId ?? "null"}`);
  console.log(`  topRiskSignals: ${topRisks}`);
  console.log(SEP2);

  console.log(`  expGap      : ${expGap}`);
  console.log(`  expLevel    : ${expLevel != null ? expLevel.toFixed(3) : "null"}`);
  console.log(`  matchScore  : ${matchScore != null ? matchScore.toFixed(3) : "null"}`);
  console.log(`  resumeYears : ${resumeYears}`);
  console.log(`  jdMinYears  : ${jdMinYears}`);
  console.log(`  jdMaxYears  : ${jdMaxYears}`);
  console.log(SEP2);

  console.log(`  structFamily: JD=${structFamTarget}  resume=${structFamCurrent}`);
  console.log(`  textFamily  : JD=${textFamJd}  resume=${textFamResume}`);
  console.log(`  sameFamily  : ${textFamSame}`);
  console.log(`  subfamilyDetected: ${subfamilyInfo}`);
  console.log(SEP2);

  console.log(`  rolePathUsed: ${rolePathUsed}`);
  console.log(SEP2);

  // 규칙 분류
  const firedRules     = Object.entries(ruleSummary).filter(([, v]) => v.startsWith("fired"));
  const blockedRules   = Object.entries(ruleSummary).filter(([, v]) => v.startsWith("eligible-but-blocked"));
  const eligibleRules  = Object.entries(ruleSummary).filter(([, v]) => v.startsWith("eligible —") && !v.includes("blocked"));
  const unknownRules   = Object.entries(ruleSummary).filter(([, v]) => v.startsWith("unknown"));
  const notEligRules   = Object.entries(ruleSummary).filter(([, v]) => v.startsWith("not eligible"));

  console.log("  rule summary:");
  console.log(`    ✅ actually fired     : ${firedRules.length > 0 ? firedRules.map(([k, v]) => `[${k}] ${v}`).join("\n" + " ".repeat(28)) : "none"}`);
  if (eligibleRules.length > 0) {
    console.log(`    ⚠  eligible (check)  : ${eligibleRules.map(([k, v]) => `[${k}] ${v}`).join("\n" + " ".repeat(28))}`);
  }
  console.log(`    🔒 eligible-but-blocked: ${blockedRules.length > 0 ? blockedRules.map(([k, v]) => `[${k}] ${v}`).join("\n" + " ".repeat(28)) : "none"}`);
  if (unknownRules.length > 0) {
    console.log(`    ❓ unknown eligibility: ${unknownRules.map(([k, v]) => `[${k}] ${v}`).join("\n" + " ".repeat(28))}`);
  }
  console.log(`    ✗  not eligible      : ${notEligRules.map(([k]) => `[${k}]`).join(" ")}`);
  console.log(SEP2);

  console.log(`  analysis hint: ${hint}`);
  console.log(SEP);
}

// ─────────────────────────────────────────────────────────────
// 진입점
// ─────────────────────────────────────────────────────────────
const { ids, cluster } = parseArgs(process.argv.slice(2));

let filtered;
if (cluster) {
  filtered = CASES.filter((c) => c.cluster === cluster);
} else if (ids.length > 0) {
  filtered = CASES.filter((c) => ids.includes(c.id));
} else {
  console.error("사용법:");
  console.error("  node scripts/inspect_cap_path.mjs fa-01 fa-06");
  console.error("  node scripts/inspect_cap_path.mjs --cluster false_accept_high");
  process.exit(1);
}

if (filtered.length === 0) {
  console.error(`매칭된 케이스 없음. ids=${JSON.stringify(ids)}, cluster=${cluster}`);
  process.exit(1);
}

console.log(`\n케이스 ${filtered.length}건 점검 시작...`);
for (const c of filtered) inspectCase(c);
console.log(`\n완료 (${filtered.length}건)\n`);
