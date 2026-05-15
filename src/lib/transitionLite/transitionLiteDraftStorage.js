const LS_EXPERIENCED_DRAFT_KEY = "passmap:transition-lite:experienced:draft:v1";
const LS_NEWGRAD_DRAFT_KEY = "passmap:transition-lite:newgrad:draft:v1";
const LS_LAST_AUDIENCE_KEY = "passmap:transition-lite:last-audience:v1";

function draftKeyFor(audience) {
  return audience === "newgrad" ? LS_NEWGRAD_DRAFT_KEY : LS_EXPERIENCED_DRAFT_KEY;
}

export function safeReadTransitionLiteLastAudience() {
  try {
    const val = window.localStorage.getItem(LS_LAST_AUDIENCE_KEY);
    if (val === "newgrad" || val === "experienced") return val;
  } catch {}
  return null;
}

export function saveTransitionLiteLastAudience(audience) {
  try {
    window.localStorage.setItem(LS_LAST_AUDIENCE_KEY, String(audience || ""));
  } catch {}
}

export function readTransitionLiteDraft(audience) {
  try {
    const raw = window.localStorage.getItem(draftKeyFor(audience));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {}
  return null;
}

export function saveTransitionLiteDraft(audience, draft) {
  try {
    window.localStorage.setItem(draftKeyFor(audience), JSON.stringify(draft));
  } catch {}
}

export function clearTransitionLiteDraft(audience) {
  try {
    window.localStorage.removeItem(draftKeyFor(audience));
  } catch {}
}
