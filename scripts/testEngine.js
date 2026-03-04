import fs from "node:fs";
import path from "node:path";
import process from "node:process";


import { buildDecisionPack } from "../src/lib/decision/index.js";

function readJson(p) {
  // Windows PowerShell의 UTF-8 BOM(﻿) 때문에 Node JSON.parse가 터질 수 있어 제거
  const raw0 = fs.readFileSync(p, "utf8");

  // 1) BOM 제거  2) 혹시 섞였을 수 있는 NUL(\u0000) 제거  3) 앞뒤 공백 제거
  const raw =
    String(raw0 || "")
      .replace(/^\uFEFF/, "")
      .replace(/\u0000/g, "")
      .trim();

  return JSON.parse(raw);
}

function toLower(s) {
  return String(s || "").toLowerCase();
}

function safeStr(x) {
  return typeof x === "string" ? x : JSON.stringify(x);
}

function pickAnalysisParts(analysis) {
  // analyzer 반환 구조가 버전마다 달라질 수 있어 방어적으로 집습니다.
  const a = analysis && typeof analysis === "object" ? analysis : {};
  return {
    ai: a.ai ?? null,
    structural: a.structural ?? null,
    hiddenRisk: a.hiddenRisk ?? null,
    careerSignals: a.careerSignals ?? null,
    decisionPack: a.decisionPack ?? null,
  };
}

function getDecisionPackFromState(state, careerSignals) {
  return buildDecisionPack({
    state,
    ai: null,
    structural: null,
    hiddenRisk: null,
    careerSignals,
  });
}

function summarize(decisionPack) {
  const rr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : [];
  const layers = rr.reduce((acc, r) => {
    const k = toLower(r?.layer || "unknown");
    acc[k] = acc[k] || [];
    acc[k].push(String(r?.id || ""));
    return acc;
  }, {});
  const ids = rr.map((r) => String(r?.id || "")).filter(Boolean);

  return {
    riskResultsLen: rr.length,
    layers,
    ids,
    capReason: decisionPack?.decisionScore?.capReason ?? null,
    meta: decisionPack?.decisionScore?.meta ?? null,
  };
}

function ensureNumber(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function checkExpect(summary, expect) {
  const fails = [];
  const exp = expect && typeof expect === "object" ? expect : {};

  const ids = summary.ids || [];
  const layers = summary.layers || {};

  // mustHaveIds
  if (Array.isArray(exp.mustHaveIds)) {
    for (const id of exp.mustHaveIds) {
      if (!ids.includes(id)) fails.push(`missing id: ${id}`);
    }
  }

  // mustNotHaveIds
  if (Array.isArray(exp.mustNotHaveIds)) {
    for (const id of exp.mustNotHaveIds) {
      if (ids.includes(id)) fails.push(`should NOT have id: ${id}`);
    }
  }

  // layerAtLeast: { gate:1, must:1, domain:1, exp:1, preferred:1 }
  if (exp.layerAtLeast && typeof exp.layerAtLeast === "object") {
    for (const [layer, minN] of Object.entries(exp.layerAtLeast)) {
      const k = toLower(layer);
      const got = Array.isArray(layers[k]) ? layers[k].length : 0;
      const want = ensureNumber(minN) ?? 0;
      if (got < want) fails.push(`layer ${k} count ${got} < ${want}`);
    }
  }

  // capReasonIncludes
  if (typeof exp.capReasonIncludes === "string" && exp.capReasonIncludes) {
    const cr = String(summary.capReason || "");
    if (!cr.includes(exp.capReasonIncludes)) fails.push(`capReason does not include: ${exp.capReasonIncludes} (got: ${cr || "null"})`);
  }

  // meta checks (optional, shallow)
  if (exp.meta && typeof exp.meta === "object") {
    // grayZone: { gateId, cap }
    if (exp.meta.grayZone && typeof exp.meta.grayZone === "object") {
      const g = summary.meta?.grayZone;
      if (!g) {
        fails.push("meta.grayZone missing");
      } else {
        if (typeof exp.meta.grayZone.gateId === "string" && exp.meta.grayZone.gateId) {
          if (String(g.gateId || "") !== exp.meta.grayZone.gateId) {
            fails.push(`meta.grayZone.gateId mismatch (want:${exp.meta.grayZone.gateId}, got:${String(g.gateId || "")})`);
          }
        }
        if (typeof exp.meta.grayZone.cap !== "undefined") {
          if (Number(g.cap) !== Number(exp.meta.grayZone.cap)) {
            fails.push(`meta.grayZone.cap mismatch (want:${exp.meta.grayZone.cap}, got:${g.cap})`);
          }
        }
      }
    }

    // toolMustProbe: { missingCount, shouldGate }
    if (exp.meta.toolMustProbe && typeof exp.meta.toolMustProbe === "object") {
      const t = summary.meta?.toolMustProbe;
      if (!t) {
        fails.push("meta.toolMustProbe missing");
      } else {
        if (typeof exp.meta.toolMustProbe.missingCount !== "undefined") {
          if (Number(t.missingCount) !== Number(exp.meta.toolMustProbe.missingCount)) {
            fails.push(`meta.toolMustProbe.missingCount mismatch (want:${exp.meta.toolMustProbe.missingCount}, got:${t.missingCount})`);
          }
        }
        if (typeof exp.meta.toolMustProbe.shouldGate !== "undefined") {
          if (Boolean(t.shouldGate) !== Boolean(exp.meta.toolMustProbe.shouldGate)) {
            fails.push(`meta.toolMustProbe.shouldGate mismatch (want:${exp.meta.toolMustProbe.shouldGate}, got:${t.shouldGate})`);
          }
        }
      }
    }
  }

  return fails;
}

function main() {
  const datasetPath = process.argv[2] || path.resolve(process.cwd(), "test_dataset.passmap.v1.json");
  const data = readJson(datasetPath);
  const cases = Array.isArray(data?.cases) ? data.cases : [];

  if (!cases.length) {
    console.error("[FAIL] dataset has no cases:", datasetPath);
    process.exitCode = 2;
    return;
  }

  let pass = 0;
  let fail = 0;

  for (const tc of cases) {
    const id = String(tc?.id || "");
    const state = tc?.state && typeof tc.state === "object" ? tc.state : {};
    const expect = tc?.expect || {};
    const careerSignals = (tc?.careerSignals && typeof tc.careerSignals === "object") ? tc.careerSignals : null;
    let decisionPack = null;
    let summary = null;
    let fails = [];

    try {
      decisionPack = getDecisionPackFromState(state, careerSignals);
      // ✅ test helper (append-only): inject seniority evidence for grayZone evaluation
      try {
        const rr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : null;
        if (rr) {
          const g = rr.find(r => String(r?.id || "") === "SENIORITY__UNDER_MIN_YEARS");
          if (g && (!g.evidence || typeof g.evidence !== "object")) g.evidence = {};
          if (g && g.evidence) {
            const cs = careerSignals && typeof careerSignals === "object" ? careerSignals : null;
            if (cs) {
              if (typeof g.evidence.gapMonthsAbs === "undefined" && typeof cs.gapMonthsAbs !== "undefined") g.evidence.gapMonthsAbs = cs.gapMonthsAbs;
              if (typeof g.evidence.jdMinYears === "undefined" && cs.requiredYears && typeof cs.requiredYears.min !== "undefined") g.evidence.jdMinYears = cs.requiredYears.min;
              if (typeof g.evidence.resumeYears === "undefined" && typeof cs.resumeYears !== "undefined") g.evidence.resumeYears = cs.resumeYears;
            }
          }
        }
      } catch { }
      // ✅ test helper (append-only): inject seniority evidence for grayZone evaluation
      try {
        const rr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : null;
        if (rr) {
          const g = rr.find(r => String(r?.id || "") === "SENIORITY__UNDER_MIN_YEARS");
          if (g && (!g.evidence || typeof g.evidence !== "object")) g.evidence = {};
          if (g && g.evidence) {
            // 케이스에서 careerSignals로 넣은 걸 evidence로도 브릿지
            const cs = careerSignals && typeof careerSignals === "object" ? careerSignals : null;
            if (cs) {
              if (typeof g.evidence.gapMonthsAbs === "undefined" && typeof cs.gapMonthsAbs !== "undefined") g.evidence.gapMonthsAbs = cs.gapMonthsAbs;
              if (typeof g.evidence.jdMinYears === "undefined" && cs.requiredYears && typeof cs.requiredYears.min !== "undefined") g.evidence.jdMinYears = cs.requiredYears.min;
              if (typeof g.evidence.resumeYears === "undefined" && typeof cs.resumeYears !== "undefined") g.evidence.resumeYears = cs.resumeYears;
            }
          }
        }
      } catch { }
      summary = summarize(decisionPack);
      fails = checkExpect(summary, expect);
    } catch (e) {
      fails = [`runtime error: ${e && e.message ? e.message : safeStr(e)}`];
    }

    if (fails.length === 0) {
      pass += 1;
      console.log(`[PASS] ${id} | rr=${summary?.riskResultsLen ?? "?"} | capReason=${summary?.capReason ?? "null"}`);
    } else {
      fail += 1;
      console.log(`[FAIL] ${id}`);
      for (const f of fails) console.log(`  - ${f}`);
      console.log(`  - layers: ${safeStr(summary?.layers || {})}`);
      console.log(`  - capReason: ${safeStr(summary?.capReason)}`);
      console.log(`  - meta: ${safeStr(summary?.meta || {})}`);
      console.log("");
    }
  }

  console.log(`\nDONE  pass=${pass}  fail=${fail}  total=${pass + fail}`);
  if (fail > 0) process.exitCode = 1;
}

main();
