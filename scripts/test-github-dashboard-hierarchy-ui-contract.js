import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function countApiJsFiles(dir) {
  let count = 0;
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      count += countApiJsFiles(fullPath);
    } else if (entry.endsWith(".js")) {
      count += 1;
    }
  }
  return count;
}

const homeDashboardSource = readFileSync(
  path.join(root, "src/components/home/HomeDashboard.jsx"),
  "utf8"
);

assert.ok(homeDashboardSource.includes("업무 자동 수집"), "top hierarchy must describe automatic work collection");
assert.ok(homeDashboardSource.includes("GitHub PR 자동 분석"), "GitHub card must use product wording");
assert.ok(homeDashboardSource.includes("최근 PR 불러오기"), "recent PR import CTA must remain visible");
assert.ok(homeDashboardSource.includes("수동 PR 입력"), "manual PR fallback must remain available");
assert.ok(homeDashboardSource.includes("수동 입력 열기"), "manual PR fallback must be collapsed by default");
assert.equal(homeDashboardSource.includes("Connected GitHub repositories"), false, "old GitHub repository heading must be removed");
assert.equal(
  homeDashboardSource.includes("Load repositories from the verified GitHub App installation"),
  false,
  "developer-oriented repository description must be removed"
);
assert.equal(homeDashboardSource.includes(">Refresh status<"), false, "Refresh status must not remain as a primary button label");
assert.ok(homeDashboardSource.includes("상태 새로고침"), "status refresh may remain only as small Korean helper text");
assert.ok(homeDashboardSource.includes("github_connection_prepare"), "GitHub connect CTA must reuse existing prepare action");
assert.ok(homeDashboardSource.includes("installation_url"), "GitHub connect CTA must use safe installation URL field");
assert.ok(/connect\s*=\s*data\?\.connect/.test(homeDashboardSource), "GitHub connect CTA must read the connect payload");
assert.ok(/connect\.state/.test(homeDashboardSource), "GitHub connect CTA must read connect.state");
assert.ok(/searchParams\.set\("state"/.test(homeDashboardSource), "GitHub connect CTA must append state query param");
assert.equal(homeDashboardSource.includes("window.location.href"), false, "return_to must not send the full window.location.href");
assert.ok(
  homeDashboardSource.includes("window.location.pathname") &&
    homeDashboardSource.includes("window.location.search") &&
    homeDashboardSource.includes("window.location.hash"),
  "return_to must be path-based"
);
assert.ok(homeDashboardSource.includes("github_recent_pull_requests_import"), "recent PR import action must remain wired");
assert.ok(homeDashboardSource.includes("github_pr_preview"), "manual GitHub PR preview fallback must remain wired");
assert.ok(homeDashboardSource.includes("연결 방법 보기"), "ChatGPT detailed steps must be behind a collapsed guide control");
assert.ok(homeDashboardSource.includes("ChatGPT 기록 수집"), "ChatGPT import must remain as a secondary collection source");
assert.ok(homeDashboardSource.includes("경력 기록 흐름"), "calendar section hierarchy wording must be lower-priority career flow wording");
for (const forbiddenUiText of ["installation_id", "private_key", "raw response"]) {
  assert.equal(homeDashboardSource.includes(forbiddenUiText), false, `${forbiddenUiText} must not be displayed in UI copy`);
}
assert.equal(/>\s*token\s*</i.test(homeDashboardSource), false, "token must not be displayed in UI copy");
assert.equal(/>\s*jwt\s*</i.test(homeDashboardSource), false, "jwt must not be displayed in UI copy");
assert.equal(countApiJsFiles(path.join(root, "api")), 12, "API JS count must remain 12");

console.log("PASS github-dashboard-hierarchy-ui-contract");
