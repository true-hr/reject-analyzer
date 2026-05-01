# PASSMAP Analysis Shared Layer Handoff

작성일: 2026-04-29
작업 분류: SAFE DOC HANDOFF ONLY
범위: Phase 1~3B shared taxonomy/read-only context 기반 공통화 인수인계

---

## 1. 현재 결론

- Phase 1~3B까지 완료됐다.
- 현재 작업은 사용자 화면 개선이 아니라 내부 공통 기반 정리다.
- shared layer는 read-only/no-score 계약이다.
- scoring/gate/risk/band/CTA/report conclusion은 아직 공통화하지 않았고, 앞으로도 쉽게 공통화하면 안 된다.
- 현재 중단점은 안전하며, 당장 Phase 4로 넘어갈 필요는 없다.

---

## 2. 완료된 Phase 요약

| Phase | 작업명 | 핵심 내용 | 사용자 화면 영향 | scoring 영향 | 상태 |
|---|---|---|---|---|---|
| Phase 0.5 | Compatibility Contract | 공통화 허용/금지선 문서화 | 없음 | 없음 | 완료 |
| Phase 0.6 | Snapshot Baseline | 회귀 기준 정리 | 없음 | 없음 | 완료 |
| Phase 0.6R | Newgrad Baseline Runner | 신입 baseline runner 추가 | 없음 | 없음 | 완료 |
| Phase 1 | Shared Taxonomy Read Layer | readTaxonomyTarget 생성 | 없음 | 없음 | 완료 |
| Phase 2A | Display Label Adapter Adoption | job/industry context에 displayLabel 병렬 추가 | 없음 | 없음 | 완료 |
| Phase 2B | Report VM Display Label Adoption | transition VM displayLabel 최소 연결 | 없음 | 없음 | 완료 |
| Phase 3A | Read-only Context Pack | buildTaxonomyContextPack 생성 | 없음 | 없음 | 완료 |
| Phase 3B | Optional Context Pack Threading | result VM에 taxonomyContextPack optional field 추가 | 없음 | 없음 | 완료 |

---

## 3. 생성/수정된 핵심 파일

### Shared Layer

- `src/lib/shared/taxonomy/readTaxonomyTarget.js`
- `src/lib/shared/taxonomy/buildTaxonomyContextPack.js`

### Read-only Adapters

- `src/lib/adapters/buildJobContext.js`
- `src/lib/adapters/buildIndustryContext.js`

### Transition Result VM

- `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- `src/lib/transitionLite/buildTransitionLiteResult.js`

### Regression / Smoke Runner

- `scripts/regression/run-newgrad-axis-baseline.mjs`
- `scripts/regression/run-taxonomy-read-layer-smoke.mjs`
- `scripts/regression/run-taxonomy-context-pack-smoke.mjs`
- `scripts/regression/run-transition-lite-regression.mjs`
- `tests/integration/domainMismatchSmoke.test.mjs`

### Docs

- `docs/PASSMAP_ANALYSIS_COMPATIBILITY_CONTRACT.md`
- `docs/PASSMAP_ANALYSIS_SNAPSHOT_BASELINE.md`
- `docs/PASSMAP_ANALYSIS_SHARED_LAYER_HANDOFF.md`
- `docs/COMM_PATCH_NOTES.md`

---

## 4. 현재 안전 계약

- shared taxonomy/context layer는 score를 반환하지 않는다.
- shared layer output에는 score, rawScore, risk, riskLevel, gate, band, CTA, pass/fail, transitionDifficulty, suitability, rejectionReason을 넣지 않는다.
- 기존 label/fallback field는 삭제하지 않는다.
- 새 field는 optional로만 추가한다.
- 기존 분석 결과가 바뀌면 안 된다.
- 신입/경력/서류탈락 분석의 판단 목적은 분리 유지한다.

---

## 5. 절대 건드리면 안 되는 영역

| 영역 | 이유 |
|---|---|
| buildNewgradAxisPack.js scoring | 신입 Axis 의미가 고유함 |
| classifyTransition.js classification | 경력 전환 판정 로직 |
| analyzer.js analyze scoring/gate | 서류탈락 분석 핵심 |
| decision/index.js risk/gate | 서류탈락 리스크 판정 핵심 |
| preciseAnalysis/*.js risk scoring | JD/resume 직접 근거 기반 리스크 |
| TransitionLiteResult.jsx CTA/band/copy | UI/전환 문맥 영향 |
| PreciseAnalysisFlow.jsx CTA/band/copy | 서류탈락 화면 문맥 영향 |

---

## 6. 현재 검증 runner

```bash
node scripts/regression/run-transition-lite-regression.mjs
node tests/integration/domainMismatchSmoke.test.mjs
node scripts/regression/run-newgrad-axis-baseline.mjs
node scripts/regression/run-taxonomy-read-layer-smoke.mjs
node scripts/regression/run-taxonomy-context-pack-smoke.mjs
```

마지막 확인 상태:

- transition-lite regression: 11 PASS / 0 FAIL
- domainMismatch smoke: 11 PASS / 0 FAIL
- newgrad axis baseline: 4 PASS / 0 FAIL
- taxonomy read-layer smoke: 17 PASS / 0 FAIL
- taxonomy context-pack smoke: 27 PASS / 0 FAIL

---

## 7. 지금 멈추는 이유

- Phase 1~3B는 내부 기반 안정화로 충분하다.
- Phase 4부터는 evidence signal shell로 들어가며, 분석 의미/점수와 가까워질 수 있다.
- 지금은 유저 체감 개선보다 내부 공사가 과도해질 위험이 있다.
- 따라서 현재 지점에서 커밋하고, 이후 리포트 품질/화면/서류탈락 정확도 개선으로 돌아가는 것이 우선이다.

---

## 8. 앞으로 남은 후보 작업

| 후보 작업 | 설명 | 우선순위 | 지금 진행 여부 |
|---|---|---|---|
| Phase 4 Evidence Signal Shell | 경험/자격/성과/커뮤니케이션 신호 schema 공통화 | 중간 | 보류 |
| taxonomyContextPack UI 소비 | UI/PDF/report에서 optional context 표시 | 낮음~중간 | 보류 |
| precise 분석 연결 | 서류탈락 분석에 taxonomy context를 설명 보조로 연결 | 중간~높음 위험 | 보류 |
| runner package script화 | regression runner를 npm script/CI에 연결 | 중간 | 나중 |
| 리포트 품질 개선 | 유저가 체감하는 분석 문장/섹션 개선 | 높음 | 다음 우선순위 후보 |

---

## 9. 다음에 이어갈 때의 권장 순서

1. 현재 커밋 상태 확인
2. 5개 runner 실행
3. Phase 4가 정말 필요한지 재판단
4. 필요하면 evidence signal shell을 “schema only/no-score”로 설계
5. 그렇지 않으면 리포트 품질/UX 개선으로 전환

---

## 10. 다음 Claude/Codex 작업 전 체크리스트

- [ ] 5개 runner가 모두 PASS인가?
- [ ] 이번 작업이 score/gate/risk/band/CTA에 영향을 주는가?
- [ ] 기존 field/fallback을 제거하지 않는가?
- [ ] shared layer output에 금지 field가 없는가?
- [ ] UI 변경이 필요한 작업인가?
- [ ] 유저 체감 가치가 있는 작업인가?
- [ ] 지금 꼭 해야 하는 작업인가?
