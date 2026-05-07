## Summary

- Refine career report strength/risk copy so it better matches target job-industry context
- Replace awkward user-facing "입력한 경험을 바탕으로" style phrasing
- Add target-context handling for B2C product execution, finance, healthcare, and brand/consumer cases
- Keep compoundRead logic unchanged

## Changed files

- src/lib/transitionLite/buildTransitionLiteResult.js

## Verification

- Static keyword check: PASS
- Representative case QA: PASS
  - 서비스기획 / 광고·마케팅 에이전시 → 프로젝트관리(PM/PO/PL) / B2C 플랫폼
  - 서비스기획 → 핀테크/증권·자산운용
  - 서비스기획 → 디지털헬스/헬스케어
  - 콘텐츠기획/브랜드마케팅 → 뷰티·소비재
- compoundRead unchanged
- npm run build: PASS by user local verification