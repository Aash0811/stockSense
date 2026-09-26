import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ResetPassword from "../pages/auth/ResetPassword";
import Profile from "../pages/auth/Profile";
import ProtectedRoute from "./ProtectedRoute";

import Dashboard from "../pages/dashboard/Dashboard";
import Products from "../pages/products/Products";
import Inventory from "../pages/operations/Inventory";
import Receipts from "../pages/operations/Receipts";
import Deliveries from "../pages/operations/Deliveries";
import Transfers from "../pages/operations/Transfers";
import Adjustments from "../pages/operations/Adjustments";
import Movements from "../pages/operations/Movements";

import ReportsOverview from "../pages/reports/ReportsOverview";
import Assistant from "../pages/reports/Assistant";
import Warehouses from "../pages/warehouses/Warehouses";
import Locations from "../pages/warehouses/Locations";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
      <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />

      <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
      <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      <Route path="/transfers" element={<ProtectedRoute><Transfers /></ProtectedRoute>} />
      <Route path="/adjustments" element={<ProtectedRoute><Adjustments /></ProtectedRoute>} />
      <Route path="/movements" element={<ProtectedRoute><Movements /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><Movements /></ProtectedRoute>} />

      <Route path="/forecast" element={<ProtectedRoute><ReportsOverview initialTab="forecast" /></ProtectedRoute>} />
      <Route path="/dead-stock" element={<ProtectedRoute><ReportsOverview initialTab="dead-stock" /></ProtectedRoute>} />
      <Route path="/anomalies" element={<ProtectedRoute><ReportsOverview initialTab="anomalies" /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsOverview initialTab="forecast" /></ProtectedRoute>} />

      <Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} />
      <Route path="/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} />
      <Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
