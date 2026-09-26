import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AuthProvider({ children }) {
	const [token, setToken] = useState(() => localStorage.getItem("stocksense_token"));
	const [user, setUser] = useState(() => {
		const saved = localStorage.getItem("stocksense_user");
		return saved ? JSON.parse(saved) : null;
	});

	useEffect(() => {
		if (token) localStorage.setItem("stocksense_token", token);
		else localStorage.removeItem("stocksense_token");
	}, [token]);

	async function login(email, password) {
		const response = await fetch(`${API_URL}/auth/login`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		const body = await response.json();
		if (!response.ok) throw new Error(body.error?.message || "Login failed");
		setToken(body.data.token);
		setUser(body.data.user);
		localStorage.setItem("stocksense_user", JSON.stringify(body.data.user));
	}

	async function requestLoginOtp(email) {
		const response = await fetch(`${API_URL}/auth/otp/request`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email }),
		});
		const body = await response.json();
		if (!response.ok) throw new Error(body.error?.message || "Failed to send OTP");
		return body.data;
	}

	async function loginWithOtp(email, otp) {
		const response = await fetch(`${API_URL}/auth/otp/verify`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ email, otp }),
		});
		const body = await response.json();
		if (!response.ok) throw new Error(body.error?.message || "OTP verification failed");
		setToken(body.data.token);
		setUser(body.data.user);
		localStorage.setItem("stocksense_user", JSON.stringify(body.data.user));
		return body.data;
	}

	function logout() {
		setToken(null);
		setUser(null);
		localStorage.removeItem("stocksense_user");
	}

	return (
		<AuthContext.Provider
			value={{
				token,
				user,
				isAuthenticated: Boolean(token),
				login,
				requestLoginOtp,
				loginWithOtp,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}
