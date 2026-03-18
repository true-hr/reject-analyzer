/**
 * PASSMAP 오류 지도(error map) 수집 스크립트
 * 실행: node ./scripts/collect_error_map.mjs
 * 코드 수정 없음 — 관찰/기록 전용
 */
import { analyze } from "../src/lib/analyzer.js";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────
// 케이스 정의 (25개)
// ─────────────────────────────────────────────────────────────
const CASES = [

  // ══════════════════════════════════════════════════════
  // 1️⃣ seniority_gap (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "sg-01",
    category: "seniority_gap",
    jd: `퍼포먼스 마케팅 팀장 / 리드

주요 업무
- 퍼포먼스 마케팅 전략 총괄 및 예산 책임
- 팀원 코칭 및 KPI 설계
- 채널별 성과 최적화 및 경영진 보고

자격 요건
- 퍼포먼스 마케팅 경력 7년 이상
- 팀 리딩 경험 필수
- 연간 예산 10억 이상 운영 경험`,
    resume: `퍼포먼스 마케팅 담당 (1년 4개월)

- 메타·구글 광고 캠페인 운영 및 일일 성과 모니터링
- 광고 리포트 작성 및 팀장 보고
- 소재 A/B 테스트 보조`,
    expected: "score ≤ 44, E_same_family_seniority 발화",
    why: "같은 MKT family, expGap 극심 (-5+ 예상), 엔진이 seniority 반영 못할 가능성",
  },
  {
    testId: "sg-02",
    category: "seniority_gap",
    jd: `전략기획 시니어 매니저

주요 업무
- 전사 중장기 전략 수립 리드
- 사업부별 KPI 설계 총괄
- 이사회 보고 자료 작성 및 프레젠테이션

자격 요건
- 전략기획 또는 컨설팅 경력 8년 이상
- MBA 우대
- 조직 리딩 경험`,
    resume: `전략기획 주임 (2년 1개월)

- 시장 조사 및 경쟁사 분석 자료 작성
- 팀장 보고용 PPT 작성 보조
- 분기별 KPI 현황 집계`,
    expected: "score ≤ 44, E_same_family_seniority 발화",
    why: "동일 BIZ family, JD 8년+ vs resume 2년, 극심한 seniority gap",
  },
  {
    testId: "sg-03",
    category: "seniority_gap",
    jd: `데이터 엔지니어링 리드

주요 업무
- 데이터 파이프라인 아키텍처 설계 총괄
- 데이터 플랫폼 로드맵 수립
- 팀원 기술 리뷰 및 코드 리뷰 리드

자격 요건
- 데이터 엔지니어링 경력 6년 이상
- Spark / Airflow / dbt 실무 운영 경험
- 팀 리딩 경험`,
    resume: `데이터 엔지니어 (1년 8개월)

- Python 기반 ETL 파이프라인 유지보수
- Airflow DAG 스케줄링 보조
- 데이터 품질 모니터링 지원`,
    expected: "score ≤ 44, E_same_family_seniority 발화",
    why: "동일 DATA family, JD 6년+ vs resume 1.8년",
  },
  {
    testId: "sg-04",
    category: "seniority_gap",
    jd: `HR 파트너 / HRBP 시니어

주요 업무
- 조직설계 및 인력운영 전략 수립
- 경영진 및 사업부장 파트너링
- 인사제도 개선 프로젝트 리드

자격 요건
- HR 경력 7년 이상
- 사업부 파트너링 경험 필수
- 노사관계 경험 우대`,
    resume: `HR 담당자 (1년 10개월)

- 채용 공고 등록 및 서류 검토
- 입사 온보딩 자료 준비
- 급여 데이터 집계 및 보고 보조`,
    expected: "score ≤ 44, E_same_family_seniority 발화",
    why: "동일 HR/OPS family 예상, JD 7년+ vs resume 1.8년",
  },
  {
    testId: "sg-05",
    category: "seniority_gap",
    jd: `PM 그룹장 / 프로덕트 디렉터

주요 업무
- 프로덕트 비전 및 로드맵 총괄
- 멀티 스쿼드 운영 및 우선순위 결정
- C-레벨 보고 및 비즈니스 목표 연계

자격 요건
- PM 경력 8년 이상
- 스쿼드 리딩 경험
- B2C SaaS 도메인 경험 우대`,
    resume: `주니어 PM (1년 3개월)

- 기능 스펙 문서 작성 및 개발팀 커뮤니케이션
- 사용자 피드백 정리 및 보고
- QA 테스트 케이스 관리`,
    expected: "score ≤ 44, E_same_family_seniority 발화",
    why: "동일 PM/BIZ family 예상, JD 8년+ vs resume 1.3년",
  },

  // ══════════════════════════════════════════════════════
  // 2️⃣ domain_mismatch_text_only (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "dm-01",
    category: "domain_mismatch_text_only",
    jd: `전략기획 담당

주요 업무
- 전사 사업 전략 수립 및 실행 로드맵 작성
- 신규 사업 타당성 검토
- 경영진 보고 자료 작성`,
    resume: `B2B 영업 / 어카운트 매니저 (3년)

- 신규 기업 고객 발굴 및 영업 파이프라인 관리
- 고객사 제안서 작성 및 계약 협상
- 월별 영업 실적 관리`,
    expected: "score ≤ 43, B_role_mismatch 또는 C_domain_mismatch 발화",
    why: "전략기획 vs 영업 — 직군 다름, structured domain 없음, text 기반 cap 미발화 예상",
  },
  {
    testId: "dm-02",
    category: "domain_mismatch_text_only",
    jd: `재무기획 담당

주요 업무
- 연간 예산 계획 수립 및 실적 분석
- 투자 타당성 검토 및 재무 모델링
- 경영진 재무 보고`,
    resume: `콘텐츠 마케터 (2년 6개월)

- 브랜드 SNS 콘텐츠 기획 및 운영
- 콘텐츠 KPI 분석 및 성과 보고
- 외부 크리에이터 협업 관리`,
    expected: "score ≤ 43, C_domain_mismatch 또는 B_role_mismatch 발화",
    why: "재무 vs 마케팅 — 도메인 명백히 다름, structured 없어 cap 미발화 예상",
  },
  {
    testId: "dm-03",
    category: "domain_mismatch_text_only",
    jd: `공급망 관리(SCM) 담당

주요 업무
- 원자재 조달 계획 수립 및 공급업체 관리
- 재고 최적화 및 물류 프로세스 개선
- 원가 절감 프로젝트 리드`,
    resume: `UI/UX 디자이너 (3년)

- 모바일 앱 화면 설계 및 프로토타입 제작
- 사용자 조사 및 UX 리서치
- 디자인 시스템 구축`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "SCM/OPS vs 디자인 — 완전히 다른 직군/도메인, text cap 미발화 예상",
  },
  {
    testId: "dm-04",
    category: "domain_mismatch_text_only",
    jd: `임상시험 프로젝트 매니저

주요 업무
- 임상시험 계획 수립 및 진행 관리
- CRO 및 병원 관계자 커뮤니케이션
- 규제 문서 관리 및 제출`,
    resume: `IT 인프라 엔지니어 (4년)

- 온프레미스 서버 운영 및 네트워크 관리
- 클라우드(AWS) 인프라 구성 및 유지보수
- 장애 대응 및 보안 점검`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "의료/임상 PM vs IT 인프라 — 도메인 완전 상이, text cap 미발화 예상",
  },
  {
    testId: "dm-05",
    category: "domain_mismatch_text_only",
    jd: `MD(상품기획) 담당

주요 업무
- 시즌별 상품 기획 및 구성 관리
- 바이어 미팅 및 협력사 발굴
- 상품 판매 실적 분석 및 재발주 결정`,
    resume: `백엔드 개발자 (3년)

- Node.js / Java Spring 기반 API 서버 개발
- 데이터베이스 설계 및 쿼리 최적화
- CI/CD 파이프라인 구축`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "상품기획/리테일 vs 백엔드 개발 — 직군 완전 불일치, structured 없어 cap 미발화 예상",
  },

  // ══════════════════════════════════════════════════════
  // 3️⃣ role_confusion (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "rc-01",
    category: "role_confusion",
    jd: `데이터 분석가

주요 업무
- 비즈니스 KPI 분석 및 인사이트 도출
- SQL 기반 데이터 추출 및 시각화
- 분석 보고서 작성 및 의사결정 지원`,
    resume: `재무 분석가 (3년)

- 재무제표 분석 및 수익성 모델링
- 예산 실적 분석 및 편차 원인 파악
- 재무 데이터 기반 경영진 리포트 작성`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "데이터 분석(DATA) vs 재무 분석(FIN) — '분석'이라는 단어 공유로 text 추론이 같은 family로 분류할 가능성",
  },
  {
    testId: "rc-02",
    category: "role_confusion",
    jd: `마케팅 기획 담당

주요 업무
- 브랜드 마케팅 전략 수립
- 캠페인 기획 및 성과 관리
- 마케팅 예산 운영`,
    resume: `사업기획 / 전략기획 담당 (3년)

- 신규 사업 타당성 분석 및 사업계획서 작성
- 투자자 IR 자료 작성
- 중장기 전략 로드맵 수립`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "마케팅(MKT) vs 전략기획(BIZ) — '기획'이라는 단어 공유, text 추론에서 같은 family로 오분류 가능성",
  },
  {
    testId: "rc-03",
    category: "role_confusion",
    jd: `영업 관리자 (Sales Manager)

주요 업무
- 영업팀 성과 관리 및 코칭
- 영업 파이프라인 운영 및 CRM 관리
- 고객사 계약 협상 및 클로징`,
    resume: `운영 관리자 (Operations Manager) (4년)

- 물류 프로세스 최적화 및 KPI 관리
- 협력업체 계약 관리 및 SLA 운영
- 내부 운영 효율화 프로젝트 리드`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "'관리자'라는 공통 단어 때문에 영업(SALES) vs 운영(OPS) 구분 실패 가능성",
  },
  {
    testId: "rc-04",
    category: "role_confusion",
    jd: `HR 채용 담당

주요 업무
- 포지션별 채용 전략 수립
- 후보자 소싱 및 인터뷰 운영
- 채용 브랜딩 강화`,
    resume: `콘텐츠 마케터 (2년)

- 채용 공고 콘텐츠 제작 (취업 플랫폼 운영)
- 구직자 대상 커리어 콘텐츠 기획
- SNS 채널 운영`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "'채용' 관련 콘텐츠 제작 이력이 실제 HR 채용 경험처럼 혼동될 수 있는 케이스",
  },
  {
    testId: "rc-05",
    category: "role_confusion",
    jd: `프로덕트 매니저 (B2B SaaS)

주요 업무
- 제품 로드맵 수립 및 스프린트 관리
- 고객 인터뷰 및 요구사항 정의
- 개발팀·디자인팀 협업 리드`,
    resume: `프로젝트 매니저 (IT 컨설팅) (3년)

- ERP 구축 프로젝트 일정·리스크 관리
- 고객사 요구사항 수집 및 사양서 작성
- PMO 운영 및 이해관계자 보고`,
    expected: "score ≤ 43, B_role_mismatch 발화",
    why: "PM(프로덕트) vs PM(프로젝트) — 약어 동일, 유사 업무 표현으로 text 추론 오분류 가능성",
  },

  // ══════════════════════════════════════════════════════
  // 4️⃣ must_have_paraphrase_miss (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "mh-01",
    category: "must_have_paraphrase_miss",
    jd: `데이터 분석가

자격 요건
- SQL 필수
- 데이터 시각화 툴 사용 경험 (Tableau 또는 Power BI)
- Python 기초 이상`,
    resume: `데이터 분석 담당 (2년)

- DB 쿼리를 활용한 데이터 추출 및 집계
- 엑셀 피벗 및 차트 기반 리포트 작성
- 데이터 기반 인사이트 보고`,
    expected: "A_must_have_missing 발화, score ≤ 42",
    why: "SQL → 'DB 쿼리' paraphrase, Tableau/Power BI → '엑셀 차트' — 키워드 미매칭으로 must-have 탐지 실패 예상",
  },
  {
    testId: "mh-02",
    category: "must_have_paraphrase_miss",
    jd: `백엔드 개발자

자격 요건
- Java 또는 Kotlin 필수
- RESTful API 설계 경험
- AWS 서비스 활용 경험`,
    resume: `서버 개발자 (2년 6개월)

- Spring 프레임워크 기반 서버 개발
- HTTP 인터페이스 설계 및 구현
- 클라우드 인프라 환경 배포 경험`,
    expected: "A_must_have_missing 발화 또는 낮은 점수",
    why: "Java → 'Spring 프레임워크' paraphrase, AWS → '클라우드 인프라' — 구체적 키워드 미기재",
  },
  {
    testId: "mh-03",
    category: "must_have_paraphrase_miss",
    jd: `재무 회계 담당

자격 요건
- 전산세무회계 또는 ERP(SAP/Oracle) 사용 경험 필수
- 결산 업무 경험 3년 이상
- 세무 신고 업무 경험`,
    resume: `경리/회계 담당 (3년)

- 월별 장부 마감 및 재무제표 작성
- 부가세 및 법인세 신고 보조
- 회계 프로그램(더존) 활용`,
    expected: "A_must_have_missing 발화",
    why: "SAP/Oracle ERP → '더존' paraphrase — 동급 회계 솔루션이지만 키워드 불일치",
  },
  {
    testId: "mh-04",
    category: "must_have_paraphrase_miss",
    jd: `콘텐츠 마케터

자격 요건
- 영상 편집 툴 필수 (Premiere Pro 또는 Final Cut)
- 카피라이팅 경험
- SNS 채널 운영 경험 2년 이상`,
    resume: `SNS 운영 담당 (2년)

- 영상 촬영 및 편집 (모바일 편집 앱 활용)
- 인스타그램·유튜브 채널 콘텐츠 게시
- 홍보 문구 작성 및 해시태그 기획`,
    expected: "A_must_have_missing 발화",
    why: "Premiere Pro/Final Cut → '모바일 편집 앱' — 도구 수준 불일치, 키워드 탐지 실패 예상",
  },
  {
    testId: "mh-05",
    category: "must_have_paraphrase_miss",
    jd: `ML 엔지니어

자격 요건
- Python 필수
- PyTorch 또는 TensorFlow 경험 필수
- MLOps 경험 우대`,
    resume: `AI 모델 개발 담당 (2년)

- 딥러닝 프레임워크를 활용한 모델 학습
- 데이터 전처리 및 피처 엔지니어링
- 모델 서빙 파이프라인 구축`,
    expected: "A_must_have_missing 발화",
    why: "PyTorch/TensorFlow → '딥러닝 프레임워크' paraphrase — 구체 툴명 미기재",
  },

  // ══════════════════════════════════════════════════════
  // 6️⃣ biz_subfamily_mismatch (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "bs-01",
    category: "biz_subfamily_mismatch",
    jd: `전략기획 포지션

주요 업무
- 경영전략 수립 및 사업 전략 방향 설정
- 전사 전략 로드맵 작성
- 경영진 전략 보고`,
    resume: `사업기획 담당자 (3년)

- 중장기 계획 수립 및 경영기획 업무 수행
- 연간 사업계획서 작성
- 사업 계획 수립 및 운영`,
    expected: "score ≤ 44, B3_biz_subfamily_mismatch 발화 (BIZ_STRATEGY vs BIZ_PLANNING)",
    why: "같은 BIZ canonical family, 전략기획(BIZ_STRATEGY) vs 사업기획(BIZ_PLANNING) — sub-family 탐지 필요",
  },
  {
    testId: "bs-02",
    category: "biz_subfamily_mismatch",
    jd: `사업기획 담당

주요 업무
- 중장기 사업계획 수립
- 사업 계획 수립 및 예산 기획
- 경영기획 업무 수행`,
    resume: `전략기획 팀원 (2년)

- 전략 수립 및 사업 전략 방향 담당
- 경영전략 보조 업무
- 전략기획 리서치`,
    expected: "score ≤ 44, B3_biz_subfamily_mismatch 발화 (BIZ_PLANNING vs BIZ_STRATEGY)",
    why: "역방향 — 사업기획(BIZ_PLANNING) JD vs 전략기획(BIZ_STRATEGY) resume",
  },
  {
    testId: "bs-03",
    category: "biz_subfamily_mismatch",
    jd: `전략기획 시니어 (리드급)

주요 업무
- 경영전략 수립 총괄
- 전략기획 리드
- 전사 전략 방향 수립`,
    resume: `전략기획 주임 (2년)

- 전략기획 보조 업무
- 사업 전략 방향 리서치
- 전략 수립 지원`,
    expected: "B3 미발화 (BIZ_STRATEGY vs BIZ_STRATEGY 동일), E_same_family_seniority 발화 예상",
    why: "동일 BIZ_STRATEGY — sub-family mismatch 없음. seniority gap만 존재",
  },
  {
    testId: "bs-04",
    category: "biz_subfamily_mismatch",
    jd: `전략기획 포지션. 경영전략 수립 및 사업 전략 담당.`,
    resume: `사업 컨설턴트. 컨설팅 업무 담당. 다양한 고객사 지원 경력.`,
    expected: "B3 미발화 (resume bizSubFamily=UNKNOWN — primary keyword 없음)",
    why: "'컨설턴트'는 BIZ canonical이나 BIZ_STRATEGY primary keyword 없음 → sub-family UNKNOWN → B3 미발화",
  },
  {
    testId: "bs-05",
    category: "biz_subfamily_mismatch",
    jd: `전략기획 리드. 경영전략 수립 10년+. 시니어 포지션.`,
    resume: `사업기획 주니어. 경영기획 경험 2년.`,
    expected: "B3 발화 + E 발화 동시 (B3가 E를 차단하지 않음), score=44",
    why: "B3 weak rule — E 차단 집계에서 제외됨. expGap < -4 조건 충족 시 E도 발화해야 함",
  },

  // ══════════════════════════════════════════════════════
  // 5️⃣ stability_or_shape_issue (5개)
  // ══════════════════════════════════════════════════════
  {
    testId: "si-01",
    category: "stability_or_shape_issue",
    jd: "전략기획 담당",
    resume: "전략기획 경험 3년",
    ai: { semanticMatches: null },
    expected: "정상 완료, score 반환",
    why: "ai.semanticMatches = null — 정상 처리 여부 확인",
  },
  {
    testId: "si-02",
    category: "stability_or_shape_issue",
    jd: "마케팅 담당",
    resume: "마케팅 경험 2년",
    ai: { semanticMatches: { matchRate: "not-a-number" } },
    expected: "정상 완료, matchRate 무시 후 score 반환",
    why: "semanticMatches.matchRate 타입 오류 — safeNumberOrNull 처리 확인",
  },
  {
    testId: "si-03",
    category: "stability_or_shape_issue",
    jd: "데이터 분석가",
    resume: "SQL 및 Python 기반 데이터 분석 3년",
    ai: { semanticMatches: { matchRate: 1.5 } },
    expected: "정상 완료, matchRate clamp 처리",
    why: "matchRate > 1 범위 초과값 처리 확인",
  },
  {
    testId: "si-04",
    category: "stability_or_shape_issue",
    jd: "백엔드 개발자",
    resume: "Node.js 서버 개발 2년",
    ai: {},
    expected: "정상 완료, ai 빈 객체 처리",
    why: "ai = {} — semanticMatches 키 없음, 정상 fallback 확인",
  },
  {
    testId: "si-05",
    category: "stability_or_shape_issue",
    jd: "HR 채용 담당",
    resume: "채용 운영 담당 1년",
    ai: { semanticMatches: { matchRate: 0.85 }, keywordMatchV2: { matchRate: 0.9 } },
    expected: "정상 완료, keywordMatchV2 우선 적용",
    why: "keywordMatchV2와 semanticMatches 동시 존재 시 우선순위(keywordMatchV2 > semanticMatches) 확인",
  },

  // ══════════════════════════════════════════════════════
  // 7️⃣ same_family_hidden_mismatch (10개)
  // 같은 canonical family지만 실제 역할 다름
  // ══════════════════════════════════════════════════════
  {
    id: "sf-01", cluster: "same_family_hidden_mismatch",
    jd: `데이터 분석가\n주요 업무\n- SQL 기반 데이터 추출 및 KPI 분석\n- 대시보드 구축 및 리포트 작성\n자격 요건\n- SQL/Python 필수\n- Tableau 경험 우대`,
    resume: `데이터 엔지니어 (3년)\n- Spark/Airflow 기반 ETL 파이프라인 구축\n- 데이터 플랫폼 운영 및 스키마 설계\n- 대용량 데이터 처리 최적화`,
    expectedBand: "<=44",
    why: "DATA family 동일, 분석가 vs 엔지니어 역할 불일치",
  },
  {
    id: "sf-02", cluster: "same_family_hidden_mismatch",
    jd: `프론트엔드 개발자\n주요 업무\n- React 기반 웹 UI 개발\n- 디자인 시스템 구현\n자격 요건\n- React/TypeScript 필수\n- 웹 접근성 경험 우대`,
    resume: `백엔드 개발자 (3년)\n- Spring Boot 기반 REST API 개발\n- MySQL DB 설계 및 쿼리 최적화\n- 마이크로서비스 아키텍처 구축`,
    expectedBand: "<=44",
    why: "DEV family 동일, 프론트 vs 백엔드 역할 불일치",
  },
  {
    id: "sf-03", cluster: "same_family_hidden_mismatch",
    jd: `iOS 모바일 개발자\n주요 업무\n- Swift 기반 iOS 앱 개발\n- 앱스토어 배포 및 유지보수\n자격 요건\n- Swift/Objective-C 필수`,
    resume: `웹 프론트엔드 개발자 (3년)\n- Vue.js/React 기반 웹 서비스 개발\n- JavaScript/TypeScript 실무 경험\n- PWA 개발 경험`,
    expectedBand: "<=44",
    why: "DEV family 동일, iOS native vs 웹 개발 불일치",
  },
  {
    id: "sf-04", cluster: "same_family_hidden_mismatch",
    jd: `HR 채용 전문가\n주요 업무\n- 포지션별 채용 전략 수립 및 실행\n- 후보자 소싱 및 인터뷰 운영\n자격 요건\n- IT 채용 경험 3년+`,
    resume: `HRD/인재개발 담당 (3년)\n- 임직원 교육 프로그램 기획 및 운영\n- 역량 모델 개발 및 성과 평가 지원\n- 온보딩 프로세스 구축`,
    expectedBand: "<=44",
    why: "HR family 동일, 채용(TA) vs 교육개발(HRD) 역할 불일치",
  },
  {
    id: "sf-05", cluster: "same_family_hidden_mismatch",
    jd: `퍼포먼스 마케팅 담당\n주요 업무\n- 메타/구글 광고 운영 및 ROAS 관리\n- 퍼포먼스 마케팅 전략 수립\n자격 요건\n- 퍼포먼스 마케팅 경력 3년+`,
    resume: `SNS 콘텐츠 마케터 (3년)\n- 인스타그램/유튜브 콘텐츠 기획 및 제작\n- 소셜 미디어 채널 운영 및 팔로워 성장\n- 에디토리얼 콘텐츠 관리`,
    expectedBand: "<=44",
    why: "MARKETING family 동일, 퍼포먼스 vs 콘텐츠/SNS 불일치",
  },
  {
    id: "sf-06", cluster: "same_family_hidden_mismatch",
    jd: `FP&A 재무기획 담당\n주요 업무\n- 연간 예산 계획 및 실적 분석\n- 투자 타당성 검토 및 재무 모델링\n자격 요건\n- FP&A 또는 재무기획 3년+`,
    resume: `세무 담당자 (3년)\n- 법인세/부가세 신고 및 세무 조정\n- 이전가격 검토 및 세무 리스크 관리\n- 세무조사 대응`,
    expectedBand: "<=44",
    why: "FINANCE family 동일, FP&A vs 세무 역할 불일치",
  },
  {
    id: "sf-07", cluster: "same_family_hidden_mismatch",
    jd: `SCM/물류 담당\n주요 업무\n- 공급망 계획 수립 및 공급업체 관리\n- 재고 최적화 및 물류 비용 절감\n자격 요건\n- SCM 또는 물류 경력 3년+`,
    resume: `품질관리(QC) 담당 (3년)\n- 제품 품질 검사 및 불량 원인 분석\n- 품질 개선 프로젝트 리드\n- ISO 9001 심사 대응`,
    expectedBand: "<=44",
    why: "OPS family 동일, 물류/SCM vs 품질관리 역할 불일치",
  },
  {
    id: "sf-08", cluster: "same_family_hidden_mismatch",
    jd: `B2B SaaS PM\n주요 업무\n- 엔터프라이즈 제품 로드맵 수립\n- 고객 인터뷰 및 요구사항 정의\n자격 요건\n- B2B SaaS 도메인 PM 경험 3년+`,
    resume: `B2C 앱 서비스 기획 (3년)\n- 소비자 대상 앱 기능 기획 및 출시\n- 사용자 리텐션 개선 및 A/B 테스트\n- MAU/DAU 지표 관리`,
    expectedBand: "<=44",
    why: "PM family 동일, B2B SaaS vs B2C 앱 도메인 불일치",
  },
  {
    id: "sf-09", cluster: "same_family_hidden_mismatch",
    jd: `반도체 설계 엔지니어\n주요 업무\n- 아날로그/디지털 회로 설계\n- ASIC 설계 및 검증\n자격 요건\n- 반도체 또는 회로설계 경력 3년+`,
    resume: `소프트웨어 R&D 엔지니어 (3년)\n- 딥러닝 알고리즘 연구 및 모델 최적화\n- 논문 작성 및 특허 출원\n- AI 솔루션 프로토타입 개발`,
    expectedBand: "<=44",
    why: "RND family 동일, 하드웨어(반도체) vs 소프트웨어 R&D 불일치",
  },
  {
    id: "sf-10", cluster: "same_family_hidden_mismatch",
    jd: `전략기획 시니어\n주요 업무\n- 전사 경영전략 수립 및 사업 전략 방향 설정\n- M&A 및 신사업 기회 발굴\n자격 요건\n- 전략기획 또는 컨설팅 경력 5년+`,
    resume: `경영기획 담당 (3년)\n- 연간 사업계획서 작성 및 예산 편성\n- 경영진 보고 자료 작성\n- 중장기 계획 수립 보조`,
    expectedBand: "<=44",
    why: "BIZ family 동일, 전략기획(BIZ_STRATEGY) vs 경영기획(BIZ_PLANNING) 역할 불일치",
  },

  // ══════════════════════════════════════════════════════
  // 8️⃣ must_have_paraphrase (8개)
  // must-have 키워드의 paraphrase 탐지 실패 케이스
  // ══════════════════════════════════════════════════════
  {
    id: "mp-01", cluster: "must_have_paraphrase",
    jd: `백엔드 개발자\n자격 요건\n- Python 필수\n- Django 또는 FastAPI 경험\n- AWS 활용 경험`,
    resume: `서버 개발자 (2년)\n- 파이썬 기반 API 서버 개발\n- 클라우드 환경 배포 경험\n- REST API 설계 및 구현`,
    expectedBand: "<=42",
    why: "Python→파이썬 한글 paraphrase, AWS→클라우드 환경",
  },
  {
    id: "mp-02", cluster: "must_have_paraphrase",
    jd: `데이터 분석가\n자격 요건\n- SQL 필수\n- Tableau 또는 Looker 경험\n- Excel 고급 활용`,
    resume: `데이터 담당 (2년)\n- DB 쿼리를 활용한 데이터 추출\n- 시각화 툴 기반 대시보드 작성\n- 엑셀 피벗테이블 분석`,
    expectedBand: "<=42",
    why: "SQL→DB쿼리, Tableau→시각화툴, Excel→엑셀 paraphrase",
  },
  {
    id: "mp-03", cluster: "must_have_paraphrase",
    jd: `프론트엔드 개발자\n자격 요건\n- React 필수\n- TypeScript 필수\n- Git 활용 필수`,
    resume: `웹 개발자 (2년)\n- 리액트 기반 웹 개발 경험\n- 타입스크립트 활용 프로젝트 참여\n- 버전관리 도구 사용`,
    expectedBand: "<=42",
    why: "React→리액트, TypeScript→타입스크립트, Git→버전관리도구 한글 paraphrase",
  },
  {
    id: "mp-04", cluster: "must_have_paraphrase",
    jd: `DevOps 엔지니어\n자격 요건\n- Docker/Kubernetes 필수\n- CI/CD 파이프라인 구축 경험\n- Linux 서버 운영 경험`,
    resume: `인프라 담당 (2년)\n- 컨테이너 환경 운영 경험\n- 자동화 배포 파이프라인 관리\n- 리눅스 기반 서버 운영`,
    expectedBand: "<=42",
    why: "Docker/Kubernetes→컨테이너환경, CI/CD→자동화배포 paraphrase",
  },
  {
    id: "mp-05", cluster: "must_have_paraphrase",
    jd: `마케팅 담당\n자격 요건\n- Google Analytics 필수\n- Meta Ads/Google Ads 운영 경험\n- Excel 데이터 분석 능력`,
    resume: `디지털 마케터 (2년)\n- GA를 활용한 트래픽 분석 경험\n- 소셜 광고 집행 및 최적화\n- 스프레드시트 기반 성과 분석`,
    expectedBand: "<=42",
    why: "Google Analytics→GA, Meta/Google Ads→소셜광고, Excel→스프레드시트 paraphrase",
  },
  {
    id: "mp-06", cluster: "must_have_paraphrase",
    jd: `영업/CRM 담당\n자격 요건\n- Salesforce 또는 HubSpot 사용 경험 필수\n- 파이프라인 관리 경험\n- 영업 실적 분석 능력`,
    resume: `B2B 영업 담당 (2년)\n- CRM 툴을 활용한 고객 관리\n- 영업 파이프라인 추적 및 보고\n- 매출 실적 엑셀 분석`,
    expectedBand: "<=42",
    why: "Salesforce/HubSpot→CRM툴 paraphrase",
  },
  {
    id: "mp-07", cluster: "must_have_paraphrase",
    jd: `PM/기획자\n자격 요건\n- Jira/Confluence 사용 필수\n- 애자일/스크럼 방법론 경험\n- Figma 협업 경험`,
    resume: `서비스 기획자 (2년)\n- 협업 툴 기반 스프린트 관리 경험\n- 애자일 방식의 프로젝트 진행\n- 디자인 협업 툴 사용 경험`,
    expectedBand: "<=42",
    why: "Jira/Confluence→협업툴, Figma→디자인협업툴 paraphrase",
  },
  {
    id: "mp-08", cluster: "must_have_paraphrase",
    jd: `ML 엔지니어\n자격 요건\n- PyTorch 또는 TensorFlow 필수\n- MLflow 또는 Kubeflow 경험\n- GPU 클러스터 운영 경험`,
    resume: `AI 개발자 (2년)\n- 딥러닝 프레임워크 기반 모델 개발\n- 모델 실험 관리 및 버전 추적 경험\n- 분산 학습 환경 운영`,
    expectedBand: "<=42",
    why: "PyTorch/TF→딥러닝프레임워크, MLflow→모델실험관리 paraphrase",
  },

  // ══════════════════════════════════════════════════════
  // 9️⃣ false_accept_high (6개)
  // 낮아야 하는데 높게 나올 수 있는 케이스
  // ══════════════════════════════════════════════════════
  {
    id: "fa-01", cluster: "false_accept_high",
    jd: `CTO / 기술 총괄\n주요 업무\n- 전사 기술 전략 수립 및 아키텍처 총괄\n- 개발 조직 빌딩 및 리더십\n자격 요건\n- 개발 경력 10년 이상\n- 기술 조직 리딩 경험 필수`,
    resume: `주니어 백엔드 개발자 (1년)\n- Spring 기반 API 개발 보조\n- 코드 리뷰 참여 및 버그 수정\n- 사내 스터디 참여`,
    expectedBand: "<=42",
    why: "CTO vs 주니어 1년 — 극단적 seniority 불일치, 점수가 낮아야 함",
  },
  {
    id: "fa-02", cluster: "false_accept_high",
    jd: `해외영업 담당 (글로벌)\n주요 업무\n- 해외 파트너사 발굴 및 계약 협상\n- 영어 능통 필수\n- 글로벌 출장 다수`,
    resume: `국내 영업 담당 (3년)\n- 국내 중소기업 대상 B2B 영업\n- 한국어 제안서 작성 및 미팅\n- 국내 영업 실적 달성`,
    expectedBand: "<=43",
    why: "글로벌 vs 국내 영업 — 영어 능통/해외 경험 필수 조건 불일치",
  },
  {
    id: "fa-03", cluster: "false_accept_high",
    jd: `바이오텍/임상시험 PM\n주요 업무\n- 임상시험 계획 수립 및 진행 관리\n- CRO 및 병원 커뮤니케이션\n자격 요건\n- 임상시험 경력 3년+`,
    resume: `IT 프로젝트 매니저 (3년)\n- ERP 구축 프로젝트 일정 관리\n- 이해관계자 커뮤니케이션\n- 리스크 관리 및 보고`,
    expectedBand: "<=43",
    why: "바이오/임상 도메인 vs IT — 도메인 전문성 완전 불일치",
  },
  {
    id: "fa-04", cluster: "false_accept_high",
    jd: `재무 이사 (CFO 후보)\n주요 업무\n- 전사 재무 전략 수립 총괄\n- IR 및 투자자 관계 관리\n자격 요건\n- 재무 경력 12년 이상\n- 상장사 경험`,
    resume: `신입 경리 담당 (6개월)\n- 매입매출 전표 입력\n- 급여 계산 보조\n- 비품 구매 및 총무 지원`,
    expectedBand: "<=42",
    why: "CFO급 vs 신입 경리 — seniority 및 역할 극단적 불일치",
  },
  {
    id: "fa-05", cluster: "false_accept_high",
    jd: `프로덕트 디렉터\n주요 업무\n- 멀티 프로덕트 라인 총괄\n- C-레벨 보고 및 전략 연계\n자격 요건\n- PM 경력 8년+ 및 조직 리딩 경험`,
    resume: `UX/UI 디자이너 (3년)\n- 와이어프레임 및 프로토타입 제작\n- 사용자 조사 및 디자인 개선\n- 디자인 시스템 구축`,
    expectedBand: "<=43",
    why: "PM 디렉터급 JD vs UX 디자이너 — 역할 불일치, 점수가 낮아야 함",
  },
  {
    id: "fa-06", cluster: "false_accept_high",
    jd: `글로벌 세일즈 리드\n주요 업무\n- APAC/EMEA 시장 영업 총괄\n- 글로벌 파트너십 전략 수립\n자격 요건\n- 글로벌 B2B 세일즈 경력 7년+`,
    resume: `국내 B2C 판매 담당 (2년)\n- 오프라인 매장 판매 관리\n- 고객 상담 및 CS 처리\n- 재고 관리 및 진열`,
    expectedBand: "<=42",
    why: "글로벌 B2B 세일즈 vs 국내 오프라인 B2C — 완전 불일치",
  },

  // ══════════════════════════════════════════════════════
  // 🔟 false_reject_low (6개)
  // 높아야 하는데 낮게 나올 수 있는 케이스 (false 거절)
  // ══════════════════════════════════════════════════════
  {
    id: "fr-01", cluster: "false_reject_low",
    jd: `마케팅 매니저\n주요 업무\n- 마케팅 전략 수립 및 캠페인 기획\n- 브랜드 아이덴티티 관리\n자격 요건\n- 마케팅 경력 4년+`,
    resume: `브랜드 마케터 (4년)\n- 브랜드 마케팅 전략 수립 및 실행\n- 마케팅 캠페인 기획 및 성과 관리\n- 브랜드 아이덴티티 관리`,
    expectedBand: ">44",
    why: "타이틀만 다를 뿐 실질적으로 같은 역할 — 낮게 나오면 false reject",
  },
  {
    id: "fr-02", cluster: "false_reject_low",
    jd: `소프트웨어 엔지니어\n주요 업무\n- 백엔드 서비스 개발 및 운영\n- 코드 품질 관리 및 리뷰\n자격 요건\n- 개발 경력 3년+`,
    resume: `개발자 (3년)\n- 백엔드 서비스 개발 및 운영\n- 코드 리뷰 및 기술 개선\n- REST API 설계 및 구현`,
    expectedBand: ">44",
    why: "소프트웨어 엔지니어 vs 개발자 — 동일 역할 다른 표현",
  },
  {
    id: "fr-03", cluster: "false_reject_low",
    jd: `HR 파트너 / HRBP\n주요 업무\n- 사업부 HR 파트너링\n- 인사제도 운영 및 개선\n자격 요건\n- HR 경력 4년+`,
    resume: `인사담당자 (4년)\n- 사업부 인사 파트너링 업무 수행\n- 인사 제도 운영 및 개선 프로젝트\n- 채용 및 온보딩 관리`,
    expectedBand: ">44",
    why: "HRBP vs 인사담당자 — 동일 역할 다른 타이틀",
  },
  {
    id: "fr-04", cluster: "false_reject_low",
    jd: `전략기획 담당\n주요 업무\n- 전사 사업 전략 수립\n- 신규 사업 기회 분석\n자격 요건\n- 전략기획 또는 컨설팅 경력 3년+`,
    resume: `경영 컨설턴트 (3년)\n- 사업 전략 수립 프로젝트 수행\n- 신규 사업 타당성 분석 및 제안\n- 경영 전략 보고서 작성`,
    expectedBand: ">44",
    why: "전략기획 vs 경영컨설팅 — 실질적으로 매우 유사한 역할",
  },
  {
    id: "fr-05", cluster: "false_reject_low",
    jd: `데이터 분석가\n주요 업무\n- 비즈니스 KPI 분석 및 인사이트 도출\n- 데이터 기반 의사결정 지원\n자격 요건\n- 데이터 분석 경력 3년+`,
    resume: `비즈니스 애널리스트 (3년)\n- 비즈니스 KPI 분석 및 인사이트 도출\n- 데이터 기반 전략 수립 지원\n- SQL/Python 기반 분석`,
    expectedBand: ">44",
    why: "데이터 분석가 vs 비즈니스 애널리스트 — 직무 내용 거의 동일",
  },
  {
    id: "fr-06", cluster: "false_reject_low",
    jd: `영업 팀장\n주요 업무\n- 영업팀 성과 관리 및 코칭\n- 고객사 관계 유지 및 확대\n자격 요건\n- 영업 경력 5년+, 팀 리딩 경험`,
    resume: `Sales Manager (5년)\n- 영업팀 퍼포먼스 관리 및 코칭\n- Key Account 관리 및 매출 확대\n- 팀 목표 설정 및 달성`,
    expectedBand: ">44",
    why: "영업 팀장 vs Sales Manager — 영어 타이틀만 다른 동일 역할",
  },

  // ══════════════════════════════════════════════════════
  // 1️⃣1️⃣ text_domain_only (6개)
  // text에서만 식별 가능한 도메인 불일치
  // ══════════════════════════════════════════════════════
  {
    id: "td-01", cluster: "text_domain_only",
    jd: `B2B SaaS 마케팅 담당\n주요 업무\n- B2B SaaS 플랫폼 마케팅 전략 수립\n- 기업 고객 대상 콘텐츠 마케팅\n- 리드 제너레이션 캠페인 운영`,
    resume: `B2C 이커머스 마케터 (3년)\n- 온라인몰 프로모션 기획 및 운영\n- 소비자 대상 캠페인 집행\n- 이커머스 플랫폼 상품 페이지 최적화`,
    expectedBand: "<=44",
    why: "B2B SaaS vs B2C 이커머스 — text에서만 식별 가능한 도메인 불일치",
  },
  {
    id: "td-02", cluster: "text_domain_only",
    jd: `핀테크 서비스 기획 PM\n주요 업무\n- 금융 서비스 프로덕트 로드맵 수립\n- 규제 대응 및 금융 당국 커뮤니케이션\n자격 요건\n- 핀테크 또는 금융 도메인 경험`,
    resume: `제조업 공정 기획 담당 (3년)\n- 생산 공정 개선 기획 및 실행\n- 설비 투자 계획 수립\n- 원가 절감 프로젝트 리드`,
    expectedBand: "<=44",
    why: "핀테크/금융 vs 제조업 — 도메인 완전 상이",
  },
  {
    id: "td-03", cluster: "text_domain_only",
    jd: `헬스케어/디지털 헬스 PM\n주요 업무\n- 의료기기 소프트웨어 인허가 관리\n- 병원/의사 대상 제품 기획\n자격 요건\n- 헬스케어 도메인 경험 필수`,
    resume: `패션 이커머스 MD (3년)\n- 시즌별 패션 상품 기획 및 구성\n- 브랜드 파트너십 관리\n- 패션 트렌드 분석 및 바잉`,
    expectedBand: "<=44",
    why: "헬스케어 vs 패션/이커머스 — text에서만 식별 가능한 도메인 불일치",
  },
  {
    id: "td-04", cluster: "text_domain_only",
    jd: `엔터프라이즈 소프트웨어 영업\n주요 업무\n- 대기업/공공기관 대상 솔루션 영업\n- 기업고객 RFP 대응 및 제안\n자격 요건\n- 엔터프라이즈 B2B 영업 경력 3년+`,
    resume: `소비재 B2C 영업 담당 (3년)\n- 대형마트/편의점 채널 영업 관리\n- 소비자 대상 프로모션 기획\n- 리테일 파트너 관계 관리`,
    expectedBand: "<=44",
    why: "엔터프라이즈 B2B vs 소비재 B2C — 고객 유형과 도메인 완전 상이",
  },
  {
    id: "td-05", cluster: "text_domain_only",
    jd: `이커머스 플랫폼 운영 담당\n주요 업무\n- 온라인몰 상품 운영 및 매출 관리\n- 이커머스 파트너 관리\n자격 요건\n- 이커머스 운영 경력 3년+`,
    resume: `오프라인 리테일 운영 담당 (3년)\n- 오프라인 매장 운영 및 재고 관리\n- 매장 직원 교육 및 고객 서비스\n- 매장별 매출 목표 관리`,
    expectedBand: "<=44",
    why: "이커머스(온라인) vs 오프라인 리테일 — text에서만 식별 가능한 채널 불일치",
  },
  {
    id: "td-06", cluster: "text_domain_only",
    jd: `글로벌 IT 기업 HR 담당\n주요 업무\n- 글로벌 인사 정책 수립 및 현지화\n- 다국적 팀 HRBP 파트너링\n자격 요건\n- 글로벌 HR 경험 또는 영어 능통`,
    resume: `중소기업 인사 담당 (3년)\n- 국내 임직원 채용 및 인사관리\n- 취업규칙 관리 및 노무 행정\n- 급여 계산 및 4대 보험 처리`,
    expectedBand: "<=44",
    why: "글로벌 다국적 기업 HR vs 국내 중소기업 HR — text에서만 식별 가능한 규모/글로벌 불일치",
  },
];

// ─────────────────────────────────────────────────────────────
// 실행 및 수집
// ─────────────────────────────────────────────────────────────
const results = [];

for (const c of CASES) {
  let r, err;
  try {
    r = analyze({ jd: c.jd, resume: c.resume }, c.ai ?? null);
  } catch (e) {
    err = e.message;
  }

  // normalize id/cluster across old and new case formats
  const id      = c.id ?? c.testId ?? "?";
  const cluster = c.cluster ?? c.category ?? "unknown";

  const score    = r?.hireability?.final?.hireabilityScore ?? null;
  const capsRaw  = r?.hireability?.final?.capsApplied ?? [];
  const caps     = capsRaw.map(x => x.rule.replace(/^[A-E]\d?_/, ""));
  const capVal   = r?.hireability?.final?.capValue ?? null;
  const simVM    = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const pmId     = simVM?.passmapType?.id ?? null;
  const matchPct = r?.keywordSignals?.matchScore != null
    ? Math.round(r.keywordSignals.matchScore * 100) + "%"
    : "?";
  const rolePath = capsRaw.find(x => x.rule === "B_role_mismatch")?.path ?? "none";

  // mainRule: first fired cap rule
  const ruleNames = capsRaw.map(x => x.rule);
  const mainRule  = ruleNames[0] ?? "none";

  // expectedBand from explicit field or inferred from expected string
  const expectedBand = c.expectedBand
    ?? (c.expected?.includes("≤ 42") || c.expected?.includes("<= 42") ? "<=42"
      : c.expected?.includes("≤ 43") || c.expected?.includes("<= 43") ? "<=43"
      : c.expected?.includes("≤ 44") || c.expected?.includes("<= 44") ? "<=44"
      : "unknown");

  // actualBand based on score
  const actualBand = score == null ? "unknown"
    : score <= 42 ? "<=42"
    : score <= 43 ? "<=43"
    : score <= 44 ? "<=44"
    : ">44";

  // suspectedLayer
  const suspectedLayer = ruleNames.some(n => n.includes("B3")) ? "ontology"
    : ruleNames.some(n => n.includes("C2")) ? "domain"
    : ruleNames.some(n => n === "E_same_family_seniority" || n === "D_seniority_severe") ? "seniority"
    : ruleNames.some(n => n.includes("must_have")) ? "must_have"
    : "unknown";

  results.push({
    id,
    cluster,
    score:       score ?? (err ? `ERR` : "null"),
    caps:        caps.join("+") || "none",
    capVal:      capVal ?? "none",
    pmId:        pmId ?? "null",
    matchPct,
    rolePath,
    simVM:       simVM ? "✓" : "✗",
    mainRule,
    expectedBand,
    actualBand,
    suspectedLayer,
    uncaught:    err ?? null,
    expected:    c.expected ?? c.expectedBand ?? null,
    why:         c.why,
  });
}

// ─────────────────────────────────────────────────────────────
// 출력
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(100));
console.log("  PASSMAP 오류 지도 — 수집 결과");
console.log("═".repeat(100));

const CATEGORIES = [
  "seniority_gap", "domain_mismatch_text_only", "role_confusion",
  "must_have_paraphrase_miss", "biz_subfamily_mismatch", "stability_or_shape_issue",
  "same_family_hidden_mismatch", "must_have_paraphrase", "false_accept_high",
  "false_reject_low", "text_domain_only",
];

for (const cat of CATEGORIES) {
  const rows = results.filter(r => r.cluster === cat);
  console.log(`\n▶ ${cat.toUpperCase()} (${rows.length}건)`);
  console.log("─".repeat(100));

  for (const r of rows) {
    const uncaught = r.uncaught ? ` ⚠ UNCAUGHT: ${r.uncaught}` : "";
    console.log(`[${r.id}]  score=${String(r.score).padEnd(4)}  caps=${String(r.caps).padEnd(28)}  cap=${String(r.capVal).padEnd(5)}  PM=${String(r.pmId).padEnd(5)}  match=${r.matchPct.padEnd(5)}  layer=${String(r.suspectedLayer).padEnd(10)}  simVM=${r.simVM}${uncaught}`);
    console.log(`         expected : ${r.expected}`);
    console.log(`         actual   : score=${r.score} [${r.actualBand}], caps=[${r.caps}], mainRule=${r.mainRule}`);
    const pass =
      r.uncaught == null &&
      r.simVM === "✓" &&
      r.score !== null &&
      r.score !== "null";
    console.log(`         stability: ${pass ? "✓ 완료" : "✗ 불안정"}`);
    console.log();
  }
}

// ─────────────────────────────────────────────────────────────
// 군집별 집계
// ─────────────────────────────────────────────────────────────
console.log("═".repeat(100));
console.log("  군집별 집계 요약");
console.log("═".repeat(100));

for (const cat of CATEGORIES) {
  const rows = results.filter(r => r.cluster === cat);
  if (rows.length === 0) continue;
  const scored   = rows.filter(r => typeof r.score === "number");
  const avgScore = scored.length > 0 ? scored.reduce((s, r) => s + r.score, 0) / scored.length : 0;
  const capFired = rows.filter(r => r.caps !== "none");
  const stable   = rows.filter(r => !r.uncaught && r.simVM === "✓");
  const allCaps  = rows.flatMap(r => r.caps === "none" ? [] : r.caps.split("+"));
  const capFreq  = {};
  for (const c of allCaps) capFreq[c] = (capFreq[c] || 0) + 1;
  const bandMatch = rows.filter(r => r.expectedBand !== "unknown" && r.actualBand === r.expectedBand).length;

  console.log(`\n[${cat}]`);
  console.log(`  케이스 수     : ${rows.length}`);
  console.log(`  avg score     : ${avgScore.toFixed(1)}`);
  console.log(`  cap 발화      : ${capFired.length}/${rows.length}건`);
  console.log(`  cap 분포      : ${Object.entries(capFreq).map(([k,v])=>`${k}(${v})`).join(", ") || "없음"}`);
  console.log(`  band 일치     : ${bandMatch}/${rows.filter(r=>r.expectedBand !== "unknown").length}건`);
  console.log(`  simVM 안정    : ${stable.length}/${rows.length}건`);
  console.log(`  uncaught      : ${rows.filter(r=>r.uncaught).length}건`);
}

// ─────────────────────────────────────────────────────────────
// 우선순위 제안
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(100));
console.log("  분석 — 공통 패턴 및 우선순위 제안");
console.log("═".repeat(100));

const clusterSummary = CATEGORIES.map(cat => {
  const rows = results.filter(r => r.cluster === cat);
  const capFiredCount = rows.filter(r => r.caps !== "none").length;
  const bandMatchCount = rows.filter(r => r.expectedBand !== "unknown" && r.actualBand === r.expectedBand).length;
  const bandTotal = rows.filter(r => r.expectedBand !== "unknown").length;
  return { cat, total: rows.length, capFired: capFiredCount, bandMatch: bandMatchCount, bandTotal };
});

console.log(`\n[패턴 요약]`);
for (const s of clusterSummary) {
  if (s.total === 0) continue;
  const bandStr = s.bandTotal > 0 ? ` band일치 ${s.bandMatch}/${s.bandTotal}` : "";
  console.log(`  ${s.cat.padEnd(30)} cap발화 ${s.capFired}/${s.total}${bandStr}`);
}

console.log(`\n[총 케이스 수: ${results.length}]`);
console.log(`  stable: ${results.filter(r => !r.uncaught && r.simVM === "✓").length}건`);
console.log(`  uncaught: ${results.filter(r => r.uncaught).length}건`);

console.log(`\n[우선순위 제안]`);
console.log(`  1위  must_have_paraphrase(_miss) — paraphrase 탐지 부재. 근본 원인.`);
console.log(`  2위  same_family_hidden_mismatch — 동일 family 내 역할 구분 부재.`);
console.log(`  3위  text_domain_only            — text 기반 도메인 불일치 탐지 미구현.`);
console.log(`  4위  seniority_gap               — E 규칙 임계값 이하 케이스 포착 여부.`);
console.log(`  5위  false_accept_high           — 극단적 불일치인데 높게 나오는 케이스.`);

// ─────────────────────────────────────────────────────────────
// passmap-error-map.json 출력
// ─────────────────────────────────────────────────────────────
const errorMap = results.map(r => ({
  id:             r.id,
  cluster:        r.cluster,
  score:          r.score,
  caps:           r.caps,
  mainRule:       r.mainRule,
  expectedBand:   r.expectedBand,
  actualBand:     r.actualBand,
  suspectedLayer: r.suspectedLayer,
}));

const artifactsDir = resolve(process.cwd(), "tests/artifacts");
mkdirSync(artifactsDir, { recursive: true });
const outPath = resolve(artifactsDir, "passmap-error-map.json");
writeFileSync(outPath, JSON.stringify(errorMap, null, 2), "utf-8");
console.log(`\n✓ passmap-error-map.json 저장 완료 → ${outPath} (${errorMap.length}건)`);
