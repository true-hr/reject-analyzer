import assert from "node:assert/strict";

import { extractBrowserExtensionExperienceCandidate } from "../src/lib/experience/browserExtensionExtraction.js";

async function extract(messages) {
  const result = await extractBrowserExtensionExperienceCandidate({
    messages,
    source: {
      sourcePlatform: "chatgpt",
      sourceTitle: "ChatGPT",
      sourceUrl: "https://chatgpt.com/c/sample",
    },
    openAIApiKey: "",
  });
  return result.candidate;
}

const adobe = await extract([
  { role: "user", text: "이 알람이 다시는 안 뜨게 코덱스 시켜줘" },
  {
    role: "assistant",
    text: "원인 후보는 Adobe CCXProcess / node-vulcanjs / VulcanMessageLib.node 입니다. Codex에게 예약 작업과 시작프로그램을 조사하고 삭제 없이 Disable-ScheduledTask로 제한하라고 지시하세요.",
  },
  {
    role: "user",
    text: "결과 보고: Launch Adobe CCXProcess 예약 작업 Disabled. Adobe 앱/시스템 파일/레지스트리 삭제하지 않음. Result: PASS. 재부팅 후 확인하고 재발 시 HKLM Run32 Adobe CCXProcess 후속 조치.",
  },
]);

assert.match(adobe.title, /Adobe CCXProcess/);
assert.doesNotMatch(adobe.title, /이 알람이 다시는/);
assert.ok(adobe.actions.some((item) => /Disable-ScheduledTask|비활성화/.test(item)));
assert.ok(adobe.actions.some((item) => /삭제/.test(item)));
assert.match(adobe.resultCandidate, /Disabled/);
assert.ok(adobe.skills.includes("문제해결"));
assert.ok(adobe.skills.includes("원인분석"));
assert.ok(adobe.skills.includes("리스크 통제"));
assert.ok(adobe.evidenceTexts.some((item) => /Result:\s*PASS|Disabled/.test(item)));

const passmap = await extract([
  { role: "user", text: "사람들이 패스맵 코드를 카피할 수도 있어? PASSMAP 코드 보호 방법을 점검해줘." },
  {
    role: "assistant",
    text: "프론트에 노출되는 로직과 서버에 둬야 하는 핵심 분석 로직을 구분해야 합니다. API 키는 환경변수로 보호하고 Supabase RLS와 서버 API route에서 권한을 확인해야 합니다.",
  },
  {
    role: "user",
    text: "AGENTS.md에 고위험 파일과 dirty branch rule, git add -A 금지, reset --hard 금지까지 넣어서 자동화 에이전트 패치도 통제했어.",
  },
]);

assert.match(passmap.title, /PASSMAP 코드 보호/);
assert.ok(passmap.actions.some((item) => /프론트|서버/.test(item)));
assert.ok(passmap.actions.some((item) => /RLS|환경변수/.test(item)));
assert.ok(passmap.actions.some((item) => /AGENTS\.md|reset --hard|git add -A/.test(item)));
assert.equal(passmap.confidenceLevel, "medium");

const shortInstruction = await extract([
  { role: "user", text: "이 오류 로그 확인해서 원인 찾아줘" },
  { role: "assistant", text: "로그와 재현 절차를 확인한 뒤 원인 후보를 좁히면 됩니다." },
]);

assert.equal(shortInstruction.confidenceLevel, "low");
assert.ok(shortInstruction.missingInfoQuestions.length > 0);
assert.match(shortInstruction.resultCandidate, /확인/);

const nonWork = await extract([
  { role: "user", text: "오늘 점심 뭐 먹지?" },
  { role: "assistant", text: "가볍게 먹고 싶으면 샐러드나 국밥을 고려해볼 수 있어요." },
]);

assert.equal(nonWork.confidenceLevel, "low");
assert.equal(nonWork.resumePotential, "low");
assert.ok(nonWork.missingInfoQuestions.length > 0);

console.log("browser extension extraction fixtures passed");
