// tools/passmap-mcp-prod-wrapper/self-test.mjs
// Self-test for the PASSMAP MCP prod wrapper. Network-free, SDK-free.
//
// Covers:
//   1. Config / URL builder
//      - default API base is the Vercel host (never GitHub Pages)
//      - malformed PASSMAP_API_BASE override is ignored, fallback to default
//      - trailing slash is stripped
//      - GitHub Pages URL must NOT be the default API base
//   2. Validate module
//      - sourcePlatform normalization (allowed value / unknown / case)
//      - search limit clamping (default / over-cap / non-numeric)
//      - rawText / raw_text fields in input are dropped from normalized output
//   3. apiClient surface
//      - token missing → no fetch is invoked, structured error returned
//      - server boot does not require token (config probe succeeds without it)
//
// Run: node self-test.mjs

import {
  getConfig,
  buildActionUrl,
  saveExperienceCandidate,
  searchExperienceCandidates,
  _internals as apiInternals,
} from "./lib/apiClient.mjs";
import {
  validateSavePayload,
  validateSearchPayload,
  ALLOWED_SOURCE_PLATFORMS,
  SEARCH_LIMIT_DEFAULT,
  SEARCH_LIMIT_MAX,
} from "./lib/validate.mjs";

let failures = 0;

function assert(label, cond) {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    console.error(`  FAIL  ${label}`);
    failures += 1;
  }
}

function resetEnv() {
  delete process.env.PASSMAP_MCP_TOKEN;
  delete process.env.PASSMAP_API_BASE;
}

async function main() {
  console.log("[self-test] PASSMAP MCP prod wrapper");

  // ── 1. config / URL ────────────────────────────────────────────────────
  resetEnv();
  const defaultCfg = getConfig();
  assert(
    "default apiBase is the Vercel host",
    defaultCfg.apiBase === apiInternals.DEFAULT_API_BASE
  );
  assert(
    "default apiBase is NOT a GitHub Pages URL",
    !defaultCfg.apiBase.includes("github.io")
  );
  assert(
    "default apiBaseSource is 'default'",
    defaultCfg.apiBaseSource === "default"
  );
  assert(
    "tokenPresent reflects missing PASSMAP_MCP_TOKEN",
    defaultCfg.tokenPresent === false
  );

  process.env.PASSMAP_API_BASE = "not a url";
  assert(
    "malformed PASSMAP_API_BASE falls back to default",
    getConfig().apiBase === apiInternals.DEFAULT_API_BASE &&
      getConfig().apiBaseSource === "ignored-malformed"
  );

  process.env.PASSMAP_API_BASE = "https://example.test/";
  assert(
    "valid PASSMAP_API_BASE override strips trailing slash",
    getConfig().apiBase === "https://example.test" &&
      getConfig().apiBaseSource === "env"
  );

  delete process.env.PASSMAP_API_BASE;
  assert(
    "buildActionUrl points at save-analysis-run with action query",
    buildActionUrl(apiInternals.SAVE_ACTION).endsWith(
      "/api/save-analysis-run?action=mcp_save_experience"
    ) &&
      buildActionUrl(apiInternals.SEARCH_ACTION).endsWith(
        "/api/save-analysis-run?action=mcp_search_experiences"
      )
  );

  // ── 2. validate module ─────────────────────────────────────────────────
  const allowedSet = new Set(ALLOWED_SOURCE_PLATFORMS);
  assert(
    "ALLOWED_SOURCE_PLATFORMS includes the five contract values",
    allowedSet.size === 5 &&
      ["chatgpt", "gemini", "claude", "manual", "unknown"].every((v) =>
        allowedSet.has(v)
      )
  );

  const okSave = validateSavePayload({
    title: "테스트",
    actions: ["dummy"],
    sourcePlatform: "ChatGPT",
    // rawText / raw_text must be dropped from normalized output:
    rawText: "this should never be sent",
    raw_text: "neither should this",
  });
  assert(
    "validateSavePayload normalizes ChatGPT → chatgpt (case-insensitive)",
    okSave.ok && okSave.normalized.sourcePlatform === "chatgpt"
  );
  assert(
    "validateSavePayload drops rawText / raw_text from normalized output",
    okSave.ok &&
      !("rawText" in okSave.normalized) &&
      !("raw_text" in okSave.normalized)
  );

  const unknownPlatform = validateSavePayload({
    title: "테스트",
    actions: ["x"],
    sourcePlatform: "tiktok",
  });
  assert(
    "validateSavePayload normalizes unrecognised platform → 'unknown'",
    unknownPlatform.ok && unknownPlatform.normalized.sourcePlatform === "unknown"
  );

  const titleShort = validateSavePayload({ title: "a", actions: ["x"] });
  assert(
    "validateSavePayload rejects title < 2 chars with TITLE_TOO_SHORT",
    titleShort.ok === false && titleShort.errorCode === "TITLE_TOO_SHORT"
  );

  const noCore = validateSavePayload({ title: "테스트" });
  assert(
    "validateSavePayload rejects missing situation/task/actions with MISSING_CORE_FIELD",
    noCore.ok === false && noCore.errorCode === "MISSING_CORE_FIELD"
  );

  const limitDefault = validateSearchPayload({});
  assert(
    "validateSearchPayload defaults limit to SEARCH_LIMIT_DEFAULT",
    limitDefault.ok && limitDefault.normalized.limit === SEARCH_LIMIT_DEFAULT
  );

  const limitOverCap = validateSearchPayload({ limit: 999 });
  assert(
    "validateSearchPayload clamps limit to SEARCH_LIMIT_MAX",
    limitOverCap.ok && limitOverCap.normalized.limit === SEARCH_LIMIT_MAX
  );

  const limitBogus = validateSearchPayload({ limit: "not a number" });
  assert(
    "validateSearchPayload clamps non-numeric limit to default",
    limitBogus.ok && limitBogus.normalized.limit === SEARCH_LIMIT_DEFAULT
  );

  // ── 3. apiClient surface ──────────────────────────────────────────────
  resetEnv();
  const noTokenSave = await saveExperienceCandidate({
    title: "테스트",
    situation: "self-test",
    actions: ["dummy"],
  });
  assert(
    "saveExperienceCandidate returns PASSMAP_MCP_TOKEN_MISSING when token absent",
    noTokenSave.ok === false &&
      noTokenSave.errorCode === "PASSMAP_MCP_TOKEN_MISSING"
  );

  const noTokenSearch = await searchExperienceCandidates({
    query: "test",
    limit: 3,
  });
  assert(
    "searchExperienceCandidates returns PASSMAP_MCP_TOKEN_MISSING when token absent",
    noTokenSearch.ok === false &&
      noTokenSearch.errorCode === "PASSMAP_MCP_TOKEN_MISSING"
  );

  // Server boot probe: getConfig() must not throw when token is missing.
  let bootProbeOk = true;
  try {
    getConfig();
  } catch (_) {
    bootProbeOk = false;
  }
  assert("getConfig() does not throw without PASSMAP_MCP_TOKEN", bootProbeOk);

  if (failures === 0) {
    console.log("ALL TESTS PASSED");
    process.exit(0);
  }
  console.error(`[self-test] ${failures} failure(s)`);
  process.exit(1);
}

main().catch((err) => {
  console.error("[self-test] unexpected error:", err);
  process.exit(1);
});
