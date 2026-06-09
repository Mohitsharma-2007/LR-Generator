import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { useAuth } from "../context/AuthContext";
import logoUrl from "../assets/logo/maha_laxmi.png";

import { triggerHaptic } from "../services/hapticsService";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "DEL"];

export function LockScreen() {
  const {
    authenticateBiometric,
    verifyPin,
    appPin,
    biometricEnabled,
    hasBiometrics,
  } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const showPin = !!appPin;
  const showBiometric = biometricEnabled && hasBiometrics;

  useEffect(() => {
    if (showBiometric) {
      const t = setTimeout(() => {
        handleBiometricAuth();
      }, 500);
      return () => clearTimeout(t);
    }
    return;
  }, [showBiometric]);

  useEffect(() => {
    if (pin.length === 4) {
      const ok = verifyPin(pin);
      if (ok) {
        triggerHaptic("success");
      } else {
        triggerHaptic("error");
        setError("Incorrect PIN");
        setShake(true);
        const t = setTimeout(() => {
          setShake(false);
          setPin("");
        }, 300);
        const t2 = setTimeout(() => setError(""), 1700);
        return () => {
          clearTimeout(t);
          clearTimeout(t2);
        };
      }
    }
    return;
  }, [pin, verifyPin]);

  async function handleBiometricAuth() {
    try {
      await authenticateBiometric();
    } catch (err) {
      console.error("Biometric authentication error:", err);
    }
  }

  function pressKey(key: string) {
    triggerHaptic("light");
    if (key === "DEL") {
      setPin((p) => p.slice(0, -1));
      setError("");
    } else if (pin.length < 4) {
      setPin((p) => p + key);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#060E1C",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "var(--font-inter)",
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: "absolute",
          top: "25%",
          alignSelf: "center",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          backgroundColor: "rgba(212, 168, 67, 0.04)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "400px",
        }}
      >
        {/* Top Branding */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "50%",
              border: "1.5px solid rgba(212, 168, 67, 0.25)",
              backgroundColor: "rgba(212, 168, 67, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
              overflow: "hidden",
            }}
          >
            <img
              src={logoUrl}
              alt="Logo"
              style={{ width: "86px", height: "86px", borderRadius: "50%" }}
            />
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--gold)",
              letterSpacing: "4px",
              margin: 0,
              fontFamily: "var(--font-outfit)",
            }}
          >
            MAHA LAXMI
          </h1>
          <p
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "var(--gold)",
              letterSpacing: "4px",
              marginTop: "4px",
              textTransform: "uppercase",
            }}
          >
            TRANSPORT CO.
          </p>
          <span
            style={{
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "12px",
              letterSpacing: "0.5px",
            }}
          >
            LR Generator · Secure Access
          </span>
        </div>

        {/* PIN pad */}
        {showPin && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <span
              style={{
                fontSize: "13px",
                color: error ? "var(--error)" : "var(--text-secondary)",
                marginBottom: "24px",
                letterSpacing: "0.2px",
                transition: "color 0.2s ease",
              }}
            >
              {error || "Enter your PIN"}
            </span>

            {/* Dots */}
            <div
              className={shake ? "animate-shake" : ""}
              style={{
                display: "flex",
                gap: "20px",
                marginBottom: "40px",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "13px",
                    height: "13px",
                    borderRadius: "50%",
                    border: "1.5px solid var(--gold)",
                    backgroundColor:
                      pin.length > i ? "var(--gold)" : "transparent",
                    transition:
                      "background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
              ))}
            </div>

            {/* Keypad Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "14px",
                width: "270px",
                justifyItems: "center",
              }}
            >
              {KEYS.map((key, idx) => {
                if (key === "") {
                  return (
                    <div key={idx} style={{ width: "72px", height: "72px" }} />
                  );
                }
                return (
                  <button
                    key={idx}
                    onClick={() => pressKey(key)}
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      backgroundColor: "var(--card-bg)",
                      border: "1px solid var(--card-border)",
                      color: "var(--text-primary)",
                      fontSize: "24px",
                      fontWeight: 500,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      outline: "none",
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--gold-glow)";
                      e.currentTarget.style.borderColor = "var(--gold)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--card-bg)";
                      e.currentTarget.style.borderColor =
                        "var(--card-border)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "var(--card-bg)";
                      e.currentTarget.style.borderColor =
                        "var(--card-border)";
                    }}
                  >
                    {key === "DEL" ? (
                      <Icons.Delete
                        size={20}
                        style={{ color: "var(--gold-dark)" }}
                      />
                    ) : (
                      key
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Biometrics Action Trigger Button */}
        {showBiometric && (
          <button
            onClick={handleBiometricAuth}
            className="btn-secondary"
            style={{
              marginTop: "24px",
              borderColor: "rgba(212, 168, 67, 0.25)",
              background: "rgba(212, 168, 67, 0.06)",
              color: "var(--gold)",
              padding: "12px 24px",
              borderRadius: "16px",
              cursor: "pointer",
            }}
          >
            <Icons.Fingerprint size={18} />
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              Use Biometrics
            </span>
          </button>
        )}

        {!showPin && !showBiometric && (
          <span
            style={{
              color: "var(--text-muted)",
              fontSize: "13px",
              marginTop: "20px",
            }}
          >
            No lock method active
          </span>
        )}
      </div>

      <div
        style={{ position: "absolute", bottom: "24px", textAlign: "center" }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "var(--text-muted)",
            letterSpacing: "0.3px",
          }}
        >
          Private & Secure · Maha Laxmi Transport Co.
        </span>
      </div>
    </div>
  );
}
