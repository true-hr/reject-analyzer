const EMPLOYMENT_ALIASES = Object.freeze([
  {
    normalizedEmploymentType: "conversion_internship",
    labels: ["채용연계형 인턴", "전환형 인턴", "conversion internship"],
  },
  {
    normalizedEmploymentType: "experience_internship",
    labels: ["체험형 인턴", "체험 인턴", "experience internship"],
  },
  {
    normalizedEmploymentType: "internship",
    labels: ["인턴", "intern", "internship"],
  },
  {
    normalizedEmploymentType: "full_time",
    labels: ["정규직", "full-time", "full time", "풀타임", "상근"],
  },
  {
    normalizedEmploymentType: "contract",
    labels: ["계약직", "계약직원", "fixed-term", "contract"],
  },
  {
    normalizedEmploymentType: "dispatch",
    labels: ["파견직", "파견", "dispatch", "agency worker"],
  },
  {
    normalizedEmploymentType: "freelance",
    labels: ["프리랜서", "freelance", "freelancer"],
  },
  {
    normalizedEmploymentType: "founder_or_self_employed",
    labels: ["개인사업자", "자영업", "self-employed", "sole proprietor", "창업", "대표", "founder", "startup founder"],
  },
  {
    normalizedEmploymentType: "part_time",
    labels: ["아르바이트", "알바", "part-time job", "파트타임", "part-time", "시간제"],
  },
  {
    normalizedEmploymentType: "project_contract",
    labels: ["외주", "용역", "outsourcing", "프로젝트 계약", "프로젝트 단위 계약", "project contract"],
  },
  {
    normalizedEmploymentType: "training",
    labels: ["교육생", "trainee", "수강생", "부트캠프", "bootcamp", "집중 교육"],
  },
  {
    normalizedEmploymentType: "gap",
    labels: ["공백", "경력 공백", "gap", "진로탐색", "커리어 탐색", "career exploration"],
  },
  {
    normalizedEmploymentType: "military_service",
    labels: ["군복무", "군 복무", "military service"],
  },
  {
    normalizedEmploymentType: "leave_of_absence",
    labels: ["휴직", "leave of absence", "육아휴직", "병가"],
  },
  {
    normalizedEmploymentType: "unpaid_activity",
    labels: ["무급 활동", "대외활동", "동아리", "unpaid activity"],
  },
]);

function safeString(value) {
  return String(value ?? "").trim();
}

export function normalizeEmploymentLabel(value) {
  return safeString(value)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const ALIAS_INDEX = new Map(
  EMPLOYMENT_ALIASES.flatMap((entry) =>
    entry.labels.map((label) => [
      normalizeEmploymentLabel(label),
      {
        normalizedEmploymentType: entry.normalizedEmploymentType,
        matchedLabel: label,
      },
    ])
  )
);

export function classifyEmploymentType(value, options = {}) {
  const raw = safeString(value);
  if (!raw) {
    return {
      raw,
      normalizedEmploymentType: "unknown",
      confidence: "low",
      matchedLabel: null,
      warnings: ["missing_employment_type"],
    };
  }

  const normalized = normalizeEmploymentLabel(raw);
  const match = ALIAS_INDEX.get(normalized);
  if (match) {
    return {
      raw,
      normalizedEmploymentType: match.normalizedEmploymentType,
      confidence: "high",
      matchedLabel: match.matchedLabel,
      warnings: [],
    };
  }

  if (options.allowSubstringMatch === true) {
    for (const [label, entry] of ALIAS_INDEX.entries()) {
      if (label && normalized.includes(label)) {
        return {
          raw,
          normalizedEmploymentType: entry.normalizedEmploymentType,
          confidence: "medium",
          matchedLabel: entry.matchedLabel,
          warnings: [],
        };
      }
    }
  }

  return {
    raw,
    normalizedEmploymentType: "unknown",
    confidence: "low",
    matchedLabel: null,
    warnings: ["unknown_employment_type"],
  };
}
