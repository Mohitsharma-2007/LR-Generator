import React, { useRef, useState } from "react";
import { useLocation } from "wouter";
import * as Icons from "lucide-react";
import { useLR } from "../context/LRContext";
import { extractFromImage } from "../services/aiService";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import loadingHandAnimation from "../assets/lottie/loading_hand.json";
import aiLoadingAnimation from "../assets/lottie/ai_loading.json";

export default function ScanInvoice() {
  const [, setLocation] = useLocation();
  const { settings } = useLR();
  const [image, setImage] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [suggestions, setSuggestions] = useState<{
    route: string | null;
    consignmentNo: string | null;
    invoiceNos: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File selection handler
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Drag and drop handlers
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  // Trigger OCR extraction
  async function handleExtract() {
    if (!image) return;
    if (!settings.openrouterApiKey) {
      alert("Please configure your OpenRouter API Key in Settings first.");
      setLocation("/settings");
      return;
    }

    setExtracting(true);
    try {
      // Strip base64 headers if present
      const base64 = image.substring(image.indexOf(",") + 1);
      const data = await extractFromImage(base64, settings.openrouterApiKey);
      setSuggestions(data);
    } catch (err) {
      alert("Extraction failed: " + String(err));
    } finally {
      setExtracting(false);
    }
  }

  // Auto-fill confirmation
  function handleConfirm() {
    if (!suggestions) return;
    
    // Map route string to id
    const routeId = suggestions.route?.includes("Manesar → Chennai") || suggestions.route === "2" ? "2" : "1";
    const consignment = suggestions.consignmentNo || "";
    const invoices = suggestions.invoiceNos.join("|");

    // Navigate to create-lr with parameters
    setLocation(
      `/create-lr?routeId=${routeId}&consignmentNo=${encodeURIComponent(
        consignment
      )}&invoiceNos=${encodeURIComponent(invoices)}`
    );
  }

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0" }}>
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "16px",
          fontFamily: "var(--font-outfit)",
        }}
      >
        AI Invoice Scanner
      </h2>

      {!settings.openrouterApiKey && (
        <div
          className="glass-panel"
          style={{
            padding: "16px",
            borderColor: "rgba(212, 168, 67, 0.25)",
            background: "rgba(212, 168, 67, 0.04)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--gold)" }}>
            <Icons.AlertTriangle size={18} />
            <span style={{ fontSize: "14px", fontWeight: 700 }}>OpenRouter Key Required</span>
          </div>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
            To use AI extraction features, please configure your OpenRouter API Key in settings.
            The app uses the free Google Gemini Flash 1.5 model to read invoices.
          </p>
          <button onClick={() => setLocation("/settings")} className="btn-primary" style={{ padding: "10px 16px" }}>
            Open Settings
          </button>
        </div>
      )}

      {extracting && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(6, 14, 28, 0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            gap: "16px",
          }}
        >
          <div style={{ width: "160px", height: "160px" }}>
            <DotLottieReact data={aiLoadingAnimation} loop autoplay />
          </div>
          <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--gold)", letterSpacing: "1px" }}>
            AI extracting data...
          </span>
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            Processing invoice details with Gemini Flash
          </span>
        </div>
      )}

      {!suggestions ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Upload Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="glass-panel"
            style={{
              height: "220px",
              borderStyle: "dashed",
              borderWidth: "2px",
              borderColor: image ? "var(--gold)" : "var(--card-border)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              gap: "12px",
              padding: "16px",
              textAlign: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: "none" }}
            />
            {image ? (
              <img
                src={image}
                alt="Selected Invoice"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <>
                <div style={{ width: "150px", height: "120px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <DotLottieReact data={loadingHandAnimation} loop autoplay />
                </div>
                <div>
                  <span style={{ fontSize: "14px", fontWeight: 600, display: "block", color: "#FFFFFF" }}>
                    Upload Invoice Photo
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Drag & drop or tap to select file
                  </span>
                </div>
              </>
            )}
          </div>

          {image && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => setImage(null)}
                className="btn-secondary"
                style={{ flex: 1 }}
              >
                Clear Photo
              </button>
              <button
                onClick={handleExtract}
                className="btn-primary"
                style={{ flex: 2 }}
                disabled={!settings.openrouterApiKey}
              >
                <Icons.Cpu size={16} />
                <span>Extract with AI</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Suggestions Preview Screen */
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--gold)",
              borderBottom: "1px solid var(--card-border)",
              paddingBottom: "10px",
              margin: 0,
            }}
          >
            AI Extracted Details
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Route */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label className="input-label">Detected Route</label>
              <select
                className="form-input"
                value={suggestions.route || "1"}
                onChange={(e) => setSuggestions({ ...suggestions, route: e.target.value })}
              >
                <option value="1">Chennai → Manesar</option>
                <option value="2">Manesar → Chennai</option>
              </select>
            </div>

            {/* Consignment No */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label className="input-label">Detected Consignment No</label>
              <input
                type="text"
                className="form-input"
                value={suggestions.consignmentNo || ""}
                onChange={(e) => setSuggestions({ ...suggestions, consignmentNo: e.target.value })}
                placeholder="Consignment number"
              />
            </div>

            {/* Invoices */}
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label className="input-label">Detected Invoices ({suggestions.invoiceNos.length})</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {suggestions.invoiceNos.map((inv, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid var(--card-border)",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  >
                    <span>{inv}</span>
                    <button
                      onClick={() => {
                        const updated = suggestions.invoiceNos.filter((_, i) => i !== idx);
                        setSuggestions({ ...suggestions, invoiceNos: updated });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--error)",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      <Icons.X size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const next = prompt("Enter invoice number:");
                    if (next) {
                      setSuggestions({
                        ...suggestions,
                        invoiceNos: [...suggestions.invoiceNos, next.toUpperCase()],
                      });
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(212, 168, 67, 0.08)",
                    border: "1px dashed var(--gold)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "var(--gold)",
                    cursor: "pointer",
                  }}
                >
                  <Icons.Plus size={12} />
                  <span>Add Invoice</span>
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button
              onClick={() => {
                setSuggestions(null);
                setImage(null);
              }}
              className="btn-secondary"
              style={{ flex: 1 }}
            >
              Scan Again
            </button>
            <button onClick={handleConfirm} className="btn-primary" style={{ flex: 2 }}>
              <Icons.CheckCircle size={16} />
              <span>Confirm & Auto-fill</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
