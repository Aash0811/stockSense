import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Movements() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/inventory/movements?limit=100`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Unable to load movements"); return body.data; })
      .then((data) => setItems(data.items || []))
      .catch((reason) => setError(reason.message));
  }, [token]);

  const filtered = items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase()));
  return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Operations / Move history</p><h1>Move history</h1><p className="muted">Immutable stock movement records across the business.</p></div><div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div></header><section className="operation-toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement history" /></label></section>{error && <div className="notice">{error}</div>}<section className="records-panel"><table><thead><tr><th>Type</th><th>Product</th><th>Quantity</th><th>Reference</th><th>Location</th><th>Actor</th><th>Created</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><span className="status-active">{item.type}</span></td><td>{item.variant?.product?.name || "-"}</td><td>{item.quantity}</td><td>{item.referenceType || "-"}</td><td>{item.location?.code || "-"}</td><td>{item.createdBy?.name || "-"}</td><td>{new Date(item.createdAt).toLocaleString()}</td></tr>)}</tbody></table>{!error && !filtered.length && <p className="empty-state">No movement records found.</p>}</section></main>;
}
