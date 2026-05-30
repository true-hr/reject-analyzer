// content-passmap.js
// Runs only on the PASSMAP production domain at document_start.
//
// Responsibility: pick up a one-shot payload that background.js wrote to
// chrome.storage.local under BRIDGE_STORAGE_KEY, validate it, and write
// it into sessionStorage under PASSMAP_EXTERNAL_INTAKE — the key that the
// PASSMAP React app already consumes (see WorkTraceInput.jsx and
// WebWorkTraceRecordPage.jsx in the passmap repo, shipped via PR #517).
//
// Reload policy:
//   - Because we run at document_start, the React app has not mounted
//     yet, so a plain sessionStorage write is enough. No reload needed.
//   - As a defensive fallback, if the document is already past 'loading'
//     by the time storage.local resolves (unlikely but possible), we
//     reload once. The bridge key is deleted before the reload, so the
//     post-reload run finds nothing and we can never enter a loop.

const BRIDGE_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE_BRIDGE";
const SESSION_STORAGE_KEY = "PASSMAP_EXTERNAL_INTAKE";
const MIN_RAW_TEXT_LENGTH = 30;
const VALID_SOURCE_PLATFORMS = new Set(["chatgpt", "claude", "gemini", "browser_extension"]);
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes — covers tab-switch latency only

function _isValidPayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (payload.version !== 1) return false;
  if (payload.sourceMode !== "ai_conversation") return false;
  if (payload.importMethod !== "browser_extension_selection") return false;
  if (payload.sourcePlatform != null && !VALID_SOURCE_PLATFORMS.has(payload.sourcePlatform)) return false;
  if (typeof payload.rawText !== "string") return false;
  if (payload.rawText.trim().length < MIN_RAW_TEXT_LENGTH) return false;
  if (typeof payload.savedAt !== "number") return false;
  if (Date.now() - payload.savedAt > MAX_AGE_MS) return false;
  return true;
}

chrome.storage.local.get(BRIDGE_STORAGE_KEY, (items) => {
  if (chrome.runtime.lastError) {
    console.warn("[passmap-ext] storage.get failed:", chrome.runtime.lastError.message);
    return;
  }

  const payload = items?.[BRIDGE_STORAGE_KEY];
  if (!payload) return; // nothing to consume

  if (!_isValidPayload(payload)) {
    // Drop the bad entry so we never retry it.
    chrome.storage.local.remove(BRIDGE_STORAGE_KEY);
    console.warn("[passmap-ext] discarded invalid bridge payload");
    return;
  }

  // Re-savedAt so the PASSMAP receiver's own 1-hour TTL is anchored to
  // the moment the page actually sees the payload, not to the moment
  // the user clicked the context menu.
  const sessionPayload = {
    version: 1,
    sourceMode: payload.sourceMode,
    sourcePlatform: payload.sourcePlatform || "browser_extension",
    importMethod: payload.importMethod,
    privacyReviewRequired: payload.privacyReviewRequired === true,
    rawText: payload.rawText,
    savedAt: Date.now(),
  };

  let injected = false;
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
    injected = true;
  } catch (e) {
    console.error("[passmap-ext] sessionStorage write failed:", e);
  }

  // Always clear the bridge first — guarantees we cannot loop even if a
  // reload happens for any reason.
  chrome.storage.local.remove(BRIDGE_STORAGE_KEY, () => {
    if (chrome.runtime.lastError) {
      console.warn("[passmap-ext] storage.remove failed:", chrome.runtime.lastError.message);
    }
    // Defensive reload only when the app has likely already booted past
    // the initial sourceMode read. document_start usually means we are
    // still 'loading' — in that case the React mount will see the new
    // sessionStorage value naturally.
    if (injected && document.readyState !== "loading") {
      window.location.reload();
    }
  });
});
