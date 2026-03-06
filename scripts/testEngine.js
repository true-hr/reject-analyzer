import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { buildDecisionPack } from "../src/lib/decision/index.js";

function readJson(p) {
  // Windows PowerShell??UTF-8 BOM(癤? ?뚮Ц??Node JSON.parse媛 ?곗쭏 ???덉뼱 ?쒓굅
  const raw0 = fs.readFileSync(p, "utf8");

  // 1) BOM ?쒓굅  2) ?뱀떆 ?욎??????덈뒗 NUL(\u0000) ?쒓굅  3) ?욌뮘 怨듬갚 ?쒓굅
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
  // analyzer 諛섑솚 援ъ“媛 踰꾩쟾留덈떎 ?щ씪吏????덉뼱 諛⑹뼱?곸쑝濡?吏묒뒿?덈떎.
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
    // Gate/Cap Contract 寃利앹슜 (decisionScore SSOT 寃쎈줈)
    cap: decisionPack?.decisionScore?.cap ?? null,           // number | null
    cappedScore: decisionPack?.decisionScore?.capped ?? null, // 0~100 | null
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

  // signalAbsent contract
  // - expected.signalAbsent === true
  // - expected.absentRiskId 媛 寃곌낵 ids ???덉쑝硫?FAIL
  if (exp.signalAbsent === true) {
    const id = typeof exp.absentRiskId === "string" ? exp.absentRiskId.trim() : "";
    if (!id) {
      fails.push("signalAbsent=true but absentRiskId missing");
    } else if (ids.includes(id)) {
      fails.push(`signal should be absent but found id: ${id}`);
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

  // ?? Gate/Cap Contract ??????????????????????????????????????

  // [CONTRACT-CAP-1] cap??number?ъ빞 ??(gate媛 ?몃━嫄곕릱????寃利?
  // 洹쇨굅: decisionScore.cap = (typeof __capFinal === "number") ? __capFinal : null (index.js)
  if (exp.capIsNumber === true) {
    if (typeof summary.cap !== "number") {
      fails.push(`[CAP-1] decisionScore.cap should be number but got: ${JSON.stringify(summary.cap)}`);
    }
  }

  // [CONTRACT-CAP-2] cap??null?댁뼱????(gate ?녿뒗 耳?댁뒪 寃利?
  if (exp.capIsNull === true) {
    if (summary.cap !== null) {
      fails.push(`[CAP-2] decisionScore.cap should be null but got: ${JSON.stringify(summary.cap)}`);
    }
  }

  // [CONTRACT-NaN-1] cappedScore / cap ??NaN/Infinity媛 ?꾨땶吏 寃利?  // passProbability??analyze 紐⑤뱶 ?꾩슜?대?濡?checkAnalyzeExpect?먯꽌 蹂꾨룄 泥댄겕
  if (exp.noNaN === true) {
    if (summary.cappedScore !== null && !Number.isFinite(summary.cappedScore)) {
      fails.push(`[NaN-1] decisionScore.capped is NaN/Infinity: ${summary.cappedScore}`);
    }
    if (summary.cap !== null && !Number.isFinite(summary.cap)) {
      fails.push(`[NaN-1] decisionScore.cap is NaN/Infinity: ${summary.cap}`);
    }
  }

  return fails;
}

// ?????????????????????????????????????????????????????????????
// [analyze 紐⑤뱶] simulationViewModel?먯꽌 ?듭떖 ?꾨뱶 諛⑹뼱??異붿텧
// ?????????????????????????????????????????????????????????????
function getSimVMFields(simVM) {
  const s = simVM && typeof simVM === "object" ? simVM : {};

  // passProbability: simVM.passProbability ?곗꽑, ?놁쑝硫?simVM.pass.percent
  const passProbability =
    typeof s.passProbability === "number" ? s.passProbability :
    typeof s.pass?.percent === "number" ? s.pass.percent :
    null;

  // topRisks: top3(?뺤떇 ?꾨뱶) ?먮뒗 signalsTop3(alias) 以?諛곗뿴??寃??좏깮
  const topRisks =
    Array.isArray(s.top3) ? s.top3 :
    Array.isArray(s.signalsTop3) ? s.signalsTop3 :
    [];

  // id 異붿텧: id / riskId / meta.id ?곗꽑?쒖쐞
  const topRiskIds = topRisks
    .map((r) =>
      r?.id ??
      r?.riskId ??
      r?.meta?.id ??
      null
    )
    .filter(Boolean)
    .map(String);

  return { passProbability, topRisks, topRiskIds };
}

// ?????????????????????????????????????????????????????????????
// [analyze 紐⑤뱶] ?좉퇋 expect ??寃??//   - passProbabilityMin / passProbabilityMax
//   - topRiskMustContainAny
//   媛믪씠 ?놁쑝硫??ㅽ궢 (湲곗〈 耳?댁뒪 ?명솚)
// ?????????????????????????????????????????????????????????????
function checkAnalyzeExpect(simVMFields, expect) {
  const fails = [];
  const exp = expect && typeof expect === "object" ? expect : {};
  const { passProbability, topRiskIds } = simVMFields;

  if (typeof exp.passProbabilityMin === "number") {
    if (passProbability === null) {
      fails.push(`passProbabilityMin check: passProbability is null`);
    } else if (passProbability < exp.passProbabilityMin) {
      fails.push(`passProbability ${passProbability} < min ${exp.passProbabilityMin}`);
    }
  }

  if (typeof exp.passProbabilityMax === "number") {
    if (passProbability === null) {
      fails.push(`passProbabilityMax check: passProbability is null`);
    } else if (passProbability > exp.passProbabilityMax) {
      fails.push(`passProbability ${passProbability} > max ${exp.passProbabilityMax}`);
    }
  }

  if (Array.isArray(exp.topRiskMustContainAny) && exp.topRiskMustContainAny.length > 0) {
    const hasAny = exp.topRiskMustContainAny.some((id) => topRiskIds.includes(String(id)));
    if (!hasAny) {
      fails.push(
        `topRisk must contain any of [${exp.topRiskMustContainAny.join(", ")}] but got [${topRiskIds.join(", ")}]`
      );
    }
  }

  // [CONTRACT-NaN-2] passProbability媛 NaN/Infinity媛 ?꾨땶吏 寃利?  // 肄붾뱶 ?뺤씤: Math.max(30, Math.min(95, Math.round(...))) ???뺤긽 踰붿쐞??30~95 ?뺤닔
  // noNaN ?뚮옒洹멸? ?덉쓣 ?뚮쭔 泥댄겕 (湲곗〈 耳?댁뒪 ?명솚 ?좎?)
  if (exp.noNaN === true) {
    if (passProbability !== null && !Number.isFinite(passProbability)) {
      fails.push(`[NaN-2] passProbability is NaN/Infinity: ${passProbability}`);
    }
    // passProbability 踰붿쐞 寃利?(肄붾뱶??30~95 蹂댁옣?섎굹 ?뚭? 諛⑹???
    if (typeof passProbability === "number" && (passProbability < 0 || passProbability > 100)) {
      fails.push(`[NaN-2] passProbability out of 0~100 range: ${passProbability}`);
    }
  }

  return fails;
}

// ?????????????????????????????????????????????????????????????
// main
// ?????????????????????????????????????????????????????????????
async function main() {
  const datasetPath = process.argv[2] || path.resolve(process.cwd(), "test_dataset.passmap.v1.json");
  // mode: "decision"(湲곕낯, 湲곗〈 ?명솚) | "analyze"(?꾩껜 ?뚯씠?꾨씪??
  const modeInput = String(process.argv[3] || "decision").toLowerCase();
  const allowedModes = new Set(["decision", "contract", "analyze"]);
  if (!allowedModes.has(modeInput)) {
    console.error(`[FATAL] unsupported mode: ${modeInput}`);
    process.exitCode = 2;
    return;
  }
  const modeExec = modeInput === "contract" ? "decision" : modeInput;
  const modeMatch = modeInput === "contract" ? "contract" : modeExec;

  const data = readJson(datasetPath);
  const cases = Array.isArray(data?.cases) ? data.cases : [];

  if (!cases.length) {
    console.error("[FAIL] dataset has no cases:", datasetPath);
    process.exitCode = 2;
    return;
  }

  // [analyze 紐⑤뱶] analyze() ?숈쟻 ?꾪룷??(decision 紐⑤뱶???ㅽ궢)
  let analyzeFn = null;
  if (modeExec === "analyze") {
    try {
      const mod = await import("../src/lib/analyzer.js");
      analyzeFn = mod.analyze;
      if (typeof analyzeFn !== "function") throw new Error("analyze is not a function in the imported module");
      console.log("[INFO] analyze mode: loaded analyze() from src/lib/analyzer.js\n");
    } catch (e) {
      console.error("[FATAL] analyze import failed:", e?.message ?? e);
      // ?꾩떆 ?붾쾭洹몄씠誘濡?異뷀썑 ?쒓굅 ?꾩슂
      globalThis.__DBG_TEST_ERR__ = { step: "import_analyze", error: e?.message, stack: e?.stack };
      process.exitCode = 2;
      return;
    }
  }

  console.log(`[MODE] ${modeInput} (exec:${modeExec}, match:${modeMatch})  dataset=${datasetPath}  cases=${cases.length}\n`);

  let pass = 0;
  let fail = 0;

  for (const tc of cases) {
    const id = String(tc?.id || "");

    // testMode: "decision" | "analyze" | ?놁쑝硫?both?먯꽌 ?ㅽ뻾
    const testMode = tc?.testMode ? String(tc.testMode).toLowerCase() : null;
    let shouldSkip = false;
    if (testMode === "both") {
      shouldSkip = !(modeMatch === "decision" || modeMatch === "contract");
    } else if (testMode && testMode !== modeMatch) {
      shouldSkip = true;
    }
    if (shouldSkip) {
      console.log(`[SKIP] ${id} (testMode=${testMode}, current=${modeMatch})`);
      continue;
    }

    const state = tc?.state && typeof tc.state === "object" ? tc.state : {};
    const expect = tc?.expect || {};
    const careerSignals = (tc?.careerSignals && typeof tc.careerSignals === "object") ? tc.careerSignals : null;
    let decisionPack = null;
    let simVMFields = null;
    let summary = null;
    let fails = [];

    try {
      if (modeExec === "analyze") {
        // ?? analyze 紐⑤뱶: ?꾩껜 ?뚯씠?꾨씪???ㅽ뻾 ??
        const out = analyzeFn(state, null);
        // ?꾩떆 ?붾쾭洹몄씠誘濡?異뷀썑 ?쒓굅 ?꾩슂
        globalThis.__DBG_TEST_ERR__ = null;

        decisionPack = out?.decisionPack ?? null;

        // simulationViewModel? reportPack ?대????덉쓬
        const simVM = out?.reportPack?.simulationViewModel ?? null;
        simVMFields = getSimVMFields(simVM);

        // seniority evidence inject (decision 紐⑤뱶? ?숈씪 ?⑥튂 ?좎?)
        try {
          const rr = Array.isArray(decisionPack?.riskResults) ? decisionPack.riskResults : null;
          if (rr && careerSignals) {
            const g = rr.find(r => String(r?.id || "") === "SENIORITY__UNDER_MIN_YEARS");
            if (g) {
              if (!g.evidence || typeof g.evidence !== "object") g.evidence = {};
              if (typeof g.evidence.gapMonthsAbs === "undefined" && typeof careerSignals.gapMonthsAbs !== "undefined") g.evidence.gapMonthsAbs = careerSignals.gapMonthsAbs;
              if (typeof g.evidence.jdMinYears === "undefined" && careerSignals.requiredYears?.min !== undefined) g.evidence.jdMinYears = careerSignals.requiredYears.min;
              if (typeof g.evidence.resumeYears === "undefined" && typeof careerSignals.resumeYears !== "undefined") g.evidence.resumeYears = careerSignals.resumeYears;
            }
          }
        } catch { }

        summary = decisionPack
          ? summarize(decisionPack)
          : { riskResultsLen: 0, layers: {}, ids: [], capReason: null, meta: null };

        // 湲곗〈 checkExpect ?ъ궗??(mustHaveIds, layerAtLeast ??
        fails = checkExpect(summary, expect);
        // analyze ?꾩슜 assertions (passProbabilityMin/Max, topRiskMustContainAny)
        fails.push(...checkAnalyzeExpect(simVMFields, expect));

      } else {
        // ?? decision 紐⑤뱶: 湲곗〈 寃쎈줈 (蹂寃??놁쓬) ??
        decisionPack = getDecisionPackFromState(state, careerSignals);
        // ??test helper (append-only): inject seniority evidence for grayZone evaluation
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
        summary = summarize(decisionPack);
        fails = checkExpect(summary, expect);
      }
    } catch (e) {
      // ?꾩떆 ?붾쾭洹몄씠誘濡?異뷀썑 ?쒓굅 ?꾩슂
      globalThis.__DBG_TEST_ERR__ = { tc: id, error: e?.message, stack: e?.stack };
      fails = [`runtime error: ${e && e.message ? e.message : safeStr(e)}`];
    }

    if (fails.length === 0) {
      pass += 1;
      if (modeExec === "analyze" && simVMFields) {
        console.log(`[PASS] ${id} | rr=${summary?.riskResultsLen ?? "?"} | capReason=${summary?.capReason ?? "null"} | pp=${simVMFields.passProbability ?? "null"} | topRisks=[${simVMFields.topRiskIds.join(",")}]`);
      } else {
        console.log(`[PASS] ${id} | rr=${summary?.riskResultsLen ?? "?"} | capReason=${summary?.capReason ?? "null"}`);
      }
    } else {
      fail += 1;
      console.log(`[FAIL] ${id}`);
      for (const f of fails) console.log(`  - ${f}`);
      console.log(`  - layers: ${safeStr(summary?.layers || {})}`);
      console.log(`  - capReason: ${safeStr(summary?.capReason)}`);
      console.log(`  - meta: ${safeStr(summary?.meta || {})}`);
      if (modeExec === "analyze" && simVMFields) {
        // FAIL ??simVM ?듭떖 ?꾨뱶 異쒕젰 (?붾쾭洹몄슜)
        console.log(`  - [simVM] passProbability: ${simVMFields.passProbability ?? "null"}`);
        console.log(`  - [simVM] topRiskIds: [${simVMFields.topRiskIds.join(", ")}]`);
      }
      console.log("");
    }
  }

  console.log(`\nDONE  mode=${modeInput} (exec:${modeExec}, match:${modeMatch})  pass=${pass}  fail=${fail}  total=${pass + fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error("[FATAL] main threw:", e?.message ?? e);
  process.exitCode = 1;
});
