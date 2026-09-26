import { useEffect, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, Boxes, RefreshCw, Truck } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const cards = [
	["Products in stock", "totalProductsInStock", Boxes],
	["Low stock", "lowStock", Activity],
	["Out of stock", "outOfStock", ArrowDownToLine],
	["Pending receipts", "pendingReceipts", ArrowUpFromLine],
	["Pending deliveries", "pendingDeliveries", Truck],
	["Transfers scheduled", "scheduledTransfers", RefreshCw],
];

export default function Dashboard() {
	const [data, setData] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		fetch(`${API_URL}/reports/dashboard`, {
			headers: { Authorization: `Bearer ${localStorage.getItem("stocksense_token") || ""}` },
		})
			.then(async (response) => {
				const body = await response.json();
				if (!response.ok) throw new Error(body.error?.message || "Unable to load dashboard");
				return body.data;
			})
			.then(setData)
			.catch((reason) => setError(reason.message));
	}, []);

	return (
		<main className="dashboard-shell">
			<aside className="sidebar">
				<div className="brand-mark"><span>SS</span><div><strong>StockSense</strong><small>Inventory operations</small></div></div>
				<nav><a className="nav-active" href="/dashboard">Overview</a><a href="/products">Products</a><a href="/inventory">Inventory</a><a href="/movements">Move history</a><a href="/warehouses">Warehouses</a><a href="/locations">Locations</a><a href="/receipts">Receipts</a><a href="/deliveries">Deliveries</a><a href="/transfers">Transfers</a><a href="/adjustments">Adjustments</a><a href="/forecast">Forecast</a><a href="/anomalies">Anomalies</a><a href="/notifications">Notifications</a><a href="/audit">Audit log</a><a href="/assistant">Assistant</a><a href="/profile">My profile</a></nav>
			</aside>
			<section className="dashboard-content">
				<header className="dashboard-header"><div><p className="eyebrow">Operations center</p><h1>Inventory at a glance</h1><p className="muted">A live view of stock health and work waiting across your warehouses.</p></div><span className="status-pill"><i /> System online</span></header>
				{error && <div className="notice">{error}. Sign in to view live KPIs.</div>}
				<section className="metric-grid">
					{cards.map(([label, key, Icon]) => <article className="metric-card" key={key}><div className="metric-icon"><Icon size={18} /></div><p>{label}</p><strong>{data?.[key] ?? "--"}</strong><span>Current snapshot</span></article>)}
				</section>
				<section className="dashboard-band"><div><p className="eyebrow">Action center</p><h2>Keep stock moving</h2><p className="muted">Use the operation views to receive goods, fulfill deliveries, and reconcile physical counts.</p></div><div className="band-stat"><strong>4</strong><span>core workflows</span></div></section>
			</section>
		</main>
	);
}
