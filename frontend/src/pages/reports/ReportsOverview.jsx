import { useEffect, useState } from "react";
import {
  TrendingDown,
  Archive,
  ShieldAlert,
  AlertTriangle,
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  Warehouse,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ReportsOverview({ initialTab = "forecast" }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [forecast, setForecast] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!token) return;
    loadIntelligence();
  }, [token]);

  async function loadIntelligence() {
    try {
      setLoading(true);
      const [fRes, dRes, aRes] = await Promise.all([
        fetch(`${API_URL}/reports/forecast`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/reports/dead-stock`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/reports/anomalies`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [fData, dData, aData] = await Promise.all([fRes.json(), dRes.json(), aRes.json()]);

      if (fData.data) setForecast(fData.data);
      if (dData.data) setDeadStock(dData.data);
      if (aData.data) setAnomalies(aData.data);
    } catch (err) {
      setError(err.message || "Failed to load intelligence data");
    } finally {
      setLoading(false);
    }
  }

  const criticalForecast = forecast.filter((f) => f.daysUntilStockout !== null && f.daysUntilStockout <= 7);
  const totalLockedCapital = deadStock.reduce((sum, d) => sum + (d.lockedCapital || 0), 0);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Inventory Decision Intelligence</h1>
          <p>Predictive runway forecasting, dead stock capital reclamation, and anomaly audit detection</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <button
          className={activeTab === "forecast" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("forecast")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <TrendingDown size={15} />
          <span>7-Day Stock Runway ({criticalForecast.length} Critical)</span>
        </button>

        <button
          className={activeTab === "dead-stock" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("dead-stock")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Archive size={15} />
          <span>Dead Stock Analyzer ({deadStock.length} Items)</span>
        </button>

        <button
          className={activeTab === "anomalies" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("anomalies")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <ShieldAlert size={15} />
          <span>Anomaly & Audit Flags ({anomalies.length})</span>
        </button>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* TAB 1: 7-DAY STOCK RUNWAY FORECAST */}
      {activeTab === "forecast" && (
        <div>
          <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <TrendingDown size={18} color="var(--accent-amber)" />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                <strong>Predictive Stock Runway:</strong> Calculated by dividing current available stock by the 30-day daily outbound demand velocity. Flags stockouts before customers place orders.
              </span>
            </div>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & Variant</th>
                  <th>Warehouse & Rack</th>
                  <th>Available Stock</th>
                  <th>Daily Demand (30d)</th>
                  <th>Projected Runway</th>
                  <th>Reorder Point</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Calculating velocity algorithms...
                    </td>
                  </tr>
                ) : forecast.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      All product inventory balances have healthy runway buffers.
                    </td>
                  </tr>
                ) : (
                  forecast.map((item, idx) => {
                    const isUrgent = item.daysUntilStockout !== null && item.daysUntilStockout <= 7;
                    const isImmediate = item.daysUntilStockout !== null && item.daysUntilStockout <= 3;

                    return (
                      <tr key={idx}>
                        <td>
                          <strong style={{ color: "#fff", display: "block" }}>{item.product}</strong>
                          <span className="sku-tag" style={{ fontSize: "10px" }}>{item.sku}</span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Warehouse size={12} color="var(--accent-cyan)" />
                            {item.warehouse}
                          </span>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{item.location}</div>
                        </td>
                        <td>
                          <strong style={{ color: item.available <= 0 ? "var(--accent-rose)" : "#fff" }}>
                            {item.available} {item.unit}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontFamily: "var(--font-mono)" }}>
                            {item.dailyDemand} / day
                          </span>
                        </td>
                        <td>
                          {item.daysUntilStockout !== null ? (
                            <span
                              className={`status-badge ${isImmediate ? "picking" : isUrgent ? "draft" : "done"}`}
                              style={{
                                background: isImmediate ? "rgba(244, 63, 94, 0.2)" : isUrgent ? "rgba(245, 158, 11, 0.2)" : undefined,
                                color: isImmediate ? "#fb7185" : isUrgent ? "#fcd34d" : undefined,
                              }}
                            >
                              ~{item.daysUntilStockout} days
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>&gt; 90 days</span>
                          )}
                        </td>
                        <td>{item.reorderPoint}</td>
                        <td>
                          {item.reorderRecommended ? (
                            <span style={{ color: "var(--accent-amber)", fontSize: "12px", fontWeight: 600 }}>
                              ⚠️ Create PO Reorder
                            </span>
                          ) : (
                            <span style={{ color: "var(--accent-emerald)", fontSize: "12px" }}>
                              ✓ Sufficient buffer
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: DEAD STOCK ANALYZER */}
      {activeTab === "dead-stock" && (
        <div>
          <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Archive size={18} color="var(--accent-cyan)" />
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  <strong>Slow-Moving / Dead Stock:</strong> Items with on-hand units but &le; 5 units sold over the last 90 days.
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Capital Locked:</span>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--accent-rose)" }}>
                  ₹{totalLockedCapital.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product & Variant</th>
                  <th>Category</th>
                  <th>Warehouse</th>
                  <th>On-Hand Qty</th>
                  <th>Sold (Last 90d)</th>
                  <th>Unit Cost</th>
                  <th>Locked Capital</th>
                  <th>Manager Action Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Analyzing inventory velocity...
                    </td>
                  </tr>
                ) : deadStock.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No dead stock detected! Inventory turnover is high across all lines.
                    </td>
                  </tr>
                ) : (
                  deadStock.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ color: "#fff", display: "block" }}>{item.productName}</strong>
                        <span className="sku-tag" style={{ fontSize: "10px" }}>{item.sku}</span>
                      </td>
                      <td>{item.category}</td>
                      <td>{item.warehouse} [{item.location}]</td>
                      <td>
                        <strong style={{ color: "#fff" }}>{item.onHand}</strong>
                      </td>
                      <td>
                        <span style={{ color: item.sold90Days === 0 ? "var(--accent-rose)" : "var(--text-muted)", fontWeight: 600 }}>
                          {item.sold90Days} units
                        </span>
                      </td>
                      <td>₹{item.unitCost}</td>
                      <td>
                        <strong style={{ color: "var(--accent-amber)" }}>
                          ₹{item.lockedCapital?.toLocaleString()}
                        </strong>
                      </td>
                      <td>
                        <span style={{ color: "var(--accent-cyan)", fontSize: "12px", fontWeight: 500 }}>
                          💡 {item.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANOMALIES & AUDIT FLAGS */}
      {activeTab === "anomalies" && (
        <div>
          <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldAlert size={18} color="var(--accent-rose)" />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                <strong>Behavioral Anomaly Engine:</strong> Automatically detects unusual counts, adjustments with high variance, and anomalous quantity movements exceeding expected baseline ranges.
              </span>
            </div>
          </div>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Flagged Movement</th>
                  <th>Discrepancy / Qty</th>
                  <th>Product & SKU</th>
                  <th>Warehouse</th>
                  <th>Stated Reason</th>
                  <th>Recorded By</th>
                  <th>Severity</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      Auditing anomaly logs...
                    </td>
                  </tr>
                ) : anomalies.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No suspicious activity detected. All stock movements conform to normal baseline ranges.
                    </td>
                  </tr>
                ) : (
                  anomalies.map((a) => (
                    <tr key={a.id}>
                      <td>{new Date(a.createdAt).toLocaleString()}</td>
                      <td>
                        <span className="status-badge picking">{a.type}</span>
                      </td>
                      <td>
                        <strong style={{ color: "var(--accent-rose)", fontSize: "14px" }}>
                          {a.quantity} units
                        </strong>
                      </td>
                      <td>
                        <strong style={{ color: "#fff", display: "block" }}>{a.product}</strong>
                        <span className="sku-tag" style={{ fontSize: "10px" }}>{a.sku}</span>
                      </td>
                      <td>{a.warehouse}</td>
                      <td>
                        <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
                          {a.reason}
                        </span>
                      </td>
                      <td>{a.createdBy}</td>
                      <td>
                        <span
                          className={`health-badge ${a.severity === "HIGH" ? "health-critical" : "health-low"}`}
                        >
                          {a.severity}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
