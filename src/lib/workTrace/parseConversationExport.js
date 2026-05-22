// src/lib/workTrace/parseConversationExport.js
// Parses a ChatGPT conversations.json export into a plain-text transcript
// labelled with "사용자:" / "AI:" so the existing ai_conversation extraction
// flow (extractExperienceCandidates / _extractUserUtteranceText) can consume it.
//
// In scope:     ChatGPT conversations.json (single file, top-level array)
// Out of scope: .zip exports, Gemini Takeout, Claude official export.

const DEFAULT_MAX_CONVERSATIONS = 10;
const DEFAULT_MAX_CHARS = 50000;
const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30MB hard cap — avoids freezing the tab

const USER_LABEL = "사용자:";
const AI_LABEL = "AI:";

// ChatGPT message roles → plain-text speaker labels.
// system / tool / developer roles are intentionally dropped.
const ROLE_LABELS = {
  user: USER_LABEL,
  assistant: AI_LABEL,
};

const READ_FAIL_MESSAGE = "ChatGPT 대화 export 파일을 읽지 못했어요.";
const TRUNCATED_WARNING = "대화가 길어 최근 일부만 가져왔어요. 필요하면 입력창에서 직접 정리해 주세요.";

function _isPlainObject(value) {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

// Collapses any whitespace run (incl. newlines) into single spaces so that each
// message stays on exactly one line — keeps the "사용자:" / "AI:" label at line start.
function _collapse(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function _ext(name) {
  const m = String(name || "").toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : "";
}

// Collapses a ChatGPT message `content` object into a single trimmed line.
function _messageContentToText(content) {
  if (content == null) return "";
  if (typeof content === "string") return _collapse(content);
  if (_isPlainObject(content)) {
    if (Array.isArray(content.parts)) {
      const joined = content.parts
        .map((part) => (typeof part === "string" ? part : ""))
        .filter(Boolean)
        .join("\n");
      return _collapse(joined);
    }
    if (typeof content.text === "string") return _collapse(content.text);
  }
  return "";
}

// Extracts ordered { label, text } messages from one ChatGPT conversation.
// Only user / assistant messages with non-empty text are kept.
function _extractConversationMessages(conversation) {
  const mapping = conversation?.mapping;
  if (!_isPlainObject(mapping)) return [];

  const nodes = [];
  for (const node of Object.values(mapping)) {
    const message = node?.message;
    if (!_isPlainObject(message)) continue;
    const label = ROLE_LABELS[message?.author?.role];
    if (!label) continue; // keep only user / assistant
    const text = _messageContentToText(message.content);
    if (!text) continue;
    nodes.push({
      label,
      text,
      createTime: typeof message.create_time === "number" ? message.create_time : null,
    });
  }

  // Sort by message.create_time when every node has it; otherwise keep the
  // mapping insertion order as a fallback.
  if (nodes.length > 1 && nodes.every((n) => typeof n.createTime === "number")) {
    nodes.sort((a, b) => a.createTime - b.createTime);
  }

  return nodes.map(({ label, text }) => ({ label, text }));
}

// Recency key for a conversation — update_time preferred, create_time fallback.
function _conversationSortKey(conversation) {
  const u = conversation?.update_time;
  const c = conversation?.create_time;
  if (typeof u === "number") return u;
  if (typeof c === "number") return c;
  return 0;
}

/**
 * Parse a ChatGPT conversations.json string into a labelled plain-text transcript.
 *
 * @param {string} jsonText - raw conversations.json contents
 * @param {{ maxConversations?: number, maxChars?: number, originalFileName?: string }} [options]
 * @returns {{ ok: true, text: string, meta: object } | { ok: false, message: string, meta: object }}
 */
export function parseConversationExportText(jsonText, options = {}) {
  const maxConversations =
    Number.isInteger(options.maxConversations) && options.maxConversations > 0
      ? options.maxConversations
      : DEFAULT_MAX_CONVERSATIONS;
  const maxChars =
    Number.isInteger(options.maxChars) && options.maxChars > 0
      ? options.maxChars
      : DEFAULT_MAX_CHARS;
  const originalFileName = options.originalFileName || "";
  const warnings = [];

  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return {
      ok: false,
      message: READ_FAIL_MESSAGE,
      meta: {
        warnings: ["JSON 형식이 올바르지 않아요. ChatGPT export의 conversations.json인지 확인해 주세요."],
      },
    };
  }

  // Accept a top-level array (standard export) or a single conversation object.
  let conversations;
  if (Array.isArray(parsed)) {
    conversations = parsed;
  } else if (_isPlainObject(parsed) && _isPlainObject(parsed.mapping)) {
    conversations = [parsed];
  } else {
    return {
      ok: false,
      message: READ_FAIL_MESSAGE,
      meta: {
        warnings: ["ChatGPT conversations.json 구조가 아니에요. ZIP 안의 conversations.json 파일만 올려주세요."],
      },
    };
  }

  const conversationCount = conversations.length;

  // Newest conversations first.
  const sorted = conversations
    .filter(_isPlainObject)
    .slice()
    .sort((a, b) => _conversationSortKey(b) - _conversationSortKey(a));

  let text = "";
  let includedConversationCount = 0;
  let messageCount = 0;
  let truncatedByCount = false;
  let truncatedByChars = false;

  for (const conversation of sorted) {
    if (includedConversationCount >= maxConversations) {
      truncatedByCount = true;
      break;
    }
    const messages = _extractConversationMessages(conversation);
    if (messages.length === 0) continue; // skip empty conversations

    const title = _collapse(conversation?.title);
    const header = title ? `[대화] ${title}` : "[대화]";
    let block = (text ? "\n\n" : "") + header + "\n\n";
    const includedLines = [];

    for (const m of messages) {
      const line = `${m.label} ${m.text}`;
      const candidate = block + (includedLines.length ? "\n" : "") + line;
      // Always keep the very first message even if it alone exceeds the limit.
      const isFirstMessageEver = text.length === 0 && includedLines.length === 0;
      if (text.length + candidate.length > maxChars && !isFirstMessageEver) {
        truncatedByChars = true;
        break;
      }
      block = candidate;
      includedLines.push(line);
    }

    if (includedLines.length === 0) {
      if (truncatedByChars) break;
      continue;
    }

    text += block;
    includedConversationCount += 1;
    messageCount += includedLines.length;

    if (truncatedByChars) break;
  }

  if (truncatedByChars || truncatedByCount) {
    warnings.push(TRUNCATED_WARNING);
  }

  text = text.trim();

  if (!text || messageCount === 0) {
    return {
      ok: false,
      message: "ChatGPT 대화 export에서 사용자·AI 대화를 찾지 못했어요.",
      meta: {
        warnings: warnings.length ? warnings : ["사용자/AI 메시지가 있는 대화가 없어요."],
        conversationCount,
      },
    };
  }

  return {
    ok: true,
    text,
    meta: {
      provider: "chatgpt",
      parser: "chatgpt_conversations_json_v1",
      importMethod: "chatgpt_export_json",
      originalFileName,
      conversationCount,
      includedConversationCount,
      messageCount,
      charCount: text.length,
      warnings,
    },
  };
}

/**
 * Parse a ChatGPT conversations.json File into a labelled plain-text transcript.
 *
 * @param {File} file - uploaded conversations.json file
 * @param {{ maxConversations?: number, maxChars?: number }} [options]
 * @returns {Promise<{ ok: true, text: string, meta: object } | { ok: false, message: string, meta: object }>}
 */
export async function parseConversationExportFile(file, options = {}) {
  if (!file || typeof file.text !== "function") {
    return {
      ok: false,
      message: READ_FAIL_MESSAGE,
      meta: { warnings: ["파일을 읽을 수 없어요."] },
    };
  }

  if (typeof file.size === "number" && file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: "파일이 너무 커요. ChatGPT conversations.json 파일만 올려주세요.",
      meta: { warnings: ["파일 크기가 30MB를 초과해요."] },
    };
  }

  let jsonText;
  try {
    jsonText = await file.text();
  } catch {
    return {
      ok: false,
      message: READ_FAIL_MESSAGE,
      meta: { warnings: ["파일을 여는 중 오류가 발생했어요."] },
    };
  }

  return parseConversationExportText(jsonText, {
    maxConversations: options.maxConversations,
    maxChars: options.maxChars,
    originalFileName: options.originalFileName || file.name || "",
  });
}

// True when a file looks like a JSON export (ChatGPT conversations.json).
export function isJsonFile(file) {
  if (!file) return false;
  const mime = String(file.type || "").toLowerCase();
  return _ext(file.name) === "json" || mime === "application/json";
}

// True when a file looks like Markdown.
export function isMarkdownFile(file) {
  if (!file) return false;
  const ext = _ext(file.name);
  const mime = String(file.type || "").toLowerCase();
  return (
    ext === "md" ||
    ext === "markdown" ||
    mime === "text/markdown" ||
    mime === "text/x-markdown"
  );
}
