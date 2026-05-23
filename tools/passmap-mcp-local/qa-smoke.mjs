// qa-smoke.mjs — temporary, runs an end-to-end check against the live
// data/experiences.json. Remove (or leave; harmless) after QA.
//
// (1) Spawns `node server.mjs` as a stdio MCP server, sends initialize +
//     tools/list, prints the discovered tool names, then kills it.
// (2) Calls saveExperience + searchExperiences directly against the real
//     data file so the user can see one round-trip on disk.

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { saveExperience, searchExperiences } from "./lib/store.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataFile = resolve(__dirname, "data", "experiences.json");

function send(stream, obj) {
  stream.write(JSON.stringify(obj) + "\n");
}

async function mcpBootCheck() {
  const proc = spawn(process.execPath, [resolve(__dirname, "server.mjs")], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  let stdoutBuf = "";
  let stderrBuf = "";
  proc.stdout.on("data", (d) => (stdoutBuf += d.toString()));
  proc.stderr.on("data", (d) => (stderrBuf += d.toString()));

  send(proc.stdin, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "qa-smoke", version: "0.0" },
    },
  });
  await new Promise((r) => setTimeout(r, 400));
  send(proc.stdin, { jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  send(proc.stdin, { jsonrpc: "2.0", id: 2, method: "tools/list" });
  await new Promise((r) => setTimeout(r, 1200));

  proc.kill();

  const lines = stdoutBuf.split(/\r?\n/).filter(Boolean);
  let toolNames = [];
  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg?.id === 2 && msg?.result?.tools) {
        toolNames = msg.result.tools.map((t) => t.name);
      }
    } catch {}
  }
  return { toolNames, stderrBuf };
}

console.log("=== [A] MCP server boot — initialize + tools/list ===");
const boot = await mcpBootCheck();
console.log("discovered tools:", boot.toolNames);
if (boot.stderrBuf.trim()) {
  console.log("stderr (first 200 chars):", boot.stderrBuf.slice(0, 200));
}

console.log("\n=== [B] saveExperience against live data/experiences.json ===");
const saved = saveExperience({
  title: "12-A 연결 QA 샘플 — MCP 데모",
  situation: "Claude Code에서 12-A 로컬 MCP 데모 연결 QA를 수행 중",
  task: "save/search가 실제 data/experiences.json에 적용되는지 검증",
  actions: ["npm install 검증", "self-test 19/19 PASS 확인", "MCP server boot 확인"],
  resultCandidate: "운영 이행 전 UX·데이터 shape 1차 검증 완료",
  skills: ["문제 정의", "QA"],
  jobTags: ["PM"],
  industryTags: ["HR Tech"],
  evidenceTexts: ["사용자: 12-A 로컬 MCP 데모 연결 QA를 진행하라고 요청함."],
  riskNotes: ["로컬 데모 결과는 운영 DB에 반영되지 않음 — 운영판은 별도 endpoint 필요"],
  sourcePlatform: "manual",
  sourceConversationTitle: "12-A 연결 QA",
});
console.log("saved id:", saved.id);
console.log("saved status:", saved.status, "/ createdAt:", saved.createdAt);

console.log("\n=== [C] searchExperiences against live data ===");
const found = searchExperiences({ query: "MCP", limit: 5 });
console.log("found count:", found.count);
for (const item of found.items) {
  console.log(" -", item.id, "::", item.title);
}

console.log("\n=== [D] on-disk verification — data/experiences.json size ===");
const raw = readFileSync(dataFile, "utf8");
const parsed = JSON.parse(raw);
console.log("items on disk:", parsed.items.length);
console.log("latest item id:", parsed.items[parsed.items.length - 1]?.id);

console.log("\nQA-SMOKE DONE");
