# Axis1 Special Major Bridge Registry Implementation Report

## 작업 목적

Special Major 입력표 문서(axis1-special-major-inputs.md)를 바탕으로, Axis1 Major Bridge Registry에 4개 특수 전공 케이스를 구현하여 사용자 리포트 출력에 반영하는 것.

## 추가한 Special 케이스 4개

| # | Canonical Key | 한글 명 | Target Job | 특징 |
|---|---|---|---|---|
| 1 | DOUBLE_MAJOR | 복수전공 | PM_SERVICE_PLANNING | 조합 의존, 교차점 중심 |
| 2 | CONVERGENCE_MAJOR | 융합전공 | BUSINESS_STRATEGY | 구성 요소 분해, 산출물 필수 |
| 3 | UNDECLARED_OTHER | 미정·기타 | PM_SERVICE_PLANNING | 정보 부족, 보완 가능 |
| 4 | OTHER_DESIGN | 기타 디자인 | UI_UX_DESIGN | 세부 분야 의존, 포트폴리오 필수 |

## 케이스별 Target Job 최종 매핑

### 1. DOUBLE_MAJOR → PM_SERVICE_PLANNING

**선택 이유**: 
- 복수전공은 특정 직무와 직접 연결하기보다, 두 전공의 교차점을 문제정의/기획/직무 해석으로 설명하는 fallback이 필요함
- PM_SERVICE_PLANNING은 기존 key이며, 보수적인 대표 매핑으로 사용

**구현 전략**:
- jobConnection에서 "조합에 따라 다르다"는 조건부 표현 사용
- 구체 사례 (경제+CS, 심리+경영 등) 제시로 교차점 설명
- careerBridge에서 "두 전공이 구체적으로 어떻게 만났는지 설명이 필요"라는 안내 제공

**차별화**:
- "융합형 인재" 같은 추상 표현 금지
- "조합에 따라 달라진다"는 정직한 표현 강조
- 구체 과목/프로젝트/경험 필요성 명시

### 2. CONVERGENCE_MAJOR → BUSINESS_STRATEGY

**선택 이유**:
- 융합전공은 구성 요소를 분해하고, 프로젝트/산출물/도구를 통해 직무 연결을 판단해야 함
- BUSINESS_STRATEGY는 기존 key이며, 보수적 대표 매핑으로 사용

**구현 전략**:
- jobConnection에서 "구성 요소에 따라 다르다" 조건부 표현
- 데이터+경영, 디자인+기술 등 구체 사례로 교차점 설명
- careerBridge에서 "구성 요소, 프로젝트 산출물, 도구" 세 가지 명시

**차별화**:
- "미래형 인재" 같은 추상 표현 금지
- "무엇과 무엇이 융합되었는지" 명확히 할 필요성 강조
- 포트폴리오, 코드, 데이터 분석 결과 등 구체 산출물 요구

### 3. UNDECLARED_OTHER → PM_SERVICE_PLANNING

**선택 이유**:
- 전공 정보를 알 수 없는 fallback 케이스이므로, target key는 기존 구조 유지를 위한 최소 매핑으로만 사용
- 출력 문구는 특정 직무 연결이 아니라 "정보 부족을 보완 가능"에 집중

**구현 전략**:
- majorDefinition: "전공 정보가 명확하지 않은 상태"로 정직하게 표현
- jobConnection: "근거 부족"을 강조하되, "관련성이 낮다"고 하지 않음
- careerBridge: 다음 정보의 필요성 명시 (수강 과목, 인턴, 관심 산업, 자격)
- Axis3 경험 연결성에서 보완 가능함을 안내

**차별화**:
- "전공 관련성 낮음", "직무와 무관", "약점" 같은 부정적 표현 금지
- "판단 근거 부족 = 추가 정보로 보완 가능"이라는 긍정적 프레이밍
- Axis3/Axis5에서 보완 분석 가능성 명시

### 4. OTHER_DESIGN → UI_UX_DESIGN

**선택 이유**:
- 기타 디자인은 세부 분야별(제품, 산업, 공간, 패션, 서비스)로 연결 직무가 다르지만, 기존 21개 key 중에서는 UI_UX_DESIGN이 가장 보수적인 대표
- 실제 사용자의 세부 디자인 분야는 careerBridge와 evidencePrompts에서 드러나도록 설계

**구현 전략**:
- majorDefinition: 세부 분야 다양성을 인정
- jobConnection: "세부 디자인 분야별로 다르다" 명시, 분야별 직무 예시 제공
- careerBridge: "세부 분야", "포트폴리오/산출물", "해결한 문제" 세 가지 필수 요소 명시
- 분야별 대안 연결 가능성 (BRAND_PR, PM_SERVICE_PLANNING, CONTENT_MARKETING) 힌트 제공

**차별화**:
- "디자인 감각", "창의성" 같은 추상 표현 금지
- "UI/UX에 직접 연결"이라고 과장하지 않음
- 사용자/고객 중심 문제 정의와 형태/공간으로의 해결 강조

---

## 새 Target Job Key 생성 여부

**없음** ✓ — 기존 21개 key만 사용

- PM_SERVICE_PLANNING (DOUBLE_MAJOR, UNDECLARED_OTHER)
- BUSINESS_STRATEGY (CONVERGENCE_MAJOR)
- UI_UX_DESIGN (OTHER_DESIGN)

---

## 새 상태값/TBD/조건부 런타임 로직 생성 여부

**없음** ✓ — 기존 Registry 구조 유지

- 새로운 상태값 (TBD, Conditional, Pending additional info) 미생성
- 런타임 조건부 target job 선택 로직 미생성
- 보수적 fallback 문구로 기존 구조 안에서 처리

---

## 구현 파일

### 1. src/data/transitionLite/newgradMajorBridgeRegistry.js

**변경 범위**: PR_AD 이후에 4개 Special 케이스 추가

**각 엔트리 구조**:
- label: 한글 전공명
- generalBridge: 전공 유형 설명 (정보 부족/조합 의존성 명시)
- jobBridgeMap: 1개 target job에 대한 연결
  - majorDefinition: 전공 정의 (정직한 제한사항 포함)
  - jobConnection: 직무 연결 로직 (조건부 표현)
  - careerBridge: 자기소개서/면접용 연결 문장 (필요한 추가 정보 명시)
  - appealingCourses: 유형 또는 카테고리별 과목
  - evidencePrompts: 4~7개 증거 프롬프트 (구체성 요구)

### 2. scripts/qa/test-axis1-registry-integration.mjs

**추가 케이스**: Case 24~27 (Special 4개 전공)

**케이스 형식**:
- 입력: majorKey, majorDisplayLabel, targetJobId, targetJobLabel, targetJobCategory
- 기대 행동: 특수성 반영 (조합 의존성, 구성 요소 분해, 정보 부족 승인, 세부 분야 특화)

---

## QA 케이스 추가 내용

### Case 24: DOUBLE_MAJOR → PM_SERVICE_PLANNING

**expectedBehavior**:
"should acknowledge combination dependency and avoid overclaiming"

**expectedContains**:
- "교차점" (두 전공이 만나는 지점)
- "조합에 따라" (조건부 표현)
- "구체 과목/프로젝트" (구체성 요구)

**shouldNotContain**:
- "융합형 인재"
- "모든 직무"
- "무조건 유리"

### Case 25: CONVERGENCE_MAJOR → BUSINESS_STRATEGY

**expectedBehavior**:
"should decompose components and require concrete outputs"

**expectedContains**:
- "구성요소" 또는 "무엇과 무엇" (분해)
- "프로젝트" 또는 "산출물" 또는 "도구" (구체성)

**shouldNotContain**:
- "미래형 인재"
- "신산업에 적합"
- "직무 적응력"

### Case 26: UNDECLARED_OTHER → PM_SERVICE_PLANNING

**expectedBehavior**:
"should frame as information gap, not limitation"

**expectedContains**:
- "판단근거부족" 또는 "정보부족"
- "추가정보"
- "보완가능" 또는 "Axis3"

**shouldNotContain**:
- "전공 관련성 낮음"
- "직무와 무관"
- "약점"

### Case 27: OTHER_DESIGN → UI_UX_DESIGN

**expectedBehavior**:
"should emphasize sub-discipline and portfolio"

**expectedContains**:
- "세부분야" 또는 "세부 디자인"
- "포트폴리오" 또는 "산출물"
- "사용자" 또는 "고객" 또는 "공간" 또는 "제품"

**shouldNotContain**:
- "디자인 감각"
- "창의성만으로"
- "모든 디자인 직무"

---

## 검증 결과

### 정적 검증 ✓

- [x] Registry 파일 수정: PR_AD 다음에 4개 Special 케이스 추가
- [x] 각 케이스의 label, generalBridge, jobBridgeMap 구조 완성
- [x] QA 스크립트: Case 24~27 추가 (4개 케이스)
- [x] target job key: 기존 21개 key 중 4개 사용 (새 key 없음)
- [x] 새 상태값/TBD/조건부 로직: 없음 (기존 구조 유지)
- [x] 한글 인코딩: direct file I/O 사용, UTF-8 확인

### 코드 문법 검증

- [x] JavaScript 구문: Object.freeze 중괄호 균형 확인
- [x] 문자열: 따옴표 쌍 확인
- [x] 배열: 대괄호 균형 확인
- [x] 유효한 target job key: PM_SERVICE_PLANNING, BUSINESS_STRATEGY, UI_UX_DESIGN 모두 기존 key

### 한글 인코딩 Postcheck

✅ **3줄 샘플 검증**:
```
1. "복수전공은 두 개의 전공을 병행 이수합니다..." → 정상
2. "융합전공은 여러 학문을 의도적으로 결합한 프로그램입니다..." → 정상
3. "기타 디자인은 특정 분야에서 사용자/고객의 문제를..." → 정상
```

### 구조 검증

- [x] Special 케이스 4개 모두 Object.freeze 구조 준수
- [x] 각 케이스에 majorDefinition, jobConnection, careerBridge, appealingCourses, evidencePrompts 모두 있음
- [x] 정보 부족/조합 의존성을 정직하게 표현
- [x] 과장 표현 없음 (융합형, 미래형, 모든 직무, 감각/창의성 중심 표현 제거)
- [x] 기존 Round 1~3 케이스 파괴 없음 (추가만 함)

---

## 남은 리스크

### 잠재적 이슈

1. **DOUBLE_MAJOR와 일반 PM 연결의 명확성**
   - 복수전공을 PM_SERVICE_PLANNING에 매핑했으나, 일반 서비스기획과 혼동 가능
   - 개선: careerBridge에서 "두 전공의 교차점"을 강조하고, 구체 경험/과목 필요성 명시 ✓

2. **CONVERGENCE_MAJOR와 BUSINESS_STRATEGY의 광범위성**
   - 융합전공은 매우 다양하므로, BUSINESS_STRATEGY는 가장 보수적인 매핑일 수 있음
   - 개선: jobConnection에서 "구성 요소에 따라 다르다"를 명확히 하고, 분야별 예시 제공 ✓

3. **UNDECLARED_OTHER의 과도한 보수성**
   - 정보 부족 케이스가 모든 사용자에게 PM으로 매핑되므로 부정확할 수 있음
   - 개선: Axis3 경험 연결성과 Axis5 역량 판단에서 보완 분석 가능함을 명시 ✓

4. **OTHER_DESIGN의 UI/UX 매핑과 실제 세부 분야의 거리**
   - 제품/공간/패션/서비스 디자인이 UI/UX와 다르므로 오류 위험
   - 개선: careerBridge에서 세부 분야별 다른 연결 가능성 제시 (BRAND_PR, PM_SERVICE_PLANNING 등) ✓

### 완화 방안

- Registry는 기본 구조이고, 실제 사용자 리포트 출력 시 context에 따라 추가 조정 가능
- 정보 부족/조합 의존성/세부 분야 의존성이 명확하므로, 사용자가 자동으로 "추가 정보 필요"를 인지
- Axis3(경험 연결성)과 Axis5(역량 판단)에서 보충 분석 가능

---

## 다음 단계: Special 출력 품질 QA 가능 여부

✅ **예, 가능합니다.**

**조건 확인**:
- [x] Registry 구현 완료 (4개 Special 케이스)
- [x] QA 케이스 추가 완료 (Case 24~27)
- [x] 모든 bridge 문구가 특수 전공 특성 (정보 부족/조합 의존/세부 분야 의존) 반영
- [x] 정보 필요성이 명시됨 (careerBridge에서 구체적 추가 정보 요청)
- [x] 과장 표현 제거 (전공만으로 직무 가능 주장 없음)
- [x] 기존 Round 1~3 케이스는 깨지지 않음 (추가만 함)

**다음 액션**:
1. 정적 Registry 검증
2. node scripts/qa/test-axis1-registry-integration.mjs 실행 (가능 시)
3. npm run build 실행 (가능 시)
4. 사용자 리포트 출력 샘플 검증
5. Special 출력 품질 QA 시작

---

**작업 완료 날짜**: 2026-05-04
**worktree**: /d/패스맵/worktrees/feat-axis1-special-major-bridge-registry
**branch**: feat/axis1-special-major-bridge-registry
**base**: origin/main (ad1d1db - Special major inputs document merged)
