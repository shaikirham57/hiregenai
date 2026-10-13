/**
 * Extracts plain text from a resume file in the browser, so only the text (not
 * the file) is sent to the API. The PDF and DOCX parsers are loaded on demand.
 */

// Enough for any real resume while staying well under the API's JSON body limit.
const MAX_TEXT_LENGTH = 50000;

export class ResumeReadError extends Error {}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    // Rebuild line breaks from pdf.js text items so headings and the name stay on their own lines.
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

async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export async function extractResumeText(file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  let text: string;
  try {
    if (ext === "pdf") text = await extractPdfText(file);
    else if (ext === "docx") text = await extractDocxText(file);
    else if (ext === "doc") {
      throw new ResumeReadError("Older .doc files can't be read. Save the resume as PDF or DOCX and upload it again.");
    } else throw new ResumeReadError("Unsupported file type. Please upload a PDF or DOCX resume.");
  } catch (err) {
    if (err instanceof ResumeReadError) throw err;
    throw new ResumeReadError("This file couldn't be opened. It may be damaged or password-protected.");
  }

  const cleaned = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 50) {
    throw new ResumeReadError("No readable text found. If this is a scanned image, upload a text-based PDF or DOCX.");
  }
  return cleaned.slice(0, MAX_TEXT_LENGTH);
}
