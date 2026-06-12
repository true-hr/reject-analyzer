function firstDate(...values) {
  for (const value of values) {
    const date = String(value || "").slice(0, 10);
    if (date) return date;
  }
  return "";
}

function hasResultSignal(record) {
  const raw = record?.rawPayload || record?.raw_payload || {};
  return Boolean(String(record?.result || record?.reflectedSentence || raw.projectResult || raw.result || "").trim());
}

function makeAction(action) {
  return {
    id: action.id,
    title: action.title,
    description: action.description,
    targetType: action.targetType || "project_action",
    suggestedDate: action.suggestedDate || "",
    projectName: action.projectName || "",
    sourceRecordId: action.sourceRecordId || null,
    source: "calendar-recommendation",
    priority: action.priority || "medium",
  };
}

export function buildCalendarRecommendedActions({
  records = [],
  selectedDate = "",
  monthSummary = null,
  weekSummary = null,
  projectGroups = [],
} = {}) {
  const actions = [];
  const recordsWithMissingResult = records.filter((record) => !hasResultSignal(record));
  const firstRecord = records[0] || null;

  if ((weekSummary?.keywordDateCount || monthSummary?.keywordDateCount || 0) > 0) {
    actions.push(makeAction({
      id: "detail-keyword-records",
      title: "키워드 기록을 면접 답변으로 발전시키기",
      description: "짧게 남긴 기록에 상황, 행동, 결과를 한 줄씩 보완해보세요.",
      targetType: "record_improvement",
      suggestedDate: firstDate(selectedDate, firstRecord?.date, firstRecord?.record_date),
      sourceRecordId: firstRecord?.id || null,
      priority: "high",
    }));
  }

  if (recordsWithMissingResult.length > 0) {
    const record = recordsWithMissingResult[0];
    actions.push(makeAction({
      id: "add-result-metric",
      title: "성과 수치를 한 줄 더 붙여보세요",
      description: "결과나 산출물을 추가하면 이력서 후보로 발전시키기 쉬워요.",
      targetType: "record_improvement",
      suggestedDate: firstDate(record?.date, record?.record_date, selectedDate),
      sourceRecordId: record?.id || null,
      priority: "high",
    }));
  }

  if ((weekSummary?.missingDates?.length || 0) > 0 || (monthSummary?.noneDateCount || 0) > 0) {
    actions.push(makeAction({
      id: "fill-empty-date",
      title: "비어 있는 날짜에 경험 남기기",
      description: "오늘 한 일 한 줄만 남겨도 커리어 자산으로 쌓여요.",
      targetType: "project_action",
      suggestedDate: firstDate(weekSummary?.missingDates?.[0], selectedDate),
      projectName: "경험 기록 보완",
      priority: "medium",
    }));
  }

  const projectWithoutProgress = projectGroups.find((group) => !group.actions?.some((action) => action.status === "in_progress"));
  if (projectWithoutProgress) {
    actions.push(makeAction({
      id: `next-project-action-${projectWithoutProgress.id}`,
      title: "다음 프로젝트 Action 만들기",
      description: "이번 주에 이어갈 한 가지 일을 Action으로 남겨보세요.",
      targetType: "project_action",
      suggestedDate: selectedDate,
      projectName: projectWithoutProgress.projectName,
      priority: "medium",
    }));
  }

  const actionWithoutRange = projectGroups
    .flatMap((group) => group.actions.map((action) => ({ ...action, projectName: group.projectName })))
    .find((action) => !action.startDate || !action.endDate);
  if (actionWithoutRange) {
    actions.push(makeAction({
      id: `set-action-period-${actionWithoutRange.id}`,
      title: "프로젝트 기간 정리하기",
      description: "기간과 결과를 적으면 프로젝트뷰에서 진행 상태를 볼 수 있어요.",
      targetType: "project_action",
      suggestedDate: firstDate(actionWithoutRange.date, selectedDate),
      projectName: actionWithoutRange.projectName,
      priority: "low",
    }));
  }

  return actions.slice(0, 4);
}

export function buildRecommendedActionContext(action, options = {}) {
  const suggestedDate = firstDate(action?.suggestedDate, options.selectedDate, options.today);
  const common = {
    date: suggestedDate,
    source: "calendar-recommendation",
    recommendedAction: action,
  };
  if (action?.targetType === "record_improvement") {
    return {
      ...common,
      mode: "improve",
      recordId: action?.sourceRecordId || null,
    };
  }
  return {
    ...common,
    mode: "project-action",
    recordType: "teamProject",
    projectName: action?.projectName || "경험 기록 보완",
  };
}
