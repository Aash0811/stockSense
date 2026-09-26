import { NavLink } from "react-router-dom";
import {
  Boxes,
  LayoutDashboard,
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
  User,
  ShieldCheck,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="sidebar-container">
      <div className="sidebar-brand">
        <div className="brand-icon-box">SS</div>
        <div className="brand-text">
          <h2>StockSense</h2>
          <span>Intelligence Engine</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-title">Core Operations</span>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <LayoutDashboard size={17} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Boxes size={17} />
          <span>Products & Catalog</span>
        </NavLink>
        <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Layers size={17} />
          <span>Inventory Matrix</span>
        </NavLink>

        <span className="nav-section-title">Stock Movements</span>
        <NavLink to="/receipts" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <ArrowDownToLine size={17} />
          <span>Receipts (Goods In)</span>
        </NavLink>
        <NavLink to="/deliveries" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <ArrowUpFromLine size={17} />
          <span>Deliveries (Goods Out)</span>
        </NavLink>
        <NavLink to="/transfers" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <RefreshCw size={17} />
          <span>Internal Transfers</span>
        </NavLink>
        <NavLink to="/adjustments" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Sliders size={17} />
          <span>Stock Adjustments</span>
        </NavLink>
        <NavLink to="/movements" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <History size={17} />
          <span>Stock Ledger (Audit)</span>
        </NavLink>

        <span className="nav-section-title">Decision Intelligence</span>
        <NavLink to="/forecast" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <TrendingDown size={17} />
          <span>7-Day Stock Runway</span>
          <span className="nav-badge danger">Alerts</span>
        </NavLink>
        <NavLink to="/dead-stock" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Archive size={17} />
          <span>Dead Stock Analyzer</span>
        </NavLink>
        <NavLink to="/assistant" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Bot size={17} />
          <span>AI Decision Assistant</span>
        </NavLink>

        <span className="nav-section-title">Infrastructure & Team</span>
        <NavLink to="/warehouses" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <Warehouse size={17} />
          <span>Warehouses</span>
        </NavLink>
        <NavLink to="/locations" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <MapPin size={17} />
          <span>Location Hierarchy</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
          <User size={17} />
          <span>User Profile</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "11px" }}>
          <ShieldCheck size={14} color="#10b981" />
          <span>Audit-Compliant Ledger Active</span>
        </div>
      </div>
    </aside>
  );
}
