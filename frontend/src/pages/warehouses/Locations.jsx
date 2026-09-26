import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, LogOut, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function LocationNode({ location }) {
  return <li><div className="location-node"><MapPin size={14} /><span>{location.name}</span><small>{location.type}</small></div>{location.children?.length > 0 && <ul>{location.children.map((child) => <LocationNode key={child.id} location={child} />)}</ul>}</li>;
}

export default function Locations() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [tree, setTree] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.json()).then((body) => { const items = body.data?.items || []; setWarehouses(items); setWarehouseId(items[0]?.id || ""); }).catch((reason) => setError(reason.message));
  }, [token]);

  useEffect(() => {
    if (!warehouseId) return;
    fetch(`${API_URL}/locations/warehouse/${warehouseId}/tree`, { headers: { Authorization: `Bearer ${token}` } }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Unable to load location tree"); return body.data; }).then(setTree).catch((reason) => setError(reason.message));
  }, [token, warehouseId]);

  return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/warehouses"><ArrowLeft size={15} /> Warehouses</Link><p className="eyebrow">Operations / Locations</p><h1>Location hierarchy</h1><p className="muted">Browse zones, aisles, racks, shelves, and bins by warehouse.</p></div><div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div></header><section className="location-toolbar"><label>Warehouse<select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>{warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}</select></label></section>{error && <div className="notice">{error}</div>}<section className="location-tree">{tree.length ? <ul>{tree.map((location) => <LocationNode key={location.id} location={location} />)}</ul> : !error && <p className="empty-state">No locations found.</p>}</section></main>;
}
