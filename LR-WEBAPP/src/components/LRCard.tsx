import React from "react";
import { useLocation } from "wouter";
import * as Icons from "lucide-react";
import { ROUTES, type LRRecord } from "../context/LRContext";

interface LRCardProps {
  lr: LRRecord;
  onDelete: (id: string, lrNo: string) => void;
  onShare: (lr: LRRecord, e: React.MouseEvent) => void;
}

export function LRCard({ lr, onDelete, onShare }: LRCardProps) {
  const [, setLocation] = useLocation();
  const route = ROUTES[lr.routeId];

  function handlePress(e: React.MouseEvent) {
    // Prevent navigating if clicking nested buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".action-btn")) {
      return;
    }
    setLocation(`/lr-detail/${lr.id}`);
  }

  return (
    <div
      onClick={handlePress}
      className="glass-panel animate-fade-in-up"
      style={{
        padding: "16px",
        marginBottom: "12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: "0.3px",
              fontFamily: "var(--font-outfit)",
            }}
          >
            {lr.lrNo}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderRadius: "6px",
              padding: "3px 8px",
              fontSize: "10px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              width: "fit-content",
            }}
          >
            <Icons.MapPin size={10} style={{ opacity: 0.6 }} />
            <span>{route.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, color: "#FFFFFF" }}>
            ₹{lr.frightCharge.toLocaleString("en-IN")}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{lr.date}</span>
        </div>
      </div>

      <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.07)" }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <Icons.Truck size={13} style={{ opacity: 0.6 }} />
          <span>{lr.vehicleNo}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }} onClick={(e) => e.stopPropagation()}>
          <button
            title="Edit LR"
            className="action-btn"
            style={{
              padding: "6px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
            }}
            onClick={() => setLocation(`/create-lr?edit=${lr.id}`)}
          >
            <Icons.Edit2 size={13} />
          </button>
          <button
            title="Share PDF"
            className="action-btn"
            style={{
              padding: "6px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
            }}
            onClick={(e) => onShare(lr, e)}
          >
            <Icons.Share2 size={13} />
          </button>
          <button
            title="Delete LR"
            className="action-btn"
            style={{
              padding: "6px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "none",
              color: "rgba(214, 61, 61, 0.7)",
              cursor: "pointer",
              display: "flex",
            }}
            onClick={() => onDelete(lr.id, lr.lrNo)}
          >
            <Icons.Trash2 size={13} />
          </button>
          <Icons.ChevronRight size={14} style={{ color: "rgba(212, 168, 67, 0.5)", marginLeft: "4px" }} />
        </div>
      </div>
    </div>
  );
}
