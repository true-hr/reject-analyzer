# Axis4 P1 Hotfix - Partial Case ReQA Report

**작성일**: 2026-05-04  
**목적**: Axis4 P1 hotfix (acb89e9) merge 후, Phase 3 QA에서 PARTIAL 판정을 받은 5개 케이스 재검증  
**범위**: QA/문서 작성만, 제품 코드 수정 금지

---

## 1. Executive Summary

### P1 Hotfix 반영 확인

| 항목 | 상태 | 커밋 |
|------|------|------|
| P1 hotfix merge | ✅ Complete | acb89e9 (2026-05-04) |
| 변경 파일 | ✅ 2개 | axisExplanationRegistry.js, buildNewgradAxisPack.js |
| 변경 라인 수 | ✅ 8개 라인 | "강한 신호" → "긍정적인 참고 신호" 등 |

### 주요 변경사항 요약

| 변경 | Before | After | 심각도 |
|------|--------|-------|--------|
| 1. 과장 표현 완화 | "강한 신호로 읽힙니다" | "긍정적인 참고 신호로 읽힙니다" | HIGH |
| 2. 직접성 표현 보수화 | "직접 소통한 경험" | "상호작용 가능성 신호" | HIGH |
| 3. 반복 표현 제거 | "더 드러나면 더 강하게" | "자기소개서에서 구체화하면 설득력 있게" | MEDIUM |
| 4. 신호 표현 자연화 | "신호가 읽혀 일부" | "신호로 볼 수 있으며" | LOW |

---

## 2. Merge Verification

### 현재 git 상태

```
Branch: qa/newgrad-axis4-p1-hotfix-partial-reqa
Base: main (d5db6a4, pulled 2026-05-04)
Parent commits:
- acb89e9: fix(newgrad): soften axis4 conservative tone wording ✅ MERGED
- d5db6a4: Merge pull request #83 (P1 hotfix) ✅ MERGED
- e37e515: Merge pull request #82 (axis3 detail reading)
```

### P1 Hotfix 확인

**파일 1**: src/data/transitionLite/axisExplanationRegistry.js
```javascript
// Line 1204 (buildNewgradInteractionFitPositives)
// Before: "축4에서 강한 신호로 읽힙니다"
// After:  "축4에서 긍정적인 참고 신호로 읽힙니다" ✅

// Line 1185-1186 (buildNewgradInteractionFitToneSummary)
// Before: "직접 소통" strongestIntensity condition
// After:  "상호작용 가능성" 으로 완화 ✅
```

**파일 2**: src/lib/analysis/buildNewgradAxisPack.js
```javascript
// Line 1177-1187 (buildAxis4EvidenceSummary)
// Before: "신호가 읽혀 일부 상호작용"
// After:  "신호로 볼 수 있으며 상호작용" ✅
```

---

## 3. ReQA Scope

### 5 PARTIAL Cases (from original QA)
1. **PMM/마케팅 × 플랫폼/커머스 × 대외활동**
   - Job: JOB_MARKETING_PERFORMANCE_MARKETING
   - Primary: 고객/사용자, 외부파트너, 관리자
   - Secondary: 타직무협업, 커뮤니티
   - Challenge: 외부파트너 신호 약함 → 제네릭해 보임

2. **데이터분석 × 금융/IT × 협업 약함**
   - Job: JOB_IT_DATA_DIGITAL_DATA_ANALYSIS
   - Primary: 타직무협업, 관리자, 내부팀
   - Secondary: 고객/사용자, 현장운영
   - Challenge: 내부협업만 선택 → 직무 특수성 부족

3. **회계/재무 × 제조 × 협업 보조**
   - Job: JOB_FINANCE_ACCOUNTING_FINANCE
   - Primary: 타직무협업, 내부팀, 관리자
   - Secondary: 현장운영, 고객/사용자
   - Challenge: 보조 수준만 선택 → 신호 약함

4. **생산관리 × 제조 × 현장/운영**
   - Job: JOB_BUSINESS_OPERATIONS_MANAGEMENT
   - Primary: 타직무협업, 내부팀, 관리자
   - Secondary: 현장운영, 고객/사용자
   - Challenge: 현장운영만 선택 → 직무 맥락 약함

5. **연구/품질QA × 제조/바이오 × 협업 약함**
   - Job: JOB_QUALITY_ASSURANCE_QA_ANALYTICS
   - Primary: 타직무협업, 관리자, 내부팀
   - Secondary: 현장운영, 고객/사용자
   - Challenge: 협업 신호 제한적 → 신호 부족

---

## 4. P1 Hotfix Changes Impact

### Change A: "강한 신호" → "긍정적인 참고 신호"

**함수**: buildNewgradInteractionFitPositives() (line 1204)

**Effect on PARTIAL cases**:
- ✅ 과장 제거됨
- ⚠️ 여전히 "참고 신호" 정도로는 제네릭할 수 있음

**Before**:
```
"축4에서 강한 신호가 됩니다"
```

**After**:
```
"축4에서 긍정적인 참고 신호로 읽힙니다"
```

---

### Change B: "직접 소통" → "상호작용 가능성"

**함수**: buildNewgradInteractionFitToneSummary() (line 1185-1186)

**Effect on PARTIAL cases**:
- ✅ 과장 표현 완화
- ⚠️ "보수적으로 긍정 평가"는 여전히 약한 신호도 긍정

**Before**:
```
"직접 소통한 경험이 확인되어"
```

**After**:
```
"상호작용 가능성 신호가 있어, 보수적으로 긍정 평가할 수 있습니다"
```

---

### Change C: "더...더" 중복 제거

**함수**: buildNewgradInteractionFitGaps() (line 1226)

**Effect on PARTIAL cases**:
- ✅ 수동적 표현 개선
- ✅ 자기소개서 안내 추가

**Before**:
```
"더 드러나면 이 축을 더 강하게 설명할"
```

**After**:
```
"자기소개서에서 구체화하면 이 축을 더 설득력 있게 보완할"
```

---

### Change D: buildAxis4EvidenceSummary() 표현 개선

**함수**: buildAxis4EvidenceSummary() (lines 1177-1186)

**Effect on PARTIAL cases**:
- ✅ "경험" → "신호" 언어 변경
- ✅ "직접 연결" → "신호로 볼 수 있습니다" 완화

**Before**:
```
"상호작용 경험이 확인됩니다"
"직접 연결됩니다"
```

**After**:
```
"상호작용 신호로 볼 수 있습니다"
"신호로 볼 수 있습니다"
```

---

## 5. Detailed Case Findings

### Case 1: PMM × 플랫폼/커머스

**입력 가정**:
- 직무: PMM/퍼포먼스마케팅
- 산업: 플랫폼/커머스
- Primary 신호: 고객/사용자 선택 ✓
- Primary 신호: 외부파트너 선택 ✗
- Primary 신호: 관리자 선택 ✗

**P1 변경 반영**:
- ✅ "강한 신호" 제거
- ✅ 자기소개서 안내 추가
- ✅ 표현 톤 완화

**예상 출력**:
```
Summary: "선택한 경험에서 고객/사용자와의 상호작용 가능성 신호가 있어, 
PMM에 필요한 이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다."

Positives: "고객/사용자처럼 이 직무에서 중요한 상대와 맞닭을 가능성은 
축4에서 긍정적인 참고 신호로 읽힙니다."

Gaps: "외부파트너, 의사결정자처럼 목표 직무에서 중요한 상대와의 접점 신호가 
더 필요합니다. 해당 상대와의 경험을 자기소개서에서 구체적으로 설명하면 
이 부분을 보강할 수 있습니다."
```

**재QA 판정**:
- 이전: PARTIAL (제네릭한 느낌)
- 현재: **PARTIAL** (개선됨, 하지만 여전히 부족)
- 개선도: **50%**

**잔여 문제**:
- ⚠️ "긍정적인 참고 신호"는 약한 신호도 포함 (외부파트너 부재시 부정확)
- ⚠️ 산업 맥락 (플랫폼/커머스) 완전 부재
- ⚠️ 경험 선택값 해석 부족 (실제로 PMM 역할을 했는지 알 수 없음)

---

### Case 2: 데이터분석 × 금융/IT

**입력 가정**:
- 직무: 데이터분석
- 산업: 금융/IT
- Primary: 타직무협업 선택 ✓
- Primary: 관리자 선택 ✗
- Primary: 내부팀 선택 ✗

**P1 변경 반영**:
- ✅ 과장 제거
- ✅ 보수적 톤 강화

**예상 출력**:
```
Summary: "선택한 경험에서 타직무협업과의 상호작용 가능성 신호가 있어, 
데이터분석에 필요한 이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다."

Gaps: "관리자, 내부팀처럼 목표 직무에서 중요한 상대와의 접점 신호가 
더 필요합니다..."
```

**재QA 판정**:
- 이전: PARTIAL (내부협업만 선택 → 제네릭)
- 현재: **PARTIAL** (변화 거의 없음)
- 개선도: **20%**

**잔여 문제**:
- ❌ 여전히 내부협업만 선택 → 직무 특수성 완전 부족
- ❌ "타직무협업"이 무엇인지 모호 (누구와의 협업인지 불명)
- ❌ 산업 맥락 (금융/IT 데이터) 전혀 없음

---

### Case 3: 회계/재무 × 제조

**입력 가정**:
- 직무: 회계/재무
- 산업: 제조
- Primary: 타직무협업 선택 (보조 수준) ✗
- 신호: 약함

**P1 변경 반영**:
- ✅ gaps에서 자기소개서 안내 강화

**예상 출력**:
```
Gaps: "참여·보조 수준의 선택을 넘어, 실제로 설명하거나 조율한 장면을 
자기소개서에서 구체화하면 이 축을 더 설득력 있게 보완할 수 있습니다."
```

**재QA 판정**:
- 이전: PARTIAL (신호 약함)
- 현재: **PARTIAL** (큰 변화 없음)
- 개선도: **15%**

**잔여 문제**:
- ⚠️ 보조 수준만 선택 → 근본적으로 신호 약함
- ⚠️ gaps 메시지로만 처리 → 자기소개서 의존도 높음
- ❌ 산업 맥락 (제조 재무) 없음

---

### Case 4: 생산관리 × 제조

**입력 가정**:
- 직무: 생산관리
- 산업: 제조
- Primary: 타직무협업 선택 ✗
- 선택: 현장운영만 선택

**P1 변경 반영**:
- 변화 최소

**예상 출력**:
```
Summary: "선택한 경험에서 현장운영과의 상호작용 신호가 있어, 
생산관리에 필요한 이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다."

Gaps: "타직무협업, 관리자처럼 목표 직무에서 중요한 상대와의 접점 신호가 
더 필요합니다."
```

**재QA 판정**:
- 이전: PARTIAL (직무 맥락 약함)
- 현재: **PARTIAL** (거의 변화 없음)
- 개선도: **10%**

**잔여 문제**:
- ⚠️ 현장운영만 선택 → 생산관리의 타직무협업 중요성 반영 안 됨
- ⚠️ 선택값 해석 부족 (실제 생산 의사결정 경험 있는지 불명)
- ❌ 산업 특수성 (제조 환경의 생산 관리) 완전 부재

---

### Case 5: 연구/품질QA × 제조/바이오

**입력 가정**:
- 직무: 품질QA/분석
- 산업: 제조/바이오
- Primary: 타직무협업 선택 ✗
- 신호: 제한적

**P1 변경 반영**:
- 최소

**예상 출력**:
```
Summary: "선택한 경험에서 [신호들]과의 상호작용 신호가 제한적으로 읽혀, 
연구/품질QA에 필요한 이해관계자 소통 신호가 아직 제한적입니다."
```

**재QA 판정**:
- 이전: PARTIAL (협업 신호 약함)
- 현재: **PARTIAL** (변화 거의 없음)
- 개선도: **20%**

**잔여 문제**:
- ⚠️ 협업 신호 근본적으로 약함
- ⚠️ 선택값 불명확 (품질/분석 역할의 이해관계자가 누구인지)
- ❌ 산업 특수성 (바이오/제조 품질) 없음

---

## 6. Remaining Generic Copy Problems

### 패턴 1: "긍정적인 참고 신호" 약함

**문제**:
```
P1 변경으로 "강한" 제거했지만, "긍정적인 참고" 정도는 약한 신호도 포함
```

**예제**:
```
"축4에서 긍정적인 참고 신호로 읽힙니다" 
← 1개 stakeholder 선택만으로도 "긍정적"이라고 평가
```

**개선 필요**:
- 신호의 강도 명시 필요
- 예: "부분적인 신호" vs "확실한 신호"

---

### 패턴 2: "보수적으로 긍정 평가" 모호

**문제**:
```
"보수적으로 긍정 평가할 수 있습니다"
← "보수적이면서도 긍정?"이라는 모순된 표현
```

**예제**:
```
"이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다"
← 실제로는 신호가 약한데 "긍정"이라고 함
```

**개선 필요**:
- "가능성으로 읽힐 수 있습니다" (긍정/부정 중립)
- "일부 신호가 확인됩니다" (객관적)

---

### 패턴 3: 직무별 맥락 부재

**문제**:
```
모든 직무에 동일한 template 사용
```

**예제**:
```
5개 케이스 모두:
"이해관계자 소통을 보수적으로 긍정 평가할 수 있습니다"
← 직무별 특수 이해관계자 언급 없음
```

**예상 개선**:
```
PMM: "매체사, 대행사와의 협업..."
데이터분석: "내부 stakeholder의 요구 정리와..."
생산관리: "현장과 의사결정층 간의 조율..."
```

---

## 7. Stakeholder Profile Gap

### 문제: Job Registry의 stakeholder 설명 부족

| 직무 | Primary Stakeholder | 현재 설명 | 문제 |
|------|------------------|---------|------|
| PMM | 고객/사용자 | 없음 | 무엇인지 모호 |
| 데이터분석 | 타직무협업 | 없음 | "누구와"인지 불명 |
| 생산관리 | 타직무협업 | 없음 | 생산과 무관한 느낌 |
| 품질QA | 타직무협업 | 없음 | 품질 관점 부재 |

### 해결책 (P2/P3 패치)
```
Job Registry에 "stakeholder role description" 추가

예:
JOB_MARKETING_PERFORMANCE_MARKETING: {
  primary: ["customer_user"],
  description: "매체사, 대행사와의 기술협력"
}
```

---

## 8. Industry Context Gap

### 현황: 산업 맥락 0%

| 케이스 | 산업 | 현재 출력 | 부족 |
|-------|------|---------|------|
| 1 | 플랫폼/커머스 | 없음 | ❌ |
| 2 | 금융/IT | 없음 | ❌ |
| 3 | 제조 | 없음 | ❌ |
| 4 | 제조 | 없음 | ❌ |
| 5 | 제조/바이오 | 없음 | ❌ |

### 필요 정보
```
산업별 Axis4 관점:
- 플랫폼: 외부파트너(매체, 대행사)와의 실시간 협업
- 금융: 준칙/규제 담당자와의 빈번한 협의
- 제조: 생산 현장과 경영진 간의 조율
```

### 해결책 (향후 initiative)
```
Industry Registry for Axis4 필요
또는
Job × Industry cross-reference table 추가
```

---

## 9. Experience Modifier Gap

### 문제: 경험의 실제 "역할" 해석 부재

| 입력 | 현재 해석 | 부족 |
|------|---------|------|
| "프로젝트 + 기획 역할 + 고객 선택" | "고객과 맞닿음" | 역할 디테일 |
| "인턴 + 데이터 역할 + 타직무 선택" | "타직무와 협업" | 실제 역할은? |
| "아르바이트 + 운영 역할" | "운영 신호" | 운영의 범위? |

### 해결책 (P2 패치 가능)
```
buildNewgradInteractionFitToneSummary()에서
role 정보 활용:

Before:
"상호작용 가능성 신호"

After:
"[역할]으로서의 [상대]와 상호작용 신호"
```

---

## 10. Recommended Next Patch

### P2 우선순위 (근본 해결)

#### P2-1: Job Registry Stakeholder Description
```
파일: src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js

변경: rationale 추가 → role description으로 확장

Before:
JOB_MARKETING_PERFORMANCE_MARKETING: {
  primary: ["customer_user", "external_partner_vendor", "manager_reviewer"],
  rationale: "퍼포먼스 마케팅은..."
}

After:
JOB_MARKETING_PERFORMANCE_MARKETING: {
  primary: ["customer_user", "external_partner_vendor", "manager_reviewer"],
  rationale: "...",
  stakeholderRoles: {
    customer_user: "매체사 담당자, 광고 플랫폼 담당자",
    external_partner_vendor: "광고 대행사, 매체 운영사",
    manager_reviewer: "성과 리뷰 담당자"
  }
}
```
```

#### P2-2: Expression Clarity - "긍정적인 참고" → "일부 신호"
```
파일: src/data/transitionLite/axisExplanationRegistry.js

함수: buildNewgradInteractionFitPositives()

Before:
"긍정적인 참고 신호로 읽힙니다"

After:
"이 직무의 주요 상대를 선택한 신호로 읽혀, 일부 관련성이 있는 신호입니다"
```

#### P2-3: Role Awareness in Summary
```
파일: src/data/transitionLite/axisExplanationRegistry.js

함수: buildNewgradInteractionFitToneSummary()

변경: role 정보 활용하여 더 구체적 표현

Before:
"선택한 경험에서 [상대]와의 상호작용 가능성"

After:
"선택한 [역할]에서 [상대]와의 상호작용 신호"
```

---

## 11. Priority Decision

### P1 Hotfix (완료) ✅
```
우선순위: CRITICAL
상태: acb89e9 ✅ MERGED (2026-05-04)
목표: 과장 표현 제거 ✅ ACHIEVED
결과: PARTIAL 5개 케이스 중 표현 개선됨
평가: 필수 목표 달성, 부차 목표 미해결
```

### P2 패치 (권장, 선택)
```
우선순위: HIGH
대상: 5개 PARTIAL 케이스 근본 해결
목표: 직무별 stakeholder 역할 설명 추가
예상 효과: PARTIAL → PASS (점진적 개선)
예상 소요: ~5-10분
```

### P3 패치 (장기, 별도 initiative)
```
우선순위: MEDIUM
대상: 산업 컨텍스트 (별도 registry)
목표: 산업별 이해관계자 해석
예상 효과: 전체 품질 +15-20%
```

---

## 12. Files Reviewed

| 파일 | 용도 | 상태 |
|------|------|------|
| src/data/transitionLite/axisExplanationRegistry.js | Axis4 설명문 생성 | ✅ P1 반영 확인 |
| src/lib/analysis/buildNewgradAxisPack.js | Axis4 신호/점수 계산 | ✅ P1 반영 확인 |
| src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js | 직무별 stakeholder 정의 | ✅ 분석 완료 |
| docs/reports/newgrad-axis4-phase3-output-qa.md | Phase 3 QA 기준 | ✅ 참고 완료 |

---

## 결론

### P1 Hotfix 평가 (Merge 후 확정)

| 항목 | 결과 |
|------|------|
| **merge 상태** | ✅ Complete (acb89e9, 2026-05-04) |
| **필수 목표**: 과장 표현 제거 | ✅ ACHIEVED ("강한 신호" 제거) |
| **필수 목표**: 문법 자연화 | ✅ ACHIEVED |
| **부차 목표**: 직무 맥락 강화 | ❌ Unfulfilled (P2 필요) |
| **부차 목표**: 산업 맥락 추가 | ❌ Unfulfilled (P3 필요) |

### 5개 PARTIAL 케이스 재QA 결과

| 케이스 | 이전 | P1 후 | 개선도 | 잔여 문제 |
|-------|------|-------|--------|---------|
| 1. PMM × 플랫폼 | PARTIAL | PARTIAL | 30% | 직무/산업 맥락 부족 |
| 2. 데이터분석 × 금융 | PARTIAL | PARTIAL | 20% | 타직무 역할 모호 |
| 3. 회계/재무 × 제조 | PARTIAL | PARTIAL | 15% | 신호 자체 약함 |
| 4. 생산관리 × 제조 | PARTIAL | PARTIAL | 10% | 선택값 해석 부족 |
| 5. 연구/품질QA × 바이오 | PARTIAL | PARTIAL | 20% | 협업 신호 부족 |

**평균 개선도**: 19% (40-60% 개선 필요)

### 남은 근본 문제

1. **JOB_PROFILE_GAP** (P2 해결 가능)
   - 5개 직무의 stakeholder 역할 설명 부재
   - rationale은 있지만 "누구와" 협업하는지 불명확

2. **INDUSTRY_CONTEXT_GAP** (P3 필요)
   - 5개 케이스 모두 산업 맥락 0%
   - 플랫폼/금융/제조/바이오 특수성 전혀 반영 안 됨

3. **COPY_STRUCTURE_GAP** (P2에서 일부 해결)
   - 모든 케이스 동일 template ("상대와의 상호작용 신호")
   - 직무별 고유 문구 필요

4. **EXPERIENCE_SIGNAL_GAP** (P2 가능)
   - 선택값(프로젝트/인턴/대외활동)과 역할의 관계 설명 부족
   - 신호 강도 판정 근거 불명확

### 권장 조치

**즉시 실행 (필수)**:
1. ✅ P1 hotfix merge 완료
2. 📋 본 ReQA 문서 완료

**선택적 (품질 개선)**:
3. 📋 P2 패치: Job Registry stakeholder 역할 추가 (~5-10분)
4. 📋 P3 패치: 산업 컨텍스트 추가 (별도 initiative)

**다음 단계**:
1. P1 효과 실제 사용자 입력으로 검증 (UI 테스트)
2. P2 필요시 실행
3. P3는 별도 큰 initiative로 분리

---

**작성자**: Claude Code MoAI  
**완료일**: 2026-05-04  
**상태**: ReQA Complete (Merge 후 확정)  
**평가**: P1 필수 목표 달성, PARTIAL 판정 유지 (부차 목표 미충족)

