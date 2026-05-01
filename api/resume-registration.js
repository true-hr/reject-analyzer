import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function __s(value) {
  return typeof value === "string" ? value.trim() : String(value || "").trim();
}

function __bool(value) {
  return value === true;
}

function __jsonObject(value, fallback = {}) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : fallback;
}

function __getBearerToken(req) {
  const raw =
    req?.headers?.authorization ??
    req?.headers?.Authorization ??
    "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parts = __s(value).split(/\s+/);
  if (parts.length !== 2) return null;
  if (parts[0].toLowerCase() !== "bearer") return null;
  return __s(parts[1]) || null;
}

function setCors(req, res) {
  try {
    const origin = req?.headers?.origin ? String(req.headers.origin) : "";
    const allow = [
      "http://localhost:5173",
      "https://true-hr.github.io",
      "https://reject-analyzer.vercel.app",
    ];
    const allowOrigin = origin && allow.includes(origin) ? origin : "null";
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
  } catch { }
}

function sanitizeFileName(name) {
  return String(name || "resume").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

function createAdminClient() {
  const url = __s(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const serviceRoleKey = __s(
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY
  );
  if (!url || !serviceRoleKey) return null;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function badRequest(res, message) {
  return res.status(400).json({
    ok: false,
    error: { code: "BAD_REQUEST", message },
  });
}

function authRequired(res, message = "Authorization Bearer token required") {
  return res.status(401).json({
    ok: false,
    error: { code: "AUTH_REQUIRED", message },
  });
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end("");
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: { code: "METHOD_NOT_ALLOWED", message: "Method Not Allowed" },
    });
  }

  const accessToken = __getBearerToken(req);
  if (!accessToken) {
    return authRequired(res);
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return res.status(503).json({
      ok: false,
      error: { code: "SUPABASE_NOT_CONFIGURED", message: "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY" },
    });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  const verifiedUser = authData?.user ?? null;
  const verifiedUserId = __s(verifiedUser?.id);
  const verifiedUserEmail = __s(verifiedUser?.email);
  if (authError || !verifiedUserId) {
    return authRequired(res, "Invalid or expired Authorization token");
  }

  try {
    const body = __jsonObject(req.body);
    const resumeText = __s(body?.resumeText);
    const resumeSource = __s(body?.resumeSource) || "paste";
    const ctaOrigin = __s(body?.ctaOrigin) || "transition_lite_result";
    const currentRole = __s(body?.currentRole) || null;
    const currentIndustry = __s(body?.currentIndustry) || null;
    const targetRole = __s(body?.targetRole) || null;
    const targetIndustry = __s(body?.targetIndustry) || null;
    const candidateType = __s(body?.candidateType) || null;
    const topRisk1 = __s(body?.topRisk1) || null;
    const email = __s(body?.email) || verifiedUserEmail;
    const contact = __s(body?.contact) || null;
    const visitorId = __s(body?.visitorId) || null;
    const fileBase64 = __s(body?.fileBase64) || null;
    const fileName = __s(body?.fileName) || null;
    const mimeType = __s(body?.mimeType) || null;
    const fileSize = typeof body?.fileSize === "number" ? body.fileSize : null;
    const reviewConsent = __bool(body?.reviewConsent);
    const contactConsent = __bool(body?.contactConsent);
    const detailedShareConsent = __bool(body?.detailedShareConsent);

    if (!resumeText) {
      return badRequest(res, "resumeText is required");
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return badRequest(res, "valid email is required");
    }
    if (!reviewConsent || !contactConsent) {
      return badRequest(res, "required consents must be true");
    }

    // 1. resume_assets insert (upload or paste)
    let assetId = null;
    if (fileBase64) {
      const buffer = Buffer.from(fileBase64, "base64");
      const genId = randomUUID();
      const sanitizedName = sanitizeFileName(fileName);
      const userSegment = `user/${verifiedUserId}`;
      const storagePath = `${userSegment}/${genId}/${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("resume-files")
        .upload(storagePath, buffer, {
          contentType: mimeType || "application/octet-stream",
          upsert: false,
        });
      if (uploadError) {
        return res.status(500).json({
          ok: false,
          error: { code: "STORAGE_UPLOAD_FAILED", message: uploadError.message || "storage_upload_failed" },
        });
      }

      const { data: assetData, error: assetError } = await supabase
        .from("resume_assets")
        .insert({
          id: genId,
          user_id: verifiedUserId,
          visitor_id: visitorId,
          email,
          contact,
          source_type: "upload",
          storage_bucket: "resume-files",
          storage_path: storagePath,
          original_file_name: sanitizedName,
          mime_type: mimeType || null,
          file_size_bytes: fileSize,
          resume_text: resumeText,
          extract_status: "success",
        })
        .select("id")
        .single();
      if (assetError) throw assetError;
      assetId = assetData?.id || genId;
    } else {
      const { data: assetData, error: assetError } = await supabase
        .from("resume_assets")
        .insert({
          user_id: verifiedUserId,
          visitor_id: visitorId,
          email,
          contact,
          source_type: "paste",
          resume_text: resumeText,
          extract_status: "success",
        })
        .select("id")
        .single();
      if (assetError) throw assetError;
      assetId = assetData?.id || null;
    }

    // 2. resume_recommendation_requests insert (resume_text kept for backward compat)
    const row = {
      user_id: verifiedUserId,
      email,
      contact,
      resume_text: resumeText,
      resume_source: resumeSource,
      cta_origin: ctaOrigin,
      current_role: currentRole,
      current_industry: currentIndustry,
      target_role: targetRole,
      target_industry: targetIndustry,
      candidate_type: candidateType,
      top_risk_1: topRisk1,
      review_consent: reviewConsent,
      contact_consent: contactConsent,
      detailed_share_consent: detailedShareConsent,
      resume_asset_id: assetId,
      meta_json: {
        source: "transition_lite_result",
      },
    };

    const { data, error } = await supabase
      .from("resume_recommendation_requests")
      .insert(row)
      .select("id")
      .single();

    if (error) throw error;

    return res.status(200).json({
      ok: true,
      id: data?.id || null,
      assetId,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: { code: "SERVER_ERROR", message: String(error?.message || error || "resume_registration_failed") },
    });
  }
}

