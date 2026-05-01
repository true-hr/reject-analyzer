# Decision Log

## 2026-04-19 SAFE PATCH — FINANCE_ACCOUNTING dependencyTier 재분류

### 왜 일부 exact job ID만 다뤘는가
- FINANCE_ACCOUNTING 8개 직무 중 high 승격 기준("전공 의존도가 현실적으로 높고, direct major가 강한 신호, weak/mismatch 엄격 반영 납득 가능")을 충족하는 것은 ACCOUNTING, TAX 2개뿐이었다.
- FINANCE, TREASURY는 전공보다 실무 경험 비중이 높은 운영성/기획성 직무다.
- MANAGEMENT_ACCOUNTING, FP_AND_A, IR_DISCLOSURE, INTERNAL_CONTROL은 다양한 전공이 진입 가능한 복합 역할 직무다.

### 왜 전체 FINANCE_ACCOUNTING을 한 번에 올리지 않았는가
- "넓은 기획성 재무나 운영성 직무까지 무리하게 high로 올리지 말 것" — 지시서 제약
- FP&A, FINANCE, TREASURY를 high로 올리면 경제/경영/통계 전공자도 불필요하게 strong_bonus를 받거나, 비전공자에게 -1 패널티가 과하게 부과될 수 있다.

### 왜 buildNewgradAxisPack 로직은 안 건드렸는가
- dependencyTier 영향 로직(_applyJobMajorDependencyToJobFit)은 이미 정상 동작 중
- registry entry만 추가하면 기존 로직이 자동으로 반영되는 구조

## 2026-04-19 SAFE PATCH — RESEARCH_PROFESSIONAL_POLICY_RESEARCH high 승격 + 구조 문제 분리

### 왜 POLICY_RESEARCH만 단독 검토했는가
- RESEARCH_PROFESSIONAL base matrix에서 PUBLIC_POLICY만 base=3(direct). 다른 직무를 HIGH로 올리면 PUBLIC_POLICY에 보너스가 가는 왜곡이 생기지만, POLICY_RESEARCH는 PUBLIC_POLICY+1이 의미 그대로 작동하는 유일한 직무다.

### 왜 나머지 7개는 dependencyTier로 해결 불가라고 판단했는가
- TECHNICAL_RESEARCH: 이공계 전공 RESEARCH_PROFESSIONAL base=2(adjacent). HIGH 승격 시 이공계는 no change, PUBLIC_POLICY만 +1 → 의도 역전. 화학/생물/물리 등 별도 MAJOR category 없음이 근본 원인.
- LEGAL/REGULATORY_AFFAIRS/PATENT_IP: 법학(LAW), 약학(PHARMACY) MAJOR category 자체가 없어 해당 전공→직무 직결 경로 부재. tier 수정으로 해결 불가.
- MARKET_INDUSTRY_RESEARCH/EXPERT_REVIEW_EVALUATION/CONSULTING: 전공 풀 넓고 경험 중심 직무. HIGH 부적절.

### RESEARCH_PROFESSIONAL 구조 문제 분류 결론
- **분류 A (tier 해결 가능)**: POLICY_RESEARCH ← 이번 라운드 패치 완료
- **분류 B (major category 부재)**: TECHNICAL_RESEARCH, LEGAL, REGULATORY_AFFAIRS, PATENT_INTELLECTUAL_PROPERTY
- **분류 C (경험 중심, HIGH 부적절)**: MARKET_INDUSTRY_RESEARCH, EXPERT_REVIEW_EVALUATION, CONSULTING

## 2026-04-19 SAFE PATCH — MANUFACTURING_QUALITY_PRODUCTION PROCESS/PRODUCTION_ENGINEERING high 승격

### 왜 이 계열을 다음 후보군으로 봤는가
- 기존 HIGH tier 직무(소프트웨어개발, 기계설계, 회로설계, 회계, 세무)의 공통점: 특정 전공과 직무의 직결성이 매우 강함
- MANUFACTURING_QUALITY_PRODUCTION은 산업공학(IE)이 base=3(direct)으로 진입하는 유일한 카테고리 — IE→제조 직결성 명확

### 왜 RESEARCH_PROFESSIONAL는 HIGH 후보 없는가
- RESEARCH_PROFESSIONAL base matrix에서 이공계 전공 전체가 adjacent(2). direct(3)는 PUBLIC_POLICY 하나뿐.
- HIGH 승격 시 의도한 수혜자(이공계)가 아니라 공공정책 전공에게 +1이 가는 구조.
- 법학/약학/생명과학 전공이 별도 MAJOR category로 없어 LEGAL/REGULATORY_AFFAIRS HIGH 근거도 없음.
- 결론: base matrix 설계 레벨 문제 — 이번 라운드 scope 밖.

### 왜 QUALITY_CONTROL/ASSURANCE/EHS/설비 등은 보류했는가
- 품질직무(QC/QA): 이공계 전공이 유리하나 현장 검사 경험·ISO 프로세스가 전공보다 더 중요한 직무.
- EHS: 환경공학·산업위생 전공이 직결되지만 해당 전공이 별도 MAJOR category 없음.
- 설비보전: 현장 숙련도 중심.
- 공통: weak/mismatch -1 패널티가 과벌점이 될 가능성 있음.

## 2026-04-19 SAFE PATCH — [지원 직무 특징] 표시 형식 정규화 (targetReadAdapter)

### 문제 원인
- `buildTransitionLiteTargetJobRead()`가 `body: summary`를 반환했고, `summary`는 `pickTargetJobReadSummary()`가 `primaryFamily.summaryTemplate`에서 가져온 8~10문장짜리 덩어리일 수 있었다.
- `ensureSentence()`는 공백 정규화만 하고 문장을 자르지 않는다.
- 결과: TransitionLiteResult.jsx의 "핵심 요약" 블록에 긴 줄글이 그대로 출력됨.

### 실제 owner
- render owner: `TransitionLiteResult.jsx` (line 2069-2078) — body + bullets 분리 렌더, 변경 없음
- builder owner: `targetReadAdapter.js` → `buildTransitionLiteTargetJobRead()` — 이번 패치 지점
- data owner: `service_planning.js` 등 각 직무 ontology 파일의 `families[].summaryTemplate`

### 왜 이 정규화 지점을 선택했는가
- consumer(TransitionLiteResult.jsx) 땜질은 동일 shape을 쓰는 다른 consumer에 영향 없으나, 근본 원인이 producer shape에 있으므로 builder에서 통일하는 것이 올바른 레이어.
- consumer 수정 금지(다른 섹션 영향 최소화 원칙).
- data asset 수정(summaryTemplate 단문화)은 50+ 파일 영향 → 과도.
- builder 1개 파일, 함수 내 국소 변경으로 범위 최소.

### 안 건드린 영역
- scorer/analysis 로직 전체
- consumer(TransitionLiteResult.jsx)
- data asset summaryTemplate 원문 (summary 필드로 backward compat 유지)
- 기존 structured bullets 경로 (bullets.length > 0인 케이스는 신규 분기 미진입)

## 2026-04-19 SAFE PATCH — [지원 직무 특징] 직무 특징 tag chip 추가

### tag 데이터 소스 조사 결과
- `detailAsset.pointCandidates`: business vertical 7개만 커버 — 범용 불가
- `strongSignals`: 10-20자 문장, chip으로 너무 김
- **`primaryFamily.label`**: 항상 존재, 4-12자 구조화 레이블 ("기능·프로덕트 기획", "세무 신고·컴플라이언스") — 채택
- **`primaryRole.label`**: 거의 항상 존재, 역할 타이틀 ("프로덕트 매니저") — 채택

### 왜 primaryFamily.label + primaryRole.label을 선택했는가
- 기존 구조화 자산 재사용 (새 taxonomy 생성 금지 원칙)
- 모든 job ontology 파일에 families[] 반드시 존재 → 100% 커버
- 짧고 의미 명확: 직무 하위 분류와 역할 타이틀 → 사용자가 직무 성격을 한눈에 파악 가능
- deduplicate filter 적용 → family.label == role.label인 경우 중복 제거

### 왜 tag가 없는 경우도 안전한가
- consumer guard: `targetJobTags.length > 0 ? ... : null` → data 없으면 chip row 자체 안 나옴
- section 표시 조건(title || body || bullets) 변경 없음 — tags만으론 섹션 표시 안 됨

## 2026-04-19 SAFE PATCH — tag 품질 개선: primaryRole.label 제거 + semantic character chip 추가

### 1차 패치 품질 평가
- body 정규화: `takeSingleSentence(summary)` → 핵심 요약이 항상 1문장 → 체감 개선 확인
- bullet 승격: `buildSentenceBulletsFromText` → long paragraph 케이스에서 구조형으로 분리됨
- structured 기존 케이스: 3-bullet 경로 그대로 → 영향 없음
- 중복 체감: 없음 (body 1문장 + bullets 별도 포인트)

### 왜 primaryRole.label을 제거했는가
- 실제 예시 확인: "백엔드 개발"(family) + "백엔드 엔지니어"(role) → 완전 중복
- "기능·프로덕트 기획"(family) + "프로덕트 매니저"(role) → 의미 반복
- role.label은 job.label의 alias에 불과한 경우가 대부분 → chip 정보 가치 없음

### 왜 buildJobCharacterTag를 추가했는가
- 기존 isOperationalEvaluationFamily / isCreativeEvaluationFamily 재사용 → 새 taxonomy 아님
- familyId string pattern 6개로 "기획 설계", "분석 조사", "기술 구현", "품질 관리" 도출
- 사용자 원하는 "실행 중심 / 운영 관리 / 기획 설계" 스타일과 직접 대응
- null 반환 시 family.label 단독 표시 → fallback 안전

### 결과 chip 예시
- 서비스기획(FEATURE_PRODUCT_PLANNING) → ["기능·프로덕트 기획", "기획 설계"]
- 백엔드개발(BACKEND_DEVELOPMENT) → ["백엔드 개발", "기술 구현"]
- 전략기획(CORPORATE_STRATEGY_ANALYSIS) → ["경영전략 분석·수립", "분석 조사"]
- 고객운영(OPERATION_EXECUTION 계열) → ["운영 실행" character만 + family.label]

### 안 건드린 영역
- consumer(TransitionLiteResult.jsx) — tags 배열 그대로 소비
- bullets / body / summary 로직 전체
- scorer/analysis 로직

### 안 건드린 영역
- 기존 bullets 경로, body/summary 로직 — 변경 없음
- scorer/analysis 로직 전체
- 다른 리포트 섹션

### 왜 소수(2개)만 승격했는가
- "명백한 누락만 보수적으로 승격" 원칙.
- PROCESS_ENGINEERING, PRODUCTION_ENGINEERING은 이공계 전공→직무 과업 수행 직결이 구조적으로 명확.
- 나머지는 확정 불가 또는 경험 중심 직무로 판단.

## 2026-04-19 SAFE INVESTIGATION — 축1 운영 원칙 잠금 + 직무 A/B/C 분류표 완성

### 라운드 성격
코드 패치 없음. 조사/정리/문서화 라운드.

### A/B/C 분류 기준 (잠금)

**A: dependencyTier로 해결 가능**
- base/prior 구조는 대체로 맞고, tier 누락 때문에 체감 오판 발생
- high 승격 시 설명 가능, direct +1 / weak·mismatch -1 납득 가능

**B: major category / base matrix 구조 문제**
- dependencyTier 올려도 해결 안 됨 (direct prior 경로 자체 없음)
- category 추가, matrix 설계, 구조 보정 필요 → 국소 패치 금지

**C: 경험 중심이라 HIGH 자체 부적절**
- 전공보다 경험·숙련·방법론 비중이 더 큼 → 점수 패치 금지, 설명 개선 대상

### 직무별 분류 결론

**A (완료)**: ACCOUNTING, TAX, PROCESS_ENGINEERING, PRODUCTION_ENGINEERING, POLICY_RESEARCH, SOFTWARE_DEVELOPMENT, MECHANICAL_DESIGN, CIRCUIT_DESIGN

**B (구조 라운드 필요)**:
- TECHNICAL_RESEARCH: 이공계 major category 부재, RESEARCH_PROFESSIONAL base=2 구조 문제
- LEGAL: LAW major category 없음
- REGULATORY_AFFAIRS: PHARMACY/MEDICINE major 없음
- PATENT_IP: LAW 부재 주원인
- EHS: 환경공학/산업위생 major category 없음

**C (HIGH 부적절)**:
- QUALITY_CONTROL, QUALITY_ASSURANCE_QA: 현장 검사 경험·ISO 중심
- EQUIPMENT_MAINTENANCE: 현장 숙련도 중심
- MARKET_INDUSTRY_RESEARCH, EXPERT_REVIEW_EVALUATION, CONSULTING: 경험/전공 풀 넓음

**추가 조사 필요**: PRODUCTION_MANAGEMENT, MANUFACTURING_INNOVATION, MEDIA override 대상

### 구조 라운드 안건 (우선순위순)
1. 이공계 세분류 major category → TECHNICAL_RESEARCH/EHS (높음)
2. RESEARCH_PROFESSIONAL base matrix 보정 → 안건 1 선행 필요 (높음)
3. LAW category → LEGAL/PATENT_IP (중)
4. PHARMACY category → REGULATORY_AFFAIRS (중)
5. MEDIA override 실효성 점검 → MARKETING base 확인 (낮음)
6. 복수전공 정책 결정 → UI/payload/resolver 전 계층, 현재 동결 (낮음)

### 판단 기준 (잠금)
"dependencyTier로 고치는 순간, 축1이 경험 축처럼 오염되거나, major prior 철학이 흔들리거나, weak/mismatch 과벌점이 커지는가?" — 그렇다면 A가 아니라 B 또는 C다.

## 2026-04-19 QA VALIDATION — Axis1 예외 보정 전체 검증 및 오류 수정

### 결정: 기존 QA 표 row 4 오류 수정
- 기존 기록: BUSINESS_ADMIN→ACCOUNTING "weak" + "role evidence 없으면 -1"
- 실제: BUSINESS_ADMIN→FINANCE_ACCOUNTING base=2 → prior=**adjacent**
- HIGH+adjacent = no score change (light_bonus only). 페널티 없음.
- 이유: BUSINESS_ADMIN 전공의 FINANCE_ACCOUNTING 카테고리 base가 2(adjacent)임을 착오한 것.

### 결정: ACCOUNTING_TAX override no-op 허용
- ACCOUNTING_TAX override for ACCOUNTING/TAX/INTERNAL_CONTROL = +1이지만, base=3이라 capped to 3.
- 기능적으로 no-op이나 의도적 마킹으로 유지. 삭제 불필요.
- 동일하게 INDUSTRIAL_ENGINEERING, PSYCHOLOGY_COUNSELING, BUSINESS_ADMIN 일부 override도 no-op 확인됨.

### 결정: exception 5종 유지
- CS/SW→BUSINESS, BUSINESS_ADMIN→IT_DATA, ECONOMICS/FINANCE→SALES
- 스태킹 없음(Math.max), 최대 +1 제한, 현실 지원 패턴 반영으로 타당성 확인됨. 수정 불필요.

### 결정: 복수전공 처리 경로 현행 동결
- resolveNewgradAxis1MajorPriorBest()는 dead code — 활성화 시 별도 패치 필요.
- 현재 복수전공 입력 시 weak(1) fallback 처리, 사용자에게 노출 없음.
- 추후 복수전공 UI 기능 추가 시에만 재검토.

## 2026-04-06 SAFE INVESTIGATION ONLY - newgrad 실전 경험 input audit

### 무엇을 조사했는가
- 신입 transition-lite 입력의 `프로젝트 / 인턴·현장실습 / 계약직·단기 실무`가 UI state, submit payload, normalize, axis scorer, explanation, report render까지 실제로 어떻게 연결되는지 추적했다.

### 확정된 owner
- `src/components/input/NewgradTransitionLiteInput.jsx`
  - UI render / state / payload owner
- `src/App.jsx`
  - submit 분기 owner
- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
  - normalize / result build owner
- `src/lib/analysis/buildNewgradAxisPack.js`
  - true score owner
- `src/data/transitionLite/axisExplanationRegistry.js`
  - explanation owner
- `src/components/report/TransitionLiteResult.jsx`
  - render consumer

### 실전 경험 field impact 요약
- 프로젝트
  - `role` -> Axis 1 direct
  - `outcomeLevel` -> Axis 3 direct
  - `type` -> Axis 2 weak heuristic only
- 인턴
  - `roleFamily` -> Axis 1 direct
  - `duration` -> Axis 3 direct
  - `stakeholderType` -> Axis 2 / 4 direct
  - `type` -> Axis 2 context presence condition only
- 계약직 / 단기 실무
  - `roleFamily` -> Axis 1 direct
  - `duration` -> Axis 3 direct
  - `stakeholderType` -> Axis 2 / 4 direct
  - `type` -> Axis 2 context presence condition only

### taxonomy / asset 판단
- newgrad 실전 경험 입력 전용 canonical registry / taxonomy / mapping asset은 확인되지 않았다.
- runtime는 UI option 상수와 scorer 내부 하드코딩 Set / map / exact string match에 의존한다.
- `src/data/workRecord/commonRecordTaxonomy.js`는 존재하지만 newgrad transition-lite scorer 연결은 확인되지 않았다.

### 이번 라운드 범위
- source code patch 없음
- scoring patch 없음
- UI patch 없음
- 문서 기록만 수행

## 2026-04-06 Newgrad strengths / workStyle SSOT-taxonomy design draft

### ? ? ?? ??? ????
- ?? runtime audit?? `strengths`, `workStyleNotes`? dead input? ???? ?? registry / canonical contract ?? UI ?? + exact match / presence heuristic? ?? ??? ????.

### ?? ????? ?? ??
- `strengths`? ????? Axis 5 direct ????, Axis 4? explanation/reference only? ???? ?? ? ??? ??.
- `workStyle`? ????? Axis 5 direct ????, Axis 4? communication-oriented ??? ??? direct ??? ??.
- ?? Axis 4? `workStyleNotes` presence/count ??? ???? ??? ??.
- ?? ?? ? ?? ??? scorer ???? taxonomy/registry SSOT ????.

### ??
- source code patch ??
- scoring logic ?? ??
- UI ?? ??
- ?? ?? + ?? ??? ??


## 2026-04-05 Newgrad strengths / workStyle runtime audit

### 무엇을 조사했는가
- 신입 분석 입력 `[강점]`, `[일하는 방식]`이 UI에서 어떤 key로 저장되고, payload를 거쳐 axis score / explanation / report section까지 실제로 어떻게 연결되는지 추적했다.

### 확정된 owner
- render owner: `src/components/input/NewgradTransitionLiteInput.jsx`
- result builder owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- axis score owner: `src/lib/analysis/buildNewgradAxisPack.js`
- explanation owner: `src/data/transitionLite/axisExplanationRegistry.js`
- report consumer owner: `src/components/report/TransitionLiteResult.jsx`

### 확정된 연결 범위
- `strengths`
  - Axis 5 점수 직접 반영
  - Axis 5 explanation 반영
  - 결과 VM `strengths` 섹션에 raw selected value 그대로 노출
- `workStyleNotes`
  - Axis 4 점수 직접 반영
  - Axis 4 explanation 반영
  - Axis 5 점수 직접 반영
  - Axis 5 explanation 반영
  - `whyThisRead`에 presence 문장 1줄 반영

### taxonomy / dead input 판정
- strengths/workStyle 독립 registry/ontology 파일은 없다.
- UI 옵션과 Axis 5 trait 매핑은 파일 내부 상수 하드코딩이다.
- 두 입력 모두 미사용/dead 상태는 아니지만, registry 기반보다는 heuristic/exact-match 기반에 가깝다.

## 2026-04-05 PASSMAP precheck baseline relock

### 왜 이 relock이 필요했는가
- 실제 작업 흐름에서는 `00_HQ/Session_Handoff_Latest.md`가 기본 precheck 문서로 일관되게 쓰이지 않았고, append-only 성격 때문에 최신 상태 문서처럼 사용하기 어려웠다.
- 따라서 기본 precheck를 `00_HQ/SSOT_Map.md` 중심으로 다시 잠그고, 작업 유형별 추가 문서만 읽는 방식으로 정리할 필요가 있었다.

### 이번 라운드에서 잠근 것
- 기본 precheck 문서는 `00_HQ/SSOT_Map.md`다.
- 기본 precheck 범위는 상단 owner map, known drift / caveat, 변경 유형별 갱신 범위다.
- `00_HQ/Session_Handoff_Latest.md`는 기본 precheck에서 제외하고, 직접 충돌/역사 확인이 필요할 때만 제한적으로 본다.
- 전체 옵시디언 전수독해는 금지하고, 작업 유형별 필요한 문서만 추가로 읽는다.

### 문서 우선순위
- 코드
- `00_HQ/SSOT_Map.md`
- 작업 유형별 QA framework / input contract
- `05_Execution/Decision_Log.md`
- `01_Product/Passmap_5Axis_Guide.md`
- `docs/COMM_PATCH_NOTES.md`
- scratch / historical / inventory 문서

### 이번 라운드 범위
- source code patch 없음
- scoring logic 변경 없음
- UI 변경 없음
- markdown 문서만 최소 수정

## 2026-04-05 PASSMAP 5축 문서 유지보수 규칙 잠금

### 왜 이 규칙이 필요한가
- 5축 문서화 반영 이후 다음 리스크는 설명 부족이 아니라 갱신 누락 drift였다.
- owner / classification / explanation / label이 서로 다른 파일에서 바뀔 수 있어, 어떤 변경이 어떤 문서 세트를 함께 건드려야 하는지 짧게 잠가둘 필요가 있었다.

### 이번 라운드에서 잠근 것
- score formula change 시 문서 세트
- upstream classification change 시 문서 세트
- explanation copy contract change 시 문서 세트
- UI label / axis 구조 변경 시 문서 세트
- QA interpretation change 시 필수 문서와 선택 문서

### 핵심 유지보수 경고
- experienced/newgrad는 같은 key를 재사용해도 의미가 다를 수 있다.
- 한쪽 축만 바뀌었다고 보이더라도 다른 audience 문서를 같이 확인해야 drift가 줄어든다.
- 문서는 mirror이며 코드가 우선이다.

### 이번 라운드 범위
- source code patch 없음
- scoring logic 변경 없음
- UI 변경 없음
- markdown 문서만 수정

## 2026-04-05 PASSMAP 5축 문서화 반영

### 왜 문서화가 필요했는가
- 직전 true owner audit에서 PASSMAP 5축의 score owner, upstream owner, explanation owner, UI render owner가 문서마다 섞여 있었다.
- 특히 experienced와 newgrad가 같은 내부 key를 재사용하면서도 실제 의미가 다른 축이 있어 drift risk가 컸다.
- owner map을 HQ 구조 문서와 Product 설명 문서로 분리하지 않으면 운영 설명이 runtime 계약처럼 굳어질 위험이 있었다.

### 이번 라운드에서 한 일
- true owner audit 결과를 기준으로 HQ owner map 문서를 정식 반영했다.
- Product/운영자가 읽는 5축 설명 문서를 별도 신규 생성했다.
- Execution log, handoff, working memo, comm notes를 같은 기준으로 동기화했다.

### 이번 라운드의 분리 원칙
- HQ 문서: owner / upstream / explanation / render contract를 잠그는 구조 문서
- Product 문서: 운영자용 설명 mirror
- Execution log: 이번 문서화 라운드의 판단과 범위 기록

### drift risk로 본 핵심 포인트
- experienced/newgrad 동일 key 재사용
- experienced Axis 3/5의 upstream classification owner 누락 위험
- experienced Axis 4의 customer-only 오독 위험
- newgrad Axis 2의 cert relevance bridge / industry coverage 의존
- newgrad Axis 5의 self-report 기반 과신 위험

### 문서 경계
- 이번에 추가한 문서는 모두 코드 기준 mirror다.
- 코드 SSOT를 대체하지 않는다.
- 이후 score / classification / explanation / UI contract 변경 시 문서를 같이 갱신해야 한다.

### 이번 라운드에서 일부러 안 건드린 것
- source code patch 없음
- scoring logic 변경 없음
- UI 변경 없음
- copy registry 변경 없음
- markdown / Obsidian 문서만 수정

## 2026-04-05 SAFE PATCH - NEWGRAD AXIS 3 SIGNAL APPEND-ONLY UPGRADE

### Why
- Axis 3 scorer already used semantic lift from `projectOutcomeLift`, `durationLift`, and `project+intern combo`.
- Axis 3 builder only received raw counts, so explanation quality collapsed into count echo.
- Low/mid bands could produce weak summary text while leaving detail too optimistic or too empty.

### What Was Added
- producer-side append-only signals on Axis 3:
  - `evidenceGroupCount`
  - `evidenceItemCount`
  - `projectOutcomeLevel`
  - `experienceDurationLevel`
  - `comboEvidence`
  - `comboGuarded`
  - `semanticLift`
  - `evidenceStrength`
- no score formula, threshold, band, consumer, or UI contract change

### Explanation Quality Change
- outcome-driven case now explains result-making evidence instead of just project count
- duration-driven case now explains repeated / sustained experience instead of just internship existence
- combo case now explains why project + practical experience is more persuasive
- low / very_low now keeps at least one actionable gap when the summary is weak

### Validation Snapshot
- CASE A strong/high: strong outcome + long duration + combo rendered as strong rationale, not count echo
- CASE B mid mixed: summary downgraded to mixed tone; positives and gaps now coexist without contradiction
- CASE C low weak: weak-only evidence no longer reads as positive-only
- CASE D none: existing clean direction preserved
- CASE E duration-driven: duration shows up explicitly and is not confused with outcome
- CASE F combo-driven: combo benefit is visible, but summary does not overclaim depth

### Next Priority
- Axis 3 QA pass looks stable enough for broader render replay
- next likely entry point: Axis 4 precheck, unless Axis 3 consumer-side wording QA reveals a micro follow-up

## 사용 목적
- 중요한 작업 / 구조 수정 / 판단 변경을 짧고 구조적으로 남긴다.
- 무엇을 바꿨는지, 왜 바꿨는지, 이번 라운드에서 일부러 안 건드린 범위를 기록한다.

## 언제 업데이트하는가
- 중요한 작업이면 기본 업데이트
- 사소한 문구 수정이면 생략 가능
- 애매하면 보수적으로 기록

## 기록 원칙
- 짧고 구조적으로 기록
- 추측 금지
- 실제 작업 기준으로만 기록

### 2026-04-05 newgrad Axis 2 explanation expansion precheck — Decision C

#### 무엇을 확인했는가
- Axis 2 (`scoreDomainInterest`) 조사 완료
- score → signals → builder → render 경로 전수 추적

#### 결론: Decision C — Signal append-only upgrade 필요
Axis 1 pre-upgrade와 동일한 "rich scorer / thin signals" 패턴.

#### 핵심 발견
1. `projectCount = 전체 프로젝트 수` 인데 label이 "산업 관련 프로젝트" → critical mislabel
2. `majorPresent`만 있고 `majorAligned` 없음 → 전공 맞닿음 여부 구분 불가
3. `internshipCount`만 있고 `contextStrength` 없음 → strong/weak intern 구분 불가
4. gap 조건 너무 좁아 mid 케이스에서 summary/detail 충돌 발생

#### 다음 라운드
- Axis 2 signal append-only upgrade (buildNewgradAxisPack.js + axisExplanationRegistry.js 2파일)
- micro hotfix 선행 가능: "산업 관련 프로젝트" → "프로젝트" (1줄 label 교체)

#### 이번 라운드에서 건드리지 않은 것
- source patch 없음

---

### 2026-04-05 newgrad Axis 1 local render QA follow-up

#### 무엇을 바꿨는가
- `src/data/transitionLite/axisExplanationRegistry.js`
  - `internshipLinkType === "industry_only"` 문장을 positive에서 negative로 재분류
  - 문구를 "실무 환경 이해에는 도움, 직무 직접성 근거로는 제한적" 톤으로 고정
- 문서 업데이트
  - `00_HQ/Session_Handoff_Latest.md`
  - `05_Execution/Decision_Log.md`
  - `docs/끄적.md`
  - `docs/COMM_PATCH_NOTES.md`

#### 왜 바꿨는가
- `intern_industry`가 strength bucket에 남아 있으면 visible copy의 제한형 의미와 bucket 의미가 충돌한다.
- 이번 라운드 목적은 score redesign이 아니라 explanation quality patch이므로 producer 레이어에서만 정합성을 맞추는 편이 가장 보수적이다.
- `proj_adjacent only`의 weak supportive positive 분리와 `majorLinkType adjacent` dead branch 정리는 현재 working tree에 이미 반영돼 있어 그 상태를 유지했다.

#### 이번 라운드에서 일부러 안 건드린 것
- Axis 1 numeric score / band threshold / score meaning
- consumer(`TransitionLiteResult.jsx`) 해석 로직
- Axis 2~5, cert pipeline, App-level flow
- `getAxisScoreNarrative()` 제거

#### 다음 리스크 / 다음 확인 포인트
- Axis 2도 같은 producer-owned explanation contract 방식으로 확장 가능한지 확인
- `getAxisScoreNarrative()`는 explanation unavailable fallback 경로가 남아 있어 아직 제거 보류가 맞다

## Template
### YYYY-MM-DD [작업명]

#### 무엇을 바꿨는가
- 

#### 왜 바꿨는가
- 

#### 이번 라운드에서 일부러 안 건드린 것
- 

#### 다음 리스크 / 다음 확인 포인트
- 

### 2026-04-05 newgrad Axis 1 explanation micro fix

#### 무엇을 바꿨는가
- `axisExplanationRegistry.js` 1파일만 수정
- `intern_industry` label → "제한적입니다" 제거, 강점 섹션 UX 정상화
- `proj_adjacent` → positive+negative split, adjacent project only 케이스 positives 공백 해소
- `majorLinkType === "adjacent"` dead branch 제거 (unreachable 주석으로 명시)

#### 왜 바꿨는가
- QA에서 확정된 3개 잔존 이슈 처리
- "노력이 완전히 안 보이는 상태" 해소 + 강점 섹션에 제한형 문장 UX 긴장 해소

#### 이번 라운드에서 건드리지 않은 것
- scoring/band 변경 없음, consumer 미수정
- buildNewgradAxisPack.js 미수정
- Axis 2~5 미수정

#### 다음 리스크 / 다음 확인 포인트
- Axis 1 이제 안정적. 다음은 Axis 2 signal richness 조사.
- getAxisScoreNarrative 제거 보류 유지.

---

### 2026-04-05 newgrad Axis 1 render QA — 후속 패치 필요 확정

#### 무엇을 확인했는가
- 6가지 케이스 기준으로 explanation 분기 추적
- A~F 케이스 모두 직접 코드 실행 경로 검증

#### 발견된 문제 3개
1. `intern_industry` direction="positive": "직무 직접성 근거로는 제한적" 문장이 강점 섹션에 표시됨 → UX 긴장
2. `proj_adjacent` only (intern/major 없음): positives=[] → 사용자 노력이 강점에 아예 안 보임
3. `majorLinkType === "adjacent"` builder 분기: dead branch (도달 불가)

#### 다음 라운드 판단
- Axis 1 국소 카피/분기 패치가 먼저
- 위 3개 수정 후 Axis 2 확장 가능

#### 이번 라운드에서 건드린 것
- 읽기 전용 — source patch 없음

---

### 2026-04-05 newgrad Axis 1 signal contract consistency fix

#### 무엇을 바꿨는가
- `buildNewgradAxisPack.js`: `majorLinkType` 계산에서 `_jobFitProjectBest` / `_jobFitInternBest` 제거
  - 수정 전: `(majorRelevant && projectBest >= 2) || (majorRelevant && internBest >= 2)` → "direct"
  - 수정 후: `_jobFitMajorRelevant ? "direct" : "none"` (전공 신호만)
- `axisExplanationRegistry.js`: fallback 조건 `"none"` 명시 처리
  - `!signals.projectBestLinkType` → `!signals.projectBestLinkType || signals.projectBestLinkType === "none"`
  - `!signals.internshipLinkType` → `!signals.internshipLinkType || signals.internshipLinkType === "none"`

#### 왜 바꿨는가
- `majorLinkType` owner contamination: 전공 없어도 프로젝트/인턴 강도로 "adjacent" 되는 구조적 혼선
- `"none"` truthy 문제: projectCount===1, internshipCount>=1 케이스에서 presence fallback이 작동 안 하는 dead branch

#### 이번 라운드에서 일부러 안 건드린 것
- 새 field 추가 없음
- scoring/band 변경 없음
- Axis 2~5, experienced, consumer 미수정

#### 다음 리스크 / 다음 확인 포인트
- Axis 1 실제 렌더 품질 점검 (입력 케이스별 분기 확인)

---

### 2026-04-05 newgrad Axis 1 signal richness append-only upgrade

#### 무엇을 바꿨는가
- `buildNewgradAxisPack.js`: Axis 1 signals에 5개 contextual field append-only 추가
  - majorLinkType / projectDirectCount / projectBestLinkType / internshipLinkType / primaryEvidenceSource
- `axisExplanationRegistry.js`: `buildNewgradJobFitExplanation` — 새 signal 기반 분기 추가, 기존 presence fallback 유지

#### 왜 바꿨는가
- 사용자 피드백: "상세보기인데 상세하지 않다"
- 근본 원인: scorer가 이미 rich context(targetMajor, bestRoleLevel, directCount, majorRelevant 등)를 계산하지만 signals에 담지 않아 builder가 "~이 있습니다" 수준에 머물렀음

#### 이번 라운드에서 일부러 안 건드린 것
- scoring formula / band threshold
- Axis 2~5 (newgrad 및 experienced)
- TransitionLiteResult.jsx consumer
- getAxisScoreNarrative() 제거 보류 유지

#### 다음 리스크 / 다음 확인 포인트
- Axis 1 실제 렌더 품질 점검 (렌더된 label이 의도대로 분기되는지)
- Axis 2 확장 여부 판단 (같은 방식 적용 가능 여부)

---

### 2026-04-05 experienced Axis 3/5 detail duplication fix

#### 무엇을 바꿨는가
- `axisExplanationRegistry.js` 1파일만 수정
- Axis 3: 4개 shift별 positives/gaps label → summary 반복에서 보조 근거형으로 교체
- Axis 5: `ROLE_WEIGHT_SHIFT_DETAIL` 상수 추가, reasons label을 `ROLE_WEIGHT_SHIFT_SUMMARY` 재사용에서 교체

#### 왜 바꿨는가
- 사용자 피드백: "상세보기인데 상세하지 않다"
- Axis 5: summary == gaps[0] literal 동일 문장 → 즉시 수정 대상
- Axis 3: summary 핵심 판단을 paraphrase 반복 → row 읽은 뒤 detail에 새 정보 없음

#### 이번 라운드에서 일부러 안 건드린 것
- summary 상수 (RESPONSIBILITY_SHIFT_SUMMARY / ROLE_WEIGHT_SHIFT_SUMMARY 유지)
- experienced Axis 1/2/4, newgrad 5축 전부
- TransitionLiteResult.jsx consumer, getAxisScoreNarrative(), scoring/band

#### 다음 리스크 / 다음 확인 포인트
- newgrad signal richness 개선이 다음 큰 작업
- getAxisScoreNarrative() 제거 보류 유지

---

### 2026-04-05 getAxisScoreNarrative 제거 가능성 조사 — 보류 확정

#### 무엇을 조사했는가
- `TransitionLiteResult.jsx`의 `getAxisScoreNarrative()` / `narrativeMap` dead code 여부
- `axisExplanationRegistry.js` 각 builder 함수의 `available: false` 반환 경로 전수 조사

#### 판단: 제거 보류

#### 보류 근거
- line 1158: `{explanation ? explanation.summary : narrative}` — `narrative`가 현재도 활성 fallback 경로
- `getAxisScoreNarrative()` 제거 시 아래 경우 빈 문자열 표시:
  - experienced Axis 3: `buildResponsibilityScopeExplanation` → `!signals.responsibilityShift`면 `available: false`
  - experienced Axis 5: `buildRoleCharacterExplanation` → `roleWeightShift` 없으면 `available: false`
  - newgrad 5축 전부: `positives.length === 0 && gaps.length === 0`면 `available: false` (count/presence 기반 1차 버전 특성상 실제 hit 가능)

#### 이전 세션 기록과의 차이
- `Session_Handoff_Latest.md` 2026-04-05 기록: "experienced/newgrad 5축 모두 explanation.available=true → 제거 가능"
- 실제 코드 확인 결과: **조건부 available** — builder마다 available: false 반환 경로가 살아 있음
- 특히 newgrad 5축 builder는 모두 `positives.length === 0 && gaps.length === 0`일 때 `available: false` 반환

#### 이번 라운드에서 건드리지 않은 것
- `TransitionLiteResult.jsx` — 소스 패치 없음
- `getAxisScoreNarrative()` / `narrativeMap` — 제거 보류
- `axisExplanationRegistry.js` — 수정 없음

#### 다음 리스크 / 다음 확인 포인트
- 제거 선행 조건: 모든 builder에서 explanation.available=false가 실제로 발생하지 않는지 per-builder 검증
- 또는: `getAxisScoreNarrative()` 대신 `tone` / band별 generic fallback 1줄로 교체 후 제거
- 현재 구조에서 newgrad explanation이 "count/presence 기반 1차"인 한 빈 positives/gaps 케이스는 항상 발생 가능

---

### 2026-04-05 newgrad 5축 explainability 확장

#### 무엇을 바꿨는가
- `axisExplanationRegistry.js`에 newgrad 전용 5축 builder 함수 5개 추가
- `buildNewgradAxisPack.js` return 구조 변경: inline makeAxis → pre-compute + spread + explanation wiring
- newgrad 5축 모두 `explanation.available=true` 경로가 됨

#### 왜 바꿨는가
- experienced 5축은 이미 explanation 완비 상태
- newgrad 5축은 아직 explanation 없어 `getAxisScoreNarrative()` fallback 경로만 사용 중
- 이번 확장으로 `getAxisScoreNarrative()`의 실사용 경로가 사실상 소멸 → 제거 기반 확보

#### 이번 라운드에서 일부러 안 건드린 것
- 점수 계산 로직 (scoreJobFit / scoreDomainInterest / scoreExecutionDepth 등)
- `TransitionLiteResult.jsx` (generic consumer로 이미 동작)
- `getAxisScoreNarrative()` 함수 자체 (다음 라운드 제거 예정)

#### 다음 리스크 / 다음 확인 포인트
- `getAxisScoreNarrative()` 및 내부 narrativeMap 제거 가능 (실사용 경로 없음)
- newgrad explanation은 Grade B (count-based) — 향후 signal richness 확장 시 개선 가능
- axis5 softSkill: strengthsCount=0인 경우 gap만 나옴 — UX 체감 확인 필요

---

### 2026-04-05 axis row / detail 역할 분리 (narrative debt 1차 정리)

#### 무엇을 바꿨는가
- `TransitionLiteResult.jsx` axis row 텍스트 소스를 `getAxisScoreNarrative()` → `explanation.summary` (producer pass-through)로 교체
- explanation 없는 경로(newgrad 포함)는 기존 narrative fallback으로 유지
- detail 패널에서 `explanation.summary` 단락 제거 (row와 중복) → positives + gaps만 표시
- 상세보기 버튼 노출 조건: `explanation.available` → `explanation && (positives.length > 0 || gaps.length > 0)`
- detail 내 "강점 신호" / "보완 포인트" 섹션 헤더 추가

#### 왜 바꿨는가
- industry_context, customerType 등에서 row narrative와 explanation.summary가 거의 동일 문장 반복 (Type A 중복)
- row = 판독 방향 / detail = 근거 분리를 위해 consumer pass-through가 가장 안전한 해결책
- 새 score 해석 로직 없이, producer summary를 그대로 row로 쓰는 구조로 정착

#### 이번 라운드에서 일부러 안 건드린 것
- `getAxisScoreNarrative()` 함수 자체 (newgrad fallback 필요, 아직 제거 불가)
- `axisExplanationRegistry.js` builder 로직 (수정 불필요)
- 점수 계산 / 레이더 / 배지

#### 다음 리스크 / 다음 확인 포인트
- `getAxisScoreNarrative()` narrativeMap의 experienced 5축 항목은 이제 explanation 있는 경로에서 사용되지 않음 (dead code 예비)
- newgrad axis explanation 확장 시 newgrad 항목도 같은 구조로 대체 가능
- explanation.positives / gaps 둘 다 비어 있는 엣지케이스 → available=false로 내려오지 않는지 확인 필요

---

### 2026-04-05 [Newgrad Axis 3 semantic lift micro-calibration]

#### 무엇을 바꿨는가
- `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()`에 base-4 combo guard를 추가했다.
- `project + internship` 조합에서 `projectOutcomeLift < 2`일 때 semantic lift를 1단계 낮췄다.

#### 왜 바꿨는가
- upper-mid inflation의 반복 원인이 threshold 단독보다 `base 4 + semantic lift` 결합부에 더 가까웠다.
- threshold 전체를 움직이는 것보다 semantic lift만 좁히는 option B가 더 보수적이었다.

#### 이번 라운드에서 일부러 안 건드린 것
- threshold 전역 조정
- Axis 1 / Axis 2
- UI / copy / consumer
- final cap / band conversion

#### 다음 리스크 / 다음 확인 포인트
- true high control 일부가 같이 눌리지 않았는지 engine-level 재검증
- consumer 3-band 서술에서 체감 완화가 충분한지 확인

---

### 2026-04-05 전환 연결 레이더 axis 상세보기 — explainability 계약 파일럿

#### 무엇을 바꿨는가
- `src/data/transitionLite/axisExplanationRegistry.js` 신규 생성 (explanation producer)
- `buildAxisConnectivityPack.js` — industryContext에 `explanation` payload 추가, 나머지 4축 placeholder
- `TransitionLiteResult.jsx` — `expandedAxisKey` state + "상세보기" 토글 + 확장 패널 UI

#### 왜 바꿨는가
- UI가 score를 해석해서 문구를 만드는 anti-pattern 제거 방향
- Producer가 explanation 생성, consumer는 렌더링만 하는 계약 구조 확립

#### 이번 라운드에서 일부러 안 건드린 것
- 점수 계산 로직 (threshold/cap/band)
- `getAxisScoreNarrative()` — 하위 호환 유지, 5축 완성 후 제거 검토
- 기존 레이더 점수 표시 동작

#### 다음 리스크 / 다음 확인 포인트
- 나머지 4축 explanation 구현 필요
- `getAxisScoreNarrative()` 제거 시점 확인 필요 (5축 explanation 완성 이후)

---

### 2026-04-05 리포트 하단 CTA 섹션 액션 카드 개편 Round 2 — owner 재확인 + 실제 수정

#### 무엇을 바꿨는가
- `src/components/report/TransitionLiteResult.jsx:1334–1396` CTA 섹션 교체
- "안내문 + 버튼 2개형" → "스타트업형 액션 카드 2종 비교 섹션"
- Card 1 (미니 컨설팅, secondary) / Card 2 (취업 컨설팅, primary, 추천 배지)
- 이력서 등록 블록 및 footer text 유지

#### 왜 바꿨는가
- Round 1에서 wrong owner(App.jsx IIFE)를 수정해 화면에 반영 안 됨 — true owner 재탐색 후 재패치

#### 이번 라운드에서 일부러 안 건드린 것
- onClick handler 시그니처 (onOpenTransitionLiteNextStep, onOpenTransitionLitePrecisePath)
- 이력서 등록 블록
- scoring / analyzer / report logic

#### 다음 리스크 / 다음 확인 포인트
- 이후 유사 UI 패치 시 "exact string search → final consumer 확인 → render condition 확인" 선행 필수
- App.jsx:10456 IIFE CTA 패치는 dead code 상태 (롤백 불필요, 단 이후 별도 정리 가능)

---

### 2026-04-05 리포트 하단 CTA 섹션 액션 카드 개편

#### 무엇을 바꿨는가
- `src/App.jsx` experienced 리포트 하단 CTA IIFE 섹션 JSX 교체
- "안내문 + 버튼 2개형" → "스타트업형 액션 카드 2종 비교 섹션"
- 카드 1: 미니 컨설팅 (15분, 빠른 점검) / 카드 2: 취업 컨설팅 (1:1, 추천 배지, primary 스타일)
- copy SSOT 확정 (강산.md 기준)

#### 왜 바꿨는가
- 리포트 이후 전환 액션이 올드한 랜딩 하단 버튼처럼 보여 제품 전환 설득력이 약했음
- 사용자 효용/선택지 비교/서비스 위계를 한눈에 보여주기 위한 UI 개편

#### 이번 라운드에서 일부러 안 건드린 것
- scoring / analyzer / report result data contract
- CTA action href (기존 링크 100% 재사용)
- 상위 App state / routing 구조
- TransitionLiteResult.jsx CTA 섹션 (별도 경로)

#### 다음 리스크 / 다음 확인 포인트
- 실제 전환율 기준으로 카드 2개 중 어느 쪽이 더 primary 여야 하는지 후속 검토
- CTA 섹션이 experienced 외 경로(newgrad, transition-lite)에서도 공통이면 copy 적합성 확인 필요
- 이후 라운드에서 후기/신뢰 요소/가격/추천 배지 추가 가능
### 2026-04-05 [Newgrad Axis 3 post-patch replay verdict]

#### 무엇을 확인했는가
- `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()` 패치 이후 same engine harness replay를 돌렸다.
- pre-patch formula와 current patched result를 같은 normalized input에서 직접 비교했다.
- target 4건, true high 3건, stable mid 3건, low 2건을 함께 봤다.

#### 무엇이 확인됐는가
- target 4건은 모두 `100/high -> 80/mid_high`로 내려왔다.
- true high / stable mid / low control은 모두 유지됐다.
- consumer narrative도 target 케이스에서 한 단계 완화됐다.

#### 이번 라운드에서 건드리지 않은 것
- 추가 source patch
- Axis 1 / Axis 2
- UI / copy / consumer 구조

#### 다음 리스크 / 다음 확인 사항
- coarse 3-band 체감은 여전히 `high` 쪽이므로 `keep`보다 `keep_with_watch`가 맞다.
- 다음 Axis 3 수정 전에는 고정 regression fixture 8건을 반드시 다시 돌린다.

<!-- PASSMAP_CERT_NORMALIZATION_FIX_START -->
### 2026-04-05 [Newgrad Cert Normalization Contract Fix]

#### 결정
- `buildNewgradTransitionLiteResult.js`에서 newgrad cert raw input을 그대로 보존한 `normalizedCertSelections` producer field를 추가했다.
- 이 필드는 `source`, `items`, `status`, `meta`를 가지며 item별 `rawCategory`, `rawSubcategory`, `rawLabel`, `normalizedLabel`, `canonicalHint`, `normalizationStatus`를 노출한다.
- canonical 추정 매핑은 이번 라운드에서 금지하고 `raw_only` / `unsupported` / `malformed` 중심으로 잠갔다.

#### 근거
- true owner는 UI 입력 `NewgradTransitionLiteInput.jsx`, normalized result owner는 `buildNewgradTransitionLiteResult.js`, scorer owner는 `buildNewgradAxisPack.js`로 분리되어 있다.
- 현재 scorer는 `input.certifications`를 `certificationsRaw`로 직접 읽기 때문에 raw UI label 해석을 scorer 내부에 넣지 않는 producer-first 보강이 가장 안전했다.

#### 이번 라운드에서 안 건드린 범위
- `buildNewgradAxisPack.js` scoring 의미 변경 없음.
- UI patch 없음.
- helper 2개 실제 구현 없음.
- cloud/security phase1 weighting apply 없음.

#### 다음 판단
- 다음 라운드 1순위는 `newgradCertMappingBridge.js`.
- 먼저 exact alias/canonical bridge를 닫아야 이후 `newgradRoleCertAdapter.js`가 role family별 안전한 limited read를 할 수 있다.
<!-- PASSMAP_CERT_NORMALIZATION_FIX_END -->

<!-- PASSMAP_CERT_MAPPING_BRIDGE_PHASE1_START -->
### 2026-04-05 [Newgrad Cert Mapping Bridge Phase1]

#### 결정
- `buildNewgradTransitionLiteResult.js`에 phase1 cloud/security cert bridge를 추가했다.
- `normalizedCertSelections.items`는 기존 `normalizationStatus`를 유지하면서 `mappingStatus`, `mappedFrom`, `phase1RoleFamilies`, `bridgeVersion`를 추가로 가진다.
- `canonicalHint`는 asset 기준 exact canonical/alias/normalized exact로만 채우고, rules-only exact hit는 `ambiguous`로 남긴다.

#### 근거
- `cert_catalog.v0.json`은 `id`, `canonicalName`, `aliases`, `domainTags`를 제공한다.
- `role_cert_matrix.v0.json`은 phase1 role family(`role:cloud`, `role:security`)와 cert id 연결 근거를 제공한다.
- `cert_rules.v0.json`은 exact keyword 후보를 제공하지만 precision 우선 원칙상 mapped 성공 근거로 쓰지 않고 ambiguous 보조 근거로만 사용했다.

#### 이번 라운드에서 안 건드린 범위
- `buildNewgradAxisPack.js` 수정 없음.
- `newgradRoleCertAdapter.js` 미구현.
- weighting apply 없음.
- UI patch 없음.

#### 다음 판단
- phase1 producer intermediate가 잠겼으므로 다음 라운드에는 `newgradRoleCertAdapter.js`를 붙일 수 있다.
- 단, adapter는 target job relevance를 계산하는 계층이지 canonical mapping을 다시 수행하면 안 된다.
<!-- PASSMAP_CERT_MAPPING_BRIDGE_PHASE1_END -->

<!-- PASSMAP_ROLE_CERT_ADAPTER_PHASE1_START -->
### 2026-04-05 [Newgrad Role Cert Adapter Phase1]

#### 결정
- `buildNewgradTransitionLiteResult.js`에서 `certRoleRelevancePack` producer field를 추가했다.
- 이 pack은 `targetJobId`, `targetRoleFamily`, `items`, `status`, `meta`를 가지며 item별 `relevanceStatus`, `relevanceReason`, `adapterVersion`을 노출한다.
- canonical mapping 재수행 없이 기존 `normalizedCertSelections.items`만 입력으로 사용했다.

#### 근거
- target job exact field는 `validated.input.targetJobId`다.
- phase1 explicit adapter mapping은 `JOB_IT_DATA_DIGITAL_DEVOPS_INFRA -> cloud`, `JOB_IT_DATA_DIGITAL_SECURITY -> security`가 가장 안전했다.
- cert item은 이미 `phase1RoleFamilies`를 가지고 있어 raw label 재해석 없이 role-family exact match만으로 relevance routing이 가능했다.

#### 이번 라운드에서 안 건드린 범위
- `buildNewgradAxisPack.js` 수정 없음.
- weighting apply 없음.
- UI patch 없음.
- phase1 외 job-family expansion 없음.

#### 다음 판단
- weighting apply limited read path를 열 수 있는 전제는 만들어졌다.
- 다만 scorer는 producer intermediate의 `mappingStatus = mapped`와 `relevanceStatus = direct_relevant`만 제한적으로 읽도록 좁게 시작해야 한다.
<!-- PASSMAP_ROLE_CERT_ADAPTER_PHASE1_END -->

<!-- PASSMAP_CERT_WEIGHTING_LIMITED_READ_PHASE1_START -->
### 2026-04-05 [Newgrad Cert Weighting Apply Limited Read Path Phase1]

#### 결정
- `buildNewgradAxisPack.js > scoreDomainInterest()`의 cert 보조 신호를 raw cert heuristic에서 producer-owned `certRoleRelevancePack` limited read로 교체했다.
- eligible 조건은 `mappingStatus = mapped` and `relevanceStatus = direct_relevant`다.
- support count는 `Math.min(1, eligibleCount)`로 제한해 같은 family cert 다건 stacking을 이번 라운드에서 사실상 1개 cap으로 잠갔다.

#### 근거
- raw label 해석과 canonical mapping은 이미 producer가 담당한다.
- scorer는 이제 raw cert object를 해석하지 않고 producer contract만 읽는다.
- 기존 Axis 2 cap 로직이 `certificationsAligned only -> max 2`를 이미 가지고 있어 cert-only high 금지를 유지하기에 적합했다.

#### 이번 라운드에서 안 건드린 범위
- `buildNewgradTransitionLiteResult.js` 수정 없음.
- UI patch 없음.
- adjacent relevance 확장 없음.
- broader weighting redesign 없음.

#### 다음 판단
- 다음은 calibration / QA execution이 먼저다.
- 실제 fixture에서 cert-only inflation, mixed evidence drift, cloud/security pair별 ceiling 동작을 먼저 확인해야 한다.
<!-- PASSMAP_CERT_WEIGHTING_LIMITED_READ_PHASE1_END -->

<!-- PASSMAP_MANUFACTURING_CERT_PRIORITY_PLAN_START -->
## 2026-04-05 Manufacturing Quality Cert Expansion Priority Planning

### 조사 결과 요약
- ontology 기준 manufacturing_quality_production 하위 canonical job ids는 다음 구조로 생성된다.
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_ENVIRONMENT_HEALTH_SAFETY`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_MANAGEMENT`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_CONTROL`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA`
- `JOB_MANUFACTURING_QUALITY_PRODUCTION_MANUFACTURING_INNOVATION`

### 잠근 판단
- manufacturing cert rollout은 안전환경과 설비/보전부터 여는 것이 가장 안전하다.
- 산업안전기사, 대기환경기사, 수질환경기사, 산업위생관리기사, 위험물기사/산업기사, 설비보전기사, 공조냉동기계기사, 에너지관리기사, 전기기사 계열은 직무 directness를 상대적으로 좁게 잠그기 쉽다.
- 품질경영기사, ISO 내부심사원 계열, 6시그마 계열은 품질 QA/QC, 제조혁신, 생산기술에 걸쳐 supportive로 퍼질 위험이 크므로 후순위가 맞다.

### 안 건드린 이유
- source patch, scoring patch, UI patch는 하지 않았다.
- 현재 cert asset에는 manufacturing role family와 제조 전용 cert alias coverage가 거의 없어 rollout 전에 asset 보강이 선행되어야 한다.

### 다음 우선순위
- 1순위: manufacturing cert asset coverage 보강
- 2순위: manufacturing phase1 mapping bridge 설계
- 3순위: role adapter 확장
- 4순위: weighting limited read path 확장
<!-- PASSMAP_MANUFACTURING_CERT_PRIORITY_PLAN_END -->

<!-- PASSMAP_MANUFACTURING_TIER1_CERT_ASSET_EXPANSION_START -->
## 2026-04-05 Manufacturing Tier1 Cert Asset Coverage Expansion

### 적용 파일
- `src/lib/ontology/certs/cert_catalog.v0.json`
- `src/lib/ontology/certs/cert_rules.v0.json`
- `src/lib/ontology/certs/role_cert_matrix.v0.json`
- `00_HQ/Session_Handoff_Latest.md`
- `05_Execution/Decision_Log.md`
- `docs/끄적.md`
- `docs/COMM_PATCH_NOTES.md`

### 잠근 범위
- Tier1 제조 cert만 추가했다.
- EHS: 산업안전기사, 대기환경기사, 수질환경기사, 산업위생관리기사
- EHS 제한 plus: 위험물기사, 위험물산업기사
- Equipment Maintenance: 설비보전기사, 전기기사, 공조냉동기계기사, 에너지관리기사
- Equipment Maintenance 제한 plus: 전기산업기사

### 안 연 범위
- 제조 전반 공통 direct 해석 금지
- 품질/생산관리/공정기술 direct 확장 금지
- mapping bridge, role adapter, weighting apply 확장 금지

### 판단 메모
- matrix는 direct를 `preferred`, 제한 supportive를 `optionalPlus`로만 표현했다.
- 위험물은 EHS 화학물질/위험물 관리 맥락이 없으면 direct로 승격하지 않기 위해 `optionalPlus`에만 뒀다.
- 전기산업기사는 설비 맥락에서 제한 plus로만 두고 전기기사를 direct substrate로 고정했다.
<!-- PASSMAP_MANUFACTURING_TIER1_CERT_ASSET_EXPANSION_END -->

<!-- PASSMAP_AXIS1_RENDER_QUALITY_QA_START -->
## 2026-04-05 Newgrad Axis 1 Render Quality QA

### true owner 정리
- Axis 1 summary/detail true owner는 `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()`이다.
- `TransitionLiteResult.jsx`는 `axis.explanation.summary`와 `axis.explanation.positives/gaps`를 render만 하고 score 해석은 하지 않는다.
- fallback narrative는 explanation unavailable일 때만 `getAxisScoreNarrative()`가 살아 있다.

### signal-copy path 정리
- `majorLinkType`: detail만 사용
- `projectDirectCount`: detail 분기 조건만 사용
- `projectBestLinkType`: detail 분기 조건만 사용
- `internshipLinkType`: detail 분기 + summary tuning 조건에 사용
- `primaryEvidenceSource`: 이전에는 dead, 이번 라운드에서 summary tuning에 연결

### 이번 라운드에서 손본 리스크
- presence echo: "전공 관련 배경이 있습니다", "프로젝트 경험이 있습니다", "인턴 경험이 있습니다" 같은 반복을 완화했다.
- owner mismatch: richer context가 있어도 summary가 너무 정적이던 문제를 줄였다.
- overclaim: `industry_only` 인턴은 여전히 직무 direct처럼 읽히지 않게 유지했다.

### 안 건드린 범위
- scoring 의미 없음
- signal shape 재변경 없음
- Axis 2 없음
- `getAxisScoreNarrative` 제거 없음
<!-- PASSMAP_AXIS1_RENDER_QUALITY_QA_END -->
### 2026-04-05 SAFE PATCH - NEWGRAD AXIS 2 SIGNAL APPEND-ONLY UPGRADE

#### 수정 분류
- SAFE PATCH
- producer-side only
- no scoring change
- no consumer/UI change

#### 왜 필요했는가
- `scoreDomainInterest()`는 `majorAligned`, cert direct relevance, project support, context strength를 이미 계산하고 있었지만 Axis 2 signals에는 presence/count만 내려가고 있었다.
- 그 결과 builder가 aligned vs unaligned를 구분하지 못했고, `projectCount = 전체 프로젝트 수`를 `"산업 관련 프로젝트"`로 읽는 critical overclaim이 발생했다.
- low/mid_low 구간에서는 summary가 약함/부족 톤인데 gaps가 비는 충돌도 있었다.

#### 추가 signal
- `majorAligned`
- `certificationsAligned`
- `certDirectCount`
- `projectIndustrySupportCount`
- `weakProjectSignal`
- `internContextStrength` (`strong` / `support` / `none`)
- `strongContextCount`
- `supportContextCount`
- `contextAligned`

#### 포함된 hotfix
- `"산업 관련 프로젝트 경험이 있습니다."` 오표현 제거
- 이제 `projectIndustrySupportCount > 0`일 때만 산업 관련 프로젝트를 positive로 언급한다.

#### 다음 우선순위
- CASE A~F narrative QA를 한 번 더 좁게 확인
- Axis 3 진입 전 Axis 2 copy 품질과 summary/gap 충돌 재점검
### 2026-04-05 SAFE QA + SAFE INVESTIGATION - NEWGRAD AXIS 2 RENDER QA / AXIS 3 PRECHECK

#### classification
- SAFE QA
- SAFE INVESTIGATION
- source patch 없음
- consumer/UI 변경 없음
- scoring 변경 없음

#### Axis 2 QA verdict
- verdict: `CONTRACT STILL THIN`
- owner map 재확인
  - score owner: `buildNewgradAxisPack.js > scoreDomainInterest()`
  - signals owner: `buildNewgradAxisPack.js > const _domainInterest = makeAxis(...)`
  - explanation owner: `axisExplanationRegistry.js > buildNewgradDomainInterestExplanation()`
  - render owner: `TransitionLiteResult.jsx` pass-through
- append-only signal wiring 자체는 정상
  - `majorAligned`
  - `certificationsAligned`
  - `certDirectCount`
  - `projectIndustrySupportCount`
  - `weakProjectSignal`
  - `internContextStrength`
  - `strongContextCount`
  - `supportContextCount`
  - `contextAligned`
- QA 핵심 결과
  - count-only echo는 줄었고 builder는 새 signal을 실제로 읽는다.
  - `"산업 관련 프로젝트"` overclaim 문구는 출력되지 않았다.
  - 다만 실제 UI visible option 기준 재생에서 `projectIndustrySupportCount`가 0으로만 나왔고, internship stakeholder 옵션 5종도 모두 `support`만 만들어 `strong` branch가 사용자 화면에서 재현되지 않았다.
  - common major text 테스트에서는 `ai`만 `majorAligned=true`로 잡혔고 일반적인 컴퓨터/소프트웨어 계열 문자열은 정렬되지 않았다.
- 판단
  - builder contract는 좋아졌지만 scorer-side rich branch가 실제 사용자 입력에서 충분히 살아나지 않아 Axis 2를 안정화 완료로 보기는 어렵다.

#### Axis 3 precheck verdict
- verdict: `SIGNAL APPEND-ONLY UPGRADE NEEDED`
- owner map
  - score owner: `buildNewgradAxisPack.js > scoreExecutionDepth()`
  - signals owner: `buildNewgradAxisPack.js > const _execDepth = makeAxis(...)`
  - explanation owner: `axisExplanationRegistry.js > buildNewgradExecutionDepthExplanation()`
  - render owner: `TransitionLiteResult.jsx` pass-through
- 구조 판단
  - scorer는 `projectOutcomeLevels`, `experienceDurations`, project+intern combo를 읽고 semantic lift를 계산한다.
  - builder는 `projectCount`, `internshipCount`, `extracurricularCount`, `partTimeCount`만 받는다.
  - 즉 score owner가 아는 결과/기간 맥락이 explanation으로 내려오지 않는다.
- QA 핵심 결과
  - low case에서 summary는 부족 톤인데 positives만 있고 gaps가 비는 충돌이 바로 재현됐다.
  - mid/high도 detail이 row를 거의 반복하며 why가 아니라 count presence를 말한다.
- 다음 우선순위
  - Axis 2 micro wording보다 먼저, Axis 2 scorer/UI enum reachability와 Axis 3 signal loss 중 무엇을 먼저 다룰지 잠가야 한다.
  - 현재 우선순위 권고는 `Axis 3 signal append-only predesign`보다 `Axis 2 reachability mismatch 확인`이 먼저다.
### 2026-04-05 SAFE INVESTIGATION - NEWGRAD AXIS 2 REACHABILITY MISMATCH CHECK / AXIS 3 READINESS LOCK

#### classification
- SAFE INVESTIGATION
- no source patch
- no scoring change
- no consumer change

#### Axis 2 reachability root cause
- project
  - current UI project type enum and `_WEAK_PROJECT_TYPES` are exact-match aligned
  - normalized project items keep `type` as-is
  - branch is reachable: all project types except `수업 팀프로젝트` hit `projectIndustrySupportCount > 0`
  - root cause: previous replay/input choice problem, not enum mismatch
- internship/context
  - current UI stakeholder enum and `_DIRECT_STAKEHOLDERS` are exact-match aligned
  - normalized internship/contract items keep `stakeholderType` as-is
  - branch is reachable: `고객 / 사용자`, `외부 파트너` hit `internContextStrength = strong`
  - root cause: previous replay/input choice problem, not normalization loss
- major
  - UI major is selected from fixed subcategory options, then normalized by `normalizeMajor()` into plain label text
  - no structural loss beyond choosing `label || subcategory || category`
  - practical aligned replay exists with current UI options
    - IT: `컴퓨터공학`, `소프트웨어`, `전자 / 전기`
    - FIN: `경영학`, `경제학`, `회계 / 세무`, `금융`
    - MFG: `산업공학`, `전자 / 전기`
  - root cause: previous manual replay sample issue, not `ai`-only narrowness

#### Axis 2 reachability status
- verdict: `REACHABILITY OK`
- explanation quality verdict and reachability verdict must now be separated
- previous "thin" read was caused mainly by replay mismatch, not current UI->scorer disconnection

#### Axis 3 readiness verdict
- verdict: `READY FOR AXIS 3 APPEND-ONLY DESIGN`
- why
  - Axis 2 UI/scorer link is not broken
  - Axis 3 still has confirmed score/builder context loss
  - delaying Axis 3 would not reduce current main uncertainty further

#### next priority
- next round should move to Axis 3 append-only signal design
- likely owners
  - `src/lib/analysis/buildNewgradAxisPack.js`
  - `src/data/transitionLite/axisExplanationRegistry.js`

## 2026-04-05 Newgrad 5-Axis Owner Investigation

- true owner 요약
  - Axis 1 `전공과 직무의 연결성` score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()`
  - Axis 1 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()`
  - Axis 2 `산업 연관성` score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreDomainInterest()`
  - Axis 2 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradDomainInterestExplanation()`
  - Axis 3 `유사한 경험이 있는가?` score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreExecutionDepth()`
  - Axis 3 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradExecutionDepthExplanation()`
  - Axis 4 `고객 커뮤니케이션 적합성` score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreInteractionFit()`
  - Axis 4 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradInteractionFitExplanation()`
  - Axis 5 `강점과 재능` score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreSoftSkillMatch()`
  - Axis 5 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradSoftSkillMatchExplanation()`
- UI/render owner
  - `src/lib/transitionLite/buildNewgradTransitionLiteResult.js > buildNewgradTransitionLiteResult()`가 `axisPack`을 VM에 실어 보낸다.
  - `src/components/report/TransitionLiteResult.jsx`가 `axisPack.axes.*`를 순서대로 렌더한다.
  - 상세보기/보완포인트는 `axis.explanation.positives / gaps`를 그대로 렌더한다.
- current overlap risk
  - Axis 1 vs Axis 3: high
  - Axis 2 vs Axis 4: medium
  - Axis 4 vs Axis 5: medium
- next recommended design decision
  - 축 정의 변경 owner는 `buildNewgradAxisPack.js`로 단일화한다.
  - 설명 변경 owner는 `axisExplanationRegistry.js`로 단일화한다.
  - UI는 consumer-only 원칙을 유지한다.

## 2026-04-05 Newgrad 5-Axis Definition Boundary Lock

- current implemented axis meaning
  - Axis 1: 직무 관련 학업/역할 연결성
  - Axis 2: 산업 관련 준비/맥락 연결성
  - Axis 3: 실전 경험량 + 결과/기간 기반 깊이
  - Axis 4: 대인 상호작용/소통 경험
  - Axis 5: 개인 강점/업무스타일
- recommended axis boundary
  - Axis 1은 role fit only
  - Axis 2는 industry context only
  - Axis 3은 execution depth only
  - Axis 4는 interpersonal evidence only
  - Axis 5는 intrinsic trait only
- highest-priority conflict pair
  - Axis 1 vs Axis 3
  - 이유: 동일 source(`projects`, `internships`)를 읽되 score 의미가 가장 크게 갈라져야 한다.
- next single safe step
  - Axis 1 include/exclude evidence를 필드 단위로 먼저 SSOT화한다.
## 2026-04-06 SAFE INVESTIGATION ONLY - newgrad practical-experience engine/detail audit

### 조사 목적
- 실전 경험 입력이 점수에만 반영되는지, explanation payload와 detail render까지 살아가는지 추적했다.

### 확정된 결론
- Axis 1, 2, 3, 4
  - score 반영 확인
  - explanation payload 반영 확인
  - detail render 반영 확인
- Axis 5
  - 실전 경험 direct read 없음

### detail render 관련 확정 사항
- consumer owner: `src/components/report/TransitionLiteResult.jsx`
- detail render는 아래만 사용
  - `explanation.summary`
  - `explanation.positives`
  - `explanation.gaps`
  - `explanation.selfReportSupportLine`
  - `explanation.selfReportHighlights`
- `explanation.reasons[]`는 미표시

### loss 판단
- scorer loss
  - exact selected field value를 signal로 거의 보존하지 않음
- explanation loss
  - field-level 근거를 generic 문장으로 축약
- render loss
  - `reasons[]` 미표시

### taxonomy / asset 판단
- newgrad practical-experience canonical taxonomy / registry / mapping asset 부재 확인
- current runtime는 UI label + scorer internal hardcoded string / Set / map 결합 구조

### 이번 라운드 범위
- source patch 없음
- scorer patch 없음
- render patch 없음
- 문서 기록만 수행
## 2026-04-06 SAFE INVESTIGATION ONLY - newgrad Axis 1 major dependency precheck
### classification
- SAFE INVESTIGATION ONLY
- no source patch
- no UI patch
- no score change
- no copy change
### decision
- Axis 1? true score owner? scoreJobFit()?? ????.
- major importance ??? UI? ??? scorer owner?? ????.
- explanation owner? scorer verdict? ???? layer?? ????.
### true owner
- score owner: src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()
- explanation owner: src/data/transitionLite/axisExplanationRegistry.js > buildNewgradJobFitExplanation()
- render owner: src/components/report/TransitionLiteResult.jsx > TransitionLiteResult()
### confirmed current contract
- major prior owner? src/data/transitionLite/newgradAxis1MajorPriorRegistry.js > resolveNewgradAxis1MajorPrior()
- resolved verdict? direct | adjacent | weak | mismatch
- Axis 1 scorer final score flow
  - repeated direct role evidence -> 5
  - single direct role evidence -> 4
  - adjacent role evidence -> 3 or 2 depending on major prior relevance
  - major prior only -> 3 or 2
  - no linkage but project/internship/coursework presence -> fallback 2
  - else 1
- band/display owner? makeAxis() ?? ?? mapping??.
  - scoreToBand(5..1) -> high / mid_high / mid / low / very_low
  - scoreToDisplayScore(5..1) -> 100 / 80 / 60 / 40 / 20
### why registry-first
- ?? taxonomy ?? ??? input/options/normalization/prior registry? ??? ??? blast radius? ??.
- ??? jobMajorDependencyRegistry? target job id ?? scorer-side lookup? ???? ??? ?? ?????.
- ??? Round 2? taxonomy ???? registry-first? ??.
### why UI patch is blocked
- ???? ??? ?? producer payload? ??? ?? ???.
- UI? ?? high-major / low-major ??? ??? producer-owner contract? visible copy? ????.
- ? ?????? UI ???? ????.
### why hard floor is blocked
- high-major ???? major mismatch? hard floor? ??? ?? ???? project / internship recovery path? ?? ??.
- Axis 1? major mismatch?? ?? ?? ??? ???? ??.
- penalty? ????? hard floor? ????.
### round 2 lock
- safe registry file candidate: src/data/transitionLite/jobMajorDependencyRegistry.js
- minimum new scorer signals candidate
  - jobMajorDependency
  - majorMatchLevel
  - majorWeightApplied
  - majorImportanceReason
  - majorImpactSummary
- non-goal
  - build file? job? if? ?? ????
  - UI ? ??
  - major mismatch hard floor
## 2026-04-06 SAFE PATCH - newgrad Axis 1 job major dependency registry/scorer/explanation lock

### why this structure is drift-safe
- score 정책은 `scoreJobFit()`에만 둔다.
- explanation은 registry를 재조회하지 않고 scorer signal만 번역한다.
- UI는 explanation payload를 render만 하므로 score/explanation/render가 분리되지 않는다.

### true owner decision
- true owner는 `src/lib/analysis/buildNewgradAxisPack.js > scoreJobFit()`이다.
- 이유: Axis 1 최종 점수와 `rawScore/band`가 여기서 생산된다.
- `resolveNewgradAxis1MajorPrior()`는 upstream prior owner이지 final score owner가 아니다.

### policy decision
- high-major 직무라도 hard floor는 금지한다.
- 이유: direct project/intern recovery path를 깨면 기존 Axis 1 contract가 무너진다.
- explanation도 같은 이유로 hard-fail tone을 쓰지 않는다.

### current patch shape
- registry file 분리
- scorer signal append-only
- explanation pass-through translation only
- UI unchanged

### fallback policy
- 미등록 canonical id는 `medium`으로 처리한다.
- canonical id를 확신할 수 없는 경우 추정하지 않고 fallback으로 보낸다.

## 2026-04-06 SAFE QA / CALIBRATION REVIEW - newgrad Axis 1 registry-first review

### registry-first 접근이 여전히 맞는 이유
- 이번 QA에서도 주요 질문은 taxonomy 확장이 아니라 현재 behavior가 의도대로 작동하는지였다.
- 실제 이슈 포인트는 high/medium/low weighting 감각, recovery path, explanation drift 여부였고, taxonomy 확장과는 별개였다.
- 따라서 registry-first로 score owner 주변만 잠근 선택이 여전히 맞다.

### scorer-only weighting 구조가 drift 방지에 유리한 이유
- weighting verdict는 `scoreJobFit()`에서만 결정된다.
- explanation은 `majorWeightApplied`, `majorImpactSummary`, `majorImportanceReason`만 번역한다.
- UI는 summary/positives/gaps/reasons를 render만 하므로 score/explanation/render owner가 뒤섞이지 않는다.

### explanation 번역-only 구조가 필요한 이유
- explanation이 registry나 score policy를 다시 해석하면 같은 입력에 score와 문장이 다른 결론을 낼 수 있다.
- 이번 QA에서 high mismatch case도 score는 recovery되고 explanation은 불리하지만 복구 가능 톤을 유지했다.
- 이 일관성은 translation-only 구조 덕분이다.

### immediate retune 필요 여부
- immediate retune: 보류
- 이유
  - high mismatch recovery path는 이미 의도대로 살아 있다.
  - low mismatch는 치명적으로 보이지 않는다.
  - fallback medium도 정상이다.
  - 다만 high adjacent와 medium direct 체감은 later candidate 수준의 calibration 검토 가치는 있다.
## 2026-04-06 Decision - calibration candidate review before retune

### immediate retune보다 candidate review가 더 안전한 이유
- 현재 patch는 명백한 bug 없이 의도한 contract를 지키고 있다. existing verdict 재사용, recovery path 유지, explanation translation-only, UI pass-through가 모두 살아 있다.
- 이 상태에서 바로 score retune을 열면, 실제 정책 문제와 fixture 품질 문제를 구분하지 못한 채 contract를 다시 흔들 가능성이 높다.
- 특히 high adjacent / medium direct는 숫자 policy만의 문제가 아니라 base branch, prior fixture, explanation 체감이 함께 얽혀 있다.

### score contract를 성급히 흔들지 않는 이유
- high direct는 이미 의도대로 작동하고 있다.
- high mismatch + strong evidence recovery도 정상이다. 즉 hard floor가 없고 복구 경로가 살아 있다는 가장 중요한 정책이 유지된다.
- low mismatch도 치명적으로 작동하지 않는다.
- 따라서 지금 필요한 것은 대공사나 즉시 retune이 아니라, 어떤 candidate가 실제로 열 가치가 있는지 좁히는 작업이다.

### fixture formalization을 먼저 여는 이유
- 이번 QA에서도 direct/adjacent 해석은 fixture label 품질에 크게 좌우되었다.
- 예를 들어 software/data 계열은 사람이 직관적으로 생각하는 direct 전공과 prior registry가 실제로 direct로 읽는 label이 다를 수 있다.
- 이 상태에서 retune을 먼저 하면, 잘못된 fixture를 기준으로 점수 정책을 건드리는 drift가 발생한다.
- 따라서 다음 라운드에서 바로 재실행 가능한 fixture doc을 먼저 잠그는 것이 더 안전하다.

### 현재 판정
- high adjacent: later candidate
- medium direct: later candidate
- low tier: keep
- immediate retune: not recommended
- next smallest patch, if opened: explanation copy micro tune first, scorer retune second

## 2026-04-16 DECISIVE PATCH - HQ/Execution 문서 루트 정리

### 조사 결론
- 루트 00_HQ/, 05_Execution/와 docs/00_HQ/, docs/05_Execution/는 같은 이름의 파일 중복이 아니라, 같은 카테고리 이름 아래 서로 다른 문서 세트가 분리 운영된 상태였다.
- 루트 쪽은 SSOT_Map.md, Session_Handoff_Latest.md, Decision_Log.md 등 실제 운영 precheck / handoff / 의사결정 문서를 포함하고 있었고, 다수의 기존 문서가 루트 경로를 직접 참조했다.
- docs/00_HQ, docs/05_Execution 쪽은 preciseAnalysis 문서군이었지만, 내부 문서들 스스로도 같은 카테고리 경로를 docs/... 기준으로 재참조하고 있어 경로 드리프트가 누적되고 있었다.

### 실행 결정
- canonical HQ 루트: 00_HQ/
- canonical Execution 루트: 05_Execution/
- preciseAnalysis 문서군을 각각 위 canonical 루트로 이동했다.
- 동일 이름 충돌 파일은 없어서 내용 병합은 발생하지 않았고, 경로 참조만 일괄 정리했다.

### 후속 운영 규칙
- 이후 HQ 문서는 00_HQ/에만 생성/수정한다.
- 이후 Execution 문서는 05_Execution/에만 생성/수정한다.
- docs/ 아래에는 HQ/Execution 카테고리 루트를 다시 만들지 않는다.
- 작업 메모와 커뮤니케이션 문서는 계속 docs/끄적.md, docs/COMM_PATCH_NOTES.md를 사용한다.
## 2026-04-16 SAFE DOC UPDATE - newgrad Axis 1 adjacent rescue / exception layer

### What
- Axis 1 score owner를 major-centric base scoring으로 유지한 채, high-frequency under-score 조합만 `majorCategory-level exception adjustment`로 보정한 현재 설계를 문서로 잠갔다.
- base matrix는 그대로 두고 `override(+1)`와 별도로 `exceptionAdjustment(+1)`를 추가했다.
- 대표 보정 조합은 `COMPUTER_SCIENCE|SOFTWARE -> BUSINESS`, `BUSINESS_ADMIN -> IT_DATA_DIGITAL`, `ECONOMICS|FINANCE -> SALES`다.
- explanation은 `unknown_major_fallback`, `major_override_applied`, `major_exception_adjusted`, `major_double_selected` 신호를 읽도록 확장됐다.

### Why
- 전체 matrix 재작성 대신 예외 보정층을 선택한 이유:
  - 현재 22x14 base matrix는 이미 광범위한 전공/직무 기본 방향성을 담고 있고, 이번 라운드에서 확인된 문제는 전체 표의 실패가 아니라 일부 high-frequency weak 과소평가였다.
  - 전면 재작성은 direct/adjacent/weak 경계를 전역적으로 흔들어 회귀 범위를 불필요하게 키운다.
  - 예외 보정층은 under-score 조합만 국소적으로 adjacent 쪽으로 올릴 수 있어 변경 이유와 결과를 설명하기 쉽다.
- direct 확대가 아니라 adjacent 구제를 선택한 이유:
  - 이번 라운드에서 확인된 대표 케이스는 `weak -> adjacent` 과소평가 보정이지 `adjacent -> direct` 승격 근거가 아니었다.
  - direct를 쉽게 늘리면 전공 단서만으로 직무 적합성을 과장하게 되고, 축1 설명 톤도 과도하게 강해질 위험이 있다.
  - 큰 원칙은 direct 남발이 아니라 adjacent rescue다.
- dependencyTier 재분류를 별도 라운드로 분리한 이유:
  - 현재 score 흐름에서 `dependencyTier`는 prior 결과 해석 강도에 직접 영향 주는 별도 축이다.
  - prior matrix 수정과 dependencyTier 재분류를 같은 라운드에 섞으면 원인 분리가 어려워진다.
  - 이번 라운드는 prior 계산과 explanation signal lock까지만 닫고, dependencyTier는 다음 우선순위로 남겼다.
- 복수전공/미등록전공을 구조 문제로 본 이유:
  - 복수전공은 `resolveNewgradAxis1MajorPriorBest()` 인프라가 있으나 active payload/UI callsite가 단일 전공 기준이라 실제 계약 연결 여부가 미확정이다.
  - 미등록전공은 weak fallback을 유지하고 있어 score보다 explanation transparency가 더 중요한 상태다.
- explanation signal 확장이 필요한 이유:
  - 이번 라운드부터 prior가 `base/override/exception/fallback/double_major`로 세분화되었기 때문에, explanation이 이 차이를 읽지 못하면 같은 adjacent라도 왜 그렇게 나왔는지 전달할 수 없다.
  - score는 유지하면서 설명 가능성을 높이기 위해 signal만 append-only로 늘리는 편이 가장 보수적이다.

### Not Changed
- 22x14 base matrix 전체 구조는 재작성하지 않았다.
- `toPriorLabel()` 임계값은 바꾸지 않았다.
- direct 판정 기준은 넓히지 않았다.
- Axis 1과 Axis 3의 boundary contract는 유지했다.
- dependencyTier 분류 로직은 이번 라운드에서 수정하지 않았다.

### Risks
- 현재 under-score 구제는 exception adjustment로 닫혔지만, dependencyTier가 실제 직무 체감과 어긋나면 score/explanation 체감 불일치는 여전히 남을 수 있다.
- double major 인프라는 구현돼 있어도 payload/UI 연결이 안 되어 있으면 실제 사용자 경로에서는 inactive일 수 있다.
- unknown major fallback은 보수적 유지가 맞지만, 문구만 추가된 상태라 사용자 체감이 충분한지는 후속 확인이 필요하다.

### Next
- `jobMajorDependencyRegistry` 재분류 라운드
- double major payload/UI 계약 확인 라운드
- representative fixture 문서화와 QA 재실행

## 2026-04-17 newgrad Axis 1 read path major-only 정렬 — producer 패치 선택 이유

### What
- `buildNewgradTransitionLiteResult.js`의 3개 FromPacks read path 함수에서 project/internship 신호가 축1(jobStructure) 설명/요약에 노출되던 누수를 제거했다.
- 수정 함수: `buildNewgradWhyThisReadFromPacks()`, `buildInputEvidenceReadFromPacks()`, `buildAxisReadSummaryFromPacks()`

### Why: consumer 봉합이 아니라 producer/read-path 정렬을 선택한 이유
- consumer(`TransitionLiteResult.jsx`)에서 축1 항목을 숨기거나 필터링하는 방식은 producer 계약 위반을 감추는 임시 조치다.
- axisReadSummary / inputEvidenceRead / whyThisRead는 producer가 내용을 결정하는 구조다. consumer는 단순 렌더다.
- producer 계약을 major-only로 정렬하면 consumer 변경 없이 모든 노출 경로가 함께 고쳐진다.
- 범위 통제: 1파일, 3개 함수, consumer 미수정이 가장 작고 안전하다.

### Why: old version helper를 이번 라운드에서 미수정한 이유
- `buildAxisReadSummary()`와 `buildInputEvidenceRead()` (non-FromPacks 버전)는 현재 런타임에서 호출되지 않는다.
- 런타임 미호출 함수를 동시에 수정하면 범위가 넓어지고 실제 사용자 경로에 영향이 없다.
- 향후 호출 경로가 생길 경우에 정리하는 것이 더 보수적이다.

### Not Changed
- `scoreJobFit()`, `_buildJobFitBaseScore()`, `_applyJobMajorDependencyToJobFit()` (점수 로직)
- `TransitionLiteResult.jsx` (consumer)
- axis2~5

### Risks
- old version helper 누수 패턴이 향후 호출 경로 추가 시 재발 가능
- bash 환경 node 미설치로 빌드 자동화 검증 불가, 사용자 환경 직접 빌드 확인 필요

---

## 2026-04-17 Round 6 — dependencyTier 조사 범위 및 mojibake 패치 선택 근거

### 왜 이번 라운드에서 dependencyTier 재분류를 하지 않았는가
- medium/low 티어는 실제 점수에 영향이 없음을 확인 (majorWeightApplied 레이블만 변경).
- FINANCE_ACCOUNTING 직군 HIGH 승격이 합리적이나, job ontology의 exact job ID를 읽지 않고 append하면 silent mismatch 위험.
- job ontology 확인 없이 ID를 추측해서 추가하는 것은 "추정으로 수정" 금지 원칙 위반.

### 왜 복수전공 live path 연결을 이번 라운드에서 하지 않았는가
- UI에 secondMajor 입력 필드 자체가 없음. UI 신규 필드 없이는 payload에 secondMajor 키가 들어올 수 없음.
- UI 신규 필드 추가는 이번 라운드 허용 범위(1파일, 국소 수정)를 초과.
- 한 라운드 한 목적 규칙 적용.

### 왜 _buildJobMajorImpactSummary mojibake 패치를 선택했는가
- 6개 문자열이 `axisExplanationRegistry.js:969`의 majorImpactSummary concat 경로를 통해 사용자 리포트에 직접 노출됨이 확인됨.
- 로직/브랜치/반환 구조 변경 없이 문자열 리터럴 6개 교체만으로 해결 가능.
- 파일 1개, 함수 1개, 6행 수정. 허용 범위 내.
- explanation consumer 보강 조건(Condition C) 충족: signal은 있으나 문자열이 깨져 user-facing 문구가 누락되는 상태.

### Not Changed
- `scoreJobFit()`, `_applyJobMajorDependencyToJobFit()` — 점수 로직 무변경
- `jobMajorDependencyRegistry.js` — tier 재분류 미수행
- `newgradAxis1MajorPriorRegistry.js` — base matrix / override / exception 무변경
- UI 컴포넌트 — 무변경
- 복수전공 callsite — 무변경

### Risks
- `_buildJobMajorImpactSummary` 원본 Korean text를 복원하지 못하고 의미 동등 copy로 대체함. 원본 의도와 미세 차이 가능성 있음.
- FINANCE_ACCOUNTING HIGH tier 미등록 상태 유지 → 해당 직군 사용자 최대 점수 4 (5가 되어야 할 경우 존재).

## 2026-04-19 SAFE INVESTIGATION ONLY - Axis1 미확정 3건 최종 판정
- 신규 코드 패치 없음. 조사/판정/문서화만 수행.

### owner 확인
- major prior / base / override: `src/data/transitionLite/newgradAxis1MajorPriorRegistry.js`
- dependencyTier: `src/data/transitionLite/jobMajorDependencyRegistry.js`
- live scorer path: `src/lib/analysis/buildNewgradAxisPack.js`
- ontology 근거:
  - `src/data/job/ontology/manufacturing_quality_production/production_management.js`
  - `src/data/job/ontology/manufacturing_quality_production/manufacturing_innovation.js`

### 판정 업데이트
- `PRODUCTION_MANAGEMENT` -> `C`
  - base는 MANUFACTURING_QUALITY_PRODUCTION이며 IE는 이미 direct(3)다.
  - HIGH 승격 시 IE direct +1보다 weak/mismatch -1 리스크가 더 커진다.
  - ontology상 생산계획/현장운영/공정개선/조정이 섞인 운영형이라 전공 직결 HIGH로 보기 어렵다.
- `MANUFACTURING_INNOVATION` -> `C`
  - base는 MANUFACTURING_QUALITY_PRODUCTION이며 IE는 이미 direct(3)다.
  - ontology상 Lean/Six Sigma, 디지털화, 표준화, transformation이 함께 묶인 개선/혁신형이라 경험·방법론 성격이 강하다.
  - HIGH 승격은 축1을 경험축처럼 오염시킬 가능성이 있어 부적절하다.
- `MEDIA override (CONTENT_MARKETING, PR_COMMUNICATIONS)` -> `정리 후보`
  - MEDIA -> MARKETING base가 이미 3이어서 override +1은 final capped 3으로 no-op이다.
  - override 존재 자체는 확인되지만 current live path 실효성은 없다.

### 결론
- 이번 라운드에서 즉시 적용할 patch 없음.
- 두 제조 직무는 구조 패치가 아니라 explanation-only 관리 대상으로 분리.
- MEDIA override는 후속 정리 라운드에서 제거 여부만 검토.
