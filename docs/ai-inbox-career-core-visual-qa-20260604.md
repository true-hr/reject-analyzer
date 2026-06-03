# AI Inbox Career Core read-only visual QA - 2026-06-04

## 1. QA purpose

Verify the main-merged AI Inbox card-level `Career Core v0 참고 신호` block on a real logged-in AI Inbox screen across desktop and mobile.

This QA batch is documentation-only. No feature, copy, layout, API, DB, Supabase, env, storage, sync, or deployment change was made.

## 2. Baseline

- Branch: `qa/ai-inbox-career-core-visual-qa-20260604`
- Main HEAD used: `ddc4e0ef`
- Relevant merged commits:
  - `181f8ca8` - Work Records adapter foundation
  - `c3b3d6af` - AI Inbox Career Core read-only signal

## 3. Test environment

- OS: Windows
- Workspace: `D:\passmap-worktrees\ai-inbox-career-core-visual-qa-20260604`
- Browser/session requirement: logged-in real AI Inbox data
- Automated checks run locally.

Environment limitation:

- No reusable logged-in browser session was found in the checked temporary Chrome profile.
- Existing Chrome was running, but no available CDP/debug session was confirmed for safe automated inspection.
- Therefore real logged-in desktop/mobile visual capture was not completed in this batch.

## 4. Desktop result

Status: `REVIEW`

Desktop logged-in AI Inbox visual QA was not completed because a logged-in browser session or user click/login step is required.

Checks still requiring manual confirmation:

- The `Career Core v0 참고 신호` block appears inside the card without becoming too prominent.
- The block is placed naturally below the existing tag row and above evidence preview.
- Visual hierarchy stays below title, resume bullet candidate, evidence, and action buttons.
- Archive/convert button placement and click flow remain unchanged.

## 5. Mobile result

Status: `REVIEW`

Mobile logged-in AI Inbox visual QA was not completed because a logged-in browser session or user click/login step is required.

Checks still requiring manual confirmation:

- Signal pills wrap without horizontal overflow.
- The card does not create horizontal page scroll.
- Action buttons remain reachable and visually stable.

## 6. Signal displayed card result

Status: `REVIEW`

Automated source QA confirms the UI block and copy exist. Real card rendering with actual AI Inbox data still requires manual confirmation.

Expected signs:

- A card with title/tag/evidence inputs can show `Career Core v0 참고 신호`.
- At most one role, one industry, and one strength hint are shown.
- No duration, month bucket, or relevant-month value is shown.

## 7. Signal hidden card result

Status: `REVIEW`

Automated source QA confirms the signal builder can return no renderable groups. Real logged-in confirmation is still required for cards without Career Core signal data.

Expected sign:

- Cards without role, industry, or strength signal groups should not render the Career Core block.

## 8. Copy result

Status: `PASS` for source/static verification.

Confirmed source strings:

- `Career Core v0 참고 신호`
- `저장된 후보의 직무/산업/강점 단서를 바탕으로 만든 참고 신호입니다.`
- `경력 기간이나 적합도 확정 판단이 아닙니다.`

Guardrail strings not present in the UI block:

- acceptance probability
- rejection cause
- final eligibility
- exact relevant experience
- relevant months

## 9. Overflow result

Status: `REVIEW`

Mobile browser overflow was not measured on a real logged-in AI Inbox card. This should be checked manually before closing visual QA.

## 10. Action button impact

Status: `REVIEW`

Static QA confirms the implementation does not alter archive/convert handlers. Real click-path visual confirmation still requires manual QA.

## 11. Screenshots

Screenshots were not generated in this batch because realistic capture requires a logged-in browser session with real AI Inbox data.

Expected screenshot paths for the manual QA follow-up:

- `screenshots/ai-inbox-career-core-readonly-desktop.png`
- `screenshots/ai-inbox-career-core-readonly-mobile.png`
- Optional: `screenshots/ai-inbox-career-core-readonly-empty-state.png`

## 12. Verification

Passed:

- `node scripts/qa-ai-inbox-career-core-readonly-ui.js`

Attempted:

- `npm run build`

Build result:

- `npm run build` failed in this QA worktree due to Windows page file / esbuild out-of-memory (`VirtualAlloc ... errno=1455`).
- This is an environment resource failure, not a functional assertion failure.

Dependency note:

- `npm ci --legacy-peer-deps` was run because the new worktree did not have `node_modules`.

## 13. Conclusion

Overall result: `REVIEW`

The source/static QA passed, but actual logged-in desktop/mobile visual QA remains incomplete because a reusable logged-in browser session was not available.

## 14. Follow-up patch / QA proposal

No patch should be made from this QA batch.

Recommended next QA action:

1. Open the app in a logged-in browser session.
2. Navigate to `/?view=ai-inbox#ai-inbox`.
3. Capture desktop at a normal wide viewport.
4. Capture mobile at a narrow viewport such as 390px width.
5. Confirm signal-present and signal-absent cards.
6. Save screenshots to the paths listed above.
7. If any layout/copy issue is found, create a separate follow-up patch PR.
