const BRIDGE_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE_BRIDGE";
const PASSMAP_URL = "https://passmap-app.vercel.app/#work-trace-intake";
const DIRECT_SAVE_API_URL = "https://passmap-app.vercel.app/api/save-analysis-run?action=browser_extension_save_experience";
const PAIRING_EXCHANGE_API_URL = "https://passmap-app.vercel.app/api/save-analysis-run?action=mcp_pairing_exchange";
const DIRECT_SAVE_TOKEN_STORAGE_KEY = "PASSMAP_DIRECT_SAVE_BEARER";
const DIRECT_SAVE_TOKEN_EXPIRES_AT_KEY = "PASSMAP_DIRECT_SAVE_TOKEN_EXPIRES_AT";
const DIRECT_SAVE_CLIENT_NAME_KEY = "PASSMAP_DIRECT_SAVE_CLIENT_NAME";
const DIRECT_SAVE_CONNECTED_AT_KEY = "PASSMAP_DIRECT_SAVE_CONNECTED_AT";
const DIRECT_SAVE_CLIENT_NAME = "Browser Extension";
const DIRECT_SAVE_INBOX_FALLBACK_URL = "https://passmap-app.vercel.app/?utm_source=browser_extension&view=ai-inbox#ai-inbox";
const MIN_RAW_TEXT_LENGTH = 30;
const MAX_RAW_TEXT_LENGTH = 50000;
const EXTENSION_VERSION = "0.1.6";
const EXTENSION_BUILD = "direct-save-success-cta-20260531";

const pairingCodeInput = document.getElementById("pairingCode");
const connectPassmapButton = document.getElementById("connectPassmap");
const disconnectPassmapButton = document.getElementById("disconnectPassmap");
const connectionStatusEl = document.getElementById("connectionStatus");
const directSaveButton = document.getElementById("directSave");
const openSavedInboxButton = document.getElementById("openSavedInbox");
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

function setConnectionStatus(message) {
  if (connectionStatusEl) {
    connectionStatusEl.textContent = message || "";
  }
}

function hideDirectSaveCta() {
  if (!openSavedInboxButton) return;
  openSavedInboxButton.classList.add("hidden");
  openSavedInboxButton.dataset.inboxUrl = "";
}

function showDirectSaveCta(inboxUrl) {
  if (!openSavedInboxButton) return;
  openSavedInboxButton.dataset.inboxUrl = String(inboxUrl || DIRECT_SAVE_INBOX_FALLBACK_URL);
  openSavedInboxButton.classList.remove("hidden");
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

function openUrl(url) {
  return new Promise((resolve, reject) => {
    chrome.tabs.create({ url }, (tab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tab);
    });
  });
}

function getLocalStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(items || {});
    });
  });
}

function setLocalStorage(values) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(values, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function removeLocalStorage(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve();
    });
  });
}

function getDirectSaveToken() {
  return getLocalStorage(DIRECT_SAVE_TOKEN_STORAGE_KEY).then((items) =>
    String(items?.[DIRECT_SAVE_TOKEN_STORAGE_KEY] || "").trim()
  );
}

function normalizePairingCode(value) {
  return String(value || "").trim().toUpperCase();
}

async function getDirectSaveConnection() {
  const items = await getLocalStorage([
    DIRECT_SAVE_TOKEN_STORAGE_KEY,
    DIRECT_SAVE_TOKEN_EXPIRES_AT_KEY,
    DIRECT_SAVE_CLIENT_NAME_KEY,
    DIRECT_SAVE_CONNECTED_AT_KEY,
  ]);
  const token = String(items?.[DIRECT_SAVE_TOKEN_STORAGE_KEY] || "").trim();
  return {
    connected: Boolean(token),
    token,
    tokenExpiresAt: items?.[DIRECT_SAVE_TOKEN_EXPIRES_AT_KEY] || null,
    clientName: items?.[DIRECT_SAVE_CLIENT_NAME_KEY] || null,
    connectedAt: items?.[DIRECT_SAVE_CONNECTED_AT_KEY] || null,
  };
}

async function refreshConnectionUi(message) {
  try {
    const connection = await getDirectSaveConnection();
    if (connection.connected) {
      setConnectionStatus(message || "PASSMAP 연결됨. 이제 현재 AI 대화를 Inbox 후보로 직접 저장할 수 있어요.");
      if (disconnectPassmapButton) disconnectPassmapButton.classList.remove("hidden");
      if (directSaveButton) directSaveButton.title = "PASSMAP AI Inbox에 후보로 직접 저장";
      if (pairingCodeInput) pairingCodeInput.value = "";
      return connection;
    }
    setConnectionStatus(message || "PASSMAP 연결 필요");
    if (disconnectPassmapButton) disconnectPassmapButton.classList.add("hidden");
    if (directSaveButton) directSaveButton.title = "PASSMAP 연결 코드 입력 후 직접 저장을 사용할 수 있습니다.";
    return connection;
  } catch (error) {
    console.warn("[passmap-ext] connection status failed:", error);
    setConnectionStatus("PASSMAP 연결 상태를 확인할 수 없습니다.");
    return { connected: false };
  }
}

async function exchangePairingCode(code) {
  const response = await fetch(PAIRING_EXCHANGE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      code,
      clientName: DIRECT_SAVE_CLIENT_NAME,
    }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || body?.ok !== true || !body?.token) {
    throw new Error("PAIRING_EXCHANGE_FAILED");
  }
  return body;
}

async function connectPassmap() {
  hideDirectSaveCta();
  const code = normalizePairingCode(pairingCodeInput?.value);
  if (pairingCodeInput) pairingCodeInput.value = code;
  if (!code) {
    setConnectionStatus("PASSMAP 연결 코드를 입력해 주세요.");
    return;
  }

  if (connectPassmapButton) connectPassmapButton.disabled = true;
  setConnectionStatus("PASSMAP 연결 중입니다.");

  try {
    const data = await exchangePairingCode(code);
    await setLocalStorage({
      [DIRECT_SAVE_TOKEN_STORAGE_KEY]: data.token,
      [DIRECT_SAVE_TOKEN_EXPIRES_AT_KEY]: data.tokenExpiresAt || null,
      [DIRECT_SAVE_CLIENT_NAME_KEY]: data.clientName || DIRECT_SAVE_CLIENT_NAME,
      [DIRECT_SAVE_CONNECTED_AT_KEY]: new Date().toISOString(),
    });
    await refreshConnectionUi("PASSMAP 연결됨. 이제 현재 AI 대화를 Inbox 후보로 직접 저장할 수 있어요.");
    setStatus("PASSMAP 연결됨. 이제 현재 AI 대화를 Inbox 후보로 직접 저장할 수 있어요.");
  } catch (error) {
    console.warn("[passmap-ext] pairing exchange failed:", error);
    setConnectionStatus("연결 코드가 만료되었거나 올바르지 않습니다. PASSMAP에서 새 코드를 발급받아 다시 입력해 주세요.");
  } finally {
    if (connectPassmapButton) connectPassmapButton.disabled = false;
  }
}

async function disconnectPassmap() {
  hideDirectSaveCta();
  if (disconnectPassmapButton) disconnectPassmapButton.disabled = true;
  try {
    await removeLocalStorage([
      DIRECT_SAVE_TOKEN_STORAGE_KEY,
      DIRECT_SAVE_TOKEN_EXPIRES_AT_KEY,
      DIRECT_SAVE_CLIENT_NAME_KEY,
      DIRECT_SAVE_CONNECTED_AT_KEY,
    ]);
    await refreshConnectionUi("PASSMAP 연결이 해제되었습니다. 직접 저장을 쓰려면 다시 연결해 주세요.");
    setStatus("PASSMAP 연결이 해제되었습니다.");
  } catch (error) {
    console.warn("[passmap-ext] disconnect failed:", error);
    setConnectionStatus("연결 해제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
  } finally {
    if (disconnectPassmapButton) disconnectPassmapButton.disabled = false;
  }
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
  hideDirectSaveCta();
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

    const result = await postDirectSave(payload, token);
    setStatus("PASSMAP AI Inbox에 보냈습니다. 나중에 맞는 내용만 골라 이력서 재료로 확정할 수 있어요.");
    showDirectSaveCta(result?.inboxUrl);
  } catch (error) {
    console.warn("[passmap-ext] direct save failed:", error);
    setStatus("직접 저장 연결이 아직 필요합니다. 대신 PASSMAP 입력 화면으로 보내 저장할 수 있어요.");
  } finally {
    directSaveButton.disabled = false;
  }
}

async function saveCurrentConversation() {
  hideDirectSaveCta();
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
  hideDirectSaveCta();
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

refreshConnectionUi();

pairingCodeInput?.addEventListener("input", () => {
  pairingCodeInput.value = normalizePairingCode(pairingCodeInput.value);
});
pairingCodeInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    connectPassmap();
  }
});
connectPassmapButton?.addEventListener("click", connectPassmap);
disconnectPassmapButton?.addEventListener("click", disconnectPassmap);
directSaveButton.addEventListener("click", directSaveCurrentConversation);
saveCurrentButton.addEventListener("click", saveCurrentConversation);
saveSelectionButton.addEventListener("click", saveSelectedText);

openSavedInboxButton?.addEventListener("click", async () => {
  const inboxUrl = openSavedInboxButton.dataset.inboxUrl || DIRECT_SAVE_INBOX_FALLBACK_URL;
  try {
    await openUrl(inboxUrl);
    setStatus("PASSMAP AI Inbox를 열었습니다.");
  } catch (error) {
    console.warn("[passmap-ext] open saved inbox failed:", error);
    setStatus("PASSMAP AI Inbox를 열 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
});

openInboxButton.addEventListener("click", async () => {
  hideDirectSaveCta();
  try {
    await openPassmap();
    setStatus("PASSMAP을 열었습니다.");
  } catch (error) {
    console.warn("[passmap-ext] open PASSMAP failed:", error);
    setStatus("PASSMAP을 열 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
});
