import React, { useState } from "react";
import * as Icons from "lucide-react";
import { useLR, type LRRecord } from "../context/LRContext";
import { LRCard } from "../components/LRCard";
import { sharePDF, generatePDFBlob } from "../services/pdfService";

export default function LRsList() {
  const { lrs, deleteLR } = useLR();
  const [search, setSearch] = useState("");
  const [routeFilter, setRouteFilter] = useState<"all" | "1" | "2">("all");
  const [sharingId, setSharingId] = useState<string | null>(null);

  // Confirm delete handler
  function handleDelete(id: string, lrNo: string) {
    const ok = window.confirm(`Delete ${lrNo}? This cannot be undone.`);
    if (ok) {
      deleteLR(id);
    }
  }

  // Share handler
  async function handleShare(lr: LRRecord, e: React.MouseEvent) {
    e.stopPropagation();
    setSharingId(lr.id);
    try {
      const blob = await generatePDFBlob(lr);
      await sharePDF(blob, lr.lrNo);
    } catch (err) {
      alert("Failed to share PDF: " + String(err));
    } finally {
      setSharingId(null);
    }
  }

  // Filtered LRs
  const filtered = lrs.filter((lr) => {
    // Route Filter
    if (routeFilter !== "all" && String(lr.routeId) !== routeFilter) {
      return false;
    }

    // Search Query
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    const matchLr = lr.lrNo.toLowerCase().includes(query);
    const matchVehicle = lr.vehicleNo.toLowerCase().includes(query);
    const matchConsignment = lr.consignmentNo.toLowerCase().includes(query);
    const matchInvoices = lr.invoices.some(
      (inv) =>
        inv.invoiceNo.toLowerCase().includes(query) ||
        inv.dropLocation.toLowerCase().includes(query),
    );

    return matchLr || matchVehicle || matchConsignment || matchInvoices;
  });

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0" }}>
      {/* Header */}
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "16px",
          fontFamily: "var(--font-outfit)",
        }}
      >
        Lorry Receipts
      </h2>

      {/* Search Input wrapper */}
      <div style={{ position: "relative", marginBottom: "16px" }}>
        <Icons.Search
          size={16}
          style={{
            position: "absolute",
            left: "14px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-muted)",
          }}
        />
        <input
          type="text"
          placeholder="Search by LR, vehicle, invoice, etc..."
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: "40px" }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
              display: "flex",
            }}
          >
            <Icons.X size={16} />
          </button>
        )}
      </div>

      {/* Route Filter Tabs */}
      <div
        style={{
          display: "flex",
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          padding: "4px",
          marginBottom: "20px",
          gap: "4px",
        }}
      >
        <button
          onClick={() => setRouteFilter("all")}
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            backgroundColor:
              routeFilter === "all" ? "var(--gold)" : "transparent",
            color: routeFilter === "all" ? "#060E1C" : "var(--text-secondary)",
          }}
        >
          All LRs
        </button>
        <button
          onClick={() => setRouteFilter("1")}
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            backgroundColor:
              routeFilter === "1" ? "var(--gold)" : "transparent",
            color: routeFilter === "1" ? "#060E1C" : "var(--text-secondary)",
          }}
        >
          Chennai → Manesar
        </button>
        <button
          onClick={() => setRouteFilter("2")}
          style={{
            flex: 1,
            padding: "8px",
            fontSize: "12px",
            fontWeight: 600,
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            transition: "all 0.2s ease",
            backgroundColor:
              routeFilter === "2" ? "var(--gold)" : "transparent",
            color: routeFilter === "2" ? "#060E1C" : "var(--text-secondary)",
          }}
        >
          Manesar → Chennai
        </button>
      </div>

      {/* Sharing state overlay */}
      {sharingId && (
        <div
          style={{
            position: "fixed",
            top: 24,
            right: 24,
            padding: "12px 20px",
            background: "rgba(6, 14, 28, 0.95)",
            border: "1px solid var(--gold)",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 1000,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <Icons.Loader
            size={16}
            className="animate-spin-fast"
            style={{ color: "var(--gold)" }}
          />
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            Generating PDF...
          </span>
        </div>
      )}

      {/* LRs List */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filtered.map((lr) => (
          <LRCard
            key={lr.id}
            lr={lr}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        ))}

        {filtered.length === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 20px",
              gap: "12px",
            }}
          >
            <Icons.FileText
              size={40}
              style={{ color: "rgba(255,255,255,0.08)" }}
            />
            <span
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              {lrs.length === 0
                ? "No LRs generated yet."
                : "No matching LRs found."}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
