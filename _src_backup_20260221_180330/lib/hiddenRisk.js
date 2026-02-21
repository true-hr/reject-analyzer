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
    pushDriver(drivers, `理쒓렐 洹쇱냽湲곌컙??吏㏃쓬: ${c.lastTenureMonths}媛쒖썡`);
  } else if (c.lastTenureMonths > 0 && c.lastTenureMonths <= 12) {
    score += 0.3;
    pushDriver(drivers, `理쒓렐 洹쇱냽湲곌컙??鍮꾧탳??吏㏃쓬: ${c.lastTenureMonths}媛쒖썡`);
  } else if (c.lastTenureMonths > 0 && c.lastTenureMonths <= 18) {
    score += 0.15;
    pushDriver(drivers, `理쒓렐 洹쇱냽湲곌컙???ㅼ냼 吏㏃? ?? ${c.lastTenureMonths}媛쒖썡`);
  }

  // job changes
  if (c.jobChanges >= 4) {
    score += 0.35;
    pushDriver(drivers, `?댁쭅 ?잛닔 留롮쓬: ${c.jobChanges}??);
  } else if (c.jobChanges === 3) {
    score += 0.25;
    pushDriver(drivers, `?댁쭅 ?잛닔 ?ㅼ냼 留롮쓬: ${c.jobChanges}??);
  } else if (c.jobChanges === 2) {
    score += 0.15;
    pushDriver(drivers, `?댁쭅 寃쏀뿕 ?덉쓬: ${c.jobChanges}??);
  }

  // gaps
  if (c.gapMonths >= 12) {
    score += 0.25;
    pushDriver(drivers, `怨듬갚 湲곌컙 ?? ${c.gapMonths}媛쒖썡`);
  } else if (c.gapMonths >= 6) {
    score += 0.15;
    pushDriver(drivers, `怨듬갚 湲곌컙 ?덉쓬: ${c.gapMonths}媛쒖썡`);
  } else if (c.gapMonths >= 3) {
    score += 0.08;
    pushDriver(drivers, `怨듬갚 湲곌컙 ?⑥꽌: ${c.gapMonths}媛쒖썡`);
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
    if (industryFit < 0.5) pushDriver(drivers, `?곗뾽/?꾨찓??援ъ“ ?곹빀????쓬: ${Math.round(industryFit * 100)}??);
    else if (industryFit < 0.7) pushDriver(drivers, `?곗뾽/?꾨찓??援ъ“ ?곹빀??蹂댄넻: ${Math.round(industryFit * 100)}??);
  }

  if (hasSize) {
    score += invSize * 0.35;
    if (sizeFit < 0.5) pushDriver(drivers, `?뚯궗 洹쒕え/?ㅽ뀒?댁? ?곹빀????쓬: ${Math.round(sizeFit * 100)}??);
    else if (sizeFit < 0.7) pushDriver(drivers, `?뚯궗 洹쒕え/?ㅽ뀒?댁? ?곹빀??蹂댄넻: ${Math.round(sizeFit * 100)}??);
  }

  if (hasVendor) {
    score += invVendor * 0.2;
    if (vendorFit < 0.5) pushDriver(drivers, `踰ㅻ뜑/?명븯?곗뒪 寃쏀뿕 ?곹빀????쓬: ${Math.round(vendorFit * 100)}??);
    else if (vendorFit < 0.7) pushDriver(drivers, `踰ㅻ뜑/?명븯?곗뒪 寃쏀뿕 ?곹빀??蹂댄넻: ${Math.round(vendorFit * 100)}??);
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
      pushDriver(drivers, `援ъ“ ?뚮옒洹?媛먯?: ${f}`);
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
    if (proofStrength < 0.45) pushDriver(drivers, `利앷굅 媛뺣룄 ??쓬(?뺤꽦/?뺣웾 洹쇨굅 遺議?: ${Math.round(proofStrength * 100)}??);
    else if (proofStrength < 0.65) pushDriver(drivers, `利앷굅 媛뺣룄 蹂댄넻: ${Math.round(proofStrength * 100)}??);
  }

  if (hasNumbers) {
    score += (1 - numbersEvidence) * 0.35;
    if (numbersEvidence < 0.45) pushDriver(drivers, `?뺣웾 洹쇨굅(?섏튂/吏?? 遺議? ${Math.round(numbersEvidence * 100)}??);
    else if (numbersEvidence < 0.65) pushDriver(drivers, `?뺣웾 洹쇨굅(?섏튂/吏?? 蹂댄넻: ${Math.round(numbersEvidence * 100)}??);
  }

  // If must-have fit is low, "怨쇱옣 ?섏떖"蹂대떎??"?듭떖?붽굔 遺??遺議??쇰줈留??꾨줉??
  if (hasMustHave) {
    score += (1 - mustHaveFit) * 0.1;
    if (mustHaveFit < 0.45) pushDriver(drivers, `JD ?꾩닔?붽굔 遺????쓬(?쒗쁽/寃쏀뿕 ?곌껐 遺議?: ${Math.round(mustHaveFit * 100)}??);
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
    if (collaboration < 0.45) pushDriver(drivers, `?묒뾽/議곗쑉 ?좏샇 ?쏀븿(?꾨줉??: ${Math.round(collaboration * 100)}??);
    else if (collaboration < 0.65) pushDriver(drivers, `?묒뾽/議곗쑉 ?좏샇 蹂댄넻(?꾨줉??: ${Math.round(collaboration * 100)}??);
  }

  if (hasOwner) {
    score += (1 - ownership) * 0.45;
    if (ownership < 0.45) pushDriver(drivers, `?ㅻ꼫??二쇰룄???좏샇 ?쏀븿(?꾨줉??: ${Math.round(ownership * 100)}??);
    else if (ownership < 0.65) pushDriver(drivers, `?ㅻ꼫??二쇰룄???좏샇 蹂댄넻(?꾨줉??: ${Math.round(ownership * 100)}??);
  }

  // Flags can hint org-style mismatch (still proxy, not personality)
  const flags = extractFlags(sa);
  const proxyFlags = ["ORG_COMPLEXITY_MISMATCH", "PROCESS_SPEED_MISMATCH", "COLLAB_STYLE_MISMATCH"];
  for (const f of proxyFlags) {
    if (flags.includes(f)) {
      score += 0.08;
      pushDriver(drivers, `議곗쭅/?묒뾽 ?ㅽ????꾨줉???뚮옒洹?媛먯?: ${f}`);
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
      notes.push("由ъ뒪???좏샇媛 ?щ윭 媛?寃뱀퀜 ?덉뒿?덈떎. drivers瑜?湲곗??쇰줈 ?섏쬆嫄?蹂닿컯/寃쎈줈 ?뺣젹?숇????뺣━?섎뒗 ?몄씠 ?덉쟾?⑸땲??");
    } else if (overall >= 0.34) {
      notes.push("?쇰? 由ъ뒪???좏샇媛 蹂댁엯?덈떎. drivers???대떦?섎뒗 ??ぉ留?蹂닿컯?대룄 泥닿컧 媛쒖꽑???섏삤??援ш컙?낅땲??");
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
