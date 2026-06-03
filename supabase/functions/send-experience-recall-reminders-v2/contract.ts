// Safety gates:
// This module is a mock/fixture-based dry-run contract evaluator.
// It must not call providers.
// It must not send messages.
// It must not write ledger rows.
// It must not require secrets.
// Live mode is intentionally rejected.

type Mode = "dry_run" | "inspect_only";
type Cadence = "daily" | "weekdays" | "weekly" | "custom_days";
type ChannelName = "kakao_alimtalk" | "sms" | "email" | "web_push";
type ConsentStatus = "granted" | "missing" | "revoked";
type ContactStatus = "verified" | "unverified" | "missing";
type ProviderName = "mock" | ChannelName;
type ProviderDryRunFailureCode =
  | "CONTACT_MISSING"
  | "CONTACT_UNVERIFIED"
  | "CONSENT_MISSING"
  | "CONSENT_REVOKED"
  | "TEMPLATE_MISSING"
  | "PROVIDER_NOT_READY"
  | "SIMULATED_PRIMARY_FAILURE"
  | null;
export type DecisionStatus =
  | "would_send"
  | "would_skip_not_due"
  | "would_skip_disabled_rule"
  | "would_skip_deleted_rule"
  | "would_skip_contact_missing"
  | "would_skip_contact_unverified"
  | "would_skip_consent_missing"
  | "would_skip_consent_revoked"
  | "would_skip_provider_not_ready"
  | "would_skip_duplicate_claim"
  | "fallback_would_run"
  | "fallback_would_skip"
  | "inspect_only";

export type RequestInput = {
  mode?: string;
  now?: string;
  timezone?: string;
  lookbackMinutes?: number;
  limit?: number;
  targetPersonId?: string | null;
  targetRuleId?: string | null;
  writeLedger?: boolean;
};

type NormalizedRequest = {
  mode: Mode;
  now: Date;
  timezone: string;
  lookbackMinutes: number;
  limit: number;
  targetPersonId: string | null;
  targetRuleId: string | null;
  writeLedger: false;
  warnings: string[];
};

type RuleFixture = {
  id: string;
  personId: string;
  reminderKind: "experience_recall";
  cadence: Cadence;
  daysOfWeek: number[];
  timeLocal: string;
  timezone: string;
  isEnabled: boolean;
  deletedAt: string | null;
  channels: ChannelFixture[];
  duplicateClaim?: boolean;
};

type ChannelFixture = {
  name: ChannelName;
  priority: number;
  contactId: string | null;
  contactStatus: ContactStatus;
  consentTypesChecked: string[];
  consentStatus: ConsentStatus;
  providerReady: boolean;
  templateKey?: string | null;
  simulatePrimaryFailure?: boolean;
  fallbackToChannel?: ChannelName | null;
};

export type ProviderDryRunResult = {
  provider: ProviderName;
  dryRun: true;
  wouldCallProvider: boolean;
  called: false;
  wouldSend: boolean;
  wouldFail: boolean;
  failureCode: ProviderDryRunFailureCode;
  failureReason: string | null;
  messageId: null;
  rawStored: false;
  costEstimated: number | null;
  warnings: string[];
};

export type ResultJson = {
  mode: Mode;
  runId: string;
  localSlotKey: string;
  rule: {
    id: string;
    personId: string;
    reminderKind: "experience_recall";
    cadence: Cadence;
    timeLocal: string;
    timezone: string;
  };
  channel: {
    name: ChannelName;
    priority: number;
    contactId: string | null;
    consentTypesChecked: string[];
  };
  decision: {
    status: DecisionStatus;
    reason: string;
    inspectedStatus?: DecisionStatus;
  };
  provider: {
    name: "mock";
    called: false;
    messageId: null;
    rawStored: false;
  };
  providerDryRun?: {
    primary: ProviderDryRunResult;
    fallback?: ProviderDryRunResult | null;
  };
  fallback: {
    evaluated: boolean;
    attempted: false;
    wouldRun: boolean;
    channel: ChannelName | null;
    reason: string | null;
  };
  ledger: {
    writeLedger: false;
    claimKey: string;
    duplicateFound: boolean;
  };
};

type EvaluationBody =
  | {
    ok: false;
    error: string;
    message?: string;
    allowedModes?: string[];
    rejectedModes?: string[];
    providerCalls: 0;
    messagesSent: 0;
    ledgerWrites: 0;
  }
  | {
    ok: true;
    mode: Mode;
    runId: string;
    evaluatedRules: number;
    wouldSend: number;
    wouldSkip: number;
    fallbackWouldRun: number;
    providerCalls: 0;
    messagesSent: 0;
    ledgerWrites: 0;
    warnings: string[];
    safety: {
      fixtureOnly: true;
      providerCallsDisabled: true;
      messageSendingDisabled: true;
      ledgerWritesDisabled: true;
      secretsRequired: false;
      liveModeRejected: true;
    };
    results: ResultJson[];
  };

export type EvaluationResult = {
  status: number;
  body: EvaluationBody;
};

const MAX_LIMIT = 500;
const MAX_LOOKBACK_MINUTES = 120;
const DEFAULT_TIMEZONE = "Asia/Seoul";

const FIXTURE_RULES: RuleFixture[] = [
  {
    id: "rule_daily_1800",
    personId: "person_demo_1",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_weekdays_1800",
    personId: "person_demo_2",
    reminderKind: "experience_recall",
    cadence: "weekdays",
    daysOfWeek: [1, 2, 3, 4, 5],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "email",
        priority: 1,
        contactId: "contact_email_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "email_notification"],
        consentStatus: "granted",
        providerReady: true,
      },
    ],
  },
  {
    id: "rule_custom_days_1800",
    personId: "person_demo_3",
    reminderKind: "experience_recall",
    cadence: "custom_days",
    daysOfWeek: [1, 3, 5],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "web_push",
        priority: 1,
        contactId: "contact_push_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "web_push_device"],
        consentStatus: "granted",
        providerReady: true,
      },
    ],
  },
  {
    id: "rule_not_due_1700",
    personId: "person_demo_4",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "17:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_4",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_disabled_1800",
    personId: "person_demo_5",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: false,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_5",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_deleted_1800",
    personId: "person_demo_6",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: "2026-06-01T00:00:00.000Z",
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_6",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_contact_missing_1800",
    personId: "person_demo_7",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: null,
        contactStatus: "missing",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_contact_unverified_1800",
    personId: "person_demo_8",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "sms",
        priority: 1,
        contactId: "contact_phone_unverified_1",
        contactStatus: "unverified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "sms_notification"],
        consentStatus: "granted",
        providerReady: true,
      },
    ],
  },
  {
    id: "rule_consent_missing_1800",
    personId: "person_demo_9",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "email",
        priority: 1,
        contactId: "contact_email_missing_consent_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "email_notification"],
        consentStatus: "missing",
        providerReady: true,
      },
    ],
  },
  {
    id: "rule_consent_revoked_1800",
    personId: "person_demo_10",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "sms",
        priority: 1,
        contactId: "contact_phone_revoked_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "sms_notification"],
        consentStatus: "revoked",
        providerReady: true,
      },
    ],
  },
  {
    id: "rule_kakao_provider_not_ready_1800",
    personId: "person_demo_11",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_provider_pending_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: false,
        templateKey: "experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_kakao_template_missing_1800",
    personId: "person_demo_15",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_template_missing_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: null,
      },
    ],
  },
  {
    id: "rule_kakao_sms_fallback_1800",
    personId: "person_demo_12",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_fallback_primary_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
        simulatePrimaryFailure: true,
        fallbackToChannel: "sms",
      },
      {
        name: "sms",
        priority: 2,
        contactId: "contact_phone_fallback_sms_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "sms_fallback"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "sms_fallback_experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_kakao_sms_fallback_skip_1800",
    personId: "person_demo_13",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_fallback_skip_primary_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
        simulatePrimaryFailure: true,
        fallbackToChannel: "sms",
      },
      {
        name: "sms",
        priority: 2,
        contactId: "contact_phone_fallback_skip_sms_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "sms_fallback"],
        consentStatus: "missing",
        providerReady: true,
        templateKey: "sms_fallback_experience_recall_v1",
      },
    ],
  },
  {
    id: "rule_duplicate_claim_1800",
    personId: "person_demo_14",
    reminderKind: "experience_recall",
    cadence: "daily",
    daysOfWeek: [],
    timeLocal: "18:00",
    timezone: "Asia/Seoul",
    isEnabled: true,
    deletedAt: null,
    duplicateClaim: true,
    channels: [
      {
        name: "kakao_alimtalk",
        priority: 1,
        contactId: "contact_phone_duplicate_1",
        contactStatus: "verified",
        consentTypesChecked: ["service_notification", "experience_recall_reminder", "kakao_alimtalk"],
        consentStatus: "granted",
        providerReady: true,
        templateKey: "experience_recall_v1",
      },
    ],
  },
];

export function parseBody(raw: unknown): RequestInput {
  return raw && typeof raw === "object" ? raw as RequestInput : {};
}

function clampInteger(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.floor(value), min), max);
}

function normalizeRequest(input: RequestInput): { request?: NormalizedRequest; result?: EvaluationResult } {
  if (input.mode === "live") {
    return {
      result: {
        status: 403,
        body: {
          ok: false,
          error: "LIVE_MODE_REJECTED",
          message: "live mode is intentionally rejected by this mock dry-run skeleton",
          providerCalls: 0,
          messagesSent: 0,
          ledgerWrites: 0,
        },
      },
    };
  }

  const mode = input.mode ?? "dry_run";
  if (mode !== "dry_run" && mode !== "inspect_only") {
    return {
      result: {
        status: 400,
        body: {
          ok: false,
          error: "INVALID_MODE",
          allowedModes: ["dry_run", "inspect_only"],
          rejectedModes: ["live"],
          providerCalls: 0,
          messagesSent: 0,
          ledgerWrites: 0,
        },
      },
    };
  }

  const now = input.now ? new Date(input.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    return {
      result: {
        status: 400,
        body: {
          ok: false,
          error: "INVALID_NOW",
          message: "now must be an ISO-8601 timestamp",
          providerCalls: 0,
          messagesSent: 0,
          ledgerWrites: 0,
        },
      },
    };
  }

  const warnings: string[] = [];
  if (input.writeLedger === true) {
    warnings.push("writeLedger=true was forced to false; this skeleton never writes ledger rows");
  }
  const timezone = typeof input.timezone === "string" && input.timezone.trim() ? input.timezone.trim() : DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(now);
  } catch {
    return {
      result: {
        status: 400,
        body: {
          ok: false,
          error: "INVALID_TIMEZONE",
          message: "timezone must be a valid IANA timezone",
          providerCalls: 0,
          messagesSent: 0,
          ledgerWrites: 0,
        },
      },
    };
  }

  return {
    request: {
      mode,
      now,
      timezone,
      lookbackMinutes: clampInteger(input.lookbackMinutes, 15, 0, MAX_LOOKBACK_MINUTES),
      limit: clampInteger(input.limit, 100, 1, MAX_LIMIT),
      targetPersonId: typeof input.targetPersonId === "string" && input.targetPersonId.trim()
        ? input.targetPersonId.trim()
        : null,
      targetRuleId: typeof input.targetRuleId === "string" && input.targetRuleId.trim() ? input.targetRuleId.trim() : null,
      writeLedger: false,
      warnings,
    },
  };
}

function getLocalParts(utcDate: Date, timezone: string): {
  date: string;
  hhmm: string;
  dayOfWeek: number;
  minutes: number;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  }).formatToParts(utcDate);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = pick("hour") === "24" ? "00" : pick("hour");
  const minute = pick("minute");
  const weekday = pick("weekday");
  const dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const minutes = Number(hour) * 60 + Number(minute);

  return {
    date: `${year}-${month}-${day}`,
    hhmm: `${hour}:${minute}`,
    dayOfWeek,
    minutes,
  };
}

function parseHHMM(value: string): number {
  const [hour, minute] = value.split(":").map((part) => Number(part));
  return hour * 60 + minute;
}

function isDue(rule: RuleFixture, now: Date, lookbackMinutes: number): boolean {
  const local = getLocalParts(now, rule.timezone);
  const ruleMinutes = parseHHMM(rule.timeLocal);
  const inLookback = ruleMinutes <= local.minutes && ruleMinutes >= local.minutes - lookbackMinutes;

  if (!inLookback) return false;
  if (rule.cadence === "daily") return true;
  if (rule.cadence === "weekdays") return local.dayOfWeek >= 1 && local.dayOfWeek <= 5;
  if (rule.cadence === "weekly") return rule.daysOfWeek.includes(local.dayOfWeek);
  if (rule.cadence === "custom_days") return rule.daysOfWeek.includes(local.dayOfWeek);
  return false;
}

function buildRunId(now: Date, timezone: string): string {
  const local = getLocalParts(now, timezone);
  return `dryrun_${local.date.replaceAll("-", "")}_${local.hhmm.replace(":", "")}00`;
}

function buildLocalSlotKey(rule: RuleFixture, now: Date): string {
  const local = getLocalParts(now, rule.timezone);
  return `${local.date}T${rule.timeLocal}@${rule.timezone}`;
}

function buildClaimKey(rule: RuleFixture, channel: ChannelFixture, localSlotKey: string): string {
  return `${rule.id}:${channel.name}:${localSlotKey}`;
}

function pickPrimaryChannel(rule: RuleFixture): ChannelFixture {
  return [...rule.channels].sort((a, b) => a.priority - b.priority)[0];
}

function findFallback(rule: RuleFixture, channel: ChannelFixture): ChannelFixture | null {
  if (!channel.fallbackToChannel) return null;
  return rule.channels.find((candidate) => candidate.name === channel.fallbackToChannel) ?? null;
}

function baseProviderDryRun(provider: ProviderName): ProviderDryRunResult {
  return {
    provider,
    dryRun: true,
    wouldCallProvider: false,
    called: false,
    wouldSend: false,
    wouldFail: false,
    failureCode: null,
    failureReason: null,
    messageId: null,
    rawStored: false,
    costEstimated: null,
    warnings: [],
  };
}

function withProviderFailure(
  result: ProviderDryRunResult,
  failureCode: Exclude<ProviderDryRunFailureCode, null>,
  failureReason: string,
): ProviderDryRunResult {
  return {
    ...result,
    wouldCallProvider: true,
    wouldSend: false,
    wouldFail: true,
    failureCode,
    failureReason,
  };
}

function evaluateKakaoDryRun(channel: ChannelFixture): ProviderDryRunResult {
  const result = baseProviderDryRun("kakao_alimtalk");

  if (channel.contactStatus === "missing" || !channel.contactId) {
    return { ...result, failureCode: "CONTACT_MISSING", failureReason: "kakao contact is missing" };
  }
  if (channel.contactStatus === "unverified") {
    return { ...result, failureCode: "CONTACT_UNVERIFIED", failureReason: "kakao contact is unverified" };
  }
  if (channel.consentStatus === "missing") {
    return { ...result, failureCode: "CONSENT_MISSING", failureReason: "kakao consent is missing" };
  }
  if (channel.consentStatus === "revoked") {
    return { ...result, failureCode: "CONSENT_REVOKED", failureReason: "kakao consent is revoked" };
  }
  if (!channel.templateKey) {
    return withProviderFailure(result, "TEMPLATE_MISSING", "kakao template key is missing");
  }
  if (!channel.providerReady) {
    return withProviderFailure(result, "PROVIDER_NOT_READY", "kakao provider is not ready");
  }
  if (channel.simulatePrimaryFailure) {
    return withProviderFailure(result, "SIMULATED_PRIMARY_FAILURE", "kakao dry-run primary failure was simulated");
  }

  return {
    ...result,
    wouldCallProvider: true,
    wouldSend: true,
  };
}

function evaluateSmsFallbackDryRun(channel: ChannelFixture | null): ProviderDryRunResult {
  const result = baseProviderDryRun("sms");

  if (!channel || channel.contactStatus === "missing" || !channel.contactId) {
    return { ...result, failureCode: "CONTACT_MISSING", failureReason: "sms fallback contact is missing" };
  }
  if (channel.contactStatus === "unverified") {
    return { ...result, failureCode: "CONTACT_UNVERIFIED", failureReason: "sms fallback contact is unverified" };
  }
  if (channel.consentStatus === "missing") {
    return { ...result, failureCode: "CONSENT_MISSING", failureReason: "sms fallback consent is missing" };
  }
  if (channel.consentStatus === "revoked") {
    return { ...result, failureCode: "CONSENT_REVOKED", failureReason: "sms fallback consent is revoked" };
  }
  if (!channel.providerReady) {
    return { ...result, failureCode: "PROVIDER_NOT_READY", failureReason: "sms fallback provider is not ready" };
  }

  return {
    ...result,
    wouldCallProvider: true,
    wouldSend: true,
  };
}

function canBuildProviderDryRun(rule: RuleFixture, channel: ChannelFixture, request: NormalizedRequest): boolean {
  return Boolean(
    rule.isEnabled &&
      !rule.deletedAt &&
      isDue(rule, request.now, request.lookbackMinutes) &&
      channel.contactStatus === "verified" &&
      channel.consentStatus === "granted" &&
      !rule.duplicateClaim,
  );
}

function buildProviderDryRun(
  rule: RuleFixture,
  channel: ChannelFixture,
  request: NormalizedRequest,
): ResultJson["providerDryRun"] {
  if (channel.name !== "kakao_alimtalk" || !canBuildProviderDryRun(rule, channel, request)) return undefined;

  const primary = evaluateKakaoDryRun(channel);
  if (!primary.wouldFail) return { primary };

  return {
    primary,
    fallback: channel.fallbackToChannel === "sms" ? evaluateSmsFallbackDryRun(findFallback(rule, channel)) : null,
  };
}

function evaluateFallback(rule: RuleFixture, channel: ChannelFixture): {
  status: DecisionStatus;
  wouldRun: boolean;
  channel: ChannelName | null;
  reason: string | null;
} {
  const fallback = findFallback(rule, channel);

  if (!channel.simulatePrimaryFailure) {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: channel.fallbackToChannel ?? null,
      reason: "primary channel has no simulated provider failure",
    };
  }
  if (!fallback) {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: channel.fallbackToChannel ?? null,
      reason: "fallback channel is not configured",
    };
  }
  if (fallback.contactStatus === "missing") {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: fallback.name,
      reason: "fallback contact is missing",
    };
  }
  if (fallback.contactStatus === "unverified") {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: fallback.name,
      reason: "fallback contact is unverified",
    };
  }
  if (fallback.consentStatus !== "granted") {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: fallback.name,
      reason: `fallback consent is ${fallback.consentStatus}`,
    };
  }
  if (!fallback.providerReady) {
    return {
      status: "fallback_would_skip",
      wouldRun: false,
      channel: fallback.name,
      reason: "fallback provider is not ready",
    };
  }

  return {
    status: "fallback_would_run",
    wouldRun: true,
    channel: fallback.name,
    reason: "primary kakao candidate has simulated failure and sms fallback is eligible",
  };
}

function evaluateRule(rule: RuleFixture, request: NormalizedRequest, runId: string): ResultJson {
  const channel = pickPrimaryChannel(rule);
  const localSlotKey = buildLocalSlotKey(rule, request.now);
  const claimKey = buildClaimKey(rule, channel, localSlotKey);
  const providerDryRun = buildProviderDryRun(rule, channel, request);
  let status: DecisionStatus = "would_send";
  let reason = "due rule with verified contact and granted consent";
  const fallback = evaluateFallback(rule, channel);

  if (!rule.isEnabled) {
    status = "would_skip_disabled_rule";
    reason = "rule is disabled";
  } else if (rule.deletedAt) {
    status = "would_skip_deleted_rule";
    reason = "rule is soft deleted";
  } else if (!isDue(rule, request.now, request.lookbackMinutes)) {
    status = "would_skip_not_due";
    reason = "rule is outside the current local slot lookback window";
  } else if (channel.contactStatus === "missing") {
    status = "would_skip_contact_missing";
    reason = "channel contact is missing";
  } else if (channel.contactStatus === "unverified") {
    status = "would_skip_contact_unverified";
    reason = "channel contact is unverified";
  } else if (channel.consentStatus === "missing") {
    status = "would_skip_consent_missing";
    reason = "required consent is missing";
  } else if (channel.consentStatus === "revoked") {
    status = "would_skip_consent_revoked";
    reason = "required consent is revoked";
  } else if (!channel.providerReady) {
    status = "would_skip_provider_not_ready";
    reason = "provider is not ready";
  } else if (rule.duplicateClaim) {
    status = "would_skip_duplicate_claim";
    reason = "mock ledger contains an existing claim for this rule/channel/local slot";
  } else if (providerDryRun?.primary.wouldFail) {
    if (providerDryRun.fallback?.wouldSend) {
      status = "fallback_would_run";
      reason = "primary kakao dry-run failed and sms fallback is eligible";
    } else {
      status = "fallback_would_skip";
      reason = providerDryRun.fallback?.failureReason ?? providerDryRun.primary.failureReason ?? "primary provider dry-run failed";
    }
  } else if (channel.simulatePrimaryFailure || fallback.wouldRun) {
    status = fallback.status;
    reason = fallback.reason ?? "fallback evaluated";
  }

  const inspectedStatus = status;
  if (request.mode === "inspect_only") {
    status = "inspect_only";
    reason = `inspect_only: ${reason}`;
  }

  return {
    mode: request.mode,
    runId,
    localSlotKey,
    rule: {
      id: rule.id,
      personId: rule.personId,
      reminderKind: rule.reminderKind,
      cadence: rule.cadence,
      timeLocal: rule.timeLocal,
      timezone: rule.timezone,
    },
    channel: {
      name: channel.name,
      priority: channel.priority,
      contactId: channel.contactId,
      consentTypesChecked: channel.consentTypesChecked,
    },
    decision: {
      status,
      reason,
      ...(request.mode === "inspect_only" ? { inspectedStatus } : {}),
    },
    provider: {
      name: "mock",
      called: false,
      messageId: null,
      rawStored: false,
    },
    ...(providerDryRun ? { providerDryRun } : {}),
    fallback: {
      evaluated: true,
      attempted: false,
      wouldRun: fallback.wouldRun && request.mode !== "inspect_only",
      channel: fallback.channel,
      reason: fallback.reason,
    },
    ledger: {
      writeLedger: false,
      claimKey,
      duplicateFound: Boolean(rule.duplicateClaim),
    },
  };
}

export function evaluateSchedulerDryRun(input: RequestInput): EvaluationResult {
  const normalized = normalizeRequest(input);
  if (normalized.result) return normalized.result;
  const request = normalized.request;
  if (!request) {
    return {
      status: 500,
      body: {
        ok: false,
        error: "REQUEST_NORMALIZATION_FAILED",
        providerCalls: 0,
        messagesSent: 0,
        ledgerWrites: 0,
      },
    };
  }

  const runId = buildRunId(request.now, request.timezone);
  const results = FIXTURE_RULES
    .filter((rule) => !request.targetPersonId || rule.personId === request.targetPersonId)
    .filter((rule) => !request.targetRuleId || rule.id === request.targetRuleId)
    .slice(0, request.limit)
    .map((rule) => evaluateRule(rule, request, runId));

  const wouldSend = results.filter((result) => result.decision.status === "would_send").length;
  const fallbackWouldRun = results.filter((result) => result.decision.status === "fallback_would_run").length;
  const wouldSkip = results.filter((result) =>
    result.decision.status.startsWith("would_skip_") || result.decision.status === "fallback_would_skip"
  ).length;

  return {
    status: 200,
    body: {
      ok: true,
      mode: request.mode,
      runId,
      evaluatedRules: results.length,
      wouldSend,
      wouldSkip,
      fallbackWouldRun,
      providerCalls: 0,
      messagesSent: 0,
      ledgerWrites: 0,
      warnings: request.warnings,
      safety: {
        fixtureOnly: true,
        providerCallsDisabled: true,
        messageSendingDisabled: true,
        ledgerWritesDisabled: true,
        secretsRequired: false,
        liveModeRejected: true,
      },
      results,
    },
  };
}
