import { useState } from "react";
import { ArrowLeft, LogOut, Send } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Assistant() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState("Which products are low in stock?");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");

  async function ask(event) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_URL}/reports/assistant`, { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ question }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || "Assistant request failed");
      setAnswer(body.data);
    } catch (reason) { setError(reason.message); }
  }

  return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Inventory assistant</p><h1>Ask StockSense</h1><p className="muted">Read-only answers from your inventory data.</p></div><div className="operation-actions"><span className="user-chip">{user?.name || "Operator"}</span><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></div></header><section className="assistant-panel"><form className="assistant-form" onSubmit={ask}><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about stock, forecasts, anomalies, or deliveries" /><button className="primary-action" type="submit"><Send size={16} /> Ask</button></form>{error && <div className="notice">{error}</div>}{answer && <div className="assistant-answer"><p className="eyebrow">Answer</p><h2>{answer.answer}</h2><pre>{JSON.stringify(answer.data, null, 2)}</pre></div>}</section></main>;
}
