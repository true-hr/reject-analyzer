const UNKNOWN_PROJECT_NAME = "프로젝트 미지정";

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function normalizeDate(value) {
  return String(value || "").slice(0, 10);
}

function compareDate(a, b) {
  const left = normalizeDate(a);
  const right = normalizeDate(b);
  if (!left || !right) return 0;
  return left.localeCompare(right);
}

function getRawPayload(record) {
  const raw = record?.rawPayload || record?.raw_payload;
  return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
}

function getProjectName(record) {
  const raw = getRawPayload(record);
  return firstNonEmpty(record?.project_name, record?.projectName, raw.projectName, record?.projectNameLabel, UNKNOWN_PROJECT_NAME);
}

function getActionStartDate(record) {
  const raw = getRawPayload(record);
  return normalizeDate(firstNonEmpty(raw.startDate, raw.start_date, record?.startDate, record?.record_date, record?.date));
}

function getActionEndDate(record) {
  const raw = getRawPayload(record);
  return normalizeDate(firstNonEmpty(raw.endDate, raw.end_date, record?.endDate, raw.startDate, record?.startDate, record?.record_date, record?.date));
}

export function getProjectActionStatus(action) {
  const explicit = String(action?.status || "").trim();
  if (["planned", "in_progress", "completed", "needs_review", "unknown"].includes(explicit)) return explicit;

  const today = normalizeDate(action?.today);
  const startDate = normalizeDate(action?.startDate);
  const endDate = normalizeDate(action?.endDate);
  if (!today || (!startDate && !endDate)) return "unknown";
  if (startDate && compareDate(startDate, today) > 0) return "planned";
  if (startDate && endDate && compareDate(startDate, today) <= 0 && compareDate(today, endDate) <= 0) return "in_progress";
  if (endDate && compareDate(endDate, today) < 0) return "needs_review";
  return "unknown";
}

export function getProjectActionStatusLabel(status) {
  if (status === "planned") return "예정";
  if (status === "in_progress") return "진행 중";
  if (status === "completed") return "완료";
  if (status === "needs_review") return "확인 필요";
  return "확인 필요";
}

export function normalizeProjectActionFromRecord(record, cards = [], today = "") {
  const raw = getRawPayload(record);
  const startDate = getActionStartDate(record);
  const endDate = getActionEndDate(record);
  const explicitStatus = firstNonEmpty(raw.actionStatus, raw.status);
  const action = {
    id: String(record?.id || `${getProjectName(record)}_${startDate}_${record?.title || ""}`),
    recordId: record?.id || null,
    record,
    projectName: getProjectName(record),
    title: firstNonEmpty(record?.task, raw.projectActions, record?.title, record?.description, record?.summary, "프로젝트 Action"),
    summary: firstNonEmpty(record?.description, record?.summary, raw.projectGoal, raw.projectContext),
    result: firstNonEmpty(record?.result, raw.projectResult, record?.reflectedSentence),
    startDate,
    endDate,
    date: startDate || normalizeDate(record?.date || record?.record_date) || today,
    status: explicitStatus,
    today,
    cards,
  };
  return {
    ...action,
    status: getProjectActionStatus(action),
  };
}

export function buildProjectGroupsFromRecords(records = [], cardsByRecordId = {}, today = "") {
  const actions = records
    .filter((record) => {
      const raw = getRawPayload(record);
      return (
        getProjectName(record) !== UNKNOWN_PROJECT_NAME ||
        record?.recordType === "teamProject" ||
        record?.recordType === "personal" ||
        record?.workType === "project" ||
        raw.track === "project"
      );
    })
    .map((record) => normalizeProjectActionFromRecord(record, cardsByRecordId?.[String(record?.id || "")] || [], today));

  const groupsMap = actions.reduce((acc, action) => {
    const key = action.projectName || UNKNOWN_PROJECT_NAME;
    if (!acc[key]) {
      acc[key] = {
        id: key,
        projectName: key,
        actions: [],
        startDate: "",
        endDate: "",
      };
    }
    acc[key].actions.push(action);
    return acc;
  }, {});

  return Object.values(groupsMap)
    .map((group) => {
      const sortedActions = group.actions.slice().sort((a, b) => compareDate(a.startDate, b.startDate) || a.title.localeCompare(b.title));
      const dates = sortedActions.flatMap((action) => [action.startDate, action.endDate]).filter(Boolean).sort();
      return {
        ...group,
        actions: sortedActions,
        startDate: dates[0] || "",
        endDate: dates[dates.length - 1] || "",
      };
    })
    .sort((a, b) => a.projectName.localeCompare(b.projectName));
}
