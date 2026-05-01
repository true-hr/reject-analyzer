import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TransitionLitePdfHtmlDocument from "@/components/pdf/TransitionLitePdfHtmlDocument";
import { buildTransitionLitePdfModel } from "@/lib/pdf/buildTransitionLitePdfModel.js";

function toStr(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeFileNamePart(value) {
  return toStr(value)
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function buildFileName(model) {
  const datePart = toStr(model?.generatedAt).replace(/\./g, "") || "report";
  const typePart = sanitizeFileNamePart(model?.reportType) || "transition-lite";
  const rolePart = sanitizeFileNamePart(model?.referenceReads?.targetJobRead?.title) || "report";
  return `passmap-transition-lite-${typePart}-${rolePart}-${datePart}.pdf`;
}

function logPdfShapeDebug(model) {
  const debug =
    model?.__pdfDebug && typeof model.__pdfDebug === "object"
      ? model.__pdfDebug
      : null;

  if (!debug) return;

  if (Array.isArray(debug.droppedFields) && debug.droppedFields.length > 0) {
    console.warn("[transition-lite-pdf] normalized non-text fields", {
      inputShape: debug.inputShape,
      droppedFields: debug.droppedFields,
    });
  }
}

function buildPrintableHtml({ model, fileName }) {
  const bodyMarkup = renderToStaticMarkup(
    React.createElement(TransitionLitePdfHtmlDocument, { model })
  );

  return [
    "<!doctype html>",
    "<html lang=\"ko\">",
    "<head>",
    "  <meta charset=\"utf-8\" />",
    "  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />",
    `  <title>${fileName}</title>`,
    "  <style>",
    "    html, body { margin: 0; padding: 0; background: #f8fafc; }",
    "    * { box-sizing: border-box; }",
    "    @page { size: A4; margin: 14mm; }",
    "    @media print {",
    "      html, body { background: #ffffff; }",
    "    }",
    "  </style>",
    "</head>",
    `<body>${bodyMarkup}</body>`,
    "</html>",
  ].join("\n");
}

function openPrintWindow(html, fileName) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("pdf_runtime_unavailable");
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    throw new Error("pdf_print_window_blocked");
  }

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.document.title = fileName;

  const triggerPrint = () => {
    printWindow.focus();
    printWindow.print();
  };

  if (printWindow.document.readyState === "complete") {
    window.setTimeout(triggerPrint, 50);
  } else {
    printWindow.addEventListener("load", () => {
      window.setTimeout(triggerPrint, 50);
    }, { once: true });
  }

  return printWindow;
}

export async function downloadTransitionLitePdf(viewModel, { onFallback } = {}) {
  try {
    const model = buildTransitionLitePdfModel(viewModel);
    logPdfShapeDebug(model);
    const fileName = buildFileName(model);
    const html = buildPrintableHtml({ model, fileName });
    const printWindow = openPrintWindow(html, fileName);

    return {
      ok: true,
      fileName,
      model,
      runtime: "html-print",
      printWindow,
    };
  } catch (error) {
    console.error("[transition-lite-pdf] download failed", error);
    if (typeof onFallback === "function") {
      onFallback(error);
    }
    return {
      ok: false,
      error,
      runtime: "fallback",
    };
  }
}

export default downloadTransitionLitePdf;
