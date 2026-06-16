# Kakao Alimtalk contact model and RPC split plan

This document fixes the baseline model for Kakao Alimtalk contact, consent, capability, and readiness before any DB/RPC split implementation. It is documentation only. It does not create migrations, query production data, call provider APIs, send live messages, or change frontend behavior.

## 1. Terms

### Kakao identity

- Kakao OAuth/login identity.
- Stored through the `account_identities` model.
- Means "Kakao account connected."
- Does not mean Kakao Alimtalk can be received.

### Kakao Alimtalk contact

- A real receiving contact that can receive Kakao Alimtalk.
- It is not a placeholder.
- An operational contact must be one of the following:
  - Verified phone contact:
    - A user-verified mobile phone number.
    - Initial MVP basis.
  - Provider recipient key/contact key:
    - A real receiving identifier issued or mapped by a Kakao/Bizmessage provider.
    - Basis after actual provider integration.

### Kakao Alimtalk consent

- A separate state showing that the user agreed to receive Kakao Alimtalk.
- Separate from Kakao identity.
- Separate from contact.

### Kakao Alimtalk capability

- Provider/template/sender key/API operational readiness.
- Before capability is ready, the product must not display Kakao Alimtalk as send-ready.

## 2. Absolute Principles

- Kakao login is not Alimtalk consent.
- Kakao identity active is not Alimtalk contact active.
- Consent granted is not contact active.
- Contact active is not consent granted.
- Without capability ready, `send_eligibility` remains `not_ready`.
- Placeholder destinations must not be stored as active contact.
- Values such as `kakao_alimtalk:pending` are not operational contacts.
- Kakao Alimtalk contact must not become active without a phone basis or a provider recipient key/contact key basis.
- SMS fallback phone and Kakao Alimtalk contact must not be confused in UI or DB semantics.
- Capability must not be promoted to ready before actual provider/API/template integration.

## 3. Current Problem Summary

### `upsert_current_person_kakao_alimtalk_consent(...)`

- Can create an active Kakao Alimtalk contact without phone/contact input.
- Stores contact and consent in one call.
- Keeps the active contact upsert flow even when the consent status is revoked.
- Has no provider recipient key/contact key input.

### `upsert_current_person_contact_consent(...)`

- DB/RPC level still accepts the `kakao_alimtalk` channel.
- Has no active Kakao identity guard.
- Stores contact and consent in one call.

### `get_current_person_notification_summary()`

- Checks only whether Kakao contact is active.
- Does not distinguish placeholder, verified phone, or provider recipient key/contact key.
- Does not include a contact verification gate in readiness.
- Has a capability gate, but it is separate from a contact verification gate.

## 4. Target State

Kakao Alimtalk send readiness must expand from the current four-condition model to a five-condition model.

Current four conditions:

1. identity active
2. contact active
3. consent granted
4. capability ready

Improved five conditions:

1. active Kakao identity
2. verified Kakao Alimtalk contact basis
   - verified phone, or
   - provider recipient key/contact key
3. granted Kakao Alimtalk reminder consent
4. provider/channel capability ready
5. no blocked/revoked state

`send_eligibility` can be ready only when all five conditions are satisfied.

## 5. Recommended DB/RPC Split Direction

### A. Contact write RPC

Goal:

- Store/verify contact only.
- Do not automatically grant consent.

Candidate names:

- `upsert_current_person_phone_contact(...)`
- `verify_current_person_phone_contact(...)`
- Or a separate RPC that uses the existing contact verification structure.

Requirements:

- A phone contact must have `contact_verifications.status = 'verified'` or an equivalent verified state before it can be accepted as a Kakao contact basis.
- Before phone verification, Kakao Alimtalk contact is not ready.

### B. Kakao provider recipient key RPC

Goal:

- Store a real Kakao/Bizmessage recipient key or contact key after provider integration.
- Do not store placeholders.

Candidate name:

- `upsert_current_person_kakao_alimtalk_recipient(...)`

Requirements:

- Provider/source/provenance must be distinguishable through metadata or a separate column.
- Without a real provider mapping, the recipient must not be treated as ready.

### C. Consent write RPC

Goal:

- Store consent only.
- Do not automatically create contact.

Candidate names:

- `upsert_current_person_notification_consent(...)`
- `upsert_current_person_kakao_alimtalk_reminder_consent(...)`

Requirements:

- Must support both granted and revoked.
- Consent may be stored without contact.
- Consent without contact must not make `send_eligibility` ready.

### D. Summary RPC

Goal:

- Provide summary fields that distinguish placeholder, contact verification, and provider recipient basis.

Required output candidates:

- `kakao.identity`
- `kakao.contact`
- `kakao.contact_basis`
  - `missing`
  - `verified_phone`
  - `provider_recipient`
  - `placeholder`
  - `unknown`
- `kakao.contact_verified`
  - boolean or status
- `kakao.consent`
- `kakao.capability`
- `kakao.send_eligibility`

Requirements:

- Placeholder is excluded from send-ready conditions.
- Only verified phone or provider recipient key/contact key can count as contact-ready basis.
- If contact is missing, placeholder, or unverified, `send_eligibility` remains `not_ready`.

## 6. UI Principles

- "Kakao account connected" and "Alimtalk receiving readiness" are separate.
- "Consent required" and "Contact verification required" are separate.
- "Send ready" is shown only when the five readiness conditions are satisfied.
- If capability is missing, show that the Alimtalk sending feature is still being prepared.
- If phone is not verified, show that mobile phone verification is required.
- If provider recipient key is not connected, show that the Alimtalk receiving identifier is not prepared.
- SMS fallback is presented only as a secondary channel.
- Do not add scattered debug, recovery, consent, and contact controls to the settings screen.

## 7. Step Order

### Step 1. Documentation PR

- Document the Kakao contact model and RPC split baseline.
- This PR.

### Step 2. DB/RPC split preflight

- Read-only check of differences between current schema/RPC and the new split baseline.
- No production apply.

### Step 3. DB/RPC split migration PR

- Split contact write and consent write.
- Remove or deprecate placeholder Kakao contact active creation paths.
- Add `contact_basis` and `contact_verified` to summary.
- Keep the capability ready condition.

### Step 4. Migration apply preflight + explicit approval

- Run read-only preflight before production DB apply.
- Apply only after explicit approval.

### Step 5. Guarded UI PR

- Connect UI only after summary provides `contact_basis`.
- Show phone verification, contact confirmation, and consent separately.
- Do not show send-ready while provider capability is not ready.

### Step 6. Provider/API dry-run

- Kakao/SMS provider integration is separate and requires provider review, contract checks, and template approval.
- Live sending requires a capability promotion checklist.

## 8. Prohibited Actions

- Do not store placeholder Kakao contact as active.
- Do not grant contact and consent through one button.
- Do not grant consent from Kakao account linking alone.
- Do not seed capability rows or promote capability to ready before provider readiness.
- Do not show sending as available before provider integration.
- Do not query raw base tables directly from frontend.
- Do not add authenticated direct base table policies.
- Do not send live Kakao/SMS/Push messages.
- Do not document raw identifiers or secrets.
