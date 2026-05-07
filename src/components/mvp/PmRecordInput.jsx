import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { COMMON_RECORD_TAXONOMY } from "@/data/workRecord/commonRecordTaxonomy.js";
import { normalizePmMvpCustomTag } from "@/lib/adapters/normalizePmMvpCustomTag.js";
import { mockAIRecordSummary } from "@/lib/workRecord/mockAIRecordSummary.js";

const PROJECT_RESULT_CHIP_OPTIONS = [
  "시간이 줄었어요",
  "반복 업무가 줄었어요",
  "실수가 줄었어요",
  "기준이 생겼어요",
  "협업이 쉬워졌어요",
  "반응이 좋아졌어요",
  "아직 진행 중이에요",
  "잘 모르겠어요",
];

const TRACK_UI_COPY = {
  weekly: {
    title: "이번 주 기록하기",
    description: "이번 주에 처리한 일과 기억할 만한 변화를 짧게 남기면, 이력서에 쓸 수 있는 경험 문장으로 정리됩니다.",
    textLabel: "이번 주에 한 일을 짧게 적어주세요",
    submitLabel: "이번 주 기록 정리하기",
    sampleLabel: "이번 주 샘플 불러오기",
  },
  project: {
    title: "프로젝트 기록하기",
    description: "프로젝트명과 한 줄 메모만 남겨도 됩니다. 나머지는 선택하거나 나중에 자세히 추가해도 괜찮습니다.",
    textLabel: "프로젝트 핵심 내용을 정리해주세요",
    submitLabel: "프로젝트 기록 정리하기",
    sampleLabel: "프로젝트 샘플 불러오기",
  },
};

const EMPTY_SAMPLE_RECORD = {
  text: "",
  roleTags: [],
  collaborationTags: [],
  resultTags: [],
};

const EMPTY_RECORD_PRESET = {
  workTypeExtensions: [],
  collaborationExtensions: [],
  followUpExtensions: [],
  placeholders: {
    weekly: "예) 채용 공고 업로드를 정리하고, 문의가 반복되는 항목을 FAQ 형태로 묶었습니다.",
    project: {
      projectName: {
        personal: "예) 채용 공고 업로드 정리",
        teamProject: "예) 패스맵 경험 정리하기 화면 UI 문구 개선",
      },
      projectPeriod: "예) 2026년 3월~4월, 3주, 약 1개월",
      projectGoal: "예) 사용자가 기록한 경험이 이력서로 이어지는 흐름을 더 쉽게 이해하도록 화면 구조와 문구를 개선합니다.",
      projectContext: {
        personal: "예) 같은 질문이 반복됐지만 답변 기준이 정리되어 있지 않았습니다.",
        teamProject: "예) 사용자 피드백을 바탕으로 개선 방향을 정리하고, 화면 문구와 입력 구조를 기획했습니다.",
      },
      projectActions: {
        personal: "예) 채용 공고 내용을 정리해 업로드하고, 누락된 정보를 확인했습니다.",
        teamProject: "예) 경험 정리하기 화면의 버튼명, 태그 표현, 프로젝트 기록 입력 방식을 개선했습니다.",
      },
      projectInsight: "예) 팀 업무와 개인 업무를 나누는 방식이 더 직관적인지 추가 확인이 필요합니다.",
      projectResult: "예) 기록 → 정리 → 이력서 연결 흐름이 더 명확해졌습니다.",
    },
  },
  sampleRecords: {
    weekly: EMPTY_SAMPLE_RECORD,
    project: {
      recordType: "teamProject",
      projectName: "패스맵 경험 정리하기 화면 UI 문구 개선",
      projectPeriod: "2026년 4월",
      projectGoal: "사용자가 기록한 경험이 이력서로 이어지는 흐름을 더 쉽게 이해하도록 화면 구조와 문구를 개선합니다.",
      projectContext: "사용자 피드백을 바탕으로 개선 방향을 정리하고, 화면 문구와 입력 구조를 기획했습니다.",
      projectActions: "경험 정리하기 화면의 버튼명, 태그 표현, 프로젝트 기록 입력 방식을 개선했습니다.",
      projectResult: "기록 → 정리 → 이력서 연결 흐름이 더 명확해졌습니다.",
      projectInsight: "팀 업무와 개인 업무를 나누는 방식이 더 직관적인지 추가 확인이 필요합니다.",
      roleTags: [],
      collaborationTags: [],
      resultTags: [],
    },
  },
};

const WORK_RECALL_GUIDE_PRIORITY_PHRASES = [
  {
    key: "NEGOTIATE_OR_CONTRACT",
    phrases: [
      "계약 협의",
      "계약 조건 협의",
      "제안 조건 협의",
      "계약 조건 검토",
      "계약 협상",
      "견적 비교",
      "견적 검토",
      "조건 협의",
      "수익배분 협의",
      "비용 조건 협의",
    ],
  },
  {
    key: "SOLVE_OR_FIX",
    phrases: [
      "오류 수정",
      "화면 오류 수정",
      "ci/cd 오류 수정",
      "버그 수정",
      "버그 재현",
      "오류 재현",
      "결함 재현",
      "장애 대응",
      "이슈 대응",
      "문제 해결",
      "에러 수정",
      "납기 이슈 대응",
    ],
  },
  {
    key: "RESEARCH_OR_DISCOVER",
    phrases: [
      "파트너십 발굴",
      "제휴사 발굴",
      "시장 기회",
      "기회 발굴",
      "경쟁 제품 비교",
      "경쟁사 비교",
      "공급사 비교",
      "시장 파악",
      "고객 니즈 파악",
      "벤치마킹",
      "자료 수집",
    ],
  },
  {
    key: "DOCUMENT_OR_PROPOSE",
    phrases: [
      "요구사항 정리",
      "기능 요구사항 정리",
      "회의 자료 준비",
      "자료 준비",
      "데모 준비",
      "브랜드 메시지 정리",
      "메시지 정리",
      "정책 문구 정리",
      "문구 정리",
      "운영 가이드 정리",
      "가이드 정리",
    ],
  },
  {
    key: "BUILD_OR_CREATE",
    phrases: [
      "api 연동",
      "외부 서비스 연동",
      "데이터 연동",
      "결제 연동",
      "로그인 연동",
      "기능 구현",
      "서버 로직 구현",
      "앱 화면 구현",
    ],
  },
  {
    key: "IMPROVE_OR_OPTIMIZE",
    phrases: [
      "피드백 반영",
      "고객 피드백 반영",
      "사용자 피드백 반영",
      "교육 피드백 정리",
      "개선안 반영",
      "수정사항 반영",
    ],
  },
  {
    key: "REVIEW_OR_QA",
    phrases: [
      "가설 검증",
      "기능 검증",
      "테스트 수행",
      "테스트 케이스 확인",
      "품질 검증",
      "결함 확인",
    ],
  },
];

const WORK_RECALL_GUIDE_KEYWORDS = [
  { key: "BUILD_OR_CREATE", keywords: ["추가", "개발", "제작", "구축", "생성", "구현", "설계"] },
  { key: "IMPROVE_OR_OPTIMIZE", keywords: ["개선", "수정", "고도화", "최적화", "개편", "보완"] },
  { key: "SOLVE_OR_FIX", keywords: ["문제", "오류", "버그", "장애", "해결", "이슈"] },
  { key: "ANALYZE_OR_REPORT", keywords: ["분석", "리포트", "지표", "데이터", "인사이트", "성과"] },
  { key: "RESEARCH_OR_DISCOVER", keywords: ["조사", "리서치", "시장", "경쟁사", "기회", "발굴", "벤치마킹"] },
  { key: "DOCUMENT_OR_PROPOSE", keywords: ["문서", "제안서", "기획서", "보고서", "작성"] },
  { key: "ALIGN_OR_COORDINATE", keywords: ["미팅", "협의", "조율", "커뮤니케이션", "공유", "내부 협업"] },
  { key: "NEGOTIATE_OR_CONTRACT", keywords: ["계약", "조건", "견적", "협상", "협약"] },
  { key: "OPERATE_OR_MANAGE", keywords: ["운영", "관리", "모니터링", "일정", "파이프라인"] },
  { key: "SUPPORT_OR_HANDLE_CUSTOMER", keywords: ["고객", "사용자", "문의", "클레임", "응대"] },
  { key: "REVIEW_OR_QA", keywords: ["검토", "검수", "QA", "품질", "확인", "검증", "테스트"] },
  { key: "PLAN_OR_STRATEGIZE", keywords: ["전략", "계획", "로드맵", "방향", "우선순위"] },
];

const WORK_RECALL_GUIDES = {
  BUILD_OR_CREATE: {
    title: "대충 적어도 됩니다",
    example: "예: 로그인 없이 상담 신청 가능하게 함",
    questions: ["무엇을 새로 만들었나요?", "누구를 위해 필요했나요?", "추가 후 무엇이 가능해졌나요?"],
    placeholder: "예: 로그인 없이 상담 신청 가능하게 함",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["기능 추가", "화면 구현", "API 연동", "자동화", "데이터 연결"] },
      { label: "왜 했나요?", options: ["사용자 편의", "업무 효율", "누락 방지", "신규 흐름 지원"] },
      { label: "뭐가 달라졌나요?", options: ["사용이 쉬워짐", "처리 시간이 줄어듦", "흐름이 연결됨", "반복 작업이 줄어듦"] },
    ],
  },
  IMPROVE_OR_OPTIMIZE: {
    title: "대충 적어도 됩니다",
    example: "예: 신청 화면 문구와 버튼 순서 개선",
    questions: ["무엇을 바꿨나요?", "바꾸기 전 불편은 무엇이었나요?", "바꾼 뒤 뭐가 나아졌나요?"],
    placeholder: "예: 신청 화면 문구와 버튼 순서 개선",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["UI 개선", "문구 수정", "속도 개선", "프로세스 보완", "기준 정리"] },
      { label: "왜 했나요?", options: ["사용자 혼선 감소", "업무 효율 개선", "반복 오류 예방", "전환율 개선"] },
      { label: "뭐가 달라졌나요?", options: ["사용성이 좋아짐", "처리가 빨라짐", "혼선이 줄어듦", "기준이 명확해짐"] },
    ],
  },
  SOLVE_OR_FIX: {
    title: "대충 적어도 됩니다",
    example: "예: 결제 오류 반복 구간 확인 후 대응 기준 정리",
    questions: ["어떤 문제가 있었나요?", "어디를 고쳤나요?", "해결 후 뭐가 나아졌나요?"],
    placeholder: "예: 결제 오류 반복 구간 확인 후 대응 기준 정리",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["오류 수정", "버그 재현", "이슈 대응", "장애 원인 확인", "예외 처리"] },
      { label: "왜 했나요?", options: ["반복 오류 방지", "사용자 불편 해소", "운영 리스크 감소", "납기 이슈 대응"] },
      { label: "뭐가 달라졌나요?", options: ["문제가 재현됨", "원인이 확인됨", "오류가 줄어듦", "대응 기준이 생김"] },
    ],
  },
  ANALYZE_OR_REPORT: {
    title: "대충 적어도 됩니다",
    example: "예: 전환율 하락 구간 분석 후 개선 우선순위 정리",
    questions: ["무엇을 분석했나요?", "어떤 숫자나 근거를 봤나요?", "그래서 어떤 판단을 했나요?"],
    placeholder: "예: 전환율 하락 구간 분석 후 개선 우선순위 정리",
  },
  RESEARCH_OR_DISCOVER: {
    title: "대충 적어도 됩니다",
    example: "예: 경쟁사 가격 정책 조사 후 신규 패키지 기회 정리",
    questions: ["무엇을 찾아봤나요?", "어떤 차이나 기회를 봤나요?", "다음에 뭘 해보면 좋을까요?"],
    placeholder: "예: 경쟁사 가격 정책 조사 후 신규 패키지 기회 정리",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["시장 조사", "경쟁사 비교", "자료 수집", "고객 니즈 파악", "기회 발굴"] },
      { label: "왜 했나요?", options: ["신규 기회 확인", "의사결정 근거 확보", "방향성 검토", "리스크 파악"] },
      { label: "뭐가 달라졌나요?", options: ["비교 기준이 생김", "기회가 정리됨", "다음 액션이 보임", "판단 근거가 생김"] },
    ],
  },
  DOCUMENT_OR_PROPOSE: {
    title: "대충 적어도 됩니다",
    example: "예: 반복 문의 대응 기준 문서화",
    questions: ["무엇을 정리했나요?", "누가 보기 위한 자료였나요?", "정리 후 뭐가 쉬워졌나요?"],
    placeholder: "예: 반복 문의 대응 기준 문서화",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["제안서", "회의자료", "요구사항", "가이드", "보고서"] },
      { label: "왜 했나요?", options: ["외부 공유", "내부 정리", "의사결정", "협업 조율", "업무 기준 정리"] },
      { label: "뭐가 달라졌나요?", options: ["논의가 쉬워짐", "기준이 명확해짐", "다음 액션이 정해짐", "반복 문의가 줄어듦"] },
    ],
  },
  ALIGN_OR_COORDINATE: {
    title: "대충 적어도 됩니다",
    example: "예: 디자인팀·개발팀 배포 범위 조율",
    questions: ["누구와 무엇을 조율했나요?", "어떤 이슈가 있었나요?", "최종적으로 무엇이 정해졌나요?"],
    placeholder: "예: 디자인팀·개발팀 배포 범위 조율",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["미팅 준비", "내부 협업 조율", "일정 조율", "의견 공유", "배포 범위 정리"] },
      { label: "왜 했나요?", options: ["의견 차이 조율", "일정 확정", "역할 분담", "진행 상황 공유"] },
      { label: "뭐가 달라졌나요?", options: ["논의가 정리됨", "담당자가 정해짐", "일정이 맞춰짐", "다음 액션이 정해짐"] },
    ],
  },
  NEGOTIATE_OR_CONTRACT: {
    title: "대충 적어도 됩니다",
    example: "예: 외부 파트너 견적 조건 비교 및 계약 범위 정리",
    questions: ["누구와 무엇을 협의했나요?", "쟁점은 무엇이었나요?", "다음 단계는 무엇인가요?"],
    placeholder: "예: 외부 파트너 견적 조건 비교 및 계약 범위 정리",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["계약 협의", "견적 비교", "조건 정리", "비용 검토", "파트너 논의"] },
      { label: "왜 했나요?", options: ["계약 범위 확정", "비용 조건 확인", "리스크 점검", "다음 협상 준비"] },
      { label: "뭐가 달라졌나요?", options: ["쟁점이 정리됨", "조건이 좁혀짐", "다음 단계가 정해짐", "비교 기준이 생김"] },
    ],
  },
  OPERATE_OR_MANAGE: {
    title: "대충 적어도 됩니다",
    example: "예: 주간 운영 일정 점검 후 누락 업무 재배정",
    questions: ["무엇을 운영하거나 관리했나요?", "어디를 점검했나요?", "어떤 후속 조치를 했나요?"],
    placeholder: "예: 주간 운영 일정 점검 후 누락 업무 재배정",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["운영 일정 점검", "진행 현황 관리", "파이프라인 점검", "공지 운영", "누락 확인"] },
      { label: "왜 했나요?", options: ["일정 지연 방지", "업무 누락 예방", "상태 공유", "운영 기준 유지"] },
      { label: "뭐가 달라졌나요?", options: ["누락을 줄임", "진행 상태가 보임", "담당자가 정해짐", "운영 기준이 유지됨"] },
    ],
  },
  SUPPORT_OR_HANDLE_CUSTOMER: {
    title: "대충 적어도 됩니다",
    example: "예: 고객 문의 유형 분류 및 답변 기준 정리",
    questions: ["누구의 요청을 처리했나요?", "자주 나온 내용은 무엇이었나요?", "어떻게 응대했나요?"],
    placeholder: "예: 고객 문의 유형 분류 및 답변 기준 정리",
  },
  REVIEW_OR_QA: {
    title: "대충 적어도 됩니다",
    example: "예: 배포 전 화면 문구와 주요 기능 검수",
    questions: ["무엇을 확인했나요?", "어떤 기준으로 봤나요?", "발견한 문제는 어떻게 처리했나요?"],
    placeholder: "예: 배포 전 화면 문구와 주요 기능 검수",
  },
  PLAN_OR_STRATEGIZE: {
    title: "대충 적어도 됩니다",
    example: "예: 다음 분기 로드맵 우선순위와 실행 순서 정리",
    questions: ["어떤 방향을 잡았나요?", "우선순위 기준은 무엇이었나요?", "다음 실행은 무엇인가요?"],
    placeholder: "예: 다음 분기 로드맵 우선순위와 실행 순서 정리",
  },
  GENERIC: {
    title: "대충 적어도 됩니다",
    example: "예: 이번 주에 맡은 일과 다음 액션 정리",
    questions: ["무엇을 했나요?", "왜 필요했나요?", "다음에 뭘 이어가면 되나요?"],
    placeholder: "예: 이번 주에 맡은 일과 다음 액션 정리",
    quickDraftChips: [
      { label: "무엇을 했나요?", options: ["자료 정리", "회의 준비", "이슈 대응", "내용 확인", "후속 액션 정리"] },
      { label: "왜 했나요?", options: ["업무 기준 정리", "협업 준비", "문제 예방", "다음 단계 진행"] },
      { label: "뭐가 달라졌나요?", options: ["해야 할 일이 명확해짐", "논의가 쉬워짐", "누락을 줄임"] },
    ],
  },
};

function inferWorkRecallGuideKey(label) {
  const source = String(label || "").trim().toLowerCase();
  if (!source) return "GENERIC";
  const phraseMatched = WORK_RECALL_GUIDE_PRIORITY_PHRASES.find(({ phrases }) =>
    phrases.some((phrase) => source.includes(String(phrase).toLowerCase())),
  );
  if (phraseMatched) return phraseMatched.key;
  const matched = WORK_RECALL_GUIDE_KEYWORDS.find(({ keywords }) =>
    keywords.some((keyword) => source.includes(String(keyword).toLowerCase())),
  );
  return matched?.key || "GENERIC";
}

function deriveWorkRecallGuide(roleTags = []) {
  if (!Array.isArray(roleTags) || roleTags.length === 0) return null;
  const selectedLabel = String(roleTags[roleTags.length - 1] || "").trim();
  if (!selectedLabel) return null;
  const guideKey = inferWorkRecallGuideKey(selectedLabel);
  return {
    key: guideKey,
    sourceLabel: selectedLabel,
    ...(WORK_RECALL_GUIDES[guideKey] || WORK_RECALL_GUIDES.GENERIC),
  };
}

function ensureSentenceEnding(sentence) {
  const trimmed = String(sentence || "").trim();
  if (!trimmed) return "";
  return /[.!?。？！]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function buildQuickDraftText(option, groupLabel) {
  const cleanOption = String(option || "").trim();
  const cleanGroupLabel = String(groupLabel || "").trim();
  if (!cleanOption) return "";
  if (cleanGroupLabel.includes("왜")) {
    return ensureSentenceEnding(`${cleanOption} 목적의 작업이었습니다`);
  }
  if (cleanGroupLabel.includes("달라")) {
    return ensureSentenceEnding(`이후 ${cleanOption}`);
  }
  return ensureSentenceEnding(`${cleanOption} 작업을 진행했습니다`);
}

function appendQuickDraftChipToText(currentText, option, groupLabel) {
  const current = String(currentText || "").trim();
  const cleanOption = String(option || "").trim();
  const draft = buildQuickDraftText(cleanOption, groupLabel);
  if (!draft) return currentText || "";
  if (current.includes(cleanOption) || current.includes(draft)) return currentText || "";
  if (!current) return draft;
  return `${ensureSentenceEnding(current)} ${draft}`;
}

function toggleItem(items, item) {
  return items.includes(item) ? items.filter((value) => value !== item) : [...items, item];
}

function removeItem(items, item) {
  return items.filter((value) => value !== item);
}

function createTagOptions(items = []) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function appendTagOption(items, item) {
  return createTagOptions([...items, item]);
}

function mapLabels(items = []) {
  return items.map((item) => item?.label).filter(Boolean);
}

function TagChip({ tag, selected, onToggle, onRemove }) {
  return (
    <div
      className={[
        "flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
        selected ? "border-slate-800 bg-slate-800 text-white" : "border-slate-200 bg-white text-slate-600",
      ].join(" ")}
    >
      <button type="button" onClick={() => onToggle(tag)} className="leading-none">
        {tag}
      </button>
      <button
        type="button"
        onClick={() => onRemove(tag)}
        className={[
          "leading-none text-[10px]",
          selected ? "text-white/80 hover:text-white" : "text-slate-400 hover:text-slate-600",
        ].join(" ")}
        aria-label={`${tag} 제거`}
      >
        ×
      </button>
    </div>
  );
}

function TagEditorSection({
  label,
  options,
  inputValue,
  selected,
  addLabel,
  placeholder,
  onToggle,
  onInputChange,
  onAdd,
  onRemove,
  defaultCollapsed = false,
}) {
  const [expanded, setExpanded] = useState(false);
  const [sectionOpen, setSectionOpen] = useState(!defaultCollapsed);
  const previewLimit = 7;
  const visibleOptions = expanded ? options : options.slice(0, previewLimit);
  const hiddenCount = Math.max(options.length - visibleOptions.length, 0);

  const toggleLabel = sectionOpen
    ? "접기"
    : selected.length > 0
    ? `${selected.length}개 선택 · 펼치기`
    : "펼치기";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-slate-700">{label}</div>
        {defaultCollapsed ? (
          <button
            type="button"
            onClick={() => setSectionOpen((o) => !o)}
            className="text-[11px] font-medium text-violet-600 transition-colors hover:text-violet-800"
          >
            {toggleLabel}
          </button>
        ) : (
          (hiddenCount > 0 || expanded) ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              {expanded ? "접기" : `+${hiddenCount} 더보기`}
            </button>
          ) : null
        )}
      </div>

      {defaultCollapsed && !sectionOpen ? (
        selected.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {selected.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                {tag}
              </span>
            ))}
            {selected.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                +{selected.length - 3}
              </span>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-slate-400">아직 선택 없음</p>
        )
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {visibleOptions.map((tag) => (
              <TagChip
                key={tag}
                tag={tag}
                selected={selected.includes(tag)}
                onToggle={onToggle}
                onRemove={onRemove}
              />
            ))}
          </div>
          {defaultCollapsed && (hiddenCount > 0 || expanded) ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1.5 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              {expanded ? "접기" : `+${hiddenCount} 더보기`}
            </button>
          ) : null}
          <div className="mt-2.5 flex flex-wrap gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(event) => onInputChange(event.target.value)}
              placeholder={placeholder}
              className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
            />
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 px-3" onClick={onAdd}>
              {addLabel}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

const QUICK_PERIOD_LABELS = ["이번 주", "지난주", "이번 달"];

const RECORD_TYPE_OPTIONS = [
  {
    value: "personal",
    label: "개인 업무",
    description: "혼자 처리한 업무, 반복 업무, 간단한 개선 사항을 가볍게 남깁니다.",
  },
  {
    value: "teamProject",
    label: "팀/프로젝트 업무",
    description: "팀 목표 안에서 내가 맡은 역할과 기여를 남깁니다.",
  },
];

export default function PmRecordInput({
  track = "weekly",
  onSubmit,
  isLoading = false,
  recordPreset = EMPTY_RECORD_PRESET,
  collapseStructuredSections = false,
  onOpenResumeView = null,
  canGenerateAiResumeDraft = false,
  onDraftChange = null,
  aiButtonLabel = null,
  aiDescriptionText = null,
}) {
  const normalizedTrack = track === "project" ? "project" : "weekly";
  const isProjectTrack = normalizedTrack === "project";
  const copy = TRACK_UI_COPY[normalizedTrack] || TRACK_UI_COPY.weekly;
  const placeholder = isProjectTrack ? "" : (recordPreset.placeholders?.[normalizedTrack] || "");
  const projectPlaceholders = isProjectTrack
    ? (recordPreset.placeholders?.project || EMPTY_RECORD_PRESET.placeholders.project)
    : EMPTY_RECORD_PRESET.placeholders.project;
  const sampleRecord = recordPreset.sampleRecords?.[normalizedTrack] ||
    (isProjectTrack ? EMPTY_RECORD_PRESET.sampleRecords.project : EMPTY_SAMPLE_RECORD);
  const trackPresetOptions = useMemo(
    () => createTagOptions(recordPreset.trackWorkTypePresets?.[normalizedTrack]),
    [recordPreset],
  );
  const coreWorkOptions = useMemo(
    () => createTagOptions(mapLabels(recordPreset.workTypeExtensions)),
    [recordPreset],
  );

  const workBaseOptions = useMemo(
    () => createTagOptions([...trackPresetOptions, ...coreWorkOptions]),
    [trackPresetOptions, coreWorkOptions],
  );
  const contextBaseOptions = useMemo(
    () =>
      createTagOptions(
        recordPreset.collaborationExtensions?.length > 0
          ? mapLabels(recordPreset.collaborationExtensions)
          : mapLabels(COMMON_RECORD_TAXONOMY.collaborationContext),
      ),
    [recordPreset],
  );
  const resultBaseOptions = useMemo(
    () =>
      createTagOptions(
        recordPreset.followUpExtensions?.length > 0
          ? mapLabels(recordPreset.followUpExtensions)
          : mapLabels(COMMON_RECORD_TAXONOMY.followUpResult),
      ),
    [recordPreset],
  );

  const [text, setText] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectPeriod, setProjectPeriod] = useState("");
  const [projectGoal, setProjectGoal] = useState("");
  const [projectContext, setProjectContext] = useState("");
  const [projectActions, setProjectActions] = useState("");
  const [projectResult, setProjectResult] = useState("");
  const [projectInsight, setProjectInsight] = useState("");
  const [roleTags, setRoleTags] = useState([]);
  const [collaborationTags, setCollaborationTags] = useState([]);
  const [resultTags, setResultTags] = useState([]);
  const [workOptions, setWorkOptions] = useState(() => workBaseOptions);
  const [contextOptions, setContextOptions] = useState(() => contextBaseOptions);
  const [resultOptions, setResultOptions] = useState(() =>
    createTagOptions([...resultBaseOptions, ...PROJECT_RESULT_CHIP_OPTIONS]),
  );
  const [workInput, setWorkInput] = useState("");
  const [contextInput, setContextInput] = useState("");
  const [resultInput, setResultInput] = useState("");
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [projectStartDate, setProjectStartDate] = useState("");
  const [projectEndDate, setProjectEndDate] = useState("");
  const [projectRecordType, setProjectRecordType] = useState("personal");
  const [quickDraftGuideOpen, setQuickDraftGuideOpen] = useState(false);
  const [aiRecordSummaryPreview, setAiRecordSummaryPreview] = useState(null);
  const [aiRecordSummaryError, setAiRecordSummaryError] = useState("");
  const selectedGuide = useMemo(() => deriveWorkRecallGuide(roleTags), [roleTags]);
  const selectedGuideTitle = selectedGuide
    ? selectedGuide.key === "GENERIC"
      ? "업무 기록 가이드"
      : `${selectedGuide.sourceLabel} 기록 가이드`
    : "";
  const weeklyTextPlaceholder = selectedGuide?.placeholder || placeholder;

  useEffect(() => {
    setText("");
    setProjectName("");
    setProjectPeriod("");
    setProjectGoal("");
    setProjectContext("");
    setProjectActions("");
    setProjectResult("");
    setProjectInsight("");
    setRoleTags([]);
    setCollaborationTags([]);
    setResultTags([]);
    setWorkOptions(workBaseOptions);
    setContextOptions(contextBaseOptions);
    setResultOptions(
      isProjectTrack
        ? createTagOptions([...resultBaseOptions, ...PROJECT_RESULT_CHIP_OPTIONS])
        : resultBaseOptions,
    );
    setWorkInput("");
    setContextInput("");
    setResultInput("");
    setShowProjectDetails(false);
    setProjectStartDate("");
    setProjectEndDate("");
    setProjectRecordType("personal");
  }, [track, workBaseOptions, contextBaseOptions, resultBaseOptions]);

  const hasProjectInput =
    projectRecordType === "personal"
      ? projectName.trim().length > 0 || projectActions.trim().length > 0
      : projectName.trim().length > 0 ||
        projectGoal.trim().length > 0 ||
        projectContext.trim().length > 0 ||
        projectActions.trim().length > 0 ||
        projectResult.trim().length > 0 ||
        projectInsight.trim().length > 0;

  const hasWeeklyInput = text.trim().length > 0 || roleTags.length > 0 || collaborationTags.length > 0 || resultTags.length > 0;
  const canSubmit = (isProjectTrack ? hasProjectInput : hasWeeklyInput) && !isLoading;

  useEffect(() => {
    if (typeof onDraftChange !== "function") return;
    const snapshot = isProjectTrack
      ? { text, track: "project", projectName, projectPeriod, projectGoal, projectContext, projectActions, projectResult, projectInsight, roleTags, collaborationTags, resultTags }
      : { text, track: "weekly", roleTags, collaborationTags, resultTags };
    onDraftChange({ hasContent: canSubmit, snapshot });
  }, [
    text,
    track,
    projectName,
    projectPeriod,
    projectGoal,
    projectContext,
    projectActions,
    projectResult,
    projectInsight,
    roleTags,
    collaborationTags,
    resultTags,
    isLoading,
    projectRecordType,
    canSubmit,
    isProjectTrack,
    onDraftChange,
  ]);

  function addCustomWorkTag() {
    const normalized = normalizePmMvpCustomTag(workInput);
    if (!normalized) return;
    setWorkOptions((current) => appendTagOption(current, normalized));
    setRoleTags((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setWorkInput("");
  }

  function addCustomContextTag() {
    const normalized = normalizePmMvpCustomTag(contextInput);
    if (!normalized) return;
    setContextOptions((current) => appendTagOption(current, normalized));
    setCollaborationTags((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setContextInput("");
  }

  function addCustomResultTag() {
    const normalized = normalizePmMvpCustomTag(resultInput);
    if (!normalized) return;
    setResultOptions((current) => appendTagOption(current, normalized));
    setResultTags((current) => (current.includes(normalized) ? current : [...current, normalized]));
    setResultInput("");
  }

  function handleLoadSample() {
    if (isProjectTrack) {
      setProjectRecordType(sampleRecord.recordType || "teamProject");
      setProjectName(sampleRecord.projectName || "");
      setProjectPeriod(sampleRecord.projectPeriod || "");
      setProjectGoal(sampleRecord.projectGoal || "");
      setProjectContext(sampleRecord.projectContext || "");
      setProjectActions(sampleRecord.projectActions || "");
      setProjectResult(sampleRecord.projectResult || "");
      setProjectInsight(sampleRecord.projectInsight || "");
      setProjectStartDate("");
      setProjectEndDate("");
    } else {
      setText(sampleRecord.text || "");
    }
    const tags = sampleRecord.roleTags || [];
    const ctxTags = sampleRecord.collaborationTags || [];
    const resTags = sampleRecord.resultTags || [];
    setRoleTags(tags);
    setCollaborationTags(ctxTags);
    setResultTags(resTags);
    setWorkOptions(createTagOptions([...workBaseOptions, ...tags]));
    setContextOptions(createTagOptions([...contextBaseOptions, ...ctxTags]));
    setResultOptions(
      isProjectTrack
        ? createTagOptions([...resultBaseOptions, ...PROJECT_RESULT_CHIP_OPTIONS, ...resTags])
        : createTagOptions([...resultBaseOptions, ...resTags]),
    );
  }

  function handlePreviewAiRecordSummary() {
    const rawText = isProjectTrack ? projectActions.trim() : text.trim();

    if (!rawText) {
      setAiRecordSummaryError("먼저 업무 기록을 작성해주세요.");
      setAiRecordSummaryPreview(null);
      return;
    }

    const summary = mockAIRecordSummary({
      rawText,
      currentJobId: currentJobId || "",
      recordType: isProjectTrack ? "project" : "weekly",
      existingTags: {
        workTypeTags: roleTags,
        collaborationContextTags: collaborationTags,
        outcomeTags: resultTags,
      },
    });

    setAiRecordSummaryPreview(summary);
    setAiRecordSummaryError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;
    if (isProjectTrack) {
      const finalProjectPeriod =
        projectStartDate && projectEndDate
          ? `${projectStartDate} ~ ${projectEndDate}`
          : projectStartDate || projectEndDate || projectPeriod.trim();
      const projectText =
        projectRecordType === "personal"
          ? [
              projectName.trim() && `업무명: ${projectName.trim()}`,
              finalProjectPeriod && `기간: ${finalProjectPeriod}`,
              projectActions.trim() && `한 일: ${projectActions.trim()}`,
              resultTags.length > 0 && `변화 유형: ${resultTags.join(", ")}`,
            ].filter(Boolean).join("\n")
          : [
              projectName.trim() && `프로젝트명: ${projectName.trim()}`,
              finalProjectPeriod && `기간: ${finalProjectPeriod}`,
              projectGoal.trim() && `팀 목표: ${projectGoal.trim()}`,
              projectContext.trim() && `내 역할: ${projectContext.trim()}`,
              projectActions.trim() && `이번에 처리한 일: ${projectActions.trim()}`,
              projectResult.trim() && `결과/성과: ${projectResult.trim()}`,
              projectInsight.trim() && `다음 액션/학습: ${projectInsight.trim()}`,
              resultTags.length > 0 && `변화 유형: ${resultTags.join(", ")}`,
            ].filter(Boolean).join("\n");
      onSubmit({
        track: "project",
        recordType: projectRecordType,
        startDate: projectStartDate || "",
        endDate: projectEndDate || "",
        text: projectText,
        projectName: projectName.trim(),
        projectPeriod: finalProjectPeriod,
        projectGoal: projectGoal.trim(),
        projectContext: projectContext.trim(),
        projectActions: projectActions.trim(),
        projectResult: projectResult.trim(),
        projectInsight: projectInsight.trim(),
        roleTags,
        collaborationTags,
        resultTags,
      });
    } else {
      onSubmit({
        text: text.trim(),
        roleTags,
        collaborationTags,
        resultTags,
        track: normalizedTrack,
      });
    }
  }

  function getProjectNamePlaceholder() {
    const p = projectPlaceholders.projectName;
    if (p && typeof p === "object") return p[projectRecordType] || p.personal || "";
    return p || "";
  }

  function getProjectActionsPlaceholder() {
    const p = projectPlaceholders.projectActions;
    if (p && typeof p === "object") return p[projectRecordType] || p.personal || "";
    return p || "";
  }

  function getProjectContextPlaceholder() {
    const p = projectPlaceholders.projectContext;
    if (p && typeof p === "object") return p[projectRecordType] || p.personal || "";
    return p || "";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">{copy.title}</h3>
          <p className="text-sm leading-relaxed text-slate-500">{copy.description}</p>
        </div>
        {selectedGuide?.quickDraftChips?.length ? (
          <button
            type="button"
            onClick={() => setQuickDraftGuideOpen((current) => !current)}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            {quickDraftGuideOpen ? "작성 도우미 닫기" : "작성 도우미 열기"}
          </button>
        ) : (
          <div className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            빠른 입력
          </div>
        )}
      </div>

      {isProjectTrack ? (
        <>
          {/* 기록 유형 선택 */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-slate-700">어떤 기록인가요?</p>
            <div className="grid grid-cols-2 gap-2">
              {RECORD_TYPE_OPTIONS.map((option) => {
                const isSelected = projectRecordType === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setProjectRecordType(option.value)}
                    className={[
                      "rounded-xl border p-3 text-left transition-colors",
                      isSelected
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-950 hover:shadow-sm",
                    ].join(" ")}
                  >
                    <p className={["text-sm font-semibold", isSelected ? "text-white" : "text-slate-800"].join(" ")}>
                      {option.label}
                    </p>
                    <p className={["mt-1 text-xs leading-relaxed", isSelected ? "text-white/80" : "text-slate-500"].join(" ")}>
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 공통 + recordType별 입력 필드 */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
            {/* 프로젝트명 / 업무명 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                {projectRecordType === "personal" ? "업무명" : "프로젝트명"}
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder={getProjectNamePlaceholder()}
                className="h-9 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
              />
            </div>

            {/* 진행 기간 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">진행 기간</label>
              <p className="text-xs text-slate-400">날짜를 선택하거나 빠른 기간을 골라주세요.</p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PERIOD_LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setProjectPeriod(label);
                      setProjectStartDate("");
                      setProjectEndDate("");
                    }}
                    className={[
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      projectPeriod === label && !projectStartDate && !projectEndDate
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-500 hover:bg-slate-100 hover:text-slate-950 hover:shadow-sm",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={projectStartDate}
                  onChange={(event) => {
                    setProjectStartDate(event.target.value);
                    setProjectPeriod("");
                  }}
                  className="h-9 flex-1 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                />
                <span className="text-xs text-slate-400">~</span>
                <input
                  type="date"
                  value={projectEndDate}
                  onChange={(event) => {
                    setProjectEndDate(event.target.value);
                    setProjectPeriod("");
                  }}
                  className="h-9 flex-1 rounded-md border border-slate-200 px-3 text-sm text-slate-700 outline-none transition-colors focus:border-slate-400"
                />
              </div>
            </div>

            {/* teamProject 전용: 팀 목표 */}
            {projectRecordType === "teamProject" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">팀 목표</label>
                <Textarea
                  value={projectGoal}
                  onChange={(event) => setProjectGoal(event.target.value)}
                  placeholder={projectPlaceholders.projectGoal || "예) 사용자가 기록한 경험이 이력서로 이어지는 흐름을 더 쉽게 이해하도록 화면 구조와 문구를 개선합니다."}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            )}

            {/* teamProject 전용: 내 역할 */}
            {projectRecordType === "teamProject" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">내 역할</label>
                <Textarea
                  value={projectContext}
                  onChange={(event) => setProjectContext(event.target.value)}
                  placeholder={getProjectContextPlaceholder()}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            )}

            {/* 무슨 일을 했나요? / 이번에 처리한 일 */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                {projectRecordType === "personal" ? "무슨 일을 했나요?" : "이번에 처리한 일"}
              </label>
              <Textarea
                value={projectActions}
                onChange={(event) => setProjectActions(event.target.value)}
                placeholder={getProjectActionsPlaceholder()}
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* teamProject 전용: 완료했거나 다음으로 해야 할 일 */}
            {projectRecordType === "teamProject" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">완료했거나 다음으로 해야 할 일</label>
                <Textarea
                  value={projectInsight}
                  onChange={(event) => setProjectInsight(event.target.value)}
                  placeholder={projectPlaceholders.projectInsight || "예) 팀 업무와 개인 업무를 나누는 방식이 더 직관적인지 추가 확인이 필요합니다."}
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
            )}
          </div>

          {/* 업무/기여 유형 칩 */}
          <TagEditorSection
            label={projectRecordType === "personal" ? "어떤 일에 가까웠나요?" : "어떤 기여에 가까웠나요?"}
            options={workOptions}
            inputValue={workInput}
            selected={roleTags}
            addLabel="추가"
            placeholder="직접 추가"
            onToggle={(tag) => setRoleTags((current) => toggleItem(current, tag))}
            onInputChange={setWorkInput}
            onAdd={addCustomWorkTag}
            onRemove={(tag) => {
              setWorkOptions((current) => removeItem(current, tag));
              setRoleTags((current) => removeItem(current, tag));
            }}
          />

          {/* 변화 유형 칩 */}
          <TagEditorSection
            label="어떤 변화가 있었나요?"
            options={resultOptions}
            inputValue={resultInput}
            selected={resultTags}
            addLabel="추가"
            placeholder="직접 추가"
            onToggle={(tag) => setResultTags((current) => toggleItem(current, tag))}
            onInputChange={setResultInput}
            onAdd={addCustomResultTag}
            onRemove={(tag) => {
              setResultOptions((current) => removeItem(current, tag));
              setResultTags((current) => removeItem(current, tag));
            }}
          />

          {/* 자세히 남기기 토글 */}
          <button
            type="button"
            onClick={() => setShowProjectDetails((current) => !current)}
            className="self-start text-xs font-medium text-slate-500 transition-colors hover:text-slate-700 underline-offset-2 hover:underline"
          >
            {showProjectDetails ? "자세히 입력 닫기" : "자세히 남기기"}
          </button>

          {/* 자세히 남기기 내용 */}
          {showProjectDetails && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-3">
              {/* personal 전용 상세 필드 */}
              {projectRecordType === "personal" && (
                <>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">해결하려던 문제</label>
                    <Textarea
                      value={projectContext}
                      onChange={(event) => setProjectContext(event.target.value)}
                      placeholder={getProjectContextPlaceholder()}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">목표 한 줄</label>
                    <Textarea
                      value={projectGoal}
                      onChange={(event) => setProjectGoal(event.target.value)}
                      placeholder={projectPlaceholders.projectGoal || ""}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">결과나 변화</label>
                    <Textarea
                      value={projectResult}
                      onChange={(event) => setProjectResult(event.target.value)}
                      placeholder={projectPlaceholders.projectResult || ""}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">배운 점/다음 개선</label>
                    <Textarea
                      value={projectInsight}
                      onChange={(event) => setProjectInsight(event.target.value)}
                      placeholder={projectPlaceholders.projectInsight || ""}
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>
                </>
              )}

              {/* teamProject 전용 상세 필드 */}
              {projectRecordType === "teamProject" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">결과나 변화</label>
                  <Textarea
                    value={projectResult}
                    onChange={(event) => setProjectResult(event.target.value)}
                    placeholder={projectPlaceholders.projectResult || ""}
                    rows={2}
                    className="resize-none text-sm"
                  />
                </div>
              )}

              {/* 공통: 협업 맥락 태그 */}
              <TagEditorSection
                label="협업 맥락"
                options={contextOptions}
                inputValue={contextInput}
                selected={collaborationTags}
                addLabel="추가"
                placeholder="프로젝트 협업 맥락 추가"
                onToggle={(tag) => setCollaborationTags((current) => toggleItem(current, tag))}
                onInputChange={setContextInput}
                onAdd={addCustomContextTag}
                onRemove={(tag) => {
                  setContextOptions((current) => removeItem(current, tag));
                  setCollaborationTags((current) => removeItem(current, tag));
                }}
              />
            </div>
          )}
        </>
      ) : (
        <>
          {collapseStructuredSections && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">{copy.textLabel}</label>
              <Textarea
                placeholder={weeklyTextPlaceholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
            </div>
          )}
          <TagEditorSection
            label="이번 주 업무 유형"
            defaultCollapsed={collapseStructuredSections}
            options={workOptions}
            inputValue={workInput}
            selected={roleTags}
            addLabel="추가"
            placeholder="이번 주에 맞는 업무 유형 추가"
            onToggle={(tag) => setRoleTags((current) => toggleItem(current, tag))}
            onInputChange={setWorkInput}
            onAdd={addCustomWorkTag}
            onRemove={(tag) => {
              setWorkOptions((current) => removeItem(current, tag));
              setRoleTags((current) => removeItem(current, tag));
            }}
          />
          {selectedGuide ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-900">{selectedGuideTitle}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    이번 주에 한 일만 짧게 남겨도 됩니다. 나중에 이력서 문장으로 바꿀 수 있어요.
                  </p>
                </div>
                <span className="max-w-full break-words rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  기준 태그: {selectedGuide.sourceLabel}
                </span>
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <div className="text-xs font-semibold text-slate-700">막히면 이것만 적어보세요</div>
                <ol className="mt-2 space-y-1.5">
                  {selectedGuide.questions.map((question, index) => (
                    <li key={question} className="flex gap-2 text-sm leading-relaxed text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                        {index + 1}
                      </span>
                      <span>{question}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {selectedGuide.quickDraftChips?.length && quickDraftGuideOpen ? (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="text-xs font-semibold text-slate-700">작성 도우미</div>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                    막히면 아래 선택지를 눌러 초안을 시작할 수 있습니다. 전부 고를 필요는 없습니다.
                  </p>
                  <div className="mt-2 space-y-2">
                    {selectedGuide.quickDraftChips.map((group) => (
                      <div key={group.label} className="space-y-1">
                        <div className="text-[11px] font-medium text-slate-500">{group.label}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.options.map((option) => {
                            const isAlreadyInserted = text.includes(option);
                            return (
                              <button
                                key={option}
                                type="button"
                                disabled={isAlreadyInserted}
                                title={isAlreadyInserted ? "이미 초안에 들어갔어요" : `${option} 초안 추가`}
                                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                  isAlreadyInserted
                                    ? "border-slate-200 bg-slate-100 text-slate-400"
                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                                }`}
                                onClick={() =>
                                  setText((current) => appendQuickDraftChipToText(current, option, group.label))
                                }
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-3 border-t border-slate-200 pt-2.5">
                <div className="text-[11px] font-semibold text-slate-400">예시</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{selectedGuide.example}</p>
              </div>
            </div>
          ) : null}
          <TagEditorSection
            label="협업 맥락"
            defaultCollapsed={collapseStructuredSections}
            options={contextOptions}
            inputValue={contextInput}
            selected={collaborationTags}
            addLabel="추가"
            placeholder="이번 기록에 맞는 협업 맥락 추가"
            onToggle={(tag) => setCollaborationTags((current) => toggleItem(current, tag))}
            onInputChange={setContextInput}
            onAdd={addCustomContextTag}
            onRemove={(tag) => {
              setContextOptions((current) => removeItem(current, tag));
              setCollaborationTags((current) => removeItem(current, tag));
            }}
          />
          <TagEditorSection
            label="기억할 성과나 변화 (선택)"
            defaultCollapsed={collapseStructuredSections}
            options={resultOptions}
            inputValue={resultInput}
            selected={resultTags}
            addLabel="추가"
            placeholder="이번 주에 있었던 성과나 변화 추가"
            onToggle={(tag) => setResultTags((current) => toggleItem(current, tag))}
            onInputChange={setResultInput}
            onAdd={addCustomResultTag}
            onRemove={(tag) => {
              setResultOptions((current) => removeItem(current, tag));
              setResultTags((current) => removeItem(current, tag));
            }}
          />
          {!collapseStructuredSections && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">{copy.textLabel}</label>
              <Textarea
                placeholder={weeklyTextPlaceholder}
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={normalizedTrack === "weekly" ? 4 : 3}
                className="resize-none text-sm"
              />
            </div>
          )}
        </>
      )}

      {/* AI 정리 미리보기 섹션 */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handlePreviewAiRecordSummary}
          className="w-full rounded-xl border border-slate-200 bg-gradient-to-br from-violet-50 to-blue-50 px-4 py-3 text-center text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:from-violet-100 hover:to-blue-100 active:opacity-90"
        >
          ✨ AI로 정리해보기
        </button>
        <p className="text-xs leading-relaxed text-slate-400">
          작성한 업무 기록을 바탕으로 업무 유형, 협업 맥락, 성과와 보완 질문을 미리 정리합니다.
        </p>
      </div>

      {aiRecordSummaryError && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5">
          <p className="text-xs text-slate-500">{aiRecordSummaryError}</p>
        </div>
      )}

      {aiRecordSummaryPreview && (
        <div className="space-y-3 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/50 to-blue-50/50 p-4">
          <h4 className="font-semibold text-slate-900">PASSMAP이 이렇게 정리했어요</h4>

          {/* 업무 유형 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-700">업무 유형</p>
            <div className="flex flex-wrap gap-1.5">
              {aiRecordSummaryPreview.workTypeTags.length > 0 ? (
                aiRecordSummaryPreview.workTypeTags.map((tag) => (
                  <span
                    key={`${tag.id}-${tag.source}`}
                    className="inline-flex items-center rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag.label}
                    {tag.source === "existing" && (
                      <span className="ml-1 text-[10px] text-slate-400">✓</span>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">아직 뚜렷한 업무 유형을 찾지 못했어요.</p>
              )}
            </div>
          </div>

          {/* 협업 맥락 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-700">협업 맥락</p>
            <div className="flex flex-wrap gap-1.5">
              {aiRecordSummaryPreview.collaborationContextTags.length > 0 ? (
                aiRecordSummaryPreview.collaborationContextTags.map((tag) => (
                  <span
                    key={`${tag.id}-${tag.source}`}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag.label}
                    {tag.source === "existing" && (
                      <span className="ml-1 text-[10px] text-slate-400">✓</span>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">협업 대상이 드러나지 않았어요.</p>
              )}
            </div>
          </div>

          {/* 성과/변화 */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-700">성과/변화</p>
            <div className="flex flex-wrap gap-1.5">
              {aiRecordSummaryPreview.outcomeTags.length > 0 ? (
                aiRecordSummaryPreview.outcomeTags.map((tag) => (
                  <span
                    key={`${tag.id}-${tag.source}`}
                    className="inline-flex items-center rounded-full border border-green-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
                  >
                    {tag.label}
                    {tag.source === "existing" && (
                      <span className="ml-1 text-[10px] text-slate-400">✓</span>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-400">결과나 변화가 아직 구체적으로 드러나지 않았어요.</p>
              )}
            </div>
          </div>

          {/* 역량 신호 */}
          {aiRecordSummaryPreview.skillSignals.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-700">역량 신호</p>
              <div className="space-y-1">
                {aiRecordSummaryPreview.skillSignals.slice(0, 3).map((signal) => (
                  <div key={signal.id} className="text-xs">
                    <p className="font-medium text-slate-700">{signal.label}</p>
                    <p className="text-slate-500">{signal.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이력서 활용 가능성 */}
          <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white/60 p-2.5">
            <p className="text-xs font-medium text-slate-700">이력서 활용 가능성</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-900">
                {aiRecordSummaryPreview.resumeUsefulness.level === "high"
                  ? "높음"
                  : aiRecordSummaryPreview.resumeUsefulness.level === "medium"
                    ? "보통"
                    : "낮음"}
              </span>
              <span className="text-xs text-slate-600">
                {aiRecordSummaryPreview.resumeUsefulness.reason}
              </span>
            </div>
          </div>

          {/* 보완 질문 */}
          {aiRecordSummaryPreview.followUpQuestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-slate-700">보완 질문</p>
              <ul className="space-y-1">
                {aiRecordSummaryPreview.followUpQuestions.map((question, idx) => (
                  <li key={idx} className="flex gap-2 text-xs text-slate-600">
                    <span className="text-slate-400">•</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 경고 메시지 */}
          {aiRecordSummaryPreview.warnings.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-2.5">
              {aiRecordSummaryPreview.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-slate-500">
                  {warning}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {typeof onOpenResumeView === "function" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5">
          <p className="text-xs leading-relaxed text-slate-400">
            {aiDescriptionText ?? (canGenerateAiResumeDraft
              ? "저장된 업무기록을 바탕으로 AI가 이력서 문장 초안을 만들어드립니다."
              : "업무기록을 먼저 저장하면 AI가 이력서 문장 초안을 만들 수 있습니다.")}
          </p>
          <button
            type="button"
            disabled={!canGenerateAiResumeDraft}
            onClick={canGenerateAiResumeDraft ? onOpenResumeView : undefined}
            className={[
              "mt-2 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition",
              canGenerateAiResumeDraft
                ? "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                : "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400",
            ].join(" ")}
          >
            {aiButtonLabel ?? "AI 초안 만들기"}
          </button>
        </div>
      ) : null}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-1 sm:flex-row">
        <Button type="button" variant="outline" onClick={handleLoadSample} className="w-full sm:flex-1">
          {copy.sampleLabel}
        </Button>
        <Button type="submit" disabled={!canSubmit} className="w-full sm:flex-1">
          {copy.submitLabel}
        </Button>
      </div>
    </form>
  );
}
