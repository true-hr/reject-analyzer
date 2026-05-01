import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { extractTextFromFile } from "../../lib/extract/extractTextFromFile.js";
import { getSession } from "../../lib/auth.js";
import { getVisitorId } from "../../lib/visitorId.js";
import { useToast } from "../../hooks/use-toast.js";

function toText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toText(value));
}

export default function ResumeRecommendationSheet({
  open,
  onClose,
  payloadContext = null,
}) {
  const { toast } = useToast();
  const titleRef = useRef(null);
  const fileRef = useRef(null);
  const fileMeta = useRef(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeSource, setResumeSource] = useState("paste");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractStatus, setExtractStatus] = useState("");
  const [extractError, setExtractError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [reviewConsent, setReviewConsent] = useState(false);
  const [contactConsent, setContactConsent] = useState(false);

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus?.();
    let cancelled = false;
    setIsLoadingSession(true);

    async function loadSession() {
      try {
        const session = await getSession();
        if (cancelled) return;
        const sessionUser = session?.user || null;
        const nextEmail = toText(sessionUser?.email);
        setSessionEmail(nextEmail);
        if (nextEmail) setEmail(nextEmail);
      } catch {
        if (cancelled) return;
        setSessionEmail("");
      } finally {
        if (!cancelled) setIsLoadingSession(false);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
      fileRef.current = null;
      fileMeta.current = null;
    };
  }, [open]);

  const needsEmailInput = !toText(sessionEmail);
  const effectiveEmail = needsEmailInput ? toText(email) : toText(sessionEmail);
  const effectiveResumeText = toText(resumeText);
  const canSubmit = useMemo(() => {
    if (!effectiveResumeText) return false;
    if (needsEmailInput && !isValidEmail(effectiveEmail)) return false;
    if (!reviewConsent || !contactConsent) return false;
    return true;
  }, [contactConsent, effectiveEmail, effectiveResumeText, needsEmailInput, reviewConsent]);

  async function handleFileChange(event) {
    const file = event?.target?.files?.[0] || null;
    try {
      if (event?.target) event.target.value = "";
    } catch { }
    if (!file) return;

    if (file.size > 3_000_000) {
      toast({
        title: "파일 크기 초과",
        description: "3MB 이하 파일만 업로드할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setExtractError("");
    setExtractStatus("");

    try {
      const result = await extractTextFromFile(file, "resume");
      if (!result?.ok || !toText(result?.text)) {
        const nextError = toText(result?.message) || "이력서 텍스트를 준비하지 못했습니다.";
        setExtractError(nextError);
        toast({
          title: "이력서 준비 실패",
          description: nextError,
          variant: "destructive",
        });
        return;
      }

      setResumeText(result.text);
      setResumeSource(`upload_${toText(result?.meta?.ext) || "file"}`);
      fileRef.current = file;
      fileMeta.current = { name: file.name, type: file.type || null, size: file.size || null };
      setExtractStatus("이력서 내용이 준비되었습니다");
      toast({
        title: "이력서 준비 완료",
        description: "업로드한 파일에서 텍스트를 확인했습니다.",
      });
    } catch (error) {
      const nextError = toText(error?.message) || "이력서 파일을 읽는 중 오류가 발생했습니다.";
      setExtractError(nextError);
      toast({
        title: "이력서 준비 실패",
        description: nextError,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSubmit(event) {
    event?.preventDefault?.();
    setSubmitError("");

    if (!effectiveResumeText) {
      setSubmitError("이력서 텍스트를 준비해 주세요.");
      return;
    }
    if (needsEmailInput && !isValidEmail(effectiveEmail)) {
      setSubmitError("이메일을 정확히 입력해 주세요.");
      return;
    }
    if (!reviewConsent || !contactConsent) {
      setSubmitError("동의 항목을 모두 체크해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await getSession();
      const accessToken = toText(session?.access_token);
      if (!accessToken) {
        throw new Error("로그인 후 추천 검토 신청을 진행해 주세요.");
      }

      let fileBase64 = null;
      let fileName = null;
      let mimeType = null;
      let fileSize = null;
      if (fileRef.current) {
        const f = fileRef.current;
        fileName = f.name;
        mimeType = f.type || null;
        fileSize = f.size || null;
        const buffer = await f.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        fileBase64 = btoa(binary);
      }
      const visitorId = getVisitorId();
      const response = await fetch("/api/resume-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          resumeText: effectiveResumeText,
          resumeSource: toText(resumeSource) || "paste",
          ctaOrigin: "transition_lite_result",
          currentRole: toText(payloadContext?.currentRole) || null,
          currentIndustry: toText(payloadContext?.currentIndustry) || null,
          targetRole: toText(payloadContext?.targetRole) || null,
          targetIndustry: toText(payloadContext?.targetIndustry) || null,
          candidateType: toText(payloadContext?.candidateType) || null,
          topRisk1: toText(payloadContext?.topRisk1) || null,
          reviewConsent,
          contactConsent,
          detailedShareConsent: false,
          email: effectiveEmail,
          contact: toText(contact) || null,
          visitorId,
          fileBase64,
          fileName,
          mimeType,
          fileSize,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.ok) {
        throw new Error(toText(data?.error?.message) || toText(data?.error) || "resume_registration_failed");
      }

      toast({
        title: "추천 검토 신청 완료",
        description: "이력서가 저장되고 추천 검토 신청이 완료되었습니다.",
      });

      setExtractError("");
      setExtractStatus("");
      setSubmitError("");
      setResumeText("");
      setResumeSource("paste");
      setContact("");
      setReviewConsent(false);
      setContactConsent(false);
      if (needsEmailInput) setEmail("");
      fileRef.current = null;
      fileMeta.current = null;
      onClose?.();
    } catch (error) {
      const nextError = toText(error?.message) || "추천 검토 신청 중 오류가 발생했습니다.";
      setSubmitError(nextError);
      toast({
        title: "추천 검토 신청 실패",
        description: nextError,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={() => onClose?.()} />
      <div className="relative mx-auto flex min-h-full w-full items-center justify-center px-4 py-4 sm:py-8">
        <div className="mx-auto w-[min(680px,92vw)] rounded-3xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200/70 pb-4">
              <div>
                <div className="text-[11px] font-semibold tracking-wide text-slate-500">추천 검토 등록</div>
                <div ref={titleRef} tabIndex={-1} className="mt-1 text-lg font-semibold text-slate-900 outline-none">이력서 등록하고 추천 검토 받기</div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-700">
                  이력서를 함께 검토한 뒤, 검토 결과 안내 및 필요 시 연락을 드립니다.
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  상세 이력서는 동의 없이 바로 외부 공유되지 않으며, 먼저 내부 검토 후 가능한 경우에만 안내가 진행됩니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => onClose?.()}
                className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>

            <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="text-sm font-semibold text-slate-900">안내</div>
                <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-600">
                  <li>추천 검토용으로 이력서를 저장하고 내부 검토를 진행합니다.</li>
                  <li>상세 이력서는 추가 동의 없이 바로 외부에 공유되지 않습니다.</li>
                  <li>추천 가능한 경우에만 별도로 안내드립니다.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">이력서 파일 업로드</div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm leading-6 text-slate-600">PDF, DOCX, TXT 파일에서 텍스트를 추출해 등록합니다.</div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                      {isExtracting ? "준비 중..." : "파일 선택"}
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={handleFileChange}
                        disabled={isExtracting || isSubmitting}
                      />
                    </label>
                  </div>
                  {extractStatus ? <div className="mt-3 text-sm font-medium text-emerald-700">{extractStatus}</div> : null}
                  {extractError ? <div className="mt-3 text-sm text-rose-600">{extractError}</div> : null}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-slate-900">이력서 텍스트</div>
                <textarea
                  className="min-h-[220px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                  placeholder="파일 업로드가 어렵다면 이력서 요약 또는 주요 경력 내용을 붙여 넣어 주세요."
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    if (toText(event.target.value)) {
                      setResumeSource("paste");
                      setExtractStatus("");
                      fileRef.current = null;
                      fileMeta.current = null;
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">후보자 연락 정보</div>
                  <div className="text-xs leading-5 text-slate-500">검토 결과 안내 및 필요 시 연락을 위해 이메일을 입력해 주세요. 연락처는 선택입니다.</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">이메일</div>
                  <div className="text-xs leading-5 text-slate-500">필수</div>
                </div>
                {needsEmailInput ? (
                  <input
                    type="email"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                  />
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    {isLoadingSession ? "세션 확인 중..." : sessionEmail}
                  </div>
                )}
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900">연락처 (선택)</div>
                </div>
                <input
                  type="text"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none placeholder-slate-400 focus:border-slate-900"
                  placeholder="010-0000-0000"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={reviewConsent}
                    onChange={(event) => setReviewConsent(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>추천 검토를 위한 이력서 저장 및 내부 검토에 동의합니다</span>
                </label>
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4"
                    checked={contactConsent}
                    onChange={(event) => setContactConsent(event.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>검토 결과 안내 및 필요 시 연락을 받는 데 동의합니다</span>
                </label>
              </div>

              {submitError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {submitError}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-full" onClick={() => onClose?.()} disabled={isSubmitting}>
                  닫기
                </Button>
                <Button type="submit" className="rounded-full" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "신청 중..." : "추천 검토 신청하기"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}




