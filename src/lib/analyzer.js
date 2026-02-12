// src/lib/analyzer.js

// ------------------------------
// small utils
// ------------------------------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeLower(s) {
  return (s || "").toString().toLowerCase();
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

function containsKeyword(text, kw) {
  const t = safeLower(text);
  const k = safeLower(kw).trim();
  if (!k) return false;
  // 단순 포함 검사 (요구사항)
  return t.includes(k);
}

function normalizeScore01(x) {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, 0, 1);
}

function scoreToLabel(n) {
  if (n <= 2) return "낮음";
  if (n === 3) return "보통";
  return "높음";
}

// ------------------------------
// Keyword dictionary (simple)
// - “단순 구현” 요구사항 충족용
// - 필요하면 업종별로 확장
// ------------------------------
const SKILL_KEYWORDS = [
  // dev / data
  "javascript",
  "typescript",
  "react",
  "vite",
  "node",
  "next.js",
  "python",
  "java",
  "sql",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "ci/cd",
  "git",
  "rest",
  "graphql",
  "spark",
  "airflow",
  "ml",
  "llm",

  // biz / ops
  "excel",
  "power bi",
  "tableau",
  "sap",
  "erp",
  "purchasing",
  "procurement",
  "sourcing",
  "negotiation",
  "cost",
  "supply chain",
  "scm",
  "kpi",
  "okr",
  "project",
  "stakeholder",
  "communication",

  // general signals
  "portfolio",
  "case study",
  "metrics",
  "growth",
  "conversion",
  "retention",
  "roi",
  "a/b",
];

// JD에서 등장한 키워드만 뽑고, Resume에 있는지 검사
export function buildKeywordSignals(jd, resume) {
  const jdText = safeLower(jd);
  const resumeText = safeLower(resume);

  const jdKeywords = uniq(
    SKILL_KEYWORDS.filter((kw) => jdText.includes(safeLower(kw)))
  );

  // JD에 키워드가 거의 없으면(= 붙여넣기가 부족) 스코어 의미가 약해짐
  if (jdKeywords.length === 0) {
    return {
      matchScore: 0.35, // “unknown”에 가까운 기본값
      matchedKeywords: [],
      missingKeywords: [],
      jdKeywords: [],
      note: "JD에서 사전 키워드를 거의 찾지 못했습니다. JD 핵심 문장을 더 붙여 넣으면 정확도가 올라갑니다.",
    };
  }

  const matched = jdKeywords.filter((kw) => resumeText.includes(safeLower(kw)));
  const missing = jdKeywords.filter((kw) => !resumeText.includes(safeLower(kw)));

  const matchScore = normalizeScore01(matched.length / jdKeywords.length);

  return {
    matchScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    jdKeywords,
    note: null,
  };
}

// ------------------------------
// Career / resume signals (objective)
// ------------------------------
function parseRequiredYearsFromJD(jd) {
  // 매우 단순: “n년” 패턴 1개만 잡기
  const m = (jd || "").match(/(\d+)\s*년/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function countNumericProofSignals(text) {
  // 성과 수치/정량 근거의 매우 단순 프록시
  // 예: 12%, 3배, 1,200, 10억, 20만, 3개월, KPI 등
  const t = (text || "").toString();
  const patterns = [
    /\d{1,3}(,\d{3})+/g,      // 1,200
    /\d+(\.\d+)?\s*%/g,       // 12%
    /\d+(\.\d+)?\s*(배|x)/gi, // 3배, 2x
    /\d+\s*(억|만|천)\b/g,    // 10억, 20만
    /\d+\s*(개월|주|일)\b/g,  // 3개월
  ];

  let count = 0;
  for (const re of patterns) {
    const hits = t.match(re);
    if (hits) count += hits.length;
  }
  return count;
}

export function buildCareerSignals(career, jd) {
  const requiredYears = parseRequiredYearsFromJD(jd);
  const totalYears = Number(career?.totalYears ?? 0);
  const gapMonths = Number(career?.gapMonths ?? 0);
  const jobChanges = Number(career?.jobChanges ?? 0);
  const lastTenureMonths = Number(career?.lastTenureMonths ?? 0);

  // careerRiskScore (0~1): 공백/짧은근속/잦은이직 기반
  // - 현실적으로 “리스크”는 신호들의 합성치로만 취급
  let risk = 0;
  if (gapMonths >= 6) risk += 0.35;
  else if (gapMonths >= 3) risk += 0.2;

  if (lastTenureMonths > 0 && lastTenureMonths <= 6) risk += 0.3;
  else if (lastTenureMonths <= 12) risk += 0.18;

  if (jobChanges >= 5) risk += 0.25;
  else if (jobChanges >= 3) risk += 0.15;

  const careerRiskScore = normalizeScore01(risk);

  // experienceLevelScore (0~1): JD 요구 연차 대비 적합도
  // - 요구 연차를 못 읽으면 unknown으로 0.6
  let experienceLevelScore = 0.6;
  let experienceGap = null;

  if (requiredYears !== null) {
    experienceGap = totalYears - requiredYears; // 음수면 부족, 양수면 과잉
    // 부족하면 급격히 하락
    if (experienceGap < 0) {
      // -1년: 0.45, -3년: 0.25 정도로
      experienceLevelScore = normalizeScore01(0.55 + (experienceGap * 0.1));
    } else {
      // 과잉이면 천천히 하락 (오버퀄)
      // +2년: 0.58, +6년: 0.5, +10년: 0.42 정도
      experienceLevelScore = normalizeScore01(0.62 - Math.min(experienceGap, 12) * 0.02);
    }
  }

  return {
    requiredYears,
    experienceGap,
    careerRiskScore,
    experienceLevelScore,
  };
}

function buildResumeSignals(resume, portfolio) {
  const proofCount = countNumericProofSignals(resume) + countNumericProofSignals(portfolio);
  // 0개: 0.35, 1~2개: 0.5, 3~5개: 0.7, 6개+: 0.85
  let resumeSignalScore = 0.35;
  if (proofCount >= 6) resumeSignalScore = 0.85;
  else if (proofCount >= 3) resumeSignalScore = 0.7;
  else if (proofCount >= 1) resumeSignalScore = 0.5;

  return { proofCount, resumeSignalScore };
}

// ------------------------------
// objectiveScore composition
// ------------------------------
function buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals }) {
  const keywordMatchScore = keywordSignals.matchScore; // 0~1
  const careerRiskScore = careerSignals.careerRiskScore; // 0~1 (risk)
  const resumeSignalScore = resumeSignals.resumeSignalScore; // 0~1
  const experienceLevelScore = careerSignals.experienceLevelScore; // 0~1

  // risk는 “낮을수록 좋음”이므로 뒤집어서 넣기
  const invertedCareerRisk = 1 - careerRiskScore;

  // 가중치는 현실적으로 너무 복잡하게 하지 않고, 효과가 큰 것 위주로
  const objectiveScore =
    0.35 * keywordMatchScore +
    0.2 * invertedCareerRisk +
    0.25 * resumeSignalScore +
    0.2 * experienceLevelScore;

  return {
    objectiveScore: normalizeScore01(objectiveScore),
    parts: {
      keywordMatchScore,
      careerRiskScore,
      resumeSignalScore,
      experienceLevelScore,
    },
  };
}

// ------------------------------
// correlation + conflict
// ------------------------------
const correlationMatrix = {
  // 예시 요구 반영
  "fit-mismatch": {
    down: [{ id: "unclear-positioning", factor: 0.85 }], // fit-mismatch↑ -> unclear-positioning confidence↓
  },
  "gap-risk": {
    up: [{ id: "risk-signals", factor: 1.15 }], // gap-risk↑ -> risk-signals confidence↑
  },
};

function applyCorrelationBoost(hypotheses, scoresById) {
  // scoresById: { id: priorityLikeScore } (0~1)
  const next = hypotheses.map((h) => ({ ...h, correlationBoost: 1 }));

  const index = new Map(next.map((h, i) => [h.id, i]));

  for (const [srcId, rules] of Object.entries(correlationMatrix)) {
    const srcScore = scoresById[srcId] ?? 0;
    // srcScore가 “충분히 높을 때”만 영향
    const active = srcScore >= 0.55;

    if (!active) continue;

    if (rules.up) {
      for (const r of rules.up) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        // srcScore에 비례해 조금만 올림
        const bump = 1 + (srcScore - 0.55) * (r.factor - 1) / 0.45;
        next[j].correlationBoost *= bump;
      }
    }

    if (rules.down) {
      for (const r of rules.down) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        const damp = 1 - (srcScore - 0.55) * (1 - r.factor) / 0.45;
        next[j].correlationBoost *= damp;
      }
    }
  }

  // clamp
  for (const h of next) {
    h.correlationBoost = normalizeScore01(h.correlationBoost);
    // correlationBoost는 0~1로 너무 줄어들 수 있으니 최소 0.75 바닥 적용 (과도한 kill 방지)
    h.correlationBoost = clamp(h.correlationBoost, 0.75, 1.25);
  }

  return next;
}

function calcConflictPenalty({ keywordSignals, careerSignals, selfCheck }) {
  // 충돌/과신 패턴을 “아주 약하게” 페널티
  // 예: coreFit(자가진단)은 높지만 keywordMatch가 낮으면 과신 가능성
  let penalty = 1;

  const coreFitHigh = (selfCheck?.coreFit ?? 3) >= 4;
  const keywordLow = keywordSignals.matchScore <= 0.35;

  if (coreFitHigh && keywordLow) penalty *= 0.85;

  // riskSignals 낮게 체크했는데 careerRiskScore가 높으면(현실 리스크) 페널티
  const riskSelfLow = (selfCheck?.riskSignals ?? 3) <= 2;
  const careerRiskHigh = careerSignals.careerRiskScore >= 0.65;
  if (riskSelfLow && careerRiskHigh) penalty *= 0.88;

  return clamp(penalty, 0.75, 1);
}

// selfCheck는 confidence modifier 정도로만 사용
function confidenceFromSelfCheck(hId, selfCheck) {
  const sc = selfCheck || {};
  const coreFit = sc.coreFit ?? 3;
  const proof = sc.proofStrength ?? 3;
  const clarity = sc.roleClarity ?? 3;
  const story = sc.storyConsistency ?? 3;
  const risk = sc.riskSignals ?? 3;

  // 0.85 ~ 1.15 사이 아주 약하게
  const mild = (x) => clamp(0.85 + (x - 1) * 0.075, 0.85, 1.15);

  switch (hId) {
    case "fit-mismatch":
      return mild(6 - coreFit);
    case "weak-proof":
    case "weak-interview-proof":
      return mild(6 - proof);
    case "unclear-positioning":
      return (mild(6 - clarity) + mild(6 - story)) / 2;
    case "risk-signals":
      return mild(risk);
    default:
      return 1;
  }
}

// ------------------------------
// Hypothesis factory
// ------------------------------
function makeHypothesis(base) {
  return {
    id: base.id,
    title: base.title,
    why: base.why,
    signals: base.signals || [],
    actions: base.actions || [],
    counter: base.counter || "",
    impact: clamp(base.impact ?? 0.7, 0, 1),
    confidence: clamp(base.confidence ?? 0.5, 0, 1),
    evidenceBoost: clamp(base.evidenceBoost ?? 0, 0, 0.25),
  };
}

// ------------------------------
// MAIN: buildHypotheses
// - priority = impact * confidence * objectiveScore * correlationBoost * conflictPenalty
// ------------------------------
export function buildHypotheses(state) {
  const stage = (state?.stage || "서류").toString();

  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "");
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const { objectiveScore, parts } = buildObjectiveScore({
    keywordSignals,
    careerSignals,
    resumeSignals,
  });

  const conflictPenalty = calcConflictPenalty({
    keywordSignals,
    careerSignals,
    selfCheck: state?.selfCheck,
  });

  // ------------------------------
  // hypothesis candidates
  // ------------------------------
  const hyps = [];

  // 1) fit-mismatch (객관: keywordMatch가 낮을수록 confidence↑)
  if (stage.includes("서류")) {
    const kwLow = keywordSignals.matchScore <= 0.45;

    hyps.push(
      makeHypothesis({
        id: "fit-mismatch",
        title: "JD 대비 핵심 요건 핏 부족",
        why:
          "서류 단계에선 JD 필수요건(툴/경력/도메인/역할)을 먼저 확인합니다. 이력서 문장에 JD 언어가 충분히 매칭되지 않으면 ‘읽히기 전에’ 탈락할 확률이 올라갑니다.",
        signals: [
          `키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100`,
          keywordSignals.missingKeywords?.length
            ? `누락 키워드 예: ${keywordSignals.missingKeywords.slice(0, 5).join(", ")}`
            : null,
        ].filter(Boolean),
        impact: 0.9,
        confidence: kwLow ? 0.72 : 0.52,
        evidenceBoost: kwLow ? 0.08 : 0.0,
        actions: [
          "JD ‘필수/우대’ 문장을 그대로 체크리스트로 만들고, 이력서 문장에 1:1로 대응되게 재작성",
          "누락 키워드 중 상위 5개를 헤더/요약/핵심 프로젝트에 분산 배치(동의어 말고 JD 표현을 우선)",
          "경력 전환이면 ‘전이 가능한 능력’을 JD 업무 문장 단위로 번역해 넣기",
        ],
        counter:
          "JD가 매우 포괄적이거나(키워드가 과다), 채용팀이 포텐셜 위주로 보는 경우엔 키워드 매칭만으로 결론을 내리기 어렵습니다.",
      })
    );

    // 2) weak-proof (객관: resumeSignalScore 낮으면 confidence↑)
    const proofLow = resumeSignals.resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-proof",
        title: "성과 증거(수치/전후/기여도) 부족",
        why:
          "‘무엇을 했다’보다 ‘어떤 문제를 어떻게 풀었고 결과가 무엇인지’가 서류 신뢰를 만듭니다. 정량 근거가 부족하면 검증 비용이 커져 보수적으로 컷될 수 있습니다.",
        signals: [
          `정량 근거 프록시(숫자/단위 패턴): ${resumeSignals.proofCount}개`,
          `증거 강도(프록시): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100`,
        ],
        impact: 0.85,
        confidence: proofLow ? 0.68 : 0.52,
        evidenceBoost: proofLow ? 0.08 : 0.0,
        actions: [
          "각 경험을 ‘문제-제약-내 행동-결과-검증’ 구조로 재작성",
          "수치가 없으면 대리지표(리드타임/불량률/원가/전환율/처리량 등)로 환산 + 산출근거를 함께 표기",
          "포트폴리오는 ‘링크 나열’이 아니라 ‘무엇을 증명하는지(역할/성과/검증)’를 한 줄로 붙이기",
        ],
        counter:
          "신입/초경력 포지션이거나, 회사가 포텐셜/문화적합을 크게 보는 경우 영향은 일부 완화됩니다.",
      })
    );

    // 3) unclear-positioning (객관: keywordMatch 낮거나 story/clarity 낮으면)
    const unclearObj = keywordSignals.matchScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "unclear-positioning",
        title: "포지셔닝/이직 스토리의 일관성 부족",
        why:
          "지원자가 ‘왜 이 직무/회사인지’가 흐리면 채용팀은 리스크(조기 퇴사/적응 실패)로 해석합니다. 특히 JD 언어와 나의 강점이 연결되지 않으면 설득력이 급격히 떨어집니다.",
        signals: [
          unclearObj ? "JD 언어 ↔ 이력서 언어 연결이 약함" : null,
          `자가진단(역할 명확성): ${(state?.selfCheck?.roleClarity ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.roleClarity ?? 3)}`,
          `자가진단(스토리 일관성): ${(state?.selfCheck?.storyConsistency ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.storyConsistency ?? 3)}`,
        ].filter(Boolean),
        impact: 0.75,
        confidence: unclearObj ? 0.62 : 0.52,
        evidenceBoost: unclearObj ? 0.06 : 0.0,
        actions: [
          "헤더 2줄 고정: (직무 정체성) + (강점 1~2개) + (증거 1개)",
          "이직사유는 ‘불만’이 아니라 ‘확장/정렬’로 말하고, JD 핵심 업무 문장에 직접 연결",
          "면접 대비: ‘탈락 논리(의심)’ 10개를 먼저 만들고 반례/근거를 준비",
        ],
        counter:
          "회사 자체가 다양한 배경 전환을 적극적으로 뽑는 곳이면 이 가설의 비중은 낮아질 수 있습니다.",
      })
    );
  }

  // 면접 단계 공통: risk-signals, weak-interview-proof
  if (stage.includes("면접")) {
    const riskHighObj = careerSignals.careerRiskScore >= 0.65;

    hyps.push(
      makeHypothesis({
        id: "risk-signals",
        title: "리스크 신호(커뮤니케이션/정합성/신뢰) 감지",
        why:
          "면접은 역량뿐 아니라 ‘같이 일해도 되는가’를 검증합니다. 답변의 일관성, 과장 여부, 사실 검증 가능성에서 신뢰가 흔들리면 탈락으로 이어질 수 있습니다.",
        signals: [
          `커리어 리스크(프록시): ${Math.round(careerSignals.careerRiskScore * 100)}/100`,
          `자가진단(리스크 신호): ${(state?.selfCheck?.riskSignals ?? 3)}/5 · ${scoreToLabel(state?.selfCheck?.riskSignals ?? 3)}`,
        ],
        impact: 0.9,
        confidence: riskHighObj ? 0.72 : 0.58,
        evidenceBoost: riskHighObj ? 0.08 : 0.0,
        actions: [
          "답변을 ‘전제→판단기준→행동→결과→학습’으로 고정(말 흔들림 최소화)",
          "모르는 건 모른다고 말하고, 확인 방법/다음 액션을 제시(과장 금지)",
          "면접관의 검증 질문 대비: 숫자/문서/결과물(가능 범위)을 미리 준비",
        ],
        counter:
          "같은 답변도 면접관/팀 문화에 따라 평가가 달라질 수 있어, 단일 신호로 확정할 수는 없습니다.",
      })
    );

    const proofLow = buildResumeSignals(state?.resume || "", state?.portfolio || "").resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-interview-proof",
        title: "면접에서 증거 제시가 약함(구체성 부족)",
        why:
          "면접은 서류의 주장(성과/역할)을 검증하는 자리입니다. 역할 범위와 숫자, 검증 가능성을 명확히 못 하면 신뢰가 낮아집니다.",
        signals: [
          `정량 근거 프록시: ${buildResumeSignals(state?.resume || "", state?.portfolio || "").proofCount}개`,
        ],
        impact: 0.8,
        confidence: proofLow ? 0.64 : 0.52,
        evidenceBoost: proofLow ? 0.06 : 0.0,
        actions: [
          "핵심 사례 3개를 ‘30초 요약’과 ‘2분 딥다이브’ 두 버전으로 준비",
          "내 기여도(내가 한 일/팀이 한 일)를 선명하게 분리해서 말하기",
          "보안 이슈가 있으면 ‘범위/비교/대리지표’로 설득 구조를 만들기",
        ],
        counter:
          "보안/규정으로 수치 공개가 어려워도, 전후 비교/범위/검증 방법을 제시하면 충분히 설득 가능합니다.",
      })
    );
  }

  // ------------------------------
  // NEW: career 기반 가설 (요구사항 2)
  // ------------------------------
  const c = state?.career || {};
  const totalYears = Number(c.totalYears ?? 0);
  const gapMonths = Number(c.gapMonths ?? 0);
  const jobChanges = Number(c.jobChanges ?? 0);
  const lastTenureMonths = Number(c.lastTenureMonths ?? 0);

  // gap-risk
  if (gapMonths >= 3) {
    const conf = gapMonths >= 12 ? 0.78 : gapMonths >= 6 ? 0.7 : 0.6;
    hyps.push(
      makeHypothesis({
        id: "gap-risk",
        title: "공백기 리스크(설명/정합성 부족)",
        why:
          "공백이 길수록 채용팀은 ‘업무 감 유지 여부’와 ‘공백 사유의 납득 가능성’을 확인하려고 합니다. 공백 자체가 문제라기보다, 설명 구조가 빈약하면 리스크로 해석됩니다.",
        signals: [`최근 공백: ${gapMonths}개월`],
        impact: 0.75,
        confidence: conf,
        evidenceBoost: gapMonths >= 6 ? 0.08 : 0.04,
        actions: [
          "공백을 ‘사실→의도→행동→결과(증거)’ 4문장으로 고정(감정/사정 설명 과다 금지)",
          "공백 기간에 한 ‘학습/프로젝트/루틴’을 포트폴리오 또는 정량 근거로 연결",
          "면접 대비: 공백 관련 검증 질문(왜/무엇을/지금은 해결됐나)을 먼저 만들고 반례 준비",
        ],
        counter:
          "공백 사유가 산업 특성상 흔하거나(프로젝트 단위), 설명과 증거가 명확하면 공백 자체는 치명적이지 않습니다.",
      })
    );
  }

  // short-tenure-risk
  if ((lastTenureMonths > 0 && lastTenureMonths <= 12) || jobChanges >= 3) {
    const tenureShort = lastTenureMonths > 0 && lastTenureMonths <= 6;
    const conf = tenureShort ? 0.76 : 0.62;

    hyps.push(
      makeHypothesis({
        id: "short-tenure-risk",
        title: "짧은 근속/잦은 이직으로 인한 신뢰 하락",
        why:
          "회사 입장에선 채용 비용이 크기 때문에 ‘이번에도 빨리 나갈까?’를 민감하게 봅니다. 횟수/기간 그 자체보다, 이동의 논리와 성과 축적이 보이지 않으면 리스크로 해석됩니다.",
        signals: [
          lastTenureMonths ? `직전 근속: ${lastTenureMonths}개월` : null,
          `이직 횟수: ${jobChanges}회`,
        ].filter(Boolean),
        impact: 0.8,
        confidence: conf,
        evidenceBoost: tenureShort ? 0.08 : 0.05,
        actions: [
          "이직 사유를 ‘회피’가 아니라 ‘정렬/확장’으로 재구성(일관된 기준 1개 고정)",
          "짧았던 자리에서도 ‘완료한 성과/남긴 결과물’ 중심으로 서술",
          "면접에서는 ‘이번엔 오래 다닐 수 있는 조건’(역할/성장/업무방식)을 구체화해 제시",
        ],
        counter:
          "업계 특성상 이동이 잦은 직군(프로젝트/컨설팅/에이전시 등)에서는 그 자체가 덜 치명적이며, 성과 축적이 명확하면 상쇄됩니다.",
      })
    );
  }

  // junior-saturation (경력 부족)
  // - JD 요구 연차 대비 부족할 때
  if (careerSignals.requiredYears !== null && careerSignals.experienceGap !== null && careerSignals.experienceGap <= -1) {
    const lack = Math.abs(careerSignals.experienceGap);
    const conf = lack >= 3 ? 0.78 : 0.66;

    hyps.push(
      makeHypothesis({
        id: "junior-saturation",
        title: "경력 연차 부족으로 경쟁력 낮음(경쟁 과열 구간)",
        why:
          "요구 연차 대비 부족하면 ‘학습 곡선 비용’을 회사가 부담해야 합니다. 특히 지원자가 몰리는 포지션일수록 ‘즉시 전력’이 선호되어 탈락 확률이 올라갑니다.",
        signals: [
          `JD 요구: ${careerSignals.requiredYears}년`,
          `현재: ${totalYears}년 (격차 ${careerSignals.experienceGap}년)`,
        ],
        impact: 0.78,
        confidence: conf,
        evidenceBoost: lack >= 3 ? 0.08 : 0.05,
        actions: [
          "요구 연차의 ‘핵심 능력’을 쪼개서(업무 3~5개) ‘이미 해본 것’ 중심으로 증거를 재배치",
          "부족한 영역은 ‘대체 증거(유사 문제/프로젝트/학습 결과물)’로 보완",
          "지원 전략: 요구 연차가 낮은 포지션/유사 직무로 파이프라인을 넓히기",
        ],
        counter:
          "회사/팀이 성장기에 있고 포텐셜 채용을 하는 경우엔 연차 부족을 성과/학습 속도로 상쇄할 수 있습니다.",
      })
    );
  }

  // overqualified-risk (경력 과잉)
  if (careerSignals.requiredYears !== null && careerSignals.experienceGap !== null && careerSignals.experienceGap >= 4) {
    const over = careerSignals.experienceGap;
    const conf = over >= 8 ? 0.72 : 0.6;

    hyps.push(
      makeHypothesis({
        id: "overqualified-risk",
        title: "경력 과잉(오버퀄)로 인한 핏/잔류 리스크",
        why:
          "요구 레벨 대비 경력이 과하면 회사는 ‘금방 지루해질까?’, ‘연봉/직급 불만이 생길까?’를 걱정합니다. 오버퀄 자체보다 ‘왜 이 레벨로 지원하는지’가 설득되지 않으면 컷될 수 있습니다.",
        signals: [
          `JD 요구: ${careerSignals.requiredYears}년`,
          `현재: ${totalYears}년 (과잉 +${careerSignals.experienceGap}년)`,
        ],
        impact: 0.7,
        confidence: conf,
        evidenceBoost: over >= 8 ? 0.06 : 0.04,
        actions: [
          "지원 이유를 ‘다운그레이드’가 아니라 ‘역할/도메인/업무방식 정렬’로 명확히 정의",
          "면접에서 ‘잔류 의사’와 ‘기대 역할 범위’를 구체적으로 합의하려는 태도를 보이기",
          "이력서에 ‘관리/운영’보다 ‘실행/문제 해결’ 중심의 문장을 전면 배치(포지션 레벨에 맞추기)",
        ],
        counter:
          "회사에서 해당 직무를 확장 중이거나, 상위 레벨 후보가 필요한 상황이면 오버퀄이 오히려 장점이 될 수 있습니다.",
      })
    );
  }

  // ------------------------------
  // scoring: priority = impact * confidence * objectiveScore * correlationBoost * conflictPenalty
  // selfCheck는 confidence modifier로만 반영
  // ------------------------------
  const scored = hyps.map((h) => {
    const selfMod = confidenceFromSelfCheck(h.id, state?.selfCheck);
    const confidence = clamp(h.confidence * selfMod + h.evidenceBoost, 0, 1);

    const basePriority = h.impact * confidence * objectiveScore;

    return {
      ...h,
      confidence,
      objectiveScore,
      objectiveParts: parts,
      conflictPenalty,
      correlationBoost: 1,
      priority: basePriority, // 일단
    };
  });

  // correlation은 “상대적 점수”가 필요하니 우선 base priority를 0~1로 정규화해서 전달
  const maxP = Math.max(0.00001, ...scored.map((h) => h.priority));
  const scoresById = Object.fromEntries(scored.map((h) => [h.id, normalizeScore01(h.priority / maxP)]));

  const withCorr = applyCorrelationBoost(scored, scoresById).map((h) => {
    const priority =
      h.impact *
      h.confidence *
      objectiveScore *
      h.correlationBoost *
      conflictPenalty;

    return { ...h, priority };
  });

  return withCorr.sort((a, b) => b.priority - a.priority).slice(0, 6);
}

// ------------------------------
// buildReport
// ------------------------------
export function buildReport(state) {
  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "");
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");
  const hyps = buildHypotheses(state);

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals });

  const header =
    `탈락 원인 분석 리포트 (추정)\n\n` +
    `- 회사: ${state?.company || "(미입력)"}\n` +
    `- 포지션: ${state?.role || "(미입력)"}\n` +
    `- 단계: ${state?.stage || "서류"}\n` +
    `- 지원일: ${state?.applyDate || "-"}\n\n`;

  const objectiveBlock =
    `[객관 지표]\n` +
    `- 키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100\n` +
    `- 커리어 리스크(공백/이직/근속 프록시): ${Math.round(careerSignals.careerRiskScore * 100)}/100\n` +
    `- 증거 강도(숫자/단위 패턴 프록시): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100 (패턴 ${resumeSignals.proofCount}개)\n` +
    `- 경험 레벨 적합도(JD 연차 기반): ${Math.round(careerSignals.experienceLevelScore * 100)}/100\n` +
    `- ObjectiveScore(합성): ${Math.round(objective.objectiveScore * 100)}/100\n\n`;

  const keywordBlock =
    `[키워드 상세]\n` +
    (keywordSignals.note ? `- 메모: ${keywordSignals.note}\n` : "") +
    `- JD 키워드: ${keywordSignals.jdKeywords?.length ? keywordSignals.jdKeywords.join(", ") : "(탐지 실패)"}\n` +
    `- 매칭: ${keywordSignals.matchedKeywords?.length ? keywordSignals.matchedKeywords.join(", ") : "-"}\n` +
    `- 누락: ${keywordSignals.missingKeywords?.length ? keywordSignals.missingKeywords.join(", ") : "-"}\n\n`;

  const disclaimer =
    `※ 이 리포트는 입력 기반의 ‘가설’이며 단정하지 않습니다.\n` +
    `※ 실제 탈락 사유는 내부 기준/경쟁자/예산/타이밍 등 외부 변수로 달라질 수 있습니다.\n\n`;

  const body = hyps
    .map((h, idx) => {
      const pr = Math.round(h.priority * 100);
      return (
        `${idx + 1}. ${h.title} (우선순위 ${pr}/100)\n` +
        `- 왜 그럴 수 있나: ${h.why}\n` +
        `- 근거/신호: ${h.signals?.length ? h.signals.join(", ") : "입력 신호 부족"}\n` +
        `- 다음 액션:\n${h.actions.map((a) => `  - ${a}`).join("\n")}\n` +
        `- 반례/예외: ${h.counter}\n`
      );
    })
    .join("\n");

  const next =
    `\n[추천 체크리스트]\n` +
    `- JD 필수/우대 문장을 이력서 문장에 1:1 매칭했나?\n` +
    `- 숫자/전후/비교/기여도가 최소 3개 이상 들어가나?\n` +
    `- 공백/짧은 근속은 ‘사실→의도→행동→증거’ 4문장으로 고정했나?\n` +
    `- 면접 답변은 ‘전제→판단기준→행동→결과→학습’ 구조로 고정했나?\n`;

  return header + objectiveBlock + keywordBlock + disclaimer + "[핵심 가설]\n\n" + body + next;
}
