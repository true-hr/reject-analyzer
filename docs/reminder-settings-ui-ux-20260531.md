# PASSMAP Reminder Settings UI / UX Copy

## 1. Background

PASSMAP의 기존 Web Push 기반 알림은 발송 가능하지만, 알림 클릭 UX는 브라우저, OS, 기기 환경별로 불안정할 수 있다.

Web Push는 계속 보조 채널로 유지한다. 장기 운영 알림은 Kakao 알림톡, SMS fallback, Email, Web Push를 조합해 구성한다.

PR #691의 scheduler v2 문서 기준으로 알림 도메인은 rule, channel, contact, consent를 분리해서 이해해야 한다. 알림 규칙은 발송 시점과 반복 조건을 담당하고, 채널은 전달 수단을 담당하며, 연락처와 동의는 채널 사용 가능 여부를 결정한다.

아직 DB apply, Edge Function 구현, Kakao/SMS 연동은 하지 않는다. 이 문서는 알림 설정 화면의 UI 구조와 사용자-facing copy를 정의하는 문서다.

## 2. UX goals

- 사용자가 "내가 어떤 채널로 알림을 받을 수 있는지" 바로 이해한다.
- 사용자가 "알림 규칙을 여러 개 만들 수 있다"는 것을 이해한다.
- Kakao/SMS는 준비 중 또는 연결 필요 상태로 표현한다.
- 아직 제공되지 않는 기능을 마치 사용 가능한 것처럼 보이지 않게 한다.
- 서비스 알림과 마케팅 알림을 혼동하지 않게 한다.
- 계정 연결과 연락처 인증을 분리해서 이해시킨다.

## 3. Page structure

화면 제목:

알림 설정

### A. 내 알림 채널

- Web Push
- 카카오 알림톡
- SMS
- Email

### B. 알림 규칙

- 활성화된 규칙 목록
- 비활성화된 규칙 목록
- 알림 추가 버튼

### C. 계정/연락처 준비 상태

- 현재 로그인 계정
- 연결된 계정
- 휴대폰 인증 상태
- 이메일 확인 상태

### D. 동의/수신 설정

- 업무기록 리마인드 수신
- 카카오 알림톡 수신
- SMS fallback 수신
- Email 알림 수신
- 마케팅 수신 동의는 별도

## 4. Notification channel card copy

### Web Push

상태: 이 기기 등록됨

- 설명: 이 브라우저에서 PASSMAP 알림을 받을 수 있습니다.
- 보조 설명: 브라우저/기기 환경에 따라 알림 클릭 동작은 다를 수 있습니다.
- 버튼: 테스트 알림 보내기
- 버튼: 이 기기 알림 해제

상태: 이 기기 미등록

- 설명: 이 브라우저에서 알림을 받으려면 기기 알림을 등록해야 합니다.
- 버튼: 이 기기 알림 등록

### Kakao 알림톡

상태: 준비 중

- 설명: 카카오 알림톡은 사업자/템플릿/발신 프로필 준비 후 제공됩니다.
- 보조 설명: 현재는 실제 카카오톡 발송이 되지 않습니다.
- 버튼: 준비 중

상태: 연결 필요

- 설명: 카카오 알림톡을 받으려면 휴대폰 번호와 수신 동의가 필요합니다.
- 버튼: 휴대폰 번호 인증하기

### SMS

상태: 휴대폰 인증 필요

- 설명: 카카오 알림톡 실패 시 문자 fallback을 받을 수 있습니다.
- 보조 설명: SMS 수신 동의가 필요하며, 마케팅 문자는 별도 동의가 필요합니다.
- 버튼: 휴대폰 번호 인증하기

### Email

상태: 이메일 확인 필요

- 설명: 리마인드나 요약 알림을 이메일로 받을 수 있습니다.
- 버튼: 이메일 확인하기

## 5. Reminder rules list copy

섹션 제목:

알림 규칙

목록 예시:

```text
[ON] 매일 18:00 · 퇴근 전 업무기록 · Web Push
[ON] 매일 22:30 · 밤 회고 · 카카오 알림톡 / SMS fallback
[OFF] 매주 금요일 17:30 · 주간 정리 · Email
```

버튼:

- 알림 추가

빈 상태 문구:

```text
아직 등록된 알림 규칙이 없습니다.
업무를 놓치지 않도록 원하는 시간에 리마인드를 추가해보세요.
```

## 6. Add reminder modal / form copy

모달 제목:

알림 추가

필드:

- 알림 이름
- 빈도
- 요일
- 시간
- 채널
- fallback
- 활성화 여부

알림 이름 placeholder:

```text
예: 퇴근 전 업무기록
```

빈도 옵션:

- 매일
- 평일
- 매주
- 직접 요일 선택

요일 옵션:

- 월
- 화
- 수
- 목
- 금
- 토
- 일

시간 기본 예시:

```text
18:00
```

채널 옵션:

- Web Push
- 카카오 알림톡
- SMS
- Email

채널 상태별 disabled copy:

- 카카오 알림톡: 준비 중
- SMS: 휴대폰 인증 필요
- Email: 이메일 확인 필요
- Web Push: 이 기기 등록 필요

저장 버튼:

알림 저장

취소 버튼:

취소

## 7. Edit / delete / disable copy

수정:

알림 수정

비활성화:

```text
이 알림을 잠시 끌까요?
비활성화하면 설정은 유지되지만 알림은 발송되지 않습니다.
```

삭제:

```text
이 알림을 삭제할까요?
삭제한 알림 규칙은 복구할 수 없습니다.
```

버튼:

- 비활성화
- 다시 켜기
- 삭제
- 취소

## 8. Consent copy

업무기록 리마인드 수신 동의:

```text
PASSMAP이 설정한 시간에 업무기록 리마인드 알림을 보내는 것에 동의합니다.
```

카카오 알림톡 수신 동의:

```text
PASSMAP 서비스 이용과 관련된 알림을 카카오 알림톡으로 받는 것에 동의합니다.
```

SMS fallback 수신 동의:

```text
카카오 알림톡 발송이 실패하거나 중요한 서비스 알림이 필요한 경우 문자로 받는 것에 동의합니다.
```

Email 알림 수신 동의:

```text
PASSMAP 서비스 이용과 관련된 알림을 이메일로 받는 것에 동의합니다.
```

마케팅 수신 동의:

```text
혜택, 이벤트, 컨설팅 안내 등 마케팅 정보를 받는 것에 동의합니다.
```

주의:

마케팅 수신 동의는 서비스 알림 동의와 반드시 분리해서 표시한다. 업무기록 리마인드, 카카오 알림톡, SMS fallback, Email 알림 수신은 서비스 알림 동의로 취급하고, 혜택, 이벤트, 컨설팅 안내 등은 별도의 마케팅 수신 동의로 취급한다.

## 9. Account linking copy

현재 로그인:

```text
현재 Google 계정으로 로그인 중입니다.
```

설명:

```text
카카오/네이버 계정을 연결하면 같은 PASSMAP 계정에서 기록과 알림을 함께 관리할 수 있습니다.
```

버튼:

- 카카오 계정 연결
- 네이버 계정 연결
- 휴대폰 번호 인증

주의 문구:

```text
계정을 연결하면 연결된 계정에서 같은 PASSMAP 기록과 알림 설정을 사용할 수 있습니다.
사용자 동의 없이 이메일, 이름, 전화번호만으로 계정을 자동 병합하지 않습니다.
```

## 10. State matrix

| 상태 | 사용자에게 보여줄 문구 | 가능한 버튼 | 비활성화할 기능 | 내부적으로 필요한 조건 |
| --- | --- | --- | --- | --- |
| Web Push 등록됨 | 이 브라우저에서 PASSMAP 알림을 받을 수 있습니다. | 테스트 알림 보내기, 이 기기 알림 해제 | 없음 | 현재 브라우저의 push subscription 존재, 사용자 알림 권한 허용 |
| Web Push 미등록 | 이 브라우저에서 알림을 받으려면 기기 알림을 등록해야 합니다. | 이 기기 알림 등록 | Web Push 채널 선택 또는 저장 | notification permission 요청 가능, push subscription 없음 |
| Kakao 준비 중 | 카카오 알림톡은 사업자/템플릿/발신 프로필 준비 후 제공됩니다. | 준비 중 | 카카오 알림톡 채널 선택, 카카오 발송 테스트 | provider 계약, 템플릿 승인, 발신 프로필 준비 전 |
| Kakao 연결 필요 | 카카오 알림톡을 받으려면 휴대폰 번호와 수신 동의가 필요합니다. | 휴대폰 번호 인증하기 | 카카오 알림톡 채널 저장 | 휴대폰 인증 미완료 또는 카카오 알림톡 수신 동의 없음 |
| SMS 휴대폰 인증 필요 | 문자 fallback을 받으려면 휴대폰 번호 인증이 필요합니다. | 휴대폰 번호 인증하기 | SMS 채널 선택, SMS fallback 선택 | verified phone contact 없음 |
| SMS 수신 동의 없음 | 문자 fallback을 받으려면 SMS 수신 동의가 필요합니다. | SMS 수신 동의하기 | SMS fallback 저장 | verified phone contact 있음, SMS consent 없음 |
| Email 확인 필요 | 이메일 알림을 받으려면 이메일 확인이 필요합니다. | 이메일 확인하기 | Email 채널 선택 또는 저장 | verified email contact 없음 |
| 연락처는 있지만 동의 없음 | 연락처는 확인되었지만 알림 수신 동의가 필요합니다. | 수신 동의하기 | 해당 채널 발송, 해당 채널 규칙 활성화 | verified contact 있음, channel consent 없음 |
| 동의 철회됨 | 수신 동의가 철회되어 이 채널로는 알림을 보낼 수 없습니다. | 다시 동의하기 | 해당 채널 발송, 해당 채널 신규 규칙 저장 | consent revoked 상태 |
| 계정 연결 필요 | 다른 로그인 계정에서도 같은 기록과 알림을 사용하려면 계정 연결이 필요합니다. | 카카오 계정 연결, 네이버 계정 연결 | 연결 계정 기반 알림 관리 | 현재 provider identity만 존재, linked identity 없음 |
| person_id 준비 전 | 계정 통합 기준이 준비되기 전까지는 현재 로그인 계정 기준으로 알림을 관리합니다. | 없음 | 자동 계정 병합, cross-provider 알림 통합 | person_id 기반 identity mapping 미적용 |

## 11. Guardrails

이번 작업에서 절대 금지:

- React 컴포넌트 구현 금지
- UI 코드 수정 금지
- src/App.jsx 수정 금지
- CSS 수정 금지
- Supabase SQL 작성/수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
- Kakao/SMS adapter 구현 금지
- Kakao/SMS API 연동 금지
- 문자/SMS 발송 금지
- 카카오톡/알림톡 발송 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- 기존 weekly reminder 구조 삭제/수정/비활성화 금지
- 현재 dirty 상태의 src/App.jsx 또는 임시/QA 산출물 정리/삭제/수정 금지

## 12. Next actions

13. PR 리뷰 후 문서 merge
14. contact verification / consent withdrawal UX 문서화
15. Protected DB migration 승격 조건 리뷰
16. scheduler v2 dry-run Edge Function 구현 계획 수립
17. provider 비교 및 Kakao/SMS PoC 준비
18. 실제 DB apply / cron / live 발송은 별도 명시 승인 후 진행
