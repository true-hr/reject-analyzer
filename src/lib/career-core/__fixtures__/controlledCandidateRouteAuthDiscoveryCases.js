export const controlledCandidateRouteAuthDiscoveryCases = Object.freeze([
  {
    id: "route_surface_existing_api_found",
    input: {
      surface: "api/**",
      exists: true,
      usedForRuntime: true,
      evidenceFiles: ["api/save-analysis-run.js", "api/admin-analysis.js", "vercel.json"],
    },
    expected: {
      routeReady: true,
      requiresAuthDiscovery: true,
      shouldImplementNow: false,
      reason: "auth_ownership_and_guard_gates_still_required",
    },
  },
  {
    id: "route_surface_missing_public_api",
    input: {
      surface: "src/api/**",
      exists: false,
      usedForRuntime: false,
      evidenceFiles: [],
    },
    expected: {
      routeReady: false,
      shouldImplementNow: false,
      reason: "public_api_surface_missing_or_not_deployed",
    },
  },
  {
    id: "auth_helper_found",
    input: {
      helper: "api/_mcp_auth.js",
      helpers: ["readBearerToken", "getServiceRoleClient", "verifySupabaseAccessToken"],
      tokenVerification: "supabase.auth.getUser",
    },
    expected: {
      authReady: true,
      shouldImplementNow: false,
      reason: "route_and_guard_gates_still_required",
    },
  },
  {
    id: "auth_helper_missing",
    input: {
      helper: null,
      helpers: [],
      tokenVerification: null,
    },
    expected: {
      authReady: false,
      shouldImplementNow: false,
      reason: "auth_helper_missing",
    },
  },
  {
    id: "ownership_read_pattern_found",
    input: {
      pattern: "verified_user_id_select_filter",
      examples: [
        "api/save-analysis-run.js uses owner-scoped select filters",
        "supabase/functions/send-test-experience-recall-push/index.ts filters by user.id",
      ],
      writesAllowedForPreview: false,
    },
    expected: {
      ownershipReady: true,
      readOnlyOnly: true,
      shouldImplementNow: false,
      reason: "route_and_guard_gates_still_required",
    },
  },
  {
    id: "ownership_helper_missing_for_persisted_ids",
    input: {
      persistedIds: ["resumeProfileId", "workRecordIds"],
      dedicatedOwnershipHelperFound: false,
    },
    expected: {
      ownershipReady: false,
      requiresOwnershipHelper: true,
      shouldImplementNow: false,
      reason: "persisted_id_ownership_helper_missing",
    },
  },
  {
    id: "guard_blocks_route_surface",
    input: {
      surface: "route_file_surface",
      protectedByGuard: true,
      allowRuntimeCanPermitRoute: false,
    },
    expected: {
      guardReady: false,
      requiresGuardUpdate: true,
      shouldImplementNow: false,
      reason: "changed_file_guard_blocks_route_surface",
    },
  },
  {
    id: "ready_for_public_route_only_when_all_gates_pass",
    input: {
      surface: "api/**",
      routeReady: true,
      authReady: true,
      ownershipReady: true,
      guardReady: true,
      writesAllowedForPreview: false,
      candidateOnlyResponseMaintained: true,
    },
    expected: {
      routeReady: true,
      authReady: true,
      ownershipReady: true,
      guardReady: true,
      shouldImplementNow: true,
      requiredMode: "read_only_candidate_preview",
    },
  },
]);
