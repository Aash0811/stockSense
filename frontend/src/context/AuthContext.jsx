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

	function logout() {
		setToken(null);
		setUser(null);
		localStorage.removeItem("stocksense_user");
	}

	return <AuthContext.Provider value={{ token, user, isAuthenticated: Boolean(token), login, logout }}>{children}</AuthContext.Provider>;
}
