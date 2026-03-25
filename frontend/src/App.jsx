// frontend/src/App.jsx (role-config based, behavior unchanged)

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPage from "./pages/Install";

// 🔐 Roles & permissions (single source of truth)
import { PAGE_PERMISSIONS } from "./config/roles";

// --- Maintenance ---
import MaintenanceIndex from "./pages/Maintenance/index";
import MaintenanceForm from "./pages/Maintenance/Form";
import MaintenanceHistory from "./pages/Maintenance/History";

// --- Cleaning ---
import CleaningMenu from "./pages/Cleaning/index";
import CleaningForm from "./pages/Cleaning/CleaningForm";
import CleaningHistory from "./pages/Cleaning/CleaningHistory";

// --- Checklist ---
import ChecklistMenu from "./pages/Checklist/index";
import ChecklistForm from "./pages/Checklist/Form";
import ChecklistHistory from "./pages/Checklist/History";

// --- Suivi (Machinery Tracking) ---
import SuiviMenu from "./pages/Suivi/index";
import SuiviList from "./pages/Suivi/SuiviList";
import SuiviManage from "./pages/Suivi/SuiviManage";
import SuiviDetail from "./pages/Suivi/SuiviDetail";

// --- Users ---
import UsersManage from "./pages/Users/Manage";

// --- HSE ---
import HSEIndex from "./pages/HSE/index";
import PPEStock from "./pages/HSE/PPEStock";
import PPEDistribution from "./pages/HSE/PPEDistribution";
import PPEHistory from "./pages/HSE/PPEHistory";
import HSEWorkers from "./pages/HSE/Workers";

export default function App() {
  const { i18n } = useTranslation();

  // ✅ AUTO SWITCH LTR / RTL WHEN LANGUAGE CHANGES
  useEffect(() => {
    const isRTL = i18n.language === "ar";
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
        <Routes>
          {/* ================= Install ================= */}
          <Route path="/install" element={<InstallPage />} />

          {/* ================= Login ================= */}
          <Route path="/login" element={<Login />} />

          {/* ================= Dashboard ================= */}
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
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.MAINTENANCE}>
                <MaintenanceIndex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance/form"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.MAINTENANCE_FORM}>
                <MaintenanceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/maintenance/history"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.MAINTENANCE_HISTORY}>
                <MaintenanceHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= Cleaning ================= */}
          <Route
            path="/cleaning"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CLEANING}>
                <CleaningMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cleaning/form"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CLEANING_FORM}>
                <CleaningForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cleaning/history"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CLEANING_HISTORY}>
                <CleaningHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= Checklist ================= */}
          <Route
            path="/checklist"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CHECKLIST}>
                <ChecklistMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist/form"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CHECKLIST_FORM}>
                <ChecklistForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checklist/history"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.CHECKLIST_HISTORY}>
                <ChecklistHistory />
              </ProtectedRoute>
            }
          />

          {/* ================= Suivi (Machinery Tracking) ================= */}
          <Route
            path="/suivi"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.SUIVI}>
                <SuiviMenu />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suivi/list"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.SUIVILIST}>
                <SuiviList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suivi/manage"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.SUIVIMANAGE}>
                <SuiviManage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suivi/detail/:plate"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.SUIVIDETAIL}>
                <SuiviDetail />
              </ProtectedRoute>
            }
          />

          {/* ================= Users ================= */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.USERS}>
                <UsersManage />
              </ProtectedRoute>
            }
          />

          {/* ================= HSE ================= */}
          <Route
            path="/hse"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.HSE}>
                <HSEIndex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hse/stock"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.HSE_STOCK}>
                <PPEStock />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hse/distribute"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.HSE_DISTRIBUTE}>
                <PPEDistribution />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hse/history"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.HSE_HISTORY}>
                <PPEHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hse/workers"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.HSE_WORKERS}>
                <HSEWorkers />
              </ProtectedRoute>
            }
          />

          {/* ================= Fallback ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
