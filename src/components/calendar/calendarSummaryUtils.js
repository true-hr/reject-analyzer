import { getDateRecordStatus } from "./calendarRecordStatus.js";

function toIsoDate(value) {
  return String(value || "").trim().slice(0, 10);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueDatesInMonth(year, month) {
  const last = new Date(year, month, 0).getDate();
  return Array.from({ length: last }, (_, index) => `${year}-${String(month).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`);
}

function groupByDate(records = []) {
  return asArray(records).reduce((acc, record) => {
    const date = toIsoDate(record?.date || record?.record_date || record?.startDate);
    if (!date) return acc;
    if (!acc[date]) acc[date] = [];
    acc[date].push(record);
    return acc;
  }, {});
}

function topTags(records = [], limit = 5) {
  const counts = new Map();
  asArray(records).forEach((record) => {
    [
      ...(Array.isArray(record?.strengthTags) ? record.strengthTags : []),
      ...(Array.isArray(record?.skillTags) ? record.skillTags : []),
      record?.workType,
    ].forEach((tag) => {
      const key = String(tag || "").trim();
      if (!key) return;
      counts.set(key, (counts.get(key) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function recommendationForCounts({ noneCount, keywordCount, detailedCount }) {
  const items = [];
  if (noneCount > 0) items.push("비어 있는 날짜에 한 줄 경험을 남겨보세요.");
  if (keywordCount > 0) items.push("키워드 기록에 성과 수치나 결과를 한 줄 더 붙여보세요.");
  if (detailedCount > 0) items.push("면접 답변이나 이력서 후보로 확인해보세요.");
  return items.slice(0, 3);
}

export function buildMonthlyCalendarSummary({ records = [], cardsByRecordId = {}, year, month } = {}) {
  const dates = uniqueDatesInMonth(year, month);
  const byDate = groupByDate(records);
  const statusCounts = dates.reduce(
    (acc, date) => {
      const status = getDateRecordStatus(byDate[date] || [], cardsByRecordId);
      acc[status] += 1;
      if (status !== "none") acc.recordedDateCount += 1;
      return acc;
    },
    { none: 0, keyword: 0, detailed: 0, recordedDateCount: 0 }
  );
  const totalDateCount = dates.length || 1;
  return {
    recordedDateCount: statusCounts.recordedDateCount,
    totalDateCount,
    recordRate: Math.round((statusCounts.recordedDateCount / totalDateCount) * 100),
    noneDateCount: statusCounts.none,
    keywordDateCount: statusCounts.keyword,
    detailedDateCount: statusCounts.detailed,
    detailedRate: Math.round((statusCounts.detailed / totalDateCount) * 100),
    topTags: topTags(records),
    recommendations: recommendationForCounts({
      noneCount: statusCounts.none,
      keywordCount: statusCounts.keyword,
      detailedCount: statusCounts.detailed,
    }),
  };
}

export function buildWeeklyCalendarSummary({ records = [], cardsByRecordId = {}, weekDates = [] } = {}) {
  const byDate = groupByDate(records);
  const statuses = asArray(weekDates).map((date) => ({
    date,
    status: getDateRecordStatus(byDate[date] || [], cardsByRecordId),
  }));
  const recordedDateCount = statuses.filter((item) => item.status !== "none").length;
  const detailedDateCount = statuses.filter((item) => item.status === "detailed").length;
  const keywordDateCount = statuses.filter((item) => item.status === "keyword").length;
  const missingDates = statuses.filter((item) => item.status === "none").map((item) => item.date);
  return {
    recordedDateCount,
    completionRate: Math.round((recordedDateCount / Math.max(statuses.length, 1)) * 100),
    detailedDateCount,
    keywordDateCount,
    missingDates,
    recommendations: recommendationForCounts({
      noneCount: missingDates.length,
      keywordCount: keywordDateCount,
      detailedCount: detailedDateCount,
    }),
  };
}
