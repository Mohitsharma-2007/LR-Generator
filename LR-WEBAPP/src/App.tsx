import React, { useState, useEffect } from "react";
import { Router, Route, Switch, useLocation } from "wouter";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LRProvider } from "./context/LRContext";
import { LockScreen } from "./components/LockScreen";
import { requestNotificationPermission } from "./services/notificationService";
import { App as CapApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { triggerHaptic } from "./services/hapticsService";

// Pages
import Dashboard from "./pages/Dashboard";
import LRsList from "./pages/LRsList";
import ScanInvoice from "./pages/ScanInvoice";
import Settings from "./pages/Settings";
import CreateLR from "./pages/CreateLR";
import EditLR from "./pages/EditLR";
import LRDetail from "./pages/LRDetail";
import PreviewLR from "./pages/PreviewLR";

// Icons
import * as Icons from "lucide-react";

// Bulletproof Custom Hash Locator for Wouter (Capacitor file:// protocol compatibility)
function useHashLocation() {
  const [loc, setLoc] = useState(() => {
    const hash = window.location.hash;
    return hash ? hash.substring(1) : "/";
  });

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash;
      setLoc(hash ? hash.substring(1) : "/");
    };
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [loc, navigate] as [string, (to: string) => void];
}

function MainLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  // Navigation tabs configuration
  const navItems = [
    { path: "/", label: "Home", icon: Icons.Home },
    { path: "/lrs", label: "LRs List", icon: Icons.FileText },
    { path: "/scan", label: "Scan AI", icon: Icons.Camera },
    { path: "/settings", label: "Settings", icon: Icons.Sliders },
  ];

  // Helper to check if tab is active
  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/";
    }
    return location.startsWith(path);
  };

  // Hide nav bar when editing or viewing details
  const isFormOrDetail = location.startsWith("/create-lr") || location.startsWith("/lr-detail") || location.startsWith("/edit-lr");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        maxWidth: "600px",
        margin: "0 auto",
        position: "relative",
      }}
    >
      {/* Content wrapper */}
      <main
        style={{
          flex: 1,
          padding: "16px",
          paddingBottom: isFormOrDetail ? "24px" : "96px", // Extra padding to avoid overlaying nav bar
          overflowY: "auto",
        }}
      >
        {children}
      </main>

      {/* Glassmorphic Navigation Bar */}
      {!isFormOrDetail && (
        <nav
          className="glass-panel"
          style={{
            position: "fixed",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: "568px",
            height: "64px",
            borderRadius: "20px",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "center",
            padding: "0 10px",
            zIndex: 100,
            background: "rgba(14, 25, 42, 0.7)",
            borderColor: "rgba(255, 255, 255, 0.08)",
          }}
        >
          {navItems.map((item) => {
            const ActiveIcon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  gap: "4px",
                  color: active ? "var(--gold)" : "var(--text-secondary)",
                  transition: "all 0.2s ease",
                  outline: "none",
                }}
              >
                <ActiveIcon size={20} style={{ transform: active ? "scale(1.15)" : "scale(1)" }} />
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: active ? 700 : 500,
                    letterSpacing: "0.3px",
                  }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function InnerApp() {
  const { isLocked } = useAuth();

  // Request permissions and handle hardware back button on app mount
  useEffect(() => {
    requestNotificationPermission().catch(() => {});

    if (Capacitor.isNativePlatform()) {
      const backListener = CapApp.addListener("backButton", () => {
        const hash = window.location.hash || "#/";
        const path = hash.substring(1).split("?")[0];
        
        if (
          path === "/" ||
          path === "" ||
          path === "/lock" ||
          path === "/dashboard"
        ) {
          triggerHaptic("medium");
          CapApp.exitApp();
        } else {
          triggerHaptic("light");
          window.history.back();
        }
      });

      return () => {
        backListener.then((l) => l.remove());
      };
    }
    return () => {};
  }, []);

  if (isLocked) {
    return <LockScreen />;
  }

  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/lrs" component={LRsList} />
        <Route path="/scan" component={ScanInvoice} />
        <Route path="/settings" component={Settings} />
        <Route path="/create-lr" component={CreateLR} />
        <Route path="/edit-lr/:id" component={EditLR} />
        <Route path="/lr-detail/:id" component={LRDetail} />
        <Route path="/lr-preview/:id" component={PreviewLR} />
        <Route>
          <div style={{ padding: "40px", textAlign: "center" }}>
            <h3>Page Not Found</h3>
            <button onClick={() => window.location.hash = "/"} className="btn-primary" style={{ margin: "20px auto" }}>
              Go Home
            </button>
          </div>
        </Route>
      </Switch>
    </MainLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LRProvider>
        <Router hook={useHashLocation}>
          <InnerApp />
        </Router>
      </LRProvider>
    </AuthProvider>
  );
}
