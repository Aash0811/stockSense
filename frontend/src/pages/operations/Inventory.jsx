import { useEffect, useState } from "react";
import {
  Layers,
  Search,
  Warehouse,
  MapPin,
  HelpCircle,
  ShieldCheck,
  Package,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ExplainModal from "../../components/common/ExplainModal";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHealthBadge(available, reorderPoint) {
  const rp = Number(reorderPoint) || 10;
  const avail = Number(available) || 0;

  if (avail <= 0) return { label: "Out of Stock", class: "health-out", dot: "⚫" };
  if (avail <= Math.floor(rp * 0.5)) return { label: "Critical", class: "health-critical", dot: "🔴" };
  if (avail <= rp) return { label: "Low", class: "health-low", dot: "🟠" };
  if (avail <= Math.floor(rp * 1.5)) return { label: "Watch", class: "health-watch", dot: "🟡" };
  return { label: "Healthy", class: "health-healthy", dot: "🟢" };
}

export default function Inventory() {
  const { token } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [explainVariantId, setExplainVariantId] = useState(null);
  const [explainProductName, setExplainProductName] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((body) => {
        if (body.data?.items) setWarehouses(body.data.items);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadInventory();
  }, [warehouseFilter, token]);

  async function loadInventory() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (warehouseFilter) params.set("warehouseId", warehouseFilter);
      params.set("limit", "100");

      const res = await fetch(`${API_URL}/inventory?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load inventory");
      setInventory(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredInventory = inventory.filter((item) => {
    const text = `${item.variant?.product?.name || ""} ${item.variant?.sku || ""} ${item.warehouse?.name || ""} ${item.location?.code || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Inventory Availability Matrix</h1>
          <p>Multi-warehouse breakdown: Physical On-Hand vs Reserved vs Damaged vs Available Stock</p>
        </div>
      </div>

      {/* Reservation Concept Callout */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldCheck size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Stock Reservation Model:</strong> Available Stock = Physical On-Hand &minus; Reserved Orders &minus; Damaged Units. This prevents double selling across simultaneous warehouse orders.
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search product, SKU, warehouse, rack..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Inventory Rows: <strong style={{ color: "#fff" }}>{filteredInventory.length}</strong>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Inventory Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product & Variant</th>
              <th>SKU / Identifier</th>
              <th>Warehouse</th>
              <th>Rack Location</th>
              <th>Physical On-Hand</th>
              <th>Reserved (Orders)</th>
              <th>Damaged</th>
              <th>Available Stock</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Explain</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading real-time inventory balances...
                </td>
              </tr>
            ) : filteredInventory.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No inventory balances found matching the filter.
                </td>
              </tr>
            ) : (
              filteredInventory.map((item) => {
                const available = Number(item.available);
                const health = getHealthBadge(available, item.variant?.product?.reorderPoint);

                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="kpi-icon-box indigo" style={{ width: "28px", height: "28px" }}>
                          <Package size={14} />
                        </div>
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>
                            {item.variant?.product?.name || "Product"}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {item.variant?.name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sku-tag">{item.variant?.sku}</span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Warehouse size={13} color="var(--accent-cyan)" />
                        {item.warehouse?.name}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-secondary)" }}>
                        <MapPin size={12} color="var(--text-muted)" />
                        {item.location?.code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}>
                        {item.onHand}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.reserved > 0 ? "var(--accent-amber)" : "var(--text-muted)" }}>
                        {item.reserved}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: item.damaged > 0 ? "var(--accent-rose)" : "var(--text-muted)" }}>
                        {item.damaged}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          fontSize: "14px",
                          color: available > 0 ? "var(--accent-emerald)" : "var(--accent-rose)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {available}
                      </strong>
                    </td>
                    <td>
                      <span className={`health-badge ${health.class}`}>
                        <span>{health.dot}</span> {health.label}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="action-btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => {
                          setExplainVariantId(item.variantId);
                          setExplainProductName(`${item.variant?.product?.name} (${item.variant?.name})`);
                        }}
                        title="Why Did Stock Change?"
                      >
                        <HelpCircle size={13} color="var(--accent-cyan)" />
                        <span>Why?</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Explainability Modal */}
      <ExplainModal
        isOpen={Boolean(explainVariantId)}
        onClose={() => setExplainVariantId(null)}
        variantId={explainVariantId}
        productName={explainProductName}
      />
    </AppLayout>
  );
}
