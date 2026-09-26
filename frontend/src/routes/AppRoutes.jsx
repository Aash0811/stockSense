import { Navigate, Route, Routes } from "react-router-dom";
import Login from "../pages/auth/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import ProtectedRoute from "./ProtectedRoute";
import OperationPage from "../pages/operations/OperationPage";

export default function AppRoutes() {
	return <Routes><Route path="/login" element={<Login />} /><Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /><Route path="/:section(products|receipts|deliveries|transfers|adjustments|reports|audit)" element={<ProtectedRoute><OperationPage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/dashboard" replace />} /></Routes>;
}
