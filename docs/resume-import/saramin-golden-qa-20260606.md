# Saramin Resume Import Golden QA 2026-06-06

## 1. 목적

사람인 이력서 PDF 2종을 기준으로 PASSMAP Resume Import가 성공으로 간주해야 하는 골든 QA 기준을 정의한다.

이번 문서는 조사/문서/fixture 기준 산출물이다. import 파서, UI, DB, Supabase, env, deploy, runtime contract는 변경하지 않는다.

현재 저장소에서 대상 PDF 실물은 확인되지 않았다. 따라서 아래 기준은 샘플 파일명과 사람인 이력서 문서 구조를 기준으로 한 expected result이며, 실제 코드 충족 여부는 샘플 실물 투입 후 재검증해야 한다.

## 2. 샘플 목록

| ID | 파일명 | 샘플 유형 | 기대 처리 상태 |
| --- | --- | --- | --- |
| S1 | `에실로코리아_Sales Representative_김은서(사람인)_eunseo8401.pdf` | 텍스트 추출 가능한 사람인 PDF | PDF text extraction 후 Resume Import parser가 구조화 결과를 생성해야 한다. |
| S2 | `김나래_이력서(사람인).pdf` | 이미지형 또는 텍스트 추출 실패 사람인 PDF | 단순 실패가 아니라 OCR 필요 또는 붙여넣기 권장 상태로 분류해야 한다. |

## 3. Sample S1 expected result

### S1 classification

| Field | Expected |
| --- | --- |
| `sourcePlatform` | `saramin` |
| `sourceDocumentRole` | `resume` |
| `textExtractable` | `true` |
| `ocrRequired` | `false` |
| 현재 코드 충족 여부 | 미확인. 대상 PDF 실물이 현재 저장소에서 확인되지 않아 실제 import 결과 비교는 수행하지 않았다. |

### S1 detectedSections

다음 섹션은 사람인 이력서 본문에서 독립 섹션으로 감지되어야 한다.

- `identity`
- `education`
- `experience`
- `certificates`
- `skills`
- `coverLetter`

섹션명이 PDF 내 표기 차이로 달라도, 의미 단위가 유지되면 성공으로 본다. 예: `학력`, `경력`, `자격증/어학/수상`, `보유기술`, `자기소개서`.

### S1 expected identity fields

| Field | Expected |
| --- | --- |
| `name` | `김은서` |
| `email` | 파일명 또는 본문에서 확인 가능한 경우 `eunseo8401` 계열 이메일을 추출한다. 이메일 도메인은 본문 확인 전까지 미확인으로 둔다. |
| `phone` | 본문에 있으면 추출한다. 없거나 마스킹되어 있으면 빈 값 또는 미확인으로 둔다. |
| `targetCompany` | 파일명 기준 `에실로코리아`를 application context로 보존할 수 있으면 보존한다. ResumeProfile identity에 회사명을 후보자 소속처럼 넣으면 실패다. |
| `targetRole` | 파일명 기준 `Sales Representative`를 application context 또는 target role hint로 보존할 수 있으면 보존한다. 후보자 current title로 단정하면 실패다. |

### S1 expected counts and fields

| Item | Expected |
| --- | --- |
| expected education count | 본문 학력 섹션에서 확인되는 항목 수와 일치해야 한다. 샘플 실물 부재로 숫자는 미확인이다. |
| expected experience count | 본문 경력 섹션에서 회사/직무/기간 단위로 확인되는 항목 수와 일치해야 한다. 자기소개서 문단을 경력 항목으로 추가하면 실패다. |
| expected certificate count | 본문 자격증/어학/수상 섹션에서 확인되는 자격/어학/수상 항목 수와 일치해야 한다. 샘플 실물 부재로 숫자는 미확인이다. |
| expected skills | 본문 보유기술, OA, 외국어, 직무역량 키워드를 분리 추출해야 한다. `Sales`, `영업`, `고객관리`, `커뮤니케이션`, `MS Office` 등은 본문에 있을 때만 포함한다. |
| expected coverLetter sections | 자기소개서 섹션의 질문/제목별 문단을 summary 또는 cover letter 전용 필드로 보존해야 한다. 경력 bullet로 섞이면 실패다. |

### S1 expected risks

- 사람인 PDF의 표/섹션 헤더가 텍스트 추출 과정에서 순서가 흔들릴 수 있다.
- 파일명에 포함된 회사명/직무명은 지원 맥락이지 후보자 경력 사실이 아닐 수 있다.
- 자기소개서 장문 문단이 `experience.bullets` 또는 `work_records`로 오염될 수 있다.
- 경력 기간, 재직 여부, 담당업무가 같은 줄에 붙어 추출될 수 있다.
- 이메일 로컬파트 `eunseo8401`만 파일명에 있고 도메인은 본문에만 있을 수 있다.

### S1 failure conditions

- `sourcePlatform`이 `saramin`으로 식별되지 않는다.
- `sourceDocumentRole`이 `resume`이 아닌 JD 또는 unknown으로 분류된다.
- 텍스트 추출 가능한 PDF인데 `textExtractable=false` 또는 hard failure로 처리한다.
- 자기소개서 질문/답변 문단이 경력 bullet, 경력 회사명, 프로젝트 항목으로 섞인다.
- 파일명 회사명 `에실로코리아`를 후보자의 현/전 직장으로 단정한다.
- 파일명 직무명 `Sales Representative`를 후보자의 실제 경력 title로 단정한다.
- identity name `김은서`가 누락된다.
- 학력/경력/자격/스킬/자기소개서 섹션 경계가 소실되어 단일 free text만 남는다.

## 4. Sample S2 expected result

### S2 classification

| Field | Expected |
| --- | --- |
| `sourcePlatform` | `saramin` |
| `sourceDocumentRole` | `resume` |
| `textExtractable` | `false` |
| `ocrRequired` | `true` |
| 현재 코드 충족 여부 | 미확인. 대상 PDF 실물이 현재 저장소에서 확인되지 않아 실제 import 결과 비교는 수행하지 않았다. |

### S2 detectedSections

텍스트 추출 실패 상태에서는 구조화 섹션을 억지로 생성하지 않는다.

- `identity`: 파일명 기준 후보자명 `김나래`만 low-confidence hint로 둘 수 있다.
- `education`: `unverified`
- `experience`: `unverified`
- `certificates`: `unverified`
- `skills`: `unverified`
- `coverLetter`: `unverified`

OCR 또는 사용자의 텍스트 붙여넣기 이후에만 섹션별 expected result를 확정한다.

### S2 expected identity fields

| Field | Expected |
| --- | --- |
| `name` | 파일명 기준 `김나래`를 low-confidence hint로 표시할 수 있다. 본문 OCR 전에는 확정값으로 저장하지 않는다. |
| `email` | 미확인 |
| `phone` | 미확인 |
| `targetCompany` | 미확인 |
| `targetRole` | 미확인 |

### S2 expected counts and fields

| Item | Expected |
| --- | --- |
| expected education count | `unverified_until_ocr` |
| expected experience count | `unverified_until_ocr` |
| expected certificate count | `unverified_until_ocr` |
| expected skills | `unverified_until_ocr` |
| expected coverLetter sections | `unverified_until_ocr` |

### S2 expected risks

- 이미지형 PDF를 빈 텍스트 이력서로 오인할 수 있다.
- 파일명 후보자명만으로 identity를 확정 저장할 수 있다.
- OCR 전 빈 결과를 성공 import로 처리할 수 있다.
- 텍스트 추출 실패를 사용자에게 일반 오류로만 표시해 복구 경로가 사라질 수 있다.
- OCR 또는 붙여넣기 없이 AI parser를 호출하면 hallucinated education/experience/skills가 생성될 수 있다.

### S2 failure conditions

- 텍스트 추출 실패를 단순 실패 또는 crash로 종료한다.
- `ocrRequired=true` 또는 동등한 OCR/붙여넣기 권장 상태를 표시하지 않는다.
- 빈 raw text를 정상 ResumeProfile로 저장한다.
- OCR 전 임의의 학력, 경력, 자격증, 스킬, 자기소개서 내용을 생성한다.
- 파일명 `김나래`만으로 본문 identity가 검증된 것처럼 처리한다.
- 자기소개서/경력/스킬 섹션을 OCR 없이 추정 생성한다.

## 5. 공통 성공 기준

- 사람인 이력서는 `sourcePlatform=saramin`, `sourceDocumentRole=resume`으로 분류한다.
- 텍스트형 PDF와 이미지형 PDF를 서로 다른 import 상태로 분리한다.
- 텍스트형 PDF는 섹션 경계를 유지한 구조화 결과를 만든다.
- 이미지형 또는 텍스트 추출 실패 PDF는 `ocrRequired=true` 또는 동등한 복구 가능 상태로 처리한다.
- 텍스트 추출 실패는 최종 실패가 아니라 OCR 필요/텍스트 붙여넣기 권장 상태로 안내한다.
- 자기소개서 본문은 cover letter/summary 계열로 보존하고 경력 bullet로 섞지 않는다.
- 파일명에서 얻은 회사명/직무명은 지원 맥락 또는 hint로만 취급하고 후보자 경력 사실로 단정하지 않는다.
- 실제 PDF 본문에 없는 항목을 AI가 보강 생성하지 않는다.
- 추출 confidence 또는 verification status가 낮은 항목은 확정 필드와 구분한다.

## 6. 공통 실패 기준

- 사람인 PDF를 unknown platform 또는 JD로 분류한다.
- 텍스트 추출 가능 PDF를 OCR 필요 상태로 잘못 보낸다.
- 이미지형 PDF를 빈 이력서 import 성공으로 처리한다.
- 텍스트 추출 실패를 사용자 복구 경로 없는 hard failure로만 처리한다.
- 자기소개서가 경력 bullet, 프로젝트 bullet, 업무 성과 bullet로 섞인다.
- 파일명 기반 회사/직무/이름 hint를 본문 검증 없이 확정 사실로 저장한다.
- 경력 count가 자기소개서 문단 수에 의해 증가한다.
- certificate/skill/education 섹션을 경험 항목으로 병합한다.
- parser가 본문에 없는 경력, 학력, 자격증, 스킬을 생성한다.

## 7. 다음 Batch 제안

1. `Batch 1-B`: 대상 PDF 2종을 fixture 위치에 추가하거나 접근 경로를 문서화하고, `textExtractable` 판정 로그를 수집한다.
2. `Batch 1-C`: S1 실제 추출 텍스트를 기준으로 education/experience/certificate/skills/coverLetter count를 확정한 JSON fixture를 만든다.
3. `Batch 1-D`: S2 OCR 전 상태에서 UI가 OCR 필요/붙여넣기 권장을 표시하는지 수동 QA한다.
4. `Batch 1-E`: 자기소개서가 경력 bullet로 섞이지 않는지 regression case를 추가한다.

## 검증 메모

- `git status --short --branch` 실행 완료. 기존 unrelated dirty file과 다수 untracked 임시 파일이 있었다.
- `rg -n "saramin|ResumeProfile|parseWithAI|UploadPanel|InputFlow|ParsedFieldsPanel|extract" src docs` 실행 완료. 주요 관련 경로가 확인됐다: `src/components/upload/UploadPanel.jsx`, `src/components/input/InputFlow.jsx`, `src/components/parse/ParsedFieldsPanel.jsx`, `src/App.jsx`, `src/lib/resume/*`, `docs/*ResumeProfile*`.
- 대상 PDF 파일명 검색은 현재 repo 파일 목록에서 발견되지 않았다. workspace root 재귀 검색은 임시/백업 파일량으로 timeout 되어 실물 확인은 미확인이다.
