import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Filter,
  Package,
  Plus,
  Search,
  Warehouse,
  AlertCircle,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Receipts() {
  const { token, user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [validatingId, setValidatingId] = useState(null);

  const [form, setForm] = useState({
    receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    warehouseId: "",
    locationId: "",
    variantId: "",
    quantity: "100",
    damagedQuantity: "0",
    status: "RECEIVED", // or DRAFT
    notes: "Supplier shipment received",
  });

  const canEdit = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER" || user?.role === "WAREHOUSE_STAFF";

  useEffect(() => {
    if (!token) return;
    loadDependencies();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadReceipts();
  }, [statusFilter, warehouseFilter, token]);

  async function loadDependencies() {
    try {
      const [wRes, pRes] = await Promise.all([
        fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [wData, pData] = await Promise.all([wRes.json(), pRes.json()]);
      if (wData.data?.items) {
        setWarehouses(wData.data.items);
        if (wData.data.items[0]) {
          setForm((f) => ({ ...f, warehouseId: wData.data.items[0].id }));
          loadLocationsForWarehouse(wData.data.items[0].id);
        }
      }
      if (pData.data?.items) {
        setProducts(pData.data.items);
        const firstVariant = pData.data.items[0]?.variants?.[0];
        if (firstVariant) setForm((f) => ({ ...f, variantId: firstVariant.id }));
      }
    } catch {}
  }

  async function loadLocationsForWarehouse(warehouseId) {
    if (!warehouseId) return;
    try {
      const res = await fetch(`${API_URL}/locations?warehouseId=${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (body.data?.items) {
        setLocations(body.data.items);
        if (body.data.items[0]) {
          setForm((f) => ({ ...f, locationId: body.data.items[0].id }));
        }
      }
    } catch {}
  }

  async function loadReceipts() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (warehouseFilter) params.set("warehouseId", warehouseFilter);

      const res = await fetch(`${API_URL}/receipts?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load receipts");
      setReceipts(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateReceipt(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`${API_URL}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          receiptNumber: form.receiptNumber,
          warehouseId: form.warehouseId,
          status: form.status,
          notes: form.notes,
          items: [
            {
              variantId: form.variantId,
              locationId: form.locationId,
              receivedQuantity: Number(form.quantity),
              damagedQuantity: Number(form.damagedQuantity) || 0,
            },
          ],
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create receipt");

      setShowCreateModal(false);
      setSuccessMsg(`Receipt ${form.receiptNumber} created successfully! ${form.status === "RECEIVED" ? "Stock added to ledger." : "Saved as draft."}`);
      setForm((f) => ({
        ...f,
        receiptNumber: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: "100",
        damagedQuantity: "0",
      }));
      loadReceipts();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleValidateReceipt(id) {
    try {
      setValidatingId(id);
      setError("");
      setSuccessMsg("");

      const res = await fetch(`${API_URL}/receipts/${id}/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Validation failed");

      setSuccessMsg("Receipt validated! Stock quantities and ledger entries updated successfully.");
      loadReceipts();
    } catch (err) {
      setError(err.message);
    } finally {
      setValidatingId(null);
    }
  }

  const filteredReceipts = receipts.filter((r) =>
    r.receiptNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Receipts (Goods In)</h1>
          <p>Process incoming shipments from suppliers, verify counts, and validate stock intake</p>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>+ New Receipt</span>
            </button>
          )}
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Clock size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Concept: Draft vs Validated</strong> — Draft receipts allow inspection and physical verification without altering inventory balances. Only upon validation does stock increase in the immutable ledger.
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search receipt #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="RECEIVED">Received / Validated</option>
          </select>

          <select
            className="filter-select"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Total Receipts: <strong style={{ color: "#fff" }}>{filteredReceipts.length}</strong>
        </div>
      </div>

      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}
      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Receipts Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Status</th>
              <th>Warehouse</th>
              <th>Items & Product</th>
              <th>Expected Qty</th>
              <th>Received Qty</th>
              <th>Damaged</th>
              <th>Created Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading goods receipts...
                </td>
              </tr>
            ) : filteredReceipts.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No receipts found. Click "+ New Receipt" to record incoming supplier shipments.
                </td>
              </tr>
            ) : (
              filteredReceipts.map((r) => {
                const isDraft = r.status === "DRAFT" || r.status === "WAITING";
                return (
                  <tr key={r.id}>
                    <td>
                      <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {r.receiptNumber}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${isDraft ? "draft" : "done"}`}>
                        {isDraft ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Warehouse size={13} color="var(--accent-cyan)" />
                        {r.warehouse?.name || "Warehouse"}
                      </span>
                    </td>
                    <td>
                      {r.items && r.items.length > 0 ? (
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>
                            {r.items[0].variant?.product?.name || "Product"}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {r.items[0].variant?.sku} · {r.items[0].location?.code || "Default Loc"}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>{r.purchaseOrder ? `PO #${r.purchaseOrder.orderNumber}` : "Direct Intake"}</span>
                      )}
                    </td>
                    <td>{r.expectedQuantity || r.receivedQuantity || 0}</td>
                    <td>
                      <strong style={{ color: isDraft ? "var(--text-muted)" : "var(--accent-emerald)" }}>
                        {isDraft ? "Pending" : r.receivedQuantity}
                      </strong>
                    </td>
                    <td>
                      {r.damagedQuantity > 0 ? (
                        <span style={{ color: "var(--accent-rose)", fontWeight: 600 }}>{r.damagedQuantity}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>0</span>
                      )}
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      {isDraft && canEdit && (
                        <button
                          className="btn-success"
                          style={{ padding: "4px 10px", fontSize: "11px" }}
                          disabled={validatingId === r.id}
                          onClick={() => handleValidateReceipt(r.id)}
                        >
                          {validatingId === r.id ? "Validating..." : "Validate Receipt"}
                        </button>
                      )}
                      {!isDraft && (
                        <span style={{ fontSize: "11px", color: "var(--accent-emerald)" }}>✓ Validated</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Receipt Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Goods Receipt</h3>
              <button className="action-btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateReceipt}>
              <div className="modal-body form-grid">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Receipt Number *</label>
                    <input
                      required
                      value={form.receiptNumber}
                      onChange={(e) => setForm({ ...form, receiptNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Workflow Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                    >
                      <option value="RECEIVED">Validate Immediately (Stock + Qty)</option>
                      <option value="DRAFT">Save as Draft (Inspect First)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Destination Warehouse *</label>
                    <select
                      required
                      value={form.warehouseId}
                      onChange={(e) => {
                        setForm({ ...form, warehouseId: e.target.value });
                        loadLocationsForWarehouse(e.target.value);
                      }}
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Storage Location *</label>
                    <select
                      required
                      value={form.locationId}
                      onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Product Variant to Receive *</label>
                  <select
                    required
                    value={form.variantId}
                    onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                  >
                    {products.map((p) => (
                      p.variants?.map((v) => (
                        <option key={v.id} value={v.id}>
                          {p.name} - {v.name} ({v.sku})
                        </option>
                      ))
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Received Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Damaged Portion</label>
                    <input
                      type="number"
                      min="0"
                      value={form.damagedQuantity}
                      onChange={(e) => setForm({ ...form, damagedQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Notes / Supplier Reference</label>
                  <input
                    placeholder="e.g. Supplier: ABC Metals, Bill #INV-9921"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {form.status === "RECEIVED" ? "Validate & Receive Stock" : "Create Draft Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
