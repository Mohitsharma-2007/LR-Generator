import { useEffect, useState, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES, type InvoiceRecord } from "../context/LRContext";
import { InvoiceRow } from "../components/InvoiceRow";
import { triggerHaptic } from "../services/hapticsService";
import { generateLRHtml } from "../services/pdfHtml";

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

export default function EditLR() {
  const [, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { updateLR, getLRById, settings } = useLR();

  const existing = useMemo(() => (id ? getLRById(id) : undefined), [id, getLRById]);

  // Form Fields
  const [routeId, setRouteId] = useState<1 | 2>(1);
  const [lrNo, setLrNo] = useState("");
  const [consignmentNo, setConsignmentNo] = useState("");
  const [date, setDate] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);

  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [showRoutePicker, setShowRoutePicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  // Pre-fill existing data
  useEffect(() => {
    if (existing) {
      setRouteId(existing.routeId);
      setLrNo(existing.lrNo);
      setConsignmentNo(existing.consignmentNo);
      setDate(existing.date);
      setVehicleNo(existing.vehicleNo);
      setInvoices(existing.invoices || []);
    } else {
      // If not found, redirect back
      setLocation("/lrs");
    }
  }, [existing, setLocation]);

  const activeRoute = ROUTES[routeId];

  // Handle route change
  function handleRouteChange(newId: 1 | 2) {
    triggerHaptic("light");
    setRouteId(newId);
    const r = ROUTES[newId];
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
    invId: string,
    field: keyof InvoiceRecord,
    value: string
  ) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invId
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
    triggerHaptic("light");
    setInvoices((prev) => [
      ...prev,
      newInvoice(activeRoute.defaultDrop, activeRoute.frightCharge),
    ]);
  }

  // Delete invoice row
  function deleteInvoiceRow(invId: string) {
    triggerHaptic("warning");
    setInvoices((prev) => prev.filter((inv) => inv.id !== invId));
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

  // Save changes
  async function handleSave() {
    triggerHaptic("light");
    const err = validate();
    if (err) {
      triggerHaptic("error");
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

      if (id) {
        await updateLR(id, lrData);
        triggerHaptic("success");
        setLocation(`/lr-detail/${id}`);
      }
    } catch (err) {
      triggerHaptic("error");
      alert("Failed to save changes: " + String(err));
    } finally {
      setSaving(false);
    }
  }

  if (!existing) return null;

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--card-border)", paddingBottom: "14px" }}>
        <button
          onClick={() => { triggerHaptic("light"); window.history.back(); }}
          style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", display: "flex" }}
        >
          <Icons.ArrowLeft size={22} />
        </button>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, fontFamily: "var(--font-outfit)" }}>
          Edit Lorry Receipt
        </h2>
        <div style={{ width: "22px" }} />
      </div>

      {/* Form Fields */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Route Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <label className="input-label">Route Selection</label>
          <button
            onClick={() => { triggerHaptic("light"); setShowRoutePicker(true); }}
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
              onClick={() => { triggerHaptic("light"); setShowVehiclePicker(true); }}
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
                <Icons.Truck size={16} style={{ color: "var(--gold)" }} />
                <span>{vehicleNo || "Select Vehicle"}</span>
              </div>
              <Icons.ChevronDown size={16} style={{ color: "var(--text-muted)" }} />
            </button>
          </div>
        </section>

        {/* Invoice Rows */}
        <section className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Invoices &amp; Freights
            </h3>
            <button
              onClick={addInvoiceRow}
              className="btn-secondary"
              style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Icons.Plus size={14} />
              <span>Add Row</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {invoices.map((inv, idx) => (
              <InvoiceRow
                key={inv.id}
                index={idx}
                invoice={inv}
                onChange={handleInvoiceChange}
                onDelete={deleteInvoiceRow}
                canDelete={invoices.length > 1}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Form Action Footer */}
      <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
        <button
          onClick={() => { triggerHaptic("light"); setShowPreview(true); }}
          className="btn-secondary"
          style={{ flex: 1, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <Icons.Eye size={18} />
          <span>Preview</span>
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
          style={{ flex: 2, padding: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {saving ? (
            <>
              <Icons.Loader className="animate-spin-fast" size={18} />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Icons.Save size={18} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Center-Aligned Route Picker Modal */}
      {showRoutePicker && (
        <div className="modal-overlay" onClick={() => setShowRoutePicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>Select Route</span>
              <button
                onClick={() => { triggerHaptic("light"); setShowRoutePicker(false); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            {([1, 2] as const).map((rid) => (
              <div
                key={rid}
                onClick={() => handleRouteChange(rid)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--card-border)",
                  background: routeId === rid ? "rgba(212, 168, 67, 0.12)" : "rgba(255,255,255,0.01)",
                  borderColor: routeId === rid ? "var(--gold)" : "var(--card-border)",
                  cursor: "pointer",
                  marginBottom: "8px",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    border: "2px solid var(--card-border)",
                    borderColor: routeId === rid ? "var(--gold)" : "var(--card-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {routeId === rid && (
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold)" }} />
                  )}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500 }}>{ROUTES[rid].name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Center-Aligned Vehicle Picker Modal */}
      {showVehiclePicker && (
        <div className="modal-overlay" onClick={() => setShowVehiclePicker(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>Select Vehicle</span>
              <button
                onClick={() => { triggerHaptic("light"); setShowVehiclePicker(false); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {settings.vehicles.map((v) => (
                <div
                  key={v}
                  onClick={() => {
                    triggerHaptic("light");
                    setVehicleNo(v);
                    setShowVehiclePicker(false);
                  }}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: "1px solid var(--card-border)",
                    background: vehicleNo === v ? "rgba(212, 168, 67, 0.12)" : "rgba(255,255,255,0.01)",
                    borderColor: vehicleNo === v ? "var(--gold)" : "var(--card-border)",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 500,
                  }}
                >
                  {v}
                </div>
              ))}
              {settings.vehicles.length === 0 && (
                <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
                  No vehicles configured. Add vehicles in Settings.
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Center-Aligned Live Document Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div
            className="modal-sheet"
            style={{ maxWidth: "90%", width: "500px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>LR Document Preview</span>
              <button
                onClick={() => { triggerHaptic("light"); setShowPreview(false); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            <div style={{ border: "1px solid var(--card-border)", borderRadius: "12px", overflow: "hidden", background: "white" }}>
              <iframe
                srcDoc={generateLRHtml({
                  lrNo,
                  consignmentNo,
                  date,
                  vehicleNo,
                  routeId,
                  frightCharge: invoices.reduce((sum, inv) => sum + inv.freightCharge, 0),
                  invoices,
                } as any)}
                style={{ width: "100%", height: "450px", border: "none" }}
                title="LR Live Preview"
              />
            </div>
            <button
              onClick={() => { triggerHaptic("light"); setShowPreview(false); }}
              className="btn-secondary"
              style={{ width: "100%" }}
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
