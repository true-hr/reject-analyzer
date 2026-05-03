# GitHub Actions PR Validation Workflow

**Date**: 2026-05-03  
**Status**: Implemented  
**Branch**: chore/github-actions-pr-validation

---

## 1. 필요성 (Why)

### 문제 상황
- Axis1 Round 1 Major Course/Bridge Registry PR (feat/newgrad-axis1-round1-major-course-registry)은 코드 구현은 완료되었으나, Claude 환경에 Node.js가 없어 runtime test와 npm build를 실행할 수 없었음
- 현재 원칙: 사용자에게 매번 로컬 test/build 실행을 요구하지 않음
- 결과: PR이 정적 검증만으로 커밋되고, runtime 검증은 미완료 상태로 유지

### 해결책
- GitHub Actions를 통해 모든 PR에 대해 자동으로 Node.js 환경에서 build/test를 실행
- Claude에서 불가능한 runtime 검증을 GitHub이 대신 수행
- 검증 실패 시 PR 머지 차단 (status check)
- 개발자는 로컬 환경 없이도 PR 검증 가능

---

## 2. 자동화 범위 (What)

### Workflow 트리거
```yaml
on:
  pull_request:
    branches:
      - main
```
- **언제**: main 브랜치로의 모든 pull_request에 대해 실행
- **어디서**: ubuntu-latest (GitHub Actions 공용 러너)
- **환경**: Node.js 20

### 실행 단계

#### Step 1: Checkout
```
Checkout: main 기준으로 PR 코드 다운로드
```
- 액션: actions/checkout@v4
- 목적: PR 브랜치의 전체 코드 가져오기

#### Step 2: Setup Node.js
```
Setup Node.js 20 with npm caching
```
- 액션: actions/setup-node@v4
- 버전: 20 (최신 LTS)
- 캐싱: npm cache를 활용하여 dependency 설치 속도 향상
- 이점: 매 PR마다 node_modules 신규 설치하지 않아도 됨 (시간 절감)

#### Step 3: Install Dependencies
```
npm ci
```
- npm ci (clean install): package-lock.json 기반 정확한 버전 설치
- 이점: package.json과 package-lock.json이 동기화된 상태 보장
- 부작용 없음: package-lock.json 수정 없음

#### Step 4: Run Axis1 Registry QA (조건부)
```bash
if [ -f "scripts/qa/test-axis1-registry-integration.mjs" ]; then
  node scripts/qa/test-axis1-registry-integration.mjs
else
  echo "Axis1 registry QA script not found. Skipping."
fi
```
- 조건: scripts/qa/test-axis1-registry-integration.mjs 파일 존재 여부 확인
- 존재하면: node로 실행
- 없으면: 스킵 (다른 PR에 영향 없음)
- 목적: Round 1 registry PR의 5개 필수 + 4개 권장 test case 자동 실행

#### Step 5: Build
```
npm run build
```
- 명령: vite build (package.json line 9)
- 목적: 번들링 및 컴파일 단계 검증
- 실패 시: PR status check fail

---

## 3. Axis1 Round 1 Registry PR 검증 방법

### 현재 상황
- **PR**: feat/newgrad-axis1-round1-major-course-registry
- **Commit**: d1554ad (feat), 57be947 (docs)
- **Status**: MERGE HOLD - Pending Runtime Validation

### 검증 프로세스

**Step 1: PR 생성 또는 업데이트**
```
사용자가 feat/newgrad-axis1-round1-major-course-registry로 push
→ GitHub이 main 기준 PR 감지
```

**Step 2: GitHub Actions 자동 실행**
```
1. Node.js 20 설정
2. npm ci로 의존성 설치
3. scripts/qa/test-axis1-registry-integration.mjs 실행
   - 5개 필수 test case 자동 검증 (ECONOMICS, BUSINESS_ADMIN, CS_BACKEND, CS_PM, MATH_DATA)
   - 4개 권장 smoke test 포함
4. npm run build 실행
   - vite로 번들링 검증
```

**Step 3: 결과 확인**
```
✅ All tests PASS + Build success
→ PR 검증 완료, 머지 가능

❌ Any test FAIL or Build error
→ PR 검증 실패, 머지 차단, 개발자에게 알림
```

### 이전과의 차이

| 항목 | 이전 (수동) | 이후 (자동화) |
|------|-----------|----------|
| 테스트 실행 | Claude에서 불가능 → 미실행 | GitHub Actions에서 자동 실행 |
| Build 검증 | Claude에서 불가능 → 미실행 | GitHub Actions에서 자동 실행 |
| 검증 책임 | 사용자 (로컬 환경 필요) | GitHub (공용 환경) |
| 머지 가능 시점 | 정적 검증만 후 즉시 | 모든 검증 (정적+runtime+build) 후 |
| PR status check | 없음 | 있음 (검증 실패 시 차단) |

---

## 4. 실패 시 확인 항목

### Test Case Failure

**현상**: test-axis1-registry-integration.mjs 실패

**원인 가능성**:
1. Registry data 누락 (예: BUSINESS_ADMIN→PMM 과목 미노출)
2. majorKey 한글/영문 처리 오류 (예: "경제학" vs "ECONOMICS")
3. 기존 Economics→PMM 로직 손상 (backward compatibility 위반)
4. appealing courses 배열 오염 (cross-major contamination)

**확인 방법**:
```bash
# 로컬에서 직접 실행
cd D:\패스맵\reject-analyzer
node scripts/qa/test-axis1-registry-integration.mjs

# GitHub Actions 로그 확인
PR → Actions 탭 → PR Validation workflow → Run Axis1 registry QA step
```

### Build Failure

**현상**: npm run build (vite build) 실패

**원인 가능성**:
1. JavaScript/JSX 구문 오류
2. Import 경로 오류 (예: typo in newgradMajorBridgeRegistry import)
3. ESLint/TypeScript 검증 오류
4. Module resolution 오류

**확인 방법**:
```bash
# 로컬에서 직접 실행
cd D:\패스맵\reject-analyzer
npm run build

# 오류 메시지로 파일/줄 번호 파악
# 해당 위치의 코드 검토
```

### 종합 디버깅

**PR이 검증 실패하는 경우**:
1. GitHub Actions 로그 확인 (PR → Checks 탭)
2. 오류 메시지 읽기 (test case name, build error detail)
3. 해당 파일 검토 및 수정
4. Commit push → GitHub Actions 자동 재실행
5. Status check 통과 시 머지 가능

---

## 5. Local Node Unavailable 문제 우회 방법

### 문제
```
Claude 환경 (현재):
- Node.js: NOT INSTALLED
- npm: NOT INSTALLED
- 결과: runtime test/build 불가능
```

### 우회 방법: GitHub Actions

**원리**:
```
Claude (정적 검증만 가능)
  ↓
GitHub Actions (runtime 검증)
  ↓
PR Status Check (머지 차단/허용)
```

**흐름**:
1. Claude에서 구현 → 정적 검증 → Commit (정상)
2. GitHub Actions 자동 실행 → runtime 검증 → Status check result
3. 검증 실패 시: PR 머지 불가 (required check)
4. 검증 성공 시: PR 머지 가능

**이점**:
- ✅ 로컬 Node.js 설치 불필요
- ✅ 사용자 매번 test/build 실행 불필요
- ✅ 모든 PR에 일관된 검증 기준 적용
- ✅ 검증 결과 (logs) GitHub에 자동 저장
- ✅ 검증 재실행 간단 (PR update → 자동 재실행)

---

## 6. Workflow 파일 상세

**파일 위치**: `.github/workflows/pr-validation.yml`

**주요 설정**:
```yaml
name: PR Validation                          # 워크플로우 이름

on:
  pull_request:                              # PR 이벤트에서만 실행
    branches:
      - main                                 # main으로의 PR만

jobs:
  validate:
    runs-on: ubuntu-latest                   # Ubuntu 공용 러너

    steps:
      - uses: actions/checkout@v4            # PR 코드 다운로드
      - uses: actions/setup-node@v4          # Node.js 20 설정
        with:
          node-version: "20"
          cache: "npm"                       # npm cache 활용
      
      - run: npm ci                          # 정확한 버전 설치
      - run: node scripts/qa/...             # Axis1 test (조건부)
      - run: npm run build                   # Build 검증
```

**주의사항**:
- ✅ package.json 수정 없음
- ✅ package-lock.json 수정 없음
- ✅ npm ci 사용 (안전한 설치)
- ✅ 조건부 Axis1 test (다른 PR 영향 없음)

---

## 7. 향후 확장

### Phase 1 (현재)
- ✅ PR validation workflow 추가
- ✅ Node.js 20 + npm ci
- ✅ Axis1 registry QA 자동 실행
- ✅ Build 검증

### Phase 2 (향후)
- [ ] Lint 검증 추가 (npm run lint)
- [ ] 다른 test suite 추가 (npm run test:decision 등)
- [ ] Coverage report 통합
- [ ] 실패 시 알림 설정 (Slack, email 등)

---

## 8. 통합 효과

### Round 1 Registry PR의 변화

**Before (이전)**:
```
PR 생성 → 정적 검증 (Claude) → MERGE HOLD
❌ Runtime 검증 미실행
❌ Build 검증 미실행
❌ Status check 없음
```

**After (현재)**:
```
PR 생성 → 정적 검증 (Claude) + 자동 runtime 검증 (GitHub Actions)
✅ 5개 필수 test case 자동 실행
✅ Build 검증 자동 실행
✅ Status check 결과에 따른 머지 가능/불가
```

### CI/CD 파이프라인 개선
- ✅ Python script → GitHub Actions로 자동화
- ✅ 로컬 Node.js 설치 불필요
- ✅ PR마다 일관된 검증 기준
- ✅ 검증 실패 시 머지 차단 (정책 강제)

---

## 9. Checklist

**Workflow 생성**:
- ✅ `.github/workflows/pr-validation.yml` 생성
- ✅ pull_request 트리거 설정 (main only)
- ✅ Node.js 20 설정
- ✅ npm ci (package-lock.json 기반)
- ✅ Axis1 QA 조건부 실행
- ✅ npm run build 실행

**보고서**:
- ✅ 필요성 설명
- ✅ 검증 범위 문서화
- ✅ Round 1 PR 검증 방법 설명
- ✅ 실패 시 디버깅 가이드
- ✅ Node 없음 문제 우회 방법 설명

**커밋 준비**:
- ✅ Workflow 파일만 수정
- ✅ package.json/package-lock.json 미수정
- ✅ unrelated 파일 미수정

---

**Status**: Ready for commit  
**Last Updated**: 2026-05-03  
**Next Step**: Push to chore/github-actions-pr-validation and create PR
