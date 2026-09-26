import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Search, Warehouse } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Warehouses() {
	const { token, user, logout } = useAuth();
	const navigate = useNavigate();
	const [warehouses, setWarehouses] = useState([]);
	const [search, setSearch] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		const params = search ? `?search=${encodeURIComponent(search)}` : "";
		fetch(`${API_URL}/warehouses${params}`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(async (response) => {
				const body = await response.json();
				if (!response.ok) throw new Error(body.error?.message || "Unable to load warehouses");
				return body.data;
			})
			.then((data) => setWarehouses(data.items || []))
			.catch((reason) => setError(reason.message));
	}, [search, token]);

	return (
		<main className="operation-shell">
			<header className="operation-header">
				<div>
					<Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link>
					<p className="eyebrow">Operations / Warehouses</p>
					<h1>Warehouses</h1>
					<p className="muted">Manage the physical sites where StockSense tracks inventory.</p>
				</div>
				<div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div>
			</header>
			<section className="operation-toolbar"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search warehouses" /></label></section>
			{error && <div className="notice">{error}</div>}
			<section className="records-panel"><table><thead><tr><th>Warehouse</th><th>Code</th><th>City</th><th>Locations</th><th>Status</th></tr></thead><tbody>{warehouses.map((warehouse) => <tr key={warehouse.id}><td><span className="warehouse-name"><Warehouse size={15} />{warehouse.name}</span></td><td>{warehouse.code}</td><td>{warehouse.city || "-"}</td><td>{warehouse._count?.locations ?? 0}</td><td><span className={warehouse.isActive ? "status-active" : "status-inactive"}>{warehouse.isActive ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table>{!error && !warehouses.length && <p className="empty-state">No warehouses found.</p>}</section>
		</main>
	);
}
