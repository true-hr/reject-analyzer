# Rejection Career Core Month Bucket Copy Polish

## 1. 문제 요약

PR #719 realistic QA에서 Career Core v0 참고 신호 box의 `18개월`, `48개월`, `60개월` 같은 month bucket 값이 정밀한 기간 산정처럼 읽힐 수 있다는 REVIEW 이슈가 남았다.

## 2. 변경한 copy/layout

- title은 `Career Core v0 참고 신호`로 유지했다.
- caution copy에 `개월 수는 정밀한 기간 산정이 아닌 항목 기준 참고값입니다.`를 추가했다.
- month bucket grid 위에 helper copy를 추가했다.
- bottom note를 `참고: 경험 항목 기준 합산값이며, 중복 기간은 별도 보정하지 않습니다.`로 확장했다.
- 숫자 값과 bucket 구조는 유지했다.

## 3. 변경하지 않은 범위

- App.jsx 변경 없음.
- API, DB, schema, env, deployment 변경 없음.
- rejection risk scoring 변경 없음.
- Career Core target inference 변경 없음.
- month bucket 값 계산 변경 없음.
- 큰 UI 개편이나 강조 색상 변경 없음.

## 4. before/after copy

| 위치 | before | after |
| --- | --- | --- |
| title | `Career Core v0 참고 신호` | `Career Core v0 참고 신호` |
| caution | `직무/산업 신호 기준의 보조 분류이며, 탈락 원인 확정이 아닌 참고용 해석입니다.` | `직무/산업 신호 기준의 보조 분류이며, 탈락 원인 확정이 아닌 참고용 해석입니다. 개월 수는 정밀한 기간 산정이 아닌 항목 기준 참고값입니다.` |
| month helper | 없음 | `아래 개월 수는 경험 항목을 기준으로 합산한 참고값입니다. 중복 기간이나 세부 기여도는 별도 보정하지 않습니다.` |
| bottom note | `경험 항목 기준 합산` | `참고: 경험 항목 기준 합산값이며, 중복 기간은 별도 보정하지 않습니다.` |

## 5. QA 기준

- ready signal에서 Career Core box가 계속 렌더된다.
- skipped/missing signal은 미렌더 상태를 유지한다.
- month bucket values는 계속 표시된다.
- copy는 참고용, 항목 기준, 중복 기간 미보정 뉘앙스를 명확히 한다.
- 기존 rejection summary보다 Career Core box를 더 강조하지 않는다.

## 6. 테스트 결과

- `node scripts/test-career-core-timeline.js` PASS
- `node scripts/test-career-core-signals.js` PASS
- `node scripts/test-career-core-fit.js` PASS
- `node scripts/qa-career-core-fit-real-cases.js` PASS
- `node scripts/test-resume-jd-career-core-bridge.js` PASS
- `node scripts/test-rejection-career-core-bridge.js` PASS
- `node scripts/test-rejection-career-core-ui-wiring.js` PASS
- `node scripts/qa-rejection-career-core-realistic-samples.js` PASS, 15 PASS / 0 REVIEW / 0 FAIL
- `node scripts/test-career-core-target-inference-calibration.js` PASS
- `npm run build` PASS

## 7. 남은 한계

- Browser screenshot QA는 별도 수행하지 않았다.
- mobile에서는 helper 문장이 한 줄 더 늘어나므로 실제 화면에서 다소 길게 느껴질 수 있다.
- month bucket 값 자체는 그대로 표시되므로, 더 강한 완화가 필요하면 `약 N개월` 표기 검토가 필요하다.

## 8. 다음 단계 추천

1. 별도 UI QA에서 mobile screenshot으로 box 높이와 hierarchy를 확인한다.
2. product/copy review에서 `약 N개월` 표기 여부를 검토한다.
3. Career Core box 전체 설명을 tooltip/접힘 처리할지 후속 UX batch에서 판단한다.
