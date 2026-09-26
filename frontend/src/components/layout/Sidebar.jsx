import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Boxes,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Sliders,
  History,
  TrendingDown,
  Archive,
  Bot,
  Warehouse,
  MapPin,
  Users,
  User,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import useAuth from "../../hooks/useAuth";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const roleColors = {
    ADMIN: "#6366f1",
    INVENTORY_MANAGER: "#06b6d4",
    WAREHOUSE_STAFF: "#10b981",
    AUDITOR: "#f59e0b",
  };
  const roleColor = roleColors[user?.role] || "#6366f1";

  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-box">SS</div>
        <div className="brand-text">
          <h2>StockSense</h2>
          <span>Intelligence Engine</span>
        </div>
      </div>

      {/* Navigation Scrollable Body */}
      <nav className="sidebar-nav">
        {/* SECTION 1: OPERATIONS */}
        <span className="nav-section-title">Operations</span>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/receipts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <ArrowDownToLine size={16} />
          <span>Receipts (Incoming Stock)</span>
        </NavLink>
        <NavLink to="/deliveries" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <ArrowUpFromLine size={16} />
          <span>Delivery Orders (Outgoing)</span>
        </NavLink>
        <NavLink to="/transfers" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <RefreshCw size={16} />
          <span>Internal Transfers</span>
        </NavLink>
        <NavLink to="/adjustments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Sliders size={16} />
          <span>Inventory Adjustment</span>
        </NavLink>
        <NavLink to="/movements" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <History size={16} />
          <span>Move History (Ledger)</span>
        </NavLink>

        {/* SECTION 2: PRODUCTS */}
        <span className="nav-section-title">Products</span>
        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Boxes size={16} />
          <span>Products & Catalog</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Layers size={16} />
          <span>Stock per Location</span>
        </NavLink>

        {/* SECTION 3: DECISION INTELLIGENCE */}
        <span className="nav-section-title">Decision Intelligence</span>
        <NavLink to="/forecast" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <TrendingDown size={16} />
          <span>7-Day Stock Runway</span>
          <span className="nav-badge danger">Alerts</span>
        </NavLink>
        <NavLink to="/dead-stock" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Archive size={16} />
          <span>Dead Stock Analyzer</span>
        </NavLink>
        <NavLink to="/assistant" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Bot size={16} />
          <span>AI Decision Assistant</span>
        </NavLink>

        {/* SECTION 4: SETTINGS */}
        <span className="nav-section-title">Settings</span>
        <NavLink to="/warehouses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Warehouse size={16} />
          <span>Warehouses</span>
        </NavLink>
        <NavLink to="/locations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <MapPin size={16} />
          <span>Location Hierarchy</span>
        </NavLink>
        {user?.role === "ADMIN" && (
          <NavLink to="/users" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
            <Users size={16} />
            <span>Team & Staff Access</span>
            <span className="nav-badge" style={{ background: "rgba(99, 102, 241, 0.2)", color: "#818cf8" }}>Admin</span>
          </NavLink>
        )}
      </nav>

      {/* SECTION 5: PROFILE MENU (LEFT SIDEBAR) */}
      <div
        style={{
          borderTop: "1px solid var(--border-subtle)",
          padding: "12px 14px",
          background: "rgba(10, 15, 26, 0.95)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: `rgba(${parseInt(roleColor.slice(1,3),16)}, ${parseInt(roleColor.slice(3,5),16)}, ${parseInt(roleColor.slice(5,7),16)}, 0.25)`,
                border: `1px solid ${roleColor}`,
                color: roleColor,
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                fontSize: "13px",
                flexShrink: 0,
              }}
            >
              {user?.name?.charAt(0) || "U"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "StockSense User"}
              </div>
              <div style={{ fontSize: "10px", color: roleColor, fontWeight: 600, textTransform: "uppercase" }}>
                {user?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
          <NavLink
            to="/profile"
            className="action-btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "6px 8px",
              fontSize: "11px",
              background: "var(--bg-input)",
              color: "var(--text-secondary)",
              textDecoration: "none",
            }}
          >
            <User size={13} />
            <span>My Profile</span>
          </NavLink>

          <button
            type="button"
            onClick={handleLogout}
            className="action-btn-sm"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              padding: "6px 8px",
              fontSize: "11px",
              background: "rgba(244, 63, 94, 0.1)",
              color: "#fb7185",
              borderColor: "rgba(244, 63, 94, 0.2)",
            }}
          >
            <LogOut size={13} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
