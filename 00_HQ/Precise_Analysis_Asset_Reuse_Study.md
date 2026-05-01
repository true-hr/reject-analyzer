# Precise Analysis Asset Reuse Study

## 문서 목적

preciseAnalysis를 완전히 새 제품처럼 계속 덧대기보다, PASSMAP 내부에 이미 존재하는 입력 자산, 설명 자산, 결과 UI shell, 구조화 데이터, 테스트 운영 규칙을 우선 재활용할 수 있는지 조사한다.  
핵심 목표는 새로 만들지 않아도 되는 범위를 실제로 줄이고, 어떤 자산은 즉시 붙일 수 있고 어떤 자산은 어댑트가 필요한지 owner/연결 위치/위험도까지 닫는 것이다.

## 조사 범위

- 입력 자산: `InputFlow`, `JDInput`, `ResumeInput`, `UploadPanel`, `extractTextFromFile`, `parseWithAI`, `buildJdResumeFit`
- 결과 화면 자산: report 카드 shell, 설명 패널, CTA, share copy/panel
- 해석/설명 자산: transition-lite explanation registry, risk explanation pack, 상세보기 구조
- 구조화 데이터 자산: ontology, capability registry, role/industry lookup, candidate axis pack 계열
- 운영/문서 자산: SSOT, gold set, QA framework, 테스트 규칙, share/restore 분리 운영

## 조사 기준

- `즉시 재활용 가능`: preciseAnalysis에 이미 직접 연결되어 있거나, 새로운 엔진 설계 없이 owner 유지 상태로 바로 재사용 가능한 자산
- `소규모 어댑트 후 활용 가능`: 연결 포인트는 명확하지만 얇은 어댑터나 risk-key bridge가 필요한 자산
- `장기 후보`: 연결 가능성은 크지만 현재 preciseAnalysis의 text-first 계약과 맞지 않아 지금 붙이면 오히려 시스템 경계가 흐려지는 자산

## 자산군 분류

| 자산군 | 대표 owner 파일 | preciseAnalysis 연결 관점 |
|---|---|---|
| 입력/추출 | `src/components/input/InputFlow.jsx`, `src/lib/extract/extractTextFromFile.js`, `src/lib/parse/parseWithAI.js`, `src/lib/fit/jdResumeFit.js` | JD/Resume 수집, 추출, 정규화 SSOT |
| 결과 UI shell | `src/components/input/PreciseAnalysisFlow.jsx`, `src/components/report/TransitionLiteResult.jsx`, `src/App.jsx` | 카드 구조, 설명 패널, CTA, share panel |
| 설명/근거 | `src/data/transitionLite/axisExplanationRegistry.js`, `src/lib/explanation/buildExplanationPack.js` | summary/positives/gaps/reasons 구조, userReason/interviewerView/actionHint |
| 구조화 데이터 | `src/lib/adapters/buildJobContext.js`, `src/lib/analysis/buildCandidateAxisPack.js`, `src/data/transitionLite/capabilityRegistry.js`, `src/data/job/jobLookup.index.js` | related experience, role-family proximity, domain/context 보조 신호 |
| 운영/문서 | `00_HQ/Precise_Analysis_Test_System.md`, `docs/ENGINE_TEST_RULES.md`, `05_Execution/Precise_Analysis_QA_Log.md` | 테스트 ID, layer 분리, share/restore 별도 트랙 |

## A. 즉시 재활용 가능

| 자산 | owner 파일 | preciseAnalysis에서 붙일 위치 | 재활용 방식 | 기대 효과 | 위험도 |
|---|---|---|---|---|---|
| 업로드/추출 SSOT | `src/components/upload/UploadPanel.jsx`, `src/lib/extract/extractTextFromFile.js` | 입력 단계 파일 업로드 | 이미 preciseAnalysis input에서 사용하는 공용 업로드/추출 흐름을 유지하고, 새 업로드 플로우를 만들지 않는다 | 업로드 UX와 추출 실패 처리 일관성 유지 | 낮음 |
| AI 파싱 스키마 | `src/lib/parse/parseWithAI.js` | JD/Resume parsed payload 생성부 | `emptyParsed`, JD `mustHave/preferred/domainKeywords`, Resume `timeline/gaps/transitionNarrative` 스키마를 계속 SSOT로 사용 | 파서 shape 중복 방지, 디버깅 기준점 고정 | 낮음 |
| JD/Resume 정규화 SSOT | `src/lib/fit/jdResumeFit.js` | preciseAnalysis 엔진 입력 전 정규화 | `fit.jdModel.mustHave`, `fit.jdModel.domainKeywords`, `fit.jdModel.experienceYears`, `fit.resume.structured.employmentPeriods`를 그대로 재사용 | 새 normalize 레이어 생성 방지, extraction-logic drift 축소 | 낮음 |
| share copy/panel 인프라 | `src/App.jsx` | 결과 공유, 복원, share bottom sheet | `buildSharePackV1`, `getCurrentShareCopySet`, `precise-analysis` 분기를 공용 인프라로 계속 사용 | preciseAnalysis 전용 공유 시스템 신설 방지 | 낮음 |
| 결과 CTA 패턴 | `src/components/report/TransitionLiteResult.jsx`, `src/components/input/PreciseAnalysisFlow.jsx` | 결과 하단 CTA 블록 | transition-lite에서 검증된 `mini / EMERGENCY / MASTER CLASS` 카드 구조를 preciseAnalysis에서도 동일 패턴으로 재사용 | 후속 행동 유도 구조를 새로 설계하지 않아도 됨 | 낮음 |
| 설명 payload 계약 | `src/data/transitionLite/axisExplanationRegistry.js` | risk 상세 패널 데이터 형태 | axis 점수는 가져오지 않되 `summary / positives / gaps / reasons / detailVersion` 구조는 상세 설명 shell 계약으로 즉시 재활용 가능 | “왜 이런 결과가 나왔는지”를 카드 단위로 정돈해서 보여주기 쉬움 | 낮음 |
| 테스트 운영 규칙 | `00_HQ/Precise_Analysis_Test_System.md`, `docs/ENGINE_TEST_RULES.md`, `05_Execution/Precise_Analysis_QA_Log.md` | 테스트 케이스 작성, regression 관리 | layer 분리, `PA-{LAYER}-{ENGINE}-{PURPOSE}-{NNN}` ID 규칙, share/restore 별도 트랙을 그대로 사용 | QA 체계 새 설계 불필요, 회귀 관리 속도 향상 | 낮음 |

## B. 소규모 어댑트 후 활용 가능

| 자산 | owner 파일 | preciseAnalysis에서 붙일 위치 | 어떤 부분을 바꿔야 하는지 | 왜 바로는 못 붙이는지 | 기대 효과 |
|---|---|---|---|---|---|
| parsed fields 수정 shell | `src/components/parse/ParsedFieldsPanel.jsx` | 내부 QA/debug 보정 패널 | preciseAnalysis debug 전용 노출 조건과 읽기 전용/편집 가능 경계를 추가해야 한다 | 현재는 칩 편집 UI라 일반 결과 화면에 그대로 노출하기엔 과함 | 파싱 실패 원인 확인과 수동 보정 검수 속도 상승 |
| risk explanation copy pack | `src/lib/explanation/buildExplanationPack.js` | risk 카드 설명/행동 힌트 | preciseAnalysis risk key와 legacy risk id를 잇는 얇은 브리지 테이블이 필요하다 | 현재 registry는 report/transition-lite 계열 risk id 기준이라 preciseAnalysis risk id와 1:1 매핑이 아니다 | userReason/interviewerView/actionHint의 밀도를 빠르게 끌어올릴 수 있음 |
| 상세보기/accordion shell | `src/components/report/TransitionLiteResult.jsx` | preciseAnalysis risk 상세보기 카드 | comparison table, mobile row wrapper, buying motion panel 의존부를 떼고 shell만 분리해야 한다 | 현재 구현은 transition-lite 전용 구조와 강하게 결합돼 있다 | 상세 근거 표현을 새로 설계하지 않고 검증된 인터랙션 재사용 가능 |
| capability 라벨 자산 | `src/data/transitionLite/capabilityRegistry.js`, `src/data/transitionLite/rowCapabilityMap.js` | risk 라벨링, 근거 그룹화, 도움말 문구 | preciseAnalysis risk family를 capability id로 대응시키는 얇은 map이 필요하다 | row key가 transition-lite 축/행 기반이라 preciseAnalysis risk key와 직접 맞물리지 않는다 | “무엇이 부족한가”를 역량 단위로 일관되게 설명 가능 |
| role/industry context pack | `src/lib/adapters/buildJobContext.js`, `src/lib/analysis/buildCandidateAxisPack.js`, `src/data/job/jobLookup.index.js`, `src/components/input/InputFlow.jsx` | related experience / role-family proximity 보조 신호 | preciseAnalysis 상태에 현재/목표 직무와 산업 선택값을 side-channel로 전달해야 한다 | preciseAnalysis는 현재 JD/Resume 텍스트 중심 계약이라 selection context를 받지 않는다 | 유사 표현 흔들림을 familyDistance, targetLevelHints, targetResponsibilityHints로 보조 가능 |
| tool/domain taxonomy | `src/lib/semantic/taxonomy/toolTaxonomy.js`, `src/lib/semantic/taxonomy/domainTaxonomy.js`, `src/lib/decision/evidence/evidenceAliases.js` | keyword/must/related experience 보조 사전 | exact match 전에 alias 확장과 synonym normalization 단계를 얇게 추가해야 한다 | 잘못 연결하면 false positive가 늘 수 있어 바로 투입하기 어렵다 | 표현 흔들림, 동의어 누락, 도구 표기 차이를 줄일 수 있음 |
| 입력 가이드 copy 자산 | `src/components/input/JDInput.jsx`, `src/components/input/ResumeInput.jsx` | preciseAnalysis 입력 전 예시/placeholder | preciseAnalysis 전용 톤에 맞게 문구 배치만 옮기면 된다 | 현재는 transition-lite 메인 입력 맥락에 묶여 있다 | 사용자가 JD/Resume를 어떤 구조로 붙여야 하는지 즉시 이해 가능 |

## C. 장기 후보

| 자산 | owner 파일 | 지금은 무리인 이유 | 나중에 쓰면 좋은 시점 | preciseAnalysis 연결 가능성 |
|---|---|---|---|---|
| transition-lite 축 점수 체계 전체 | `src/data/transitionLite/axisExplanationRegistry.js`, axis/pack 계열 | preciseAnalysis는 JD-Resume screening risk 엔진이고 transition-lite는 전환 적합도 축 평가라 문제 정의가 다르다 | preciseAnalysis 결과를 transition-lite와 묶는 통합 서사가 필요해질 때 | 점수 자체보다 설명 슬롯과 카드 shell만 부분 재사용하는 방향이 안전 |
| candidateAxisPack 전체 서사 | `src/lib/analysis/buildCandidateAxisPack.js` | 현재 preciseAnalysis는 사용자 선택값 없이 텍스트만으로 돌아가므로 axis pack 전체를 넣으면 입력 계약이 달라진다 | current/target role/industry side-channel이 정식 계약으로 추가된 뒤 | related experience, seniority, domain continuity 보조 판단으로 확장 가능 |
| job/industry ontology의 직접 판정 참여 | `src/data/job/ontology/**`, `src/data/industry/**`, `src/lib/decision/roleOntology/**` | ontology를 판정 본체에 바로 넣으면 텍스트에 없는 확신을 과하게 부여할 수 있다 | gold set이 더 쌓여 alias 확장과 family bridge의 precision이 검증된 뒤 | must/keyword/related experience의 보조 사전, family bridge용으로 단계적 활용 가능 |
| interactionPack / interpretationPack 전체 조립층 | `src/data/input_interpretation/index.js` 및 interpretation pack 계열 | 현재 preciseAnalysis는 5-risk MVP 중심이라 전체 해석 조립층을 붙이면 과도한 의존이 생긴다 | 리스크 설명이 카드 단위를 넘어 종합 리포트형으로 커질 때 | narrative registry, interpretation slot, status copy 공급원으로 확장 가능 |

## 핵심 결론

- preciseAnalysis는 완전히 새 제품처럼 만들기보다 PASSMAP 기존 자산을 적극적으로 흡수할수록 더 빨리 안정화될 수 있다.
- 특히 UI shell, 설명 구조, 테스트 운영 방식은 즉시 재사용 가치가 높다.
- 반면 transition-lite의 점수/축 구조를 preciseAnalysis에 그대로 가져오는 것은 부적절할 수 있으므로, 설명 방식과 카드 패턴 중심 재활용이 더 안전하다.
- 구조화 자산(ontology/capability/registry)은 바로 붙이기보다 keyword/must/related experience 정확도 개선용 보조 사전으로 검토할 가치가 있다.
- 즉, 새로 만들기 전에 기존 자산 대체 가능성을 먼저 확인하는 것이 우선이다.

## 우선순위 제안

1. 설명 payload와 상세보기 shell을 transition-lite 자산 기준으로 정리한다.
2. `buildExplanationPack`의 문구 자산을 preciseAnalysis risk key bridge로 부분 재사용한다.
3. 테스트 작성은 기존 `PA-*`/`QA-SHARE-*` 규칙만 사용하고 새 네이밍 체계를 만들지 않는다.
4. 구조화 자산은 직접 판정 엔진이 아니라 alias/family bridge 보조 신호부터 제한적으로 붙인다.

## 새로 만들기 전에 먼저 볼 기존 자산 체크리스트

- 입력 업로드/추출을 새로 만들려는가: 먼저 `UploadPanel`과 `extractTextFromFile` 확인
- JD/Resume 필드 shape를 새로 만들려는가: 먼저 `parseWithAI`와 `jdResumeFit` 확인
- 결과 카드 상세보기 shell을 새로 만들려는가: 먼저 `TransitionLiteResult` 설명 패널 구조 확인
- risk 설명 문구를 새로 쓰려는가: 먼저 `buildExplanationPack`의 `userReason/interviewerView/actionHint` 확인
- share panel/copy를 새로 만들려는가: 먼저 `App.jsx`의 `precise-analysis` share branch 확인
- related experience 정확도를 올리려는가: 먼저 `buildJobContext`, `buildCandidateAxisPack`, taxonomy/alias 자산 확인
- 테스트 규칙을 새로 정하려는가: 먼저 `Precise_Analysis_Test_System.md`, `ENGINE_TEST_RULES.md`, `Precise_Analysis_QA_Log.md` 확인
