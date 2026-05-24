// background.js
// Service worker for the PASSMAP selection-import MV3 extension.
//
// Flow:
//   1. On install/update, register a context-menu entry for selected text.
//   2. When the user clicks the menu, validate the selection.
//   3. Store the payload in chrome.storage.local under a bridge key.
//   4. Open the PASSMAP production URL in a new tab — the content script
//      on that domain reads the bridge value and writes it into
//      sessionStorage under PASSMAP_EXTERNAL_INTAKE, which the PASSMAP
//      React app already knows how to consume.
//
// No external network calls. No DOM scraping of source sites. Only the
// text the user explicitly selected is forwarded.

const CONTEXT_MENU_ID = "send-selection-to-passmap";
const CONTEXT_MENU_TITLE = "패스맵에서 경험 찾기";
const BRIDGE_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE_BRIDGE";
// The hash is a weak intent hint only — it carries no payload, and PASSMAP
// auto-navigates from the sessionStorage value the content script writes.
// Opening the bare URL still works for users without the extension.
const PASSMAP_URL = "https://passmap-app.vercel.app/#work-trace-intake";
const MIN_RAW_TEXT_LENGTH = 30;
const MAX_RAW_TEXT_LENGTH = 50000;

function createContextMenu() {
  chrome.contextMenus.create(
    {
      id: CONTEXT_MENU_ID,
      title: CONTEXT_MENU_TITLE,
      contexts: ["selection"],
    },
    () => {
      // Suppress duplicate-id errors on reinstall by reading lastError.
      if (chrome.runtime.lastError) {
        console.warn("[passmap-ext] context menu create:", chrome.runtime.lastError.message);
      }
    }
  );
}

chrome.runtime.onInstalled.addListener(() => {
  // Remove any stale entry first so version bumps re-register cleanly.
  chrome.contextMenus.removeAll(() => {
    createContextMenu();
  });
});

// Service workers may also start cold without an install event — register
// on startup so the menu survives a browser restart.
chrome.runtime.onStartup?.addListener?.(() => {
  chrome.contextMenus.removeAll(() => {
    createContextMenu();
  });
});

function _normalizeSelectionText(raw) {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  if (trimmed.length < MIN_RAW_TEXT_LENGTH) return "";
  if (trimmed.length > MAX_RAW_TEXT_LENGTH) return trimmed.slice(0, MAX_RAW_TEXT_LENGTH);
  return trimmed;
}

chrome.contextMenus.onClicked.addListener((info, _tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  const rawText = _normalizeSelectionText(info.selectionText);
  if (!rawText) {
    console.warn(
      `[passmap-ext] selection ignored: needs at least ${MIN_RAW_TEXT_LENGTH} characters`
    );
    return;
  }

  const payload = {
    version: 1,
    sourceMode: "ai_conversation",
    importMethod: "browser_extension_selection",
    rawText,
    savedAt: Date.now(),
  };

  chrome.storage.local.set({ [BRIDGE_STORAGE_KEY]: payload }, () => {
    if (chrome.runtime.lastError) {
      console.error("[passmap-ext] storage.set failed:", chrome.runtime.lastError.message);
      return;
    }
    chrome.tabs.create({ url: PASSMAP_URL }, (newTab) => {
      if (chrome.runtime.lastError) {
        console.error("[passmap-ext] tabs.create failed:", chrome.runtime.lastError.message);
        return;
      }
      // The new tab will load the PASSMAP domain; the content script
      // there will pick up the bridge value at document_start.
      void newTab;
    });
  });
});
