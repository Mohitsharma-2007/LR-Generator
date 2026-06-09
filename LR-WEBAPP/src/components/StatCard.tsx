import * as Icons from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Icons;
  highlight?: boolean;
}

export function StatCard({ label, value, icon, highlight }: StatCardProps) {
  const IconComponent = Icons[icon] as React.ComponentType<any>;

  return (
    <div
      style={{
        flex: 1,
        borderRadius: "18px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid",
        gap: "5px",
        transition: "all 0.3s ease",
        background: highlight ? "rgba(212, 168, 67, 0.18)" : "var(--card-bg)",
        borderColor: highlight
          ? "rgba(212, 168, 67, 0.4)"
          : "var(--card-border)",
      }}
      className="glass-panel"
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "2px",
          background: highlight
            ? "rgba(10, 22, 40, 0.25)"
            : "rgba(212, 168, 67, 0.12)",
        }}
      >
        {IconComponent && (
          <IconComponent
            size={16}
            className={highlight ? "text-dark" : "text-gold"}
            style={{
              color: highlight ? "#0A1628" : "#D4A843",
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "var(--font-outfit)",
          color: highlight ? "#0A1628" : "#FFFFFF",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "9.5px",
          fontWeight: 600,
          textAlign: "center",
          letterSpacing: "0.8px",
          textTransform: "uppercase",
          color: highlight ? "rgba(10, 22, 40, 0.65)" : "var(--text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
