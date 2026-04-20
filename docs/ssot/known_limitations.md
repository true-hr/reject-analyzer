# Known Limitations — hireabilityScore cap 시스템

> 안정화 기준 버전 기준 (2026-03-14)
> 관련 파일: `src/lib/analyzer.js` — `applyHireabilityFitCaps()`

---

## 1. same-family seniority gap 미포착

**현상**: JD와 resume이 같은 role family(예: 둘 다 MKT, 둘 다 BIZ)로 추론될 때,
`__textFamilySame = true` 로 설정되어 [D] seniority cap 발화가 차단됨.

**예시**: 퍼포먼스 마케팅 팀 리드(JD, 경력 5년+) vs 디지털 마케팅 운영 1.5년(resume)
→ 두 텍스트 모두 MKT family → seniority cap 미발화 → score 45 (match 케이스와 동등)

**원인**: Round 6에서 strategy-match / b2b-match의 seniority 오발화를 막기 위해
`__textFamilySame` 조건을 추가했으나, 이것이 동일 직군 내 seniority gap도 차단함.

**Trade-off 근거**: `__textFamilySame` 없이는 matchScore < 0.5 인 match 케이스
(strategy-match 35%, b2b-match 35%)에서 seniority cap 이 오발화해 delta 분리가 무너짐.

**다음 라운드 옵션**:
- `__textFamilySame` 이더라도 expGap이 임계값(-3 이하 등) 을 초과하면 seniority 허용
- 또는 seniority cap 값을 46 이상으로 완화하여 match 케이스 피해 최소화 후 오발화 허용

---

## 2. text-only domain mismatch 미포착

**현상**: JD와 resume에 구조화된 domain 필드(`normalizedCurrentDomain` /
`normalizedTargetDomain`)가 없는 text-only 입력에서 [C] domain mismatch cap 미발화.

**예시**: B2B SaaS 마케팅(JD) vs 리테일 프로모션(resume)
→ structured domain 필드 없음 → cap 미발화 → score 45 (match 케이스와 동등)

**원인**: Round 6 강산.md 지침 "text 기반 domain 추론은 이번 라운드 추가 금지"에 따라
[C] cap은 structured domain 필드가 있을 때만 작동하도록 의도적으로 제한됨.

**다음 라운드 옵션**:
- `inferCanonicalFamily()` 와 유사한 방식의 `inferDomain()` 함수 구현 후 [C] 에 text fallback 추가
- 또는 keyword 기반 domain 키워드 사전(B2C / B2B / SaaS / 리테일 등)으로 경량 추론

---

## 배포 전 제거 후보 코드 위치

다음 코드는 개발 브랜치 전용이며, 운영 배포 전 제거 필요:

| 항목 | 위치 (analyzer.js) | 마킹 |
|------|-------------------|------|
| `__dp_input_shape` 선언 | ~5058 | `[배포 전 제거]` |
| `__dp_input_shape` 할당 블록 | ~5202–5213 | `[배포 전 제거]` |
| `globalThis.__PASSMAP_DECISIONPACK_ERROR__` 할당 | ~5836 | `[배포 전 제거]` |
| `console.error("[PASSMAP] buildDecisionPack throw"` | ~5838 | `[배포 전 제거]` |
| `console.error("[PASSMAP] buildSimulationViewModel primary failed"` | ~5256 | `[배포 전 제거]` |
| `console.error("[PASSMAP] buildSimulationViewModel risk-results fallback failed"` | ~5997 | `[배포 전 제거]` |
| `console.error("[PASSMAP] buildSimulationViewModel drivers fallback failed"` | ~5056 | `[배포 전 제거]` |

**검색 방법**: `grep -n "배포 전 제거" src/lib/analyzer.js`
