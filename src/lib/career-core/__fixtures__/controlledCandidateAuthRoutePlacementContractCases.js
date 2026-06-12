const forbiddenWrites = Object.freeze([
  "writeToDatabase",
  "writeToSupabase",
  "dbInsert",
  "dbUpdate",
  "dbDelete",
  "careerProfileUpdate",
  "manualConfirmationSave",
  "previewResultSave",
  "roleFitScoringUpdate",
  "companyPublicExposure",
]);

const blockedRoutePlacement = Object.freeze({
  publicRoutePath: null,
  logicalEndpoint: "careerCoreControlledCandidatesPreview",
  routeSurfaceConfirmed: false,
  shouldCreatePublicRoute: false,
});

const confirmedPreconditions = Object.freeze({
  routePlacementConfirmed: false,
  authSessionHelperConfirmed: false,
  ownershipReadHelperConfirmed: false,
});

export const controlledCandidateAuthRoutePlacementContractCases = Object.freeze([
  {
    id: "auth_route_requires_session",
    input: {
      request: { session: null },
    },
    expected: {
      ok: false,
      errorCode: "UNAUTHENTICATED",
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication is required.",
        details: [],
      },
      authPreconditionMet: false,
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
      reason: "public route is forbidden without a session guard",
    },
  },
  {
    id: "auth_route_accepts_session_user_id",
    input: {
      request: {
        session: { userId: "user-1" },
      },
    },
    expected: {
      ok: true,
      authPreconditionMet: true,
      sessionUserIdSource: "session.userId",
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "auth_route_accepts_session_user_object_id",
    input: {
      request: {
        session: { user: { id: "user-1" } },
      },
    },
    expected: {
      ok: true,
      authPreconditionMet: true,
      sessionUserIdSource: "session.user.id",
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "ownership_rejects_work_record_other_user",
    input: {
      request: {
        session: { userId: "user-1" },
        workRecords: [{ id: "wr-1", userId: "user-2" }],
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_RESOURCE",
      forbiddenResourceReason: "workRecord.userId differs from session.userId",
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "ownership_rejects_resume_profile_other_user",
    input: {
      request: {
        session: { userId: "user-1" },
        resumeProfile: { id: "rp-1", userId: "user-2" },
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_RESOURCE",
      forbiddenResourceReason: "resumeProfile.userId differs from session.userId",
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "ownership_rejects_manual_candidate_other_user",
    input: {
      request: {
        session: { userId: "user-1" },
        manualConfirmedCandidates: { userId: "user-2", strengthSignals: [] },
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_RESOURCE",
      forbiddenResourceReason: "manualConfirmedCandidates.userId differs from session.userId",
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "persisted_resource_id_requires_ownership_helper",
    input: {
      request: {
        session: { userId: "user-1" },
        resumeProfileId: "rp-1",
        workRecordIds: ["wr-1"],
      },
    },
    expected: {
      ok: false,
      errorCode: "FORBIDDEN_RESOURCE",
      ownershipHelperRequired: true,
      implementationBlocked: true,
      idBasedFetchAllowedInThisBatch: false,
      readOnlyQueriesOnlyIfImplementedLater: true,
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
  {
    id: "read_only_preview_forbids_writes",
    input: {
      request: {
        session: { userId: "user-1" },
        options: {
          previewOnly: true,
        },
      },
    },
    expected: {
      ok: true,
      readOnlyPreview: true,
      allowedReads: [
        "requestBodyValidation",
        "sessionUserIdRead",
        "inputOwnershipReadValidation",
        "controlledCandidatePreviewGeneration",
        "candidateOnlyResponseMapping",
      ],
      forbiddenWrites,
      shouldCreatePublicRoute: false,
      routePlacement: blockedRoutePlacement,
      implementationPreconditions: confirmedPreconditions,
    },
  },
]);
