import { getSession } from "@/lib/auth.js";

function normalizeWorkerBase() {
  return String(import.meta.env.VITE_AI_PROXY_URL || "").trim().replace(/\/+$/, "");
}

export async function previewGoogleCalendarEvents({
  timeMin,
  timeMax,
  calendarId = "primary",
  maxResults = 20,
} = {}) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") {
    return { ok: false, candidates: [], error: "google_calendar_disabled" };
  }

  const workerBase = normalizeWorkerBase();
  if (!workerBase) {
    return { ok: false, candidates: [], error: "google_calendar_proxy_missing" };
  }

  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch {
    accessToken = null;
  }

  if (!accessToken) {
    return { ok: false, candidates: [], error: "google_calendar_auth_required" };
  }

  const res = await fetch(`${workerBase}/api/calendar/google/events/preview`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      calendarId,
      maxResults,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.ok) {
    return {
      ok: false,
      candidates: [],
      error: data?.error || "google_calendar_candidates_failed",
    };
  }
  return {
    ok: true,
    candidates: Array.isArray(data.candidates) ? data.candidates : [],
  };
}
