// src/lib/hiddenRisk.js
// NOTE: append-only engine. Crash-safe by design.
// - Never throws
// - Never depends on analyzer internals
// - Uses only proxy (observable) signals + drivers

// ------------------------------
// small utils (self-contained to avoid import/export mismatches)
// ------------------------------
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function safeToString(v) {
  return (v ?? "").toString();
}

function safeLower(v) {
  return safeToString(v).toLowerCase();
}

function uniq(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(new Set(arr.map((x) => safeToString(x).trim()).filter(Boolean)));
}

/**
 * Normalize score to 0~1
 * - accepts 0~1
 * - accepts 0~100
 * - accepts strings/unknown -> 0
 */
function normalize01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  if (n <= 1) return clamp(n, 0, 1);
  if (n <= 100) return clamp(n / 100, 0, 1);
  return clamp(n, 0, 1);
}

function levelFrom01(s01) {
  const s = normalize01(s01);
  if (s >= 0.67) return "high";
  if (s >= 0.34) return "mid";
  return "low";
}

function safeObj(x) {
  return x && typeof x === "object" && !Array.isArray(x) ? x : null;
}

function getNum(obj, path, fallback = null) {
  const o = safeObj(obj);
  if (!o) return fallback;
  const parts = safeToString(path).split(".").filter(Boolean);
  let cur = o;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return fallback;
    cur = cur[p];
  }
  const n = Number(cur);
  return Number.isFinite(n) ? n : fallback;
}

function getStr(obj, path, fallback = "") {
  const o = safeObj(obj);
  if (!o) return fallback;
  const parts = safeToString(path).split(".").filter(Boolean);
  let cur = o;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return fallback;
    cur = cur[p];
  }
  return safeToString(cur);
}

function getArr(obj, path, fallback = []) {
  const o = safeObj(obj);
  if (!o) return fallback;
  const parts = safeToString(path).split(".").filter(Boolean);
  let cur = o;
  for (const p of parts) {
    if (!cur || typeof cur !== "object") return fallback;
    cur = cur[p];
  }
  return Array.isArray(cur) ? cur : fallback;
}

// ------------------------------
// drivers helpers
// ------------------------------
function pushDriver(drivers, text) {
  const t = safeToString(text).trim();
  if (!t) return;
  drivers.push(t);
}

function readCareer(input) {
  const root = safeObj(input) || {};
  // allow: input.career OR input.state.career
  const career = safeObj(root.career) || safeObj(root.state?.career) || {};
  return {
    totalYears: Number(career.totalYears) || 0,
    gapMonths: Number(career.gapMonths) || 0,
    jobChanges: Number(career.jobChanges) || 0,
    lastTenureMonths: Number(career.lastTenureMonths) || 0,
  };
}

function readStructureAnalysis(input) {
  const root = safeObj(input) || {};
  return safeObj(root.structureAnalysis) || safeObj(root.structurePack?.structureAnalysis) || safeObj(root.analysis?.structureAnalysis) || {};
}

function readHireability(input) {
  const root = safeObj(input) || {};
  return safeObj(root.hireability) || safeObj(root.analysis?.hireability) || {};
}

function readMajorSignals(input) {
  const root = safeObj(input) || {};
  return safeObj(root.majorSignals) || safeObj(root.analysis?.majorSignals) || {};
}

function readHypotheses(input) {
  const root = safeObj(input) || {};
  const hs = root.hypotheses || root.analysis?.hypotheses;
  return Array.isArray(hs) ? hs : [];
}

function extractFlags(structureAnalysis) {
  // allow a few shapes:
  // - structureAnalysis.flags: ["A", "B"]
  // - structureAnalysis.structureFlags: ["A", ...]
  // - structureAnalysis.flagsMap: { A: true }
  const a = safeObj(structureAnalysis) || {};
  const flags = []
    .concat(getArr(a, "flags", []))
    .concat(getArr(a, "structureFlags", []))
    .concat(getArr(a, "flagList", []));

  const map = safeObj(a.flagsMap) || safeObj(a.structureFlagsMap) || null;
  if (map) {
    for (const k of Object.keys(map)) {
      if (map[k]) flags.push(k);
    }
  }
  return uniq(flags.map((x) => safeToString(x)));
}

// ------------------------------
// risk computations (proxy-based)
// ------------------------------
function computeRetentionRisk(input) {
  const drivers = [];
  const c = readCareer(input);

  let score = 0;

  // last tenure
  if (c.lastTenureMonths > 0 && c.lastTenureMonths <= 6) {
    score += 0.45;
    pushDriver(drivers, `최근 근속기간이 짧음: ${c.lastTenureMonths}개월`);
  } else if (c.lastTenureMonths > 0 && c.lastTenureMonths <= 12) {
    score += 0.3;
    pushDriver(drivers, `최근 근속기간이 비교적 짧음: ${c.lastTenureMonths}개월`);
  } else if (c.lastTenureMonths > 0 && c.lastTenureMonths <= 18) {
    score += 0.15;
    pushDriver(drivers, `최근 근속기간이 다소 짧은 편: ${c.lastTenureMonths}개월`);
  }

  // job changes
  if (c.jobChanges >= 4) {
    score += 0.35;
    pushDriver(drivers, `이직 횟수 많음: ${c.jobChanges}회`);
  } else if (c.jobChanges === 3) {
    score += 0.25;
    pushDriver(drivers, `이직 횟수 다소 많음: ${c.jobChanges}회`);
  } else if (c.jobChanges === 2) {
    score += 0.15;
    pushDriver(drivers, `이직 경험 있음: ${c.jobChanges}회`);
  }

  // gaps
  if (c.gapMonths >= 12) {
    score += 0.25;
    pushDriver(drivers, `공백 기간 큼: ${c.gapMonths}개월`);
  } else if (c.gapMonths >= 6) {
    score += 0.15;
    pushDriver(drivers, `공백 기간 있음: ${c.gapMonths}개월`);
  } else if (c.gapMonths >= 3) {
    score += 0.08;
    pushDriver(drivers, `공백 기간 단서: ${c.gapMonths}개월`);
  }

  const s01 = clamp(score, 0, 1);

  return {
    score: s01,
    level: levelFrom01(s01),
    drivers: uniq(drivers),
  };
}

function computeDomainPathRisk(input) {
  const drivers = [];
  const sa = readStructureAnalysis(input);
  const flags = extractFlags(sa);

  // Prefer explicit scores if present
  const industryFit = normalize01(
    getNum(sa, "industryStructureFitScore", getNum(sa, "industryFitScore", null))
  );
  const sizeFit = normalize01(
    getNum(sa, "companySizeFitScore", getNum(sa, "sizeFitScore", null))
  );
  const vendorFit = normalize01(
    getNum(sa, "vendorExperienceScore", getNum(sa, "vendorFitScore", null))
  );

  // Risk is inverse of fit
  const invIndustry = 1 - industryFit;
  const invSize = 1 - sizeFit;
  const invVendor = 1 - vendorFit;

  // When score is missing, treat as neutral (not penalize too hard)
  const hasIndustry = getNum(sa, "industryStructureFitScore", null) !== null || getNum(sa, "industryFitScore", null) !== null;
  const hasSize = getNum(sa, "companySizeFitScore", null) !== null || getNum(sa, "sizeFitScore", null) !== null;
  const hasVendor = getNum(sa, "vendorExperienceScore", null) !== null || getNum(sa, "vendorFitScore", null) !== null;

  let score = 0;

  if (hasIndustry) {
    score += invIndustry * 0.45;
    if (industryFit < 0.5) pushDriver(drivers, `산업/도메인 구조 적합도 낮음: ${Math.round(industryFit * 100)}점`);
    else if (industryFit < 0.7) pushDriver(drivers, `산업/도메인 구조 적합도 보통: ${Math.round(industryFit * 100)}점`);
  }

  if (hasSize) {
    score += invSize * 0.35;
    if (sizeFit < 0.5) pushDriver(drivers, `회사 규모/스테이지 적합도 낮음: ${Math.round(sizeFit * 100)}점`);
    else if (sizeFit < 0.7) pushDriver(drivers, `회사 규모/스테이지 적합도 보통: ${Math.round(sizeFit * 100)}점`);
  }

  if (hasVendor) {
    score += invVendor * 0.2;
    if (vendorFit < 0.5) pushDriver(drivers, `벤더/인하우스 경험 적합도 낮음: ${Math.round(vendorFit * 100)}점`);
    else if (vendorFit < 0.7) pushDriver(drivers, `벤더/인하우스 경험 적합도 보통: ${Math.round(vendorFit * 100)}점`);
  }

  // flags as strong observable proxies
  const important = [
    "SIZE_DOWNSHIFT_RISK",
    "SIZE_UPSHIFT_RISK",
    "VENDOR_CORE_VALUE",
    "INDUSTRY_MISMATCH",
    "ROLE_MISMATCH",
    "SCOPE_MISMATCH",
    "ORG_COMPLEXITY_MISMATCH",
  ];

  for (const f of important) {
    if (flags.includes(f)) {
      // light bump per flag; capped later
      score += 0.08;
      pushDriver(drivers, `구조 플래그 감지: ${f}`);
    }
  }

  const s01 = clamp(score, 0, 1);

  return {
    score: s01,
    level: levelFrom01(s01),
    drivers: uniq(drivers),
  };
}

function computeScopeInflationRisk(input) {
  const drivers = [];
  const hireability = readHireability(input);

  // Try multiple fields; normalize 0~1 or 0~100
  const proofStrength = normalize01(
    getNum(hireability, "scores.proofStrength", getNum(hireability, "scores.proofStrengthScore", getNum(hireability, "scores.proofScore", null)))
  );
  const numbersEvidence = normalize01(
    getNum(hireability, "scores.numbersEvidence", getNum(hireability, "scores.numbersEvidenceLevel", getNum(hireability, "scores.numbersEvidenceScore", null)))
  );
  const mustHaveFit = normalize01(
    getNum(hireability, "scores.mustHaveFit", getNum(hireability, "scores.mustHaveFitLevel", getNum(hireability, "scores.mustHaveScore", null)))
  );

  const hasProof = getNum(hireability, "scores.proofStrength", null) !== null ||
    getNum(hireability, "scores.proofStrengthScore", null) !== null ||
    getNum(hireability, "scores.proofScore", null) !== null;

  const hasNumbers = getNum(hireability, "scores.numbersEvidence", null) !== null ||
    getNum(hireability, "scores.numbersEvidenceLevel", null) !== null ||
    getNum(hireability, "scores.numbersEvidenceScore", null) !== null;

  const hasMustHave = getNum(hireability, "scores.mustHaveFit", null) !== null ||
    getNum(hireability, "scores.mustHaveFitLevel", null) !== null ||
    getNum(hireability, "scores.mustHaveScore", null) !== null;

  // Default: do not penalize hard if data missing
  let score = 0;

  if (hasProof) {
    score += (1 - proofStrength) * 0.55;
    if (proofStrength < 0.45) pushDriver(drivers, `증거 강도 낮음(정성/정량 근거 부족): ${Math.round(proofStrength * 100)}점`);
    else if (proofStrength < 0.65) pushDriver(drivers, `증거 강도 보통: ${Math.round(proofStrength * 100)}점`);
  }

  if (hasNumbers) {
    score += (1 - numbersEvidence) * 0.35;
    if (numbersEvidence < 0.45) pushDriver(drivers, `정량 근거(수치/지표) 부족: ${Math.round(numbersEvidence * 100)}점`);
    else if (numbersEvidence < 0.65) pushDriver(drivers, `정량 근거(수치/지표) 보통: ${Math.round(numbersEvidence * 100)}점`);
  }

  // If must-have fit is low, "과장 의심"보다는 "핵심요건 부합 부족"으로만 프록시
  if (hasMustHave) {
    score += (1 - mustHaveFit) * 0.1;
    if (mustHaveFit < 0.45) pushDriver(drivers, `JD 필수요건 부합 낮음(표현/경험 연결 부족): ${Math.round(mustHaveFit * 100)}점`);
  }

  const s01 = clamp(score, 0, 1);

  return {
    score: s01,
    level: levelFrom01(s01),
    drivers: uniq(drivers),
  };
}

function computeCultureFitProxyRisk(input) {
  const drivers = [];
  const hireability = readHireability(input);
  const sa = readStructureAnalysis(input);

  // Use "proxy" only: collaboration / ownership / execution-vs-strategy mismatch (if available)
  const collaboration = normalize01(
    getNum(hireability, "scores.collaboration", getNum(hireability, "scores.collaborationLevel", getNum(hireability, "scores.collaborationScore", null)))
  );
  const ownership = normalize01(
    getNum(hireability, "scores.ownership", getNum(hireability, "scores.ownershipLevel", getNum(hireability, "scores.ownershipScore", null)))
  );

  const hasCollab = getNum(hireability, "scores.collaboration", null) !== null ||
    getNum(hireability, "scores.collaborationLevel", null) !== null ||
    getNum(hireability, "scores.collaborationScore", null) !== null;

  const hasOwner = getNum(hireability, "scores.ownership", null) !== null ||
    getNum(hireability, "scores.ownershipLevel", null) !== null ||
    getNum(hireability, "scores.ownershipScore", null) !== null;

  let score = 0;

  if (hasCollab) {
    score += (1 - collaboration) * 0.55;
    if (collaboration < 0.45) pushDriver(drivers, `협업/조율 신호 약함(프록시): ${Math.round(collaboration * 100)}점`);
    else if (collaboration < 0.65) pushDriver(drivers, `협업/조율 신호 보통(프록시): ${Math.round(collaboration * 100)}점`);
  }

  if (hasOwner) {
    score += (1 - ownership) * 0.45;
    if (ownership < 0.45) pushDriver(drivers, `오너십/주도성 신호 약함(프록시): ${Math.round(ownership * 100)}점`);
    else if (ownership < 0.65) pushDriver(drivers, `오너십/주도성 신호 보통(프록시): ${Math.round(ownership * 100)}점`);
  }

  // Flags can hint org-style mismatch (still proxy, not personality)
  const flags = extractFlags(sa);
  const proxyFlags = ["ORG_COMPLEXITY_MISMATCH", "PROCESS_SPEED_MISMATCH", "COLLAB_STYLE_MISMATCH"];
  for (const f of proxyFlags) {
    if (flags.includes(f)) {
      score += 0.08;
      pushDriver(drivers, `조직/협업 스타일 프록시 플래그 감지: ${f}`);
    }
  }

  const s01 = clamp(score, 0, 1);

  return {
    score: s01,
    level: levelFrom01(s01),
    drivers: uniq(drivers),
  };
}

// ------------------------------
// public API
// ------------------------------
export function computeHiddenRisk(input) {
  try {
    const retentionRisk = computeRetentionRisk(input);
    const domainPathRisk = computeDomainPathRisk(input);
    const scopeInflationRisk = computeScopeInflationRisk(input);
    const cultureFitProxyRisk = computeCultureFitProxyRisk(input);

    // weighted overall (stable defaults)
    const w = {
      retention: 0.35,
      domain: 0.25,
      scope: 0.2,
      culture: 0.2,
    };

    const overall = clamp(
      retentionRisk.score * w.retention +
        domainPathRisk.score * w.domain +
        scopeInflationRisk.score * w.scope +
        cultureFitProxyRisk.score * w.culture,
      0,
      1
    );

    const notes = [];

    // Minimal, non-judgmental notes (optional)
    if (overall >= 0.67) {
      notes.push("리스크 신호가 여러 개 겹쳐 있습니다. drivers를 기준으로 ‘증거 보강/경로 정렬’부터 정리하는 편이 안전합니다.");
    } else if (overall >= 0.34) {
      notes.push("일부 리스크 신호가 보입니다. drivers에 해당하는 항목만 보강해도 체감 개선이 나오는 구간입니다.");
    }

    return {
      version: "v1",
      overallScore: overall,
      items: {
        retentionRisk,
        domainPathRisk,
        scopeInflationRisk,
        cultureFitProxyRisk,
      },
      notes,
    };
  } catch {
    // absolute crash-safe fallback
    return {
      version: "v1",
      overallScore: 0,
      items: {
        retentionRisk: { score: 0, level: "low", drivers: [] },
        domainPathRisk: { score: 0, level: "low", drivers: [] },
        scopeInflationRisk: { score: 0, level: "low", drivers: [] },
        cultureFitProxyRisk: { score: 0, level: "low", drivers: [] },
      },
      notes: [],
    };
  }
}
