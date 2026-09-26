import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Inventory() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/inventory?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Unable to load inventory"); return body.data; })
      .then((data) => setItems(data.items || []))
      .catch((reason) => setError(reason.message));
  }, [token]);

  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Operations / Inventory</p><h1>Inventory</h1><p className="muted">See stock availability by product, warehouse, and location.</p></div><div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div></header><section className="operation-toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory" /></label></section>{error && <div className="notice">{error}</div>}<section className="records-panel"><table><thead><tr><th>Product</th><th>SKU</th><th>Warehouse</th><th>Location</th><th>On hand</th><th>Reserved</th><th>Damaged</th><th>Available</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{item.variant?.product?.name || "-"}</td><td>{item.variant?.sku || "-"}</td><td>{item.warehouse?.name || "-"}</td><td>{item.location?.code || "-"}</td><td>{item.onHand}</td><td>{item.reserved}</td><td>{item.damaged}</td><td><strong>{item.available}</strong></td></tr>)}</tbody></table>{!error && !filtered.length && <p className="empty-state">No inventory records found.</p>}</section></main>;
}
