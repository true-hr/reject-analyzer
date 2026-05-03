# Axis2 Lift Rendering Field Hotfix

## 1. 문제

Batch 2-A에서 industry guide의 lift 문구(산업별 보강 지침)를 explanationExtra에 추가할 때:
- 필드명: `industryLift`로 설정
- 실제 UI 렌더링 기준: `liftOrLimit` 필드 검색

따라서 추가된 industry lift 문구가 사용자에게 보이지 않는 상황 발생.

## 2. 수정

**파일**: `src/data/transitionLite/axisExplanationRegistry.js`

**변경**:
```javascript
// Before
...(industryGuide && industryGuide.lift ? { industryLift: industryGuide.lift } : {}),

// After
...(industryGuide && industryGuide.lift ? { liftOrLimit: industryGuide.lift } : {}),
```

**Line**: 2502

## 3. 의도

- Axis2 산업별 lift 문구를 기존 UI 렌더링 경로와 일치시킴
- TransitionLiteResult.jsx가 기대하는 필드명으로 맞춤
- 별도 UI 변경 없이 이미 존재하는 "다음 보강 방향" 섹션에 표시 가능하게 함

## 4. 영향 범위

**적용 대상**:
- Axis2 buildNewgradDomainInterestExplanation 함수 호출 시
- industryGuide가 존재할 때만 적용
- industryGuide.lift가 있는 경우만 override

**유지되는 것**:
- industryGuide 없는 산업: 기존 generic slots 기반 liftOrLimit 유지
- Axis1/3/4/5: 해당 함수 호출 없음, 영향 없음
- 기본 return shape: makeExplanation 호출 구조 유지

## 5. 정적 검증

### A. 필드명 일치 확인
- axisExplanationRegistry.js 2502줄: `liftOrLimit: industryGuide.lift` ✓
- TransitionLiteResult.jsx 3127줄: `explanation?.liftOrLimit` 추출 ✓
- TransitionLiteResult.jsx 3257줄: `hasSlots && slotLiftOrLimit` 조건으로 렌더링 ✓

### B. return shape 유지
- explanationExtra 확산 순서:
  1. pickExperienceExplanationExtra(signals)
  2. buildNewgradExplanationSlots(...) → 기본 liftOrLimit 제공
  3. industryGuide.lift override (필드명: liftOrLimit)
  4. selectionPack
- makeExplanation(summary, positives, gaps, upgradedReasons, explanationExtra) 호출 유지 ✓

### C. 조건부 적용 확인
- `industryGuide && industryGuide.lift` 조건 유지 ✓
- 조건 불만족 시 빈 객체 {} 추가, liftOrLimit 추가 안 됨 ✓

### D. 한글 인코딩
- 파일 저장 후 한글 샘플 확인:
  - "전공" (2200줄)
  - "교과목" (2243줄)
  - "이 직무는 전공 적합성을 비교적 중요하게 보는 편..." (2251줄)
- mojibake 패턴 없음 ✓

## 6. 위험 분석

### 가능한 부작용
1. **slots 기반 liftOrLimit override**
   - buildNewgradExplanationSlots에서 liftOrLimit 제공 가능
   - industryGuide 존재 시 후속 spread에서 override됨
   - 의도된 동작: industryGuide lift가 generic lift보다 우선
   - 리스크: 낮음 (spread 순서 명시적)

2. **문구 길이**
   - industryGuide.lift는 industry guide registry에서 관리
   - 기존 "다음 보강 방향" 섹션 UI 크기 확인 필요
   - 리스크: 중간 (실제 렌더링 길이 미확인)

3. **런타임 미확인**
   - JavaScript 런타임 현재 세션 불가
   - 정적 분석과 코드 경로만 검증
   - 리스크: 중간 (빌드/회귀 테스트 불가)

## 7. 런타임 검증 상태

### 불가능 항목
- `npm run build`: JavaScript runtime unavailable in current Claude session
- `node scripts/regression/run-newgrad-axis-baseline.mjs`: JavaScript runtime unavailable
- `node scripts/regression/run-newgrad-ui-insight-surface-smoke.mjs`: JavaScript runtime unavailable

### 정적 검증 대체
- 코드 경로 분석: ✓ 완료
- 필드명 일치: ✓ 확인
- return shape: ✓ 유지
- 한글 인코딩: ✓ 정상

## 8. 다음 단계

1. **PR 생성 및 머지**
   - `fix/newgrad-axis2-lift-rendering-field` 브랜치
   - 1줄 필드명 hotfix PR

2. **런타임 검증 (사용자 환경에서)**
   - build 후 신입 보고서 Axis2 섹션 렌더링 확인
   - industry lift 문구가 "다음 보강 방향" 섹션에 표시되는지 확인
   - 기존 Axis2 summary/positives/gaps 영향 여부 확인

3. **Axis2 Batch 2-B ComparisonBlock 진행**
   - "確認됨" 문구 명확화 조사 재개
   - 제품 설계 승인 후 구현
   - 별도 hotfix 또는 배치로 처리

## 9. 요약

| 항목 | 내용 |
|------|------|
| 수정 파일 | src/data/transitionLite/axisExplanationRegistry.js |
| 변경 내용 | industryLift → liftOrLimit (1줄) |
| 목적 | UI 렌더링 필드명 일치 |
| 적용 범위 | Axis2, industryGuide 있는 경우만 |
| 정적 검증 | ✓ 완료 |
| 한글 인코딩 | ✓ 정상 |
| 런타임 검증 | ✗ JavaScript runtime unavailable |
| 리스크 | 낮음 (1줄 필드명 hotfix) |
| 다음 단계 | PR 생성, 런타임 검증 후 ComparisonBlock 진행 |
