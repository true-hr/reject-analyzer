// src/App.jsx
import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Check,
  Clipboard,
  Download,
  FileText,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

import { SECTION, ORDER, defaultState } from "@/lib/schema";
import { buildHypotheses, buildReport, buildKeywordSignals, buildCareerSignals } from "@/lib/analyzer";
import { usePersistedState } from "@/hooks/usePersistedState";
import HypothesisCard from "@/components/HypothesisCard";
import RadarSelfCheck from "@/components/RadarSelfCheck";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}
function scoreToLabel(n) {
  if (n <= 2) return "낮음";
  if (n === 3) return "보통";
  return "높음";
}

function StepPill({ active, done, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={
        "group inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted border-border text-foreground")
      }
    >
      <span
        className={
          "grid h-6 w-6 place-items-center rounded-full border transition " +
          (active
            ? "bg-primary-foreground/10 border-primary-foreground/20"
            : done
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-muted border-border")
        }
      >
        {done ? <Check className="h-4 w-4 text-emerald-600" /> : <Icon className={"h-4 w-4 " + (active ? "text-primary-foreground" : "text-muted-foreground")} />}
      </span>
      <span className={"font-medium " + (active ? "" : "text-muted-foreground group-hover:text-foreground")}>{label}</span>
    </button>
  );
}

function SliderRow({ label, value, onChange, hint }) {
  const tone = value <= 2 ? "destructive" : value === 3 ? "secondary" : "default";
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium">{label}</div>
          {hint ? <div className="text-xs text-muted-foreground mt-0.5">{hint}</div> : null}
        </div>
        <Badge variant={tone} className="shrink-0">
          {value} / 5 · {scoreToLabel(value)}
        </Badge>
      </div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value), 1, 5))}
        className="w-full accent-foreground"
      />
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 text-foreground">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-24 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-6xl px-4 py-10">{children}</div>
    </div>
  );
}

export default function App() {
  const { toast } = useToast();

  // 단계
  const [step, setStep] = useState(SECTION.JOB);

  // persisted state (v2->v3 migration 포함)
  const [state, setState, resetState] = usePersistedState(defaultState);

  // “분석하기” 버튼 기반 실행 (typing 중 실행 금지)
  const [analysis, setAnalysis] = useState(null);

  const progress = useMemo(() => {
    const idx = ORDER.indexOf(step);
    return ((idx + 1) / ORDER.length) * 100;
  }, [step]);

  const reportRef = useRef(null);

  const nav = [
    { id: SECTION.JOB, label: "기본정보", icon: FileText },
    { id: SECTION.RESUME, label: "서류", icon: FileText },
    { id: SECTION.INTERVIEW, label: "면접", icon: FileText },
    { id: SECTION.RESULT, label: "리포트", icon: Sparkles },
  ];

  const idx = ORDER.indexOf(step);
  const canPrev = idx > 0;
  const canNext = idx < ORDER.length - 1;

  function set(path, value) {
    setState((prev) => {
      // deep set (간단 구현)
      const keys = path.split(".");
      const next = (typeof structuredClone === "function")
  ? structuredClone(prev)
  : JSON.parse(JSON.stringify(prev));

      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function resetAll() {
    resetState();
    setStep(SECTION.JOB);
    setAnalysis(null);
    toast({ title: "초기화 완료", description: "입력값을 기본값으로 되돌렸습니다." });
  }

  function runAnalysis() {
    const hypotheses = buildHypotheses(state);
    const report = buildReport(state);

    const keywordSignals = buildKeywordSignals(state.jd, state.resume);
    const careerSignals = buildCareerSignals(state.career, state.jd);

    setAnalysis({
      hypotheses,
      report,
      keywordSignals,
      careerSignals,
      at: new Date().toISOString(),
    });

    toast({ title: "분석 완료", description: "리포트를 생성했습니다." });
  }

  async function copyReport() {
    try {
      if (!analysis?.report) throw new Error("no report");
      await navigator.clipboard.writeText(analysis.report);
      toast({ title: "복사 완료", description: "리포트가 클립보드에 복사됐습니다." });
    } catch {
      toast({ title: "복사 실패", description: "브라우저 권한을 확인해 주세요.", variant: "destructive" });
    }
  }

  function downloadReport() {
    try {
      if (!analysis?.report) throw new Error("no report");
      const blob = new Blob([analysis.report], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reject_report_${(state.company || "company").replaceAll(" ", "_")}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "다운로드 시작", description: "텍스트 파일로 저장됩니다." });
    } catch {
      toast({ title: "다운로드 실패", variant: "destructive" });
    }
  }

  function goTo(nextId) {
    setStep(nextId);
    if (nextId === SECTION.RESULT) {
      setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  }

  return (
    <TooltipProvider delayDuration={120}>
      <Shell>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
                <Lock className="h-4 w-4" />
                기본값: 입력 데이터는 브라우저(로컬)에만 저장됩니다
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                탈락 원인 분석기 <span className="text-muted-foreground">(v3)</span>
              </h1>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                단정하지 않고, <span className="text-foreground font-medium">가설을 우선순위</span>로 정리해 실행 액션까지 뽑습니다.
                <span className="block">분석은 typing 중 자동 실행하지 않고, 버튼 클릭 시에만 실행됩니다.</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={resetAll} className="rounded-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    초기화
                  </Button>
                </TooltipTrigger>
                <TooltipContent>로컬 저장값도 덮어씁니다</TooltipContent>
              </Tooltip>

              <Button
                onClick={() => {
                  runAnalysis();
                  goTo(SECTION.RESULT);
                }}
                className="rounded-full shadow-sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                분석하기
              </Button>
            </div>
          </div>

          {/* Stepper */}
          <Card className="overflow-hidden bg-background/70 backdrop-blur">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <CardTitle className="text-base">진행 상태</CardTitle>
                  <div className="text-xs text-muted-foreground">입력값이 많을수록 가설 품질이 올라갑니다</div>
                </div>
                <div className="w-full md:w-[360px]">
                  <Progress value={progress} className="h-2" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progress)}%</span>
                    <span>
                      {idx + 1} / {ORDER.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {nav.map((n) => (
                  <StepPill
                    key={n.id}
                    active={step === n.id}
                    done={ORDER.indexOf(n.id) < idx}
                    icon={n.icon}
                    label={n.label}
                    onClick={() => setStep(n.id)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                {/* JOB */}
                {step === SECTION.JOB && (
                  <motion.div key="job" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">기본 정보</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm font-medium">회사명</div>
                            <Input value={state.company} onChange={(e) => set("company", e.target.value)} placeholder="예: 삼성전자" className="rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">포지션</div>
                            <Input value={state.role} onChange={(e) => set("role", e.target.value)} placeholder="예: 구매 / PM / 데이터분석" className="rounded-xl" />
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">탈락 단계</div>
                            <Select value={state.stage} onValueChange={(v) => set("stage", v)}>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {["서류", "1차 면접", "1차+2차 면접", "최종 면접", "오퍼 직전/협상", "기타"].map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="text-sm font-medium">지원일 (선택)</div>
                            <Input type="date" value={state.applyDate || ""} onChange={(e) => set("applyDate", e.target.value)} className="rounded-xl" />
                          </div>
                        </div>

                        {/* NEW: career inputs */}
                        <Card className="rounded-2xl bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">경력 정보 (분석 핵심)</CardTitle>
                            <div className="text-xs text-muted-foreground">공백/이직/근속은 리스크 가설에 직접 반영됩니다</div>
                          </CardHeader>
                          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="text-sm font-medium">총 경력 연차 (년)</div>
                              <Input
                                type="number"
                                min={0}
                                max={60}
                                value={state.career.totalYears}
                                onChange={(e) => set("career.totalYears", Number(e.target.value || 0))}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">최근 공백기 (개월)</div>
                              <Input
                                type="number"
                                min={0}
                                max={240}
                                value={state.career.gapMonths}
                                onChange={(e) => set("career.gapMonths", Number(e.target.value || 0))}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">총 이직 횟수</div>
                              <Input
                                type="number"
                                min={0}
                                max={60}
                                value={state.career.jobChanges}
                                onChange={(e) => set("career.jobChanges", Number(e.target.value || 0))}
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm font-medium">직전 회사 근속 (개월)</div>
                              <Input
                                type="number"
                                min={0}
                                max={600}
                                value={state.career.lastTenureMonths}
                                onChange={(e) => set("career.lastTenureMonths", Number(e.target.value || 0))}
                                className="rounded-xl"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium">JD(채용공고) 핵심 문장</div>
                              <Badge variant="outline" className="text-xs">가능하면 그대로</Badge>
                            </div>
                            <Textarea value={state.jd} onChange={(e) => set("jd", e.target.value)} placeholder="필수/우대 요건과 주요 업무 문장을 붙여넣어 주세요" className="rounded-xl min-h-[180px]" />
                          </div>

                          <Card className="rounded-2xl bg-muted/30 border-dashed">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">자가진단(1~5)</CardTitle>
                              <div className="text-xs text-muted-foreground">분석은 객관 지표 중심. 자가진단은 보조 신호로만 씁니다.</div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <SliderRow label="핵심요건 핏" value={state.selfCheck.coreFit} onChange={(v) => set("selfCheck.coreFit", v)} hint="JD 필수요건을 충족하는 정도" />
                              <SliderRow label="증거 강도" value={state.selfCheck.proofStrength} onChange={(v) => set("selfCheck.proofStrength", v)} hint="수치/전후/검증/결과물이 있는 정도" />
                              <SliderRow label="역할 명확성" value={state.selfCheck.roleClarity} onChange={(v) => set("selfCheck.roleClarity", v)} hint="내가 어떤 문제를 잘 푸는지 선명한가" />
                              <SliderRow label="스토리 일관성" value={state.selfCheck.storyConsistency} onChange={(v) => set("selfCheck.storyConsistency", v)} hint="이직사유↔지원사유↔경험이 한 줄로 이어지는가" />
                              <SliderRow label="리스크 신호" value={state.selfCheck.riskSignals} onChange={(v) => set("selfCheck.riskSignals", v)} hint="공백/잦은 이직/조건 제약/커뮤니케이션 흔들림 등" />

                              <RadarSelfCheck selfCheck={state.selfCheck} />
                            </CardContent>
                          </Card>
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" disabled>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.RESUME)}>
                            다음
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* RESUME */}
                {step === SECTION.RESUME && (
                  <motion.div key="resume" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">서류 입력</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">이력서 핵심 문장(요약/경험 일부)</div>
                          <Textarea value={state.resume} onChange={(e) => set("resume", e.target.value)} placeholder="헤더/요약/대표 경험 2~3개 문장을 붙여 넣어 주세요" className="rounded-xl min-h-[220px]" />
                        </div>

                        <div className="space-y-2">
                          <div className="text-sm font-medium">포트폴리오/성과물(링크/설명)</div>
                          <Textarea value={state.portfolio} onChange={(e) => set("portfolio", e.target.value)} placeholder="링크 또는 무엇을 담았는지 요약 (없으면 비워도 됩니다)" className="rounded-xl min-h-[120px]" />
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.JOB)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.INTERVIEW)}>
                            다음
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* INTERVIEW */}
                {step === SECTION.INTERVIEW && (
                  <motion.div key="interview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card className="bg-background/70 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="text-lg">면접 입력</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium">면접 질문/답변 메모</div>
                          <Textarea value={state.interviewNotes} onChange={(e) => set("interviewNotes", e.target.value)} placeholder="기억나는 질문, 내가 한 답변의 핵심, 면접관 반응 등을 적어 주세요" className="rounded-xl min-h-[260px]" />
                        </div>

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.RESUME)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={() => {
                              runAnalysis();
                              setStep(SECTION.RESULT);
                            }}
                          >
                            분석하기
                            <Sparkles className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* RESULT */}
                {step === SECTION.RESULT && (
                  <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <Card ref={reportRef} className="bg-background/70 backdrop-blur">
                      <CardHeader className="space-y-3">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <CardTitle className="text-lg">분석 리포트</CardTitle>
                            <div className="text-xs text-muted-foreground mt-1">
                              이 결과는 <span className="text-foreground font-medium">가설</span>입니다. 내부 기준/경쟁자/예산/타이밍으로 달라질 수 있어요.
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="outline" className="rounded-full" onClick={copyReport} disabled={!analysis?.report}>
                              <Clipboard className="h-4 w-4 mr-2" />
                              복사
                            </Button>
                            <Button className="rounded-full" onClick={downloadReport} disabled={!analysis?.report}>
                              <Download className="h-4 w-4 mr-2" />
                              다운로드
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">단정 금지</Badge>
                          <Badge variant="outline">객관 스코어 기반</Badge>
                          <Badge variant="outline">가설→근거→액션</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {!analysis ? (
                          <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
                            아직 분석이 실행되지 않았습니다. 상단 또는 면접 단계에서 <b>분석하기</b>를 눌러 주세요.
                          </div>
                        ) : (
                          <>
                            <Card className="rounded-2xl bg-muted/20">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">핵심 객관 신호</CardTitle>
                              </CardHeader>
                              <CardContent className="text-sm space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  <Badge variant="outline">키워드 매칭 {Math.round((analysis.keywordSignals?.matchScore ?? 0) * 100)}/100</Badge>
                                  <Badge variant="outline">공백 {state.career.gapMonths}개월</Badge>
                                  <Badge variant="outline">이직 {state.career.jobChanges}회</Badge>
                                  <Badge variant="outline">직전근속 {state.career.lastTenureMonths}개월</Badge>
                                </div>
                                {analysis.keywordSignals?.missingKeywords?.length ? (
                                  <div className="text-xs text-muted-foreground">
                                    누락 키워드(상위): {analysis.keywordSignals.missingKeywords.slice(0, 8).join(", ")}
                                  </div>
                                ) : null}
                              </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 gap-4">
                              <AnimatePresence>
                                {analysis.hypotheses.map((h) => (
                                  <HypothesisCard key={h.id} h={h} />
                                ))}
                              </AnimatePresence>
                            </div>

                            <Separator />

                            <Card className="rounded-2xl">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-base">텍스트 리포트</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ScrollArea className="h-[320px] rounded-xl border bg-muted/30 p-4">
                                  <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-mono">
                                    {analysis.report}
                                  </pre>
                                </ScrollArea>
                              </CardContent>
                            </Card>
                          </>
                        )}

                        <div className="flex items-center justify-between">
                          <Button variant="outline" className="rounded-full" onClick={() => setStep(SECTION.INTERVIEW)}>
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            이전
                          </Button>
                          <Button className="rounded-full" onClick={() => setStep(SECTION.JOB)}>
                            새 입력
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right sticky summary */}
            <div className="space-y-6">
              <Card className="bg-background/70 backdrop-blur lg:sticky lg:top-6">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base">현재 입력 요약</CardTitle>
                  <div className="text-xs text-muted-foreground">필요한 만큼만 채워도 됩니다</div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">회사</span>
                    <span className="font-medium">{state.company || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">포지션</span>
                    <span className="font-medium">{state.role || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">단계</span>
                    <span className="font-medium">{state.stage}</span>
                  </div>

                  <Separator />

                  <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Lock className="h-4 w-4" />
                      개인정보/법적 주의
                    </div>
                    <div className="mt-1">
                      기본값은 로컬 저장만 사용합니다. 실제 배포 시에는 개인정보처리방침/이용약관/수집항목 최소화/보관기간·파기 등은 별도 정리하세요.
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="rounded-full w-full"
                      onClick={() => {
                        runAnalysis();
                        goTo(SECTION.RESULT);
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      분석하기
                    </Button>

                    <Button
                      className="rounded-full w-full"
                      onClick={() => {
                        const next = canNext ? ORDER[idx + 1] : SECTION.RESULT;
                        setStep(next);
                      }}
                    >
                      다음
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">기록 메모</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-foreground/90 leading-relaxed">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>분석은 자동 실행하지 않고 “분석하기” 버튼으로만 실행됨(성능/UX 목적)</li>
                    <li>signals/noticeDate/assessment 제거됨 → v2 로컬데이터는 마이그레이션됨</li>
                    <li>selfCheck는 confidence 보정만 함(객관 지표: 키워드/경력/증거/연차 적합도 중심)</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            ⓘ 구현 메모: 현재는 규칙 기반 추정입니다. 원하시면 업종/직무별 룰셋 확장, 키워드 사전/동의어, 점수 calibration, 상담 전환 퍼널까지 고도화 가능합니다.
          </div>
        </motion.div>
      </Shell>
    </TooltipProvider>
  );
}
