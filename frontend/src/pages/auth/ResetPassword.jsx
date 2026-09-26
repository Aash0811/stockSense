import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", otp: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);

  async function requestCode(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_URL}/auth/password-reset/request`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: form.email }) });
    const body = await response.json();
    if (!response.ok) return setError(body.error?.message || "Unable to request reset code");
    setRequested(true);
    setMessage(body.data.devOtp ? `Development OTP: ${body.data.devOtp}` : body.data.message);
  }

  async function confirmReset(event) {
    event.preventDefault();
    setError("");
    const response = await fetch(`${API_URL}/auth/password-reset/confirm`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    const body = await response.json();
    if (!response.ok) return setError(body.error?.message || "Unable to reset password");
    navigate("/login", { replace: true });
  }

  return <main className="login-shell"><section className="login-panel"><p className="eyebrow">StockSense</p><h1>Reset password</h1><p className="muted">Request a six-digit code, then choose a new password.</p>{!requested ? <form onSubmit={requestCode}><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>{error && <div className="notice">{error}</div>}<button type="submit">Request code</button></form> : <form onSubmit={confirmReset}><label>Email<input type="email" value={form.email} readOnly /></label><label>OTP<input inputMode="numeric" pattern="[0-9]{6}" maxLength="6" value={form.otp} onChange={(event) => setForm({ ...form, otp: event.target.value })} required /></label><label>New password<input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>{message && <div className="notice">{message}</div>}{error && <div className="notice">{error}</div>}<button type="submit">Reset password</button></form>}<p className="auth-switch"><Link to="/login">Back to sign in</Link></p></section></main>;
}
