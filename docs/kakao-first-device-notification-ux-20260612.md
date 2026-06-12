# Kakao-first Device Notification UX

## 1. Status

PASS

## 2. Scope

- Reframed reminder notification UX around Kakao Alimtalk first.
- Reframed current Web Push surface as phone/device notification.
- Demoted SMS copy to fallback/emergency contact wording.
- Kept existing RPC and contact/consent write path unchanged.

## 3. Product direction

- Kakao: operating notification primary channel for important reminders and settings notices.
- Device notification: immediate secondary channel for the current browser/device, with room to grow into app notifications.
- Email: record-oriented secondary channel.
- SMS: fallback/emergency contact channel only, not the primary user experience.

## 4. UI changes

- channel order: Kakao Alimtalk, phone/device notification, email, SMS fallback.
- copy changes: Web Push-facing language now reads as phone/device notification in user-facing surfaces.
- fallback wording: SMS contact form is now `비상 연락처 / SMS fallback` with `보조 연락처 저장`.
- disabled/ready-state actions: Kakao stays in ready-state copy; no provider linking or sending was added.

## 5. Test/build result

- `git diff --check`: PASS
- `node src/lib/__tests__/schedulerV2NotificationSummaryRepository.test.js`: PASS
- `node src/lib/__tests__/schedulerV2ContactConsentRepository.test.js`: PASS
- `npm run build`: PASS with existing Vite warnings for import attributes, dynamic/static imports, and large chunks.
- raw base table query grep: PASS, no forbidden `.from('...')` client calls found.

## 6. Data access guardrail

- No database access was used.
- No scheduler v2 raw base table client query was added.
- Existing contact/consent RPC path remains unchanged.

## 7. What was not done

- no DB apply
- no production/staging access
- no SQL migration changes
- no env/secret changes
- no provider/live send
- no SMS send
- no Kakao send
- no Push send implementation
- no OAuth/account linking
- no account merge/backfill

## 8. Remaining gaps

- Kakao account linking and real Alimtalk send remain future work.
- Mobile app notification is represented in product copy only; no app push implementation was added.
- SMS remains wired to the existing contact/consent save path for fallback readiness.

## 9. Next recommended step

Define the Kakao account linking and Alimtalk consent UX state machine before implementing any provider integration.
