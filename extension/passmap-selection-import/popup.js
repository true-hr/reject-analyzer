const BRIDGE_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE_BRIDGE";
const PASSMAP_URL = "https://passmap-app.vercel.app/#work-trace-intake";
const MIN_RAW_TEXT_LENGTH = 30;
const MAX_RAW_TEXT_LENGTH = 50000;

const saveCurrentButton = document.getElementById("saveCurrent");
const saveSelectionButton = document.getElementById("saveSelection");
const openInboxButton = document.getElementById("openInbox");
const statusEl = document.getElementById("status");

function setStatus(message) {
  statusEl.textContent = message || "";
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
      "채팅 기록",
      "새 채팅",
      "라이브러리",
      "프로젝트",
      "고정됨",
      "공유하기",
      "ChatGPT는 실수를 할 수 있습니다",
    ];
    return contaminationSignals.filter((signal) => text.includes(signal)).length >= 2;
  }

  function cloneWithoutUiContainers(root) {
    const clone = root.cloneNode(true);
    const uiSelectors = [
      "nav",
      "aside",
      "header",
      "footer",
      "form",
      "textarea",
      "[contenteditable='true']",
      "[role='navigation']",
      "[aria-label*='Sidebar']",
      "[aria-label*='사이드바']",
    ];
    for (const node of Array.from(clone.querySelectorAll(uiSelectors.join(",")))) {
      node.remove();
    }
    return clone;
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
      "main article",
      "main [role='article']",
      "main div[data-testid]",
      "article",
      "[data-testid*='conversation']",
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
        const text = filterChatGptUiText(node.innerText || node.textContent || "");
        if (text.length < 10) continue;
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
          };
        }
      }

      const mainText = filterChatGptUiText(
        cloneWithoutUiContainers(document.querySelector("main") || document.body).innerText || ""
      );
      if (mainText.length >= minRawTextLength) {
        return {
          rawText: normalizeMessageText(
            `[ChatGPT 대화 캡처]\n제목: ${document.title || ""}\nURL: ${location.href}\n\n${mainText}`
          ).slice(0, maxRawTextLength),
          captureQuality: "chatgpt_main_filtered",
          messageCount: messages.length,
        };
      }

      const bodyText = filterChatGptUiText(document.body?.innerText || "");
      if (bodyText.length < minRawTextLength) return null;
      return {
        rawText: normalizeMessageText(
          `[ChatGPT 대화 캡처]\n제목: ${document.title || ""}\nURL: ${location.href}\n\n${bodyText}`
        ).slice(0, maxRawTextLength),
        captureQuality: "chatgpt_body_filtered",
        messageCount: messages.length,
      };
    } catch (error) {
      console.warn("[passmap-ext] ChatGPT message capture fallback:", error);
      return null;
    }
  }

  const host = location.hostname.toLowerCase();
  const isChatGpt = isChatGptPage(host);
  const captured = isChatGpt ? captureChatGptConversation() : null;
  const fallback = captured || (isChatGpt
    ? {
        rawText: filterChatGptUiText(document.querySelector("main")?.innerText || document.body?.innerText || "")
          .slice(0, maxRawTextLength),
        captureQuality: "chatgpt_filtered_fallback",
        messageCount: 0,
      }
    : getBodyFallback());

  return {
    sourceUrl: location.href,
    sourceTitle: document.title || "",
    capturedAt: Date.now(),
    sourcePlatform: inferPageSourcePlatform(),
    rawText: fallback.rawText,
    captureQuality: fallback.captureQuality,
    messageCount: fallback.messageCount,
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

async function saveCurrentConversation() {
  saveCurrentButton.disabled = true;
  setStatus("현재 페이지 내용을 확인하는 중입니다.");

  try {
    const tab = await getActiveTab();
    const capture = await executeCapture(tab.id);
    const rawText = typeof capture?.rawText === "string" ? capture.rawText.trim() : "";

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
    setStatus("PASSMAP에서 내용을 검토해 주세요.");
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
