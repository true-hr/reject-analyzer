import { useEffect, useMemo, useRef, useState } from "react";
import { JOB_CATEGORY_OPTIONS, INDUSTRY_CATEGORY_OPTIONS } from "./categoryOptions";
import { findJobOntologyByUiSelection, findIndustryRegistryByUiSelection } from "../../data/job/jobLookup.index.js";

const TRANSITION_LITE_ANALYSIS_TYPE = "transition_lite";
const STEPS = [
  { id: 1, title: "1단계", heading: "목표 직무와 산업을 선택해주세요", description: "목표 직무와 산업을 먼저 선택해주세요.", shortLabel: "1. 목표 직무 / 산업" },
  { id: 2, title: "2단계", heading: "학업 기반을 선택해주세요", description: "전공과 자격증/시험을 선택해주세요.", shortLabel: "2. 학업 기반" },
  { id: 3, title: "3단계", heading: "경험을 입력해주세요", description: "직무와 산업을 이해할 수 있는 경험을 입력해주세요. 학업 기반 경험과 실제 실무 경험을 나누어 입력하면 더 정확하게 판독할 수 있습니다.", shortLabel: "3. 실전 경험" },
];
const MAJOR_CATEGORY_OPTIONS = [
  { value: "engineering_it", label: "공학 / 정보기술", subs: ["컴퓨터공학", "소프트웨어", "산업공학", "전자 / 전기", "기타 공학"] },
  { value: "business_economics", label: "경영 / 경제", subs: ["경영학", "경제학", "회계 / 세무", "금융", "기타 상경"] },
  { value: "humanities_social", label: "인문 / 사회", subs: ["심리 / 상담", "언론 / 미디어", "행정 / 정책", "사회학", "기타 인문사회"] },
  { value: "design_media", label: "디자인 / 콘텐츠", subs: ["시각디자인", "사용자 경험", "영상 / 콘텐츠", "광고 / 홍보", "기타 디자인"] },
  { value: "other", label: "기타", subs: ["복수전공", "연계전공", "전공 미정 / 기타"] },
];
const CERT_CATEGORY_OPTIONS = [
  { value: "language", label: "어학", subs: ["영어", "일본어", "중국어", "기타 외국어"] },
  { value: "data", label: "데이터 / 분석", subs: ["SQL", "통계", "데이터 분석", "문서 활용"] },
  { value: "finance", label: "재무 / 회계", subs: ["회계", "재무", "세무", "금융"] },
  { value: "hr", label: "인사 / 노무", subs: ["노무", "채용 / 교육", "인사 실무", "기타 인사"] },
  { value: "it", label: "정보기술 / 개발", subs: ["개발", "클라우드", "보안", "기타 정보기술"] },
  { value: "marketing", label: "마케팅 / 기획", subs: ["마케팅 분석", "콘텐츠 / 디자인"] },
  { value: "design", label: "디자인", subs: ["그래픽 디자인", "웹디자인"] },
  { value: "general", label: "일반 / 공공", subs: ["공공 / 일반"] },
  { value: "safety_env", label: "안전 / 환경", subs: ["산업안전", "위험물", "환경"] },
  { value: "manufacturing_mech_quality", label: "제조 / 기계 / 품질", subs: ["기계", "품질", "설비", "전기"] },
];
const CERTIFICATE_LABEL_OPTIONS = {
  영어: ["토익", "토익스피킹", "오픽", "텝스"],
  일본어: ["JLPT", "JPT"],
  중국어: ["HSK", "TSC"],
  "기타 외국어": ["제2외국어 시험", "회화 자격"],
  SQL: ["SQLD", "SQLP"],
  통계: ["사회조사분석사", "통계 자격"],
  "데이터 분석": ["ADsP", "ADP", "빅데이터분석기사"],
  "문서 활용": ["컴퓨터활용능력 1급", "컴퓨터활용능력 2급", "워드프로세서"],
  회계: ["전산회계 1급", "전산회계 2급", "재경관리사", "FAT"],
  재무: ["재무 자격", "투자 자격"],
  세무: ["전산세무 1급", "전산세무 2급", "TAT"],
  금융: ["AFPK", "투자자산운용사", "신용분석사", "CFA Level 1"],
  노무: ["노무 자격", "노동법 교육"],
  "채용 / 교육": ["채용 자격", "교육 운영 자격"],
  "인사 실무": ["인사 실무 자격", "인사 교육 수료"],
  "기타 인사": ["인사 관련 교육", "인사 세미나 수료"],
  개발: ["정보처리기사", "정보처리산업기사"],
  클라우드: ["클라우드 자격", "클라우드 교육 수료"],
  보안: ["정보보안기사", "보안 교육 수료"],
  "기타 정보기술": ["정보기술 관련 자격", "기술 교육 수료"],
  "마케팅 분석": ["GA4"],
  "콘텐츠 / 디자인": ["GTQ"],
  "그래픽 디자인": ["GTQ", "ACA"],
  웹디자인: ["웹디자인기능사"],
  "공공 / 일반": ["한국사능력검정"],
  산업안전: ["산업안전기사"],
  위험물: ["위험물산업기사"],
  환경: ["대기환경기사", "수질환경기사"],
  기계: ["일반기계기사"],
  품질: ["품질경영기사"],
  설비: ["설비보전기사", "공조냉동기계기사"],
  전기: ["전기기사"],
};
const PROJECT_TYPE_OPTIONS = ["수업 팀프로젝트", "캡스톤 / 졸업프로젝트", "부트캠프 프로젝트", "사이드프로젝트", "공모전 / 해커톤", "논문 / 연구", "졸업과제"];
const PROJECT_ROLE_OPTIONS = ["기획", "마케팅", "데이터 분석", "디자인", "프론트엔드", "백엔드", "운영 / 지원"];
const PROJECT_OUTCOME_OPTIONS = ["진행 중심", "결과물 완성", "발표 / 제출 / 시연", "실제 적용 / 운영 반영", "수상 / 선발 / 우수성과"];
const ROLE_FAMILY_OPTIONS = ["기획", "마케팅", "영업 / 사업개발", "데이터 / 분석", "디자인", "개발", "운영 / 고객지원", "인사 / 경영지원"];
const DURATION_OPTIONS = ["6개월 미만", "6개월", "1년", "1년 이상"];
const STAKEHOLDER_OPTIONS = [
  "내부 팀원",
  "타직무 협업 상대",
  "현업 실무자",
  "리더 / 검토자",
  "고객 / 사용자",
  "지원자 / 후보자",
  "학습자 / 참여자",
  "시민 / 공공 이용자",
  "외부 파트너",
  "다양하게 경험함",
];
const INTERNSHIP_TYPE_OPTIONS = ["여름 / 겨울 인턴", "학기 중 인턴", "현장실습", "체험형 인턴", "채용연계형 인턴"];
const CONTRACT_TYPE_OPTIONS = ["단기 계약직", "사무 보조 / 파트타임", "프리랜서 / 외주", "프로젝트성 업무", "기타 실무 경험", "실무성 아르바이트"];
const STRENGTHS_OPTIONS = ["분석적", "꼼꼼함", "빠른 실행력", "책임감", "우선순위를 잘 정하는 편", "커뮤니케이션", "설득력", "공감 능력", "문제 해결", "창의성", "빠르게 배우는 편", "협업 지향", "주도성", "새로운 환경에 빨리 적응하는 편", "성실함"];
const WORKSTYLE_OPTIONS = ["혼자 깊게 파고드는 편", "사람들과 자주 소통하는 편", "정리하고 구조화하는 편", "배경과 맥락을 먼저 파악하는 편", "데이터·근거를 확인하고 판단하는 편", "빠르게 시도하고 개선하는 편", "세부 오류를 잘 발견하는 편", "상대 니즈를 파악하는 편", "우선순위를 정해 차근차근 처리하는 편", "끝까지 책임지고 마무리하는 편", "새로운 아이디어를 자주 내는 편"];

function findCategory(options, value) {
  return (Array.isArray(options) ? options : []).find((item) => item?.value === value || item?.v === value) || null;
}
function hasAnyValue(input = {}) {
  return Object.values(input).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim()));
}
function compactObject(input = {}) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]));
}
function createProject() { return { type: "", role: "", stakeholderType: "", outcomeLevel: "" }; }
function createInternship() { return { type: "", roleFamily: "", stakeholderType: "", duration: "" }; }
function createCertification() { return { category: "", subcategory: "", label: "" }; }
function createContract() { return { type: "", roleFamily: "", stakeholderType: "", duration: "" }; }

function StepChip({ active, done, locked, children, onClick }) {
  const className = active
    ? "rounded-full border border-violet-600 bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white"
    : done
      ? "rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[11px] font-semibold text-violet-700"
      : locked
        ? "rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-300"
        : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-slate-300";
  return <button type="button" className={className} onClick={onClick} disabled={locked}>{children}</button>;
}

function SectionBox({ title, description, children }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 md:p-5">
      <div className="mb-4">
        <div className="text-base font-semibold text-slate-950">{title}</div>
        <p className="mt-1 text-sm leading-[1.6] text-slate-600">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-500">{text}</div>;
}

function InlineSelect({ label, value, options, onChange, className }) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <select className={className} value={value} onChange={onChange}>
        <option value="">선택해주세요</option>
        {options.map((option) => (
          <option key={option.value || option} value={option.value || option}>
            {option.label || option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChipGroup({ label, options, selectedValues, onToggle }) {
  const selected = Array.isArray(selectedValues) ? selectedValues : [];
  return (
    <div>
      <div className="text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={`${label}-${option}`}
              type="button"
              className={isActive
                ? "rounded-full border border-violet-600 bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
                : "rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"}
              onClick={() => onToggle(option)}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function NewgradTransitionLiteInput({ onSubmit, onStartAnalysis, onInputsCompleted }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uiState, setUiState] = useState({
    targetJobMajor: "",
    targetJobSub: "",
    targetIndustryMajor: "",
    targetIndustrySub: "",
    majorCategory: "",
    majorSubcategory: "",
    certifications: [],
    projects: [],
    internships: [],
    contractExperiences: [],
    strengthsSelected: [],
    workStyleSelected: [],
    assetEmptyStates: { certifications: false, projects: false, internships: false, contractExperiences: false },
    submitError: "",
  });
  const [assetHintOpen, setAssetHintOpen] = useState({ certifications: false, projects: false, internships: false, contractExperiences: false, selfReport: false });
  const stepHeaderRef = useRef(null);
  const hasStepScrollInitializedRef = useRef(false);
  const inputsCompletedKeyRef = useRef("");
  const inputClass = "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-slate-900";
  const targetJobCategory = findCategory(JOB_CATEGORY_OPTIONS, uiState.targetJobMajor);
  const targetIndustryCategory = findCategory(INDUSTRY_CATEGORY_OPTIONS, uiState.targetIndustryMajor);
  const majorCategory = findCategory(MAJOR_CATEGORY_OPTIONS, uiState.majorCategory);
  const activeStep = STEPS.find((item) => item.id === currentStep) || STEPS[0];

  function patchUi(nextPatch) {
    setUiState((prev) => ({ ...prev, submitError: "", ...nextPatch }));
  }
  function patchArrayItem(key, index, nextPatch) {
    setUiState((prev) => {
      const nextItems = [...(prev[key] || [])];
      nextItems[index] = { ...(nextItems[index] || {}), ...nextPatch };
      return { ...prev, submitError: "", [key]: nextItems };
    });
  }
  function addArrayItem(key, factory) {
    setUiState((prev) => ({ ...prev, submitError: "", assetEmptyStates: { ...prev.assetEmptyStates, [key]: false }, [key]: [...(prev[key] || []), factory()] }));
  }
  function removeArrayItem(key, index) {
    setUiState((prev) => ({ ...prev, submitError: "", [key]: (prev[key] || []).filter((_, itemIndex) => itemIndex !== index) }));
  }
  function toggleEmptyState(key) {
    setUiState((prev) => {
      const nextValue = !prev.assetEmptyStates[key];
      return { ...prev, submitError: "", assetEmptyStates: { ...prev.assetEmptyStates, [key]: nextValue }, [key]: nextValue ? [] : prev[key] };
    });
  }
  function toggleAssetHint(key) {
    setAssetHintOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function certificateLabelOptions(subcategory) {
    return (CERTIFICATE_LABEL_OPTIONS[subcategory] || []).map((entry) => ({ value: entry, label: entry }));
  }
  function toggleSelectedValue(key, value) {
    setUiState((prev) => {
      const currentValues = Array.isArray(prev[key]) ? prev[key] : [];
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((entry) => entry !== value)
        : [...currentValues, value];
      return { ...prev, submitError: "", [key]: nextValues };
    });
  }

  const resolvedPayload = useMemo(() => {
    const targetJob = findJobOntologyByUiSelection({ majorCategory: uiState.targetJobMajor, subcategory: uiState.targetJobSub });
    const targetIndustry = findIndustryRegistryByUiSelection({ sector: uiState.targetIndustryMajor, subSector: uiState.targetIndustrySub });
    const normalizeArray = (key, mapper) => uiState.assetEmptyStates[key] ? [] : (uiState[key] || []).map(mapper).filter(hasAnyValue);
    const certifications = normalizeArray("certifications", (item) => compactObject({ category: item.category, subcategory: item.subcategory, label: item.label, status: "", relevance: "" }));
    const projects = normalizeArray("projects", (item) => compactObject({ type: item.type, role: item.role, stakeholderType: item.stakeholderType, outcomeLevel: item.outcomeLevel, summary: "" }));
    const internships = normalizeArray("internships", (item) => compactObject({ type: item.type, roleFamily: item.roleFamily, stakeholderType: item.stakeholderType, duration: item.duration, summary: "" }));
    const contractExperiences = normalizeArray("contractExperiences", (item) => compactObject({ type: item.type, roleFamily: item.roleFamily, stakeholderType: item.stakeholderType, duration: item.duration, summary: "" }));
    return {
      entryLevelMode: true,
      bridgeCandidate: false,
      currentJobId: "",
      currentIndustryId: "",
      targetJobId: typeof targetJob?.id === "string" ? targetJob.id : "",
      targetIndustryId: typeof targetIndustry?.id === "string" ? targetIndustry.id : "",
      major: { category: uiState.majorCategory, subcategory: uiState.majorSubcategory, label: String(uiState.majorSubcategory || "").trim() },
      certifications,
      projects,
      internships,
      contractExperiences,
      partTimeExperience: contractExperiences,
      domainInterestEvidence: [],
      strengths: Array.isArray(uiState.strengthsSelected) ? uiState.strengthsSelected : [],
      workStyleNotes: Array.isArray(uiState.workStyleSelected) ? uiState.workStyleSelected.join(", ") : "",
    };
  }, [uiState]);

  const stepCompletion = {
    1: Boolean(uiState.targetJobMajor && uiState.targetJobSub && uiState.targetIndustryMajor && uiState.targetIndustrySub),
    2: Boolean(uiState.majorCategory && uiState.majorSubcategory),
    3: true,
  };
  const maxUnlockedStep = stepCompletion[1] ? (stepCompletion[2] ? 3 : 2) : 1;

  useEffect(() => {
    if (!hasStepScrollInitializedRef.current) {
      hasStepScrollInitializedRef.current = true;
      return;
    }
    stepHeaderRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  }, [currentStep]);

  useEffect(() => {
    if (typeof onInputsCompleted !== "function") return;
    if (!resolvedPayload.targetJobId || !resolvedPayload.targetIndustryId) return;
    const transitionPair = `ENTRY_TO__${resolvedPayload.targetJobId}__${resolvedPayload.targetIndustryId}`;
    if (inputsCompletedKeyRef.current === transitionPair) return;
    inputsCompletedKeyRef.current = transitionPair;
    onInputsCompleted({
      analysis_type: TRANSITION_LITE_ANALYSIS_TYPE,
      current_job_id: "",
      current_industry_id: "",
      target_job_id: resolvedPayload.targetJobId,
      target_industry_id: resolvedPayload.targetIndustryId,
      entry_level_mode: true,
      bridge_candidate: false,
      transition_pair: transitionPair,
    });
  }, [onInputsCompleted, resolvedPayload.targetIndustryId, resolvedPayload.targetJobId]);

  function goNext() {
    if (!stepCompletion[currentStep]) return;
    setCurrentStep((prev) => Math.min(3, prev + 1));
  }
  function goPrev() {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  }
  function getValidationMessage() {
    if (!stepCompletion[1]) return "목표 직무와 목표 산업을 선택해주세요.";
    if (!stepCompletion[2]) return "전공을 선택해주세요.";
    if (!resolvedPayload.targetJobId || !resolvedPayload.targetIndustryId) return "목표 직무/산업 id를 찾지 못했습니다. 다시 선택해주세요.";
    return "";
  }
  function handleSubmit() {
    const message = getValidationMessage();
    if (message) return patchUi({ submitError: message });
    try {
      onStartAnalysis?.({ analysis_type: TRANSITION_LITE_ANALYSIS_TYPE, page_type: "landing", entry_cta_name: "transition_lite_newgrad_submit" });
    } catch {}
    onSubmit?.(resolvedPayload);
  }

  function renderAssetHeader(title, emptyKey, emptyCopy, onAdd) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <button type="button" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500" onClick={() => toggleAssetHint(emptyKey)}>선택<span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 text-[9px] font-semibold text-white">i</span></button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700" onClick={onAdd}>
              추가하기
            </button>
            <button type="button" className={uiState.assetEmptyStates[emptyKey] ? "rounded-full border border-violet-600 bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white" : "rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"} onClick={() => toggleEmptyState(emptyKey)}>
              {emptyCopy}
            </button>
          </div>
        </div>
        {assetHintOpen[emptyKey] && (
          <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-[1.6] text-slate-500">
            이 항목은 입력하지 않아도 분석할 수 있습니다. 입력하면 결과가 더 정확해질 수 있습니다.
          </div>
        )}
      </div>
    );
  }

  function renderStepBody() {
    if (currentStep === 1) {
      return (
        <SectionBox title={activeStep.heading} description={activeStep.description}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">목표 직무</div>
            <div className="mt-3 grid grid-cols-2 gap-2">{JOB_CATEGORY_OPTIONS.map(({ v, t }) => <button key={`job-major-${v}`} type="button" className={uiState.targetJobMajor === v ? "rounded-2xl border border-violet-600 bg-violet-600 px-3 py-3 text-left text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700"} onClick={() => patchUi({ targetJobMajor: v, targetJobSub: "" })}>{t || v}</button>)}</div>
            <div className="mt-3 text-sm font-medium text-slate-500">세부 직무</div>
            <div className="mt-2 grid grid-cols-2 gap-2">{(targetJobCategory?.subs || []).map(({ v, t }) => <button key={`job-sub-${v}`} type="button" className={uiState.targetJobSub === v ? "rounded-2xl border border-violet-600 bg-violet-600 px-3 py-3 text-left text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700"} onClick={() => patchUi({ targetJobSub: v })}>{t || v}</button>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">목표 산업</div>
            <div className="mt-3 grid grid-cols-2 gap-2">{INDUSTRY_CATEGORY_OPTIONS.map(({ v, t }) => <button key={`industry-major-${v}`} type="button" className={uiState.targetIndustryMajor === v ? "rounded-2xl border border-violet-600 bg-violet-600 px-3 py-3 text-left text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700"} onClick={() => patchUi({ targetIndustryMajor: v, targetIndustrySub: "" })}>{t || v}</button>)}</div>
            <div className="mt-3 text-sm font-medium text-slate-500">세부 산업</div>
            <div className="mt-2 grid grid-cols-2 gap-2">{(targetIndustryCategory?.subs || []).map(({ v, t }) => <button key={`industry-sub-${v}`} type="button" className={uiState.targetIndustrySub === v ? "rounded-2xl border border-violet-600 bg-violet-600 px-3 py-3 text-left text-sm font-semibold text-white" : "rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700"} onClick={() => patchUi({ targetIndustrySub: v })}>{t || v}</button>)}</div>
          </div>
        </SectionBox>
      );
    }

    if (currentStep === 2) {
      return (
        <SectionBox title={activeStep.heading} description={activeStep.description}>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">전공</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InlineSelect label="대분류" value={uiState.majorCategory} options={MAJOR_CATEGORY_OPTIONS} onChange={(e) => patchUi({ majorCategory: e.target.value, majorSubcategory: "" })} className={inputClass} />
              <InlineSelect label="중분류" value={uiState.majorSubcategory} options={(majorCategory?.subs || []).map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchUi({ majorSubcategory: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {renderAssetHeader("자격증 / 시험", "certifications", "없음", () => addArrayItem("certifications", createCertification))}
            <div className="mt-4 space-y-3">
              {uiState.assetEmptyStates.certifications && uiState.certifications.length === 0 ? <EmptyState text="자격증 / 시험 없음" /> : uiState.certifications.map((item, index) => {
                const selectedCategory = findCategory(CERT_CATEGORY_OPTIONS, item.category);
                const selectedLabelOptions = certificateLabelOptions(item.subcategory);
                return (
                  <div key={`certification-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold text-slate-900">자격증 / 시험 {index + 1}</div><button type="button" className="text-xs font-semibold text-slate-500" onClick={() => removeArrayItem("certifications", index)}>삭제</button></div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <InlineSelect label="대분류" value={item.category} options={CERT_CATEGORY_OPTIONS} onChange={(e) => patchArrayItem("certifications", index, { category: e.target.value, subcategory: "", label: "" })} className={inputClass} />
                      <InlineSelect label="중분류" value={item.subcategory} options={(selectedCategory?.subs || []).map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("certifications", index, { subcategory: e.target.value, label: "" })} className={inputClass} />
                      <InlineSelect label="세부 자격" value={item.label} options={selectedLabelOptions} onChange={(e) => patchArrayItem("certifications", index, { label: e.target.value })} className={inputClass} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </SectionBox>
      );
    }

    return (
      <SectionBox title={activeStep.heading} description={activeStep.description}>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">학업/탐색형 경험</div>
            <p className="mt-0.5 text-sm leading-[1.6] text-slate-500">프로젝트, 공모전, 논문, 졸업과제처럼 학업이나 탐색 과정에서 수행한 경험을 입력해주세요.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {renderAssetHeader("학업/탐색형 경험", "projects", "없음", () => addArrayItem("projects", createProject))}
            <div className="mt-4 space-y-3">
              {uiState.assetEmptyStates.projects && uiState.projects.length === 0 ? <EmptyState text="학업/탐색형 경험 없음" /> : uiState.projects.map((item, index) => (
                <div key={`project-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold text-slate-900">경험 {index + 1}</div><button type="button" className="text-xs font-semibold text-slate-500" onClick={() => removeArrayItem("projects", index)}>삭제</button></div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InlineSelect label="유형" value={item.type} options={PROJECT_TYPE_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("projects", index, { type: e.target.value })} className={inputClass} />
                    <InlineSelect label="역할" value={item.role} options={PROJECT_ROLE_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("projects", index, { role: e.target.value })} className={inputClass} />
                    <InlineSelect label="주요 상대" value={item.stakeholderType} options={STAKEHOLDER_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("projects", index, { stakeholderType: e.target.value })} className={inputClass} />
                    <InlineSelect label="결과 수준" value={item.outcomeLevel} options={PROJECT_OUTCOME_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("projects", index, { outcomeLevel: e.target.value })} className={inputClass} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">실무 경험</div>
            <p className="mt-0.5 text-sm leading-[1.6] text-slate-500">인턴, 현장실습, 계약직, 단기 실무, 실무성 아르바이트처럼 실제 업무 환경에 가까운 경험을 입력해주세요.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {renderAssetHeader("인턴 / 현장실습", "internships", "없음", () => addArrayItem("internships", createInternship))}
            <div className="mt-4 space-y-3">
              {uiState.assetEmptyStates.internships && uiState.internships.length === 0 ? <EmptyState text="인턴 / 현장실습 없음" /> : uiState.internships.map((item, index) => (
                <div key={`internship-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold text-slate-900">인턴 / 현장실습 {index + 1}</div><button type="button" className="text-xs font-semibold text-slate-500" onClick={() => removeArrayItem("internships", index)}>삭제</button></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <InlineSelect label="유형" value={item.type} options={INTERNSHIP_TYPE_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("internships", index, { type: e.target.value })} className={inputClass} />
                    <InlineSelect label="역할군" value={item.roleFamily} options={ROLE_FAMILY_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("internships", index, { roleFamily: e.target.value })} className={inputClass} />
                    <InlineSelect label="기간" value={item.duration} options={DURATION_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("internships", index, { duration: e.target.value })} className={inputClass} />
                    <InlineSelect label="이해관계자 유형" value={item.stakeholderType} options={STAKEHOLDER_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("internships", index, { stakeholderType: e.target.value })} className={inputClass} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            {renderAssetHeader("계약직 / 단기 실무 / 아르바이트", "contractExperiences", "없음", () => addArrayItem("contractExperiences", createContract))}
            <div className="mt-4 space-y-3">
              {uiState.assetEmptyStates.contractExperiences && uiState.contractExperiences.length === 0 ? <EmptyState text="계약직 / 단기 실무 없음" /> : uiState.contractExperiences.map((item, index) => (
                <div key={`contract-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between"><div className="text-sm font-semibold text-slate-900">계약직 / 단기 실무 {index + 1}</div><button type="button" className="text-xs font-semibold text-slate-500" onClick={() => removeArrayItem("contractExperiences", index)}>삭제</button></div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <InlineSelect label="유형" value={item.type} options={CONTRACT_TYPE_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("contractExperiences", index, { type: e.target.value })} className={inputClass} />
                    <InlineSelect label="역할군" value={item.roleFamily} options={ROLE_FAMILY_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("contractExperiences", index, { roleFamily: e.target.value })} className={inputClass} />
                    <InlineSelect label="기간" value={item.duration} options={DURATION_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("contractExperiences", index, { duration: e.target.value })} className={inputClass} />
                    <InlineSelect label="이해관계자 유형" value={item.stakeholderType} options={STAKEHOLDER_OPTIONS.map((entry) => ({ value: entry, label: entry }))} onChange={(e) => patchArrayItem("contractExperiences", index, { stakeholderType: e.target.value })} className={inputClass} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-1.5">
            <div className="text-sm font-semibold text-slate-900">강점 / 일하는 방식</div>
            <button type="button" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500" onClick={() => toggleAssetHint("selfReport")}>선택<span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-300 text-[9px] font-semibold text-white">i</span></button>
          </div>
          {assetHintOpen.selfReport && (
            <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-[1.6] text-slate-500">
              이 항목은 입력하지 않아도 분석할 수 있습니다. 입력하면 결과가 더 정확해질 수 있습니다.
            </div>
          )}
          <div className="mt-4 space-y-4">
            <ToggleChipGroup
              label="강점"
              options={STRENGTHS_OPTIONS}
              selectedValues={uiState.strengthsSelected}
              onToggle={(value) => toggleSelectedValue("strengthsSelected", value)}
            />
            <ToggleChipGroup
              label="일하는 방식"
              options={WORKSTYLE_OPTIONS}
              selectedValues={uiState.workStyleSelected}
              onToggle={(value) => toggleSelectedValue("workStyleSelected", value)}
            />
          </div>
        </div>
      </SectionBox>
    );
  }

  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_rgba(15,23,42,0.06)] md:rounded-[28px] md:p-6">
      <div className="text-[24px] font-semibold tracking-[-0.03em] leading-[1.15] text-slate-950 md:text-[28px] md:leading-none">신입 전환 입력</div>
      <p className="mt-2 max-w-2xl text-sm leading-[1.65] text-slate-600">선택만으로 입력을 완료할 수 있게 3단계로 정리했습니다.</p>
      <div className="mt-5 flex flex-wrap gap-2">{STEPS.map((step) => <StepChip key={step.id} active={currentStep === step.id} done={Boolean(stepCompletion[step.id])} locked={step.id > maxUnlockedStep && step.id !== currentStep} onClick={() => { if (step.id <= maxUnlockedStep) setCurrentStep(step.id); }}>{step.shortLabel}</StepChip>)}</div>
      <div ref={stepHeaderRef} className="mt-4">{renderStepBody()}</div>
      {uiState.submitError ? <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{uiState.submitError}</div> : null}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" className={currentStep === 1 ? "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-300" : "rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700"} onClick={goPrev} disabled={currentStep === 1}>이전</button>
        {currentStep < 3 ? <button type="button" className={stepCompletion[currentStep] ? "rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white" : "rounded-full bg-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-400"} onClick={goNext} disabled={!stepCompletion[currentStep]}>다음</button> : <button type="button" className="rounded-full bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white" onClick={handleSubmit}>분석 시작하기</button>}
      </div>
    </div>
  );
}
