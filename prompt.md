[역할]
너는 PASSMAP 코드베이스에서 이미 존재하는 Node 기반 테스트 러너(scripts/testEngine.js)를 “contract test”로 강화하는 엔지니어다.

[현상/맥락]
- 이미 scripts/testEngine.js 와 test_dataset.passmap.v1.json 이 존재한다.
- 현재 러너는 buildDecisionPack()을 직접 호출해서 decisionPack(riskResults, capReason, meta 등)을 검증한다.
- 하지만 제품의 실제 엔진 플로우는 analyze(state)가 decisionPack + simulationViewModel을 생성하고 최종 payload에 포함한다.
- 목표는 “정확도↑, 변수↓”: 즉 UI 없이 엔진 출력 계약을 자동으로 검증하는 것.

[절대 금지]
- Vitest/Jest 새로 붙이기 금지.
- 테스트 러너를 새로 만들기 금지.
- 대규모 리팩토링 금지.
- 엔진 로직 수정 금지(Analyzer/Decision/Simulation 코드는 손대지 말 것).
- 최소 변경(가능하면 scripts/testEngine.js 1파일만).

[해야 할 작업]
A) scripts/testEngine.js를 수정해서 2가지 실행 모드를 제공하라.
  - mode=decision: 기존처럼 buildDecisionPack() 경로로 실행(기존 호환 유지)
  - mode=analyze: analyze(state, null) 호출해서 out.decisionPack + out.simulationViewModel 을 검증
    * analyze import 경로는 실제 파일 구조를 확인 후 정확히 잡아라.

B) dataset 스키마 확장(기존 호환 유지)
  - 기존 케이스는 tc.expect를 사용한다(현행 유지).
  - 신규 케이스에서는 optional로 아래 키도 지원:
    expect.passProbabilityMin / expect.passProbabilityMax
    expect.topRiskMustContainAny (리스크 id 배열)
  - 이 값들은 mode=analyze에서만 검사하면 된다(없으면 스킵).

C) out.simulationViewModel에서 다음을 방어적으로 추출하는 getter를 testEngine.js 내부에 추가:
  - passProbability (없으면 null)
  - topRisks 또는 top3 후보 배열 (필드명이 다를 수 있으니 out.simulationViewModel을 검사해서 가장 그럴듯한 배열을 선택)
  - topRisks에서 id 추출 (id/riskId/meta.id 중 실제 구조 기준으로 추출)

D) 출력/디버그
  - 케이스 FAIL 시: out.simulationViewModel의 핵심 필드(추출한 passProbability, topRiskIds)를 함께 출력하라.
  - try/catch가 있다면 silent swallow 방지를 위해 1-cycle로 globalThis.__DBG_TEST_ERR__에 에러 스냅샷을 넣어도 되며,
    “임시 디버그이므로 추후 제거 필요”를 코멘트로 표시하라.

[먼저 확인할 것(필수)]
- analyze export 위치:
  src/lib/analyzer.js 또는 다른 경로에 export function analyze(...)가 있는지 실제로 확인하라.
- analyze 반환 payload에서 decisionPack/simulationViewModel 키가 정확히 무엇인지 코드로 확인하라.
- simVM의 Top3가 어떤 필드명/구조인지 실제 코드로 확인하라.

[산출물]
1) scripts/testEngine.js 수정본(그대로 붙여넣기 가능한 코드)
2) 실행 커맨드 예시(Windows PowerShell):
   - node .\scripts\testEngine.js (기본 decision 모드)
   - node .\scripts\testEngine.js .\test_dataset.passmap.v1.json analyze
   또는 args 설계를 네가 결정하되 문서화해라.
3) “기존 dataset 케이스가 깨지지 않음”을 최우선으로 보장하라.