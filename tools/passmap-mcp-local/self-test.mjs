// tools/passmap-mcp-local/self-test.mjs
// Dependency-free smoke test for the local MCP demo's pure logic.
// Run with: node self-test.mjs
//
// Exercises validate.mjs + store.mjs against a throwaway data file so we can
// verify the save/search shape without installing the MCP SDK first.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { saveExperience, searchExperiences } from "./lib/store.mjs";
import { validateSavePayload, validateSearchPayload } from "./lib/validate.mjs";

const tmp = mkdtempSync(join(tmpdir(), "passmap-mcp-local-test-"));
const dataPath = join(tmp, "experiences.json");

let failed = 0;
function assert(cond, label) {
  if (cond) {
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${label}`);
  }
}

console.log("[1] validateSavePayload — required title");
{
  const r = validateSavePayload({ title: "a" });
  assert(!r.ok && r.errorCode === "TITLE_TOO_SHORT", "title < 2 → TITLE_TOO_SHORT");
}
{
  const r = validateSavePayload({ title: "결제 모듈 안정화", situation: "결제 실패 다발" });
  assert(r.ok && r.normalized.source.platform === "unknown", "unknown platform default");
}
{
  const r = validateSavePayload({
    title: "결제 모듈 안정화",
    sourcePlatform: "ChatGPT",
    actions: ["원인 분석", "롤백 절차 정비"],
  });
  assert(r.ok && r.normalized.source.platform === "chatgpt", "platform normalized lowercase");
}
{
  const r = validateSavePayload({ title: "테스트", evidenceTexts: ["근거1"] });
  assert(!r.ok && r.errorCode === "MISSING_CORE_FIELD", "no situation/task/actions → MISSING_CORE_FIELD");
}

console.log("[2] saveExperience writes an item and returns it");
const saved1 = saveExperience(
  {
    title: "결제 실패율 0.8 → 0.4% 개선",
    situation: "월 100만 건 결제 중 실패율이 0.8%였음",
    task: "결제 안정화 책임자로 지정됨",
    actions: ["원인 분석", "PG사 연동 재설계", "재시도 큐 도입"],
    resultCandidate: "실패율 0.4%로 절반 감소",
    skills: ["문제 정의", "결제 안정화", "장애 분석"],
    jobTags: ["PM", "서비스기획"],
    industryTags: ["커머스"],
    evidenceTexts: ["사용자: PG 재시도 큐를 새로 도입해서 실패율이 0.4%까지 떨어졌어."],
    sourcePlatform: "chatgpt",
    sourceConversationTitle: "결제 안정화 회고",
  },
  { dataPath }
);
assert(saved1.id.startsWith("exp_"), "id has exp_ prefix");
assert(saved1.status === "candidate", "default status is candidate");
assert(typeof saved1.createdAt === "string" && saved1.createdAt.length >= 20, "createdAt iso");
assert(saved1.source?.platform === "chatgpt", "source.platform persisted");

const saved2 = saveExperience(
  {
    title: "이력서 ABL 문장 정리",
    situation: "이직 준비 중 STAR 구조로 정리할 경험 필요",
    actions: ["회고 미팅 정리", "AI와 1on1 진행"],
    skills: ["문서화", "회고"],
    jobTags: ["PM"],
    industryTags: ["HR Tech"],
    evidenceTexts: ["사용자: 이번 분기 회고를 STAR로 다시 정리했어."],
    sourcePlatform: "claude",
    sourceConversationTitle: "이력서 1on1",
  },
  { dataPath }
);

console.log("[3] searchExperiences — empty query returns most-recent-first");
{
  const r = searchExperiences({}, { dataPath });
  assert(r.count === 2, "two items present");
  assert(r.items[0].id === saved2.id, "most-recent first");
}

console.log("[4] searchExperiences — free-text matches multiple fields");
{
  const r = searchExperiences({ query: "PG 재시도" }, { dataPath });
  assert(r.count === 1 && r.items[0].id === saved1.id, "evidence text match");
}
{
  const r = searchExperiences({ query: "결제 안정화" }, { dataPath });
  assert(r.count === 1 && r.items[0].id === saved1.id, "skill match");
}
{
  const r = searchExperiences({ query: "회고" }, { dataPath });
  assert(r.count === 1 && r.items[0].id === saved2.id, "title match");
}

console.log("[5] searchExperiences — tag filter AND");
{
  const r = searchExperiences({ skills: ["문서화"] }, { dataPath });
  assert(r.count === 1 && r.items[0].id === saved2.id, "skills filter");
}
{
  const r = searchExperiences({ jobTags: ["PM"], industryTags: ["커머스"] }, { dataPath });
  assert(r.count === 1 && r.items[0].id === saved1.id, "AND across tag dimensions");
}
{
  const r = searchExperiences({ jobTags: ["nonexistent"] }, { dataPath });
  assert(r.count === 0, "no match returns zero");
}

console.log("[6] searchExperiences — limit cap");
{
  const r = searchExperiences({ limit: 999 }, { dataPath });
  assert(r.items.length <= 10, "limit capped at 10");
}

console.log("[7] validateSearchPayload — limit defaults");
{
  const r = validateSearchPayload({});
  assert(r.ok && r.normalized.limit === 5, "default limit 5");
}
{
  const r = validateSearchPayload({ limit: "not-a-number" });
  assert(r.ok && r.normalized.limit === 5, "invalid limit falls back to default");
}

rmSync(tmp, { recursive: true, force: true });

if (failed === 0) {
  console.log("\nALL TESTS PASSED");
  process.exit(0);
} else {
  console.error(`\n${failed} test(s) FAILED`);
  process.exit(1);
}
