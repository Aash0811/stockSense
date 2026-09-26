import { useEffect, useState } from "react";
import {
  Sliders,
  Plus,
  Search,
  AlertTriangle,
  Warehouse,
  CheckCircle2,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const MANDATORY_REASONS = [
  "Damaged Goods",
  "Physical Counting Error",
  "Lost / Misplaced in Rack",
  "Expired / Shelf-life Ended",
  "Shrinkage / Suspected Theft",
  "Supplier Variance on Pallet",
  "Other Reconciled Audit",
];

export default function Adjustments() {
  const { token, user } = useAuth();
  const [adjustments, setAdjustments] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [selectedInventory, setSelectedInventory] = useState(null);
  const [form, setForm] = useState({
    adjustmentNumber: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
    countedQuantity: "",
    reason: MANDATORY_REASONS[0],
    notes: "",
  });

  const canEdit = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER" || user?.role === "WAREHOUSE_STAFF";

  useEffect(() => {
    if (!token) return;
    loadAdjustments();
    loadInventory();
  }, [token]);

  async function loadAdjustments() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/adjustments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load adjustments");
      setAdjustments(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadInventory() {
    try {
      const res = await fetch(`${API_URL}/inventory?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (body.data?.items) {
        setInventoryList(body.data.items);
        if (body.data.items[0]) {
          setSelectedInventory(body.data.items[0]);
          setForm((f) => ({ ...f, countedQuantity: String(body.data.items[0].onHand) }));
        }
      }
    } catch {}
  }

  const systemQty = selectedInventory ? Number(selectedInventory.onHand) : 0;
  const countedQty = form.countedQuantity !== "" ? Number(form.countedQuantity) : systemQty;
  const difference = countedQty - systemQty;
  const isSuspicious = Math.abs(difference) >= 50 || (systemQty > 0 && Math.abs(difference) / systemQty >= 0.3);

  async function handleCreateAdjustment(e) {
    e.preventDefault();
    if (!selectedInventory) return;
    setError("");
    setSuccessMsg("");

    if (difference === 0) {
      setError("Physical count matches system quantity. No adjustment needed.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/adjustments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          adjustmentNumber: form.adjustmentNumber,
          variantId: selectedInventory.variantId,
          locationId: selectedInventory.locationId,
          countedQuantity: countedQty,
          reason: `${form.reason}${form.notes ? ` - ${form.notes}` : ""}`,
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to save adjustment");

      setShowCreateModal(false);
      setSuccessMsg(`Adjustment ${form.adjustmentNumber} recorded! Stock updated to ${countedQty}.`);
      setForm((f) => ({
        ...f,
        adjustmentNumber: `ADJ-${Math.floor(1000 + Math.random() * 9000)}`,
        notes: "",
      }));
      loadAdjustments();
      loadInventory();
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredAdjustments = adjustments.filter((a) =>
    a.adjustmentNumber.toLowerCase().includes(search.toLowerCase()) ||
    a.variant?.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Stock Adjustments & Reconciliation</h1>
          <p>Reconcile physical counts with system records, enforce mandatory audit reasons, and flag anomalies</p>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>+ Record Physical Count</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Callout Banner */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <ShieldAlert size={16} color="var(--accent-amber)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Accountability & Anomaly Guard:</strong> Adjustments require mandatory standardized reasons. Any discrepancy &ge; 50 units or &ge; 30% is automatically flagged as suspicious in the audit log.
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filters-toolbar">
        <div className="search-input-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search adjustment #, item, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Adjustments Logged: <strong style={{ color: "#fff" }}>{filteredAdjustments.length}</strong>
        </div>
      </div>

      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}
      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Adjustments Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Adjustment #</th>
              <th>Product & SKU</th>
              <th>Warehouse & Rack</th>
              <th>System Qty</th>
              <th>Counted Qty</th>
              <th>Discrepancy</th>
              <th>Mandatory Reason</th>
              <th>Audited By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading adjustments history...
                </td>
              </tr>
            ) : filteredAdjustments.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No stock adjustments recorded. Physical stock perfectly aligns with system records!
                </td>
              </tr>
            ) : (
              filteredAdjustments.map((a) => {
                const diff = a.difference;
                const isPos = diff > 0;

                return (
                  <tr key={a.id}>
                    <td>
                      <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {a.adjustmentNumber}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#fff", display: "block" }}>
                        {a.variant?.product?.name || "Product"}
                      </strong>
                      <span className="sku-tag" style={{ fontSize: "10px" }}>
                        {a.variant?.sku || "-"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <Warehouse size={12} color="var(--accent-cyan)" />
                        {a.location?.warehouse?.name || "Warehouse"}
                      </span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Rack: {a.location?.code || "-"}
                      </div>
                    </td>
                    <td>{a.systemQuantity}</td>
                    <td>
                      <strong style={{ color: "#fff" }}>{a.countedQuantity}</strong>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "2px",
                            fontWeight: 700,
                            color: isPos ? "var(--accent-emerald)" : "var(--accent-rose)",
                          }}
                        >
                          {isPos ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isPos ? `+${diff}` : diff}
                        </span>

                        {a.isSuspicious && (
                          <span
                            className="health-badge health-critical"
                            title="Unusual discrepancy flagged by anomaly engine"
                            style={{ fontSize: "10px", padding: "2px 6px" }}
                          >
                            ⚠️ Suspicious
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {a.reason}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {a.createdBy?.name || "Auditor"}
                      </span>
                    </td>
                    <td>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Record Physical Count Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Record Physical Stock Count</h3>
              <button className="action-btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateAdjustment}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label>Adjustment Identifier *</label>
                  <input
                    required
                    value={form.adjustmentNumber}
                    onChange={(e) => setForm({ ...form, adjustmentNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Select Item & Location from Inventory *</label>
                  <select
                    required
                    value={selectedInventory?.id || ""}
                    onChange={(e) => {
                      const item = inventoryList.find((i) => i.id === e.target.value);
                      if (item) {
                        setSelectedInventory(item);
                        setForm((f) => ({ ...f, countedQuantity: String(item.onHand) }));
                      }
                    }}
                  >
                    {inventoryList.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.variant?.product?.name} ({item.variant?.sku}) @ {item.warehouse?.name} [{item.location?.code}] — Current System Stock: {item.onHand}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Real-time System vs Physical Count Comparison */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", background: "var(--bg-input)", padding: "14px", borderRadius: "var(--radius-sm)" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>System Stock</span>
                    <strong style={{ fontSize: "20px", color: "#fff" }}>{systemQty}</strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Counted Stock *</span>
                    <input
                      type="number"
                      min="0"
                      required
                      value={form.countedQuantity}
                      onChange={(e) => setForm({ ...form, countedQuantity: e.target.value })}
                      style={{ width: "90%", padding: "4px 8px", background: "var(--bg-card)", border: "1px solid var(--border-medium)", color: "#fff", fontSize: "16px", fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Discrepancy</span>
                    <strong
                      style={{
                        fontSize: "20px",
                        color: difference === 0 ? "var(--text-muted)" : difference > 0 ? "var(--accent-emerald)" : "var(--accent-rose)",
                      }}
                    >
                      {difference > 0 ? `+${difference}` : difference}
                    </strong>
                  </div>
                </div>

                {/* High Variance Warning */}
                {isSuspicious && difference !== 0 && (
                  <div className="notice-box notice-warning">
                    <AlertTriangle size={16} />
                    <span>
                      <strong>⚠️ Unusual Adjustment Detected:</strong> This discrepancy of {difference} units is unusually high and will be flagged for senior audit verification.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label>Mandatory Audit Reason *</label>
                  <select
                    required
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  >
                    {MANDATORY_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Audit Comment / Photo Reference / Explanation</label>
                  <textarea
                    rows={2}
                    placeholder="Provide context or explanation for why physical count differed from ledger..."
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Apply & Record Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
