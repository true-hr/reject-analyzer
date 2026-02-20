// FINAL PATCHED FILE: src/lib/analyzer.js
// NOTE: 공통 유틸은 coreUtils에서 import로만 사용 (중복 선언 금지)
import {
  clamp,
  normalizeScore01,
  scoreToLabel,
  safeToString,
  safeLower,
  uniq,
  escapeRegExp,
  clone,
} from "./coreUtils";
import { computeHiddenRisk } from "./hiddenRisk";
import { buildDecisionPack } from "./decision";
import { detectStructuralPatterns } from "./decision/structuralPatterns.js";

// ------------------------------
// FALLBACK HELPERS (crash-safe insurance)
// ------------------------------
// -----------------------------------------
// hireability score picker (crash-safe)
// - buildInterviewRiskLayer 등에서 사용
// - 정의 누락 시 전체 analyze가 죽는 걸 방지
// -----------------------------------------
function pickHireabilityScore100(input) {
  try {
    const obj = input && typeof input === "object" ? input : {};

    // 1) 가장 우선: hireabilityLayer.score100 / hireability.score100
    const a =
      obj?.hireabilityLayer?.score100 ??
      obj?.hireability?.score100 ??
      obj?.report?.hireabilityLayer?.score100 ??
      obj?.report?.hireability?.score100;

    if (Number.isFinite(a)) {
      return Math.max(0, Math.min(100, a));
    }

    // 2) objective.score100 기반 fallback
    const b = obj?.objective?.score100;
    if (Number.isFinite(b)) {
      return Math.max(0, Math.min(100, b));
    }

    // 3) objective.score01 기반 fallback
    const c = obj?.objective?.score01;
    if (Number.isFinite(c)) {
      return Math.max(0, Math.min(100, Math.round(c * 100)));
    }

    // 4) 최후 fallback (안전 기본값)
    return 50;
  } catch {
    return 50;
  }
}

function _normalizeDetectedIndustryRoleFallback({
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
}) {
  const safe = (v) => (v || "").toString().trim().toLowerCase();

  return {
    resumeIndustry: safe(detectedIndustry),
    jdIndustry: safe(detectedIndustry),
    role: safe(detectedRole),
  };
}

function _resolveCompanySizesFallback({
  resumeText,
  jdText,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,
}) {
  return {
    candidateSize: detectedCompanySizeCandidate || "",
    targetSize: detectedCompanySizeTarget || "",
  };
}

// ------------------------------
// SAFE BINDINGS (no-ReferenceError guarantees)
// - 절대 "존재하지 않는 식별자"를 직접 참조하지 않는다.
// - 외부(전역/다른 번들)에서 동일 함수가 주입되어도 안전하게 사용 가능
// ------------------------------
const normalizeDetectedIndustryRoleSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.normalizeDetectedIndustryRole === "function")
    ? globalThis.normalizeDetectedIndustryRole
    : _normalizeDetectedIndustryRoleFallback;

const resolveCompanySizesSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.resolveCompanySizes === "function")
    ? globalThis.resolveCompanySizes
    : _resolveCompanySizesFallback;

const countOwnershipEvidenceSafe =
  (typeof globalThis !== "undefined" &&
    globalThis &&
    typeof globalThis.countOwnershipEvidence === "function")
    ? globalThis.countOwnershipEvidence
    : _countOwnershipEvidenceImpl;

// ------------------------------
// AI helpers (optional / safe)
// ------------------------------
function normalizeStringArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => safeLower(s).trim()).filter(Boolean);
}

function getAiSynonymsMap(ai) {
  const raw = ai?.keywordSynonyms;
  if (!raw || typeof raw !== "object") return null;

  // key/values 모두 소문자 정규화
  const map = new Map();
  for (const [k, v] of Object.entries(raw)) {
    const key = safeLower(k).trim();
    if (!key) continue;
    const list = normalizeStringArray(v);
    if (list.length) map.set(key, list);
  }
  return map.size ? map : null;
}

// candidates를 "alias처럼" 확장: (기존 매칭 로직 유지) + AI 동의어만 추가
function expandCandidatesWithAiSynonyms(candidates, aiSynMap) {
  if (!aiSynMap) return candidates;

  const out = [];
  const seen = new Set();

  const push = (x) => {
    const s = safeLower(x).trim();
    if (!s) return;
    if (seen.has(s)) return;
    seen.add(s);
    out.push(s);
  };

  for (const c of candidates) {
    push(c);
    const key = safeLower(c).trim();
    const syns = aiSynMap.get(key);
    if (syns && syns.length) {
      for (const s of syns) push(s);
    }
  }

  return out;
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
// Must-have smarter checks (AI jdMustHave)
// - 문장 그대로 포함 여부가 아니라, "면접관식 해석"으로 충족 판정
// - 기존 구조/리포트는 유지하면서 hasKnockoutMissing 오탐을 줄인다.
// ------------------------------
function parseMinYearsFromText(s) {
  const t = (s || "").toString();
  // "5년 이상", "5년+", "5+ years"
  let m = t.match(/(\d+)\s*년\s*(이상|\+|\s*plus)?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  m = t.match(/(\d+)\s*\+\s*years?/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  // "~년 경력" 같은 표현
  m = t.match(/(\d+)\s*년\s*경력/i);
  if (m) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// 이력서 텍스트에서 총 경력(년)을 대략 합산
// - "4년", "2년 2개월" 등을 합산
// - 완벽하지 않아도 "문장 미일치로 경력 0 처리"되는 오탐을 줄이는 목적
function estimateTotalYearsFromResumeText(resumeText) {
  const t = (resumeText || "").toString();
  if (!t.trim()) return 0;

  // "2년 2개월"
  const ym = [...t.matchAll(/(\d+)\s*년\s*(\d+)\s*개월/g)].map((m) => ({
    y: Number(m[1]),
    mo: Number(m[2]),
  }));

  // "4년" (단독)
  // - 이미 "x년 y개월"에서 잡힌 y는 제외하기 위해 간단히 스팬 제거는 하지 않고,
  //   대신 '년' 단독 매치는 "년\s*\d+\s*개월" 패턴을 피해 잡히도록 약하게 제한
  const yOnly = [...t.matchAll(/(\d+)\s*년(?!\s*\d+\s*개월)/g)].map((m) => Number(m[1]));

  let months = 0;
  for (const a of ym) {
    if (Number.isFinite(a.y)) months += a.y * 12;
    if (Number.isFinite(a.mo)) months += a.mo;
  }
  for (const y of yOnly) {
    if (Number.isFinite(y)) months += y * 12;
  }

  // 너무 과대합산 방지(이력서에 중복 표기될 수 있으니 상한)
  // 현실적으로 40년 넘는 합산은 거의 오류로 보고 컷
  months = clamp(months, 0, 40 * 12);

  return months / 12;
}

function makeCandidateList(seed, aiSynMap) {
  const base = Array.isArray(seed) ? seed : [seed];
  const expanded = expandCandidatesWithAiSynonyms(base, aiSynMap);
  return uniq(expanded.map((s) => safeLower(s).trim()).filter(Boolean));
}

function anyMatch(tokens, text, candidates) {
  return candidates.some((c) => hasWord(tokens, c) || hasWord(text, c));
}

// must-have 항목을 "충족"으로 볼지 판정
function isMustHaveSatisfied(mustHave, resumeTokens, resumeText, aiSynMap) {
  const raw = (mustHave || "").toString().trim();
  if (!raw) return { ok: true, reason: "empty" };

  const mh = safeLower(raw);

  // 1) 연차 요구: "~년 이상" → 이력서 텍스트에서 총 연차 추정으로 판정
  const minYears = parseMinYearsFromText(raw);
  if (minYears !== null && /(경력|years?|experience)/i.test(mh)) {
    const estYears = estimateTotalYearsFromResumeText(resumeText);
    if (estYears >= minYears) {
      return { ok: true, reason: `years_ok(${estYears.toFixed(1)}>=${minYears})` };
    }
    // 연차 자체가 부족하면 진짜 누락으로 둔다
    return { ok: false, reason: `years_missing(${estYears.toFixed(1)}<${minYears})` };
  }

  // 2) 역할/직무류: "사업기획/전략기획"은 해석이 주관적이라
  //    - "전략", "기획", "사업운영", "마케팅 전략", "KPI", "사업계획" 등의 전이 시그널로 완화 판정
  if (/(사업기획|전략기획|사업\s*전략|strategy\s*planning)/i.test(mh)) {
    const roleCandidates = makeCandidateList(
      [
        "사업기획",
        "전략기획",
        "사업전략",
        "전략",
        "기획",
        "사업 운영",
        "사업운영",
        "운영",
        "마케팅 전략",
        "go-to-market",
        "gtm",
        "kpi",
        "사업계획",
        "연간 사업계획",
        "계획 수립",
        "전략 수립",
      ],
      aiSynMap
    );

    // 강한 매치(정확 표현)
    const strong = makeCandidateList(["사업기획", "전략기획", "사업전략"], aiSynMap);
    if (anyMatch(resumeTokens, resumeText, strong)) {
      return { ok: true, reason: "role_strong" };
    }

    // 전이 시그널 2개 이상이면 "완전 누락"으로 보지 않음
    const weakSignals = roleCandidates.filter((c) => anyMatch(resumeTokens, resumeText, [c]));
    if (weakSignals.length >= 2) {
      return { ok: true, reason: `role_transferrable(${weakSignals.slice(0, 4).join(",")})` };
    }

    // 전혀 힌트가 없으면 누락
    return { ok: false, reason: "role_missing" };
  }

  // 3) 손익(P/L) 분석: 표현 다양 → 동의어로 판정
  if (/(손익|p\/l|pl\s*분석|영업손익|profit\s*loss)/i.test(mh)) {
    const plCandidates = makeCandidateList(
      [
        "손익",
        "p/l",
        "pl",
        "손익 분석",
        "p/l 분석",
        "영업손익",
        "사업부 손익",
        "매출",
        "이익",
        "마진",
        "profit",
        "loss",
        "p&l",
      ],
      aiSynMap
    );

    // "매출 18% 증가" 같은 문장이 있으면 손익 그 자체는 아니지만,
    // 최소한 재무/성과 지표 기반 운영 감각이 있다는 신호로 약하게 인정.
    // 단, "손익/P&L" 직접 표현이 있으면 강하게 인정.
    const strong = makeCandidateList(["손익", "p/l", "p&l", "영업손익", "사업부 손익"], aiSynMap);
    if (anyMatch(resumeTokens, resumeText, strong)) {
      return { ok: true, reason: "pl_strong" };
    }

    const weak = plCandidates.filter((c) => anyMatch(resumeTokens, resumeText, [c]));
    if (weak.length >= 2) {
      return { ok: true, reason: `pl_weak(${weak.slice(0, 4).join(",")})` };
    }

    return { ok: false, reason: "pl_missing" };
  }

  // 4) 제조업/산업재 도메인: 도메인 힌트로 판정
  if (/(제조업|산업재|manufactur|factory|production|공장)/i.test(mh)) {
    const domainCandidates = makeCandidateList(
      [
        "제조",
        "제조업",
        "생산",
        "공장",
        "품질",
        "납기",
        "리드타임",
        "공정",
        "설비",
        "원가",
        "재고",
        "공급망",
        "scm",
        "supply chain",
        "산업재",
        "b2b",
      ],
      aiSynMap
    );

    if (anyMatch(resumeTokens, resumeText, domainCandidates)) {
      return { ok: true, reason: "domain_hint" };
    }
    return { ok: false, reason: "domain_missing" };
  }

  // 5) 그 외: 기존처럼 "표현 포함"으로 판정하되 AI 동의어를 보조로 사용
  // - mustHave 문장 자체가 길면, 핵심 키워드만 뽑아서 매칭(오탐 방지)
  const compact = mh
    .replace(/\([^)]*\)/g, " ")
    .replace(/[\[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = tokenize(compact).slice(0, 8); // 너무 길면 앞부분만
  const candidates = makeCandidateList([raw, ...tokens], aiSynMap);

  const ok = anyMatch(resumeTokens, resumeText, candidates);
  return { ok, reason: ok ? "generic_ok" : "generic_missing" };
}

// ------------------------------
// Major/Education signals (optional / safe)
// - 목적: 전공이 중요한 JD에서는 유사 전공을 소폭 가산(A) + 가설 우선순위(B) 반영
// - 원칙: JD가 중요 신호를 줄 때만 영향이 커짐 / 정보 부족 시 추측하지 않음(0 처리)
// ------------------------------
function getCandidateMajorFromStateOrAi(state, ai) {
  const sMajor = state?.profile?.major ?? state?.education?.major ?? state?.candidate?.major;
  const aMajor = ai?.profileExtract?.major ?? ai?.candidateProfile?.major;
  const major = (sMajor ?? aMajor ?? "").toString().trim();
  return major;
}

function parseMajorImportanceFromJD(jd) {
  const t = safeLower(jd);

  let imp = 0.15;

  // (A) 전공/학위 명시 요구
  const hasMajorWord = /(전공|관련\s*학과|관련학과|학과|major)/i.test(t);
  const hasDegreeWord = /(학사|석사|박사|학위|degree|master|ph\.?d|bachelor)/i.test(t);

  const explicitRequired = /(전공\s*(필수|required)|관련\s*학과\s*(필수|required)|학위\s*(필수|required)|석사\s*이상|박사\s*우대|박사\s*이상|required\s*degree)/i.test(t);
  const explicitPreferred = /(전공\s*(우대|선호|preferred)|관련\s*학과\s*(우대|선호)|학위\s*(우대|선호)|석사\s*우대|학사\s*이상)/i.test(t);

  if (explicitRequired) imp += 0.55;
  else if (explicitPreferred) imp += 0.35;
  else if (hasMajorWord || hasDegreeWord) imp += 0.22;

  // (B) 직무 성격상 전공 게이트가 자주 존재하는 영역
  const hasRndStrong = /(연구|r&d|rnd|개발|설계|회로|공정|소자|실험|시험|검증|모델링|알고리즘|논문|특허|전산유체|finite element|fea|cfd)/i.test(t);
  const hasDataResearch = /(데이터|data|분석|analytics|리서치|research|통계|statistics|모델|model|머신러닝|machine learning|ml|딥러닝|deep learning)/i.test(t);

  if (hasRndStrong) imp += 0.35;
  else if (hasDataResearch) imp += 0.25;

  // (C) 전공 영향이 낮은 직무군(명시 요구가 없을 때만 완화)
  const hasLowMajorFamily = /(영업|sales|bd|bizdev|마케팅|marketing|브랜딩|brand|cs|cx|고객|커뮤니티|community)/i.test(t);
  if (!explicitRequired && !explicitPreferred && hasLowMajorFamily) {
    imp -= 0.2;
  }

  return clamp(imp, 0, 1);
}

function inferJobFamilyFromJD(jd) {
  const t = safeLower(jd);

  const isRnd =
    /(연구|r&d|rnd|개발|설계|회로|공정|소자|실험|시험|검증|모델링|알고리즘|embedded|firmware|기구설계|hw|hardware|sw|software)/i.test(t);

  const isData =
    /(데이터|data|분석|analytics|리서치|research|통계|statistics|모델|model|머신러닝|machine learning|ml|딥러닝|deep learning|ai\b)/i.test(t);

  const isOps =
    /(생산|품질|공정관리|scm|supply chain|구매|자재|납기|리드타임|물류|ops|operation|manufactur|factory|설비)/i.test(t);

  const isBiz =
    /(전략|사업기획|기획|pm\b|product manager|서비스기획|사업개발|go-to-market|gtm|kpi|okr|market|시장분석)/i.test(t);

  const isSales =
    /(영업|sales|bd|bizdev|마케팅|marketing|crm|퍼포먼스|growth|브랜딩|brand)/i.test(t);

  if (isRnd) return "RND_ENGINEERING";
  if (isData) return "DATA_RESEARCH";
  if (isOps) return "OPS_MANUFACTURING";
  if (isSales) return "SALES_MARKETING";
  if (isBiz) return "BIZ_STRATEGY";
  return "UNKNOWN";
}

function mapMajorTextToCluster(majorText) {
  const m = safeLower(majorText);

  if (!m.trim()) return "";

  // 공학/IT
  if (/(전기|전자|정보통신|통신공학|반도체|제어|로봇(공학)?|전장|electrical|electronics|ee)/i.test(m)) return "EE";
  if (/(컴퓨터|소프트웨어|전산|정보(공학)?|ai|인공지능|데이터|data science|cs\b|computer science|software)/i.test(m)) return "CS";
  if (/(기계|조선|해양|항공|자동차|산업공학|생산공학|systems?|mechanical|me\b)/i.test(m)) return "ME";
  if (/(화학|화공|재료|신소재|고분자|ceramic|materials?|chemical)/i.test(m)) return "CHE";
  if (/(토목|건축|도시|환경(공학)?|civil|architecture)/i.test(m)) return "CE";

  // 경영/사회/인문
  if (/(경영|회계|재무|경영정보|mba|business|accounting|finance)/i.test(m)) return "BIZ";
  if (/(경제|통계|수학|금융공학|퀀트|economics|statistics|math|quant)/i.test(m)) return "QUANT";
  if (/(디자인|산업디자인|시각디자인|ux|ui|hci|design)/i.test(m)) return "DESIGN";
  if (/(생명|바이오|약학|의학|간호|biolog|bio|pharm|medical|nursing)/i.test(m)) return "BIO";

  return "";
}

function extractRequiredMajorHintsFromJD(jd) {
  const t = (jd || "").toString();
  if (!t.trim()) return [];

  const hints = [];

  // "전공: OOO", "전공 OO 우대" 같은 케이스
  const m1 = t.match(/전공\s*[:：]\s*([^\n\r,;/]{2,40})/);
  if (m1?.[1]) hints.push(m1[1]);

  // "관련학과: OOO", "관련 학과 OOO" 같은 케이스
  const m2 = t.match(/관련\s*학과\s*[:：]?\s*([^\n\r,;/]{2,40})/);
  if (m2?.[1]) hints.push(m2[1]);

  // "OO 전공" 근처 단어를 보조로 잡기(과한 추측 방지: 짧은 토큰만)
  const near = [...t.matchAll(/([가-힣A-Za-z&· ]{2,30})\s*(전공|학과)/g)].map((m) => m[1]);
  for (const x of near) hints.push(x);

  return uniq(hints.map((s) => s.toString().trim()).filter(Boolean)).slice(0, 6);
}

function isMajorExplicitRequiredInJD(jd) {
  const t = safeLower(jd);
  return /(전공\s*(필수|required)|관련\s*학과\s*(필수|required)|학위\s*(필수|required)|석사\s*이상|박사\s*이상|required\s*degree)/i.test(t);
}

function inferRequiredMajorClusters({ jd, ai }) {
  // AI 보조 힌트(있으면 사용하되, 없으면 JD 룰 기반만 사용)
  const aiHints = normalizeStringArray(ai?.requiredMajorHints);
  const jdHints = extractRequiredMajorHintsFromJD(jd);
  const merged = uniq([
    ...aiHints,
    ...jdHints.map((x) => safeLower(x)),
  ]).slice(0, 8);

  const clusters = [];
  for (const h of merged) {
    const c = mapMajorTextToCluster(h);
    if (c) clusters.push(c);
  }
  return uniq(clusters);
}

function calcMajorSimilarityByFamily(candidateCluster, requiredClusters, jobFamily) {
  if (!candidateCluster || !Array.isArray(requiredClusters) || requiredClusters.length === 0) return 0;

  // exact match
  if (requiredClusters.includes(candidateCluster)) return 1;

  // adjacency by job family (유동)
  const adj = {
    RND_ENGINEERING: {
      EE: ["CHE", "CS"],
      CHE: ["EE"],
      CS: ["EE"],
      ME: ["CE", "EE"], // 제한적 인접
      CE: ["ME"],
      BIZ: [],
      QUANT: ["CS"],
      DESIGN: [],
      BIO: ["CHE"],
    },
    DATA_RESEARCH: {
      CS: ["QUANT", "BIZ", "EE"],
      QUANT: ["CS", "BIZ"],
      BIZ: ["QUANT", "CS"],
      EE: ["CS"],
      ME: ["CS"],
      CHE: ["CS"],
      CE: ["CS"],
      DESIGN: ["CS"],
      BIO: ["CS", "CHE"],
    },
    OPS_MANUFACTURING: {
      ME: ["BIZ", "CE", "CHE"],
      BIZ: ["ME", "QUANT"],
      CE: ["ME"],
      CHE: ["ME"],
      EE: ["ME"],
      CS: ["ME"],
      QUANT: ["BIZ"],
      DESIGN: [],
      BIO: ["CHE"],
    },
    BIZ_STRATEGY: {
      BIZ: ["QUANT", "CS"],
      QUANT: ["BIZ", "CS"],
      CS: ["BIZ", "QUANT"],
      EE: ["CS"],
      ME: ["BIZ"],
      CHE: ["BIZ"],
      CE: ["BIZ"],
      DESIGN: ["BIZ"],
      BIO: ["BIZ"],
    },
    SALES_MARKETING: {
      // 전공 자체 영향이 낮은 편이라 adjacency는 의미가 적음(유사도는 낮게 유지)
      BIZ: ["DESIGN", "QUANT", "CS"],
      DESIGN: ["BIZ"],
      QUANT: ["BIZ"],
      CS: ["BIZ"],
      EE: [],
      ME: [],
      CHE: [],
      CE: [],
      BIO: [],
    },
    UNKNOWN: {},
  };

  const table = adj[jobFamily] || adj.UNKNOWN || {};
  const neighbors = table[candidateCluster] || [];

  // if any required cluster is neighbor => 0.6, else 0
  for (const r of requiredClusters) {
    if (neighbors.includes(r)) return 0.6;
  }
  return 0;
}

function buildMajorSignals({ jd, resume, state, ai, keywordSignals, resumeSignals }) {
  const candidateMajor = getCandidateMajorFromStateOrAi(state, ai);
  const candidateCluster = mapMajorTextToCluster(candidateMajor);

  const majorImportance = parseMajorImportanceFromJD(jd);
  const jobFamily = inferJobFamilyFromJD(jd);

  const requiredClusters = inferRequiredMajorClusters({ jd, ai });
  const majorSimilarity = calcMajorSimilarityByFamily(candidateCluster, requiredClusters, jobFamily);

  const explicitRequired = isMajorExplicitRequiredInJD(jd);

  // objectiveScore에 소폭 반영(A)
  // - 전공이 중요하지 않으면 사실상 0에 가깝게
  // - 전공이 매우 중요해도 cap은 작게 유지(설명가능성 우선)
  const majorBonusCap = majorImportance >= 0.75 ? 0.07 : 0.05;
  let majorBonus = majorSimilarity * majorImportance * majorBonusCap;

  // 필수요건(knockout)이 이미 있는 경우, 전공 보너스가 체감상 역전하지 않도록 약화
  if (keywordSignals?.hasKnockoutMissing) {
    majorBonus *= 0.3;
  }

  majorBonus = normalizeScore01(majorBonus); // 0~1 범위 보장(실제론 0~0.07)

  const noteParts = [];
  if (candidateMajor && !candidateCluster) noteParts.push("전공 텍스트는 있으나 전공군 분류가 어려움");
  if (!candidateMajor) noteParts.push("이력서/입력에서 전공 정보를 찾지 못함");
  if (requiredClusters.length === 0 && majorImportance >= 0.55) noteParts.push("JD에서 요구 전공 힌트를 안정적으로 추출하지 못함");

  // (B) 가설 판단에 사용할 “브릿지 가능성” 힌트(과신 방지용)
  // - 전공은 다르지만, JD 키워드 매칭/성과증거가 강하면 bridge로 해석 가능
  const kwStrong = (keywordSignals?.matchScore ?? 0) >= 0.6;
  const proofStrong = (resumeSignals?.resumeSignalScore ?? 0) >= 0.7;
  const bridgeHint = kwStrong || proofStrong;

  return {
    majorImportance,
    jobFamily,
    explicitMajorRequired: explicitRequired,
    candidateMajor,
    candidateCluster,
    requiredClusters,
    majorSimilarity,
    majorBonus, // 0~0.07 수준
    bridgeHint,
    note: noteParts.length ? noteParts.join(" / ") : null,
  };
}

// ------------------------------
// Keyword dictionary (with critical)
// - critical: true = "없으면 서류 컷" 성격의 must-have
// ------------------------------
const SKILL_DICTIONARY = [
  // dev / data (예시)
  { kw: "javascript", alias: ["js"], critical: false },
  { kw: "typescript", alias: ["ts"], critical: false },
  { kw: "react", alias: [], critical: true }, // ✅ must-have 후보
  { kw: "node", alias: ["node.js"], critical: false },
  { kw: "next.js", alias: ["nextjs", "next"], critical: false },
  { kw: "python", alias: [], critical: true }, // ✅ must-have 후보
  { kw: "java", alias: [], critical: false },
  { kw: "sql", alias: [], critical: true }, // ✅ must-have 후보

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
];

// JD에서 등장한 키워드만 뽑고, Resume에 있는지 검사
export function buildKeywordSignals(jd, resume, ai = null) {
  const jdText = safeLower(jd);
  const resumeText = safeLower(resume);

  const jdTokens = tokenize(jdText);
  const resumeTokens = tokenize(resumeText);

  const aiSynMap = getAiSynonymsMap(ai);

  // JD에 등장한 키워드 탐지
  const hitsInJD = [];
  for (const item of SKILL_DICTIONARY) {
    // 기존 candidates 유지 + AI synonym을 alias처럼 확장
    const baseCandidates = [item.kw, ...(item.alias || [])];
    const candidates = expandCandidatesWithAiSynonyms(baseCandidates, aiSynMap);

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

    // 기존 candidates 유지 + AI synonym을 alias처럼 확장
    const baseCandidates = [kw, ...((dict && dict.alias) || [])];
    const candidates = expandCandidatesWithAiSynonyms(baseCandidates, aiSynMap);

    const ok = candidates.some((c) => hasWord(resumeTokens, c) || hasWord(resumeText, c));
    if (ok) matched.push(kw);
    else missing.push(kw);
  }

  // ✅ Knockout(critical) 누락 탐지
  const jdCritical = jdKeywords.filter((kw) => {
    const dict = SKILL_DICTIONARY.find((x) => x.kw === kw);
    return Boolean(dict?.critical);
  });

  // ✅ AI 보조: JD must-have를 "critical 후보"로 추가 (기존 dictionary 로직은 그대로 유지)
  // - matchScore 계산/기존 매칭 로직은 건드리지 않고,
  //   "필수요건 누락(hasKnockoutMissing)" 판단만 보강한다.
  const aiMustHave = normalizeStringArray(ai?.jdMustHave);

  // 🔥 변경 핵심:
  // 기존: mustHave 문자열이 resume에 "그대로" 없으면 누락 처리 → 오탐 많음
  // 개선: mustHave 타입(연차/직무/손익/도메인)을 해석해서 충족 판정
  const missingAiMustHave = [];
  for (const mh of aiMustHave) {
    const r = isMustHaveSatisfied(mh, resumeTokens, resumeText, aiSynMap);
    if (!r.ok) missingAiMustHave.push(mh);
  }

  const missingCritical = uniq([
    ...jdCritical.filter((kw) => !matched.includes(kw)),
    ...missingAiMustHave,
  ]);

  const jdCriticalFinal = uniq([...jdCritical, ...aiMustHave]);
  const hasKnockoutMissing = missingCritical.length > 0;

  if (jdKeywords.length === 0) {
    return {
      matchScore: 0.35,
      matchedKeywords: [],
      missingKeywords: [],
      jdKeywords: [],
      reliability,
      jdCritical: jdCriticalFinal,
      missingCritical,
      hasKnockoutMissing,
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
    jdCritical: jdCriticalFinal,
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
    /\d{1,3}(,\d{3})+/g,        // 1,200
    /\d+(\.\d+)?\s*%/g,         // 12%
    /\d+(\.\d+)?\s*(배|x)\b/gi, // 3배, 2x
    /\d+\s*(억|만|천)\b/g,      // 10억, 20만
    /\d+\s*(개월|주|일)\b/g,    // 3개월
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
// - majorBonus (optional) 소폭 반영
// ------------------------------
function buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals = null }) {
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

  // ✅ major bonus (A): JD가 전공을 중요하게 보며, 유사 전공이면 "소폭" 가산
  // - 과신 방지: cap은 매우 작게 유지(최대 0.07 수준)
  const majorBonus = Number(majorSignals?.majorBonus ?? 0) || 0;
  if (majorBonus > 0) {
    objectiveScore = normalizeScore01(objectiveScore + majorBonus);
  }

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
      // major parts (optional)
      majorBonus,
      majorSimilarity: Number(majorSignals?.majorSimilarity ?? 0) || 0,
      majorImportance: Number(majorSignals?.majorImportance ?? 0) || 0,
      jobFamily: (majorSignals?.jobFamily || "").toString(),
      majorNote: majorSignals?.note ?? null,
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
export function buildHypotheses(state, ai = null) {
  const stage = (state?.stage || "서류").toString();

  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const { objectiveScore, parts } = buildObjectiveScore({
    keywordSignals,
    careerSignals,
    resumeSignals,
    majorSignals,
  });

  const conflictPenalty = calcConflictPenalty({
    keywordSignals,
    careerSignals,
    selfCheck: state?.selfCheck,
  });

  // ------------------------------
  // Structure analysis (append-only)
  // - 기존 score/priority 로직 훼손 금지: 추가 필드만 생성
  // ------------------------------
  const _structurePack = buildStructureAnalysis({
    resumeText: state?.resume || "",
    jdText: state?.jd || "",
    detectedIndustry: (ai?.detectedIndustry ?? ai?.industry ?? state?.industry ?? "").toString(),
    detectedRole: (ai?.detectedRole ?? ai?.role ?? state?.role ?? "").toString(),
    detectedCompanySizeCandidate: (ai?.detectedCompanySizeCandidate ?? ai?.companySizeCandidate ?? state?.companySizeCandidate ?? "").toString(),
    detectedCompanySizeTarget: (ai?.detectedCompanySizeTarget ?? ai?.companySizeTarget ?? state?.companySizeTarget ?? "").toString(),
  });

  const structureAnalysis = _structurePack.structureAnalysis;
  const structureSummaryForAI = _structurePack.structureSummaryForAI;

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

    // ✅ 전공/유사 전공 가설(B): JD가 전공을 중요하게 볼 때만 우선순위에 반영
    // - 단정 금지: 정보 부족이면 confidence를 낮추고, "확인/보강" 액션으로 유도
    const majorImp = majorSignals.majorImportance ?? 0;
    const majorSim = majorSignals.majorSimilarity ?? 0;
    const explicitMajorRequired = Boolean(majorSignals.explicitMajorRequired);
    const hasCandidateMajor = Boolean((majorSignals.candidateMajor || "").toString().trim());
    const hasRequiredMajorHints = Array.isArray(majorSignals.requiredClusters) && majorSignals.requiredClusters.length > 0;

    if (majorImp >= 0.55) {
      const mismatchLike = (!hasCandidateMajor && explicitMajorRequired) || (hasCandidateMajor && hasRequiredMajorHints && majorSim <= 0.3);
      const bridgeLike =
        hasCandidateMajor &&
        hasRequiredMajorHints &&
        majorSim > 0.3 &&
        majorSim < 0.8 &&
        Boolean(majorSignals.bridgeHint);

      if (mismatchLike) {
        const conf =
          explicitMajorRequired
            ? (hasCandidateMajor && hasRequiredMajorHints ? 0.72 : 0.55)
            : (hasCandidateMajor && hasRequiredMajorHints ? 0.58 : 0.45);

        const candMajorText = hasCandidateMajor ? majorSignals.candidateMajor : "(미탐지)";
        const reqClustersText = hasRequiredMajorHints ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)";

        hyps.push(
          makeHypothesis({
            id: "major-mismatch",
            title: "전공/학력 요건 게이트 가능성(전공 정합성 리스크)",
            why:
              "일부 직무/산업(연구·개발·공정·설계·리서치 등)은 전공/학위가 ‘최초 게이트’로 작동하는 경우가 있습니다. JD에서 전공/학위 신호가 강한데 전공 정합성이 낮거나(또는 정보가 불충분하면), 서류 초반에 리스크로 해석될 수 있습니다.",
            signals: [
              `전공 중요도(추정): ${Math.round(majorImp * 100)}/100 · 직무군: ${majorSignals.jobFamily}`,
              `지원자 전공: ${candMajorText}`,
              `JD 요구 전공군(추정): ${reqClustersText}`,
              hasCandidateMajor && hasRequiredMajorHints ? `전공 유사도(전공군 기준): ${Math.round(majorSim * 100)}/100` : "전공 비교 정보가 부족함(추측하지 않음)",
              majorSignals.note ? `메모: ${majorSignals.note}` : null,
            ].filter(Boolean),
            impact: clamp(0.75 + 0.2 * majorImp, 0, 0.95),
            confidence: conf,
            evidenceBoost: explicitMajorRequired ? 0.08 : 0.04,
            actions: [
              "전공이 다르다면 ‘대체 증거’로 상쇄: 관련 프로젝트/과제/실험/설계/리서치 산출물을 1~2개로 압축해 링크/요약 첨부",
              "JD가 전공/학위를 명시(필수)했다면: 이력서 상단 요약에 ‘관련 과목/도메인 경험’ 1줄로 게이트를 먼저 방어",
              "전공 정보가 이력서에서 추출되지 않았다면: 학력/전공 라인을 명확히 표기(또는 텍스트 붙여넣기/추가 입력)해서 오해 가능성을 줄이기",
            ],
            counter:
              "일부 팀은 전공보다 실무 성과/포텐셜을 우선하는 경우도 있습니다. 다만 JD에서 전공/학위 요구가 강하게 드러나면, 초기 스크리닝에서 리스크로 작동할 확률이 올라갑니다.",
          })
        );
      } else if (bridgeLike) {
        const candMajorText = hasCandidateMajor ? majorSignals.candidateMajor : "(미탐지)";
        const reqClustersText = hasRequiredMajorHints ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)";

        hyps.push(
          makeHypothesis({
            id: "major-bridge",
            title: "유사 전공/전이 역량으로 전공 리스크를 상쇄할 여지",
            why:
              "전공이 100% 일치하지 않더라도, 유사 전공이거나(또는 실무 증거가 강하면) 전공 리스크는 상쇄될 수 있습니다. 중요한 건 ‘전공이 다르다’가 아니라 ‘이 JD 업무를 해낼 증거가 있냐’로 설득 구조를 만드는 것입니다.",
            signals: [
              `전공 중요도(추정): ${Math.round(majorImp * 100)}/100 · 직무군: ${majorSignals.jobFamily}`,
              `지원자 전공: ${candMajorText}`,
              `JD 요구 전공군(추정): ${reqClustersText}`,
              `전공 유사도(전공군 기준): ${Math.round(majorSim * 100)}/100`,
              `키워드 매칭: ${Math.round(keywordSignals.matchScore * 100)}/100 · 증거 강도: ${Math.round(resumeSignals.resumeSignalScore * 100)}/100`,
            ],
            impact: clamp(0.55 + 0.25 * majorImp, 0, 0.85),
            confidence: 0.62,
            evidenceBoost: 0.06,
            actions: [
              "‘전공은 X지만, Y 역량/프로젝트로 Z 업무를 수행했다’ 문장을 요약 1줄로 고정",
              "JD 핵심 업무 2개를 골라 ‘전공과 무관하게 재현 가능한 결과물’(케이스/포트폴리오/미니 프로젝트)로 제시",
              "면접 대비: 전공 질문이 나올 걸 가정하고 ‘전공 불일치 → 왜 문제 아님 → 증거’ 순서로 30초 답변 준비",
            ],
            counter:
              "전공/학위를 강하게 명시한 JD(특히 연구/공정/설계)는 예외가 적을 수 있어, 지원 전략에서 ‘전공 요구가 낮은 JD 병행’이 실용적입니다.",
          })
        );
      }
    }

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
    let confidence = clamp(h.confidence * selfMod + h.evidenceBoost, 0, 1);

    // ✅ AI 보조: 가설별 confidence만 미세 보정 (priority 공식은 그대로 유지)
    // 요구사항: 이 로직 라인은 유지
    const deltaRaw = ai?.confidenceDeltaByHypothesis?.[h.id] ?? 0;
    const delta = clamp(Number(deltaRaw) || 0, -0.15, 0.15);
    confidence = clamp(confidence + delta, 0, 1);

    const basePriority = h.impact * confidence * objectiveScore;

    return {
      ...h,
      confidence,
      objectiveScore,
      objectiveParts: parts,
      conflictPenalty,
      correlationBoost: 1,
      priority: basePriority,
      // append-only fields for AI/use-cases
      structureAnalysis,
      structureSummaryForAI,
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
export function buildReport(state, ai = null) {
  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const hyps = buildHypotheses(state, ai);

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });

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

  const majorBlock =
    `[전공/학력(추정)]
- 전공 중요도(추정): ${Math.round((majorSignals.majorImportance ?? 0) * 100)}/100 · 직무군: ${majorSignals.jobFamily}
- 지원자 전공: ${(majorSignals.candidateMajor || "").toString().trim() ? majorSignals.candidateMajor : "(미탐지)"}
- JD 요구 전공군(추정): ${Array.isArray(majorSignals.requiredClusters) && majorSignals.requiredClusters.length ? majorSignals.requiredClusters.join(", ") : "(탐지 실패)"}
- 전공 유사도(전공군 기준): ${Math.round((majorSignals.majorSimilarity ?? 0) * 100)}/100
- 전공 보너스(소폭, 합성 반영): ${Math.round((majorSignals.majorBonus ?? 0) * 100)}/100
${majorSignals.note ? `- 메모: ${majorSignals.note}\n` : ""}
`;

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

  // ------------------------------
  // AI append-only sections (optional)
  // - 기존 report 구조 변경 금지: 마지막에만 덧붙임
  // ------------------------------
  let aiAppend = "";

  const bullets = ai?.suggestedBullets;
  if (Array.isArray(bullets) && bullets.length) {
    aiAppend += "\n[추천 이력서 문장 개선]\n";
    aiAppend += bullets
      .slice(0, 8)
      .map((b, i) => {
        const before = (b?.before || "").toString().trim();
        const after = (b?.after || "").toString().trim();
        const why = (b?.why || "").toString().trim();

        return (
          `${i + 1})\n` +
          `- Before: ${before || "(없음)"}\n` +
          `- After: ${after || "(없음)"}\n` +
          `- Why: ${why || "-"}\n`
        );
      })
      .join("\n");
  }

  const conflicts = ai?.conflicts;
  if (Array.isArray(conflicts) && conflicts.length) {
    aiAppend += "\n[논리 충돌 / 위험 신호]\n";
    aiAppend += conflicts
      .slice(0, 8)
      .map((c, i) => {
        const type = (c?.type || "").toString().trim();
        const evidence = (c?.evidence || "").toString().trim();
        const explanation = (c?.explanation || "").toString().trim();
        const fix = (c?.fix || "").toString().trim();

        return (
          `${i + 1}) ${type || "(유형 미상)"}\n` +
          `- 근거: ${evidence || "-"}\n` +
          `- 설명: ${explanation || "-"}\n` +
          `- 수정/대응: ${fix || "-"}\n`
        );
      })
      .join("\n");
  }

  return header + objectiveBlock + majorBlock + keywordBlock + disclaimer + "[핵심 가설]\n\n" + body + next + aiAppend;
}

// ------------------------------
// Structure analysis (rule engine)
// - 기업 규모 적합성 + 벤더/협력사 경력 가치 + ownership 수준 + 산업 구조 적합성
// - 룰: 기준선(score+flags) / AI: 예외 판단 + 설명 담당
// ------------------------------
function normalizeStructureFlagList(flags) {
  return uniq((flags || []).map((x) => (x || "").toString().trim()).filter(Boolean));
}

function score100(n) {
  return clamp(Math.round(Number(n) || 0), 0, 100);
}

function labelFrom100(n) {
  const x = Number(n) || 0;
  if (x >= 75) return "HIGH";
  if (x >= 45) return "MEDIUM";
  return "LOW";
}

function inferIndustryFromText(text, fallback = "") {
  const t = safeLower(text);

  // 반도체
  if (/(반도체|semiconductor|fab|foundry|hbm|dram|nand|패키징|package|wafer|웨이퍼|공정|소자)/i.test(t)) return "semiconductor";
  // 자동차
  if (/(자동차|automotive|oem|tier\s*1|tier1|전장|ivs|adas|powertrain|car\b)/i.test(t)) return "automotive";
  // 이커머스/리테일
  if (/(이커머스|e-?commerce|커머스|리테일|retail|마켓플레이스|marketplace)/i.test(t)) return "commerce";
  // 금융
  if (/(금융|bank|banking|보험|insurance|핀테크|fintech|증권|securities)/i.test(t)) return "finance";
  // 게임
  if (/(게임|game|gaming|unity|unreal|mmorpg|모바일\s*게임)/i.test(t)) return "game";
  // SaaS/IT
  if (/(saas|b2b\s*saas|클라우드|cloud|platform|플랫폼|api|devops)/i.test(t)) return "saas";
  // 제조/산업재
  if (/(제조|manufactur|factory|생산|공장|산업재|industrial)/i.test(t)) return "manufacturing";

  return (fallback || "").toString().trim();
}

function normalizeCompanySizeText(s) {
  const t = safeLower(s).trim();
  if (!t) return "";

  if (/(startup|스타트업|seed|series\s*a|series\s*b|초기|scale-?up|스케일업)/i.test(t)) return "startup";
  if (/(smb|small|중소|벤처|small\s*business)/i.test(t)) return "smb";
  if (/(mid|중견|middle|중견기업)/i.test(t)) return "mid";
  if (/(large|enterprise|대기업|그룹사|상장\s*대기업|대형)/i.test(t)) return "large";

  // 숫자/인원/매출 기반 단순 힌트(대략)
  // "직원 50명" / "200명" / "1000명"
  const m = t.match(/(\d{2,6})\s*(명|people|employees)/i);
  if (m?.[1]) {
    const n = Number(m[1]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  return t;
}

function inferCompanySizeFromText(text) {
  const t = safeLower(text);

  if (/(대기업|그룹사|enterprise|large company|대형\s*기업|상장\s*대기업)/i.test(t)) return "large";
  if (/(중견|mid-?size|mid size|middle\s*size|중견기업)/i.test(t)) return "mid";
  if (/(중소|sme|smb|small\s*business|벤처(기업)?)/i.test(t)) return "smb";
  if (/(스타트업|startup|seed|series\s*a|series\s*b|early-?stage|초기|스케일업|scale-?up)/i.test(t)) return "startup";

  // 직원수 힌트
  const m = t.match(/(직원|임직원|headcount|employees)\s*[:：]?\s*(\d{2,6})/i);
  if (m?.[2]) {
    const n = Number(m[2]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  // "xx명 규모" 힌트
  const m2 = t.match(/(\d{2,6})\s*명\s*(규모|scale)/i);
  if (m2?.[1]) {
    const n = Number(m2[1]);
    if (Number.isFinite(n)) {
      if (n < 80) return "startup";
      if (n < 300) return "smb";
      if (n < 2000) return "mid";
      return "large";
    }
  }

  return "";
}

function companySizeRank(size) {
  const s = normalizeCompanySizeText(size);
  if (s === "startup") return 1;
  if (s === "smb") return 2;
  if (s === "mid") return 3;
  if (s === "large") return 4;
  return 0;
}

function companySizeLabel(size) {
  const s = normalizeCompanySizeText(size);
  if (s === "startup") return "STARTUP";
  if (s === "smb") return "SMB";
  if (s === "mid") return "MID";
  if (s === "large") return "LARGE";
  return "UNKNOWN";
}

const OWNERSHIP_KEYWORDS = [
  "리드",
  "주도",
  "설계",
  "구축",
  "런칭",
  "0에서",
  "end-to-end",
  "총괄",
  "책임",
];

function _countOwnershipEvidenceImpl(text) {
  const t = safeLower(text);
  if (!t.trim()) return { count: 0, hits: [] };

  const hits = [];
  for (const kw of OWNERSHIP_KEYWORDS) {
    const k = safeLower(kw);
    if (!k.trim()) continue;
    if (t.includes(k)) hits.push(kw);
  }

  return { count: uniq(hits).length, hits: uniq(hits) };
}

import { ROLE_RULES } from "./roleDictionary";

/**
 * 역할 추론(세분 role + family 동시 지원)
 * - roleDictionary의 각 rule은 { role, strong, weak, negative } 기본을 유지
 * - 추가로 { family }가 있으면 "familyRole"로 저장
 * - 기존 사용처 안전을 위해 inferRoleFromText()는 문자열을 반환(기본: family -> 없으면 role)
 */
function inferRoleFromText(text, fallback) {
  const d = inferRoleFromTextDetailed(text, fallback);

  // ✅ 기존 구조/사용처 안전: 문자열 반환 유지
  // - roleDictionary가 세분화되더라도, analyzer 내부의 /engineering|strategy|.../ 같은 정규식이
  //   계속 동작하도록 family가 있으면 family를 우선 반환한다.
  return (d.familyRole || d.fineRole || (fallback || "").toString()).toString();
}

function inferRoleFromTextDetailed(text, fallback) {
  const t = safeLower(text || "");

  let bestRule = null;
  let bestScore = 0;

  for (const r of ROLE_RULES) {
    let score = 0;

    // strong: +3, weak: +1
    for (const k of r.strong || []) if (t.includes(k)) score += 3;
    for (const k of r.weak || []) if (t.includes(k)) score += 1;

    // negative: -2
    for (const k of r.negative || []) if (t.includes(k)) score -= 2;

    if (score > bestScore) {
      bestScore = score;
      bestRule = r;
    }
  }

  // 확신 없으면 unknown (틀리게 찍는 것 방지)
  const ok = bestScore >= 3 && bestRule && bestRule.role;

  const fineRole = ok ? (bestRule.role || "").toString() : (fallback || "").toString();
  const familyRole = ok ? (bestRule.family || "").toString() : "";

  return {
    fineRole,
    familyRole,
    score: bestScore,
  };
}

function applyStructureRuleEngine({
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,
}) {
  const flags = [];
  const addFlag = (f) => {
    const s = (f || "").toString().trim();
    if (!s) return;
    flags.push(s);
  };

  const { resumeIndustry, jdIndustry, role } = normalizeDetectedIndustryRoleSafe({
    resumeText,
    jdText,
    detectedIndustry,
    detectedRole,
  });

  const { candidateSize, targetSize } = resolveCompanySizesSafe({
    resumeText,
    jdText,
    detectedCompanySizeCandidate,
    detectedCompanySizeTarget,
  });

  const ownership = countOwnershipEvidenceSafe(resumeText);

  const ownershipStrong = ownership.count >= 5;
  const ownershipLow = ownership.count <= 1;

  // base scores (0~100)
  let companySizeFitScore = 50;
  let vendorExperienceScore = 50;
  let ownershipLevelScore = 55;
  let industryStructureFitScore = 50;

  // ------------------------------
  // Ownership 판단 룰 (required)
  // ------------------------------
  if (ownershipStrong) {
    ownershipLevelScore = 85;
    addFlag("HIGH_OWNERSHIP");
  } else if (ownershipLow) {
    ownershipLevelScore = 25;
    addFlag("LOW_OWNERSHIP");
  } else {
    // 중간 영역: 2~4개
    ownershipLevelScore = 55;
  }

  // ------------------------------
  // 기업 규모 관련 룰 (required)
  // ------------------------------
  const candRank = companySizeRank(candidateSize);
  const targRank = companySizeRank(targetSize);

  // Rule 1
  // candidate large → target startup AND ownership evidence 없음 → companySizeFitScore -= 35 → add flag SIZE_DOWNSHIFT_RISK
  if (candidateSize === "large" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 35;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }

  // Rule 2
  // candidate startup → target large → companySizeFitScore -= 20 → add flag SIZE_UPSHIFT_RISK
  if (candidateSize === "startup" && targetSize === "large") {
    companySizeFitScore -= 20;
    addFlag("SIZE_UPSHIFT_RISK");
  }

  // Rule 3
  // candidate size == target size → companySizeFitScore += 15
  if (candidateSize && targetSize && candidateSize === targetSize) {
    companySizeFitScore += 15;
  }

  // Rule 4
  // ownership evidence strong → companySizeFitScore += 15 → add flag HIGH_OWNERSHIP
  if (ownershipStrong) {
    companySizeFitScore += 15;
    addFlag("HIGH_OWNERSHIP");
  }

  // ------------------------------
  // 기업 규모 관련 추가 룰(append-only, 20~30개 수준 확장)
  // ------------------------------
  // (A) 큰 폭 이동은 리스크(단, ownership strong이면 완화)
  // large -> smb/mid
  if (candidateSize === "large" && (targetSize === "smb" || targetSize === "mid") && !ownershipStrong) {
    companySizeFitScore -= 12;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }
  // mid -> startup
  if (candidateSize === "mid" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 18;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }
  // smb -> startup
  if (candidateSize === "smb" && targetSize === "startup" && !ownershipStrong) {
    companySizeFitScore -= 10;
    addFlag("SIZE_DOWNSHIFT_RISK");
  }

  // (B) 업스케일 이동은 프로세스/레벨링 리스크(단, 이력서에 프로세스/협업 증거 있으면 완화)
  const procEvidence =
    /(협업|cross[-\s]?functional|stakeholder|프로세스|process|규정|compliance|문서화|거버넌스|governance|보고|reporting|조직|matrix)/i.test(safeLower(resumeText));
  if (candidateSize === "startup" && (targetSize === "mid" || targetSize === "smb") && !procEvidence) {
    companySizeFitScore -= 8;
    addFlag("SIZE_UPSHIFT_RISK");
  }
  if ((candidateSize === "smb" || candidateSize === "mid") && targetSize === "large" && !procEvidence) {
    companySizeFitScore -= 10;
    addFlag("SIZE_UPSHIFT_RISK");
  }

  // (C) 타겟이 startup인데 ownershipLow면 추가 패널티(실무 현실: "스스로 굴리는가"가 핵심)
  if (targetSize === "startup" && ownershipLow) {
    companySizeFitScore -= 10;
    addFlag("LOW_OWNERSHIP");
  }

  // (D) 타겟이 large인데 ownershipStrong이면 레벨링 리스크 완화(+)
  if (targetSize === "large" && ownershipStrong) {
    companySizeFitScore += 6;
    addFlag("HIGH_OWNERSHIP");
  }

  // (E) size 미탐지/불확실: 과신 방지(중립)
  if (!candidateSize || !targetSize || candRank === 0 || targRank === 0) {
    companySizeFitScore += 0;
  } else {
    // 랭크 갭 기반 미세 조정(설명가능성 유지)
    const gap = Math.abs(candRank - targRank);
    if (gap >= 3 && !ownershipStrong) companySizeFitScore -= 8;
    else if (gap === 2 && !ownershipStrong) companySizeFitScore -= 4;
    else if (gap === 1) companySizeFitScore -= 1;
  }

  // ------------------------------
  // 벤더/협력사 가치 룰 (required)
  // ------------------------------
  const ind = (resumeIndustry || jdIndustry || (detectedIndustry || "")).toString().trim();

  // ✅ roleNorm을 세분 role에서도 안전하게 동작하도록 "family role" 우선으로 정규화
  // - role가 비어있으면 resume/jd 텍스트에서 룰 기반 추론으로 보완
  const roleHintText = `${(role || "").toString()} ${(detectedRole || "").toString()} ${(jdText || "").toString()} ${(resumeText || "").toString()}`;
  const roleInferred = inferRoleFromTextDetailed(roleHintText, (role || detectedRole || "").toString());

  const roleNorm = (
    roleInferred.familyRole ||
    (role || (detectedRole || "")).toString().trim() ||
    ""
  ).toString().trim();

  if (/semiconductor/i.test(ind)) {
    vendorExperienceScore += 30;
    addFlag("VENDOR_CORE_VALUE");
  }

  if (/automotive/i.test(ind)) {
    vendorExperienceScore += 25;
  }

  if (/engineering/i.test(roleNorm)) {
    vendorExperienceScore += 20;
  }

  if (/strategy/i.test(roleNorm)) {
    vendorExperienceScore -= 20;
    addFlag("VENDOR_LIMITED_VALUE");
  }

  if (/marketing/i.test(roleNorm)) {
    vendorExperienceScore -= 15;
  }

  // ------------------------------
  // 벤더/협력사 가치 추가 룰(append-only)
  // ------------------------------
  const vendorKeywords = /(협력사|vendor|supplier|고객사|oem|tier\s*1|tier1|납품|양산|ppap|apqp|품질\s*이슈|customer\s*issue|field|라인|라인셋업)/i;
  const hasVendorContext = vendorKeywords.test((resumeText || "").toString()) || vendorKeywords.test((jdText || "").toString());

  // semiconductor인데 vendor context가 있으면 추가 가산
  if (/semiconductor/i.test(ind) && hasVendorContext) {
    vendorExperienceScore += 8;
    addFlag("VENDOR_CORE_VALUE");
  }

  // automotive인데 vendor context가 있으면 추가 가산
  if (/automotive/i.test(ind) && hasVendorContext) {
    vendorExperienceScore += 6;
  }

  // role이 ops이면 vendor/협력사 가치가 상대적으로 커질 수 있음
  if (/ops/i.test(roleNorm)) {
    vendorExperienceScore += 8;
  }

  // role이 sales이면 vendor 경험이 "가치"로 변환될 수 있으나, 본 룰엔 중립(+2)
  if (/sales/i.test(roleNorm) && hasVendorContext) {
    vendorExperienceScore += 2;
  }

  // role이 product이면 vendor 경험이 약간 도움(+3)
  if (/product/i.test(roleNorm) && hasVendorContext) {
    vendorExperienceScore += 3;
  }

  // strategy/marketing인데 vendor context가 없으면 추가 감점(제한적 가치)
  if ((/strategy/i.test(roleNorm) || /marketing/i.test(roleNorm)) && !hasVendorContext) {
    vendorExperienceScore -= 6;
    addFlag("VENDOR_LIMITED_VALUE");
  }

  // ------------------------------
  // 산업 적합성 룰 (required)
  // ------------------------------
  const resumeInd = (resumeIndustry || "").toString().trim();
  const jdInd = (jdIndustry || "").toString().trim();

  if (resumeInd && jdInd && resumeInd === jdInd) {
    industryStructureFitScore += 30;
    addFlag("INDUSTRY_STRONG_MATCH");
  }

  // industry mismatch
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    industryStructureFitScore -= 30;
    addFlag("INDUSTRY_MISMATCH");
  }

  // ------------------------------
  // 산업 적합성 추가 룰(append-only)
  // ------------------------------
  // 산업이 한쪽만 탐지되면 과신 방지: 중립(0)
  if ((!resumeInd && jdInd) || (resumeInd && !jdInd)) {
    industryStructureFitScore += 0;
  }

  // "플랫폼/saas" ↔ "commerce"는 인접 산업으로 일부 완화
  const adjacentPairs = new Set([
    "saas|commerce",
    "commerce|saas",
    "saas|finance",
    "finance|saas",
  ]);
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    const key = `${resumeInd}|${jdInd}`;
    if (adjacentPairs.has(key)) {
      industryStructureFitScore += 10; // -30의 일부 상쇄
    }
  }

  // manufacturing ↔ semiconductor는 부분 인접(공정/제조 오퍼레이션)
  if (resumeInd && jdInd && resumeInd !== jdInd) {
    const key2 = `${resumeInd}|${jdInd}`;
    if (key2 === "manufacturing|semiconductor" || key2 === "semiconductor|manufacturing") {
      industryStructureFitScore += 8;
    }
  }

  // ------------------------------
  // clamp + assemble
  // ------------------------------
  companySizeFitScore = score100(companySizeFitScore);
  vendorExperienceScore = score100(vendorExperienceScore);
  ownershipLevelScore = score100(ownershipLevelScore);
  industryStructureFitScore = score100(industryStructureFitScore);

  const structureFlags = normalizeStructureFlagList(flags);

  const structureAnalysis = {
    companySizeFitScore,
    vendorExperienceScore,
    ownershipLevelScore,
    industryStructureFitScore,
    structureFlags,
    // append-only: role inference detail (세분 role 도입 대비)
    roleInference: {
      fineRole: (roleInferred?.fineRole || "").toString(),
      familyRole: (roleInferred?.familyRole || "").toString(),
      score: Number(roleInferred?.score ?? 0) || 0,
    },
  };

  // ------------------------------
  // structureSummaryForAI (required)
  // ------------------------------
  const sizeCandLabel = companySizeLabel(candidateSize);
  const sizeTargLabel = companySizeLabel(targetSize);

  const ownershipLabel = labelFrom100(ownershipLevelScore);
  const vendorLabel = labelFrom100(vendorExperienceScore);
  const industryLabel = labelFrom100(industryStructureFitScore);

  const sizeSentence =
    (sizeCandLabel !== "UNKNOWN" || sizeTargLabel !== "UNKNOWN")
      ? `Candidate from ${sizeCandLabel} company applying to ${sizeTargLabel}.`
      : "Company size signals uncertain.";

  const ownershipSentence =
    `Ownership evidence ${ownershipLabel}${ownership.hits?.length ? ` (${ownership.hits.slice(0, 6).join(", ")})` : ""}.`;

  const vendorSentence =
    `Vendor experience relevance ${vendorLabel}.`;

  const industrySentence =
    (resumeInd && jdInd)
      ? `Industry match ${industryLabel} (resume: ${resumeInd}, jd: ${jdInd}).`
      : `Industry match ${industryLabel}.`;

  const structureSummaryForAI =
    `${sizeSentence} ${ownershipSentence} ${vendorSentence} ${industrySentence}`.trim();

  return { structureAnalysis, structureSummaryForAI };
}

// ------------------------------
// Exported helpers (append-only)
// - 기존 사용처 호환: buildHypotheses/buildReport는 그대로 유지
// - 신규 output 구조가 필요할 때만 사용
// ------------------------------
export function buildStructureAnalysis({
  resumeText,
  jdText,
  detectedIndustry,
  detectedRole,
  detectedCompanySizeCandidate,
  detectedCompanySizeTarget,
}) {
  return applyStructureRuleEngine({
    resumeText,
    jdText,
    detectedIndustry,
    detectedRole,
    detectedCompanySizeCandidate,
    detectedCompanySizeTarget,
  });
}

// ------------------------------
// Hireability (append-only)
// - 신규 평가 프레임 추가: 기존 점수/가설/리포트/알고리즘은 그대로 유지
// - AI는 ‘판단’이 아니라 ‘추출’만: 불확실하면 null/unknown 전제
// ------------------------------
function neutral55(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 55;
  return clamp(Math.round(n), 0, 100);
}

function normalizeEnum(x, allowed, fallback = "unknown") {
  const s = (x || "").toString().trim();
  if (!s) return fallback;
  const k = safeLower(s);
  if (allowed.includes(k)) return k;
  return fallback;
}

function normalizeLevel04(x) {
  if (x === null || x === undefined) return null;
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  const r = Math.round(n);
  return clamp(r, 0, 4);
}

function responsibilityLevelFit(candidateResponsibility, targetResponsibility) {
  if (candidateResponsibility === null || candidateResponsibility === undefined) return "LOW";
  if (targetResponsibility === null || targetResponsibility === undefined) return "LOW";
  const c = Number(candidateResponsibility);
  const t = Number(targetResponsibility);
  if (!Number.isFinite(c) || !Number.isFinite(t)) return "LOW";
  if (c >= t) return "HIGH";
  if (c === t - 1) return "MEDIUM";
  return "LOW";
}

function responsibilityLevelFitScoreFromLabel(label) {
  const l = (label || "").toString().trim();
  if (l === "HIGH") return 90;
  if (l === "MEDIUM") return 70;
  return 35;
}

function executionCoordinationFitScore(candidateRoleType, targetRoleType) {
  const c = normalizeEnum(candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const t = normalizeEnum(targetRoleType, ["execution", "coordination", "unknown"], "unknown");

  if (c === "unknown" || t === "unknown") return 55;

  if (c === "execution" && t === "coordination") return 30;
  if (c === "coordination" && t === "coordination") return 80;
  if (c === "execution" && t === "execution") return 75;
  if (c === "coordination" && t === "execution") return 65;

  return 55;
}

function executionCoordinationRiskLabel(candidateRoleType, targetRoleType) {
  const c = normalizeEnum(candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const t = normalizeEnum(targetRoleType, ["execution", "coordination", "unknown"], "unknown");
  if (c === "execution" && t === "coordination") return "HIGH";
  if (c === "unknown" || t === "unknown") return "MEDIUM";
  if (c === t) return "LOW";
  return "MEDIUM";
}

function decisionExposureScore(candidateDecisionExposureLevel) {
  const lv = normalizeLevel04(candidateDecisionExposureLevel);
  if (lv === null) return 55;
  return clamp(Math.round((lv / 4) * 100), 0, 100);
}

function businessModelFitScore(candidateBusinessModel, targetBusinessModel) {
  const allowed = ["platform", "manufacturing", "marketplace", "inventory", "saas", "subscription", "ads", "unknown"];
  const c = normalizeEnum(candidateBusinessModel, allowed, "unknown");
  const t = normalizeEnum(targetBusinessModel, allowed, "unknown");

  if (c === "unknown" || t === "unknown") return 55;
  if (c === t) return 85;

  // 유사 판정 테이블(있으면 65)
  const similar = new Set([
    "saas|subscription",
    "subscription|saas",
    "marketplace|platform",
    "platform|marketplace",
    "inventory|manufacturing",
    "manufacturing|inventory",
    "platform|ads",
    "ads|platform",
  ]);
  if (similar.has(`${c}|${t}`)) return 65;

  return 35;
}

function pickComparableRatio(candidateImpact, targetImpact) {
  const c = candidateImpact || {};
  const t = targetImpact || {};

  const pairs = [
    ["revenue", c.revenue, t.revenue],
    ["users", c.users, t.users],
    ["projectSize", c.projectSize, t.projectSize],
  ];

  const ratios = [];
  for (const [key, cv, tv] of pairs) {
    const a = Number(cv);
    const b = Number(tv);
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (b <= 0) continue;
    ratios.push({ key, ratio: a / b });
  }

  if (!ratios.length) return null;

  // 여러 값이 있으면 "가장 보수적인(최소 ratio)"로 평가
  ratios.sort((x, y) => x.ratio - y.ratio);
  return ratios[0];
}

function impactScaleFitScore(candidateImpact, targetImpact) {
  const r = pickComparableRatio(candidateImpact, targetImpact);
  if (!r) return 55;

  const ratio = r.ratio;
  if (ratio >= 1.0) return 90;
  if (ratio >= 0.5) return 70;
  if (ratio >= 0.2) return 45;
  return 25;
}

function reportingLineRank(x) {
  const v = (x || "").toString().trim();
  const k = safeLower(v);
  if (k === "teamlead") return 1;
  if (k === "director") return 2;
  if (k === "cxo") return 3;
  if (k === "ceo") return 4;
  return 0;
}

function reportingLineFitScore(candidateReportingLine, targetReportingLine) {
  const c = normalizeEnum(candidateReportingLine, ["teamlead", "director", "cxo", "ceo", "unknown"], "unknown");
  const t = normalizeEnum(targetReportingLine, ["teamlead", "director", "cxo", "ceo", "unknown"], "unknown");
  if (c === "unknown" || t === "unknown") return 55;

  const cr = reportingLineRank(c);
  const tr = reportingLineRank(t);
  if (!cr || !tr) return 55;

  const diff = Math.abs(cr - tr);
  if (diff === 0) return 85;
  if (diff === 1) return 65;
  return 40;
}

function orgComplexityRank(x) {
  const v = (x || "").toString().trim();
  const k = safeLower(v);
  if (k === "low") return 1;
  if (k === "mid") return 2;
  if (k === "high") return 3;
  return 0;
}

function orgComplexityFitScore(candidateOrgComplexity, targetOrgComplexity) {
  const c = normalizeEnum(candidateOrgComplexity, ["low", "mid", "high", "unknown"], "unknown");
  const t = normalizeEnum(targetOrgComplexity, ["low", "mid", "high", "unknown"], "unknown");
  if (c === "unknown" || t === "unknown") return 55;

  const cr = orgComplexityRank(c);
  const tr = orgComplexityRank(t);
  if (!cr || !tr) return 55;

  const diff = Math.abs(cr - tr);
  if (diff === 0) return 80;
  if (diff === 1) return 60;
  return 40;
}

function careerConsistencyScoreFromSignals({ ai }) {
  // 규칙: risk=HIGH면 35, 아니면 70, 불확실 55
  // AI가 추출하는 값이 없으면 추측하지 않고 55
  const fit = ai?.fitExtract || ai?.extracted?.fitExtract || null;

  const r1 = fit?.careerShiftRisk;
  const r2 = fit?.noClearBridgeExperience;

  const s1 = (r1 || "").toString().trim();
  const s2 = (r2 || "").toString().trim();

  const riskText = safeLower(s1);
  const noBridgeText = safeLower(s2);

  if (riskText === "high") return 35;
  if (riskText === "low") return 70;

  if (noBridgeText === "true") return 35;
  if (noBridgeText === "false") return 70;

  return 55;
}

function hireabilityScore(payload) {
  const scores = payload?.scores || {};
  const weights = payload?.weights || {};

  const sumW =
    (weights.responsibility || 0) +
    (weights.ownership || 0) +
    (weights.decisionExposure || 0) +
    (weights.industryFit || 0) +
    (weights.businessModelFit || 0) +
    (weights.executionFit || 0) +
    (weights.companySizeFit || 0) +
    (weights.signalStrength || 0);

  const W = sumW > 0 ? sumW : 1;

  const s = {
    responsibility: neutral55(scores.responsibilityLevelFitScore),
    ownership: neutral55(scores.ownershipLevelScore),
    decisionExposure: neutral55(scores.decisionExposureScore),
    industryFit: neutral55(scores.industryFitScore),
    businessModelFit: neutral55(scores.businessModelFitScore),
    executionFit: neutral55(scores.executionCoordinationFitScore),
    companySizeFit: neutral55(scores.companySizeFitScore),
    signalStrength: neutral55(scores.signalStrengthScore),
  };

  const out =
    (weights.responsibility || 0) * s.responsibility +
    (weights.ownership || 0) * s.ownership +
    (weights.decisionExposure || 0) * s.decisionExposure +
    (weights.industryFit || 0) * s.industryFit +
    (weights.businessModelFit || 0) * s.businessModelFit +
    (weights.executionFit || 0) * s.executionFit +
    (weights.companySizeFit || 0) * s.companySizeFit +
    (weights.signalStrength || 0) * s.signalStrength;

  return clamp(Math.round(out / W), 0, 100);
}

function buildHireabilityLayer({ ai, structureAnalysis, resumeSignals }) {
  const fitExtract = (ai?.fitExtract || ai?.extracted?.fitExtract || ai?.fit || null) || {};

  const candResp = normalizeLevel04(fitExtract.candidateResponsibilityLevel);
  const targResp = normalizeLevel04(fitExtract.targetResponsibilityLevel);
  const respLabel = responsibilityLevelFit(candResp, targResp);
  const responsibilityLevelFitScore = responsibilityLevelFitScoreFromLabel(respLabel);

  const candidateRoleType = normalizeEnum(fitExtract.candidateRoleType, ["execution", "coordination", "unknown"], "unknown");
  const targetRoleType = normalizeEnum(fitExtract.targetRoleType, ["execution", "coordination", "unknown"], "unknown");
  const executionCoordinationFitScoreVal = executionCoordinationFitScore(candidateRoleType, targetRoleType);
  const executionCoordinationRisk = executionCoordinationRiskLabel(candidateRoleType, targetRoleType);

  const decisionExposureScoreVal = decisionExposureScore(fitExtract.candidateDecisionExposureLevel);

  const businessModelFitScoreVal = businessModelFitScore(fitExtract.candidateBusinessModel, fitExtract.targetBusinessModel);

  const impactScaleFitScoreVal = impactScaleFitScore(fitExtract.candidateImpact, fitExtract.targetImpact);

  const reportingLineFitScoreVal = reportingLineFitScore(fitExtract.candidateReportingLine, fitExtract.targetReportingLine);

  const orgComplexityFitScoreVal = orgComplexityFitScore(fitExtract.candidateOrgComplexity, fitExtract.targetOrgComplexity);

  const careerConsistencyScoreVal = careerConsistencyScoreFromSignals({ ai });

  const signalStrengthScoreVal = clamp(Math.round((resumeSignals?.resumeSignalScore ?? 0) * 100), 0, 100);

  const ownershipLevelScoreVal = score100(structureAnalysis?.ownershipLevelScore ?? 55);

  const companySizeFitScoreVal = score100(structureAnalysis?.companySizeFitScore ?? 55);

  const industryFitScoreVal = score100(structureAnalysis?.industryStructureFitScore ?? 55);

  const vendorExperienceScoreVal =
    structureAnalysis && Object.prototype.hasOwnProperty.call(structureAnalysis, "vendorExperienceScore")
      ? score100(structureAnalysis.vendorExperienceScore)
      : 55;

  const weights = {
    responsibility: 0.22,
    ownership: 0.18,
    decisionExposure: 0.16,
    industryFit: 0.14,
    businessModelFit: 0.10,
    executionFit: 0.08,
    companySizeFit: 0.06,
    signalStrength: 0.06,
  };

  const scores = {
    companySizeFitScore: companySizeFitScoreVal,
    ownershipLevelScore: ownershipLevelScoreVal,
    responsibilityLevelFitScore,
    decisionExposureScore: decisionExposureScoreVal,
    executionCoordinationFitScore: executionCoordinationFitScoreVal,
    businessModelFitScore: businessModelFitScoreVal,
    impactScaleFitScore: impactScaleFitScoreVal,
    careerConsistencyScore: careerConsistencyScoreVal,
    signalStrengthScore: signalStrengthScoreVal,
    reportingLineFitScore: reportingLineFitScoreVal,
    orgComplexityFitScore: orgComplexityFitScoreVal,
    industryFitScore: industryFitScoreVal,
    vendorExperienceScore: vendorExperienceScoreVal,
  };

  const hireabilityScoreVal = hireabilityScore({ scores, weights });

  return {
    scores,
    final: {
      hireabilityScore: hireabilityScoreVal,
      weights,
    },
    labels: {
      responsibilityLevelFit: respLabel,
      executionCoordinationRisk,
    },
    extracted: {
      fitExtract,
    },
  };
}

// ------------------------------
// riskLayer (append-only)
// - documentRisk vs interviewRisk
// - 기존 로직/점수/리포트는 유지, analyze() 반환값에만 추가
// ------------------------------
function riskLevelFromScore(score100Val) {
  const s = clamp(Math.round(Number(score100Val) || 0), 0, 100);
  if (s >= 70) return "HIGH";
  if (s >= 40) return "MEDIUM";
  return "LOW";
}

function safeNumberOrNull(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return null;
  return n;
}

function extractMatchRate01FromKnownSources({ state, ai, keywordSignals, objective, keywordMatchV2 }) {
  // 우선순위(있는 것만): keywordMatchV2.matchRate -> state/ai의 keywordMatchV2 -> keywordSignals.matchScore(0~1) -> objective.parts.keywordMatchScore(0~1)
  const direct =
    safeNumberOrNull(keywordMatchV2?.matchRate) ??
    safeNumberOrNull(state?.keywordMatchV2?.matchRate) ??
    safeNumberOrNull(ai?.keywordMatchV2?.matchRate) ??
    safeNumberOrNull(ai?.semanticMatches?.matchRate) ??
    safeNumberOrNull(ai?.matchRate) ??
    safeNumberOrNull(keywordSignals?.matchRate) ??
    safeNumberOrNull(keywordSignals?.matchScore) ??
    safeNumberOrNull(objective?.parts?.keywordMatchScore);

  if (direct === null) return null;

  // 0~1로 들어온 경우
  if (direct >= 0 && direct <= 1.001) return clamp(direct, 0, 1);

  // 0~100으로 들어온 경우를 0~1로 변환
  if (direct >= 0 && direct <= 100.001) return clamp(direct / 100, 0, 1);

  return null;
}

function extractHardMustMissingCount({ state, ai, keywordSignals }) {
  // 우선순위(있는 것만): hardMustMissingCount / mustHaveMissingCount / missingCritical.length
  const n1 = safeNumberOrNull(state?.hardMustMissingCount);
  if (n1 !== null) return Math.max(0, Math.round(n1));

  const n2 = safeNumberOrNull(ai?.hardMustMissingCount);
  if (n2 !== null) return Math.max(0, Math.round(n2));

  const n3 = safeNumberOrNull(state?.mustHaveMissingCount);
  if (n3 !== null) return Math.max(0, Math.round(n3));

  const n4 = safeNumberOrNull(ai?.mustHaveMissingCount);
  if (n4 !== null) return Math.max(0, Math.round(n4));

  if (Array.isArray(keywordSignals?.missingCritical)) {
    return keywordSignals.missingCritical.length;
  }

  return null;
}

function buildDocumentRiskLayer({
  state,
  ai,
  keywordSignals,
  objective,
  keywordMatchV2 = null,
}) {
  const drivers = [];

  const matchRate01 = extractMatchRate01FromKnownSources({
    state,
    ai,
    keywordSignals,
    objective,
    keywordMatchV2,
  });

  const docRiskFromMatch =
    matchRate01 === null
      ? 55
      : (1 - clamp(matchRate01, 0, 1)) * 100;

  if (matchRate01 !== null && matchRate01 < 0.55) {
    drivers.push("JD 핵심요건 매칭률이 낮음");
  }

  let adjust = 0;

  const hardMissing = extractHardMustMissingCount({ state, ai, keywordSignals });
  if (hardMissing !== null && hardMissing > 0) {
    adjust += Math.min(30, hardMissing * 10);
    drivers.push("필수요건 누락 가능성");
  }

  if (!drivers.length) {
    drivers.push("근거 데이터 부족(요건 리스트/이력서 bullet 권장)");
  }

  const score = clamp(Math.round(docRiskFromMatch + adjust), 0, 100);

  return {
    score,
    level: riskLevelFromScore(score),
    drivers: uniq(drivers),
  };
} ~

  function pickHireabilityScore100(hireability) {
    const h = safeNumberOrNull(hireability?.final?.hireabilityScore);
    if (h === null) return null;
    return clamp(Math.round(h), 0, 100);
  }

function buildInterviewRiskLayer({ hireability }) {
  const drivers = [];

  const hireabilityScore100Val = pickHireabilityScore100(hireability);
  const interviewRiskBase =
    hireabilityScore100Val === null
      ? 55
      : 100 - clamp(hireabilityScore100Val, 0, 100);

  let adjust = 0;
  let adjustCount = 0;

  const resp = safeNumberOrNull(hireability?.scores?.responsibilityLevelFitScore);
  const own = safeNumberOrNull(hireability?.scores?.ownershipLevelScore);
  const dec = safeNumberOrNull(hireability?.scores?.decisionExposureScore);
  const imp = safeNumberOrNull(hireability?.scores?.impactScaleFitScore);
  const exe = safeNumberOrNull(hireability?.scores?.executionCoordinationFitScore);

  // TOP3(책임/오너십/의사결정) 보정: <50이면 +10, 총 25 cap
  const bumpIfLow = (v) => {
    if (v === null) return 0;
    if (v < 50) return 10;
    return 0;
  };

  const bumps = [
    bumpIfLow(resp),
    bumpIfLow(own),
    bumpIfLow(dec),
  ];

  for (const b of bumps) {
    if (b > 0 && adjust < 25) {
      const add = Math.min(b, 25 - adjust);
      adjust += add;
      adjustCount += 1;
    }
  }

  // drivers (값 있을 때만)
  if (resp !== null && resp < 50) drivers.push("책임 레벨이 목표 포지션보다 낮을 가능성");
  if (own !== null && own < 50) drivers.push("프로젝트 오너십/성과 책임 신호가 약함");
  if (dec !== null && dec < 50) drivers.push("의사결정에 가까운 경험 근거가 약함");
  if (imp !== null && imp < 50) drivers.push("다뤄본 임팩트 규모가 목표 대비 작을 가능성");
  if (exe !== null && exe < 50) drivers.push("실행형→조정형 전환 리스크");

  // 데이터 부족 처리
  const hasAnySignal =
    hireabilityScore100Val !== null ||
    resp !== null ||
    own !== null ||
    dec !== null ||
    imp !== null ||
    exe !== null;

  if (!hasAnySignal) {
    drivers.push("근거 데이터 부족(책임/오너십/의사결정 입력 권장)");
  } else if (!drivers.length) {
    // 값은 있으나 리스크 드라이버가 하나도 안 잡힌 경우: 중립 드라이버 최소 1개
    drivers.push("근거 데이터 부족(책임/오너십/의사결정 입력 권장)");
  }

  const score = clamp(Math.round(interviewRiskBase + adjust), 0, 100);

  return {
    score,
    level: riskLevelFromScore(score),
    drivers: uniq(drivers),
  };
}
// ==============================
// [PATCH] Gate -> decisionPressure ceiling/penalty (append-only)
// - decisionPack.riskResults의 gate 최대 priority 기반으로
//   analyzer.js의 decisionPressure 결과(0~1 지표)에 강한 페널티를 반영
// ==============================
function __clamp01_gate(x, d = 0) {
  const n = Number(x);
  if (!Number.isFinite(n)) return d;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
function __getGateMaxPriorityFromDecisionPack(decisionPack) {
  const arr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : [];
  let maxP = 0;
  for (const r of arr) {
    if (!r) continue;
    if (String(r?.layer || "") !== "gate") continue;
    const p = Number(r?.priority ?? 0);
    if (Number.isFinite(p) && p > maxP) maxP = p;
  }
  return maxP;
}
function __gatePenalty01_fromPriority(maxP) {
  // 현실형: gate 하나 걸리면 강하게 불리
  // (지금 decision/index.js의 gateBoost(0.04~0.35)보다 “최종 판단용”은 더 세게)
  let k = 0;
  if (maxP >= 95) k = 0.60;
  else if (maxP >= 85) k = 0.45;
  else if (maxP >= 70) k = 0.30;
  else if (maxP >= 60) k = 0.20;
  else if (maxP >= 50) k = 0.12;
  return __clamp01_gate(k, 0);
}
function __applyGatePenaltyToDecisionPressure(decisionPressure, decisionPack) {
  const dp = decisionPressure && typeof decisionPressure === "object" ? decisionPressure : null;
  if (!dp) return dp;

  const maxP = __getGateMaxPriorityFromDecisionPack(decisionPack);
  const k = __gatePenalty01_fromPriority(maxP);
  if (!k || k <= 0) return dp;

  // dp는 { replaceabilityRisk, differentiationLevel, internalCompetitionRisk, narrativeCoherence, promotionFeasibility }
  // - risk 계열은 상승
  // - positive(가능성) 계열은 하락
  const out = {
    ...dp,
    replaceabilityRisk: __clamp01_gate((dp.replaceabilityRisk ?? 0) + 0.70 * k),
    internalCompetitionRisk: __clamp01_gate((dp.internalCompetitionRisk ?? 0) + 0.85 * k),
    differentiationLevel: __clamp01_gate((dp.differentiationLevel ?? 0) * (1 - 0.70 * k)),
    narrativeCoherence: __clamp01_gate((dp.narrativeCoherence ?? 0) * (1 - 0.55 * k)),
    promotionFeasibility: __clamp01_gate((dp.promotionFeasibility ?? 0) * (1 - 0.80 * k)),
    // 설명/디버깅용 메타(기존 소비에 영향 거의 없음)
    gatePenalty: {
      maxPriority: maxP,
      penalty01: k,
      applied: true,
    },
  };

  return out;
}
// ------------------------------
// decisionPressureLayer (append-only)
// - AI가 아니라 "로컬 analyzer"에서 계산 (운영 안정성/일관성)
// - 0~1 스케일로만 반환 (UI에서 해석/설명)
// ------------------------------
function buildDecisionPressure({ state, keywordSignals, careerSignals, resumeSignals, structureAnalysis, objective }) {
  const ownScore = Number(structureAnalysis?.ownershipLevelScore ?? 55) || 55; // 0~100
  const ownership01 = normalizeScore01(ownScore / 100);

  const kw01 = normalizeScore01(Number(keywordSignals?.matchScore ?? 0) || 0);
  const proof01 = normalizeScore01(Number(resumeSignals?.resumeSignalScore ?? 0) || 0);
  const exp01 = normalizeScore01(Number(careerSignals?.experienceLevelScore ?? 0) || 0);

  const careerRisk01 = normalizeScore01(Number(careerSignals?.careerRiskScore ?? 0) || 0); // risk (0~1)
  const objective01 = normalizeScore01(Number(objective?.objectiveScore ?? 0) || 0);

  // selfCheck 기반(없으면 중립)
  const sc = state?.selfCheck || {};
  const story01 = normalizeScore01(((Number(sc?.storyConsistency ?? 3) || 3) - 1) / 4); // 1~5 -> 0~1
  const clarity01 = normalizeScore01(((Number(sc?.roleClarity ?? 3) || 3) - 1) / 4); // 1~5 -> 0~1

  // 경험 갭(연차 부족) 가산
  const expGap = Number(careerSignals?.experienceGap ?? 0);
  const expShort01 = expGap < 0 ? normalizeScore01(Math.min(1, Math.abs(expGap) / 5)) : 0;

  // 1) differentiationLevel: "대체 불가능 포인트" (ownership + 수치근거 + 키워드 정합)
  const differentiationLevel = normalizeScore01(0.45 * ownership01 + 0.3 * proof01 + 0.25 * kw01);

  // 2) replaceabilityRisk: "굳이 뽑을 이유 부족" (차별성 낮음 + 리스크 높음)
  const replaceabilityRisk = normalizeScore01(
    (1 - differentiationLevel) * 0.65 + careerRisk01 * 0.2 + (1 - objective01) * 0.15
  );

  // 3) internalCompetitionRisk: "내부/상위 경쟁자 가정 시 밀리는 위험"
  // - must-have(kw), 증거(proof), ownership 중 하나라도 낮으면 리스크↑
  const internalCompetitionRisk = normalizeScore01(
    (1 - kw01) * 0.35 + (1 - proof01) * 0.25 + (1 - ownership01) * 0.25 + expShort01 * 0.15
  );

  // 4) narrativeCoherence: "이 사람을 뽑아야 하는 스토리/일관성"
  // - story/clarity 기반 + 잦은 이직/공백 리스크는 간접적으로 careerRisk로 반영
  const narrativeCoherence = normalizeScore01(0.55 * story01 + 0.35 * clarity01 + (1 - careerRisk01) * 0.1);

  // 5) promotionFeasibility: "들어와서 레벨업/승진 그림이 그려지는가"
  // - 연차 적합(exp), ownership(리드 경험), 키워드 정합(역할 fit)
  let promotionFeasibility = normalizeScore01(0.5 * exp01 + 0.35 * ownership01 + 0.15 * kw01);
  if (expGap < 0) promotionFeasibility = normalizeScore01(promotionFeasibility - 0.15 * expShort01);

  return {
    replaceabilityRisk,
    differentiationLevel,
    internalCompetitionRisk,
    narrativeCoherence,
    promotionFeasibility,
  };
}
// (필수 import 추가 필요 - 파일 상단에 append-only로 추가하세요)
// import { detectStructuralPatterns } from "./structuralPatterns";
// import { buildDecisionPack } from "./decision";

// 신규 메인 출력(append-only): 구조 분석 필드를 최종 output에 포함 + hireability 레이어 추가
// 신규 메인 출력(append-only): 구조 분석 필드를 최종 output에 포함 + hireability 레이어 추가
export function analyze(state, ai = null) {
  const keywordSignals = buildKeywordSignals(state?.jd || "", state?.resume || "", ai);
  const careerSignals = buildCareerSignals(state?.career || {}, state?.jd || "");
  const resumeSignals = buildResumeSignals(state?.resume || "", state?.portfolio || "");

  const majorSignals = buildMajorSignals({
    jd: state?.jd || "",
    resume: state?.resume || "",
    state,
    ai,
    keywordSignals,
    resumeSignals,
  });

  const objective = buildObjectiveScore({ keywordSignals, careerSignals, resumeSignals, majorSignals });
  const hypotheses = buildHypotheses(state, ai);
  let report = buildReport(state, ai);

  const structurePack = buildStructureAnalysis({
    resumeText: state?.resume || "",
    jdText: state?.jd || "",
    detectedIndustry: (ai?.detectedIndustry ?? ai?.industry ?? state?.industry ?? "").toString(),
    detectedRole: (ai?.detectedRole ?? ai?.role ?? state?.role ?? "").toString(),
    detectedCompanySizeCandidate: (
      ai?.detectedCompanySizeCandidate ??
      ai?.companySizeCandidate ??
      state?.companySizeCandidate ??
      ""
    ).toString(),
    detectedCompanySizeTarget: (
      ai?.detectedCompanySizeTarget ??
      ai?.companySizeTarget ??
      state?.companySizeTarget ??
      ""
    ).toString(),
  });

  // ✅ 신규(append-only): 검증 가능한 구조 패턴 감지(텍스트 기반 + 일부 타임라인 기반)
  // - 결과는 최종 return에 포함시키기 쉬우라고 별도 pack으로 보관
  // - IMPORTANT: detectStructuralPatterns는 "한 번만" 계산하고, decisionPack에도 동일 결과를 사용
  const structural = detectStructuralPatterns({
    state,
    ai,
    jdText: state?.jd || "",
    resumeText: state?.resume || "",
    portfolioText: state?.portfolio || "",
  });

  const structuralPatternsPack = {
    summary: structural?.summary || null,
    flags: structural?.flags || [],
    metrics: structural?.metrics || null,
  };

  // ✅ 신규(append-only, 선택): decision layer(pressure)까지 합산하고 싶을 때
  // - buildDecisionPack이 없는 상태에서도 앱이 죽지 않게 방어
  let decisionPack = null;
  try {
    decisionPack =
      typeof buildDecisionPack === "function"
        ? buildDecisionPack({ state, ai, structural })
        : null;
  } catch {
    decisionPack = null;
  }

  const hireability = buildHireabilityLayer({
    ai,
    structureAnalysis: structurePack.structureAnalysis,
    resumeSignals,
  });

  // ------------------------------
  // riskLayer (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  const riskLayer = {
    documentRisk: buildDocumentRiskLayer({
      state,
      ai,
      keywordSignals,
      objective,
      keywordMatchV2: state?.keywordMatchV2 ?? ai?.keywordMatchV2 ?? null,
    }),
    interviewRisk: buildInterviewRiskLayer({
      hireability,
    }),
  };

  // ------------------------------
  // decisionPressureLayer (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  let decisionPressure = null;
  try {
    decisionPressure = buildDecisionPressure({
      state,
      keywordSignals,
      careerSignals,
      resumeSignals,
      structureAnalysis: structurePack.structureAnalysis,
      objective,
    });
  } catch {
    decisionPressure = null;
  }

  // ------------------------------
  // hiddenRisk (append-only)
  // - 운영 안정성: 실패해도 전체 analyze는 계속 동작
  // ------------------------------
  let hiddenRisk = null;
  try {
    hiddenRisk = computeHiddenRisk({
      state,
      structureAnalysis: structurePack.structureAnalysis,
      hireability,
      majorSignals,
      hypotheses,
    });
  } catch {
    hiddenRisk = null;
  }

  // ✅ UI 호환/반영 보장: report는 "문자열"로 고정 유지 (copy/download 안정)
  const reportText = typeof report === "string" ? report : String(report ?? "");

  // ✅ 객체 결과들은 reportPack으로 분리(문자열 report 유지)
  const reportPack = {
    objective,
    riskLayer,
    decisionPressure,
    hiddenRisk,
    hireability,
    structureAnalysis: structurePack.structureAnalysis,
    structureSummaryForAI: structurePack.structureSummaryForAI,
    structural,
    structuralPatterns: structuralPatternsPack,
    decisionPack,
  };

  // (원하면 유지) 디버그
  // console.log("decisionPack:", decisionPack);

  // ✅ 최종 출력(단일 return로 정리: 이후 코드가 죽지 않게)
  return {
    objective,
    hypotheses,
    report: reportText, // ✅ 텍스트 리포트는 문자열로 고정
    reportPack, // ✅ 객체들은 여기로

    keywordSignals,
    careerSignals,
    resumeSignals,
    majorSignals,

    structureAnalysis: structurePack.structureAnalysis,
    structureSummaryForAI: structurePack.structureSummaryForAI,

    hireability,
    riskLayer,
    decisionPressure,
    hiddenRisk,

    // ✅ 요청 핵심: decisionPack 포함
    decisionPack,

    // ✅ 구조/패턴 포함
    structural,
    structuralPatterns: structuralPatternsPack,
  };
}
