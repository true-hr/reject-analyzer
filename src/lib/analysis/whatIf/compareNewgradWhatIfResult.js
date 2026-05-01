// What-if delta comparison for newgrad cert simulation.
// Reads axisPack.axes scores/bands and certEvidencePack rows.
// Does NOT mutate baseVm or simulatedVm.

const AXIS_KEYS = [
  { key: "jobStructure",        label: "전공·직무 연결성" },
  { key: "industryContext",     label: "산업 분야 이해도" },
  { key: "responsibilityScope", label: "이력·스펙 연결성" },
  { key: "customerType",        label: "이해관계자 소통" },
  { key: "roleCharacter",       label: "강점과 재능" },
];

function safeAxes(vm) {
  return vm?.axisPack?.axes && typeof vm.axisPack.axes === "object"
    ? vm.axisPack.axes
    : {};
}

function certRowLabels(vm) {
  const rows = vm?.certEvidencePack?.rows;
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => String(r?.displayLabel || r?.normalizedLabel || r?.rawLabel || "")).filter(Boolean);
}

function goalTableCertSummary(vm) {
  const table = vm?.newgradGoalComparisonTable;
  if (!table || typeof table !== "object") return "";
  const rows = Array.isArray(table.rows) ? table.rows : [];
  const certRow = rows.find((r) => r?.rowKey === "certifications");
  return String(certRow?.evidence || "");
}

export function compareNewgradWhatIfResult(baseVm, simulatedVm, virtualCert) {
  const baseAxes = safeAxes(baseVm);
  const simAxes = safeAxes(simulatedVm);

  const changedAxes = [];
  const helpedParts = [];
  const unchangedParts = [];

  for (const { key, label } of AXIS_KEYS) {
    const base = baseAxes[key];
    const sim = simAxes[key];
    if (!base || !sim) continue;

    const beforeScore = Number(base.rawScore ?? base.displayScore ?? 0);
    const afterScore = Number(sim.rawScore ?? sim.displayScore ?? 0);
    const delta = afterScore - beforeScore;
    const beforeBand = String(base.band || "");
    const afterBand = String(sim.band || "");

    const baseExplSummary = String(base.explanation?.summary || "");
    const simExplSummary = String(sim.explanation?.summary || "");
    const explanationChanged = baseExplSummary !== simExplSummary;

    if (delta !== 0 || beforeBand !== afterBand) {
      changedAxes.push({
        axisKey: key,
        label,
        beforeScore,
        afterScore,
        delta,
        beforeBand,
        afterBand,
        explanationChanged,
      });
    } else if (explanationChanged) {
      helpedParts.push({ axisKey: key, label, kind: "explanation_only" });
    } else {
      unchangedParts.push({ axisKey: key, label });
    }
  }

  // cert evidence rows comparison
  const baseCertLabels = certRowLabels(baseVm);
  const simCertLabels = certRowLabels(simulatedVm);
  const newCertLabels = simCertLabels.filter((l) => !baseCertLabels.includes(l));
  const certEvidenceAdded = newCertLabels.length > 0;

  // goal table cert summary change
  const baseGoalCertSummary = goalTableCertSummary(baseVm);
  const simGoalCertSummary = goalTableCertSummary(simulatedVm);
  const goalCertSummaryChanged = baseGoalCertSummary !== simGoalCertSummary;

  // summaryLabel
  const hasScoreChange = changedAxes.some((a) => Math.abs(a.delta) >= 20);
  const hasSmallChange = changedAxes.length > 0 && !hasScoreChange;
  const hasExplanationOnly = helpedParts.length > 0 || certEvidenceAdded || goalCertSummaryChanged;

  let summaryLabel;
  let recommendation;
  const certName = String(virtualCert?.label || "이 자격증");

  if (hasScoreChange) {
    summaryLabel = "도움 있음";
    const improved = changedAxes.filter((a) => a.delta > 0).map((a) => a.label);
    recommendation = improved.length > 0
      ? `${certName}는 ${improved.join(", ")} 축에 직접적인 보완 신호를 추가합니다. 다만 실무 경험과 함께 준비할 때 더 효과적입니다.`
      : `${certName}를 추가했을 때 일부 축의 점수 변화가 감지됐습니다. 구체적인 효과는 지원 직무·산업 조합에 따라 달라질 수 있습니다.`;
  } else if (hasSmallChange || hasExplanationOnly) {
    summaryLabel = "변화 작음";
    recommendation = `${certName}는 주로 산업 분야 이해도 축의 보조 근거로 반영될 수 있습니다. 점수 변화는 작지만 지원서에서 기초 이해도를 보여주는 신호로 사용할 수 있습니다. 직접 경험을 대체하지는 않으므로, SQL 기반 분석 프로젝트 등 실무형 경험 1개와 함께 준비하는 편이 더 효과적입니다.`;
  } else {
    summaryLabel = "거의 변화 없음";
    recommendation = `${certName}는 현재 지원 직무·산업 조합에서 추가 점수나 설명 변화를 만들어 내지 않습니다. 해당 자격증보다는 프로젝트·인턴십 등 실무 경험 보완이 우선 순위가 더 높습니다.`;
  }

  return {
    summaryLabel,
    changedAxes,
    helpedParts,
    unchangedParts,
    certEvidenceAdded,
    newCertLabels,
    goalCertSummaryChanged,
    recommendation,
  };
}
