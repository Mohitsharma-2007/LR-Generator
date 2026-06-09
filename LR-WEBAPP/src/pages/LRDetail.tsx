import { useState } from "react";
import { useLocation, useParams } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES, COMPANY, type LRRecord } from "../context/LRContext";
import {
  generatePDFBlob,
  saveToDownloads,
  sharePDF,
  shareToWhatsApp,
  getPDFBase64,
} from "../services/pdfService";
import { sendEmail } from "../services/emailService";
import { showNotification } from "../services/notificationService";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import sentAnimation from "../assets/lottie/sent.json";

export default function LRDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getLRById, deleteLR, settings } = useLR();

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

  // Type narrowing for nested handlers
  const lrData = lr as LRRecord;
  const route = ROUTES[lrData.routeId];
  const total = lrData.frightCharge;
  const advance = Math.round(total * 0.9);
  const balance = total - advance;

  // Local Save (Download) PDF
  async function handleSaveLocal() {
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await saveToDownloads(blob, lrData.lrNo);
      showNotification("PDF Saved", `${lrData.lrNo}.pdf saved to LR/ folder`);
    } catch (err) {
      alert("Failed to generate PDF: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Open direct preview print
  async function handlePrintPreview() {
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      alert("Failed to generate print preview: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  // Share via web share API
  async function handleShare() {
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await sharePDF(blob, lrData.lrNo);
    } catch (err) {
      alert("Failed to share PDF: " + String(err));
    } finally {
      setGeneratingPDF(false);
    }
  }

  // WhatsApp sharing
  async function handleWhatsApp() {
    setGeneratingPDF(true);
    try {
      const blob = await generatePDFBlob(lrData);
      await shareToWhatsApp(blob, lrData.lrNo);
    } catch (err) {
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

    setSendingEmail(true);
    setShowEmailPicker(false);

    try {
      // 1. Generate PDF blob client-side
      const blob = await generatePDFBlob(lrData);
      
      // 2. Convert to base64
      const base64Data = await getPDFBase64(blob);

      // Custom API endpoint URL if saved
      const customApiUrl = localStorage.getItem("@mltc_api_url") || undefined;

      // 3. Send email via server
      await sendEmail({
        to: selectedEmails,
        subject: `LR ${lrData.lrNo} - Maha Laxmi Transport Co.`,
        body: `Please find the attached Lorry Receipt ${lrData.lrNo} for your reference.\n\nDate: ${lrData.date}\nRoute: ${route.name}\nVehicle: ${lrData.vehicleNo}\nFreight: ₹${lrData.frightCharge.toLocaleString("en-IN")}\n\nRegards,\nMaha Laxmi Transport Co.`,
        senderEmail: settings.senderEmail,
        appPassword: settings.googleAppPassword,
        pdfBase64: base64Data,
        pdfFilename: `${lrData.lrNo}.pdf`,
        apiUrl: customApiUrl,
      });

      setShowSent(true);
      showNotification("Email Sent", `LR ${lrData.lrNo} emailed to ${selectedEmails.length} recipient(s)`);
      setTimeout(() => setShowSent(false), 2500);
    } catch (err) {
      alert("Failed to send email: " + String(err));
    } finally {
      setSendingEmail(false);
    }
  }

  // Delete LR
  function handleDelete() {
    const ok = window.confirm(`Delete ${lrData.lrNo}? This cannot be undone.`);
    if (ok) {
      deleteLR(lrData.id);
      setLocation("/lrs");
    }
  }

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--card-border)", paddingBottom: "14px" }}>
        <button
          onClick={() => window.history.back()}
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex" }}
        >
          <Icons.ArrowLeft size={22} />
        </button>
        <div style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)", fontFamily: "var(--font-outfit)" }}>{lr.lrNo}</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{lr.date} · {route.name}</span>
        </div>
        <button
          onClick={() => setLocation(`/create-lr?edit=${lr.id}`)}
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex" }}
        >
          <Icons.Edit2 size={18} />
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Quick parameters */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div className="glass-panel" style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Icons.Truck size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>Vehicle</span>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{lr.vehicleNo}</span>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Icons.Hash size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>Consignment</span>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>{lr.consignmentNo}</span>
          </div>
          <div className="glass-panel" style={{ flex: 1, padding: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "rgba(212,168,67,0.12)", border: "none" }}>
            <Icons.DollarSign size={14} style={{ color: "#0A1628" }} />
            <span style={{ fontSize: "9px", color: "rgba(10,22,40,0.7)", textTransform: "uppercase" }}>Freight</span>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0A1628" }}>
              ₹{lr.frightCharge.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Breakdown Card */}
        <section className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Payment Breakdown
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Total Amount</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Advance (90%)</span>
            <span>₹{advance.toLocaleString("en-IN")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--card-border)", paddingTop: "10px", marginTop: "2px" }}>
            <span style={{ color: "var(--gold)", fontWeight: 600, fontSize: "13px" }}>Balance</span>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: "18px" }}>
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>
        </section>

        {/* Invoices List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>
            Invoices ({lr.invoices.length})
          </span>
          {lr.invoices.map((inv, idx) => (
            <div key={inv.id} className="glass-panel" style={{ padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold)",
                  color: "#0A1628",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                {idx + 1}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--gold)" }}>{inv.invoiceNo}</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{inv.dropLocation}</span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>₹{inv.freightCharge.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>

        {/* Company Bank Details */}
        <section className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <h3 style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            Bank Details
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>{COMPANY.bank.beneficiary}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>A/C: {COMPANY.bank.accountNo}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{COMPANY.bank.bank}</span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>IFSC: {COMPANY.bank.ifsc}</span>
        </section>

        {/* Document Print/Share Section */}
        <section
          onClick={handlePrintPreview}
          className="glass-panel"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <Icons.FileText size={40} style={{ color: "var(--gold)" }} />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>{lr.lrNo}.pdf</span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Tap to generate and open preview in new browser tab
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(212,168,67,0.1)",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              color: "var(--gold)",
              fontWeight: 500,
              marginTop: "4px",
            }}
          >
            <Icons.ExternalLink size={12} />
            <span>Open PDF</span>
          </div>
        </section>
      </div>

      {/* Detail actions footer */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          borderTop: "1px solid var(--card-border)",
          paddingTop: "14px",
          marginTop: "10px",
          alignItems: "center",
        }}
      >
        {/* Delete */}
        <button
          onClick={handleDelete}
          className="btn-secondary"
          style={{ padding: "12px", borderColor: "rgba(224, 92, 92, 0.2)", color: "var(--error)" }}
          title="Delete Lorry Receipt"
        >
          <Icons.Trash2 size={18} />
        </button>

        {/* Save Locally (Downloads folder) */}
        <button
          onClick={handleSaveLocal}
          className="btn-secondary"
          style={{ padding: "12px" }}
          disabled={generatingPDF}
          title="Save locally in folder 'LR'"
        >
          <Icons.Download size={18} />
        </button>

        {/* Send Email */}
        <button
          onClick={() => {
            setSelectedEmails([]);
            setShowEmailPicker(true);
          }}
          className="btn-secondary"
          style={{ padding: "12px" }}
          disabled={sendingEmail}
          title="Send PDF via SMTP Email"
        >
          {sendingEmail ? (
            <Icons.Loader size={18} className="animate-spin-fast" />
          ) : (
            <Icons.Mail size={18} />
          )}
        </button>

        {/* Share via WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="btn-whatsapp"
          style={{ padding: "12px" }}
          disabled={generatingPDF}
          title="Send via WhatsApp"
        >
          <Icons.MessageSquare size={18} />
        </button>

        {/* Global Share Trigger */}
        <button
          onClick={handleShare}
          disabled={generatingPDF}
          className="btn-primary"
          style={{ flex: 1, padding: "12px 18px", fontSize: "14px" }}
        >
          {generatingPDF ? (
            <>
              <Icons.Loader className="animate-spin-fast" size={16} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Icons.Share2 size={16} />
              <span>Share PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Recipient email picker sheet */}
      {showEmailPicker && (
        <div className="modal-overlay" onClick={() => setShowEmailPicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px 0" }}>Send via Gmail</h3>
            
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
                  Select recipients to email PDF for {lr.lrNo}
                </span>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                  {settings.emailIds.map((email) => {
                    const isSelected = selectedEmails.includes(email);
                    return (
                      <div
                        key={email}
                        onClick={() => toggleEmail(email)}
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
                  style={{ width: "100%" }}
                  disabled={selectedEmails.length === 0}
                >
                  <Icons.Send size={14} />
                  <span>Send to {selectedEmails.length} Recipient{selectedEmails.length !== 1 ? "s" : ""}</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Email sent notification banner */}
      {showSent && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(6, 14, 28, 0.75)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px",
              width: "200px",
              textAlign: "center",
            }}
          >
            <div style={{ width: "100px", height: "100px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <DotLottieReact data={sentAnimation} loop={false} autoplay />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>
              Email Sent!
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Attachment delivered
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
