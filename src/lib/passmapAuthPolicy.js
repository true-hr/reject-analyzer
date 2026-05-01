// PASSMAP Auth Policy SSOT
// Rule: "Show first value without login; require login only for save/accumulate/re-read/sensitive/per-user DB."

export const PASSMAP_AUTH_POLICY = {
  // No login required — open access
  publicFeatures: [
    "landing",
    "sample_report",
    "job_industry_analysis_run",
    "job_industry_analysis_result",
    "reject_analysis_intro",
    "reject_analysis_sample",
    "consultation_lead_submit",
    "work_record_view",        // can enter and input, just not save
  ],

  // Login required — save / accumulate / re-read / sensitive / per-user DB
  loginRequiredActions: [
    "work_record_save",
    "project_record_save",
    "resume_sentence_save",
    "saved_records_read",
    "job_industry_analysis_save",
    "reject_analysis_run",              // actual execution with resume/JD files
    "reject_analysis_file_upload",
    "reject_analysis_result_save",
    "b2b_admin",
  ],
};

export function requiresLogin(action) {
  return PASSMAP_AUTH_POLICY.loginRequiredActions.includes(action);
}

export function isPublic(feature) {
  return PASSMAP_AUTH_POLICY.publicFeatures.includes(feature);
}

// Login prompt messages — single source per context
export const AUTH_PROMPT = {
  work_record_save:
    "기록을 저장하려면 로그인이 필요합니다. 로그인하면 작성한 업무기록과 이력서 문장을 계속 이어서 관리할 수 있습니다.",
  job_industry_analysis_save:
    "분석 결과를 저장하려면 로그인이 필요합니다. 로그인하면 나중에 다시 확인하고 이력서 방향성과 함께 관리할 수 있습니다.",
  reject_analysis_run:
    "서류탈락 원인 분석은 이력서와 지원 정보를 다루기 때문에 로그인이 필요합니다.",
  work_record_local_only:
    "화면에 반영되었습니다. 기록을 저장하려면 로그인이 필요합니다.",
};
