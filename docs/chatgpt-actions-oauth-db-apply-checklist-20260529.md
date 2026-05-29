# PASSMAP ChatGPT Actions OAuth DB Apply Checklist

## 1. 목적

이 문서는 `supabase/sql/20260529_chatgpt_oauth_token_tables.sql`을 실제 Supabase DB에 적용하기 전 확인해야 할 체크리스트와 실행 계획이다.

이번 문서 작성 자체는 DB를 변경하지 않는다. 실제 migration 적용은 별도 승인된 Protected 실행 단계에서만 진행한다.

## 2. 적용 대상 migration

적용 대상 파일:

- `supabase/sql/20260529_chatgpt_oauth_token_tables.sql`

생성 예정 테이블:

- `public.chatgpt_oauth_states`
- `public.chatgpt_oauth_authorization_codes`
- `public.chatgpt_oauth_access_tokens`

## 3. 적용 전 확인할 것

적용 전 체크리스트:

- [ ] 최신 `main`에 PR #601 merge commit이 포함되어 있다.
- [ ] 작업자가 올바른 repo와 branch에 있다.
- [ ] Supabase CLI 로그인 상태가 확인되어 있다.
- [ ] 적용 대상 project ref가 확인되어 있다.
- [ ] staging/production 구분이 확인되어 있다.
- [ ] 같은 테이블이 이미 존재하는지 확인했다.
- [ ] 기존 migration history를 확인했다.
- [ ] `gen_random_uuid()` 사용 가능 여부를 확인했다.
- [ ] `auth.users(id)` FK 참조 가능 여부를 확인했다.
- [ ] RLS enable 후 direct client policy가 없는 것이 의도된 설계임을 재확인했다.

## 4. 적용 대상 Supabase project 확인

적용 전 project ref를 반드시 확인한다.

staging과 production이 분리되어 있다면 staging에 먼저 적용한다. production 직접 적용은 사용자 승인 없이는 금지한다.

project ref, DB host, org 이름 등을 터미널 출력이나 문서에 붙일 때 secret이 포함되지 않도록 한다. password, access token, service role key, connection string 전체 값은 기록하지 않는다.

## 5. 실행 금지/허용 범위

이번 문서 작업에서 금지:

- `supabase db push`
- `supabase migration up`
- Supabase Dashboard SQL 실행
- `psql`로 create table 실행
- DB write
- env/secrets 변경
- deploy/redeploy
- OAuth endpoint 구현
- GPT editor 등록
- production smoke

후속 Protected 실행 단계에서만 허용 가능:

- read-only schema 확인
- migration 적용
- 적용 후 read-only verification SQL

## 6. 실제 적용 명령 후보

아래 명령은 후보이며 이번 작업에서 실행하지 않는다. 실제 명령은 repo의 기존 Supabase workflow와 적용 대상 project ref를 확인한 뒤 확정한다.

Supabase CLI link 후 적용 후보:

```powershell
supabase link --project-ref <PROJECT_REF>
supabase db push
```

프로젝트 운영 방식에 따라 migration up 후보:

```powershell
supabase migration up
```

주의:

- command 후보는 실행 계획 기록용이다.
- 실제 적용은 별도 승인된 Protected 실행 단계에서만 한다.
- production project ref가 확정되지 않았거나 staging 검증이 끝나지 않았으면 실행하지 않는다.

## 7. 적용 전 백업/스냅샷/현재 상태 확인

적용 전 체크리스트:

- [ ] Supabase Dashboard에서 automatic backup 또는 point-in-time recovery 가능 상태를 확인했다.
- [ ] 적용 전 대상 테이블 존재 여부를 확인했다.
- [ ] 적용 전 migration history를 확인했다.
- [ ] 적용 전 schema metadata snapshot 저장 여부를 결정했다.
- [ ] production이면 backup 가능 상태 확인 후 진행한다.

read-only 확인 SQL 예시. 이번 문서 작업에서는 실행하지 않는다.

```sql
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  );
```

```sql
select version, name, executed_at
from supabase_migrations.schema_migrations
order by executed_at desc
limit 20;
```

## 8. 적용 후 확인 SQL

적용 후 read-only verification SQL 예시. 이번 문서 작업에서는 실행하지 않는다.

테이블 존재 확인:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  );
```

컬럼 확인:

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  )
order by table_name, ordinal_position;
```

인덱스 확인:

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  )
order by tablename, indexname;
```

RLS enabled 확인:

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  );
```

direct client policy 없음 확인:

```sql
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'chatgpt_oauth_states',
    'chatgpt_oauth_authorization_codes',
    'chatgpt_oauth_access_tokens'
  );
```

기대 결과:

- 세 테이블이 존재한다.
- 필요한 컬럼이 존재한다.
- unique/index가 생성되어 있다.
- `rowsecurity`가 `true`다.
- direct client policy가 없거나 의도된 no rows 결과다.

## 9. 성공 기준

성공 기준:

- 세 테이블이 생성되어 있다.
- 주요 unique/index가 생성되어 있다.
- RLS가 enabled 상태다.
- direct client policy가 없다.
- destructive statement가 실행되지 않았다.
- 기존 테이블과 데이터에 영향이 없다.
- OAuth endpoint는 아직 미구현 상태로 유지된다.
- env/secrets 변경이 없다.

## 10. 실패/중단 조건

아래 조건이 있으면 적용을 중단한다.

- project ref가 불명확하다.
- staging/production 구분이 불명확하다.
- backup 상태가 불명확하다.
- 같은 테이블이 이미 다른 구조로 존재한다.
- `auth.users(id)` FK가 실패한다.
- `gen_random_uuid()`를 사용할 수 없다.
- RLS enable이 실패한다.
- migration history 충돌이 있다.
- Supabase CLI가 다른 project에 link되어 있다.
- 사용자가 production 적용을 승인하지 않았다.

## 11. 롤백/복구 원칙

이 migration은 create table 중심이지만 rollback도 DB 변경이다. 실패했다고 즉시 drop table을 실행하지 않는다.

실패 시 원칙:

- 먼저 실제 적용 상태를 read-only query로 확인한다.
- 어떤 statement까지 적용되었는지 확인한다.
- production이면 Dashboard backup/PITR 가능성을 우선 확인한다.
- 사용자 승인 후 복구 계획을 수립한다.
- rollback SQL은 이 문서에 실행문으로 넣지 않는다.
- 필요한 경우 별도 Protected rollback PR 또는 실행 작업으로 분리한다.

## 12. 적용 후 다음 단계

권장 다음 단계:

1. OAuth authorize/token endpoint 구현 PR
2. `verifyChatgptOAuthToken()` helper 구현
3. save endpoint OAuth token integration
4. revoke/connection management
5. OpenAPI OAuth URL 확정
6. GPT editor registration
7. production smoke

## 13. 이번 문서 작업에서 하지 않은 것

이번 작업에서 하지 않은 것:

- DB migration 실행 안 함
- Supabase 변경 안 함
- Supabase SQL 실행 안 함
- env/secrets 변경 안 함
- deploy/redeploy 안 함
- OAuth endpoint 구현 안 함
- GPT editor 등록 안 함
- production smoke 안 함
