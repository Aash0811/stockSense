import { useEffect, useState } from "react";
import {
  RefreshCw,
  ArrowRight,
  Plus,
  Warehouse,
  CheckCircle2,
  Clock,
  Search,
  Sliders,
  Send,
  Download,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Transfers() {
  const { token, user } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [sourceLocations, setSourceLocations] = useState([]);
  const [destLocations, setDestLocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [form, setForm] = useState({
    transferNumber: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
    sourceWarehouseId: "",
    destinationWarehouseId: "",
    sourceLocationId: "",
    destinationLocationId: "",
    variantId: "",
    quantity: "20",
  });

  const canEdit = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER" || user?.role === "WAREHOUSE_STAFF";

  useEffect(() => {
    if (!token) return;
    loadDependencies();
    loadTransfers();
  }, [token]);

  async function loadDependencies() {
    try {
      const [wRes, pRes] = await Promise.all([
        fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/products?limit=100`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [wData, pData] = await Promise.all([wRes.json(), pRes.json()]);

      if (wData.data?.items && wData.data.items.length >= 2) {
        setWarehouses(wData.data.items);
        const srcWh = wData.data.items[0].id;
        const dstWh = wData.data.items[1].id;
        setForm((f) => ({ ...f, sourceWarehouseId: srcWh, destinationWarehouseId: dstWh }));
        loadLocations(srcWh, setSourceLocations, (id) => setForm((f) => ({ ...f, sourceLocationId: id })));
        loadLocations(dstWh, setDestLocations, (id) => setForm((f) => ({ ...f, destinationLocationId: id })));
      }

      if (pData.data?.items) {
        setProducts(pData.data.items);
        const firstVar = pData.data.items[0]?.variants?.[0];
        if (firstVar) setForm((f) => ({ ...f, variantId: firstVar.id }));
      }
    } catch {}
  }

  async function loadLocations(warehouseId, setter, defaultSetter) {
    if (!warehouseId) return;
    try {
      const res = await fetch(`${API_URL}/locations?warehouseId=${warehouseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (body.data?.items) {
        setter(body.data.items);
        if (body.data.items[0] && defaultSetter) {
          defaultSetter(body.data.items[0].id);
        }
      }
    } catch {}
  }

  async function loadTransfers() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/transfers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load transfers");
      setTransfers(body.data?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTransfer(e) {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (form.sourceWarehouseId === form.destinationWarehouseId) {
      setError("Source and destination warehouses must be different for inter-warehouse moves.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/transfers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          transferNumber: form.transferNumber,
          sourceWarehouseId: form.sourceWarehouseId,
          destinationWarehouseId: form.destinationWarehouseId,
          items: [
            {
              variantId: form.variantId,
              sourceLocationId: form.sourceLocationId,
              destinationLocationId: form.destinationLocationId,
              quantity: Number(form.quantity),
            },
          ],
        }),
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create transfer");

      setShowCreateModal(false);
      setSuccessMsg(`Transfer ${form.transferNumber} scheduled in Draft status!`);
      setForm((f) => ({
        ...f,
        transferNumber: `TRF-${Math.floor(1000 + Math.random() * 9000)}`,
        quantity: "20",
      }));
      loadTransfers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDispatch(transfer) {
    try {
      setActionLoadingId(transfer.id);
      setError("");
      setSuccessMsg("");

      const res = await fetch(`${API_URL}/transfers/${transfer.id}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to dispatch");

      setSuccessMsg(`Transfer ${transfer.transferNumber} dispatched! Stock is now in-transit.`);
      loadTransfers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleReceive(transfer) {
    try {
      setActionLoadingId(transfer.id);
      setError("");
      setSuccessMsg("");

      const items = transfer.items.map((i) => ({
        transferItemId: i.id,
        receivedQuantity: i.quantity - (i.receivedQuantity || 0),
      }));

      const res = await fetch(`${API_URL}/transfers/${transfer.id}/receive`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to receive transfer");

      setSuccessMsg(`Transfer ${transfer.transferNumber} completed! Stock received at destination.`);
      loadTransfers();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoadingId(null);
    }
  }

  const filteredTransfers = transfers.filter((t) =>
    t.transferNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Internal Transfers</h1>
          <p>Relocate stock across warehouses and racks with total enterprise stock invariance</p>
        </div>
        <div className="header-actions">
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>+ New Transfer</span>
            </button>
          )}
        </div>
      </div>

      {/* Stock Invariance Callout */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <RefreshCw size={16} color="var(--accent-cyan)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Stock Invariance Principle:</strong> When items move between Warehouse 1 and Warehouse 2 (e.g. 500 & 100), overall inventory remains 600. The ledger audits the dispatch from origin and intake at destination.
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="filters-toolbar">
        <div className="search-input-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            placeholder="Search transfer #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Active Transfers: <strong style={{ color: "#fff" }}>{filteredTransfers.length}</strong>
        </div>
      </div>

      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}
      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Transfers Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transfer #</th>
              <th>Status</th>
              <th>Source (From)</th>
              <th style={{ width: "30px", textAlign: "center" }}>→</th>
              <th>Destination (To)</th>
              <th>Product & Variant</th>
              <th>Quantity</th>
              <th>Created Date</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading transfers...
                </td>
              </tr>
            ) : filteredTransfers.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No transfers recorded. Click "+ New Transfer" to schedule a movement between warehouses.
                </td>
              </tr>
            ) : (
              filteredTransfers.map((t) => {
                const isDraft = t.status === "DRAFT";
                const isInTransit = t.status === "IN_TRANSIT";
                const isDone = t.status === "COMPLETED";
                const item = t.items?.[0];

                return (
                  <tr key={t.id}>
                    <td>
                      <strong style={{ color: "#fff", fontFamily: "var(--font-mono)" }}>
                        {t.transferNumber}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-badge ${isDone ? "done" : isInTransit ? "in_transit" : "draft"}`}>
                        {isDone ? <CheckCircle2 size={11} /> : isInTransit ? <RefreshCw size={11} /> : <Clock size={11} />}
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Warehouse size={13} color="var(--accent-rose)" />
                        {t.sourceWarehouse?.name}
                      </span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Rack: {item?.sourceLocation?.code || "-"}
                      </div>
                    </td>
                    <td style={{ textAlign: "center", color: "var(--text-muted)" }}>→</td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Warehouse size={13} color="var(--accent-emerald)" />
                        {t.destinationWarehouse?.name}
                      </span>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        Rack: {item?.destinationLocation?.code || "-"}
                      </div>
                    </td>
                    <td>
                      {item ? (
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>
                            {item.variant?.product?.name || "Product"}
                          </strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {item.variant?.sku}
                          </span>
                        </div>
                      ) : "-"}
                    </td>
                    <td>
                      <strong style={{ color: "#fff" }}>{item?.quantity || 0}</strong>
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: "right" }}>
                      {canEdit && (
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          {isDraft && (
                            <button
                              className="action-btn-sm"
                              style={{ color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              disabled={actionLoadingId === t.id}
                              onClick={() => handleDispatch(t)}
                            >
                              <Send size={12} /> Dispatch Move
                            </button>
                          )}
                          {isInTransit && (
                            <button
                              className="btn-success"
                              style={{ padding: "4px 10px", fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              disabled={actionLoadingId === t.id}
                              onClick={() => handleReceive(t)}
                            >
                              <Download size={12} /> Receive at Dest
                            </button>
                          )}
                          {isDone && (
                            <span style={{ color: "var(--accent-emerald)", fontSize: "11px" }}>✓ Transferred</span>
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

      {/* Create Transfer Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Inter-Warehouse Transfer</h3>
              <button className="action-btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateTransfer}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label>Transfer Reference # *</label>
                  <input
                    required
                    value={form.transferNumber}
                    onChange={(e) => setForm({ ...form, transferNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Product Variant to Move *</label>
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

                {/* Source Selection */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Origin Warehouse (From) *</label>
                    <select
                      required
                      value={form.sourceWarehouseId}
                      onChange={(e) => {
                        setForm({ ...form, sourceWarehouseId: e.target.value });
                        loadLocations(e.target.value, setSourceLocations, (id) => setForm((f) => ({ ...f, sourceLocationId: id })));
                      }}
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Source Rack Location *</label>
                    <select
                      required
                      value={form.sourceLocationId}
                      onChange={(e) => setForm({ ...form, sourceLocationId: e.target.value })}
                    >
                      {sourceLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Destination Selection */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Destination Warehouse (To) *</label>
                    <select
                      required
                      value={form.destinationWarehouseId}
                      onChange={(e) => {
                        setForm({ ...form, destinationWarehouseId: e.target.value });
                        loadLocations(e.target.value, setDestLocations, (id) => setForm((f) => ({ ...f, destinationLocationId: id })));
                      }}
                    >
                      {warehouses.map((w) => (
                        <option key={w.id} value={w.id}>{w.name} ({w.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Destination Rack Location *</label>
                    <select
                      required
                      value={form.destinationLocationId}
                      onChange={(e) => setForm({ ...form, destinationLocationId: e.target.value })}
                    >
                      {destLocations.map((l) => (
                        <option key={l.id} value={l.id}>{l.name} [{l.code}]</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Quantity to Transfer *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Schedule Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
