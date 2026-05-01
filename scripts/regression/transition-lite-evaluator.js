/**
 * transition-lite-evaluator.js  (v2 — hardened)
 *
 * 방향성 평가 함수 — 2차 강화판.
 * exact string 비교가 아니라 리스크 축 우선순위, 키워드 포함, asset 존재,
 * placeholder 오염, surface 간 중복, generic 문구를 다층으로 판정한다.
 *
 * 사용:
 *   import { evaluateCase } from "./transition-lite-evaluator.js";
 *   const { pass, failReasons, warningReasons } = evaluateCase(caseFixture, runResult);
 *
 * fail categories:
 *   [risk-order]     preferredTopRiskKeys / forbiddenTopRiskKeys / maxTopRiskCount
 *   [asset]          requireIndustryTraitsAsset 미충족
 *   [placeholder]    raw template 패턴 {…} 잔존
 *   [duplicate]      surface 간 near-duplicate / 복붙 감지
 *   [generic]        global generic 문구 감지
 *   [keyword-missing] requiredKeywordsBySurface 미충족
 *   [forbidden-phrase] forbiddenPhrasesBySurface 감지
 *   [runtime]        실행 오류
 *
 * warnings (non-fail):
 *   [length]         minSurfaceLengthByField 기준 미달
 */

// ─── text helpers ─────────────────────────────────────────────────────────────

function toText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.toLowerCase();
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : String(v ?? ""))).join(" ").toLowerCase();
  }
  return String(value).toLowerCase();
}

/**
 * report에서 surface별 텍스트 추출.
 * surface: "whyThisRead" | "targetJobRead" | "targetIndustryRead"
 */
function getSurfaceText(report, surface) {
  if (surface === "whyThisRead") {
    return toText(report?.whyThisRead);
  }
  if (surface === "targetJobRead") {
    const r = report?.targetJobRead ?? {};
    return toText([r.title, r.summary, r.body, ...(Array.isArray(r.bullets) ? r.bullets : [])]);
  }
  if (surface === "targetIndustryRead") {
    const r = report?.targetIndustryRead ?? {};
    return toText([r.title, r.summary, ...(Array.isArray(r.bullets) ? r.bullets : [])]);
  }
  return "";
}

// ─── near-duplicate helpers ───────────────────────────────────────────────────

// 공백·구두점 제거 후 소문자 정규화
function normalizeForDup(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[\s.,!?:;'"()\[\]{}\-]/g, "");
}

// source의 첫 N자가 target 내에 포함되는지 검사
// minLen 미만이면 검사하지 않음 (너무 짧은 문자열의 오탐 방지)
function isLeadContainedIn(source, target, minLen = 28) {
  const ns = normalizeForDup(source);
  const nt = normalizeForDup(target);
  if (ns.length < minLen || nt.length < minLen) return false;
  return nt.includes(ns.slice(0, minLen));
}

function isNearDup(a, b, minLen = 28) {
  return isLeadContainedIn(a, b, minLen) || isLeadContainedIn(b, a, minLen);
}

// ─── placeholder check ────────────────────────────────────────────────────────

const PLACEHOLDER_RE = /\{[^}]+\}/;

function hasSurfacePlaceholder(report) {
  // summary/body/bullets에 raw {…} 패턴이 남아 있으면 true
  const candidates = [
    report?.targetJobRead?.summary,
    report?.targetJobRead?.body,
    report?.targetIndustryRead?.summary,
    ...(Array.isArray(report?.targetJobRead?.bullets) ? report.targetJobRead.bullets : []),
    ...(Array.isArray(report?.targetIndustryRead?.bullets) ? report.targetIndustryRead.bullets : []),
    ...(Array.isArray(report?.whyThisRead) ? report.whyThisRead : []),
  ];
  return candidates.some((v) => typeof v === "string" && PLACEHOLDER_RE.test(v));
}

// ─── global generic patterns ──────────────────────────────────────────────────

const GLOBAL_GENERIC_PATTERNS = [
  "비슷한 업무입니다",
  "유사한 역할입니다",
  "같은 기획이라",
  "둘 다 it",
  "추가 확인이 필요합니다",
];

const GENERIC_CHECK_SURFACES = ["whyThisRead", "targetJobRead", "targetIndustryRead"];

// ─── evaluateCase ─────────────────────────────────────────────────────────────

/**
 * 단일 케이스를 평가해서 { pass, failReasons, warningReasons } 반환.
 *
 * @param {object} caseFixture - REGRESSION_CASES 항목
 * @param {object} runResult   - { report, classification, errors }
 */
export function evaluateCase(caseFixture, runResult) {
  const fails = [];
  const warnings = [];
  const { expectations } = caseFixture;
  const { report, errors } = runResult;

  const fail = (category, msg) => fails.push(`[${category}] ${msg}`);
  const warn = (category, msg) => warnings.push(`[${category}] ${msg}`);

  // ── runtime error ────────────────────────────────────────────────────────────
  if (Array.isArray(errors) && errors.length > 0) {
    return {
      pass: false,
      failReasons: [`[runtime] ${errors.join(" / ")}`],
      warningReasons: [],
    };
  }

  const topRisks = Array.isArray(report?.topRisks) ? report.topRisks : [];
  const topRiskKeys = topRisks.map((r) => String(r?.key ?? "")).filter(Boolean);

  // ── [risk-order] preferredTopRiskKeys ────────────────────────────────────────
  const preferred = Array.isArray(expectations?.preferredTopRiskKeys)
    ? expectations.preferredTopRiskKeys
    : [];
  if (preferred.length > 0) {
    const hasPreferred = preferred.some((key) => topRiskKeys.includes(key));
    if (!hasPreferred) {
      fail(
        "risk-order",
        `preferredTopRiskKeys 없음: expected one of [${preferred.join(", ")}], actual: [${topRiskKeys.join(", ") || "없음"}]`
      );
    }
  }

  // ── [risk-order] forbiddenTopRiskKeys ────────────────────────────────────────
  const forbidden = Array.isArray(expectations?.forbiddenTopRiskKeys)
    ? expectations.forbiddenTopRiskKeys
    : [];
  for (const key of forbidden) {
    if (topRiskKeys.includes(key)) {
      fail("risk-order", `forbiddenTopRiskKey 감지: ${key}`);
    }
  }

  // ── [risk-order] maxTopRiskCount ─────────────────────────────────────────────
  if (typeof expectations?.maxTopRiskCount === "number") {
    if (topRiskKeys.length > expectations.maxTopRiskCount) {
      fail(
        "risk-order",
        `topRisk 개수 초과: 기대 <= ${expectations.maxTopRiskCount}, 실제: ${topRiskKeys.length}`
      );
    }
  }

  // ── [risk-order] noDuplicateTopRisks ─────────────────────────────────────────
  if (expectations?.noDuplicateTopRisks === true) {
    const seen = new Set();
    for (const key of topRiskKeys) {
      if (seen.has(key)) {
        fail("risk-order", `topRisk key 중복: ${key}`);
      }
      seen.add(key);
    }
  }

  // ── [asset] requireIndustryTraitsAsset ───────────────────────────────────────
  if (expectations?.requireIndustryTraitsAsset === true) {
    if (report?.industryTraitsAsset == null) {
      fail("asset", "industryTraitsAsset가 null — 지원 산업 traits 데이터 없음");
    }
  }

  // ── [placeholder] forbidPlaceholderPatterns ──────────────────────────────────
  if (expectations?.forbidPlaceholderPatterns === true) {
    if (hasSurfacePlaceholder(report)) {
      fail("placeholder", "raw placeholder 패턴 {…} 감지 — template 치환 미완료 가능성");
    }
  }

  // ── [keyword-missing] requiredKeywordsBySurface ──────────────────────────────
  const requiredBySurface = expectations?.requiredKeywordsBySurface ?? {};
  for (const [surface, keywords] of Object.entries(requiredBySurface)) {
    const text = getSurfaceText(report, surface);
    for (const keyword of Array.isArray(keywords) ? keywords : []) {
      if (!text.includes(keyword.toLowerCase())) {
        const preview = text.slice(0, 80).replace(/\s+/g, " ");
        fail(
          "keyword-missing",
          `requiredKeyword 없음 [${surface}]: "${keyword}" — 실제: "${preview}…"`
        );
      }
    }
  }

  // ── [forbidden-phrase] forbiddenPhrasesBySurface ──────────────────────────────
  const forbiddenBySurface = expectations?.forbiddenPhrasesBySurface ?? {};
  for (const [surface, phrases] of Object.entries(forbiddenBySurface)) {
    const text = getSurfaceText(report, surface);
    for (const phrase of Array.isArray(phrases) ? phrases : []) {
      if (text.includes(phrase.toLowerCase())) {
        fail("forbidden-phrase", `forbiddenPhrase 감지 [${surface}]: "${phrase}"`);
      }
    }
  }

  // ── [generic] global generic pattern check ───────────────────────────────────
  for (const surface of GENERIC_CHECK_SURFACES) {
    const text = getSurfaceText(report, surface);
    for (const pattern of GLOBAL_GENERIC_PATTERNS) {
      if (text.includes(pattern.toLowerCase())) {
        fail("generic", `global generic 문구 감지 [${surface}]: "${pattern}"`);
      }
    }
  }

  // ── [duplicate] near-duplicate surface checks ────────────────────────────────
  const topRiskBody = topRisks[0]?.body ?? "";
  const whyFirst = Array.isArray(report?.whyThisRead) ? (report.whyThisRead[0] ?? "") : "";
  const jobSummary = report?.targetJobRead?.summary ?? report?.targetJobRead?.body ?? "";
  const indSummary = report?.targetIndustryRead?.summary ?? "";

  if (topRiskBody && whyFirst && isNearDup(topRiskBody, whyFirst)) {
    fail("duplicate", "whyThisRead[0]가 topRisk.body와 near-duplicate — surface 역할 분리 필요");
  }
  if (whyFirst && jobSummary && isNearDup(whyFirst, jobSummary)) {
    fail("duplicate", "targetJobRead.summary가 whyThisRead와 near-duplicate");
  }
  if (whyFirst && indSummary && isNearDup(whyFirst, indSummary)) {
    fail("duplicate", "targetIndustryRead.summary가 whyThisRead와 near-duplicate");
  }

  // ── [length] minSurfaceLengthByField (warning only) ──────────────────────────
  const minLengths = expectations?.minSurfaceLengthByField ?? {};
  for (const [surface, minLen] of Object.entries(minLengths)) {
    const text = getSurfaceText(report, surface);
    if (text.length < minLen) {
      warn(
        "length",
        `[${surface}] 텍스트 길이 부족: 기대 >= ${minLen}자, 실제: ${text.length}자`
      );
    }
  }

  return {
    pass: fails.length === 0,
    failReasons: fails,
    warningReasons: warnings,
  };
}

/**
 * 실행 결과에서 콘솔 출력용 한 줄 요약을 추출.
 */
export function extractOneLinerSurfaces(report) {
  const topRisks = Array.isArray(report?.topRisks) ? report.topRisks : [];
  const topRisk0 = topRisks[0] ?? null;

  const whyArr = Array.isArray(report?.whyThisRead) ? report.whyThisRead : [];
  const rawWhy = String(whyArr[0] ?? "");
  const whySummary = rawWhy
    ? rawWhy.slice(0, 60).replace(/\s+/g, " ").trim() + (rawWhy.length > 60 ? "…" : "")
    : "(없음)";

  const jobRead = report?.targetJobRead ?? {};
  const rawJob = String(jobRead.summary ?? jobRead.body ?? "");
  const jobSummary = rawJob
    ? rawJob.slice(0, 60).replace(/\s+/g, " ").trim() + (rawJob.length > 60 ? "…" : "")
    : "(없음)";

  const indRead = report?.targetIndustryRead ?? {};
  const rawInd = String(indRead.summary ?? "");
  const indSummary = rawInd
    ? rawInd.slice(0, 60).replace(/\s+/g, " ").trim() + (rawInd.length > 60 ? "…" : "")
    : "(없음)";

  return {
    topRiskKey: topRisk0?.key ?? "(none)",
    whySummary,
    jobSummary,
    indSummary,
  };
}

/**
 * failReasons 배열에서 category별 카운트를 반환.
 * @param {string[]} reasons
 * @returns {Record<string, number>}
 */
export function countByCategory(reasons) {
  const counts = {};
  for (const reason of reasons) {
    const m = reason.match(/^\[([^\]]+)\]/);
    const cat = m ? m[1] : "unknown";
    counts[cat] = (counts[cat] ?? 0) + 1;
  }
  return counts;
}
