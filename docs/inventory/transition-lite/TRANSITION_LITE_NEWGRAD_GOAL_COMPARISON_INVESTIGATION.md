# Transition Lite Newgrad Goal Comparison Investigation

## 무엇을 확인했는지
- 파일 경로  함수/컴포넌트  exact anchor  역할 형식으로 신입 표 owner, builder, consumer, PDF owner, 경력직 comparison producer/consumer를 확인했다.
- `buildNewgradGoalComparisonTable(...)`의 전체 row 생성 흐름과 row별 evidence source, linkage source, fallback 생성 위치를 확인했다.
- 경력직 `comparisonTable` shape와 신입 `newgradGoalComparisonTable` shape가 구조적으로 다르다는 점을 확인했다.

## 신입 표 owner
- 파일 경로: `src/components/report/TransitionLiteResult.jsx`
- 함수/컴포넌트: `NewgradGoalComparisonSection`
- exact anchor: `158: function NewgradGoalComparisonSection({ table }) {`
- 역할: 신입 비교표 웹 UI를 직접 렌더한다. 제목, 설명문, 희망 직무/산업 메타, 데스크톱 표, 모바일 카드가 모두 여기 있다.
- 파일 경로: `src/components/report/TransitionLiteResult.jsx`
- 함수/컴포넌트: `TransitionLiteResult`
- exact anchor: `1293: const newgradGoalComparisonTable = isNewgradReport && vm.newgradGoalComparisonTable && typeof vm.newgradGoalComparisonTable === "object"`
- 역할: 신입 전용 VM block을 읽는다.
- 파일 경로: `src/components/report/TransitionLiteResult.jsx`
- 함수/컴포넌트: `TransitionLiteResult`
- exact anchor: `1885: {isNewgradReport && newgradGoalComparisonTable ? (` / `1886: <NewgradGoalComparisonSection table={newgradGoalComparisonTable} />`
- 역할: 신입 리포트에서만 비교표 섹션을 삽입한다.

## 신입 builder owner
- 파일 경로: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- 함수/컴포넌트: `buildNewgradGoalComparisonTable`
- exact anchor: `1367: function buildNewgradGoalComparisonTable(validatedInput, targetJobLabel, targetIndustryLabel) {`
- 역할: 표의 `meta`, `columns`, `rows`, row별 `linkage`, row별 evidence fallback을 조립한다.
- 파일 경로: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- 함수/컴포넌트: `summarizeEvidenceLabels`
- exact anchor: `1359: function summarizeEvidenceLabels(items = [], maxCount = 2) {`
- 역할: evidence를 최대 2개까지 축약하고, 비어 있으면 `입력 없음`을 반환한다.
- 파일 경로: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- 함수/컴포넌트: `makeEmptyVm`
- exact anchor: `1487: newgradGoalComparisonTable: null,`
- 역할: 신입 VM 기본 계약에 block 자리를 만든다.
- 파일 경로: `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- 함수/컴포넌트: `buildNewgradTransitionLiteResult`
- exact anchor: `1578: const newgradGoalComparisonTable = buildNewgradGoalComparisonTable(` / `1599: newgradGoalComparisonTable,`
- 역할: 최종 신입 결과 VM에 비교표 block을 주입한다.

## buildNewgradGoalComparisonTable 구조
- 입력 인자: `validatedInput`, `targetJobLabel`, `targetIndustryLabel`
- 내부 helper: `summarizeEvidenceLabels(items, maxCount = 2)`
- row 생성 흐름:
  1. `certEvidencePack.rows`, `normalizedProjects`, `normalizedInternships`, `normalizedPartTimeExperience` 또는 `normalizedContractExperiences`, `selfReportEvidencePack.strengthRows`, `selfReportEvidencePack.workStyleRows`를 읽는다.
  2. row별 evidence label 배열을 만든다.
  3. 6개 고정 row를 직접 배열 literal로 만든다.
  4. `title`, `meta`, `columns`, `rows`를 반환한다.
- meta/columns/rows shape:
  - `meta.targetJobLabel`
  - `meta.targetIndustryLabel`
  - `columns.item` / `columns.evidence` / `columns.linkage`
  - `rows[{ rowKey, label, evidence, linkage }]`
- fallback 생성 위치:
  - evidence fallback: `1362: if (labels.length === 0) return "입력 없음";`
  - row별 linkage fallback: `1409`, `1421`, `1429`, `1437`, `1445`, `1453`
- linkage 생성 위치:
  - `1407` 이후 각 row literal 안의 삼항 분기에서 직접 생성한다.

## row별 source map
- rowKey: `major`
  - label: `전공`
  - evidence source: `majorLabel || "입력 없음"`
  - normalized input source: `safeInput.major` -> `1379: const majorLabel = toStr(safeInput?.major);`
  - linkage source: `1407`~`1409`
  - fallback 규칙: 전공이 없으면 evidence는 `입력 없음`, linkage는 `아직 연결할 전공 정보가 없습니다.`
  - 산업 연결 반영 여부: 아니오. `safeTargetJobLabel`만 사용한다.
- rowKey: `certifications`
  - label: `자격증`
  - evidence source: `certEvidencePack.rows`의 `displayLabel`
  - normalized input source: `1369: const certRows = toArr(safeInput?.certEvidencePack?.rows);`
  - linkage source: `1417`~`1421`
  - fallback 규칙: `direct_relevant`가 있으면 직무 linkage, 없고 fallback label이 있으면 산업 linkage, 둘 다 없으면 `아직 연결할 자격 근거가 없습니다.`
  - 산업 연결 반영 여부: 예. 다만 `direct_relevant`가 없고 fallback certification label이 있을 때만 `safeTargetIndustryLabel`을 사용한다.
- rowKey: `projects`
  - label: `프로젝트`
  - evidence source: `normalizedRoleLabel || normalizedTypeLabel || normalizedOutcomeLabel`
  - normalized input source: `1370: const projectRows = toArr(safeInput?.normalizedProjects);`
  - linkage source: `1427`~`1429`
  - fallback 규칙: evidence가 없으면 `입력 없음`, linkage는 `아직 연결할 프로젝트 근거가 없습니다.`
  - 산업 연결 반영 여부: 아니오. `safeTargetJobLabel`만 사용한다.
- rowKey: `internships`
  - label: `인턴십`
  - evidence source: `getExperienceRowDisplayLabel(row) || normalizedDurationLabel`
  - normalized input source: `1371: const internshipRows = toArr(safeInput?.normalizedInternships);`
  - linkage source: `1435`~`1437`
  - fallback 규칙: evidence가 없으면 `입력 없음`, linkage는 `아직 연결할 인턴십 근거가 없습니다.`
  - 산업 연결 반영 여부: 예. `safeTargetJobLabel`과 `safeTargetIndustryLabel`을 함께 사용한다.
- rowKey: `contract_experience`
  - label: `아르바이트·계약경험`
  - evidence source: `getExperienceRowDisplayLabel(row) || normalizedDurationLabel`
  - normalized input source: `1372`~`1374`의 `normalizedPartTimeExperience` 우선, 없으면 `normalizedContractExperiences`
  - linkage source: `1443`~`1445`
  - fallback 규칙: evidence가 없으면 `입력 없음`, linkage는 `아직 연결할 실무 보조 경험이 없습니다.`
  - 산업 연결 반영 여부: 아니오. `safeTargetJobLabel`만 사용한다.
- rowKey: `strengths_workstyle`
  - label: `강점·업무스타일`
  - evidence source: `strengthRows.label + workStyleRows.label`
  - normalized input source: `1375`, `1376`의 `selfReportEvidencePack.strengthRows`, `selfReportEvidencePack.workStyleRows`
  - linkage source: `1451`~`1453`
  - fallback 규칙: evidence가 없으면 `입력 없음`, linkage는 `아직 연결할 강점·업무스타일 근거가 없습니다.`
  - 산업 연결 반영 여부: 아니오. `safeTargetJobLabel`만 사용한다.

## 직무/산업 반영 판정
- 판정: 메타만 산업 포함
- 근거 코드: `1458`~`1466`은 title/meta/column을 `직무/산업` 기준으로 만든다. 그러나 row linkage는 `major`, `projects`, `contract_experience`, `strengths_workstyle`가 직무만 사용하고, `internships`만 직무+산업, `certifications`는 fallback branch에서만 산업을 사용한다.
- exact anchor: `1407`~`1453`
- 설명: 표 제목과 메타는 직무+산업을 내세우지만, linkage 문구는 전체적으로 직무 위주이며 산업 반영은 일부 row branch에 한정된다.

## axis/explanation과의 관계
- 파일 경로: `src/lib/analysis/buildNewgradAxisPack.js`
- 함수/컴포넌트: axis comparison/explanation builder
- exact anchor: `3135: comparisonBlock: { ..._axis1ComparisonBlock,` 이후 각 axis `comparisonBlock` / `3144`, `3159` 등 axis explanation builder 호출
- 역할: 신입 axis score, comparisonBlock, explanation payload를 만든다.
- 판단: `buildNewgradGoalComparisonTable`는 이 axis comparisonBlock이나 `axisExplanationRegistry`를 직접 사용하지 않는다. 별도 builder-local 문구 계층이다.

## 경력직 comparison 자산
- 파일 경로: `src/lib/transitionLite/buildTransitionLiteResult.js`
- 함수/컴포넌트: `buildJobExpectationComparisonTable`
- exact anchor: `710: function buildJobExpectationComparisonTable(currentJobItem, targetJobItem, classification) {`
- 역할: 경력직 직무 비교표 producer
- shape: `{ title, columns: { current, target }, rows: [{ rowKey, label, current, target, fitScore?, fitBand? }] }`
- 파일 경로: `src/lib/transitionLite/buildTransitionLiteResult.js`
- 함수/컴포넌트: `buildIndustryContextComparisonTable`
- exact anchor: `800: function buildIndustryContextComparisonTable(currentIndustry, targetIndustry, classification) {`
- 역할: 경력직 산업 비교표 producer
- shape: `{ title, columns: { current, target }, rows: [{ rowKey, label, current, target, fitScore?, fitBand? }] }`
- 파일 경로: `src/lib/transitionLite/buildTransitionLiteResult.js`
- 함수/컴포넌트: experienced VM builder
- exact anchor: `2455: const comparisonTable = riskKey === RISK_INDUSTRY_CONTEXT_SHIFT ...`
- 역할: `topRisks[*].comparisonTable`에 producer 결과를 넣는다.
- 파일 경로: `src/components/report/TransitionLiteResult.jsx`
- 함수/컴포넌트: `RiskComparisonTable`
- exact anchor: `519: function RiskComparisonTable({ table, ... }) {`
- 역할: 경력직 comparisonTable consumer
- 판단: 경력직과 신입은 공용 shape가 아니다. 경력직은 `current/target` 비교표이고, 신입은 `evidence/linkage` 매핑표다.

## 다음 패치 전에 꼭 볼 것
- linkage를 `직무 연결 / 산업 연결` 두 컬럼으로 나눌지 검토하려면 먼저 현재 builder가 산업 linkage를 row별로 충분히 생산하는지부터 확인해야 한다.
- `입력 없음`은 builder와 consumer에 중복되어 있으므로, 수정 시 SSOT를 어디에 둘지 먼저 정해야 한다.
- 빈행 반복 문제를 줄이려면 consumer가 아니라 `buildNewgradGoalComparisonTable`에서 row 노출 정책을 정하는 편이 구조상 더 안전하다.

## 아직 미확정인 것
- 실제 화면 QA 기준으로 이 표가 axis 설명과 어느 정도 중복되는지는 코드만으로 확정할 수 없다.
- 모바일에서 빈행 반복이 실제 사용성 문제로 간주될 수준인지는 코드만으로 확정할 수 없다.

## 2026-04-17 SAFE PATCH PLAN - newgrad goal comparison contract alignment

### What changed
- 표 제목을 `희망 직무 기준 나의 연결 근거`로 낮추고, 설명문과 컬럼명을 현재 builder가 안정적으로 생산하는 범위에 맞춘다.
- 희망 산업은 메타 정보로 유지하되, `행별 설명에는 관련 근거가 있는 경우에만 제한적으로 반영됩니다.`라는 note를 함께 둔다.
- evidence empty copy는 builder에서 `아직 입력한 내용 없음`으로 통일하고, consumer는 row 값을 그대로 렌더하는 방향으로 맞춘다.

### Why this direction
- 현재 row linkage는 대부분 직무 위주이며, 산업 linkage는 자격증 fallback branch와 인턴십 branch에서만 제한적으로 생산된다.
- 이 상태에서 `직무 연결 / 산업 연결` 두 컬럼으로 분리하면 산업 셀이 비거나 억지 문구가 늘어날 가능성이 높다.
- 따라서 이번 라운드는 builder를 copy/fallback SSOT로 두고, 표면 계약을 실제 생성 수준에 맞추는 것이 가장 안전하다.

### Not changed
- axis scoring, axis explanation registry, newgrad axis comparisonBlock, experienced comparisonTable path는 건드리지 않는다.
- 신입 비교표의 6개 row 구조는 유지한다.
- 경력직 `RiskComparisonTable`과 `topRisks[*].comparisonTable` shape는 그대로 둔다.

### Next possible step
- 산업 linkage를 row별로 일관되게 생산하는 규칙을 먼저 정리한 뒤, 필요하면 `직무 연결 / 산업 연결` 컬럼 분리를 다시 검토할 수 있다.

### Copy polish follow-up
전공경험강점 / 실무 보조운영 / 강점업무스타일 표기를 사용자 노출 카피 기준으로 정리했다.
