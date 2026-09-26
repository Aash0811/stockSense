import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Shield } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "WAREHOUSE_STAFF",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create account");

      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "radial-gradient(ellipse at top, #111827 0%, #090d16 100%)",
      }}
    >
      <div
        style={{
          width: "min(100%, 440px)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "36px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div className="brand-icon-box">SS</div>
          <div>
            <h2 style={{ fontSize: "20px", color: "#fff" }}>StockSense</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Enterprise Provisioning
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
          Create Account
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "22px" }}>
          Register for RBAC inventory management access.
        </p>

        {error && <div className="notice-box notice-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Full Name</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <User size={16} color="var(--text-muted)" />
              <input
                required
                placeholder="e.g. Maya Patel"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Work Email</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <Mail size={16} color="var(--text-muted)" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password (Min 8 characters)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Select Role (RBAC Permissions)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <Shield size={16} color="var(--accent-cyan)" />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0", cursor: "pointer" }}
              >
                <option value="ADMIN">Admin (Full Control)</option>
                <option value="INVENTORY_MANAGER">Inventory Manager</option>
                <option value="WAREHOUSE_STAFF">Warehouse Staff (Pick/Pack/Intake)</option>
                <option value="AUDITOR">Auditor (Ledger Read-Only)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
          Already registered?{" "}
          <Link to="/login" style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
