import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ResetPassword from "../pages/auth/ResetPassword";
import Profile from "../pages/auth/Profile";
import Inventory from "../pages/operations/Inventory";
import Movements from "../pages/operations/Movements";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import OperationPage from "../pages/operations/OperationPage";
import Assistant from "../pages/reports/Assistant";
import Warehouses from "../pages/warehouses/Warehouses";
import Locations from "../pages/warehouses/Locations";
import Products from "../pages/products/Products";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
      <Route path="/movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
      <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      {[
        "receipts",
        "deliveries",
        "transfers",
        "adjustments",
        "reports",
        "audit",
        "forecast",
        "anomalies",
        "notifications",
      ].map((path) => (
        <Route key={path} path={`/${path}`} element={<ProtectedRoute><OperationPage /></ProtectedRoute>} />
      ))}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
