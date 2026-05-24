// B6: deterministic risk engine raw → 결과 카드 chip group helper
// 신규 engine/taxonomy 추가 없이, 기존 risk.raw 필드만 UI 표시 구조로 변환합니다.

const MAX_CHIPS = 5;
const MAX_CHIP_LEN = 40;

function clean(value) {
  if (value == null) return "";
  return String(value).trim();
}

function dedupeTruncate(values) {
  const seen = new Set();
  const out = [];
  for (const v of Array.isArray(values) ? values : []) {
    const text = clean(v);
    if (!text) continue;
    const display = text.length > MAX_CHIP_LEN ? `${text.slice(0, MAX_CHIP_LEN - 1)}…` : text;
    if (seen.has(display)) continue;
    seen.add(display);
    out.push(display);
  }
  return out;
}

function makeGroup(tone, label, rawItems, note = "") {
  const items = dedupeTruncate(rawItems);
  if (!items.length) return null;
  const overflow = items.length > MAX_CHIPS ? items.length - MAX_CHIPS : 0;
  return {
    tone,
    label,
    note,
    items: items.slice(0, MAX_CHIPS),
    overflow,
  };
}

function periodLabel(period) {
  if (!period || typeof period !== "object") return "";
  const from = clean(period.from).replace("-", ".");
  const to = clean(period.to).replace("-", ".");
  if (from && to) return `${from} ~ ${to}`;
  if (from) return `${from} ~`;
  if (to) return `~ ${to}`;
  return "";
}

// risk.key 기반으로 결과 카드에 보여줄 chip group을 만든다.
// 반환 형태: [{ tone: 'positive'|'negative'|'neutral', label, note, items, overflow }]
export function buildRiskEvidenceGroups(key, raw) {
  const safeRaw = raw && typeof raw === "object" ? raw : {};
  const groups = [];

  if (key === "must_requirements_gap") {
    const hit = makeGroup(
      "positive",
      "이력서에서 확인된 필수요건",
      safeRaw.hitItems,
      "이력서에서 직접 연결된 표현만 잡았어요."
    );
    if (hit) groups.push(hit);

    const aliasResolved = makeGroup(
      "neutral",
      "명칭 차이로 보정된 항목",
      safeRaw.certAliasResolvedItems,
      "표기는 다르지만 자격증/별칭으로 같은 항목으로 봤어요."
    );
    if (aliasResolved) groups.push(aliasResolved);

    const missSource = Array.isArray(safeRaw.effectiveMissItems) && safeRaw.effectiveMissItems.length
      ? safeRaw.effectiveMissItems
      : safeRaw.missItems;
    const miss = makeGroup(
      "negative",
      "이력서에서 바로 확인되지 않은 필수요건",
      missSource,
      "실제 경험이 있어도 이력서에 드러나지 않으면 누락으로 보일 수 있어요."
    );
    if (miss) groups.push(miss);

    const aiUnmatched = makeGroup(
      "negative",
      "AI 역할 매칭에서 약하게 잡힌 항목",
      safeRaw.aiUnmatchedMustRequirements,
      "JD 핵심 역할과의 연결이 약하게 읽혔어요."
    );
    if (aiUnmatched) groups.push(aiUnmatched);

    return groups;
  }

  if (key === "experience_level_gap") {
    const countedPeriods = Array.isArray(safeRaw.countedPeriods) ? safeRaw.countedPeriods : [];
    const skippedPeriods = Array.isArray(safeRaw.skippedPeriods) ? safeRaw.skippedPeriods : [];

    const counted = makeGroup(
      "positive",
      "경력 기간 판정에 반영된 항목",
      countedPeriods.map(periodLabel),
      "시작/종료 시점이 보이는 경력만 합산했어요."
    );
    if (counted) groups.push(counted);

    const skipped = makeGroup(
      "neutral",
      "기간이 명확하지 않아 합산에서 빠진 항목",
      skippedPeriods.map(periodLabel),
      "날짜가 보이지 않아 기간으로 셀 수 없었어요."
    );
    if (skipped) groups.push(skipped);

    return groups;
  }

  if (key === "jd_keyword_coverage_gap") {
    // T1: keywordBuckets가 있으면 범주별로 chip 그룹을 만든다.
    //     없으면 기존 matched/missingKeywords로 fallback (B6 호환).
    const buckets = Array.isArray(safeRaw.keywordBuckets) ? safeRaw.keywordBuckets : [];
    if (buckets.length > 0) {
      // bucket 자체의 우선순위(metricOutcome → coreTask → ...)는 engine에서 이미 반영.
      // 카드 안에 너무 많은 chip이 쌓이지 않게 상위 3개 bucket만 노출한다.
      const TOP_BUCKETS = 3;
      const visibleBuckets = buckets.slice(0, TOP_BUCKETS);
      for (const entry of visibleBuckets) {
        const label = clean(entry?.label) || clean(entry?.bucket) || "범주";
        const matchedGroup = makeGroup(
          "positive",
          `${label}: 이력서에서 확인된 표현`,
          entry?.matched,
          "JD 키워드 중 동일 범주에서 직접 잡힌 항목이에요."
        );
        if (matchedGroup) groups.push(matchedGroup);
        const missingGroup = makeGroup(
          "negative",
          `${label}: 부족한 표현`,
          entry?.missing,
          "같은 범주 경험이 있어도 JD 표현으로 잡히지 않으면 약하게 보일 수 있어요."
        );
        if (missingGroup) groups.push(missingGroup);
      }
      return groups;
    }

    const matched = makeGroup(
      "positive",
      "이력서에서 직접 확인된 JD 키워드",
      safeRaw.matchedKeywords,
      "JD에서 쓰는 표현과 동일하게 잡힌 항목이에요."
    );
    if (matched) groups.push(matched);

    const missing = makeGroup(
      "negative",
      "아직 직접 연결이 약한 JD 키워드",
      safeRaw.missingKeywords,
      "같은 경험이 있어도 JD 표현으로 잡히지 않으면 약하게 보일 수 있어요."
    );
    if (missing) groups.push(missing);

    return groups;
  }

  if (key === "achievement_evidence_gap") {
    const achievementsCount = Number(safeRaw.achievementsCount);
    const quantifiedAchievementsCount = Number(safeRaw.quantifiedAchievementsCount);
    const timelineBulletCount = Number(safeRaw.timelineBulletCount);
    const quantifiedBulletCount = Number(safeRaw.quantifiedBulletCount);
    const quantifiedBulletRatio = Number(safeRaw.quantifiedBulletRatio);

    // T2: achievementBuckets가 있으면 직무·산업 맥락 범주 chip부터 노출한다.
    //     없으면 기존 counts/ratio chip path로 fallback (B6 호환).
    const achievementBuckets = Array.isArray(safeRaw.achievementBuckets)
      ? safeRaw.achievementBuckets
      : [];
    if (achievementBuckets.length > 0) {
      // bucket 자체의 우선순위(growth → revenue → efficiency → ...)는 engine에서 반영.
      // 카드 안에 너무 많은 chip이 쌓이지 않게 상위 3개 bucket만 노출.
      const TOP_BUCKETS = 3;
      for (const entry of achievementBuckets.slice(0, TOP_BUCKETS)) {
        const label = clean(entry?.label) || clean(entry?.bucket) || "성과 유형";
        const foundGroup = makeGroup(
          "positive",
          `${label}: 이력서에서 확인된 표현`,
          entry?.found,
          "이력서 성과 표현 중 이 범주에 해당하는 항목이에요."
        );
        if (foundGroup) groups.push(foundGroup);
        // T2.5: JD가 요구하지만 이력서에서 확인되지 않은 성과 지표 negative chip
        const expectedFromJd = Array.isArray(entry?.expectedFromJd) ? entry.expectedFromJd : [];
        if (expectedFromJd.length > 0) {
          const expectedGroup = makeGroup(
            "negative",
            `${label}: JD가 요구하지만 부족한 성과 지표`,
            expectedFromJd,
            "JD에서 반복되는 지표 언어로 결과를 보완하면 더 강하게 읽혀요. 측정 가능한 범위에서만 작성하세요."
          );
          if (expectedGroup) groups.push(expectedGroup);
        }
      }
    }

    const positives = [];
    if (Number.isFinite(quantifiedAchievementsCount) && quantifiedAchievementsCount > 0) {
      positives.push(`정량 성과 ${quantifiedAchievementsCount}개`);
    }
    if (Number.isFinite(quantifiedBulletCount) && quantifiedBulletCount > 0) {
      positives.push(`정량 표현 포함 서술 ${quantifiedBulletCount}개`);
    }
    if (
      Number.isFinite(achievementsCount) && achievementsCount > 0 &&
      (!Number.isFinite(quantifiedAchievementsCount) || quantifiedAchievementsCount === 0)
    ) {
      positives.push(`성과 항목 ${achievementsCount}개 (정량 표현 없음)`);
    }
    const positiveGroup = makeGroup(
      achievementBuckets.length > 0 ? "neutral" : "positive",
      achievementBuckets.length > 0 ? "성과 표현 카운트" : "이력서에서 확인된 성과 표현",
      positives,
      "정량 표현이 함께 보이는 항목만 잡았어요."
    );
    if (positiveGroup) groups.push(positiveGroup);

    const gaps = [];
    if (Number.isFinite(achievementsCount) && achievementsCount === 0) {
      gaps.push("정량 성과 항목 없음");
    }
    if (
      Number.isFinite(timelineBulletCount) && timelineBulletCount > 0 &&
      Number.isFinite(quantifiedBulletRatio) && quantifiedBulletRatio < 0.2
    ) {
      gaps.push(`정량 표현 비율 약 ${Math.round(quantifiedBulletRatio * 100)}%`);
    }
    const gapGroup = makeGroup(
      "negative",
      "보완이 필요한 성과 근거",
      gaps,
      "결과/변화가 함께 드러나면 더 강하게 읽혀요."
    );
    if (gapGroup) groups.push(gapGroup);

    return groups;
  }

  if (key === "gap_explanation_missing") {
    const explained = [
      ...(Array.isArray(safeRaw.gapDescriptions) ? safeRaw.gapDescriptions : []),
      ...(Array.isArray(safeRaw.transitionNarratives) ? safeRaw.transitionNarratives : []),
    ];
    const explainedGroup = makeGroup(
      "positive",
      "이력서에서 확인된 공백/전환 설명",
      explained,
      "공백이나 이직 사유로 잡힌 표현이에요."
    );
    if (explainedGroup) groups.push(explainedGroup);

    const aux = [];
    const gapCount = Number(safeRaw.gapCount);
    const describedGapCount = Number(safeRaw.describedGapCount);
    const maxGapMonths = Number(safeRaw.maxGapMonths);
    if (
      Number.isFinite(gapCount) && gapCount > 0 &&
      (!Number.isFinite(describedGapCount) || describedGapCount === 0)
    ) {
      aux.push(`설명이 없는 공백 ${gapCount}건`);
    }
    if (Number.isFinite(maxGapMonths) && maxGapMonths >= 6) {
      aux.push(`가장 긴 공백 약 ${maxGapMonths}개월`);
    }
    const auxGroup = makeGroup(
      "negative",
      "보완이 필요한 공백 설명",
      aux,
      "기간과 사유가 짧게라도 함께 보이면 해석이 달라질 수 있어요."
    );
    if (auxGroup) groups.push(auxGroup);

    return groups;
  }

  return groups;
}

export const __TEST_ONLY__ = {
  MAX_CHIPS,
  MAX_CHIP_LEN,
  periodLabel,
  dedupeTruncate,
};
