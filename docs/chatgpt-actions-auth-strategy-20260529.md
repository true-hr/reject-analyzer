# PASSMAP ChatGPT Actions Auth Strategy

## 1. Background

PASSMAP now has a first-pass ChatGPT Actions endpoint wrapper:

```text
POST /api/save-analysis-run?action=chatgpt_action_save_experience
```

The wrapper stores user-confirmed structured ChatGPT work experience candidates in PASSMAP AI Inbox. It creates career-record data for a specific PASSMAP user, so authentication is part of the product boundary, not an optional transport detail.

OpenAI GPT Actions support three authentication modes in the GPT editor: None, API Key, and OAuth. OAuth is the correct model when the action needs user account access. ChatGPT passes the authenticated user's token to action calls through the `Authorization` header. OAuth setup also requires client ID, client secret, authorization URL, token URL, scope, redirect URI handling, and the `state` parameter.

The save operation is a consequential POST action. The OpenAPI schema must keep `x-openai-isConsequential: true`, and the GPT user experience must keep explicit confirmation before calling PASSMAP.

References:

- OpenAI GPT Action authentication: https://platform.openai.com/docs/actions/authentication
- OpenAI GPT Actions production guidance: https://platform.openai.com/docs/actions/production
- OpenAI Help Center, configuring actions in GPTs: https://help.openai.com/en/articles/9442513-gpt-actions-domain-settings-chatgpt-enterprise

## 2. Current Implementation Status

Implemented:

- `chatgpt_action_save_experience` action branch exists in `/api/save-analysis-run`.
- The wrapper does not create an unauthenticated public write path.
- The wrapper uses the existing PASSMAP/Supabase Bearer token guard via `verifySupabaseAccessToken`.
- The wrapper stores structured candidates as `experience_cards.status = "accepted"`.
- Full raw conversation text is rejected and `raw_sources.raw_text` stays `null`.
- Saved rows use `metadata.importMethod = "chatgpt_action_save_experience"`.
- AI Inbox list and status-change guards allow `chatgpt_action_save_experience`.

Not implemented:

- OAuth authorization server flow.
- OAuth client registration.
- OAuth redirect URL registration.
- Token storage, refresh, revocation, and scope management.
- Vercel env or Supabase secret changes.
- GPT editor registration.
- Production smoke test from a real Custom GPT.

## 3. Authentication Options

### No Auth

No authentication means ChatGPT can call the endpoint without proving the PASSMAP user identity.

Pros:

- Lowest setup cost.
- Useful only for non-personal, read-only, or signed-out discovery actions.

Cons:

- Creates a public write path into PASSMAP career records.
- Cannot reliably bind saved cards to the correct PASSMAP user.
- Enables spam, abuse, and privacy failures.
- Conflicts with PASSMAP's rule that user career records must be user-scoped.

PASSMAP decision:

- Do not use No auth for `chatgpt_action_save_experience`.
- Treat unauthenticated save requests as invalid and return `401` or `403`.

### API Key / Action Token

API Key authentication lets the GPT editor attach a configured secret to action calls. A PASSMAP-specific Action token variant could also be implemented as an MVP if it maps a token to exactly one PASSMAP user.

Pros:

- Simpler than full OAuth.
- Can support internal smoke tests.
- Can protect the endpoint from anonymous public writes.
- Useful for a narrow administrator or internal test GPT.

Cons:

- Poor fit for broad multi-user consumer use.
- User-specific secret entry and rotation UX is awkward.
- Shared GPT or copied configuration can leak or misattribute writes.
- Requires token issuance, hashing, revocation, audit, and rate limits before any serious use.

PASSMAP decision:

- Allow only as an internal smoke-test or limited MVP bridge.
- Do not treat API Key / Action token as the production user auth model.
- If implemented, use a distinct Action token prefix and server-side user lookup.
- Store token hashes only; never store plaintext tokens.

### OAuth

OAuth lets each user sign in to PASSMAP from ChatGPT. ChatGPT then sends the user's token in the `Authorization` header on action requests.

Pros:

- Best fit for personalized PASSMAP saves.
- Derives `user_id` server-side from the token.
- Supports consent, revocation, expiry, refresh, and scoped access.
- Aligns with OpenAI's documented model for user-account actions.
- Avoids putting user IDs or long-lived private tokens into request bodies.

Cons:

- Requires Protected auth work.
- Requires OAuth client and redirect URL registration.
- Requires authorization/token endpoints and state validation.
- Requires env/secrets and production configuration.
- Requires GPT editor setup and E2E with a real GPT ID callback URL.

PASSMAP decision:

- OAuth is the production path for external users.
- Use a narrow initial scope such as `experience:write`.
- Keep the action consequential and require explicit user confirmation before save.

## 4. PASSMAP Risk Assessment

| Option | User identity | Write safety | Operational fit | PASSMAP risk | Decision |
| --- | --- | --- | --- | --- | --- |
| No auth | None | Unsafe | Simple but wrong | Critical | Reject |
| API Key / Action token | Possible but brittle | Limited | Internal-only | Medium to high | MVP only |
| OAuth | Strong per-user flow | Best | Requires Protected setup | Manageable | Production recommendation |

Key risks:

- Public write abuse if No auth is enabled.
- Cross-user career data contamination if identity is inferred from request body.
- Token leakage if API keys are reused or copied into GPT configurations.
- OAuth misconfiguration if redirect URLs, scopes, state, or token validation are rushed.
- User surprise if the GPT saves without explicit confirmation.

## 5. Short-Term MVP Recommendation

Keep the current Supabase Bearer token guard as the first wrapper safety baseline.

Allowed MVP use:

- Internal manual testing.
- Local or preview smoke where the tester intentionally provides a valid PASSMAP bearer token.
- Validation of request shape, raw text rejection, and AI Inbox visibility.

Not allowed for MVP:

- Public GPT Store or external-user rollout.
- Shared GPT configuration that writes with a single global token.
- Production smoke that requires env/secrets or GPT editor registration without explicit Protected approval.
- Any fallback to unauthenticated writes.

The MVP should prove:

- Missing token returns auth failure.
- Valid token saves only to the authenticated PASSMAP user.
- `raw_sources.raw_text` remains `null`.
- `experience_cards.status` remains `accepted`.
- AI Inbox and "confirm as resume material" flows still work.

## 6. Production Recommendation

Use OAuth for the official PASSMAP ChatGPT Actions integration.

Recommended production shape:

```text
ChatGPT Custom GPT
  -> User invokes PASSMAP save action
  -> ChatGPT prompts Sign in to PASSMAP when needed
  -> PASSMAP OAuth authorization flow validates state
  -> ChatGPT receives user token
  -> Action call sends Authorization header
  -> PASSMAP verifies token and derives user_id
  -> Endpoint validates structured candidate and stores accepted AI Inbox card
```

Production rules:

- Do not trust `user_id` from the request body.
- Use the bearer token to derive PASSMAP `user_id`.
- Keep `x-openai-isConsequential: true`.
- Keep user confirmation before save.
- Keep full raw conversation text out of request schema and storage.
- Return raw structured JSON from the API, not verbose natural-language responses.
- Keep request and response payloads below the OpenAI Actions size limit.
- Keep endpoint work inside the Actions timeout by doing only auth, validation, and inserts.

## 7. Protected Follow-Up Work

Separate these from ordinary documentation or wrapper patches:

- OAuth client registration.
- OAuth redirect URL registration.
- Authorization URL implementation.
- Token URL implementation.
- OAuth `state` parameter validation.
- Token storage, refresh, expiry, and revocation design.
- Vercel env additions or modifications.
- Supabase secret additions or modifications.
- Supabase schema, RLS, or auth policy changes.
- GPT editor Action registration.
- Real production endpoint smoke test from ChatGPT.
- Production deploy or redeploy.
- Authentication policy changes.

## 8. Next Implementation Steps

1. Keep the merged wrapper guarded by the current Supabase Bearer token check.
2. Add tests or smoke documentation for unauthenticated, invalid, and valid internal requests.
3. Decide whether an Action token MVP is still useful after internal bearer-token smoke.
4. Design the OAuth authorization and token endpoints in a separate Protected plan.
5. Define the initial OAuth scope, recommended value: `experience:write`.
6. Register OAuth client and redirect URLs only during the Protected OAuth phase.
7. Update the OpenAPI schema only when the final auth URLs and scopes are known.
8. Register the Action in the GPT editor only after OAuth and env/secrets are approved.
9. Run ChatGPT Actions E2E only after the protected setup is complete.

## 9. Completion Criteria

Internal MVP completion:

- The endpoint rejects unauthenticated writes.
- A valid PASSMAP Bearer token can save a structured candidate for the authenticated user.
- Raw transcript fields are rejected.
- `raw_sources.raw_text` remains `null`.
- AI Inbox displays the saved `chatgpt_action_save_experience` card.
- No production deploy, env, secret, OAuth, or GPT editor change is required.

Production completion:

- OAuth is implemented and reviewed as Protected work.
- OAuth state validation is enforced.
- ChatGPT OAuth callback URL is registered for the actual GPT ID.
- Action calls arrive with a user token in the `Authorization` header.
- PASSMAP derives `user_id` server-side from the token.
- GPT editor registration is complete.
- The save action remains consequential and user-confirmed.
- Production E2E confirms save to AI Inbox and later conversion flow.
