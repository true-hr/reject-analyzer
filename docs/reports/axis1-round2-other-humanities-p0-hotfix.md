# Axis1 Round 2 P0 Hotfix: OTHER_HUMANITIES → CONTENT_MARKETING 과장 표현 완화

## 작업 목적

Round 2 QA에서 WEAK로 분류된 OTHER_HUMANITIES → CONTENT_MARKETING 직무 연결 케이스를 보완합니다.

- **문제**: 현재 문구가 기타 인문 전공과 콘텐츠마케팅의 연결을 "직접 연결"처럼 표현함
- **목표**: "인문학적 텍스트 해석/맥락 이해는 콘텐츠 기획의 기초가 될 수 있으나, 실제 콘텐츠 제작·성과 데이터·포트폴리오가 함께 필요하다"는 방향으로 정직하게 낮추기
- **범위**: Round 3 진행 전 필수 보완 작업

## 발견 문제

### 원문 분석 (수정 전)

#### majorDefinition
```
인문학은 인간의 사상, 문화, 언어, 역사를 분석하고, 그 맥락 속에서 의미와 메시지를 구성하는 기초를 제공합니다.
```
- **문제**: 인문학 전공 범위가 넓으나 (문학/어문/역사/철학/문화연구 등), 콘텐츠마케팅과의 연결 강도 차이를 설명하지 않음

#### jobConnection
```
콘텐츠 기획과 브랜드의 핵심은 '대상 관객의 관심, 가치, 맥락을 이해하고, 그에 맞는 메시지를 구성하는' 것입니다. 
인문학은 텍스트 해석, 역사적 맥락 이해, 문화 분석을 훈련하므로, '왜 이 메시지가 이 관객에게 먹히는가'를 설명할 수 있습니다.
```
- **문제**: "설명할 수 있습니다"로 과다 자신감 표현
- **문제**: 전공만으로 콘텐츠마케팅 연결을 강하게 단정함
- **문제**: 실제 제작 경험/성과 데이터 필요성을 언급하지 않음

#### careerBridge
```
따라서 인문학에서 배운 텍스트 분석, 메시지 구성, 맥락 해석, 자료 요약은 콘텐츠 스크립트 작성, 브랜드 스토리텔링, 
직원/고객 커뮤니케이션, 관점 전환으로 연결될 수 있습니다. 
다만 구체적인 콘텐츠 제작(글쓰기, 영상, 디자인), 데이터 분석, 성과 측정 경험이 함께 필요합니다.
```
- **문제**: 앞부분에서 "연결될 수 있습니다"로 직접 연결처럼 표현
- **다행**: 뒷부분에서 경험 필요성을 언급하나, 균형이 맞지 않음

## 수정 내용

### 수정 파일
- `src/data/transitionLite/newgradMajorBridgeRegistry.js` (OTHER_HUMANITIES 섹션)
- `scripts/qa/test-axis1-registry-integration.mjs` (Case 15 검증 강화)
- `docs/reports/axis1-round2-other-humanities-p0-hotfix.md` (본 리포트)

### 수정 후 문구

#### majorDefinition (개선)
```
기타 인문 전공은 문학, 어문, 역사, 철학, 문화연구 등 세부 분야에 따라 강점이 달라지는 넓은 범주의 전공입니다. 
공통적으로는 텍스트와 사람, 사회·문화적 맥락을 해석하는 훈련을 제공하지만, 
콘텐츠마케팅과의 연결 강도는 실제 제작 경험과 포트폴리오에 따라 크게 달라집니다.
```

**개선점**:
- 인문학 세부 전공의 다양성 명시
- "기초를 제공한다"에서 "연결 강도는 경험과 포트폴리오에 따라 다르다"로 전환
- 현실적인 기준 제시

#### jobConnection (개선)
```
기타 인문 전공은 텍스트 해석, 문화적 맥락 이해, 서사 구조 분석을 통해 
메시지가 어떤 의미로 받아들여지는지 생각하는 훈련을 제공합니다. 
다만 콘텐츠마케팅과의 연결은 전공명만으로 강하게 주장하기보다는, 
글쓰기·콘텐츠 제작·브랜드 메시지 구성·성과 분석 경험이 함께 제시될 때 설득력이 높아집니다.
```

**개선점**:
- "설명할 수 있습니다" → "훈련을 제공합니다" (과다 자신감 제거)
- "직접 연결" 뉘앙스 제거
- "경험이 함께 제시될 때"로 명시적 강조
- "설득력이 높아진다"로 조건부 표현

#### careerBridge (개선)
```
텍스트 분석, 메시지 구성, 맥락 해석은 콘텐츠 기획의 기초가 될 수 있습니다. 
다만 실제 콘텐츠마케팅에서는 글쓰기, 영상/이미지 기획, 채널 운영, 반응 데이터 분석, 성과 개선 경험이 핵심이므로, 
인문학적 해석 역량을 구체적인 콘텐츠 제작물과 성과 지표로 연결해 보여주는 것이 중요합니다.
```

**개선점**:
- "기초가 될 수 있다"로 완화 (직접 연결이 아님)
- "글쓰기, 영상/이미지 기획, 채널 운영, 반응 데이터 분석, 성과 개선"으로 구체화
- "역량을 제작물과 성과 지표로 연결해 보여주기"로 현실적 실행 방향 제시

#### appealingCourses (개선)
```
"문학개론/문예창작",
"글쓰기/크리에이티브 라이팅",
"한국사/세계사",
"철학 (인식론, 윤리)",
"언어학/문법론",
"문화연구",
"수사학/설득 이론",
"기호학"
```

**개선점**:
- "글쓰기/크리에이티브 라이팅" 추가 (콘텐츠 제작 역량 강조)

#### evidencePrompts (강화)
```
"직접 작성한 콘텐츠 (블로그, 뉴스레터, 영상 스크립트, SNS 운영)",
"브랜드 스토리, 캠페인 메시지 작성",
"특정 타깃 독자·고객을 위한 메시지 톤, 소재 조정 경험",
"콘텐츠 조회수, 클릭률, 저장, 공유, 댓글 등 반응 데이터 확인 및 개선",
"전공 과제나 리서치를 콘텐츠/브랜드 메시지로 재구성한 경험"
```

**개선점**:
- "직접 작성한 콘텐츠" → 더 구체적인 포맷 명시 (블로그, 뉴스레터, 영상 스크립트, SNS)
- "메시지 톤, 소재 조정 경험" 추가 (타깃 이해 강조)
- "반응 데이터 확인 및 개선" 추가 (성과 분석 중요성 강조)
- "전공 과제 재구성 경험" 추가 (현실적 실행 경로 제시)

## 회귀 검증 (Test Coverage)

`scripts/qa/test-axis1-registry-integration.mjs` Case 15 검증 로직 강화:

```javascript
} else if (idx === 14) {
  // Case 15: OTHER_HUMANITIES → CONTENT_MARKETING (P0 softened bridge)
  const hasSoftenedPhrase = result.liftOrLimit.includes("기초가 될 수") || result.scoreReason.includes("기초가 될 수");
  const hasProductionEmphasis = result.liftOrLimit.includes("콘텐츠 제작") || result.liftOrLimit.includes("성과") || result.liftOrLimit.includes("데이터");
  const noOverClaim = !result.scoreReason.includes("설명할 수 있습니다") && !result.scoreReason.includes("연결될 수 있습니다");

  if (hasSoftenedPhrase) {
    checks.push("✓ Softened bridge phrase '기초가 될 수' detected");
  } else {
    checks.push("⚠ Softened phrase not clearly detected");
  }
  if (hasProductionEmphasis) {
    checks.push("✓ Content production/performance emphasis detected");
  } else {
    checks.push("⚠ Production/performance emphasis unclear");
  }
  if (noOverClaim) {
    checks.push("✓ No over-claiming language detected");
  } else {
    checks.push("⚠ Possible over-claiming language found");
  }
}
```

**검증 목표**:
1. "기초가 될 수" 또는 완화 표현 포함 여부
2. "콘텐츠 제작", "성과", "데이터" 등 경험 보완 표현 포함 여부
3. "설명할 수 있습니다", "연결될 수 있습니다" 같은 과다 자신감 표현 없음

## 수정 전후 비교

| 항목 | 수정 전 | 수정 후 |
|------|--------|--------|
| jobConnection 핵심 표현 | "설명할 수 있습니다" | "훈련을 제공합니다" |
| careerBridge 연결 표현 | "연결될 수 있습니다" | "기초가 될 수 있습니다" |
| 필요 조건 강조 | "다만 필요합니다" | "경험이 함께 제시될 때", "핵심이므로" |
| appealingCourses | 7개 항목 | 8개 항목 (+글쓰기) |
| evidencePrompts | 5개 항목 | 5개 항목 (구체성 강화) |

## 파일 변경 요약

```
Modified:   src/data/transitionLite/newgradMajorBridgeRegistry.js
  - OTHER_HUMANITIES.jobBridgeMap.CONTENT_MARKETING
    - majorDefinition: 세부 전공 다양성 + 경험 기반 연결 강도 언급
    - jobConnection: 과장 표현 제거, 경험 필요성 강조
    - careerBridge: "기초가 될 수" 완화, 실제 콘텐츠 제작 경험 명시화
    - appealingCourses: "글쓰기/크리에이티브 라이팅" 추가
    - evidencePrompts: 5개 항목으로 재구성 (성과 분석, 타깃 조정 강조)

Modified:   scripts/qa/test-axis1-registry-integration.mjs
  - Case 15 (OTHER_HUMANITIES → CONTENT_MARKETING) expectedBehavior 업데이트
  - idx === 14 검증 로직 추가 (완화 표현 + 경험 강조 + 과장 표현 제거 확인)

Created:    docs/reports/axis1-round2-other-humanities-p0-hotfix.md
  - 본 리포트
```

## Round 3 진행 판단

✅ **P0 보완 완료**: OTHER_HUMANITIES → CONTENT_MARKETING 직무 연결이 다음을 만족합니다.

- ✓ "기초가 될 수 있음" 등 완화 표현으로 직접 연결 뉘앙스 제거
- ✓ "콘텐츠 제작", "성과 데이터" 등 필요 경험 명시화
- ✓ "설명할 수 있습니다" 등 과다 자신감 표현 제거
- ✓ 기타 인문 세부 전공의 다양성 및 연결 강도 차이 인정
- ✓ 회귀 검증 강화 (3단계 자동 검증)

**결론**: 이 P0 보완이 통과되면 Round 3 착수 가능합니다.

---

**작업 일시**: 2026-05-04
**worktree**: /d/패스맵/worktrees/fix-axis1-round2-other-humanities-p0
**branch**: fix/axis1-round2-other-humanities-p0
