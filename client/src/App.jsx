import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Warehouses from "./pages/Warehouses";
import Suppliers from "./pages/Suppliers";
import Orders from "./pages/Orders";
import AuditLog from "./pages/AuditLog";
import AIAssistant from "./pages/AIAssistant";
import Reports from "./pages/Reports";
import Users from "./pages/Users";

const App = () => {
  const { user } = useSelector((s) => s.auth);

  return (
    <Routes>
      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/warehouses" element={<Warehouses />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route element={<ProtectedRoute roles={["admin", "manager"]} />}>
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
          <Route element={<ProtectedRoute roles={["admin"]} />}>
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
