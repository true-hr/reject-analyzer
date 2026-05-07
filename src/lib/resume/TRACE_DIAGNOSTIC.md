# RESUME_AI Reset Trace Diagnostic

## 활성화 방법

브라우저 DevTools 콘솔에서:

```javascript
// 진단 로그 활성화
window.__RESUME_AI_TRACE_ENABLED = true;

// 또는 한 줄로
Object.assign(window, { __RESUME_AI_TRACE_ENABLED: true });
```

## 테스트 플로우

1. DevTools → Console 탭 열기
2. 위 명령 실행 (활성화)
3. "이번 주 기록" 또는 "프로젝트 기록" 탭에서 기록 선택
4. "AI 초안 만들기" 클릭
5. Console에서 [RESUME_AI_RESET_TRACE:*] 로그 확인
6. 이력서 보기 화면에서 After 카드 확인

## 로그 해석

### 정상 플로우
```
[set] bulletsLen: 2
→ (화면 렌더)
[view] stateBullets: 2, afterBullets: 2, isAiGenerated: true
→ 화면에 AI bullets 표시됨 ✅
```

### 원인 A: Reset by currentResumeCandidateKey Effect
```
[set] bulletsLen: 2
[effect:enter] bulletsLen: 2
[reset:effect] bulletsBefore: 2
[view] stateBullets: 0, afterBullets: 0
→ 화면에 fallback 표시됨 ❌
→ KEY 변경 감지해야 함
```

### 원인 B: No Reset but View Shows 0
```
[set] bulletsLen: 2
(no reset logs)
[view] stateBullets: 0 (???)
→ Component remount 또는 stale closure
```

### 원인 C: View Gets Bullets but Render Shows Fallback
```
[set] bulletsLen: 2
[view] stateBullets: 2, afterBullets: 2, isAiGenerated: true
→ 화면에 fallback 표시됨 ❌
→ Visible AFTER card branch issue
```

## 로그 제거

테스트 완료 후:
```bash
# 모든 [RESUME_AI_RESET_TRACE] 제거
git checkout src/components/mvp/PmMvpView.jsx
```

또는 수동으로 다음 라인들 삭제:
- Line 1111-1120 (currentResumeCandidateKey 로그)
- Line 1139-1149 (useEffect enter 로그)
- Line 1151-1160 (early return 로그)
- Line 1162-1170 (reset effect 로그)
- Line 1345-1355 (API success 로그)
- Line 1491-1500 (import reset 로그)
- Line 733-751 (view model useEffect 전체)
