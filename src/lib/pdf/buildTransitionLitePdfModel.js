function toStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toArr(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isReactElementLike(value) {
  return Boolean(
    value &&
    typeof value === "object" &&
    Object.prototype.hasOwnProperty.call(value, "$$typeof") &&
    Object.prototype.hasOwnProperty.call(value, "type") &&
    Object.prototype.hasOwnProperty.call(value, "props")
  );
}

function describeValueShape(value) {
  if (typeof value === "string") return "string";
  if (isFiniteNumber(value)) return "number";
  if (Array.isArray(value)) {
    if (value.length === 0) return "array(empty)";
    const itemShapes = [...new Set(value.slice(0, 3).map((item) => describeValueShape(item)))];
    return `array(${itemShapes.join(",")})`;
  }
  if (isReactElementLike(value)) return "react_element";
  if (value && typeof value === "object") {
    const keys = Object.keys(value).slice(0, 5);
    return `object(${keys.join(",")})`;
  }
  return typeof value;
}

function toDisplayText(value) {
  if (typeof value === "string") return value.trim();
  if (isFiniteNumber(value)) return String(value);
  if (!value || Array.isArray(value) || typeof value !== "object" || isReactElementLike(value)) {
    return "";
  }

  const candidateKeys = [
    "text",
    "label",
    "title",
    "body",
    "summary",
    "intro",
    "introText",
    "cautionText",
    "name",
    "value",
    "content",
  ];

  for (const key of candidateKeys) {
    const text = toDisplayText(value?.[key]);
    if (text) return text;
  }

  return "";
}

function isMissingGoalTableText(value) {
  const text = toDisplayText(value);
  if (!text) return true;
  return text === "아직 입력한 내용 없음"
    || text === "입력한 내용 없음"
    || text === "내용 없음";
}

function pushDroppedField(droppedFields, field, value) {
  if (!Array.isArray(droppedFields) || value == null) return;
  droppedFields.push({
    field,
    shape: describeValueShape(value),
  });
}

function normalizeTextList(value, field, droppedFields) {
  const source = Array.isArray(value) ? value : value == null ? [] : [value];
  const normalized = [];

  source.forEach((item) => {
    const text = toDisplayText(item);
    if (text) {
      normalized.push(text);
      return;
    }

    if (item != null) {
      pushDroppedField(droppedFields, field, item);
    }
  });

  return normalized;
}

function toPrintableDate(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

function getAxisScore5(axis) {
  const numeric = Number(axis?.score5 ?? axis?.score);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 5) {
    return Math.round(numeric);
  }

  const band = toStr(axis?.band).toLowerCase();
  if (band === "high") return 5;
  if (band === "mid_high") return 4;
  if (band === "mid") return 3;
  if (band === "mid_low") return 2;
  if (band === "low") return 1;
  return null;
}

function normalizeAxisEntries(axisPack, droppedFields) {
  const axes = axisPack?.axes && typeof axisPack.axes === "object" ? axisPack.axes : null;
  if (!axes) return [];

  return [
    axes.jobStructure,
    axes.industryContext,
    axes.responsibilityScope,
    axes.customerType,
    axes.roleCharacter,
  ]
    .filter(Boolean)
    .map((axis, index) => ({
      axisKey: toStr(axis?.key) || `axis_${index + 1}`,
      label: toDisplayText(axis?.label) || `Axis ${index + 1}`,
      band: toStr(axis?.band) || null,
      score5: getAxisScore5(axis),
      summary: toDisplayText(axis?.explanation?.summary) || toDisplayText(axis?.description) || "",
    }));
}

function normalizeTopRisks(viewModel, droppedFields) {
  return toArr(viewModel?.topRisks).map((risk, index) => ({
    key: toStr(risk?.key) || `risk_${index + 1}`,
    title: toDisplayText(risk?.title),
    body: toDisplayText(risk?.body),
    comparisonTable:
      risk?.comparisonTable && typeof risk.comparisonTable === "object"
        ? risk.comparisonTable
        : null,
  })).filter((risk) => risk.title || risk.body);
}

function normalizeTransitionReadBlock(viewModel, droppedFields) {
  const validationReadBlock =
    viewModel?.validationReadBlock && typeof viewModel.validationReadBlock === "object"
      ? viewModel.validationReadBlock
      : null;
  const transitionReadBlock =
    viewModel?.transitionReadBlock && typeof viewModel.transitionReadBlock === "object"
      ? viewModel.transitionReadBlock
      : null;

  const preferred =
    validationReadBlock &&
    (toStr(validationReadBlock?.intro) || toArr(validationReadBlock?.cards).length > 0)
      ? validationReadBlock
      : transitionReadBlock;

  if (!preferred) return null;

  const cards = toArr(preferred?.cards).map((card, index) => ({
    id: toStr(card?.id) || `card_${index + 1}`,
    title: toDisplayText(card?.title),
    body: toDisplayText(card?.body),
    bullets: normalizeTextList(card?.bullets, "interviewerRead.cards.bullets", droppedFields),
  })).filter((card) => card.title || card.body || card.bullets.length > 0);

  if (!toDisplayText(preferred?.sectionTitle) && !toDisplayText(preferred?.intro) && cards.length === 0) {
    return null;
  }

  return {
    sectionTitle: toStr(preferred?.sectionTitle) || "전환 판독",
    intro: toDisplayText(preferred?.intro),
    cards,
  };
}

function normalizeDetailedRead(axisPack, droppedFields) {
  const axes = axisPack?.axes && typeof axisPack.axes === "object" ? axisPack.axes : null;
  if (!axes) return [];

  return [
    axes.jobStructure,
    axes.industryContext,
    axes.responsibilityScope,
    axes.customerType,
    axes.roleCharacter,
  ]
    .filter(Boolean)
    .map((axis, index) => ({
      axisKey: toStr(axis?.key) || `axis_${index + 1}`,
      title: toDisplayText(axis?.comparisonBlock?.title) || toDisplayText(axis?.label),
      introText: toDisplayText(axis?.comparisonBlock?.introText),
      cautionText: toDisplayText(axis?.comparisonBlock?.cautionText),
    }))
    .filter((item) => item.title || item.introText || item.cautionText);
}

function normalizeNewgradGoalComparisonTable(viewModel, reportType, droppedFields) {
  if (reportType !== "newgrad") return null;
  const table =
    viewModel?.newgradGoalComparisonTable && typeof viewModel.newgradGoalComparisonTable === "object"
      ? viewModel.newgradGoalComparisonTable
      : null;
  if (!table) return null;

  const version = toDisplayText(table?.version);
  const emptyStateText = toDisplayText(table?.emptyStateText);
  const rows = toArr(table?.rows)
    .map((row, index) => ({
      rowKey: toStr(row?.rowKey) || `row_${index + 1}`,
      itemLabel: toDisplayText(row?.itemLabel) || toDisplayText(row?.label),
      label: toDisplayText(row?.itemLabel) || toDisplayText(row?.label),
      evidence: toDisplayText(row?.evidence),
      jobLinkage: toDisplayText(row?.jobLinkage),
      industryLinkage: toDisplayText(row?.industryLinkage),
      linkage: toDisplayText(row?.linkage),
    }))
    .filter((row) => !isMissingGoalTableText(row.evidence))
    .filter((row) => row.itemLabel || row.evidence || row.jobLinkage || row.industryLinkage || row.linkage);

  if (rows.length === 0 && !emptyStateText) return null;

  return {
    version,
    title: toDisplayText(table?.title) || "입력한 내용으로 보는 직무·산업 연결",
    description: toDisplayText(table?.description) || "입력한 내용 중 목표 직무와 산업에 연결해 볼 수 있는 항목만 정리했어요.",
    metaNote: toDisplayText(table?.metaNote),
    emptyStateText,
    meta: {
      targetJobLabel: toDisplayText(table?.meta?.targetJobLabel),
      targetIndustryLabel: toDisplayText(table?.meta?.targetIndustryLabel),
    },
    columns: {
      item: toDisplayText(table?.columns?.item) || "입력 항목",
      evidence: toDisplayText(table?.columns?.evidence) || "내가 입력한 내용",
      jobLinkage: toDisplayText(table?.columns?.jobLinkage) || "직무 쪽 해석",
      industryLinkage: toDisplayText(table?.columns?.industryLinkage) || "산업 쪽 해석",
    },
    rows,
  };
}

function normalizeStrengthEvidence(strengthEvidenceRead, droppedFields) {
  if (!strengthEvidenceRead || typeof strengthEvidenceRead !== "object") return null;

  const matchedStrengthLabels = normalizeTextList(
    strengthEvidenceRead?.matchedStrengthLabels,
    "strengthEvidence.matchedStrengthLabels",
    droppedFields
  );
  const matchedWorkStyleLabels = normalizeTextList(
    strengthEvidenceRead?.matchedWorkStyleLabels,
    "strengthEvidence.matchedWorkStyleLabels",
    droppedFields
  );
  const allStrengthLabels = normalizeTextList(
    strengthEvidenceRead?.allStrengthLabels,
    "strengthEvidence.allStrengthLabels",
    droppedFields
  );

  if (
    matchedStrengthLabels.length === 0 &&
    matchedWorkStyleLabels.length === 0 &&
    allStrengthLabels.length === 0
  ) {
    return null;
  }

  return {
    hasDirectMatch: Boolean(strengthEvidenceRead?.hasDirectMatch),
    matchedStrengthLabels,
    matchedWorkStyleLabels,
    allStrengthLabels,
  };
}

function normalizeReferenceReads(viewModel, droppedFields) {
  const targetJobRead =
    viewModel?.targetJobRead && typeof viewModel.targetJobRead === "object"
      ? viewModel.targetJobRead
      : {};
  const targetIndustryRead =
    viewModel?.targetIndustryRead && typeof viewModel.targetIndustryRead === "object"
      ? viewModel.targetIndustryRead
      : {};
  const industryTraitsAsset =
    viewModel?.industryTraitsAsset && typeof viewModel.industryTraitsAsset === "object"
      ? viewModel.industryTraitsAsset
      : null;

  return {
    targetJobRead: {
      title: toDisplayText(targetJobRead?.title),
      body: toDisplayText(targetJobRead?.body),
      bullets: normalizeTextList(targetJobRead?.bullets, "referenceReads.targetJobRead.bullets", droppedFields),
    },
    targetIndustryRead: {
      title: toDisplayText(targetIndustryRead?.title),
      summary: toDisplayText(targetIndustryRead?.summary),
      bullets: normalizeTextList(targetIndustryRead?.bullets, "referenceReads.targetIndustryRead.bullets", droppedFields),
    },
    industryTraits: industryTraitsAsset
      ? {
          label: toDisplayText(industryTraitsAsset?.label),
          summary: toStr(industryTraitsAsset?.summaryTemplate).replaceAll(
            "{label}",
            toDisplayText(industryTraitsAsset?.label)
          ),
          whyIndustryMatters: normalizeTextList(
            industryTraitsAsset?.whyIndustryMatters,
            "referenceReads.industryTraits.whyIndustryMatters",
            droppedFields
          ),
          evaluationCriteria: normalizeTextList(
            industryTraitsAsset?.evaluationCriteria,
            "referenceReads.industryTraits.evaluationCriteria",
            droppedFields
          ),
          businessStructure: toDisplayText(industryTraitsAsset?.businessStructure?.[0]),
          customerStructure: toDisplayText(industryTraitsAsset?.customerStructure?.[0]),
          operatingLanguage: toDisplayText(industryTraitsAsset?.operatingLanguage?.[0]),
        }
      : null,
  };
}

export function buildTransitionLitePdfModel(viewModel = {}, options = {}) {
  const safeViewModel = viewModel && typeof viewModel === "object" ? viewModel : {};
  const droppedFields = [];
  const axisPack =
    safeViewModel?.axisPack && typeof safeViewModel.axisPack === "object"
      ? safeViewModel.axisPack
      : null;
  const reportType =
    axisPack && typeof axisPack.version === "string" && axisPack.version.startsWith("newgrad")
      ? "newgrad"
      : "experienced";
  const generatedAt = options?.generatedAt instanceof Date ? options.generatedAt : new Date();
  const axisSummary = normalizeAxisEntries(axisPack, droppedFields);
  const topRisks = normalizeTopRisks(safeViewModel, droppedFields);
  const interviewerRead = normalizeTransitionReadBlock(safeViewModel, droppedFields);
  const detailedRead = reportType === "newgrad" ? normalizeDetailedRead(axisPack, droppedFields) : [];
  const newgradGoalComparisonTable = normalizeNewgradGoalComparisonTable(safeViewModel, reportType, droppedFields);
  const topRepairSignals = reportType === "newgrad"
    ? toArr(safeViewModel?.topRepairSignals).map((signal, index) => ({
        axisKey: toStr(signal?.axisKey) || `axis_${index + 1}`,
        title: toDisplayText(signal?.title),
        body: toDisplayText(signal?.body),
      })).filter((signal) => signal.title || signal.body)
    : [];

  return {
    reportKind: "transition-lite",
    reportType,
    reportTitle: "직무산업 적합도 리포트",
    generatedAt: toPrintableDate(generatedAt),
    topSummary: toDisplayText(safeViewModel?.heroSummary),
    axisSummary,
    topRisks,
    interviewerRead,
    detailedRead,
    newgradGoalComparisonTable,
    topRepairSignals,
    strengthEvidence: normalizeStrengthEvidence(safeViewModel?.strengthEvidenceRead, droppedFields),
    strengths: normalizeTextList(safeViewModel?.strengths, "strengths", droppedFields),
    whyThisRead: normalizeTextList(safeViewModel?.whyThisRead, "whyThisRead", droppedFields),
    whyThisReadSupportLine: toDisplayText(safeViewModel?.whyThisReadSupportLine),
    referenceReads: normalizeReferenceReads(safeViewModel, droppedFields),
    __pdfDebug: {
      inputShape: {
        topSummary: describeValueShape(safeViewModel?.heroSummary),
        axisSummary: describeValueShape(axisPack?.axes || axisPack),
        topRisks: describeValueShape(safeViewModel?.topRisks),
        interviewerRead: describeValueShape(
          safeViewModel?.validationReadBlock && typeof safeViewModel.validationReadBlock === "object"
            ? safeViewModel.validationReadBlock
            : safeViewModel?.transitionReadBlock
        ),
        detailedRead: describeValueShape(reportType === "newgrad" ? axisPack?.axes || axisPack : null),
        topRepairSignals: describeValueShape(safeViewModel?.topRepairSignals),
        strengthEvidence: describeValueShape(safeViewModel?.strengthEvidenceRead),
        strengths: describeValueShape(safeViewModel?.strengths),
        whyThisRead: describeValueShape(safeViewModel?.whyThisRead),
        referenceReads: describeValueShape({
          targetJobRead: safeViewModel?.targetJobRead,
          targetIndustryRead: safeViewModel?.targetIndustryRead,
          industryTraitsAsset: safeViewModel?.industryTraitsAsset,
        }),
      },
      droppedFields,
    },
  };
}

export default buildTransitionLitePdfModel;
