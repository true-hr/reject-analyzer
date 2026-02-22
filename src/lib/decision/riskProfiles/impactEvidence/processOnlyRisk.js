// src/lib/decision/riskProfiles/impactEvidence/processOnlyRisk.js
// 프로세스만 있고 결과/임팩트 신호가 부족한 리스크
// - structuralPatterns: PROCESS_ONLY_PATTERN :contentReference[oaicite:7]{index=7}

function safeNum(v, fallback = null) {
  return Number.isFinite(v) ? v : fallback;
}

function safeStr(v, fallback = "") {
  try {
    return (v ?? "").toString();
  } catch {
    return fallback;
  }
}

function isObj(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function _getStructural(ctx) {
  const c = isObj(ctx) ? ctx : {};
  const structural = isObj(c.structural) ? c.structural : null;

  const flags =
    (structural && Array.isArray(structural.flags) ? structural.flags : null) ||
    (Array.isArray(c.flags) ? c.flags : null) ||
    [];

  const metrics =
    (structural && isObj(structural.metrics) ? structural.metrics : null) ||
    (isObj(c.metrics) ? c.metrics : {}) ||
    {};

  return { flags, metrics };
}

function _findFlag(flags, id) {
  if (!Array.isArray(flags)) return null;
  for (const f of flags) {
    if (!f) continue;
    if (safeStr(f.id) === id) return f;
  }
  return null;
}

function _clamp01(x) {
  const n = safeNum(x, 0);
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function _uniq(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const x of arr) {
    const s = safeStr(x).trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}

export const processOnlyRisk = {
  id: "IMPACT__PROCESS_ONLY",
  group: "impactEvidence",
  layer: "hireability",
  priority: 80,
  severityBase: 4,
  tags: ["impactEvidence", "processOnly"],

  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    if (flag) return true;

    // 보조 트리거: processOnlySignals가 있는 버전 대비
    const signals = Array.isArray(metrics.processOnlySignals) ? metrics.processOnlySignals : null;
    if (!signals) return false;

    // structuralPatterns는 signals length >= 2일 때 트리거하도록 설계 :contentReference[oaicite:8]{index=8}
    return signals.length >= 2;
  },

  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const signals = Array.isArray(metrics.processOnlySignals) ? metrics.processOnlySignals : null;
    if (!signals) return 0;

    // signals 2개 이상이면 중간 이상으로
    // 2 -> 0.7, 3+ -> 0.8
    if (signals.length >= 3) return 0.8;
    if (signals.length >= 2) return 0.7;
    return 0.2;
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    const flag = _findFlag(flags, "PROCESS_ONLY_PATTERN");
    const detail = isObj(flag?.detail) ? flag.detail : {};
    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 6) : [];

    const signals = _uniq(detail.signals || metrics.processOnlySignals || []);

    const why = [
      "문장에 ‘진행/수행/관리/지원’ 같은 프로세스 표현은 많은데, 결과(임팩트/변화)가 무엇인지가 잘 보이지 않습니다.",
      "채용자는 ‘그래서 뭐가 좋아졌는데?’를 빠르게 확인하는데, 결과 신호가 없으면 성과가 없는 업무로 오해될 수 있습니다.",
    ];

    if (signals.length) {
      why.push(`프로세스 신호(일부): ${signals.slice(0, 12).join(", ")}`);
    }

    const fix = [
      "각 bullet 끝에 ‘결과 한 줄’을 강제로 붙이세요. (지표/수치가 없으면 Before→After라도)",
      "프로세스를 쓰려면 ‘왜 그 프로세스를 했는지(문제) → 결과(변화)’를 반드시 같이 적어야 합니다.",
      "결과가 정량화가 어렵다면, 품질/리스크/만족도/속도 같은 ‘측정 가능한 대체 지표’를 정의하세요.",
    ];
    // [PATCH] richer actions (UI prefers actions/action)
    const actions = [
      "각 bullet을 ‘문제 → 내 행동 → 결과’ 3단 구조로 재작성하세요. (결과가 없으면 ‘검증 근거’라도)",
      "결과 수치가 없으면 정성 결과 + 근거로 대체하세요: 승인/채택, 운영 반영, 재사용, 장애/오류 감소, 리스크 제거, 품질 지표 개선.",
      "산출물(artifact)을 명시하세요: PR/설계서/대시보드/가이드/테스트/런북/자동화 스크립트 등.",
      "내 책임 범위를 분리해서 쓰세요: 내가 오너/리드였는지, 어떤 의사결정에 관여했는지, 내가 통제한 영역이 무엇인지.",
      "성과가 지연되는 일이면 ‘완료 정의(DoD)’와 중간지표를 붙이세요: 리드타임, 재작업 감소, QA/버그 감소, CS 감소 등.",
    ];

    // [PATCH] realistic exceptions / counters
    const counterExamples = [
      "초기 구축/마이그레이션/기반 작업은 결과가 늦게 나올 수 있습니다. 대신 ‘운영 반영/배포/모니터링’ 같은 완료 증거를 제시하면 완화됩니다.",
      "조직/환경 영향이 커서 결과를 개인에게 귀속하기 어렵다면, ‘내가 통제한 지표’와 ‘내가 만든 산출물/결정 포인트’를 분리해서 쓰면 신뢰도가 올라갑니다.",
      "성과 수치 공개가 제한되면, 수치 대신 검증 방식(로그/테스트/리뷰/감사)과 변화 방향(증가/감소)을 제시하면 됩니다.",
    ];
    const notes = [];
    notes.push(`processOnlySignals: ${signals.length}`);
    if (signals.length) notes.push(`signals(sample): ${signals.slice(0, 12).join(", ")}`);
    if (evidence.length) notes.push(...evidence);

    const evidenceKeys = ["processOnlySignals"];

    const title = flag?.title
      ? `결과 신호 부족 리스크: ${safeStr(flag.title)}`
      : "프로세스만 있고 결과 신호가 약한 리스크";

    return {
      title,
      why,

      // [PATCH] preferred keys for UI/report
      actions,
      counterExamples,

      // [PATCH] backward-compat aliases (append-only)
      fix,
      action: actions,
      counter: counterExamples,
      counterexample: counterExamples,
      counterExample: counterExamples,
      counterexamples: counterExamples,

      evidenceKeys,
      notes,
    };
  },

  suppressIf: [],
};
