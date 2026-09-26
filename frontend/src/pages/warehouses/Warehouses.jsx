import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Warehouse,
  Search,
  MapPin,
  CheckCircle2,
  Layers,
  ArrowRight,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Warehouses() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    setLoading(true);
    fetch(`${API_URL}/warehouses${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error?.message || "Failed to load warehouses");
        setWarehouses(body.data?.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, token]);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Warehouses & Facilities</h1>
          <p>Multi-warehouse infrastructure powering distributed inventory fulfillment</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => navigate("/locations")}>
            <Layers size={15} />
            <span>View Location Hierarchies</span>
          </button>
        </div>
      </div>

      <div className="filters-toolbar">
        <div className="search-input-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search warehouse name, code, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Active Facilities: <strong style={{ color: "#fff" }}>{warehouses.length}</strong>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Warehouse Facility</th>
              <th>Code</th>
              <th>City & Region</th>
              <th>Total Racks / Locs</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Drilldown</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading warehouse facilities...
                </td>
              </tr>
            ) : warehouses.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No warehouses found.
                </td>
              </tr>
            ) : (
              warehouses.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div className="kpi-icon-box cyan" style={{ width: "28px", height: "28px" }}>
                        <Warehouse size={14} />
                      </div>
                      <div>
                        <strong style={{ color: "#fff", display: "block" }}>{w.name}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {w.address || "Standard Logistics Hub"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="sku-tag">{w.code}</span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <MapPin size={12} color="var(--text-muted)" />
                      {w.city || "Hub"}, {w.country}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                      {w._count?.locations ?? w.locations?.length ?? 0} racks
                    </span>
                  </td>
                  <td>
                    <span className="status-badge done">
                      <CheckCircle2 size={11} /> {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link
                      to="/locations"
                      className="action-btn-sm"
                      style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <span>Racks</span>
                      <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
}
