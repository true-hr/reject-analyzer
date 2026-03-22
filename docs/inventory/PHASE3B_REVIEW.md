# Phase 3B Review

## 1. 총평

- Phase 3B는 job 정규화 자산 확장이라는 목적에는 의미 있는 진전을 만들었다.
- PM, DATA, SALES, MARKETING으로 job coverage를 넓혔고, 파일 형식과 summaryTemplate 톤도 Phase 3A보다 안정적이다.
- 반면 industry batch는 다시 procurement/scm source에만 의존해 broad industry coverage를 넓히지 못했다.
- 따라서 Phase 3B는 job ontology 확장으로는 유효하지만, industry registry 균형 측면에서는 불충분하다.
- 이 상태로 바로 Phase 4 lookup/index로 가면 industry SSOT가 procurement/function-domain 쪽으로 과대표현될 위험이 있다.

## 2. job batch 품질 요약

- 10개 job item 모두 required field를 채웠다.
- PM, DATA, SALES, MARKETING 중심으로 batch 확장이 이뤄져 Phase 3A pilot보다 재사용성이 높아졌다.
- `summaryTemplate`, `axes`, `boundaryHints`, `adjacentFamilies` 형식은 batch 템플릿으로 반복 가능한 수준이다.
- 남은 약점은 same-family boundary 표현과 source family/canonical major 충돌 처리 규칙의 미고정이다.

## 3. industry batch 품질 요약

- 6개 industry item 모두 required field를 채웠다.
- planning, cost, risk까지 확장해 procurement 내부 변주는 늘었다.
- 그러나 broad industry 관점에서 보면 여전히 모두 procurement/function-domain cluster에 머문다.
- broad market context, platform context, commerce context, enterprise solution context는 비어 있다.

## 4. procurement 편향 여부 판정

- 판정: `편향 잔존`
- 설명:
  - Phase 3A 대비 내부 변주는 넓어졌지만 모두 procurement/scm 계열이다.
  - 현재 job batch가 PM, Growth, Performance, Brand, AE, CS, BD, DS, DE까지 확장된 것과 비교하면 industry coverage가 불균형하다.

## 5. 왜 지금 바로 Phase 4로 가면 위험한지

- industry lookup/index가 만들어지면 procurement cluster가 사실상 industry SSOT처럼 과대 반영될 수 있다.
- PM, SALES, MARKETING, DATA 계열 job이 참조할 broad industry sample이 부족해 lookup 품질이 왜곡될 수 있다.
- function-domain과 broad industry가 구분되지 않은 상태에서 Phase 4로 가면 registry 구조가 조기에 굳어질 위험이 있다.

## 6. 다음 보정 batch의 목표

- procurement 외 industry cluster를 추가해 broad market coverage를 확보한다.
- current job batch와 실제로 자주 만나는 market context를 중심으로 industry balance를 맞춘다.
- Phase 4 전에 `broad industry sample`과 `function-domain sample`이 모두 존재하는 상태를 만든다.

