import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Login() {
	const { isAuthenticated, login } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState("admin@stocksense.local");
	const [password, setPassword] = useState("admin123");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	if (isAuthenticated) return <Navigate to={location.state?.from || "/dashboard"} replace />;

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");
		setLoading(true);
		try { await login(email, password); navigate("/dashboard", { replace: true }); }
		catch (reason) { setError(reason.message); }
		finally { setLoading(false); }
	}

	return <main className="login-shell"><section className="login-panel"><p className="eyebrow">StockSense</p><h1>Welcome back</h1><p className="muted">Sign in to manage stock, receipts, deliveries, and warehouse work.</p><form onSubmit={handleSubmit}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <div className="notice">{error}</div>}<button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button></form></section></main>;
}
