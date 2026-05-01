# PASSMAP Newgrad Transition Lite Execution Input Contract

## 목적
- newgrad transition-lite 실행 입력 계약을 experienced transition input contract와 분리해 잠근다.
- QA / calibration / manual run에서 field drift를 막는다.

## actual owner references
- UI owner
  - `src/components/input/NewgradTransitionLiteInput.jsx`
- VM builder owner
  - `src/lib/transitionLite/buildNewgradTransitionLiteResult.js`
- axis producer owner
  - `src/lib/analysis/buildNewgradAxisPack.js`

## minimum required fields
- `targetJobId`
  - required
  - target job ontology id
- `targetIndustryId`
  - required
  - target industry registry id

## include-now optional fields
- `major`
  - optional
  - 전공 또는 주 전공 서술
- `projects`
  - optional
  - 프로젝트 evidence list
- `internships`
  - optional
  - 인턴 evidence list
- `contractExperiences`
  - optional
  - 계약직/단기 실무 evidence list
  - UI payload에서 보존한다
- `domainInterestEvidence`
  - optional
  - 도메인 관심 근거 list
- `strengths`
  - optional
  - 강점 evidence list
- `workStyleNotes`
  - optional
  - 업무 방식 메모
- `bridgeCandidate`
  - optional
  - pure newgrad / bridge-newgrad subtype signal

## compatibility field notes
- `entryLevelMode: true`
  - newgrad path에서는 항상 true여야 한다.
- `bridgeCandidate: true|false`
  - newgrad subtype signal로 payload에 보존한다.
- `partTimeExperience`
  - current implementation에서 builder compatibility를 위해 `contractExperiences`와 같은 원천을 alias로 함께 실어준다.
- `currentJobId`, `currentIndustryId`
  - newgrad path에서는 required가 아니다.
  - safe empty value 또는 omitted path만 허용한다.

## required / optional split
### required
- `targetJobId`
- `targetIndustryId`

### optional include-now
- `major`
- `projects`
- `internships`
- `contractExperiences`
- `domainInterestEvidence`
- `strengths`
- `workStyleNotes`
- `bridgeCandidate`

### optional compatibility-only
- `partTimeExperience`
  - `contractExperiences` alias

## not-yet-robust / out-of-scope fields
- `coursework`
  - builder는 읽을 수 있지만 current UI minimum form에는 포함하지 않는다.
- `extracurriculars`
  - builder는 읽을 수 있지만 current UI minimum form에는 포함하지 않는다.
- richer repeater structure
  - 이번 round 범위 밖
- exact score calibration metadata
  - 이번 round 범위 밖

## execution payload template
```yaml
entryLevelMode: true
bridgeCandidate: false
targetJobId: JOB_EXAMPLE
targetIndustryId: IND_EXAMPLE
major: 컴퓨터공학
projects:
  - 프로젝트 A
internships:
  - 인턴 B
contractExperiences:
  - 계약직 C
partTimeExperience:
  - 계약직 C
domainInterestEvidence:
  - 도메인 리서치 노트
strengths:
  - 협업 조율
workStyleNotes: 문제를 구조화해서 풀고 이해관계자 정리를 선호함
```

## 운영 메모
- unsupported field invent 금지
- field rename 금지
- pure newgrad / bridge-newgrad 비교 시에도 payload key는 동일하게 유지한다.
