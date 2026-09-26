import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@stocksense.local", otp: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);

  async function requestCode(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to request reset OTP");

      setRequested(true);
      if (body.data?.previewUrl) {
        setPreviewUrl(body.data.previewUrl);
      }
      if (body.data?.devOtp) {
        setMessage(`Security OTP dispatched via Nodemailer! Dev code: ${body.data.devOtp}`);
        setForm((f) => ({ ...f, otp: body.data.devOtp }));
      } else {
        setMessage(body.data?.message || "OTP code sent to email.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function confirmReset(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/password-reset/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Reset failed");

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
        <Link
          to="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "12px",
            marginBottom: "18px",
          }}
        >
          <ArrowLeft size={14} /> Back to Sign In
        </Link>

        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>
          Reset Password
        </h1>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "22px" }}>
          {!requested
            ? "Enter your registered email to receive a six-digit verification OTP."
            : "Enter the verification code and set your new account password."}
        </p>

        {error && <div className="notice-box notice-danger">{error}</div>}
        {message && <div className="notice-box notice-info">{message}</div>}

        {!requested ? (
          <form onSubmit={requestCode} className="form-grid">
            <div className="form-group">
              <label>Work Email</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                <Mail size={16} color="var(--text-muted)" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
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
              {loading ? "Requesting..." : "Send Verification OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={confirmReset} className="form-grid">
            <div className="form-group">
              <label>Six-Digit OTP</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                <KeyRound size={16} color="var(--accent-cyan)" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={form.otp}
                  onChange={(e) => setForm({ ...form, otp: e.target.value })}
                  style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0", letterSpacing: "4px", fontFamily: "var(--font-mono)", fontSize: "16px" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label>New Password (Min 8 chars)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                <Lock size={16} color="var(--text-muted)" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Choose strong password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
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
              {loading ? "Updating..." : "Update Password & Sign In"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
