# PASSMAP Engine Contract (Immutable Rules) v0

> 목적: “불변 규칙(계약)”을 코드 기준으로 못 박아 UI/테스트/엔진이 서로 다른 길을 보지 않게 한다.
> 범위: 지금 당장 확정 가능한 SSOT 3개 + 재발 방지 규칙(팩트 기반) 2개.

---

## 1) SSOT (Single Source of Truth)

### SSOT-1) 최종 점수
SSOT: decisionPack.decisionScore.capped  
근거: decisionScore = { raw, capped, cap, ... } (1697~1713)

### SSOT-2) cap
SSOT: decisionPack.decisionScore.cap  
근거: cap: (typeof __capFinal === "number") ? __capFinal : null (1700)

### SSOT-3) grayZone
SSOT: decisionPack.decisionScore.meta.grayZone  
근거: meta: { ... grayZone: __grayZoneMeta ... } (1705~1711) + “표준 경로” 주석(1617)

---

## 2) 재발 방지 규칙 (팩트 기반)

### R-1) grayZoneMeta try/catch 특성 (silent null 가능)
- grayZoneMeta는 try/catch 안에서만 채워지고, 실패해도 조용히 null 유지 가능  
  - let __grayZoneMeta = null; (1482)  
  - try { __grayZoneMeta = {...} } catch { } (1618~1629)

따라서 정책 테스트/디버그 규칙:
- “grayZone 관련 try/catch는 global snapshot 없이 빈 catch 금지”
- “grayZoneMeta null은 ‘미진입/에러’ 둘 다 가능 → 테스트에서 반드시 케이스 분리”

### R-2) capFinal은 gate id override 우선 (특히 SENIORITY)
- capFinal은 gate id에 따라 override됨  
  - if (id === "SENIORITY__UNDER_MIN_YEARS") { ... return __cap; } (1497~1634)
- grayZone에서 hits 기반 cap 60/65 완화  
  - (1615~1616)

따라서:
- “cap은 maxGateP만으로 결정” 같은 단순 규칙은 틀림
- cap 정책 테스트는 “id override 우선”을 포함해야 함