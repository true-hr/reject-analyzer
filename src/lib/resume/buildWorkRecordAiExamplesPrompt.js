export function buildWorkRecordAiExamplesPrompt({
  currentCareerRoleLabel = "",
  currentJobId = "",
  guideTitle = "",
  guideQuestions = [],
  guideExample = "",
  roleTags = [],
  collaborationTags = [],
  resultTags = [],
  draftText = "",
}) {
  const jobLabel = currentCareerRoleLabel || currentJobId || "직무 미입력";
  const roleTagsText = roleTags.length ? roleTags.join(", ") : "없음";
  const collabTagsText = collaborationTags.length ? collaborationTags.join(", ") : "없음";
  const resultTagsText = resultTags.length ? resultTags.join(", ") : "없음";
  const draft = draftText.trim() || "(없음)";
  const questionLines = guideQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n");

  return `당신은 주간 업무 기록 작성 보조 AI입니다.
아래 정보를 바탕으로 실제 업무 기록 예시 문장 2–3개를 만들어주세요.

직무: ${jobLabel}
업무 유형 태그: ${roleTagsText}
협업 맥락 태그: ${collabTagsText}
기억할 성과/변화 태그: ${resultTagsText}
현재 작성 중인 초안: ${draft}
가이드 제목: ${guideTitle}
가이드 질문:
${questionLines || "없음"}
가이드 예시: ${guideExample || "없음"}

규칙:
- 수치, 툴명, 외부 이해관계자 정보는 입력에 명확히 있을 때만 사용하세요.
- 입력이 부족하면 보수적으로 작성하고, 모호한 표현은 피하세요.
- 각 예시는 하나의 자연스러운 한국어 문장 또는 2개 이하의 짧은 문장으로 작성하세요.
- 이력서가 아닌 주간 메모 수준의 자연스러운 문체로 쓰세요.
- resultSuggestions는 짧은 한국어 태그로, 2개 이하로 제안하고, 없으면 빈 배열로 두세요.
- 한국어로만 응답하세요.
- 반드시 아래 JSON 형식만 반환하세요:
{
  "examples": [
    {
      "title": "예시 유형 (예: 무난한 기록형)",
      "text": "주간 기록 예시 문장",
      "resultSuggestions": ["태그1"]
    }
  ],
  "warnings": []
}`;
}
