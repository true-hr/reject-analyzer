import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { semanticMatchJDResume } from "../src/lib/semantic/match.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TESTS_PATH = path.join(__dirname, "semantic_tests.json");
const RESULTS_PATH = path.join(__dirname, "semantic_results.json");

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function summarizeMatchResult(testCase, result) {
  const rows = Array.isArray(result?.matches) ? result.matches : [];

  const bestRow = rows.reduce((acc, row) => {
    const score =
      toFiniteNumber(row?.best?.score) ??
      toFiniteNumber(row?.debug?.rawBestScore) ??
      null;
    if (score === null) return acc;
    if (!acc) return { row, score };
    return score > acc.score ? { row, score } : acc;
  }, null);

  const fallbackRow = rows.find((row) => row?.debug) || null;
  const selected = bestRow?.row || fallbackRow;
  const selectedDebug = selected?.debug || null;
  const acceptedCount = rows.reduce(
    (acc, row) => acc + (Number(row?.debug?.acceptedCount ?? 0) || 0),
    0
  );
  const accepted =
    acceptedCount > 0 ||
    Boolean(selected?.best);

  return {
    testId: testCase?.testId ?? null,
    category: testCase?.category ?? null,
    expected: testCase?.expected ?? null,
    jd: testCase?.jd ?? "",
    resume: testCase?.resume ?? "",
    note: testCase?.note ?? null,
    rawScore:
      toFiniteNumber(bestRow?.score) ??
      toFiniteNumber(selected?.best?.score) ??
      toFiniteNumber(selectedDebug?.rawBestScore),
    pairState: selectedDebug?.pairState ?? null,
    accepted,
    acceptedCount,
    bestJdText: selected ? String(selected?.jd ?? "") : null,
    bestResumeText: selected ? String(selected?.best?.text ?? "") : null,
    blockedReason: accepted ? null : (selectedDebug?.blockedReason ?? result?.reason ?? null),
  };
}

async function main() {
  const raw = await fs.readFile(TESTS_PATH, "utf8");
  const cases = JSON.parse(raw);
  const tests = Array.isArray(cases) ? cases : [];
  const out = [];

  for (const testCase of tests) {
    const result = await semanticMatchJDResume(
      String(testCase?.jd ?? ""),
      String(testCase?.resume ?? ""),
      {
        maxJdUnits: 12,
        maxResumeUnits: 120,
        topK: 1,
        concurrency: 1,
        device: "cpu",
        dtype: "q8",
        useLocalStorageCache: false,
      }
    );

    out.push(summarizeMatchResult(testCase, result));
  }

  const payload = JSON.stringify(out, null, 2);
  await fs.writeFile(RESULTS_PATH, payload, "utf8");
  console.log(payload);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
