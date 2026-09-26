import { useEffect, useState } from "react";
import {
  MapPin,
  Layers,
  Warehouse,
  ChevronRight,
  FolderTree,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function LocationTreeNode({ location }) {
  return (
    <li style={{ listStyle: "none", marginBottom: "8px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          fontSize: "13px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <MapPin size={14} color="var(--accent-cyan)" />
          <strong style={{ color: "#fff" }}>{location.name}</strong>
          <span className="sku-tag" style={{ fontSize: "10px" }}>{location.code}</span>
        </div>
        <span
          className="status-badge ready"
          style={{ fontSize: "10px", padding: "2px 8px" }}
        >
          {location.type}
        </span>
      </div>

      {location.children && location.children.length > 0 && (
        <ul style={{ paddingLeft: "24px", marginTop: "8px", borderLeft: "1px dashed var(--border-medium)" }}>
          {location.children.map((child) => (
            <LocationTreeNode key={child.id} location={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function Locations() {
  const { token } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [warehouseId, setWarehouseId] = useState("");
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/warehouses`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((body) => {
        const items = body.data?.items || [];
        setWarehouses(items);
        if (items[0]) setWarehouseId(items[0].id);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!warehouseId || !token) return;
    setLoading(true);
    fetch(`${API_URL}/locations/warehouse/${warehouseId}/tree`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error?.message || "Failed to load location hierarchy");
        setTree(body.data || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [warehouseId, token]);

  const activeWarehouse = warehouses.find((w) => w.id === warehouseId);

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Location Hierarchy</h1>
          <p>Multi-tier warehouse topology: Zones → Aisles → Racks → Shelves → Bins</p>
        </div>
      </div>

      {/* Hierarchy Concept Callout */}
      <div className="smart-insights-container" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FolderTree size={16} color="var(--accent-indigo)" />
          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
            <strong>Precision Logistics Structure:</strong> Real-world warehouse topology enables pickers to navigate directly to the exact shelf and bin (e.g. Zone A &rarr; Rack A1 &rarr; Shelf 2) rather than broad warehouse guesswork.
          </span>
        </div>
      </div>

      <div className="filters-toolbar">
        <div className="filter-group">
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>SELECT WAREHOUSE:</label>
          <select
            className="filter-select"
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.city || "Facility"})
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Active Facility: <strong style={{ color: "#fff" }}>{activeWarehouse?.name || "Warehouse"}</strong>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      <div className="table-card" style={{ padding: "24px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            Loading location topology...
          </div>
        ) : tree.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
            No location hierarchy defined for this warehouse yet.
          </div>
        ) : (
          <ul style={{ padding: 0, margin: 0 }}>
            {tree.map((loc) => (
              <LocationTreeNode key={loc.id} location={loc} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  );
}
