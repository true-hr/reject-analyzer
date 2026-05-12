import { getRecordPresetByJobId } from "@/data/workRecord/jobExtensionRegistry.js";

function normalizeLabel(label) {
  return String(label || "").trim().toLowerCase();
}

function dedupeByLabel(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalizeLabel(item.label);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Returns deterministic skill recommendations from job preset and work record history.
 * No AI call — safe to call synchronously in useMemo.
 */
export function buildResumeSkillRecommendations({
  currentJobId = "",
  currentCareerRoleLabel = "",
  rawDbRows = [],
  existingSkills = [],
}) {
  const existingSet = new Set(existingSkills.map(normalizeLabel).filter(Boolean));

  // ── Record-based ──────────────────────────────────────────────────────────
  const tagFreq = new Map();
  const tagMeta = new Map(); // normalizedKey → { label, titles[] }

  for (const row of rawDbRows) {
    const raw =
      row.raw_payload && typeof row.raw_payload === "object" ? row.raw_payload : {};
    const tags = [
      ...(Array.isArray(row.strength_tags) ? row.strength_tags : []),
      ...(Array.isArray(raw.roleTags) ? raw.roleTags : []),
      ...(Array.isArray(raw.resultTags) ? raw.resultTags : []),
    ];
    const title = String(row.title || "").slice(0, 40).trim();
    for (const tag of tags) {
      const label = String(tag || "").trim();
      if (!label) continue;
      const key = normalizeLabel(label);
      tagFreq.set(key, (tagFreq.get(key) || 0) + 1);
      if (!tagMeta.has(key)) tagMeta.set(key, { label, titles: [] });
      const meta = tagMeta.get(key);
      if (title && meta.titles.length < 3 && !meta.titles.includes(title)) {
        meta.titles.push(title);
      }
    }
  }

  const recordBased = [...tagFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, count]) => {
      const { label, titles } = tagMeta.get(key);
      return {
        label,
        reason:
          count >= 3
            ? `${count}개 기록에서 반복적으로 보입니다`
            : "최근 기록에서 확인됩니다",
        evidence: titles,
        sourceType: "record_based",
        confidence: count >= 3 ? "high" : count >= 2 ? "medium" : "low",
      };
    })
    .filter((item) => !existingSet.has(normalizeLabel(item.label)));

  // ── Job-based ─────────────────────────────────────────────────────────────
  const preset = getRecordPresetByJobId(currentJobId);
  const jobLabel = currentCareerRoleLabel || preset?.label || "";

  const jobRawItems = [
    ...(Array.isArray(preset?.followUpExtensions) ? preset.followUpExtensions : []),
    ...(Array.isArray(preset?.workTypeExtensions) ? preset.workTypeExtensions : []),
  ];

  const jobBased = dedupeByLabel(
    jobRawItems
      .map((ext) => ({
        label: String(ext.label || "").trim(),
        reason: jobLabel
          ? `${jobLabel} 직무 기반 역량입니다`
          : "현재 직무 기반 역량입니다",
        evidence: [],
        sourceType: "job_based",
        confidence: "low",
      }))
      .filter((item) => item.label && !existingSet.has(normalizeLabel(item.label)))
  ).slice(0, 8);

  // ── MergedTop ─────────────────────────────────────────────────────────────
  const mergedSeen = new Set();
  const mergedTop = [];
  for (const item of [
    ...dedupeByLabel(recordBased).slice(0, 5),
    ...jobBased.slice(0, 5),
  ]) {
    const key = normalizeLabel(item.label);
    if (!key || mergedSeen.has(key)) continue;
    mergedSeen.add(key);
    mergedTop.push(item);
    if (mergedTop.length >= 8) break;
  }

  return {
    recordBased: dedupeByLabel(recordBased).slice(0, 8),
    jobBased,
    mergedTop,
  };
}

/**
 * Builds the user-content prompt for AI skill recommendation.
 * Called only when the user presses "AI로 역량 추천받기".
 */
export function buildAiSkillPrompt({
  currentCareerRoleLabel = "",
  currentJobId = "",
  existingSkills = [],
  rawDbRows = [],
}) {
  const jobLabel = currentCareerRoleLabel || currentJobId || "알 수 없는 직무";
  const recordLines = rawDbRows
    .slice(0, 20)
    .map((row) => {
      const tags = [
        ...(Array.isArray(row.strength_tags) ? row.strength_tags : []),
        ...(Array.isArray(row.skill_tags) ? row.skill_tags : []),
      ]
        .slice(0, 5)
        .join(", ");
      const title = String(row.title || "").slice(0, 60).trim();
      return title ? `- ${title}${tags ? ` [태그: ${tags}]` : ""}` : null;
    })
    .filter(Boolean)
    .join("\n");

  return `당신은 이력서 역량 큐레이터입니다. 아래 정보를 바탕으로 이력서에 넣을 역량을 추천해 주세요.

직무: ${jobLabel}
기존 선택된 역량: ${existingSkills.length ? existingSkills.join(", ") : "없음"}

최근 업무 기록 (최대 20개):
${recordLines || "기록 없음"}

규칙:
- 기록에 근거 없는 자격증, 수치, 툴은 절대 추천하지 마세요.
- 실제 경험에서 도출 가능한 전이 역량 레이블을 추천하세요.
- 근거가 약하면 confidence를 low로 설정하세요.
- 한국어로만 응답하세요.
- 반드시 아래 JSON 형식만 반환하세요:
{
  "recommendedSkills": [
    {
      "label": "역량명",
      "reason": "추천 이유 (1줄, 한국어)",
      "evidence": ["근거 기록 제목 또는 태그"],
      "confidence": "high|medium|low",
      "sourceType": "ai_record_based|ai_job_based"
    }
  ],
  "warnings": []
}`;
}
