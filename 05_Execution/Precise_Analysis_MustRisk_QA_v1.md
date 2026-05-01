# 필수요건 미충족 엔진 QA 문서 v1

> 대상 파일: `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js`
> 작성일: 2026-04-12
> 라운드: SAFE QA PATCH — guard 로직 진단 + 최소 normalize 보강

---

## 1. guard 로직 진단 요약

### 패치 전 비교 방식

```js
const mustHaveSet = new Set(mustHaveFiltered.map((s) => String(s ?? "").toLowerCase()));
const guardedMiss = missItems.filter((item) => mustHaveSet.has(String(item ?? "").toLowerCase()));
```

- 적용: null 방어, toLowerCase
- 미적용: trim, 연속공백 축소

### 패치 후 비교 방식

```js
const normalize = (s) => String(s ?? "").toLowerCase().trim().replace(/\s+/g, " ");
const mustHaveSet = new Set(mustHaveFiltered.map(normalize));
const guardedMiss = missItems.filter((item) => mustHaveSet.has(normalize(item)));
```

- 추가: trim, replace(/\s+/g, " ")
- 동의어/형태소/의미 변환 없음 — 표기 흔들림 방어까지만

---

## 2. QA 케이스

| ID | 목적 | fit shape 요약 | 기대 mustPolicyMode | 기대 severity | 핵심 확인 포인트 |
|---|---|---|---|---|---|
| QA-01 | must_total=0 처리 | must_total=0, miss=0, mustHave=[] | raw-fit | none | effectiveMustTotal=0 → severity none |
| QA-02 | must 3개 miss 1개, 오염 없음 | must_total=3, miss=1, mustHave.length=3 | raw-fit | high | isContaminated=false, missRatio=0.333≥0.3 → high |
| QA-03 | must 5개 miss 3개 | must_total=5, miss=3, mustHave.length=5 | raw-fit | critical | effectiveMustMiss≥3 → critical |
| QA-04 | preferred 오염 존재 | must_total=5, mustHave.length=3, missItems=[A,B,X], mustHave=[A,B,C] | hard-must-guarded | critical | guardedMiss=[A,B], effectiveMustTotal=3, missRatio=0.667 → total≥3 AND ratio≥0.5 |
| QA-05 | 대소문자만 다른 경우 | mustHave=["SQL"], missItems=["sql"] | hard-must-guarded | high | effectiveMustTotal=1, miss=1, missRatio=1.0≥0.3 → high |
| QA-06 | 앞뒤 공백 차이 | mustHave=[" Python "], missItems=["Python"] | hard-must-guarded | high | effectiveMustTotal=1, miss=1, missRatio=1.0≥0.3 → high |
| QA-07 | 연속 공백 차이 | mustHave=["SQL  Server"], missItems=["SQL Server"] | hard-must-guarded | high | effectiveMustTotal=1, miss=1, missRatio=1.0≥0.3 → high |
| QA-08 | 한글/영문 다른 표현 (normalize 해결 불가) | mustHave=["HRBP"], missItems=["인사BP"] | hard-must-guarded | none | guardedMiss=[] — 의도적 한계, 정상 동작 |
| QA-09 | fit shape 일부 누락 (match.must 없음) | fit.match=undefined | raw-fit | none | missItems=[], 오류 없이 처리 |
| QA-10 | requiredLines만 있고 mustHave 빈 경우 | mustHave=[], mustTotal=2, miss=1 | raw-fit | high | length=0 → isContaminated=false → raw-fit, missRatio=0.5≥0.3 → high |

---

## 3. 콘솔 검증 방법

```js
// 앱 실행 후 정밀분석 트리거 상태에서
window.__PRECISE_ANALYSIS_DEBUG__?.mustRequirementsGap?.raw
```

확인 필드:
- `mustPolicyMode` — "raw-fit" / "hard-must-guarded"
- `effectiveMustTotal`, `effectiveMustMiss`, `effectiveMissItems`
- `missRatio`

### 함수 단독 테스트 (QA-06 기준)

```js
import("/src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js").then(m => {
  const result = m.buildMustRequirementsGapRisk({
    summary: { must_total: 3, must_hit: 2, must_miss: 1 },
    match: { must: { hits: ["A", "B"], miss: ["Python"] } },
    jdModel: {
      mustHave: [" Python ", "A", "B"],  // 의도적 앞뒤 공백
      sections: { requiredLines: [] }
    }
  });
  console.log(result.raw.mustPolicyMode);      // "raw-fit" (mustHave.length=mustTotal=3, isContaminated=false)
  console.log(result.raw.effectiveMissItems);  // ["Python"]
  console.log(result.severity);               // "high" (mustHave.length=mustTotal=3, raw-fit, missRatio=0.333≥0.3)
});
```

> 주의: QA-06에서 mustHave.length === mustTotal이면 isContaminated=false → raw-fit으로 처리됨.
> guard 로직을 테스트하려면 mustHave.length < mustTotal 조건이 필요.

```js
// isContaminated=true 강제 케이스 (QA-06 의도)
import("/src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js").then(m => {
  const result = m.buildMustRequirementsGapRisk({
    summary: { must_total: 5, must_hit: 3, must_miss: 2 },
    match: { must: { hits: ["A", "B", "C"], miss: ["Python", "React"] } },
    jdModel: {
      mustHave: [" Python ", " React "],  // length=2 < must_total=5 → isContaminated=true
      sections: { requiredLines: [] }
    }
  });
  console.log(result.raw.mustPolicyMode);      // "hard-must-guarded"
  console.log(result.raw.effectiveMissItems);  // ["Python", "React"] (trim으로 매칭 성공)
  console.log(result.severity);               // "high" (miss=2, ratio=1.0 → critical? 아니면...)
});
```

---

## 4. 리스크 / 한계

### normalize로도 해결 못 하는 케이스

- `mustHave=["HRBP"]`, `missItems=["인사BP"]` → 의미 동일, 표기 다름 → guardedMiss=[] → severity none
- `mustHave=["PM"]`, `missItems=["Project Manager"]` → 약어 vs 원어 → 해결 불가
- 이는 의도된 한계. 동의어/번역 mapping은 이번 라운드 scope 외.

### 일부러 안 건드린 것

- `severity` 기준 (none / medium / high / critical 분기점)
- `mustPolicyMode` 로직 경계 (isContaminated 조건)
- `createRiskResult.js` 구조
- `App.jsx`

### 다음 라운드 추천 1개

**QA-08 케이스 대응**: mustHave와 missItems 간 약어/한영 표현 차이가 발생하는 빈도를 실데이터로 측정해, 빈도가 높으면 "표기 정규화 테이블(소규모, hardcoded)" 도입 여부를 별도 라운드에서 결정할 것.
동의어 사전이 아닌 "HRBP = HR Business Partner" 수준의 극소 테이블만 허용 범위로 고려.
