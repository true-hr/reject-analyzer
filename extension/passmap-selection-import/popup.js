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
  const rawText = (document.body?.innerText || "").trim().slice(0, 50000);
  return {
    sourceUrl: location.href,
    sourceTitle: document.title || "",
    capturedAt: Date.now(),
    sourcePlatform: (() => {
      const host = location.hostname.toLowerCase();
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
    })(),
    rawText,
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
