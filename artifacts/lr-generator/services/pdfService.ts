export { generateLRHtml } from "./pdfHtml";
import type { LRRecord } from "../context/LRContext";

export async function generatePDF(_lr: LRRecord): Promise<string> {
  return "";
}

export async function saveToDownloads(_uri: string): Promise<void> {}

export async function sharePDF(_uri: string, _lrNo: string): Promise<void> {}

export async function shareToWhatsApp(
  _uri: string,
  _lrNo: string
): Promise<void> {}

export async function getPDFBase64(_uri: string): Promise<string> {
  return "";
}
