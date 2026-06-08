import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES, type InvoiceRecord } from "../context/LRContext";
import { InvoiceRow } from "../components/InvoiceRow";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import invoiceMadeAnimation from "../assets/lottie/invoice_made.json";

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 6);
}

function newInvoice(dropLocation: string, freightCharge: number): InvoiceRecord {
  return {
    id: generateId(),
    invoiceNo: "",
    dropLocation,
    noOfPackages: "AS PER INVOICE",
    description: "AS PER INVOICE",
    goodsWeight: "AS PER INVOICE",
    freightCharge,
  };
}

export default function CreateLR() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  
  const { addLR, updateLR, getLRById, getNextLrNo, settings } = useLR();

  const editId = searchParams.get("edit") || null;
  const existing = editId ? getLRById(editId) : undefined;
  const isEdit = !!existing;

  // Form Fields
  const [routeId, setRouteId] = useState<1 | 2>(() => {
    if (existing) return existing.routeId;
    const qRoute = searchParams.get("routeId");
    return qRoute === "2" ? 2 : 1;
  });

  const [lrNo, setLrNo] = useState(() => {
    if (existing) return existing.lrNo;
    return getNextLrNo();
  });

  const [consignmentNo, setConsignmentNo] = useState(() => {
    if (existing) return existing.consignmentNo;
    return searchParams.get("consignmentNo") || "";
  });

  const [date, setDate] = useState(() => {
    if (existing) return existing.date;
    const now = new Date();
    const d = String(now.getDate()).padStart(2, "0");
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const y = now.getFullYear();
    return `${d}-${m}-${y}`;
  });

  const [vehicleNo, setVehicleNo] = useState(() => {
    if (existing) return existing.vehicleNo;
    return settings.vehicles[0] || "";
  });

  const [invoices, setInvoices] = useState<InvoiceRecord[]>(() => {
    if (existing) return existing.invoices;
    
    const routeObj = ROUTES[searchParams.get("routeId") === "2" ? 2 : 1];
    const qInvoices = searchParams.get("invoiceNos");
    
    if (qInvoices) {
      return qInvoices
        .split("|")
        .filter(Boolean)
        .map((invNo) => ({
          ...newInvoice(routeObj.defaultDrop, routeObj.frightCharge),
          invoiceNo: invNo.toUpperCase(),
        }));
    }
    
    return [newInvoice(routeObj.defaultDrop, routeObj.frightCharge)];
  });

  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const activeRoute = ROUTES[routeId];

  useEffect(() => {
    if (!isEdit) {
      setLrNo(getNextLrNo());
    }
  }, [getNextLrNo, isEdit]);

  // Handle route change
  function handleRouteChange(id: 1 | 2) {
    setRouteId(id);
    const r = ROUTES[id];
    setInvoices((prev) =>
      prev.map((inv) => ({
        ...inv,
        dropLocation: r.defaultDrop,
        freightCharge: r.frightCharge,
      }))
    );
    setShowRoutePicker(false);
  }

  // Handle invoice modification
  function handleInvoiceChange(
    id: string,
    field: keyof InvoiceRecord,
    value: string
  ) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id
          ? {
              ...inv,
              [field]: field === "freightCharge" ? Number(value) || 0 : value,
            }
          : inv
      )
    );
  }

  // Add invoice row
  function addInvoiceRow() {
    setInvoices((prev) => [
      ...prev,
      newInvoice(activeRoute.defaultDrop, activeRoute.frightCharge),
    ]);
  }

  // Delete invoice row
  function deleteInvoiceRow(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  // Validation
  function validate(): string | null {
    if (!lrNo.trim()) return "LR No is required.";
    if (!consignmentNo.trim()) return "Consignment No is required.";
    if (!date.trim() || !/^\d{2}-\d{2}-\d{4}$/.test(date))
      return "Date must be in DD-MM-YYYY format.";
    if (!vehicleNo.trim()) return "Vehicle No is required.";
    if (invoices.length === 0) return "At least one invoice is required.";
    for (const inv of invoices) {
      if (!inv.invoiceNo.trim()) return "All invoice numbers are required.";
      if (!inv.freightCharge || inv.freightCharge <= 0) return "Freight Charge must be greater than zero.";
    }
    return null;
  }

  // Save LR
  async function handleSave() {
    const err = validate();
    if (err) {
      alert(err);
      return;
    }

    setSaving(true);
    try {
      const totalFreight = invoices.reduce(
        (sum, inv) => sum + inv.freightCharge,
        0
      );

      const lrData = {
        lrNo: lrNo.trim(),
        consignmentNo: consignmentNo.trim(),
        date: date.trim(),
        vehicleNo: vehicleNo.trim(),
        routeId,
        frightCharge: totalFreight,
        invoices,
      };

      let savedId = editId;
      if (isEdit && editId) {
        await updateLR(editId, lrData);
      } else {
        const saved = await addLR(lrData);
        savedId = saved.id;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        if (savedId) {
          setLocation(`/lr-detail/${savedId}`);
        } else {
          setLocation("/lrs");
        }
      }, 1500);
    } catch (err) {
      alert("Failed to save LR: " + String(err));
    } finally {
      setSaving(false);
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
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, fontFamily: "var(--font-outfit)" }}>
          {isEdit ? "Edit Lorry Receipt" : "New Lorry Receipt"}
        </h2>
        <div style={{ width: "22px" }} />
      </div>

      {/* Form Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Route Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label className="input-label">Route Selection</label>
          <button
            onClick={() => setShowRoutePicker(true)}
            className="form-input"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.Map size={16} style={{ color: "var(--gold)" }} />
              <span>{activeRoute.name}</span>
            </div>
            <Icons.ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* LR & Date */}
        <section className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Receipt Parameters
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">LR Number</label>
            <input
              type="text"
              className="form-input"
              value={lrNo}
              onChange={(e) => setLrNo(e.target.value.toUpperCase())}
              placeholder="e.g. MLTC-88"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">Consignment Note Number *</label>
            <input
              type="text"
              className="form-input"
              value={consignmentNo}
              onChange={(e) => setConsignmentNo(e.target.value)}
              placeholder="e.g. 378301"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">Date (DD-MM-YYYY)</label>
            <input
              type="text"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="01-06-2026"
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">Vehicle Number *</label>
            <button
              onClick={() => setShowVehiclePicker(true)}
              className="form-input"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                textAlign: "left",
                cursor: "pointer",
                background: "rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Icons.Truck size={16} style={{ color: "var(--gold)" }} />
                <span>{vehicleNo || "Select vehicle number"}</span>
              </div>
              <Icons.ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </section>

        {/* Route Details Readonly */}
        <section className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Auto-Filled Route Details
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>PICKUP LOCATION</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{activeRoute.pickupLocation}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>DROP LOCATION</span>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{activeRoute.dropLocation}</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "8px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>Base Route Freight</span>
            <span style={{ fontSize: "16px", color: "var(--gold)", fontWeight: 700 }}>
              ₹{activeRoute.frightCharge.toLocaleString("en-IN")}
            </span>
          </div>
        </section>

        {/* Invoices List Section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-secondary)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Invoices ({invoices.length})
            </span>
            <button
              onClick={addInvoiceRow}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--gold)",
                background: "none",
                color: "var(--gold)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icons.Plus size={14} />
              <span>Add Row</span>
            </button>
          </div>

          {invoices.map((inv, idx) => (
            <InvoiceRow
              key={inv.id}
              invoice={inv}
              index={idx}
              canDelete={invoices.length > 1}
              onChange={handleInvoiceChange}
              onDelete={deleteInvoiceRow}
            />
          ))}
        </div>
      </div>

      {/* Form Action Footer */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary"
        style={{ width: "100%", padding: "16px", marginTop: "12px" }}
      >
        {saving ? (
          <>
            <Icons.Loader className="animate-spin-fast" size={18} />
            <span>Saving LR...</span>
          </>
        ) : (
          <>
            <Icons.FilePlus size={18} />
            <span>{isEdit ? "Update Lorry Receipt" : "Generate & Save LR"}</span>
          </>
        )}
      </button>

      {/* Route Picker Modal */}
      {showRoutePicker && (
        <div className="modal-overlay" onClick={() => setShowRoutePicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Select Route</span>
              <button
                onClick={() => setShowRoutePicker(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            {([1, 2] as const).map((id) => (
              <div
                key={id}
                onClick={() => handleRouteChange(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  background: routeId === id ? "rgba(212, 168, 67, 0.12)" : "rgba(255,255,255,0.01)",
                  borderColor: routeId === id ? "var(--gold)" : "var(--card-border)",
                  cursor: "pointer",
                  marginBottom: "8px",
                  gap: "12px",
                }}
              >
                <Icons.MapPin size={18} style={{ color: routeId === id ? "var(--gold)" : "var(--text-muted)" }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: routeId === id ? "var(--gold)" : "#FFFFFF" }}>
                    {ROUTES[id].name}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    ₹{ROUTES[id].frightCharge.toLocaleString("en-IN")}
                  </span>
                </div>
                {routeId === id && <Icons.Check size={18} style={{ color: "var(--gold)" }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vehicle Picker Modal */}
      {showVehiclePicker && (
        <div className="modal-overlay" onClick={() => setShowVehiclePicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700 }}>Select Vehicle</span>
              <button
                onClick={() => setShowVehiclePicker(false)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
              {settings.vehicles.map((v) => (
                <div
                  key={v}
                  onClick={() => {
                    setVehicleNo(v);
                    setShowVehiclePicker(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    background: vehicleNo === v ? "rgba(212, 168, 67, 0.12)" : "rgba(255,255,255,0.01)",
                    borderColor: vehicleNo === v ? "var(--gold)" : "var(--card-border)",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Icons.Truck size={16} style={{ color: vehicleNo === v ? "var(--gold)" : "var(--text-muted)" }} />
                    <span style={{ fontSize: "14px", fontWeight: 600, color: vehicleNo === v ? "var(--gold)" : "#FFFFFF" }}>
                      {v}
                    </span>
                  </div>
                  {vehicleNo === v && <Icons.Check size={18} style={{ color: "var(--gold)" }} />}
                </div>
              ))}
              {settings.vehicles.length === 0 && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "16px" }}>
                  No vehicles added. Open Settings to add vehicles.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Animation Modal */}
      {showSuccess && (
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
              width: "220px",
              textAlign: "center",
            }}
          >
            <div style={{ width: "120px", height: "120px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <DotLottieReact data={invoiceMadeAnimation} loop={false} autoplay />
            </div>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#FFFFFF" }}>
              {isEdit ? "LR Updated!" : "LR Created!"}
            </span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Redirecting to details...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
