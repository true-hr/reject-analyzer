PASSMAP에서 이번엔 Gate / Cap Contract test만 추가해줘.

범위:
- scripts/testEngine.js 중심 최소 수정
- 필요 시 analyzer / decision / simulation 파일은 읽기만 우선
- 엔진 로직 수정 금지
- UI 수정 금지
- broad refactor 금지

해야 할 일:
1. analyze 반환 구조와 decisionPack / riskResults / simulationViewModel / gate/cap 필드 실제 경로 확인
2. Gate / Cap Contract 4개 추가
   - gate risk 존재
   - cap 메타데이터 존재
   - gate 시 passProbability 상한 제한
   - NaN/Infinity 방지
3. hard mismatch 케이스 1개 + control 케이스 1개 이상 추가
4. FAIL 메시지 명확히 출력

중요:
- 필드명 추측 금지
- passProbability가 0~1인지 0~100인지 코드 먼저 확인
- 절대 상한을 코드상 확인 못하면 상대 계약으로 대체하고 이유를 주석에 남겨
- 테스트를 통과시키려고 계약을 약하게 만들지 마

작업 순서:
코드 읽기 -> 실제 필드 요약 -> 최소 패치 -> 수정 파일/계약/케이스/판단 기준 보고