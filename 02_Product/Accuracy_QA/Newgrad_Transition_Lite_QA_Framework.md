# PASSMAP Newgrad Transition Lite QA Framework

## 문서 목적
- newgrad transition-lite의 해석 품질을 pure newgrad / bridge-newgrad 기준으로 검증한다.
- experienced current/target transition QA와 acceptance target이 섞이지 않도록 newgrad 전용 QA 기준을 잠근다.

## 적용 범위
- pure newgrad
- bridge-newgrad
- `buildNewgradTransitionLiteResult.js`
- `buildNewgradAxisPack.js`

## 비적용 범위
- experienced current/target transition scoring
- `buildTransitionLiteResult.js`
- `buildAxisConnectivityPack.js`

## 5축 정의
### 1. 직무 적합 연결성
- target job과 직접 닿는 프로젝트, 인턴, 수업, 전공 근거가 얼마나 이어지는지 본다.

### 2. 도메인 관심 연결성
- target industry에 대한 관심과 탐색이 반복 evidence로 보이는지 본다.

### 3. 수행 경험 연결성
- 직접 만든 산출물, 맡은 역할, 반복 수행 경험이 있는지 본다.

### 4. 타겟 커뮤니케이션 연결성
- target role과 유사한 이해관계자, 협업 상대, 커뮤니케이션 맥락을 다뤄본 적이 있는지 본다.

### 5. 강점 DNA 연결성
- strengths, workStyleNotes, 행동 사례가 target role의 soft-skill 기대와 얼마나 맞는지 본다.

## Shared QA Principles
- band-first
  - exact numeric score보다 band와 축별 해석 방향을 먼저 본다.
- reasoning-first
  - expected / actual 모두 이유를 먼저 기록한다.
- disagreement taxonomy
  - `match`
  - `soft_mismatch`
  - `hard_mismatch`
  - `needs_review`

## 축별 calibration 위험
### 직무 적합 연결성
- overestimate risk
  - 전공명, 프로젝트 제목, 모집공고 키워드만 보고 실제 relevance를 과대평가하기 쉽다.
- underestimate risk
  - 전공은 다르지만 target job과 직접 닿는 프로젝트/인턴 산출물을 놓치기 쉽다.

### 도메인 관심 연결성
- overestimate risk
  - 관심 진술 한두 줄만으로 domain fit을 높게 주기 쉽다.
- underestimate risk
  - 수업, 프로젝트, 읽은 자료, 활동 기록 속 domain clue를 놓치기 쉽다.

### 수행 경험 연결성
- overestimate risk
  - 참여 사실만으로 execution depth를 높게 주기 쉽다.
- underestimate risk
  - 짧은 인턴/계약 경험 속 산출물과 ownership을 과소평가하기 쉽다.

### 타겟 커뮤니케이션 연결성
- overestimate risk
  - 일반 팀플 경험을 target stakeholder fit으로 과대해석하기 쉽다.
- underestimate risk
  - CS, 운영, 리더 역할처럼 비정형 stakeholder 경험을 놓치기 쉽다.

### 강점 DNA 연결성
- overestimate risk
  - 추상 키워드형 strengths를 그대로 믿고 높게 주기 쉽다.
- underestimate risk
  - 프로젝트/인턴 사례 속 soft-skill evidence를 놓치기 쉽다.

## pure newgrad / bridge-newgrad 읽기 기준 차이
- pure newgrad
  - 프로젝트, 수업, 전공, 관심 근거 중심으로 읽는다.
  - 기간보다 target relevance와 직접 수행 흔적을 먼저 본다.
- bridge-newgrad
  - pure newgrad 기준 위에 short-form real work evidence를 추가로 본다.
  - 계약직, 단기 실무, 인턴이 target job 또는 target stakeholder와 직접 닿을 때만 일부 축 상향 근거가 된다.

## bridgeCandidate rule
- `bridgeCandidate`는 subtype signal only다.
- auto boost 금지
- 아래 조건이 동시에 있을 때만 일부 축 상향 근거로 사용한다.
  - `bridgeCandidate === true`
  - `internships`, `contractExperiences`, `partTimeExperience` 중 하나 이상 존재
  - 그 evidence가 target job 또는 target stakeholder와 직접 닿는다
- pure newgrad와 experienced 사이의 제3 모드로 승격하지 않는다.

## 운영 기준
- newgrad gold set은 experienced gold set과 분리한다.
- starter set은 8~12건으로 시작한다.
- 한 케이스는 1~2개 핵심 축 갈림만 드러내게 설계한다.
- full cross-product 설계는 금지한다.

## 2026-04-05 Newgrad 5Axis QA Skeleton Lock

### 문서 구조 잠금
- option 1
  - `05_Execution/Accuracy_QA_Log.md` 한 문서에 test case / execution / drift를 모두 누적하는 방식
  - 장점: 파일 수는 적다.
  - 단점: 축별 누적 관리가 어렵고, score drift / narrative drift 분리 기록이 빠르게 섞인다.
- option 2
  - newgrad 전용 문서를 분리하고 역할을 나누는 방식
  - 장점: 반복 운영, 축별 누적, drift 분리, handoff 가독성이 모두 낫다.
  - 기존 `Newgrad_Transition_Lite_QA_Framework.md`, `Newgrad_Transition_Lite_Gold_Set.md`, `Newgrad_Calibration_Log.md` 체계와도 충돌하지 않는다.
- 최종 추천안: option 2

### 4개 기록 단위 운영 기준
1. 테스트 케이스 정의
  - owner: `02_Product/Accuracy_QA/Newgrad_Transition_Lite_Gold_Set.md`
  - 역할: 케이스 정의, expected band, expected reasoning, confuser 메모
2. 실제 실행 로그
  - owner: `05_Execution/Accuracy_QA_Log.md`
  - 역할: round 단위 실행 결과, 집계, 다음 액션
3. calibration 메모
  - owner: `05_Execution/Newgrad_Calibration_Log.md`
  - 역할: 반복 mismatch, suspected owner, 보정 판단
4. score drift vs narrative drift 분리 기록
  - owner: `05_Execution/Newgrad_Calibration_Log.md`
  - 역할: 동일 calibration entry 안에서 `driftType`으로 분리 기록

### skeleton 최소 구조
- framework
  - 운영 원칙
  - 문서 owner map
  - band-first / reasoning-first 원칙
  - drift 분리 기준
- gold set
  - case id 규칙
  - 공통 케이스 템플릿
  - Axis 1 priority starter cases
  - Axis 3 priority starter cases
  - Axis 2 retest starter queue
- calibration log
  - 공통 drift log template
  - score drift / narrative drift / both 분리 기준
  - append-only findings

### Axis 1 operational definition
- `jobStructure`는 신입의 전공, 프로젝트 role, 인턴 roleFamily가 목표 직무의 핵심 과업과 얼마나 직접 닿는지 보는 축이다.
- high는 repeated direct role evidence가 있을 때다.
- mid는 major-only 또는 adjacent role + major 조합일 때다.
- low는 adjacent-only 또는 weak evidence group 수준이다.
- very_low는 target job relevance evidence가 사실상 없을 때다.

### Axis 3 operational definition
- `responsibilityScope`는 신입이 단순 참여를 넘어서 실제 산출물, 반복 수행, 일정 수준의 ownership을 가졌는지 보는 축이다.
- high는 프로젝트/인턴 반복과 다중 evidence group이 있고 outcome/duration lift가 받쳐줄 때다.
- mid는 최소 한두 개 evidence item으로 수행 흔적은 보이지만 ownership 강도가 제한적일 때다.
- low는 참여 group은 있으나 item 수나 outcome/duration이 약할 때다.
- very_low는 실질 실행 evidence가 거의 없을 때다.

### expected 판정 형식
- starter gold set의 `expectedBand`는 숫자 exact score보다 `high / mid / low` 3단계 band를 우선 사용한다.
- 이유:
  - Axis 1/3는 heuristic 조합이라 1점 단위 exact expectation을 너무 빨리 고정하면 calibration noise가 커진다.
  - 사람이 수동 판정할 때는 `band + reasoning`이 더 안정적이다.
  - 실제 engine 5-band는 실행 후 `reviewerNote` 또는 calibration log에서 세분화해도 늦지 않다.
## 2026-04-05 Newgrad Certification Signal Audit + Coverage QA Structure

### certification signal owner map
- input owner
  - file: `src/components/input/NewgradTransitionLiteInput.jsx`
  - role: 자격증 category / subcategory / label 3단 select를 직접 소유한다.
  - note: 현재 UI 옵션은 hardcoded table이며 cert ontology JSON을 읽지 않는다.
- normalization owner
  - file: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
  - role: `normalizeEvidenceArray(payload?.certifications)`로 non-empty object 배열만 통과시킨다.
  - note: canonical alias 변환은 하지 않고 raw shape를 유지한다.
- scoring owner
  - file: `src/lib/analysis/buildNewgradAxisPack.js`
  - role: `scoreDomainInterest()` 내부 `_scoreIndustryCertificationRelevance()`가 `certificationsRaw`를 읽는다.
  - note: 현재 newgrad 5축에서 certification direct read는 사실상 Axis 2 전용이다.
- display owner
  - file: `src/components/report/TransitionLiteResult.jsx`
  - role: certification 자체를 별도 설명 자산으로 재해석하지 않는다.
  - note: 표시 단계는 axis 결과만 소비한다.

### differentiation audit lock
- current_state:
  - `industry_specific_cert_signal`
  - `weak_cert_signal_only`
  - `coverage_exists_but_scoring_weak`
  - `coverage_gap_dominant`
- why:
  - scoring은 target job별 cert relevance를 읽지 않고, target industry별 category/keyword heuristic만 읽는다.
  - cert alias/canonical normalization은 newgrad path에 연결되어 있지 않다.
  - cert-only는 Axis 2에서 conservative cap으로 low 위주다.
  - richer coverage asset이 있어도 current UI/scoring path가 그 자산을 활용하지 않는다.

### coverage review unit
1. UI option coverage
  - source: `NewgradTransitionLiteInput.jsx`
  - question: 사용자가 실제로 선택 가능한 cert가 무엇인가
2. canonical asset coverage
  - source: `src/lib/ontology/certs/cert_catalog.v0.json`
  - question: 내부 자산에 어떤 cert가 등록돼 있는가
3. role-specific recommendation coverage
  - source: `src/lib/ontology/certs/role_cert_matrix.v0.json`
  - question: 어떤 role family가 어떤 cert를 중요하게 보나
4. scoring usage coverage
  - source: `buildNewgradAxisPack.js`
  - question: 위 자산이 실제 점수 계산에 연결되는가

### gap type 기준
- `ui_option_gap`
  - ontology / matrix에는 있으나 newgrad UI에서 직접 선택할 수 없는 경우
- `canonical_mapping_gap`
  - UI label은 있으나 canonical cert id로 안전하게 연결되는 경로가 없는 경우
- `scoring_usage_gap`
  - asset은 있으나 newgrad scoring이 그 asset을 읽지 않는 경우
- `job_specific_weight_gap`
  - role-specific cert priority asset은 있으나 newgrad scoring이 job별 가중을 쓰지 않는 경우
- `documentation_gap`
  - coverage / owner / QA 기준이 문서화되지 않은 경우
## 2026-04-05 Newgrad Axis 1 Reviewer Guideline Lock

### Axis 1 contract summary
- `jobStructure`는 신입의 전공 적합성 자체보다, 목표 직무의 핵심 과업과 직접 닿는 역할 신호가 있는지를 먼저 보는 축이다.
- current contract상 `project.role`과 `internship.roleFamily`의 direct match가 가장 강한 신호다.
- direct role signal은 개수 누적보다도 존재 여부 자체가 강하게 반영된다.
- adjacent role signal은 반복되어도 direct role 부재를 대체하지 못한다.
- major support는 role 신호를 보조하는 수준이며, direct role 수준 점프를 만들지는 않는다.
- generic activity는 구조적 역할 일치 근거가 아니므로 low cap 쪽으로 읽는다.

### expectation correction
- `single direct role only`를 mid로 보던 기대는 과보수적이었다.
  - current contract는 `directCount >= 1 => 4`이므로 single direct role 1건을 이미 high-side로 읽는다.
- `repeated adjacent only`를 mid까지 기대하던 해석은 current contract와 어긋났다.
  - adjacent repetition은 `bestRoleLevel`만 만들고 `directCount`를 만들지 못하므로 low 유지가 더 자연스럽다.
- `major-only`는 low보다 mid가 current contract에 맞다.
  - major support는 직무 연결 단서의 보정 신호로 읽혀 `majorRelevant => 3` 경로를 탄다.

### reviewer must-lock rules
- 직접 역할 일치 신호 1건은 현재 Axis 1 contract상 예상보다 강하게 반영되므로, reviewer는 이를 mid가 아니라 high-side 후보로 먼저 본다.
- adjacent signal이 여러 건 반복되어도 direct role이 없으면 current Axis 1 contract상 low 유지 가능성이 높다고 본다.
- major-only 케이스는 low로 과소평가하지 말고, direct role 없는 mid 후보로 먼저 읽는다.
- generic activity only는 구조적 역할 일치 증거가 아니므로 low cap 케이스로 본다.

### forbidden misreads
- adjacent signal 반복을 direct role과 동급으로 해석하지 않는다.
- 전공 일치만으로 direct role 수준 점프를 기대하지 않는다.
- generic activity를 구조적 역할 일치 증거처럼 해석하지 않는다.
- Axis 3의 경험 깊이나 Axis 2의 산업 적합을 Axis 1 direct role 증거로 끌어오지 않는다.

### Axis 1 review checklist
- direct role signal이 있는가
- adjacent role signal만 반복되는가
- major support만 있는가
- generic activity만 있는가
- reviewer expected가 current contract보다 보수적인가

### usage
- Axis 1 케이스 리뷰 시에는 먼저 위 5개 체크리스트를 채운 뒤 expected band를 적는다.
- `single direct role only`, `repeated adjacent only`, `major-only`, `generic activity only`는 해석 흔들림이 잦으므로 reviewer note에 근거 문장을 같이 남긴다.
- guideline round에서는 bug wording 대신 current contract 기준 판독이라는 표현을 사용한다.
## 2026-04-05 Newgrad Certification Asset Expansion Priority Lock

### current cert asset state recap
- UI option layer
  - owner: `src/components/input/NewgradTransitionLiteInput.jsx`
  - current state: hardcoded cert category / subcategory / label table
  - practical issue: 직무군별 커버 편차가 크고, cloud / security / procurement_scm / HR 쪽은 canonical asset 대비 UI 노출이 빈약하다.
- canonical asset layer
  - `cert_catalog.v0.json`: cert canonical id, alias, domain tag, level 보관
  - `cert_rules.v0.json`: JD signal mapping, substitution, evidence 정책 보관
  - `role_cert_matrix.v0.json`: role family별 preferred / optionalPlus priority 보관
  - practical reading: 확장 자산은 이미 꽤 있고, current newgrad path가 이를 직접 쓰지 않는 것이 더 큰 문제다.
- scoring linkage layer
  - current newgrad scoring은 cert asset 파일을 직접 읽지 않는다.
  - current direct scoring read는 사실상 Axis 2 heuristic뿐이다.
  - 따라서 지금 확장은 scoring 변경보다 `UI option -> canonical mapping` 연결 준비를 먼저 하는 편이 안전하다.

### priority framework
- `coverage gap severity`
- `직무에서 자격증의 실질 중요도`
- `사용자 체감도`
- `현재 UI 부재가 오판을 만들 가능성`
- `향후 weighting 연결 준비도`
- `catalog / rules / matrix 재사용 가능성`

### job family priority lock
- `cloud`
  - tier: `tier_1_immediate`
  - why: gap severity high, 사용자 체감 높음, canonical asset과 role matrix 재사용성이 높다.
  - candidates:
    - `AWS SAA` `confirmed_in_asset`
    - `AZ-104` `confirmed_in_asset`
    - `GCP ACE` `confirmed_in_asset`
    - `CKA` `confirmed_in_asset`
    - `AWS SOA` `confirmed_in_asset`
- `security`
  - tier: `tier_1_immediate`
  - why: gap severity high, JD/채용 체감이 높고 asset coverage가 이미 존재한다.
  - candidates:
    - `ISMS-P` `confirmed_in_asset`
    - `CPPG` `confirmed_in_asset`
    - `CISSP` `confirmed_in_asset`
    - `CEH` `confirmed_in_asset`
    - `AWS Security Specialty` `confirmed_in_asset`
- `procurement_scm`
  - tier: `tier_1_immediate`
  - why: UI option gap가 크고 current asset은 있는데 사용자 입력 경로가 약하다.
  - candidates:
    - `ERP정보관리사` `confirmed_in_asset`
    - `CPSM` `confirmed_in_asset`
    - `CPIM` `confirmed_in_asset`
    - `CSMP` `confirmed_in_asset`
    - `무역영어` `not_found_in_asset`
    - `국제무역사` `not_found_in_asset`
- `HR`
  - tier: `tier_1_immediate`
  - why: UI option gap와 job-specific 체감이 모두 높고 matrix 재사용이 가능하다.
  - candidates:
    - `PHR` `confirmed_in_asset`
    - `SHRM-CP` `confirmed_in_asset`
    - `노무사` `not_found_in_asset`
    - `국내 HR 실무 자격` `mapping_uncertain`
- `finance`
  - tier: `tier_2_next`
  - why: medium gap이지만 asset coverage는 비교적 있다. UI와 mapping 정리가 우선이다.
  - candidates:
    - `CAT(전산회계)` `confirmed_in_asset`
    - `FAT` `confirmed_in_asset`
    - `TAT` `confirmed_in_asset`
    - `KICPA` `confirmed_in_asset`
    - `AICPA` `confirmed_in_asset`
    - `AFPK` `mapping_uncertain`
- `data`
  - tier: `tier_2_next`
  - why: UI coverage 일부 존재, asset도 좋아서 immediate보다 next wave가 맞다.
  - candidates:
    - `ADsP` `confirmed_in_asset`
    - `ADP` `confirmed_in_asset`
    - `SQLD` `confirmed_in_asset`
    - `SQLP` `confirmed_in_asset`
    - `GCP PDE` `confirmed_in_asset`
- `marketing`
  - tier: `tier_3_later`
  - why: gap은 medium이지만 자격증 실질 중요도와 scoring 영향도가 상대적으로 낮다.
  - candidates:
    - `GA4` `confirmed_in_asset`
    - `Meta Ads` `confirmed_in_asset`
    - `Google Ads` `mapping_uncertain`

### expansion strategy split
- stage 1
  - purpose: UI option coverage 확장
  - expected effect: 사용자가 실제 cert를 입력할 수 있게 되어 입력 품질과 QA 재현성이 오른다.
  - risk: UI에만 추가되고 canonical id 연결이 없으면 추후 정리 비용이 생긴다.
  - prerequisite: family별 tier와 candidate shortlist 고정
- stage 2
  - purpose: UI label과 canonical asset alias 연결
  - expected effect: 입력과 asset inventory가 같은 SSOT를 보기 시작한다.
  - risk: alias 설계가 성급하면 중복/충돌이 생길 수 있다.
  - prerequisite: stage 1 shortlist와 catalog/rules/matrix crosswalk 정리
- stage 3
  - purpose: job-specific weighting / relevance 연결
  - expected effect: role_cert_matrix 재사용이 가능해진다.
  - risk: coverage gap와 weighting gap를 섞어 premature scoring change로 갈 수 있다.
  - prerequisite: UI option, canonical mapping, payload 저장 형태 먼저 안정화

### recommended execution order
1. 먼저 할 것
   - cloud + security + procurement_scm + HR UI option shortlist 잠금
   - catalog / matrix에 이미 있는 cert를 우선 노출 후보로 정리
2. 그 다음 할 것
   - UI label -> canonical cert id mapping 표를 만든다.
   - finance + data를 next wave로 붙인다.
3. 나중에 할 것
   - marketing과 job-specific weighting 연결 검토
   - scoring relevance table 도입 여부 검토

### roadmap prep
- recommended start families:
  - `cloud`
  - `security`
- why:
  - high gap + high user impact + canonical asset 재사용성이 가장 좋다.
- implementation posture:
  - 먼저 UI option coverage 확장을 우선
  - 그 다음 canonical mapping까지 같이
  - weighting은 아직 보류
- why weighting later:
  - current newgrad path는 cert asset linkage 자체가 먼저라서, weighting을 먼저 열면 coverage 문제와 scoring 문제를 섞게 된다.
## 2026-04-05 Newgrad Job-Specific Cert Weighting Contract Design

### asset reusability audit
- `cert_catalog.v0.json`
  - classification: `usable_but_partial`
  - reusable fields:
    - `id`
    - `canonicalName`
    - `aliases`
    - `domainTags`
    - `level`
  - meaning:
    - canonical key와 alias bridge는 충분하다.
    - 다만 current newgrad UI label과 바로 이어지는 mapping bridge는 별도로 필요하다.
- `cert_rules.v0.json`
  - classification: `usable_but_partial`
  - reusable fields:
    - `jdSignalMapping.signals[].certId`
    - `policy.default`
    - `policy.substitution.rules`
  - meaning:
    - alias / signal detection / substitute evidence 설계에는 유용하다.
    - 하지만 role/job family weighting contract 본문으로 쓰기에는 직접 tier 구조가 얕다.
- `role_cert_matrix.v0.json`
  - classification: `ready_for_weighting_contract`
  - reusable fields:
    - `roleFamilyId`
    - `defaults.preferred`
    - `defaults.optionalPlus`
    - `bySeniority`
    - `priority`
    - `note`
  - meaning:
    - role family별 cert relevance 표현 구조가 이미 있다.
    - must-have 명시는 없지만 `preferred / optionalPlus + priority`를 conservative tier로 변환하기 좋다.
- overall reading
  - current state: `needs_mapping_bridge`
  - weighting contract 설계는 가능하지만, UI label -> canonical cert id bridge가 먼저 필요하다.

### weighting principle lock
- cert는 direct role / internship / project보다 약한 보조 신호여야 한다.
- related cert는 unrelated cert보다 분명히 유리해야 한다.
- cert only는 high를 만들면 안 된다.
- related cert lift는 major / project / internship 같은 실증 신호와 결합될 때 더 강해지도록 설계한다.
- role/job family별 relevance tier는 두되, tier가 전체 score를 뒤집는 강한 단독 신호가 되지 않게 한다.

### cap / stacking principles
- cert only upper cap
  - 기본: `low`
  - 예외적으로 role matrix상 `strong_support`라도 cert only는 `mid`를 넘기지 않는다.
- related cert + weak evidence
  - `mid`까지는 허용 가능
  - 단, weak project / support context만 있는 상태에서 `mid_high` 이상은 금지
- unrelated cert 처리
  - 기본은 `irrelevant` 또는 near-zero
  - generic positive로 넓게 주지 않는다.
- multiple cert stacking
  - 허용하되 same-family stacking cap을 둔다.
  - 권장: family 내부 합산은 최대 `+1 step`, cross-family도 총 `+1 step` cap

### proposed contract schema
```json
{
  "roleFamilyId": "role:cloud",
  "certCanonicalKey": "cert:aws_saa",
  "relevanceTier": "strong_support",
  "weight": 0.7,
  "certOnlyCap": "low",
  "withWeakEvidenceCap": "mid",
  "withDirectEvidenceCap": "mid_high",
  "guardCondition": {
    "requiresAnyOf": ["related_major", "related_project", "related_internship", "typed_context"],
    "sameFamilyStackingCap": 1,
    "unrelatedCertScoreFloor": 0
  },
  "notes": "cloud junior starter cert"
}
```

### relevance tiers
- `must_have`
  - current newgrad path에서는 바로 적용하지 않는다.
  - future gating 후보로만 남긴다.
- `strong_support`
  - role family와 강하게 연결되지만 cert only로 high를 만들 수는 없다.
- `support`
  - related cert로 의미는 있으나 weak evidence와 결합해도 mid 정도까지만 허용
- `weak_support`
  - plus signal은 되지만 band를 바꾸는 주력 신호는 아님
- `irrelevant`
  - 해당 role family에서는 거의 가산하지 않음

### guard definition
- `cert_only_cap`
  - cert만 있을 때는 `low`, 최대 `mid`
- `unrelated_cert_zero_or_near_zero`
  - role family와 무관한 cert는 `irrelevant`
- `same_family_stacking_cap`
  - 같은 family cert 여러 개를 쌓아도 최대 `+1` step
- `direct_evidence_bonus_vs_cert_only_limit`
  - direct project / internship / typed context가 있을 때만 stronger cap 허용

### tier 1 sample contracts
- cloud
  - role family: `role:cloud`
  - candidates:
    - `AWS SAA` `confirmed_in_asset` -> `strong_support`
    - `AZ-104` `confirmed_in_asset` -> `support`
    - `GCP ACE` `confirmed_in_asset` -> `support`
    - `CKA` `confirmed_in_asset` -> `strong_support`
    - `AWS SOA` `confirmed_in_asset` -> `support`
  - interpretation:
    - cert only: `low` cap
    - project 결합: `mid` 허용
    - internship / typed infra context 결합: `mid_high` 후보까지 허용
  - why:
    - matrix priority와 cloud domain tag가 이미 있어 contract화가 쉽다.
- security
  - role family: `role:security`
  - candidates:
    - `ISMS-P` `confirmed_in_asset` -> `strong_support`
    - `CPPG` `confirmed_in_asset` -> `support`
    - `CISSP` `confirmed_in_asset` -> `support`
    - `CEH` `confirmed_in_asset` -> `weak_support`
    - `AWS Security Specialty` `confirmed_in_asset` -> `support`
  - interpretation:
    - cert only: `low` cap
    - privacy/security project 결합: `mid`
    - direct security/privacy internship 결합: `mid_high` 후보
  - why:
    - 국내 보안/개인정보 직무는 JD signal과 matrix note가 이미 있어 role linkage 설명이 가능하다.

### scoring integration strategy
- natural integration point
  - 1: normalization 이후 canonical cert key bridge helper
  - 2: Axis 2 scorer 내부 또는 별도 cert relevance helper
  - 3: role matrix lookup bridge
- why
  - current Axis 2는 이미 cert read owner라 붙는 위치가 자연스럽다.
  - 단, UI raw label을 바로 scorer에 넣으면 다시 shape conflict를 만들 수 있어 bridge helper가 먼저다.
- safest minimal strategy
  - `normalize cert -> canonical cert ids`
  - `lookup role family -> cert relevance tier`
  - `Axis 2 helper에서 conservative lift only`
- ordering
  - first: Axis 2 `major` normalization / payload contract 정리
  - second: cert canonical mapping bridge
  - third: cloud/security 한정 weighting phase 1

### risk review
- cert only 과상향
  - severity: `high`
  - mitigation: `cert_only_cap = low`, 예외적 `mid` ceiling
- 직무 무관 cert 잘못 가산
  - severity: `high`
  - mitigation: `irrelevant` tier + zero/near-zero rule
- multiple cert stacking 폭주
  - severity: `medium`
  - mitigation: same-family / total stacking cap
- coverage gap 상태에서 weighting 먼저 오픈
  - severity: `high`
  - mitigation: UI option / mapping 선행
- Axis 2 normalization contract fix 전후 결과 흔들림
  - severity: `high`
  - mitigation: `major` normalization contract 정리 후 phase 1 apply

## 2026-04-05 Newgrad Cert Mapping Bridge / Phase1 Apply Readiness Audit

### classification
- `SAFE INVESTIGATION`
- `NEWGRAD CERT MAPPING BRIDGE + PHASE1 APPLY READINESS JUDGMENT`
- source code patch / UI patch / scoring apply 없음

### investigation scope
- current newgrad UI cert option이 canonical cert asset과 실제로 연결 가능한지 확인했다.
- current target job key가 `role_cert_matrix.v0.json`의 role key와 직접 연결 가능한지 확인했다.
- cloud / security를 기준으로 phase 1 apply readiness를 판정했다.

### linkage summary
- UI cert option owner는 `src/components/input/NewgradTransitionLiteInput.jsx` 내부 하드코딩 상수다.
- UI cert payload shape는 `{ category, subcategory, label }` 기반이며 canonical cert key가 없다.
- cert catalog asset은 `cert_catalog.v0.json`의 `certs[]` 구조로 usable하지만, UI generic label과는 bridge가 필요하다.
- role cert matrix는 `role:*` family key를 사용하고, current newgrad target job은 `JOB_*` key를 사용하므로 direct linkage는 아니다.

### readiness judgment
- UI readiness: `ui_labels_need_bridge`
- catalog readiness: cloud/security 기준 `mostly_ready_with_small_bridge`
- role linkage readiness: `needs_role_bridge_adapter`
- overall phase 1 judgment: `design_locked_waiting_for_linkage`

### QA implication
- 이번 라운드의 blocker는 weighting principle이 아니라 linkage closure다.
- 다음 라운드에서 apply를 하려면 Axis 2 normalization contract를 먼저 잠그고, 그 다음 cert mapping helper와 role bridge adapter를 붙여야 한다.

## 2026-04-05 Bridge Contract Closure / Cloud-Security Phase1

### contract closure
- 이번 라운드는 weighting apply가 아니라 bridge contract closure다.
- phase 1 scope는 `cloud`, `security`로 제한한다.
- cert bridge는 UI raw cert `{ category, subcategory, label }`만 입력으로 받고 canonical cert id 해석 결과를 producer-owned field로 반환해야 한다.
- role adapter는 canonical `targetJobId`만 입력으로 받고 explicit `role:*` family key만 반환해야 한다.

### locked output contract
- cert mapping helper output minimum shape
  - `rawLabel`
  - `rawCategory`
  - `rawSubcategory`
  - `mappingStatus`
  - `canonicalCertIds`
  - `mappingConfidence`
  - `notes`
- role adapter output minimum shape
  - `targetJobId`
  - `roleFamilyId`
  - `adapterStatus`
  - `source`
  - `notes`

### locked phase1 gate
- unresolved cert label은 scorer에 반영하지 않는다.
- canonical 후보가 2개 이상이면 phase1에서는 `unresolved`로 남긴다.
- `JOB_* -> role:*`는 explicit bridge만 허용하고 string contains 추론은 금지한다.
- 위 조건과 normalization contract fix가 닫히기 전에는 weighting apply를 금지한다.
