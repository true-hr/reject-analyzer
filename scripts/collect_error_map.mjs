/**
 * PASSMAP 오류 지도(error map) 수집 스크립트
 * 실행: node ./scripts/collect_error_map.mjs
 * 코드 수정 없음 — 관찰/기록 전용
 */
import { analyze } from "../src/lib/analyzer.js";

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

  const score    = r?.hireability?.final?.hireabilityScore ?? null;
  const caps     = (r?.hireability?.final?.capsApplied ?? []).map(x => x.rule.replace(/^[A-E]_/, ""));
  const capVal   = r?.hireability?.final?.capValue ?? null;
  const simVM    = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const pmId     = simVM?.passmapType?.id ?? null;
  const matchPct = r?.keywordSignals?.matchScore != null
    ? Math.round(r.keywordSignals.matchScore * 100) + "%"
    : "?";
  const rolePath = (r?.hireability?.final?.capsApplied ?? []).find(x => x.rule === "B_role_mismatch")?.path ?? "none";

  results.push({
    testId:      c.testId,
    category:    c.category,
    score:       score ?? (err ? `ERR` : "null"),
    caps:        caps.join("+") || "none",
    capVal:      capVal ?? "none",
    pmId:        pmId ?? "null",
    matchPct,
    rolePath,
    simVM:       simVM ? "✓" : "✗",
    uncaught:    err ?? null,
    expected:    c.expected,
    why:         c.why,
  });
}

// ─────────────────────────────────────────────────────────────
// 출력
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(100));
console.log("  PASSMAP 오류 지도 — 수집 결과");
console.log("═".repeat(100));

const CATEGORIES = ["seniority_gap", "domain_mismatch_text_only", "role_confusion", "must_have_paraphrase_miss", "stability_or_shape_issue"];

for (const cat of CATEGORIES) {
  const rows = results.filter(r => r.category === cat);
  console.log(`\n▶ ${cat.toUpperCase()} (${rows.length}건)`);
  console.log("─".repeat(100));

  for (const r of rows) {
    const uncaught = r.uncaught ? ` ⚠ UNCAUGHT: ${r.uncaught}` : "";
    console.log(`[${r.testId}]  score=${String(r.score).padEnd(4)}  caps=${String(r.caps).padEnd(28)}  cap=${String(r.capVal).padEnd(5)}  PM=${String(r.pmId).padEnd(5)}  match=${r.matchPct.padEnd(5)}  rolePath=${r.rolePath.padEnd(10)}  simVM=${r.simVM}${uncaught}`);
    console.log(`         expected : ${r.expected}`);
    console.log(`         actual   : score=${r.score}, caps=[${r.caps}], PM=${r.pmId}`);
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
  const rows = results.filter(r => r.category === cat);
  const avgScore = rows.reduce((s, r) => s + (Number(r.score) || 0), 0) / rows.length;
  const capFired = rows.filter(r => r.caps !== "none");
  const stable   = rows.filter(r => !r.uncaught && r.simVM === "✓");
  const allCaps  = rows.flatMap(r => r.caps === "none" ? [] : r.caps.split("+"));
  const capFreq  = {};
  for (const c of allCaps) capFreq[c] = (capFreq[c] || 0) + 1;

  console.log(`\n[${cat}]`);
  console.log(`  케이스 수     : ${rows.length}`);
  console.log(`  avg score     : ${avgScore.toFixed(1)}`);
  console.log(`  cap 발화      : ${capFired.length}/${rows.length}건`);
  console.log(`  cap 분포      : ${Object.entries(capFreq).map(([k,v])=>`${k}(${v})`).join(", ") || "없음"}`);
  console.log(`  simVM 안정    : ${stable.length}/${rows.length}건`);
  console.log(`  uncaught      : ${rows.filter(r=>r.uncaught).length}건`);
}

// ─────────────────────────────────────────────────────────────
// 우선순위 제안
// ─────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(100));
console.log("  분석 — 공통 패턴 및 우선순위 제안");
console.log("═".repeat(100));

const sgRows = results.filter(r => r.category === "seniority_gap");
const dmRows = results.filter(r => r.category === "domain_mismatch_text_only");
const rcRows = results.filter(r => r.category === "role_confusion");
const mhRows = results.filter(r => r.category === "must_have_paraphrase_miss");
const siRows = results.filter(r => r.category === "stability_or_shape_issue");

const sgCapFired = sgRows.filter(r => r.caps !== "none").length;
const dmCapFired = dmRows.filter(r => r.caps !== "none").length;
const rcCapFired = rcRows.filter(r => r.caps !== "none").length;
const mhCapFired = mhRows.filter(r => r.caps !== "none").length;

console.log(`\n[패턴 요약]`);
console.log(`  seniority_gap              cap 발화율 ${sgCapFired}/${sgRows.length} — E_same_family_seniority 조건 임계값 민감도`);
console.log(`  domain_mismatch_text_only  cap 발화율 ${dmCapFired}/${dmRows.length} — text-only domain mismatch [C] 미구현`);
console.log(`  role_confusion             cap 발화율 ${rcCapFired}/${rcRows.length} — inferCanonicalFamily text 추론 정확도`);
console.log(`  must_have_paraphrase_miss  cap 발화율 ${mhCapFired}/${mhRows.length} — must-have 키워드 paraphrase 탐지 부재`);
console.log(`  stability_or_shape_issue   uncaught: ${siRows.filter(r=>r.uncaught).length}건 — shape 방어 패치 효과 확인`);

console.log(`\n[우선순위 제안]`);
console.log(`  1위  must_have_paraphrase_miss  — [A] cap이 의도대로 발화해도 paraphrase는 탐지 못함. 근본 원인.`);
console.log(`  2위  domain_mismatch_text_only  — known limitation. text 기반 [C] 구현 검토 여지.`);
console.log(`  3위  role_confusion             — inferCanonicalFamily 정확도 한계. 오분류 군집 확인 필요.`);
console.log(`  4위  seniority_gap              — E 규칙 임계값(expGap<-4) 이하 케이스 포착 여부.`);
console.log(`  5위  stability_or_shape_issue   — 현재 패치로 대부분 안정. 잔여 edge case 확인.`);
