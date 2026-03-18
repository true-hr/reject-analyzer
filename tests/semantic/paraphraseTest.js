import path from "node:path";
import { fileURLToPath } from "node:url";

import { readCsv } from "../../scripts/lib/csv.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATASET_PATH = path.resolve(
  __dirname,
  "../../datasets/pairs/paraphraseCases.csv"
);

const LABELS = ["match", "partial", "reject", "unknown_safe"];
const MUST_HAVE_MARKERS = ["필수", "must", "required"];
const MUST_HAVE_KEYWORDS = ["sql", "erp", "crm", "excel", "ppt", "ga", "python"];

const ALIAS_REPLACEMENTS = [
  ["kpi", "성과지표"],
  ["crm", "고객관계관리"],
  ["erp", "전사적자원관리"],
  ["excel", "엑셀"],
  ["ppt", "파워포인트"],
  ["ga", "구글애널리틱스"],
  ["온라인 마케팅", "디지털 마케팅"],
  ["웹 분석", "디지털 분석"],
  ["리텐션", "유지"],
  ["리크루팅", "채용"],
  ["인터뷰", "면접"],
  ["리포트", "보고서"],
  ["보고 자료", "보고서"],
  ["임원", "경영진"],
  ["세일즈", "영업"],
  ["조회", "추출"]
];

const ROLE_BOUNDARIES = [
  { canonical: "전략기획", aliases: ["전략기획", "사업기획", "전략 기획"] },
  { canonical: "전략소싱", aliases: ["전략소싱", "소싱", "전략 구매"] },
  { canonical: "마케팅", aliases: ["마케팅", "브랜드", "퍼포먼스 마케팅"] },
  { canonical: "영업", aliases: ["영업", "세일즈", "bizdev", "business development"] },
  { canonical: "데이터분석", aliases: ["데이터분석", "데이터 분석", "analytics", "분석"] },
  {
    canonical: "데이터엔지니어",
    aliases: ["데이터엔지니어", "데이터 엔지니어", "etl", "파이프라인"]
  },
  { canonical: "인사", aliases: ["인사", "hr", "채용", "평가"] },
  { canonical: "총무", aliases: ["총무", "자산 관리", "자산관리", "행정"] }
];

const STOPWORDS = new Set([
  "및",
  "경험",
  "운영",
  "지원",
  "가능자",
  "보유자",
  "담당",
  "기반",
  "중심",
  "전반",
  "관리",
  "작성",
  "활용",
  "수행",
  "가능"
]);

const CONCEPT_MAP = [
  ["디지털마케팅", ["디지털 마케팅", "브랜드 캠페인", "캠페인"]],
  ["고객관계관리", ["고객관계관리"]],
  ["전사적자원관리", ["전사적자원관리"]],
  ["보고서", ["보고서"]],
  ["경영진", ["경영진"]],
  ["채용", ["채용"]],
  ["면접", ["면접"]],
  ["분석", ["분석", "인사이트"]],
  ["추출", ["추출"]],
  ["시각화", ["시각화", "대시보드"]],
  ["영업", ["영업"]],
  ["성과", ["성과", "전환율", "성과지표"]]
];

function normalize(text) {
  let value = String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  for (const [from, to] of ALIAS_REPLACEMENTS) {
    value = value.replace(new RegExp(from, "g"), to);
  }

  return value;
}

function tokenize(text) {
  const normalized = normalize(text);
  const tokens =
    normalized
      .match(/[a-z0-9가-힣]+/g)
      ?.filter((token) => token.length > 1 && !STOPWORDS.has(token)) ?? [];

  const concepts = [];
  for (const [canonical, variants] of CONCEPT_MAP) {
    if (variants.some((variant) => normalized.includes(variant))) {
      concepts.push(canonical);
    }
  }

  return [...tokens, ...concepts];
}

function extractRoles(text) {
  const normalized = normalize(text);
  return ROLE_BOUNDARIES.filter(({ aliases }) =>
    aliases.some((alias) => normalized.includes(normalize(alias)))
  ).map(({ canonical }) => canonical);
}

function extractMustHaveKeywords(text) {
  const normalized = normalize(text);
  const hasMarker = MUST_HAVE_MARKERS.some((marker) => normalized.includes(marker));

  if (!hasMarker) {
    return [];
  }

  return MUST_HAVE_KEYWORDS.filter((keyword) => {
    const normalizedKeyword = normalize(keyword);
    return normalized.includes(normalizedKeyword);
  });
}

function computeOverlap(jd, resume) {
  const jdTokens = new Set(tokenize(jd));
  const resumeTokens = new Set(tokenize(resume));
  const shared = [...jdTokens].filter((token) => resumeTokens.has(token));
  const unionSize = new Set([...jdTokens, ...resumeTokens]).size;
  const jdCoverage = jdTokens.size === 0 ? 0 : shared.length / jdTokens.size;
  const jaccard = unionSize === 0 ? 0 : shared.length / unionSize;

  return {
    shared,
    jdCoverage,
    jaccard
  };
}

function createBaselineAdapter() {
  return {
    evaluate({ jd, resume, meta }) {
      const normalizedJd = normalize(jd);
      const normalizedResume = normalize(resume);
      const jdRoles = extractRoles(normalizedJd);
      const resumeRoles = extractRoles(normalizedResume);
      const overlap = computeOverlap(normalizedJd, normalizedResume);
      const requiredKeywords = extractMustHaveKeywords(normalizedJd);
      const missingKeywords = requiredKeywords.filter(
        (keyword) => !normalizedResume.includes(normalize(keyword))
      );

      if (jdRoles.length > 0 && resumeRoles.length > 0) {
        const sameRole = jdRoles.some((role) => resumeRoles.includes(role));
        if (!sameRole) {
          return {
            predicted: "reject",
            rawScore: 0,
            pairState: "role_boundary_mismatch",
            failureType: "role_boundary",
            debug: {
              jdRoles,
              resumeRoles,
              overlap,
              meta
            }
          };
        }
      }

      if (missingKeywords.length > 0) {
        return {
          predicted: "reject",
          rawScore: 0,
          pairState: "must_have_missing",
          failureType: "must_have_missing",
          debug: {
            requiredKeywords,
            missingKeywords,
            overlap,
            meta
          }
        };
      }

      const genericSignals =
        jdRoles.length === 0 &&
        resumeRoles.length === 0 &&
        overlap.shared.length === 0 &&
        (normalizedJd.includes("역량") ||
          normalizedJd.includes("지원") ||
          normalizedJd.includes("전반") ||
          normalizedResume.includes("협업") ||
          normalizedResume.includes("지원"));

      if (genericSignals) {
        return {
          predicted: "unknown_safe",
          rawScore: Number(overlap.jaccard.toFixed(3)),
          pairState: "insufficient_evidence",
          failureType: "insufficient_evidence",
          debug: {
            overlap,
            meta
          }
        };
      }

      if (overlap.jdCoverage >= 0.5 || overlap.shared.length >= 3) {
        return {
          predicted: "match",
          rawScore: Number(overlap.jaccard.toFixed(3)),
          pairState: "strong_overlap",
          failureType: null,
          debug: {
            overlap,
            meta
          }
        };
      }

      if (overlap.jdCoverage >= 0.2 || overlap.shared.length >= 1) {
        return {
          predicted: "partial",
          rawScore: Number(overlap.jaccard.toFixed(3)),
          pairState: "partial_overlap",
          failureType: "partial_overlap",
          debug: {
            overlap,
            meta
          }
        };
      }

      return {
        predicted: "unknown_safe",
        rawScore: Number(overlap.jaccard.toFixed(3)),
        pairState: "low_signal",
        failureType: "insufficient_evidence",
        debug: {
          overlap,
          meta
        }
      };
    }
  };
}

function buildBreakdown(results, selector) {
  return results.reduce((acc, row) => {
    const key = selector(row) || "none";
    acc[key] = acc[key] ?? { total: 0, correct: 0, mismatch: 0 };
    acc[key].total += 1;
    acc[key].correct += row.correct ? 1 : 0;
    acc[key].mismatch += row.correct ? 0 : 1;
    return acc;
  }, {});
}

function formatBreakdown(title, breakdown) {
  return [
    title,
    ...Object.entries(breakdown).map(
      ([key, value]) =>
        `- ${key}: total=${value.total}, correct=${value.correct}, mismatch=${value.mismatch}`
    )
  ];
}

export async function loadParaphraseCases() {
  const rows = await readCsv(DEFAULT_DATASET_PATH);
  return rows.map((row) => ({
    testId: row.testId,
    group: row.group,
    subcategory: row.subcategory,
    difficulty: row.difficulty,
    jd: row.jd,
    resume: row.resume,
    expected: row.expected,
    expectedFailureType: row.expectedFailureType || null,
    notes: row.notes || null
  }));
}

export async function evaluateParaphraseCase(testCase, adapter) {
  const activeAdapter = adapter ?? createBaselineAdapter();
  const evaluation = await activeAdapter.evaluate({
    jd: testCase.jd,
    resume: testCase.resume,
    meta: {
      testId: testCase.testId,
      group: testCase.group,
      subcategory: testCase.subcategory,
      difficulty: testCase.difficulty,
      expected: testCase.expected,
      expectedFailureType: testCase.expectedFailureType
    }
  });

  const predicted = LABELS.includes(evaluation?.predicted)
    ? evaluation.predicted
    : "unknown_safe";

  return {
    ...testCase,
    predicted,
    rawScore: typeof evaluation?.rawScore === "number" ? evaluation.rawScore : null,
    pairState: evaluation?.pairState ?? null,
    failureType: evaluation?.failureType ?? null,
    correct: predicted === testCase.expected,
    debug: evaluation?.debug ?? null
  };
}

export async function runParaphraseTests(adapter) {
  const cases = await loadParaphraseCases();
  const results = [];

  for (const testCase of cases) {
    results.push(await evaluateParaphraseCase(testCase, adapter));
  }

  return results;
}

export function buildParaphraseReport(results) {
  const total = results.length;
  const expectedMatch = results.filter((row) => row.expected === "match").length;
  const predictedMatch = results.filter((row) => row.predicted === "match").length;
  const truePositiveMatch = results.filter(
    (row) => row.expected === "match" && row.predicted === "match"
  ).length;
  const falseAccept = results.filter(
    (row) =>
      (row.expected === "reject" || row.expected === "unknown_safe") &&
      (row.predicted === "match" || row.predicted === "partial")
  ).length;
  const falseReject = results.filter(
    (row) => row.expected === "match" && row.predicted !== "match"
  ).length;
  const roleBoundaryFalseAccept = results.filter(
    (row) => row.expectedFailureType === "role_boundary" && row.predicted !== "reject"
  ).length;
  const mustHaveLeak = results.filter(
    (row) => row.expectedFailureType === "must_have_missing" && row.predicted !== "reject"
  ).length;

  const expectedFailureTypeBreakdown = buildBreakdown(
    results,
    (row) => row.expectedFailureType || "none"
  );
  const actualFailureTypeBreakdown = buildBreakdown(
    results,
    (row) => row.failureType || "none"
  );
  const subcategoryBreakdown = buildBreakdown(
    results,
    (row) => row.subcategory || "uncategorized"
  );

  const worstSubcategories = Object.entries(subcategoryBreakdown)
    .map(([key, value]) => [key, value.mismatch])
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 5);

  const worstExpectedFailureTypes = Object.entries(expectedFailureTypeBreakdown)
    .map(([key, value]) => [key, value.mismatch])
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  const lines = [
    "PARAPHRASE TEST REPORT",
    `Total cases: ${total}`,
    `Match precision: ${predictedMatch === 0 ? "0.000" : (truePositiveMatch / predictedMatch).toFixed(3)}`,
    `Match recall: ${expectedMatch === 0 ? "0.000" : (truePositiveMatch / expectedMatch).toFixed(3)}`,
    `False accept: ${falseAccept} (${total === 0 ? "0.000" : (falseAccept / total).toFixed(3)})`,
    `False reject: ${falseReject} (${expectedMatch === 0 ? "0.000" : (falseReject / expectedMatch).toFixed(3)})`,
    `Role-boundary false accept: ${roleBoundaryFalseAccept}`,
    `Must-have leak: ${mustHaveLeak}`,
    ...formatBreakdown("Expected failureType breakdown:", expectedFailureTypeBreakdown),
    ...formatBreakdown("Actual failureType breakdown:", actualFailureTypeBreakdown),
    ...formatBreakdown("Subcategory breakdown:", subcategoryBreakdown),
    "Worst subcategories by mismatch:",
    ...worstSubcategories.map(([key, mismatch]) => `- ${key}: ${mismatch}`),
    "Worst expectedFailureType by mismatch:",
    ...worstExpectedFailureTypes.map(([key, mismatch]) => `- ${key}: ${mismatch}`)
  ];

  return lines.join("\n");
}
