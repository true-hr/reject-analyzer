# PASSMAP Required Condition Gate Migration Policy

> 버전: 1.0.0  
> 상태: 확정(Locked)  
> 위치: docs/ — SSOT 정책 문서  
> 상위 문서:
> - `PASSMAP_GATE_AI_DECISION_POLICY.md` (판정 철학)
> - `PASSMAP_REQUIRED_CONDITION_RESOLUTION_POLICY.md` (rule/AI 결합 정책)
> - `PASSMAP_REQUIRED_CONDITION_KEY_POLICY.md` (조건 식별 키 정책)
> - `PASSMAP_REQUIRED_CONDITION_RESOLVER_PLACEMENT_POLICY.md` (resolver 배치 / 생애 주기)

---

## 1. 문서 목적

이 문서는 기존 required-condition gate를 `requiredConditionResolutions` 기반 구조로 **어떤 순서와 방식으로 이행할지** 고정한다.

목적은 기존 gate를 한 번에 갈아엎지 않고, **기존 출력 안정성을 유지한 채 점진적으로 전환**하는 것이다.

이 문서는 실제 구현 직전의 **마지막 상위 이행 정책**이다.

---

## 2. 핵심 결론

1. 기존 gate는 한 번에 갈아엎지 않는다.
2. 이행 방식은 **`shadow 생성 → parity 검증 → read-path 전환 → legacy 의존 정리`** 순서로 간다.
3. 첫 pilot은 **`REQUIRED_CERT`**다.
4. 기존 gate 이행 순서:
   1. `REQUIRED_CERT`
   2. `REQUIRED_MAJOR`
   3. `REQUIRED_EDUCATION`
   4. 총연차 gate
5. 신규 조건군(`REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE`, 관련경력 고도화)은 **처음부터 resolution-first**로 설계한다.
6. `GATE__CRITICAL_EXPERIENCE_GAP`는 **초기 migration 대상에서 제외**한다.
7. `GATE__SALARY_MISMATCH`, `GATE__AGE`는 **required-condition resolver 범위 밖**이다.
8. 첫 실제 구현은 **`baseline resolver skeleton + REQUIRED_CERT shadow resolution only`**로 제한한다.
9. 기존 gate read-path는 **첫 구현에서 바꾸지 않는다.**
10. PR #233은 최신 main 반영 후 재검증하면 **머지 가능한 선행 기반**으로 본다.

---

## 3. 기존 gate 분류

### 3-1. 이번 migration 대상

| gate | 현재 입력 | 판단 |
|---|---|---|
| `GATE__REQUIRED_CERT_MISSING` | `requiredGateSignals.certifications` | **1순위 pilot** |
| `GATE__REQUIRED_MAJOR_MISSING` | `requiredGateSignals.major` | 2순위 |
| `GATE__EDUCATION_GATE_FAIL` | `structural.flags / metrics` | 3순위, 선행 정규화 필요 |
| 총연차 gate (`SENIORITY__UNDER_MIN_YEARS`) | `state.careerSignals` | 4순위, 선행 정규화 필요 |

### 3-2. 신규 조건군 — resolution-first

- `REQUIRED_LANGUAGE`
- `REQUIRED_TOOL_OR_TECH`
- `REQUIRED_EXPERIENCE`
- 관련경력 연차 고도화

이들은 기존 legacy read-path를 거치지 않고, **처음부터 `requiredConditionResolutions`를 읽도록 설계**한다.

### 3-3. required-condition resolver 범위 밖

- `GATE__SALARY_MISMATCH`
- `GATE__AGE`

이 둘은 required condition이 아니라 **별도 gate 도메인**이므로 억지로 resolver에 편입하지 않는다.

### 3-4. 초기 migration 보류

- `GATE__CRITICAL_EXPERIENCE_GAP`

**보류 이유:**
- 여러 structural flag alias를 넓게 흡수한다.
- `evidenceFit`과 결합되어 있다.
- "필수 경험"은 이미 AI 중심 / gate 매우 제한 영역으로 정책 고정되어 있다.
- 장기적으로 `REQUIRED_EXPERIENCE`와 함께 재설계해야 한다.

---

## 4. 공통 4단계 이행 방식

### Phase 1. Shadow 생성

- 기존 gate는 그대로 유지한다.
- resolver가 같은 사실에 대한 resolution을 **병행 생성**한다.
- 사용자 출력, 점수, 리스크 순서는 바꾸지 않는다.

### Phase 2. Parity 검증

기존 gate 결과와 resolution 결과가 대표 케이스에서 일치하는지 검증한다.

**Parity 체크리스트:**

| 항목 |
|---|
| 발동 여부 |
| 조건 수 |
| required / preferred 구분 |
| matched / missing |
| conditionKey |
| topicKey |
| outputLayer |
| suppression metadata |
| 사용자 출력 변화 없음 |

### Phase 3. Read-path 전환

- parity 확보 후 해당 gate producer만 `requiredConditionResolutions`를 읽도록 바꾼다.
- score / explain / UI 문구는 바꾸지 않는다.
- **입력 경로만 바꾼다.**

### Phase 4. Legacy 의존 정리

- 전환 안정화 이후에만 local suppression, 중복 helper, legacy bridge를 정리한다.
- **read-path 전환과 legacy 삭제를 같은 PR에서 한 번에 하지 않는다.**

---

## 5. gate별 이행 순서와 이유

### 5-1. `REQUIRED_CERT` — 1순위 pilot

- 이미 `requiredGateSignals.certifications.required / matched / missing`을 직접 읽는다.
- 조건 자체가 명시적이고 decisive다.
- alias 보강과 중복 억제까지 어느 정도 진행돼 있다.
- gate logic이 `required ∩ missing` 중심이라 가장 단순하다.
- **migration 난이도: 가장 낮음**

**완료 기준:**
- 필수 자격증 누락 / 충족 / 우대-only / alias 케이스에서 기존 gate와 resolution 결과 100% 일치
- 기존 사용자 출력 변화 없음
- `conditionKey`가 gate profile ID가 아니라 **개별 자격 조건 단위**로 생성됨
- 기존 local suppression은 유지하되, resolution이 같은 suppress 의도를 표현할 수 있음

### 5-2. `REQUIRED_MAJOR` — 2순위

- 이미 `requiredGateSignals.major`를 읽지만 direct match 외에 similarity 휴리스틱이 섞여 있다.
- **migration 난이도: 중간**

**선행 조건:**
- exact major와 major_cluster 구분
- direct match와 similarity를 rule authority 관점에서 구분할 수 있어야 함

**완료 기준:**
- explicit required가 없으면 gate로 올라가지 않음
- direct match / similarity / missing candidate major 케이스가 기존과 일치
- `required:major:*`와 `required:major_cluster:*`가 섞이지 않음
- 기존 gate firing 결과와 parity 확보

### 5-3. `REQUIRED_EDUCATION` — 3순위

- 현재는 `requiredGateSignals`가 아니라 `structural.flags / metrics` 기반
- 현재 구조는 최종 boolean은 있으나 **조건 정체성이 부족**하다.
- **migration 난이도: 중간 이상**

**선행 조건 (개념):**
`requiredGateSignals.education`에 다음 구조가 필요:
- `explicitRequired`
- `requiredDegree`
- `candidateDegree`
- `matched`
- `missing`
또는 이에 준하는 구조

**완료 기준:**
- 단순 `educationGateFail: true`가 아니라 어떤 학력 조건이 미충족인지 구조적으로 설명 가능
- 기존 gate 결과와 parity
- 최소 학력 조건이 resolution에 살아 있음
- 죽은 설명 경로에 더 이상 의존하지 않음

### 5-4. 총연차 gate — 4순위

- 현재는 `state.careerSignals.requiredYears.min`과 `experienceGap`을 직접 읽는다.
- 총경력과 관련경력을 장기적으로 분리해야 하므로 성급히 옮기지 않는다.
- **migration 난이도: 중간 이상**

**선행 조건:**
- `required:years:total_experience:gte:<n>` 와 `required:years:related_experience:gte:<n>` 구분

**원칙:**
- 첫 migration에서는 **총연차만** 다룬다.
- 관련경력 연차는 AI 관련도 판독이 필요하므로 **별도 후속**이다.

**완료 기준:**
- 기존 총연차 gate와 resolution 결과 일치
- total vs related 분리
- grayZone / cap 관련 기존 정책을 깨지 않음
- 관련경력 고도화와 혼동되지 않음

---

## 6. 이번 migration에서 건드리지 않는 것

### 6-1. `GATE__CRITICAL_EXPERIENCE_GAP`

지금 옮기지 않는다. 이유:
- 여러 flag alias를 흡수한다.
- evidenceFit 설명과 연결돼 있다.
- 경험은 AI 해석과 ontology가 더 필요한 영역이다.
- `REQUIRED_EXPERIENCE`와 함께 재설계해야 한다.

### 6-2. `GATE__SALARY_MISMATCH`

required-condition resolver 범위 밖.

### 6-3. `GATE__AGE`

required-condition resolver 범위 밖.

---

## 7. 첫 실제 구현 범위

첫 구현은 작게 간다.

### 포함

1. `src/lib/decision/requiredConditions/` 디렉토리 신설
2. `resolveRequiredConditions.js` 기본 골격
3. `buildRequiredConditionKeys.js` 또는 최소 key helper
4. AI 없이 항상 돌아가는 baseline resolver
5. 자격증 조건만 rule-only resolution으로 생성
6. `requiredConditionResolutions`를 `buildDecisionPack()` 직전 생성
7. `evalRiskProfiles()` context에 append-only 전달
8. **기존 gate는 전혀 안 바꿈**
9. 디버그 / 테스트에서만 resolution 확인

### 제외

- 기존 `requiredCertMissingGate` read-path 변경
- 중앙 suppression 실제 적용
- language gate
- tool gate
- AI interpreter 연결
- UI 노출
- major / education / years migration

---

## 8. 단계별 완료 기준

### Phase 0. Resolver skeleton 도입

- AI 없이도 항상 `requiredConditionResolutions` 생성
- `decisionPack` 기존 출력 변화 없음
- build 성공
- cert 1종 shadow resolution 생성 가능
- no-op일 때도 안전

### Phase 1. `REQUIRED_CERT` shadow parity

- 대표 케이스에서 기존 cert gate와 resolution parity
- 필수/우대 분리 정상
- alias 케이스 정상
- conditionKey / topicKey 정상
- suppression metadata 생성 가능
- 사용자 출력 무변화

### Phase 2. `REQUIRED_CERT` read-path 전환

- cert gate가 resolution을 읽어도 기존 결과와 동일
- 기존 score / explain / UI 무변화
- 기존 local suppression은 아직 유지 가능
- rollback 쉬움

### Phase 3. `REQUIRED_MAJOR` shadow → cutover

- exact/direct match와 similarity case parity
- major vs major_cluster 분리
- gate 기준이 기존보다 넓어지지 않음

### Phase 4. `REQUIRED_EDUCATION` 사전 정규화 → shadow → cutover

- 단순 boolean이 아니라 구조화 학력 조건 확보
- 죽은 설명 경로 해소
- parity

### Phase 5. 총연차 gate 사전 정규화 → shadow → cutover

- total experience만 우선 이행
- related experience와 분리
- grayZone / cap 영향 없음
- parity

---

## 9. 절대 금지 사항

1. **big-bang migration 금지**
2. 기존 gate와 새 resolution을 같은 PR에서 동시에 대규모 교체 금지
3. parity 검증 없이 read-path 전환 금지
4. local suppression 삭제와 중앙 suppression 도입을 한 번에 묶지 않기
5. `CRITICAL_EXPERIENCE_GAP`를 "필수 경험 gate"라고 보고 먼저 옮기지 않기
6. 총연차와 관련경력 연차를 한 번에 섞지 않기
7. `SALARY`, `AGE`를 required-condition resolver에 끌어들이지 않기

---

## 10. PR #233에 대한 정책적 결론

PR #233은 최신 main 반영 후 재검증하면 **머지 가능한 성격**이다.

**이유:**
- gate 추가가 아니다.
- 언어 룰 신호 생산층 보강이다.
- future resolution-first 언어 gate의 **선행 기반**이다.
- 현재 확정한 정책과 충돌하지 않는다.
- qualitative 언어 매칭도 당장 gate로 쓰는 것이 아니다.

**단서:**
- 정성 언어는 이후 resolver에서 `decisive`가 아니라 **`supporting`으로 다뤄야** 한다.

**현재 상태:**
- PR #233은 현재 `mergeable: false`이므로, **최신 main 반영 / rebase 후 다시 검증**해야 한다.

---

## 11. 이번 문서에서 아직 확정하지 않는 후속 구현 과제

아래 사항은 이번 문서에서 결정하지 않는다.

- PR #233을 실제로 최신 main 반영하고 재검증하는 작업
- baseline resolver skeleton의 실제 코드 구현
- cert shadow resolution용 대표 케이스 QA 세트
- `requiredConditionResolutions`를 debug output에서 어떻게 노출할지
- `REQUIRED_CERT` read-path cutover 시점
- 중앙 suppression 실제 적용 시점

---

## 12. 현재 마스터 순서표상 위치

| 단계 | 상태 |
|---|---|
| 판정 철학 고정 | 완료 |
| 조건군별 책임 분해 / gate 승격 정책 | 완료 |
| AI와 규칙의 접점 설계 | 완료 |
| conditionKey / topicKey 정책 | 완료 |
| resolver 생성 위치 설계 | 완료 |
| 기존 gate 이행 전략 세부 설계 | 완료 |
| 다음 1: PR #233 최신 main 반영 / 재검증 / 머지 판단 | 미착수 |
| 다음 2: baseline resolver skeleton 실제 구현 | 미착수 |
| 다음 3: `REQUIRED_CERT` shadow resolution pilot | 미착수 |
| 아직 금지: `REQUIRED_LANGUAGE`, `REQUIRED_TOOL_OR_TECH`, `REQUIRED_EXPERIENCE` 구현으로 바로 진입 | — |
| 아직 금지: 기존 gate big-bang migration | — |
| 아직 금지: `CRITICAL_EXPERIENCE_GAP` 조기 migration | — |
| 아직 금지: `SALARY`, `AGE`를 required-condition resolver에 편입 | — |

---

## 13. REQUIRED_MAJOR 이행 상세 정책 (Phase 0 확정)

> Phase 0 상태: **정책 확정 완료**  
> Phase 1 상태: 미착수  
> 최종 수정일: 2026-05-12

이 섹션은 §5-2, §8의 Phase 3 요약을 실제 구현 전 선행 확정이 필요한 상세 정책으로 구체화한다.  
Phase 1 resolver 코드 착수 전에 이 정책이 먼저 확정되어야 한다.

---

### 13-1. 범위

REQUIRED_MAJOR 이행은 REQUIRED_CERT보다 복잡하다. 아래 케이스를 모두 지원해야 한다.

| 케이스 | 설명 |
|---|---|
| exact/direct major match | 후보자 전공군이 required cluster에 직접 일치 |
| adjacent major | 전공군이 관련은 있으나 exact가 아님 (similarity=0.6) |
| unrelated major | 전공군이 required cluster와 무관 (similarity≤0.15) |
| unknown major | 후보자 전공 또는 required cluster를 신뢰할 수 있게 추론하지 못함 |
| preferred 전공 | JD가 우대사항으로 언급. hard-gate 대상이 아님 |
| unspecified | JD에 전공 요건 언급 없음. hard-gate 대상이 아님 |

---

### 13-2. 제품 경계 (Product Boundary) — 확정

**우대(preferred) 수준의 표현은 절대 `GATE__REQUIRED_MAJOR_MISSING`을 발동시킬 수 없다.**

| JD 표현 예시 | explicitness 분류 | hard-gate 허용 |
|---|---|---|
| `우대` | preferred | ❌ 불가 |
| `전공 우대` | preferred | ❌ 불가 |
| `관련 전공 우대` | preferred | ❌ 불가 |
| `석사 우대` | preferred | ❌ 불가 |
| `박사 우대` | preferred | ❌ 불가 |
| `전공 필수` | required | ✅ 허용 (cluster+candidate 증거 신뢰 시) |
| `관련 전공 필수` | required | ✅ 허용 |
| `학위 필수` | required | ✅ 허용 |
| `석사 이상` | required | ✅ 허용 |
| `박사 이상` | required | ✅ 허용 |
| `required degree` | required | ✅ 허용 |

**중요 경계:**  
`parseMajorImportanceFromJD()`는 `박사 우대` 같은 표현에 높은 점수를 반환할 수 있으나,  
`isMajorExplicitRequiredInJD()`는 `우대` 계열을 `explicitRequired=false`로 처리한다.  
이 두 함수의 결과가 다를 때, hard-gate 판단은 반드시 `isMajorExplicitRequiredInJD()` 기준을 따른다.  
`parseMajorImportanceFromJD()` 점수는 soft interpretation 레이어에서만 사용한다.

---

### 13-3. conditionType 정의

```
conditionType: "major"
```

기존 cert resolver의 `"certification"`에 대응하는 신규 타입.  
`requiredConditionResolutions` 배열 내 항목을 cert와 major로 구분하는 식별자다.

---

### 13-4. authority vocabulary — 확정

아래 4값으로 고정한다. 추가하지 않는다.

| authority 값 | 의미 | gate 승격 가능 여부 |
|---|---|---|
| `direct_match` | 후보자 전공군이 required cluster에 직접 일치 | ❌ (조건 충족) |
| `adjacent` | 후보자 전공군이 related cluster (similarity=0.6) | ❌ (soft pass, Phase 4 bridge 설명 대상) |
| `unrelated` | 후보자 전공군이 required cluster와 무관 (similarity≤0.15) | ✅ (`required` + `unrelated` 조합 시만) |
| `cluster_unknown` | required cluster 또는 candidate cluster 신뢰 추론 불가 | ❌ (unknown → gate 차단) |

---

### 13-5. explicitness values — 확정

| explicitness 값 | 의미 | hard-gate 허용 여부 |
|---|---|---|
| `required` | JD가 명시적으로 전공 필수 요건 표현 | ✅ (`authority=unrelated`일 때만) |
| `preferred` | JD가 우대사항으로 언급 | ❌ 절대 불가 |
| `unspecified` | JD에 전공 요건 언급 없음 | ❌ 절대 불가 |

규칙:
- `explicitness="preferred"` → `outputLayer="none"` 고정, gate 발동 불가
- `explicitness="unspecified"` → `outputLayer="none"` 고정, gate 발동 불가
- `explicitness="required"` + `authority="unrelated"` + cluster/candidate 증거 신뢰 가능 → gate 발동 허용

---

### 13-6. Phase 1 shadow resolver status 매핑 — 확정

현재 resolver schema는 `"satisfied"`, `"unsatisfied"`, `"unknown"` 3값만 허용한다.  
`adjacent`는 별도 status를 갖지 않고 `authority` 필드로 구분한다.

| authority | explicitness | ruleAssessment.status | finalAssessment.outputLayer |
|---|---|---|---|
| `direct_match` | any | `"satisfied"` | `"none"` |
| `adjacent` | any | `"satisfied"` | `"none"` |
| `unrelated` | `"required"` | `"unsatisfied"` | `"gate"` |
| `unrelated` | `"preferred"` | `"satisfied"` | `"none"` |
| `unrelated` | `"unspecified"` | `"satisfied"` | `"none"` |
| `cluster_unknown` | any | `"unknown"` | `"none"` |

비고:
- `adjacent`는 `status="satisfied"`로 처리하되, Phase 4에서 soft explanation 레이어로 bridge 설명을 추가한다.
- `cluster_unknown`은 gate를 발동하지 않는다. Phase 4에서 "전공 정보 확인 불가" soft 안내 대상이다.
- `"pass"/"fail"` 값은 사용하지 않는다. 기존 schema와 충돌한다.

---

### 13-7. outputLayer / hard-gate 규칙 — 확정

`GATE__REQUIRED_MAJOR_MISSING`에 resolution이 gate authority를 갖기 위한 **모든 조건 (AND):**

```
conditionType === "major"
AND requirement.explicitness === "required"
AND ruleAssessment.authority === "unrelated"
AND finalAssessment.status === "unsatisfied"
AND suppression 없음
```

**다음 중 하나라도 해당되면 gate 발동 불가:**
- `explicitness === "preferred"`
- `explicitness === "unspecified"`
- `authority === "adjacent"`
- `authority === "cluster_unknown"`
- `authority === "direct_match"`
- `candidateMajor`가 null 또는 빈 문자열
- `requiredClusters`가 빈 배열

---

### 13-8. Phase 순서 — 확정

| Phase | 내용 | 상태 |
|---|---|---|
| Phase 0 | 정책/스키마 문서화. 코드 변경 없음 | **완료 (이 문서)** |
| Phase 1 | `resolveRequiredConditions()`에 major branch 추가. gate read-path 변경 없음 | 미착수 |
| Phase 2 | 12-case parity QA. 기존 gate 결과와 resolution 결과 12/12 일치 확인 | 미착수 |
| Phase 3 | gate read-path 전환: `requiredGateSignals.major` → `requiredConditionResolutions` | 미착수 |
| Phase 4 | explanation 레이어: adjacent soft bridge 출력, cluster_unknown soft 안내 추가 | 미착수 |
| Phase 5 | legacy cleanup: gate의 `requiredGateSignals.major` direct read-path 제거 | 미착수 |

**Phase 1 착수 전 선행 확정 완료 조건 (모두 충족 필요):**

| 조건 | 상태 |
|---|---|
| `박사 우대` → `preferred` → hard-gate 불가 (§13-2) | ✅ 확정 |
| authority vocabulary 4값 확정 (§13-4) | ✅ 확정 |
| `conditionType: "major"` 정의 (§13-3) | ✅ 확정 |
| status 매핑 테이블 확정 (§13-6) | ✅ 확정 |

모든 선행 조건이 충족되었다. Phase 1 착수 가능 상태다.

---

### 13-9. REQUIRED_MAJOR QA matrix (12 cases)

Phase 2 parity QA에서 아래 12 케이스를 모두 통과해야 한다.

| # | JD 전공 표현 | explicitness | required cluster | 후보자 cluster | authority | hard gate | status | mustRequirementGaps | 비고 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `전공 필수` | required | CS | CS | direct_match | ❌ | satisfied | ❌ | 완전 일치 |
| 2 | `전공 필수` | required | CS | EE | adjacent | ❌ | satisfied | ❌ | bridge 설명 대상 (Phase 4) |
| 3 | `전공 필수` | required | CS | BIZ | unrelated | ✅ | unsatisfied | ✅ | gate 발동 |
| 4 | `전공 필수` | required | CS | null (미입력) | cluster_unknown | ❌ | unknown | ❌ | 전공 미입력 → unknown |
| 5 | `관련 전공 필수` | required | [CS, EE] | CS | direct_match | ❌ | satisfied | ❌ | 복수 required cluster 중 하나 일치 |
| 6 | `관련 전공 필수` | required | [CS, EE] | ME | adjacent | ❌ | satisfied | ❌ | bridge 설명 대상 (Phase 4) |
| 7 | `전공 무관` | unspecified | [] | BIZ | cluster_unknown | ❌ | satisfied | ❌ | 요건 없음 → satisfied |
| 8 | `우대 전공` / `박사 우대` | preferred | CS | BIZ | unrelated | ❌ | satisfied | ❌ | preferred → gate 발동 불가 |
| 9 | 전공 언급 없음 (고의존 직무, QC 등) | unspecified | [] | BIZ | cluster_unknown | ❌ | satisfied | ❌ | infer 없음 → gate 없음 |
| 10 | 전공 언급 없음 (중저의존 직무) | unspecified | [] | CS | cluster_unknown | ❌ | satisfied | ❌ | 동일 |
| 11 | `관련 전공자` (JD 모호) | unspecified | 추론 실패 시 [] | any | cluster_unknown | ❌ | unknown | ❌ | 추론 실패 → cluster_unknown → gate 차단 |
| 12 | `전공 필수`, 후보자 비전공 + 관련 교육/자격증 | required | CS | BIZ | unrelated | ✅ | unsatisfied | ✅ | gate 발동. Phase 4에서 suppression 검토 |

비고:
- Case 8: `GATE__REQUIRED_MAJOR_MISSING.when()`의 기존 `explicitRequired=false` guard도 차단하므로 parity 결과가 일치해야 한다.
- Case 11: JD 모호성으로 cluster 추론 실패 시 `cluster_unknown` → `unknown` → gate 차단이 안전한 방향이다.
- Case 12: 전공 불일치 + 관련 교육 이수는 Phase 1에서 gate 발동. suppression은 Phase 4에서 별도 설계한다.

---

**이 섹션으로 REQUIRED_MAJOR Phase 0 정책 확정 완료.**  
Phase 1 착수 시 이 문서 §13을 SSOT로 참조한다.
