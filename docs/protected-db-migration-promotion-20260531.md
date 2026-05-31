# PASSMAP Protected DB Migration Promotion Checklist

## 1. Background

PR #687의 draft SQL은 person_id, linked_auth_users, notification_contacts, person_consents 후보 구조다. 이 draft는 계정 통합, 알림 연락처, 수신 동의/철회 이력을 위한 기반 스키마 후보로 보관되어 있다.

PR #689의 draft SQL은 reminder_rules_v2, reminder_rule_channels_v2, reminder_deliveries_v2 후보 구조다. 이 draft는 다중 알림 규칙, 채널 우선순위, fallback, 발송 ledger를 위한 scheduler v2 스키마 후보로 보관되어 있다.

PR #691, #692, #694에서 scheduler 흐름, reminder settings UI, contact/consent UX 문서화가 완료되었다. 하지만 아직 remote DB apply, RLS 확정, backfill, Edge Function, cron cutover는 진행하지 않았다.

이 문서는 `supabase/sql/drafts/`에 보관된 draft SQL을 실제 Supabase migration으로 승격하기 전 필요한 조건, 승인 항목, 검증 순서, 금지사항, rollback 기준을 정의한다.

## 2. Protected scope

이 DB 승격 작업은 Protected 작업이다.

- auth.users.id와 person_id 관계가 계정 소유권에 직접 영향
- notification_contacts는 전화번호/이메일 등 개인정보에 영향
- person_consents는 수신 동의/철회 이력에 영향
- reminder_rules_v2는 실제 알림 발송 조건에 영향
- reminder_deliveries_v2는 중복 발송 방지와 발송 이력에 영향
- 잘못 적용하면 계정 병합, 알림 오발송, 개인정보 처리 문제, 기존 weekly reminder와 중복 발송 위험이 있음

## 3. Draft SQL inventory

### A. PR #687 draft

파일:

- `supabase/sql/drafts/20260531_person_id_notification_contacts_draft.sql`

후보 구조:

- persons
- linked_auth_users
- notification_contacts
- person_consents

목적:

- auth provider별 user identity를 person_id 기준으로 연결할 수 있는 기반 구조를 준비한다.
- 알림 전용 연락처를 이력서/지원서 연락처와 분리한다.
- 서비스 알림, 채널별 알림, 마케팅/기타 동의를 분리해서 관리한다.

실제 migration 승격 전 필요한 리뷰:

- person_id 생성 기준과 primary_user_id 의미 확정
- linked_auth_users의 provider별 uniqueness와 자동 병합 금지 정책 확인
- notification_contacts의 개인정보 저장, masking, 삭제/비활성화 정책 확인
- person_consents의 consent_type, status, source 기록 기준 확인
- 모든 테이블의 RLS policy 확정

아직 확정되지 않은 TODO:

- 기존 auth.users.id별 person backfill 전략
- 이미 존재하는 연락처와 새 알림 연락처의 중복 처리 기준
- person_id account-linking UX 상세 승인 여부
- provider 계정 연결 해제 정책
- consent 철회 이력 보존 기간과 감사 로그 정책

기존 production 구조와의 관계:

- 기존 user_id 기반 구조를 즉시 대체하지 않는다.
- 기존 reminder, push, profile, resume 계열 데이터를 자동 이동하지 않는다.
- 새 구조는 승격 후에도 dry-run과 검증을 거쳐야 production 발송 흐름에 연결할 수 있다.

### B. PR #689 draft

파일:

- `supabase/sql/drafts/20260531_reminder_rules_v2_draft.sql`

후보 구조:

- reminder_rules_v2
- reminder_rule_channels_v2
- reminder_deliveries_v2

목적:

- person_id 기준으로 여러 개의 알림 규칙을 저장한다.
- rule별 채널 우선순위와 fallback 후보를 분리한다.
- local slot 단위 delivery ledger로 중복 발송을 방지한다.

실제 migration 승격 전 필요한 리뷰:

- cadence, days_of_week, time_local, timezone validation 확정
- rule/channel/delivery 간 FK와 soft delete 정책 확인
- local slot key와 unique 후보 검토
- claim/retry/result_json 저장 범위 확인
- 기존 reminder_preferences와 weekly reminder 구조와의 공존 방식 확인

아직 확정되지 않은 TODO:

- scheduler v2 dry-run behavior 승인
- 기존 reminder_preferences 이전 여부와 이전 방식
- delivery result_json에 provider raw response 저장 가능 여부
- live cutover 시 기존 weekly cron off와 신규 scheduler cron on 순서
- provider fallback의 dry-run과 live 전환 조건

기존 production 구조와의 관계:

- 기존 weekly reminder 구조를 삭제하거나 비활성화하지 않는다.
- v2는 먼저 dry-run delivery ledger 검증 용도로만 사용한다.
- live 발송은 별도 승인 전까지 연결하지 않는다.

## 4. Promotion prerequisites

실제 migration 승격 전 필수 조건:

- [ ] person_id account-linking UX 승인
- [ ] contact verification UX 승인
- [ ] consent grant / withdrawal UX 승인
- [ ] reminder settings UI 구조 승인
- [ ] scheduler v2 dry-run behavior 승인
- [ ] RLS policy 최종 확정
- [ ] set_updated_at trigger 재실행 안정성 확인
- [ ] user_id -> person_id backfill 전략 승인
- [ ] 기존 reminder_preferences 이전 전략 승인
- [ ] 기존 weekly cron cutover 전략 승인
- [ ] rollback plan 승인
- [ ] Supabase remote DB apply 명시 승인
- [ ] production live 발송은 별도 승인으로 분리

## 5. Table-by-table promotion review

### persons

- person_id 생성 기준
- primary_user_id 의미
- display_name / primary_email / primary_phone 보관 여부
- auth.users.id와 관계
- RLS 정책
- 기존 사용자에 대한 backfill 전략

### linked_auth_users

- Google/Kakao/Naver provider 연결 원칙
- 자동 병합 금지
- 이메일/이름/전화번호 기준 병합 금지
- 사용자 명시 동의 필요
- 이미 다른 person_id에 연결된 provider 계정 처리
- 연결 해제 정책은 별도 검토

### notification_contacts

- 알림 연락처 전용
- resume/contact 계열 필드 재사용 금지
- phone/email/web_push destination 저장 방식
- verified_at / disabled_at / deleted_at 정책
- 동일 person 내 복수 연락처 처리
- 다른 person과 중복 연락처 처리 정책
- 개인정보 masking/logging 원칙

### person_consents

- consent_type enum 또는 text check 기준
- granted/revoked/expired 상태 처리
- 철회 이력 보존
- service_notification과 marketing_notification 분리
- consulting_connection 별도 분리
- privacy_processing_delegation_notice 별도 분리
- consent source 기록

### reminder_rules_v2

- person_id 기준
- cadence 종류
- days_of_week validation
- time_local / timezone validation
- skip_policy 기본값
- 하루 여러 알림 허용
- deleted_at soft delete
- 기존 reminder_preferences와 관계

### reminder_rule_channels_v2

- rule별 channel priority
- fallback 처리 기준
- destination 저장 금지
- contact/consent는 notification_contacts/person_consents에서만 확인
- disabled channel 처리

### reminder_deliveries_v2

- local slot key 기준
- 중복 발송 방지 unique 후보
- claim 시점
- retry 정책
- result_json 저장 범위
- provider raw response 저장 여부는 privacy/log policy 승인 후 결정

## 6. RLS review requirements

- persons는 연결된 auth user만 읽을 수 있어야 함
- linked_auth_users는 자기 person에 연결된 항목만 접근 가능해야 함
- notification_contacts는 자기 person 연락처만 접근 가능해야 함
- person_consents는 자기 person 동의만 접근 가능해야 함
- reminder_rules_v2는 자기 person rule만 CRUD 가능해야 함
- reminder_rule_channels_v2는 자기 person rule에 속한 channel만 접근 가능해야 함
- reminder_deliveries_v2는 사용자 조회 범위와 service role 범위를 분리해야 함
- scheduler Edge Function은 service role 기준으로 동작할 수 있으나 client RLS와 분리해서 설계해야 함

## 7. Backfill strategy requirements

Backfill은 아직 하지 않는다. 실제 backfill 전에는 아래 전략과 검증 산출물이 필요하다.

- 기존 auth.users.id별 person 생성 방식
- 기존 reminder_preferences를 reminder_rules_v2로 이전할지 여부
- 기존 push_subscriptions와 person_id 연결 방식
- 기존 reminder_deliveries 보존 여부
- 기존 user_id 기반 데이터 소유권 변경 금지 원칙
- backfill dry-run report 필요
- backfill 전/후 row count 검증
- rollback 가능한 단위로 분리

## 8. Cutover strategy requirements

원칙:

- 기존 weekly cron과 신규 scheduler v2를 동시에 live로 두면 안 됨
- v2는 먼저 dry-run으로만 동작해야 함
- dry-run delivery ledger 검증 후 live 전환 검토
- 기존 weekly cron off는 별도 Protected 승인 필요
- 신규 scheduler cron on도 별도 Protected 승인 필요

필수 검증:

- 중복 발송 없음
- due rule 계산 정확성
- timezone/local slot 정확성
- contact/consent missing 처리
- fallback 미실행/실행 조건
- delivery claim 중복 방지
- result_json 기록 형식

## 9. Rollback plan requirements

- migration apply 직후 rollback 가능성
- 새 테이블 생성만 한 단계와 데이터 backfill 단계를 분리
- 기존 테이블 삭제 금지
- 기존 weekly reminder 유지
- v2 live 전환 전에는 user-facing 영향 없어야 함
- v2 live 전환 후 rollback 시 weekly cron 복구 기준
- provider 발송 live 전환 전에는 메시지 오발송 위험이 없어야 함

## 10. Promotion phases

### Phase 0: docs only

- 현재 단계
- DB 변경 없음

### Phase 1: migration file promotion

- draft SQL을 실제 migration 후보로 이동
- 아직 remote apply 아님
- SQL lint/review

### Phase 2: staging or local apply review

- 가능하면 local/staging apply
- RLS 검증
- trigger 검증
- rollback rehearsal

### Phase 3: production schema apply

- 명시 승인 후 진행
- 새 테이블 생성 중심
- 기존 구조 삭제 없음
- 배포/발송 없음

### Phase 4: dry-run scheduler

- Edge Function v2 dry-run
- provider 호출 없음
- delivery ledger 검증

### Phase 5: backfill

- 별도 승인
- dry-run report 후 apply
- row count 검증

### Phase 6: cutover

- 기존 weekly cron off
- 신규 scheduler cron on
- 별도 승인

### Phase 7: live provider sending

- Kakao/SMS/Email provider 준비 후 별도 승인
- 실제 발송은 최후 단계

## 11. Approval gates

| Gate | 승인자 | 승인 전 산출물 | 실행 가능 작업 | 금지 작업 |
| --- | --- | --- | --- | --- |
| Gate A: DB schema migration file 작성 승인 | Product/Engineering owner | draft SQL review, UX docs, schema risk review | draft SQL을 실제 migration 후보 파일로 승격 | remote DB apply, backfill, RLS apply |
| Gate B: Supabase remote apply 승인 | Product/Engineering owner + DB owner | final migration SQL, RLS review, rollback plan | Supabase production schema apply | data backfill, cron 변경, provider 발송 |
| Gate C: dry-run scheduler 구현 승인 | Product/Engineering owner | scheduler v2 dry-run spec, ledger schema review | Edge Function dry-run 구현 계획/구현 | provider 호출, live 발송, cron live 전환 |
| Gate D: backfill dry-run 승인 | Product/Engineering owner + DB owner | backfill plan, row count query, rollback unit | dry-run report 생성 | 실제 데이터 변경 |
| Gate E: backfill apply 승인 | Product/Engineering owner + DB owner | dry-run report, diff/row count 검증, rollback 기준 | 승인된 범위의 backfill apply | 소유권 자동 병합, 기존 데이터 삭제 |
| Gate F: cron cutover 승인 | Product/Engineering owner + Operations owner | dry-run delivery ledger 검증, 중복 발송 검증 | 기존 weekly cron off, 신규 scheduler cron on | provider live 발송 |
| Gate G: provider live 발송 승인 | Product/Engineering owner + Operations owner | provider 계약/템플릿/발신번호 준비, consent 검증, 발송 QA | Kakao/SMS/Email live 발송 | 승인 외 채널 발송, 마케팅 동의 대체 사용 |

## 12. Guardrails

이번 작업에서 절대 금지:

- 실제 migration 파일 생성 금지
- draft SQL 수정 금지
- Supabase SQL 작성/수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- RLS 실제 적용 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
- Kakao/SMS adapter 구현 금지
- Kakao/SMS API 연동 금지
- 인증번호 발송 구현 금지
- 인증번호 실제 발송 금지
- 문자/SMS 발송 금지
- 카카오톡/알림톡 발송 금지
- 이메일 발송 구현 금지
- 이메일 실제 발송 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- 기존 weekly reminder 구조 삭제/수정/비활성화 금지
- React/UI 구현 금지
- src/App.jsx 수정 금지
- 현재 dirty 상태의 src/App.jsx 또는 임시/QA 산출물 정리/삭제/수정 금지

## 13. Next actions

14. PR 리뷰 후 문서 merge
15. person_id account-linking UX 상세 문서 보강 여부 확인
16. provider 비교 및 Kakao/SMS PoC 준비 문서화
17. scheduler v2 dry-run Edge Function 구현 계획 수립
18. 실제 migration file promotion은 별도 명시 승인 후 진행
19. 실제 DB apply / backfill / cron / live 발송은 별도 명시 승인 후 진행
