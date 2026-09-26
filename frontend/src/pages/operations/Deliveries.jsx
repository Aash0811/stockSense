import { useEffect, useState } from "react";
import {
  ArrowUpFromLine,
  CheckCircle2,
  Package,
  Plus,
  Search,
  Truck,
  Warehouse,
  AlertOctagon,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_PIPELINE = ["DRAFT", "READY", "PICKING", "PACKED", "SHIPPED", "DELIVERED"];

export default function Deliveries() {
  const { token, user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Form State
  const [form, setForm] = useState({
    deliveryNumber: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
    warehouseId: "",
    locationId: "",
    variantId: "",
    orderedQuantity: "10",
  });

  // Smart warehouse recommendation state
  const [recommendation, setRecommendation] = useState(null);
  const [checkingRecommendation, setCheckingRecommendation] = useState(false);

  const canEdit = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER" || user?.role === "WAREHOUSE_STAFF";

  useEffect(() => {
    if (!token) return;
    loadDependencies();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadDeliveries();
  }, [statusFilter, token]);

  // Whenever variantId or orderedQuantity changes in create form, query warehouse recommendation
  useEffect(() => {
    if (!form.variantId || !token) return;
    setCheckingRecommendation(true);

    fetch(
      `${API_URL}/deliveries/recommend-warehouse?variantId=${form.variantId}&quantity=${form.orderedQuantity}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((res) => res.json())
      .then((body) => {
        if (body.data) {
          setRecommendation(body.data);
          // If a recommended warehouse is found and different, auto-suggest it
          if (body.data.recommendedWarehouse && !form.warehouseId) {
            setForm((f) => ({ ...f, warehouseId: body.data.recommendedWarehouse.warehouseId }));
            loadLocationsForWarehouse(body.data.recommendedWarehouse.warehouseId);
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckingRecommendation(false));
  }, [form.variantId, form.orderedQuantity, token]);

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

  async function loadDeliveries() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`${API_URL}/deliveries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load deliveries");
      setDeliveries(body.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateDelivery(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    // Prevent negative stock check right in UI
    const targetWh = recommendation?.allWarehouses?.find((w) => w.warehouseId === form.warehouseId);
    if (targetWh && targetWh.totalAvailable < Number(form.orderedQuantity)) {
      const shortage = Number(form.orderedQuantity) - targetWh.totalAvailable;
      setError(`❌ Cannot create delivery: Insufficient stock at ${targetWh.warehouseName}. Available: ${targetWh.totalAvailable}, Requested: ${form.orderedQuantity}, Shortage: ${shortage}. Please choose a warehouse with sufficient inventory.`);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          deliveryNumber: form.deliveryNumber,
          warehouseId: form.warehouseId,
          items: [
            {
              variantId: form.variantId,
              locationId: form.locationId,
              orderedQuantity: Number(form.orderedQuantity),
            },
          ],
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create delivery");

      setShowCreateModal(false);
      setSuccessMsg(`Delivery ${form.deliveryNumber} created in Draft status!`);
      setForm((f) => ({
        ...f,
        deliveryNumber: `DEL-${Math.floor(1000 + Math.random() * 9000)}`,
        orderedQuantity: "10",
      }));
      loadDeliveries();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAdvanceStatus(delivery, nextStatus) {
    try {
      setActionLoadingId(delivery.id);
      setError("");
      setSuccessMsg("");

      const res = await fetch(`${API_URL}/deliveries/${delivery.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to advance delivery");

      setSuccessMsg(`Delivery ${delivery.deliveryNumber} advanced to ${nextStatus}!`);
      loadDeliveries();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleFulfill(delivery) {
    try {
      setActionLoadingId(delivery.id);
      setError("");
      setSuccessMsg("");

      const items = delivery.items.map((i) => ({
        deliveryItemId: i.id,
        quantity: i.orderedQuantity - i.deliveredQuantity,
      }));

      const res = await fetch(`${API_URL}/deliveries/${delivery.id}/fulfill`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": `ful-${delivery.id}-${Date.now()}`,
        },
        body: JSON.stringify({ items }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Fulfillment failed");

      setSuccessMsg(`Delivery ${delivery.deliveryNumber} successfully fulfilled! Stock deducted from ledger.`);
      loadDeliveries();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredDeliveries = deliveries.filter((d) =>
    d.deliveryNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Deliveries (Goods Out)</h1>
          <p>Order fulfillment pipeline: Pick → Pack → Ship → Deliver with negative stock prevention</p>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>+ New Delivery</span>
            </button>
          )}
        </div>
      </div>

      {/* Feature Callout Banner */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Smart Fulfillment Engine:</strong> Automatically suggests the nearest warehouse with sufficient stock to fulfill the order and rigorously blocks negative stock.
          </span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search delivery #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Pipeline Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="READY">Ready</option>
            <option value="PICKING">Picking</option>
            <option value="PACKED">Packed</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Active Orders: <strong style={{ color: "#fff" }}>{filteredDeliveries.length}</strong>
        </div>
      </div>

      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}
      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Deliveries Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Delivery #</th>
              <th>Status Pipeline</th>
              <th>Origin Warehouse</th>
              <th>Product & Variant</th>
              <th>Ordered Qty</th>
              <th>Delivered Qty</th>
              <th>Created</th>
              <th style={{ textAlign: "right" }}>Workflow Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading delivery orders...
                </td>
              </tr>
            ) : filteredDeliveries.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No delivery orders found. Click "+ New Delivery" to create a shipment.
                </td>
              </tr>
            ) : (
              filteredDeliveries.map((del) => {
                const statusClass = del.status.toLowerCase();
                const item = del.items?.[0];

                return (
                  <tr key={del.id}>
                    <td>
                      <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {del.deliveryNumber}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${statusClass}`}>
                        {del.status === "DELIVERED" ? <CheckCircle2 size={11} /> : <Truck size={11} />}
                        {del.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Warehouse size={13} color="var(--accent-cyan)" />
                        {del.warehouse?.name || "Warehouse"}
                      </span>
                    </td>
                    <td>
                      {item ? (
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>
                            {item.variant?.product?.name || "Item"}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {item.variant?.sku} · {item.location?.code}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)" }}>-</span>
                      )}
                    </td>
                    <td>{item?.orderedQuantity || 0}</td>
                    <td>
                      <strong style={{ color: del.status === "DELIVERED" ? "var(--accent-emerald)" : "var(--text-muted)" }}>
                        {item?.deliveredQuantity || 0}
                      </strong>
                    </td>
                    <td>{new Date(del.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      {canEdit && (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {del.status === "DRAFT" && (
                            <button
                              className="action-btn-sm"
                              style={{ color: "var(--accent-cyan)" }}
                              disabled={actionLoadingId === del.id}
                              onClick={() => handleAdvanceStatus(del, "READY")}
                            >
                              Ready Order
                            </button>
                          )}
                          {del.status === "READY" && (
                            <button
                              className="action-btn-sm"
                              style={{ color: "var(--accent-amber)" }}
                              disabled={actionLoadingId === del.id}
                              onClick={() => handleAdvanceStatus(del, "PICKING")}
                            >
                              Start Pick
                            </button>
                          )}
                          {del.status === "PICKING" && (
                            <button
                              className="action-btn-sm"
                              style={{ color: "var(--accent-violet)" }}
                              disabled={actionLoadingId === del.id}
                              onClick={() => handleAdvanceStatus(del, "PACKED")}
                            >
                              Pack Box
                            </button>
                          )}
                          {del.status === "PACKED" && (
                            <button
                              className="action-btn-sm"
                              style={{ color: "var(--accent-indigo)" }}
                              disabled={actionLoadingId === del.id}
                              onClick={() => handleAdvanceStatus(del, "SHIPPED")}
                            >
                              Ship Out
                            </button>
                          )}
                          {del.status === "SHIPPED" && (
                            <button
                              className="btn-success"
                              style={{ padding: "4px 10px", fontSize: "11px" }}
                              disabled={actionLoadingId === del.id}
                              onClick={() => handleFulfill(del)}
                            >
                              Fulfill & Deliver
                            </button>
                          )}
                          {del.status === "DELIVERED" && (
                            <span style={{ color: "var(--accent-emerald)", fontSize: "11px" }}>✓ Fulfilled</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Delivery Order Modal with Smart Picker */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Customer Delivery Order</h3>
              <button className="action-btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateDelivery}>
              <div className="modal-body form-grid">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Delivery Reference # *</label>
                    <input
                      required
                      value={form.deliveryNumber}
                      onChange={(e) => setForm({ ...form, deliveryNumber: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Ordered Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={form.orderedQuantity}
                      onChange={(e) => setForm({ ...form, orderedQuantity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Select Product Variant to Deliver *</label>
                  <select
                    required
                    value={form.variantId}
                    onChange={(e) => setForm({ ...form, variantId: e.target.value })}
                  >
                    {products.map((p) =>
                      p.variants?.map((v) => (
                        <option key={v.id} value={v.id}>
                          {p.name} - {v.name} ({v.sku})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Smart Warehouse Recommendation Box */}
                {recommendation && (
                  <div
                    style={{
                      background: "rgba(6, 182, 212, 0.08)",
                      border: "1px solid rgba(6, 182, 212, 0.3)",
                      borderRadius: "var(--radius-md)",
                      padding: "12px 14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Sparkles size={14} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>
                        Smart Warehouse Routing Recommendation:
                      </strong>
                    </div>

                    {recommendation.recommendedWarehouse?.canFulfill ? (
                      <div style={{ fontSize: "12px", color: "#fff" }}>
                        ✓ <strong>{recommendation.recommendedWarehouse.warehouseName}</strong> has{" "}
                        <span style={{ color: "var(--accent-emerald)", fontWeight: 700 }}>
                          {recommendation.recommendedWarehouse.totalAvailable} available units
                        </span>{" "}
                        (Sufficient for {form.orderedQuantity} requested).
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", color: "var(--accent-rose)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <AlertOctagon size={14} />
                        <span>
                          Warning: No single warehouse has {form.orderedQuantity} units available. Stock split or intake needed.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Fulfillment Warehouse *</label>
                    <select
                      required
                      value={form.warehouseId}
                      onChange={(e) => {
                        setForm({ ...form, warehouseId: e.target.value });
                        loadLocationsForWarehouse(e.target.value);
                      }}
                    >
                      {warehouses.map((w) => {
                        const whData = recommendation?.allWarehouses?.find((rw) => rw.warehouseId === w.id);
                        return (
                          <option key={w.id} value={w.id}>
                            {w.name} {whData ? `(Avail: ${whData.totalAvailable})` : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Pick Location Rack *</label>
                    <select
                      required
                      value={form.locationId}
                      onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                    >
                      {locations.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} [{l.code}]
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Delivery Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
