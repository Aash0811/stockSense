import { useEffect, useState } from "react";
import { ArrowLeft, LogOut, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Profile() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || "Unable to load profile"); return body.data; })
      .then(setProfile)
      .catch((reason) => setError(reason.message));
  }, [token]);

  return <main className="operation-shell"><header className="operation-header"><div><Link className="back-link" to="/dashboard"><ArrowLeft size={15} /> Overview</Link><p className="eyebrow">Account / Profile</p><h1>My profile</h1><p className="muted">Your StockSense account and access role.</p></div><button className="icon-action" title="Log out" onClick={() => { logout(); navigate("/login"); }}><LogOut size={16} /></button></header><section className="profile-card"><div className="profile-avatar"><UserRound size={28} /></div><div className="profile-details"><p className="eyebrow">Account details</p><h2>{profile?.name || "-"}</h2><dl><dt>Email</dt><dd>{profile?.email || "-"}</dd><dt>Role</dt><dd><span className="status-active">{profile?.role || "-"}</span></dd><dt>Status</dt><dd>{profile?.isActive ? "Active" : "Inactive"}</dd><dt>Member since</dt><dd>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"}</dd></dl></div></section>{error && <div className="notice">{error}</div>}</main>;
}
