export const HR_RECRUITING_RECORD_PRESET = {
  jobId: "JOB_HR_ORGANIZATION_RECRUITING",
  label: "채용(Recruiting)",
  workTypeExtensions: [],
  trackWorkTypePresets: {
    weekly: [
      "후보자 검토",
      "채용 공고 점검",
      "면접 일정 조율",
      "후보자 파이프라인 관리",
      "서류 평가 기준 확인",
      "면접 피드백 정리",
      "채용 현황 리포트 작성",
    ],
    project: [
      "채용 프로세스 개선",
      "인재풀 구축",
      "채용 브랜딩 개선",
      "면접 평가 체계 정리",
      "채용 채널 성과 분석",
      "후보자 경험 개선",
      "채용 지표 관리 체계 구축",
    ],
  },
  collaborationExtensions: [
    { id: "rec_collab_hiring_leader", label: "현업 리더" },
    { id: "rec_collab_interviewer", label: "면접관" },
    { id: "rec_collab_candidate", label: "후보자" },
    { id: "rec_collab_hr", label: "인사팀" },
    { id: "rec_collab_headhunter", label: "헤드헌터" },
    { id: "rec_collab_platform", label: "채용 플랫폼" },
    { id: "rec_collab_executive", label: "경영진" },
  ],
  followUpExtensions: [
    { id: "rec_result_pipeline", label: "후보자 파이프라인 개선" },
    { id: "rec_result_time_to_hire", label: "채용 소요시간 단축" },
    { id: "rec_result_interview_conversion", label: "면접 전환율 개선" },
    { id: "rec_result_talent_pool", label: "인재풀 질적 개선" },
    { id: "rec_result_candidate_exp", label: "후보자 경험 개선" },
    { id: "rec_result_criteria", label: "채용 기준 명확화" },
    { id: "rec_result_goal", label: "채용 목표 달성률 개선" },
  ],
  placeholders: {
    weekly:
      "예: 이번 주에는 후보자 서류를 검토하고 면접 일정을 조율했으며, 채용 현황을 현업 리더에게 공유했어요.",
    project: "",
  },
  sampleRecords: {
    weekly: {
      text: "현업 리더와 면접 기준을 조율하고 최종 면접을 진행했으며, 합격 후보자에게 입사 절차를 안내하고 채용 현황을 정리했어요.",
      roleTags: ["후보자 검토", "면접 일정 조율", "채용 현황 리포트 작성"],
      collaborationTags: ["현업 리더", "후보자"],
      resultTags: ["면접 전환율 개선", "채용 기준 명확화"],
    },
  },
};
