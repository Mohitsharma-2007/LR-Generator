export { generateLRHtml } from "./pdfHtml";

import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { LRRecord } from "../context/LRContext";
import { generateLRHtml } from "./pdfHtml";

const MLTC_DIR = (FileSystem.documentDirectory ?? "") + "MLTC_LRs/";

async function ensureMltcDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MLTC_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MLTC_DIR, { intermediates: true });
  }
}

async function loadLogoBase64(): Promise<string | undefined> {
  try {
    const asset = Asset.fromModule(
      require("../assets/logo/maha_laxmi.png") as number
    );
    await asset.downloadAsync();
    if (!asset.localUri) return undefined;
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return undefined;
  }
}

function safeName(lrNo: string): string {
  return lrNo.replace(/[^a-zA-Z0-9-_]/g, "_");
}

export async function generatePDF(lr: LRRecord): Promise<string> {
  const logoDataUri = await loadLogoBase64();
  const html = generateLRHtml(lr, logoDataUri);
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

export async function shareToWhatsApp(
  uri: string,
  lrNo: string
): Promise<void> {
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
