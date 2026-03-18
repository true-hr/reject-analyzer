/**
 * PASSMAP Ontology Patch 검증 스크립트
 * 대상: C2_domain_text_mismatch / B2_marketing_subfamily_mismatch / taskOntology synonym 확장
 * 실행: node ./scripts/verify_ontology_patch.mjs
 * 코드 수정 없음 — 관찰/기록 전용
 */
import { analyze } from "../src/lib/analyzer.js";

// ─────────────────────────────────────────────
// Round 7 baseline (패치 전 — collect_error_map 기준)
// ─────────────────────────────────────────────
const BASELINE = {
  "sg-01": 44, "sg-02": 44,
  "dm-01": 43, "dm-02": 43, "dm-03": 43, "dm-04": 43, "dm-05": 43,
  "rc-01": 43, "rc-02": 45, "rc-03": 43, "rc-04": 45, "rc-05": 45,
  "mh-01": 42, "mh-02": 55, "mh-03": 42, "mh-04": 42, "mh-05": 42,
  "si-01": null, "si-02": null,
};

// ─────────────────────────────────────────────
// 검증 케이스 정의
// ─────────────────────────────────────────────
const CASES = [
  // ── seniority_gap (회귀 확인 2개) ──
  {
    testId: "sg-01", category: "seniority_gap",
    jd: `퍼포먼스 마케팅 팀장 / 리드\n주요 업무\n- 퍼포먼스 마케팅 전략 총괄 및 예산 책임\n- 팀원 코칭 및 KPI 설계\n- 채널별 성과 최적화 및 경영진 보고\n자격 요건\n- 퍼포먼스 마케팅 경력 7년 이상\n- 팀 리딩 경험 필수`,
    resume: `퍼포먼스 마케팅 담당 (1년 4개월)\n- 메타·구글 광고 캠페인 운영 및 일일 성과 모니터링\n- 광고 리포트 작성 및 팀장 보고\n- 소재 A/B 테스트 보조`,
    expect: "E_same_family_seniority 유지 (회귀)",
  },
  {
    testId: "sg-02", category: "seniority_gap",
    jd: `전략기획 시니어 매니저\n주요 업무\n- 전사 중장기 전략 수립 리드\n- 사업부별 KPI 설계 총괄\n자격 요건\n- 전략기획 또는 컨설팅 경력 8년 이상`,
    resume: `전략기획 주임 (2년 1개월)\n- 시장 조사 및 경쟁사 분석 자료 작성\n- 팀장 보고용 PPT 작성 보조\n- 분기별 KPI 현황 집계`,
    expect: "E_same_family_seniority 유지 (회귀)",
  },

  // ── domain_mismatch_text_only (5개) ──
  {
    testId: "dm-01", category: "domain_mismatch_text_only",
    jd: `전략기획 담당\n주요 업무\n- 전사 사업 전략 수립 및 실행 로드맵 작성\n- 신규 사업 타당성 검토\n- 경영진 보고 자료 작성`,
    resume: `B2B 영업 / 어카운트 매니저 (3년)\n- 신규 기업 고객 발굴 및 영업 파이프라인 관리\n- 고객사 제안서 작성 및 계약 협상`,
    expect: "B_role_mismatch (BIZ vs SALES) 발화 — C2 미발화 예상",
  },
  {
    testId: "dm-02", category: "domain_mismatch_text_only",
    jd: `B2B SaaS 마케팅 매니저\n주요 업무\n- B2B SaaS 플랫폼 마케팅 전략 수립\n- 기업 고객 대상 캠페인 기획 및 성과 관리\n- 콘텐츠 마케팅 및 리드 제너레이션`,
    resume: `리테일 프로모션 담당 (3년)\n- 이커머스 플랫폼 프로모션 기획 및 운영\n- 온라인몰 상품 기획 및 캠페인 성과 분석\n- 쇼핑몰 입점 채널 관리`,
    expect: "C2_domain_text_mismatch 발화 (B2B_SAAS vs RETAIL_COMMERCE)",
  },
  {
    testId: "dm-03", category: "domain_mismatch_text_only",
    jd: `소비재 브랜드 마케팅 담당\n주요 업무\n- 소비재 브랜드 마케팅 전략 수립\n- b2c 마케팅 캠페인 기획\n- 소비자 대상 브랜딩 프로젝트 리드`,
    resume: `B2B 솔루션 영업 (3년)\n- b2b saas 영업 및 기업고객 발굴\n- 기업 대상 솔루션 제안 및 계약 협상\n- 파이프라인 관리 및 영업 실적 달성`,
    expect: "C2_domain_text_mismatch 발화 (CONSUMER_BRAND vs B2B_SAAS)",
  },
  {
    testId: "dm-04", category: "domain_mismatch_text_only",
    jd: `공급망 관리(SCM) 담당\n주요 업무\n- 원자재 조달 계획 수립 및 공급업체 관리\n- 재고 최적화 및 물류 프로세스 개선`,
    resume: `UI/UX 디자이너 (3년)\n- 모바일 앱 화면 설계 및 프로토타입 제작\n- 사용자 조사 및 UX 리서치`,
    expect: "B_role_mismatch (OPS vs non-OPS) 발화 — C2 미발화 예상",
  },
  {
    testId: "dm-05", category: "domain_mismatch_text_only",
    jd: `MD(상품기획) 담당\n주요 업무\n- 시즌별 상품 기획 및 구성 관리\n- 이커머스 플랫폼 상품 운영`,
    resume: `백엔드 개발자 (3년)\n- Node.js / Java Spring 기반 API 서버 개발\n- 데이터베이스 설계 및 쿼리 최적화`,
    expect: "B_role_mismatch 또는 C2 발화",
  },

  // ── role_confusion (5개) ──
  {
    testId: "rc-01", category: "role_confusion",
    jd: `데이터 분석가\n주요 업무\n- 비즈니스 KPI 분석 및 인사이트 도출\n- SQL 기반 데이터 추출 및 시각화`,
    resume: `재무 분석가 (3년)\n- 재무제표 분석 및 수익성 모델링\n- 예산 실적 분석 및 편차 원인 파악`,
    expect: "B_role_mismatch (DATA vs FINANCE) 발화",
  },
  {
    testId: "rc-02", category: "role_confusion",
    jd: `마케팅 기획 담당\n주요 업무\n- 브랜드 마케팅 전략 수립\n- 캠페인 기획 및 성과 관리`,
    resume: `사업기획 / 전략기획 담당 (3년)\n- 신규 사업 타당성 분석 및 사업계획서 작성\n- 중장기 전략 로드맵 수립`,
    expect: "B_role_mismatch (MKT vs BIZ) 발화",
  },
  {
    testId: "rc-03", category: "role_confusion",
    jd: `영업 관리자 (Sales Manager)\n주요 업무\n- 영업팀 성과 관리 및 코칭\n- 영업 파이프라인 운영 및 CRM 관리`,
    resume: `운영 관리자 (Operations Manager) (4년)\n- 물류 프로세스 최적화 및 KPI 관리\n- 협력업체 계약 관리 및 SLA 운영`,
    expect: "B_role_mismatch (SALES vs OPS) 발화",
  },
  {
    testId: "rc-04", category: "role_confusion",
    jd: `퍼포먼스 마케팅 담당\n주요 업무\n- 퍼포먼스 마케팅 전략 수립\n- 광고 운영 및 매체 운영 최적화\n- ROAS/CPA 지표 관리`,
    resume: `브랜드 마케팅 담당 (3년)\n- 브랜드 마케팅 전략 수립\n- 브랜드 커뮤니케이션 기획\n- 브랜드 아이덴티티 관리`,
    expect: "B2_marketing_subfamily_mismatch 발화 (MKT_PERFORMANCE vs MKT_BRAND)",
  },
  {
    testId: "rc-05", category: "role_confusion",
    jd: `콘텐츠 마케팅 담당\n주요 업무\n- 콘텐츠 마케팅 기획 및 sns 콘텐츠 제작\n- 에디토리얼 운영`,
    resume: `퍼포먼스 마케팅 담당 (2년)\n- 퍼포먼스 마케팅 캠페인 운영\n- paid marketing 실행 및 최적화`,
    expect: "B2_marketing_subfamily_mismatch 발화 (MKT_CONTENT vs MKT_PERFORMANCE)",
  },

  // ── must_have_paraphrase_miss (5개) ──
  {
    testId: "mh-01", category: "must_have_paraphrase_miss",
    jd: `데이터 분석가\n자격 요건\n- SQL 필수\n- Tableau 또는 Power BI\n- Python 기초 이상`,
    resume: `데이터 분석 담당 (2년)\n- DB 쿼리를 활용한 데이터 추출 및 집계\n- 엑셀 피벗 및 차트 기반 리포트 작성`,
    expect: "A_must_have_missing 발화 (SQL/Tableau paraphrase miss)",
  },
  {
    testId: "mh-02", category: "must_have_paraphrase_miss",
    jd: `전략기획 담당\n자격 요건\n- 전략 수립 경험 3년 이상 필수\n- KPI 설계 경험 필수\n- 중장기 전략 수립 경험`,
    resume: `사업기획 담당 (3년)\n- 사업 기획 업무 수행 및 기획안 수립\n- 지표 관리 및 지표 운영 담당\n- 사업기획 총괄`,
    expect: "taskOntology 확장 효과 — 사업기획/지표관리 paraphrase 매칭 개선",
  },
  {
    testId: "mh-03", category: "must_have_paraphrase_miss",
    jd: `재무 회계 담당\n자격 요건\n- SAP/Oracle ERP 사용 경험 필수\n- 결산 업무 경험 3년 이상`,
    resume: `경리/회계 담당 (3년)\n- 월별 장부 마감 및 재무제표 작성\n- 부가세 및 법인세 신고 보조\n- 회계 프로그램(더존) 활용`,
    expect: "A_must_have_missing 발화 (SAP/Oracle paraphrase miss)",
  },
  {
    testId: "mh-04", category: "must_have_paraphrase_miss",
    jd: `전략기획 시니어\n자격 요건\n- 전략 수립 주도 경험 필수\n- KPI 체계 설계 경험\n- 성과 관리 체계 구축 경험`,
    resume: `전략기획 담당 (4년)\n- 사업 기획 수행 및 기획안 수립\n- 지표 체계 구성 및 지표 고도화\n- 성과 관리 체계 운영`,
    expect: "task matching 개선 — 지표체계/성과관리체계 synonym 매칭",
  },
  {
    testId: "mh-05", category: "must_have_paraphrase_miss",
    jd: `ML 엔지니어\n자격 요건\n- Python 필수\n- PyTorch 또는 TensorFlow 경험 필수`,
    resume: `AI 모델 개발 담당 (2년)\n- 딥러닝 프레임워크를 활용한 모델 학습\n- 데이터 전처리 및 피처 엔지니어링`,
    expect: "A_must_have_missing 발화 (PyTorch/TF paraphrase miss)",
  },

  // ── stability_or_shape_issue (회귀 2개) ──
  {
    testId: "si-01", category: "stability_or_shape_issue",
    jd: "전략기획 담당", resume: "전략기획 경험 3년",
    ai: { semanticMatches: null },
    expect: "정상 완료 (null semanticMatches)",
  },
  {
    testId: "si-02", category: "stability_or_shape_issue",
    jd: "마케팅 담당", resume: "마케팅 경험 2년",
    ai: { semanticMatches: { matchRate: "not-a-number" } },
    expect: "정상 완료 (invalid matchRate)",
  },

  // ── biz_subfamily_mismatch (5개) ──
  {
    testId: "bz-01", category: "biz_subfamily_mismatch",
    jd: `전략기획 포지션. 경영전략 수립 및 사업 전략 방향 설정을 담당합니다.`,
    resume: `사업기획 담당자. 중장기 계획 및 경영기획 업무를 수행합니다. 3년 경력.`,
    expect: "B3_biz_subfamily_mismatch 발화 (BIZ_STRATEGY vs BIZ_PLANNING), score≤44",
  },
  {
    testId: "bz-02", category: "biz_subfamily_mismatch",
    jd: `사업기획 담당자 모집. 중장기 계획 수립 및 경영기획 업무를 수행합니다.`,
    resume: `전략기획 팀원. 전략 수립 및 사업 전략 방향 담당. 2년 경력.`,
    expect: "B3_biz_subfamily_mismatch 발화 (BIZ_PLANNING vs BIZ_STRATEGY), score≤44",
  },
  {
    testId: "bz-03", category: "biz_subfamily_mismatch",
    jd: `전략기획 팀. 전략 수립 및 사업 전략 방향 담당.`,
    resume: `경영전략 담당자. 전략기획 경험 5년. 전략 방향 수립.`,
    expect: "B3 미발화 (BIZ_STRATEGY vs BIZ_STRATEGY 동일), score 유지",
  },
  {
    testId: "bz-04", category: "biz_subfamily_mismatch",
    jd: `전략기획 포지션. 경영전략 수립 및 사업 전략 담당.`,
    resume: `사업 컨설턴트. 컨설팅 업무 담당. 다양한 고객사 지원 경력.`,
    expect: "B3 미발화 (resume bizSubFamily=UNKNOWN), score 유지",
  },
  {
    testId: "bz-05", category: "biz_subfamily_mismatch",
    jd: `전략기획 리드. 경영전략 수립 10년+. 시니어 전략기획 포지션.`,
    resume: `사업기획 주니어. 경영기획 경험 2년.`,
    careerSignals: { experienceGap: -6, experienceLevelScore: 0.1 },
    keywordSignals: { matchScore: 0.3 },
    expect: "B3 발화 + E 발화 (B3가 E 차단 안 함), score=44",
  },
];

// ─────────────────────────────────────────────
// 실행 및 수집
// ─────────────────────────────────────────────
const results = [];

for (const c of CASES) {
  let r, err;
  try {
    const state = { jd: c.jd, resume: c.resume };
    if (c.careerSignals) state.careerSignals = c.careerSignals;
    if (c.keywordSignals) state.keywordSignals = c.keywordSignals;
    r = analyze(state, c.ai ?? null);
  } catch (e) {
    err = e.message;
  }

  const finalObj   = r?.hireability?.final ?? {};
  const score      = finalObj.hireabilityScore ?? null;
  const capsArr    = Array.isArray(finalObj.capsApplied) ? finalObj.capsApplied : [];
  const capVal     = finalObj.capValue ?? null;
  const ruleNames  = capsArr.map(x => x.rule);

  // 새 규칙 발화 여부
  const c2Fired    = ruleNames.includes("C2_domain_text_mismatch");
  const b2Fired    = ruleNames.includes("B2_marketing_subfamily_mismatch");
  const b3Fired    = ruleNames.includes("B3_biz_subfamily_mismatch");
  const anyNewFired = c2Fired || b2Fired || b3Fired;

  // 디버그 메타 (applyHireabilityFitCaps 반환값에서)
  const dtJdFam    = finalObj.__domainTextJd?.family ?? "N/A";
  const dtResFam   = finalObj.__domainTextResume?.family ?? "N/A";
  const dtMismatch = finalObj.__domainTextMismatch ?? false;
  const mktJd      = finalObj.__jdMarketingSubFamily ?? "N/A";
  const mktRes     = finalObj.__resumeMarketingSubFamily ?? "N/A";
  const mktMismatch = finalObj.__marketingSubFamilyMismatch ?? false;

  // 새 규칙이 binding cap인지 판단 (C2/B2/B3 cap=44, Round 11/12 fix)
  const newRuleCap = 44;
  const newRuleBinding = anyNewFired && capVal === newRuleCap && score === newRuleCap;
  // 새 규칙이 dominate된 경우: 더 강한 다른 cap 있음
  const otherCaps  = capsArr.filter(x =>
    x.rule !== "C2_domain_text_mismatch" &&
    x.rule !== "B2_marketing_subfamily_mismatch" &&
    x.rule !== "B3_biz_subfamily_mismatch"
  );
  const otherMin   = otherCaps.length > 0 ? Math.min(...otherCaps.map(x => x.cap)) : Infinity;
  const newRuleDominated = anyNewFired && otherMin < newRuleCap;
  const newRuleFiredButIneffective = anyNewFired && !newRuleBinding && !newRuleDominated;

  // E 상태 3단계 분리: E_ELIGIBLE / E_FIRED / E_BLOCKED
  // E_ELIGIBLE: expGap<-4 && expLevel<0.2 && matchScore<0.5 (E 조건 충족 여부)
  // E_FIRED   : capsApplied에 E 존재
  // E_BLOCKED : E_ELIGIBLE && !E_FIRED (실제 orchestration 문제)
  const eFired     = ruleNames.includes("E_same_family_seniority");
  const _eExpGap   = r?.careerSignals?.experienceGap ?? null;
  const _eExpLevel = r?.careerSignals?.experienceLevelScore ?? null;
  const _eMatchSc  = r?.keywordSignals?.matchScore ?? null;
  const eEligible  = typeof _eExpGap === "number" && _eExpGap < -4 &&
                     typeof _eExpLevel === "number" && _eExpLevel < 0.2 &&
                     typeof _eMatchSc === "number" && _eMatchSc < 0.5;
  const eBlocked   = eEligible && !eFired;

  // before score 추론: 새 규칙 제거 시 가상 점수
  // otherMin이 유한하면 그게 before capVal, 없으면 base 그대로
  const beforeCapVal = otherCaps.length > 0 ? otherMin : null;

  // baseline (Round 7)
  const baseline   = BASELINE[c.testId] ?? "?";

  const simVM      = r?.simulationViewModel ?? r?.reportPack?.simulationViewModel ?? null;
  const matchPct   = r?.keywordSignals?.matchScore != null
    ? Math.round(r.keywordSignals.matchScore * 100) + "%" : "?";

  results.push({
    testId: c.testId, category: c.category,
    baseline, score: score ?? (err ? "ERR" : "null"),
    caps: ruleNames.join(" + ") || "none", capVal: capVal ?? "none",
    c2Fired, b2Fired, b3Fired,
    dtJdFam, dtResFam, dtMismatch,
    mktJd, mktRes, mktMismatch,
    newRuleBinding, newRuleDominated, newRuleFiredButIneffective,
    beforeCapVal, otherCaps: otherCaps.map(x => `${x.rule}(${x.cap})`).join("+") || "none",
    eFired, eEligible, eBlocked,
    matchPct, simVM: simVM ? "✓" : "✗",
    uncaught: err ?? null,
    expect: c.expect,
  });
}

// ─────────────────────────────────────────────
// 출력
// ─────────────────────────────────────────────
console.log("\n" + "═".repeat(110));
console.log("  PASSMAP Ontology Patch 검증 결과");
console.log("═".repeat(110));

const CATS = [
  "seniority_gap", "domain_mismatch_text_only",
  "role_confusion", "must_have_paraphrase_miss", "stability_or_shape_issue",
  "biz_subfamily_mismatch",
];

for (const cat of CATS) {
  const rows = results.filter(r => r.category === cat);
  if (!rows.length) continue;
  console.log(`\n▶ ${cat.toUpperCase()} (${rows.length}건)`);
  console.log("─".repeat(110));

  for (const r of rows) {
    const delta = typeof r.baseline === "number" && typeof r.score === "number"
      ? (r.score - r.baseline) : "?";
    const deltaStr = delta === "?" ? "?" : (delta === 0 ? "±0" : (delta > 0 ? `+${delta}` : `${delta}`));
    const newRuleStr = [
      r.c2Fired ? "C2✓" : "",
      r.b2Fired ? "B2✓" : "",
      r.b3Fired ? "B3✓" : "",
    ].filter(Boolean).join("+") || "-";

    console.log(`[${r.testId}]  before=${String(r.baseline).padEnd(4)}  after=${String(r.score).padEnd(4)}  delta=${deltaStr.padEnd(4)}  cap=${String(r.capVal).padEnd(5)}  newRule=${newRuleStr.padEnd(8)}  match=${r.matchPct}`);

    if (r.c2Fired || r.b2Fired || r.b3Fired) {
      const status = r.newRuleBinding ? "★ BINDING (효과있음)"
        : r.newRuleDominated ? "○ DOMINATED (더 강한 cap에 가려짐)"
        : r.newRuleFiredButIneffective ? "△ 발화하나 base≤cap (무효)"
        : "?";
      console.log(`         새 규칙 상태 : ${status}`);
      if (r.c2Fired) console.log(`         C2 domain   : JD=${r.dtJdFam}  resume=${r.dtResFam}  mismatch=${r.dtMismatch}`);
      if (r.b2Fired) console.log(`         B2 mkt sub  : JD=${r.mktJd}  resume=${r.mktRes}  mismatch=${r.mktMismatch}`);
      if (r.b3Fired) console.log(`         B3 biz sub  : (BIZ_SUBFAMILY_MISMATCH 감지)`);
      if (r.newRuleDominated) console.log(`         기존 강한 cap: ${r.otherCaps}`);
    }
    if (r.dtJdFam !== "N/A" && !r.c2Fired) {
      console.log(`         domain text : JD=${r.dtJdFam}  resume=${r.dtResFam}  (C2 미발화)`);
    }
    if (r.mktJd !== "N/A" && r.mktJd !== "UNKNOWN" && !r.b2Fired) {
      console.log(`         mkt sub     : JD=${r.mktJd}  resume=${r.mktRes}  (B2 미발화)`);
    }
    console.log(`         allCaps : ${r.caps}`);
    console.log(`         expect  : ${r.expect}`);
    if (r.uncaught) console.log(`         ⚠ UNCAUGHT: ${r.uncaught}`);
    console.log();
  }
}

// ─────────────────────────────────────────────
// 군집별 집계
// ─────────────────────────────────────────────
console.log("═".repeat(110));
console.log("  군집별 집계 요약");
console.log("═".repeat(110));

for (const cat of CATS) {
  const rows = results.filter(r => r.category === cat);
  if (!rows.length) continue;

  const scored = rows.filter(r => typeof r.score === "number");
  const avgAfter = scored.reduce((s, r) => s + r.score, 0) / (scored.length || 1);

  const baseScored = rows.filter(r => typeof r.baseline === "number" && typeof r.score === "number");
  const avgBefore = baseScored.reduce((s, r) => s + r.baseline, 0) / (baseScored.length || 1);
  const avgDelta = baseScored.reduce((s, r) => s + (r.score - r.baseline), 0) / (baseScored.length || 1);

  const c2Count  = rows.filter(r => r.c2Fired).length;
  const b2Count  = rows.filter(r => r.b2Fired).length;
  const b3Count  = rows.filter(r => r.b3Fired).length;
  const bindingCount = rows.filter(r => r.newRuleBinding).length;
  const dominatedCount = rows.filter(r => r.newRuleDominated).length;

  console.log(`\n[${cat}]`);
  console.log(`  평균 score (before→after): ${avgBefore.toFixed(1)} → ${avgAfter.toFixed(1)}  (avg delta: ${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(1)})`);
  console.log(`  C2 발화: ${c2Count}/${rows.length}  B2 발화: ${b2Count}/${rows.length}  B3 발화: ${b3Count}/${rows.length}`);
  console.log(`  새 규칙 binding (실효): ${bindingCount}건  dominated (무효): ${dominatedCount}건`);
  console.log(`  uncaught: ${rows.filter(r => r.uncaught).length}건  simVM 안정: ${rows.filter(r => r.simVM === "✓").length}/${rows.length}건`);
}

// ─────────────────────────────────────────────
// 5가지 질문 판정
// ─────────────────────────────────────────────
console.log("\n" + "═".repeat(110));
console.log("  강산.md 판정 질문 5가지");
console.log("═".repeat(110));

const dmRows = results.filter(r => r.category === "domain_mismatch_text_only");
const rcRows = results.filter(r => r.category === "role_confusion");
const mhRows = results.filter(r => r.category === "must_have_paraphrase_miss");
const sgRows = results.filter(r => r.category === "seniority_gap");

const c2Binding = dmRows.filter(r => r.newRuleBinding).length;
const b2Binding = rcRows.filter(r => r.newRuleBinding).length;

console.log(`\n[Q1] C2 cap 46이 실제로 점수를 낮췄는가?`);
const c2BindingRows = dmRows.filter(r => r.newRuleBinding);
if (c2BindingRows.length > 0) {
  console.log(`  → YES: ${c2BindingRows.map(r => `${r.testId}(${r.baseline}→${r.score})`).join(", ")} — score 낮춤`);
} else {
  const c2FiredRows = dmRows.filter(r => r.c2Fired);
  if (c2FiredRows.length > 0) {
    console.log(`  → PARTIAL: C2 발화했으나 모두 dominated 또는 무효 — ${c2FiredRows.map(r => `${r.testId}(cap=${r.capVal},status=${r.newRuleDominated?"dominated":"ineffective"})`).join(", ")}`);
  } else {
    console.log(`  → NO: domain_mismatch_text_only 군집에서 C2 미발화`);
  }
}

console.log(`\n[Q2] B2 cap 46이 실제로 점수를 낮췄는가?`);
const b2BindingRows = rcRows.filter(r => r.newRuleBinding);
const b2FiredRows = rcRows.filter(r => r.b2Fired);
if (b2BindingRows.length > 0) {
  console.log(`  → YES: ${b2BindingRows.map(r => `${r.testId}(${r.baseline}→${r.score})`).join(", ")} — score 낮춤`);
} else if (b2FiredRows.length > 0) {
  console.log(`  → PARTIAL: B2 발화했으나 dominated 또는 무효 — ${b2FiredRows.map(r => `${r.testId}(cap=${r.capVal})`).join(", ")}`);
} else {
  console.log(`  → NO: role_confusion 군집에서 B2 미발화`);
}

console.log(`\n[Q3] 45점 고착 케이스에서 새 규칙이 "발화만 하고 무효" 상태인가?`);
const stuck45 = results.filter(r => r.baseline === 45);
if (stuck45.length > 0) {
  for (const r of stuck45) {
    const newFired = r.c2Fired || r.b2Fired;
    const effective = r.newRuleBinding;
    console.log(`  ${r.testId}: baseline=45, after=${r.score}, newFired=${newFired}, binding=${effective}`);
    if (newFired && !effective) {
      console.log(`    → 발화만 하고 무효 (base<=46 이미 낮음 OR 더 강한 cap에 가려짐)`);
    } else if (newFired && effective) {
      console.log(`    → 발화 및 효과 있음 (${r.baseline} → ${r.score})`);
    } else {
      console.log(`    → 새 규칙 미발화 (변동 없음)`);
    }
  }
} else {
  console.log(`  → baseline=45인 케이스 없음`);
}

console.log(`\n[Q4] 새 규칙이 발화했는데 E(same-family seniority)를 차단하는 부작용은 없는가?`);
console.log(`  판정 기준: E_ELIGIBLE(expGap<-4 && expLevel<0.2 && matchScore<0.5) && !E_FIRED → E_BLOCKED`);
const eBlockedCases = results.filter(r => r.eBlocked);
if (eBlockedCases.length > 0) {
  for (const r of eBlockedCases) {
    console.warn(`  [WARN] E_BLOCKED: ${r.testId} — E_ELIGIBLE=true, E_FIRED=false. caps=[${r.caps}]`);
  }
} else {
  console.log(`  → 부작용 없음 — E_BLOCKED 케이스 없음 (E_ELIGIBLE && !E_FIRED 조건 미충족)`);
}

console.log(`\n[Q5] must_have_paraphrase 확장이 weakOnly/strong 분포를 어떻게 바꿨는가?`);
for (const r of mhRows) {
  const delta = typeof r.baseline === "number" && typeof r.score === "number" ? r.score - r.baseline : "?";
  console.log(`  ${r.testId}: ${r.baseline} → ${r.score} (delta=${delta === "?" ? "?" : (delta >= 0 ? "+" + delta : delta)})  caps=[${r.caps}]`);
}
const mhAvgBefore = mhRows.filter(r => typeof r.baseline === "number").reduce((s,r) => s + r.baseline, 0) / mhRows.length;
const mhAvgAfter  = mhRows.filter(r => typeof r.score === "number").reduce((s,r) => s + r.score, 0) / mhRows.length;
console.log(`  avg: ${mhAvgBefore.toFixed(1)} → ${mhAvgAfter.toFixed(1)}`);
console.log(`  (task synonym 확장은 cap에 직접 영향 없음 — decision calibration 경로만 영향. 점수 변동은 misc 요인 포함)`);

// ─────────────────────────────────────────────
// 회귀 체크
// ─────────────────────────────────────────────
console.log("\n" + "═".repeat(110));
console.log("  회귀 체크");
console.log("═".repeat(110));
const sgFail = sgRows.filter(r => typeof r.score === "number" && r.score > 44);
const siFail = results.filter(r => r.category === "stability_or_shape_issue" && r.uncaught);
console.log(`  seniority_gap  E규칙 유지: ${sgRows.length - sgFail.length}/${sgRows.length}  (score>44 오발화: ${sgFail.length}건)`);
if (sgFail.length > 0) console.log(`    오발화: ${sgFail.map(r => `${r.testId}(score=${r.score})`).join(", ")}`);
console.log(`  stability      uncaught:  ${siFail.length}건`);
console.log("═".repeat(110) + "\n");
