import { useEffect, useState } from "react";
import {
  Boxes,
  Plus,
  Search,
  Barcode,
  Layers,
  HelpCircle,
  QrCode,
  ChevronDown,
  ChevronUp,
  Tag,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import ExplainModal from "../../components/common/ExplainModal";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getHealthBadge(available, reorderPoint) {
  const rp = Number(reorderPoint) || 10;
  const avail = Number(available) || 0;

  if (avail <= 0) return { label: "Out of Stock", class: "health-out", dot: "⚫" };
  if (avail <= Math.floor(rp * 0.5)) return { label: "Critical Stock", class: "health-critical", dot: "🔴" };
  if (avail <= rp) return { label: "Low Stock", class: "health-low", dot: "🟠" };
  if (avail <= Math.floor(rp * 1.5)) return { label: "Watch List", class: "health-watch", dot: "🟡" };
  return { label: "Healthy", class: "health-healthy", dot: "🟢" };
}

export default function Products() {
  const { token, user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(null); // productId
  const [showBarcodeCard, setShowBarcodeCard] = useState(null); // item
  const [explainVariantId, setExplainVariantId] = useState(null);
  const [explainProductName, setExplainProductName] = useState("");
  const [expandedProductIds, setExpandedProductIds] = useState(new Set());

  // Forms
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    brand: "",
    barcode: "",
    categoryId: "",
    unitName: "piece",
    reorderPoint: "20",
    safetyStock: "10",
  });

  const [variantForm, setVariantForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    price: "100.00",
    cost: "60.00",
  });

  const canManage = user?.role === "ADMIN" || user?.role === "INVENTORY_MANAGER";

  useEffect(() => {
    if (!token) return;
    loadData();
  }, [search, categoryFilter, token]);

  async function loadData() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (categoryFilter) params.set("categoryId", categoryFilter);

      const [pRes, cRes] = await Promise.all([
        fetch(`${API_URL}/products?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [pData, cData] = await Promise.all([pRes.json(), cRes.json()]);
      if (pData.data?.items) setProducts(pData.data.items);
      if (cData.data?.items) setCategories(cData.data.items);
    } catch (err) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id) {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreateProduct(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...productForm,
          barcode: productForm.barcode || undefined,
          reorderPoint: Number(productForm.reorderPoint) || 0,
          safetyStock: Number(productForm.safetyStock) || 0,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create product");

      setShowCreateModal(false);
      setProductForm({ name: "", sku: "", brand: "", barcode: "", categoryId: "", unitName: "piece", reorderPoint: "20", safetyStock: "10" });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateVariant(e) {
    e.preventDefault();
    if (!showVariantModal) return;
    setError("");
    try {
      const res = await fetch(`${API_URL}/products/${showVariantModal}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...variantForm,
          barcode: variantForm.barcode || undefined,
          price: Number(variantForm.price),
          cost: Number(variantForm.cost),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to create variant");

      setShowVariantModal(null);
      setVariantForm({ name: "", sku: "", barcode: "", price: "100.00", cost: "60.00" });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Product Catalog & Variants</h1>
          <p>Centralized product repository, SKU uniqueness, multi-variants, and real-time stock health</p>
        </div>
        <div className="header-actions">
          {canManage && (
            <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>+ New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-toolbar">
        <div className="filter-group">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              placeholder="Search product name, SKU, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "var(--text-muted)" }}>
          <span>Catalog Items: <strong style={{ color: "#fff" }}>{products.length}</strong></span>
        </div>
      </div>

      {error && <div className="notice-box notice-danger">{error}</div>}

      {/* Products Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "30px" }}></th>
              <th>Product & Brand</th>
              <th>SKU / Roll No.</th>
              <th>Category</th>
              <th>Variants</th>
              <th>Unit</th>
              <th>Reorder Point</th>
              <th>Stock Health</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  Loading catalog products...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  No products found. Click "+ New Product" to add items to your inventory.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isExpanded = expandedProductIds.has(product.id);
                const variantCount = product.variants?.length || 0;
                // Calculate total available if available in product
                const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory?.reduce((s, i) => s + (Number(i.onHand) - Number(i.reserved) - Number(i.damaged)), 0) || 0), 0) || 0;
                const health = getHealthBadge(totalStock, product.reorderPoint);

                return (
                  <tr key={product.id}>
                    <td>
                      {variantCount > 0 && (
                        <button
                          className="action-btn-sm"
                          style={{ padding: "3px 6px" }}
                          onClick={() => toggleExpand(product.id)}
                          title="View product variants"
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="kpi-icon-box indigo" style={{ width: "28px", height: "28px" }}>
                          <Boxes size={14} />
                        </div>
                        <div>
                          <strong style={{ color: "#fff", display: "block" }}>{product.name}</strong>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                            {product.brand || "Standard Line"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="sku-tag">{product.sku}</span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--text-secondary)" }}>
                        <Tag size={12} color="var(--accent-cyan)" />
                        {product.category?.name || "General"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                        {variantCount} variant{variantCount !== 1 ? "s" : ""}
                      </span>
                    </td>
                    <td>{product.unitName || "piece"}</td>
                    <td>
                      <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        {product.reorderPoint || 0}
                      </span>
                    </td>
                    <td>
                      <span className={`health-badge ${health.class}`}>
                        <span>{health.dot}</span> {health.label}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="action-btn-sm"
                          title="Generate / View Barcode & QR"
                          onClick={() => setShowBarcodeCard(product)}
                        >
                          <QrCode size={13} />
                        </button>

                        <button
                          className="action-btn-sm"
                          title="Why Did Stock Change?"
                          onClick={() => {
                            const firstVariant = product.variants?.[0];
                            setExplainVariantId(firstVariant?.id || null);
                            setExplainProductName(product.name);
                          }}
                        >
                          <HelpCircle size={13} color="var(--accent-cyan)" />
                        </button>

                        {canManage && (
                          <button
                            className="action-btn-sm"
                            style={{ color: "var(--accent-emerald)" }}
                            onClick={() => {
                              setShowVariantModal(product.id);
                              setVariantForm({
                                name: `${product.name} - Variant`,
                                sku: `${product.sku}-V${(product.variants?.length || 0) + 1}`,
                                barcode: "",
                                price: "100.00",
                                cost: "60.00",
                              });
                            }}
                          >
                            + Variant
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

      {/* Expanded Variants Nested Lists */}
      {products.map((product) => {
        if (!expandedProductIds.has(product.id) || !product.variants?.length) return null;

        return (
          <div
            key={`variants-${product.id}`}
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "16px 20px",
              marginBottom: "16px",
              marginLeft: "30px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <strong style={{ fontSize: "13px", color: "var(--accent-cyan)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Layers size={14} /> Variants for {product.name}
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Each variant has independent SKU, barcode, price, and stock levels
              </span>
            </div>

            <div style={{ display: "grid", gap: "6px" }}>
              {product.variants.map((v) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    background: "var(--bg-card)",
                    borderRadius: "4px",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span className="sku-tag" style={{ fontSize: "11px" }}>{v.sku}</span>
                    <strong style={{ color: "#fff" }}>{v.name}</strong>
                    {v.barcode && (
                      <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        [{v.barcode}]
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: "var(--text-muted)" }}>Price: ₹{v.price} · Cost: ₹{v.cost}</span>
                    <button
                      className="action-btn-sm"
                      style={{ fontSize: "11px" }}
                      onClick={() => {
                        setExplainVariantId(v.id);
                        setExplainProductName(`${product.name} (${v.name})`);
                      }}
                    >
                      <HelpCircle size={12} color="var(--accent-cyan)" /> Why Stock Changed?
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Product</h3>
              <button className="action-btn-sm" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProduct}>
              <div className="modal-body form-grid">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    required
                    placeholder="e.g. High-Tensile Steel Rod"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>SKU (Roll No.) *</label>
                    <input
                      required
                      placeholder="e.g. STL-001"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Brand / Manufacturer</label>
                    <input
                      placeholder="e.g. Tata Steel"
                      value={productForm.brand}
                      onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      required
                      value={productForm.categoryId}
                      onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Unit of Measure *</label>
                    <input
                      required
                      placeholder="e.g. KG, piece, meter"
                      value={productForm.unitName}
                      onChange={(e) => setProductForm({ ...productForm, unitName: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Reorder Point</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.reorderPoint}
                      onChange={(e) => setProductForm({ ...productForm, reorderPoint: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Safety Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.safetyStock}
                      onChange={(e) => setProductForm({ ...productForm, safetyStock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Barcode / GTIN</label>
                  <input
                    placeholder="e.g. 890123456789"
                    value={productForm.barcode}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="modal-overlay" onClick={() => setShowVariantModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Product Variant</h3>
              <button className="action-btn-sm" onClick={() => setShowVariantModal(null)}>✕</button>
            </div>
            <form onSubmit={handleCreateVariant}>
              <div className="modal-body form-grid">
                <div className="notice-box notice-info">
                  Variants represent distinct sizes, colors, or specifications of the parent product.
                </div>

                <div className="form-group">
                  <label>Variant Name *</label>
                  <input
                    required
                    placeholder="e.g. Size 9 / Black / 12mm"
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Variant SKU *</label>
                    <input
                      required
                      placeholder="e.g. STL-001-12MM"
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Variant Barcode</label>
                    <input
                      placeholder="e.g. BAR-12MM"
                      value={variantForm.barcode}
                      onChange={(e) => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={variantForm.price}
                      onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={variantForm.cost}
                      onChange={(e) => setVariantForm({ ...variantForm, cost: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowVariantModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Variant</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode & QR Code Card Modal */}
      {showBarcodeCard && (
        <div className="modal-overlay" onClick={() => setShowBarcodeCard(null)}>
          <div className="modal-content" style={{ width: "420px", textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Product Identifiers</h3>
              <button className="action-btn-sm" onClick={() => setShowBarcodeCard(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: "30px 24px" }}>
              <div style={{ background: "#fff", padding: "24px", borderRadius: "10px", display: "inline-block", boxShadow: "0 4px 15px rgba(0,0,0,0.4)" }}>
                {/* Visual Barcode Graphic */}
                <div style={{ width: "220px", height: "70px", margin: "0 auto 12px", background: "repeating-linear-gradient(90deg, #000 0px, #000 3px, #fff 3px, #fff 6px, #000 6px, #000 10px, #fff 10px, #fff 13px, #000 13px, #000 15px, #fff 15px, #fff 18px)" }} />
                <div style={{ fontFamily: "monospace", fontSize: "16px", letterSpacing: "3px", color: "#000", fontWeight: 700 }}>
                  {showBarcodeCard.barcode || showBarcodeCard.sku}
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <h4 style={{ color: "#fff", fontSize: "16px" }}>{showBarcodeCard.name}</h4>
                <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                  SKU: {showBarcodeCard.sku} · Category: {showBarcodeCard.category?.name || "General"}
                </p>
              </div>
            </div>
            <div className="modal-footer" style={{ justifyContent: "center" }}>
              <button className="btn-secondary" onClick={() => setShowBarcodeCard(null)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()}>Print Label</button>
            </div>
          </div>
        </div>
      )}

      {/* Explain Modal */}
      <ExplainModal
        isOpen={Boolean(explainVariantId)}
        onClose={() => setExplainVariantId(null)}
        variantId={explainVariantId}
        productName={explainProductName}
      />
    </AppLayout>
  );
}
