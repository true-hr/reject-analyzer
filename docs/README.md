# Docs Map

---

## 먼저 볼 문서

- [`docs/ssot/axis1-live-ssot.md`](ssot/axis1-live-ssot.md) — axis1 현재 live 구조 기준 문서. scoring 구성요소, explanation routing, fallback, guard 전체 정리.
- [`docs/ssot/axis1-gold-fixtures-v1.md`](ssot/axis1-gold-fixtures-v1.md) — axis1 회귀 검증 기준 fixture. 7그룹 16개 케이스, 기대 band/floor/uplift 포함.
- [`COMM_PATCH_NOTES.md`](../COMM_PATCH_NOTES.md) — 패치 라운드 이력. Round 1–6 변경 내역 및 정책 결정 기록.

---

## 폴더 의미

| 폴더 | 용도 |
|---|---|
| `docs/ssot/` | 현재 운영 기준 문서. 수정 전 반드시 여기를 먼저 확인할 것. |
| `docs/phase/` | 작업 과정 및 라운드별 설계·패치 문서. 히스토리 추적용. |
| `docs/inventory/` | 감사·회귀·온톨로지·보조 자료. 데이터 검증 및 QA 보조용. |
| `docs/notes/` | 개인 메모 및 작업 메모. 설계 참고용. |
| `docs/assets/` | 이미지 및 첨부 자산. |
| `docs/직무_산업/` | 직무·산업 관련 별도 자료. 건드리지 말 것. |

---

## axis1 문서 흐름

axis1 (직무 구조 연결성) 작업은 아래 순서로 진행되었다.

1. **Root Redesign** — 기존 구조 진단 및 재설계 방향 설정
   - [`phase/axis1/axis1-root-redesign-investigation.md`](phase/axis1/axis1-root-redesign-investigation.md)
   - [`phase/axis1/axis1-root-redesign-plan.md`](phase/axis1/axis1-root-redesign-plan.md)

2. **Capability Registry 설계** — jobCapabilityClusterRegistry 초안, 갭 분석, 확장
   - [`phase/axis1/axis1-capability-registry-draft.md`](phase/axis1/axis1-capability-registry-draft.md)
   - [`phase/axis1/axis1-capability-registry-gap-analysis.md`](phase/axis1/axis1-capability-registry-gap-analysis.md)
   - [`phase/axis1/axis1-capability-registry-expanded.md`](phase/axis1/axis1-capability-registry-expanded.md)
   - [`phase/axis1/axis1-bridgegroup-normalization.md`](phase/axis1/axis1-bridgegroup-normalization.md)

3. **Rollout Blueprint** — 라운드별 패치 계획
   - [`phase/axis1/axis1-next-rollout-blueprint.md`](phase/axis1/axis1-next-rollout-blueprint.md)

4. **패치 라운드 문서** — Round 1–5 각 단계 패치 기록
   - [`phase/axis1/axis1-round1-all-family-read.md`](phase/axis1/axis1-round1-all-family-read.md) — weighted family read
   - [`phase/axis1/axis1-round2-guardrail-floor.md`](phase/axis1/axis1-round2-guardrail-floor.md) — guardrail fix + floor 40
   - [`phase/axis1/axis1-round3-registry-shadow-bridge.md`](phase/axis1/axis1-round3-registry-shadow-bridge.md) — registry shadow bridge
   - [`phase/axis1/axis1-round4-registry-uplift.md`](phase/axis1/axis1-round4-registry-uplift.md) — registry primary + cluster uplift
   - [`phase/axis1/axis1-round5-explanation-routing.md`](phase/axis1/axis1-round5-explanation-routing.md) — producer-side explanation 강화

5. **Live SSOT** — Round 6 이후 운영 기준 문서 (변경 시 먼저 확인)
   - [`ssot/axis1-live-ssot.md`](ssot/axis1-live-ssot.md)

6. **Gold Fixtures** — 회귀 방지용 QA 기준 fixture
   - [`ssot/axis1-gold-fixtures-v1.md`](ssot/axis1-gold-fixtures-v1.md)
