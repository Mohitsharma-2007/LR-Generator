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
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        border: "1px solid",
        gap: "5px",
        transition: "all 0.3s ease",
        background: highlight ? "var(--gold-glow)" : "var(--card-bg)",
        borderColor: highlight
          ? "var(--card-border-active)"
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
            ? "var(--gold-glow)"
            : "var(--bg-dark)",
        }}
      >
        {IconComponent && (
          <IconComponent
            size={16}
            style={{
              color: highlight ? "var(--gold-text)" : "var(--text-secondary)",
            }}
          />
        )}
      </div>
      <span
        style={{
          fontSize: "22px",
          fontWeight: 700,
          fontFamily: "var(--font-outfit)",
          color: "var(--text-primary)",
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
          color: highlight ? "var(--gold-dark)" : "var(--text-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
