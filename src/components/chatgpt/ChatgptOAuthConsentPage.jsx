import React, { useEffect, useMemo, useState } from "react";
import { Check, Lock, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSession,
  onAuthStateChange,
  signInWithGoogle,
  signInWithKakao,
  signInWithNaver,
} from "@/lib/auth.js";

const REQUIRED_SCOPE = "experience.write";
const RETURN_URL_KEY = "passmap.chatgptOAuth.returnUrl";
const RETURN_URL_USED_KEY = "passmap.chatgptOAuth.returnUrl.used";

function readParams() {
  if (typeof window === "undefined") {
    return { clientId: "", redirectUri: "", scope: "", state: "" };
  }
  const params = new URLSearchParams(window.location.search || "");
  return {
    clientId: String(params.get("client_id") || "").trim(),
    redirectUri: String(params.get("redirect_uri") || "").trim(),
    scope: String(params.get("scope") || "").trim(),
    state: String(params.get("state") || "").trim(),
  };
}

function getCurrentReturnUrl() {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

function storeReturnUrl() {
  const returnUrl = getCurrentReturnUrl();
  if (!returnUrl) return "";
  try {
    window.sessionStorage?.setItem(RETURN_URL_KEY, returnUrl);
    window.sessionStorage?.removeItem(RETURN_URL_USED_KEY);
  } catch {
    // Best-effort continuity across the OAuth provider redirect.
  }
  return returnUrl;
}

function hasRequiredParams() {
  if (typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.search || "");
  return Boolean(params.get("client_id") && params.get("redirect_uri") && params.get("state"));
}

function restoreStoredReturnUrlIfNeeded() {
  if (typeof window === "undefined" || hasRequiredParams()) return false;
  try {
    const used = window.sessionStorage?.getItem(RETURN_URL_USED_KEY);
    const returnUrl = window.sessionStorage?.getItem(RETURN_URL_KEY);
    if (used || !returnUrl || returnUrl === window.location.href) return false;

    const url = new URL(returnUrl);
    if (url.origin !== window.location.origin || !url.pathname.includes("/chatgpt-oauth/consent")) {
      return false;
    }

    window.sessionStorage?.setItem(RETURN_URL_USED_KEY, "1");
    window.location.replace(returnUrl);
    return true;
  } catch {
    return false;
  }
}

function getHomePath() {
  if (typeof window === "undefined") return "/";
  const path = String(window.location.pathname || "");
  return path.startsWith("/reject-analyzer") ? "/reject-analyzer/" : "/";
}

function getApiBase() {
  const raw = String(import.meta.env.VITE_API_BASE || "").trim();
  return raw ? raw.replace(/\/+$/, "") : "";
}

async function readSafeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function validateParams(params) {
  if (!params.clientId) return "client_id가 없어 연결을 진행할 수 없습니다.";
  if (!params.redirectUri) return "redirect_uri가 없어 연결을 진행할 수 없습니다.";
  if (!params.state) return "state가 없어 연결을 진행할 수 없습니다.";
  if (params.scope !== REQUIRED_SCOPE) return "지원하지 않는 권한 요청입니다.";
  return "";
}

export default function ChatgptOAuthConsentPage() {
  const params = useMemo(() => readParams(), []);
  const paramError = useMemo(() => validateParams(params), [params]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState(paramError);

  useEffect(() => {
    restoreStoredReturnUrlIfNeeded();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSession() {
      setLoading(true);
      try {
        const nextSession = await getSession();
        if (!cancelled) setSession(nextSession || null);
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadSession();
    const sub = onAuthStateChange((_, nextSession) => {
      setSession(nextSession || null);
    });
    return () => {
      cancelled = true;
      try { sub?.unsubscribe?.(); } catch { }
    };
  }, []);

  useEffect(() => {
    setError(paramError);
  }, [paramError]);

  const handleComplete = async () => {
    if (paramError) {
      setError(paramError);
      return;
    }
    const accessToken = String(session?.access_token || "").trim();
    if (!accessToken) {
      setError("로그인 후 다시 시도해 주세요.");
      return;
    }

    setCompleting(true);
    setError("");
    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/chatgpt/oauth/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          client_id: params.clientId,
          redirect_uri: params.redirectUri,
          scope: params.scope,
          state: params.state,
        }),
      });
      const data = await readSafeJson(response);
      if (!response.ok || data?.ok !== true || !data?.redirectUrl) {
        const message =
          data?.error_description ||
          data?.message ||
          data?.error?.message ||
          "연결을 완료하지 못했습니다.";
        throw new Error(message);
      }
      setCompleted(true);
      window.location.href = data.redirectUrl;
    } catch (err) {
      console.error("[chatgpt-oauth-consent] complete failed");
      setError(String(err?.message || "연결을 완료하지 못했습니다."));
    } finally {
      setCompleting(false);
    }
  };

  const handleSignIn = async (provider) => {
    const redirectTo = storeReturnUrl() || getCurrentReturnUrl();
    setError("");
    try {
      if (provider === "google") {
        await signInWithGoogle({ redirectTo });
      } else if (provider === "kakao") {
        await signInWithKakao({ redirectTo });
      } else if (provider === "naver") {
        await signInWithNaver({ redirectTo });
      }
    } catch (err) {
      setError(String(err?.message || "로그인을 시작하지 못했습니다."));
    }
  };

  const handleCancel = () => {
    try {
      if (params.redirectUri) {
        const url = new URL(params.redirectUri);
        url.searchParams.set("error", "access_denied");
        url.searchParams.set("error_description", "User denied access");
        if (params.state) url.searchParams.set("state", params.state);
        window.location.href = url.toString();
        return;
      }
    } catch {
      // Fall through to the app home.
    }
    window.location.href = getHomePath();
  };

  const loggedIn = Boolean(session?.access_token);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col justify-center">
        <div className="mb-6 flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}brand/passmap-logo-horizontal-purple-small.png`}
            alt="PASSMAP"
            className="h-7 w-auto object-contain"
          />
          <div className="h-5 border-l border-slate-300" />
          <div className="text-sm font-semibold text-slate-600">ChatGPT 연결</div>
        </div>

        <Card className="rounded-lg border-slate-200 bg-white shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl">ChatGPT와 PASSMAP 연결</CardTitle>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                ChatGPT가 정리한 업무 내용을 PASSMAP 업무기록으로 저장할 수 있도록 연결합니다.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-md bg-white text-slate-800 shadow-sm">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-semibold">업무기록 저장</div>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    ChatGPT에서 정리한 경험 후보를 PASSMAP AI Inbox에 저장합니다.
                    저장된 기록은 PASSMAP에서 다시 검토할 수 있습니다.
                  </p>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    허용되는 권한: 업무기록 저장
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              <div>ChatGPT는 사용자가 저장을 요청하고 확인한 내용만 PASSMAP에 보냅니다.</div>
              <div>전체 대화 원문을 자동으로 저장하지 않습니다.</div>
              <div>연결 후에도 PASSMAP에서 기록을 검토·확정할 수 있습니다.</div>
              <div>원문 전체 저장이 아니라 구조화된 업무기록 후보 저장을 기준으로 합니다.</div>
            </div>

            {loading ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
                연결 정보를 확인하고 있습니다.
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-900">
                <div className="font-semibold">연결을 완료하지 못했습니다.</div>
                <div className="mt-1">{error}</div>
              </div>
            ) : null}

            {completed ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                연결이 완료되었습니다. ChatGPT로 돌아갑니다.
              </div>
            ) : null}

            {!loading && !loggedIn ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Lock className="h-4 w-4" />
                  PASSMAP에 로그인해야 연결할 수 있습니다.
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Button type="button" variant="outline" onClick={() => handleSignIn("google")}>
                    Google로 로그인
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleSignIn("kakao")}>
                    Kakao로 로그인
                  </Button>
                  <Button type="button" variant="outline" onClick={() => handleSignIn("naver")}>
                    Naver로 로그인
                  </Button>
                </div>
              </div>
            ) : null}

            {!loading && loggedIn ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  PASSMAP에 로그인되었습니다. ChatGPT 연결을 승인해 주세요.
                </div>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={completing}>
                    취소
                  </Button>
                  <Button type="button" onClick={handleComplete} disabled={completing || Boolean(paramError)}>
                    {completing ? "ChatGPT 연결을 완료하고 있습니다." : "동의하고 연결하기"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  취소
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
