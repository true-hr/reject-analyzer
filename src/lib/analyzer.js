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

function normalizeScore01(x) {
  if (!Number.isFinite(x)) return 0;
  return clamp(x, 0, 1);
}

function scoreToLabel(n) {
  if (n <= 2) return "낮음";
  if (n === 3) return "보통";
  return "높음";
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ------------------------------
// Tokenize (Intl.Segmenter KO support)
// ------------------------------
function tokenize(text) {
  const t = safeLower(text);

  // Intl.Segmenter가 있으면 한국어 word segmentation 사용
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter("ko", { granularity: "word" });
      return Array.from(seg.segment(t))
        .filter((s) => s.isWordLike)
        .map((s) => s.segment.trim())
        .filter(Boolean);
    } catch {
      // ignore and fallback
    }
  }

  // fallback: 기존 정규식
  return t
    .replace(/[^a-z0-9가-힣+./#-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// 단어 경계 기반 + 토큰 기반 매칭
function hasWord(tokensOrText, kw) {
  const k = safeLower(kw).trim();
  if (!k) return false;

  if (Array.isArray(tokensOrText)) {
    const tokens = tokensOrText;
    if (k.includes(" ")) {
      const joined = tokens.join(" ");
      return joined.includes(k);
    }
    return tokens.includes(k);
  }

  const t = safeLower(tokensOrText);

  // 영문/숫자 키워드는 boundary로 오탐 방지
  if (/^[a-z0-9.+/#-]+$/.test(k)) {
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}([^a-z0-9]|$)`, "i");
    return re.test(t);
  }
  return t.includes(k);
}

// ------------------------------
// Keyword dictionary (with critical)
// - critical: true = "없으면 서류 컷" 성격의 must-have
// ------------------------------
const SKILL_DICTIONARY = [
  // dev / data (예시)
  { kw: "javascript", alias: ["js"], critical: false },
  { kw: "typescript", alias: ["ts"], critical: false },
  { kw: "react", alias: [], critical: false },
  { kw: "node", alias: ["node.js"], critical: false },
  { kw: "next.js", alias: ["nextjs", "next"], critical: false },
  { kw: "python", alias: [], critical: false },
  { kw: "java", alias: [], critical: false },
  { kw: "sql", alias: [], critical: false },

  // infra
  { kw: "aws", alias: ["amazon web services"], critical: false },
  { kw: "gcp", alias: ["google cloud"], critical: false },
  { kw: "azure", alias: ["microsoft azure"], critical: false },
  { kw: "docker", alias: [], critical: false },
  { kw: "kubernetes", alias: ["k8s"], critical: false },

  // biz / ops
  { kw: "excel", alias: [], critical: false },
  { kw: "sap", alias: [], critical: false },
  { kw: "erp", alias: [], critical: false },
  { kw: "procurement", alias: ["purchasing"], critical: false },
  { kw: "purchasing", alias: ["buyer"], critical: false },
  { kw: "sourcing", alias: [], critical: false },
  { kw: "negotiation", alias: ["negotiate"], critical: false },
  { kw: "supply chain", alias: ["supply-chain", "scm"], critical: false },
  { kw: "scm", alias: ["supply chain"], critical: false },

  // signals
  { kw: "portfolio", alias: [], critical: false },
  { kw: "case study", alias: ["casestudy"], critical: false },
  { kw: "metrics", alias: ["metric"], critical: false },
  { kw: "conversion", alias: ["cvr"], critical: false },

  // ------------------------------
  // ✅ Knockout 후보(예시)
  // - JD에서 뜨면 실제로 must-have일 때만 true로 두세요.
  // - 너무 많이 true로 두면 오히려 분석이 망가집니다.
  // ------------------------------
  { kw: "python", alias: [], critical: true },
  { kw: "sql", alias: [], critical: true },
  { kw: "react", alias: [], critical: true },
];

// JD에서 등장한 키워드만 뽑고, Resume에 있는지 검사
export function buildKeywordSignals(jd, resume) {
  const jdText = safeLower(jd);
  const resumeText = safeLower(resume);

  const jdTokens = tokenize(jdText);
  const resumeTokens = tokenize(resumeText);

  // JD에 등장한 키워드 탐지
  const hitsInJD = [];
  for (const item of SKILL_DICTIONARY) {
    const candidates = [item.kw, ...(item.alias || [])];
    const found = candidates.some((c) => hasWord(jdTokens, c) || hasWord(jdText, c));
    if (found) hitsInJD.push(item.kw);
  }
  const jdKeywords = uniq(hitsInJD);

  // JD 신뢰도(빈약한 JD면 해석 약화)
  const jdLen = jdTokens.length;
  const keywordCount = jdKeywords.length;
  const reliability = normalizeScore01(
    (Math.min(keywordCount, 8) / 8) * 0.7 + (Math.min(jdLen, 250) / 250) * 0.3
  );

  // 매칭 계산
  const matched = [];
  const missing = [];
  for (const kw of jdKeywords) {
    const dict = SKILL_DICTIONARY.find((x) => x.kw === kw);
    const candidates = [kw, ...((dict && dict.alias) || [])];

    const ok = candidates.some((c) => hasWord(resumeTokens, c) || hasWord(resumeText, c));
    if (ok) matched.push(kw);
    else missing.push(kw);
  }

  // ✅ Knockout(critical) 누락 탐지
  const jdCritical = jdKeywords.filter((kw) => {
    const dict = SKILL_DICTIONARY.find((x) => x.kw === kw);
    return Boolean(dict?.critical);
  });

  const missingCritical = jdCritical.filter((kw) => !matched.includes(kw));
  const hasKnockoutMissing = missingCritical.length > 0;

  if (jdKeywords.length === 0) {
    return {
      matchScore: 0.35,
      matchedKeywords: [],
      missingKeywords: [],
      jdKeywords: [],
      reliability,
      jdCritical: [],
      missingCritical: [],
      hasKnockoutMissing: false,
      note:
        "JD에서 사전 키워드를 거의 찾지 못했습니다. JD ‘필수/우대/업무’ 문장을 더 붙여 넣으면 정확도가 올라갑니다.",
    };
  }

  const raw = matched.length / jdKeywords.length;
  // reliability로 약한 보정(과신 방지)
  let matchScore = normalizeScore01(raw * (0.85 + 0.15 * reliability));

  // ✅ knockout이 있으면 matchScore를 강하게 깎는다(서류 컷 반영)
  if (hasKnockoutMissing) {
    matchScore = normalizeScore01(matchScore * 0.55);
  }

  return {
    matchScore,
    matchedKeywords: matched,
    missingKeywords: missing,
    jdKeywords,
    reliability,
    jdCritical,
    missingCritical,
    hasKnockoutMissing,
    note: null,
  };
}

// ------------------------------
// JD years + policy
// ------------------------------
function parseExperiencePolicyFromJD(jd) {
  const t = safeLower(jd);
  // 한국 JD 흔한 표현
  if (/(신입|인턴|new grad|newgrad)/i.test(t)) return "newgrad";
  if (/(경력\s*무관|무관|경력무관|experience\s*not\s*required)/i.test(t)) return "any";
  if (/(경력|experienced|years? of experience)/i.test(t)) return "experienced";
  return "unknown";
}

function parseRequiredYearsFromJD(jd) {
  const t = (jd || "").toString();

  // "3~5년" / "3-5년"
  let m = t.match(/(\d+)\s*[-~]\s*(\d+)\s*년/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return { min: Math.min(a, b), max: Math.max(a, b) };
    }
  }

  // "3년 이상" / "3년+"
  m = t.match(/(\d+)\s*년\s*(이상|\+|\s*plus)?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return { min: n, max: null };
  }

  // "5+ years"
  m = t.match(/(\d+)\s*\+\s*years?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return { min: n, max: null };
  }

  // "0년" / "0 years" 같은 경우(신입)
  m = t.match(/(^|[^0-9])0\s*년/);
  if (m) return { min: 0, max: 0 };

  return null;
}

// ------------------------------
// Numeric proof: context-aware scoring
// ------------------------------
const IMPACT_VERBS = [
  "개선", "상승", "절감", "달성", "성장", "구축", "단축", "감소", "증가", "최적화", "향상", "확대", "개편",
  "improve", "increase", "decrease", "reduce", "grow", "achieve", "optimize", "boost", "deliver",
];

const IMPACT_NOUNS = [
  "매출", "이익", "원가", "비용", "전환율", "cvr", "클릭률", "ctr", "리드타임", "납기", "불량률",
  "재고", "kpi", "okr", "sla", "roi", "고객", "유지율", "retention",
  "revenue", "profit", "cost", "conversion", "lead time", "defect", "inventory", "margin",
];

// 날짜/연락처/식별자 등 오탐 패턴(완벽하진 않지만 실용적으로 컷)
const NON_PROOF_PATTERNS = [
  /\b(19|20)\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}\b/g, // 2024-01-01
  /\b(19|20)\d{2}\b/g,                           // 연도만 단독
  /\b0\d{1,2}-\d{3,4}-\d{4}\b/g,                 // 전화번호
  /\b010-\d{4}-\d{4}\b/g,
  /\b\d{2}:\d{2}\b/g,                            // 시간
  /\b\d{6}-\d{7}\b/g,                            // 주민번호 형태(데이터에 있을 수 있어 방지)
];

function countNumericProofSignalsContextAware(text) {
  const t = (text || "").toString();
  if (!t.trim()) return { raw: 0, qualified: 0, notes: [] };

  // 1) 숫자 패턴들(기존 유지)
  const numberPatterns = [
    /\d{1,3}(,\d{3})+/g,      // 1,200
    /\d+(\.\d+)?\s*%/g,       // 12%
    /\d+(\.\d+)?\s*(배|x)\b/gi, // 3배, 2x
    /\d+\s*(억|만|천)\b/g,    // 10억, 20만
    /\d+\s*(개월|주|일)\b/g,  // 3개월
  ];

  // 2) 비성과 패턴 위치 마킹
  const nonProofSpans = [];
  for (const re of NON_PROOF_PATTERNS) {
    let m;
    while ((m = re.exec(t)) !== null) {
      nonProofSpans.push([m.index, m.index + m[0].length]);
    }
  }
  const inNonProof = (idx) => nonProofSpans.some(([a, b]) => idx >= a && idx <= b);

  // 3) 숫자 히트의 "문맥" 확인
  const lower = safeLower(t);
  const notes = [];
  let rawCount = 0;
  let qualifiedCount = 0;

  const window = 40; // 좌우 40자 정도

  for (const re of numberPatterns) {
    let m;
    while ((m = re.exec(t)) !== null) {
      const idx = m.index;
      rawCount += 1;

      // 날짜/전화번호 등 비성과 영역이면 제외
      if (inNonProof(idx)) continue;

      const start = Math.max(0, idx - window);
      const end = Math.min(lower.length, idx + m[0].length + window);
      const ctx = lower.slice(start, end);

      const hasVerb = IMPACT_VERBS.some((w) => ctx.includes(safeLower(w)));
      const hasNoun = IMPACT_NOUNS.some((w) => ctx.includes(safeLower(w)));

      // 최소 조건: 성과 동사 or 성과 명사 중 하나는 붙어 있어야 인정
      if (hasVerb || hasNoun) {
        qualifiedCount += 1;
      } else {
        // 디버깅 메모(필요하면 UI에 노출)
        notes.push(`숫자 '${m[0]}'는 성과 문맥이 약해 제외됨`);
      }
    }
  }

  return { raw: rawCount, qualified: qualifiedCount, notes };
}

function buildResumeSignals(resume, portfolio) {
  const a = countNumericProofSignalsContextAware(resume);
  const b = countNumericProofSignalsContextAware(portfolio);

  const rawCount = a.raw + b.raw;
  const qualified = a.qualified + b.qualified;

  // qualified 기준으로 점수 산정(오탐 억제)
  // 0개: 0.35, 1~2개: 0.5, 3~5개: 0.7, 6개+: 0.85
  let resumeSignalScore = 0.35;
  if (qualified >= 6) resumeSignalScore = 0.85;
  else if (qualified >= 3) resumeSignalScore = 0.7;
  else if (qualified >= 1) resumeSignalScore = 0.5;

  return {
    proofCount: qualified,         // UI/리포트용은 “인정된” 개수
    proofCountRaw: rawCount,       // 참고용
    resumeSignalScore,
    proofNotes: [...a.notes, ...b.notes].slice(0, 5),
  };
}

// ------------------------------
// Career signals
// ------------------------------
export function buildCareerSignals(career, jd) {
  const policy = parseExperiencePolicyFromJD(jd);
  const req = parseRequiredYearsFromJD(jd);

  const totalYears = Number(career?.totalYears ?? 0);
  const gapMonths = Number(career?.gapMonths ?? 0);
  const jobChanges = Number(career?.jobChanges ?? 0);
  const lastTenureMonths = Number(career?.lastTenureMonths ?? 0);

  // risk (0~1)
  let risk = 0;
  if (gapMonths >= 12) risk += 0.4;
  else if (gapMonths >= 6) risk += 0.32;
  else if (gapMonths >= 3) risk += 0.2;

  if (lastTenureMonths > 0 && lastTenureMonths <= 6) risk += 0.3;
  else if (lastTenureMonths > 0 && lastTenureMonths <= 12) risk += 0.18;

  if (jobChanges >= 5) risk += 0.25;
  else if (jobChanges >= 3) risk += 0.15;

  const careerRiskScore = normalizeScore01(risk);

  // experienceLevelScore (0~1)
  let experienceLevelScore = 0.6; // unknown default
  let experienceGap = null;

  // 신입/경력무관이면 연차를 강하게 평가하지 않음(완화)
  if (policy === "newgrad" || policy === "any") {
    experienceLevelScore = 0.7;
    experienceGap = null;
  } else if (req) {
    const requiredMin = req.min ?? 0;
    experienceGap = totalYears - requiredMin;

    if (experienceGap < 0) {
      experienceLevelScore = normalizeScore01(0.55 + experienceGap * 0.1);
    } else {
      experienceLevelScore = normalizeScore01(0.62 - Math.min(experienceGap, 12) * 0.02);
    }
  }

  return {
    experiencePolicy: policy, // newgrad | any | experienced | unknown
    requiredYears: req,       // {min,max|null} | null
    experienceGap,
    careerRiskScore,
    experienceLevelScore,
  };
}

// ------------------------------
// objectiveScore composition
// - knockout penalty 반영
// ------------------------------
function buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals }) {
  const keywordMatchScore = keywordSignals.matchScore; // 0~1
  const careerRiskScore = careerSignals.careerRiskScore; // 0~1 (risk)
  const resumeSignalScore = resumeSignals.resumeSignalScore; // 0~1
  const experienceLevelScore = careerSignals.experienceLevelScore; // 0~1
  const jdReliability = keywordSignals.reliability ?? 0.5;

  const invertedCareerRisk = 1 - careerRiskScore;

  const kwW = 0.35 * (0.75 + 0.25 * jdReliability);
  const restScale = (1 - kwW) / (0.2 + 0.25 + 0.2);

  let objectiveScore =
    kwW * keywordMatchScore +
    (0.2 * restScale) * invertedCareerRisk +
    (0.25 * restScale) * resumeSignalScore +
    (0.2 * restScale) * experienceLevelScore;

  objectiveScore = normalizeScore01(objectiveScore);

  // ✅ knockout missing이면 objectiveScore 자체에 강한 페널티
  // (채용 현실: 필수요건 결여는 평균으로 커버가 안 됨)
  const knockoutPenalty = keywordSignals.hasKnockoutMissing ? 0.72 : 1;
  objectiveScore = normalizeScore01(objectiveScore * knockoutPenalty);

  return {
    objectiveScore,
    parts: {
      keywordMatchScore,
      careerRiskScore,
      resumeSignalScore,
      experienceLevelScore,
      jdReliability,
      knockoutPenalty,
      hasKnockoutMissing: Boolean(keywordSignals.hasKnockoutMissing),
    },
  };
}

// ------------------------------
// correlation + conflict
// ------------------------------
const correlationMatrix = {
  "fit-mismatch": {
    down: [{ id: "unclear-positioning", factor: 0.85 }],
  },
  "gap-risk": {
    up: [{ id: "risk-signals", factor: 1.15 }],
  },
  // knockout이 발생하면 fit-mismatch를 더 올리는 효과를 주고 싶지만,
  // 여기서는 "가설 자체를 추가"하는 방식으로 처리(설명가능성↑).
};

function applyCorrelationBoost(hypotheses, scoresById) {
  const next = hypotheses.map((h) => ({ ...h, correlationBoost: 1 }));
  const index = new Map(next.map((h, i) => [h.id, i]));

  for (const [srcId, rules] of Object.entries(correlationMatrix)) {
    const srcScore = scoresById[srcId] ?? 0;
    const active = srcScore >= 0.55;
    if (!active) continue;

    if (rules.up) {
      for (const r of rules.up) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        const bump = 1 + ((srcScore - 0.55) / 0.45) * (r.factor - 1);
        next[j].correlationBoost *= bump;
      }
    }

    if (rules.down) {
      for (const r of rules.down) {
        const j = index.get(r.id);
        if (j === undefined) continue;
        const damp = 1 - ((srcScore - 0.55) / 0.45) * (1 - r.factor);
        next[j].correlationBoost *= damp;
      }
    }
  }

  for (const h of next) {
    h.correlationBoost = clamp(h.correlationBoost, 0.75, 1.25);
  }
  return next;
}

function calcConflictPenalty({ keywordSignals, careerSignals, selfCheck }) {
  let penalty = 1;

  const coreFitHigh = (selfCheck?.coreFit ?? 3) >= 4;
  const keywordLow = keywordSignals.matchScore <= 0.35;
  if (coreFitHigh && keywordLow) penalty *= 0.85;

  const riskSelfLow = (selfCheck?.riskSignals ?? 3) <= 2;
  const careerRiskHigh = careerSignals.careerRiskScore >= 0.65;
  if (riskSelfLow && careerRiskHigh) penalty *= 0.88;

  return clamp(penalty, 0.75, 1);
}

function confidenceFromSelfCheck(hId, selfCheck) {
  const sc = selfCheck || {};
  const coreFit = sc.coreFit ?? 3;
  const proof = sc.proofStrength ?? 3;
  const clarity = sc.roleClarity ?? 3;
  const story = sc.storyConsistency ?? 3;
  const risk = sc.riskSignals ?? 3;

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

  const hyps = [];

  // ✅ 0) knockout 가설(서류/면접 모두 강력)
  if (keywordSignals.hasKnockoutMissing) {
    hyps.push(
      makeHypothesis({
        id: "knockout-missing",
        title: "필수요건(Must-have) 누락으로 즉시 탈락 가능성",
        why:
          "채용은 평균점이 아니라 ‘필수요건 충족 여부’가 먼저 걸러지는 구조입니다. JD에서 필수로 읽히는 기술/요건이 이력서에 없으면, 다른 장점이 있어도 초기 컷될 수 있습니다.",
        signals: [
          `누락된 필수 키워드: ${keywordSignals.missingCritical.join(", ")}`,
          `키워드 매칭(페널티 반영): ${Math.round(keywordSignals.matchScore * 100)}/100`,
        ],
        impact: 0.98,
        confidence: 0.82,
        evidenceBoost: 0.1,
        actions: [
          "누락된 필수 키워드를 ‘경험/프로젝트/업무’ 문장에 사실 기반으로 명시(단순 나열 금지)",
          "없다면: (1) 학습/실습 결과물(작은 프로젝트)로 ‘증거’를 만들고 링크/스크린샷으로 첨부",
          "지원 전략: 필수요건을 충족하는 포지션으로 파이프라인을 넓히거나, 필수요건이 낮은 JD도 병행 지원",
        ],
        counter:
          "일부 회사는 필수요건을 완화하거나 내부 전환/학습을 전제로 채용하기도 하지만, 일반적인 공개채용에서는 예외가 드뭅니다.",
      })
    );
  }

  // 1) 서류 단계
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
          `JD 신뢰도(키워드/길이): ${Math.round((keywordSignals.reliability ?? 0) * 100)}/100`,
        ].filter(Boolean),
        impact: 0.9,
        confidence: kwLow ? 0.72 : 0.52,
        evidenceBoost: kwLow ? 0.08 : 0.0,
        actions: [
          "JD ‘필수/우대’ 문장을 체크리스트로 만들고, 이력서 문장에 1:1로 대응되게 재작성",
          "누락 키워드 상위 5개를 헤더/요약/핵심 프로젝트에 분산 배치(동의어 말고 JD 표현 우선)",
          "경력 전환이면 ‘전이 가능한 능력’을 JD 업무 문장 단위로 번역해 넣기",
        ],
        counter:
          "JD가 매우 포괄적이거나(키워드가 과다), 채용팀이 포텐셜 위주로 보는 경우엔 키워드 매칭만으로 결론을 내리기 어렵습니다.",
      })
    );

    // 성과 증거 부족(문맥 기반 proofCount)
    const proofLow = resumeSignals.resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-proof",
        title: "성과 증거(수치/전후/기여도) 부족",
        why:
          "‘무엇을 했다’보다 ‘어떤 문제를 어떻게 풀었고 결과가 무엇인지’가 서류 신뢰를 만듭니다. 숫자가 있어도 성과 문맥이 붙지 않으면 설득력이 약해집니다.",
        signals: [
          `정량 근거(문맥 인정): ${resumeSignals.proofCount}개 (raw ${resumeSignals.proofCountRaw}개)`,
          `증거 강도(프록시): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100`,
          resumeSignals.proofNotes?.length ? `제외 메모: ${resumeSignals.proofNotes.join(" / ")}` : null,
        ].filter(Boolean),
        impact: 0.85,
        confidence: proofLow ? 0.68 : 0.52,
        evidenceBoost: proofLow ? 0.08 : 0.0,
        actions: [
          "각 경험을 ‘문제-제약-내 행동-결과-검증’ 구조로 재작성",
          "숫자는 ‘성과 단어(절감/개선/성장/달성)’와 붙여 쓰기(예: 원가 12% 절감, 리드타임 3일 단축)",
          "수치 공개가 어렵다면 범위/전후비교/대리지표로 설득 구조 만들기",
        ],
        counter:
          "신입/초경력 포지션이거나, 회사가 포텐셜/문화적합을 크게 보는 경우 영향은 일부 완화됩니다.",
      })
    );

    // 포지셔닝
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

  // 면접 단계
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
          "검증 질문 대비: 숫자/문서/결과물(가능 범위)을 미리 준비",
        ],
        counter:
          "같은 답변도 면접관/팀 문화에 따라 평가가 달라질 수 있어, 단일 신호로 확정할 수는 없습니다.",
      })
    );

    const proofLow = resumeSignals.resumeSignalScore <= 0.5;

    hyps.push(
      makeHypothesis({
        id: "weak-interview-proof",
        title: "면접에서 증거 제시가 약함(구체성 부족)",
        why:
          "면접은 서류의 주장(성과/역할)을 검증하는 자리입니다. 역할 범위와 숫자, 검증 가능성을 명확히 못 하면 신뢰가 낮아집니다.",
        signals: [
          `정량 근거(문맥 인정): ${resumeSignals.proofCount}개`,
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
          "수치 공개가 어려워도 전후 비교/범위/검증 방법을 제시하면 설득 가능합니다.",
      })
    );
  }

  // career 기반 가설(기존 유지)
  const c = state?.career || {};
  const totalYears = Number(c.totalYears ?? 0);
  const gapMonths = Number(c.gapMonths ?? 0);
  const jobChanges = Number(c.jobChanges ?? 0);
  const lastTenureMonths = Number(c.lastTenureMonths ?? 0);

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
          "공백을 ‘사실→의도→행동→결과(증거)’ 4문장으로 고정",
          "공백 기간의 학습/프로젝트/루틴을 결과물로 연결",
          "공백 관련 검증 질문(왜/무엇을/지금은 해결됐나) 반례 준비",
        ],
        counter:
          "설명과 증거가 명확하면 공백 자체는 치명적이지 않습니다.",
      })
    );
  }

  if ((lastTenureMonths > 0 && lastTenureMonths <= 12) || jobChanges >= 3) {
    const tenureShort = lastTenureMonths > 0 && lastTenureMonths <= 6;
    const conf = tenureShort ? 0.76 : 0.62;

    hyps.push(
      makeHypothesis({
        id: "short-tenure-risk",
        title: "짧은 근속/잦은 이직으로 인한 신뢰 하락",
        why:
          "회사 입장에선 채용 비용이 크기 때문에 ‘이번에도 빨리 나갈까?’를 민감하게 봅니다. 이동의 논리와 성과 축적이 보이지 않으면 리스크로 해석됩니다.",
        signals: [
          lastTenureMonths ? `직전 근속: ${lastTenureMonths}개월` : null,
          `이직 횟수: ${jobChanges}회`,
        ].filter(Boolean),
        impact: 0.8,
        confidence: conf,
        evidenceBoost: tenureShort ? 0.08 : 0.05,
        actions: [
          "이직 사유를 ‘정렬/확장’으로 재구성(일관된 기준 1개 고정)",
          "짧았던 자리에서도 ‘완료 성과/결과물’ 중심으로 서술",
          "면접에서 ‘잔류 의사’와 ‘조건’을 구체화해 제시",
        ],
        counter:
          "업계 특성상 이동이 잦아도 성과 축적이 명확하면 상쇄됩니다.",
      })
    );
  }

  // ------------------------------
  // scoring
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
      priority: basePriority,
    };
  });

  const maxP = Math.max(0.00001, ...scored.map((h) => h.priority));
  const scoresById = Object.fromEntries(
    scored.map((h) => [h.id, normalizeScore01(h.priority / maxP)])
  );

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
`탈락 원인 분석 리포트 (추정)

- 회사: ${state?.company || "(미입력)"}
- 포지션: ${state?.role || "(미입력)"}
- 단계: ${state?.stage || "서류"}
- 지원일: ${state?.applyDate || "-"}

`;

  const reqYearsText = careerSignals.requiredYears
    ? `${careerSignals.requiredYears.min}년${careerSignals.requiredYears.max ? `~${careerSignals.requiredYears.max}년` : "+"}`
    : "탐지 실패";

  const objectiveBlock =
`[객관 지표]
- 키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100
- JD 신뢰도(키워드/길이): ${Math.round((keywordSignals.reliability ?? 0) * 100)}/100
- 필수요건 누락 여부: ${keywordSignals.hasKnockoutMissing ? "있음" : "없음"}${keywordSignals.hasKnockoutMissing ? ` (${keywordSignals.missingCritical.join(", ")})` : ""}
- 커리어 리스크(프록시): ${Math.round(careerSignals.careerRiskScore * 100)}/100
- 증거 강도(문맥 기반): ${Math.round(resumeSignals.resumeSignalScore * 100)}/100 (인정 ${resumeSignals.proofCount}개 / raw ${resumeSignals.proofCountRaw}개)
- 경험 레벨 적합도: ${Math.round(careerSignals.experienceLevelScore * 100)}/100
- JD 경험 정책(추정): ${careerSignals.experiencePolicy}
- JD 요구 연차(추정): ${reqYearsText}
- ObjectiveScore(합성): ${Math.round(objective.objectiveScore * 100)}/100

`;

  const keywordBlock =
`[키워드 상세]
${keywordSignals.note ? `- 메모: ${keywordSignals.note}\n` : ""}- JD 키워드: ${keywordSignals.jdKeywords?.length ? keywordSignals.jdKeywords.join(", ") : "(탐지 실패)"}
- 매칭: ${keywordSignals.matchedKeywords?.length ? keywordSignals.matchedKeywords.join(", ") : "-"}
- 누락: ${keywordSignals.missingKeywords?.length ? keywordSignals.missingKeywords.join(", ") : "-"}
- 필수요건(critical) 탐지: ${keywordSignals.jdCritical?.length ? keywordSignals.jdCritical.join(", ") : "-"}
- 필수요건 누락: ${keywordSignals.missingCritical?.length ? keywordSignals.missingCritical.join(", ") : "-"}

`;

  const disclaimer =
`※ 이 리포트는 입력 기반의 ‘가설’이며 단정하지 않습니다.
※ 실제 탈락 사유는 내부 기준/경쟁자/예산/타이밍 등 외부 변수로 달라질 수 있습니다.

`;

  const body = hyps
    .map((h, idx) => {
      const pr = Math.round(h.priority * 100);
      return (
`${idx + 1}. ${h.title} (우선순위 ${pr}/100)
- 왜 그럴 수 있나: ${h.why}
- 근거/신호: ${h.signals?.length ? h.signals.join(" / ") : "입력 신호 부족"}
- 다음 액션:
${h.actions.map((a) => `  - ${a}`).join("\n")}
- 반례/예외: ${h.counter}
`
      );
    })
    .join("\n");

  const next =
`
[추천 체크리스트]
- JD 필수/우대 문장을 이력서 문장에 1:1 매칭했나?
- 필수요건(critical)이 누락되지 않았나?
- 숫자에 ‘성과 문맥(절감/개선/성장/달성)’이 붙어 있나?
- 공백/짧은 근속은 ‘사실→의도→행동→증거’ 4문장으로 고정했나?
- 면접 답변은 ‘전제→판단기준→행동→결과→학습’ 구조로 고정했나?
`;

  return header + objectiveBlock + keywordBlock + disclaimer + "[핵심 가설]\n\n" + body + next;
}
