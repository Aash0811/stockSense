import { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  TrendingDown,
  Archive,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PROMPT_SUGGESTIONS = [
  "Which products are likely to run out in the next 7 days?",
  "Show slow moving dead stock with locked capital",
  "Why did stock change for our products?",
  "Are there any unusual adjustments detected?",
  "Show active low stock and out-of-stock alerts",
];

export default function Assistant() {
  const { token } = useAuth();
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello! I am your StockSense Decision Intelligence Assistant. Ask me anything about stockout runways, slow-moving dead stock, movement explainability, or unusual warehouse adjustments.",
      data: null,
    },
  ]);
  const [loading, setLoading] = useState(false);

  async function handleAsk(promptText) {
    const q = (promptText || question).trim();
    if (!q) return;

    const userMessage = { sender: "user", text: q };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/reports/assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ question: q }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || "Failed to query assistant");

      const assistantMessage = {
        sender: "assistant",
        text: body.data?.answer || "Here are the operational findings:",
        data: body.data?.data || null,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "assistant", text: `⚠️ Error: ${err.message}`, data: null },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div className="page-title-group">
          <h1>StockSense AI Decision Assistant</h1>
          <p>Natural-language inventory querying, predictive decision support, and explainability</p>
        </div>
      </div>

      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Suggestion Prompt Chips */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
            <Sparkles size={13} color="var(--accent-cyan)" />
            <span>RECOMMENDED DECISION QUERIES:</span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {PROMPT_SUGGESTIONS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="action-btn-sm"
                style={{ fontSize: "11px", color: "var(--accent-cyan)", display: "inline-flex", alignItems: "center", gap: "4px" }}
                onClick={() => handleAsk(prompt)}
              >
                <span>{prompt}</span>
                <ArrowRight size={10} />
              </button>
            ))}
          </div>
        </div>

        {/* Chat Stream Window */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-lg)",
            minHeight: "440px",
            maxHeight: "600px",
            overflowY: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            marginBottom: "16px",
          }}
        >
          {messages.map((msg, index) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={index}
                style={{
                  alignSelf: isUser ? "flex-end" : "flex-start",
                  maxWidth: isUser ? "75%" : "90%",
                }}
              >
                <div
                  style={{
                    background: isUser
                      ? "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                      : "var(--bg-input)",
                    border: isUser ? "none" : "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "14px 18px",
                    color: "#fff",
                    fontSize: "13px",
                    lineHeight: "1.6",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {!isUser && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                      <Bot size={15} color="var(--accent-cyan)" />
                      <strong style={{ fontSize: "12px", color: "var(--accent-cyan)" }}>
                        StockSense Intelligence
                      </strong>
                    </div>
                  )}

                  <p>{msg.text}</p>

                  {/* Render Data List / Table if returned */}
                  {msg.data && Array.isArray(msg.data) && msg.data.length > 0 && (
                    <div
                      style={{
                        marginTop: "12px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: "6px",
                        padding: "10px",
                        overflowX: "auto",
                      }}
                    >
                      <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                            <th style={{ padding: "6px 8px", textAlign: "left" }}>Item / Detail</th>
                            <th style={{ padding: "6px 8px", textAlign: "left" }}>Metric</th>
                            <th style={{ padding: "6px 8px", textAlign: "left" }}>Status / Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {msg.data.slice(0, 5).map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                              <td style={{ padding: "6px 8px" }}>
                                <strong>{row.product || row.productName || row.message || row.type}</strong>
                                {row.sku && <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>({row.sku})</span>}
                              </td>
                              <td style={{ padding: "6px 8px" }}>
                                {row.daysUntilStockout !== undefined
                                  ? `~${row.daysUntilStockout} days remaining`
                                  : row.lockedCapital !== undefined
                                  ? `₹${row.lockedCapital.toLocaleString()} locked`
                                  : row.quantity !== undefined
                                  ? `${row.quantity} units`
                                  : "-"}
                              </td>
                              <td style={{ padding: "6px 8px", color: "var(--accent-emerald)" }}>
                                {row.recommendation || row.severity || (row.reorderRecommended ? "Reorder Needed" : "Active")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px" }}>
              <Bot size={16} color="var(--accent-cyan)" />
              <span>Analyzing stock balances and ledger algorithms...</span>
            </div>
          )}
        </div>

        {/* Query Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk(question);
          }}
          style={{ display: "flex", gap: "10px" }}
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a decision question, e.g. 'Which products run out in 7 days?' or 'Show slow moving items'..."
            style={{
              flex: 1,
              background: "var(--bg-input)",
              border: "1px solid var(--border-medium)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              color: "#fff",
              fontSize: "14px",
              outline: "none",
            }}
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ padding: "0 22px" }}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
