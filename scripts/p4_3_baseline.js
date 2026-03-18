import { buildDecisionPack } from "../src/lib/decision/index.js";

const JD = `포지션: 전략기획 담당 (3~5년차)
소속: 전략기획팀
주요 업무:
- 시장 및 경쟁사 분석을 통한 사업 기회 발굴
- 중장기 전략 과제 도출 및 실행 로드맵 수립
- KPI 및 실적 데이터 분석을 통한 성과 리뷰 및 개선 제시
- 경영진 보고자료 작성 및 보고
- 유관부서 협업 통한 전략 실행 지원
Must-have: 3년 이상 전략기획 / 사업기획 / 컨설팅 경험`;

const resumes = {
  A: `ABC커머스 | 전략기획팀 | 전략기획 담당 (4년)
사업 전략 수립 및 실행
국내 이커머스 시장 및 경쟁사 분석을 기반으로 신규 카테고리 진입 전략 수립
시장 규모, 경쟁사 가격 구조, 고객 세그먼트 분석을 통해 신규 사업 기회 3개 도출
연간 전략 과제 로드맵 수립 및 5개 전략 과제 실행 관리
물류비 절감 전략 프로젝트 리딩  연간 비용 12% 절감
사업 KPI 대시보드 구축 (매출, CAC, 전환율 등)
월간 실적 분석 보고서를 통해 마케팅 ROI 개선안 제시
분기 전략 리뷰 자료 작성 및 CEO 보고
신규 사업 검토 보고서 작성 (시장 분석 / 수익성 분석 포함)
마케팅 / 영업 / 물류 조직과 협업하여 전략 과제 실행`,
  B: `넥스트솔루션 | 전략기획팀 | 전략기획 담당 (3년)
회사 전략 방향 수립 지원
시장 및 경쟁사 동향 리서치 수행
사업 성과 관련 데이터 정리 및 분석 지원
전략 관련 보고자료 작성 보조
유관 부서 협업을 통한 프로젝트 지원
전략 과제 관련 자료 조사 및 정리
경영진 보고 자료 작성 지원
사업 관련 데이터 취합 및 분석
전략 회의 자료 준비`,
  C: `브릿지테크 | 전략기획팀 | 사업기획 담당 (4년)
사업 성과 분석
월별 사업 KPI 분석 및 실적 리포트 작성
매출, 전환율, 고객 유입 데이터 분석
경영진 보고
월간 사업 실적 보고 자료 작성
주요 KPI 변화 요인 분석 보고
협업
마케팅 조직과 협업하여 캠페인 성과 분석
영업 조직과 협업하여 고객 데이터 분석
데이터 분석
Excel 기반 매출 및 고객 데이터 분석`,
  D: `스타트업X | 운영기획 | 운영기획 매니저 (4년)
운영 전략 및 프로세스 개선
고객 운영 프로세스 개선 프로젝트 수행
CS 운영 효율화 프로젝트 진행
프로젝트 관리
서비스 운영 관련 프로젝트 PM 역할 수행
서비스 운영 정책 수립
데이터 분석
운영 KPI 분석 (CS 처리 시간, 응답률)
운영 지표 개선 프로젝트 진행
협업
고객지원팀 / 개발팀 협업
Tools
Excel
PowerPoint`,
};

function buildState(id, resume) {
  return { jdText: JD, resumeText: resume, __parsedJD: {}, __parsedResume: { summary: resume } };
}

for (const [id, resume] of Object.entries(resumes)) {
  const pack = buildDecisionPack({
    state: buildState(id, resume),
    structural: { flags: [], metrics: {} },
    ai: null,
    evidenceFit: { penalty: 0, overallScore: 75, level: "ok" },
  });
  const [top] = pack.riskResults || [];
  console.log(JSON.stringify({
    id,
    score: pack.decisionScore.capped,
    candidateType: pack.candidateType,
    band: pack.band,
    dominantRisk: pack.decisionScore.meta.taskCalibration?.dominantRisk,
    topRisk: top?.id,
    topPriority: top?.priority,
  }));
}
