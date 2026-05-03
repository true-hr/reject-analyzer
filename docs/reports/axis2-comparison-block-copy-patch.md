# Axis2 ComparisonBlock Copy Patch

## 1. 문제

Axis2 "산업 분야 이해도" comparisonBlock의 row 1 (major_cert_industry_relevance)에서:
- 기존 표현: "확인됨"
- 사용자 인식 위험: "산업 이해가 전체적으로 확인되었다"는 오해 가능
- 실제 의미: 전공/자격/입력 신호 중 일부가 목표 산업과 연결될 근거가 잡혔다는 뜻

이 문구 불명확성으로 인해:
- Axis1 전공 연결성과 Axis2 산업 이해도가 혼동될 수 있음
- 신입 입력값의 제한적 특성이 제대로 전달되지 않음
- Row 2/3에서 약한 신호와 모순으로 보일 수 있음

## 2. 수정

**기존 표현**:
```
확인됨
```

**변경 표현**:
```
전공·자격에서 일부 근거 확인
```

## 3. 수정 파일

- `src/lib/analysis/buildNewgradAxisPack.js` (line 3046)

## 4. 변경 내용

**함수**: `buildAxis2ComparisonBlock` (line 3017)

**Row**: `major_cert_industry_relevance`

**필드**: `currentValue`

**변경 전**:
```javascript
currentValue: signals.majorAligned || signals.certificationsAligned ? "확인됨" : "일부 보임",
```

**변경 후**:
```javascript
currentValue: signals.majorAligned || signals.certificationsAligned ? "전공·자격에서 일부 근거 확인" : "일부 보임",
```

## 5. 영향 범위

### Axis2 한정
- buildAxis2ComparisonBlock 함수 내부만 수정
- Axis2 comparisonBlock row 1 currentValue만 변경
- 다른 rows (row 2: context_industry_grounding, row 3: industry_exposure_repeatability) 영향 없음

### 다른 axis 영향 없음
- buildAxis1ComparisonBlock_legacy: 미수정 (2521줄 "확인됨" 그대로)
- buildAxis3ComparisonBlock_legacy: 미수정
- buildAxis4ComparisonBlock: 미수정
- buildAxis5ComparisonBlock: 미수정 (3295, 3369줄 "확인됨" 그대로)

### 점수 로직, UI 구조 영향 없음
- 점수 계산: 변경 없음
- band/score: 영향 없음
- UI 렌더링 경로: 변경 없음
- rowKey/label: 변경 없음

## 6. 검증

### A. 정적 검증
- buildAxis2ComparisonBlock 함수 3046줄만 수정됨 ✓
- 다른 "확인됨" 인스턴스 (2521, 3295, 3369줄) 미수정 ✓
- Axis1/3/4/5 comparisonBlock 영향 없음 ✓
- currentValue만 변경, 다른 필드 미수정 ✓
- 변경된 문구가 명확성 개선: ✓

### B. 한글 인코딩
- "전공·자격에서 일부 근거 확인" 정상 ✓
- mojibake 패턴 없음 ✓

### C. build/regression
- Node.js runtime: 세션에서 불가
- npm run build: 미수행
- regression: 미수행
- 미수행 사유: JavaScript runtime unavailable in current Claude session

## 7. 리스크

### UI 표시 길이
- 기존: "확인됨" (3글자)
- 변경: "전공·자격에서 일부 근거 확인" (16글자)
- 증가량: +13글자
- 리스크: 중간 - 실제 렌더링 길이/줄바꿈 미확인

### 실제 런타임 미확인
- 정적 검증만 수행
- build/regression 미수행으로 인한 위험
- 리스크: 중간

### verdictText와의 문장 균형
- verdictText는 유지 (변경 없음)
- currentValue의 문구 변화와 verdictText의 조합이 어떻게 표현될지 미확인
- 리스크: 낮음 (verdictText가 더 상세한 설명 제공)

## 8. 다음 단계

1. **PR 생성 및 검토**
   - `fix/newgrad-axis2-comparison-block-copy` 브랜치
   - 1줄 currentValue 문구 개선 PR

2. **머지 후 런타임 검증 (사용자 환경)**
   - build 후 신입 보고서 Axis2 섹션 렌더링 확인
   - Row 1 currentValue가 "전공·자격에서 일부 근거 확인"으로 표시되는지 확인
   - UI 길이/레이아웃에 문제 없는지 확인
   - Axis1/3/4/5에 영향 없는지 확인

3. **Axis2 Batch 2-B 완료 판정**
   - Batch 2-A Copy Quality (PR #48) ✓
   - industrialLift Rendering (PR #50) ✓
   - ComparisonBlock Copy (이 PR) - 완료 시 Batch 2-B 전체 완료

## 9. 요약

| 항목 | 내용 |
|------|------|
| 수정 파일 | src/lib/analysis/buildNewgradAxisPack.js |
| 함수 | buildAxis2ComparisonBlock (line 3017) |
| 변경 내용 | currentValue: "확인됨" → "전공·자격에서 일부 근거 확인" |
| 변경 행 | Line 3046 |
| Axis 범위 | Axis2 한정 |
| 점수 로직 | 변경 없음 |
| UI 구조 | 변경 없음 |
| 정적 검증 | ✓ 완료 |
| 한글 인코딩 | ✓ 정상 |
| build/regression | ✗ JavaScript runtime unavailable |
| 리스크 | 중간 (UI 길이, 런타임 미확인) |
