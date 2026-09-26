import { useEffect, useState } from "react";
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Key,
  Edit2,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const ROLES = [
  {
    key: "ADMIN",
    label: "Admin",
    color: "#6366f1",
    desc: "Full access to inventory, operations, system settings, and user management",
  },
  {
    key: "INVENTORY_MANAGER",
    label: "Inventory Manager",
    color: "#06b6d4",
    desc: "Manages catalog, purchase orders, incoming receipts, outgoing delivery authorizations",
  },
  {
    key: "WAREHOUSE_STAFF",
    label: "Warehouse Staff",
    color: "#10b981",
    desc: "Executes stock receipts, picking & packing deliveries, internal transfers, and physical counts",
  },
  {
    key: "AUDITOR",
    label: "Auditor",
    color: "#f59e0b",
    desc: "Read-only compliance audit trail, move history ledger, stock runaway analytics",
  },
];

export default function Users() {
  const { token, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // Create User Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "password123",
    role: "WAREHOUSE_STAFF",
  });
  const [submitting, setSubmitting] = useState(false);

  // Edit Role Modal
  const [editingUser, setEditingUser] = useState(null);
  const [newRole, setNewRole] = useState("WAREHOUSE_STAFF");

  useEffect(() => {
    if (!token) return;
    loadUsers();
  }, [token]);

  async function loadUsers() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to load users");
      setUsers(body.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create user");

      setSuccessMsg(`User ${body.data.name} created successfully with role ${body.data.role}!`);
      setIsCreateOpen(false);
      setForm({ name: "", email: "", password: "password123", role: "WAREHOUSE_STAFF" });
      await loadUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(u) {
    if (u.id === currentUser?.id) {
      setError("You cannot deactivate your own administrative account");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/users/${u.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to update user");
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUpdateRole(e) {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const res = await fetch(`${API_URL}/users/${editingUser.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to change role");
      setSuccessMsg(`Role updated to ${newRole} for ${editingUser.name}`);
      setEditingUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.message);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const staffCount = users.filter((u) => u.role === "WAREHOUSE_STAFF").length;
  const managerCount = users.filter((u) => u.role === "INVENTORY_MANAGER").length;
  const auditorCount = users.filter((u) => u.role === "AUDITOR").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Team & User Access Control</h1>
          <p>Admin console to invite warehouse staff, managers, auditors, and configure RBAC roles</p>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setIsCreateOpen(true)}>
            <UserPlus size={16} />
            <span>+ Create Team Member</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Warehouse Staff</span>
            <div className="kpi-icon-box emerald"><UsersIcon size={16} /></div>
          </div>
          <div className="kpi-value">{staffCount}</div>
          <div className="kpi-subtitle">Executes receipts, picks, counts</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Inventory Managers</span>
            <div className="kpi-icon-box cyan"><Shield size={16} /></div>
          </div>
          <div className="kpi-value">{managerCount}</div>
          <div className="kpi-subtitle">Catalog, approvals & warehouses</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Auditors</span>
            <div className="kpi-icon-box amber"><ShieldCheck size={16} /></div>
          </div>
          <div className="kpi-value">{auditorCount}</div>
          <div className="kpi-subtitle">Read-only ledger & runway audit</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">System Admins</span>
            <div className="kpi-icon-box indigo"><Key size={16} /></div>
          </div>
          <div className="kpi-value">{adminCount}</div>
          <div className="kpi-subtitle">Full administrative control</div>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}
      {successMsg && <div className="notice-box notice-success">{successMsg}</div>}

      {/* Filters Toolbar */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search user name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r.key} value={r.key}>{r.label}</option>
            ))}
          </select>

          {(search || roleFilter) && (
            <button
              className="action-btn-sm"
              onClick={() => { setSearch(""); setRoleFilter(""); }}
              style={{ color: "var(--accent-rose)" }}
            >
              Clear
            </button>
          )}
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> accounts
        </div>
      </div>

      {/* Users Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>Role Assignment</th>
              <th>Ledger Activity</th>
              <th>Account Status</th>
              <th>Joined Date</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  Loading team members...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "var(--text-muted)" }}>
                  No team members matching filter criteria.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const roleObj = ROLES.find((r) => r.key === u.role) || { label: u.role, color: "#94a3b8" };
                const isSelf = u.id === currentUser?.id;
                const totalActivity = (u._count?.stockMovements || 0) + (u._count?.createdPOs || 0) + (u._count?.stockAdjustments || 0);

                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: `rgba(${parseInt(roleObj.color.slice(1,3),16)}, ${parseInt(roleObj.color.slice(3,5),16)}, ${parseInt(roleObj.color.slice(5,7),16)}, 0.2)`,
                            border: `1px solid ${roleObj.color}`,
                            color: roleObj.color,
                            display: "grid",
                            placeItems: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong style={{ color: "#fff" }}>{u.name}</strong>
                          {isSelf && (
                            <span style={{ fontSize: "10px", marginLeft: "6px", color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.15)", padding: "1px 6px", borderRadius: "4px" }}>
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>
                        {u.email}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: `rgba(${parseInt(roleObj.color.slice(1,3),16)}, ${parseInt(roleObj.color.slice(3,5),16)}, ${parseInt(roleObj.color.slice(5,7),16)}, 0.15)`,
                          color: roleObj.color,
                          border: `1px solid ${roleObj.color}40`,
                        }}
                      >
                        ● {roleObj.label}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        <strong>{totalActivity}</strong> ledger movements
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          color: u.isActive ? "var(--accent-emerald)" : "var(--accent-rose)",
                          fontWeight: 600,
                        }}
                      >
                        {u.isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {new Date(u.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          type="button"
                          className="action-btn-sm"
                          onClick={() => {
                            setEditingUser(u);
                            setNewRole(u.role);
                          }}
                          title="Change Role Assignment"
                        >
                          <Edit2 size={12} style={{ marginRight: "4px" }} />
                          Role
                        </button>

                        {!isSelf && (
                          <button
                            type="button"
                            className="action-btn-sm"
                            onClick={() => handleToggleStatus(u)}
                            style={{
                              color: u.isActive ? "var(--accent-rose)" : "var(--accent-emerald)",
                              borderColor: u.isActive ? "rgba(244, 63, 94, 0.3)" : "rgba(16, 185, 129, 0.3)",
                            }}
                          >
                            {u.isActive ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role Variant Capabilities Matrix (Reference) */}
      <div className="table-card" style={{ padding: "20px" }}>
        <h3 style={{ fontSize: "15px", marginBottom: "8px", color: "#fff" }}>
          🛡️ Role Variant Capabilities Matrix (RBAC)
        </h3>
        <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "16px" }}>
          StockSense strictly segregates duties between inventory operations and compliance auditing:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          {ROLES.map((r) => (
            <div
              key={r.key}
              style={{
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                padding: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <span style={{ color: r.color, fontSize: "14px" }}>●</span>
                <strong style={{ fontSize: "13px", color: "#fff" }}>{r.label}</strong>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CREATE TEAM MEMBER MODAL */}
      {isCreateOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Team Member</h3>
              <button className="action-btn-sm" onClick={() => setIsCreateOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Lin"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. maya@stocksense.local"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Role Assignment *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                  >
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label} — {r.desc.slice(0, 50)}...
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Default Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    User can sign in with this password or request a 6-digit OTP code sent via Nodemailer.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Creating Member..." : "Create Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Change Role for {editingUser.name}</h3>
              <button className="action-btn-sm" onClick={() => setEditingUser(null)}>✕</button>
            </div>

            <form onSubmit={handleUpdateRole}>
              <div className="modal-body form-grid">
                <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Current Role: <strong>{editingUser.role}</strong>
                </div>

                <div className="form-group">
                  <label>Select New Role Assignment</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
