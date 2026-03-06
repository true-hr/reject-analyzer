Evidence Fit v1 실제 코드 검수만 진행해줘.
설명 요약 말고, 실제 코드 발췌 기준으로 아래 4개를 확인해줘.

[목적]
Evidence Fit v1이 PASSMAP 실제 실행 경로에 정상 연결되었는지 검수

[검수 대상 4개]
1) src/lib/analyzer.js
- evaluateEvidenceFit import 존재 여부
- analyze() 내부 실제 호출 여부
- 호출부 원문 발췌
- 결과가 어떤 변수명으로 저장되는지

2) src/lib/analyzer.js
- buildDecisionPack({...}) 호출부에서 evidenceFit 전달 여부
- 해당 호출부 원문 발췌
- analyze() → decisionPack/buildDecisionPack 전달 흐름이 보이게 앞뒤 포함해서 발췌

3) src/lib/decision/index.js
- evidence penalty가 정확히 어디에서 적용되는지
- semantic/raw score 계산 → evidence penalty → gate/cap → final 순서가 보이게 관련 블록 원문 발췌
- cap 이전 적용인지 명확히 판정

4) src/lib/decision/evidence/evaluateEvidenceFit.js
- 파일 전체 또는 최소 핵심 전체 발췌
- TOOL_ALIASES / normalizeText / includesAny 포함
- 문자열 깨짐(alias 깨짐) 여부 판정

[출력 형식]
1. 수정 분류
2. 영향 파일
3. 항목별 실제 코드 발췌
4. 각 항목 판정 (정상 / 보류)
5. 최종 승인 여부 (승인 / 보류)
6. 보류라면 최소 수정 포인트 1~3개만 제시

[중요]
- 추정하지 말고 실제 코드 기준으로만 답변
- “문제 없어 보임” 같은 표현 말고, 원문 발췌와 함께 판단
- line number 포함