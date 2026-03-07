function toStr(v) {
  return (v ?? "").toString().trim();
}

function clamp01(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

const ROLE_LEVEL_INDEX = {
  unknown: -1,
  ic: 1,
  lead: 2,
  manager: 3,
  head_director: 4,
};

function normalizeRoleLevel(v) {
  const s = toStr(v).toLowerCase();
  if (!s) return "unknown";

  if (/(director|head|vp|c-level|exec|executive)/i.test(s)) return "head_director";
  if (/(manager|mgr|group\s*lead)/i.test(s)) return "manager";
  if (/(lead|team[_\s-]*lead|tech\s*lead)/i.test(s)) return "lead";
  if (/(ic|individual|individual\s*contributor|senior|staff|associate|junior)/i.test(s)) return "ic";

  const m = s.match(/(?:^|[^a-z])(l|lv|level)\s*([0-9]{1,2})(?:$|[^a-z0-9])/i) || s.match(/^([0-9]{1,2})$/);
  if (m) {
    const n = Number(m[2] ?? m[1]);
    if (Number.isFinite(n)) {
      if (n >= 7) return "head_director";
      if (n >= 5) return "manager";
      if (n >= 4) return "lead";
      return "ic";
    }
  }

  return "unknown";
}

function pickCurrentLevel(state) {
  return (
    state?.levelCurrent ??
    state?.career?.leadershipLevel ??
    state?.leadershipLevel ??
    state?.currentRole ??
    state?.roleCurrent ??
    null
  );
}

function pickTargetLevel(state) {
  return (
    state?.levelTarget ??
    state?.targetRoleLevel ??
    state?.roleTargetLevel ??
    state?.career?.targetRole ??
    state?.targetRole ??
    state?.roleTarget ??
    null
  );
}

function computeRoleLevelMismatch(ctx) {
  const state = ctx?.state || {};

  const currentRaw = pickCurrentLevel(state);
  const targetRaw = pickTargetLevel(state);

  const currentLevel = normalizeRoleLevel(currentRaw);
  const targetLevel = normalizeRoleLevel(targetRaw);
  const currentIdx = ROLE_LEVEL_INDEX[currentLevel] ?? -1;
  const targetIdx = ROLE_LEVEL_INDEX[targetLevel] ?? -1;

  if (currentIdx <= 0 || targetIdx <= 0) {
    return {
      triggered: false,
      severity: "none",
      score: 0,
      gap: null,
      direction: "unknown",
      currentLevel,
      targetLevel,
      currentRaw: toStr(currentRaw),
      targetRaw: toStr(targetRaw),
    };
  }

  const gap = targetIdx - currentIdx;
  const absGap = Math.abs(gap);

  let triggered = false;
  let severity = "none";
  let score = 0;
  let direction = "equal";

  if (gap > 0) direction = "up";
  else if (gap < 0) direction = "down";

  if (gap >= 2) {
    triggered = true;
    severity = "strong";
    score = 0.42;
  } else if (gap === 1) {
    triggered = true;
    severity = "weak";
    score = 0.28;
  } else if (gap <= -2) {
    triggered = true;
    severity = "reverse_fit";
    score = 0.24;
  } else if (gap === -1) {
    triggered = true;
    severity = "reverse_fit";
    score = 0.18;
  }

  return {
    triggered,
    severity,
    score: clamp01(score),
    gap,
    absGap,
    direction,
    currentLevel,
    targetLevel,
    currentRaw: toStr(currentRaw),
    targetRaw: toStr(targetRaw),
  };
}

function buildExplain(calc) {
  const why = [];
  if (calc.direction === "up") {
    if (calc.severity === "strong") {
      why.push("현재 직급 대비 목표 직급 차이가 커서, 면접관 입장에서 즉시전력성에 의문이 생길 수 있습니다.");
    } else {
      why.push("목표 직급이 현재보다 한 단계 높아, 더 넓은 책임 범위를 실증하는 근거가 요구될 수 있습니다.");
    }
  } else if (calc.direction === "down") {
    why.push("현재보다 낮은 직급으로의 지원은, 동기와 역방향 적합성에 대한 면접 질문으로 이어질 수 있습니다.");
  }

  const signals = [
    `currentLevel=${calc.currentLevel}`,
    `targetLevel=${calc.targetLevel}`,
  ];
  if (Number.isFinite(calc.gap)) signals.push(`levelGap=${calc.gap}`);

  const action = [
    "Map current responsibilities to target-level responsibilities with concrete 1:1 evidence.",
  ];
  if (calc.direction === "down") {
    action.push("Clarify why a down-level move is intentional and sustainable to reduce reverse-fit concern.");
  }

  const counter = [
    "Prior evidence of similar-scope ownership and cross-team delivery reduces this risk.",
  ];

  return {
    title: "Role level mismatch risk",
    why,
    signals,
    action,
    counter,
  };
}

export const roleLevelMismatchRisk = {
  id: "RISK__ROLE_LEVEL_MISMATCH",
  title: "Role level mismatch between current and target role",
  group: "seniority",
  layer: "seniority risk",
  priority: 49,
  when: (ctx) => computeRoleLevelMismatch(ctx).triggered,
  score: (ctx) => computeRoleLevelMismatch(ctx).score,
  explain: (ctx) => buildExplain(computeRoleLevelMismatch(ctx)),
};

export default roleLevelMismatchRisk;
