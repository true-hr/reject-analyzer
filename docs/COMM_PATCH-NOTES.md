# COMM_PATCH-NOTES

## 역할
- PASSMAP Evidence Fit v1 최소 범위 구현 엔지니어

## 결과 요약
- Evidence Fit v1 helper를 추가/정합화하고(analyzer/decision 최소 연결 유지), soft penalty 경로를 확인했습니다.
- 범위는 요청한 3개 파일로 제한했습니다.

## 영향 파일
- src/lib/decision/evidence/evaluateEvidenceFit.js
- src/lib/analyzer.js
- src/lib/decision/index.js

## 핵심 반영
1. evaluateEvidenceFit helper
- 결과 shape: overallScore/level/penalty + mustHave/preferred/tools/coreTasks + scoreBreakdown/signals/summary
- alias v1 반영:
  - TOOL_ALIASES: power bi/excel/sql/sap
  - TASK_ALIASES: 전략 수립/데이터 분석/프로젝트 관리/운영 개선
- 방어 로직:
  - resumeText 비어있음 -> overallScore 100, penalty 0, level none
  - JD 타겟 0개 -> overallScore 100, penalty 0, level none
- score/penalty/signal 계산 반영

2. analyzer 연결 (유지 확인)
- analyze()에서 evidenceFit 계산
- analyze() return에 evidenceFit append
- window.__LAST_PACK__ / globalThis.__LAST_PACK__에 evidenceFit append

3. decision 연결 (유지 확인)
- buildDecisionPack에서 evidenceFit.penalty를 soft penalty로 반영
- gate/cap 구조 변경 없이 기존 점수 흐름에서 차감
- decisionScore.meta에 evidencePenalty/evidenceFitLevel/evidenceFitOverallScore 추가

## 유지한 것
- App.jsx, report UI, InputFlow 및 첨부/PDF 관련 파일 미수정
- gate 추가 없음
- analyzer/decision 대공사 없음

## 리스크 포인트
- substring 매칭 기반이라 짧은 토큰 오탐 가능성
- jdModel 품질 의존
- level "none"이 평가제한/최저수준 의미로 겹칠 수 있음

## 수동 테스트 항목
- resumeText 없음 방어 로직
- JD 타겟 없음 방어 로직
- mustHave/tool gap signal 동작
- analyze 결과 및 __LAST_PACK__ evidenceFit 노출
- decision soft penalty 반영 확인
