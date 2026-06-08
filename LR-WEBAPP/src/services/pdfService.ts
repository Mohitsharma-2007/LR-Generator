import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { generateLRHtml } from "./pdfHtml";
import type { LRRecord } from "../context/LRContext";
import logoUrl from "../assets/logo/maha_laxmi.png";

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

  // Create container off-screen
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "750px"; // Fixed width to ensure stable print sizing
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    // Wait for images to load if any
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

    const canvas = await html2canvas(container, {
      scale: 2, // Retain sharp details
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    
    // A4 dimensions: 210mm x 297mm
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 10; // 10mm margins on all sides
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const usableWidth = pdfWidth - (margin * 2);
    const usableHeight = pdfHeight - (margin * 2);
    
    const imgWidth = usableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Scale to fit on A4 page with margins
    pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, Math.min(imgHeight, usableHeight));
    
    return pdf.output("blob");
  } finally {
    document.body.removeChild(container);
  }
}

export async function generatePDF(lr: LRRecord): Promise<string> {
  const blob = await generatePDFBlob(lr);
  return URL.createObjectURL(blob);
}

export async function saveToDownloads(blob: Blob, lrNo: string): Promise<void> {
  try {
    const cleanName = lrNo.replace(/[^a-zA-Z0-9-_]/g, "_");
    
    // Check if we are running in Capacitor and use Filesystem plugin if available
    const cap = (window as any).Capacitor;
    if (cap && cap.Plugins && cap.Plugins.Filesystem) {
      const base64 = await getPDFBase64(blob);
      await cap.Plugins.Filesystem.writeFile({
        path: `LR/${cleanName}.pdf`,
        data: base64,
        directory: "Documents",
        recursive: true
      });
      return;
    }

    // Web download logic
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Suggest saving it inside the 'LR' folder in Downloads
    link.download = `LR/${cleanName}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Failed to save file locally:", err);
  }
}

export async function sharePDF(blob: Blob, lrNo: string): Promise<void> {
  const file = new File([blob], `${lrNo}.pdf`, { type: "application/pdf" });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `LR ${lrNo}`,
        text: `Lorry Receipt ${lrNo} from Maha Laxmi Transport Co.`,
      });
    } catch (err) {
      // User cancelled share or unsupported
      console.warn("Share failed, falling back to download:", err);
      await saveToDownloads(blob, lrNo);
    }
  } else {
    // Fallback to direct download
    await saveToDownloads(blob, lrNo);
  }
}

export async function shareToWhatsApp(blob: Blob, lrNo: string): Promise<void> {
  // First download the file so the user has it ready
  await saveToDownloads(blob, lrNo);
  
  // Launch WhatsApp with context text
  const text = encodeURIComponent(`Please find attached Lorry Receipt ${lrNo} for reference.`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
}

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
