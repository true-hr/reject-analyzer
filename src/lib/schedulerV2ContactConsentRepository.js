export const SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC =
  "upsert_current_person_contact_consent";

const RAW_DESTINATION_KEYS = new Set([
  "destination",
  "p_destination",
  "value_normalized",
  "raw_destination",
]);
const SUPPORTED_FRONTEND_WRITE_CHANNELS = new Set(["sms", "email"]);

function sanitizeRpcResult(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeRpcResult);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !RAW_DESTINATION_KEYS.has(key))
      .map(([key, item]) => [key, sanitizeRpcResult(item)])
  );
}

function normalizePhoneInput(phoneLikeInput) {
  const normalized = String(phoneLikeInput || "").replace(/[^\d+]/g, "");
  if (normalized.length < 8) {
    throw new Error("A valid phone number is required.");
  }
  return normalized;
}

export function buildSmsContactConsentPayload(phoneLikeInput, options = {}) {
  return {
    p_channel: "sms",
    p_destination: normalizePhoneInput(phoneLikeInput),
    p_consent_type: options.consentType || "reminder",
    p_consent_status: options.consentStatus || "granted",
    p_is_primary: options.isPrimary !== false,
    p_metadata: {
      ...(options.metadata || {}),
      contact_source: "reminder_settings_panel",
      copy_version: options.copyVersion || "scheduler-v2-contact-consent-20260612",
    },
  };
}

export function buildEmailContactConsentPayload(emailLikeInput, options = {}) {
  const destination = String(emailLikeInput || "").trim().toLowerCase();
  if (!destination.includes("@")) {
    throw new Error("A valid email address is required.");
  }

  return {
    p_channel: "email",
    p_destination: destination,
    p_consent_type: options.consentType || "reminder",
    p_consent_status: options.consentStatus || "granted",
    p_is_primary: options.isPrimary === true,
    p_metadata: {
      ...(options.metadata || {}),
      contact_source: "reminder_settings_panel",
      copy_version: options.copyVersion || "scheduler-v2-contact-consent-20260612",
    },
  };
}

export async function saveSchedulerV2ContactConsent(supabaseClient, payload) {
  if (!supabaseClient || typeof supabaseClient.rpc !== "function") {
    throw new Error("Supabase client with rpc() is required.");
  }
  if (!SUPPORTED_FRONTEND_WRITE_CHANNELS.has(payload?.p_channel)) {
    throw new Error("Unsupported contact consent write channel.");
  }

  const { data, error } = await supabaseClient.rpc(
    SCHEDULER_V2_CONTACT_CONSENT_WRITE_RPC,
    payload
  );

  if (error) {
    throw error;
  }

  return sanitizeRpcResult(data);
}
