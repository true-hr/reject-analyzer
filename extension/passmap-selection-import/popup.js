const BRIDGE_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE_BRIDGE";
const PASSMAP_URL = "https://passmap-app.vercel.app/#work-trace-intake";
const DIRECT_SAVE_API_URL = "https://passmap-app.vercel.app/api/save-analysis-run?action=browser_extension_save_experience";
const DIRECT_SAVE_TOKEN_STORAGE_KEY = "PASSMAP_DIRECT_SAVE_BEARER";
const MIN_RAW_TEXT_LENGTH = 30;
const MAX_RAW_TEXT_LENGTH = 50000;
const EXTENSION_VERSION = "0.1.4";
const EXTENSION_BUILD = "direct-save-wiring-20260531";

const directSaveButton = document.getElementById("directSave");
const saveCurrentButton = document.getElementById("saveCurrent");
const saveSelectionButton = document.getElementById("saveSelection");
const openInboxButton = document.getElementById("openInbox");
const statusEl = document.getElementById("status");
const buildInfoEl = document.getElementById("buildInfo");

if (buildInfoEl) {
  buildInfoEl.textContent = `v${EXTENSION_VERSION} · ${EXTENSION_BUILD}`;
}

function setStatus(message) {
  statusEl.textContent = message || "";
}

function compactText(value, max = 240) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trim() + "…";
}

function inferSourcePlatform(url) {
  let host = "";
  try {
    host = new URL(url || "").hostname.toLowerCase();
  } catch (_) {
    return "browser_extension";
  }
  if (host === "chat.openai.com" || host === "chatgpt.com" || host.endsWith(".chatgpt.com")) {
    return "chatgpt";
  }
  if (host === "claude.ai" || host.endsWith(".claude.ai")) {
    return "claude";
  }
  if (host === "gemini.google.com") {
    return "gemini";
  }
  return "browser_extension";
}

function normalizeDirectSourcePlatform(value) {
  const platform = String(value || "").trim().toLowerCase();
  return ["chatgpt", "claude", "gemini", "unknown"].includes(platform)
    ? platform
    : "unknown";
}

function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const tab = tabs?.[0];
      if (!tab?.id) {
        reject(new Error("현재 탭을 찾을 수 없습니다."));
        return;
      }
      resolve(tab);
    });
  });
}

function captureVisibleText() {
  const maxRawTextLength = 50000;
  const minRawTextLength = 30;

  function isChatGptPage(host) {
    return host === "chat.openai.com" || host === "chatgpt.com" || host.endsWith(".chatgpt.com");
  }

  function inferPageSourcePlatform() {
    const host = location.hostname.toLowerCase();
    if (isChatGptPage(host)) {
      return "chatgpt";
    }
    if (host === "claude.ai" || host.endsWith(".claude.ai")) {
      return "claude";
    }
    if (host === "gemini.google.com") {
      return "gemini";
    }
    return "browser_extension";
  }

  function normalizeMessageText(value) {
    return String(value || "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function createSnippet(value, max = 240) {
    const text = normalizeMessageText(value).replace(/\s+/g, " ").trim();
    if (!text) return "";
    if (text.length <= max) return text;
    return text.slice(0, Math.max(0, max - 1)).trim() + "…";
  }

  function getRoleLabel(role) {
    if (role === "user") return "사용자";
    if (role === "assistant") return "ChatGPT";
    return "메시지";
  }

  function isChatGptUiLine(line) {
    const text = normalizeMessageText(line);
    if (!text) return true;
    const exactUiLines = new Set([
      "콘텐츠로 건너뛰기",
      "채팅 기록",
      "ChatGPT",
      "새 채팅",
      "채팅 검색",
      "라이브러리",
      "프로젝트",
      "앱",
      "Codex",
      "더 보기",
      "고정됨",
      "최근",
      "오늘",
      "공유하기",
      "Pro",
      "Thinking",
    ]);
    if (exactUiLines.has(text)) return true;
    if (text === "ChatGPT는 실수를 할 수 있습니다. 중요한 정보는 재차 확인하세요.") return true;
    if (text.length <= 2 && /^[가-힣A-Za-z]+$/.test(text)) return true;
    return false;
  }

  function filterChatGptUiText(value) {
    const lines = normalizeMessageText(value).split("\n");
    const filtered = [];
    let previous = "";
    for (const line of lines) {
      const text = normalizeMessageText(line);
      if (isChatGptUiLine(text)) continue;
      if (text === previous) continue;
      filtered.push(text);
      previous = text;
    }
    return normalizeMessageText(filtered.join("\n"));
  }

  function isChatGptContaminatedText(value) {
    const text = String(value || "");
    const contaminationSignals = [
      "콘텐츠로 건너뛰기",
      "채팅 기록",
      "새 채팅",
      "채팅 검색",
      "라이브러리",
      "프로젝트",
      "고정됨",
      "최근",
      "공유하기",
      "Baek Gangsan",
      "Pro",
      "ChatGPT는 실수를 할 수 있습니다",
    ];
    return contaminationSignals.some((signal) => text.includes(signal));
  }

  function getBodyFallback() {
    return {
      rawText: (document.body?.innerText || "").trim().slice(0, maxRawTextLength),
      captureQuality: "body_inner_text",
      messageCount: 0,
    };
  }

  function collectChatGptMessageNodes() {
    const selectorGroups = [
      "[data-message-author-role]",
      "main [data-message-author-role]",
    ];
    const seenNodes = new Set();
    const messages = [];

    for (const selector of selectorGroups) {
      const nodes = Array.from(document.querySelectorAll(selector));
      for (const node of nodes) {
        if (!node || seenNodes.has(node)) continue;
        seenNodes.add(node);

        const roleNode = node.closest?.("[data-message-author-role]");
        const rawRole = roleNode?.getAttribute?.("data-message-author-role")
          || node.getAttribute?.("data-message-author-role")
          || "";
        const role = rawRole.trim().toLowerCase();
        if (role !== "user" && role !== "assistant") continue;
        const text = filterChatGptUiText(node.innerText || node.textContent || "");
        if (text.length < 10) continue;
        if (isChatGptContaminatedText(text)) continue;
        messages.push({ role, text });
      }

      if (messages.some((message) => message.role === "user" || message.role === "assistant")) {
        break;
      }
    }

    const seenTexts = new Set();
    return messages.filter((message) => {
      const key = message.text.toLowerCase();
      if (seenTexts.has(key)) return false;
      seenTexts.add(key);
      return true;
    });
  }

  function captureChatGptConversation() {
    try {
      const messages = collectChatGptMessageNodes().slice(-12);
      if (messages.length) {
        const body = messages
          .map((message) => `${getRoleLabel(message.role)}:\n${message.text}`)
          .join("\n\n")
          .trim();
        const rawText = normalizeMessageText(
          `[ChatGPT 대화 캡처]\n제목: ${document.title || ""}\nURL: ${location.href}\n\n${body}`
        ).slice(0, maxRawTextLength);

        if (rawText.length >= minRawTextLength && !isChatGptContaminatedText(rawText)) {
          return {
            rawText,
            captureQuality: "chatgpt_message_nodes",
            messageCount: messages.length,
            messageSnippets: messages.slice(-6).map((message) => ({
              role: message.role,
              text: createSnippet(message.text),
            })).filter((message) => message.text.length >= 10),
          };
        }
      }
      return null;
    } catch (error) {
      console.warn("[passmap-ext] ChatGPT message capture fallback:", error);
      return null;
    }
  }

  const host = location.hostname.toLowerCase();
  const isChatGpt = isChatGptPage(host);
  const captured = isChatGpt ? captureChatGptConversation() : null;
  const fallback = captured || (isChatGpt ? {
    rawText: "",
    captureQuality: "chatgpt_message_nodes_failed",
    messageCount: 0,
    error: "CHATGPT_MESSAGE_CAPTURE_FAILED",
  } : getBodyFallback());

  return {
    sourceUrl: location.href,
    sourceTitle: document.title || "",
    capturedAt: Date.now(),
    sourcePlatform: inferPageSourcePlatform(),
    rawText: fallback.rawText,
    captureQuality: fallback.captureQuality,
    messageCount: fallback.messageCount,
    messageSnippets: Array.isArray(fallback.messageSnippets) ? fallback.messageSnippets : [],
    error: fallback.error || "",
  };
}

function captureSelectedText() {
  return {
    sourceUrl: location.href,
    sourceTitle: document.title || "",
    capturedAt: Date.now(),
    rawText: (window.getSelection?.().toString() || "").trim().slice(0, 50000),
  };
}

async function executeCapture(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: captureVisibleText,
  });
  return results?.[0]?.result;
}

async function executeSelectionCapture(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: captureSelectedText,
  });
  return results?.[0]?.result;
}

function saveBridgePayload(payload) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [BRIDGE_STORAGE_KEY]: payload }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function openPassmap() {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url: PASSMAP_URL }, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tab);
    });
  });
}

function getDirectSaveToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(DIRECT_SAVE_TOKEN_STORAGE_KEY, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      const token = String(items?.[DIRECT_SAVE_TOKEN_STORAGE_KEY] || "").trim();
      resolve(token);
    });
  });
}

function createDirectSavePayload(capture, tab) {
  const snippets = Array.isArray(capture?.messageSnippets)
    ? capture.messageSnippets
        .map((message) => ({
          role: String(message?.role || "").trim(),
          text: compactText(message?.text, 240),
        }))
        .filter((message) => message.text.length >= 10)
    : [];
  const userSnippets = snippets.filter((message) => message.role === "user");
  const assistantSnippets = snippets.filter((message) => message.role === "assistant");
  const latestUserText = userSnippets[userSnippets.length - 1]?.text || "";
  const latestAssistantText = assistantSnippets[assistantSnippets.length - 1]?.text || "";
  const sourceTitle = compactText(capture?.sourceTitle || tab?.title || "", 120);
  const titleSeed = latestUserText || sourceTitle || "AI conversation";
  const title = compactText(titleSeed.replace(/^ChatGPT\s*[-:|]?\s*/i, ""), 80) || "AI conversation";
  const evidenceTexts = snippets
    .slice(-4)
    .map((message) => message.text)
    .filter(Boolean)
    .slice(0, 3);

  return {
    importMethod: "browser_extension_current_conversation",
    userConfirmed: true,
    title,
    situation: compactText(latestUserText || sourceTitle || "AI conversation capture", 600),
    task: compactText(latestUserText || "Captured a browser AI conversation for later review.", 600),
    actions: [
      latestAssistantText
        ? compactText(latestAssistantText, 300)
        : "Captured structured AI conversation context for PASSMAP review.",
    ],
    evidenceTexts,
    sourcePlatform: normalizeDirectSourcePlatform(
      capture?.sourcePlatform || inferSourcePlatform(capture?.sourceUrl || tab?.url)
    ),
    sourceTitle,
    sourceUrl: capture?.sourceUrl || tab?.url || "",
    sourceConversationTitle: sourceTitle,
    captureMode: "current_conversation",
    captureQuality: capture?.captureQuality || "",
    messageCount: typeof capture?.messageCount === "number" ? capture.messageCount : 0,
    clientTraceId: `ext-${Date.now()}`,
  };
}

async function postDirectSave(payload, token) {
  const response = await fetch(DIRECT_SAVE_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let body = null;
  try {
    body = await response.json();
  } catch (_) {
    body = null;
  }
  if (!response.ok || body?.ok === false) {
    const message = body?.message || body?.error?.message || `Direct save failed (${response.status})`;
    throw new Error(message);
  }
  return body;
}

async function directSaveCurrentConversation() {
  directSaveButton.disabled = true;
  setStatus("PASSMAP 직접 저장 연결을 확인하는 중입니다.");

  try {
    const token = await getDirectSaveToken();
    if (!token) {
      setStatus("직접 저장 연결이 아직 필요합니다. 대신 PASSMAP 입력 화면으로 보내 저장할 수 있어요.");
      return;
    }

    const tab = await getActiveTab();
    const capture = await executeCapture(tab.id);
    if (capture?.error === "CHATGPT_MESSAGE_CAPTURE_FAILED") {
      setStatus("현재 대화를 구조화하지 못했습니다. 대신 PASSMAP 입력 화면으로 보내 저장할 수 있어요.");
      return;
    }

    const payload = createDirectSavePayload(capture, tab);
    if (!payload.evidenceTexts.length && !payload.situation && !payload.task) {
      setStatus("저장할 후보 내용을 찾지 못했습니다. 대신 PASSMAP 입력 화면으로 보내 저장할 수 있어요.");
      return;
    }

    await postDirectSave(payload, token);
    setStatus("PASSMAP AI Inbox에 보냈습니다. 나중에 맞는 내용만 골라 이력서 재료로 확정할 수 있어요.");
  } catch (error) {
    console.warn("[passmap-ext] direct save failed:", error);
    setStatus("직접 저장 연결이 아직 필요합니다. 대신 PASSMAP 입력 화면으로 보내 저장할 수 있어요.");
  } finally {
    directSaveButton.disabled = false;
  }
}

async function saveCurrentConversation() {
  saveCurrentButton.disabled = true;
  setStatus("현재 페이지 내용을 확인하는 중입니다.");

  try {
    const tab = await getActiveTab();
    const capture = await executeCapture(tab.id);
    const rawText = typeof capture?.rawText === "string" ? capture.rawText.trim() : "";

    if (capture?.error === "CHATGPT_MESSAGE_CAPTURE_FAILED") {
      setStatus(`ChatGPT 대화를 자동으로 읽지 못했습니다. 선택한 부분만 저장을 사용해 주세요. (v${EXTENSION_VERSION})`);
      return;
    }

    if (rawText.length < MIN_RAW_TEXT_LENGTH) {
      setStatus("저장할 대화 내용이 너무 짧습니다. 대화 화면에서 다시 시도해 주세요.");
      return;
    }

    const savedAt = Date.now();
    const payload = {
      version: 1,
      sourceMode: "ai_conversation",
      sourcePlatform: capture.sourcePlatform || inferSourcePlatform(capture.sourceUrl || tab.url),
      importMethod: "browser_extension_current_conversation",
      privacyReviewRequired: true,
      sourceUrl: capture.sourceUrl || tab.url || "",
      sourceTitle: capture.sourceTitle || tab.title || "",
      capturedAt: capture.capturedAt || savedAt,
      captureMode: "current_conversation",
      captureQuality: capture.captureQuality || "",
      messageCount: typeof capture.messageCount === "number" ? capture.messageCount : 0,
      rawText: rawText.slice(0, MAX_RAW_TEXT_LENGTH),
      savedAt,
    };

    await saveBridgePayload(payload);
    await openPassmap();
    const quality = payload.captureQuality || "unknown";
    const count = Number(payload.messageCount || 0);
    const countLabel = count > 0 ? `, ${count}개 메시지` : "";
    setStatus(`PASSMAP에서 내용을 검토해 주세요. (${quality}${countLabel})`);
  } catch (error) {
    console.warn("[passmap-ext] current conversation capture failed:", error);
    setStatus("현재 탭 내용을 읽을 수 없습니다. 대화 페이지에서 다시 시도해 주세요.");
  } finally {
    saveCurrentButton.disabled = false;
  }
}

async function saveSelectedText() {
  saveSelectionButton.disabled = true;
  setStatus("선택한 텍스트를 확인하는 중입니다.");

  try {
    const tab = await getActiveTab();
    const capture = await executeSelectionCapture(tab.id);
    const rawText = typeof capture?.rawText === "string" ? capture.rawText.trim() : "";

    if (rawText.length < MIN_RAW_TEXT_LENGTH) {
      setStatus("저장할 선택 텍스트가 너무 짧습니다. 30자 이상 드래그한 뒤 다시 시도해 주세요.");
      return;
    }

    const savedAt = Date.now();
    const payload = {
      version: 1,
      sourceMode: "ai_conversation",
      sourcePlatform: inferSourcePlatform(capture.sourceUrl || tab.url),
      importMethod: "browser_extension_selection",
      privacyReviewRequired: true,
      sourceUrl: capture.sourceUrl || tab.url || "",
      sourceTitle: capture.sourceTitle || tab.title || "",
      capturedAt: capture.capturedAt || savedAt,
      captureMode: "selection",
      rawText: rawText.slice(0, MAX_RAW_TEXT_LENGTH),
      savedAt,
    };

    await saveBridgePayload(payload);
    await openPassmap();
    setStatus("PASSMAP에서 선택 내용을 검토해 주세요.");
  } catch (error) {
    console.warn("[passmap-ext] selected text capture failed:", error);
    setStatus("선택 텍스트를 읽을 수 없습니다. 우클릭 메뉴로 다시 시도해 주세요.");
  } finally {
    saveSelectionButton.disabled = false;
  }
}

directSaveButton.addEventListener("click", directSaveCurrentConversation);
saveCurrentButton.addEventListener("click", saveCurrentConversation);
saveSelectionButton.addEventListener("click", saveSelectedText);

openInboxButton.addEventListener("click", async () => {
  try {
    await openPassmap();
    setStatus("PASSMAP을 열었습니다.");
  } catch (error) {
    console.warn("[passmap-ext] open PASSMAP failed:", error);
    setStatus("PASSMAP을 열 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
});
