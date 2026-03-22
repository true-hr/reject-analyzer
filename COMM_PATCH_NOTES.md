1) PATCH CLASSIFICATION
- DETERMINISTIC PATCH

2) FILES MODIFIED
- src/lib/simulation/buildSimulationViewModel.js
- src/components/report/ReportV2Container.jsx
- COMM_PATCH_NOTES.md

3) PRECHECK
- same-file patch sufficient? N
- second file required? Y
- owner-layer fix required? Y
- consumer-only fix sufficient? N
- legacy mixed-path risk present? Y
- confirmation required? N

4) EXACT ANCHORS
- file path: src/lib/simulation/buildSimulationViewModel.js
- function name: buildSimulationViewModel
- nearby anchor string: `// Phase 5: judgment-owned surface builders — typeReadV2 + proofSummaryV2`
- one-line purpose: `typeReadV2` owner materialization path에서 mixed primary pool을 role-read-only contract로 분리

- file path: src/components/report/ReportV2Container.jsx
- function name: __buildTypeReadDisplayPayload
- nearby anchor string: `function __buildTypeReadDisplayPayload(surface) {`
- one-line purpose: 역할 판단 headline/body/detail 생성 경로를 separated role-read contract만 읽도록 변경

- file path: src/components/report/ReportV2Container.jsx
- function name: TypeReadV2
- nearby anchor string: `function TypeReadV2({ surface, resolvedView, mode, onDetailClick }) {`
- one-line purpose: 카드 렌더링이 mixed top-level 대신 roleReadPrimary 계약만 사용하도록 변경

5) BEFORE / AFTER CONTRACT
- exact old owner behavior: `typeReadV2` primary 후보가 `["targetRoleFit","industryContinuity","levelPositionFit","transitionReadiness","evidenceDensity","ownershipDepth"]`였고, 첫 active judgment의 `why/context`가 top-level `label/posture/context/dominantJudgment`로 바로 승격됨. 따라서 `evidenceDensity` 같은 proof-like judgment가 role card primary를 차지할 수 있었음.
- exact new owner behavior: `typeReadV2` role primary 후보를 `["targetRoleFit","industryContinuity","levelPositionFit","ownershipDepth"]`로 제한했고, owner가 `typeReadV2.roleReadPrimary`와 `typeReadV2.roleReadSupport.items`를 materialize함. top-level `typeReadV2`도 동일한 role-only primary에 맞춰 정렬되어 non-role judgment가 primary 의미를 점유하지 못함.
- exact old consumer behavior: `역할 판단`은 `typeReadV2.context/posture/label`에 더해 `careerSurface.structured.mainThesis/supportingPoints`, `topRiskSurface`를 합쳐 headline/body/detail을 재구성했음. SAFE PATCH가 있어도 upstream mixed nomination이 남아 있었음.
- exact new consumer behavior: `역할 판단`은 `typeReadV2.roleReadPrimary`와 `typeReadV2.roleReadSupport.items`만 role meaning 후보로 읽음. Top1 연결은 `__roleReadTopRiskConnection(topRiskSurface)`로만 downstream context에 남고, valid role-read text가 없으면 섹션이 숨겨짐.

6) FINDINGS
- exact current owner materialization path of `typeReadV2`: `src/lib/simulation/buildSimulationViewModel.js`의 `buildSimulationViewModel` 내부 Phase 5 block에서 `__judgItems = vm?.judgmentPack?.items`를 읽고, `__typeReadPrimaryKeys.map(__j).find(...)` 결과로 `__typeReadV2`를 생성하고 있었음.
- exact fields/subkeys currently used as primary candidates before patch: `targetRoleFit`, `industryContinuity`, `levelPositionFit`, `transitionReadiness`, `evidenceDensity`, `ownershipDepth`.
- whether evidence/proof/risk-like judgments were included in the primary pool before patch: Y. `evidenceDensity`가 직접 포함되어 있었고, `transitionReadiness`도 role identity보다는 전환 리스크 성격이 강한 judgment로 같은 owner primary path 안에 섞여 있었음.
- exact current consumer read path of `src/components/report/ReportV2Container.jsx` before patch:
- `역할 판단` headline: `__buildTypeReadDisplayPayload`의 `candidates = [careerStructured.mainThesis, ...careerStructured.supportingPoints, surface.context, surface.posture]`에서 `__trimRoleReadClause` 후 첫 문장을 선택
- `역할 판단` body: 같은 후보군에서 role/risk filter와 dedupe를 거쳐 `summary` 선택
- detail/modal summary: `__buildTypeDetailPayload -> __buildTypeReadDisplayPayload -> title/summary`
- detail/modal reason: `__buildTypeReadDisplayPayload`의 `context = [surface.context, ...careerStructured.supportingPoints, __roleReadTopRiskConnection(topRiskSurface)]`
- live role-read eligible signals retained in new primary pool:
- `targetRoleFit`: role family/directness/adjacent family 쪽 해석
- `industryContinuity`: domain continuity/family distance 해석
- `levelPositionFit`: level/scope/ownership-range 해석
- `ownershipDepth`: ownership/scope/action depth가 role operating shape로 읽히는 경우
- non-role signals excluded from primary eligibility:
- `evidenceDensity`
- `transitionReadiness`
- proof gap / must-have gap / generic requirement shortage phrasing
- risk cause / top risk rationale wording
- why consumer SAFE PATCH alone was not root-complete: consumer는 이미 obvious leakage를 걸러도 owner가 mixed primary를 계속 nominate하고 있었기 때문에, fallback order나 selection change가 생기면 proof/risk 문구가 다시 `typeReadV2.posture/context`로 유입될 수 있었음. root fix는 owner primary contract 분리 없이는 닫히지 않음.

7) PATCH
- owner patch
```js
const __typeReadRolePrimaryKeys = ["targetRoleFit", "industryContinuity", "levelPositionFit", "ownershipDepth"];
const __typeReadRoleItems = __typeReadRolePrimaryKeys
  .map(__j)
  .filter((j) => j && j.status !== "unavailable" && (j.why || j.context));
const __typeReadRolePrimary = __typeReadRoleItems.find((j) => j.why || j.context) || null;
const __typeReadRoleSupportItems = __typeReadRoleItems
  .filter((j) => j && j !== __typeReadRolePrimary)
  .map((j) => ({
    key: j.key,
    label: __typeReadLabelMap[j.key] ?? j.key,
    status: j.status,
    sourceFamily: j.sourceFamily || "judgment_pack",
    posture: j.why || null,
    context: __safeCtx(j.context) || null,
    confidence: j.confidence || null,
    evidenceStrength: __v2Text(j.evidenceStrength) || null,
  }));

const __typeReadV2 = {
  status: __typeReadRolePrimary ? __typeReadRolePrimary.status : "unavailable",
  sourceFamily: __typeReadRolePrimary ? (__typeReadRolePrimary.sourceFamily || "judgment_pack") : "fallback",
  label: __typeReadRolePrimary ? (__typeReadLabelMap[__typeReadRolePrimary.key] ?? __typeReadRolePrimary.key) : null,
  posture: __typeReadRolePrimary?.why || null,
  context: __safeCtx(__typeReadRolePrimary?.context) || null,
  badge: __typeReadRolePrimary ? __typeReadRolePrimary.status.replace(/_/g, " ") : null,
  confidence: __typeReadRolePrimary?.confidence || null,
  evidenceStrength: __v2Text(__typeReadRolePrimary?.evidenceStrength) || null,
  dominantJudgment: __typeReadRolePrimary?.key || null,
  roleReadPrimary: __typeReadRolePrimarySurface,
  roleReadSupport: {
    items: __typeReadRoleSupportItems,
    unavailableReason: __typeReadRoleSupportItems.length > 0 ? null : "role_read_support 없음",
  },
  unavailableReason: __typeReadRolePrimary ? null : "role_read_primary 없음",
};
```

- consumer patch
```js
function __getRoleReadPrimarySurface(surface) {
  if (!surface || typeof surface !== "object") return null;
  const roleReadPrimary = (surface.roleReadPrimary && typeof surface.roleReadPrimary === "object")
    ? surface.roleReadPrimary
    : null;
  if (!roleReadPrimary) return null;
  if (!__txt(roleReadPrimary.posture) && !__txt(roleReadPrimary.context)) return null;
  return {
    ...surface,
    ...roleReadPrimary,
    roleReadPrimary,
    roleReadSupport: (surface.roleReadSupport && typeof surface.roleReadSupport === "object")
      ? surface.roleReadSupport
      : { items: [] },
  };
}
```

```js
const roleSupportItems = __arr(roleSurface.roleReadSupport?.items)
  .filter((item) => item && typeof item === "object");
const candidates = [
  __txt(roleSurface.context),
  __txt(roleSurface.posture),
  ...roleSupportItems.flatMap((item) => [__txt(item.context), __txt(item.posture)]),
].filter(Boolean);
```

```js
const context = [
  ...roleSupportItems.flatMap((item) => [__txt(item.context), __txt(item.posture)]),
  __roleReadTopRiskConnection(topRiskSurface),
]
```

- minimal scope preserved: owner 1 file + consumer 1 file + patch note 1 file only. score/gate/ranking/top risk order/other sections untouched.

8) VALIDATION CHECKLIST
- [x] `역할 판단` owner contract no longer nominates evidence/proof/risk signals as primary role-read candidates
- [x] consumer reads only the separated role-read contract
- [x] headline is role-read-specific, not proof-gap/risk wording
- [x] body/reason explain role-read with role evidence
- [x] Top1 connection is downstream only
- [x] section hides when valid role-read material is absent
- [x] no score/gate/ranking behavior changed
- build validation: `cmd /c npm run -s build` passed on 2026-03-22
