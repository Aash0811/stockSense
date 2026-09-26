import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Shield, Lock, Mail, ArrowRight, KeyRound, Send, CheckCircle2, ExternalLink, RefreshCw } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const DEMO_ACCOUNTS = [
  { role: "ADMIN", label: "Admin", email: "admin@stocksense.local", pass: "admin123", color: "#6366f1", badge: "Full Access" },
  { role: "INVENTORY_MANAGER", label: "Manager", email: "manager@stocksense.local", pass: "manager123", color: "#06b6d4", badge: "Inventory & POs" },
  { role: "WAREHOUSE_STAFF", label: "Staff", email: "staff@stocksense.local", pass: "staff123", color: "#10b981", badge: "Picks & Receipts" },
  { role: "AUDITOR", label: "Auditor", email: "auditor@stocksense.local", pass: "auditor123", color: "#f59e0b", badge: "Read-only Ledger" },
];

export default function Login() {
  const { isAuthenticated, login, requestLoginOtp, loginWithOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mode: "password" | "otp"
  const [loginMode, setLoginMode] = useState("otp"); // default to OTP to showcase nodemailer!
  const [email, setEmail] = useState("admin@stocksense.local");
  const [password, setPassword] = useState("admin123");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [otpNotice, setOtpNotice] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || "/dashboard"} replace />;
  }

  // Handle standard password login
  async function handlePasswordSubmit(e) {
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

  // Handle requesting OTP via Nodemailer
  async function handleRequestOtp(e) {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please provide an email address first");
      return;
    }
    setError("");
    setSendingOtp(true);
    try {
      const data = await requestLoginOtp(email);
      setOtpSent(true);
      setOtpNotice(data.message || "OTP code sent to your email!");
      if (data.devOtp) {
        setOtp(data.devOtp); // Convenience auto-fill for instant hackathon evaluation
      }
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP code");
    } finally {
      setSendingOtp(false);
    }
  }

  // Handle verifying OTP and signing in
  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP code");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await loginWithOtp(email, otp);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Invalid or expired OTP code");
    } finally {
      setLoading(false);
    }
  }

  function handleDemoSelect(acc) {
    setEmail(acc.email);
    setPassword(acc.pass);
    setOtpSent(false);
    setOtp("");
    setPreviewUrl(null);
    setOtpNotice("");
    setError("");
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
          width: "min(100%, 460px)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-medium)",
          borderRadius: "var(--radius-lg)",
          padding: "32px",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Brand Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div className="brand-icon-box">SS</div>
          <div>
            <h2 style={{ fontSize: "20px", color: "#fff", margin: 0 }}>StockSense</h2>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Enterprise Inventory System
            </span>
          </div>
        </div>

        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "6px" }}>
          Sign In
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "18px" }}>
          Choose your preferred sign-in method to access stock controls.
        </p>

        {/* Login Method Tabs */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "4px",
            marginBottom: "20px",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => { setLoginMode("otp"); setError(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              background: loginMode === "otp" ? "var(--primary-color)" : "transparent",
              color: loginMode === "otp" ? "#fff" : "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Mail size={14} />
            <span>Email OTP (Nodemailer)</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMode("password"); setError(""); }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12px",
              fontWeight: 600,
              background: loginMode === "password" ? "var(--primary-color)" : "transparent",
              color: loginMode === "password" ? "#fff" : "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <KeyRound size={14} />
            <span>Password</span>
          </button>
        </div>

        {error && <div className="notice-box notice-danger" style={{ marginBottom: "16px" }}>{error}</div>}

        {/* MODE 1: OTP BASED LOGIN */}
        {loginMode === "otp" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleRequestOtp} className="form-grid">
                <div className="form-group">
                  <label>Work Email</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                    <Mail size={16} color="var(--text-muted)" />
                    <input
                      type="email"
                      required
                      placeholder="name@stocksense.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Nodemailer will dispatch a secure 6-digit one-time code to this address.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
                  disabled={sendingOtp}
                >
                  <Send size={15} style={{ marginRight: "6px" }} />
                  {sendingOtp ? "Dispatching via Nodemailer..." : "Send Verification OTP Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="form-grid">
                {/* Status Notice */}
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.12)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontSize: "13px", fontWeight: 600 }}>
                    <CheckCircle2 size={16} />
                    <span>OTP Dispatched via Nodemailer!</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    Sent to: <strong>{email}</strong>
                  </div>

                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "11px",
                        color: "var(--accent-cyan)",
                        textDecoration: "underline",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      <ExternalLink size={12} />
                      View Live Email in Ethereal Mailbox
                    </a>
                  )}
                </div>

                <div className="form-group" style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label>6-Digit OTP Code</label>
                    <button
                      type="button"
                      onClick={() => handleRequestOtp()}
                      disabled={sendingOtp}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-cyan)",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <RefreshCw size={11} />
                      {sendingOtp ? "Resending..." : "Resend Code"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                    <Lock size={16} color="var(--text-muted)" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        color: "#38bdf8",
                        fontSize: "18px",
                        letterSpacing: "4px",
                        fontWeight: 700,
                        padding: "10px 0",
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", display: "block" }}>
                    💡 Code auto-filled for quick evaluation testing. Valid for 10 minutes.
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: "8px" }}
                  disabled={loading}
                >
                  <ArrowRight size={15} style={{ marginRight: "6px" }} />
                  {loading ? "Verifying OTP..." : "Verify OTP & Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => { setOtpSent(false); setOtp(""); }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    cursor: "pointer",
                    textAlign: "center",
                    marginTop: "4px",
                  }}
                >
                  &larr; Use a different email address
                </button>
              </form>
            )}
          </div>
        )}

        {/* MODE 2: PASSWORD LOGIN */}
        {loginMode === "password" && (
          <form onSubmit={handlePasswordSubmit} className="form-grid">
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
        )}

        {/* 1-Click Demo Testing Credentials */}
        <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              ⚡ Dummy Credentials (1-Click Test):
            </span>
            <span style={{ fontSize: "10px", color: "var(--accent-cyan)", background: "rgba(56, 189, 248, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
              Pass: [role]123 (e.g. manager123)
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoSelect(acc)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "2px",
                    padding: "8px 10px",
                    background: isSelected ? "rgba(99, 102, 241, 0.18)" : "var(--bg-card-subtle, rgba(255,255,255,0.02))",
                    border: `1px solid ${isSelected ? acc.color : "var(--border-subtle)"}`,
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#fff" }}>{acc.label}</span>
                    <span style={{ color: acc.color, fontSize: "14px", lineHeight: 1 }}>●</span>
                  </div>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", maxWidth: "160px", whiteSpace: "nowrap" }}>
                    {acc.email}
                  </span>
                  <span style={{ fontSize: "9px", color: acc.color, fontWeight: 500 }}>
                    {acc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "18px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}
