// src/lib/recommendations/actionCatalog.js
// ✅ NEW (append-only): Action Type Catalog v1
// 목적: "리스크/갭 → 액션 타입" 매핑 해상도를 올려 정밀도 향상
// 원칙: 기존 엔진(score/gate/riskProfiles) 불변, recommendations 출력 노출수는 별도(보통 3~5)
// 이 파일은 "카탈로그 + 매칭/스코어링 유틸"만 제공. (오케스트레이션은 기존 위치에서 호출)

// ------------------------------
// 1) 공통 유틸
// ------------------------------
const toNum = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const hasAny = (arr, set) => {
  if (!Array.isArray(arr) || !arr.length) return false;
  const s = new Set(set || []);
  return arr.some((x) => s.has(x));
};

const textMatchAny = (text, patterns) => {
  const t = (text || "").toString();
  if (!t) return false;
  return (patterns || []).some((p) => {
    try {
      if (p instanceof RegExp) return p.test(t);
      return t.includes(String(p));
    } catch {
      return false;
    }
  });
};

// ------------------------------
// 2) 카테고리/effort/roi 기본값
// ------------------------------
const CATEGORY = {
  A_DOC_QUALITY: "A_DOC_QUALITY",
  B_DOMAIN_GATE: "B_DOMAIN_GATE",
  C_EXEC_TRUST: "C_EXEC_TRUST",
  D_COMPETITION: "D_COMPETITION",
  E_EXECUTION: "E_EXECUTION",
};

const EFFORT_PENALTY = {
  S: 0.05,
  M: 0.12,
  L: 0.20,
};

const ROI_WEIGHT = {
  high: 0.18,
  med: 0.10,
  low: 0.04,
};

// ------------------------------
// 3) 액션 타입(총 16개 = 신규 13 + 기존 3)
// - "노출 3개"는 선택 로직에서 적용(이 파일 밖)
// - 여기서는 "후보를 촘촘히 만들어주는 타입 해상도"를 확정
// ------------------------------
export const ACTION_CATALOG = [
  // ==========================
  // A. JD 직결 문장/이력서 품질 (5)
  // ==========================
  {
    id: "rewrite_jd_link",
    category: CATEGORY.A_DOC_QUALITY,
    label: "JD 직결 문장 재작성",
    priorityWeight: 0.90,
    effort: "S",
    roi: "high",
    triggers: {
      // jdGapType 예시: "mustHave" | "preferred" | "coreTasks" | "tools" | "domainKeywords"
      jdGapTypeAny: ["mustHave", "coreTasks", "preferred"],
      riskCodeAny: ["DOC_WEAK", "KEYWORD_MISMATCH", "FIT_WEAK"],
      similarityBelow: 0.62,
      textAny: [/경험\s*없/i, /유사/i, /관련\s*경험/i],
    },
    templates: {
      why: "JD 요구 문장과 이력서 문장이 1:1로 맞물리지 않아 ‘관련성 부족’ 판정이 나기 쉽습니다.",
      how: [
        "JD 요구 → 내가 실제로 한 일(행동) → 결과(성과) 순서로 1문장 재작성",
        "JD 키워드를 ‘그럴듯한 삽입’이 아니라 ‘행동/산출물’과 함께 붙이기",
      ],
      evidenceChecklist: ["개선 전/후 문장 1쌍", "사용 도구/방법 1개", "결과(성과) 1개"],
    },
  },
  {
    id: "quantify_impact",
    category: CATEGORY.A_DOC_QUALITY,
    label: "성과 정량화 강화",
    priorityWeight: 0.86,
    effort: "S",
    roi: "high",
    triggers: {
      riskCodeAny: ["IMPACT_WEAK", "PROOF_WEAK", "VALUE_UNCLEAR"],
      textAny: [/성과/i, /개선/i, /절감/i, /증대/i, /기여/i],
      // 숫자 부재를 직접 계산하기 어려우면 상위에서 "hasNumbers" 플래그를 넘겨도 됨
      flagsAny: ["HAS_LOW_NUMERIC_DENSITY"],
    },
    templates: {
      why: "성과가 ‘느낌’으로만 보이면 면접관은 안전하게 ‘증거 부족’으로 판단합니다.",
      how: [
        "원/시간/%/건수/리드타임/불량률 등 측정 단위를 1개 선택",
        "정확 수치가 없으면 범위(예: 10~15%)라도 제시하고 근거(기간/표본)를 함께 쓰기",
      ],
      evidenceChecklist: ["측정 단위 1개", "기간(언제~언제) 1개", "전/후 비교 또는 기준선 1개"],
    },
  },
  {
    id: "clarify_ownership",
    category: CATEGORY.A_DOC_QUALITY,
    label: "소유/기여도 명확화",
    priorityWeight: 0.84,
    effort: "S",
    roi: "high",
    triggers: {
      riskCodeAny: ["OWNERSHIP_WEAK", "ROLE_AMBIGUOUS"],
      textAny: [/지원/i, /보조/i, /참여/i, /협업/i],
      flagsAny: ["HAS_LOW_SUBJECT_CLARITY"],
    },
    templates: {
      why: "‘참여/지원’만 보이면 실제 기여도가 불명확해 ‘주도성 부족’으로 떨어지기 쉽습니다.",
      how: [
        "문장 첫 단어를 ‘제가/본인이’로 시작하고, ‘내가 결정한 것’ 1개를 포함",
        "역할/범위/권한(예: 담당, 리드, 승인, 협상 등)을 명사로 박아넣기",
      ],
      evidenceChecklist: ["내 역할 명사 1개", "내 결정/판단 1개", "내 산출물 1개"],
    },
  },
  {
    id: "evidence_attach",
    category: CATEGORY.A_DOC_QUALITY,
    label: "증빙(링크/산출물) 첨부",
    priorityWeight: 0.82,
    effort: "M",
    roi: "high",
    triggers: {
      riskCodeAny: ["PROOF_WEAK", "TRUST_LOW"],
      textAny: [/보고서/i, /대시보드/i, /문서/i, /프로세스/i, /정책/i],
      flagsAny: ["HAS_NO_EVIDENCE_LINKS"],
    },
    templates: {
      why: "면접관은 ‘검증 가능한 흔적’이 있으면 의심을 크게 낮춥니다.",
      how: [
        "공개 가능한 범위에서 산출물 유형을 명시(예: 절감 리포트, SOP, 대시보드 캡처)",
        "링크가 어렵다면 ‘문서명/목차/캡처’로 대체하여 존재를 증명",
      ],
      evidenceChecklist: ["산출물 유형 1개", "문서명/캡처 1개", "검증 포인트 1개(무엇을 보면 알 수 있는지)"],
    },
  },
  {
    id: "tighten_scope",
    category: CATEGORY.A_DOC_QUALITY,
    label: "과장/범위 과대 정리(신뢰도)",
    priorityWeight: 0.70,
    effort: "S",
    roi: "med",
    triggers: {
      riskCodeAny: ["TRUST_LOW", "SCOPE_OVERCLAIM"],
      textAny: [/총괄/i, /전사/i, /리드/i, /완전/i, /전부/i],
      flagsAny: ["HAS_SCOPE_OVERCLAIM_SIGNALS"],
    },
    templates: {
      why: "과장처럼 보이면 면접관은 안전하게 ‘신뢰 리스크’로 정리하고 탈락시킵니다.",
      how: [
        "범위를 ‘내가 통제한 구간’으로 축소(예: 전사 → 특정 라인/카테고리)",
        "총괄/리드 표현은 ‘무엇을 리드했는지’(회의, 협상, 분석, 보고 등)로 구체화",
      ],
      evidenceChecklist: ["범위(대상/카테고리) 1개", "내 통제 구간 1개", "성과/결과 1개"],
    },
  },

  // ==========================
  // B. 직무 전환/도메인/게이트 리스크 해소 (3)
  // ==========================
  {
    id: "domain_bridge",
    category: CATEGORY.B_DOMAIN_GATE,
    label: "전환 브릿지 스토리",
    priorityWeight: 0.88,
    effort: "M",
    roi: "high",
    triggers: {
      riskCodeAny: ["DOMAIN_SHIFT", "ROLE_SHIFT", "FIT_WEAK"],
      similarityBelow: 0.55,
      jdGapTypeAny: ["coreTasks", "domainKeywords"],
    },
    templates: {
      why: "전환 지원은 ‘왜 이 직무에서 성과가 날 사람인지’ 연결 논리가 없으면 바로 컷됩니다.",
      how: [
        "이전 경험의 핵심 역량 1개 → 새 JD 핵심 과업 1개로 직접 연결",
        "‘내가 익숙한 일’이 아니라 ‘회사에 돈/성과 되는 메커니즘’으로 설명",
      ],
      evidenceChecklist: ["이전 역량 1개", "JD 과업 1개", "연결 근거(사례/지표) 1개"],
    },
  },
  {
    id: "gap_reframe",
    category: CATEGORY.B_DOMAIN_GATE,
    label: "갭 재해석(대체/유사 경험)",
    priorityWeight: 0.80,
    effort: "S",
    roi: "med",
    triggers: {
      riskCodeAny: ["GAP_HARD", "FIT_WEAK"],
      textAny: [/없습니다/i, /해본\s*적\s*없/i, /경험\s*부족/i],
      jdGapTypeAny: ["mustHave", "tools", "coreTasks"],
    },
    templates: {
      why: "‘없다’로 끝나면 비교 단계에서 바로 밀립니다. ‘가까운 경험’으로 바꿔야 합니다.",
      how: [
        "완전 동일 경험이 없으면: 문제 구조가 같은 유사 경험 1개를 대체로 제시",
        "툴이 없으면: 동일한 업무 흐름(입력→처리→결과)을 다른 툴로 했던 사례를 연결",
      ],
      evidenceChecklist: ["유사 경험 1개", "유사한 문제 구조 1개", "결과 1개"],
    },
  },
  {
    id: "gate_mitigation",
    category: CATEGORY.B_DOMAIN_GATE,
    label: "게이트 완화 포지셔닝",
    priorityWeight: 0.92,
    effort: "S",
    roi: "high",
    triggers: {
      riskCodeAny: ["GATE_AGE", "GATE_SALARY_MISMATCH", "GATE_GAP", "GATE_LEVEL"],
      jdGapTypeAny: ["mustHave", "preferred"],
    },
    templates: {
      why: "게이트는 ‘실력’이 아니라 ‘리스크 관리’ 문제라서, 표현/포지셔닝으로 완화해야 합니다.",
      how: [
        "방어/변명 대신 ‘리스크를 낮추는 조건’(적응 속도, 즉시 투입, 기대수준)을 제시",
        "연봉/레벨은 ‘협의 가능’만 말하지 말고 ‘근거’(시장/역할 범위/성과 기대)를 1줄로 붙이기",
      ],
      evidenceChecklist: ["리스크 낮추는 조건 1개", "즉시 투입 근거 1개", "협상 기준 1개"],
    },
  },

  // ==========================
  // C. 실무 투입 신뢰 (3)
  // ==========================
  {
    id: "tool_exposure",
    category: CATEGORY.C_EXEC_TRUST,
    label: "툴 경험 증빙 패키지",
    priorityWeight: 0.86,
    effort: "M",
    roi: "high",
    triggers: {
      jdGapTypeAny: ["tools"],
      similarityBelow: 0.60,
      textAny: [/SAP/i, /ERP/i, /SRM/i, /MRO/i],
    },
    templates: {
      why: "툴은 ‘써봤다’가 아니라 ‘업무 흐름에서 쓸 수 있다’가 보여야 합격합니다.",
      how: [
        "작업 흐름 3단계로 제시(입력/조회 → 처리/의사결정 → 결과/리포트)",
        "교육 수료 + 화면 캡처/샘플 데이터 + 미니 산출물(리포트 1장)로 패키징",
      ],
      evidenceChecklist: ["교육/학습 1개", "화면 캡처 또는 샘플 1개", "산출물 1개(리포트/정리)"],
    },
  },
  {
    id: "process_case",
    category: CATEGORY.C_EXEC_TRUST,
    label: "프로세스 케이스 1개 압축",
    priorityWeight: 0.82,
    effort: "M",
    roi: "high",
    triggers: {
      jdGapTypeAny: ["coreTasks", "mustHave"],
      riskCodeAny: ["EXEC_TRUST_LOW", "FIT_WEAK"],
      textAny: [/전략소싱/i, /원가절감/i, /협상/i, /구매/i, /카테고리/i],
    },
    templates: {
      why: "면접관이 원하는 건 ‘업무 한 번을 끝까지 굴린 흔적’입니다.",
      how: [
        "문제(상황) → 분석(기준/데이터) → 행동(협상/개선) → 결과(절감/리드타임) 4줄로 압축",
        "가급적 한 케이스에 숫자 1개를 얹기",
      ],
      evidenceChecklist: ["문제/목표 1줄", "분석 기준 1개", "행동 1개", "결과 수치 1개"],
    },
  },
  {
    id: "decision_trace",
    category: CATEGORY.C_EXEC_TRUST,
    label: "의사결정 근거(트레이드오프) 기록",
    priorityWeight: 0.74,
    effort: "S",
    roi: "med",
    triggers: {
      riskCodeAny: ["DECISION_WEAK", "STRATEGY_WEAK"],
      jdGapTypeAny: ["coreTasks", "domainKeywords"],
      textAny: [/기준/i, /검토/i, /트레이드오프/i, /의사결정/i],
    },
    templates: {
      why: "기획/전략/소싱 역할은 ‘왜 그렇게 했는지’가 안 보이면 실무 투입 신뢰가 떨어집니다.",
      how: [
        "선택지 2개 이상 → 평가 기준 2개 → 선택 이유 1개(트레이드오프 포함)로 3문장 작성",
        "의사결정이 결과(절감/리스크 감소)로 어떻게 이어졌는지 1줄 덧붙이기",
      ],
      evidenceChecklist: ["선택지 2개", "기준 2개", "트레이드오프 1개"],
    },
  },

  // ==========================
  // D. 경쟁 압력/우대사항 대응 (2)
  // ==========================
  {
    id: "benchmark_story",
    category: CATEGORY.D_COMPETITION,
    label: "경쟁자 대비 차별점 프레임",
    priorityWeight: 0.76,
    effort: "S",
    roi: "med",
    triggers: {
      jdGapTypeAny: ["preferred"],
      riskCodeAny: ["COMPETITION_PRESSURE", "PREFERRED_GAP"],
      textAny: [/우대/i, /preferred/i, /plus/i],
    },
    templates: {
      why: "우대사항은 ‘컷’은 아니지만 경쟁 비교에서 밀리는 포인트입니다.",
      how: [
        "보통 지원자들이 A를 강조 → 저는 B로 차별화(근거/사례 포함) 2문장",
        "차별점은 ‘성과/속도/리스크 관리’ 중 하나로 고정",
      ],
      evidenceChecklist: ["차별점 1개", "근거 사례 1개", "결과(성과) 1개"],
    },
  },
  {
    id: "credential_shortcut",
    category: CATEGORY.D_COMPETITION,
    label: "자격증 ROI 최소 경로",
    priorityWeight: 0.62,
    effort: "M",
    roi: "med",
    triggers: {
      jdGapTypeAny: ["preferred"],
      textAny: [/CPSM/i, /CPIM/i, /자격증/i],
      riskCodeAny: ["PREFERRED_GAP", "COMPETITION_PRESSURE"],
    },
    templates: {
      why: "자격증은 시간/비용 대비 효과가 들쭉날쭉이라, ROI 기준으로만 접근해야 합니다.",
      how: [
        "직무/채용공고에서 실제로 ‘가점’이 되는지 먼저 확인",
        "가점이면 ‘단기 준비 가능한 경로’만 선택(강의/교재/기간/목표 점수)",
      ],
      evidenceChecklist: ["공고 근거 1개", "준비기간 1개", "목표(점수/합격) 1개"],
    },
  },

  // ==========================
  // E. 실행 방식(기존 3) — 유지
  // ==========================
  {
    id: "learning",
    category: CATEGORY.E_EXECUTION,
    label: "학습/정리",
    priorityWeight: 0.58,
    effort: "M",
    roi: "med",
    triggers: {},
    templates: {
      why: "학습만으로는 약하니, 반드시 산출물(정리/요약/샘플)을 남겨 신뢰로 전환해야 합니다.",
      how: ["학습 내용 1페이지 요약", "샘플 과제 1개 수행", "면접/서류 문장 1개로 연결"],
      evidenceChecklist: ["요약 1장", "샘플 1개", "서류 문장 1개"],
    },
  },
  {
    id: "project",
    category: CATEGORY.E_EXECUTION,
    label: "미니 프로젝트/케이스 제작",
    priorityWeight: 0.66,
    effort: "L",
    roi: "high",
    triggers: {},
    templates: {
      why: "프로젝트는 ‘실무 투입 신뢰’를 가장 빨리 올리지만, 비용이 큰 액션입니다.",
      how: ["케이스 1개 선정", "프로세스 4줄 요약", "성과(가정치라도) 1개 제시"],
      evidenceChecklist: ["케이스 1개", "프로세스 4줄", "성과 수치 1개"],
    },
  },
  {
    id: "certification",
    category: CATEGORY.E_EXECUTION,
    label: "조건부 자격증 검토",
    priorityWeight: 0.54,
    effort: "L",
    roi: "med",
    triggers: {},
    templates: {
      why: "자격증은 ‘우대/경쟁’에서 도움되지만, 실무 증거를 대체하진 못합니다.",
      how: ["공고/채용팀이 실제로 보는지 확인", "준비 기간 산정", "필요 시에만 진행"],
      evidenceChecklist: ["공고 근거 1개", "기간 1개", "대체 증거(프로젝트/증빙) 1개"],
    },
  },
];

// ------------------------------
// 4) 매칭/스코어링
// 입력 context 예시:
// {
//   jdGapItem: { type, text, similarity, strength },
//   riskCodes: ["DOMAIN_SHIFT", "IMPACT_WEAK"],
//   flags: ["HAS_LOW_NUMERIC_DENSITY"],
//   rawText: "...", // (optional) resume/jd snippet
// }
// ------------------------------
export function scoreActionType(action, context = {}) {
  const { jdGapItem, riskCodes, flags, rawText } = context || {};
  const gapType = jdGapItem?.type || null;
  const gapText = jdGapItem?.text || jdGapItem?.signalText || "";
  const sim = toNum(jdGapItem?.similarity, toNum(jdGapItem?.sim, 1));

  const t = action?.triggers || {};

  // 기본 점수 = priorityWeight
  let score = toNum(action?.priorityWeight, 0.5);

  // 트리거: jdGapType
  if (Array.isArray(t.jdGapTypeAny) && t.jdGapTypeAny.length) {
    score += t.jdGapTypeAny.includes(gapType) ? 0.18 : -0.06;
  }

  // 트리거: risk codes
  if (Array.isArray(t.riskCodeAny) && t.riskCodeAny.length) {
    score += hasAny(riskCodes, t.riskCodeAny) ? 0.18 : 0;
  }

  // 트리거: similarity
  if (typeof t.similarityBelow === "number") {
    score += sim < t.similarityBelow ? 0.14 : -0.02;
  }

  // 트리거: flags
  if (Array.isArray(t.flagsAny) && t.flagsAny.length) {
    score += hasAny(flags, t.flagsAny) ? 0.12 : 0;
  }

  // 트리거: text patterns
  const combinedText = `${gapText}\n${rawText || ""}`;
  if (Array.isArray(t.textAny) && t.textAny.length) {
    score += textMatchAny(combinedText, t.textAny) ? 0.10 : 0;
  }

  // effort penalty / roi bonus
  score -= EFFORT_PENALTY[action?.effort] || 0;
  score += ROI_WEIGHT[action?.roi] || 0;

  return clamp(score, 0, 1);
}

export function deriveActionCandidates(context = {}) {
  // 모든 액션 타입을 스캔하고 스코어를 붙여 반환(후보 다수)
  const list = ACTION_CATALOG.map((a) => {
    const s = scoreActionType(a, context);
    return {
      id: a.id,
      category: a.category,
      label: a.label,
      score: s,
      effort: a.effort,
      roi: a.roi,
      templates: a.templates,
    };
  });

  // score 높은 순
  list.sort((x, y) => (y.score || 0) - (x.score || 0));
  return list;
}

// ✅ APPEND-ONLY: Selection rules (top-N) with coverage/diversity
// 이 블록은 deriveActionCandidates() 출력(후보 다수)을 받아 최종 노출 N개를 고릅니다.
//
// 설계 원칙
// - 노출 기본값 N=3 (UI 요구)
// - 커버리지 3축 중 최소 2축 포함
//   (1) JD 갭 해소 축: tools/coreTasks/mustHave/preferred
//   (2) 증빙/정량 축: quantify_impact/evidence_attach/clarify_ownership/rewrite_jd_link
//   (3) 리스크 해소 축: domain_bridge/gap_reframe/gate_mitigation
// - 동일 category 2개 이상은 패널티
// - effort L (project/certification)은 1개 이하로 제한(과추천 방지)

const AXIS = {
  GAP: "AXIS_GAP",
  PROOF: "AXIS_PROOF",
  RISK: "AXIS_RISK",
};

const ACTION_AXIS = {
  // 증빙/정량/문장
  rewrite_jd_link: AXIS.PROOF,
  quantify_impact: AXIS.PROOF,
  clarify_ownership: AXIS.PROOF,
  evidence_attach: AXIS.PROOF,
  tighten_scope: AXIS.PROOF,

  // 리스크/전환/게이트
  domain_bridge: AXIS.RISK,
  gap_reframe: AXIS.RISK,
  gate_mitigation: AXIS.RISK,

  // 갭/실무 투입
  tool_exposure: AXIS.GAP,
  process_case: AXIS.GAP,
  decision_trace: AXIS.GAP,
  benchmark_story: AXIS.GAP,
  credential_shortcut: AXIS.GAP,

  // 실행 방식(기본은 GAP 축에 포함)
  learning: AXIS.GAP,
  project: AXIS.GAP,
  certification: AXIS.GAP,
};

function getAxisForActionId(id) {
  return ACTION_AXIS[id] || AXIS.GAP;
}

function uniqueById(list) {
  const seen = new Set();
  const out = [];
  for (const x of list || []) {
    const id = x?.id;
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
  }
  return out;
}

function countBy(list, keyFn) {
  const m = new Map();
  for (const x of list || []) {
    const k = keyFn(x);
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}

function hasAtLeastAxes(selected, minAxes = 2) {
  const axes = new Set((selected || []).map((x) => getAxisForActionId(x.id)));
  return axes.size >= minAxes;
}

function scoreWithSelectionPenalties(candidate, selected) {
  // candidate: { id, category, score, effort, roi, ... }
  // selected: already chosen list

  let s = toNum(candidate?.score, 0);

  // 1) category diversity penalty
  const cat = candidate?.category;
  if (cat) {
    const catCount = (selected || []).filter((x) => x?.category === cat).length;
    if (catCount >= 1) s -= 0.10; // 같은 category가 이미 있으면 패널티
    if (catCount >= 2) s -= 0.12; // 2개 이상이면 더 강하게
  }

  // 2) axis diversity bonus (새 축이면 약간 보너스)
  const candAxis = getAxisForActionId(candidate?.id);
  const axes = new Set((selected || []).map((x) => getAxisForActionId(x.id)));
  if (!axes.has(candAxis)) s += 0.06;

  // 3) effort L constraint handled elsewhere, but small penalty here too
  if ((candidate?.effort || "") === "L") s -= 0.06;

  return clamp(s, 0, 1);
}

function enforceEffortConstraints(selected, maxEffortL = 1) {
  // effort L이 너무 많으면 점수 낮은 L부터 제거
  const Ls = (selected || []).filter((x) => (x?.effort || "") === "L");
  if (Ls.length <= maxEffortL) return selected;

  const keep = [];
  const drop = [];

  // L만 점수 낮은 순으로 드랍 대상 선정
  const sortedL = [...Ls].sort((a, b) => (toNum(a.score, 0) - toNum(b.score, 0)));
  const toDropCount = sortedL.length - maxEffortL;
  const dropSet = new Set(sortedL.slice(0, toDropCount).map((x) => x.id));

  for (const x of selected || []) {
    if (dropSet.has(x.id)) drop.push(x);
    else keep.push(x);
  }
  return keep;
}

function buildSelectionReasons(finalSelected, candidates, opts) {
  const reasons = [];
  const axes = new Set((finalSelected || []).map((x) => getAxisForActionId(x.id)));

  reasons.push({
    rule: "N_LIMIT",
    detail: `최종 노출 N=${opts?.n || 3} 고정`,
  });

  reasons.push({
    rule: "COVERAGE",
    detail: `커버리지 축=${Array.from(axes).join(", ")} (최소 ${opts?.minAxes || 2}축)`,
  });

  const cats = countBy(finalSelected, (x) => x?.category || "UNKNOWN");
  const catPairs = Array.from(cats.entries()).map(([k, v]) => `${k}:${v}`).join(", ");
  reasons.push({
    rule: "DIVERSITY",
    detail: `카테고리 분포=${catPairs || "none"}`,
  });

  const effortL = (finalSelected || []).filter((x) => (x?.effort || "") === "L").length;
  reasons.push({
    rule: "EFFORT_L_CAP",
    detail: `effort=L 개수=${effortL} (상한 ${opts?.maxEffortL ?? 1})`,
  });

  // 상위 후보 대비 선택된 이유(간단)
  const topCandidateIds = (candidates || []).slice(0, 8).map((c) => c.id);
  reasons.push({
    rule: "TOP_POOL",
    detail: `상위 후보 풀(top8)=${topCandidateIds.join(", ")}`,
  });

  return reasons;
}

/**
 * selectTopActions
 * - candidates: deriveActionCandidates(context) 결과 배열
 * - opts:
 *   - n: 최종 노출 개수 (default 3)
 *   - minAxes: 최소 커버리지 축 수 (default 2)
 *   - maxEffortL: effort=L 최대 허용 수 (default 1)
 *   - preferAxes: 특정 축을 우선하고 싶을 때 (optional)
 */
export function selectTopActions(candidates = [], opts = {}) {
  const n = toNum(opts?.n, 3);
  const minAxes = toNum(opts?.minAxes, 2);
  const maxEffortL = typeof opts?.maxEffortL === "number" ? opts.maxEffortL : 1;

  const pool = uniqueById(candidates || []).filter((c) => toNum(c?.score, 0) > 0);

  // 0) 기본 점수 순 정렬
  pool.sort((a, b) => (toNum(b.score, 0) - toNum(a.score, 0)));

  const selected = [];

  // 1) Greedy pick with penalties/bonuses
  while (selected.length < n && pool.length) {
    let bestIdx = 0;
    let bestScore = -1;

    for (let i = 0; i < pool.length; i++) {
      const cand = pool[i];

      // effort L 상한 강제(선택 단계에서 미리 방지)
      if ((cand?.effort || "") === "L") {
        const currL = selected.filter((x) => (x?.effort || "") === "L").length;
        if (currL >= maxEffortL) continue;
      }

      const s = scoreWithSelectionPenalties(cand, selected);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }

    const picked = pool.splice(bestIdx, 1)[0];
    if (!picked) break;
    selected.push(picked);
  }

  // 2) Effort constraints hard-enforce
  let finalSelected = enforceEffortConstraints(selected, maxEffortL);

  // 3) Coverage enforce: 최소 축 수가 부족하면 교체 시도
  if (!hasAtLeastAxes(finalSelected, minAxes)) {
    // 목표: 부족한 축을 채우기
    const haveAxes = new Set(finalSelected.map((x) => getAxisForActionId(x.id)));
    const allAxes = [AXIS.GAP, AXIS.PROOF, AXIS.RISK];
    const missing = allAxes.filter((a) => !haveAxes.has(a));

    // missing 축 하나라도 채우도록, pool에서 해당 축 후보를 찾아
    // finalSelected에서 점수 가장 낮은 항목과 교체
    for (const needAxis of missing) {
      if (hasAtLeastAxes(finalSelected, minAxes)) break;

      const replacement = pool.find((c) => getAxisForActionId(c.id) === needAxis);
      if (!replacement) continue;

      // 교체 대상: 현재 선택 중 score가 가장 낮은 것(단, 같은 axis가 1개뿐인 축은 보호)
      let dropIdx = -1;
      let dropScore = 2;

      for (let i = 0; i < finalSelected.length; i++) {
        const item = finalSelected[i];
        const itemAxis = getAxisForActionId(item.id);

        // axis 보호: 해당 axis가 1개뿐이면 드랍 금지
        const axisCount = finalSelected.filter((x) => getAxisForActionId(x.id) === itemAxis).length;
        if (axisCount <= 1) continue;

        const s = toNum(item.score, 0);
        if (s < dropScore) {
          dropScore = s;
          dropIdx = i;
        }
      }

      // 보호 로직 때문에 못 고르면 그냥 가장 낮은 것 드랍
      if (dropIdx < 0) {
        let minIdx = 0;
        let minS = 2;
        for (let i = 0; i < finalSelected.length; i++) {
          const s = toNum(finalSelected[i].score, 0);
          if (s < minS) { minS = s; minIdx = i; }
        }
        dropIdx = minIdx;
      }

      finalSelected.splice(dropIdx, 1, replacement);
    }

    // 다시 effort L 상한 보정
    finalSelected = enforceEffortConstraints(finalSelected, maxEffortL);
  }

  // 4) 설명(reason) 붙이기
  const reasons = buildSelectionReasons(finalSelected, candidates, { n, minAxes, maxEffortL });

  return {
    items: finalSelected.slice(0, n),
    meta: {
      n,
      minAxes,
      maxEffortL,
      reasons,
      axes: Array.from(new Set(finalSelected.map((x) => getAxisForActionId(x.id)))),
    },
  };
}