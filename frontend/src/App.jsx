// frontend/src/App.jsx (FINAL with Users route)

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
import PartsRequestsMenu from "./pages/Requests/Parts/index";
import PartsRequestForm from "./pages/Requests/Parts/Form";
import PartsCurrentRequests from "./pages/Requests/Parts/Current";
import PartsRequestsHistory from "./pages/Requests/Parts/RequestsHistory";

// Grease/Oil Requests pages
import GreaseOilMenu from "./pages/Requests/GreaseOil/index";
import GreaseOilForm from "./pages/Requests/GreaseOil/Form";
import GreaseOilCurrent from "./pages/Requests/GreaseOil/Current";
import GreaseOilHistory from "./pages/Requests/GreaseOil/History";

// Cleaning pages
import CleaningMenu from "./pages/Cleaning/index";
import CleaningForm from "./pages/Cleaning/CleaningForm";
import CleaningHistory from "./pages/Cleaning/CleaningHistory";

// Equipment pages
import EquipmentMenu from "./pages/Equipment/index";
import EquipmentList from "./pages/Equipment/List";
import EquipmentManage from "./pages/Equipment/Manage";

// ✅ NEW: Users page
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

          {/* --- Maintenance --- */}
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute>
                <MaintenanceIndex />
              </ProtectedRoute>
            }
          />
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

          {/* --- Requests --- */}
          <Route
            path="/requests"
            element={
              <ProtectedRoute>
                <RequestsMenu />
              </ProtectedRoute>
            }
          />

          {/* Parts Requests */}
          <Route
            path="/requests/parts"
            element={
              <ProtectedRoute>
                <PartsRequestsMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/parts/form"
            element={
              <ProtectedRoute>
                <PartsRequestForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/parts/current"
            element={
              <ProtectedRoute>
                <PartsCurrentRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/parts/history"
            element={
              <ProtectedRoute>
                <PartsRequestsHistory />
              </ProtectedRoute>
            }
          />

          {/* Grease/Oil Requests */}
          <Route
            path="/requests/grease-oil"
            element={
              <ProtectedRoute>
                <GreaseOilMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/grease-oil/form"
            element={
              <ProtectedRoute>
                <GreaseOilForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/grease-oil/current"
            element={
              <ProtectedRoute>
                <GreaseOilCurrent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests/grease-oil/history"
            element={
              <ProtectedRoute>
                <GreaseOilHistory />
              </ProtectedRoute>
            }
          />

          {/* --- Cleaning --- */}
          <Route
            path="/cleaning"
            element={
              <ProtectedRoute>
                <CleaningMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cleaning/form"
            element={
              <ProtectedRoute>
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

          {/* --- Equipment --- */}
          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <EquipmentMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment/list"
            element={
              <ProtectedRoute>
                <EquipmentList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment/manage"
            element={
              <ProtectedRoute>
                <EquipmentManage />
              </ProtectedRoute>
            }
          />

          {/* --- Users (Supervisor only) --- */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersManage />
              </ProtectedRoute>
            }
          />

          {/* --- Fallback --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
