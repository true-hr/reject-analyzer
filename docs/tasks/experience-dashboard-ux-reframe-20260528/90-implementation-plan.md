# 구현 계획

작성 예정.

## 현재 기본 방향

1. `origin/main` 기준 새 worktree/새 브랜치에서 구현한다.
2. 우선 `HomeDashboard.jsx` 중심으로 산출물 A를 구현한다.
3. PR #574와 충돌 가능성이 큰 파일은 피한다.
4. 산출물 A 완료 후 산출물 B, C를 순차 구현한다.
5. 각 산출물은 해당 md 파일의 체크리스트를 만족해야 완료로 본다.

## 추천 구현 브랜치

```text
ux/user-experience-dashboard-reframe-20260528
```

## 추천 worktree

```text
D:\패스맵\worktrees\ux-user-experience-dashboard-reframe-20260528
```

## 검증 기본값

```powershell
git diff --check
npm run build
```
