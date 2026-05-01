# Axis 1 Gold Fixtures v1

- date locked: 2026-04-20
- version: v1 (Round 1–6 기준)
- purpose: axis1 drift 방지용 QA 기준 fixture 잠금

이 문서의 fixture는 axis1 로직 수정 전/후 회귀 검증에 직접 사용한다.
기대 band range를 벗어나는 경우 반드시 원인 분석 후 수정하라.

---

## Group 1 — same/high stable

동일 직무 전환. 최고점 유지 확인용.

### Fixture 1-A
- **from**: `JOB_MARKETING_BRAND_MARKETING`
- **to**: `JOB_MARKETING_BRAND_MARKETING`
- **기대 band**: `high`
- **기대 raw**: ≥ 85
- **floor/uplift**: 없음 (noDirectOverlap=false → 불필요)
- **why not lower**: 동일 직무, 모든 신호 완전 겹침
- **why not higher**: max 100 (계산 상한)
- **설명 포인트**: summary="핵심 업무 과업과 직무 구조가 잘 연결됩니다." positives 다수

### Fixture 1-B
- **from**: `JOB_SALES_B2B_SALES`
- **to**: `JOB_SALES_B2B_SALES`
- **기대 band**: `high`
- **기대 raw**: ≥ 85
- **floor/uplift**: 없음
- **why not lower**: 동일 직무
- **설명 포인트**: high band summary

---

## Group 2 — adjacent same-domain

같은 도메인 내 인접 직무. mid~mid_high 범위.

### Fixture 2-A
- **from**: `JOB_MARKETING_BRAND_MARKETING`
- **to**: `JOB_MARKETING_CONTENT_MARKETING`
- **기대 band**: `mid` ~ `mid_high`
- **기대 raw**: 45–70
- **floor/uplift**: registry eligible 가능성 있음, uplift +0~+2
- **why not lower**: 같은 마케팅 도메인, signal 겹침 존재
- **why not higher**: 콘텐츠 기획 vs 브랜드 전략 초점 차이
- **설명 포인트**: "같은 도메인 안에서 초점이 달라지는 전환입니다."

### Fixture 2-B
- **from**: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- **to**: `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING`
- **기대 band**: `mid` ~ `mid_high`
- **기대 raw**: 45–68
- **floor/uplift**: registryBridgeEligible=true (guard 해제), but jobDistance="same" → isBridgeableDistance=false → floor 미적용
- **why not lower**: 동일 finance 계열, 신호 겹침
- **why not higher**: 관리회계 = 원가분석·예산 초점, 일반회계와 책임 범위 다름
- **설명 포인트**: eligible=true breakdown 표시, 점수 변화 없음 (conservative 확인)

### Fixture 2-C
- **from**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_EQUIPMENT_MAINTENANCE`
- **to**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_AUTOMATION_CONTROL`
- **기대 band**: `mid`
- **기대 raw**: 40–58
- **floor/uplift**: 없음 또는 shared cluster 기반 소폭 uplift
- **why not lower**: 설비 안정화와 현장 대응 경험이 자동화 제어 맥락과 일부 겹침
- **why not higher**: 유지보수 중심 경험과 제어 로직 설계 경험은 분명히 다름
- **설명 포인트**: 설비 안정화 직무에서 제어 구조와 PLC 중심 직무로 이동하는 인접 전환

### Fixture 2-D
- **from**: `JOB_ENGINEERING_DEVELOPMENT_CIRCUIT_DESIGN`
- **to**: `JOB_ENGINEERING_DEVELOPMENT_ELECTRICAL_DESIGN`
- **기대 band**: `mid` ~ `mid_high`
- **기대 raw**: 45–65
- **floor/uplift**: 없음 또는 shared cluster 기반 소폭 uplift
- **why not lower**: 전기 인터페이스, 사양, 전원 구조 신호가 부분적으로 겹침
- **why not higher**: 회로설계는 보드·소자 설계 비중이 더 높고 전장/전기설계는 연결 구조 비중이 더 높음
- **설명 포인트**: 회로 중심 직무에서 전장·인터페이스 구조 중심 직무로 이동하는 인접 전환

--- 

## Group 3 — GTM bridgeable cross-family

allowlist_fallback 또는 registry로 mid 진입하는 GTM 조합.

### Fixture 3-A
- **from**: `JOB_SALES_GENERAL_SALES`
- **to**: `JOB_MARKETING_BRAND_MARKETING`
- **기대 band**: `mid`
- **기대 raw**: 40–55
- **floor**: 40 (allowlist_fallback)
- **uplift**: +0 (noDirectOverlap 조건에서 sharedClusters 확인)
- **bridgeEligibilitySource**: `"allowlist_fallback"`
- **why not lower**: GTM allowlist bridge floor 보호
- **why not higher**: 강한 신호 겹침 없음, 브랜드 전략 직접 경험 미확인
- **설명 포인트**: "직무명은 다르지만, 실제로는 이어지는 핵심 업무 구조가 있습니다." (cross + bridgeFloor)

### Fixture 3-B
- **from**: `JOB_SALES_B2B_SALES`
- **to**: `JOB_MARKETING_PRODUCT_MARKETING_PMM`
- **기대 band**: `mid`
- **기대 raw**: 42–56
- **floor**: 40 (registry)
- **uplift**: +2 (sharedClusters=2)
- **bridgeEligibilitySource**: `"registry"`
- **why not lower**: registry bridge eligible, cluster uplift
- **why not higher**: PMM 요구 제품 분석·포지셔닝 직접 경험 미확인
- **설명 포인트**: whyNotHigher="공통된 역할군/클러스터는 있으나, 목표 직무의 직접 수행 경험까지 갖췄다고 보긴 어렵습니다."

---

## Group 4 — non-GTM bridgeable (registry primary)

GTM allowlist 외 registry 기반 bridge. mid 범위.

### Fixture 4-A
- **from**: `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUCCESS`
- **to**: `JOB_IT_DATA_DIGITAL_PRODUCT_MANAGEMENT`
- **기대 band**: `mid`
- **기대 raw**: 42–58
- **floor**: 40 (registry)
- **uplift**: +2 (sharedClusters=2)
- **bridgeEligibilitySource**: `"registry"`
- **sharedBridgeGroups**: `[customer_service_ops, product_service_strategy]`
- **why not lower**: registry bridge — 고객 서비스 운영 + 제품 전략 클러스터 공유
- **why not higher**: PM 직접 수행 경험(스펙/로드맵 오너십) 미확인
- **설명 포인트**: bridgeContext="공통 역할군(고객 서비스·운영, 제품·서비스 전략)이 연결고리입니다."

### Fixture 4-A-1
- **from**: `JOB_IT_DATA_DIGITAL_DATA_ANALYSIS`
- **to**: `JOB_IT_DATA_DIGITAL_DATA_SCIENCE`
- **기대 band**: `mid` ~ `mid_high`
- **기대 raw**: 48–68
- **floor/uplift**: 없음 또는 shared cluster 기반 소폭 uplift
- **why not lower**: 데이터 해석, 실험, 모델링 신호가 부분적으로 겹침
- **why not higher**: 데이터사이언스는 통계 모델 개발과 예측 비중이 더 높음
- **설명 포인트**: 분석 중심 직무에서 모델링·예측 중심 직무로 이동하는 인접 전환

### Fixture 4-B
- **from**: `JOB_HR_ORGANIZATION_HR_OPS`
- **to**: `JOB_HR_ORGANIZATION_HR_PLANNING`
- **기대 band**: `mid`
- **기대 raw**: 42–58
- **floor**: 40 (registry)
- **uplift**: +2
- **bridgeEligibilitySource**: `"registry"`
- **why not lower**: people_ops + business_planning_ops 공유
- **why not higher**: 기획·전략 수립 직접 경험 미확인

### Fixture 4-C
- **from**: `JOB_CUSTOMER_OPERATIONS_SERVICE_OPERATIONS`
- **to**: `JOB_CUSTOMER_OPERATIONS_OPERATION_PLANNING`
- **기대 band**: `mid`
- **기대 raw**: 42–58
- **floor**: 40 (registry)
- **uplift**: +2
- **bridgeEligibilitySource**: `"registry"`
- **why not lower**: customer_service_ops + business_planning_ops 공유
- **why not higher**: 운영기획 직접 수립 경험 미확인

---

## Group 5 — finance corridor

finance_planning_control 케이스. 점수 변화 최소 확인용.

### Fixture 5-A
- **from**: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- **to**: `JOB_FINANCE_ACCOUNTING_FP_AND_A`
- **기대 band**: `mid` ~ `low` (sharedClusters=1 → ineligible)
- **floor**: 없음 (sharedClusters<2)
- **uplift**: 없음
- **why not lower**: 같은 finance 계열
- **why not higher**: FP&A = 예측·분석 초점, 일반회계와 직접 신호 겹침 제한
- **설명 포인트**: ineligible 케이스 — conservative 확인

### Fixture 5-B
- **from**: `JOB_FINANCE_ACCOUNTING_FP_AND_A`
- **to**: `JOB_FINANCE_ACCOUNTING_MANAGEMENT_ACCOUNTING`
- **기대 band**: `mid`
- **floor**: registry eligible, but jobDistance="same" → floor 미적용
- **uplift**: 없음 (isBridgeableDistance=false)
- **why not lower**: finance 공유 클러스터
- **설명 포인트**: eligible=true, 점수 변화 없음 (conservative 유지 확인)

---

## Group 6 — industrial explanation-only

점수 변화 없이 explanation만 보강되는 케이스.

### Fixture 6-A
- **from**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
- **to**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PROCESS_ENGINEERING`
- **기대 band**: `mid` ~ `low` (jobDistance="same", 신호 겹침 수준에 따라)
- **floor**: 없음 (jobDistance="same" → isBridgeableDistance=false)
- **uplift**: 없음
- **industrial policy**: explanation-only
- **설명 포인트**: bridgeContext="현장/공정/품질처럼 연결되는 운영 구조는 있으나, 목표 직무의 기준 설계나 검증 책임까지 동일하진 않습니다."
- **회귀 체크**: floor가 열리면 안 됨 (isBridgeableDistance=false gate 유지 확인)

### Fixture 6-B
- **from**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_PRODUCTION_ENGINEERING`
- **to**: `JOB_MANUFACTURING_QUALITY_PRODUCTION_QUALITY_ASSURANCE_QA`
- **기대 band**: `mid` ~ `low`
- **floor**: 없음 (동일 이유)
- **industrial policy**: explanation-only
- **설명 포인트**: 동일 industrial bridgeContext 문구

---

## Group 7 — truly distant negatives (blocked)

floor/uplift 절대 열리면 안 되는 케이스.

### Fixture 7-A
- **from**: `JOB_SALES_GENERAL_SALES`
- **to**: `JOB_ENGINEERING_DEVELOPMENT_SOFTWARE_DEVELOPMENT`
- **기대 band**: `very_low`
- **기대 raw**: ≤ 20
- **floor**: 없음 (technical_build 단독 → guard 차단)
- **uplift**: 없음
- **회귀 체크**: band가 low 이상이면 즉시 조사

### Fixture 7-B
- **from**: `JOB_CUSTOMER_OPERATIONS_CUSTOMER_SUPPORT_CS`
- **to**: `JOB_ENGINEERING_DEVELOPMENT_MECHANICAL_DESIGN`
- **기대 band**: `very_low`
- **기대 raw**: ≤ 20
- **floor**: 없음 (technical_build + extremeMismatch guard)
- **회귀 체크**: band가 low 이상이면 즉시 조사

### Fixture 7-C
- **from**: `JOB_MARKETING_PERFORMANCE_MARKETING`
- **to**: `JOB_FINANCE_ACCOUNTING_ACCOUNTING`
- **기대 band**: `very_low` ~ `low`
- **floor**: 없음 (signal overlap 없음, registry 미매칭)
- **회귀 체크**: mid 이상이면 즉시 조사

---

## 회귀 판정 기준

| 판정 | 조건 |
|---|---|
| ✅ PASS | 기대 band range 이내 |
| ⚠️ WARN | 기대 range 경계 (상/하 1 band) |
| ❌ FAIL | 기대 range 2+ band 이탈 |

항상 확인:
- Fixture 1-A/1-B: high 유지
- Fixture 7-A/7-B/7-C: very_low 유지
- Fixture 6-A/6-B: floor 열리지 않음
