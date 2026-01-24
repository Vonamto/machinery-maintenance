// frontend/src/App.jsx (UPDATED – role-safe, requests removed)

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// --- Maintenance ---
import MaintenanceIndex from "./pages/Maintenance/index";
import MaintenanceForm from "./pages/Maintenance/Form";
import MaintenanceHistory from "./pages/Maintenance/History";

// --- Cleaning ---
import CleaningMenu from "./pages/Cleaning/index";
import CleaningForm from "./pages/Cleaning/CleaningForm";
import CleaningHistory from "./pages/Cleaning/CleaningHistory";

// --- Equipment ---
import EquipmentMenu from "./pages/Equipment/index";
import EquipmentList from "./pages/Equipment/List";
import EquipmentManage from "./pages/Equipment/Manage";

// --- Users ---
import UsersManage from "./pages/Users/Manage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
        <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= Maintenance ================= */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <MaintenanceIndex />
              </ProtectedRoute>
            }
          />

          {/* Maintenance Form – NO DRIVER */}
          <Route
            path="/maintenance/form"
            element={
              <ProtectedRoute allowedRoles={["Supervisor", "Mechanic"]}>
                <MaintenanceForm />
              </ProtectedRoute>
            }
          />

          {/* Maintenance History – Driver allowed */}
          <Route
            path="/maintenance/history"
            element={
              <ProtectedRoute>
                <MaintenanceHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= Cleaning ================= */}
          <Route
            path="/cleaning"
            element={
              <ProtectedRoute>
                <CleaningMenu />
              </ProtectedRoute>
            }
          />

          {/* Cleaning Form – NO DRIVER */}
          <Route
            path="/cleaning/form"
            element={
              <ProtectedRoute
                allowedRoles={["Supervisor", "Mechanic", "Cleaning Guy"]}
              >
                <CleaningForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cleaning/history"
            element={
              <ProtectedRoute>
                <CleaningHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= Equipment ================= */}
          <Route
            path="/equipment"
            element={
              <ProtectedRoute
                allowedRoles={["Supervisor", "Mechanic", "Cleaning Guy"]}
              >
                <EquipmentMenu />
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment/list"
            element={
              <ProtectedRoute
                allowedRoles={["Supervisor", "Mechanic", "Cleaning Guy"]}
              >
                <EquipmentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment/manage"
            element={
              <ProtectedRoute
                allowedRoles={["Supervisor", "Mechanic"]}
              >
                <EquipmentManage />
              </ProtectedRoute>
            }
          />

          {/* ================= Users ================= */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Supervisor"]}>
                <UsersManage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
