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

function addSection(lines, title, body) {
  const before = lines.length;
  lines.push(title);
  body();
  if (lines.length === before + 1) {
    lines.splice(before, 1);
    return;
  }
  lines.push("");
}

function addBullets(lines, bullets) {
  list(bullets).forEach((bullet) => {
    const text = clean(bullet?.text || bullet);
    if (text) lines.push(`- ${text}`);
  });
}

export function exportResumeText(profile = {}) {
  const lines = [];
  const identity = profile.identity || {};
  const headline = profile.headline || {};
  const contacts = [identity.email, identity.phone, identity.location, ...list(identity.links)]
    .map(clean)
    .filter(Boolean);

  addSection(lines, "기본 정보", () => {
    lines.push(`이름: ${clean(identity.name) || "정보 없음"}`);
    if (contacts.length) lines.push(`연락처: ${contacts.join(" / ")}`);
  });

  addSection(lines, "요약", () => {
    if (clean(headline.summary)) lines.push(clean(headline.summary));
  });

  addSection(lines, "경력", () => {
    list(profile.experiences).forEach((item) => {
      const heading = [item.company, item.title].map(clean).filter(Boolean).join(" / ") || "경력 정보";
      lines.push(heading);
      const meta = [dateRange(item.startDate, item.endDate), item.employmentType].map(clean).filter(Boolean);
      if (meta.length) lines.push(meta.join(" / "));
      addBullets(lines, item.bullets);
      lines.push("");
    });
  });

  addSection(lines, "프로젝트", () => {
    list(profile.projects).forEach((item) => {
      lines.push(clean(item.name) || "프로젝트 정보");
      const meta = [item.role, dateRange(item.startDate, item.endDate)].map(clean).filter(Boolean);
      if (meta.length) lines.push(meta.join(" / "));
      addBullets(lines, item.bullets);
      lines.push("");
    });
  });

  addSection(lines, "스킬", () => {
    const skills = profile.skills || {};
    [
      ["기술", skills.technical],
      ["도구", skills.tools],
      ["도메인", skills.domain],
      ["언어", skills.language],
      ["자격", skills.certificates],
    ].forEach(([label, items]) => {
      const values = list(items).map(clean).filter(Boolean);
      if (values.length) lines.push(`${label}: ${values.join(", ")}`);
    });
  });

  addSection(lines, "학력", () => {
    list(profile.education).forEach((item) => {
      const heading = [item.school, item.major, item.degree].map(clean).filter(Boolean).join(" / ") || "학력 정보";
      lines.push(heading);
      const range = dateRange(item.startDate, item.endDate);
      if (range) lines.push(range);
    });
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export default exportResumeText;
