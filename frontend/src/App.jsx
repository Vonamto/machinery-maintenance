// frontend/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// Maintenance pages
import MaintenanceIndex from "./pages/Maintenance/index";
import MaintenanceForm from "./pages/Maintenance/Form";
import MaintenanceHistory from "./pages/Maintenance/History";

// Requests pages
import RequestsMenu from "./pages/Requests/index";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Dashboard (home) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Maintenance menu */}
        <Route
          path="/maintenance"
          element={
            <ProtectedRoute>
              <MaintenanceIndex />
            </ProtectedRoute>
          }
        />
        
        {/* Maintenance subpages */}
        <Route
          path="/maintenance/form"
          element={
            <ProtectedRoute>
              <MaintenanceForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/maintenance/history"
          element={
            <ProtectedRoute>
              <MaintenanceHistory />
            </ProtectedRoute>
          }
        />

        {/* Requests menu */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <RequestsMenu />
            </ProtectedRoute>
          }
        />
        
        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
