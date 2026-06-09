import { useState } from "react";
import { useLocation, useParams } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES, type LRRecord } from "../context/LRContext";
import { LRReceiptPreview } from "../components/LRReceiptPreview";
import {
  generatePDFBlob,
  saveToDownloads,
  sharePDF,
  shareToWhatsApp,
  getPDFBase64,
} from "../services/pdfService";
import { sendEmail } from "../services/emailService";
import { showNotification } from "../services/notificationService";
import { triggerHaptic } from "../services/hapticsService";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import sentAnimation from "../assets/lottie/sent.json";

export default function PreviewLR() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getLRById, settings } = useLR();

  const lr = getLRById(id || "");
  const [showEmailPicker, setShowEmailPicker] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showSent, setShowSent] = useState(false);
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
        <span style={{ fontSize: "16px", color: "var(--text-muted)" }}>LR not found</span>
        <button onClick={() => setLocation("/lrs")} className="btn-primary" style={{ padding: "10px 20px" }}>
          Go back
        </button>
      </div>
    );
  }

  const lrData = lr as LRRecord;
  const route = ROUTES[lrData.routeId];

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

  // Toggle selected emails for recipients
  function toggleEmail(email: string) {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  }

  // Send Email with PDF attachment
  async function handleSendEmail() {
    if (selectedEmails.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }
    if (!settings.senderEmail || !settings.googleAppPassword) {
      alert("Please configure SMTP Gmail and App Password in Settings first.");
      setLocation("/settings");
      return;
    }

    triggerHaptic("light");
    setSendingEmail(true);
    setShowEmailPicker(false);

    try {
      const blob = await generatePDFBlob(lrData);
      const base64Data = await getPDFBase64(blob);

      await sendEmail({
        to: selectedEmails,
        subject: `LR ${lrData.lrNo} - Maha Laxmi Transport Co.`,
        body: `Please find the attached Lorry Receipt ${lrData.lrNo} for your reference.\n\nDate: ${lrData.date}\nRoute: ${route.name}\nVehicle: ${lrData.vehicleNo}\nFreight: ₹${lrData.frightCharge.toLocaleString("en-IN")}\n\nRegards,\nMaha Laxmi Transport Co.`,
        senderEmail: settings.senderEmail,
        appPassword: settings.googleAppPassword,
        pdfBase64: base64Data,
        pdfFilename: `${lrData.lrNo}.pdf`,
      });

      triggerHaptic("success");
      setShowSent(true);
      showNotification("Email Sent", `LR ${lrData.lrNo} emailed to ${selectedEmails.length} recipient(s)`);
      setTimeout(() => setShowSent(false), 2500);
    } catch (err) {
      triggerHaptic("error");
      alert("Failed to send email: " + String(err));
    } finally {
      setSendingEmail(false);
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
          style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "12px" }}
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
          style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "12px", flex: 1 }}
          disabled={generatingPDF}
        >
          {generatingPDF ? (
            <Icons.Loader size={16} className="animate-spin-fast" />
          ) : (
            <Icons.Share2 size={16} />
          )}
          <span>Share</span>
        </button>

        {/* Send Email */}
        <button
          onClick={() => {
            setSelectedEmails([]);
            setShowEmailPicker(true);
          }}
          className="btn-secondary"
          style={{ padding: "10px 16px", borderRadius: "10px", fontSize: "12px" }}
          disabled={sendingEmail}
        >
          <Icons.Mail size={16} />
          <span>Email</span>
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

      {/* Recipient email picker sheet */}
      {showEmailPicker && (
        <div className="modal-overlay" onClick={() => setShowEmailPicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>Send via Gmail</span>
              <button
                onClick={() => {
                  triggerHaptic("light");
                  setShowEmailPicker(false);
                }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>

            {settings.emailIds.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "20px 0", textAlign: "center" }}>
                <Icons.Mail size={32} style={{ color: "var(--text-muted)" }} />
                <span style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  No recipient email addresses configured. Please add emails in settings first.
                </span>
                <button
                  onClick={() => {
                    setShowEmailPicker(false);
                    setLocation("/settings");
                  }}
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                >
                  Configure Emails
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "12px" }}>
                  Select recipients to email PDF for {lrData.lrNo}
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {settings.emailIds.map((email) => {
                    const isSelected = selectedEmails.includes(email);
                    return (
                      <div
                        key={email}
                        onClick={() => {
                          triggerHaptic("light");
                          toggleEmail(email);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px",
                          borderRadius: "10px",
                          border: "1px solid var(--card-border)",
                          background: isSelected ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.01)",
                          borderColor: isSelected ? "var(--gold)" : "var(--card-border)",
                          cursor: "pointer",
                          gap: "10px",
                        }}
                      >
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: "1.5px solid",
                            borderColor: isSelected ? "var(--gold)" : "var(--card-border)",
                            background: isSelected ? "var(--gold)" : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {isSelected && <Icons.Check size={12} style={{ color: "#0A1628" }} />}
                        </div>
                        <span style={{ fontSize: "13px", color: "#FFFFFF" }}>{email}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={handleSendEmail}
                  className="btn-primary"
                  style={{ width: "100%", padding: "14px" }}
                >
                  <Icons.Send size={16} />
                  <span>Send Email Now</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lottie sent confirmation */}
      {showSent && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div
            className="modal-sheet"
            style={{
              maxWidth: "280px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              textAlign: "center",
            }}
          >
            <div style={{ width: "120px", height: "120px" }}>
              <DotLottieReact data={sentAnimation} loop={false} autoplay />
            </div>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-outfit)" }}>
              Email Sent!
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
