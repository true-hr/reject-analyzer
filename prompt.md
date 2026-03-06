역할

너는 PASSMAP 코드베이스의 엔진 테스트 체계를 안정적으로 확장하는 엔지니어다.

목표는 엔진 로직을 함부로 수정하지 않고,
데이터셋 기반 회귀 테스트를 강화하여 PASSMAP 엔진 정확도를 점진적으로 개선할 수 있는 기반을 만드는 것이다.

현재 상태 (팩트)

자동 테스트 Phase 2 완료.

decision mode: 15 / 15 PASS
analyze mode: 8 / 8 PASS (7 SKIP)

케이스 수: 15개 (TC_001 ~ TC_015)

최근 변경:

scripts/testEngine.js
- case.testMode 지원 추가 (decision / analyze / 없으면 both)

test_dataset.passmap.v1.json
- TC_001~TC_015 구성 (15개)

docs/ENGINE_TEST_RULES.md
- 테스트 작성 규칙 문서 생성

확인된 엔진 사실:

툴 allowlist

sap
oracle
salesforce
excel
power bi
powerbi
sql
python
aws
gcp
azure

주의사항

power bi / powerbi
→ allowlist에 둘 다 있음
→ JD에 "PowerBI" 하나 있어도 mustTools 2개로 계산될 수 있음

domain gate는 JD/resume에 도메인 키워드를 dense하게(슬래시 구분) 나열해야 트리거됨
자연어 문장 형태의 JD로는 decision 모드에서 domain gate 미트리거 가능성 있음

SENIORITY gate는 careerSignals.experienceGap 기반이므로 analyze 모드에서 재현 불가
→ 반드시 testMode: "decision" + careerSignals 주입으로만 검증

중요한 원칙

다음 원칙을 반드시 지켜라.

1️⃣ 엔진 로직 수정 금지 (현재 단계)

다음 파일 수정 금지:

src/lib/analyzer.js
src/lib/decision/index.js
src/lib/simulation/*

지금 단계의 목적은

엔진 개선이 아니라 테스트 체계 확장이다.

2️⃣ 수정 가능한 영역

허용된 수정 범위

scripts/testEngine.js
test_dataset.passmap.v1.json
docs/*

3️⃣ 테스트 설계 원칙

테스트 케이스는 다음 규칙을 따른다.

analyze mode

검증 대상

analyze(state)

확인 대상

passProbability
topRisks
capReason
riskResults

조건

state만으로 재현 가능한 케이스만 사용

decision mode

검증 대상

buildDecisionPack()

확인 대상

risk ids
layer
capReason
meta

조건

careerSignals 등 직접 주입 가능

이번 작업 목표 (Phase 3)

Phase 2에서 15개 케이스 구축 완료.
Phase 3 목표: 엔진 계약 경계 케이스(edge case) 및 복합 케이스 확장.

추가 가능한 테스트 유형

1️⃣ SENIORITY + TOOL 복합 케이스 (decision)

연차 부족 + 필수 툴 누락 동시 발생
→ 두 gate가 모두 riskResults에 존재하는지 확인

2️⃣ grayZone cap 범위 검증

현재 grayZone은 gateId만 검증
capMin/capMax 범위 검증 로직을 checkExpect에 추가하면 더 정밀한 테스트 가능

3️⃣ topRiskMustContainAny 활용 케이스

analyze 모드에서 topRisks 우선순위 검증
gate 있는 케이스에서 gate가 topRisk에 반드시 포함되는지 확인

추가 작업 후보

testEngine.js에 capMin/capMax 범위 체크 로직 추가
(grayZone cap이 범위 내인지 검증, 현재는 cap 단일값 비교만 가능)

절대 하지 말 것

다음 작업 금지

엔진 로직 수정
대규모 리팩토링
새 scoring 로직 추가
Analyzer 구조 변경

결과 보고 형식

작업 완료 후 반드시 보고

1️⃣ 추가된 테스트 케이스 목록
2️⃣ decision PASS/FAIL
3️⃣ analyze PASS/FAIL
4️⃣ 전체 케이스 수
5️⃣ 수정된 파일 목록

작업 방식

작업 순서

1️⃣ dataset 확장
2️⃣ testEngine 실행
3️⃣ FAIL 원인 분석
4️⃣ dataset 수정

엔진 수정 없이 PASS 상태를 만든다.

최종 목표

PASSMAP 엔진은

dataset 기반 regression test

를 통해 안정적으로 개선될 수 있는 상태가 되어야 한다.

이번 작업은

Phase 3 — Edge Case & Composite Test Coverage

이다.
