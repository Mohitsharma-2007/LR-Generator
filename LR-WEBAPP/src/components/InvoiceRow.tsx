import { XCircle } from "lucide-react";
import { type InvoiceRecord } from "../context/LRContext";

interface InvoiceRowProps {
  invoice: InvoiceRecord;
  index: number;
  canDelete: boolean;
  onChange: (id: string, field: keyof InvoiceRecord, value: string) => void;
  onDelete: (id: string) => void;
}

export function InvoiceRow({
  invoice,
  index,
  canDelete,
  onChange,
  onDelete,
}: InvoiceRowProps) {
  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "12px",
              background: "var(--gold)",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "12px",
            }}
          >
            {index + 1}
          </div>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            Invoice Entry
          </span>
        </div>
        {canDelete && (
          <button
            title="Delete Invoice Row"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px",
              color: "var(--error)",
              display: "flex",
            }}
            onClick={() => onDelete(invoice.id)}
          >
            <XCircle size={18} />
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label className="input-label">Invoice No *</label>
        <input
          type="text"
          className="form-input"
          value={invoice.invoiceNo}
          onChange={(e) => onChange(invoice.id, "invoiceNo", e.target.value)}
          placeholder="e.g. TN2026000911-16"
          style={{ textTransform: "uppercase" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label className="input-label">Drop Location</label>
        <input
          type="text"
          className="form-input"
          value={invoice.dropLocation}
          onChange={(e) => onChange(invoice.id, "dropLocation", e.target.value)}
          placeholder="Drop location"
        />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <label className="input-label">Packages</label>
          <input
            type="text"
            className="form-input"
            value={invoice.noOfPackages}
            onChange={(e) =>
              onChange(invoice.id, "noOfPackages", e.target.value)
            }
          />
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <label className="input-label">Goods Weight</label>
          <input
            type="text"
            className="form-input"
            value={invoice.goodsWeight}
            onChange={(e) =>
              onChange(invoice.id, "goodsWeight", e.target.value)
            }
          />
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <label className="input-label">Freight Charge (₹) *</label>
        <input
          type="number"
          className="form-input"
          value={invoice.freightCharge || ""}
          onChange={(e) =>
            onChange(invoice.id, "freightCharge", e.target.value)
          }
          placeholder="Freight Charge"
        />
      </div>
    </div>
  );
}
