function toIsoDate(value) {
  return String(value || "").trim().slice(0, 10);
}

function toIcsDate(isoDate) {
  return isoDate.replace(/-/g, "");
}

function escapeIcsText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function foldIcsLine(line) {
  // RFC 5545: fold at 75 octets (bytes), not characters — Korean is 3 bytes/char in UTF-8
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8");
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;
  const chunks = [];
  let pos = 0;
  let isFirst = true;
  while (pos < bytes.length) {
    const maxBytes = isFirst ? 75 : 74;
    let end = Math.min(pos + maxBytes, bytes.length);
    // Don't split inside a UTF-8 multi-byte sequence (continuation bytes: 10xxxxxx)
    while (end > pos && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    chunks.push(isFirst ? decoder.decode(bytes.slice(pos, end)) : " " + decoder.decode(bytes.slice(pos, end)));
    pos = end;
    isFirst = false;
  }
  return chunks.join("\r\n");
}

function nextIsoDate(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function groupRecordsByDate(records) {
  const map = {};
  (Array.isArray(records) ? records : []).forEach((record) => {
    const date = toIsoDate(record?.date);
    if (!date) return;
    if (!map[date]) map[date] = { date, records: [] };
    map[date].records.push(record);
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export function buildPassmapDailyCalendarEvents(records) {
  const groups = groupRecordsByDate(records);
  return groups.map(({ date, records: dayRecords }) => {
    const lines = ["[PASSMAP 업무 기록]"];

    dayRecords.forEach((record) => {
      const text = String(
        record?.title || record?.summary || record?.name || record?.content || ""
      ).trim();
      if (text) lines.push(`• ${text}`);
    });

    const sentences = dayRecords
      .map((r) => String(r?.reflectedSentence || "").trim())
      .filter(Boolean);
    if (sentences.length > 0) {
      lines.push("", "[이력서 문장]");
      sentences.forEach((s) => lines.push(s));
    }

    const tags = [
      ...new Set(
        dayRecords.flatMap((r) =>
          Array.isArray(r?.strengthTags)
            ? r.strengthTags.map((t) => String(t).trim()).filter(Boolean)
            : []
        )
      ),
    ];
    if (tags.length > 0) {
      lines.push("", "[태그]");
      lines.push(tags.map((t) => `#${t}`).join(" "));
    }

    return {
      id: `passmap-daily-${date}`,
      summary: `PASSMAP | ${date} 업무 기록`,
      start: { date },
      end: { date: nextIsoDate(date) },
      description: lines.join("\n"),
      visibility: "private",
      transparency: "transparent",
      reminders: { useDefault: false, overrides: [] },
      extendedProperties: {
        private: {
          passmapRecordDate: date,
          passmapSyncType: "daily_summary",
        },
      },
    };
  });
}

export function downloadPassmapCalendarIcs(records, options = {}) {
  const events = buildPassmapDailyCalendarEvents(records);
  if (events.length === 0) return false;

  const filename = options?.filename ?? "passmap-calendar-records.ics";
  const now = new Date();
  const dtstamp = [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, "0"),
    String(now.getUTCDate()).padStart(2, "0"),
    "T",
    String(now.getUTCHours()).padStart(2, "0"),
    String(now.getUTCMinutes()).padStart(2, "0"),
    String(now.getUTCSeconds()).padStart(2, "0"),
    "Z",
  ].join("");

  const vevents = events.map((event) =>
    [
      "BEGIN:VEVENT",
      foldIcsLine(`UID:${event.id}@passmap.app`),
      foldIcsLine(`DTSTAMP:${dtstamp}`),
      foldIcsLine(`DTSTART;VALUE=DATE:${toIcsDate(event.start.date)}`),
      foldIcsLine(`DTEND;VALUE=DATE:${toIcsDate(event.end.date)}`),
      foldIcsLine(`SUMMARY:${escapeIcsText(event.summary)}`),
      foldIcsLine(`DESCRIPTION:${escapeIcsText(event.description)}`),
      "CLASS:PRIVATE",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    ].join("\r\n")
  );

  // RFC 5545: VCALENDAR must end with a CRLF after END:VCALENDAR
  const icsContent =
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//PASSMAP//Calendar Export//KO",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      ...vevents,
      "END:VCALENDAR",
    ].join("\r\n") + "\r\n";

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return true;
}
