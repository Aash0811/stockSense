import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Boxes,
  AlertTriangle,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  TrendingDown,
  Sparkles,
  ArrowRight,
  Filter,
  PackagePlus,
  Truck,
  HelpCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import AppLayout from "../../components/layout/AppLayout";
import ExplainModal from "../../components/common/ExplainModal";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const CHART_COLORS = ["#10b981", "#06b6d4", "#6366f1", "#f59e0b", "#f43f5e"];

export default function Dashboard() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDocType, setSelectedDocType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [explainOpen, setExplainOpen] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Load filter options
    Promise.all([
      fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([whData, catData]) => {
        if (whData.data?.items) setWarehouses(whData.data.items);
        if (catData.data?.items) setCategories(catData.data.items);
      })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    const params = new URLSearchParams();
    if (selectedWarehouse) params.set("warehouseId", selectedWarehouse);
    if (selectedCategory) params.set("categoryId", selectedCategory);

    fetch(`${API_URL}/reports/dashboard?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error?.message || "Failed to load dashboard KPIs");
        setData(body.data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedWarehouse, selectedCategory, token]);

  const kpis = [
    {
      title: "Products in Stock",
      value: data?.totalProductsInStock ?? "--",
      subtitle: "Active catalog items",
      icon: Boxes,
      colorClass: "indigo",
      link: "/products",
    },
    {
      title: "Low Stock Warning",
      value: data?.lowStock ?? "--",
      subtitle: "Below reorder threshold",
      icon: AlertTriangle,
      colorClass: "amber",
      link: "/forecast",
    },
    {
      title: "Out of Stock",
      value: data?.outOfStock ?? "--",
      subtitle: "Immediate reorder needed",
      icon: XCircle,
      colorClass: "rose",
      link: "/products",
    },
    {
      title: "Pending Receipts",
      value: data?.pendingReceipts ?? "--",
      subtitle: "Incoming supplier stock",
      icon: ArrowDownToLine,
      colorClass: "emerald",
      link: "/receipts",
    },
    {
      title: "Pending Deliveries",
      value: data?.pendingDeliveries ?? "--",
      subtitle: "Orders awaiting ship",
      icon: ArrowUpFromLine,
      colorClass: "cyan",
      link: "/deliveries",
    },
    {
      title: "Scheduled Transfers",
      value: data?.scheduledTransfers ?? "--",
      subtitle: "Inter-warehouse moves",
      icon: RefreshCw,
      colorClass: "violet",
      link: "/transfers",
    },
  ];

  const distributionData = [
    { name: "Healthy Stock", value: Math.max(1, (data?.totalProductsInStock || 0) - (data?.lowStock || 0) - (data?.outOfStock || 0)) },
    { name: "Low Stock", value: data?.lowStock || 0 },
    { name: "Out of Stock", value: data?.outOfStock || 0 },
  ];

  const filteredMovements = (data?.recentMovements || []).filter((move) => {
    if (selectedDocType) {
      if (selectedDocType === "RECEIPTS" && move.type !== "RECEIPT") return false;
      if (selectedDocType === "DELIVERY" && move.type !== "DELIVERY") return false;
      if (selectedDocType === "TRANSFER" && !["TRANSFER_IN", "TRANSFER_OUT"].includes(move.type)) return false;
      if (selectedDocType === "ADJUSTMENT" && move.type !== "ADJUSTMENT") return false;
    }
    return true;
  });

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Inventory Operations Control</h1>
          <p>Real-time visibility, automated ledger updates, and predictive decision support</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setExplainOpen(true)}>
            <HelpCircle size={15} color="var(--accent-cyan)" />
            <span>Why Did Stock Change?</span>
          </button>
          <button className="btn-primary" onClick={() => navigate("/receipts")}>
            <PackagePlus size={15} />
            <span>+ Receive Stock</span>
          </button>
          <button className="btn-secondary" onClick={() => navigate("/deliveries")}>
            <Truck size={15} />
            <span>+ Ship Delivery</span>
          </button>
        </div>
      </div>

      {/* Multi-Dimensional Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600 }}>
            <Filter size={14} />
            <span>DYNAMIC FILTERS:</span>
          </div>

          {/* By Document Type */}
          <select
            className="filter-select"
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
          >
            <option value="">All Document Types</option>
            <option value="RECEIPTS">Receipts (Incoming)</option>
            <option value="DELIVERY">Delivery Orders (Outgoing)</option>
            <option value="TRANSFER">Internal Transfers</option>
            <option value="ADJUSTMENT">Stock Adjustments</option>
          </select>

          {/* By Status */}
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="WAITING">Waiting</option>
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>

          {/* By Warehouse / Location */}
          <select
            className="filter-select"
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.city || "Hub"})
              </option>
            ))}
          </select>

          {/* By Category */}
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {(selectedWarehouse || selectedCategory || selectedDocType || selectedStatus) && (
            <button
              className="action-btn-sm"
              onClick={() => {
                setSelectedWarehouse("");
                setSelectedCategory("");
                setSelectedDocType("");
                setSelectedStatus("");
              }}
              style={{ color: "var(--accent-rose)" }}
            >
              Clear Filters
            </button>
          )}
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {selectedDocType && (
            <span style={{ color: "var(--accent-cyan)", fontWeight: 600, marginRight: "8px" }}>
              Filter: {selectedDocType}
            </span>
          )}
          Ledger Status: <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>Live & Audited</span>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="kpi-card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(kpi.link)}
            >
              <div className="kpi-header">
                <span className="kpi-title">{kpi.title}</span>
                <div className={`kpi-icon-box ${kpi.colorClass}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="kpi-value">{loading ? "--" : kpi.value}</div>
              <div className="kpi-subtitle">{kpi.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* Smart Decision-Support Insights Banner */}
      {data?.smartInsights && data.smartInsights.length > 0 && (
        <div className="smart-insights-container">
          <div className="smart-insights-header">
            <Sparkles size={18} color="var(--accent-cyan)" />
            <span className="smart-insights-badge">StockSense AI Decision Engine</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Automated operational recommendations & anomaly warnings
            </span>
          </div>

          <div className="insights-grid">
            {data.smartInsights.map((insight, idx) => (
              <div
                key={idx}
                className="insight-card"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(insight.action)}
              >
                <div className={`insight-icon ${insight.type.toLowerCase()}`}>
                  <TrendingDown size={18} />
                </div>
                <div className="insight-body">
                  <strong>{insight.title}</strong>
                  <p>{insight.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Split Section: Analytics & Recent Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Stock Health Distribution Donut */}
        <div className="table-card" style={{ padding: "20px", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px" }}>Inventory Health Distribution</h3>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Current Snapshot</span>
          </div>

          <div style={{ height: "180px", display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-medium)", borderRadius: "6px" }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div style={{ width: "50%", display: "grid", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CHART_COLORS[0] }} />
                  Healthy Stock
                </span>
                <strong>{Math.max(0, (data?.totalProductsInStock || 0) - (data?.lowStock || 0) - (data?.outOfStock || 0))}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CHART_COLORS[1] }} />
                  Low Stock
                </span>
                <strong>{data?.lowStock || 0}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: CHART_COLORS[2] }} />
                  Out of Stock
                </span>
                <strong>{data?.outOfStock || 0}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Movements Ledger Feed */}
        <div className="table-card" style={{ padding: "20px", margin: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px" }}>Recent Stock Movements</h3>
            <Link to="/movements" style={{ fontSize: "12px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "4px" }}>
              Full Ledger <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ display: "grid", gap: "8px" }}>
            {filteredMovements && filteredMovements.length > 0 ? (
              filteredMovements.map((move) => (
                <div
                  key={move.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "var(--bg-input)",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      className={`status-badge ${
                        move.type === "RECEIPT"
                          ? "done"
                          : move.type === "DELIVERY"
                          ? "shipped"
                          : "ready"
                      }`}
                      style={{ fontSize: "10px" }}
                    >
                      {move.type}
                    </span>
                    <div>
                      <strong style={{ color: "#fff", display: "block" }}>
                        {move.variant?.product?.name || "Product"}
                      </strong>
                      <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                        {move.warehouse?.name} · {move.createdBy?.name || "Staff"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <strong
                      style={{
                        color: move.type === "RECEIPT" || move.type === "TRANSFER_IN" ? "var(--accent-emerald)" : "var(--accent-rose)",
                      }}
                    >
                      {move.type === "RECEIPT" || move.type === "TRANSFER_IN" ? `+${move.quantity}` : `-${move.quantity}`}
                    </strong>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                      {new Date(move.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                No recent stock movements recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* "Why Did Stock Change?" Modal */}
      <ExplainModal
        isOpen={explainOpen}
        onClose={() => setExplainOpen(false)}
      />
    </AppLayout>
  );
}
