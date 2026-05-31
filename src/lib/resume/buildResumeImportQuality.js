import { detectResumeSections } from "./detectResumeSections.js";

const LABEL_BY_LEVEL = {
  high: "좋음",
  medium: "검토 필요",
  low: "보완 필요",
  failed: "다시 업로드 권장",
};

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function levelFromScore(score, ok) {
  if (!ok && score < 50) return "failed";
  if (score >= 85) return "high";
  if (score >= 70) return "medium";
  if (score >= 50) return "low";
  return ok ? "low" : "failed";
}

function issue(code, severity, message, suggestion) {
  return { code, severity, message, suggestion };
}

function estimateLayoutHints(text, meta) {
  const value = String(text || "");
  const lines = value.split(/\n/);
  const nonEmpty = lines.map((line) => line.trim()).filter(Boolean);
  const longLines = nonEmpty.filter((line) => line.length >= 120).length;
  const tabularLines = nonEmpty.filter((line) => {
    const spaces = String(line).match(/\s{3,}/g);
    return (spaces || []).length >= 2 || /\t/.test(line);
  }).length;
  const doubleSpaceCount = (value.match(/[^\n]\s{2,}[^\n]/g) || []).length;
  const pageCount = Number(meta?.pages || meta?.pageCount || 0);
  const charCount = Number(meta?.charCount || value.length || 0);
  const scannedPdfSuspected =
    String(meta?.extractBranch || "").includes("pdf") &&
    ((pageCount >= 2 && charCount < 350) || (pageCount >= 1 && charCount === 0));

  return {
    scannedPdfSuspected,
    shortTextRisk: charCount > 0 && charCount < 500,
    tableStructureRisk: tabularLines >= 3,
    twoColumnRisk: longLines >= 5 || doubleSpaceCount >= 15,
    lineBreakQuality: nonEmpty.length >= 8 ? "ok" : (charCount >= 500 ? "sparse" : "weak"),
    spacingQuality: doubleSpaceCount >= 15 ? "risky" : "ok",
    pageCount,
  };
}

function buildSectionSummary(detected) {
  const sections = detected?.sections || {};
  const readable = [
    ["experience", "경력"],
    ["education", "학력"],
    ["projects", "프로젝트"],
    ["skills", "스킬"],
    ["certificates", "자격증"],
    ["awardsAndActivities", "수상/활동"],
    ["contact", "연락처"],
    ["summary", "요약"],
  ];
  const detectedLabels = readable.filter(([key]) => sections[key]?.detected).map(([, label]) => label);
  const missingLabels = readable.filter(([key]) => !sections[key]?.detected).map(([, label]) => label);

  return {
    sections,
    detected: detectedLabels,
    missing: missingLabels,
    counts: detected?.counts || {},
    samples: {
      dateRanges: (detected?.dateRanges || []).slice(0, 5),
      bulletLikeLines: (detected?.bulletLikeLines || []).slice(0, 5),
      metricLines: (detected?.metricLines || []).slice(0, 5),
      weakBulletLines: (detected?.weakBulletLines || []).slice(0, 5),
    },
  };
}

export function buildResumeImportQuality({ text = "", meta = {}, kind = "resume", ok = true } = {}) {
  const normalizedText = String(text || "");
  const charCount = Number(meta?.charCount || normalizedText.length || 0);
  const detected = detectResumeSections(normalizedText);
  const sectionSummary = buildSectionSummary(detected);
  const layoutHints = estimateLayoutHints(normalizedText, meta);
  const warnings = Array.isArray(meta?.warnings) ? meta.warnings.filter(Boolean) : [];
  const detectedIssues = [];
  let score = ok ? 92 : 20;

  if (!ok) {
    detectedIssues.push(issue(
      "extract_failed",
      "critical",
      "파일에서 텍스트를 안정적으로 읽지 못했습니다.",
      "DOCX 또는 TXT로 다시 업로드하거나 내용을 직접 붙여넣어 주세요."
    ));
  }

  if (charCount === 0) {
    score -= 50;
  } else if (charCount < 200) {
    score -= 35;
    detectedIssues.push(issue(
      "very_short_text",
      "critical",
      "추출된 텍스트가 매우 짧습니다.",
      "원본 파일이 스캔본인지 확인하고 DOCX/TXT 또는 복사 붙여넣기를 사용해 주세요."
    ));
  } else if (charCount < 500) {
    score -= 20;
    detectedIssues.push(issue(
      "short_text",
      "warning",
      "추출된 텍스트가 짧아 일부 경력 정보가 누락됐을 수 있습니다.",
      "미리보기에서 경력, 프로젝트, 학력, 스킬이 모두 보이는지 확인해 주세요."
    ));
  }

  const missing = sectionSummary.missing || [];
  const importantMissing = missing.filter((label) => ["경력", "학력", "프로젝트", "스킬", "연락처"].includes(label));
  if (String(kind || "resume") === "resume" && importantMissing.length) {
    score -= Math.min(24, importantMissing.length * 6);
    detectedIssues.push(issue(
      "missing_resume_sections",
      importantMissing.length >= 3 ? "warning" : "info",
      `감지되지 않은 주요 항목: ${importantMissing.join(", ")}`,
      "검수 화면에서 누락 항목을 확인하거나 원본 파일의 제목/섹션명을 보강해 주세요."
    ));
  }

  if (sectionSummary.counts.dateRanges === 0 && String(kind || "resume") === "resume") {
    score -= 8;
    detectedIssues.push(issue(
      "missing_date_ranges",
      "warning",
      "기간 정보가 감지되지 않았습니다.",
      "회사/프로젝트별 재직 기간이나 수행 기간을 확인해 주세요."
    ));
  }

  if (sectionSummary.counts.metricLines === 0 && String(kind || "resume") === "resume") {
    score -= 8;
    detectedIssues.push(issue(
      "missing_metrics",
      "info",
      "성과 수치가 거의 감지되지 않았습니다.",
      "증가율, 절감액, 처리 건수처럼 결과를 보여주는 수치를 보강해 주세요."
    ));
  }

  if (sectionSummary.counts.weakBulletLines >= 4) {
    score -= 6;
    detectedIssues.push(issue(
      "weak_bullet_lines",
      "info",
      "담당/수행 중심 문장이 많고 결과 표현이 부족할 수 있습니다.",
      "핵심 문장에 결과, 규모, 수치를 함께 적었는지 확인해 주세요."
    ));
  }

  if (layoutHints.scannedPdfSuspected) {
    score -= 30;
    detectedIssues.push(issue(
      "scanned_pdf_suspected",
      "critical",
      "스캔 PDF로 보여 텍스트가 충분히 추출되지 않았을 수 있습니다.",
      "선택 가능한 텍스트가 있는 PDF, DOCX, TXT로 다시 업로드하거나 내용을 붙여넣어 주세요."
    ));
  }
  if (layoutHints.tableStructureRisk) {
    score -= 7;
    detectedIssues.push(issue(
      "table_structure_risk",
      "warning",
      "표 형태 이력서의 줄 순서가 깨졌을 가능성이 있습니다.",
      "미리보기에서 회사명, 기간, 역할이 같은 행으로 읽혔는지 확인해 주세요."
    ));
  }
  if (layoutHints.twoColumnRisk) {
    score -= 7;
    detectedIssues.push(issue(
      "two_column_risk",
      "warning",
      "2단 또는 복잡한 PDF 레이아웃이 섞였을 가능성이 있습니다.",
      "DOCX로 다시 업로드하거나 추출 미리보기에서 문장 순서를 확인해 주세요."
    ));
  }

  if (warnings.length) {
    score -= Math.min(12, warnings.length * 3);
  }

  const finalScore = clampScore(score);
  const level = levelFromScore(finalScore, ok);
  const statusLabel = LABEL_BY_LEVEL[level];
  const summary =
    level === "high"
      ? "핵심 이력서 항목이 안정적으로 읽혔습니다."
      : level === "medium"
        ? "대부분 읽혔지만 검수할 항목이 있습니다."
        : level === "low"
          ? "일부 항목이 누락되거나 레이아웃 위험이 있습니다."
          : "다시 업로드하거나 직접 붙여넣는 것이 좋습니다.";

  return {
    extractionQuality: {
      score: finalScore,
      level,
      statusLabel,
      summary,
      warnings,
      detectedIssues,
    },
    sectionSummary,
    layoutHints,
  };
}

export default buildResumeImportQuality;
