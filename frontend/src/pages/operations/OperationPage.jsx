import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, Plus, Search } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const operations = {
  products: { title: "Products", description: "Maintain your product catalog and stock identifiers.", endpoint: "/products", columns: ["name", "sku", "isActive"] },
  receipts: { title: "Receipts", description: "Track incoming stock from suppliers.", endpoint: "/receipts", columns: ["receiptNumber", "status", "createdAt"] },
  deliveries: { title: "Deliveries", description: "Pick, pack, ship, and fulfill outgoing stock.", endpoint: "/deliveries", columns: ["deliveryNumber", "status", "createdAt"] },
  transfers: { title: "Transfers", description: "Move stock between warehouses and locations.", endpoint: "/transfers", columns: ["transferNumber", "status", "createdAt"] },
  adjustments: { title: "Adjustments", description: "Reconcile system stock with physical counts.", endpoint: "/adjustments", columns: ["adjustmentNumber", "status", "createdAt"] },
  reports: { title: "Reports", description: "Review operational stock intelligence.", endpoint: "/reports/dashboard", columns: [] },
  audit: { title: "Audit log", description: "Review immutable stock movement history.", endpoint: "/audit", columns: ["type", "quantity", "referenceType", "createdAt"] },
};

function displayValue(value) {
  if (typeof value === "boolean") return value ? "Active" : "Inactive";
  if (!value) return "-";
  return String(value).replaceAll("_", " ");
}

export default function OperationPage() {
  const { section } = useParams();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const operation = operations[section] || operations.products;
  const [records, setRecords] = useState([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`${API_URL}${operation.endpoint}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || "Unable to load records");
        return body.data;
      })
      .then((data) => setRecords(Array.isArray(data) ? data : data.items ? data.items : [data]))
      .catch((reason) => setError(reason.message));
  }, [operation.endpoint, token]);

  const filteredRecords = records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="operation-shell">
      <header className="operation-header">
        <div>
          <Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link>
          <p className="eyebrow">Operations / {operation.title}</p>
          <h1>{operation.title}</h1>
          <p className="muted">{operation.description}</p>
        </div>
        <div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div>
      </header>
      <section className="operation-toolbar"><label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${operation.title.toLowerCase()}`} /></label><button className="primary-action"><Plus size={16} /> New {operation.title.slice(0, -1)}</button></section>
      {error && <div className="notice">{error}</div>}
      <section className="records-panel">
        {operation.columns.length === 0 ? <div className="report-summary"><p className="eyebrow">Live report</p><h2>Dashboard intelligence</h2><pre>{JSON.stringify(records[0] || {}, null, 2)}</pre></div> : <table><thead><tr>{operation.columns.map((column) => <th key={column}>{column.replaceAll(/([A-Z])/g, " $1")}</th>)}</tr></thead><tbody>{filteredRecords.map((record) => <tr key={record.id || JSON.stringify(record)}>{operation.columns.map((column) => <td key={column}>{displayValue(record[column])}</td>)}</tr>)}</tbody></table>}
        {!error && !filteredRecords.length && operation.columns.length > 0 && <p className="empty-state">No records found.</p>}
      </section>
    </main>
  );
}
