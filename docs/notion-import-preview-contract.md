# Notion Import Preview API 계약

**작성일:** 2026-04-29
**라운드:** Round 7-F0 (설계 전용, 구현 없음)
**구현 대상 라운드:** Round 7-F
**전제 문서:** `docs/notion-import-normalization-contract.md` (Round 7-D0)

---

## 1. Purpose

이 문서는 `POST /api/notion/preview` endpoint의 request/response/validation/hash/dedup 계약을 고정한다.

Round 7-F 구현 라운드는 이 문서를 기준으로 삼는다.
계약 변경이 필요하면 이 문서를 먼저 수정하고, 수정 이유와 날짜를 하단 변경 이력에 기록한다.

**Preview endpoint가 하는 일:**
1. 프론트에서 받은 `dataSourceId` + `propertyMap`으로 Notion page 목록을 조회한다
2. 각 page의 properties를 `propertyMap`에 따라 PASSMAP field로 변환한다
3. `external_record_links`를 조회해 new/duplicate/pending_update/invalid/previously_imported_deleted를 판별한다
4. 정규화된 preview 항목 목록을 반환한다

**Preview endpoint가 하지 않는 일:**
- `work_records` 저장 (Round 7-G)
- `external_record_links` 저장 (Round 7-G)
- Notion page body blocks 조회 (MVP 제외)
- 자동 overwrite (MVP 제외)

---

## 2. 전제 문서 참조

| 전제 문서 섹션 | 이 문서에서 참조하는 방식 |
|---|---|
| `§5 normalizedNotionImportItem` | preview item의 `mapped`, `validation`, `hashInput` shape 기준 |
| `§6 Required Mapping Rules` | 필수/권장 매핑, 날짜 우선순위, 기본값 |
| `§9 Import Preview Status Contract` | preview status 판단 순서 |
| `§10 Content Hash Rules` | content_hash 생성 대상 필드 |
| `§11 Error and Warning Codes` | validation 코드 목록 |

---

## 3. Endpoint 개요

```
POST /api/notion/preview
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

| 항목 | 내용 |
|------|------|
| Method | POST |
| Auth | `requireSupabaseUser` (Supabase JWT) |
| DB Write | 없음 — 순수 조회 + 정규화 |
| Notion API 호출 | data source query (page 목록) |
| Supabase 조회 | `external_record_links` (중복 판단) |
| 응답 | preview items 목록 + summary |

---

## 4. Request Contract

```jsonc
{
  "dataSourceId": "ds_xxx",           // 필수 — Notion data source ID
  "databaseId": "db_xxx",             // 선택 — 응답 metadata에만 사용
  "propertyMap": {
    // key: PASSMAP field명, value: Notion property 이름(column name)
    "title":        "Name",           // 필수
    "recordDate":   "Date",           // 필수
    "description":  "Description",   // 선택
    "task":         "Work",           // 선택
    "result":       "Result",         // 선택
    "projectName":  "Project",        // 선택
    "skillTags":    "Tags",           // 선택
    "strengthTags": "Strength"        // 선택
  },
  "defaults": {
    "recordType": "weekly",           // 기본값 (없으면 "weekly")
    "workType": "이번 주 기록",        // 기본값 (없으면 "이번 주 기록")
    "work_type": "weekly"
  },
  "fallbacks": {
    "allowCreatedTimeAsRecordDate":    false,  // true여야 created_time 사용 가능
    "allowLastEditedTimeAsRecordDate": false   // true여야 last_edited_time 사용 가능
  },
  "limit": 50                         // 선택 — 기본값 50, 최대값 50
}
```

### 필드 규칙

| 필드 | 필수 여부 | 기본값 | 제약 |
|------|:---:|------|------|
| `dataSourceId` | ✅ 필수 | — | 없으면 400 `missing_data_source_id` |
| `databaseId` | 선택 | null | 응답 metadata에만 사용 |
| `propertyMap.title` | ✅ 필수 | — | Notion `title` type property 이름 |
| `propertyMap.recordDate` | ✅ 필수 | — | Notion `date` type property 이름 (fallback 허용 시 예외) |
| `defaults` | 선택 | 위 기본값 | 빠지면 기본값으로 채움 |
| `fallbacks` | 선택 | 모두 false | |
| `limit` | 선택 | 50 | 최대 50. 초과 시 50으로 클램프 |

### propertyMap.title 허용 Notion property type

| Notion type | 허용 여부 | 비고 |
|---|:---:|---|
| `title` | ✅ 허용 | 권장 — plain_text 배열 join |
| `rich_text` | ⚠️ 허용 (비권장) | plain_text join. warning 없음 |
| 그 외 | ❌ 불허 | `unsupported_title_property` error |

### propertyMap.recordDate 허용 Notion property type

| Notion type | 허용 여부 | 비고 |
|---|:---:|---|
| `date` | ✅ 허용 | `start` → recordDate/startDate, `end` → endDate |
| 그 외 | ❌ 불허 | `unsupported_record_date_property` error → fallback 판단으로 이동 |

recordDate fallback 허용 조건:
```
propertyMap.recordDate가 없거나 해당 property type 불허일 때:
  → fallbacks.allowCreatedTimeAsRecordDate = true이면 created_time 사용
  → fallbacks.allowLastEditedTimeAsRecordDate = true이면 last_edited_time 사용
  → 둘 다 false이면 missing_record_date error
```

---

## 5. Notion Query Contract

### 사용할 Notion API

```
POST /v1/data_sources/{data_source_id}/query
Notion-Version: 2025-09-03
Authorization: Bearer <decrypted_access_token>
Content-Type: application/json
```

> **주의:** Notion API 2025-09-03 이후 database query(`POST /v1/databases/{id}/query`)가 아닌
> data_source query를 사용한다. 정확한 endpoint 명칭은 구현 전 공식 문서에서 재확인 필요.
> 구현 시 `POST /v1/databases/{database_id}/query` fallback 여부도 검토할 것.

### Request Body

```jsonc
{
  "page_size": 50,
  "sorts": [
    { "timestamp": "last_edited_time", "direction": "descending" }
  ]
  // filter: MVP에서는 생략 (전체 page 조회)
}
```

### Pagination 정책

| 항목 | MVP 정책 |
|------|---------|
| page_size | `limit` 값 (기본 50, 최대 50) |
| pagination | 1회만 — `next_cursor` 추적 없음 |
| 이유 | MVP에서는 최근 50개 기준 import 설계. 필요 시 Round 7-F+ 확장 |

### 정렬 정책

| 항목 | MVP 정책 |
|------|---------|
| 기본 정렬 | `last_edited_time` 내림차순 |
| 이유 | 최근 편집 항목 우선 preview. 사용자가 자주 편집한 항목부터 확인 가능 |

---

## 6. Property Extraction Rules

각 Notion property type에서 PASSMAP field 값을 추출하는 규칙.

| Notion type | 추출 방식 | PASSMAP 목적지 | MVP 허용 |
|---|---|---|:---:|
| `title` | `title[].plain_text` join | `mapped.title` | ✅ |
| `rich_text` | `rich_text[].plain_text` join | `task` / `result` / `description` / `projectName` | ✅ |
| `date` | `.date.start` → recordDate/startDate<br>`.date.end` → endDate (null이면 생략) | `recordDate`, `startDate`, `endDate` | ✅ |
| `select` | `.select.name` | `projectName` / `skillTags` (단일값 배열) / `strengthTags` | ✅ |
| `multi_select` | `.multi_select[].name` 배열 | `skillTags`, `strengthTags` | ✅ |
| `status` | `.status.name` raw only | `raw.status` 보존 | ✅ (raw만) |
| `checkbox` | `.checkbox` boolean | raw 보존만. PASSMAP field 직접 매핑 없음 | ✅ (raw만) |
| `number` | `.number` | raw 보존만 | ✅ (raw만) |
| `url` | `.url` | raw 보존만 | ✅ (raw만) |
| `relation` | `.relation[].id` 배열 | raw 보존만. display name 조회 없음 | ✅ (raw id만) |
| `formula` | `.formula.{type}` raw value | raw 보존만 | ✅ (raw만) |
| `rollup` | `.rollup.{type}` raw value | raw 보존만 | ✅ (raw만) |
| `people` | 제외 | raw 보존만 | ⚠️ (raw만) |
| `files` | 제외 | raw 보존만 | ⚠️ (raw만) |
| 알 수 없는 type | 제외 | raw 보존만 | ⚠️ |

### multi_select → skillTags / strengthTags 처리

`propertyMap.skillTags`에 매핑된 Notion property가 `select` type이면 단일 값을 배열로 감싸 반환.
`multi_select` type이면 `.name` 배열 그대로 반환.

### date range 처리

```
date.start  → mapped.recordDate (1순위), mapped.startDate
date.end    → mapped.endDate (null이면 생략)
range 감지 시 → warnings: ["date_range_detected"]
```

---

## 7. Validation Rules

### 7-1. Error 코드 (해당 item → status: invalid)

| 코드 | 발생 조건 |
|------|-----------|
| `missing_title` | `propertyMap.title`이 없거나, 추출된 title이 빈 문자열 |
| `missing_record_date` | 유효한 날짜 소스 없음 (property 없음 + fallback 미허용) |
| `invalid_date_property` | recordDate 대상 property 값이 null / 파싱 불가 |
| `unsupported_title_property` | `propertyMap.title`이 가리키는 property type이 title/rich_text가 아님 |
| `unsupported_record_date_property` | `propertyMap.recordDate`가 가리키는 property type이 date가 아님 (fallback으로 넘어감) |
| `invalid_property_map` | `propertyMap`이 없거나, title/recordDate 필수 키 누락 (request 수준 오류) |
| `notion_page_parse_failed` | page property 파싱 중 예외 발생 |

### 7-2. Warning 코드 (item 포함, status는 유지)

| 코드 | 발생 조건 |
|------|-----------|
| `used_created_time_as_record_date` | fallback으로 `created_time`을 recordDate로 사용 |
| `used_last_edited_time_as_record_date` | fallback으로 `last_edited_time`을 recordDate로 사용 |
| `date_range_detected` | date property에 end 값이 존재 (range property) |
| `relation_saved_as_raw_only` | relation property가 raw id만 보존됨 |
| `status_saved_as_raw_only` | status property가 raw name만 보존됨 |
| `formula_value_not_expanded` | formula/rollup이 raw value만 보존됨 |

---

## 8. Preview Status Rules

판단 순서 (위에서 우선):

```
1. invalid
   → errors 배열에 항목이 있는 모든 경우
   → missing_title, missing_record_date 등 포함

2. previously_imported_deleted
   → external_record_links row 존재
   → work_record_id IS NULL

3. duplicate
   → external_record_links row 존재
   → work_record_id IS NOT NULL
   → content_hash 동일

4. pending_update
   → external_record_links row 존재
   → work_record_id IS NOT NULL
   → content_hash 다름

5. new
   → external_record_links row 없음

6. excluded
   → 프론트에서 사용자가 체크 해제. 서버 preview 응답에는 포함하지 않음.
   → commit request 시 excluded page_id를 명시적으로 제외 가능
```

> **주의:** `invalid` 판단은 external_record_links 조회 전에 적용한다.
> invalid인 item도 preview 응답에는 포함한다 (사용자에게 이유를 보여줘야 함).
> commit 대상에서는 제외한다.

---

## 9. MVP Commit Eligibility

preview response의 각 item에 `commitEligible` 필드를 포함한다.

| status | commitEligible | 이유 |
|--------|:---:|------|
| `new` + validation.errors 없음 | `true` | 기본 commit 대상 |
| `new` + validation.errors 있음 | `false` | invalid 항목 제외 |
| `duplicate` | `false` | 이미 가져옴, 변경 없음 |
| `pending_update` | `false` | MVP 자동 overwrite 금지 |
| `invalid` | `false` | 필수 필드 누락 |
| `previously_imported_deleted` | `false` | 사용자 선택 필요 (MVP 보류) |

---

## 10. Content Hash Contract

### hashInput 대상 필드 (순서 고정)

```jsonc
{
  "title":         "string",
  "recordDate":    "YYYY-MM-DD",
  "description":   "string | null",
  "task":          "string | null",
  "result":        "string | null",
  "projectName":   "string | null",
  "skillTags":     ["string"],      // 오름차순 정렬 후 직렬화
  "strengthTags":  ["string"],      // 오름차순 정렬 후 직렬화
  "startDate":     "YYYY-MM-DD | null",
  "endDate":       "YYYY-MM-DD | null",
  "recordType":    "string",
  "workType":      "string"
}
```

### 직렬화 규칙

| 규칙 | 내용 |
|------|------|
| 직렬화 방식 | `JSON.stringify(hashInput)` — 키 순서 위 테이블 기준으로 고정 |
| undefined | `null`로 변환 후 직렬화 (undefined 허용 안 함) |
| 날짜 | `YYYY-MM-DD` 형식으로 정규화. ISO8601 시각이 들어오면 날짜 부분만 추출 |
| 배열 (`skillTags`, `strengthTags`) | 오름차순 정렬 후 직렬화 |
| 빈 배열 | `[]` 그대로 (null 아님) |
| 알고리즘 | SHA-256, hex string (lowercase) |
| 구현 | Cloudflare Worker `crypto.subtle.digest("SHA-256", TextEncoder.encode(jsonStr))` |

### Hash 결과 예시

```
hashInput: { "title": "주간 업무 기록", "recordDate": "2026-04-28", ... }
→ sha256hex: "a3f2b1..."
```

---

## 11. external_record_links Lookup Contract

### 조회 목적

Notion page 목록에서 각 page_id의 중복 여부를 판단한다.

### 조회 대상 테이블

`public.external_record_links`

### 조회 조건

```
user_id = user.id
provider = 'notion'
external_record_id IN (page_id_1, page_id_2, ..., page_id_N)
```

### 조회 컬럼

```
external_record_id, work_record_id, content_hash, sync_status, external_updated_at
```

### 조회 방식

**PostgREST 권장 경로:**

```
GET /rest/v1/external_record_links
  ?user_id=eq.{userId}
  &provider=eq.notion
  &external_record_id=in.({comma-separated-page-ids})
  &select=external_record_id,work_record_id,content_hash,sync_status,external_updated_at
```

> Worker는 `supabaseRest(env, path, { method: "GET" })`를 사용한다.
> `external_record_id in (...)` — PostgREST 문법: `&external_record_id=in.(id1,id2,...)`

### in-query 길이 제한 대응

| 항목 | 내용 |
|------|------|
| MVP limit | 최대 50 page → page_id 50개 = URL 약 2KB 이내 |
| PostgREST 제한 | 일반적으로 수백 개 UUID까지 in-query 안전 |
| MVP 결론 | limit=50이면 in-query 단일 요청으로 충분 |

### 조회 결과 사용

```
lookupMap: Map<pageId, { workRecordId, contentHash, syncStatus, externalUpdatedAt }>

각 page에 대해:
  - lookupMap에 없음 → new
  - 있음 + workRecordId null → previously_imported_deleted
  - 있음 + workRecordId not null + hash 동일 → duplicate
  - 있음 + workRecordId not null + hash 다름 → pending_update
```

---

## 12. Preview Response Contract

```jsonc
{
  "ok": true,
  "summary": {
    "total": 10,
    "new": 6,
    "duplicate": 2,
    "pendingUpdate": 1,
    "invalid": 1,
    "previouslyImportedDeleted": 0
  },
  "items": [
    {
      "previewId": "notion:page_id_xxx",   // "notion:" + page_id
      "status": "new",
      "commitEligible": true,
      "external": {
        "pageId": "page_id_xxx",
        "dataSourceId": "ds_xxx",
        "databaseId": "db_xxx | null",
        "url": "https://notion.so/...",
        "createdTime": "2026-04-28T00:00:00Z",
        "lastEditedTime": "2026-04-28T00:00:00Z"
      },
      "mapped": {
        "title": "주간 업무 기록",
        "recordDate": "2026-04-28",
        "description": null,
        "task": "기능 개발",
        "result": "완료",
        "projectName": "PASSMAP",
        "skillTags": ["React", "TypeScript"],
        "strengthTags": [],
        "startDate": "2026-04-21",
        "endDate": "2026-04-28",
        "recordType": "weekly",
        "workType": "이번 주 기록"
      },
      "validation": {
        "errors": [],
        "warnings": ["date_range_detected"]
      },
      "contentHash": "a3f2b1c4...",        // sha256 hex
      "link": null                          // duplicate/pending_update 시 기존 link 정보
    }
  ]
}
```

### `link` 필드 (duplicate / pending_update 시)

```jsonc
"link": {
  "workRecordId": "uuid",
  "contentHash": "기존 hash",
  "syncStatus": "imported",
  "externalUpdatedAt": "2026-04-27T00:00:00Z"
}
```

`new`이면 `null`. `invalid`이면 null.

### Response에 포함하지 않는 것

| 항목 | 이유 |
|------|------|
| Notion raw page 전체 | 불필요, 보안 위험 |
| Notion property raw 전체 | MVP에서 불필요. `raw.properties` 전체는 응답 제외 |
| `access_token` / `access_token_enc` | 절대 금지 |
| `SUPABASE_SERVICE_ROLE_KEY` | 절대 금지 |
| Notion raw error 전체 | 고정 error code만 반환 |

> **raw 필드 정책:** `normalizedNotionImportItem.raw.properties`는 내부 처리에만 사용하고 preview 응답에 포함하지 않는다. 필요하면 Round 7-G commit payload 생성 시에만 사용.

---

## 13. Error Response Contract

| 상황 | HTTP | body |
|------|------|------|
| 인증 실패 | 401 | `{ ok:false, error:"...", code:"unauthorized" }` |
| `dataSourceId` 없음 | 400 | `{ ok:false, error:"...", code:"missing_data_source_id" }` |
| `propertyMap.title` 없음 | 400 | `{ ok:false, error:"...", code:"invalid_property_map" }` |
| `propertyMap.recordDate` 없음 + fallback 없음 | 400 | `{ ok:false, error:"...", code:"invalid_property_map" }` |
| Notion 미연결 | 409 | `{ ok:false, error:"Notion is not connected", code:"notion_not_connected" }` |
| Notion API 401/403 | 502 | `{ ok:false, error:"Notion access denied", code:"notion_access_denied" }` |
| Notion API 404 | 404 | `{ ok:false, error:"Source not found", code:"notion_source_not_found" }` |
| Notion API 기타 오류 | 502 | `{ ok:false, error:"Notion API error", code:"notion_api_error" }` |
| Supabase 조회 오류 | 502 | `{ ok:false, error:"Failed to load import status", code:"supabase_error" }` |
| Worker secrets 누락 | 500 | `{ ok:false, error:"Worker config missing: ...", code:"config_missing" }` |

> 모든 error response에 민감값(token, key) 포함 금지.

---

## 14. Security Contract

| 규칙 | 내용 |
|------|------|
| `access_token` 사용 위치 | Worker 내부 `notionFetch` 함수에서만 사용 |
| `access_token_enc` | `notion_connections` 조회 후 `decryptSecret`로 복호화. 복호화된 token은 응답에 절대 포함 금지 |
| `SUPABASE_SERVICE_ROLE_KEY` | 응답/로그 절대 금지 |
| `TOKEN_ENCRYPTION_KEY` | 응답/로그 절대 금지 |
| Notion raw response | 정규화 후 필요한 필드만 반환. raw page/properties 전체 반환 금지 |
| DB write | preview 단계에서 없음. `work_records`/`external_record_links` write 금지 |
| `external_record_links` 조회 | `user_id=eq.{userId}` 조건 필수 — 다른 사용자 데이터 조회 불가 |

---

## 15. Open Decisions

Round 7-F 구현 전 확정이 필요한 미결 항목.

| 항목 | 현재 결정 | 보류 이유 |
|------|-----------|-----------|
| **Preview pagination** | MVP 1페이지 50개 고정. `next_cursor` 없음 | 사용자 피드백 후 필요 시 확장 |
| **propertyMap 저장 위치** | 프론트에서 매번 request body로 전송 (DB 저장 안 함) | MVP 단순화. `notion_import_sources` 테이블은 Round 7-D+ 이후 |
| **pending_update overwrite 허용 조건** | MVP에서 금지. 표시만 | 명시적 UI 액션 + overwrite API 별도 설계 필요 |
| **previously_imported_deleted 재가져오기** | MVP에서 `commitEligible:false`. 사용자 선택 필요 | 재가져오기 flow 별도 설계 필요 |
| **Notion page body blocks 요약** | MVP 제외 | GPT 요약 인프라 별도 필요 |
| **data source query endpoint 명칭** | `POST /v1/data_sources/{id}/query` 가정 | Round 7-F 구현 전 공식 문서 재확인 필요 |
| **database query fallback** | 미결정 | `POST /v1/databases/{id}/query`를 fallback으로 허용할지 Round 7-F에서 결정 |

---

## 16. Implementation Notes for Round 7-F

| 단계 | 구현 항목 |
|------|-----------|
| 1. Request validation | `dataSourceId`, `propertyMap.title`, `propertyMap.recordDate` 필수 확인 |
| 2. Auth | `requireSupabaseUser` |
| 3. Notion connection | `getActiveNotionConnection` → `decryptSecret` |
| 4. Notion query | `POST /v1/data_sources/{dataSourceId}/query` (page_size=limit, sort=last_edited_time desc) |
| 5. Page 정규화 | 각 page에 `propertyMap` 적용 → `mapped` + `validation` 생성. `§6 Extraction Rules` 참고 |
| 6. hashInput 생성 | `§10 Content Hash Contract` 기준 필드 추출 → JSON.stringify → SHA-256 |
| 7. external_record_links 조회 | page_id IN (...) 배치 조회 → lookupMap 생성 |
| 8. Status 판단 | `§8 Preview Status Rules` 순서 적용 |
| 9. commitEligible 설정 | `§9 MVP Commit Eligibility` 기준 |
| 10. 응답 구성 | `§12 Preview Response Contract` shape 준수. raw.properties 제외 |

---

*이 문서의 계약을 변경할 때는 변경 이유와 날짜를 이 섹션 아래에 기록한다.*
