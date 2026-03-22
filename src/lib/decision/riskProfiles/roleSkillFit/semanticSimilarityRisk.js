// src/lib/decision/riskProfiles/roleSkillFit/semanticSimilarityRisk.js
// JD-이력서 의미 유사도 낮음 리스크
// - structuralPatterns의 LOW_SEMANTIC_SIMILARITY_PATTERN 플래그를 profile로 승격
// - metrics.semanticSimilarity(= Jaccard similarity)를 근거로 사용
// ✅ crash-safe: ctx 구조가 달라도 최대한 안전하게 동작

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

function _getEvidenceFitMeta(ctx) {
  return ctx && isObj(ctx.evidenceFit) && isObj(ctx.evidenceFit.meta)
    ? ctx.evidenceFit.meta
    : null;
}

function _countHrAdjacentEvidenceHits(text) {
  const src = safeStr(text).toLowerCase();
  if (!src) return 0;
  const patterns = [
    /hrbp|employee relations|구성원 이슈|조직 이슈|er\b/g,
    /hr operations|people operations|인사 운영|인사행정|hris/g,
    /recruit|채용 운영|채용 프로세스|온보딩|onboarding/g,
    /attendance|근태|입퇴사|4대보험|payroll/g,
    /policy|규정|제도|직원 문의|employee inquiry/g,
    /process improvement|프로세스 개선|운영 개선|workflow/g,
    /workforce planning|headcount planning|인력 운영|인력 계획/g,
    /performance|compensation|평가|보상/g,
    /data-driven|hr data|인사 데이터|analytics|report/g,
  ];
  let hits = 0;
  for (const re of patterns) {
    if (re.test(src)) hits += 1;
  }
  return hits;
}

function _hasHrAdjacentSimilarityGuard(ctx) {
  const meta = _getEvidenceFitMeta(ctx);
  if (!meta) return false;
  const isHrAdjacentTransition =
    meta?.hrFamilyFit === true &&
    meta?.hrTransitionFit === true &&
    safeStr(meta?.transitionDecisionType).trim() === "CAREER_LADDER_TRANSITION";
  if (!isHrAdjacentTransition) return false;

  const domCount = Array.isArray(meta?.dominantHrDomains) ? meta.dominantHrDomains.filter(Boolean).length : 0;
  const hintCount = Array.isArray(meta?.hrEvidenceHints) ? meta.hrEvidenceHints.filter(Boolean).length : 0;
  const hrConcreteHits = _countHrAdjacentEvidenceHits(ctx?.state?.resume || ctx?.resumeText || "");
  const hasDirectness = !!safeStr(meta?.hrDomainDirectnessHint).trim();

  return domCount >= 2 || hintCount >= 1 || hasDirectness || hrConcreteHits >= 3;
}

export const semanticSimilarityRisk = {
  id: "ROLE_SKILL__LOW_SEMANTIC_SIMILARITY",
  group: "roleSkillFit",
  layer: "hireability",
  priority: 82,
  severityBase: 4,
  tags: ["roleSkillFit", "semanticSimilarity", "jdMatch"],

  // 트리거:
  // 1) structuralPatterns가 LOW_SEMANTIC_SIMILARITY_PATTERN을 찍었으면 true
  // 2) 플래그가 없더라도(연결/버전 차이 대비) metrics.semanticSimilarity가 있고 threshold보다 낮으면 true
  when: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);

    if (_hasHrAdjacentSimilarityGuard(ctx)) {
      const simGuard = safeNum(metrics.semanticSimilarity, null);
      const criticalCutGuard =
        safeNum(metrics.semanticSimilarityCriticalCut, null) ??
        0.22;
      if (simGuard == null || simGuard >= criticalCutGuard) return false;
    }

    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");
    if (flag) return true;

    const sim = safeNum(metrics.semanticSimilarity, null);
    if (sim == null) return false;

    const threshold =
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    return sim < threshold;
  },

  // score: 0~1
  // - structuralPatterns의 score를 우선 사용(있으면 그대로)
  // - 없으면 structuralPatterns와 동일한 수식으로 계산:
  //   score = clamp((threshold - sim)/threshold + 0.3, 0, 1)
  score: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    if (_hasHrAdjacentSimilarityGuard(ctx)) {
      const simGuard = safeNum(metrics.semanticSimilarity, null);
      const criticalCutGuard =
        safeNum(metrics.semanticSimilarityCriticalCut, null) ??
        0.22;
      if (simGuard == null || simGuard >= criticalCutGuard) return 0;
    }

    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");
    if (flag && Number.isFinite(flag.score)) return _clamp01(flag.score);

    const sim = safeNum(metrics.semanticSimilarity, null);
    if (sim == null) return 0;

    const threshold =
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    const raw = (threshold - sim) / threshold + 0.3;
    return _clamp01(raw);
  },

  explain: (ctx) => {
    const { flags, metrics } = _getStructural(ctx);
    const flag = _findFlag(flags, "LOW_SEMANTIC_SIMILARITY_PATTERN");

    const detail = isObj(flag?.detail) ? flag.detail : {};

    const sim =
      safeNum(detail.similarity, null) ??
      safeNum(detail.semanticSimilarity, null) ??
      safeNum(metrics.semanticSimilarity, null);

    const threshold =
      safeNum(detail.threshold, null) ??
      safeNum(metrics.semanticSimilarityThreshold, null) ??
      safeNum(metrics.semanticSimilarityThresh, null) ??
      0.35;

    const criticalCut =
      safeNum(detail.criticalCut, null) ??
      safeNum(metrics.semanticSimilarityCriticalCut, null) ??
      0.22;

    const evidence = Array.isArray(flag?.evidence) ? flag.evidence.filter(Boolean).slice(0, 8) : [];

    const why = [];
    if (sim != null) {
      why.push(
        `JD와 이력서(포트폴리오 포함)에서 ‘같은 의미/도메인’으로 읽히는 단어군이 적습니다. (유사도 ${Math.round(sim * 100)}%)`
      );
      why.push(
        `채용 입장에서는 “같은 일을 해본 사람”인지 “다른 일을 해온 사람”인지 1차로 거르는 지표로 작동합니다.`
      );
    } else {
      why.push("JD와 이력서(포트폴리오 포함) 간 의미 유사도가 낮게 감지됩니다.");
    }

    // 구체 수치 메모
    const notes = [];
    if (sim != null) notes.push(`semanticSimilarity(Jaccard): ${Math.round(sim * 1000) / 1000}`);
    notes.push(`threshold: ${threshold}`);
    notes.push(`criticalCut: ${criticalCut}`);
    if (evidence.length) notes.push(...evidence);

    const fix = [
      "JD 문장을 그대로 ‘복붙’하지 말고, JD의 핵심 명사(도메인/툴/산출물)를 경험 bullet 안에 자연스럽게 녹이세요.",
      "유사도를 올리는 가장 빠른 방식은 ‘도메인 명사 + 행동동사 + 결과(지표)’ 3요소를 JD의 표현과 최대한 동일한 언어로 맞추는 겁니다.",
      "정말 다른 도메인이라면: “내 기존 도메인에서 했던 X가, 지원 도메인에서 Y로 그대로 대응된다” 매핑을 3개로 고정해서 상단에 배치하세요.",
    ];
    // [PATCH] richer actions/templates (UI prefers actions/action)
    const actions = [
      "JD에서 핵심 책임/스킬 Top 5를 뽑고, 이력서에서 각각을 ‘내 역할 + 산출물 + 결과’ 문장 1개로 직접 매칭하세요.",
      "키워드만 나열하지 말고, JD 표현과 최대한 같은 언어(도메인 명사/툴/산출물)를 사용해 문장을 재작성하세요.",
      "도메인 전환이라면 ‘기존 X 경험 → 지원 직무 Y로 그대로 대응’ 브릿지 매핑을 3개로 정리해 상단에 배치하세요.",
      "JD 요구사항과 직접 겹치는 프로젝트를 상단으로 재배치하고, 겹치지 않는 경험은 하단으로 내리세요.",
      "포트폴리오/링크가 있다면 JD 키워드와 동일한 용어로 섹션 제목을 맞추세요. (채용자는 스캔합니다)",
    ];

    // [PATCH] realistic exceptions / counters
    const counterExamples = [
      "인접 도메인/직무 전환은 유사도가 낮아도 합격 가능합니다. 단, 학습/적응 속도와 유사 프로젝트 경험 증거가 있어야 합니다.",
      "JD가 포괄적/과장된 경우도 있습니다. 실제 수행 업무와 일치하는 산출물/프로젝트 증거가 있으면 유사도 낮음이 완화됩니다.",
      "스타트업/소규모 조직 경험은 직무명이 다를 수 있습니다. 대신 ‘실제 수행 역할’ 중심으로 재서술하면 유사도 해석이 달라집니다.",
    ];
    const evidenceKeys = ["semanticSimilarity", "semanticSimilarityThreshold", "jdKeywords", "jdKeywordHits"];

    // 제목은 flag가 주면 그걸 우선
    const title = flag?.title
      ? `JD-이력서 의미 유사도 리스크: ${safeStr(flag.title)}`
      : "JD-이력서 의미 유사도 낮음 리스크";

    return {
      title,
      why,

      // [PATCH] preferred keys
      actions,
      counterExamples,

      // [PATCH] backward-compat aliases
      fix,
      action: actions,
      counter: counterExamples,
      counterexample: counterExamples,
      counterExample: counterExamples,
      counterexamples: counterExamples,

      evidenceKeys,
      notes: notes.length ? notes : undefined,
    };
  },

  suppressIf: [],
};
