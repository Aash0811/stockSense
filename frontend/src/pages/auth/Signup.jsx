import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/signup`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Unable to create account");
      navigate("/login", { replace: true });
    } catch (reason) { setError(reason.message); }
    finally { setLoading(false); }
  }

  return <main className="login-shell"><section className="login-panel"><p className="eyebrow">StockSense</p><h1>Create account</h1><p className="muted">New accounts start with warehouse staff access.</p><form onSubmit={handleSubmit}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Password<input type="password" minLength="8" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required /></label>{error && <div className="notice">{error}</div>}<button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button></form><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p></section></main>;
}
