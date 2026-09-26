import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Calendar, HelpCircle, History, Package, X } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ExplainModal({ isOpen, onClose, variantId, productName }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !token) return;
    setLoading(true);
    setError("");

    const query = variantId ? `?variantId=${variantId}&days=${days}` : `?days=${days}`;
    fetch(`${API_URL}/reports/explain${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.data) setData(body.data);
        else throw new Error(body.error?.message || "Unable to explain stock delta");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, variantId, days, token]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: "700px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="kpi-icon-box indigo">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3>Why Did Stock Change?</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Auditable explainability & movement reconciliation
              </p>
            </div>
          </div>
          <button className="action-btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Days filter selector */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Package size={16} color="var(--accent-cyan)" />
              <strong style={{ fontSize: "14px" }}>
                {data?.product?.name || productName || "Inventory Item"}
              </strong>
              {data?.product?.sku && <span className="sku-tag">{data.product.sku}</span>}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar size={14} color="var(--text-muted)" />
              <select
                className="filter-select"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                <option value={1}>Yesterday vs Today (24h)</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
              </select>
            </div>
          </div>

          {loading && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              Analyzing stock ledger movements...
            </div>
          )}

          {error && <div className="notice-box notice-danger">{error}</div>}

          {data && !loading && (
            <div>
              {/* Plain English Narrative */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(6, 182, 212, 0.08) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  marginBottom: "20px",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--accent-cyan)", display: "block", marginBottom: "4px" }}>
                  Executive Explanation
                </span>
                <p style={{ fontSize: "13px", lineHeight: "1.6", color: "#fff" }}>
                  {data.narrative}
                </p>
              </div>

              {/* Stock Metric Comparison */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "var(--bg-input)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Stock {days} Days Ago</span>
                  <strong style={{ fontSize: "20px", color: "#fff" }}>{data.metrics.openingStock}</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px" }}>{data.product.unit}</span>
                </div>

                <div style={{ background: "var(--bg-input)", padding: "14px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Current On-Hand</span>
                  <strong style={{ fontSize: "20px", color: "#fff" }}>{data.metrics.currentOnHand}</strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)", marginLeft: "4px" }}>{data.product.unit}</span>
                </div>

                <div
                  style={{
                    background: data.metrics.netChange >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(244, 63, 94, 0.1)",
                    padding: "14px",
                    borderRadius: "8px",
                    border: `1px solid ${data.metrics.netChange >= 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
                  }}
                >
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Net Stock Delta</span>
                  <strong
                    style={{
                      fontSize: "20px",
                      color: data.metrics.netChange >= 0 ? "var(--accent-emerald)" : "var(--accent-rose)",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    {data.metrics.netChange >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                    {data.metrics.netChange >= 0 ? `+${data.metrics.netChange}` : data.metrics.netChange}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{data.product.unit} in {days} days</span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "8px" }}>
                  Movement Breakdown
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  <div style={{ background: "var(--bg-input)", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid var(--accent-emerald)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Receipts (+)</span>
                    <strong style={{ fontSize: "16px", color: "var(--accent-emerald)" }}>+{data.breakdown.receipts.total}</strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{data.breakdown.receipts.count} receipts</div>
                  </div>

                  <div style={{ background: "var(--bg-input)", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid var(--accent-rose)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Deliveries (-)</span>
                    <strong style={{ fontSize: "16px", color: "var(--accent-rose)" }}>-{data.breakdown.deliveries.total}</strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{data.breakdown.deliveries.count} shipments</div>
                  </div>

                  <div style={{ background: "var(--bg-input)", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid var(--accent-cyan)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Transfers (Net)</span>
                    <strong style={{ fontSize: "16px", color: "var(--accent-cyan)" }}>
                      {data.breakdown.transfersIn.total - data.breakdown.transfersOut.total >= 0 ? "+" : ""}
                      {data.breakdown.transfersIn.total - data.breakdown.transfersOut.total}
                    </strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      +{data.breakdown.transfersIn.total} / -{data.breakdown.transfersOut.total}
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-input)", padding: "10px 12px", borderRadius: "6px", borderLeft: "3px solid var(--accent-amber)" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", display: "block" }}>Adjustments</span>
                    <strong style={{ fontSize: "16px", color: "var(--accent-amber)" }}>
                      {data.breakdown.adjustments.total >= 0 ? "+" : ""}{data.breakdown.adjustments.total}
                    </strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{data.breakdown.adjustments.count} counts</div>
                  </div>
                </div>
              </div>

              {/* Timeline Items */}
              {data.timeline && data.timeline.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <History size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Chronological Movement Timeline
                    </span>
                  </div>
                  <div style={{ maxHeight: "200px", overflowY: "auto", display: "grid", gap: "6px" }}>
                    {data.timeline.map((event) => (
                      <div
                        key={event.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "var(--bg-input)",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span
                            className={`status-badge ${
                              event.type === "RECEIPT"
                                ? "done"
                                : event.type === "DELIVERY"
                                ? "shipped"
                                : "ready"
                            }`}
                            style={{ fontSize: "10px" }}
                          >
                            {event.type}
                          </span>
                          <span style={{ color: "var(--text-primary)" }}>{event.reason}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>@{event.warehouse} [{event.location}]</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          <strong
                            style={{
                              color: event.type === "RECEIPT" || event.type === "TRANSFER_IN" ? "var(--accent-emerald)" : "var(--accent-rose)",
                            }}
                          >
                            {event.type === "RECEIPT" || event.type === "TRANSFER_IN" ? `+${event.quantity}` : `-${event.quantity}`} {data.product.unit}
                          </strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                            {new Date(event.time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
