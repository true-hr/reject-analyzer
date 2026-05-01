# Notion Import Commit API 계약

**작성일:** 2026-04-29
**라운드:** Round 7-G0 (설계 전용, 구현 없음)
**구현 대상 라운드:** Round 7-G1 (Worker) + Round 7-G2 (Frontend)
**전제 문서:**
- `docs/notion-import-normalization-contract.md` (Round 7-D0)
- `docs/notion-import-preview-contract.md` (Round 7-F0)
- `supabase/sql/20260428_notion_import_foundation.sql`
- `supabase/sql/20260428_passmap_work_records.sql`

---

## 1. 목적

이 문서는 `POST /api/notion/commit` endpoint의 request/response, 서버 재검증 방식,
DB write contract, 실패/중복 처리 원칙을 고정한다.

Round 7-G1 Worker 구현 라운드는 이 문서를 기준으로 삼는다.
계약 변경이 필요하면 이 문서를 먼저 수정하고, 수정 이유와 날짜를 하단 변경 이력에 기록한다.

**Commit endpoint가 하는 일:**
1. 서버에서 propertyMap 기준으로 Notion 데이터를 재조회하고 재정규화한다.
2. `external_record_links`를 재조회해 status/commitEligible을 서버에서 재판정한다.
3. `commitEligible=true` + `status=new`인 item만 `work_records`와 `external_record_links`에 저장한다.
4. item-level result를 응답에 반환한다.

**Commit endpoint가 하지 않는 일:**
- 프론트에서 받은 preview 결과를 그대로 신뢰해 저장 (반드시 서버 재검증)
- `pending_update` item의 자동 overwrite
- `work_records` 수정/삭제
- Notion 원본 수정 (단방향 import)
- webhook 수신
- 대량 pagination (MVP: 50개 고정)

---

## 2. 범위 / MVP 제외 범위

### MVP 포함 범위

| 항목 | 포함 여부 |
|------|:---:|
| `status=new` + `commitEligible=true` item INSERT | ✅ |
| `work_records` + `external_record_links` 원자적 저장 | ✅ |
| `duplicate` / `pending_update` / `invalid` / `previously_imported_deleted` skip | ✅ |
| `external_record_links` unique 충돌 → `skipped_duplicate` | ✅ |
| item-level result + summary 응답 | ✅ |
| `passmap:work-records-changed` 이벤트 트리거 지시 | ✅ (프론트 계약만) |

### MVP 제외 범위

| 항목 | 제외 이유 |
|------|-----------|
| `pending_update` overwrite | 명시적 사용자 선택 필요. 별도 update flow 설계 필요 |
| `previously_imported_deleted` 재가져오기 | 재가져오기 정책 미결정 |
| Notion → PASSMAP 자동 양방향 sync | webhook 인프라 별도 필요 |
| Notion page 삭제 시 work_record 동기 삭제 | webhook 또는 polling 필요 |
| Notion block body deep import (page content) | GPT 요약 인프라 별도 필요 |
| 50개 초과 pagination 고도화 | MVP limit=50 고정 |
| work_records 수정 UI | Round 7-H+ |
| selectedPreviewIds 체크박스 UI | Round 7-G2 |

---

## 3. Commit API Request Contract

```
POST /api/notion/commit
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

```jsonc
{
  "dataSourceId": "ds_xxx",         // 필수 — preview request와 동일 필드명
  "propertyMap": {
    "title":        "Name",         // 필수
    "recordDate":   "Date",         // 필수
    "description":  "Description", // 선택
    "task":         "Work",         // 선택
    "result":       "Result",       // 선택
    "projectName":  "Project",      // 선택
    "skillTags":    "Tags",         // 선택
    "strengthTags": "Strength"      // 선택
  },
  "defaults": {
    "recordType": "weekly",         // 선택, 기본값 "weekly"
    "workType": "이번 주 기록"       // 선택, 기본값 "이번 주 기록"
  },
  "fallbacks": {
    "allowCreatedTimeAsRecordDate":    false,  // 선택
    "allowLastEditedTimeAsRecordDate": false   // 선택
  },
  "selectedPreviewIds": [           // 선택 — 없으면 commitEligible=true 전체 대상
    "notion:pageId1",
    "notion:pageId2"
  ],
  "limit": 50                       // 선택, 기본값 50, 최대 50
}
```

### 필드 규칙

| 필드 | 필수 | 제약 |
|------|:---:|------|
| `dataSourceId` | ✅ | 없으면 400 `missing_data_source_id` |
| `propertyMap.title` | ✅ | 없으면 400 `invalid_property_map` |
| `propertyMap.recordDate` | ✅ (fallback 없으면) | |
| `selectedPreviewIds` | 선택 | 없으면 전체 new+commitEligible 저장 |
| `limit` | 선택 | 최대 50, 초과 시 클램프 |

### selectedPreviewIds 처리 원칙

- `selectedPreviewIds`가 있으면: 해당 pageId에 해당하는 item 중 서버 재판정 결과 `commitEligible=true`인 것만 저장
- `selectedPreviewIds`가 없으면: 서버 재판정 결과 `commitEligible=true`인 모든 new item 저장
- 프론트가 보낸 previewId 목록은 "저장 의사" 표시일 뿐이며, 서버 재판정이 우선한다

---

## 4. 서버 재검증 원칙

**핵심 원칙: Commit API는 프론트 preview 결과를 저장 근거로 사용하지 않는다.**

프론트가 아무리 정확한 preview 결과를 보내도, 서버는 다음을 독립적으로 재실행한다:

```
1. Supabase JWT 검증 (requireSupabaseUser)
2. active notion_connection 조회 (getActiveNotionConnection)
3. access_token 복호화 (decryptSecret)
4. POST /v1/data_sources/{dataSourceId}/query 재호출 (limit개 page)
5. propertyMap 기준 normalized item 재생성 (extractMappedFieldsFromPage)
6. contentHash 재계산 (sha256Hex + buildHashInput)
7. external_record_links 재조회 (lookupExternalRecordLinks)
8. status/commitEligible 재판정
9. commitEligible=true + status=new item 선별
10. selectedPreviewIds 필터링 (있는 경우)
11. 원자적 저장
```

**이유:** preview 호출과 commit 호출 사이에 다른 탭/기기에서 동일 import가 발생하거나,
Notion 원본이 수정될 수 있다. 서버 재검증 없이는 duplicate/stale 저장이 가능하다.

---

## 5. Status별 Commit 처리 규칙

서버 재판정 결과 기준:

| status | commitEligible | Commit 처리 | result status |
|--------|:---:|-------------|---------------|
| `new` | `true` | ✅ work_records + external_record_links INSERT | `committed` |
| `new` | `false` (validation 오류) | ❌ skip | `skipped_invalid` |
| `duplicate` | `false` | ❌ skip | `skipped_duplicate` |
| `pending_update` | `false` | ❌ skip (절대 overwrite 금지) | `skipped_pending_update` |
| `invalid` | `false` | ❌ skip | `skipped_invalid` |
| `previously_imported_deleted` | `false` | ❌ skip | `skipped_previously_imported_deleted` |
| unique constraint 충돌 (race) | — | ❌ 해당 item skip | `skipped_duplicate` |
| INSERT 실패 (기타) | — | ❌ 해당 item skip | `failed` |

**pending_update 처리 원칙:**
- Notion 원본이 변경됐더라도 기존 `work_record`를 덮어쓰지 않는다.
- `skipped_pending_update`로 응답에 포함한다.
- Round 7-H+에서 별도 update flow를 설계한다.

---

## 6. work_records Insert Payload Contract

normalization-contract.md §7 기준. 아래는 Commit 시점에서의 정확한 매핑이다.

```jsonc
{
  "user_id": "<userId>",
  "record_date": "<mapped.recordDate>",    // YYYY-MM-DD, NOT NULL
  "title": "<mapped.title>",               // NOT NULL
  "description": "<mapped.description>",  // nullable
  "task": "<mapped.task>",                 // nullable
  "result": "<mapped.result>",             // nullable
  "project_name": "<mapped.projectName>", // nullable — work_records 컬럼명 확인 필요
  "strength_tags": ["<mapped.strengthTags>"],  // text[], 없으면 []
  "skill_tags": ["<mapped.skillTags>"],        // text[], 없으면 []
  "work_type": "weekly",                  // defaults.workType 매핑 결과
  "source": "notion",                     // 고정
  "raw_payload": { /* §8 참조 */ }
}
```

> **주의:** `work_records` 테이블에 `project_name` 컬럼 존재 여부를 Round 7-G1 구현 전 확인할 것.
> `20260428_passmap_work_records.sql`에는 `project_name` 컬럼이 명시되어 있지 않다.
> 없으면 `raw_payload.notion.project_name`에만 보존하고 `mapped` 필드 직접 insert는 skip한다.

---

## 7. external_record_links Insert Contract

normalization-contract.md §8 기준.

```jsonc
{
  "user_id": "<userId>",
  "provider": "notion",
  "external_source_id": "<dataSourceId>",       // data_source_id
  "external_record_id": "<page.pageId>",         // unique 키 구성 요소
  "work_record_id": "<insertedWorkRecord.id>",   // 직전에 INSERT된 work_record UUID
  "external_updated_at": "<page.lastEditedTime>",
  "content_hash": "<sha256Hex(buildHashInput)>",
  "last_imported_at": "<nowIso>",
  "sync_status": "imported",
  "raw_meta": {
    "url": "<page.url>",
    "database_id": "<page.databaseId | null>",
    "title": "<mapped.title>"
  }
}
```

**고유 제약:** `UNIQUE(user_id, provider, external_record_id)` — race condition 방어선
**충돌 처리:** INSERT 시 conflict → `skipped_duplicate`로 item-level 처리, API 전체 실패 아님

---

## 8. raw_payload 구조

`raw_payload` 최상위에 반드시 아래 4개 필드를 포함해야 한다.
`adaptWorkRecordRowForHomeDashboard`가 `raw_payload.startDate` 등을 직접 읽기 때문이다.

```jsonc
{
  // ── 캘린더 range/status용 — 반드시 최상위에 위치 ──────────────────
  "startDate": "<mapped.startDate | null>",
  "endDate":   "<mapped.endDate | null>",
  "recordType": "<mapped.recordType>",    // "weekly" 등
  "workType":   "<mapped.workType>",       // "이번 주 기록" 등

  // ── Notion 원본 보존 ──────────────────────────────────────────────
  "notion": {
    "page_id":          "<page.pageId>",
    "data_source_id":   "<dataSourceId>",
    "database_id":      "<page.databaseId | null>",
    "url":              "<page.url>",
    "created_time":     "<page.createdTime>",
    "last_edited_time": "<page.lastEditedTime>",
    "property_map":     { /* commit 시점 propertyMap snapshot */ },
    "imported_at":      "<nowIso>",
    "content_hash":     "<sha256Hex>",
    "validation": {
      "errors":   [],
      "warnings": []
    }
  }
}
```

**`raw_payload.notion.property_map`:**
사용자가 설정한 Notion column → PASSMAP field 매핑 스냅샷.
미래 re-import 또는 업데이트 시 동일 매핑 재현에 사용.

**`raw_payload.notion.properties`:**
MVP에서는 Notion raw properties 전체를 포함하지 않는다.
`property_map`과 `validation` 정보로 충분하다. 필요 시 Round 7-H+에서 추가.

---

## 9. contentHash / duplicate / pending_update 처리

### contentHash 생성 (buildHashInput 기준)

normalization-contract.md §10 및 Worker `buildHashInput` 함수 기준:

```jsonc
{
  "title":        "string",
  "recordDate":   "YYYY-MM-DD",
  "description":  "string | null",
  "task":         "string | null",
  "result":       "string | null",
  "projectName":  "string | null",
  "skillTags":    ["string"],    // 오름차순 정렬 후
  "strengthTags": ["string"],    // 오름차순 정렬 후
  "startDate":    "YYYY-MM-DD | null",
  "endDate":      "YYYY-MM-DD | null",
  "recordType":   "string",
  "workType":     "string"
}
```

- 직렬화: `JSON.stringify(hashInput)` (위 키 순서 고정)
- 알고리즘: SHA-256, hex string (lowercase)
- 구현: Worker `crypto.subtle.digest("SHA-256", TextEncoder.encode(jsonStr))`

### duplicate 판단

`external_record_links`에서 동일 `(user_id, provider, external_record_id)` row가 존재하고
`content_hash`가 동일하면 → `duplicate` → `skipped_duplicate`

### pending_update 판단

동일 row 존재 + `content_hash`가 다름 → `pending_update` → `skipped_pending_update`
**절대 자동 overwrite 안 함.** 응답에 `skipped_pending_update`로 포함.

### Race condition 방어

commit 시점에 `external_record_links` unique constraint 충돌 발생 가능.
→ ON CONFLICT DO NOTHING 또는 충돌 감지 후 `skipped_duplicate` 반환.
→ 전체 API를 실패로 만들지 않는다.

---

## 10. 트랜잭션 전략 비교

### A안: Supabase SQL RPC/function으로 원자적 저장

```sql
CREATE OR REPLACE FUNCTION import_notion_work_record(
  p_user_id       uuid,
  p_work_record   jsonb,   -- work_records insert payload
  p_link          jsonb    -- external_record_links insert payload
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work_record_id uuid;
  v_link_id        uuid;
BEGIN
  INSERT INTO public.work_records (...) VALUES (...) RETURNING id INTO v_work_record_id;
  INSERT INTO public.external_record_links (..., work_record_id)
    VALUES (..., v_work_record_id)
    ON CONFLICT (user_id, provider, external_record_id) DO NOTHING
    RETURNING id INTO v_link_id;
  IF v_link_id IS NULL THEN
    -- unique conflict → rollback and signal duplicate
    RAISE EXCEPTION 'duplicate_record' USING ERRCODE = '23505';
  END IF;
  RETURN jsonb_build_object(
    'workRecordId', v_work_record_id,
    'linkId',       v_link_id
  );
END;
$$;
```

호출: `POST /rest/v1/rpc/import_notion_work_record`

| 항목 | 평가 |
|------|------|
| 원자성 | ✅ 한 트랜잭션 — work_records INSERT 성공 후 link INSERT 실패 시 rollback |
| Race condition 방어 | ✅ ON CONFLICT 처리 포함 |
| Orphan 방지 | ✅ |
| 구현 복잡도 | ⚠️ SQL migration 필요 |
| 기존 인프라 호환 | ✅ supabaseRest helper로 호출 가능 |
| SECURITY DEFINER | ⚠️ service_role로 실행됨 — user_id 파라미터 검증 필수 |

### B안: Worker REST에서 item별 순차 insert

```
1. POST /rest/v1/work_records → 성공 시 workRecordId 획득
2. POST /rest/v1/external_record_links?on_conflict=user_id,provider,external_record_id
   → 성공: 완료
   → 실패: step 1의 work_record를 DELETE (보상 트랜잭션)
```

| 항목 | 평가 |
|------|------|
| 원자성 | ❌ 두 단계 — 보상 delete 실패 시 orphan 가능 |
| Race condition 방어 | ⚠️ ON CONFLICT 활용 가능하나 타이밍 의존적 |
| Orphan 방지 | ⚠️ 보상 delete 필요, 실패 시 orphan |
| 구현 복잡도 | ✅ migration 불필요, 빠른 구현 |
| 기존 인프라 호환 | ✅ |

---

## 11. 최종 권장 구현 방식

**A안 채택 — SQL RPC 방식 권장**

이유:
1. `work_records` + `external_record_links`의 atomic insert는 이 import flow의 핵심 불변식이다.
2. B안의 보상 delete는 "delete도 실패하면 orphan이 생긴다"는 이중 취약점을 갖는다.
3. Supabase PostgREST는 `POST /rest/v1/rpc/{fn}` 방식을 공식 지원한다.
4. Worker의 기존 `supabaseRest` helper로 호출 가능하다. 추가 인프라 불필요.
5. SQL migration은 Round 7-G1의 일부로 진행한다. (별도 라운드 불필요)

**Round 7-G1 SQL migration 추가 범위:**
- `create function import_notion_work_record(...)` SQL function
- `SECURITY DEFINER` — user_id를 파라미터로 받아 검증
- `ON CONFLICT (user_id, provider, external_record_id) DO NOTHING` → 충돌 감지 후 결과 분기

**item당 1회 RPC 호출** — 50개 이하이므로 병렬 호출 가능 (Promise.allSettled)

---

## 12. Commit API Response Contract

```jsonc
{
  "ok": true,
  "summary": {
    "requested": 10,              // commit 요청된 page 수 (selectedPreviewIds 또는 서버 eligible 전체)
    "committed": 6,               // 실제 저장된 수
    "skipped_duplicate": 2,       // duplicate skip 수 (race 포함)
    "skipped_pending_update": 1,  // pending_update skip 수
    "skipped_invalid": 1,         // invalid skip 수
    "skipped_previously_imported_deleted": 0,
    "failed": 0                   // INSERT 오류 (예외적 DB 오류)
  },
  "results": [
    {
      "previewId":        "notion:pageId1",
      "external_record_id": "pageId1",
      "status":           "committed",        // 아래 status 목록 참조
      "work_record_id":   "uuid",            // committed 시 존재, 그 외 null
      "link_id":          "uuid",            // committed 시 존재, 그 외 null
      "message":          ""                 // skip/failed 이유 (선택)
    }
  ]
}
```

### result.status 목록 (snake_case 고정)

| status | 의미 |
|--------|------|
| `committed` | work_records + external_record_links 저장 성공 |
| `skipped_duplicate` | duplicate 판정 또는 race condition unique 충돌 |
| `skipped_pending_update` | pending_update — 자동 overwrite 금지로 skip |
| `skipped_invalid` | invalid — 필수 필드 누락 |
| `skipped_previously_imported_deleted` | 이전 기록 삭제됨 — MVP 재가져오기 보류 |
| `failed` | DB 오류 등 예외적 실패 |

### Error Response

| 상황 | HTTP | code |
|------|------|------|
| 인증 실패 | 401 | `unauthorized` |
| `dataSourceId` 없음 | 400 | `missing_data_source_id` |
| `propertyMap.title` 없음 | 400 | `invalid_property_map` |
| Notion 미연결 | 409 | `notion_not_connected` |
| Notion API 401/403 | 502 | `notion_access_denied` |
| Notion API 404 | 404 | `notion_source_not_found` |
| Worker secrets 누락 | 500 | `config_missing` |
| Supabase 오류 | 502 | `supabase_error` |

---

## 13. 프론트 연동 후속 계약

Round 7-G2 프론트 구현 시 적용할 계약.

### commit 성공 후 캘린더 갱신

```javascript
// Commit API 응답 후 (ok=true이고 committed > 0)
window.dispatchEvent(new CustomEvent("passmap:work-records-changed"));
```

이 이벤트를 `HomeDashboard.jsx`가 이미 구독하고 있다 (`PASSMAP_WORK_RECORDS_CHANGED_EVENT`).
이벤트 발생 시 `fetchRecords()`가 재호출되어 캘린더가 자동 갱신된다.

### 버튼 활성화 조건

| 조건 | 버튼 상태 |
|------|---------|
| `notionPreviewResult`가 null | disabled |
| `summary.new === 0` | disabled — 신규 가져올 항목 없음 안내 |
| `summary.new > 0` | enabled — "가져오기 확정 ({n}건)" |
| commit 진행 중 | disabled + loading |
| commit 완료 | 패널 닫기 또는 결과 표시 |

### 패널 상태 흐름

```
[소스 선택] → [속성 매핑] → [미리보기 확인] → [가져오기 확정]
                                                  ↓
                                       passmap:work-records-changed
                                                  ↓
                                       HomeDashboard 캘린더 갱신
```

---

## 14. 실패 / 부분 성공 처리

### 원칙: item-level 실패는 전체 API 실패로 만들지 않는다

개별 item INSERT 실패 또는 unique conflict는 해당 item의 `status=failed` 또는
`status=skipped_duplicate`로 처리하고, 다른 item은 계속 진행한다.

### 전체 실패 케이스 (ok=false 반환)

- 인증 실패
- Notion API 오류 (재조회 실패)
- Supabase 구조 오류 (RPC function 없음 등)
- Worker secrets 누락

### 부분 성공 케이스 (ok=true, committed < requested)

- 일부 item이 duplicate/pending_update/invalid로 skip
- Race condition으로 일부 item이 skipped_duplicate
- 이 경우 `summary.committed`가 `summary.requested`보다 작음

### 프론트 처리 가이드 (Round 7-G2)

```
if ok && summary.committed > 0:
  → "N건 가져왔습니다" 성공 메시지
  → passmap:work-records-changed 발생
if ok && summary.committed === 0:
  → "가져올 신규 항목이 없습니다" 안내
if ok && summary.failed > 0:
  → "일부 항목 저장에 실패했습니다" 경고 (비중요)
if !ok:
  → notionError에 error 메시지 표시
```

---

## 15. 보안 원칙

| 규칙 | 내용 |
|------|------|
| JWT 검증 | `requireSupabaseUser` 필수 — 미인증 요청 즉시 401 |
| user_id 격리 | 모든 DB write에 `user_id = authResult.user.id` 강제 |
| SQL RPC SECURITY DEFINER | 함수 내부에서 `p_user_id = auth.uid()` 검증 필수 |
| access_token 응답 금지 | 복호화된 Notion access_token은 응답/로그에 절대 포함 금지 |
| SUPABASE_SERVICE_ROLE_KEY 응답 금지 | 응답/로그 절대 금지 |
| TOKEN_ENCRYPTION_KEY 응답 금지 | 응답/로그 절대 금지 |
| raw_payload 보안 | `access_token_enc`, credentials 포함 금지 |
| Notion raw 응답 | 정규화 후 필요 필드만 저장 |
| external_record_links RLS | INSERT/UPDATE/DELETE는 service_role (Worker) 전용. anon/authenticated 클라이언트 직접 write 금지 |

---

## 16. Round 7-G1 구현 범위

Round 7-G1은 Worker 구현 라운드다. 아래 항목을 구현한다.

### 신규 SQL migration (Round 7-G1 일부)

파일명: `supabase/sql/20260429_notion_import_commit_rpc.sql`

```
- CREATE FUNCTION import_notion_work_record(
    p_user_id       uuid,
    p_work_record   jsonb,
    p_link          jsonb
  ) RETURNS jsonb
  LANGUAGE plpgsql SECURITY DEFINER
  → INSERT work_records
  → INSERT external_record_links ON CONFLICT DO NOTHING
  → 충돌 감지 시 RAISE EXCEPTION 'duplicate_record'
  → RETURNS jsonb { workRecordId, linkId }
```

### Worker 구현 (`worker-ai/orange-shadow-95c1/src/index.js`)

```
- ALLOWED_PATHS에 "/api/notion/commit" 추가
- handleNotionCommit(request, env, body) 함수 추가
  1. requireSupabaseUser
  2. request body 검증 (dataSourceId, propertyMap.title, propertyMap.recordDate)
  3. getActiveNotionConnection + decryptSecret
  4. Notion /v1/data_sources/{dataSourceId}/query 재호출
  5. extractMappedFieldsFromPage 재실행 (기존 함수 재사용)
  6. buildHashInput + sha256Hex 재계산 (기존 함수 재사용)
  7. lookupExternalRecordLinks 재조회 (기존 함수 재사용)
  8. status/commitEligible 재판정
  9. selectedPreviewIds 필터 적용
  10. commitEligible=true + new item 선별
  11. Promise.allSettled → 각 item에 대해 supabaseRest('/rest/v1/rpc/import_notion_work_record')
  12. 결과 집계 → summary + results 반환
```

### Round 7-G2 프론트 구현 범위

- `HomeDashboard.jsx`: "가져오기 확정" 버튼 활성화 (`notionPreviewResult.summary.new > 0`)
- `handleNotionCommit` 핸들러 추가
- commit 완료 후 `passmap:work-records-changed` 이벤트 발생
- commit 결과 표시 (committed N건 안내)
- notionPanelOpen 닫기 또는 완료 상태 표시

---

## 변경 이력

| 날짜 | 변경 내용 |
|------|-----------|
| 2026-04-29 | Round 7-G0 최초 작성 |
