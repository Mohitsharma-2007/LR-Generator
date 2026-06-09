import { useLocation } from "wouter";
import * as Icons from "lucide-react";
import { useLR, ROUTES } from "../context/LRContext";
import { StatCard } from "../components/StatCard";
import logoUrl from "../assets/logo/maha_laxmi.png";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import truckAnimation from "../assets/lottie/truck.json";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { lrs } = useLR();

  const thisMonth = lrs.filter((lr) => {
    const parts = lr.date.split("-");
    if (parts.length < 3) return false;
    const now = new Date();
    return (
      parseInt(parts[1]) === now.getMonth() + 1 &&
      parseInt(parts[2]) === now.getFullYear()
    );
  });

  const chennaiCount = lrs.filter((lr) => lr.routeId === 1).length;
  const recentLRs = lrs.slice(0, 3);

  return (
    <div className="animate-fade-in-up" style={{ padding: "20px 0" }}>
      {/* Header Row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src={logoUrl}
            alt="Maha Laxmi Logo"
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              border: "1.5px solid rgba(212, 168, 67, 0.3)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              lineHeight: 1.1,
            }}
          >
            <span
              style={{
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--gold)",
                letterSpacing: "2px",
                fontFamily: "var(--font-outfit)",
              }}
            >
              MAHA LAXMI
            </span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: 500,
                color: "var(--text-muted)",
                letterSpacing: "2px",
              }}
            >
              TRANSPORT CO.
            </span>
          </div>
        </div>

        <button
          onClick={() => setLocation("/settings")}
          style={{
            width: "38px",
            height: "38px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text-secondary)",
          }}
          title="Open Settings"
        >
          <Icons.Sliders size={18} />
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
        <StatCard label="Total LRs" value={lrs.length} icon="FileText" />
        <StatCard
          label="This Month"
          value={thisMonth.length}
          icon="Calendar"
          highlight
        />
        <StatCard label="Chennai→" value={chennaiCount} icon="ArrowRight" />
      </div>

      {/* Hero Visual Container */}
      <div
        className="glass-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          marginBottom: "24px",
          gap: "12px",
          textAlign: "center",
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(212, 168, 67, 0.02) 100%)",
        }}
      >
        <div
          style={{
            width: "220px",
            height: "140px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <DotLottieReact data={truckAnimation} loop autoplay />
        </div>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: "var(--text-secondary)",
            letterSpacing: "0.5px",
          }}
        >
          Lorry Receipt Digital Dashboard
        </span>
      </div>

      {/* Quick Actions Label */}
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--text-muted)",
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          display: "block",
          marginBottom: "12px",
        }}
      >
        QUICK ACTIONS
      </span>

      {/* Actions Row */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px" }}>
        {/* Create LR */}
        <div
          onClick={() => setLocation("/create-lr")}
          className="glass-panel"
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #D4A843 0%, #A8782E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0A1628",
            }}
          >
            <Icons.Plus size={20} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
            Create LR
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            Manual entry
          </span>
        </div>

        {/* Scan Invoice */}
        <div
          onClick={() => setLocation("/scan")}
          className="glass-panel"
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #5A3DB5 0%, #3D2880 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Icons.Camera size={18} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
            Scan LR
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            AI extraction
          </span>
        </div>

        {/* All LRs */}
        <div
          onClick={() => setLocation("/lrs")}
          className="glass-panel"
          style={{
            flex: 1,
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #1E8C5E 0%, #156444 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
            }}
          >
            <Icons.List size={18} />
          </div>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#FFFFFF" }}>
            All LRs
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
            View records
          </span>
        </div>
      </div>

      {/* Recent LRs Header */}
      {recentLRs.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                fontWeight: 600,
                color: "var(--text-muted)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              RECENT LRs
            </span>
            <button
              onClick={() => setLocation("/lrs")}
              style={{
                background: "none",
                border: "none",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--gold)",
                cursor: "pointer",
              }}
            >
              See All
            </button>
          </div>

          {/* Recent LRs List */}
          {recentLRs.map((lr) => (
            <div
              key={lr.id}
              onClick={() => setLocation(`/lr-detail/${lr.id}`)}
              className="glass-panel"
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px",
                marginBottom: "8px",
                cursor: "pointer",
                gap: "10px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--gold)",
                  }}
                >
                  {lr.lrNo}
                </span>
                <span
                  style={{ fontSize: "11px", color: "var(--text-secondary)" }}
                >
                  {ROUTES[lr.routeId].name}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: "3px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#FFFFFF",
                  }}
                >
                  ₹{lr.frightCharge.toLocaleString("en-IN")}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {lr.date}
                </span>
              </div>
              <Icons.ChevronRight
                size={15}
                style={{ color: "rgba(212,168,67,0.4)" }}
              />
            </div>
          ))}
        </>
      )}

      {/* Empty State */}
      {lrs.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "40px 20px",
            gap: "12px",
          }}
        >
          <Icons.FileText
            size={36}
            style={{ color: "rgba(255,255,255,0.12)" }}
          />
          <span
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            No LRs yet. Create your first one!
          </span>
        </div>
      )}
    </div>
  );
}
