/// <reference path="../types/pdfjs-worker.d.ts" />
/**
 * Server-side checks and text extraction for uploaded resume files.
 * The text is extracted here (not trusted from the browser) so screening
 * results always reflect the file the recruiter can open.
 */
import mammoth from "mammoth";

export const MAX_RESUME_BYTES = 4 * 1024 * 1024; // Vercel functions accept request bodies up to ~4.5 MB.
const MAX_TEXT_LENGTH = 50000;

export const RESUME_MIME_TYPES = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export type ResumeKind = keyof typeof RESUME_MIME_TYPES;

export class ResumeFileError extends Error {}

/** Identifies the file by its content, not just its name, so renamed files can't slip through. */
export function detectResumeKind(fileName: string, data: Buffer): ResumeKind {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "doc") throw new ResumeFileError("Older .doc files can't be read. Save the resume as PDF or DOCX and upload it again.");
  const isPdf = data.subarray(0, 5).toString("latin1") === "%PDF-";
  const isZip = data[0] === 0x50 && data[1] === 0x4b; // DOCX files are ZIP archives ("PK").
  if (ext === "pdf" && isPdf) return "pdf";
  if (ext === "docx" && isZip) return "docx";
  throw new ResumeFileError("This file isn't a valid PDF or DOCX resume.");
}

async function extractPdfText(data: Buffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Registering the worker module in-process avoids pdf.js loading it from a
  // relative path at runtime, which a serverless bundle can't resolve.
  const worker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  (globalThis as { pdfjsWorker?: unknown }).pdfjsWorker = worker;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data), isEvalSupported: false, verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const content = await (await pdf.getPage(n)).getTextContent();
    let line = "";
    const lines: string[] = [];
    for (const item of content.items) {
      if (!("str" in item)) continue;
      line += item.str;
      if (item.hasEOL) {
        lines.push(line);
        line = "";
      } else if (item.str && !item.str.endsWith(" ")) {
        line += " ";
      }
    }
    if (line.trim()) lines.push(line);
    pages.push(lines.join("\n"));
  }
  await pdf.destroy();
  return pages.join("\n");
}

export async function extractResumeText(kind: ResumeKind, data: Buffer): Promise<string> {
  let text: string;
  try {
    text = kind === "pdf" ? await extractPdfText(data) : (await mammoth.extractRawText({ buffer: data })).value;
  } catch {
    throw new ResumeFileError("This file couldn't be opened. It may be damaged or password-protected.");
  }
  const cleaned = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 50) {
    throw new ResumeFileError("No readable text found. If this is a scanned image, upload a text-based PDF or DOCX.");
  }
  return cleaned.slice(0, MAX_TEXT_LENGTH);
}
