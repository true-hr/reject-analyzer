# Notion Import 정규화 계약

**작성일:** 2026-04-28
**라운드:** Round 7-D0 (설계 전용, 구현 없음)
**후속 라운드:** Round 7-D (source/schema API) → 7-E (매핑 UI) → 7-F (preview) → 7-G (commit) → 7-H (캘린더 반영)

---

## 1. Purpose

이 문서는 Notion → PASSMAP import 파이프라인의 데이터 정규화 계약을 고정한다.

Round 7-D 이후 모든 구현 라운드는 이 문서를 기준으로 삼는다.
계약 변경이 필요하면 이 문서를 먼저 업데이트한 뒤 코드를 수정한다.

**이 문서가 다루는 범위:**
- Notion page properties → PASSMAP work_records 변환 규칙
- normalizedNotionImportItem 구조
- work_records insert payload 계약
- external_record_links 계약
- import preview status 계약
- content hash 기준
- MVP 포함/제외 경계

**이 문서가 다루지 않는 범위:**
- Cloudflare Worker endpoint 구현 상세
- UI 컴포넌트 설계
- 양방향 sync / webhook

---

## 2. Data Flow

```
Notion data source (database)
  └─ Notion page + page properties
       └─ [Round 7-D] source/schema 조회 → property type 목록 반환
            └─ [Round 7-E] 사용자 컬럼 매핑 (propertyMap 설정)
                 └─ [Round 7-F] normalizedNotionImportItem 생성 → importPreviewItem 목록
                      └─ [Round 7-G] import commit
                           ├─ work_records INSERT (source="notion")
                           └─ external_record_links INSERT
                                └─ [Round 7-H] HomeDashboard / PmMvpView 캘린더 갱신
                                               (passmap:work-records-changed 이벤트)
```

**핵심 SSOT 원칙:**
- PASSMAP의 SSOT는 `work_records`다.
- Notion은 외부 기록 저장소이며, PASSMAP이 단방향으로 가져온다.
- 가져온 후 PASSMAP에서 수정해도 Notion 원본에 쓰지 않는다 (MVP 제외).

---

## 3. Notion에서 수집할 정보 범위

### 반드시 가져올 정보

| 항목 | Notion 필드 | 비고 |
|------|-------------|------|
| 페이지 ID | `page_id` | external_record_links 중복 방지 키 |
| 데이터 소스 ID | `data_source_id` | 조회 시 사용한 소스 식별자 |
| 데이터베이스 ID | `database_id` | 가능한 경우 |
| 페이지 URL | `url` | raw_meta 보존 |
| 생성 시각 | `created_time` | ISO 8601 |
| 마지막 편집 시각 | `last_edited_time` | content_hash 기준 아님 (매핑값 기준) |
| 제목 property | title type | mapped.title 필수 소스 |
| 날짜 property | date type | recordDate/startDate/endDate 소스 |
| property schema | properties 구조 | 매핑 UI에서 사용 |

### 있으면 가져올 정보

| 항목 | Notion property 타입 | PASSMAP 후보 |
|------|----------------------|--------------|
| 업무 내용 | rich_text / text | mapped.task |
| 성과 / 결과 | rich_text / text | mapped.result |
| 프로젝트명 | select / rich_text | mapped.projectName |
| 태그 | multi_select / select | mapped.skillTags / strengthTags |
| 상태 | status / select | raw.status (직접 변환은 선택) |
| 날짜 범위 | date (range) | mapped.startDate / endDate |

### MVP에서 제외할 정보

| 항목 | 이유 |
|------|------|
| page body blocks 전체 | 볼륨 크고 구조 복잡, MVP 범위 초과 |
| comments | 별도 API, MVP 제외 |
| files | 파일 저장 미지원 |
| relation target page deep read | N+1 API 호출, 후순위 |
| rollup / formula deep expansion | 계산 의존성, 후순위 |
| people / email 실 사용 | 사용자 식별 불필요 |

---

## 4. Property Type Handling

| Notion type | MVP 직접 매핑 | PASSMAP 변환 대상 | raw 보존 | 비고 |
|-------------|:---:|---|:---:|------|
| `title` | ✅ 필수 | `mapped.title` | ✅ | `plain_text` 배열 join |
| `rich_text` | ✅ | `task` / `result` / `description` 후보 | ✅ | `plain_text` 배열 join |
| `date` | ✅ | `recordDate` / `startDate` / `endDate` | ✅ | `start` / `end` 분리 |
| `select` | ✅ | `projectName` / `recordType` 후보 | ✅ | `.name` 추출 |
| `multi_select` | ✅ | `skillTags` / `strengthTags` 후보 | ✅ | `.name` 배열 |
| `status` | ✅ (raw 우선) | `raw.status` 보존, 직접 변환은 선택 | ✅ | status 의미론은 workspace마다 다름 |
| `checkbox` | ✅ | 특정 필드에 boolean 매핑 가능 | ✅ | |
| `number` | ✅ | 특정 숫자 필드에 매핑 가능 | ✅ | |
| `url` | ✅ | raw 보존 | ✅ | |
| `relation` | ❌ (raw id만) | MVP 제외 — id 배열만 raw 보존 | ✅ | display name 조회 후순위 |
| `formula` | ❌ (raw value만) | MVP 제외 — computed value만 raw 보존 | ✅ | formula 구조 re-compute 후순위 |
| `rollup` | ❌ (raw value만) | MVP 제외 — value만 raw 보존 | ✅ | deep expansion 후순위 |
| `people` | ❌ | MVP 제외 | ✅ | |
| `files` | ❌ | MVP 제외 | ✅ | |

---

## 5. normalizedNotionImportItem Shape

```jsonc
{
  "provider": "notion",

  "external": {
    "pageId": "string",           // Notion page ID
    "dataSourceId": "string",     // Worker 조회 시 사용한 소스 식별자
    "databaseId": "string | null",
    "url": "string",
    "createdTime": "ISO8601",
    "lastEditedTime": "ISO8601"
  },

  "mapped": {
    "title": "string",            // 필수
    "recordDate": "YYYY-MM-DD",   // 필수
    "description": "string | null",
    "task": "string | null",
    "result": "string | null",
    "projectName": "string | null",
    "skillTags": ["string"],
    "strengthTags": ["string"],
    "startDate": "YYYY-MM-DD | null",
    "endDate": "YYYY-MM-DD | null",
    "recordType": "weekly",       // MVP 기본값 고정
    "workType": "이번 주 기록"    // MVP 기본값 고정
  },

  "raw": {
    "propertyMap": {},            // 사용자가 설정한 Notion column → PASSMAP field 매핑 정보
    "properties": {},             // Notion API 원본 properties 객체
    "status": "string | null",    // Notion status property raw value
    "sourceTitle": "string | null" // Notion database 제목
  },

  "validation": {
    "status": "new | duplicate | pending_update | invalid | excluded",
    "errors": ["string"],         // 예: ["missing_title", "missing_record_date"]
    "warnings": ["string"]        // 예: ["used_created_time_as_record_date"]
  },

  "hashInput": {
    // content_hash 계산에 사용할 필드만 포함 (§10 참고)
    "title": "string",
    "recordDate": "YYYY-MM-DD",
    "description": "string | null",
    "task": "string | null",
    "result": "string | null",
    "projectName": "string | null",
    "skillTags": ["string"],      // 정렬된 배열
    "strengthTags": ["string"],   // 정렬된 배열
    "startDate": "YYYY-MM-DD | null",
    "endDate": "YYYY-MM-DD | null",
    "recordType": "string",
    "workType": "string"
  }
}
```

---

## 6. Required Mapping Rules

### 필수 매핑 (없으면 `invalid`)

| PASSMAP 필드 | 소스 | 없을 때 |
|---|---|---|
| `title` | Notion `title` type property | `errors: ["missing_title"]` → invalid |
| `recordDate` | 사용자 지정 날짜 property, 또는 허용된 fallback | `errors: ["missing_record_date"]` → invalid |

### 권장 매핑 (없으면 null)

| PASSMAP 필드 | Notion property 후보 |
|---|---|
| `task` | rich_text (업무 내용) |
| `result` | rich_text (성과/결과) |
| `description` | rich_text (기타 설명) |
| `projectName` | select / rich_text (프로젝트) |
| `skillTags` | multi_select (기술/역량 태그) |
| `strengthTags` | multi_select (강점 태그) |

### 기본값 (사용자 매핑 없을 때)

| 필드 | 기본값 |
|---|---|
| `recordType` | `"weekly"` |
| `workType` | `"이번 주 기록"` |
| `work_type` (DB 컬럼) | `"weekly"` |
| `source` (DB 컬럼) | `"notion"` |

### 날짜 우선순위 (recordDate 결정)

```
1순위: 사용자가 매핑한 Notion date property start
2순위: date range start (range property인 경우)
3순위: created_time (사용자가 명시적으로 허용한 경우만)
4순위: last_edited_time (사용자가 명시적으로 허용한 경우만)
```

> **주의:** `last_edited_time`은 기본 `recordDate`로 쓰지 않는다.
> `created_time` / `last_edited_time` fallback은 사용자가 매핑 UI에서 선택했을 때만 허용한다.
> 사용 시 `warnings: ["used_created_time_as_record_date"]` 또는 `["used_last_edited_time_as_record_date"]`를 기록한다.

---

## 7. work_records Insert Payload Contract

```jsonc
{
  "user_id": "userId",
  "record_date": "mapped.recordDate",        // YYYY-MM-DD
  "title": "mapped.title",
  "description": "mapped.description | null",
  "task": "mapped.task | null",
  "result": "mapped.result | null",
  "project_name": "mapped.projectName | null",
  "strength_tags": ["mapped.strengthTags"],  // 없으면 []
  "skill_tags": ["mapped.skillTags"],        // 없으면 []
  "work_type": "weekly",
  "source": "notion",
  "raw_payload": {
    // ── 캘린더 range/status용 — 반드시 최상위에 위치 ──────────────
    "startDate": "mapped.startDate | null",
    "endDate": "mapped.endDate | null",
    "recordType": "mapped.recordType",
    "workType": "mapped.workType",
    // ── Notion 원본 보존 ─────────────────────────────────────────
    "notion": {
      "page_id": "external.pageId",
      "data_source_id": "external.dataSourceId",
      "database_id": "external.databaseId | null",
      "url": "external.url",
      "created_time": "external.createdTime",
      "last_edited_time": "external.lastEditedTime",
      "property_map": "raw.propertyMap",
      "properties": "raw.properties",
      "status": "raw.status | null",
      "imported_at": "nowIso"
    }
  }
}
```

> **중요:** `startDate` / `endDate` / `recordType` / `workType`은 `raw_payload` 최상위에 둔다.
> `raw_payload.notion` 안에만 넣으면 `adaptWorkRecordRowForHomeDashboard`가 읽지 못해 캘린더 range에 반영되지 않는다.

---

## 8. external_record_links Contract

```jsonc
{
  "user_id": "userId",
  "provider": "notion",
  "external_source_id": "external.dataSourceId",    // nullable
  "external_record_id": "external.pageId",          // unique 키 일부
  "work_record_id": "insertedWorkRecord.id",         // 삭제 시 null로 변경 (on delete set null)
  "external_updated_at": "external.lastEditedTime",
  "content_hash": "sha256(JSON.stringify(hashInput))", // §10 참고
  "last_imported_at": "nowIso",
  "sync_status": "imported",
  "raw_meta": {
    "url": "external.url",
    "database_id": "external.databaseId | null",
    "title": "mapped.title"
  }
}
```

**고유 키:** `(user_id, provider, external_record_id)` — 동일 Notion page는 사용자당 1행만 존재.

**삭제 처리:** `work_records`가 hard delete되면 `work_record_id`가 null로 변경됨 (on delete set null).
이 상태를 "previously_imported_deleted"로 판단해 재가져오기 시 별도 처리한다.

---

## 9. Import Preview Status Contract

### Status 종류

| status | 판단 기준 | MVP 처리 |
|--------|-----------|----------|
| `new` | `external_record_links` 없음 | commit 기본 대상 |
| `duplicate` | link 있음 + content_hash 동일 | skip (건너뜀) |
| `pending_update` | link 있음 + content_hash 다름 | 표시만, 자동 overwrite 금지 |
| `invalid` | `title` 또는 `recordDate` 없음 | 제외 |
| `excluded` | 사용자가 preview에서 체크 해제 | commit 제외 |
| `previously_imported_deleted` | link 있음 + `work_record_id` null | MVP에서 재가져오기 보류 또는 사용자 선택 필요 |

### 판단 순서

```
1. external_record_links 조회 (user_id + provider + external_record_id 기준)
2. link 없음  →  new
3. link 있음
   ├─ work_record_id null  →  previously_imported_deleted
   ├─ content_hash 동일  →  duplicate
   └─ content_hash 다름  →  pending_update
4. mapped.title 없거나 mapped.recordDate 없음  →  invalid (위 판단보다 우선)
5. 사용자 체크 해제  →  excluded
```

---

## 10. Content Hash Rules

### hashInput에 포함할 필드

```jsonc
{
  "title": "mapped.title",
  "recordDate": "mapped.recordDate",
  "description": "mapped.description | null",
  "task": "mapped.task | null",
  "result": "mapped.result | null",
  "projectName": "mapped.projectName | null",
  "skillTags": ["정렬된 배열"],
  "strengthTags": ["정렬된 배열"],
  "startDate": "mapped.startDate | null",
  "endDate": "mapped.endDate | null",
  "recordType": "mapped.recordType",
  "workType": "mapped.workType"
}
```

### 해시 계산 규칙

- 알고리즘: SHA-256
- 입력: `JSON.stringify(hashInput)` (키 순서 고정 — 위 순서대로)
- 배열 필드(`skillTags`, `strengthTags`)는 저장 전 오름차순 정렬하여 hash 흔들림 방지
- null 값은 `null`로 직렬화 (undefined 금지)

### 주의사항

- `last_edited_time`만으로 업데이트 판단하지 않는다.
- Notion에서 last_edited_time이 바뀌어도 mapped fields가 동일하면 `duplicate`로 처리한다.
- hash는 PASSMAP에 의미 있는 내용이 바뀌었는지 판단하는 기준이다.

---

## 11. Error and Warning Codes

### Errors (invalid 처리)

| 코드 | 의미 |
|------|------|
| `missing_title` | title property가 없거나 빈 값 |
| `missing_record_date` | 유효한 날짜 소스 없음 |
| `unsupported_date_fallback` | 허용되지 않은 날짜 fallback 시도 |
| `invalid_property_type` | 매핑 대상 property type이 예상과 다름 |
| `invalid_date_range` | startDate > endDate |

### Warnings (기록만, invalid 처리 아님)

| 코드 | 의미 |
|------|------|
| `used_created_time_as_record_date` | created_time을 recordDate로 사용 |
| `used_last_edited_time_as_record_date` | last_edited_time을 recordDate로 사용 |
| `relation_name_not_expanded` | relation property의 display name 미조회 |
| `formula_value_not_expanded` | formula property raw value만 보존 |
| `status_saved_as_raw_only` | status property를 PASSMAP 필드로 변환하지 않고 raw 보존만 |
| `pending_update_not_auto_applied` | content_hash 변경 감지됐으나 자동 덮어쓰기 미적용 |

---

## 12. MVP Exclusions

MVP에서 명시적으로 제외한다.

| 기능 | 이유 |
|------|------|
| 양방향 sync (Notion ← PASSMAP) | 복잡도, 충돌 해결 미정의 |
| Notion webhook | 인프라 추가 필요, MVP 이후 |
| 자동 overwrite (pending_update) | 의도치 않은 데이터 덮어쓰기 방지 |
| page body blocks deep import | 볼륨/구조 복잡, MVP 범위 초과 |
| relation / rollup / formula deep expansion | N+1 API 호출, 후순위 |
| import 완료 후 Notion에 쓰기 | 단방향 원칙 |
| comments / files | 별도 저장 구조 필요 |

---

## 13. Future Extensions

이 문서에 고정된 계약 이후 확장 예정 기능.

| 기능 | 라운드/시점 |
|------|------------|
| `notion_import_sources` 테이블로 propertyMap 저장 | Round 7-D+ 또는 별도 |
| Notion webhook 기반 자동 sync | MVP 이후 |
| PASSMAP → Notion export | 장기 로드맵 |
| `pending_update` overwrite UI | MVP 이후 |
| relation display name expansion | MVP 이후 |
| Notion block body 요약 import (GPT 활용 등) | 장기 로드맵 |
| resume update candidate 자동 연결 | 별도 설계 필요 |

---

## 14. Implementation Notes for Future Rounds

각 후속 라운드는 이 문서를 기준 문서로 참조한다.
계약 변경 시 이 문서를 먼저 수정하고, 수정 이유와 날짜를 기록한다.

| 라운드 | 이 문서 참조 방식 |
|--------|-------------------|
| **Round 7-D** source/schema API | §4 Property Type Handling 기준으로 property type 목록 반환. 매핑 가능/불가 여부 표시 |
| **Round 7-E** 매핑 UI | §6 Required Mapping Rules의 필수/권장 구분을 UI에 반영. propertyMap 구조는 §5 `raw.propertyMap` 형태로 저장 |
| **Round 7-F** import preview | §9 Import Preview Status Contract를 그대로 따름. validation 결과는 §11 Error/Warning Codes 사용 |
| **Round 7-G** import commit | §7 work_records Insert Payload Contract와 §8 external_record_links Contract를 그대로 따름. 이 문서와 다르면 구현 오류 |
| **Round 7-H** 캘린더 반영 | §7의 `raw_payload.startDate` / `endDate` / `recordType` 최상위 위치가 `adaptWorkRecordRowForHomeDashboard` 동작 전제. 위치 변경 금지 |

---

*이 문서의 계약을 변경할 때는 변경 이유와 날짜를 이 섹션 아래에 기록한다.*
