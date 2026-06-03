# Career Core Operations Quality Calibration

## 1. 문제 요약

PR #719 realistic QA에서 `operations / CS / process improvement` JD가 `service quality metrics` 표현 때문에 `production_quality` target으로 과잉 추론되는 REVIEW 이슈가 확인됐다.

## 2. 원인 추정

`buildCareerCoreTargetFromJdFit`의 role inference가 `quality` 단어 하나를 `production_quality` 신호로 먼저 처리했다. 이 때문에 제조/생산 문맥이 없는 service quality, support quality, CS quality metrics 같은 운영 품질 표현도 제조품질 target처럼 해석됐다.

## 3. 변경한 로직

- `production_quality` inference 조건을 `hasProductionQualitySignal` helper로 분리했다.
- generic `quality` 단어 단독 매칭을 제거했다.
- `production`, `manufacturing`, `process control`, `GMP`, `batch record`, `deviation`, `CAPA`, `inspection`, `validation`, `QC`, `QA`, `quality control`, `품질관리`, `제조품질`, `생산품질`, `공정품질`, `제조기록서`, `일탈`, `실사`, `밸리데이션`, `바이오 의약품`, `의약품 생산` 등 생산/품질 문맥이 있을 때만 `production_quality`를 반환하도록 보정했다.
- 새 role family는 추가하지 않았다. 기존 `operations` family가 있는 경우 해당 경로로 남긴다.

## 4. 변경 전/후 결과

| case | before | after | status |
| --- | --- | --- | --- |
| real-007-operations-cs-process | `production_quality / b2b_saas` | `operations / b2b_saas` | PASS |
| Bio/GMP quality JD | `production_quality / bio_pharma` | `production_quality / bio_pharma` | PASS |
| Korean Bio/GMP quality JD | `production_quality / bio_pharma` | `production_quality / bio_pharma` | PASS |
| ambiguous JD | skipped | skipped | PASS |

## 5. regression 보호 케이스

- `service quality metrics` alone must not infer `production_quality`.
- `customer quality`, `support quality`, `CS quality metrics`, `service improvement` alone must not infer `production_quality`.
- Bio/GMP quality direct cases must stay `production_quality`.
- Korean Bio/GMP quality case must stay `production_quality`.
- PM/SaaS, career education, marketing content, ambiguous JD behavior must remain stable through existing tests.

## 6. realistic QA 결과

`scripts/qa-rejection-career-core-realistic-samples.js` 기준:

- Total: 15
- Ready: 14
- Skipped: 1
- PASS: 14
- REVIEW: 1
- FAIL: 0

Remaining REVIEW is the pre-existing month bucket precision concern for short-tenure marketing, not target inference.

## 7. 남은 한계

- `QA` is still treated as a production-quality signal because the current v0 keyword set does not distinguish manufacturing QA from software QA. Broader disambiguation should be handled in a separate calibration batch if needed.
- `operations` is already supported, but its industry inference can still choose `b2b_saas` when `platform` appears. This batch did not change industry inference.
- Month bucket copy/precision risk remains out of scope because UI/copy changes were forbidden.

## 8. 다음 단계 추천

1. Add a dedicated software QA vs manufacturing QA disambiguation batch if QA roles become common in samples.
2. Add more Korean-only operations/CS samples to verify generic `품질` phrases outside manufacturing.
3. Review month bucket wording in a future UI/copy batch.
