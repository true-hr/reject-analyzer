function toIsoDate(value) {
  return String(value || "").trim().slice(0, 10);
}

function toKstDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!year || !month || !day) return "";
  return `${year}-${month}-${day}`;
}

function formatCountLabel(label, count) {
  const unit = /(작성|정리|개선|보고|조율|대응|분류|점검)/.test(label) ? "건" : "회";
  return `${label} ${count}${unit}`;
}

function getCalendarWorkTypeLabel(type) {
  const safeType = String(type || "").trim();
  if (safeType === "이번 주 기록") return "업무 기록";
  return safeType;
}

function getRollingWindowRecords(records = [], anchorDate, days = 7) {
  const safeAnchor = toIsoDate(anchorDate);
  if (!safeAnchor) return [];

  const end = new Date(`${safeAnchor}T00:00:00`);
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(days - 1, 0));

  return records.filter((record) => {
    const date = toIsoDate(record?.date);
    if (!date) return false;
    const cursor = new Date(`${date}T00:00:00`);
    return cursor >= start && cursor <= end;
  });
}

function createId(prefix, date, title) {
  return `${prefix}_${toIsoDate(date)}_${String(title || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")}`;
}

export function normalizeNotionRecord(raw = {}) {
  return {
    id: String(raw.id || createId("notion", raw.date, raw.title)),
    date: toIsoDate(raw.date),
    source: "notion",
    workType: String(raw.workType || raw.type || "").trim(),
    title: String(raw.title || "").trim(),
    summary: String(raw.summary || raw.note || "").trim(),
    reflectedSentence: raw.reflectedSentence ? String(raw.reflectedSentence).trim() : undefined,
    strengthTags: Array.isArray(raw.strengthTags) ? raw.strengthTags.map((item) => String(item).trim()).filter(Boolean) : undefined,
    linkedAssetIds: Array.isArray(raw.linkedAssetIds) ? raw.linkedAssetIds.map((item) => String(item).trim()).filter(Boolean) : undefined,
  };
}

export function normalizeGoogleCalendarEvent(raw = {}) {
  return {
    id: String(raw.id || createId("gcal", raw.date, raw.title)),
    date: toIsoDate(raw.date),
    source: "gcal",
    workType: String(raw.workType || raw.type || "").trim(),
    title: String(raw.title || "").trim(),
    summary: String(raw.summary || raw.description || "").trim(),
    reflectedSentence: raw.reflectedSentence ? String(raw.reflectedSentence).trim() : undefined,
    strengthTags: Array.isArray(raw.strengthTags) ? raw.strengthTags.map((item) => String(item).trim()).filter(Boolean) : undefined,
    linkedAssetIds: Array.isArray(raw.linkedAssetIds) ? raw.linkedAssetIds.map((item) => String(item).trim()).filter(Boolean) : undefined,
  };
}

export function groupRecordsByDate(records = []) {
  return records.reduce((acc, record) => {
    const date = toIsoDate(record?.date);
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});
}

export function buildCalendarMonthViewModel({ year, month, today }) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  const endDate = new Date(lastDay);
  endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  const weeks = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      const isoDate = toKstDateKey(cursor);
      week.push({
        date: isoDate,
        day: cursor.getDate(),
        inCurrentMonth: cursor.getMonth() === month - 1,
        isToday: isoDate === today,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return { year, month, weeks };
}

export function buildCalendarEntriesByDate(records = []) {
  const grouped = groupRecordsByDate(records);

  return Object.fromEntries(
    Object.entries(grouped).map(([date, items]) => {
      const workTypes = [...new Set(items.map((item) => item.workType).filter(Boolean))];
      const tasks = items.map((item) => item.title).filter(Boolean);
      const summary = items.map((item) => item.summary).filter(Boolean).join(" ");
      const reflectedSentence = items.map((item) => item.reflectedSentence).filter(Boolean)[0];
      const strengthTags = [...new Set(items.flatMap((item) => (Array.isArray(item.strengthTags) ? item.strengthTags : [])))];
      const linkedAssetIds = [...new Set(items.flatMap((item) => (Array.isArray(item.linkedAssetIds) ? item.linkedAssetIds : [])))];
      const improvementHint = deriveImprovementHint(items);

      return [
        date,
        {
          workTypes,
          tasks,
          summary,
          reflectedSentence: reflectedSentence || undefined,
          strengthTags: strengthTags.length ? strengthTags : undefined,
          linkedAssetIds: linkedAssetIds.length ? linkedAssetIds : undefined,
          improvementHint,
          records: items,
        },
      ];
    })
  );
}

function countWorkTypes(records = []) {
  return records.reduce((acc, record) => {
    const key = getCalendarWorkTypeLabel(record?.workType);
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function formatWeeklySummary(records = []) {
  const counts = countWorkTypes(records);
  const ordered = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([label, count]) => formatCountLabel(label, count));

  if (ordered.length) return `이번 주: ${ordered.join("  ")}`;

  const titles = records
    .map((record) => String(record?.title || record?.summary || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return titles.length ? `이번 주: ${titles.join("  ")}` : "이번 주: 아직 기록이 없습니다.";
}

function formatTodaySummary(records = []) {
  const titles = records
    .map((record) => String(record?.title || "").trim())
    .filter(Boolean)
    .slice(0, 3);

  return titles.length ? `오늘: ${titles.join("  ")}` : "오늘: 아직 기록이 없습니다.";
}

function countStrengthTags(records = []) {
  return records.reduce((acc, record) => {
    const tags = Array.isArray(record?.strengthTags) ? record.strengthTags : [];
    tags.forEach((tag) => {
      const key = String(tag || "").trim();
      if (!key) return;
      acc[key] = (acc[key] || 0) + 1;
    });
    return acc;
  }, {});
}

function pickTopLabel(counts = {}) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function countCareerDirections(records = []) {
  return records.reduce((acc, record) => {
    const tags = Array.isArray(record?.strengthTags) ? record.strengthTags : [];
    const workType = String(record?.workType || "").trim();
    const narrative = `${record?.title || ""} ${record?.summary || ""} ${record?.reflectedSentence || ""}`;
    const signals = [...tags, workType, narrative];

    signals.forEach((signal) => {
      const text = String(signal || "").trim();
      if (!text) return;

      let label = "";
      if (/(고객|문의|사용자|응대|안내)/.test(text)) {
        label = "고객 커뮤니케이션 중심 경험";
      } else if (/(조율|협업|전달|우선순위)/.test(text)) {
        label = "운영 조율 중심 경험";
      } else if (/(후속|구조화|정리|개선|점검|문제)/.test(text)) {
        label = "문제 정리·후속 실행 경험";
      } else if (/(문서|보고|공유|메모)/.test(text)) {
        label = "문서화 기반 운영 경험";
      }

      if (!label) return;
      acc[label] = (acc[label] || 0) + 1;
    });

    return acc;
  }, {});
}

function hasNumericSignal(records = []) {
  return records.some((record) => /\d/.test(`${record?.title || ""} ${record?.summary || ""} ${record?.reflectedSentence || ""}`));
}

function hasCustomerContext(records = []) {
  return records.some((record) => /(고객|사용자|문의)/.test(`${record?.title || ""} ${record?.summary || ""} ${record?.reflectedSentence || ""}`));
}

function deriveImprovementHint(records = []) {
  if (!records.length) {
    return "성과 변화가 보이면 수치나 기준을 한 줄 더 남기기";
  }

  if (!hasNumericSignal(records)) {
    return "처리 건수나 대응 시간처럼 성과 수치를 한 줄 더 남기기";
  }

  if (!hasCustomerContext(records)) {
    return "고객이나 사용자 관점에서 왜 중요한지 한 줄 더 붙이기";
  }

  return "왜 이 업무를 먼저 처리했는지 우선순위 판단 근거를 덧붙이기";
}

export function deriveCalendarSummary({ records = [], selectedDate, today }) {
  const todayRecords = records.filter((record) => toIsoDate(record?.date) === toIsoDate(today));
  const baseDateKey = toIsoDate(today) || toIsoDate(selectedDate);
  const baseDate = new Date(`${baseDateKey}T00:00:00`);
  const weekStart = new Date(baseDate);
  weekStart.setDate(baseDate.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyRecords = records.filter((record) => {
    const date = new Date(`${toIsoDate(record?.date)}T00:00:00`);
    return date >= weekStart && date <= weekEnd;
  });

  return {
    weeklySummary: formatWeeklySummary(weeklyRecords),
    todaySummary: formatTodaySummary(todayRecords),
  };
}

export function deriveMonthlyAssetSummary(records = []) {
  const reflectedSentenceCount = records.filter((record) => String(record?.reflectedSentence || "").trim()).length;
  const topStrengthTag = pickTopLabel(countStrengthTags(records)) || "강점 신호 없음";
  const topWorkType = pickTopLabel(countWorkTypes(records)) || "업무 유형 없음";
  const improvementHint = deriveImprovementHint(records);

  return {
    reflectedSentenceCount,
    topStrengthTag,
    topWorkType,
    improvementHint,
  };
}

export function deriveHomeActionStatus({ records = [], today } = {}) {
  const todayKey = toIsoDate(today);
  const todayRecords = records.filter((record) => toIsoDate(record?.date) === todayKey);
  const recentWeekRecords = getRollingWindowRecords(records, todayKey, 7);
  const weeklyCounts = Object.entries(countWorkTypes(recentWeekRecords))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const weeklyWorkSummary = weeklyCounts.length
    ? weeklyCounts.map(([label, count]) => formatCountLabel(label, count)).join("  ")
    : "아직 이번 주에 쌓인 업무 기록이 없어요.";

  const weeklySentenceRecords = recentWeekRecords.filter((record) => String(record?.reflectedSentence || "").trim());
  const latestSentence = [...records]
    .sort((a, b) => String(b?.date || "").localeCompare(String(a?.date || "")))
    .map((record) => String(record?.reflectedSentence || "").trim())
    .find(Boolean);
  const careerDirection = pickTopLabel(countCareerDirections(recentWeekRecords)) || "운영 흐름을 쌓아가는 경험";

  return [
    {
      title: "이번 주 기록 상태",
      value: todayRecords.length ? "완료" : "기록 전",
      note: todayRecords.length
        ? "오늘 기록과 해석이 바로 이어졌어요."
        : "오늘 한 일을 남기면 이력서 문장까지 바로 이어져요.",
    },
    {
      title: "이번 주 해낸 일",
      value: weeklyWorkSummary,
      note: weeklyCounts.length
        ? "이번 주에 실제로 한 일이 이렇게 쌓였어요."
        : "업무를 남기면 이번 주에 해낸 일이 이곳에 바로 쌓여요.",
      compactValue: true,
    },
    {
      title: "이번 주 만든 이력서 문장",
      value: weeklySentenceRecords.length ? `${weeklySentenceRecords.length}개` : (latestSentence || "아직 만든 문장이 없어요."),
      note: weeklySentenceRecords.length
        ? "이번 기록으로 이력서에 바로 쓸 문장이 만들어졌어요."
        : latestSentence
          ? "최근 기록에서 바로 써먹을 문장을 먼저 보여드려요."
          : "업무 기록이 쌓이면 이력서에 쓸 문장이 여기서 바로 보여요.",
      compactValue: !weeklySentenceRecords.length,
    },
    {
      title: "쌓이고 있는 커리어 방향",
      value: careerDirection,
      note: "최근 기록 기준으로 가장 선명하게 쌓이는 방향이에요.",
      compactValue: true,
    },
  ];
}

// --- calendar adapter ---

function compactText(value, fallback = "") {
  return String(value || "").trim() || fallback;
}

function uniqueCompactTags(...tagArrays) {
  const all = tagArrays.flat().map((item) => String(item || "").trim()).filter(Boolean);
  return [...new Set(all)].slice(0, 5);
}

function todayIsoDate(now) {
  return toKstDateKey(now instanceof Date ? now : new Date());
}

export function buildCalendarRecordFromPmInput(input, options = {}) {
  if (!input || typeof input !== "object") return null;

  const { fallbackDate, now } = options;
  const track = String(input.track || "").trim();
  const recordType = String(input.recordType || "").trim();

  const date =
    toIsoDate(input.startDate) ||
    toIsoDate(input.date) ||
    toIsoDate(fallbackDate) ||
    todayIsoDate(now);

  if (!date) return null;

  let workType;
  if (track === "project") {
    workType = recordType === "personal" ? "개인 업무" : "팀 프로젝트";
  } else if (track === "weekly") {
    workType = "이번 주 기록";
  } else {
    workType = "경험 기록";
  }

  let title;
  if (track === "project") {
    title = compactText(input.projectName, recordType === "personal" ? "개인 업무 기록" : "팀 프로젝트 기록");
  } else {
    title = "이번 주 기록";
  }

  let summary;
  if (track === "project" && recordType === "personal") {
    summary = compactText(input.projectActions, compactText(input.text, compactText(input.projectName, "기록한 업무를 정리했습니다.")));
  } else if (track === "project") {
    summary = compactText(input.projectResult, compactText(input.projectActions, compactText(input.projectGoal, compactText(input.text, "팀 프로젝트 기록을 정리했습니다."))));
  } else {
    summary = compactText(input.text, "이번 주 기록을 정리했습니다.");
  }

  let reflectedSentence;
  if (track === "project" && recordType === "personal") {
    reflectedSentence = `${title} 업무를 수행하며 ${summary} 경험을 남겼습니다.`;
  } else if (track === "project") {
    const role = compactText(input.projectContext, "맡은 역할");
    const action = compactText(input.projectActions, "주요 업무");
    reflectedSentence = `${title}에서 ${role}을 바탕으로 ${action}를 수행했습니다.`;
  } else {
    reflectedSentence = "이번 주 기록을 바탕으로 이력서에 활용할 수 있는 경험을 정리했습니다.";
  }

  const strengthTags = uniqueCompactTags(input.roleTags, input.collaborationTags, input.resultTags);

  const safeTitle = String(title).toLowerCase().replace(/\s+/g, "-").slice(0, 20);
  const id = compactText(input.id, `pm-${recordType || track}-${date}-${safeTitle}`);

  return {
    id,
    date,
    source: "passmap",
    workType,
    title,
    summary,
    reflectedSentence,
    strengthTags,
    linkedAssetIds: [],
    recordType,
    startDate: compactText(input.startDate, ""),
    endDate: compactText(input.endDate, ""),
    projectPeriod: compactText(input.projectPeriod, ""),
  };
}
