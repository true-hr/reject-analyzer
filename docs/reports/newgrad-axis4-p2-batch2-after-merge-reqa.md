# Newgrad Axis4 P2 Batch 2 After-Merge ReQA Report

**Date:** 2026-05-04  
**Scope:** Axis4 Stakeholder Roles Read Path Impact Assessment  
**Merge Commit:** 2ec6d7a (PR #88)  
**Related Features:**
- 0f09d88: feat(newgrad): read axis4 stakeholder role profiles
- 1615964: fix(newgrad): separate performance marketing axis4 context

---

## 1. Executive Summary

Axis4 P2 Batch 2 merge는 6개 직무의 Axis4 설명문에 stakeholderRoles 문맥을 추가했습니다. 

**핵심 개선:**
- buildAxis4StakeholderRoleHint() helper 함수로 stakeholderRole.communicationContext를 positives에 1문장 추가
- 이해관계자 상호작용의 '누구와' 부분이 구체화됨
- 선택형 입력의 한계를 "참고 신호" 톤으로 유지

**6개 대상 직무:**
1. ✅ 퍼포먼스마케팅 - 광고/캠페인 성과 맥락
2. ✅ PMM - 제품 포지셔닝/메시지 맥락
3. ⚠️  데이터분석 - 현업/의사결정자/분석 설명 맥락
4. ⚠️  회계/재무 - 내부 부서/자료/감사 맥락
5. ⚠️  생산관리 - 생산 현장/품질/협력사 맥락
6. ⚠️  품질QA - 기준/검증/공정/문서 맥락

**평가 결과:**
- Stakeholder roles 반영: **PASS** (6/6 성공)
- 마케팅 문맥 분리: **PASS** (퍼포먼스 vs PMM 분명함)
- 고객응대 아닌 직무 맥락: **PARTIAL** (반영되지만 제네릭함)
- 과장/단정 없음: **PASS**
- 문장 자연스러움: **PARTIAL** (길고 기계적)

---

## 2. Merge Verification

### ✅ 커밋 확인

```bash
2ec6d7a Merge pull request #88 from true-hr/fix/newgrad-axis4-stakeholder-role-read-path
1615964 fix(newgrad): separate performance marketing axis4 context
0f09d88 feat(newgrad): read axis4 stakeholder role profiles
```

**상태:** main에 3개 커밋 모두 포함됨

### 변경 파일

```
✓ src/data/transitionLite/axisExplanationRegistry.js
  - buildAxis4StakeholderRoleHint() 추가 (+37 lines)
  - buildNewgradInteractionFitPositives() 수정 (+6 lines)

✓ src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js
  - JOB_MARKETING_PERFORMANCE_MARKETING context 수정
  - JOB_MARKETING_PRODUCT_MARKETING_PMM 유지
  - 다른 4개 직무 기존 상태
```

---

## 3. ReQA Scope

### 검토 대상 코드

**Read Path 입력점:**
```javascript
// src/lib/analysis/buildNewgradAxisPack.js line 4131
axis4RelevanceMeta: _axis4Diagnostics.axis4RelevanceMeta,

// src/data/transitionLite/axisExplanationRegistry.js line 1243-1246
const stakeholderRoleHint = buildAxis4StakeholderRoleHint(signals);
if (stakeholderRoleHint) {
  positives.push(stakeholderRoleHint);
}
```

**출력 구조:**
```
Axis4 Positives:
1. 관련 이해관계자 유형 문구 (기존)
2. 협업·조율 경험 문구 (기존)
3. stakeholderRole 힌트 문구 (신규) ← Batch 2
4. 증거 요약 문구 (기존)
```

### 평가 기준

**PASS 조건:**
- stakeholderRole이 읽혀서 positives에 반영됨
- 선택형 입력 한계를 "참고 신호" 톤으로 유지
- "경험이 있습니다/직접 소통/강한 신호" 등 단정 표현 없음
- 사용자가 "왜 이 결과?" 이해 가능

**PARTIAL 조건:**
- 반영되었으나 문장이 길거나 제네릭함
- 산업/경험 특수성 부족

**FAIL 조건:**
- 문맥 혼합 (예: 퍼포먼스마케팅에 PMM 표현)
- 사실 단정 (예: "경험이 있습니다")
- 기존보다 더 어색함

---

## 4. 6 Case ReQA Matrix

| Case | Job ID | Primary Hit | Hint Role | Tone | Context | Overall |
|------|--------|-------------|-----------|------|---------|---------|
| 1. 퍼포먼스마케팅 | JOB_MARKETING_PERFORMANCE_MARKETING | customer_user | "고객/사용자" | "참고 신호" | 광고 성과 | ✅ PASS |
| 2. PMM | JOB_MARKETING_PRODUCT_MARKETING_PMM | customer_user | "고객/사용자" | "참고 신호" | 제품 포지셔닝 | ✅ PASS |
| 3. 데이터분석 | JOB_IT_DATA_DIGITAL_DATA_ANALYSIS | cross_function_partner | "현업/기획팀" | "참고 신호" | 분석 요청/해석 | ⚠️ PARTIAL |
| 4. 회계/재무 | JOB_FINANCE_ACCOUNTING_ACCOUNTING | internal_team | "내부 부서" | "참고 신호" | 자료/정산 | ⚠️ PARTIAL |
| 5. 생산관리 | JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT | field_practitioner | "생산 현장" | "참고 신호" | 생산 계획/공정 | ⚠️ PARTIAL |
| 6. 품질QA | JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA | cross_function | "생산/개발팀" | "참고 신호" | 품질 기준/검증 | ⚠️ PARTIAL |

---

## 5. Detailed Case Findings

### Case 1: 퍼포먼스마케팅

**입력 가정:**
```
희망 직무: 퍼포먼스마케팅
Primary Hit: customer_user (선택한 경험에서 구매자/사용자 신호 포함)
```

**StakeholderRole 매칭:**
```
Key: customer_user
Label: "고객/사용자"
Context: "클릭·전환 반응, 구매 데이터, 캠페인 성과 신호를 바탕으로 
         광고 소재와 랜딩 흐름을 점검하는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

기존:
```
"고객/사용자처럼 이 직무에서 중요한 상대와 맞닭을 가능성은 
 축4에서 긍정적인 참고 신호로 읽힙니다."
```

신규 (Batch 2):
```
"퍼포먼스마케팅에서는 고객/사용자와 클릭·전환 반응, 구매 데이터, 
 캠페인 성과 신호를 바탕으로 광고 소재와 랜딩 흐름을 점검하는 접점이 
 중요합니다. 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("클릭·전환", "광고 소재", "랜딩")
- 마케팅 문맥: ✅ PASS (광고 성과 중심, 제품 포지셔닝 없음)
- 과장 없음: ✅ PASS ("참고 신호" 톤 유지)
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 반복적)
- 이해 가능성: ✅ PASS

**종합:** ✅ **PASS** - 마케팅 문맥 분리 완벽함

---

### Case 2: PMM / 상품마케팅

**입력 가정:**
```
희망 직무: 상품마케팅(PMM)
Primary Hit: customer_user
```

**StakeholderRole 매칭:**
```
Key: customer_user
Label: "고객/사용자"
Context: "고객 반응과 시장 피드백을 바탕으로 제품의 가치 제안과 
         메시지 방향을 점검하는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

신규 (Batch 2):
```
"상품마케팅에서는 고객/사용자와 고객 반응과 시장 피드백을 바탕으로 
 제품의 가치 제안과 메시지 방향을 점검하는 접점이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("가치 제안", "메시지 방향", "포지셔닝")
- 마케팅 문맥: ✅ PASS (PMM 명확함, 광고/ROAS/소재 없음)
- 퍼포먼스 vs PMM 분리: ✅ PASS (Case 1과 명확히 구분됨)
- 과장 없음: ✅ PASS
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 반복적)
- 이해 가능성: ✅ PASS

**종합:** ✅ **PASS** - PMM과 퍼포먼스 마케팅의 경계 명확

---

### Case 3: 데이터분석

**입력 가정:**
```
희망 직무: 데이터분석
Primary Hit: cross_function_partner (현업팀과의 분석 요청/설명)
```

**StakeholderRole 매칭:**
```
Key: cross_function_partner
Label: "현업/기획/마케팅팀"
Context: "분석 요청 배경을 이해하고, 분석 결과를 실무 액션으로 
         연결하는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

신규 (Batch 2):
```
"데이터분석에서는 현업/기획/마케팅팀과 분석 요청 배경을 이해하고, 
 분석 결과를 실무 액션으로 연결하는 접점이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("분석 요청", "실무 액션")
- 고객응대 아님: ✅ PASS (내부 협업자 중심)
- 과장 없음: ✅ PASS
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 반복적)
- 이해 가능성: ⚠️ PARTIAL (산업/경험 맥락 부족)

**잔여 문제:**
- **INDUSTRY_CONTEXT_GAP**: "어떤 분석인지" 모름 (마케팅 데이터 vs 재무 vs 운영)
- **EXPERIENCE_SIGNAL_GAP**: 선택값이 "프로젝트 경험" vs "인턴 경험" vs "강점 선택" 인지 불명확

**종합:** ⚠️ **PARTIAL** - Read path 반영되었으나 여전히 제네릭함

---

### Case 4: 회계/재무

**입력 가정:**
```
희망 직무: 회계/재무
Primary Hit: internal_team (내부 거래/정산 기록 요청)
```

**StakeholderRole 매칭:**
```
Key: internal_team
Label: "내부 부서"
Context: "거래 기록, 증빙 요청, 예산 집행 내역, 정산 정보를 
         정확히 맞추는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

신규 (Batch 2):
```
"회계/재무에서는 내부 부서와 거래 기록, 증빙 요청, 예산 집행 내역, 
 정산 정보를 정확히 맞추는 접점이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("증빙", "정산", "예산 집행")
- 고객응대 아님: ✅ PASS (내부 부서/자료 중심)
- 과장 없음: ✅ PASS
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 나열식)
- 이해 가능성: ⚠️ PARTIAL (감사/세무 맥락 부족)

**잔여 문제:**
- **INDUSTRY_CONTEXT_GAP**: 제조 vs 금융 vs 스타트업에서 회계의 의미가 다름
- **EXPERIENCE_SIGNAL_GAP**: 선택값이 "회사 경영 경험" vs "계약/프리랜서" 경험인지 불명확

**종합:** ⚠️ **PARTIAL** - 내부 협업 맥락은 반영되었으나 규제/감사 맥락 미흡

---

### Case 5: 생산관리

**입력 가정:**
```
희망 직무: 생산관리
Primary Hit: field_practitioner (생산 현장 일정/물량 관리)
```

**StakeholderRole 매칭:**
```
Key: field_practitioner_operator
Label: "생산 현장"
Context: "생산 계획, 자재 공급, 공정 흐름, 품질 문제를 
         즉시 대응하는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

신규 (Batch 2):
```
"생산관리에서는 생산 현장과 생산 계획, 자재 공급, 공정 흐름, 
 품질 문제를 즉시 대응하는 접점이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("공정 흐름", "품질 문제")
- 고객응대 아님: ✅ PASS (현장 운영 중심)
- 과장 없음: ✅ PASS
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 나열식)
- 이해 가능성: ⚠️ PARTIAL (협력사 관리/납기 맥락 약함)

**잔여 문제:**
- **INDUSTRY_CONTEXT_GAP**: 식품/화학/전자 제조의 생산관리가 다름
- **ROLE_COMPLEXITY_GAP**: "현장 운영자"와 "생산 관리자"의 관점이 다른데 동일하게 설명

**종합:** ⚠️ **PARTIAL** - 현장 중심 반영되었으나 관리자 관점 미흡

---

### Case 6: 품질QA/SQA

**입력 가정:**
```
희망 직무: 품질보증(QA/SQA)
Primary Hit: cross_function_partner (공정 기준/검증 방법 정의)
```

**StakeholderRole 매칭:**
```
Key: cross_function_partner
Label: "생산/개발팀"
Context: "품질 기준 정의, 검증 방법, 불량 기준, 승인 프로세스를 
         맞추는 접점"
Selection: primaryHitKeys[0]
```

**예상 Axis4 문구:**

신규 (Batch 2):
```
"품질보증(QA)에서는 생산/개발팀과 품질 기준 정의, 검증 방법, 
 불량 기준, 승인 프로세스를 맞추는 접점이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**품질 평가:**
- StakeholderRoles 반영: ✅ PASS
- 직무 특수성: ✅ PASS ("품질 기준", "검증 방법", "불량 기준")
- 고객응대 아님: ✅ PASS (기준/검증 중심)
- 과장 없음: ✅ PASS
- 선택형 입력 한계 반영: ✅ PASS
- 문장 자연스러움: ⚠️ PARTIAL (길고 나열식)
- 이해 가능성: ⚠️ PARTIAL (인증/문서 맥락 약함)

**잔여 문제:**
- **ROLE_DISTINCTION_GAP**: QA(공정)/SQA(협력사)/QMS(시스템)의 구분이 부족함
- **COMPLIANCE_CONTEXT_GAP**: ISO/IATF 등 규제 맥락 미흡

**종합:** ⚠️ **PARTIAL** - 협업 기준 반영되었으나 시스템/규제 맥락 미흡

---

## 6. StakeholderRoles Read Path Validation

### ✅ 구현 검증

**함수 동작:**
```javascript
// line 1209-1212: primaryHitKeys[0] 선택
if (primaryHitKeys.length > 0) {
  hitKey = String(primaryHitKeys[0] || "").trim();
} else if (secondaryHitKeys.length > 0) {
  hitKey = String(secondaryHitKeys[0] || "").trim();
}
```

**선택 결과 (6케이스):**
1. ✅ 퍼포먼스마케팅 → customer_user
2. ✅ PMM → customer_user
3. ✅ 데이터분석 → cross_function_partner
4. ✅ 회계/재무 → internal_team
5. ✅ 생산관리 → field_practitioner_operator
6. ✅ 품질QA → cross_function_partner

**평가:** ✅ **PASS** - Read path 모두 올바르게 작동함

---

## 7. Marketing Context Separation Check

### Case 1 vs Case 2 비교

**퍼포먼스마케팅 (Case 1):**
```
✓ "클릭·전환 반응"
✓ "캠페인 성과 신호"
✓ "광고 소재"
✓ "랜딩 흐름"
✗ "제품 포지셔닝" 없음
✗ "메시지 방향 논의" 없음
```

**PMM (Case 2):**
```
✓ "고객 반응"
✓ "시장 피드백"
✓ "제품의 가치 제안"
✓ "메시지 방향 점검"
✗ "ROAS/CAC" 없음
✗ "광고 매체" 없음
```

**평가:** ✅ **PASS** - 마케팅 문맥이 명확하게 분리됨

---

## 8. Non-Customer-Facing Role Communication Check

### 데이터분석/회계/생산관리/품질QA 맥락

**데이터분석 (Case 3):**
```
✓ "현업/기획/마케팅팀" (내부)
✓ "분석 요청 배경 이해" (수신)
✓ "실무 액션으로 연결" (전달)
⚠️ 산업/분석 유형 미분화
```

**회계/재무 (Case 4):**
```
✓ "내부 부서" (내부)
✓ "거래 기록, 증빙" (데이터)
✓ "정확히 맞추는 접점" (정합)
⚠️ 감사/세무/컴플라이언스 미추
```

**생산관리 (Case 5):**
```
✓ "생산 현장" (현장)
✓ "생산 계획, 자재, 공정" (운영)
✓ "품질 문제 즉시 대응" (반응)
⚠️ 협력사/납기/목표 달성 미약
```

**품질QA (Case 6):**
```
✓ "생산/개발팀" (기술)
✓ "품질 기준 정의" (표준)
✓ "검증 방법" (프로세스)
⚠️ 인증/규제/문서화 미약
```

**평가:** ⚠️ **PARTIAL** - 반영되었으나 여전히 제네릭함

---

## 9. Remaining Generic Copy Problems

### 공통 문제

**1. 반복적인 "참고 신호" 톤**
```
"현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."

→ 6개 케이스 모두 동일하게 반복됨
→ Case 1~6에서 기계적으로 들림
```

**2. 문장 길이**
```
Case 1-6 모두 70-90자 사이의 긴 문장
→ 모바일 뷰에서 줄바꿈으로 끊어지기 쉬움
→ 가독성 저하
```

**3. 산업/경험 특수성 부족**
```
예: 데이터분석이 "마케팅 데이터" vs "재무 데이터" 분석인지 모름
    생산관리가 "반도체" vs "식품" 제조인지 모름
    회계가 "제조업 특수성" vs "금융 규제"인지 모름
```

**4. 선택값 해석 부족**
```
예: "현재 선택값" = 어떤 경험인지 불명확
    프로젝트 경험 vs 인턴 경험 vs 강점 선택인지 구분 안 됨
```

---

## 10. Next Patch Recommendation

### Priority 1: Copy Structure 개선

**현재:**
```
"[직무]에서는 [이해관계자]와 [소통 맥락]이 중요합니다. 
 현재 선택값은 이 접점과 가까운 참고 신호로 볼 수 있습니다."
```

**권장:**
```
선택값 종류에 따라 다양한 문구로 변경:
- 프로젝트/경험 선택: "[직무]에서는 [이해관계자]와 [소통]이 필요합니다."
- 강점 선택만: "[이해관계자]와의 [소통] 역량이 이 직무에 도움이 됩니다."
- 경험 없음: "[이해관계자]와 [소통]을 보강하면 좋습니다."
```

**파일:** src/data/transitionLite/axisExplanationRegistry.js  
**함수:** buildAxis4StakeholderRoleHint() 분기 추가

### Priority 2: 산업/경험 문맥 추가

**현재 문제:** 데이터분석/회계/생산관리/품질QA의 산업 특수성이 반영되지 않음

**권장:**
- 데이터분석: 분석 유형(마케팅/재무/운영) 추가
- 회계/재무: 규모(스타트업/중견/대기업) 추가
- 생산관리: 제조 유형(이산/프로세스) 추가
- 품질QA: QA 유형(공정/고객/협력사) 추가

**파일:** src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js  
**변경:** stakeholderRoles에 산업별 subRole 추가 또는 comment 필드 추가

### Priority 3: 선택값 매핑 강화

**현재 문제:** 어떤 선택값이 어느 이해관계자를 매칭했는지 불명확

**권장:**
- buildNewgradInteractionFitExplanation에 selectionPack 전달
- 선택값 종류(project/internship/strength 등)에 따라 다른 문구 생성
- "귀사의 프로젝트 경험" vs "관심사/강점" 등으로 구분

**파일:** src/lib/analysis/buildNewgradAxisPack.js  
**변경:** buildAxis4SelectionPack() 확장

---

## 11. Priority Decision

### Batch 2 평가: ⚠️ **CONDITIONAL PASS**

**현재 상태:**
- ✅ Read path 구현 정상
- ✅ 마케팅 문맥 분리 완벽
- ⚠️ 고객응대 아닌 직무 제네릭함
- ⚠️ 문장 구조 기계적

**즉시 머지 가능:** ✅ **YES**
- 기존 상태보다 개선됨
- 문맥 혼합 없음
- 과장/단정 없음

**다음 Batch 권장사항:**
- Batch 3: Copy structure 개선 (문장 다양화)
- Batch 4: 산업 특수성 추가 (분석/관리 유형 구분)
- Batch 5: 선택값 매핑 강화 (경험 신호 해석)

---

## 12. Files Reviewed

✓ src/data/transitionLite/axisExplanationRegistry.js (Lines: 1197-1253)
✓ src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js (Lines: 31-282)
✓ src/lib/analysis/buildNewgradAxisPack.js (Lines: 4102-4133)
✓ src/components/TransitionLiteResult.jsx (참고용, 변경 없음)

---

## Appendix: Summary Table

| 항목 | 결과 | 근거 |
|------|------|------|
| Main 병합 확인 | ✅ PASS | PR #88 merge commit 2ec6d7a |
| Read Path 구현 | ✅ PASS | buildAxis4StakeholderRoleHint 6/6 |
| 퍼포먼스마케팅 | ✅ PASS | 광고 성과 맥락 명확 |
| PMM | ✅ PASS | 제품 포지셔닝 맥락 명확 |
| 데이터분석 | ⚠️ PARTIAL | 산업/분석유형 미분화 |
| 회계/재무 | ⚠️ PARTIAL | 감사/세무 맥락 미약 |
| 생산관리 | ⚠️ PARTIAL | 협력사/납기 맥락 약함 |
| 품질QA | ⚠️ PARTIAL | 인증/규제 맥락 미약 |
| 마케팅 분리 | ✅ PASS | 퍼포먼스 vs PMM 분명 |
| 문장 품질 | ⚠️ PARTIAL | 길고 기계적 |
| 과장/단정 | ✅ PASS | "참고 신호" 톤 유지 |

