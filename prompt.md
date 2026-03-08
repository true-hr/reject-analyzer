이번 작업은 검토/요약이 아니라 실제 실행이다.

목표:
로컬 변경사항을 커밋하고 origin/main에 push해서 Vercel 배포를 실제로 발생시켜라.

중요:
- 더 이상 “배포 미반영” 분석 반복 금지
- 지금은 보고서 작성보다 명령 실행이 우선
- 커밋/푸시 중 에러가 나면 그 에러만 그대로 보고
- 성공하면 배포 반영 여부까지 확인
- 임의 코드 수정 금지
- git add 대상은 아래 지정 파일만 우선 사용

실행 명령:
git status
git add api/extract-job-posting.js src/App.jsx src/components/input/InputFlow.jsx src/lib/extract/extractTextFromFile.js src/lib/storage.js src/lib/decision/index.js src/components/SimulatorLayout.jsx src/lib/decision/riskProfiles/ownershipLeadership/decisionSignalRisk.js .gitattributes
git commit -m "feat: OCR pipeline, finalText, bodyImageUrls, EUC-KR fix, API_BASE unification"
git push

push 후 해야 할 일:
1. Vercel 배포가 시작됐는지 확인
2. 배포 완료 후 아래 엔드포인트를 다시 확인
   - https://reject-analyzer.vercel.app/api/extract-job-posting
3. 응답에 아래 키가 생겼는지 확인
   - bodyImageUrls
   - ocrText
   - finalText
   - meta.ocrAttempted
   - meta.ocrSuccessCount
   - meta.ocrFailCount

출력 형식:
1. git commit 성공 여부
2. git push 성공 여부
3. Vercel 배포 시작/완료 여부
4. 배포 후 응답 키 확인 결과
5. 실패했다면 실패한 정확한 명령과 에러 원문