import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildParaphraseReport,
  runParaphraseTests,
} from "../tests/semantic/paraphraseTest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const ARTIFACTS_DIR = path.join(ROOT_DIR, "artifacts");
const PARAPHRASE_MISMATCHES_PATH = path.join(
  ARTIFACTS_DIR,
  "paraphrase-mismatches.json"
);

function formatRawScore(value) {
  return typeof value === "number" ? value.toFixed(3) : "null";
}

function serializeMismatch(item) {
  return {
    testId: item.testId,
    expected: item.expected,
    predicted: item.predicted,
    subcategory: item.subcategory,
    difficulty: item.difficulty,
    expectedFailureType: item.expectedFailureType ?? "none",
    actualFailureType: item.failureType ?? "none",
    pairState: item.pairState ?? "none",
    rawScore: typeof item.rawScore === "number" ? item.rawScore : null,
    jd: item.jd,
    resume: item.resume,
    notes: item.notes ?? "",
    mismatchLabel: null,
    reviewComment: ""
  };
}

async function exportParaphraseMismatches(items) {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  const payload = JSON.stringify(items.map(serializeMismatch), null, 2);
  await fs.writeFile(PARAPHRASE_MISMATCHES_PATH, payload, "utf8");
}

function formatMismatch(item) {
  return [
    `- ${item.testId}`,
    `  expected=${item.expected} | predicted=${item.predicted} | subcategory=${item.subcategory}`,
    `  expectedFailureType=${item.expectedFailureType ?? "none"} | actualFailureType=${item.failureType ?? "none"} | pairState=${item.pairState ?? "none"} | rawScore=${formatRawScore(item.rawScore)}`,
    `  JD: ${item.jd}`,
    `  Resume: ${item.resume}`,
    `  Notes: ${item.notes ?? ""}`
  ].join("\n");
}

const TEST_REGISTRY = [
  {
    id: "paraphrase",
    label: "PASSMAP Paraphrase Test",
    run: async () => {
      const results = await runParaphraseTests();
      const report = buildParaphraseReport(results);
      const failedCases = results.filter((row) => !row.correct);

      return {
        ok: failedCases.length === 0,
        results,
        report,
        failedCases,
      };
    },
  },
];

async function main() {
  console.log("=".repeat(60));
  console.log(" PASSMAP Test Runner");
  console.log("=".repeat(60));

  let hasFailure = false;

  for (const testSuite of TEST_REGISTRY) {
    console.log(`\n[RUN] ${testSuite.label}`);
    const outcome = await testSuite.run();

    console.log(outcome.report);

    if (testSuite.id === "paraphrase") {
      await exportParaphraseMismatches(outcome.failedCases);
      console.log(`Mismatch export: ${PARAPHRASE_MISMATCHES_PATH}`);
    }

    if (outcome.failedCases.length > 0) {
      hasFailure = true;
      console.log("Mismatch details:");
      for (const item of outcome.failedCases) {
        console.log(formatMismatch(item));
      }
    }
  }

  process.exit(hasFailure ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
