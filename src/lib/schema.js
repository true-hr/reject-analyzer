// src/lib/schema.js

export const SECTION = {
  JOB: "job",
  RESUME: "resume",
  INTERVIEW: "interview",
  RESULT: "result",
};

export const ORDER = [SECTION.JOB, SECTION.RESUME, SECTION.INTERVIEW, SECTION.RESULT];

export const defaultState = {
  company: "",
  role: "",
  roleKscoMajor: "unknown",
  roleKscoOfficeSub: "",
  stage: "서류",
  applyDate: "",

  age: "",
  salaryCurrent: "",
  salaryTarget: "",
  levelCurrent: "",
  levelTarget: "",
  jd: "",
  resume: "",
  portfolio: "",
  interviewNotes: "",

  career: {
    totalYears: 0,
    gapMonths: 0,
    jobChanges: 0,
    lastTenureMonths: 0,
  },

  selfCheck: {
    coreFit: 3,
    proofStrength: 3,
    roleClarity: 3,
    storyConsistency: 3,
    riskSignals: 3,
    cultureFit: 3,
  },

  // append-only: 산업 전환 리스크 분석용
  industryCurrent: "",
  industryTarget: "",
  roleMarketSub: "",
};



