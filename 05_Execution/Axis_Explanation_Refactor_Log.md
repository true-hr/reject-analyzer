# Axis Explanation Refactor Log

## 2026-04-08

### decision

5축 explanation 강화 작업의 0단계로 출력 계약을 SSOT 문서로 분리했다.

### files planned

- `00_HQ/Axis_Explanation_Output_Contract.md`
- `00_HQ/Axis_Explanation_Writing_Rules.md`
- `00_HQ/Axis_Explanation_QA_Checklist.md`

### why

기존 구조는 축 설명의 목적/필드/문장 슬롯/QA 기준이 분리되어 있지 않아,
producer/UI/fallback 경계가 흔들리고 설명 반복이 발생할 위험이 컸다.

### locked rules

- explanationCard 4슬롯 구조 고정
- producer 생성 / UI 렌더 원칙 고정
- scoreReason + liftOrLimit 필수화
- fallback은 예외 경로로만 허용

### next

- 축별 평가 기준 정의서 작성
- 축별 점수 앵커 1~5 표 작성
- evidence schema 확장 설계

---

## 2026-04-08 (설계 라운드)

### decision

슬롯별 조립 계약 설계 완료. 코드 변경 없음.

### files created

- `00_HQ/Newgrad_Axis_Explanation_Assembly_Contract.md`

### key findings

- lead / scoreReason: 기존 summary builder / reasons helper 재사용 가능
- criteria: 기존 자산 없음. 축별 고정 1문장 템플릿 5개 신규 정의 (문서에 초안 포함)
- liftOrLimit: gaps[] 소재 재사용하되 "현재 부족" → "추가되면 상승" 프레임으로 reframe 필요
- Axis5 limiting evidence thin: negative reason이 no_strengths 1개뿐. mid band용 limiting reason 신규 추가 필요
- UI 변경 필요: `TransitionLiteResult.jsx:1191`이 `explanation.summary`를 main body로 렌더. `explanation.lead || explanation.summary` backward compatible 변경 + expanded detail에 criteria/scoreReason/liftOrLimit 블록 추가 필요

### verdict

DESIGN VERDICT: READY WITH CONSTRAINTS

구현 시작 전 precondition 2개:
1. Axis5 builder에 mid/low band limiting reason 1개 추가
2. `makeExplanation()` 확장 방식(signature 변경 vs 별도 함수) 확인 — experienced 5축 영향 범위

---

## 2026-04-08 (3단계. explanation-ready evidence schema)

### files created

- `00_HQ/Explanation_Ready_Evidence_Schema.md`

### key findings

- 입력 타입별 explanation-ready evidence schema 정의 완료 (major/project/internship/contract/certification/strengths/workstyle/meta)
- 축별 evidence reading map 정의 완료 (Axis1~5)
- scorer signal vs explanation evidence 분리 원칙 문서화

### verdict

DOCUMENT STATUS: WRITTEN
