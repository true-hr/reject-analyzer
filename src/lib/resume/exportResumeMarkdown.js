function clean(value) {
  return String(value || "").trim();
}

function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function dateRange(startDate, endDate) {
  const start = clean(startDate);
  const end = clean(endDate);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function pushSection(lines, title, body) {
  const startLength = lines.length;
  lines.push(`## ${title}`);
  lines.push("");
  body();
  if (lines.length === startLength + 2) {
    lines.splice(startLength, 2);
    return;
  }
  lines.push("");
}

function skillLines(skills = {}) {
  const buckets = [
    ["Technical", skills.technical],
    ["Tools", skills.tools],
    ["Domain", skills.domain],
    ["Language", skills.language],
    ["Certificates", skills.certificates],
  ];
  return buckets
    .map(([label, items]) => [label, list(items).map(clean).filter(Boolean)])
    .filter(([, items]) => items.length)
    .map(([label, items]) => `- ${label}: ${items.join(", ")}`);
}

export function exportResumeMarkdown(profile = {}) {
  const lines = [];
  const identity = profile.identity || {};
  const headline = profile.headline || {};
  const name = clean(identity.name) || "Resume";
  const contacts = [identity.email, identity.phone, identity.location, ...list(identity.links)]
    .map(clean)
    .filter(Boolean);

  lines.push(`# ${name}`);
  if (contacts.length) lines.push(contacts.join(" | "));
  lines.push("");

  if (clean(headline.summary)) {
    pushSection(lines, "Summary", () => {
      lines.push(clean(headline.summary));
    });
  }

  pushSection(lines, "Experience", () => {
    list(profile.experiences).forEach((item) => {
      const title = [item.title, item.company].map(clean).filter(Boolean).join(" | ") || "Experience";
      lines.push(`### ${title}`);
      const meta = [dateRange(item.startDate, item.endDate), item.employmentType].map(clean).filter(Boolean);
      if (meta.length) lines.push(meta.join(" | "));
      list(item.bullets).forEach((bullet) => {
        const text = clean(bullet?.text || bullet);
        if (text) lines.push(`- ${text}`);
      });
      lines.push("");
    });
  });

  pushSection(lines, "Projects", () => {
    list(profile.projects).forEach((item) => {
      lines.push(`### ${clean(item.name) || "Project"}`);
      const meta = [item.role, dateRange(item.startDate, item.endDate)].map(clean).filter(Boolean);
      if (meta.length) lines.push(meta.join(" | "));
      list(item.bullets).forEach((bullet) => {
        const text = clean(bullet?.text || bullet);
        if (text) lines.push(`- ${text}`);
      });
      lines.push("");
    });
  });

  pushSection(lines, "Skills", () => {
    skillLines(profile.skills).forEach((line) => lines.push(line));
  });

  pushSection(lines, "Education", () => {
    list(profile.education).forEach((item) => {
      const title = [item.school, item.major, item.degree].map(clean).filter(Boolean).join(" | ") || "Education";
      lines.push(`### ${title}`);
      const range = dateRange(item.startDate, item.endDate);
      if (range) lines.push(range);
      lines.push("");
    });
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export default exportResumeMarkdown;
