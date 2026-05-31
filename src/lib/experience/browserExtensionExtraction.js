const ANALYSIS_VERSION = "browser-extension-ai-experience-v1";
const MAX_EVIDENCE_ITEMS = 5;

function s(value, max = 1200) {
  if (typeof value !== "string") return "";
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? text.slice(0, max).trim() : text;
}

function arr(value, { maxItems = 10, maxLength = 300 } = {}) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => s(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function uniq(values, limit = 10) {
  const seen = new Set();
  const out = [];
  for (const value of values || []) {
    const text = s(value, 120);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    out.push(text);
    if (out.length >= limit) break;
  }
  return out;
}

function normalizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((message) => ({
      role: s(message?.role, 20).toLowerCase(),
      text: s(message?.text, 6000),
    }))
    .filter((message) =>
      (message.role === "user" || message.role === "assistant") &&
      message.text.length >= 2
    );
}

function transcriptFromMessages(messages) {
  return normalizeMessages(messages)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.text}`)
    .join("\n\n")
    .trim();
}

function compactSentences(text) {
  return String(text || "")
    .split(/(?:\r?\n|(?<=[.!?。！？])\s+|(?<=다\.)\s*)/)
    .map((line) => s(line, 600))
    .filter((line) => line.length >= 8);
}

function evidenceFrom(transcript, patterns, fallbackPatterns = []) {
  const lines = compactSentences(transcript);
  const found = [];
  for (const pattern of patterns) {
    const match = lines.find((line) => pattern.test(line));
    if (match) found.push(match);
  }
  if (found.length < 2) {
    for (const pattern of fallbackPatterns) {
      const match = lines.find((line) => pattern.test(line));
      if (match) found.push(match);
    }
  }
  return uniq(found, MAX_EVIDENCE_ITEMS);
}

function hasAny(text, words) {
  const lower = String(text || "").toLowerCase();
  return words.some((word) => lower.includes(String(word).toLowerCase()));
}

function buildAdobeCandidate(transcript) {
  return {
    title: "Adobe CCXProcess 런타임 오류 원인 조사 및 자동 실행 비활성화 조치",
    situation: "Windows에서 Microsoft Visual C++ Runtime Library Assertion failed 팝업이 반복 발생함.",
    task: "Adobe Creative Cloud Experience의 VulcanMessageLib.node / CCXProcess 자동 실행이 원인 후보인지 확인하고, 삭제 없이 재발 가능성을 낮추는 조치를 지시하고 검토함.",
    actions: [
      "오류 팝업 경로와 Adobe CCXProcess / node-vulcanjs / VulcanMessageLib.node 관련 프로세스 후보를 확인함.",
      "Adobe/CCXProcess 관련 예약 작업과 시작프로그램 후보를 점검하도록 지시함.",
      "Launch Adobe CCXProcess 예약 작업을 Disable-ScheduledTask 방식으로 비활성화함.",
      "Adobe 앱 삭제, 시스템 파일 삭제, 레지스트리 삭제는 하지 않도록 안전 범위를 통제함.",
    ],
    resultCandidate: "Launch Adobe CCXProcess 예약 작업이 Disabled 상태로 변경되어 재부팅 시 오류 팝업 재발 가능성을 낮춤. 단, HKLM Run32의 Adobe CCXProcess 값은 남은 후보로 기록됨.",
    skills: ["문제해결", "원인분석", "자동화 작업 지시", "Windows 운영환경 관리", "리스크 통제"],
    jobTags: ["운영환경 관리", "기술 지원", "업무 자동화"],
    industryTags: ["IT"],
    evidenceTexts: evidenceFrom(
      transcript,
      [/Launch Adobe CCXProcess/i, /Disabled/i, /Result:\s*PASS/i, /삭제하지|삭제.*않|레지스트리/i],
      [/VulcanMessageLib\.node/i, /Disable-ScheduledTask/i, /HKLM Run32/i]
    ),
    missingInfoQuestions: [
      "재부팅 후 팝업이 실제로 재발하지 않았나요?",
      "이 조치가 개발 환경 안정화에 어떤 영향을 줬나요?",
    ],
    riskNotes: ["재부팅 후 재발 여부와 HKLM Run32 잔여 자동 실행 후보는 추가 확인이 필요함."],
    confidenceLevel: "high",
    resumePotential: "medium",
    suggestedResumeBullet: "Adobe CCXProcess 런타임 오류의 자동 실행 원인을 조사하고 예약 작업 비활성화와 삭제 금지 범위 통제로 Windows 개발 환경의 오류 재발 가능성을 낮춤.",
    analysisMethod: "deterministic_adobe_ccxprocess",
  };
}

function buildPassmapProtectionCandidate(transcript) {
  const actions = [
    "PASSMAP 코드와 핵심 로직이 프론트엔드에 노출될 때의 복제 리스크를 점검함.",
    "분석 로직, 프롬프트, API 키와 같은 핵심 자산은 서버 측에 두고 클라이언트에는 결과만 노출하는 방향을 검토함.",
    "환경변수, Supabase RLS, 인증 경계, API route 보호 여부를 함께 확인함.",
  ];
  if (/AGENTS\.md|protected|reset --hard|git add -A|고위험/i.test(transcript)) {
    actions.push("AGENTS.md에 고위험 파일, dirty branch, 금지 명령, 최종 보고 규칙을 명시해 자동화 에이전트의 패치 범위를 통제함.");
  }
  return {
    title: "PASSMAP 코드 보호 및 핵심 로직 서버화 리스크 점검",
    situation: "PASSMAP 서비스의 프론트엔드 코드와 분석 로직이 외부에 노출되거나 복제될 수 있는지 우려가 제기됨.",
    task: "프론트 노출 영역과 서버 보호 영역을 구분하고, 핵심 로직·환경변수·RLS·자동화 에이전트 작업 규칙의 보호 상태를 점검함.",
    actions,
    resultCandidate: "프론트엔드 노출 코드와 서버 측 보호 대상이 구분되었고, 핵심 분석 로직과 운영 규칙을 보호해야 할 범위가 정리됨.",
    skills: ["보안 리스크 점검", "시스템 아키텍처 이해", "운영 정책 수립", "리스크 통제"],
    jobTags: ["프로덕트 운영", "보안", "개발 프로세스"],
    industryTags: ["IT", "HR Tech"],
    evidenceTexts: evidenceFrom(
      transcript,
      [/프론트|frontend|클라이언트/i, /서버|server|API/i, /환경변수|env/i, /RLS|Supabase/i, /AGENTS\.md|reset --hard|git add -A/i],
      [/코드 보호|카피|복제|핵심 로직/i]
    ),
    missingInfoQuestions: ["실제 배포 환경에서 어떤 로직이 클라이언트 번들에 포함되는지 확인했나요?"],
    riskNotes: ["대화 기반 후보이므로 실제 번들/서버 설정 점검 결과는 별도 확인이 필요함."],
    confidenceLevel: "medium",
    resumePotential: "medium",
    suggestedResumeBullet: "PASSMAP의 프론트 노출 코드와 서버 보호 로직을 구분하고 환경변수, RLS, 자동화 에이전트 규칙을 점검해 코드 보호 리스크를 정리함.",
    analysisMethod: "deterministic_passmap_protection",
  };
}

function buildShortInstructionCandidate(transcript) {
  const firstUser = normalizeMessagesFromTranscript(transcript).find((message) => message.role === "user")?.text || "";
  return {
    title: "업무 지시 대화 후속 결과 확인 필요",
    situation: s(firstUser || "사용자가 AI에게 업무 처리를 지시함.", 500),
    task: "대화에 업무 지시는 있으나 실제 실행 결과가 충분히 확인되지 않음.",
    actions: ["업무 지시 또는 문제 해결 요청을 정리함."],
    resultCandidate: "실행 완료 여부와 결과 근거가 대화에 충분히 포함되지 않아 확인이 필요함.",
    skills: ["업무 지시", "문제 정의"],
    jobTags: [],
    industryTags: [],
    evidenceTexts: evidenceFrom(transcript, [/해줘|시켜줘|확인|조사|정리|수정/i]),
    missingInfoQuestions: ["실제로 어떤 조치가 완료되었나요?", "완료 후 확인 가능한 결과나 변화가 있었나요?"],
    riskNotes: ["결과가 확인되지 않은 짧은 지시 대화이므로 이력서 재료화 전 보완이 필요함."],
    confidenceLevel: "low",
    resumePotential: "low",
    suggestedResumeBullet: null,
    analysisMethod: "deterministic_short_instruction",
  };
}

function buildLowWorkCandidate(transcript) {
  return {
    title: "업무 경험 후보 확인 필요",
    situation: "대화에서 명확한 업무 문제, 실행 행동, 결과 근거가 충분히 확인되지 않음.",
    task: "업무 경험으로 저장할 수 있는 구체적 실행 내용이 있는지 추가 확인이 필요함.",
    actions: [],
    resultCandidate: "업무 성과나 실행 결과를 단정할 수 없음.",
    skills: [],
    jobTags: [],
    industryTags: [],
    evidenceTexts: evidenceFrom(transcript, [/./]),
    missingInfoQuestions: ["이 대화에서 실제로 수행한 업무 행동은 무엇인가요?", "확인 가능한 결과나 산출물이 있나요?"],
    riskNotes: ["비업무성 또는 근거 부족 대화일 가능성이 높음."],
    confidenceLevel: "low",
    resumePotential: "low",
    suggestedResumeBullet: null,
    analysisMethod: "deterministic_low_work_signal",
  };
}

function normalizeMessagesFromTranscript(transcript) {
  const out = [];
  for (const block of String(transcript || "").split(/\n{2,}/)) {
    const match = block.match(/^(User|Assistant):\s*([\s\S]*)$/i);
    if (!match) continue;
    out.push({ role: match[1].toLowerCase() === "user" ? "user" : "assistant", text: s(match[2], 6000) });
  }
  return out;
}

function deterministicCandidate(messages) {
  const transcript = transcriptFromMessages(messages);
  const text = transcript.toLowerCase();
  if (hasAny(text, ["ccxprocess", "vulcanmessagelib.node", "node-vulcanjs", "disable-scheduledtask"])) {
    return buildAdobeCandidate(transcript);
  }
  if (hasAny(text, ["passmap", "코드 보호", "서버화", "rls", "환경변수", "프론트 노출", "agents.md"])) {
    return buildPassmapProtectionCandidate(transcript);
  }
  if (hasAny(text, ["해줘", "시켜줘", "조사", "확인", "수정", "정리", "debug", "fix"])) {
    return buildShortInstructionCandidate(transcript);
  }
  return buildLowWorkCandidate(transcript);
}

function normalizeCandidate(candidate, fallback) {
  const safe = candidate && typeof candidate === "object" ? candidate : fallback;
  const title = s(safe.title, 160) || fallback.title;
  const situation = s(safe.situation, 1200) || fallback.situation;
  const task = s(safe.task || safe.problem, 1200) || fallback.task;
  const actions = arr(safe.actions, { maxItems: 10, maxLength: 500 });
  const resultCandidate = s(safe.resultCandidate || safe.result, 1200) || fallback.resultCandidate;
  const confidenceLevel = ["high", "medium", "low"].includes(s(safe.confidenceLevel, 20))
    ? s(safe.confidenceLevel, 20)
    : fallback.confidenceLevel;
  const resumePotential = ["high", "medium", "low"].includes(s(safe.resumePotential, 20))
    ? s(safe.resumePotential, 20)
    : fallback.resumePotential;
  return {
    title,
    situation,
    task,
    actions,
    resultCandidate,
    skills: arr(safe.skills, { maxItems: 12, maxLength: 80 }),
    jobTags: arr(safe.jobTags || safe.job_tags, { maxItems: 12, maxLength: 80 }),
    industryTags: arr(safe.industryTags || safe.industry_tags, { maxItems: 12, maxLength: 80 }),
    evidenceTexts: arr(safe.evidenceTexts, { maxItems: 8, maxLength: 600 }),
    missingInfoQuestions: arr(safe.missingInfoQuestions || safe.followUpQuestions, { maxItems: 4, maxLength: 240 }),
    riskNotes: arr(safe.riskNotes, { maxItems: 8, maxLength: 300 }),
    confidenceLevel,
    resumePotential,
    suggestedResumeBullet: s(safe.suggestedResumeBullet, 500) || null,
    analysisMethod: s(safe.analysisMethod, 80) || fallback.analysisMethod || "deterministic",
  };
}

function extractJsonObject(text) {
  const raw = String(text || "").trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (_) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

function buildPrompt(messages, source = {}) {
  const transcript = transcriptFromMessages(messages);
  return `You are PASSMAP's Korean career-experience extraction engine.
Analyze this ChatGPT conversation and return exactly one JSON object.

Rules:
- Do not use only the latest user request as the title.
- Use the whole conversation to identify the user's real work problem, direction, reviewed result, and risk control.
- Assistant text can be evidence for reconstructing work, but do not claim the user personally executed something unless the conversation includes a result or user confirmation.
- Do not invent metrics or outcomes.
- Keep raw transcript out of the output; include only short evidenceTexts.
- If result is uncertain, use resultCandidate and missingInfoQuestions.
- If the conversation is not work-like, return low confidence and ask follow-up questions.

Output JSON keys:
title, situation, task, actions, resultCandidate, skills, jobTags, industryTags, evidenceTexts, missingInfoQuestions, riskNotes, confidenceLevel, resumePotential, suggestedResumeBullet.

Source title: ${s(source.sourceTitle, 240)}
Source URL: ${s(source.sourceUrl, 2048)}

Conversation:
${transcript}`;
}

async function extractWithOpenAI({ messages, source, apiKey, model = "gpt-4o-mini", fetchImpl = fetch }) {
  if (!apiKey || typeof fetchImpl !== "function") return null;
  const response = await fetchImpl("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1600,
      messages: [
        { role: "system", content: "Return valid JSON only. Write Korean fields for a PASSMAP work-experience candidate." },
        { role: "user", content: buildPrompt(messages, source) },
      ],
    }),
  });
  if (!response.ok) return null;
  const body = await response.json().catch(() => null);
  return extractJsonObject(body?.choices?.[0]?.message?.content);
}

export async function extractBrowserExtensionExperienceCandidate({
  messages,
  source = {},
  openAIApiKey = "",
  openAIModel = "gpt-4o-mini",
  fetchImpl = fetch,
} = {}) {
  const normalizedMessages = normalizeMessages(messages);
  const fallback = normalizeCandidate(deterministicCandidate(normalizedMessages), buildLowWorkCandidate(""));
  let candidate = null;
  try {
    candidate = await extractWithOpenAI({
      messages: normalizedMessages,
      source,
      apiKey: openAIApiKey,
      model: openAIModel,
      fetchImpl,
    });
  } catch (_) {
    candidate = null;
  }
  const normalized = normalizeCandidate(candidate, fallback);
  return {
    analysisVersion: ANALYSIS_VERSION,
    usedAi: Boolean(candidate),
    candidate: {
      ...fallback,
      ...normalized,
      evidenceTexts: normalized.evidenceTexts.length > 0 ? normalized.evidenceTexts : fallback.evidenceTexts,
      missingInfoQuestions: normalized.missingInfoQuestions.length > 0
        ? normalized.missingInfoQuestions
        : fallback.missingInfoQuestions,
      riskNotes: normalized.riskNotes.length > 0 ? normalized.riskNotes : fallback.riskNotes,
      analysisMethod: candidate ? "openai_chat_completion" : fallback.analysisMethod,
    },
  };
}

export { ANALYSIS_VERSION as BROWSER_EXTENSION_ANALYSIS_VERSION };
