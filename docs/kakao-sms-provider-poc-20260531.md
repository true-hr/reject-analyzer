# PASSMAP Kakao/SMS Provider PoC Preparation

## 1. Background

Web Push는 PASSMAP 알림의 보조 채널로 유지한다. 운영 핵심 알림은 장기적으로 Kakao 알림톡 / SMS fallback / Email / Web Push 조합으로 구성한다.

Kakao/SMS는 API 키만 넣으면 되는 작업이 아니다. 사업자, 발신번호, 카카오 비즈 채널, 발신 프로필, 템플릿 승인, 전화번호 인증, 수신 동의, 개인정보 위탁 검토가 선행되어야 한다.

이번 문서는 실제 연동 전 PoC 준비 조건을 정리한다. provider SDK/API 설치, provider API 호출, env/secret 추가, Kakao/SMS 실제 발송, 인증번호 발송, Edge Function 구현, cron 변경, DB apply는 하지 않는다.

## 2. Provider candidates

### A. SOLAPI

- SMS: 지원 후보
- LMS/MMS: 지원 후보
- Kakao 알림톡: 지원 후보
- SMS fallback 가능 여부: Kakao 알림톡 실패 후 SMS fallback 흐름을 한 provider 안에서 PoC하기 좋은 후보
- Node/Deno/Edge Function 연동 가능성: HTTP API 중심으로 검토 가능. Edge Function 적합성은 인증 방식과 SDK 의존성을 별도 확인해야 함
- 필요한 사전 조건: 사업자 정보, 발신번호 등록, 카카오 비즈 채널/발신 프로필, 알림톡 템플릿 승인, API key 발급, 개인정보 위탁 검토
- 장점: SMS와 Kakao 알림톡을 함께 검토하기 쉬움, 공개 요금/문서 확인 경로가 비교적 명확함, 1차 PoC에서 fallback 흐름을 단순화하기 좋음
- 리스크: 실제 승인 조건과 비용은 계정/사업자 상태에 따라 달라질 수 있음, Edge Function 런타임에서 SDK 대신 HTTP API 사용이 필요할 수 있음, raw response 저장 정책을 별도 검토해야 함

### B. Naver Cloud SENS

- SMS: 지원 후보
- Kakao 알림톡: SENS Biz Message 영역에서 검토 후보
- 발신번호 등록: 필요
- 템플릿 검수: 필요
- 필요한 사전 조건: Naver Cloud 계정, 서비스 신청, 사업자/담당자 정보, 발신번호 등록, KakaoTalk Channel/Biz Message 설정, 템플릿 승인, API key/env 관리, 개인정보 위탁 검토
- 장점: 클라우드 콘솔과 API 문서 기반으로 운영 관리 가능, SMS와 Kakao Biz Message를 같은 클라우드 계정 체계에서 검토 가능
- 리스크: 초기 설정과 콘솔 권한/상품 설정이 SOLAPI보다 무거울 수 있음, 비용/승인 조건은 최신 공식 문서와 콘솔에서 재확인 필요, Edge Function 연동 시 인증 헤더 구현이 필요할 수 있음

### C. NHN Cloud

- KakaoTalk Bizmessage: 지원 후보
- SMS: 지원 후보
- 개인정보 처리 위수탁 고지 이슈: KakaoTalk Bizmessage 사용 시 개인정보 처리 위탁 고지 검토 필요
- 필요한 사전 조건: NHN Cloud 계정, Notification 서비스 설정, 사업자/발신번호/카카오 발신 프로필/템플릿 준비, 개인정보 처리 위탁 고지, API key/env 관리
- 장점: Notification 계열 서비스가 다양하고 SMS, Email, KakaoTalk Bizmessage를 함께 검토 가능
- 리스크: 개인정보 처리 위탁 고지와 운영 정책 검토 부담이 있음, PASSMAP의 단순 PoC에는 초기 설정이 무거울 수 있음, 비용/승인 기간은 최신 공식 문서와 콘솔에서 확인 필요

### D. 기타 후보

- 알리고 등 국내 SMS/Kakao provider는 보조 후보로 검토할 수 있다.
- 검토 항목은 Kakao 알림톡 지원, SMS fallback 지원, 발신번호 등록, 템플릿 승인, API 문서 명확성, 개인정보 위탁 고지, 비용 구조다.
- 이번 작업에서 외부 연동, provider 가입, API 호출은 하지 않는다.

## 3. Comparison matrix

| 비교 항목 | SOLAPI | Naver Cloud SENS | NHN Cloud | 기타 후보 |
| --- | --- | --- | --- | --- |
| Kakao 알림톡 지원 | 지원 후보 | 지원 후보 | 지원 후보 | 후보별 확인 필요 |
| SMS 지원 | 지원 후보 | 지원 후보 | 지원 후보 | 후보별 확인 필요 |
| SMS fallback 지원 | 한 provider 내 PoC 후보 | 구현 가능성 검토 필요 | 구현 가능성 검토 필요 | 후보별 확인 필요 |
| Node/Deno/Edge Function 적합성 | HTTP API 기준 적합성 높음, SDK 의존성은 회피 가능 | HTTP API 인증 구현 검토 필요 | HTTP API 인증 구현 검토 필요 | 후보별 확인 필요 |
| 사업자등록 필요 여부 | 필요 후보 | 필요 후보 | 필요 후보 | 대부분 필요 후보 |
| 발신번호 등록 필요 여부 | 필요 | 필요 | 필요 | 대부분 필요 |
| 카카오 비즈 채널/발신 프로필 필요 여부 | 필요 | 필요 | 필요 | 대부분 필요 |
| 템플릿 승인 필요 여부 | 필요 | 필요 | 필요 | 대부분 필요 |
| 예상 승인 기간 | provider/템플릿별 변동, PoC 전 재확인 | provider/템플릿별 변동, PoC 전 재확인 | provider/템플릿별 변동, PoC 전 재확인 | 후보별 확인 필요 |
| 건당 비용 | 최신 공개 요금표 확인 필요 | 최신 공개 요금표/콘솔 확인 필요 | 최신 공개 요금표/콘솔 확인 필요 | 후보별 확인 필요 |
| 초기 비용/월 비용 | 최신 공개 요금표 확인 필요 | 최신 공개 요금표/콘솔 확인 필요 | 최신 공개 요금표/콘솔 확인 필요 | 후보별 확인 필요 |
| API 문서 명확성 | 1차 PoC 후보로 충분히 검토 가능 | 공식 가이드 기반 검토 가능 | 공식 가이드 기반 검토 가능 | 후보별 편차 큼 |
| 개인정보 처리 위탁 고지 필요성 | 검토 필요 | 검토 필요 | 명시 검토 필요 | 후보별 확인 필요 |
| PASSMAP PoC 적합도 | 1차 추천 후보 | 보류 후보 | 보류 후보 | 보조 후보 |

비용, 승인 기간, 제공 범위는 변경될 수 있으므로 실제 PoC 승인 전 공식 pricing/console/계약 조건으로 재확인한다.

## 4. MVP recommendation

추천:

1차 PoC 후보는 SOLAPI로 둔다.

이유:

- SMS와 Kakao 알림톡을 한 provider에서 비교적 단순하게 검토 가능
- SMS fallback 흐름을 PoC하기 좋음
- 기존 조사에서 비용/요건이 비교적 명확함
- 초기 PASSMAP PoC에서는 provider 비교보다 contact/consent/fallback ledger 검증이 더 중요함

확정:

SOLAPI를 최종 provider로 확정하지 않는다. 최종 provider 확정은 사업자, 발신번호, 템플릿, 비용, 개인정보 위탁, 운영 로그 정책 검토 후 결정한다.

## 5. PoC scope

### Phase 0: docs only

- 현재 단계
- 외부 연동 없음
- 발송 없음

### Phase 1: provider account readiness

- 사업자등록/비즈 채널/발신번호/템플릿 준비 여부 확인
- provider 계정 생성 여부 검토
- 아직 API 호출 없음

### Phase 2: local mock adapter

- provider 호출 없이 interface만 정의
- 실제 발송 없음
- env 없음

### Phase 3: dry-run Edge Function

- provider 호출 없음
- wouldSend / wouldFallback 기록
- DB도 실제 apply 전이면 mock data 기준

### Phase 4: sandbox or approved test send

- 별도 명시 승인 후
- 인증된 테스트 번호 1개만
- 광고성 메시지 금지
- 결과 기록

### Phase 5: limited live PoC

- 별도 명시 승인 후
- 실제 사용자 대상 아님
- 내부 테스트 계정만
- fallback 검증

## 6. Required business/legal readiness

- 사업자등록 여부
- 카카오 비즈니스 채널
- 발신 프로필
- 알림톡 템플릿 작성
- 알림톡 템플릿 승인
- 발신번호 등록
- 휴대폰 번호 인증 UX
- 카카오 알림톡 수신 동의
- SMS 수신 동의
- SMS fallback 수신 동의
- 마케팅 동의 별도 분리
- 광고성 메시지 가능성 검토
- 080 수신거부 필요 여부 검토
- 개인정보 처리 위탁 고지 검토
- provider raw response 저장 정책

## 7. Message type policy

### 정보성 메시지

- 업무기록 리마인드
- 사용자가 설정한 알림 규칙
- 계정/보안/서비스 이용 관련 안내
- 알림톡 후보

### 광고성/마케팅 메시지

- 이벤트
- 혜택
- 컨설팅 홍보
- 유료 전환 유도
- 별도 마케팅 동의 필요
- 080 수신거부 검토 필요

주의:

- 업무기록 리마인드에 마케팅 문구를 섞지 않는다.
- 컨설팅 연결 안내는 service notification과 분리한다.

## 8. Template preparation

### 템플릿 후보 1: 업무기록 리마인드

제목:

```text
PASSMAP 업무기록 리마인드
```

본문 예시:

```text
오늘의 업무를 PASSMAP에 기록할 시간입니다.
짧게 남겨도 나중에 이력서와 경력기술서의 재료가 됩니다.
```

버튼:

```text
오늘 기록하기
```

### 템플릿 후보 2: 밤 회고 리마인드

제목:

```text
PASSMAP 오늘 회고 알림
```

본문 예시:

```text
오늘 처리한 업무를 간단히 정리해보세요.
작은 기록이 커리어 자산으로 쌓입니다.
```

버튼:

```text
오늘 기록하기
```

### 템플릿 후보 3: 주간 정리 리마인드

제목:

```text
PASSMAP 주간 업무 정리
```

본문 예시:

```text
이번 주 업무를 정리할 시간입니다.
반복된 성과와 역량을 PASSMAP에서 확인해보세요.
```

버튼:

```text
주간 기록 보기
```

주의:

- 템플릿 문구는 정보성 메시지로 유지한다.
- 이벤트/할인/컨설팅 홍보 문구를 넣지 않는다.
- 실제 템플릿 등록은 이번 작업에서 하지 않는다.

## 9. Fallback policy draft

- Kakao provider failure일 때만 SMS fallback 후보
- Kakao contact missing은 provider failure가 아님
- Kakao consent missing은 provider failure가 아님
- SMS fallback은 sms_fallback 동의가 있을 때만 가능
- SMS fallback contact는 verified phone이어야 함
- fallback도 delivery ledger에 별도 기록
- 중복 fallback 방지 필요
- fallback 실패 시 재시도 정책은 별도 승인 후 확정

## 10. Provider response / logging policy

- messageId 정도는 저장 후보
- raw response 전체 저장은 privacy/log policy 승인 전까지 보류
- 전화번호는 로그에 평문 저장 금지
- 템플릿 변수에 개인정보 최소화
- 실패 사유는 사용자 표시용/운영 로그용을 분리
- result_json에는 rawStored=false 기본
- 운영 로그 보존 기간은 별도 검토

## 11. Environment and secret policy

- provider API key는 env로만 관리
- GitHub에 secret hardcoding 금지
- Vercel/Supabase env 변경은 별도 승인
- 로컬 .env 수정 금지
- 이번 작업에서 env 추가 금지
- provider key 발급/복사/붙여넣기 금지
- secret rotation 정책은 별도 문서 후보

## 12. PoC acceptance criteria

문서 단계 성공 기준:

- provider 후보 비교 완료
- 1차 후보와 보류 후보 구분
- 필요한 사업/법무/동의/개인정보 준비사항 정리
- 템플릿 후보 정리
- fallback 정책 초안 정리
- env/secret/provider response 정책 정리

미래 dry-run PoC 성공 기준:

- 실제 발송 없이 wouldSend 기록
- fallbackWouldRun 기록
- contact/consent missing skip 기록
- result_json 구조 검증

미래 approved test send 성공 기준:

- 승인된 내부 테스트 번호 1개에만 발송
- 템플릿 기반 발송
- SMS fallback 별도 승인
- 발송 결과 ledger 기록
- 오발송 없음

## 13. Guardrails

이번 작업에서 절대 금지:

- provider 계정 생성 금지
- provider API 호출 금지
- provider SDK 설치 금지
- env/secret 추가 금지
- API key 발급/복사/저장 금지
- Kakao/SMS adapter 구현 금지
- Edge Function 구현 금지
- Edge Function deploy 금지
- 인증번호 발송 구현 금지
- 인증번호 실제 발송 금지
- 문자/SMS 발송 금지
- 카카오톡/알림톡 발송 금지
- 이메일 발송 구현 금지
- 이메일 실제 발송 금지
- Supabase SQL 작성/수정 금지
- Supabase SQL Editor 실행 금지
- Supabase CLI db push/apply 금지
- remote DB apply 금지
- 기존 데이터 backfill 금지
- cron 변경 금지
- Vercel/Supabase deploy 금지
- production 설정 변경 금지
- React/UI 구현 금지
- src/App.jsx 수정 금지
- 현재 dirty 상태의 src/App.jsx 또는 임시/QA 산출물 정리/삭제/수정 금지

## 14. Next actions

15. PR 리뷰 후 문서 merge
16. person_id account-linking UX 상세 문서 보강 여부 확인
17. scheduler v2 dry-run Edge Function 구현 계획 수립
18. provider 계정/사업자/템플릿 준비는 별도 승인 후 진행
19. 실제 env/secret/provider 연동/발송은 별도 명시 승인 후 진행

## References checked

- SOLAPI pricing: https://www.solapi.com/pricing/
- SOLAPI pricing API reference: https://solapi.com/developers/api/pricing-getMessagePricing
- Naver Cloud SENS overview: https://guide.ncloud-docs.com/docs/en/sens-overview
- Naver Cloud SENS Biz Message guide: https://guide.ncloud-docs.com/docs/en/sens-bizmessage
- NHN Cloud Notification pricing: https://www.nhncloud.com/kr/pricing/m-content?c=Notification&s=SMS
- NHN Cloud KakaoTalk Bizmessage overview: https://docs.nhncloud.com/ko/Notification/KakaoTalk%20Bizmessage/ko/Overview/
