import { useState } from "react";
import { useLocation, useParams } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES, COMPANY, type LRRecord } from "../context/LRContext";
import {
  generatePDFBlob,
  saveToDownloads,
  sharePDF,
  shareToWhatsApp,
} from "../services/pdfService";
import { showNotification } from "../services/notificationService";
import { triggerHaptic } from "../services/hapticsService";

export default function LRDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { getLRById, deleteLR } = useLR();

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

  // Type narrowing for nested handlers
  const lrData = lr as LRRecord;
  const route = ROUTES[lrData.routeId];
  const total = lrData.frightCharge;
  const advance = Math.round(total * 0.9);
  const balance = total - advance;

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

  // Open direct preview page
  function handlePrintPreview() {
    triggerHaptic("light");
    setLocation(`/lr-preview/${lrData.id}`);
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



  // Delete LR
  function handleDelete() {
    const ok = window.confirm(`Delete ${lrData.lrNo}? This cannot be undone.`);
    if (ok) {
      deleteLR(lrData.id);
      setLocation("/lrs");
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
          onClick={() => window.history.back()}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icons.ArrowLeft size={22} />
        </button>
        <div
          style={{
            flex: 1,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--gold)",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {lr.lrNo}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {lr.date} · {route.name}
          </span>
        </div>
        <button
          onClick={() => {
            triggerHaptic("light");
            setLocation(`/edit-lr/${lr.id}`);
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-primary)",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icons.Edit2 size={18} />
        </button>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Quick parameters */}
        <div style={{ display: "flex", gap: "8px" }}>
          <div
            className="glass-panel"
            style={{
              flex: 1,
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Icons.Truck size={14} style={{ color: "var(--text-muted)" }} />
            <span
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Vehicle
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>
              {lr.vehicleNo}
            </span>
          </div>
          <div
            className="glass-panel"
            style={{
              flex: 1,
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Icons.Hash size={14} style={{ color: "var(--text-muted)" }} />
            <span
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                textTransform: "uppercase",
              }}
            >
              Consignment
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600 }}>
              {lr.consignmentNo}
            </span>
          </div>
          <div
            className="glass-panel"
            style={{
              flex: 1,
              padding: "12px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              background: "var(--gold-glow)",
              border: "none",
            }}
          >
            <Icons.DollarSign size={14} style={{ color: "var(--gold-dark)" }} />
            <span
              style={{
                fontSize: "9px",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Freight
            </span>
            <span
              style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold-dark)" }}
            >
              ₹{lr.frightCharge.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Breakdown Card */}
        <section
          className="glass-panel"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Payment Breakdown
          </h3>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>Total Amount</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "13px",
            }}
          >
            <span style={{ color: "var(--text-secondary)" }}>
              Advance (90%)
            </span>
            <span>₹{advance.toLocaleString("en-IN")}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid var(--card-border)",
              paddingTop: "10px",
              marginTop: "2px",
            }}
          >
            <span
              style={{
                color: "var(--gold)",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Balance
            </span>
            <span
              style={{
                color: "var(--gold)",
                fontWeight: 700,
                fontSize: "18px",
              }}
            >
              ₹{balance.toLocaleString("en-IN")}
            </span>
          </div>
        </section>

        {/* Invoices List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Invoices ({lr.invoices.length})
          </span>
          {lr.invoices.map((inv, idx) => (
            <div
              key={inv.id}
              className="glass-panel"
              style={{
                padding: "12px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  backgroundColor: "var(--gold)",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "12px",
                }}
              >
                {idx + 1}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--gold)",
                  }}
                >
                  {inv.invoiceNo}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                  {inv.dropLocation}
                </span>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                ₹{inv.freightCharge.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>

        {/* Company Bank Details */}
        <section
          className="glass-panel"
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          <h3
            style={{
              fontSize: "11px",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "4px",
            }}
          >
            Bank Details
          </h3>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            {COMPANY.bank.beneficiary}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            A/C: {COMPANY.bank.accountNo}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            {COMPANY.bank.bank}
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            IFSC: {COMPANY.bank.ifsc}
          </span>
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
          <span style={{ fontSize: "16px", fontWeight: 600 }}>
            {lr.lrNo}.pdf
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Tap to view high-fidelity document preview
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
            <Icons.Eye size={12} />
            <span>Preview LR</span>
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
          style={{
            padding: "12px",
            borderColor: "rgba(224, 92, 92, 0.2)",
            color: "var(--error)",
          }}
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
    </div>
  );
}
