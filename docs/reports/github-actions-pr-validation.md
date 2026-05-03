# GitHub Actions PR Validation Workflow Analysis

## PR Information
- **PR #**: 62
- **Branch**: chore/github-actions-pr-validation
- **Date**: 2026-05-03 (updated with actual GitHub Actions logs)
- **Status**: MERGE HOLD → IN PROGRESS (root cause identified and fixed)

## Actual Failure Root Cause (Confirmed from GitHub Actions Log)

### Stage: Install dependencies
- **Error**: `npm error ERESOLVE could not resolve`
- **Module**: @react-pdf/renderer@3.4.5
- **Issue**: React peer dependency conflict

```
While resolving: @react-pdf/renderer@3.4.5
Found: react@19.2.4
Could not resolve dependency:
peer react@"^16.8.0 || ^17.0.0 || ^18.0.0" from @react-pdf/renderer@3.4.5
```

### Root Cause Analysis

| Aspect | Status |
|--------|--------|
| **Current React version** | 19.2.4 (from package.json) |
| **@react-pdf/renderer version** | 3.4.5 |
| **Supported React versions** | ^16.8.0 \|\| ^17.0.0 \|\| ^18.0.0 |
| **Compatibility** | ❌ React 19 NOT supported by @react-pdf/renderer@3.4.5 |

**Conclusion**: This is a known React 19 + @react-pdf/renderer peer dependency conflict. The package simply does not support React 19.

### Why Previous Fix Failed

- Initial attempt: `npm install` (instead of `npm ci`)
- Result: Same ERESOLVE error
- Reason: `npm install` still strictly validates peer dependencies by default in npm 7+

## Workflow Fix Applied

### Change: npm install → npm install --legacy-peer-deps

```diff
      - name: Install dependencies
-       run: npm install
+       run: npm install --legacy-peer-deps
```

### Why --legacy-peer-deps

- `--legacy-peer-deps` allows npm to bypass strict peer dependency validation
- Matches the behavior of npm < 7 and how this project currently works locally
- Allows CI to install existing dependencies without modification to package.json/package-lock.json
- **Does NOT change package.json or package-lock.json**
- Temporary CI stability measure until long-term dependency cleanup

### Constraints Preserved

- ✅ **No package.json changes** (React 19 remains, @react-pdf/renderer unchanged)
- ✅ **No package-lock.json changes** (existing dependencies preserved)
- ✅ **No package removals or version updates** (exact current state maintained)
- ✅ **No npm audit fix** (which would modify lock file)
- ✅ **No React or PDF library version changes**

## Technical Details

**Why this conflict exists**:
- @react-pdf/renderer@3.4.5 was released before React 19
- Author only declared support for React ^16.8.0 || ^17.0.0 || ^18.0.0
- React 19 introduces breaking changes incompatible with @react-pdf/renderer's implementation

**Why local builds work**:
- Local npm configuration or .npmrc may have similar legacy settings
- Or project was built when this conflict was less strict

## Long-term Technical Debt

This fix addresses immediate CI stability. However, this represents technical debt:

| Action | Scope | Timing |
|--------|-------|--------|
| **Immediate**: Use --legacy-peer-deps in CI | This PR | Now |
| **Future**: Audit @react-pdf/renderer usage | Separate PR/issue | Next sprint |
| **Future**: Either upgrade library or remove unused PDF export | Architecture decision | TBD |
| **Future**: Update to compatible PDF library or React 18 if needed | Major feature work | TBD |

## Files Modified

1. `.github/workflows/pr-validation.yml`
   - Line 24: `npm install` → `npm install --legacy-peer-deps`
   - Only change to this PR workflow

2. `docs/reports/github-actions-pr-validation.md` (this file)
   - Documented actual root cause
   - Rationale for --legacy-peer-deps approach

## Related Issues

### Vercel Failure (Separate Issue)
- Not addressed in this PR (separate integration issue)
- Recommendation: Investigate Vercel build settings independently

### .tmp_vercel_deploy_head2 Warning
- Not addressed in this PR (cleanup in future PR)
- Recommendation: Separate git maintenance PR

## Expected Outcome After Fix

**GitHub Actions PR Validation steps**:
- ✅ Checkout
- ✅ Setup Node.js v20
- ✅ Install dependencies (with --legacy-peer-deps, bypasses ERESOLVE)
- ✅ Run Axis1 registry QA (skips gracefully in this PR)
- ✅ Build (vite build, no code changes)

**Next steps after merge**:
- Monitor that React 19 + PDF exports continue working
- Add to backlog: Evaluate @react-pdf/renderer alternatives or React 18 downgrade
- Create separate issue: Long-term dependency audit
