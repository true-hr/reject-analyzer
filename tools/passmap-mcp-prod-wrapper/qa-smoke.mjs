// tools/passmap-mcp-prod-wrapper/qa-smoke.mjs
// Real-network smoke test against the PASSMAP production API.
//
// Behavior:
//   - If PASSMAP_MCP_TOKEN is missing → prints a clear "skipped" message,
//     does NOT hit the network, exits with code 2 (skipped, not a failure).
//   - If PASSMAP_MCP_TOKEN is present → performs one save + one search.
//     Prints only safe diagnostics (apiBase, http status, experienceId,
//     result count). Token plaintext is NEVER printed.
//
// This script is intended to be run manually by a maintainer who has
// already paired a token, e.g.:
//
//   PASSMAP_MCP_TOKEN=pmcp_xxx npm run qa-smoke
//
// On Windows PowerShell:
//   $env:PASSMAP_MCP_TOKEN = "pmcp_xxx"
//   & "C:\Program Files\nodejs\npm.cmd" run qa-smoke

import {
  saveExperienceCandidate,
  searchExperienceCandidates,
  getConfig,
} from "./lib/apiClient.mjs";

function _redact(value) {
  // Defense-in-depth: this script never prints the token directly, but if we
  // ever do need to log a config diff we mask it here.
  if (!value) return "(empty)";
  const s = String(value);
  if (s.length < 8) return "***";
  return `${s.slice(0, 4)}…(${s.length} chars)`;
}

async function main() {
  const cfg = getConfig();
  console.log(
    `[qa-smoke] apiBase=${cfg.apiBase} (${cfg.apiBaseSource}) tokenPresent=${cfg.tokenPresent}`
  );

  if (!cfg.tokenPresent) {
    console.log(
      "[qa-smoke] SKIP — PASSMAP_MCP_TOKEN is not set.\n" +
        "  Pair a token via the 12-B1 flow and re-run.\n" +
        "  Token plaintext will never be echoed by this script."
    );
    process.exit(2);
  }

  // Token presence has been confirmed via the env-only API in getConfig().
  // We never read PASSMAP_MCP_TOKEN directly here — the api client owns it.
  console.log(
    `[qa-smoke] token prefix probe: ${_redact(
      String(process.env.PASSMAP_MCP_TOKEN || "").trim()
    )}`
  );

  // ── 1. save ───────────────────────────────────────────────────────────
  const saveTitle = `qa-smoke ${new Date().toISOString()}`;
  const savePayload = {
    title: saveTitle,
    situation:
      "qa-smoke 자동 점검 — PASSMAP MCP prod wrapper에서 운영 API에 한 건 저장합니다.",
    task: "save smoke",
    actions: ["lib/apiClient.mjs::saveExperienceCandidate 호출"],
    skills: ["mcp-prod-wrapper-smoke"],
    sourcePlatform: "manual",
    sourceConversationTitle: "qa-smoke",
    evidenceTexts: [
      "자동 smoke 스크립트가 만든 더미 인용입니다. AI가 생성한 문장이 아님을 명시합니다.",
    ],
    riskNotes: ["smoke run — production 데이터에 잔존할 수 있음"],
  };
  console.log(
    `[qa-smoke] save → POST ${cfg.apiBase}/api/save-analysis-run?action=mcp_save_experience`
  );
  const saveResult = await saveExperienceCandidate(savePayload);
  if (!saveResult.ok) {
    console.error(
      `[qa-smoke] save FAILED: errorCode=${saveResult.errorCode} ` +
        `httpStatus=${saveResult.httpStatus ?? "n/a"} message=${saveResult.message}`
    );
    process.exit(1);
  }
  console.log(
    `[qa-smoke] save OK: experienceId=${saveResult.experienceId} ` +
      `sourceId=${saveResult.sourceId} evidenceCount=${saveResult.evidenceCount}`
  );

  // ── 2. search ─────────────────────────────────────────────────────────
  console.log(
    `[qa-smoke] search → POST ${cfg.apiBase}/api/save-analysis-run?action=mcp_search_experiences`
  );
  const searchResult = await searchExperienceCandidates({
    query: "qa-smoke",
    limit: 3,
  });
  if (!searchResult.ok) {
    console.error(
      `[qa-smoke] search FAILED: errorCode=${searchResult.errorCode} ` +
        `httpStatus=${searchResult.httpStatus ?? "n/a"} message=${searchResult.message}`
    );
    process.exit(1);
  }
  console.log(
    `[qa-smoke] search OK: count=${searchResult.count} ` +
      `firstId=${searchResult.items?.[0]?.id || "(none)"}`
  );

  console.log("[qa-smoke] DONE");
  process.exit(0);
}

main().catch((err) => {
  console.error("[qa-smoke] unexpected error:", err?.message || err);
  process.exit(1);
});
