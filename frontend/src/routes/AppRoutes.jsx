import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import OperationPage from "../pages/operations/OperationPage";
import Assistant from "../pages/reports/Assistant";
import Warehouses from "../pages/warehouses/Warehouses";
import Locations from "../pages/warehouses/Locations";
import Products from "../pages/products/Products";

export default function AppRoutes() {
	return <Routes><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/warehouses" element={<ProtectedRoute><Warehouses /></ProtectedRoute>} /><Route path="/locations" element={<ProtectedRoute><Locations /></ProtectedRoute>} /><Route path="/assistant" element={<ProtectedRoute><Assistant /></ProtectedRoute>} /><Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} /><Route path="/receipts" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/deliveries" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/transfers" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/adjustments" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/reports" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/audit" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/forecast" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/anomalies" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="/notifications" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>;
}
