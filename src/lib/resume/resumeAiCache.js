export function normalizeAiResumeBullets(value) {
  return Array.isArray(value)
    ? value
        .map((bullet) => ({
          ...bullet,
          text: String(bullet?.text || "").trim(),
        }))
        .filter((bullet) => bullet.text)
    : [];
}

const RESUME_AI_DIRECT_CACHE_KEY = "passmap_resume_ai_direct_bullets_v1";
let resumeAiDirectBulletsMemoryCache = [];

export function readResumeAiDirectBulletsCache() {
  if (resumeAiDirectBulletsMemoryCache.length > 0) {
    return resumeAiDirectBulletsMemoryCache;
  }
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(RESUME_AI_DIRECT_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const bullets = normalizeAiResumeBullets(parsed?.bullets);
    resumeAiDirectBulletsMemoryCache = bullets;
    return bullets;
  } catch {
    return [];
  }
}

export function writeResumeAiDirectBulletsCache(bullets) {
  const normalized = normalizeAiResumeBullets(bullets);
  resumeAiDirectBulletsMemoryCache = normalized;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        RESUME_AI_DIRECT_CACHE_KEY,
        JSON.stringify({
          bullets: normalized,
          savedAt: Date.now(),
        })
      );
    } catch {
      // ignore storage errors
    }
  }
  return normalized;
}

export function clearResumeAiDirectBulletsCache() {
  resumeAiDirectBulletsMemoryCache = [];
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(RESUME_AI_DIRECT_CACHE_KEY);
    } catch {
      // ignore storage errors
    }
  }
}

const RESUME_AI_DIRECT_PENDING_KEY = "passmap_resume_ai_direct_pending_v1";
let resumeAiDirectPendingMemoryCache = false;

export function readResumeAiDirectPendingCache() {
  if (resumeAiDirectPendingMemoryCache) {
    return true;
  }
  if (typeof window === "undefined") return false;
  try {
    const raw = window.sessionStorage.getItem(RESUME_AI_DIRECT_PENDING_KEY);
    return raw === "true";
  } catch {
    return false;
  }
}

export function writeResumeAiDirectPendingCache() {
  resumeAiDirectPendingMemoryCache = true;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(RESUME_AI_DIRECT_PENDING_KEY, "true");
    } catch {
      // ignore storage errors
    }
  }
}

export function clearResumeAiDirectPendingCache() {
  resumeAiDirectPendingMemoryCache = false;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(RESUME_AI_DIRECT_PENDING_KEY);
    } catch {
      // ignore storage errors
    }
  }
}
