# INDUSTRY Registry Inventory

## 범위

- 이 문서는 Phase 2 inventory 문서다.
- 대상은 프로젝트 내 산업/도메인 특성 원재료 성격이 명확한 1차 후보 자산이다.
- 이번 문서에서는 `src/lib/semantic/taxonomy/domainTaxonomy.js`의 `PROCUREMENT_SCM_DOMAINS`를 primary industry candidate asset으로 inventory 한다.
- 아래 파일들은 보조 참고 자산으로만 취급하고, 본 표의 primary inventory 대상에서는 제외한다.
  - `src/lib/semantic/taxonomy/hrTaxonomy.js`
  - `src/lib/decision/roleOntology/domainTextMap.js`

## Primary Source

- source file: `src/lib/semantic/taxonomy/domainTaxonomy.js`
- export: `PROCUREMENT_SCM_DOMAINS`
- item count: 12

## Inventory Table

| source file | export/key/item name | candidate id | major | sub | label | aliases 존재 여부 | marketType 존재 여부 | operatingRhythm 존재 여부 | decisionStructure 존재 여부 | proofSignals 존재 여부 | domainIntensity 존재 여부 | adjacentIndustries 존재 여부 | jobInteractionHints 존재 여부 | summaryTemplate 존재 여부 | required fields 충족 상태 | inventory grade | note |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=strategic_sourcing` | `확인 필요` | `procurement_scm` | `strategic_sourcing` | `strategic_sourcing` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | industry registry보다 procurement domain taxonomy 성격. `aliases*`, `strongPhrases`, `conceptBundles`는 있으나 Phase 1 required fields 대부분 없음 |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=category_management` | `확인 필요` | `procurement_scm` | `category_management` | `category_management` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=direct_procurement` | `확인 필요` | `procurement_scm` | `direct_procurement` | `direct_procurement` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=indirect_procurement` | `확인 필요` | `procurement_scm` | `indirect_procurement` | `indirect_procurement` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=vendor_management` | `확인 필요` | `procurement_scm` | `vendor_management` | `vendor_management` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=contract_commercial` | `확인 필요` | `procurement_scm` | `contract_commercial` | `contract_commercial` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=cost_management` | `확인 필요` | `procurement_scm` | `cost_management` | `cost_management` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=purchasing_analytics` | `확인 필요` | `procurement_scm` | `purchasing_analytics` | `purchasing_analytics` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=scm_planning` | `확인 필요` | `procurement_scm` | `scm_planning` | `scm_planning` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=supply_risk` | `확인 필요` | `procurement_scm` | `supply_risk` | `supply_risk` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=inventory_logistics` | `확인 필요` | `procurement_scm` | `inventory_logistics` | `inventory_logistics` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |
| `src/lib/semantic/taxonomy/domainTaxonomy.js` | `PROCUREMENT_SCM_DOMAINS.domain=manufacturing_materials` | `확인 필요` | `procurement_scm` | `manufacturing_materials` | `manufacturing_materials` | Y | N | N | N | N | N | N | N | N | Fail | Raw Material | same |

## Grade Summary

- Ready: 0
- Partial: 0
- Raw Material: 12
- Reject for Now: 0

## Auxiliary References

다음 파일은 industry inventory 보조 참고로만 확인했다.

- `src/lib/semantic/taxonomy/hrTaxonomy.js`
- `src/lib/decision/roleOntology/domainTextMap.js`

이유:

- `hrTaxonomy.js`는 HR vertical domain 자산으로, industry registry item보다는 job-domain 성격이 강하다.
- `domainTextMap.js`는 text-only fallback family map으로, SSOT registry보다는 heuristic text map 성격이 강하다.
