
## 2026-03-08 실행 컨텍스트 점검 및 최소 수정 판단 (OCR env)

요약 판단
- 현재 구조에서 가장 맞는 로컬 실행 조합:
  1) `vercel dev` (API runtime, 3000)
  2) `vite dev` (frontend, 5173)
- 프론트는 `/api/ocr`를 `http://localhost:3000`으로 호출하도록 `VITE_PARSE_API_BASE`를 사용
- `npm run dev`(vite 단독)만으로는 API 런타임 컨텍스트를 재현하지 못함

검증 사실
- `.env.local`에 `GOOGLE_CLOUD_VISION_API_KEY` 라인 존재 및 비어있지 않음(값 미출력 원칙 준수)
- `api/ocr.js`는 `process.env.GOOGLE_CLOUD_VISION_API_KEY`를 직접 읽음
- 런타임 로그 `hasVisionKey:false`면 파일 누락보다 "해당 런타임이 env를 로드하지 못한 상태" 가능성이 높음

권장 실행 순서
1) 터미널 A: `vercel dev --listen 3000`
2) 터미널 B: `npm run dev -- --host 127.0.0.1 --port 5173`
3) 브라우저에서 5173 접속 후 OCR 재시도
4) `vercel dev` 터미널에서 아래 로그 순서 확인
   - `[api/ocr.env]`
   - `[api/ocr.request]`
   - `[api/ocr.visionResponse]`
   - `[api/ocr.raw]` / `[api/ocr.return]` / `[api/ocr.catch]`

그래도 `hasVisionKey:false`일 때 최소 수정 판단
- `vercel dev` 컨텍스트가 정상이라면 `dotenv` 설치/로드는 원칙적으로 불필요
- 그래도 동일 증상이 지속될 때의 최소 수정안(1파일 기준 코드):
```js
import "dotenv/config";
```
- 삽입 위치: `api/ocr.js` 최상단(첫 줄)
- 주의: 위 코드를 사용하려면 `dotenv` 패키지 설치가 선행되어야 함

원칙 재확인
- 성공 처리 우회 금지
- ok:true 강제 금지
- 빈 text 보정 금지
