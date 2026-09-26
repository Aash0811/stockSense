import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Warehouse,
  Search,
  MapPin,
  CheckCircle2,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Warehouses() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    country: "USA",
  });
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  useEffect(() => {
    if (!token) return;
    loadWarehouses();
  }, [search, token]);

  async function loadWarehouses() {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/warehouses${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load warehouses");
      setWarehouses(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateWarehouse(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/warehouses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create warehouse");

      setSuccessMsg(`Warehouse ${body.data.name} (${body.data.code}) created successfully!`);
      setIsCreateOpen(false);
      setForm({ name: "", code: "", address: "", city: "", state: "", country: "USA" });
      await loadWarehouses();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Warehouses & Facilities</h1>
          <p>Multi-warehouse infrastructure powering distributed inventory fulfillment</p>
        </div>
        <div className="header-actions">
          {canManage && (
            <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
              <Plus size={16} />
              <span>+ Add Warehouse</span>
            </button>
          )}
          <button className="btn-secondary" onClick={() => navigate("/locations")}>
            <Layers size={15} />
            <span>View Location Hierarchies</span>
          </button>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}
      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}

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

      {/* CREATE WAREHOUSE MODAL */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Warehouse Facility</h3>
              <button className="action-btn-sm" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateWarehouse}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label>Warehouse Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. East Coast Fulfillment Hub"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Warehouse Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WH-EAST-01"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 Industrial Parkway"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      placeholder="e.g. Newark"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>State / Region</label>
                    <input
                      type="text"
                      placeholder="e.g. NJ"
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating Warehouse..." : "Create Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
