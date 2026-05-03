/**
 * Axis 1 copy-only registry for major-side canonical actions.
 *
 * This file must never affect Axis 1 scoring.
 * It exists only to generate safer, more concrete job-structure reading copy.
 */

function toStr(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function normalizeMajorCanonicalKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s/()[\]{}.,:&+_-]+/g, "");
}

export const MAJOR_CANONICAL_ACTIONS = Object.freeze({
  COMPUTER_SCIENCE: Object.freeze({
    label: "컴퓨터공학",
    normalizedKeys: ["컴퓨터공학"],
    canonicalActions: ["논리적 문제 분석", "알고리즘 사고", "시스템 구현", "데이터 처리"],
    learningBasis: ["프로그래밍 과제", "자료구조/알고리즘 수업", "시스템 또는 데이터 관련 프로젝트"],
  }),
  SOFTWARE: Object.freeze({
    label: "소프트웨어",
    normalizedKeys: ["소프트웨어"],
    canonicalActions: ["요구사항 해석", "코드 구조화", "기능 구현", "테스트 반복"],
    learningBasis: ["소프트웨어 설계 수업", "구현 과제", "팀 개발 프로젝트"],
  }),
  INDUSTRIAL_ENGINEERING: Object.freeze({
    label: "산업공학",
    normalizedKeys: ["산업공학"],
    canonicalActions: ["공정 흐름 분석", "운영 효율 개선", "데이터 기반 판단", "프로세스 설계"],
    learningBasis: ["공정/품질 수업", "최적화 과제", "운영 개선 프로젝트"],
  }),
  ELECTRICAL_ELECTRONIC: Object.freeze({
    label: "전자 / 전기",
    normalizedKeys: ["전자전기"],
    canonicalActions: ["회로·시스템 이해", "제어 로직 분석", "하드웨어-소프트웨어 연계", "테스트 검증"],
    learningBasis: ["회로/제어 수업", "실험 과목", "임베디드 또는 시스템 프로젝트"],
  }),
  OTHER_ENGINEERING: Object.freeze({
    label: "기타 공학",
    normalizedKeys: ["기타공학"],
    canonicalActions: ["문제 원인 분석", "설계 기준 이해", "기술 문서 정리", "실험·검증 반복"],
    learningBasis: ["전공 실험", "설계 과제", "기술 프로젝트"],
  }),
  BUSINESS_ADMIN: Object.freeze({
    label: "경영학",
    normalizedKeys: ["경영학"],
    canonicalActions: ["문제 정의", "요구사항 정리", "우선순위 판단", "성과 구조 이해"],
    learningBasis: ["경영/전략 수업", "케이스 분석 과제", "기획 프로젝트"],
  }),
  ECONOMICS: Object.freeze({
    label: "경제학",
    normalizedKeys: ["경제학"],
    canonicalActions: ["수치 해석", "시장 구조 분석", "가설 기반 판단", "지표 읽기"],
    learningBasis: ["경제이론 수업", "계량 과제", "시장 분석 프로젝트"],
  }),
  ACCOUNTING_TAX: Object.freeze({
    label: "회계 / 세무",
    normalizedKeys: ["회계세무"],
    canonicalActions: ["기준 확인", "숫자 대조", "증빙 검토", "마감 흐름 이해"],
    learningBasis: ["회계 원리 수업", "분개/재무제표 과제", "세무 실습 또는 사례 과제"],
  }),
  FINANCE: Object.freeze({
    label: "금융",
    normalizedKeys: ["금융"],
    canonicalActions: ["수치 분석", "리스크 판단", "재무 구조 이해", "근거 기반 의사결정"],
    learningBasis: ["재무/투자 수업", "금융 모델 과제", "시장 분석 프로젝트"],
  }),
  OTHER_BUSINESS: Object.freeze({
    label: "기타 상경",
    normalizedKeys: ["기타상경"],
    canonicalActions: ["운영 흐름 이해", "시장 정보 정리", "문제 구조화", "기초 수치 해석"],
    learningBasis: ["상경 계열 수업", "케이스 과제", "기획 또는 분석 프로젝트"],
  }),
  PSYCHOLOGY_COUNSELING: Object.freeze({
    label: "심리 / 상담",
    normalizedKeys: ["심리상담"],
    canonicalActions: ["행동·니즈 분석", "관계 맥락 해석", "상담 기록 정리", "지원 방안 설계"],
    learningBasis: ["심리/상담 수업", "관찰·인터뷰 과제", "상담 실습 또는 팀 프로젝트"],
  }),
  MEDIA: Object.freeze({
    label: "언론 / 미디어",
    normalizedKeys: ["언론미디어"],
    canonicalActions: ["메시지 구성", "콘텐츠 기획", "맥락 해석", "반응 분석"],
    learningBasis: ["미디어 이론 수업", "기사/콘텐츠 제작 과제", "편집 또는 제작 프로젝트"],
  }),
  PUBLIC_POLICY: Object.freeze({
    label: "행정 / 정책",
    normalizedKeys: ["행정정책"],
    canonicalActions: ["제도·정책 해석", "공공 이슈 분석", "기준 문서 정리", "실행안 구조화"],
    learningBasis: ["행정/정책 수업", "정책 분석 과제", "공공 문제 프로젝트"],
  }),
  SOCIOLOGY: Object.freeze({
    label: "사회학",
    normalizedKeys: ["사회학"],
    canonicalActions: ["집단·행동 분석", "조사 결과 해석", "사회 맥락 정리", "문제 구조화"],
    learningBasis: ["사회조사 수업", "질적/양적 분석 과제", "리서치 프로젝트"],
  }),
  OTHER_HUMANITIES: Object.freeze({
    label: "기타 인문사회",
    normalizedKeys: ["기타인문사회"],
    canonicalActions: ["텍스트 해석", "맥락 정리", "자료 조사", "논리적 서술"],
    learningBasis: ["전공 읽기/쓰기 수업", "발표 과제", "문헌 또는 콘텐츠 프로젝트"],
  }),
  VISUAL_DESIGN: Object.freeze({
    label: "시각디자인",
    normalizedKeys: ["시각디자인"],
    canonicalActions: ["시각 구조 설계", "사용자 흐름 표현", "프로토타입 제작", "피드백 반영"],
    learningBasis: ["디자인 스튜디오 수업", "포트폴리오 과제", "브랜딩 또는 UI 프로젝트"],
  }),
  USER_EXPERIENCE: Object.freeze({
    label: "사용자 경험",
    normalizedKeys: ["사용자경험"],
    canonicalActions: ["사용자 니즈 분석", "화면 흐름 설계", "프로토타입 개선", "사용성 검토"],
    learningBasis: ["UX 리서치 수업", "와이어프레임 과제", "사용성 테스트 프로젝트"],
  }),
  VIDEO_CONTENT: Object.freeze({
    label: "영상 / 콘텐츠",
    normalizedKeys: ["영상콘텐츠"],
    canonicalActions: ["콘텐츠 구성", "스토리 흐름 설계", "편집 방향 정리", "반응 포인트 분석"],
    learningBasis: ["영상 제작 수업", "편집 과제", "콘텐츠 기획 프로젝트"],
  }),
  PR_AD: Object.freeze({
    label: "광고 / 홍보",
    normalizedKeys: ["광고홍보"],
    canonicalActions: ["메시지 전략 정리", "타깃 반응 분석", "콘텐츠 소재 구성", "커뮤니케이션 기획"],
    learningBasis: ["광고/홍보 수업", "캠페인 과제", "브랜딩 또는 프로모션 프로젝트"],
  }),
  OTHER_DESIGN: Object.freeze({
    label: "기타 디자인",
    normalizedKeys: ["기타디자인"],
    canonicalActions: ["표현 방향 설정", "시각 요소 정리", "반복 개선", "협업 산출물 정리"],
    learningBasis: ["디자인 기초 수업", "실기 과제", "전공 프로젝트"],
  }),
  DOUBLE_MAJOR: Object.freeze({
    label: "복수전공",
    normalizedKeys: ["복수전공"],
    canonicalActions: ["서로 다른 관점 연결", "자료 정리", "문제 구조화", "기초 분석"],
    learningBasis: ["두 전공 수업", "교차 과제", "융합형 프로젝트"],
  }),
  CONVERGENCE_MAJOR: Object.freeze({
    label: "연계전공",
    normalizedKeys: ["연계전공"],
    canonicalActions: ["융합 주제 해석", "관점 통합", "문제 구조화", "기초 실험·분석"],
    learningBasis: ["융합 수업", "연계 과제", "복합형 프로젝트"],
  }),
  UNDECLARED_OTHER: Object.freeze({
    label: "전공 미정 / 기타",
    normalizedKeys: ["전공미정기타"],
    canonicalActions: ["기초 자료 조사", "문제 정리", "학습 내용 요약", "기본 과제 수행"],
    learningBasis: ["교양 또는 기초 수업", "탐색 과제", "일반 프로젝트"],
  }),
  MATH_STATISTICS: Object.freeze({
    label: "수학 / 통계",
    normalizedKeys: ["수학통계"],
    canonicalActions: ["수치 분석", "데이터 해석", "모델링 사고", "검증 기준 확인"],
    learningBasis: ["수학/통계 수업", "분석 과제", "데이터 프로젝트"],
  }),
  LAW: Object.freeze({
    label: "법학",
    normalizedKeys: ["법학"],
    canonicalActions: ["규정 해석", "쟁점 정리", "문서 기준 검토", "논리적 판단"],
    learningBasis: ["법학 수업", "판례/사례 과제", "법규 해석 프로젝트"],
  }),
  BIO_LIFE_SCIENCE: Object.freeze({
    label: "생명과학 / 바이오",
    normalizedKeys: ["생명과학바이오"],
    canonicalActions: ["실험 설계", "데이터 관찰·해석", "생물학적 메커니즘 이해", "연구 기록 정리"],
    learningBasis: ["생명과학 수업", "실험 과목", "랩 또는 연구 프로젝트"],
  }),
  PHARMACY: Object.freeze({
    label: "약학 / 제약",
    normalizedKeys: ["약학제약"],
    canonicalActions: ["약물·제형 이해", "검토 기준 확인", "데이터 해석", "규정 문서 검토"],
    learningBasis: ["약학/제약 수업", "실험 또는 실습 과제", "제형/품질 관련 프로젝트"],
  }),
  CHEMISTRY_CHEMICAL_ENGINEERING: Object.freeze({
    label: "화학 / 화학공학",
    normalizedKeys: ["화학화학공학"],
    canonicalActions: ["물질·공정 이해", "실험 설계", "데이터 해석", "공정 변수 검토"],
    learningBasis: ["화학/공정 수업", "실험 과목", "공정 또는 분석 프로젝트"],
  }),
  ENVIRONMENT_SAFETY: Object.freeze({
    label: "환경 / 안전공학",
    normalizedKeys: ["환경안전공학"],
    canonicalActions: ["위험 요인 파악", "기준 준수 검토", "환경·공정 데이터 확인", "예방 방안 정리"],
    learningBasis: ["환경/안전 수업", "사례 과제", "점검 또는 개선 프로젝트"],
  }),
  ARCHITECTURE_CIVIL: Object.freeze({
    label: "건축 / 토목",
    normalizedKeys: ["건축토목"],
    canonicalActions: ["구조·공간 이해", "도면·기준 검토", "프로젝트 단계 정리", "현장 이슈 분석"],
    learningBasis: ["설계 스튜디오", "도면 과제", "현장 또는 설계 프로젝트"],
  }),
  MATERIALS_SCIENCE: Object.freeze({
    label: "재료 / 신소재공학",
    normalizedKeys: ["재료신소재공학"],
    canonicalActions: ["재료 특성 분석", "실험·측정 결과 해석", "공정 조건 이해", "기술 자료 정리"],
    learningBasis: ["재료 수업", "측정/분석 실험", "소재 프로젝트"],
  }),
});

const NORMALIZED_MAJOR_KEY_TO_ID = Object.freeze(
  Object.entries(MAJOR_CANONICAL_ACTIONS).reduce((acc, [canonicalId, entry]) => {
    for (const rawKey of entry.normalizedKeys || []) {
      const normalizedKey = normalizeMajorCanonicalKey(rawKey);
      if (normalizedKey) acc[normalizedKey] = canonicalId;
    }
    const labelKey = normalizeMajorCanonicalKey(entry.label);
    if (labelKey) acc[labelKey] = canonicalId;
    return acc;
  }, {})
);

const FALLBACK_MAJOR_ENTRY = Object.freeze({
  canonicalId: "UNDECLARED_OTHER",
  label: "현재 입력한 전공",
  canonicalActions: ["기초 자료 조사", "문제 정리", "학습 내용 요약"],
  learningBasis: ["전공 수업", "과제", "프로젝트"],
});

export function getMajorCanonicalActionEntry(canonicalId) {
  if (!canonicalId) return null;
  const entry = MAJOR_CANONICAL_ACTIONS[canonicalId];
  return entry ? { canonicalId, ...entry } : null;
}

export function resolveMajorCanonicalActions(majorKey = "", majorLabel = "") {
  const candidateKeys = [
    normalizeMajorCanonicalKey(majorKey),
    normalizeMajorCanonicalKey(majorLabel),
  ].filter(Boolean);

  for (const candidateKey of candidateKeys) {
    const canonicalId = NORMALIZED_MAJOR_KEY_TO_ID[candidateKey];
    if (canonicalId) {
      return getMajorCanonicalActionEntry(canonicalId);
    }
  }

  return {
    ...FALLBACK_MAJOR_ENTRY,
    label: toStr(majorLabel) || FALLBACK_MAJOR_ENTRY.label,
  };
}

export default {
  MAJOR_CANONICAL_ACTIONS,
  getMajorCanonicalActionEntry,
  resolveMajorCanonicalActions,
};
