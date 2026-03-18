import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_PATH = path.join(__dirname, "semantic_results.json");

function toFiniteNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeExpected(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "match" ? "match" : "mismatch";
}

function increment(map, key) {
  const k = String(key || "unknown");
  map[k] = (map[k] || 0) + 1;
}

function ensureCategoryDetailed(summary, category) {
  if (!summary.byCategoryDetailed[category]) {
    summary.byCategoryDetailed[category] = {
      total: 0,
      expectedAccepted: {
        match_true: 0,
        match_false: 0,
        mismatch_true: 0,
        mismatch_false: 0
      },
      blockedReasonCounts: {},
      pairStateCounts: {}
    };
  }
  return summary.byCategoryDetailed[category];
}

async function main() {
  const raw = await fs.readFile(RESULTS_PATH, "utf8");
  const rows = JSON.parse(raw);
  const list = Array.isArray(rows) ? rows : [];

  const summary = {
    total: list.length,
    byCategory: {},
    byCategoryDetailed: {},
    expectedAccepted: {
      match_true: 0,
      match_false: 0,
      mismatch_true: 0,
      mismatch_false: 0
    },
    blockedReasonCounts: {},
    pairStateCounts: {}
  };

  for (const row of list) {
    const category = String(row?.category || "unknown");
    const expected = normalizeExpected(row?.expected);
    const accepted = row?.accepted === true;
    const rawScore = toFiniteNumber(row?.rawScore);
    const blockedReason = row?.blockedReason ?? "null";
    const pairState = row?.pairState ?? "null";

    if (!summary.byCategory[category]) {
      summary.byCategory[category] = {
        total: 0,
        avgRawScore: 0,
        _rawScoreSum: 0,
        _rawScoreCount: 0
      };
    }

    const cat = summary.byCategory[category];
    const detailed = ensureCategoryDetailed(summary, category);

    cat.total += 1;
    detailed.total += 1;

    if (rawScore !== null) {
      cat._rawScoreSum += rawScore;
      cat._rawScoreCount += 1;
    }

    if (expected === "match" && accepted) {
      summary.expectedAccepted.match_true += 1;
      detailed.expectedAccepted.match_true += 1;
    } else if (expected === "match" && !accepted) {
      summary.expectedAccepted.match_false += 1;
      detailed.expectedAccepted.match_false += 1;
    } else if (expected === "mismatch" && accepted) {
      summary.expectedAccepted.mismatch_true += 1;
      detailed.expectedAccepted.mismatch_true += 1;
    } else {
      summary.expectedAccepted.mismatch_false += 1;
      detailed.expectedAccepted.mismatch_false += 1;
    }

    increment(summary.blockedReasonCounts, blockedReason);
    increment(summary.pairStateCounts, pairState);
    increment(detailed.blockedReasonCounts, blockedReason);
    increment(detailed.pairStateCounts, pairState);
  }

  for (const category of Object.keys(summary.byCategory)) {
    const cat = summary.byCategory[category];
    cat.avgRawScore = cat._rawScoreCount > 0 ? cat._rawScoreSum / cat._rawScoreCount : 0;
    delete cat._rawScoreSum;
    delete cat._rawScoreCount;
  }

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
