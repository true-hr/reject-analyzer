function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeToken(value) {
  return toStr(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

export const NEWGRAD_STAKEHOLDER_TAXONOMY = Object.freeze({
  customer_user: {
    displayLabel: "고객/사용자",
    aliases: [
      "customer",
      "user",
      "client_customer",
      "customer_user",
      "고객",
      "사용자",
      "유저",
    ],
    category: "external",
  },
  candidate_applicant: {
    displayLabel: "지원자/후보자",
    aliases: [
      "candidate",
      "applicant",
      "recruiting",
      "interview",
      "candidate_applicant",
      "지원자",
      "후보자",
      "채용",
      "면접",
      "지원자 / 후보자",
      "지원자/후보자",
    ],
    category: "external",
  },
  learner_participant: {
    displayLabel: "학습자/참여자",
    aliases: [
      "learner",
      "participant",
      "student",
      "learner_participant",
      "학습자",
      "참여자",
      "수강생",
      "학생",
      "learner / participant",
      "학습자 / 참여자",
    ],
    category: "external",
  },
  public_citizen: {
    displayLabel: "시민/민원인/공공 이용자",
    aliases: [
      "public",
      "citizen",
      "public_external",
      "complainant",
      "public_citizen",
      "시민",
      "민원인",
      "공공 이용자",
      "시민 / 공공 이용자",
      "공공 사용자",
      "resident",
      "municipality",
      "주민",
      "지자체",
    ],
    category: "external",
  },
  internal_team: {
    displayLabel: "소속 팀/동료",
    aliases: [
      "internal_team",
      "same_team",
      "team_member",
      "내부 팀원",
      "사내 팀원",
      "팀원",
      "동료",
      "내부팀",
    ],
    category: "internal",
  },
  cross_function_partner: {
    displayLabel: "타직무 협업 상대",
    aliases: [
      "cross_function",
      "cross_function_internal",
      "cross functional",
      "cross-functional",
      "developer_designer_ops",
      "cross_function_partner",
      "타부서",
      "타직무",
      "타직무 협업 상대",
      "협업 부서",
      "개발/디자인/운영",
      "개발자",
      "디자이너",
      "운영팀",
      "operator",
      "planner",
    ],
    category: "internal",
  },
  manager_reviewer: {
    displayLabel: "리더/검토자",
    aliases: [
      "manager",
      "reviewer",
      "hiring_manager",
      "mentor",
      "professor",
      "hiring manager",
      "manager_reviewer",
      "리더",
      "검토자",
      "면접관",
      "매니저",
      "멘토",
      "교수",
      "리더 / 검토자",
    ],
    category: "internal_or_boundary",
  },
  external_partner_vendor: {
    displayLabel: "협력사/외부 파트너",
    aliases: [
      "external_partner",
      "vendor",
      "supplier",
      "agency",
      "partner",
      "external_partner_vendor",
      "외부 파트너",
      "협력사",
      "거래처",
      "벤더",
      "대행사",
      "파트너",
      "공급사",
    ],
    category: "external",
  },
  field_practitioner_operator: {
    displayLabel: "현업 실무자/운영 담당자",
    aliases: [
      "field_practitioner",
      "operator",
      "practitioner",
      "field_practitioner_operator",
      "현업 실무자",
      "현업 담당자",
      "실무자",
      "운영 담당자",
      "운영자",
    ],
    category: "boundary",
  },
  executive_decision_maker: {
    displayLabel: "의사결정자",
    aliases: [
      "executive",
      "decision_maker",
      "executive_management",
      "의사결정자",
      "임원",
      "경영진",
    ],
    category: "boundary",
  },
  community_audience: {
    displayLabel: "커뮤니티/행사 참여자",
    aliases: [
      "audience",
      "community",
      "event_participant",
      "community_audience",
      "커뮤니티",
      "행사 참여자",
      "참여자 audience",
      "청중",
      "오디언스",
    ],
    category: "external",
  },
  mixed_stakeholders: {
    displayLabel: "복합 이해관계자",
    aliases: [
      "mixed",
      "mixed_stakeholders",
      "다양하게 경험함",
      "다양한 이해관계자",
      "다양한 대상",
      "복합 이해관계자",
    ],
    category: "mixed",
  },
  unknown_other: {
    displayLabel: "기타",
    aliases: [
      "other",
      "unknown",
      "unknown_other",
      "기타",
      "미상",
      "알 수 없음",
    ],
    category: "unknown",
  },
});

const STAKEHOLDER_KEY_BY_TOKEN = (() => {
  const index = new Map();
  for (const [key, entry] of Object.entries(NEWGRAD_STAKEHOLDER_TAXONOMY)) {
    const tokens = [key, entry.displayLabel, ...(Array.isArray(entry.aliases) ? entry.aliases : [])];
    for (const token of tokens) {
      const normalized = normalizeToken(token);
      if (!normalized || index.has(normalized)) continue;
      index.set(normalized, key);
    }
  }
  return index;
})();

export function resolveNewgradStakeholderKey(rawValue) {
  const raw = toStr(rawValue);
  if (!raw) return "";
  return STAKEHOLDER_KEY_BY_TOKEN.get(normalizeToken(raw)) || "unknown_other";
}

export function resolveNewgradStakeholderDisplayLabel(key) {
  const normalizedKey = toStr(key);
  if (!normalizedKey) return "";
  return NEWGRAD_STAKEHOLDER_TAXONOMY[normalizedKey]?.displayLabel || normalizedKey;
}
