# Precise Analysis Structured Asset Reuse

## 문서 목적

이 문서는 preciseAnalysis 정확도를 높이기 위해 PASSMAP 내부에 이미 존재하는 구조화 자산을 재활용할 수 있는 범위를 정리한다.  
이번 라운드의 초점은 UI shell이 아니라 자격증, 도구, 담당 업무, 직무 family, capability, taxonomy, alias 사전이다.

핵심 방향은 다음과 같다.

- preciseAnalysis 정확도는 엔진 공식보다 표현 흔들림을 얼마나 줄이느냐에 크게 좌우된다.
- PASSMAP 내부의 자격증/담당업무/직무/역량 자산은 점수 엔진에 바로 넣기보다 `JD 키워드 반영 부족`과 `필수요건 미충족`의 보조 사전으로 먼저 붙이는 것이 안전하다.
- 직무 family / ontology 전체를 판정 본체에 바로 넣는 것은 과신 위험이 크므로, `related experience` 같은 후속 기능의 보조 신호로 쓰는 편이 적절하다.
- 새 사전을 만들기 전에 기존 자산 대체 가능성을 먼저 확인하는 것이 우선이다.

## 조사 범위

- 선행 문서
  - `00_HQ/Precise_Analysis_Asset_Reuse_Study.md`
  - `00_HQ/Precise_Analysis_Extraction_SSOT.md`
  - `05_Execution/Precise_Analysis_Policy_Log.md`
  - `docs/끄적.md`
- 구조화 자산 owner
  - `src/lib/semantic/taxonomy/toolTaxonomy.js`
  - `src/lib/semantic/taxonomy/domainTaxonomy.js`
  - `src/lib/semantic/taxonomy/hrTaxonomy.js`
  - `src/lib/decision/evidence/evidenceAliases.js`
  - `src/lib/ontology/taskOntology.js`
  - `src/lib/ontology/taskMatcher.js`
  - `src/lib/ontology/certs/cert_catalog.v0.json`
  - `src/lib/ontology/certs/cert_rules.v0.json`
  - `src/lib/ontology/certs/role_cert_matrix.v0.json`
  - `src/data/transitionLite/capabilityRegistry.js`
  - `src/data/transitionLite/rowCapabilityMap.js`
  - `src/data/transitionLite/subVerticalCapabilityMap.js`
  - `src/data/job/jobLookup.index.js`
  - `src/data/job/jobOntology.index.js`
  - `src/data/industry/industryRegistry.index.js`
  - `src/lib/adapters/buildJobContext.js`
  - `src/lib/analysis/buildCandidateAxisPack.js`
  - `src/lib/roleDistance.js`

## 조사한 구조화 자산 목록

| 자산군 | owner 파일 | 실제 자산 내용 | preciseAnalysis 연결 가능 위치 |
| --- | --- | --- | --- |
| 도구 taxonomy | `src/lib/semantic/taxonomy/toolTaxonomy.js` | tool canonical id, aliases, family, `disambiguationDomain`, `boostWeight` | `fit.jdModel.domainKeywords`, `matchedKeywordCount`, `missingKeywords`, `mustHave` alias 확장 |
| 도메인 taxonomy | `src/lib/semantic/taxonomy/domainTaxonomy.js` | procurement/scm 세부 domain별 `strongPhrases`, `conceptBundles`, `weakPhrases`, `exclusions` | `domainKeywords` 생성 보조, keyword coverage alias 확장 |
| HR taxonomy | `src/lib/semantic/taxonomy/hrTaxonomy.js` | HR 세부 domain별 strong phrase / concept bundle | HR JD의 `domainKeywords` 생성 보조 |
| evidence alias | `src/lib/decision/evidence/evidenceAliases.js` | `TOOL_ALIASES`, `TASK_ALIASES`, `TOOL_SIMILARITY` | must/keyword exact match 보완, tool partial match 보조 |
| task ontology | `src/lib/ontology/taskOntology.js`, `src/lib/ontology/taskMatcher.js` | task id, synonyms, broadAliases, strengthBoosters, JD/Resume task 추출 함수 | must/keyword 유사표현 보완, task phrase 정규화 |
| 자격증 catalog | `src/lib/ontology/certs/cert_catalog.v0.json` | cert id, aliases, issuer, `domainTags` | JD must/keyword alias 확장, resume 자격증 근거 강화 |
| 자격증 signal/rule | `src/lib/ontology/certs/cert_rules.v0.json` | `jdSignalMapping`, substitution rule | JD must requirement 자격증 문구 정규화, 단 substitution은 장기 후보 |
| role-cert matrix | `src/lib/ontology/certs/role_cert_matrix.v0.json` | role family별 preferred / optional cert | role family가 확정된 이후 certification 가중 보조 |
| capability registry | `src/data/transitionLite/capabilityRegistry.js` | capability id, label, tone, shortDescription | must/keyword phrase를 capability bucket으로 설명할 때 |
| row/subVertical capability map | `src/data/transitionLite/rowCapabilityMap.js`, `src/data/transitionLite/subVerticalCapabilityMap.js` | detailed row key to capability, subvertical별 primary/secondary capability | role proximity / related experience 장기 보조 |
| job ontology / industry registry | `src/data/job/jobOntology.index.js`, `src/data/industry/industryRegistry.index.js` | canonical id, aliases, family, strongSignals, adjacentFamilies, sector/subSector aliases | role family / industry side-channel 해석, future related experience |
| job context / candidate axis | `src/lib/adapters/buildJobContext.js`, `src/lib/analysis/buildCandidateAxisPack.js` | `familyId`, `adjacentFamilyIds`, `targetResponsibilityHints`, `familyDistance`, `targetToolSignals` | related experience / role proximity 장기 후보 |
| role alias graph | `src/lib/roleDistance.js` | canonical role, alias dict, graph distance | current/target role proximity의 얇은 보조 신호 |

## preciseAnalysis 연결 기준

### A. JD 키워드 반영 부족 보조 사전

- 1차 연결 위치
  - `fit.jdModel.domainKeywords`
  - `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`
- 바로 쓰기 좋은 자산
  - `toolTaxonomy`
  - `domainTaxonomy`
  - `hrTaxonomy`
  - `evidenceAliases`
  - `taskOntology/taskMatcher`

### B. 필수요건 미충족 보조 사전

- 1차 연결 위치
  - `fit.jdModel.mustHave`
  - `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js`
- 바로 쓰기 좋은 자산
  - `cert_catalog`
  - `cert_rules.jdSignalMapping`
  - `toolTaxonomy`
  - `evidenceAliases`
  - `taskOntology/taskMatcher`

### C. related experience / role proximity 장기 후보

- 후속 연결 위치
  - 아직 preciseAnalysis 정식 risk로 열려 있지 않음
  - future `relatedExperienceYears` 또는 role proximity 계열
- 후보 자산
  - `buildJobContext`
  - `buildCandidateAxisPack`
  - `jobOntology`
  - `industryRegistry`
  - `roleDistance`
  - `subVerticalCapabilityMap`

### D. 자격증/도구/역량 기반 근거 강화

- 연결 위치
  - `must_requirements_gap`의 `hitItems` / `effectiveMissItems`
  - `jd_keyword_coverage_gap`의 `matchedKeywords` / `missingKeywords`
  - resume에서 직접 확인된 자격증/도구 문구
- 안전한 방향
  - 판정 본체 변경이 아니라 근거 phrase 정규화와 alias 확장
  - 실제 경험 추정이 아니라 직접 확인된 표현의 canonical 매핑

## 1. 즉시 활용 가능

### 1) 도구 taxonomy

- owner 파일
  - `src/lib/semantic/taxonomy/toolTaxonomy.js`
- 자산 내용
  - `sap`, `sap mm`, `ariba`, `coupa`, `jaggaer`, `erp`, `mes`, `plm`, `excel`, `power bi`, `tableau`의 canonical id와 alias, family, `disambiguationDomain`, `boostWeight`
- preciseAnalysis에서 붙일 위치
  - `fit.jdModel.domainKeywords` 생성 직전 alias 확장
  - `src/lib/preciseAnalysis/buildJdKeywordCoverageGapRisk.js`의 `matchedKeywordCount`, `missingKeywords`
  - `src/lib/preciseAnalysis/buildMustRequirementsGapRisk.js`의 tool must phrase 정규화
- 어떤 risk에 쓰는지
  - `JD 키워드 반영 부족`
  - `필수요건 미충족`
- 기대 효과
  - `Power BI` vs `powerbi` vs `pbi`
  - `SAP` vs `SAP ERP`
  - `SQL` vs `mysql`/`postgresql`/`mssql`
  같은 표기 흔들림을 줄일 수 있다.
- 위험도
  - 낮음
  - 단, `sap`, `erp` 같은 일반어는 `disambiguationDomain`이 있는 항목만 우선 적용하는 것이 안전하다.

### 2) evidence alias

- owner 파일
  - `src/lib/decision/evidence/evidenceAliases.js`
- 자산 내용
  - `TOOL_ALIASES`
  - `TASK_ALIASES`
  - `TOOL_SIMILARITY`
- preciseAnalysis에서 붙일 위치
  - JD keyword exact match 전에 alias normalize 단계
  - must requirement의 도구/업무 문구 normalize 단계
- 어떤 risk에 쓰는지
  - `JD 키워드 반영 부족`
  - `필수요건 미충족`
- 기대 효과
  - BI, SQL, 스프레드시트 계열의 표현 흔들림을 가장 얇게 줄일 수 있다.
  - 고객 대응, 리포트, 운영 개선 같은 업무 표현도 일부 바로 흡수 가능하다.
- 위험도
  - 낮음
  - 현재 사전이 작아서 false positive보다 recall 부족 위험이 더 크다.

### 3) task ontology / task matcher

- owner 파일
  - `src/lib/ontology/taskOntology.js`
  - `src/lib/ontology/taskMatcher.js`
- 자산 내용
  - task id별 `synonyms`, `broadAliases`, `strengthBoosters`
  - `extractTasksFromJd`, `extractTaskEvidenceFromResume`
- preciseAnalysis에서 붙일 위치
  - `fit.jdModel.mustHave`
  - `fit.jdModel.domainKeywords`
  - `buildMustRequirementsGapRisk.js`에서 must phrase canonicalization
  - `buildJdKeywordCoverageGapRisk.js`에서 keyword phrase canonicalization
- 어떤 risk에 쓰는지
  - `JD 키워드 반영 부족`
  - `필수요건 미충족`
- 기대 효과
  - `고객 대응 / VOC / 운영 리포트 / 유관부서 협업 / 이슈 대응 / 프로세스 개선`처럼 같은 뜻인데 표현만 다른 경우를 줄이기 좋다.
  - 단순 string match보다 task phrase 단위 matching이 가능하다.
- 위험도
  - 낮음
  - broad alias까지 바로 쓰면 오탐 위험이 있으므로 1차는 `synonyms`만 쓰는 것이 안전하다.

### 4) 자격증 catalog + JD signal mapping

- owner 파일
  - `src/lib/ontology/certs/cert_catalog.v0.json`
  - `src/lib/ontology/certs/cert_rules.v0.json`
- 자산 내용
  - `ADsP`, `ADP`, `SQLD`, `SQLP`, `AWS`, `Azure`, `GCP`, `CKA`, `PMP`, `PSM`, `ISTQB`, `ISMS-P`, `CISSP`, `CPSM`, `CPIM`, `GA4` 등 cert canonical id, aliases, `domainTags`
  - `jdSignalMapping`으로 JD 문구를 cert id로 정규화하는 규칙
- preciseAnalysis에서 붙일 위치
  - `fit.jdModel.mustHave`의 자격증/자격요건 phrase 정규화
  - `buildMustRequirementsGapRisk.js`의 `effectiveMissItems` 계산 전 alias 확장
  - `buildJdKeywordCoverageGapRisk.js`에서 cert keyword normalize
- 어떤 risk에 쓰는지
  - `필수요건 미충족`
  - `JD 키워드 반영 부족`
- 기대 효과
  - `SQLD`, `ERP정보관리사`, `CPSM`, `ISMS-P`, `GA4`처럼 JD가 자격증을 직접 요구하는 케이스를 더 안정적으로 잡을 수 있다.
  - resume 자격증 표기가 약간 달라도 cert id 기준으로 묶을 수 있다.
- 위험도
  - 낮음
  - catalog 메모 자체가 “aliases를 너무 포괄적으로 잡지 말라”는 보수 계약을 갖고 있어 immediate use에 적합하다.

### 5) procurement/scm domain taxonomy

- owner 파일
  - `src/lib/semantic/taxonomy/domainTaxonomy.js`
- 자산 내용
  - `strategic_sourcing`, `vendor_management`, `contract_commercial`, `purchasing_analytics`, `inventory_logistics` 등 procurement/scm domain별 `strongPhrases`, `conceptBundles`, `weakPhrases`, `exclusions`
- preciseAnalysis에서 붙일 위치
  - procurement/scm JD에 한해 `fit.jdModel.domainKeywords` 보강
  - `buildJdKeywordCoverageGapRisk.js` keyword coverage 보조
- 어떤 risk에 쓰는지
  - `JD 키워드 반영 부족`
- 기대 효과
  - procurement/scm JD에서 `전략소싱`, `협력사`, `구매 KPI`, `단가 협상` 같은 표현의 누락을 줄일 수 있다.
- 위험도
  - 낮음
  - 단, 현재 scope는 procurement/scm 전용으로 제한해야 한다.

## 2. 얇은 어댑터 후 활용 가능

### 1) role-cert matrix

- owner 파일
  - `src/lib/ontology/certs/role_cert_matrix.v0.json`
- 어떤 브리지/맵이 더 필요한지
  - preciseAnalysis가 PASSMAP current/target role family를 side-channel로 받아야 한다.
  - cert id와 JD must phrase를 연결하는 얇은 map이 필요하다.
- preciseAnalysis 어느 risk/field에 연결하는지
  - `필수요건 미충족`
  - future certification evidence explanation
- 기대 효과
  - role family별로 어떤 자격증이 preferred/optional인지 설명 근거를 재활용할 수 있다.
- 위험도
  - 중간
  - role family 확정이 틀리면 certification relevance도 같이 흔들린다.

### 2) capability registry + row capability map

- owner 파일
  - `src/data/transitionLite/capabilityRegistry.js`
  - `src/data/transitionLite/rowCapabilityMap.js`
- 어떤 브리지/맵이 더 필요한지
  - preciseAnalysis의 must/keyword/task phrase를 capability id로 묶는 얇은 bridge가 필요하다.
- preciseAnalysis 어느 risk/field에 연결하는지
  - `JD 키워드 반영 부족`
  - `필수요건 미충족`
  - 결과 설명의 부족 capability grouping
- 기대 효과
  - `고객 대응`, `협업`, `운영 구조화`, `도메인 맥락`, `실행 깊이` 같은 상위 묶음으로 설명 정리가 쉬워진다.
- 위험도
  - 중간
  - 현재 row key가 transition-lite 전용이라 direct reuse는 어렵다.

### 3) job ontology / industry registry

- owner 파일
  - `src/data/job/jobOntology.index.js`
  - `src/data/job/ontology/business/operations_management.js`
  - `src/data/job/ontology/customer_operations/customer_support_cs.js`
  - `src/data/industry/industryRegistry.index.js`
- 어떤 브리지/맵이 더 필요한지
  - preciseAnalysis가 current/target role 또는 industry selection을 side-channel로 받아야 한다.
  - text-only input과 ontology item을 잇는 안정적인 adapter가 필요하다.
- preciseAnalysis 어느 risk/field에 연결하는지
  - future `related experience`
  - keyword/must disambiguation의 보조 컨텍스트
- 기대 효과
  - `사업운영 / 운영기획 / CS / VOC / CX / 서비스 운영`의 family 경계를 더 구조적으로 다룰 수 있다.
  - industry alias를 통해 domain continuity 설명도 가능해진다.
- 위험도
  - 중간
  - ontology를 판정 본체에 바로 넣으면 텍스트에 없는 확신을 부여할 위험이 있다.

### 4) buildJobContext

- owner 파일
  - `src/lib/adapters/buildJobContext.js`
- 어떤 브리지/맵이 더 필요한지
  - preciseAnalysis 입력에 PASSMAP role/industry selection을 side-channel로 전달하는 연결이 필요하다.
- preciseAnalysis 어느 risk/field에 연결하는지
  - future `related experience`
  - role proximity / responsibility hint
- 기대 효과
  - `familyId`, `adjacentFamilyIds`, `targetResponsibilityHints`, `targetLevelHints`를 보조 신호로 쓸 수 있다.
- 위험도
  - 중간
  - 현재 preciseAnalysis는 text-first 계약이라 바로 붙이기 어렵다.

### 5) roleDistance

- owner 파일
  - `src/lib/roleDistance.js`
- 어떤 브리지/맵이 더 필요한지
  - resume/job title에서 canonical role alias normalize 레이어가 필요하다.
- preciseAnalysis 어느 risk/field에 연결하는지
  - future `related experience`
  - role proximity 보조 신호
- 기대 효과
  - `biz ops`, `business operations`, `운영`, `operations` 같은 role alias를 canonical role로 묶을 수 있다.
- 위험도
  - 중간
  - 그래프 기반 distance를 현재 screening risk에 바로 넣으면 과한 일반화가 될 수 있다.

## 3. 장기 후보

### 1) buildCandidateAxisPack 전체

- owner 파일
  - `src/lib/analysis/buildCandidateAxisPack.js`
- 지금 바로 붙이면 왜 위험한지
  - `familyDistance`, `narrativeHints`, `targetToolSignals`, `targetOwnershipSignals`는 transition-lite 맥락에서 설계된 읽기용 pack이다.
  - preciseAnalysis screening 판정 본체에 바로 넣으면 설명과 판정이 섞인다.
- 어떤 시점에 쓰면 좋은지
  - `related experience / role proximity` risk가 별도 feature로 열릴 때
- preciseAnalysis의 어떤 future feature에 맞는지
  - role family proximity
  - adjacent experience bridge

### 2) subVertical capability map

- owner 파일
  - `src/data/transitionLite/subVerticalCapabilityMap.js`
- 지금 바로 붙이면 왜 위험한지
  - `SERVICE_PLANNING`, `RECRUITING` 같은 subvertical이 target selection 전제라서 preciseAnalysis의 text-only 계약과 맞지 않는다.
- 어떤 시점에 쓰면 좋은지
  - target role/subvertical을 explicit input으로 받을 때
- preciseAnalysis의 어떤 future feature에 맞는지
  - related experience
  - role proximity
  - capability adjacency explanation

### 3) cert substitution rule의 direct 판정 참여

- owner 파일
  - `src/lib/ontology/certs/cert_rules.v0.json`
- 지금 바로 붙이면 왜 위험한지
  - `ISMS-P` 미보유를 `security_audit` evidence tag로 부분 대체하는 식의 규칙은 screening risk 완화에 과한 추정을 넣을 수 있다.
- 어떤 시점에 쓰면 좋은지
  - gold set으로 substitution precision을 검증한 뒤
- preciseAnalysis의 어떤 future feature에 맞는지
  - certification evidence explanation
  - recruiter-facing nuance layer

### 4) job ontology / industry registry의 direct scoring 참여

- owner 파일
  - `src/data/job/jobOntology.index.js`
  - `src/data/industry/industryRegistry.index.js`
- 지금 바로 붙이면 왜 위험한지
  - text에 없는 family/industry 유사성을 엔진이 과신할 수 있다.
  - exact string 누락을 ontology가 덮어버리면 false positive가 커질 수 있다.
- 어떤 시점에 쓰면 좋은지
  - explicit role/industry input과 gold set 검증이 함께 갖춰졌을 때
- preciseAnalysis의 어떤 future feature에 맞는지
  - related experience years
  - role proximity
  - domain continuity explanation

## 우선순위 제안

1. `toolTaxonomy + evidenceAliases + cert_catalog + cert_rules.jdSignalMapping`을 먼저 붙여 `must/keyword`의 exact string 누락을 줄인다.
2. `taskOntology/taskMatcher`를 붙여 담당 업무 표현의 동의어 흔들림을 줄인다.
3. procurement/scm과 HR처럼 taxonomy가 이미 있는 domain부터 `domainKeywords` 생성 보조를 제한적으로 적용한다.
4. role family / ontology / candidate axis 계열은 판정 본체가 아니라 future `related experience` 보조 신호로 분리 유지한다.

## 지금 바로 붙일 자산 / 나중에 붙일 자산 체크리스트

### 지금 바로 붙일 자산

- `src/lib/semantic/taxonomy/toolTaxonomy.js`
- `src/lib/decision/evidence/evidenceAliases.js`
- `src/lib/ontology/taskOntology.js`
- `src/lib/ontology/taskMatcher.js`
- `src/lib/ontology/certs/cert_catalog.v0.json`
- `src/lib/ontology/certs/cert_rules.v0.json`
- `src/lib/semantic/taxonomy/domainTaxonomy.js`
- `src/lib/semantic/taxonomy/hrTaxonomy.js`

### 나중에 붙일 자산

- `src/lib/ontology/certs/role_cert_matrix.v0.json`
- `src/data/transitionLite/capabilityRegistry.js`
- `src/data/transitionLite/rowCapabilityMap.js`
- `src/data/transitionLite/subVerticalCapabilityMap.js`
- `src/data/job/jobOntology.index.js`
- `src/data/industry/industryRegistry.index.js`
- `src/lib/adapters/buildJobContext.js`
- `src/lib/analysis/buildCandidateAxisPack.js`
- `src/lib/roleDistance.js`

## 결론

이번 조사 기준으로 가장 현실적인 재활용은 자격증/도구/담당업무 alias를 preciseAnalysis의 JD keyword / must requirement 해석에 연결하는 것이다.  
반대로 role family / ontology / candidate axis 전체를 판정 본체에 바로 넣는 것은 위험하다.  
즉 preciseAnalysis는 새 사전을 다시 만들기보다, PASSMAP 내부의 기존 structured asset을 `보조 사전 → 제한적 domain 적용 → 후속 role proximity 확장` 순서로 흡수하는 것이 가장 안전하다.
