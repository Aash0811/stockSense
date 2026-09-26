import { useState } from "react";
import { Barcode, Camera, CheckCircle2, Search, X, Package, MapPin } from "lucide-react";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PRESET_BARCODES = [
  { label: "Steel Rod (STL-001)", code: "STL-001" },
  { label: "Steel Rod Barcode", code: "BAR-1001" },
  { label: "Nike Shoe Size 8", code: "SHOE-001-8" },
  { label: "Ergonomic Chair", code: "FURN-CHR-01" },
  { label: "Laptop Pro", code: "ELEC-LAP-01" },
];

export default function BarcodeScannerModal({ isOpen, onClose }) {
  const { token } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);

  if (!isOpen) return null;

  async function handleLookup(lookupCode) {
    const targetCode = (lookupCode || code).trim();
    if (!targetCode) return;
    setError("");
    setLoading(true);
    setResult(null);

    try {
      // First try barcode lookup
      let res = await fetch(`${API_URL}/products/lookup/barcode/${encodeURIComponent(targetCode)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let body = await res.json();

      if (!res.ok) {
        // Fallback to SKU/text search
        res = await fetch(`${API_URL}/products?search=${encodeURIComponent(targetCode)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        body = await res.json();
        if (body.data?.items && body.data.items.length > 0) {
          setResult(body.data.items[0]);
        } else {
          throw new Error("No product or variant found matching this barcode / SKU.");
        }
      } else {
        setResult(body.data);
      }
    } catch (err) {
      setError(err.message || "Failed to find product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ width: "640px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="kpi-icon-box cyan">
              <Barcode size={18} />
            </div>
            <div>
              <h3>Barcode & QR Code Scanner</h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Instant warehouse item lookup & real-time inventory locator
              </p>
            </div>
          </div>
          <button className="action-btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Scanner Input / Camera Area */}
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px dashed var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              textAlign: "center",
              marginBottom: "18px",
            }}
          >
            {isCameraActive ? (
              <div style={{ padding: "20px" }}>
                <div style={{ position: "relative", width: "100%", height: "160px", background: "#000", borderRadius: "8px", overflow: "hidden", display: "grid", placeItems: "center" }}>
                  <div style={{ position: "absolute", width: "80%", height: "2px", background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)", animation: "pulse 1.5s infinite" }} />
                  <span style={{ color: "#94a3b8", fontSize: "12px", zIndex: 2 }}>[ Optical Camera Barcode Feed Simulated ]</span>
                </div>
                <button
                  className="btn-secondary"
                  style={{ marginTop: "12px" }}
                  onClick={() => setIsCameraActive(false)}
                >
                  Switch to Manual Input
                </button>
              </div>
            ) : (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleLookup(code);
                  }}
                  style={{ display: "flex", gap: "10px", marginBottom: "12px" }}
                >
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-medium)", borderRadius: "var(--radius-sm)", padding: "0 12px" }}>
                    <Barcode size={18} color="var(--accent-cyan)" />
                    <input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Scan or type Barcode / SKU (e.g. BAR-1001)..."
                      style={{ width: "100%", background: "transparent", border: "none", outline: "none", color: "#fff", padding: "10px 0" }}
                      autoFocus
                    />
                  </div>
                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? "Searching..." : <Search size={16} />}
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setIsCameraActive(true)}
                    title="Open Camera Scanner"
                  >
                    <Camera size={16} />
                  </button>
                </form>

                {/* Preset Chips */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Demo Barcodes:</span>
                  {PRESET_BARCODES.map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      className="action-btn-sm"
                      style={{ fontSize: "11px", color: "var(--accent-cyan)" }}
                      onClick={() => {
                        setCode(preset.code);
                        handleLookup(preset.code);
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <div className="notice-box notice-danger">{error}</div>}

          {/* Result Card */}
          {result && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(6, 182, 212, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "20px",
                boxShadow: "0 4px 20px rgba(6, 182, 212, 0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="sku-tag">{result.sku}</span>
                    <span className="status-badge done">
                      <CheckCircle2 size={12} /> Live Match
                    </span>
                  </div>
                  <h4 style={{ fontSize: "18px", color: "#fff" }}>{result.name}</h4>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Category: {result.category?.name || "General"} · Unit: {result.unitName || "piece"}
                  </p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Barcode:</span>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--accent-cyan)" }}>
                    {result.barcode || code || "N/A"}
                  </div>
                </div>
              </div>

              {/* Variants and stock */}
              {result.variants && result.variants.length > 0 && (
                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <strong style={{ fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "8px" }}>
                    Variants & Storage:
                  </strong>
                  <div style={{ display: "grid", gap: "6px" }}>
                    {result.variants.map((v) => (
                      <div
                        key={v.id}
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Package size={14} color="var(--accent-indigo)" />
                          <span>{v.name}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>({v.sku})</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                          <span style={{ color: "var(--text-muted)" }}>Price: ₹{v.price}</span>
                          <span style={{ color: "var(--accent-emerald)", fontWeight: 600 }}>Active</span>
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
