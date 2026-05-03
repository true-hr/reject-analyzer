# Axis4 P3 산업/경험 맥락 추가 범위 설계

**작성일**: 2026-05-04  
**상태**: Planning/Investigation Phase

---

## 1. Executive Summary

Axis4 P2.5까지 직무별 이해관계자 역할 힌트를 완성했으나, 산업별 맥락이 부족합니다.

P3는 **직무 + 산업 조합**으로 이해관계자 소통 범위를 구체화합니다.

**핵심 원칙**:
- Axis2(산업 이해도) 설명과 명확히 구분
- Axis4는 "산업 이해"가 아니라 "그 산업에서 누가 중요한가"만 설명
- 최소한의 산업부터 시작 (Batch 1: 5개)

---

## 2. Current Axis4 Status After P2.5

**P1**: 선택형 입력 기반 보수적 톤 ✅
**P2**: 직무별 stakeholderRoles ✅
**P2 Batch 2**: read path 연결 ✅
**P2.5**: copy variation & 한국어 오타 수정 ✅

---

## 3. Remaining Problem Definition

1. **직무+산업 결합 부족**: 산업별 이해관계자 우선순위 변화 미반영
2. **산업 고유 소통 신호 누락**: 금융(리스크/규제), 제조(공급망/품질), 바이오(규제/임상)
3. **경험/활동 선택값 미활용**: 인턴, 프로젝트, 계약 등 type 존재하지만 Axis4에서 미사용
4. **Axis2와의 경계 모호**: 산업 이해도 vs 이해관계자 소통 구분 필요

---

## 4. Current Data Flow

**입력**: buildNewgradAxisPack.js에서 targetIndustryId, targetIndustryLabel 존재 ✅
**미전달**: buildAxis4Signals()에 산업 정보가 전달되지 않음 ❌
**결과**: 문구 생성 함수들이 산업 정보 활용 불가 ❌

---

## 5. Existing Industry Registry Structure

**industryArchetypeRegistry.js** (Axis2 전용):
- contextKeywords, repeatabilityEvidenceExamples, backgroundEvidenceExamples, workContextEvidenceExamples

**Axis4에 부적합**: "이해도"가 아니라 "역할"이 필요함

---

## 6. Axis2 vs Axis4 Responsibility Boundary

| 측면 | Axis2 | Axis4 |
|------|-------|-------|
| **질문** | "이 산업을 이해했나?" | "이 산업에서 누가 중요한가?" |
| **증거** | 배경, 반복경험 | 이해관계자 신호 |

❌ **금지** (중복):
```
Axis2: "금융 규제를 여러 프로젝트에서 다룸"
Axis4: "금융은 규제가 중요합니다"
```

✅ **허용** (역할 구분):
```
Axis2: "금융 규제를 여러 프로젝트에서 다룸"
Axis4: "금융에서는 규제팀과 협력할 가능성이 높습니다"
```

---

## 7. Experience Input Contract

| 경험 | Axis4 신호 | 강도 |
|-----|----------|------|
| "금융 인턴" | 해당 산업 이해관계자 | 강함 |
| "프로젝트 with 제조" | 파트너 산업 소통 | 중간 |
| "아르바이트 @ 물류" | 산업 실무 | 중간 |
| "금융 자격증" | 규제 이해 | 약함 |

---

## 8. P3 Implementation Options

### A: industryArchetypeRegistry에 추가
- ❌ 책임 혼재, 유지보수 어려움

### B: 새 파일 `newgradAxis4IndustryStakeholderContextRegistry.js` ⭐
- ✅ Axis4 전용 (책임 명확)
- ✅ P4+에서 독립 진화 가능

### C: axisExplanationRegistry 내부 map
- ❌ 파일 크기 증가, 유지보수 악몽

### D: buildNewgradAxisPack에서 signal만 생성
- 🟡 B와 결합 가능

**추천**: B + D 결합

---

## 9. Recommended P3 Architecture

새 파일 생성 + signals 전달 + 문구 생성

**구현 순서**:
1. **P3-1**: newgradAxis4IndustryStakeholderContextRegistry.js 생성
2. **P3-2**: buildNewgradAxisPack.js 수정 (로드 + signal)
3. **P3-3**: axisExplanationRegistry.js 수정 (문구)
4. **P3-4**: 5개 케이스 QA

---

## 10. Batch 1 Industry Targets

| 산업 | Primary Stakeholder | 관련 직무 |
|------|------------------|---------|
| **금융** | risk_team, compliance_team, ops_team | 데이터분석, 회계/재무 |
| **IT/SaaS** | product_team, dev_team, cs_team | PMM, 데이터분석 |
| **제조** | production_team, procurement_team, qa_team | 생산관리, 회계/재무, 품질QA |
| **바이오** | clinical_team, regulatory_team, mfg_team | 품질QA, 데이터분석 |
| **커머스** | customer_ops_team, supply_chain_team | PMM, 데이터분석 |

---

## 11. Target Output Examples

### 케이스 1: 데이터분석 × 금융
> "금융의 데이터분석은 리스크와 규제 준수를 함께 고려하므로, 리스크팀, 규제팀과의 협력이 중요합니다."

### 케이스 2: 회계/재무 × 제조
> "제조의 재무는 생산 원가, 자재 구매, 품질 기준이 함께 작동하므로 생산팀, 구매팀, 품질팀과의 협력이 필수입니다."

---

## 12. Risk Assessment

| 위험 | 대응 |
|-----|------|
| **Axis2 중복** | 경계 문서화 + QA |
| **context 부정확** | SME 리뷰 |
| **경험 신호 오버피팅** | "가능성 신호"로만 정의 |

**Fallback**: 산업 context 누락 → 직무 정보만 사용

---

## 13. Files Reviewed

```
✅ src/lib/analysis/buildNewgradAxisPack.js
✅ src/data/transitionLite/axisExplanationRegistry.js
✅ src/data/transitionLite/newgradAxis4JobStakeholderRelevanceRegistry.js
✅ src/data/transitionLite/industryArchetypeRegistry.js
✅ src/components/input/categoryOptions.js
```

---

**상태**: 설계 완료, P3-1 시작 준비 완료
