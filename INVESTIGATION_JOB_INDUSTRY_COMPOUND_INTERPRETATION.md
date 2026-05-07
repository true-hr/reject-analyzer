# PASSMAP 경력 리포트: 직무+산업 조합 해석 구조 조사

**조사 날짜**: 2026-05-08  
**대상 버전**: origin/main = 5b31903  
**조사자**: Claude Code (read-only investigation)  
**상태**: ✅ 완료, 패치 금지

---

## 1. Branch / Local Status

```
path:           D:\패스맵\reject-analyzer
branch:         fix/resume-ai-after-card-clean
origin/main:    5b31903 (feat: add AI recruiter-view rejection analysis)
dirty_state:    modified: .tmp_vercel_deploy_head2
                untracked: worktrees, temp reports (9개)
read_only:      ✅ maintained
```

최신 PR 포함:
- #155: fix/career-strength-evidence-aware-origin ✅
- #154: fix/career-strength-evidence-aware-templates ✅
- #153: fix/career-strength-template-grounding-copy ✅
- #152: fix/industry-customer-structure-cap ✅
- #151: fix/report-accuracy-p0-integrated ✅

---

## 2. Executive Summary

**현재 경력 리포트가 targetJob + targetIndustry 조합을 실제 맥락으로 해석하는가?**

**결론**: ❌ **아니다.**

경력 리포트에서 직무와 산업이 **병렬로 나열되며**, 조합 해석이 없다:

```
현재 구조:
1. 현재 경험의 특징 설명
2. 목표 산업의 특징 설명     ← 산업만
  또는
  목표 직무의 특징 설명     ← 직무만
  또는
  일반적 프레임워크 설명     ← 조합하지 않음
3. 면접 대응 방향
```

**사용자 기대**:
```
예상 구조:
- "증권 산업에서 공공사업 운영이 실제로 무엇을 의미하고"
- "규제·신뢰·구매의사결정이 어떻게 다르며"
- "현재 QC 경험이 그 맥락에서 왜 의미 있는가"
```

**실제 구조**:
```
- "증권 산업의 특징: 전문가 구매, 긴 세일즈사이클..."
- "공공사업 운영: 조율 역량, 여러 부서 기준 맞추기..."
- (둘의 교집합이 없음)
```

---

## 3. Current Architecture

### 3.1 핵심 함수 흐름

**Entry Point**: `buildTransitionLiteResult()` (line 3171)
```
validateInput
  ↓
resolveAssets (job, industry items)
  ↓
classifyTransition (jobDistance, industryDistance)
  ↓
buildTransitionLiteVM()
  └─ buildTransitionLiteStrengths()
      ├─ line1: buildTransitionLiteCandidateOriginLine()
      │         → 현재 경험 분석
      ├─ line2: 선택적 생성 (배타적)
      │         ├─ RISK_INDUSTRY_CONTEXT_SHIFT
      │         │   → buildTransitionLiteIndustryTranslationLine()
      │         │   → targetIndustry만 사용 ⚠️
      │         ├─ RISK_SCOPE_REINTERPRETATION
      │         │   → buildTransitionLiteScopeTranslationLine()
      │         │   → targetJob만 사용 ⚠️
      │         └─ else
      │             → buildTransitionLiteGenericTranslationLine()
      │             → 둘 다 사용하지만 일반적 ⚠️
      └─ line3: buildTransitionLiteInterviewLinkageLine()
                → 면접 대응 조언
```

### 3.2 주요 함수 분석

#### A. buildTransitionLiteIndustryTranslationLine() (line 2758–2796)

**입력**: targetContext, generationTags  
**사용 필드**: 
- targetIndustryLabel ✅
- targetIndustry.coreContext ✅
- targetIndustry.decisionStructure ✅
- targetIndustry.buyingMotion ✅
- industryTraitsAsset ✅

**NOT 사용**:
- targetJobLabel ❌
- targetJobItem ❌
- targetJob.roleFamily ❌
- currentJobItem ❌

**출력 예**:
```
"증권·자산운용에서는 이 경험이 전문가 검토 과정과 
 긴 의사결정 주기 안에서 버텨내는 힘으로 읽힙니다."
```

**문제**: 공공사업 운영과 증권 산업의 **교집합**을 설명하지 않음.

---

#### B. buildTransitionLiteScopeTranslationLine() (line 2798–2819)

**입력**: targetContext, generationTags  
**사용 필드**:
- targetJobLabel ✅
- targetJobItem (actionSignals) ✅
- sourceExperienceType ✅

**NOT 사용**:
- targetIndustryLabel ❌
- targetIndustry ❌

**출력 예**:
```
"공공사업 운영에서는 무엇을 했는가보다 
 우선순위 결정과 부서 간 조율까지 어디에 관여했는지로 해석됩니다."
```

**문제**: 산업 맥락이 없어서 "어느 산업에서 이 조율이 중요한지" 불명확.

---

#### C. buildTransitionLiteGenericTranslationLine() (line 2821–2825)

**입력**: targetContext  
**사용 필드**:
- targetJobLabel ✅
- targetIndustryLabel ✅

**사용하지 않는 필드**:
- targetJobItem ❌
- targetIndustry ❌
- 실제 조합 로직 ❌

**출력**:
```javascript
`${targetJobLabel}와 ${targetIndustryLabel} 맥락에서는 
 이 경험을 문제를 어떻게 정리하고 실행으로 연결했는지 중심으로 풀어야 합니다.`
```

**예**: "공공사업 운영과 증권·자산운용 맥락에서는..."

**문제**: 라벨만 사용하고, 실제 조합 의미 분석이 없음.

---

### 3.3 기존 조합 힌트의 미사용

**generationTags** (buildTransitionLiteGenerationTags.js):
```javascript
{
  primaryRiskKey: "RISK_INDUSTRY_CONTEXT_SHIFT",
  sourceExperienceType: "STAKEHOLDER_COORDINATION",  // 현재 직무 분석
  sourceExperienceNuance: "CROSS_FUNCTIONAL",        // 현재 직무 뉘앙스
  targetStructureTags: [                             // 목표 산업 분석
    "REGULATED",
    "EXPERT_BUYING",
    "LONG_CYCLE"
  ],
  promptFamily: "INDUSTRY_CONTEXT",
  targetJobFamilyId: "BUSINESS_OPERATION_PLANNING",  // 하지만 사용 안됨
  targetIndustrySector: "FINANCE_INSURANCE_FINTECH"
}
```

**관찰**: targetJobFamilyId와 targetIndustrySector는 생성되지만 **사용되지 않음**.

---

## 4. Case Matrix

### Case A: QC → 공공사업 운영 / 디지털헬스 → 증권·자산운용

| 항목 | 값 |
|------|-----|
| currentJob | 품질관리(QC) |
| currentIndustry | 디지털 헬스케어 |
| targetJob | 공공사업 운영 |
| targetIndustry | 증권·자산운용 |
| jobDistance | adjacent (같은 operation family) |
| industryDistance | cross (healthcare ↔ finance) |

**기대되는 조합 설명**:
```
"증권 산업의 공공사업 운영은 규제 준수와 기관투자자 신뢰가 핵심입니다. 
 현재 QC 경험에서 기준/절차 감각은 이어지지만, 
 금융 고객의 투자 의사결정 구조는 의료기관과 전혀 다릅니다. 
 새 산업과 직무의 교집합에서 경험을 다시 설명하세요."
```

**현재 실제 출력 (예상)**:
```
1. "품질관리에서 기준과 절차를 엄밀하게 관리해 온 경험..."
2. "증권·자산운용에서는 전문가의 신뢰와 장기 검토 과정이 중요합니다. 
    이 경험이 긴 의사결정 주기를 버티는 힘으로 읽힙니다."
   또는
   "공공사업 운영에서는 여러 부서 기준을 맞추고 
    예외 처리를 견디는 것으로 해석됩니다."
3. "면접에서는 이 경험이 어디까지 책임이었는지 명확히..."
```

**Gap**: 증권×공공의 의미를 설명하지 않음 (교집합 없음).

---

### Case B: 병원 운영 → 서비스기획 / 의료 → 디지털헬스케어

| 항목 | 값 |
|------|-----|
| currentJob | 병원·의료기관 운영 |
| currentIndustry | 병원·의료 |
| targetJob | 서비스기획 |
| targetIndustry | 디지털 헬스케어 |
| jobDistance | cross (operations ↔ planning) |
| industryDistance | adjacent (healthcare ↔ healthcare-adjacent) |

**기대되는 조합**:
```
"의료 운영 경험이 디지털헬스 서비스기획으로 어떻게 이어지는가?
 - 의료진 협업, 환자 접점 리듬은 같음
 - 하지만 디지털 제품은 의료 프로세스를 다시 설계해야 함
 - 기존 의료 기준을 질문하고 새 방식을 설명할 수 있어야 함"
```

**현재 실제 출력**:
```
1. "병원 운영에서 의료진과 행정, 환자 접점을 조율한 경험..."
2. "서비스기획에서는 기능 선택과 제품 의도를 어떻게 
    사용자 경험으로 풀어냈는지로 해석됩니다."
   또는
   "디지털헬스케어에서는 의료 신뢰와 규제 준수가 기술 설계까지 영향을 미칩니다."
3. "면접에서는 제품 기획 기준을..."
```

**Gap**: "의료 운영 → 디지털헬스 서비스기획"의 변환 로직이 없음.

---

### Case C: 증권 영업 → 서비스기획 / 증권 → 핀테크

**기대되는 조합**:
```
"금융 소비자 이해 경험이 핀테크 서비스기획에서 어떻게 다른가?
 - 증권: 투자자의 위험선호, 규제기준, 수익성 중심
 - 핀테크: 사용자 편의성, 접근성, 금융 민주화
 둘의 고객 구조와 의사결정 기준이 다르다."
```

**현재 구조**: 증권 업계 특징 + 서비스기획 특징 = 조합 없음

---

### Case D: 일반 사무운영 → 공공사업 운영 / 일반기업 → 공공기관

**기대되는 조합**:
```
"공공사업 운영의 실제 산출물과 이해관계자는?
 - 민간 운영: 효율성, 수익성 중심
 - 공공사업: 정책 준수, 예산 정산, 공공 책임 중심
 사무 경험을 공공 기준으로 다시 설명해야 함."
```

**현재**: 공공기관 구조 설명 + 일반 운영 경험 = 조합 미흡

---

## 5. Root Cause Analysis

### 문제 유형 분류

#### **Type B: Parallel Translation** ✅ CONFIRMED

직무 문장, 산업 문장, 일반 문장이 **따로 출력**되며 하나의 해석으로 합쳐지지 않음.

**근거**:
- `buildTransitionLiteStrengths()` line 2907–2912:
  ```javascript
  const line2 =
    primaryRiskKey === RISK_INDUSTRY_CONTEXT_SHIFT
      ? buildTransitionLiteIndustryTranslationLine(...)    // 산업만
      : primaryRiskKey === RISK_SCOPE_REINTERPRETATION
        ? buildTransitionLiteScopeTranslationLine(...)      // 직무만
        : buildTransitionLiteGenericTranslationLine(...);   // 일반
  ```
  **배타적 선택 (exclusive OR)** — 동시에 두 개 이상 생성 안 됨.

#### **Type D: Existing Hint Unused** ✅ CONFIRMED

`targetStructureTags` (REGULATED, EXPERT_BUYING, FIELD_CONSTRAINT 등)와  
`targetJobFamilyId`는 생성되지만, 조합에 사용되지 않음.

**근거**:
- `buildTransitionLiteGenerationTags()` line 214–224에서 생성됨
- 사용처: `buildTransitionLiteIndustryTranslationLine()`에서 tagss 확인만 함 (line 2775–2785)
- **targetJob 조합 로직 전무**

#### **Type E: UI Overload** ✅ PARTIAL

`TransitionLiteResult.jsx` line 3558에서:
```javascript
<ListBlock items={strengths} />
```
개별 문장이 3개 나열됨. 사용자는 "그래서 내가 무엇을 해야 하는가"가 불명확.

#### **Type F: Scoring-Copy Mismatch** ✅ PARTIAL

점수 (industryDistance = "cross", jobDistance = "adjacent")는 차이를 반영하지만,  
문구는 차이를 설명하지 못함.

---

## 6. Recommended Big Patch Candidate

### Option 1: **Compound Summary Field 추가** (추천)

**목표**:  
targetJob + targetIndustry + currentBackground를 하나의 **2~3문장 요약**으로 생성

**구현 전략**:

1. **새로운 함수**: `buildTransitionLiteCompoundInterpretation()`
   ```javascript
   Input:
   - targetJob, currentJob (roles, families)
   - targetIndustry, currentIndustry (sector, coreContext, decisionStructure)
   - classification (jobDistance, industryDistance)
   
   Output:
   - compoundHeadline: 1문장 (핵심)
   - compoundBody: 2문장 (변환 메커니즘)
   - actionableFrame: 1문장 (다음 단계)
   ```

2. **호출 위치**: `buildTransitionLiteVM()` line 3064 
   - `buildTransitionLiteStrengths()` 직전에 compoundInterpretation 생성
   - strengths 배열 앞에 삽입

3. **Registry 구조**:
   ```
   src/data/transitionLite/compoundInterpretationRegistry.js
   
   Rule Set:
   - jobDistance=same, industryDistance=cross
   - jobDistance=adjacent, industryDistance=adjacent
   - jobDistance=cross, industryDistance=cross
   - etc.
   
   각 규칙에 template + token matching 포함
   ```

4. **템플릿 예**:
   ```
   Rule: {job=adjacent, industry=cross, targetSector=FINANCE_INSURANCE}
   
   Compound: "{targetIndustry}의 {targetJob}은 
             {currentJob}의 {relevantSignal}이 기초가 되지만, 
             {industryDifference}를 먼저 이해해야 합니다."
   
   Tokens:
   - relevantSignal: currentJob의 강점 (기준 감각, 조율 능력 등)
   - industryDifference: targetIndustry의 고객/규제 차이
   ```

**수정 후보 파일** (≤3):
- src/lib/transitionLite/buildTransitionLiteResult.js (buildTransitionLiteVM 수정)
- src/data/transitionLite/compoundInterpretationRegistry.js (신규)
- src/components/report/TransitionLiteResult.jsx (렌더링 추가, optional)

**금지 파일**:
- buildTransitionLiteStrengths() 로직은 유지
- whyThisRead, topRisks는 현재 대로
- 점수 계산 변경 금지

**변경 범위**:
- Registry 기반이므로 구조적 변경 최소
- 기존 strengths는 보조로 유지
- UI는 compoundInterpretation을 상단에 추가

**리스크**:
- Registry 커버리지: 모든 job/industry 조합을 다 커버하기 어려움
- 새 필드 추가로 VM 크기 증가 (경미)

**검증 케이스**:
- Case A, B, C, D 모두에서 compound headline이 job×industry 의미를 명시하는지 확인

---

### Option 2: Job-Industry Interaction Hint 연결

**목표**: 기존 `TRANSITION_LITE2_SUPPORT_INDUSTRY_TRAITS_REGISTRY` 활용

**한계**:
- Registry에 industry traits만 있고, job×industry 상호작용은 없음
- 모든 조합을 미리 정의하기 불가능

---

### Option 3: Regulated/Trust/Buyer Context Layer 추가

**목표**: 금융, 헬스, 공공처럼 규제 섹터에서만 특화 로직 작동

**장점**: 정확도 높음  
**단점**: 범위 제한 (50% 케이스만 커버)

---

## 7. Not Recommended

❌ **이 시점에서 하지 말아야 할 것**:

1. **문구 1~2개 수정** → 근본 구조 개선 없음
   - 예: "증권에서는"을 "증권의 공공사업에서는"으로 수정하기
   - 이미 구조적 문제

2. **기존 3 라인 통합** → 기존 사용자에게 혼란
   - 예: industryTranslationLine과 scopeTranslationLine을 하나로 합치기
   - whyThisRead와 강점이 겹칠 수 있음

3. **점수 계산 연동** → 점수는 이미 차이 반영
   - 문구를 점수 기준으로 재생성하기
   - 순환 참조 위험

4. **대규모 registry 수정** → 이전 PR들과 충돌
   - PR #151–155가 strength 기반으로 최적화됨
   - 그 기반을 바꾸면 모두 재검증 필요

---

## 8. Next Prompt Draft

다음 패치 단계를 위한 초안 (이번 조사에서는 **수정하지 않음**):

```markdown
# SPEC: 경력 리포트 직무×산업 조합 해석 추가

## 목표
경력 리포트에서 targetJob + targetIndustry의 실제 조합 맥락을 1문장으로 설명한다.

## 핵심 개선
- 기존 "산업 설명 OR 직무 설명"에서 "산업 속 직무의 의미"로 전환
- 새로운 VM field: compoundInterpretation (text)
- 레지스트리 기반 규칙 엔진 추가

## 설계
1. buildTransitionLiteCompoundInterpretation(targetContext, classification)
   - jobDistance + industryDistance 기반 규칙 선택
   - targetJobFamilyId × targetIndustrySector 조합 평가
   - 템플릿 렌더링 (token 주입)

2. Registry: compoundInterpretationRegistry.js
   ```
   {
     id: "same-job-cross-industry-finance",
     when: {
       jobDistance: "same",
       industryDistance: "cross",
       targetSector: "FINANCE_INSURANCE"
     },
     template: "...",
     requiredTokens: ["currentJobStrength", "targetCustomerDifference"],
     fallback: "..."
   }
   ```

3. 렌더링: CompoundInterpretationCard (whyThisRead 직후)

## 테스트 케이스
- Case A, B, C, D 각각에서 compoundInterpretation이
  "이 산업에서 이 직무가 어떤 의미"를 설명하는지 확인

## 제약
- 기존 strengths, whyThisRead, topRisks 구조 유지
- Registry 커버리지 50% 이상 필수
- 미매칭 케이스는 fallback 문구 사용
```

---

## 9. Local Risk

⚠️ **git 상태 주의**:
```
dirty file:  .tmp_vercel_deploy_head2 (수정됨)
untracked:   9개 worktree 디렉토리, 임시 리포트 파일
```
- 이 상태로 git reset/clean 금지
- 최종 보고서 외 파일 생성 금지
- 다음 패치 단계 시 정리

---

## 10. Conclusion

**경력 리포트 직무×산업 조합 해석 구조 현황**:

| 측면 | 현재 상태 |
|------|---------|
| **조합 필드 존재** | ❌ 없음 |
| **병렬 설명** | ✅ 있음 (분리됨) |
| **Registry 기반 힌트** | ❌ 미사용 |
| **UI 가독성** | ⚠️ 3개 문장 나열 |
| **점수-문구 연동** | ⚠️ 부분적 |

**다음 큰 패치 목표**:
- `compoundInterpretation` 필드 추가
- 레지스트리 기반 job×industry 의미 해석
- 사용자가 "내가 왜 이 산업×직무를 해야 하나"를 이해하도록

**예상 효과**:
```
현재:
"공공사업 운영에서는 우선순위 결정이 중요합니다.
 증권·자산운용에서는 전문가 신뢰가 핵심입니다."

개선 후:
"증권 산업의 공공사업 운영은, 
 금융감독과 투자자 신뢰를 기반으로 공공 정책을 실행하는 역할입니다. 
 QC 경험의 기준 감각과 이어지지만, 금융 고객의 의사결정 구조는 새롭습니다."
```

---

**End of Investigation Report**

생성: 2026-05-08 / Claude Code (read-only)
