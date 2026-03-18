# PHASE 0 — Scope Lock

## 1. Goal

이번 단계의 목적은 해석 엔진 구현이 아니라 **입력 계약(Input Contract) 범위를 고정**하는 것이다.

즉, PASSMAP가 이후 산업/직무 해석을 안정적으로 확장할 수 있도록 아래를 먼저 잠근다.

- 이번 MVP에서 실제로 사용할 입력
- 이번 MVP에서 신규 추가할 입력
- 기존 레거시 필드 유지 원칙
- 이번 단계에서 수정하지 않을 범위
- Phase 1에서 반영할 최소 패치 범위

이번 단계는 **출력 개선 단계가 아니라 입력 구조 고정 단계**다.

---

## 2. In Scope

이번 MVP에서 그대로 유지하고 사용하는 기존 입력은 아래와 같다.

- 현재 산업 대분류
- 지원 산업 대분류
- 현재 직무 문자열
- 지원 직무 문자열
- 총 경력
- 공백기
- 이직 횟수
- 리더 경험
- 최종 학력
- 나이
- 현재 기업 규모
- 지원 기업 규모
- 현재 연봉
- 목표 연봉
- JD 텍스트
- Resume 텍스트
- 첨부파일 기반 입력

이번 단계에서는 위 입력을 제거하거나 의미를 바꾸지 않는다.

---

## 3. New Fields

이번 Phase 0에서 신규 확정하는 필드는 아래 4개다.

- `industryCurrentSub`
- `industryTargetSub`
- `roleCurrentSub`
- `roleTargetSub`

### Field Policy

- 타입: `string`
- 초기값: `""`
- nullable 사용 안 함
- Phase 1에서 `defaultState`, `InputFlow`, `canonical input`까지 연결한다

### Intended Meaning

- `industryCurrentSub`
  - 현재 산업의 중분류
- `industryTargetSub`
  - 지원 산업의 중분류
- `roleCurrentSub`
  - 현재 직무의 범용 중분류
- `roleTargetSub`
  - 지원 직무의 범용 중분류

이 4개는 이후 해석 엔진에서 사용할 **범용 중분류 SSOT 후보**다.

---

## 4. Legacy Fields Policy

기존 KSCO 계열 필드는 이번 단계에서 유지한다.

### 대상 필드

- `roleKscoMajor`
- `roleKscoOfficeSub`
- `currentRoleKscoMajor`
- `currentRoleKscoOfficeSub`

### 원칙

- 삭제 금지
- rename 금지
- 의미 변경 금지
- 이번 MVP의 범용 중분류 SSOT로 승격 금지
- 레거시/보조 분류 힌트로 유지

### 이유

기존 KSCO 필드는 일부 경로에서 이미 연결되어 있을 수 있으며, office 계열 중심의 부분 구현 성격이 있다.  
반면 이번에 만들려는 `roleCurrentSub`, `roleTargetSub`은 PASSMAP 해석 엔진용 **범용 직무 중분류 축**이다.

즉 아래처럼 역할을 분리한다.

- 기존 KSCO 필드: 레거시/보조 분류
- 신규 Sub 필드: PASSMAP 해석용 중분류 SSOT

---

## 5. Input Contract SSOT

이번 단계 기준 입력 계약 구조는 아래와 같이 본다.

### Industry

- `industryCurrent`
- `industryCurrentSub`
- `industryTarget`
- `industryTargetSub`

### Role

- `roleCurrent` 또는 기존 현재 직무 문자열 필드
- `roleCurrentSub`
- `roleTarget` 또는 기존 지원 직무 문자열 필드
- `roleTargetSub`

### Note

- 직무 문자열 필드는 사용자가 보는 라벨/직무명 역할을 유지한다
- 신규 `roleCurrentSub`, `roleTargetSub`은 해석 엔진용 중분류 축 역할을 맡는다
- canonical input 단계에서 위 필드들이 명시적으로 통과되어야 한다

---

## 6. Required Files for Phase 1

Phase 1 입력 계약 반영 시 필수 수정 파일은 아래 3개로 고정한다.

1. `src/lib/schema.js`
2. `src/components/input/InputFlow.jsx`
3. `src/lib/analysis/buildCanonicalAnalysisInput.js`

### 역할

- `schema.js`
  - 신규 4필드 기본값 추가
- `InputFlow.jsx`
  - 신규 4필드 write path 연결
- `buildCanonicalAnalysisInput.js`
  - 신규 4필드 canonical contract 반영

---

## 7. Optional File

아래 파일은 선택 수정이다.

- `src/lib/persistence/saveAnalysisRun.js`

### 선택 이유

이 파일은 원격 저장 메타까지 신규 4필드를 같이 남기고 싶을 때만 수정한다.  
분석 실행 자체를 위해 필수는 아니다.

---

## 8. Out of Scope

이번 Phase 0 / Phase 1 범위에서는 아래를 하지 않는다.

### Analysis / Decision / Simulation

- `src/lib/analyzer.js` 핵심 scoring 수정
- `src/lib/decision/index.js` 수정
- gate / penalty / ranking 구조 수정
- Top3 / risk / type / currentFlow SSOT 수정
- `buildSimulationViewModel.js` 중심 로직 수정

### Report / UI Output

- 리포트 출력 규칙 수정
- 해석 문장 생성 규칙 수정
- report card 추가/수정
- simulator headline/detail 구조 수정

### Advanced Taxonomy / Logic

- 세분류 도입
- 자동 taxonomy 추론
- KSCO 표준 정교 매핑
- 산업/직무 상호작용 규칙 구현
- candidateAxisPack 구현
- interaction resolver 구현
- 리스크 산식 설계
- scoring 반영

즉 이번 단계는 어디까지나 **입력 계약 고정까지만** 한다.

---

## 9. Non-Modification Lock

이번 단계에서는 아래 범위를 잠근다.

- `src/App.jsx`
- `src/hooks/usePersistedState.js`
- `src/lib/storage.js`
- `api/save-analysis-run.js`
- `supabase/sql/20260316_analysis_runs_mvp.sql`
- `src/lib/analyzer.js`
- `src/lib/decision/index.js`
- `src/lib/simulation/buildSimulationViewModel.js`
- `src/components/report/ReportSection.jsx`
- `src/components/SimulatorLayout.jsx`

단, Phase 1 진행 중 실제 코드 확인 결과 필수 수정이 발견되면 그때 별도 승인 후 확장한다.  
기본 원칙은 **확장 금지 / 최소 패치 유지**다.

---

## 10. Phase 1 Execution Order

Phase 1은 입력 계약 반영 패치 단계다.

### Step 1
`src/lib/schema.js`

- 신규 4필드 추가
- 초기값 `""` 설정

### Step 2
`src/components/input/InputFlow.jsx`

- 산업 current/target 입력 시 `industryCurrentSub`, `industryTargetSub` write 연결
- 직무 current/target sub 입력 시 기존 KSCO write 유지
- 동시에 `roleCurrentSub`, `roleTargetSub` write 추가
- append-only 방식 유지

### Step 3
`src/lib/analysis/buildCanonicalAnalysisInput.js`

- 신규 4필드를 canonical input에 명시 반영
- analyzer 이전 입력 계약을 고정

### Step 4
로컬 테스트

- 신규 필드 write 확인
- 분석 실행 정상 여부 확인
- 기존 입력/출력 회귀 여부 확인

### Step 5 (Optional)
`src/lib/persistence/saveAnalysisRun.js`

- 원격 저장 메타에 신규 4필드 추가 여부 결정

---

## 11. Done Criteria

Phase 0 / Phase 1 완료 기준은 아래와 같다.

- 신규 4필드가 `defaultState`에 존재한다
- InputFlow에서 실제 write 가능하다
- canonical input에 신규 4필드가 포함된다
- 기존 분석 실행이 깨지지 않는다
- 기존 저장/복원 흐름이 깨지지 않는다
- 기존 KSCO 계열 필드는 그대로 유지된다
- analyzer / decision / simulation / report 로직은 수정하지 않는다

---

## 12. One-Line Summary

이번 단계의 핵심은 아래 한 줄이다.

**기존 입력은 유지하고, 산업/직무 중분류 4개를 신규 범용 필드로 추가하여 입력 계약만 먼저 고정한다. 기존 KSCO 필드는 삭제하거나 대체하지 않고 레거시/보조 분류로 유지한다.**