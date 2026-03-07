수정 분류

안전 패치

범위 제한: src/lib/analyzer.js 1파일만 수정

영향 파일

src/lib/analyzer.js

목적
JD Model SSOT ROUND 6으로, buildKeywordSignals() 내부의 knockout 관련 missing 항목 원천을 provenance 형태로 분리 보존한다.
기존 점수 계산과 surface 동작은 유지하고, 디버그/설명 가능성을 높이기 위한 append-only 필드만 추가한다.

중요 원칙

수정 파일은 src/lib/analyzer.js 1개만

append-only / 최소 수정

기존 구조/함수/순서/주석 최대 유지

리팩토링 금지

기존 missingCritical, jdCriticalFinal, hasKnockoutMissing 의미와 계산 결과 변경 금지

기존 matchScore, objectiveScore, extractHardMustMissingCount 동작 변경 금지

오직 provenance 필드 추가만 수행

작업 목표
buildKeywordSignals(jd, resume, ai, jdModel) 내부에서 아래 원천별 배열을 분리 보존한다.

missingFromJdCritical

missingFromAiMustHave

missingFromJdModelMustHave

그리고 반환 객체에 append-only로 아래 필드를 추가한다.

missingCriticalBySource: { jdCritical, aiMustHave, jdModelMustHave }

필요하면 hasMissingBySource 같은 boolean map도 추가 가능

단 기존 필드는 절대 제거/대체 금지

원칙

최종 missingCritical는 지금처럼 합쳐진 uniq 배열 유지

hasKnockoutMissing = missingCritical.length > 0 유지

provenance는 디버그/설명용 추가 필드일 뿐, 현재 점수 계산에는 연결 금지

출력 형식

수정 분류

영향 파일

정확한 수정 위치

붙여넣기 가능한 최종 코드

기대 효과

부작용 가능성