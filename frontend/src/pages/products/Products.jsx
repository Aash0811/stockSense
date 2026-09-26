import { useEffect, useState } from "react";
import { ArrowLeft, Barcode, LogOut, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Products() {
	const { token, user, logout } = useAuth();
	const navigate = useNavigate();
	const [products, setProducts] = useState([]);
	const [search, setSearch] = useState("");
	const [barcode, setBarcode] = useState("");
	const [barcodeResult, setBarcodeResult] = useState(null);
	const [error, setError] = useState("");
	const [categories, setCategories] = useState([]);
	const [showCreate, setShowCreate] = useState(false);
	const [form, setForm] = useState({ name: "", sku: "", barcode: "", categoryId: "", unitName: "piece", reorderPoint: "0" });

	useEffect(() => {
		fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } })
			.then((response) => response.json())
			.then((body) => setCategories(body.data?.items || []))
			.catch(() => setCategories([]));
	}, [token]);

	useEffect(() => {
		const query = search ? `?search=${encodeURIComponent(search)}` : "";
		fetch(`${API_URL}/products${query}`, { headers: { Authorization: `Bearer ${token}` } })
			.then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Unable to load products"); return body.data; })
			.then((data) => setProducts(data.items || []))
			.catch((reason) => setError(reason.message));
	}, [search, token]);

	async function lookupBarcode(event) {
		event.preventDefault();
		setError("");
		setBarcodeResult(null);
		try {
			const response = await fetch(`${API_URL}/products/lookup/barcode/${encodeURIComponent(barcode)}`, { headers: { Authorization: `Bearer ${token}` } });
			const body = await response.json();
			if (!response.ok) throw new Error(body.error?.message || "Barcode not found");
			setBarcodeResult(body.data);
		} catch (reason) { setError(reason.message); }
	}

	async function createProduct(event) {
		event.preventDefault();
		setError("");
		try {
			const response = await fetch(`${API_URL}/products`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...form, barcode: form.barcode || undefined, categoryId: form.categoryId, reorderPoint: Number(form.reorderPoint) }) });
			const body = await response.json();
			if (!response.ok) throw new Error(body.error?.message || "Unable to create product");
			setProducts((current) => [body.data, ...current]);
			setForm({ name: "", sku: "", barcode: "", categoryId: "", unitName: "piece", reorderPoint: "0" });
			setShowCreate(false);
		} catch (reason) { setError(reason.message); }
	}

	return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Catalog / Products</p><h1>Products</h1><p className="muted">Search products, variants, and barcode identifiers.</p></div><div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div></header><section className="product-tools"><label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products or SKU" /></label><form className="barcode-form" onSubmit={lookupBarcode}><Barcode size={16} /><input value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Scan or enter barcode" required /><button type="submit">Find</button></form><button className="primary-action" type="button" onClick={() => setShowCreate((current) => !current)}>+ New product</button></section>{showCreate && <form className="product-form" onSubmit={createProduct}><label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>SKU<input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required /></label><label>Barcode<input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} /></label><label>Category<select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} required><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Unit<input value={form.unitName} onChange={(event) => setForm({ ...form, unitName: event.target.value })} required /></label><label>Reorder point<input type="number" min="0" value={form.reorderPoint} onChange={(event) => setForm({ ...form, reorderPoint: event.target.value })} /></label><button className="primary-action" type="submit">Create product</button></form>}{error && <div className="notice">{error}</div>}{barcodeResult && <section className="barcode-result"><p className="eyebrow">Barcode match</p><strong>{barcodeResult.name}</strong><span>{barcodeResult.sku} · {barcodeResult.variants?.length || 0} variants</span></section>}<section className="records-panel"><table><thead><tr><th>Product</th><th>SKU</th><th>Category</th><th>Variants</th><th>Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.id}><td><strong>{product.name}</strong><small className="table-subtitle">{product.brand || "Unbranded"}</small></td><td>{product.sku}</td><td>{product.category?.name || "-"}</td><td>{product._count?.variants ?? product.variants?.length ?? 0}</td><td><span className="status-active">{product.status}</span></td></tr>)}</tbody></table>{!error && !products.length && <p className="empty-state">No products found.</p>}</section></main>;
}
