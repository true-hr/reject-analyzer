# PASSMAP Engine Dictionary (v0)

> 목적: AI/개발자/테스터가 “코드 기준”으로 동일 용어를 동일 의미로 쓰게 만드는 최소 사전.
> 범위: 우선 4개( decisionPack / decisionScore / cap / grayZone )만 확정.

---

## Term: decisionPack

Type: object  
One-line: buildDecisionPack()이 반환하는 엔진 최종 출력 팩(pressure/score/risks + 확장용 feed 포함)  
Owner: create=buildDecisionPack / update=analyzer.js(후속 주입) / read=UI+viewModel  
Path / Example: decisionPack.decisionScore, decisionPack.riskResults, decisionPack.decisionPressure  
Rules: decisionPack 최상위 키는 return 스키마 고정 + riskFeed는 score/cap에 영향 금지

---

## Term: decisionScore

Type: object  
One-line: 점수 계산 결과(원점수/캡적용점수/캡/메타)를 담는 SSOT 스코어 컨테이너  
Owner: create=buildDecisionPack / update=buildDecisionPack / read=UI  
Path / Example: decisionPack.decisionScore.capped, decisionPack.decisionScore.cap  
Rules: 최종 점수는 decisionScore.capped SSOT + cap은 decisionScore.cap SSOT

---

## Term: cap

Type: number|null  
One-line: 게이트/규칙에 의해 최종 점수의 상한을 제한하는 값(없으면 null)  
Owner: create=buildDecisionPack(__capFinal) / update=buildDecisionPack / read=UI  
Path / Example: decisionPack.decisionScore.cap  
Rules: UI에서 cap 계산 금지 + cap 적용은 decisionScore.capped에서만 반영

---

## Term: grayZone

Type: object|null  
One-line: 게이트 경계(예: 연차 부족 4개월 이내)에서 완화(cap override) 근거를 기록하는 메타  
Owner: create=buildDecisionPack(__grayZoneMeta) / update=buildDecisionPack / read=UI+tests  
Path / Example: decisionPack.decisionScore.meta.grayZone  
Rules: grayZone은 “설명 메타”이며 점수 SSOT는 decisionScore.capped(회피 금지)