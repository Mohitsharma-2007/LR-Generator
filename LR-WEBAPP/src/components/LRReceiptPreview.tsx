import {
  COMPANY,
  ROUTES,
  type LRRecord,
  type AppSettings,
} from "../context/LRContext";
import logoUrl from "../assets/logo/maha_laxmi.png";

interface LRReceiptPreviewProps {
  lr: Omit<LRRecord, "id" | "createdAt"> & { id?: string };
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function LRReceiptPreview({ lr }: LRReceiptPreviewProps) {
  const route = ROUTES[lr.routeId];
  const total = lr.frightCharge;
  const advance = Math.round(total * 0.9);
  const balance = total - advance;

  let partnerName = "NISSIN ABC LOGISTICS PVT. LTD.";
  let partnerAddress =
    "Unit No. 222, 244, 246 & 247, 2nd Floor,\nCentrum Plaza, Golf Course Road, Sector - 53,\nGurugram - 122 002, Haryana";
  let partnerGst = "06AABCN0379D1ZS";

  try {
    const raw = localStorage.getItem("@app_settings");
    if (raw) {
      const parsed = JSON.parse(raw) as AppSettings;
      if (parsed.partnerName) partnerName = parsed.partnerName;
      if (parsed.partnerAddress) partnerAddress = parsed.partnerAddress;
      if (parsed.partnerGst) partnerGst = parsed.partnerGst;
    }
  } catch (e) {
    // Ignore and fallback
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "800px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: "'Inter', Arial, sans-serif",
        fontSize: "11px",
        padding: "30px",
        borderRadius: "16px",
        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
        lineHeight: "1.4",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          borderBottom: "2px solid #000000",
          paddingBottom: "12px",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "6px",
          }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            style={{ width: "42px", height: "42px", objectFit: "contain" }}
          />
          <span
            style={{
              fontSize: "20px",
              fontWeight: 800,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {COMPANY.name}
          </span>
        </div>
        <div style={{ fontSize: "10px", color: "#333333" }}>
          {COMPANY.address}
        </div>
        <div style={{ fontSize: "10px", color: "#333333", marginTop: "2px" }}>
          Email: {COMPANY.email} | Phone: {COMPANY.phone}
        </div>
        <div style={{ fontSize: "10px", color: "#333333", marginTop: "2px" }}>
          GSTIN: {COMPANY.gst} | PAN: {COMPANY.pan}
        </div>
      </div>

      {/* Doc Title & LR Number */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            border: "1px solid #000000",
            padding: "6px 16px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Loading Invoice
        </div>
        <div style={{ fontSize: "15px", fontWeight: 700 }}>
          LR No: <span style={{ color: "#d4a843" }}>{lr.lrNo}</span>
        </div>
      </div>

      {/* Main Metadata Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.8fr",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        {/* Left Column - Partner Info */}
        <div style={{ borderRight: "1px solid #e2e8f0", paddingRight: "16px" }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: "11px",
              marginBottom: "6px",
              textTransform: "uppercase",
              color: "#d4a843",
            }}
          >
            Partner / Consignee Agent
          </div>
          <div
            style={{ fontWeight: 700, fontSize: "12px", marginBottom: "4px" }}
          >
            {partnerName}
          </div>
          <div
            style={{
              whiteSpace: "pre-wrap",
              color: "#4a5568",
              marginBottom: "6px",
              fontSize: "10px",
              lineHeight: "1.5",
            }}
          >
            {partnerAddress}
          </div>
          {partnerGst && (
            <div style={{ fontSize: "10px" }}>
              <strong>GSTIN:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{partnerGst}</span>
            </div>
          )}
        </div>

        {/* Right Column - LR Metadata */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#4a5568" }}>
              Consignment Note No:
            </span>
            <span>{lr.consignmentNo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#4a5568" }}>
              Reference LR No:
            </span>
            <span>{lr.lrNo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#4a5568" }}>
              Pickup Date:
            </span>
            <span>{lr.date}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#4a5568" }}>
              Vehicle No:
            </span>
            <span style={{ fontWeight: 700 }}>{lr.vehicleNo}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, color: "#4a5568" }}>
              Vehicle Size:
            </span>
            <span>32 Feet Multi Axel</span>
          </div>

          <div
            style={{
              border: "1px dashed #cbd5e0",
              borderRadius: "8px",
              padding: "6px 10px",
              marginTop: "4px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
            }}
          >
            <div>
              <span
                style={{
                  fontWeight: 700,
                  display: "block",
                  fontSize: "9px",
                  color: "#718096",
                  textTransform: "uppercase",
                }}
              >
                From (Pickup)
              </span>
              <span>{route.pickupLocation}</span>
            </div>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  display: "block",
                  fontSize: "9px",
                  color: "#718096",
                  textTransform: "uppercase",
                }}
              >
                To (Drop)
              </span>
              <span>{route.dropLocation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Consignor / Consignee Blocks */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            border: "1px solid #000000",
            padding: "8px",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              borderBottom: "1px solid #000000",
              paddingBottom: "4px",
              marginBottom: "6px",
              textTransform: "uppercase",
              fontSize: "10px",
              color: "#333333",
            }}
          >
            Details of Consignee
          </div>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "10px",
              color: "#2d3748",
            }}
          >
            {route.consignee}
          </div>
        </div>
        <div
          style={{
            border: "1px solid #000000",
            padding: "8px",
            borderRadius: "6px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              borderBottom: "1px solid #000000",
              paddingBottom: "4px",
              marginBottom: "6px",
              textTransform: "uppercase",
              fontSize: "10px",
              color: "#333333",
            }}
          >
            Details of Consignor
          </div>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "10px",
              color: "#2d3748",
            }}
          >
            {route.consignor}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "16px",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Drop Location
            </th>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Invoice Nos
            </th>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Packages
            </th>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Description
            </th>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              Weight
            </th>
            <th
              style={{
                background: "#f7fafc",
                border: "1px solid #000000",
                padding: "6px",
                fontSize: "10px",
                fontWeight: 700,
                textAlign: "right",
              }}
            >
              Freight
            </th>
          </tr>
        </thead>
        <tbody>
          {lr.invoices.map((inv) => (
            <tr key={inv.id}>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {inv.dropLocation}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                  fontWeight: 600,
                }}
              >
                {inv.invoiceNo}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {inv.noOfPackages}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {inv.description}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "center",
                }}
              >
                {inv.goodsWeight}
              </td>
              <td
                style={{
                  border: "1px solid #000000",
                  padding: "6px",
                  textAlign: "right",
                  fontWeight: 600,
                }}
              >
                ₹{formatCurrency(inv.freightCharge)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bank Details & Totals */}
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        {/* Bank Details (Left) */}
        <div
          style={{
            flex: 1,
            border: "1px solid #000000",
            borderRadius: "6px",
            padding: "8px",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: "10px",
              borderBottom: "1px solid #000000",
              paddingBottom: "4px",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            Detail of Bank:
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "3px",
              fontSize: "10px",
            }}
          >
            <div>
              <span style={{ color: "#718096" }}>Beneficiary:</span>{" "}
              <strong>{COMPANY.bank.beneficiary}</strong>
            </div>
            <div>
              <span style={{ color: "#718096" }}>Account No:</span>{" "}
              <strong style={{ fontFamily: "monospace" }}>
                {COMPANY.bank.accountNo}
              </strong>
            </div>
            <div>
              <span style={{ color: "#718096" }}>Bank &amp; Branch:</span>{" "}
              <span style={{ fontSize: "9px" }}>{COMPANY.bank.bank}</span>
            </div>
            <div>
              <span style={{ color: "#718096" }}>IFSC Code:</span>{" "}
              <strong style={{ fontFamily: "monospace" }}>
                {COMPANY.bank.ifsc}
              </strong>
            </div>
          </div>
        </div>

        {/* Totals Box (Right) */}
        <div
          style={{
            width: "220px",
            border: "2px solid #000000",
            borderRadius: "6px",
            padding: "10px",
            background: "#f7fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "11px",
            }}
          >
            <span style={{ fontWeight: 700 }}>Total Freight:</span>
            <strong>₹{formatCurrency(total)}</strong>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "6px",
              fontSize: "11px",
              color: "#2d3748",
            }}
          >
            <span>Advance (90%):</span>
            <span>₹{formatCurrency(advance)}</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1.5px solid #000000",
              paddingTop: "6px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            <span>Balance (10%):</span>
            <span style={{ color: "#d4a843" }}>₹{formatCurrency(balance)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Note Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: "30px",
        }}
      >
        <div style={{ fontSize: "9px", color: "#718096", maxWidth: "60%" }}>
          * Subject to Gurugram Jurisdiction.
          <br />* This is a computer generated loading invoice.
        </div>
        <div
          style={{
            textAlign: "center",
            borderTop: "1px solid #000000",
            width: "150px",
            paddingTop: "4px",
          }}
        >
          <div style={{ fontSize: "10px", fontWeight: 700 }}>
            For {COMPANY.name}
          </div>
          <div style={{ fontSize: "9px", color: "#718096", marginTop: "12px" }}>
            Authorized Signatory
          </div>
        </div>
      </div>
    </div>
  );
}
