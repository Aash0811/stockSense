import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", label: "Admin", email: "admin@stocksense.local", pass: "admin123", color: "#6366f1" },
  { role: "INVENTORY_MANAGER", label: "Manager", email: "manager@stocksense.local", pass: "admin123", color: "#06b6d4" },
  { role: "WAREHOUSE_STAFF", label: "Staff", email: "staff@stocksense.local", pass: "admin123", color: "#10b981" },
  { role: "AUDITOR", label: "Auditor", email: "auditor@stocksense.local", pass: "admin123", color: "#f59e0b" },
];

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("admin@stocksense.local");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoSelect(acc) {
    setEmail(acc.email);
    setPassword(acc.pass);
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
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <div className="brand-icon-box">SS</div>
          <div>
            <h2 style={{ fontSize: "20px", color: "#fff" }}>StockSense</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Enterprise Inventory System
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
          Sign In
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "22px" }}>
          Access real-time stock balances, warehouse operations, and ledger audit.
        </p>

        {error && <div className="notice-box notice-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Work Email</label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <Mail size={16} color="var(--text-muted)" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label>Password</label>
              <Link to="/reset-password" style={{ fontSize: "11px", color: "var(--accent-cyan)" }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
              <Lock size={16} color="var(--text-muted)" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "Authenticating..." : "Sign In to Operations"}
          </button>
        </form>

        {/* 1-Click Demo Testing Credentials */}
        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600, display: "block", marginBottom: "8px", textTransform: "uppercase" }}>
            1-Click Demo Accounts (Test RBAC):
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                type="button"
                className="action-btn-sm"
                onClick={() => handleDemoSelect(acc)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "11px",
                  borderColor: email === acc.email ? acc.color : undefined,
                  background: email === acc.email ? "rgba(99, 102, 241, 0.15)" : undefined,
                }}
              >
                <span>{acc.label}</span>
                <span style={{ color: acc.color, fontWeight: 700 }}>●</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
