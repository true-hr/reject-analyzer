# PASSMAP Person Account-linking UX Detail

## 1. Background

PASSMAP은 장기적으로 Google, Kakao, Naver 로그인을 같은 `person_id` 기준으로 묶어야 한다. Supabase Auth의 `auth.users.id`는 로그인 계정 식별자이며, provider별 로그인 방식과 Supabase identity 생성 방식에 따라 서로 다른 값이 될 수 있다.

PR #683은 `person_id` account-linking principles를 문서화한 원칙 문서다. 이번 문서는 그 원칙을 사용자 경험 관점에서 구체화하는 UX 상세 문서다.

알림 규칙, 알림 연락처, 수신 동의 구조는 `person_id` 기준으로 설계되고 있다. 따라서 Kakao/SMS/Email/Web Push 같은 알림 채널을 확장하기 전에, 여러 provider 계정을 같은 사람으로 안전하게 연결하는 UX가 먼저 명확해야 한다.

아직 Auth provider 설정, Supabase Auth 설정, DB apply, 계정 연결 구현은 하지 않는다. 이 문서는 구현 전에 product/UX/security 정책을 고정하기 위한 문서다.

## 2. UX goals

- 사용자가 현재 어떤 계정으로 로그인했는지 이해한다.
- 사용자가 어떤 외부 계정을 연결할 수 있는지 이해한다.
- 연결 전 기록, 알림, 연락처 공유 범위를 확인한다.
- 자동 병합이 아니라 사용자 동의 기반 연결임을 명확히 보여준다.
- 연결 실패 사유를 구체적으로 보여준다.
- 연결 해제 시 영향 범위를 명확히 보여준다.
- 계정 연결과 연락처 인증을 혼동하지 않게 한다.

## 3. Account identity model

### `person_id`

`person_id`는 PASSMAP의 사람 단위 기준이다. 장기적으로 업무기록, 알림 규칙, 알림 연락처, 수신 동의의 기준이 된다.

`person_id`는 사용자가 어떤 provider로 로그인했는지와 무관하게 PASSMAP에서 같은 사람의 기록과 설정을 묶는 기준이다.

### `auth_user_id`

`auth_user_id`는 Supabase Auth의 로그인 계정 식별자다. Google, Kakao, Naver provider별로 서로 다른 `auth.users.id`가 생길 수 있다.

`auth_user_id`는 로그인 세션과 provider 인증의 기준으로만 사용한다. PASSMAP의 장기 소유권 기준은 `person_id`여야 한다.

### `linked_auth_users`

`linked_auth_users`는 `person_id`와 provider별 `auth_user_id`를 연결하는 후보 테이블이다. draft SQL 또는 향후 migration에서 다음과 같은 필드를 가질 수 있다.

| Field | Meaning |
| --- | --- |
| `person_id` | 연결 대상 PASSMAP 사람 ID |
| `auth_user_id` | Supabase Auth 사용자 ID |
| `provider` | `google`, `kakao`, `naver` 등 provider |
| `provider_email` | provider에서 확인된 이메일 |
| `provider_phone` | provider에서 확인된 전화번호가 있을 경우의 값 |
| `provider_name` | provider에서 표시되는 이름이 있을 경우의 값 |
| `is_primary` | 대표 로그인 계정 여부 |
| `linked_at` | 연결 완료 시각 |
| `linked_by_auth_user_id` | 연결을 승인한 로그인 계정 |
| `source` | 연결이 시작된 화면 또는 플로우 |

주의:

- 이메일이 같아도 자동 연결하지 않는다.
- 이름이 같아도 자동 연결하지 않는다.
- 전화번호가 같아도 자동 연결하지 않는다.
- provider account linking은 사용자 명시 동의 기반이어야 한다.
- provider에서 받은 이메일, 이름, 전화번호는 연결 후보를 설명하는 정보일 뿐, 연결의 근거가 아니다.

## 4. Entry points

### 알림 설정 화면

사용자에게 보여줄 문구:

```text
알림을 여러 채널에서 안정적으로 받으려면 PASSMAP 계정을 같은 사람 기준으로 연결할 수 있습니다.
연결하면 기록과 알림 설정을 같은 PASSMAP 계정에서 함께 관리합니다.
```

버튼:

- `Kakao 계정 연결`
- `Naver 계정 연결`
- `Google 계정 연결`

주의사항:

```text
계정 연결은 연락처 인증과 다릅니다. 휴대폰 번호를 인증해도 Kakao 계정이 자동으로 연결되지는 않습니다.
```

### 계정 설정 화면

사용자에게 보여줄 문구:

```text
현재 로그인 계정과 연결된 외부 계정을 확인하고 관리할 수 있습니다.
연결된 계정은 같은 PASSMAP 기록과 알림 설정을 함께 사용합니다.
```

버튼:

- `다른 계정 연결`
- `연결된 계정 보기`
- `연결 해제 안내 보기`

주의사항:

```text
사용자 동의 없이 이메일, 이름, 전화번호만으로 계정을 자동 병합하지 않습니다.
```

### 로그인 후 "다른 계정 연결" 안내

사용자에게 보여줄 문구:

```text
다른 provider 계정으로도 PASSMAP을 사용하시나요?
Google, Kakao, Naver 계정을 연결하면 같은 PASSMAP 계정에서 기록과 알림 설정을 함께 관리할 수 있습니다.
```

버튼:

- `계정 연결하기`
- `나중에 하기`

주의사항:

```text
연결 전 어떤 기록과 알림 설정이 함께 관리되는지 먼저 확인합니다.
```

### Kakao/SMS 알림 설정 중 휴대폰 인증 후 계정 연결 안내

사용자에게 보여줄 문구:

```text
휴대폰 번호 인증이 완료되었습니다.
Kakao 계정 연결은 별도 단계입니다. Kakao 계정을 연결하면 같은 PASSMAP 계정에서 Kakao 로그인과 알림 설정을 함께 관리할 수 있습니다.
```

버튼:

- `Kakao 계정 연결하기`
- `휴대폰 인증만 유지`

주의사항:

```text
휴대폰 번호 인증은 알림 연락처 확인입니다. Kakao 계정 연결이나 계정 병합을 의미하지 않습니다.
```

### 중복 계정 의심 시 안내 배너

사용자에게 보여줄 문구:

```text
다른 provider 계정으로 PASSMAP을 사용한 적이 있을 수 있습니다.
계정을 연결하면 같은 사람 기준으로 기록과 알림 설정을 함께 관리할 수 있습니다.
```

버튼:

- `연결 가능 계정 확인`
- `배너 닫기`

주의사항:

```text
PASSMAP은 중복 가능성이 있어도 자동으로 계정을 합치지 않습니다. 사용자가 직접 확인하고 동의해야 연결됩니다.
```

## 5. Current account panel copy

```text
현재 로그인 계정:
Google 계정으로 로그인 중입니다.
```

```text
연결된 계정:
- Google: 연결됨
- Kakao: 연결 필요
- Naver: 연결 필요
```

```text
카카오/네이버 계정을 연결하면 같은 PASSMAP 계정에서 기록과 알림 설정을 함께 관리할 수 있습니다.
```

주의 문구:

```text
사용자 동의 없이 이메일, 이름, 전화번호만으로 계정을 자동 병합하지 않습니다.
```

상태별 보조 문구:

| Provider state | Label | Helper copy |
| --- | --- | --- |
| 현재 로그인 중 | `현재 로그인` | 지금 사용 중인 로그인 계정입니다. |
| 연결됨 | `연결됨` | 이 provider로 로그인해도 같은 PASSMAP 기록을 볼 수 있습니다. |
| 연결 필요 | `연결 필요` | 연결하면 같은 PASSMAP 계정에서 함께 관리됩니다. |
| 연결 불가 | `연결 불가` | 이 provider 계정은 다른 PASSMAP 사람 ID에 연결되어 있습니다. |
| 확인 필요 | `확인 필요` | 연결 전 계정 정보를 다시 확인해야 합니다. |

## 6. Link account flow

기본 흐름:

1. 사용자가 `카카오 계정 연결` 또는 `네이버 계정 연결`을 클릭한다.
2. 연결하려는 provider 안내 화면을 표시한다.
3. `연결하면 공유되는 항목`을 표시한다.
4. 사용자가 확인한다.
5. provider OAuth를 진행한다.
6. provider `auth_user_id`를 확인한다.
7. 기존 `linked_auth_users` 충돌을 검사한다.
8. 연결 성공 또는 실패를 처리한다.
9. 연결 결과 화면을 표시한다.

연결 전 표시할 공유 항목:

- PASSMAP 업무기록
- 알림 규칙
- 알림 연락처
- 수신 동의 상태
- 계정 설정 일부

연결하지 않는 항목 또는 주의 항목:

- 결제/과금 정보는 별도 정책 필요
- 컨설팅 연결 동의는 별도 동의
- 마케팅 수신 동의는 별도 동의
- 기존 데이터 소유권 이동은 별도 승인 필요

세부 원칙:

- provider OAuth가 성공해도 즉시 연결 완료로 처리하지 않는다.
- provider `auth_user_id` 확인 후 `linked_auth_users` 충돌 검사를 먼저 수행한다.
- 이미 다른 `person_id`에 연결된 provider 계정은 연결 실패가 아니라 별도 충돌 상태로 보여준다.
- provider 이메일이나 전화번호가 기존 정보와 같아도 자동 병합하지 않는다.
- 사용자가 공유 범위 확인과 명시 동의를 완료해야 연결한다.

## 7. Confirmation copy

연결 전 확인 문구:

```text
카카오 계정을 현재 PASSMAP 계정에 연결할까요?

연결하면 카카오 로그인으로도 같은 PASSMAP 기록과 알림 설정을 사용할 수 있습니다.
연결된 계정에서는 아래 정보가 함께 관리됩니다.

- 업무기록
- 알림 규칙
- 알림 연락처
- 수신 동의 상태

사용자 동의 없이 계정을 자동 병합하지 않으며, 연결은 언제든 설정에서 확인할 수 있습니다.
```

버튼:

- `계정 연결하기`
- `취소`

확인 화면에 함께 보여줄 보조 문구:

```text
연결해도 provider 비밀번호, provider 보안 설정, 외부 서비스 데이터는 PASSMAP으로 가져오지 않습니다.
```

```text
마케팅 수신 동의, 컨설팅 연결 동의, 결제/과금 정보는 이 연결로 자동 변경되지 않습니다.
```

## 8. Success states

성공 문구:

```text
카카오 계정이 연결되었습니다.
이제 카카오 로그인으로도 같은 PASSMAP 계정을 사용할 수 있습니다.
```

연결 후 표시:

```text
- Google: 연결됨
- Kakao: 연결됨
- Naver: 연결 필요
```

다음 액션:

- `네이버 계정도 연결하기`
- `휴대폰 번호 인증하기`
- `알림 설정으로 돌아가기`

성공 상태에서 보여줄 설명:

```text
연결된 계정은 같은 PASSMAP 업무기록, 알림 규칙, 알림 연락처, 수신 동의 상태를 함께 관리합니다.
```

## 9. Failure and conflict states

| Case | User copy | Buttons | Internal principle | Auto merge |
| --- | --- | --- | --- | --- |
| provider OAuth 취소 | 계정 연결이 취소되었습니다. 다시 연결하려면 provider 로그인을 완료해 주세요. | `다시 시도`, `취소` | 연결 상태를 만들지 않는다. | No |
| provider OAuth 실패 | provider 계정을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. | `다시 시도`, `취소` | 실패 사유를 연결 완료로 오인하지 않게 한다. | No |
| provider 이메일 없음 | provider에서 이메일을 확인할 수 없습니다. 이메일 없이도 연결할 수 있는지 별도 확인이 필요합니다. | `계속 확인`, `취소` | 이메일 부재는 자동 병합 또는 자동 차단 기준이 아니다. | No |
| provider 전화번호 없음 | provider에서 전화번호를 확인할 수 없습니다. 휴대폰 번호 인증은 별도 단계에서 진행할 수 있습니다. | `계속 확인`, `휴대폰 인증하기`, `취소` | 전화번호 부재로 연락처를 만들지 않는다. | No |
| 이미 현재 `person_id`에 연결된 계정 | 이 provider 계정은 이미 현재 PASSMAP 계정에 연결되어 있습니다. | `연결된 계정 보기` | idempotent 상태로 처리한다. | No |
| 이미 다른 `person_id`에 연결된 계정 | 이 provider 계정은 다른 PASSMAP 계정에 연결되어 있습니다. 보안을 위해 자동으로 병합할 수 없습니다. | `다른 계정으로 시도하기`, `고객지원 문의`, `취소` | 별도 충돌 상태로 처리하고 고객지원/수동 확인으로 보낸다. | No |
| 같은 이메일이지만 다른 `auth_user_id` | 같은 이메일을 사용하는 계정이 있을 수 있습니다. 이메일만으로는 같은 사람인지 확정할 수 없어 자동으로 병합하지 않습니다. | `계속 진행`, `취소` | 이메일은 참고 정보다. 명시 동의와 충돌 검사가 필요하다. | No |
| 같은 전화번호지만 다른 `auth_user_id` | 같은 전화번호를 사용하는 계정이 있을 수 있습니다. 전화번호만으로는 같은 사람인지 확정할 수 없어 자동으로 병합하지 않습니다. | `계속 진행`, `취소` | 전화번호는 참고 정보다. 연락처 인증과 계정 연결을 분리한다. | No |
| 네트워크 오류 | 연결 요청을 완료하지 못했습니다. 네트워크 상태를 확인하고 다시 시도해 주세요. | `다시 시도`, `취소` | 중복 연결을 만들지 않도록 idempotency가 필요하다. | No |
| 연결 중 세션 만료 | 로그인 세션이 만료되었습니다. 다시 로그인한 뒤 계정 연결을 진행해 주세요. | `다시 로그인` | stale session으로 연결하지 않는다. | No |
| 연결 권한 부족 | 현재 계정으로 이 연결을 완료할 수 없습니다. 다시 로그인해 주세요. | `다시 로그인`, `취소` | 연결 승인 주체를 현재 세션으로 검증한다. | No |
| provider 설정 미완료 | 아직 이 provider 연결을 사용할 수 없습니다. 준비가 완료되면 다시 안내하겠습니다. | `확인` | provider_not_configured 상태로 처리한다. | No |

중요:

```text
이미 다른 person_id에 연결된 계정은 절대 자동 병합하지 않습니다.
사용자에게 고객지원 또는 수동 확인이 필요한 상태로 안내합니다.
```

## 10. Already linked to another person copy

```text
이 카카오 계정은 이미 다른 PASSMAP 계정에 연결되어 있습니다.

보안을 위해 자동으로 계정을 병합할 수 없습니다.
본인 계정이라고 생각된다면 고객지원 또는 계정 확인 절차를 통해 확인이 필요합니다.
```

버튼:

- `다른 계정으로 시도하기`
- `고객지원 문의`
- `취소`

내부 처리 원칙:

- 자동 병합하지 않는다.
- 현재 `person_id`로 `linked_auth_users`를 새로 만들지 않는다.
- 충돌 상태와 시도를 감사 로그 후보로 남긴다.
- 고객지원 수동 병합은 별도 Protected 프로세스로만 진행한다.

## 11. Same email / phone warning

같은 이메일 감지 문구:

```text
같은 이메일을 사용하는 계정이 있을 수 있습니다.

하지만 이메일만으로는 같은 사람인지 확정할 수 없어 자동으로 병합하지 않습니다.
현재 계정에 연결하려면 본인 확인과 명시적인 연결 동의가 필요합니다.
```

같은 전화번호 감지 문구:

```text
같은 전화번호를 사용하는 계정이 있을 수 있습니다.

하지만 전화번호만으로는 같은 사람인지 확정할 수 없어 자동으로 병합하지 않습니다.
현재 계정에 연결하려면 본인 확인과 명시적인 연결 동의가 필요합니다.
```

버튼:

- `계속 진행`
- `취소`

주의:

- 같은 이메일은 연결 후보 설명에만 사용한다.
- 같은 전화번호는 연결 후보 설명에만 사용한다.
- 같은 이메일 또는 전화번호가 있어도 기존 데이터 소유권을 자동 이전하지 않는다.

## 12. Unlink account flow

기본 흐름:

1. 사용자가 연결된 provider 옆 `연결 해제`를 클릭한다.
2. 연결 해제 영향 안내를 표시한다.
3. 사용자가 확인한다.
4. provider 연결 해제를 처리한다.
5. 결과를 표시한다.

연결 해제 전 확인해야 할 것:

- 이 provider가 유일한 로그인 수단인지
- 해제 후 로그인 가능한 다른 provider가 있는지
- 알림 연락처/휴대폰 인증과 혼동하지 않도록 안내
- 업무기록은 삭제되지 않음
- `person_id`는 삭제되지 않음
- `linked_auth_users`만 비활성/해제 후보

처리 원칙:

- 마지막 로그인 수단은 해제하지 않는다.
- 대표 로그인 계정 해제는 별도 대표 계정 변경 후 허용한다.
- 연결 해제는 기록 삭제가 아니다.
- 연결 해제는 알림 연락처 삭제가 아니다.
- 연결 해제는 수신 동의 철회가 아니다.

## 13. Unlink confirmation copy

일반 해제 확인 문구:

```text
카카오 계정 연결을 해제할까요?

해제하면 카카오 로그인으로는 이 PASSMAP 계정에 접속할 수 없습니다.
하지만 기존 업무기록, 알림 규칙, 알림 연락처, 수신 동의 이력은 삭제되지 않습니다.

다른 로그인 수단이 남아 있는지 확인한 뒤 진행하세요.
```

버튼:

- `연결 해제`
- `취소`

유일한 로그인 수단인 경우:

```text
이 계정은 현재 유일한 로그인 수단입니다.
연결을 해제하기 전에 다른 로그인 수단을 먼저 연결해야 합니다.
```

버튼:

- `다른 로그인 수단 연결하기`
- `취소`

해제 성공 문구:

```text
카카오 계정 연결이 해제되었습니다.
기존 PASSMAP 기록은 삭제되지 않으며, 남아 있는 연결 계정으로 계속 관리할 수 있습니다.
```

## 14. Account linking vs contact verification

계정 연결:

- Google/Kakao/Naver 로그인 계정을 같은 `person_id`에 연결한다.
- 로그인 수단과 계정 소유권에 영향을 준다.
- `linked_auth_users` 대상이다.

연락처 인증:

- 휴대폰 번호, 이메일, 브라우저를 알림 수신 대상으로 인증한다.
- 알림 채널 사용 가능 여부에 영향을 준다.
- `notification_contacts` 대상이다.

주의 문구:

```text
카카오 계정 연결과 카카오 알림톡 수신 동의는 같은 일이 아닙니다.
카카오 로그인을 연결해도 카카오 알림톡 발송을 위해서는 휴대폰 번호 인증과 수신 동의가 별도로 필요합니다.
```

```text
이메일 확인은 알림 이메일을 받을 수 있는지 확인하는 절차입니다.
Google/Naver 로그인 계정 연결과는 별도입니다.
```

## 15. Account linking vs consent

계정 연결은 로그인 수단을 추가하는 것이다. 수신 동의는 특정 목적 또는 채널로 알림을 받는 것이다.

예시:

- 네이버 계정을 연결해도 Email 알림 수신 동의가 자동으로 켜지지 않는다.
- 카카오 계정을 연결해도 Kakao 알림톡 수신 동의가 자동으로 켜지지 않는다.
- 휴대폰 번호를 인증해도 SMS fallback 수신 동의가 자동으로 켜지지 않는다.
- 마케팅 수신 동의는 계정 연결과 별도다.
- 컨설팅 연결 동의는 계정 연결과 별도다.

사용자 문구:

```text
계정 연결은 같은 PASSMAP 계정으로 로그인할 수 있는 수단을 추가하는 기능입니다.
알림을 받으려면 연락처 인증과 수신 동의가 별도로 필요합니다.
```

## 16. Data handling principles

- `provider_email`은 참고 정보이며 자동 병합 기준이 아니다.
- `provider_phone`도 자동 병합 기준이 아니다.
- `linked_auth_users` 이력은 감사 가능해야 한다.
- 연결/해제 시각 기록이 필요하다.
- 연결 주체와 `source` 기록이 필요하다.
- 자동 병합은 금지한다.
- 기존 데이터 소유권 자동 이전은 금지한다.
- 연결 해제는 기록 삭제가 아니다.
- `person` 삭제/계정 삭제는 별도 정책이다.
- 고객지원 수동 병합은 별도 Protected 프로세스다.
- 결제/과금 정보는 별도 정책이 필요하다.
- 컨설팅 연결 동의는 별도 동의다.
- 마케팅 수신 동의는 별도 동의다.

## 17. Security and abuse considerations

- 세션 탈취 상태에서 공격자가 자기 provider 계정을 피해자의 `person_id`에 연결할 위험이 있다.
- 계정 연결과 연결 해제는 민감 작업으로 간주한다.
- 연결 전 재인증 필요 여부를 구현 전에 별도 검토한다.
- 연결/해제 시 이메일 또는 서비스 알림 발송 후보를 검토한다.
- 이미 다른 `person_id`에 연결된 계정은 악용 방지를 위해 자동 병합하지 않는다.
- OAuth `state` 검증이 필요하다.
- CSRF 방지가 필요하다.
- 연결 시도 rate limit이 필요하다.
- 연결, 실패, 충돌, 해제 시도에 대한 감사 로그가 필요하다.
- 고객지원 수동 병합 시 본인 확인 증빙이 필요하다.
- provider OAuth 성공만으로 연결을 완료하지 않는다.
- 같은 이메일/전화번호 감지는 사용자 안내와 위험 표시 용도이며 연결 근거가 아니다.

## 18. State matrix

| State | User copy | Buttons | Internal handling | Auto merge |
| --- | --- | --- | --- | --- |
| `provider_not_connected` | 아직 연결되지 않은 provider 계정입니다. | `계정 연결` | 연결 시작 가능 상태로 표시한다. | No |
| `provider_connected` | 이 provider로 로그인해도 같은 PASSMAP 기록을 사용할 수 있습니다. | `연결 해제 안내 보기` | 현재 `person_id`에 연결된 상태로 표시한다. | No |
| `provider_linking_in_progress` | provider 계정 확인을 진행 중입니다. | `취소` | OAuth in-flight 상태로 처리한다. | No |
| `provider_oauth_cancelled` | 계정 연결이 취소되었습니다. | `다시 시도`, `취소` | 연결 레코드를 만들지 않는다. | No |
| `provider_oauth_failed` | provider 계정을 확인하지 못했습니다. | `다시 시도`, `취소` | 실패 상태로 표시하고 재시도 가능하게 한다. | No |
| `provider_already_linked_current_person` | 이 provider 계정은 이미 현재 PASSMAP 계정에 연결되어 있습니다. | `연결된 계정 보기` | idempotent 상태로 처리한다. | No |
| `provider_already_linked_other_person` | 이 provider 계정은 다른 PASSMAP 계정에 연결되어 있습니다. | `다른 계정으로 시도하기`, `고객지원 문의`, `취소` | 충돌 상태로 처리하고 고객지원/수동 확인으로 보낸다. | No |
| `provider_same_email_detected` | 같은 이메일을 사용하는 계정이 있을 수 있습니다. | `계속 진행`, `취소` | 참고 정보로만 표시한다. | No |
| `provider_same_phone_detected` | 같은 전화번호를 사용하는 계정이 있을 수 있습니다. | `계속 진행`, `취소` | 참고 정보로만 표시한다. | No |
| `unlink_blocked_only_login_method` | 이 계정은 현재 유일한 로그인 수단입니다. | `다른 로그인 수단 연결하기`, `취소` | 해제를 차단한다. | No |
| `unlink_success` | 계정 연결이 해제되었습니다. 기존 기록은 삭제되지 않습니다. | `연결된 계정 보기` | 연결 레코드를 비활성/해제 상태로 처리한다. | No |
| `provider_not_configured` | 아직 이 provider 연결을 사용할 수 없습니다. | `확인` | provider 설정 미완료 상태로 표시한다. | No |

## 19. Guardrails

이번 작업에서 절대 금지:

- Auth provider 설정 변경 금지
- Supabase Auth 설정 변경 금지
- OAuth redirect URI 변경 금지
- 계정 연결 구현 금지
- 계정 연결 해제 구현 금지
- React/UI 구현 금지
- `src/App.jsx` 수정 금지
- `src/**` 수정 금지
- Supabase SQL 작성/수정 금지
- draft SQL 수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- 고객지원 수동 병합 수행 금지
- provider 계정 병합 금지
- 자동 병합 로직 구현 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- 현재 dirty 상태의 `src/App.jsx` 또는 임시/QA 산출물 정리/삭제/수정 금지

허용 파일:

- `docs/person-account-linking-ux-20260531.md`

금지 파일:

- `src/App.jsx`
- `src/**`
- `supabase/**`
- `package.json`
- `package-lock.json`
- `.env*`
- `.github/**`
- vercel 설정 파일
- 기존 auth/reminder production 코드
- 현재 dirty/untracked 파일 전체

## 20. Next actions

21. PR 리뷰 후 문서 merge
22. 실제 구현 여부 별도 승인
23. account linking UI 구현 전 DB migration 승격 조건 재확인
24. Auth provider 설정 변경은 별도 Protected 승인 후 진행
25. person_id backfill / migration / RLS / live 연결은 별도 명시 승인 후 진행
