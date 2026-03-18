// src/lib/hrViewModel.js
// 목적: decisionPack(특히 riskResults)을 "서류 HR 스크리닝 관점"으로 요약해 UI에 제공
// 원칙: 엔진/score/decision 로직에는 절대 개입하지 않고, "표시용 데이터"만 생성한다.

function __safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function __safeStr(v) {
  return (v ?? "").toString();
}

function __safeLower(v) {
  return __safeStr(v).trim().toLowerCase();
}

function __getRiskId(x) {
  // risk 객체의 id/code/slug 등 다양한 키를 안전하게 흡수
  const id = x?.id ?? x?.code ?? x?.riskId ?? x?.slug ?? "";
  return __safeStr(id);
}

function __getRiskTitle(x) {
  // 기존 구조 유지: title 우선, 없으면 explain.title
  const t = x?.title ?? x?.explain?.title ?? "";
  return __safeStr(t);
}

function __isGateRisk(x) {
  // 현재 코드베이스에서 Gate는 보통 "GATE__" prefix 또는 group이 gate류로 잡힘
  const id = __getRiskId(x);
  const group = __safeLower(x?.group);
  if (id.startsWith("GATE__")) return true;
  if (group === "gate" || group === "gates") return true;
  // 일부 gate profile은 group이 다를 수 있으니, layer/document + id 규칙 외엔 과하게 추론하지 않음
  return false;
}

function __getPriority(x) {
  // priority는 숫자 클수록(혹은 작을수록) 어떤 정렬인지 케이스가 있을 수 있어,
  // 우선 "숫자"만 확보하고, 정렬은 아래에서 명시적으로 처리
  return __safeNum(x?.priority, 0);
}

function __getLayer(x) {
  return __safeLower(x?.layer);
}

// 방어 가능성(Defensibility) — 초기: 고정 매핑(안정성 최우선)
// * 0.0 = 거의 방어 불가(서류에서 보수적 컷으로 작동)
// * 1.0 = 방어 매우 쉬움(면접에서 설득 가능)
const __DEFENSIBILITY_MAP = {
  // Gate/강한 컷 신호
  "GATE__AGE": 0.1,

  // salary/compensation 계열
  "salaryMismatchRisk": 0.2,
  "salaryDownshiftRisk": 0.3,

  // 도메인/산업 전환 — 방어는 가능하나 근거 필요
  "domainShiftRisk": 0.5,

  // ownership/initiative/impact 계열 — 면접에서 설명으로 보완 가능성이 비교적 큼
  "ownershipRatioRisk": 0.7,
  "decisionSignalRisk": 0.7,
  "impactVerbRisk": 0.8,
  "quantifiedImpactRisk": 0.8,
  "processOnlyRisk": 0.8,

  // role/skill 매칭 — JD 필수 누락은 방어가 어려운 편
  "mustHaveSkillMissingRisk": 0.3,
  "jdKeywordAbsenceRisk": 0.4,
  // ✅ PATCH (append-only): new normalized ids support
  "GATE__SALARY_MISMATCH": 0.2,
  "GATE__SALARY_DOWNSHIFT": 0.3,

  "SIMPLE__DOMAIN_SHIFT": 0.5,
  "SIMPLE__ROLE_SHIFT": 0.55,

  "ROLE_SKILL__MUST_HAVE_MISSING": 0.3,
  "ROLE_SKILL__JD_KEYWORD_ABSENCE": 0.4,
  "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY": 0.45,

  "OWNERSHIP__NO_PROJECT_INITIATION_SIGNAL": 0.7,
  "OWNERSHIP__NO_DECISION_AUTHORITY_SIGNAL": 0.7,
  "OWNERSHIP__LOW_OWNERSHIP_VERB_RATIO": 0.7,

  "IMPACT__NO_QUANTIFIED_IMPACT": 0.8,
  "IMPACT__LOW_IMPACT_VERBS": 0.8,
  "IMPACT__PROCESS_ONLY": 0.8,

  "LOW_CONTENT_DENSITY_RISK": 0.6,
};

function __getDefensibility(x) {
  const id = __getRiskId(x);
  if (__DEFENSIBILITY_MAP.hasOwnProperty(id)) return __DEFENSIBILITY_MAP[id];

  // Gate prefix는 기본적으로 방어 난이도 낮게(= defensibility 낮게)
  if (id.startsWith("GATE__")) return 0.2;

  // 기본값: 보통(추가 학습/데이터 전까지 과한 단정 금지)
  return 0.5;
}

function __defLabel(def) {
  const d = __safeNum(def, 0.5);
  if (d <= 0.25) return "방어 어려움";
  if (d <= 0.6) return "방어 보통";
  return "방어 쉬움";
}

function __pickTopRisks(riskResults) {
  const arr = Array.isArray(riskResults) ? riskResults.slice() : [];

  // 정렬 규칙(초기 버전, HR 1차 서류 관점):
  // 1) Gate 우선
  // 2) layer=document 우선
  // 3) priority 높은 순 (현재 프로젝트에서 priority가 "우선순위" 의미로 쓰이는 케이스가 많음)
  //    * 만약 실제론 priority가 "낮을수록 우선"이면, 여기만 뒤집으면 됨(나중에 데이터로 튜닝)
  arr.sort((a, b) => {
    const ga = __isGateRisk(a) ? 1 : 0;
    const gb = __isGateRisk(b) ? 1 : 0;
    if (ga !== gb) return gb - ga;

    const la = __getLayer(a) === "document" ? 1 : 0;
    const lb = __getLayer(b) === "document" ? 1 : 0;
    if (la !== lb) return lb - la;

    const pa = __getPriority(a);
    const pb = __getPriority(b);
    if (pa !== pb) return pb - pa;

    // tie-breaker: title 안정 정렬
    const ta = __getRiskTitle(a);
    const tb = __getRiskTitle(b);
    return ta.localeCompare(tb);
  });

  return arr;
}

export function buildHrViewModel(decisionPack) {
  // ✅ PATCH (append-only): prefer riskFeed when present (UI expansion), fallback to riskResults
  const riskFeed =
    Array.isArray(decisionPack?.riskFeed) && decisionPack.riskFeed.length
      ? decisionPack.riskFeed
      : null;

  const riskResults =
    Array.isArray(decisionPack?.riskResults) && decisionPack.riskResults.length
      ? decisionPack.riskResults
      : null;

  const __hasHrStructuralRisk = Array.isArray(riskResults)
    ? riskResults.some((r) => {
      const id = String(r?.id || "").trim();
      return id === "HR_ALIGNMENT_GAP" || id === "STRATEGIC_SCOPE_GAP";
    })
    : false;

  const __listForView = __hasHrStructuralRisk ? (riskResults || riskFeed || []) : (riskFeed || riskResults || []);

  const sorted = __pickTopRisks(__listForView);

  const primary = sorted[0] || null;
  const secondary = sorted.slice(1, 3);
  const decoratedRisks = sorted.map((x) => {
    const def = __getDefensibility(x);
    return {
      ...x,
      hrMeta: {
        defensibility: def,
        defensibilityLabel: __defLabel(def),
        isGate: __isGateRisk(x),
        titleSafe: __getRiskTitle(x),
        idSafe: __getRiskId(x),
      },
    };
  });

  // Primary/Secondary는 "요약 카드"에서 쓰기 쉽게 최소 필드만 추려서 제공
  const primarySummary = primary
    ? {
      id: __getRiskId(primary),
      title: __getRiskTitle(primary),
      isGate: __isGateRisk(primary),
      priority: __getPriority(primary),
      layer: __getLayer(primary),
      defensibility: __getDefensibility(primary),
      defensibilityLabel: __defLabel(__getDefensibility(primary)),
    }
    : null;

  const secondarySummaries = (secondary || []).map((x) => ({
    id: __getRiskId(x),
    title: __getRiskTitle(x),
    isGate: __isGateRisk(x),
    priority: __getPriority(x),
    layer: __getLayer(x),
    defensibility: __getDefensibility(x),
    defensibilityLabel: __defLabel(__getDefensibility(x)),
  }));

  return {
    primary: primarySummary,
    secondary: secondarySummaries,
    riskResultsDecorated: decoratedRisks,
  };
}
