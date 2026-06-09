import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { generateLRHtml } from "./pdfHtml";
import type { LRRecord } from "../context/LRContext";
import logoUrl from "../assets/logo/maha_laxmi.png";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

// Load base64 of the local logo so it renders correctly in html2canvas
async function loadLogoBase64(): Promise<string> {
  try {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export async function generatePDFBlob(lr: LRRecord): Promise<Blob> {
  const logoBase64 = await loadLogoBase64();
  const html = generateLRHtml(lr, logoBase64);

  // Create container that is invisible but still layout-rendered by html2canvas.
  // Using visibility:hidden + opacity:0 ensures no flash on Android WebView.
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.width = "750px";
  container.style.zIndex = "-9999";
  container.style.opacity = "0";
  container.style.pointerEvents = "none";
  container.style.overflow = "hidden";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait for images to load
    const images = container.getElementsByTagName("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = () => resolve();
              img.onerror = () => resolve();
            }
          })
      )
    );

    // Briefly make it visible for html2canvas (it needs computed styles)
    container.style.visibility = "visible";
    container.style.opacity = "1";

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Immediately hide again
    container.style.opacity = "0";

    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      margin,
      imgWidth,
      Math.min(imgHeight, usableHeight)
    );

    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

export async function generatePDF(lr: LRRecord): Promise<string> {
  const blob = await generatePDFBlob(lr);
  return URL.createObjectURL(blob);
}

// Convert Blob to base64 string (without the data URI prefix)
export async function getPDFBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.substring(result.indexOf(",") + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Save PDF to the LR/ folder.
 * On native (Capacitor): uses Filesystem plugin to write to Documents/LR/
 * On web: triggers browser download
 */
export async function saveToDownloads(
  blob: Blob,
  lrNo: string
): Promise<string | void> {
  const cleanName = lrNo.replace(/[^a-zA-Z0-9-_]/g, "_");
  const filename = `${cleanName}.pdf`;
  const path = `LR/${filename}`;

  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await getPDFBase64(blob);
      const result = await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });
      return result.uri;
    } catch (err) {
      console.error("Filesystem.writeFile failed:", err);
      // Fallback to web download
      webDownload(blob, filename);
    }
  } else {
    webDownload(blob, filename);
  }
}

function webDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Share PDF via native share sheet (which includes WhatsApp, Email, etc.)
 * On native: saves to temp, then uses Capacitor Share plugin
 * On web: uses Web Share API fallback
 */
export async function sharePDF(blob: Blob, lrNo: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await nativeSharePDF(blob, lrNo);
  } else {
    // Web Share API fallback
    const file = new File([blob], `${lrNo}.pdf`, { type: "application/pdf" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `LR ${lrNo}`,
          text: `Lorry Receipt ${lrNo} from Maha Laxmi Transport Co.`,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }
    // Final fallback: download
    await saveToDownloads(blob, lrNo);
  }
}

/**
 * Share PDF via WhatsApp specifically.
 * On native: saves PDF then opens native share sheet (user picks WhatsApp)
 * On web: downloads PDF then opens WhatsApp web link with text
 */
export async function shareToWhatsApp(
  blob: Blob,
  lrNo: string
): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    // On native, the share sheet lets the user pick WhatsApp directly
    await nativeSharePDF(blob, lrNo);
  } else {
    // Web: download the file first, then open WhatsApp with text
    await saveToDownloads(blob, lrNo);
    const text = encodeURIComponent(
      `Please find attached Lorry Receipt ${lrNo} for reference.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  }
}

/**
 * Internal: save PDF to cache directory and invoke native Share intent
 */
async function nativeSharePDF(blob: Blob, lrNo: string): Promise<void> {
  const cleanName = lrNo.replace(/[^a-zA-Z0-9-_]/g, "_");
  const base64 = await getPDFBase64(blob);

  // Write to cache so it's accessible to the share intent
  const writeResult = await Filesystem.writeFile({
    path: `share_${cleanName}.pdf`,
    data: base64,
    directory: Directory.Cache,
    recursive: true,
  });

  await Share.share({
    title: `LR ${lrNo}`,
    text: `Lorry Receipt ${lrNo} from Maha Laxmi Transport Co.`,
    url: writeResult.uri,
    dialogTitle: `Share ${lrNo}`,
  });
}
