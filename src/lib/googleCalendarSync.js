import { getSession } from "@/lib/auth.js";

// CAL-7D: fire-and-forget Google Calendar sync after record create.
// Skips silently when flag/token/URL is absent. Never throws to caller.
export async function syncWorkRecordToGoogleCalendar(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/sync-record`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    const resJson = await res.json();
    if (!res.ok || !resJson.ok) return;
  } catch (_) {}
}

// CAL-8E: fire-and-forget Google Calendar patch after record update.
// Sends only recordId; Worker reads the Calendar event id server-side.
export async function updateGoogleCalendarEventForWorkRecord(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/update-record-event`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    if (!res.ok) return;
    const resJson = await res.json();
    if (!resJson.ok) return;
  } catch (_) {}
}

// CAL-8F-1: awaited Google Calendar event delete before work_record row removal.
// Sends only recordId; Worker reads google_calendar_event_id server-side.
// Never throws — all failures are silently swallowed so PASSMAP delete always proceeds.
export async function deleteGoogleCalendarEventForWorkRecord(recordId) {
  if (import.meta.env.VITE_GOOGLE_CALENDAR_ENABLED !== "true") return;
  if (!recordId) return;
  const workerBase = (import.meta.env.VITE_AI_PROXY_URL || "").toString().trim();
  if (!workerBase) return;
  let accessToken = null;
  try {
    const session = await getSession();
    accessToken = session?.access_token ?? null;
  } catch (_) {}
  if (!accessToken) return;
  try {
    const res = await fetch(`${workerBase}/api/calendar/google/delete-record-event`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recordId }),
    });
    if (!res.ok) return;
    const resJson = await res.json();
    if (!resJson.ok) return;
  } catch (_) {}
}
