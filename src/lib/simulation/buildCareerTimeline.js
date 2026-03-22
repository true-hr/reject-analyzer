function __readCanonicalCareerHistory(input) {
  const direct = Array.isArray(input) ? input : null;
  if (direct && direct.length > 0) return direct;
  const nested = Array.isArray(input?.history) ? input.history : null;
  return nested && nested.length > 0 ? nested : [];
}

function __pickFlowLabel(item) {
  const role = String(item?.role || "").trim();
  const company = String(item?.company || "").trim();
  if (role && company) return `${role} @ ${company}`;
  if (role) return role;
  if (company) return company;
  return "경력 단계";
}

function __safeYm(value) {
  const raw = String(value || "").trim();
  if (!raw || /^present$/i.test(raw)) return raw.toLowerCase() === "present" ? "9999-12" : "";
  const m = raw.match(/^(\d{4})[-./](\d{1,2})$/);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return "";
  return `${y}-${String(mo).padStart(2, "0")}`;
}

function __gapMonthsBetween(endDate, nextStartDate) {
  const e = __safeYm(endDate);
  const s = __safeYm(nextStartDate);
  if (!e || !s || e === "9999-12" || s === "9999-12") return null;
  const em = e.match(/^(\d{4})-(\d{2})$/);
  const sm = s.match(/^(\d{4})-(\d{2})$/);
  if (!em || !sm) return null;
  const ey = Number(em[1]);
  const emo = Number(em[2]);
  const sy = Number(sm[1]);
  const smo = Number(sm[2]);
  if (![ey, emo, sy, smo].every(Number.isFinite)) return null;
  const diff = (sy - ey) * 12 + (smo - emo) - 1;
  return diff > 0 ? diff : 0;
}

function __buildTransitionNarrative(prev, next) {
  const prevRole = String(prev?.role || "").trim();
  const nextRole = String(next?.role || "").trim();
  const prevCompany = String(prev?.company || "").trim();
  const nextCompany = String(next?.company || "").trim();
  if (prevRole && nextRole && prevRole === nextRole && prevCompany !== nextCompany) {
    return "같은 역할 축을 유지한 채 회사나 환경을 옮긴 흐름으로 읽힙니다.";
  }
  if (prevRole && nextRole && prevRole !== nextRole) {
    return "중간 경력에서 역할의 중심축이 한 번 이동한 흐름으로 보입니다.";
  }
  if (prevCompany && nextCompany && prevCompany !== nextCompany) {
    return "회사 환경이 달라지면서 경력 맥락이 한 차례 전환된 흐름으로 읽힙니다.";
  }
  return "경력 단계가 한 번 이동한 흐름으로 보입니다.";
}

function __currentYm() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function __durationMonthsBetween(startDate, endDate) {
  const s = __safeYm(startDate);
  let e = __safeYm(endDate);
  if (!s || !e) return null;
  if (e === "9999-12") e = __currentYm();
  const sm = s.match(/^(\d{4})-(\d{2})$/);
  const em = e.match(/^(\d{4})-(\d{2})$/);
  if (!sm || !em) return null;
  const sy = Number(sm[1]);
  const smo = Number(sm[2]);
  const ey = Number(em[1]);
  const emo = Number(em[2]);
  if (![sy, smo, ey, emo].every(Number.isFinite)) return null;
  const months = (ey - sy) * 12 + (emo - smo) + 1;
  return months > 0 ? months : null;
}

function __pickTimelineAxis(item) {
  const role = String(item?.role || "").trim();
  if (role) return role;
  const company = String(item?.company || "").trim();
  if (company) return company;
  return "";
}

export function buildCareerTimeline(careerHistoryInput) {
  const rawHistory = __readCanonicalCareerHistory(careerHistoryInput);
  const history = (Array.isArray(rawHistory) ? rawHistory : [])
    .filter((item) => item && typeof item === "object")
    .slice()
    .sort((a, b) => __safeYm(a?.startDate).localeCompare(__safeYm(b?.startDate)));

  const steps = history.map((item, index) => {
    const label = __pickFlowLabel(item);
    const axis = __pickTimelineAxis(item) || label;
    const monthsRaw = Number(item?.months);
    const durationMonths = Number.isFinite(monthsRaw) && monthsRaw > 0
      ? monthsRaw
      : __durationMonthsBetween(item?.startDate, item?.endDate);
    return {
      index,
      company: String(item?.company || "").trim() || null,
      role: String(item?.role || "").trim() || null,
      startDate: __safeYm(item?.startDate || item?.start) || null,
      endDate: __safeYm(item?.endDate || item?.end) || null,
      durationMonths,
      axis,
      label,
      source: String(item?.source || "").trim() || null,
    };
  });

  const gaps = [];
  const transitions = [];
  const axisCounts = new Map();
  for (const step of steps) {
    const axisKey = String(step?.axis || "").trim();
    if (!axisKey) continue;
    axisCounts.set(axisKey, (axisCounts.get(axisKey) || 0) + 1);
  }

  for (let i = 1; i < steps.length; i++) {
    const prev = steps[i - 1];
    const next = steps[i];
    const transitionSummary = __buildTransitionNarrative(prev, next);
    if (prev.label !== next.label) {
      const kind =
        prev.role && next.role && prev.role !== next.role
          ? "role_shift"
          : (prev.company && next.company && prev.company !== next.company ? "company_shift" : "step_change");
      transitions.push({
        from: prev.label,
        to: next.label,
        kind,
        summary: transitionSummary,
      });
    }
    const gapMonths = __gapMonthsBetween(prev?.endDate, next?.startDate);
    if (Number.isFinite(gapMonths) && gapMonths > 0) {
      gaps.push({
        from: prev.label,
        to: next.label,
        months: gapMonths,
        isConcern: gapMonths >= 3,
      });
    }
  }

  const startPoint = steps[0]?.label || null;
  const currentPoint = steps[steps.length - 1]?.label || null;
  const recentAxis = steps[steps.length - 1]?.axis || currentPoint || null;
  let overallAxis = null;
  let overallAxisCount = 0;
  for (const [axis, count] of axisCounts.entries()) {
    if (count > overallAxisCount) {
      overallAxis = axis;
      overallAxisCount = count;
    }
  }
  if (!overallAxis) overallAxis = recentAxis || startPoint || null;

  let summary = "현재 이력서만으로는 커리어 흐름을 한 줄로 읽기 어렵습니다.";
  if (steps.length > 0 && recentAxis && overallAxis && recentAxis !== overallAxis) {
    summary = `전체 경력은 ${overallAxis} 축이 반복되지만 최근에는 ${recentAxis} 축으로 읽힙니다.`;
  } else if (steps.length > 1 && startPoint && currentPoint && startPoint !== currentPoint) {
    summary = `${startPoint}에서 시작해 현재는 ${currentPoint} 쪽으로 이동한 흐름으로 읽힙니다.`;
  } else if (recentAxis) {
    summary = `현재 커리어는 ${recentAxis} 축 중심으로 읽힙니다.`;
  } else if (overallAxis) {
    summary = `현재 커리어는 ${overallAxis} 관련 경험 축이 보이지만, 최근 역할 축 설명은 문서에서 더 분명해질 필요가 있습니다.`;
  } else if (currentPoint) {
    summary = `현재 커리어는 ${currentPoint} 경험을 중심으로 읽히지만, 하나의 역할 축으로 정리되려면 설명 보강이 필요합니다.`;
  }
  if (gaps.some((item) => item?.isConcern)) {
    summary += " 이력 사이 간격이 보여 흐름 해석은 보수적으로 유지됩니다.";
  }

  return {
    steps,
    gaps,
    transitions,
    startPoint,
    currentPoint,
    recentAxis,
    overallAxis,
    summary,
    hasGapConcern: gaps.some((item) => item?.isConcern),
  };
}
