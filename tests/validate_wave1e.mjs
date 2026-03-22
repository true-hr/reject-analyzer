// Wave 1e visible differentiation validation
// Archetypes: A=PM-like, B=SalesOps-like, C=weak, D=vendor-contamination, E=adjacent-domain
import { analyze } from "../src/lib/analyzer.js";

function probe(label, state) {
  const r = analyze(state, null);
  const vm = r?.reportPack?.simulationViewModel ?? {};
  const nc = vm?.candidateAxisPack?.narrativeContext ?? {};
  const jp = vm?.judgmentPack?.items ?? {};
  const rv2 = vm?.reportV2 ?? {};

  const tlh = nc?.targetLevelHints ?? [];
  const fd = nc?.familyDistance ?? "(none)";
  const levelFit = jp?.levelPositionFit ?? null;
  const trFit = jp?.targetRoleFit ?? null;
  const typeRead = rv2?.typeReadV2 ?? {};
  const proof = rv2?.proofSummaryV2 ?? {};
  const topRisk = rv2?.topRiskRead ?? {};

  console.log(`\n${"=".repeat(60)}`);
  console.log(`SAMPLE: ${label}`);
  console.log("=".repeat(60));
  console.log("[targetLevelHints]", tlh.length ? JSON.stringify(tlh) : "(empty — Wave 1e dead)");
  console.log("[familyDistance]  ", fd);
  console.log("[levelPositionFit]",
    "status=" + (levelFit?.status ?? "N/A"),
    "confidence=" + (levelFit?.confidence ?? "N/A"),
    "why=" + (String(levelFit?.why ?? "").slice(0, 60) || "(null)")
  );
  console.log("[targetRoleFit]   ",
    "status=" + (trFit?.status ?? "N/A"),
    "confidence=" + (trFit?.confidence ?? "N/A"),
    "why=" + (String(trFit?.why ?? "").slice(0, 60) || "(null)")
  );
  console.log("[typeReadV2]");
  console.log("  label     :", typeRead.label ?? "(null)");
  console.log("  status    :", typeRead.status ?? "(null)");
  console.log("  confidence:", typeRead.confidence ?? "(null)");
  console.log("  posture   :", String(typeRead.posture ?? "").slice(0, 80) || "(null)");
  console.log("  context   :", String(typeRead.context ?? "").slice(0, 80) || "(null)");
  console.log("[proofSummaryV2]");
  console.log("  strengths :", (proof.strengths ?? []).map(s => String(s.text ?? "").slice(0, 50)).join(" | ") || "(none)");
  console.log("  missing   :", (proof.missing ?? []).map(s => String(s.text ?? "").slice(0, 50)).join(" | ") || "(none)");
  console.log("[topRiskRead]");
  console.log("  headline  :", String(topRisk.structured?.headline ?? topRisk.text?.headline ?? "").slice(0, 80) || "(none)");
  console.log("  posture   :", String(topRisk.structured?.postureSummary ?? topRisk.text?.posture ?? "").slice(0, 80) || "(none)");
  console.log("  confidence:", topRisk.structured?.confidenceLabel ?? "(null)");
}

// A: PM-like — same family (PM→PM), ownership evidence, senior-level
probe("A: PM-like (same family, ownership)", {
  company: "테크스타트업", role: "프로덕트 매니저 (4년차)", stage: "서류", applyDate: "",
  career: { totalYears: 4, gapMonths: 0, jobChanges: 1, lastTenureMonths: 24 },
  jd: "주요업무: 제품 로드맵 수립, OKR 기반 우선순위 결정, 이해관계자 조율, A/B 테스트 설계\n자격요건: PM 경력 3년+, 크로스펑셔널 팀 리딩, 데이터 기반 의사결정\n우대: B2B SaaS 경험, SQL",
  resume: "경력: 4년간 B2C 앱 PM. 제품 로드맵 수립 및 분기 우선순위 결정 주도. A/B 테스트 운영. 크로스펑셔널 팀(개발/디자인/마케팅) 리딩. OKR 기반 목표 설정 및 C-level 보고. 제품 출시 3건 리딩.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 4, proofStrength: 4, roleClarity: 4, storyConsistency: 4, riskSignals: 2 },
  roleTarget: "프로덕트 매니지먼트", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "팀원", levelTarget: "시니어",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "B2C 플랫폼", industryTargetSub: "",
  roleMarketSub: "", currentRole: "PM", roleCurrent: "프로덕트 매니지먼트",
  roleCurrentSub: "", roleTargetSub: "프로덕트 매니지먼트",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
  roleTargetResolved: { id: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT" },
  roleCurrentResolved: { id: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT" },
});

// B: Sales Ops-like — same family (SalesOps→SalesOps), CRM ownership
probe("B: SalesOps-like (same family, CRM ownership)", {
  company: "SaaS기업", role: "세일즈 옵스 (3년차)", stage: "서류", applyDate: "",
  career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 30 },
  jd: "주요업무: CRM(Salesforce) 운영·설계, 영업 파이프라인 분석, forecasting 체계 구축, 영업 KPI 설계\n자격요건: 세일즈 옵스 경력 2년+, Salesforce 운영, 영업 데이터 분석\n우대: SQL, 대시보드 자동화",
  resume: "경력: B2B SaaS 영업 운영 3년. Salesforce CRM 설정·운영·개선 담당. 영업 파이프라인 분석 및 forecast 체계 설계. 영업 KPI(win rate, pipeline velocity) 설계. 영업 프로세스 SOP 문서화. 영업 대시보드 자동화.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 4, proofStrength: 4, roleClarity: 4, storyConsistency: 4, riskSignals: 2 },
  roleTarget: "세일즈 옵스", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "팀원", levelTarget: "시니어",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "B2B SaaS", industryTargetSub: "",
  roleMarketSub: "", currentRole: "세일즈 옵스", roleCurrent: "영업 운영",
  roleCurrentSub: "", roleTargetSub: "세일즈 옵스",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
  roleTargetResolved: { id: "JOB_SALES_SALES_OPERATIONS" },
  roleCurrentResolved: { id: "JOB_SALES_SALES_OPERATIONS" },
});

// C: weak/ambiguous — no ontology, thin resume
probe("C: weak/ambiguous (no ontology, thin)", {
  company: "중소기업", role: "기획팀 (2년차)", stage: "서류", applyDate: "",
  career: { totalYears: 2, gapMonths: 3, jobChanges: 2, lastTenureMonths: 8 },
  jd: "주요업무: 사업 기획, 시장 조사, 보고서 작성\n자격요건: 기획 경력 2년+",
  resume: "경력: 기획 업무 2년. 보고서 작성, 데이터 정리, 미팅 참여. 다양한 업무 경험.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 2, proofStrength: 2, roleClarity: 2, storyConsistency: 2, riskSignals: 4 },
  roleTarget: "기획", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "기획", roleCurrent: "",
  roleCurrentSub: "", roleTargetSub: "",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
});

// D: vendor contamination — HRBP target, but resume is vendor/implementation side
probe("D: vendor contamination (HRBP target, vendor resume)", {
  company: "HR테크벤더", role: "구현 컨설턴트 (3년차)", stage: "서류", applyDate: "",
  career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36 },
  jd: "주요업무: HR 파트너링, 조직 설계, 직원 경험 개선, 임원 코칭\n자격요건: HRBP 3년+, HR 프로세스 개선 경험",
  resume: "경력: SAP SuccessFactors 구현 컨설턴트 3년. 고객사 HR 시스템 배포 및 모듈 구성 담당. 임원 지원 보고 자료 작성. C-level support 미팅 참석. 경영진 지원 활동. HR 모듈 설정·테스트·배포.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 3, proofStrength: 2, roleClarity: 2, storyConsistency: 3, riskSignals: 3 },
  roleTarget: "HRBP", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "", levelTarget: "시니어",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "HR컨설턴트", roleCurrent: "",
  roleCurrentSub: "", roleTargetSub: "",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
  roleTargetResolved: { id: "JOB_HR_ORGANIZATION_HRBP" },
});

// E: adjacent-domain — PM current → SalesOps target (different family, different major)
probe("E: adjacent-domain (PM current → SalesOps target)", {
  company: "테크기업", role: "PM (3년차)", stage: "서류", applyDate: "",
  career: { totalYears: 3, gapMonths: 0, jobChanges: 1, lastTenureMonths: 36 },
  jd: "주요업무: CRM 운영, 영업 파이프라인 분석, forecast, 영업 KPI 설계\n자격요건: RevOps/세일즈옵스 2년+, Salesforce 경험",
  resume: "경력: 프로덕트 매니저 3년. 제품 로드맵 기획 및 이해관계자 조율. KPI 관리, A/B 테스트 설계. 영업팀과 GTM 협업 경험. CRM 데이터는 간접 활용 수준.",
  portfolio: "", interviewNotes: "",
  selfCheck: { coreFit: 3, proofStrength: 3, roleClarity: 3, storyConsistency: 3, riskSignals: 3 },
  roleTarget: "세일즈 옵스", roleKscoMajor: "unknown", roleKscoOfficeSub: "",
  entryLevelMode: false, age: "", salaryCurrent: "", salaryTarget: "",
  levelCurrent: "팀원", levelTarget: "시니어",
  industryCurrent: "", industryCurrentSub: "", industryTarget: "", industryTargetSub: "",
  roleMarketSub: "", currentRole: "PM", roleCurrent: "프로덕트 매니지먼트",
  roleCurrentSub: "", roleTargetSub: "세일즈 옵스",
  currentRoleKscoMajor: "unknown", currentRoleKscoOfficeSub: "",
  roleTargetResolved: { id: "JOB_SALES_SALES_OPERATIONS" },
  roleCurrentResolved: { id: "JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT" },
});
