# Newgrad Axis5: Soft Trait Fit Model

**Status**: Implemented (Profile-based system)  
**Implementation File**: `src/lib/analysis/buildNewgradAxisPack.js`  
**Last Updated**: 2026-05-03

## Overview

Axis5 measures soft trait fit—whether a candidate's self-reported strengths and work styles align with the soft traits, attitudes, and working habits that are favorable in a target job. This is NOT a hard skill axis and does NOT use job ontology coreActions in the detail card output path.

**Key Distinction**: Axis5 is about soft traits (mindsets, attitudes, habits), NOT hard skills (technical abilities or proven outcomes).

## Defined Category Profiles (14 Categories)

The system includes explicit profile definitions for all 14 job categories:

1. **MARKETING** - 고객 반응을 살피고 메시지를 조정하는 태도
2. **BUSINESS** - 문제를 구조화하고 우선순위를 판단하는 태도
3. **IT_DATA_DIGITAL** - 문제를 끝까지 정리하는 태도
4. **SALES** - 상대의 니즈를 듣고 후속을 챙기는 태도
5. **HR_ORGANIZATION** - 사람의 상황을 듣고 기준에 맞게 조율하는 태도
6. **FINANCE_ACCOUNTING** - 숫자와 기준을 꼼꼼히 확인하는 태도
7. **CUSTOMER_OPERATIONS** - 고객 불편을 듣고 처리 흐름을 정리하는 태도
8. **PROCUREMENT_SCM** - 공급업체와 관계를 맺고 수급 계획을 정리하는 태도
9. **MANUFACTURING_QUALITY_PRODUCTION** - 생산 과정의 문제를 발견하고 빠르게 대응하는 태도
10. **ENGINEERING_DEVELOPMENT** - 사용자 요구를 파악하고 기술 문제를 차근차근 해결하는 태도
11. **DESIGN** - 사용자의 입장에서 문제를 이해하고 표현하는 태도
12. **RESEARCH_PROFESSIONAL** - 증거를 토대로 문제를 깊이 있게 분석하는 태도
13. **EDUCATION_COUNSELING_COACHING** - 학습자의 상황을 이해하고 성장을 돕는 태도
14. **PUBLIC_ADMINISTRATION_SUPPORT** - 정해진 기준 안에서 다양한 이해관계자를 조율하는 태도

All 14 categories have been assigned explicit profile definitions covering:
- Category label (한글 직무명)
- Soft trait summary (필요한 태도)
- Strength fit phrases (3 recommended strength dimensions)
- Work style fit phrases (3 recommended work style dimensions)
- Bridge scene (실제 경험에서 드러나는 장면)
- Limit object (이 축만으로 판단할 수 없는 것)

## Profile Structure

Each profile is defined in `AXIS5_SOFT_TRAIT_FIT_PROFILES` with:

```javascript
{
  categoryLabel: "직무 한글명",
  softTraitSummary: "필요한 태도 요약",
  strengthFitPhrases: ["강점1", "강점2", "강점3"],
  workStyleFitPhrases: ["방식1", "방식2", "방식3"],
  bridgeScene: "경험에서 드러나는 구체적 장면",
  limitObject: "이 축만으로 판단할 수 없는 것",
  strengthGroupKeys: ["GROUP_KEY_1", "GROUP_KEY_2", "GROUP_KEY_3"],
  workStyleGroupKeys: ["WORKSTYLE_KEY_1", "WORKSTYLE_KEY_2", "WORKSTYLE_KEY_3"]
}
```

## Profile Match Counting

The `countAxis5ProfileMatches()` function counts how many selected group IDs from a candidate's input match the recommended group IDs in a profile:

```javascript
function countAxis5ProfileMatches(selectedGroupIds = [], profileGroupKeys = []) {
  // Returns: number of matches (0, 1, 2, or 3+)
}
```

Match counts determine the messaging severity level for the detail card output.

## Recommended Trait Groups

The system defines recommended strength and work style groups for each category:

- Each category has **3 strength groups** with id and phrase
- Each category has **3 work style groups** with id and phrase
- Group IDs are standardized (e.g., `ANALYTICAL_PROBLEM_SOLVER`, `COMMUNICATION_PERSUASION`)

## Detail Card Generation

The `buildAxis5ComparisonCopy()` function generates profile-based output:

**Input Signals**:
- `targetJobLabel`: Name of target job
- `targetJobId`: Job ID (used to extract category)
- `targetJobCategoryKey`: Optional explicit category (overrides auto-detection)
- `canonicalStrengthKeys`: Selected strength dimension IDs
- `canonicalWorkStyleKeys`: Selected work style dimension IDs

**Output**:
```javascript
{
  categoryKey: "MARKETING",
  categoryLabel: "마케팅",
  profile: { ... },
  strengthMatchCount: 2,        // 0-3 matches
  workStyleMatchCount: 1,       // 0-3 matches
  strengthSupplement: "...",    // Detail explanation + recommendation
  workStyleSupplement: "...",   // Detail explanation + recommendation
  cautionText: "..."            // Emphasis on experience over trait matching
}
```

## Fallback Profile

For unmapped categories, `getAxis5SoftTraitProfile()` returns a generic fallback profile with:
- Generic soft trait summary: "업무에 필요한 태도와 일하는 방식"
- 3 generic strength phrases for broad applicability
- 3 generic work style phrases for broad applicability
- Generic bridge scene and limit object

## Forbidden Phrases

The following phrases MUST NOT appear in the real UI output path (they reference hard skills):

1. "코딩" / "프로그래밍" (technical skills)
2. "수행력" / "실행력" (when used for hard deliverables)
3. "기술 역량" / "기술적 능력"
4. "마케팅 실행" / "캠페인 집행"
5. "영업 성과" / "매출"
6. "프로젝트 관리"
7. "데이터 분석 역량"
8. "재무 분석"
9. "고객 전환"
10. "시스템 구축"
11. "콘텐츠 제작"
12. "채용 역량"
13. "팀 관리"
14. "예산 관리"
15. "품질 검수"
16. "프로세스 최적화"
17. "결과 달성"

All output text uses only soft trait language (태도, 성향, 일하는 방식).

## Sentence Templates (A-G)

The system generates sentences based on profile match counts and input presence:

**Template Structure**:
- A: Both strengths and work styles present with high profile match (2+ matches each)
- B: Both strengths and work styles present with medium profile match (1 match each)
- C: Both present with low profile match (0 matches for one or both)
- D: Only strengths present with good match
- E: Only strengths present with low match
- F: Only work styles present with good match
- G: Only work styles present with low match

Templates are implemented via:
- `buildNewgradAxis5Sentences()` - Creates fallback summary sentence
- `buildAxis5ComparisonCopy()` - Creates strength/work style-specific recommendations
- Supplement text generation based on match counts

## Implementation Details

### Core Functions

**buildAxis5ComparisonCopy(signals)**
- Main entry point for Axis5 detail card generation
- Accepts canonical strength/work style keys
- Uses profile match counting to determine output severity
- Returns structured object with all necessary text fields
- MUST NOT call getCategoryActions() or reference hard skills

**countAxis5ProfileMatches(selectedGroupIds, profileGroupKeys)**
- Helper that counts matching group IDs
- Returns integer 0-3
- Used to determine messaging severity

**buildNewgradAxis5Sentences(signals)**
- Fallback sentence generator based on profile
- Creates 1-line summary of fit
- Uses soft trait language only
- Never references hard skills

**getAxis5SoftTraitProfile(categoryKey, fallbackLabel)**
- Returns profile object for a category
- Applies fallback profile for unmapped categories
- Never uses hard skill language

### Integration Points

- **buildAxis5ComparisonBlock()**: Calls buildAxis5ComparisonCopy() to generate copy
- **buildAxis5SelectionPack()**: Calls buildNewgradAxis5Sentences() for evidence summary

## Quality Assurance

### Test Cases

The implementation validates correctly against these scenarios:

1. **Full Input + Strong Profile Match**: Should indicate good fit with specific trait alignment
2. **Full Input + Weak Profile Match**: Should note limited trait connection, emphasize experience
3. **Partial Input (Strengths Only) + Match**: Should discuss strength alignment, note incomplete picture
4. **Partial Input (Work Styles Only) + Match**: Should discuss work style alignment, note incomplete picture
5. **No Profile Match**: Should indicate trait inputs exist but don't align with job profile
6. **Missing Inputs**: Should prompt for more comprehensive soft trait input

### Output Validation

All detail card output is validated to:
- Use ONLY soft trait profile language
- Contain 0 references to hard skills
- Include bridgeScene concept (connect to actual experience)
- Include limitObject concept (clarify what can't be judged from Axis5)
- Avoid all 17 forbidden phrases

## Coverage Scope (정식 Profile 적용 범위)

**Current Implementation Status**: All 14 job categories have explicit profile definitions

As of this implementation, the complete set of 14 job categories defined in `JOB_CATEGORIES` now has explicit soft trait profile definitions:

1. MARKETING
2. BUSINESS
3. IT_DATA_DIGITAL
4. SALES
5. HR_ORGANIZATION
6. FINANCE_ACCOUNTING
7. CUSTOMER_OPERATIONS
8. PROCUREMENT_SCM
9. MANUFACTURING_QUALITY_PRODUCTION
10. ENGINEERING_DEVELOPMENT
11. DESIGN
12. RESEARCH_PROFESSIONAL
13. EDUCATION_COUNSELING_COACHING
14. PUBLIC_ADMINISTRATION_SUPPORT

**Coverage: 100%** — No job category falls back to the generic fallback profile unless a future update introduces new categories to `JOB_CATEGORIES`.

## Fallback Profile for Future Categories

The fallback profile remains available as a **safety mechanism** for any future categories that may be added to the system. It provides:
- Generic soft trait summary: "업무에 필요한 태도와 일하는 방식"
- 3 generic strength phrases for broad applicability
- 3 generic work style phrases for broad applicability
- Generic bridge scene and limit object

If new job categories are added to `JOB_CATEGORIES` in future development:
1. The system will safely fall back to this generic profile
2. A new patch should explicitly define a soft trait profile for the new category
3. Following the same design principles as the 14 existing profiles

## Changelog

**v1.0** (2026-05-03)
- Implemented 7 category-specific soft trait profiles
- Added profile match counting logic
- Removed all hard skill references from detail output path
- Created fallback profile for unmapped categories
- Added soft trait-only sentence generation

## Related Documentation

- Product Spec: `docs/product/newgrad-analysis-engine.md`
- Axis1 Detail: `docs/product/newgrad-axis1-detail-reading-contract.md`
- Implementation: `src/lib/analysis/buildNewgradAxisPack.js` (lines 1991-2188)

## Next Steps

- Validate sentence template output quality against test cases
- Review fallback profile scenarios for edge cases
- Monitor production output for any hard skill phrase leakage
