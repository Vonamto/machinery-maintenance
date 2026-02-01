// frontend/src/App.jsx (role-config based, behavior unchanged)

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

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

// --- Equipment ---
import EquipmentMenu from "./pages/Equipment/index";
import EquipmentList from "./pages/Equipment/List";
import EquipmentManage from "./pages/Equipment/Manage";

// --- Users ---
import UsersManage from "./pages/Users/Manage";

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

          {/* ================= Equipment ================= */}
          <Route
            path="/equipment"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.EQUIPMENT}>
                <EquipmentMenu />
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment/list"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.EQUIPMENT_LIST}>
                <EquipmentList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/equipment/manage"
            element={
              <ProtectedRoute allowedRoles={PAGE_PERMISSIONS.EQUIPMENT_MANAGE}>
                <EquipmentManage />
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

          {/* ================= Fallback ================= */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
