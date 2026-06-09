import { useState } from "react";
import { useLocation, useParams } from "wouter";
import * as Icons from "lucide-react";
import { useLR, type LRRecord } from "../context/LRContext";
import { LRReceiptPreview } from "../components/LRReceiptPreview";
import {
  generatePDFBlob,
  saveToDownloads,
  sharePDF,
  shareToWhatsApp,
} from "../services/pdfService";
import { showNotification } from "../services/notificationService";
import { triggerHaptic } from "../services/hapticsService";


export default function PreviewLR() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getLRById } = useLR();

  const lr = getLRById(id || "");
  const [generatingPDF, setGeneratingPDF] = useState(false);

  if (!lr) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "80vh",
          gap: "12px",
        }}
      >
        <Icons.File size={40} style={{ color: "var(--text-muted)" }} />
        <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>
          LR not found
        </span>
        <button
          onClick={() => setLocation("/lrs")}
          className="btn-primary"
          style={{ padding: "10px 20px" }}
        >
          Go back
        </button>
      </div>
    );
  }

  const lrData = lr as LRRecord;

  // Local Save (Download) PDF
  async function handleSaveLocal() {
    triggerHaptic("light");
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await saveToDownloads(blob, lrData.lrNo);
      triggerHaptic("success");
      showNotification("PDF Saved", `${lrData.lrNo}.pdf saved to LR/ folder`);
    } catch (err) {
      triggerHaptic("error");
      alert("Failed to generate PDF: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Share via web share API
  async function handleShare() {
    triggerHaptic("light");
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await sharePDF(blob, lrData.lrNo);
      triggerHaptic("success");
    } catch (err) {
      triggerHaptic("error");
      alert("Failed to share PDF: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  // WhatsApp sharing
  async function handleWhatsApp() {
    triggerHaptic("light");
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await shareToWhatsApp(blob, lrData.lrNo);
      triggerHaptic("success");
    } catch (err) {
      triggerHaptic("error");
      alert("Failed to share via WhatsApp: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  return (
    <div
      className="animate-fade-in-up"
      style={{
        padding: "20px 0",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--card-border)",
          paddingBottom: "14px",
        }}
      >
        <button
          onClick={() => {
            triggerHaptic("light");
            window.history.back();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
            padding: "4px",
          }}
        >
          <Icons.ArrowLeft size={22} />
        </button>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            margin: 0,
            fontFamily: "var(--font-outfit)",
          }}
        >
          Preview Document
        </h2>
        <div style={{ width: "30px" }} />
      </div>

      {/* Document Actions Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          padding: "10px",
          borderRadius: "14px",
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        {/* Save PDF */}
        <button
          onClick={handleSaveLocal}
          className="btn-secondary"
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "12px",
          }}
          disabled={generatingPDF}
          title="Save PDF"
        >
          <Icons.Download size={16} />
          <span>Save PDF</span>
        </button>

        {/* Share Native */}
        <button
          onClick={handleShare}
          className="btn-primary"
          style={{
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "12px",
            flex: 1,
          }}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <Icons.Loader size={16} className="animate-spin-fast" />
          ) : (
            <Icons.Share2 size={16} />
          )}
          <span>Share</span>
        </button>



        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="btn-whatsapp"
          style={{ padding: "10px 14px", borderRadius: "10px" }}
          disabled={generatingPDF}
        >
          <Icons.MessageSquare size={16} />
        </button>
      </div>

      {/* Pure React Document Body View */}
      <div
        style={{
          flex: 1,
          overflowX: "auto",
          padding: "10px 0",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div style={{ width: "100%", overflowX: "auto" }}>
          <LRReceiptPreview lr={lrData} />
        </div>
      </div>


    </div>
  );
}
