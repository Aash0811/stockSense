import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Barcode,
  Bell,
  LogOut,
  Search,
  UserCheck,
  X,
  AlertTriangle,
  ChevronDown,
  Shield,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DEMO_USERS = [
  { role: "ADMIN", email: "admin@stocksense.local", label: "Admin" },
  { role: "INVENTORY_MANAGER", email: "manager@stocksense.local", label: "Manager" },
  { role: "WAREHOUSE_STAFF", email: "staff@stocksense.local", label: "Staff" },
  { role: "AUDITOR", email: "auditor@stocksense.local", label: "Auditor" },
];

export default function Navbar({ onOpenScanner }) {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/reports/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.data) setNotifications(body.data);
      })
      .catch(() => {});
  }, [token]);

  async function handleQuickRoleSwitch(email) {
    try {
      setSwitching(true);
      await login(email, "admin123");
      setShowRoleMenu(false);
      window.location.reload();
    } catch {
      // Fallback
    } finally {
      setSwitching(false);
    }
  }

  const roleClass = (user?.role || "staff").toLowerCase().replace("inventory_", "").replace("warehouse_", "");

  return (
    <header className="navbar-container">
      <div className="navbar-search">
        <Search size={16} color="var(--text-muted)" />
        <input
          placeholder="Quick search SKU, batch, or location (Press '/' to focus)"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              navigate(`/products?search=${encodeURIComponent(e.target.value.trim())}`);
            }
          }}
        />
      </div>

      <div className="navbar-right">
        {/* Quick Barcode Scanner Button */}
        <button
          className="quick-action-btn"
          onClick={onOpenScanner}
          title="Open Barcode / QR Scanner"
        >
          <Barcode size={16} color="var(--accent-cyan)" />
          <span>Barcode / QR</span>
        </button>

        {/* Quick Role Switcher for Hackathon Testing */}
        <div style={{ position: "relative" }}>
          <button
            className={`role-badge ${roleClass}`}
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{ cursor: "pointer", border: "1px solid rgba(255,255,255,0.2)" }}
            title="Switch user role for testing permissions"
          >
            <Shield size={12} />
            <span>{user?.role?.replace("_", " ") || "STAFF"}</span>
            <ChevronDown size={12} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: "absolute",
                top: "120%",
                right: 0,
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                width: "220px",
                zIndex: 60,
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div style={{ padding: "6px 8px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                TEST ROLE SWITCHER
              </div>
              {DEMO_USERS.map((demo) => (
                <button
                  key={demo.role}
                  disabled={switching}
                  onClick={() => handleQuickRoleSwitch(demo.email)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "8px 10px",
                    background: user?.email === demo.email ? "rgba(99, 102, 241, 0.2)" : "transparent",
                    border: "none",
                    borderRadius: "4px",
                    color: user?.email === demo.email ? "#fff" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "12px",
                    textAlign: "left",
                  }}
                >
                  <span>{demo.label}</span>
                  {user?.email === demo.email && <UserCheck size={14} color="#10b981" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div style={{ position: "relative" }}>
          <button
            className="quick-action-btn"
            style={{ padding: "6px 9px", position: "relative" }}
            onClick={() => setShowNotifs(!showNotifs)}
          >
            <Bell size={16} />
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "var(--accent-rose)",
                  color: "#fff",
                  fontSize: "10px",
                  fontWeight: 700,
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div
              style={{
                position: "absolute",
                top: "120%",
                right: 0,
                width: "340px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-lg)",
                zIndex: 60,
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border-subtle)",
                }}
              >
                <strong style={{ fontSize: "13px" }}>Active Stock Alerts</strong>
                <button
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  onClick={() => setShowNotifs(false)}
                >
                  <X size={14} />
                </button>
              </div>

              {notifications.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                  No critical stock alerts. All levels healthy!
                </div>
              ) : (
                <div style={{ padding: "8px" }}>
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: notif.severity === "critical" ? "rgba(244, 63, 94, 0.1)" : "rgba(245, 158, 11, 0.1)",
                        marginBottom: "6px",
                        display: "flex",
                        gap: "10px",
                        alignItems: "flex-start",
                      }}
                    >
                      <AlertTriangle
                        size={15}
                        color={notif.severity === "critical" ? "var(--accent-rose)" : "var(--accent-amber)"}
                        style={{ flexShrink: 0, marginTop: "2px" }}
                      />
                      <div style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                        <div>{notif.message}</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Warehouse: {notif.warehouse} · Reorder: {notif.reorderPoint}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
            {user?.name || "Operator"}
          </span>
          <button
            className="action-btn-sm"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Sign out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
}
