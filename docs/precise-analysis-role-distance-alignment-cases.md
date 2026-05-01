# roleDistanceCheck alignment 테스트 케이스 기준서

> Round 8-F (2026-04-28) — 코드 수정 없음, 문서 고정 전용

---

## 1. 문서 목적

`roleDistanceCheck.alignment` 값이 각 입력 조합에서 어떤 결과를 내야 하는지를 고정한다.

이 문서는:
- 신규 케이스 추가 시 alignment 기준의 레퍼런스가 된다.
- Round 8-E 버그 수정(TC-06 unknown 선처리) 이후의 올바른 동작을 명세한다.
- `roleDistanceCheck`는 debug/교차검증 전용이며, `comparisonPack.functionFit`을 override하지 않는다는 원칙을 케이스별로 확인한다.

---

## 2. alignment 해석 기준

| alignment | mappedFunctionFit | comparisonFunctionFit | 의미 |
|---|---|---|---|
| `same_level_agree` | X | X (동일 값) | 대분류 canonical 판정과 세부 직무 판정이 일치. 양쪽이 모두 "mismatch"인 경우도 포함 |
| `coarse_transferable_but_detail_mismatch` | `transferable` | `mismatch` | 대분류상 연결 가능성은 있으나, 세부 직무 기준으로는 직접성이 부족한 상태 |
| `coarse_same_but_detail_mismatch` | `same` | `mismatch` | 대분류 canonical이 동일 직무군으로 분류했으나, 세부 직무 기준으로는 직접성이 부족한 상태 |
| `coarse_distant_but_detail_transferable` | `mismatch` | `transferable` | 대분류상 거리가 있으나 세부 직무 기준으로는 전이 가능 (현재 사실상 dead branch) |
| `unknown` | `unknown` 또는 null | any | 입력 부족 또는 canonical 분류 실패로 판정 불가 |

### 핵심 해석 규칙

- `same_level_agree`는 "양쪽이 좋은 판정에 동의"가 아니라 "양쪽 시스템 판정이 같은 값"을 의미한다.
  - 예: mappedFunctionFit=mismatch + comparisonFunctionFit=mismatch → `same_level_agree` (양쪽 모두 불일치에 동의)
- `shouldOverrideComparison`은 어떤 alignment 값에서도 항상 `false`이다.
- `unknown` 선처리 규칙 (Round 8-E): mappedFunctionFit 또는 comparisonFunctionFit이 `"unknown"` 또는 null이면 alignment는 무조건 `"unknown"`이다. 절대 `same_level_agree`로 처리하지 않는다.

---

## 3. 테스트 케이스 요약표

| TC | 설명 | jdFamily | resumeFamily | tier | mappedFit | comparisonFit | alignment | 비고 |
|---|---|---|---|---|---|---|---|---|
| TC-01 | iMBC 구매→온라인광고 | MARKETING | OPS | transferable | transferable | mismatch | `coarse_transferable_but_detail_mismatch` | **회귀 앵커** |
| TC-02 | 백엔드 개발→백엔드 개발 | DEV | DEV | same | same | same | `same_level_agree` | 직접 매칭 기준선 |
| TC-03 | 물류 운영→물류 운영 | OPS | OPS | same | same | same | `same_level_agree` | Round 8-B 오탐 방지 확인 |
| TC-04 | 회계→광고 정산 | MARKETING | FINANCE | transferable 또는 distant | transferable 또는 mismatch | mismatch | `same_level_agree` 또는 `coarse_transferable_but_detail_mismatch` | 알려진 한계 케이스 |
| TC-05 | 영업→디지털 마케팅 | MARKETING | SALES | adjacent | adjacent | adjacent | `same_level_agree` | 인접 직무 동의 케이스 |
| TC-06 | 빈 입력 / 정보 부족 | null | null | unknown | unknown | null | `unknown` | **Round 8-E 수정 검증** |
| TC-07 | 구매+광고협업 언급→온라인광고 | MARKETING | MARKETING | same | same | mismatch | `coarse_same_but_detail_mismatch` | override 금지 대표 케이스 |
| TC-08 | HR 채용→HR 채용 | HR | HR | same | same | same | `same_level_agree` | 단순 동일 직무 확인 |
| TC-09 | 개발자→서비스 기획 PM | PM | DEV | adjacent | adjacent | adjacent 또는 mismatch | `same_level_agree` 또는 `coarse_same_but_detail_mismatch` | 직군 전환 케이스 |
| TC-OPT-01 | 재무→재무 | FINANCE | FINANCE | same | same | same | `same_level_agree` | - |
| TC-OPT-02 | 개발→HR (원거리) | HR | DEV | distant | mismatch | mismatch | `same_level_agree` | 원거리 동의 케이스 |
| TC-OPT-03 | 연구개발→연구개발 | RND | RND | same | same | same | `same_level_agree` | - |
| TC-OPT-04 | dead branch 확인 | 임의 | 임의 | distant | mismatch | transferable | `coarse_distant_but_detail_transferable` | 현재 자연 발화 불가 |
| TC-OPT-05 | 한쪽만 unknown | MARKETING | null | unknown | unknown | mismatch | `unknown` | Round 8-E 경계 케이스 |

---

## 4. 케이스별 상세 기준

### TC-01 — iMBC 회귀 앵커 (필수)

**목적**: Round 8-B/8-C/8-E 패치 통합 후 기준 동작 고정

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "온라인 광고 운영, 정산 및 매출 관리, 광고 상품 기획, 광고 솔루션 도입" |
| 이력서 입력 | "구매 5년, 협상 경험, CPSM, SAP, 영어 가능" |
| `jdFamily` | `MARKETING` |
| `resumeFamily` | `OPS` |
| `tier` | `transferable` (DISTANCE_MATRIX[OPS][MARKETING] = transferable) |
| `mappedFunctionFit` | `transferable` |
| `comparisonFunctionFit` | `mismatch` (comparisonPack.functionFit 기존 값) |
| `alignment` | `coarse_transferable_but_detail_mismatch` |
| `shouldOverrideComparison` | `false` |
| `note` | "대분류상 연결 가능성은 있으나, 세부 직무 기준으로는 지원 직무와 직접적으로 연결되는 경험이 부족합니다." |

**검증 포인트**:
- `comparisonPack.functionFit`은 절대 `mismatch`에서 변경되지 않아야 한다.
- `roleDistanceCheck`가 있더라도 topRisks[0]는 experience_level_gap, topRisks[1]는 must_requirements_gap 유지.
- jdFamily가 Round 8-B 이전처럼 OPS로 잡히면 회귀 실패.

---

### TC-02 — 백엔드 개발 직접 매칭

**목적**: 동일 직무 직접 대응 시 same_level_agree 동작 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "백엔드 개발 3년 이상, Java/Spring, API 설계" |
| 이력서 입력 | "Java Spring 백엔드 개발 4년, REST API 개발" |
| `jdFamily` | `DEV` |
| `resumeFamily` | `DEV` |
| `tier` | `same` |
| `mappedFunctionFit` | `same` |
| `comparisonFunctionFit` | `same` |
| `alignment` | `same_level_agree` |
| `shouldOverrideComparison` | `false` |

---

### TC-03 — 물류 운영 직접 매칭 (Round 8-B 오탐 방지)

**목적**: Round 8-B에서 추가된 MARKETING 복합 키워드가 순수 OPS JD/이력서를 오탐하지 않음을 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "물류 운영 2년 이상, 재고 관리, 입출고 운영" |
| 이력서 입력 | "물류 운영 3년, ERP 사용, 입출고 관리" |
| `jdFamily` | `OPS` |
| `resumeFamily` | `OPS` |
| `tier` | `same` |
| `mappedFunctionFit` | `same` |
| `comparisonFunctionFit` | `same` |
| `alignment` | `same_level_agree` |

**검증 포인트**:
- "운영"이라는 단어가 있어도 MARKETING 복합 키워드가 없으면 OPS로 잡혀야 함.
- jdFamily가 MARKETING으로 오탐되면 Round 8-B 회귀 실패.

---

### TC-04 — 회계 → 광고 정산 (알려진 한계 케이스)

**목적**: 회계→광고 정산 케이스에서 현재 시스템의 한계를 명세화

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "광고 정산/매출 관리, 온라인 광고 플랫폼 운영" |
| 이력서 입력 | "회계 5년, 결산, 세무 신고" |
| `jdFamily` | MARKETING (광고 복합 키워드 우세) 또는 FINANCE (정산 키워드 우세) — JD 표현에 따라 달라짐 |
| `resumeFamily` | `FINANCE` |
| `tier` | jdFamily에 따라 transferable 또는 distant |
| `alignment` | jdFamily=MARKETING이면 `coarse_transferable_but_detail_mismatch`; jdFamily=FINANCE이면 `same_level_agree` (both mismatch) |

**알려진 한계**:
- 광고 정산은 "온라인 광고" 맥락의 재무 운영이므로 회계 경험이 실제로는 transferable할 수 있다.
- 현재 시스템은 이 세부 맥락을 구분하지 못한다.
- comparisonPack.functionFit 역시 mismatch로 판정될 가능성이 높아 TC-04는 양쪽 mismatch 동의 케이스가 된다.
- 향후 JD classification 정교화 또는 domain sensitivity 레이어로 개선 예정.

---

### TC-05 — 영업 → 디지털 마케팅 (인접 직무 동의)

**목적**: SALES→MARKETING 인접 관계에서 same_level_agree 동작 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "디지털 마케팅, 콘텐츠 기획, SNS 운영" |
| 이력서 입력 | "영업 3년, B2B 영업, 고객 커뮤니케이션" |
| `jdFamily` | `MARKETING` |
| `resumeFamily` | `SALES` |
| `tier` | `adjacent` (DISTANCE_MATRIX[SALES][MARKETING] = adjacent) |
| `mappedFunctionFit` | `adjacent` |
| `comparisonFunctionFit` | `adjacent` |
| `alignment` | `same_level_agree` |

---

### TC-06 — 빈 입력 / 정보 부족 (Round 8-E 수정 검증)

**목적**: Round 8-E 버그 수정 후 unknown→unknown이 `same_level_agree`를 트리거하지 않음을 검증

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | `""` (빈 문자열) 또는 `null` |
| 이력서 입력 | `""` (빈 문자열) 또는 `null` |
| `jdFamily` | `null` (UNKNOWN → null 변환) |
| `resumeFamily` | `null` (UNKNOWN → null 변환) |
| `tier` | `unknown` (computeRoleDistance fallback) |
| `mappedFunctionFit` | `unknown` |
| `comparisonFunctionFit` | `null` 또는 `"unknown"` |
| `alignment` | `unknown` |

**Round 8-E 이전 버그 재현 조건**:
- 수정 전: `mappedFunctionFit === comparisonFunctionFit` → `"unknown" === "unknown"` → `same_level_agree` (잘못된 동작)
- 수정 후: unknown 선처리 → 무조건 `alignment = "unknown"` (올바른 동작)

**검증 포인트**:
- alignment가 절대 `same_level_agree`가 되면 안 됨.
- `jdFamily`, `resumeFamily`는 UNKNOWN 문자열이 아니라 null로 반환되어야 함.

---

### TC-07 — 구매 + 광고 협업 언급 → 온라인 광고 (override 금지 대표 케이스)

**목적**: canonical이 "동일 직무군"으로 잘못 분류하더라도 comparisonPack.functionFit을 override하지 않음을 확인

**시나리오**: 이력서에 "구매 3년, 광고 대행사와 협업, 광고 프로젝트 지원" 등 광고 관련 단어가 포함되어 inferCanonicalFamily가 MARKETING을 반환하는 경우

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "온라인 광고 운영, 광고 상품 기획" |
| 이력서 입력 | "구매 3년, 광고 대행사 협업, 광고 프로젝트 지원 경험" |
| `jdFamily` | `MARKETING` |
| `resumeFamily` | `MARKETING` (광고 키워드 우세로 오분류) |
| `tier` | `same` |
| `mappedFunctionFit` | `same` |
| `comparisonFunctionFit` | `mismatch` (세부 직무 기준: 구매 경력, 광고 운영 직접 경험 없음) |
| `alignment` | `coarse_same_but_detail_mismatch` |
| `shouldOverrideComparison` | `false` |

**핵심 원칙**:
- canonical이 "same"이라고 해도 `comparisonPack.functionFit=mismatch`는 절대 변경하지 않는다.
- `coarse_same_but_detail_mismatch`는 "canonical이 틀릴 수 있음"을 나타내는 신호다.
- 이 케이스에서 사용자 노출 판정은 여전히 `mismatch` 기반 리스크여야 한다.

---

### TC-08 — HR 채용 직접 매칭

**목적**: HR 직무 동일 매칭 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "HR 채용 담당, 인재 채용, 온보딩 운영" |
| 이력서 입력 | "채용 담당 3년, 채용 공고 관리, 면접 운영" |
| `jdFamily` | `HR` |
| `resumeFamily` | `HR` |
| `tier` | `same` |
| `mappedFunctionFit` | `same` |
| `comparisonFunctionFit` | `same` |
| `alignment` | `same_level_agree` |

---

### TC-09 — 개발자 → 서비스 기획 PM (직군 전환)

**목적**: DEV→PM 인접/전이 관계에서의 alignment 기준 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "서비스 기획 PM, 요구사항 분석, 로드맵 수립" |
| 이력서 입력 | "백엔드 개발 5년, API 개발, 시스템 설계" |
| `jdFamily` | `PM` |
| `resumeFamily` | `DEV` |
| `tier` | `adjacent` (DISTANCE_MATRIX[DEV][PM] = adjacent) |
| `mappedFunctionFit` | `adjacent` |
| `comparisonFunctionFit` | `adjacent` 또는 `mismatch` (세부 직무 기준에 따라 달라짐) |
| `alignment` | comparisonFunctionFit=adjacent이면 `same_level_agree`; comparisonFunctionFit=mismatch이면 `coarse_same_but_detail_mismatch` 아님 (adjacent ≠ same이므로 이 분기 해당 안 됨) — 실제로는 unknown 분기 없이 not-matching → `unknown` |

**주의**: TC-09는 mappedFunctionFit=adjacent, comparisonFunctionFit=mismatch 조합이 발생하면 현재 alignment 로직에 정의된 케이스가 없어 `unknown`으로 fallback된다. 이는 의도된 동작이다 (alignment 분기는 transferable-vs-mismatch, same-vs-mismatch, mismatch-vs-transferable만 명시적으로 정의됨).

---

### TC-OPT-01 — 재무 → 재무 동일 매칭

| 필드 | 값 |
|---|---|
| `jdFamily` | `FINANCE` |
| `resumeFamily` | `FINANCE` |
| `alignment` | `same_level_agree` |

---

### TC-OPT-02 — 개발 → HR (원거리 직무 동의)

**목적**: 양쪽이 모두 mismatch로 동의하는 same_level_agree 케이스 확인

| 필드 | 값 |
|---|---|
| `jdFamily` | `HR` |
| `resumeFamily` | `DEV` |
| `tier` | `distant` (DISTANCE_MATRIX[DEV][HR] = distant) |
| `mappedFunctionFit` | `mismatch` |
| `comparisonFunctionFit` | `mismatch` |
| `alignment` | `same_level_agree` (양쪽이 mismatch에 동의) |

**해석 주의**: `same_level_agree`라고 해서 "좋은 매칭"이 아님. 양쪽 시스템이 모두 "안 맞음"에 동의하는 케이스.

---

### TC-OPT-03 — 연구개발 직접 매칭

| 필드 | 값 |
|---|---|
| `jdFamily` | `RND` |
| `resumeFamily` | `RND` |
| `alignment` | `same_level_agree` |

---

### TC-OPT-04 — dead branch 확인 (coarse_distant_but_detail_transferable)

**목적**: 현재 자연 발화가 불가능한 dead branch를 문서화

**조건**: mappedFunctionFit=mismatch AND comparisonFunctionFit=transferable
- 발화 조건: PACK_TRANSFERABLE에 있는 세부 직무 쌍(procurement→sales, procurement→consulting, finance→data_analytics)이 canonical에서는 distant로 판정되어야 함.
- 현재 상태: 이 3쌍의 canonical tier는 모두 "transferable"이므로 mappedFunctionFit=mismatch가 나오지 않음.
- 결론: 현재 코드베이스에서는 이 alignment가 자연적으로 발화되지 않는다.
- 향후 PACK_TRANSFERABLE이 확장되어 canonical distant 직무 쌍이 추가될 경우 활성화된다.

---

### TC-OPT-05 — 한쪽만 unknown (경계 케이스)

**목적**: Round 8-E unknown 선처리가 한쪽만 unknown일 때도 적용되는지 확인

| 필드 | 값 |
|---|---|
| JD 입력 힌트 | "온라인 광고 운영" |
| 이력서 입력 | `""` (빈 문자열) |
| `jdFamily` | `MARKETING` |
| `resumeFamily` | `null` |
| `tier` | `unknown` |
| `mappedFunctionFit` | `unknown` |
| `comparisonFunctionFit` | (세부 직무 기준 값) |
| `alignment` | `unknown` (mappedFunctionFit이 unknown이므로 선처리) |

---

## 5. fallback 승격 기준 초안

현재 `roleDistanceCheck`는 debug/교차검증 전용이며 `comparisonPack.functionFit`을 override하지 않는다.

향후 fallback 승격(= comparisonPack.functionFit의 unknown 상태를 roleDistanceCheck로 보완) 검토 조건:

| 조건 | 설명 |
|---|---|
| comparisonPack.functionFit = "unknown" | 세부 직무 판정이 실패한 경우 |
| roleDistanceCheck.tier ≠ "unknown" | canonical 판정은 성공한 경우 |
| alignment = "unknown"이 아닌 경우 | 양쪽 중 하나가 유효한 경우 |

**검토 전 필요 작업**:
1. alignment 분포 데이터 수집 (실제 입력 100개 이상 케이스)
2. `coarse_same_but_detail_mismatch` 발생 빈도 및 오판 사례 확인
3. TC-04처럼 양쪽이 잘못된 이유로 동의하는 케이스 비율 측정

**현재 결론**: fallback 승격 조건 미달. 충분한 검증 없이 승격하면 coarse canonical이 fine-grained 판정을 오염시킬 위험이 있다.

---

## 6. 남은 설계 이슈

| 번호 | 이슈 | 우선순위 |
|---|---|---|
| 1 | `same_level_agree`의 "both-match" vs "both-mismatch" 세분화 필요 | 중 |
| 2 | `coarse_distant_but_detail_transferable` dead branch 해소 — PACK_TRANSFERABLE 쌍 확장 시 함께 검토 | 낮음 |
| 3 | TC-04 광고 정산 JD 분류 개선 — 정산 키워드가 FINANCE를 끌어당기는 문제 | 중 |
| 4 | TC-09처럼 adjacent vs mismatch 불일치가 unknown으로 fallback되는 케이스에 별도 alignment 값 추가 여부 | 낮음 |
| 5 | MKT_ONLINE_AD subfamily 도입 여부 — 광고 운영을 MARKETING 내에서 더 세분화할지 결정 | 낮음 |
| 6 | alignment 분포 검증 도구 또는 테스트 스크립트 작성 | 중 |
| 7 | `roleDistanceCheck`가 fallback으로 승격될 조건을 위한 최소 케이스 수 기준 수립 | 낮음 |

---

## 7. 절대 주의사항

1. **`comparisonPack.functionFit`은 어떤 alignment 값에서도 override하지 않는다.**
   - `shouldOverrideComparison`은 항상 `false`다.
   - TC-07처럼 canonical이 "same"이라도 세부 직무 판정이 mismatch이면 mismatch를 유지한다.

2. **`same_level_agree`는 "좋은 매칭"이 아니다.**
   - 양쪽 시스템이 mismatch에 동의해도 `same_level_agree`가 된다.
   - 사용자 노출 판정은 항상 `comparisonPack`의 값을 기준으로 한다.

3. **unknown 선처리 (Round 8-E) 는 항상 최우선 적용된다.**
   - mappedFunctionFit 또는 comparisonFunctionFit 중 하나라도 "unknown" 또는 null이면 alignment = "unknown".
   - 이 규칙은 `same_level_agree` 체크보다 앞에 위치해야 한다.

4. **`roleDistanceCheck`는 현재 debug/교차검증 전용이다.**
   - 이 값을 직접 사용자에게 노출하거나, 리스크 판정에 사용하지 않는다.
   - `window.__PRECISE_ANALYSIS_DEBUG__.fitUnderstandingPack.roleDistanceCheck`에서 확인 가능.

5. **TC-01 (iMBC 케이스)은 회귀 앵커다.**
   - 어떤 패치 이후에도 TC-01의 기대값이 변하면 회귀로 간주한다.
   - 특히 `jdFamily=MARKETING`, `alignment=coarse_transferable_but_detail_mismatch`, `comparisonPack.functionFit=mismatch`는 반드시 유지되어야 한다.

---

*이 문서는 Round 8-F에서 생성되었으며, 코드 변경 없이 설계 기준만 고정한다.*
*alignment 로직 변경 시 이 문서를 동시에 업데이트해야 한다.*
