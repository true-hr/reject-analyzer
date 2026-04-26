# Newgrad Certification Axis Investigation

Date: 2026-04-23

## Scope
- Current owner and contract trace for newgrad certification input and read-path
- Current inventory of UI certification labels vs runtime canonical assets
- Safe design constraints for future certification expansion

## Owner Summary
- Input owner: `src/components/input/NewgradTransitionLiteInput.jsx`
- Newgrad input validation / producer bridge owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- Newgrad Axis 2 score owner: `src/lib/analysis/buildNewgradAxisPack.js > scoreDomainInterest()`
- Axis 2 explanation owner: `src/data/transitionLite/axisExplanationRegistry.js > buildNewgradDomainInterestExplanation()`
- Report render owner: `src/components/report/TransitionLiteResult.jsx`
- Cert ontology asset owners:
  - `src/lib/ontology/certs/cert_catalog.v0.json`
  - `src/lib/ontology/certs/cert_rules.v0.json`
  - `src/lib/ontology/certs/role_cert_matrix.v0.json`

## Current Contract Lock
- UI input shape is `certifications: Array<{ category, subcategory, label, status, relevance }>`
- UI currently provides select-only input. Free-text certification input is not exposed in the newgrad form.
- Runtime validation keeps `payload.certifications` as normalized object array and merges `contractExperiences` with `partTimeExperience`.
- `normalizeNewgradCertSelectionItem()` currently validates shape and preserves raw label only.
- Canonical hint is not guaranteed at normalization stage. It is appended later by the phase1 bridge only when exact catalog match exists.
- Current scoring path reads certification support through `certEvidencePack` / `certRoleRelevancePack`, not raw string contains.

## Current Read Path
- Certification scoring impact is effectively Axis 2 only in the current newgrad path.
- Axis 1 / Axis 3 / Axis 4 / Axis 5 do not use certification for score.
- Axis 2 score uses:
  - `buildNewgradTransitionLiteResult.js > buildNormalizedCertSelections()`
  - `buildNewgradTransitionLiteResult.js > buildPhase1CertRoleRelevancePack()`
  - `buildNewgradTransitionLiteResult.js > buildCertEvidencePack()`
  - `buildNewgradAxisPack.js > _getCertSupport()`
  - `buildNewgradAxisPack.js > scoreDomainInterest()`
- Axis 2 explanation uses `signals.certificationsAligned`, `signals.certificationCount`, `signals.certDirectCount`.
- Certification visibility currently appears in:
  - `whyThisRead`
  - `axisReadSummary`
  - Axis 2 explanation reasons / positives / gaps
  - Axis 2 comparison block
  - `newgradGoalComparisonTable`
- Certification is not surfaced in `buildInputEvidenceReadFromPacks()` today.

## Current Inventory Summary
- UI exact labels with direct catalog/rules linkage confirmed:
  - `ADsP`
  - `ADP`
  - `SQLD`
  - `SQLP`
- UI labels present but not exact-linked to current canonical bridge:
  - `전산회계 1급`, `전산회계 2급`
  - `FAT`, `TAT` are in asset family form, but not in current UI exact list
  - `GA4` is in asset family form, but not in current UI exact list
- UI-only labels without current exact canonical bridge include:
  - `정보처리기사`
  - `빅데이터분석기사`
  - `컴퓨터활용능력 1급`
  - `토익스피킹`
  - `오픽`
  - `AFPK`
  - `투자자산운용사`
- Current phase1 mapping scope in producer bridge is limited to cloud/security role families.
- Therefore many existing ontology entries do not affect newgrad scoring today even if they exist in asset files.

## Safe Design Lock
- Certification remains secondary evidence.
- Axis 1 certification score is prohibited.
- Axis 2 is the main certification score axis for the current newgrad path.
- Axis 2 score should stay limited to industry-specific certifications only.
- Axis 3 certification score is disallowed by default.
- Axis 4 certification score is allowed only as weak support for communication-heavy roles and speaking certifications.
- Axis 5 certification score is disallowed.
- Same-family multi-cert stacking must be capped.
- Certification-only Axis 2 should remain capped conservatively.

## Immediate Safe Implementation Direction
- Minimum patch owner path:
  - input option owner: `src/components/input/NewgradTransitionLiteInput.jsx`
  - canonical registry owner: new dedicated cert registry file or existing cert ontology asset
  - scoring read owner: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js` producer bridge
  - score consumer owner: `src/lib/analysis/buildNewgradAxisPack.js > _getCertSupport()`
  - explanation owner: `src/data/transitionLite/axisExplanationRegistry.js`
- Safe next step should be append-only:
  - lock a newgrad cert registry for exact labels, family, allowed axes, and duplicate-cap metadata
  - bridge UI exact labels to canonical ids in producer layer
  - keep Axis 2 scoring conservative
  - avoid raw label contains expansion

## Known Risks
- Current newgrad path still has `UI hardcoded + partial canonical bridge + Axis 2 secondary scoring` characteristics.
- Generic labels like `클라우드 자격`, `재무 자격`, `정보기술 관련 자격` are unsafe for direct score expansion.
- `GA4` and Python-based certifications need title-level decomposition before scoring.
- Marketing/design/data certificates should not be broadly promoted into Axis 2 score.


---

## 2026-04-26 — Cert Registry 확장 + 오타 수정 완료

### 6대 원칙 (구현 완료)

1. **Axis1 cert score 금지** — scoreJobFit()은 cert를 사용하지 않는다. 전공과 직무 연결성만 반영.
2. **Axis2 cert main-axis** — scoreDomainInterest()만 certEvidencePack을 읽는다. role gating + family cap 적용.
3. **Axis3/5 cert score 금지** — scoreExecution(), scoreStrengths() 관련 cert 경로 없음.
4. **Axis4 language cert gated weak only** — 토익스피킹/오픽만 communicationCertSupportScore × 2. SALES/CUSTOMER_OPERATIONS 또는 키워드 gating 필수.
5. **same-family cap** — duplicateCapGroup 기준 1 full + 1 partial까지만 인정. 나머지 capped.
6. **cert-only ceiling** — 실경험 없이 cert만 있는 경우 Axis2 score 최대 2 유지. high band 진입 불가.

### 이번 라운드 변경 사항

- newgradCertRegistry.js: 21개 cert 등록 완료 (domain_specific/adjacent/tool_readiness/communication_support/explanation_only/exclude_from_score)
- NewgradTransitionLiteInput.jsx: FAT, TAT, 신용분析사, CFA Level 1 입력 옵션 추가
- axisExplanationRegistry.js: CERT_FAMILY_DOMAIN_NOTE map + buildCertAlignedLabel helper 추가 (cert별 domain 설명 구체화)
- 오타 수정: 析(U+6790 CJK) → 석(U+C11D hangul) 전수 교체 (axisExplanationRegistry.js 내 신용분析사, 빅데이터분析기사, ADsP 설명문 등)

### 매칭 확인

| 항목 | 표기 | codepoint |
|------|------|-----------|
| registry displayLabel | 신용분析사 | 석 U+C11D ✅ |
| input option | 신용분析사 | 석 U+C11D ✅ |
| explanation map key | 신용분析사 | 석 U+C11D ✅ |

### build

vite build 통과 ✅ (52.95s)

---

## 2026-04-26 라운드 — 제조/안전/기계/품질 4개 자격증 추가

### 추가 자격증

| 자격증 | canonicalId | family | Axis |
|---|---|---|---|
| 산업안전기사 | cert:industrial_safety_engineer | safety_ehs | Axis2 보조 근거 |
| 위험물산업기사 | cert:hazardous_materials_industrial_engineer | chemical_safety | Axis2 보조 근거 |
| 일반기계기사 | cert:general_machinery_engineer | mechanical_engineering | Axis2 보조 근거 |
| 품질경영기사 | cert:quality_management_engineer | quality_management | Axis2 보조 근거 |

### 정책 요약

- 4개 모두 Axis2 보조 근거만 반영 (scoreClass: domain_specific, weight: low)
- Axis1/3/4/5 score 반영 없음
- 위험물기사 alias는 이번 라운드 보류 — 내부 ontology 충돌 위험으로 다음 라운드 별도 결정
- same-family cap / cert-only ceiling 기존 로직 유지
- scoring logic 수정 없음
- 수정 파일: newgradCertRegistry.js, NewgradTransitionLiteInput.jsx, axisExplanationRegistry.js
