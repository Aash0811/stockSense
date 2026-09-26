import { useEffect, useState } from "react";
import { User, Shield, Mail, Calendar, CheckCircle2, Key } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ROLE_PERMISSIONS = {
  ADMIN: [
    "Complete Master Control",
    "Product & Variant Lifecycle Management",
    "Warehouse & Location Creation",
    "Approve Goods In & Goods Out",
    "Override Physical Stock Adjustments",
    "View Full Financial & Audit Logs",
  ],
  INVENTORY_MANAGER: [
    "Manage Product Catalog & SKUs",
    "Reorder Point & Safety Stock Configuration",
    "Approve Supplier Receipts & Customer Deliveries",
    "Schedule Inter-Warehouse Transfers",
    "Review Anomaly Flags & Dead Stock",
  ],
  WAREHOUSE_STAFF: [
    "Receive Supplier Shipments",
    "Pick, Pack & Ship Customer Deliveries",
    "Execute Physical Stock Count Adjustments",
    "Dispatch & Receive Internal Transfers",
  ],
  AUDITOR: [
    "Read-Only System-Wide Visibility",
    "Inspect Immutable Stock Ledger",
    "Examine Suspicious Discrepancies & Anomalies",
    "Verify Inventory Reconciliation Timeline",
  ],
};

export default function Profile() {
  const { token, user, logout } = useAuth();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error?.message || "Failed to load profile");
        setProfile(body.data);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  const currentRole = profile?.role || "WAREHOUSE_STAFF";
  const permissions = ROLE_PERMISSIONS[currentRole] || ROLE_PERMISSIONS.WAREHOUSE_STAFF;

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Operator Profile & RBAC Permissions</h1>
          <p>Role-Based Access Control powers and active enterprise credential identity</p>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* User Identity Card */}
        <div className="table-card" style={{ padding: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
                display: "grid",
                placeItems: "center",
                color: "#fff",
                fontSize: "22px",
                fontWeight: 700,
              }}
            >
              {profile?.name ? profile.name[0].toUpperCase() : "U"}
            </div>
            <div>
              <h2 style={{ fontSize: "20px", color: "#fff" }}>{profile?.name || "Operator"}</h2>
              <span className={`role-badge ${currentRole.toLowerCase().replace("inventory_", "").replace("warehouse_", "")}`} style={{ marginTop: "4px" }}>
                <Shield size={12} /> {currentRole.replace("_", " ")}
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gap: "14px", borderTop: "1px solid var(--border-subtle)", paddingTop: "18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Mail size={16} color="var(--text-muted)" />
              <span style={{ color: "var(--text-muted)" }}>Email:</span>
              <strong style={{ color: "#fff" }}>{profile?.email || "-"}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Key size={16} color="var(--text-muted)" />
              <span style={{ color: "var(--text-muted)" }}>Access Token:</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-emerald)" }}>JWT Active (Bearer)</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
              <Calendar size={16} color="var(--text-muted)" />
              <span style={{ color: "var(--text-muted)" }}>Active Since:</span>
              <strong style={{ color: "#fff" }}>
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Active"}
              </strong>
            </div>
          </div>
        </div>

        {/* Permissions & Powers Matrix */}
        <div className="table-card" style={{ padding: "28px" }}>
          <h3 style={{ fontSize: "16px", marginBottom: "6px" }}>Enforced Role Permissions</h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Granular access rights granted to your account under Role-Based Access Control
          </p>

          <div style={{ display: "grid", gap: "10px" }}>
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 14px",
                  background: "var(--bg-input)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  color: "#fff",
                }}
              >
                <CheckCircle2 size={15} color="var(--accent-emerald)" style={{ flexShrink: 0 }} />
                <span>{perm}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
