# Transition Lite 방향성 회귀 테스트

## 1. 이 회귀셋의 목적

Transition Lite 엔진이 내놓는 결과가 **의도한 방향성을 유지하고 있는지**를 자동으로 검증한다.

리포트 전체를 사람이 눈으로 읽는 대신, 8개 고정 케이스를 한 번에 실행해서:
- 어떤 리스크 축이 상위인지
- 핵심 개념이 surface 텍스트에 포함되어 있는지
- generic한 설명만 남고 맥락이 날아가지 않았는지
- 산업 traits asset이 실제로 채워지는지
- surface 간 복붙/중복이 없는지

를 자동으로 판정한다. **실패한 케이스만 사람이 추가 확인하면 된다.**

> 이 테스트는 exact 문장 비교가 아닌 **방향성 회귀 검증**이다.
> 문장이 바뀌어도 리스크 우선순위와 핵심 키워드가 유지되면 PASS다.

---

## 1-1. 1차 vs 2차 회귀의 차이

| 항목 | 1차 (v1) | 2차 (v2 hardened) |
|---|---|---|
| 리스크 방향성 | O | O (동일) |
| 키워드 체크 | O | O (동일) |
| Generic 문구 금지 | 케이스별 only | **전체 surface 공통 패턴 추가** |
| Industry traits asset | 미검사 | **requireIndustryTraitsAsset=true 케이스 강제** |
| Placeholder 탐지 | 없음 | **`{…}` raw template 잔존 감지** |
| Surface 간 중복 | 없음 | **near-duplicate 감지 (topRisk↔why, why↔job, why↔ind)** |
| 최소 길이 | 없음 | **minSurfaceLengthByField (warning)** |
| fail category | 없음 | **7개 카테고리 (risk-order / asset / placeholder / duplicate / generic / keyword-missing / forbidden-phrase)** |
| warning | 없음 | **length warning 분리** |
| JSON 출력 | failReasons | **failReasons + warningReasons + failCategorySummary** |

---

---

## 1-2. fail 카테고리 설명

| category | 의미 | 확인 위치 |
|---|---|---|
| `risk-order` | preferredTopRiskKeys 없음 / forbiddenTopRiskKey 감지 / maxTopRiskCount 초과 / 리스크 key 중복 | `classifyTransition` + `pickTransitionLiteRiskKeys` |
| `asset` | requireIndustryTraitsAsset인데 industryTraitsAsset이 null | `support_industry_traits.js` industryKey 매핑 |
| `placeholder` | `{label}` 등 raw template 잔존 | `riskTextRegistry` / `targetReadAdapter` template 치환 로직 |
| `duplicate` | surface 간 near-duplicate (topRisk.body ↔ whyThisRead, whyThisRead ↔ jobRead, whyThisRead ↔ indRead) | `whyFragmentRegistry` / `targetReadAdapter` 문장 다양성 |
| `generic` | 전체 공통 generic 문구 감지 ("비슷한 업무입니다" 등) | `whyFragmentRegistry` / `riskTextRegistry` copy 검토 |
| `keyword-missing` | requiredKeywordsBySurface 키워드 누락 | 해당 surface builder 및 registry 확인 |
| `forbidden-phrase` | 케이스별 forbiddenPhrasesBySurface 감지 | 해당 surface 텍스트 확인 |

warnings (fail 아님):
- `length`: minSurfaceLengthByField 기준 미달 — surface가 너무 짧아 실질 정보가 없을 가능성

---

## 1-3. requireIndustryTraitsAsset 강제 케이스

아래 케이스는 `requireIndustryTraitsAsset: true`로 설정되어 traits asset이 null이면 **fail**:

| case | 이유 |
|---|---|
| case-2 (공공기관) | 공공기관 특수 운영 구조가 반드시 노출되어야 함 |
| case-4 (아웃소싱/운영대행) | B2B 외부 운영 맥락이 빠지면 generic 리드가 됨 |
| case-6 (기계/산업장비) | 필드엔지니어 도메인 특수성 확인 |
| case-7 (협회/단체) | 회원사/이해관계자 구조가 핵심 — traits 없으면 generic |
| case-8 (협회/단체) | case-7과 같은 target industry — 동일 이유 |

---

## 1-4. duplicate/generic 판정이 필요한 이유

**duplicate 체크:**
whyThisRead와 topRisk.body가 거의 같은 문장이면, 사용자 입장에서 "왜 그렇게 읽혔나" 설명이
"리스크 제목 재탕"으로 전락한다. 실제 인사이트가 없고 surface별 역할 분리가 무너진 신호다.

**generic 체크:**
"비슷한 업무입니다", "유사한 역할입니다" 등이 나오면 직무/산업 특수성이 날아간 것이다.
이런 문구는 어떤 입력에도 출력되는 fallback 텍스트일 가능성이 높아 quality decay 조기 감지에 필요하다.

---

## 2. 파일 구조

```
scripts/regression/
├── transition-lite-cases.js        # 8개 케이스 정의 + expectations
├── transition-lite-evaluator.js    # 방향성 평가 로직 (evaluateCase)
└── run-transition-lite-regression.mjs  # 실행기 (PASS/FAIL 출력)
```

### 각 파일 역할

| 파일 | 역할 |
|---|---|
| `transition-lite-cases.js` | input (4개 ID) + expectations 구조 8세트 정의 |
| `transition-lite-evaluator.js` | 7개 fail category 판정 + near-duplicate + global generic + asset/placeholder + warning |
| `run-transition-lite-regression.mjs` | 케이스 실행 → 평가 → PASS/FAIL 콘솔 출력, `--json` 저장 지원 |

---

## 3. 케이스 8개 요약

| id | 현재 직무 | 현재 산업 | 지원 직무 | 지원 산업 | 핵심 검증 포인트 |
|---|---|---|---|---|---|
| case-1 | DevOps/인프라 | B2B SaaS | DevOps/인프라 | 엔터프라이즈 솔루션 | 리스크 없음 기준점, JOB_EXPECTATION_SHIFT 금지 |
| case-2 | DevOps/인프라 | B2B SaaS | DevOps/인프라 | 공공기관 | INDUSTRY_CONTEXT_SHIFT 상위, 공공 맥락 포함 |
| case-3 | QA/테스트 자동화 | B2B SaaS | DevOps/인프라 | B2B SaaS | SCOPE_REINTERPRETATION 상위, 배포/운영 키워드 |
| case-4 | 서비스운영 | 온라인 커머스 | 운영기획 | 아웃소싱/운영대행 | 산업+역할 양쪽 전환, 아웃소싱 문맥 포함 |
| case-5 | 서비스기획 | B2C 플랫폼 | 사업기획 | 컨설팅/리서치 | "기획이라 비슷" generic 실패, 컨설팅 맥락 포함 |
| case-6 | 품질보증QA | 전기전자 | 기술지원/필드엔지니어 | 기계/산업장비 | front-facing 역할 변화, 지원 키워드 |
| case-7 | 채용 | HR/채용서비스 | 대외협력 | 협회/단체 | 이해관계자 구조 변화, 협회 맥락 포함 |
| case-8 | DevOps/인프라 | 아웃소싱/운영대행 | 민원/현장지원 | 협회/단체 | 직무 번역 정확성, 리스크 중복 없음 |

### Case 8 현재 산업 선정 근거

> `IND_PROFESSIONAL_B2B_SERVICES_OUTSOURCING_OPERATIONS` 선정.
> DevOps 직군이 B2B 서비스 계열에서 가장 자주 종사하는 맥락은 IT 인프라 운영/아웃소싱이다.
> professional_b2b_services 섹터 내 다른 후보(컨설팅, HR서비스 등)는 DevOps 운영 맥락과 거리가 멀다.

---

## 4. 실행 방법

```bash
# 전체 8케이스 실행
node ./scripts/regression/run-transition-lite-regression.mjs

# 특정 케이스만 실행
node ./scripts/regression/run-transition-lite-regression.mjs --case case-3

# JSON 저장 (scripts/regression/output/*.json)
node ./scripts/regression/run-transition-lite-regression.mjs --json

# 복합
node ./scripts/regression/run-transition-lite-regression.mjs --case case-8 --json
```

fail이 있으면 exit code 1로 종료된다. CI 연동 시 활용 가능.

---

## 5. 언제 전체 8개를 돌려야 하는지

아래 변경이 있을 때 반드시 전체 실행:

- `buildTransitionLiteResult.js` 변경
- `classifyTransition.js` 변경 (jobDistance / industryDistance / roleWeightShift / responsibilityShift 로직)
- `riskTextRegistry.js`, `whyFragmentRegistry.js` 텍스트 변경
- `targetReadAdapter.js` 변경
- `targetJobReadDetailMap.*.js` 또는 `support_industry_traits.js` 변경
- `pickTransitionLiteRiskKeys`, `orderTransitionLiteRiskKeys` 로직 변경

---

## 6. fail 났을 때 어디부터 볼지

**preferredTopRiskKeys 없음**
→ `classifyTransition()` 반환값 확인 (jobDistance / industryDistance / roleWeightShift / responsibilityShift)
→ `pickTransitionLiteRiskKeys()` + `orderTransitionLiteRiskKeys()` 로직 확인

**forbiddenTopRiskKey 감지**
→ classification이 바뀌었을 가능성 — classifyTransition 로직 확인

**requiredKeyword 없음 [targetJobRead]**
→ `buildTransitionLiteTargetJobRead()` 확인 (targetReadAdapter.js)
→ targetJobReadDetailMap 해당 subcategory 확인

**requiredKeyword 없음 [targetIndustryRead]**
→ `buildTransitionLiteTargetIndustryRead()` 확인
→ `support_industry_traits.js` 해당 industry 항목 확인
→ `industryKey` 매핑이 registry에 있는지 확인

**forbiddenPhrase 감지**
→ whyFragmentRegistry 또는 riskTextRegistry의 특정 text 확인
→ 해당 케이스 실제 리포트 전체를 별도로 열람

**[asset] industryTraitsAsset null**
→ `support_industry_traits.js` 해당 산업 섹터 확인
→ `isMatchingIndustryTraitsKey()` 정규화 로직 확인 (alias 누락 여부)

**[placeholder] {…} 패턴 감지**
→ riskTextRegistry / heroTemplateRegistry template 치환 여부 확인
→ targetReadAdapter의 `resolveIndustryTemplateText` 호출 경로 확인

**[duplicate] near-duplicate 감지**
→ whyFragmentRegistry의 fragment text가 riskText.body와 너무 유사하지 않은지 확인
→ 해당 케이스 `whyThisRead[0]`와 `topRisks[0].body`를 직접 비교

**[generic] global generic 감지**
→ 어떤 surface에서 나왔는지 fail reason의 `[surface]` 확인
→ whyFragmentRegistry / targetJobReadDetailMap fallback 텍스트 검토

---

## 7. 평가 방식 주의사항

이 테스트는 **방향성 회귀 검증**이다.

- 텍스트 문장이 바뀌어도 키워드가 유지되면 PASS
- 리스크 키 순서가 바뀌면 preferredTopRiskKeys 기준으로 재판정
- 새로운 산업/직무 ID가 추가되면 cases.js의 input ID도 갱신 필요
- expectations는 엔진 동작이 바뀔 때마다 사람이 방향성을 재확인하고 업데이트해야 함

실패가 버그인지 의도적 변경인지는 **사람이 판단**해야 한다.
자동 판정은 "어디를 봐야 하는지"를 좁혀주는 역할을 한다.
