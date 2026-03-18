import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_PATH = path.join(__dirname, "semantic_results.json");
const TESTS_PATH = path.join(__dirname, "semantic_tests.json");

function makeMetaMap(rows) {
  const map = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const id = String(row?.testId || "").trim();
    if (!id) continue;
    map.set(id, row);
  }
  return map;
}

function enrich(row, meta) {
  return {
    testId: row?.testId ?? null,
    category: row?.category ?? null,
    expected: row?.expected ?? meta?.expected ?? null,
    difficulty: meta?.difficulty ?? null,
    jd: row?.jd ?? meta?.jd ?? "",
    resume: row?.resume ?? meta?.resume ?? "",
    note: row?.note ?? meta?.note ?? null,
    rawScore: row?.rawScore ?? null,
    pairState: row?.pairState ?? null,
    accepted: row?.accepted === true,
    acceptedCount: row?.acceptedCount ?? 0,
    bestJdText: row?.bestJdText ?? null,
    bestResumeText: row?.bestResumeText ?? null,
    blockedReason: row?.blockedReason ?? null,
  };
}

async function main() {
  const [resultsRaw, testsRaw] = await Promise.all([
    fs.readFile(RESULTS_PATH, "utf8"),
    fs.readFile(TESTS_PATH, "utf8"),
  ]);

  const results = JSON.parse(resultsRaw);
  const tests = JSON.parse(testsRaw);
  const rows = Array.isArray(results) ? results : [];
  const metaById = makeMetaMap(tests);

  const grouped = {
    paraphrase_match_false: [],
    role_difference_mismatch_true: [],
    role_difference_unknown_safe: [],
    token_ablation_mismatch_true: [],
  };

  for (const row of rows) {
    const meta = metaById.get(String(row?.testId || "").trim()) || null;
    const category = String(row?.category || "").trim();
    const expected = String(row?.expected || meta?.expected || "").trim();
    const accepted = row?.accepted === true;
    const blockedReason = String(row?.blockedReason || "").trim();
    const item = enrich(row, meta);

    if (category === "paraphrase" && expected === "match" && !accepted) {
      grouped.paraphrase_match_false.push(item);
    }
    if (category === "role_difference" && expected === "mismatch" && accepted) {
      grouped.role_difference_mismatch_true.push(item);
    }
    if (category === "role_difference" && blockedReason === "unknown_safe") {
      grouped.role_difference_unknown_safe.push(item);
    }
    if (category === "token_ablation" && expected === "mismatch" && accepted) {
      grouped.token_ablation_mismatch_true.push(item);
    }
  }

  console.log(JSON.stringify(grouped, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
