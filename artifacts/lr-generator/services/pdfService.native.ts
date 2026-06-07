export { generateLRHtml } from "./pdfHtml";

import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { LRRecord } from "../context/LRContext";

const MLTC_DIR = (FileSystem.documentDirectory ?? "") + "MLTC_LRs/";

async function ensureMltcDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MLTC_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MLTC_DIR, { intermediates: true });
  }
}

function safeName(lrNo: string): string {
  return lrNo.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export async function generatePDF(lr: LRRecord): Promise<string> {
  const { generateLRHtml } = await import("./pdfHtml");
  const html = generateLRHtml(lr);
  const { uri: tempUri } = await Print.printToFileAsync({ html, base64: false });

  await ensureMltcDir();
  const destUri = MLTC_DIR + `${safeName(lr.lrNo)}.pdf`;
  await FileSystem.copyAsync({ from: tempUri, to: destUri });
  return destUri;
}

export async function saveToDownloads(uri: string): Promise<void> {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status === "granted") {
      await MediaLibrary.saveToLibraryAsync(uri);
    }
  } catch {}
}

export async function sharePDF(uri: string, lrNo: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: `Share LR ${lrNo}`,
      UTI: "com.adobe.pdf",
    });
  }
}

export async function shareToWhatsApp(uri: string, lrNo: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) return;
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    dialogTitle: `Send ${lrNo} via WhatsApp`,
    UTI: "com.adobe.pdf",
  });
}

export async function getPDFBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}
