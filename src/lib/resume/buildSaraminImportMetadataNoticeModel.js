const SECTION_LABELS = {
  basicInfo: "기본정보",
  personalInfo: "인적사항",
  highSchool: "고등학교",
  university: "대학교",
  graduateSchool: "대학원",
  experience: "경력",
  attachedCareerDescription: "경력기술서",
  awardsLanguageEtc: "어학/자격/수상/기타",
  officialLanguageTest: "공인외국어시험",
  certificates: "자격증",
  activitiesEducation: "경험/활동/교육",
  coverLetter: "자기소개서",
  motivation: "지원동기",
  relatedExperience: "관련 경험",
  postHirePlan: "입사 후 포부",
};

const WARNING_LABELS = {
  section_boundary_unclear: "섹션 경계를 검수해 주세요.",
  cover_letter_mixed_with_resume: "자기소개서 분리 여부를 검수해 주세요.",
  company_specific_content: "회사 맞춤 표현은 후보로만 확인해 주세요.",
  date_parse_uncertain: "기간 해석을 검수해 주세요.",
  employment_type_uncertain: "고용 형태를 검수해 주세요.",
  source_platform_uncertain: "출처 판별 신뢰도를 검수해 주세요.",
};

function roleLabel(role) {
  if (role === "resume_plus_cover_letter") return "이력서 + 자기소개서";
  if (role === "resume") return "이력서";
  return "미확인";
}

function sectionLabel(key) {
  return SECTION_LABELS[key] || key;
}

function pickVisibleSections(detectedSections, limit = 6) {
  const priority = ["experience", "education", "university", "certificates", "coverLetter", "motivation", "relatedExperience", "postHirePlan"];
  const picked = [];
  for (const key of priority) {
    if (detectedSections.includes(key) && !picked.includes(key)) picked.push(key);
    if (picked.length >= limit) return picked;
  }
  for (const key of detectedSections) {
    if (!picked.includes(key)) picked.push(key);
    if (picked.length >= limit) return picked;
  }
  return picked;
}

export function buildSaraminImportMetadataNoticeModel(meta) {
  const data = meta?.resumeImportMetadata || null;
  if (!data || data.sourcePlatform !== "saramin") return null;

  const detectedSections = Array.isArray(data.detectedSections)
    ? data.detectedSections.filter(Boolean)
    : [];
  const warnings = Array.isArray(data.importWarnings)
    ? data.importWarnings.filter(Boolean).slice(0, 3)
    : [];

  return {
    title: "사람인 이력서 형식으로 감지되었습니다.",
    description: "가져온 항목은 아직 검수 전 후보입니다.",
    platformLabel: "사람인",
    sourceDocumentRole: data.sourceDocumentRole || "unknown",
    sourceDocumentRoleLabel: roleLabel(data.sourceDocumentRole),
    textExtractable: data.textExtractable === true,
    ocrRequired: data.ocrRequired === true,
    sectionCount: detectedSections.length,
    sectionLabels: pickVisibleSections(detectedSections, 6).map(sectionLabel),
    hiddenSectionCount: Math.max(0, detectedSections.length - 6),
    reviewRequired: data.reviewRequired === true,
    warningLabels: warnings.map((warning) => WARNING_LABELS[warning] || warning),
    hasResumeProfileCandidate: Boolean(data.resumeProfileCandidate),
    hasEvidenceBankCandidate: Boolean(data.evidenceBankCandidate),
    hasCoverLetterSeparation: data.sourceDocumentRole === "resume_plus_cover_letter",
    actionLabels: ["검수 필요", "후보 확인"],
  };
}

export default buildSaraminImportMetadataNoticeModel;
