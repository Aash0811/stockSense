import { useEffect, useState } from "react";
import {
  History,
  Search,
  Warehouse,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Sliders,
  HelpCircle,
  Shield,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ExplainModal from "../../components/common/ExplainModal";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Movements() {
  const { token } = useAuth();
  const [movements, setMovements] = useState([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [explainVariantId, setExplainVariantId] = useState(null);
  const [explainProductName, setExplainProductName] = useState("");

  useEffect(() => {
    if (!token) return;
    loadMovements();
  }, [typeFilter, token]);

  async function loadMovements() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      params.set("limit", "100");

      const res = await fetch(`${API_URL}/inventory/movements?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load stock movements");
      setMovements(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filteredMovements = movements.filter((m) => {
    const text = `${m.variant?.product?.name || ""} ${m.variant?.sku || ""} ${m.reason || ""} ${m.referenceType || ""} ${m.location?.code || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Stock Ledger (Audit Trail)</h1>
          <p>Cryptographically traceable, immutable event ledger recording every stock movement</p>
        </div>
      </div>

      {/* Ledger Immutability Callout */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Shield size={16} color="var(--accent-emerald)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Immutable Event Sourcing:</strong> Stock levels are never directly edited. Every change is an immutable financial-grade ledger transaction: Receipts (+), Deliveries (&minus;), Transfers (&plusmn;), and Adjustments (&plusmn;).
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search product, SKU, reference, actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Movement Types</option>
            <option value="RECEIPT">Receipts (+)</option>
            <option value="DELIVERY">Deliveries (-)</option>
            <option value="TRANSFER_OUT">Transfers Out (-)</option>
            <option value="TRANSFER_IN">Transfers In (+)</option>
            <option value="ADJUSTMENT">Adjustments (±)</option>
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Ledger Entries: <strong style={{ color: "#fff" }}>{filteredMovements.length}</strong>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Ledger Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Movement Type</th>
              <th>Quantity Delta</th>
              <th>Product & SKU</th>
              <th>Warehouse & Rack</th>
              <th>Audit Reason / Reference</th>
              <th>Operator / Actor</th>
              <th style={{ textAlign: "right" }}>Explain</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Auditing ledger records...
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No movement transactions recorded yet.
                </td>
              </tr>
            ) : (
              filteredMovements.map((m) => {
                const isPositive = m.type === "RECEIPT" || m.type === "TRANSFER_IN";
                const isNegative = m.type === "DELIVERY" || m.type === "TRANSFER_OUT";

                return (
                  <tr key={m.id}>
                    <td>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#fff" }}>
                        {new Date(m.createdAt).toLocaleDateString()}
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {new Date(m.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${
                          m.type === "RECEIPT"
                            ? "done"
                            : m.type === "DELIVERY"
                            ? "shipped"
                            : m.type.includes("TRANSFER")
                            ? "ready"
                            : "picking"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td>
                      <strong
                        style={{
                          fontSize: "14px",
                          fontFamily: "var(--font-mono)",
                          color: isPositive ? "var(--accent-emerald)" : isNegative ? "var(--accent-rose)" : "var(--accent-amber)",
                        }}
                      >
                        {isPositive ? `+${m.quantity}` : isNegative ? `-${m.quantity}` : m.quantity}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#fff", display: "block" }}>
                        {m.variant?.product?.name || "Product"}
                      </strong>
                      <span className="sku-tag" style={{ fontSize: "10px" }}>
                        {m.variant?.sku}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Warehouse size={12} color="var(--accent-cyan)" />
                        {m.location?.warehouse?.name || "Warehouse"}
                      </span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Rack: {m.location?.code || "-"}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {m.reason || m.referenceType || "-"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {m.createdBy?.name || "System"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="action-btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
                        onClick={() => {
                          setExplainVariantId(m.variantId);
                          setExplainProductName(m.variant?.product?.name || "Item");
                        }}
                        title="Reconcile why stock changed"
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

      {/* Explain Modal */}
      <ExplainModal
        isOpen={Boolean(explainVariantId)}
        onClose={() => setExplainVariantId(null)}
        variantId={explainVariantId}
        productName={explainProductName}
      />
    </AppLayout>
  );
}
