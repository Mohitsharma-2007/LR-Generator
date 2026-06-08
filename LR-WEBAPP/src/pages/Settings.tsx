import React, { useState } from "react";
import * as Icons from "lucide-react";
import { useLR } from "../context/LRContext";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { settings, lrs, updateSettings, restoreBackup } = useLR();
  const {
    appPin,
    biometricEnabled,
    hasBiometrics,
    updatePin,
    removePin,
    setBiometricEnabled,
  } = useAuth();

  const [newVehicle, setNewVehicle] = useState("");
  const [newEmail, setNewEmail] = useState("");
  
  const [senderEmail, setSenderEmail] = useState(settings.senderEmail);
  const [googleAppPassword, setGoogleAppPassword] = useState(settings.googleAppPassword);
  const [openrouterApiKey, setOpenrouterApiKey] = useState(settings.openrouterApiKey);
  const [nextLrNumber, setNextLrNumber] = useState(settings.nextLrNumber);
  const [partnerName, setPartnerName] = useState(settings.partnerName || "NISSIN ABC LOGISTICS PVT. LTD.");
  const [partnerDetails, setPartnerDetails] = useState(settings.partnerDetails || "");
  
  // Custom API endpoint option
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem("@mltc_api_url") || "");

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const [showAppPassword, setShowAppPassword] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Save text configurations
  async function handleSaveConfig() {
    try {
      await updateSettings({
        senderEmail: senderEmail.trim(),
        googleAppPassword: googleAppPassword.trim(),
        openrouterApiKey: openrouterApiKey.trim(),
        nextLrNumber: Number(nextLrNumber) || settings.nextLrNumber,
        partnerName: partnerName.trim(),
        partnerDetails: partnerDetails.trim(),
      });
      localStorage.setItem("@mltc_api_url", apiUrl.trim());
      alert("Settings saved successfully.");
    } catch (err) {
      alert("Failed to save settings: " + String(err));
    }
  }

  // Add Vehicle
  async function handleAddVehicle() {
    const val = newVehicle.trim().toUpperCase();
    if (!val) return;
    if (settings.vehicles.includes(val)) {
      alert("Vehicle already exists.");
      return;
    }
    const updated = [...settings.vehicles, val];
    await updateSettings({ vehicles: updated });
    setNewVehicle("");
  }

  // Delete Vehicle
  async function handleDeleteVehicle(v: string) {
    const updated = settings.vehicles.filter((item) => item !== v);
    await updateSettings({ vehicles: updated });
  }

  // Add Recipient Email
  async function handleAddEmail() {
    const val = newEmail.trim().toLowerCase();
    if (!val || !/\S+@\S+\.\S+/.test(val)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (settings.emailIds.includes(val)) {
      alert("Email already exists.");
      return;
    }
    const updated = [...settings.emailIds, val];
    await updateSettings({ emailIds: updated });
    setNewEmail("");
  }

  // Delete Recipient Email
  async function handleDeleteEmail(e: string) {
    const updated = settings.emailIds.filter((item) => item !== e);
    await updateSettings({ emailIds: updated });
  }

  // Enable / disable PIN
  async function handlePinSetup() {
    setPinError("");
    if (appPin) {
      // Remove PIN
      const ok = window.confirm("Are you sure you want to disable PIN lock?");
      if (ok) {
        await removePin();
        setPinInput("");
      }
    } else {
      // Enter new PIN
      if (pinInput.length !== 4 || !/^\d+$/.test(pinInput)) {
        setPinError("PIN must be exactly 4 digits.");
        return;
      }
      await updatePin(pinInput);
      setShowPinModal(false);
      setPinInput("");
    }
  }

  // Toggle Biometrics
  async function handleToggleBiometrics() {
    try {
      const nextVal = !biometricEnabled;
      await setBiometricEnabled(nextVal);
    } catch (err) {
      alert("Failed to configure biometrics: " + String(err));
    }
  }

  // Local JSON Backup (.lrbackup)
  function handleExportBackup() {
    try {
      const backup = {
        lrs,
        vehicles: settings.vehicles.map((v) => ({ vehicleNo: v })),
        settings: {
          emailIds: settings.emailIds,
          senderEmail: settings.senderEmail,
          googleAppPassword: settings.googleAppPassword,
          openrouterApiKey: settings.openrouterApiKey,
          nextLrNumber: settings.nextLrNumber,
          partnerName: settings.partnerName,
          partnerDetails: settings.partnerDetails,
        },
      };

      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `lr_backup_${Date.now()}.lrbackup`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Export failed: " + String(err));
    }
  }

  // Restore Local JSON Backup (.lrbackup)
  function handleImportBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const raw = event.target?.result as string;
        const backup = JSON.parse(raw);

        // Validate structure
        if (!backup.lrs || !Array.isArray(backup.lrs)) {
          throw new Error("Invalid backup file: missing LRs list.");
        }

        const restoreConfirm = window.confirm(
          "This will overwrite your existing local LRs and Settings. Proceed?"
        );
        if (!restoreConfirm) return;

        const importedVehicles = Array.isArray(backup.vehicles)
          ? backup.vehicles.map((v: any) => v.vehicleNo).filter(Boolean)
          : settings.vehicles;

        const importedSettings = {
          emailIds: backup.settings?.emailIds || [],
          senderEmail: backup.settings?.senderEmail || "",
          googleAppPassword: backup.settings?.googleAppPassword || "",
          openrouterApiKey: backup.settings?.openrouterApiKey || "",
          vehicles: importedVehicles,
          nextLrNumber: backup.settings?.nextLrNumber || 88,
          partnerName: backup.settings?.partnerName || "NISSIN ABC LOGISTICS PVT. LTD.",
          partnerDetails: backup.settings?.partnerDetails || "",
        };

        await restoreBackup({
          lrs: backup.lrs,
          settings: importedSettings,
        });

        // Re-sync states
        setSenderEmail(importedSettings.senderEmail);
        setGoogleAppPassword(importedSettings.googleAppPassword);
        setOpenrouterApiKey(importedSettings.openrouterApiKey);
        setNextLrNumber(importedSettings.nextLrNumber);
        setPartnerName(importedSettings.partnerName);
        setPartnerDetails(importedSettings.partnerDetails);

        alert("Data restored successfully!");
        window.location.reload();
      } catch (err) {
        alert("Import failed. Make sure the file is a valid .lrbackup JSON: " + String(err));
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, fontFamily: "var(--font-outfit)" }}>Settings</h2>

      {/* Security Lock Controls */}
      <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>Security & Access</h3>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span style={{ fontSize: "14px", fontWeight: 600, display: "block" }}>PIN Protection</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
              Require a 4-digit PIN on app launch
            </span>
          </div>
          {appPin ? (
            <button onClick={handlePinSetup} className="btn-danger" style={{ padding: "8px 16px", fontSize: "13px" }}>
              Disable PIN
            </button>
          ) : (
            <button onClick={() => { setPinError(""); setShowPinModal(true); }} className="btn-secondary" style={{ padding: "8px 16px", fontSize: "13px" }}>
              Setup PIN
            </button>
          )}
        </div>

        {hasBiometrics && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--card-border)", paddingTop: "14px" }}>
            <div>
              <span style={{ fontSize: "14px", fontWeight: 600, display: "block" }}>Biometric Login</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
                Use platform TouchID/FaceID for secure unlock
              </span>
            </div>
            <button
              onClick={handleToggleBiometrics}
              className={biometricEnabled ? "btn-primary" : "btn-secondary"}
              style={{ padding: "8px 16px", fontSize: "13px", color: biometricEnabled ? "#0A1628" : "" }}
            >
              {biometricEnabled ? "Enabled" : "Enable"}
            </button>
          </div>
        )}
      </section>

      {/* SMTP & Google Configuration */}
      <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>SMTP & API Configuration</h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label className="input-label">Sender Gmail</label>
          <input
            type="email"
            className="form-input"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="mahalaxmitransport9485@gmail.com"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="input-label">Google App Password</label>
            <button
              onClick={() => setShowAppPassword(!showAppPassword)}
              style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "11px" }}
            >
              {showAppPassword ? "Hide" : "Show"}
            </button>
          </div>
          <input
            type={showAppPassword ? "text" : "password"}
            className="form-input"
            value={googleAppPassword}
            onChange={(e) => setGoogleAppPassword(e.target.value)}
            placeholder="16-character google app password"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label className="input-label">OpenRouter API Key (Free Gemini Flash)</label>
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              style={{ background: "none", border: "none", color: "var(--gold)", cursor: "pointer", fontSize: "11px" }}
            >
              {showApiKey ? "Hide" : "Show"}
            </button>
          </div>
          <input
            type={showApiKey ? "text" : "password"}
            className="form-input"
            value={openrouterApiKey}
            onChange={(e) => setOpenrouterApiKey(e.target.value)}
            placeholder="sk-or-v1-..."
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label className="input-label">Partner Name</label>
          <input
            type="text"
            className="form-input"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder="e.g. NISSIN ABC LOGISTICS PVT. LTD."
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label className="input-label">Partner Details (Address, GST, etc.)</label>
          <textarea
            className="form-input"
            value={partnerDetails}
            onChange={(e) => setPartnerDetails(e.target.value)}
            rows={4}
            placeholder="Unit No. 222, 244, 246 &amp; 247, 2nd Floor,&#10;Centrum Plaza, Golf Course Road, Sector - 53,&#10;Gurugram - 122 002, Haryana,&#10;GSTIN: 06AABCN0379D1ZS"
            style={{ fontFamily: "monospace", fontSize: "12.5px", resize: "vertical" }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">Next LR Number</label>
            <input
              type="number"
              className="form-input"
              value={nextLrNumber}
              onChange={(e) => setNextLrNumber(Number(e.target.value) || 0)}
            />
          </div>
          <div style={{ flex: 2, display: "flex", flexDirection: "column", gap: "4px" }}>
            <label className="input-label">API SMTP Server URL (relative default)</label>
            <input
              type="text"
              className="form-input"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="e.g. http://localhost:5000"
            />
          </div>
        </div>

        <button onClick={handleSaveConfig} className="btn-primary" style={{ marginTop: "10px" }}>
          <Icons.Save size={16} />
          <span>Save Settings</span>
        </button>
      </section>

      {/* Vehicle Management */}
      <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>Vehicle Numbers</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            className="form-input"
            value={newVehicle}
            onChange={(e) => setNewVehicle(e.target.value)}
            placeholder="e.g. UP16PT9444"
            style={{ textTransform: "uppercase" }}
          />
          <button onClick={handleAddVehicle} className="btn-secondary" style={{ padding: "10px 16px" }}>
            <Icons.Plus size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto", marginTop: "4px" }}>
          {settings.vehicles.map((v) => (
            <div
              key={v}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--card-border)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{v}</span>
              <button
                onClick={() => handleDeleteVehicle(v)}
                style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", display: "flex" }}
              >
                <Icons.Trash2 size={13} />
              </button>
            </div>
          ))}
          {settings.vehicles.length === 0 && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
              No vehicles configured.
            </span>
          )}
        </div>
      </section>

      {/* Recipient Email Management */}
      <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>Recipient Emails</h3>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="email"
            className="form-input"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="recipient@example.com"
          />
          <button onClick={handleAddEmail} className="btn-secondary" style={{ padding: "10px 16px" }}>
            <Icons.Plus size={16} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto", marginTop: "4px" }}>
          {settings.emailIds.map((email) => (
            <div
              key={email}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--card-border)",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              <span>{email}</span>
              <button
                onClick={() => handleDeleteEmail(email)}
                style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", display: "flex" }}
              >
                <Icons.Trash2 size={13} />
              </button>
            </div>
          ))}
          {settings.emailIds.length === 0 && (
            <span style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", padding: "10px" }}>
              No recipients configured.
            </span>
          )}
        </div>
      </section>

      {/* Backup and Restore JSON file locally */}
      <section className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--gold)" }}>Backup & Recovery</h3>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
          Export all Lorry Receipts and configuration parameters locally as a `.lrbackup` backup file, or restore them.
        </span>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={handleExportBackup} className="btn-secondary" style={{ flex: 1 }}>
            <Icons.Download size={14} />
            <span>Backup Data</span>
          </button>
          
          <label className="btn-secondary" style={{ flex: 1, cursor: "pointer" }}>
            <Icons.Upload size={14} />
            <span>Restore Data</span>
            <input
              type="file"
              accept=".lrbackup"
              onChange={handleImportBackup}
              style={{ display: "none" }}
            />
          </label>
        </div>
      </section>

      {/* Setup PIN lock modal */}
      {showPinModal && (
        <div className="modal-overlay">
          <div className="modal-sheet" style={{ maxWidth: "340px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--gold)" }}>Set 4-Digit PIN</span>
              <button
                onClick={() => { setShowPinModal(false); setPinInput(""); }}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
              >
                <Icons.X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input
                type="password"
                maxLength={4}
                className="form-input"
                placeholder="Enter 4 numbers"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                style={{ textAlign: "center", letterSpacing: "8px", fontSize: "20px" }}
              />
              {pinError && <span style={{ fontSize: "12px", color: "var(--error)" }}>{pinError}</span>}
              <button onClick={handlePinSetup} className="btn-primary" style={{ width: "100%" }}>
                Confirm PIN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
