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
import PartsRequestsMenu from "./pages/Requests/Parts/index";
import PartsRequestForm from "./pages/Requests/Parts/Form";
import PartsCurrentRequests from "./pages/Requests/Parts/Current";
import PartsRequestsHistory from "./pages/Requests/Parts/RequestsHistory";

// Grease/Oil Requests pages (NEW)
import GreaseOilMenu from "./pages/Requests/GreaseOil/index"; // Import the new index page
import GreaseOilForm from "./pages/Requests/GreaseOil/Form"; // Import the new form page
import GreaseOilCurrent from "./pages/Requests/GreaseOil/Current"; // Import the new current page
import GreaseOilHistory from "./pages/Requests/GreaseOil/History"; // Import the new history page

// Cleaning pages (NEW)
import CleaningIndex from "./pages/Cleaning/index"; // Assuming you'll create this as a menu
import CleaningForm from "./pages/Cleaning/CleaningForm";
import CleaningHistory from "./pages/Cleaning/CleaningHistory";

// Equipment pages (NEW)
import EquipmentIndex from "./pages/Equipment/index"; // Assuming you'll create this as a menu
import EquipmentList from "./pages/Equipment/EquipmentList";
import EquipmentManage from "./pages/Equipment/EquipmentManage";

// Users pages (NEW)
import UsersIndex from "./pages/Users/index"; // Assuming you'll create this as a menu
import ManageUsers from "./pages/Users/ManageUsers";

export default function App() {
  return (
    <BrowserRouter>
      {/* Apply the main background theme color class here */}
      <div className="min-h-screen bg-theme-background-primary text-theme-text-primary">
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

          {/* Parts Requests submenu */}
          <Route
            path="/requests/parts"
            element={
              <ProtectedRoute>
                <PartsRequestsMenu />
              </ProtectedRoute>
            }
          />

          {/* Parts Request Form */}
          <Route
            path="/requests/parts/form"
            element={
              <ProtectedRoute>
                <PartsRequestForm />
              </ProtectedRoute>
            }
          />

          {/* Parts Current Requests */}
          <Route
            path="/requests/parts/current"
            element={
              <ProtectedRoute>
                <PartsCurrentRequests />
              </ProtectedRoute>
            }
          />

          {/* Parts Requests History */}
          <Route
            path="/requests/parts/history"
            element={
              <ProtectedRoute>
                <PartsRequestsHistory />
              </ProtectedRoute>
            }
          />

          {/* --- NEW ROUTES FOR GREASE/OIL REQUESTS --- */}
          {/* Grease/Oil Requests submenu */}
          <Route
            path="/requests/grease-oil"
            element={
              <ProtectedRoute>
                <GreaseOilMenu />
              </ProtectedRoute>
            }
          />
          {/* Grease/Oil Request Form */}
          <Route
            path="/requests/grease-oil/form"
            element={
              <ProtectedRoute>
                <GreaseOilForm />
              </ProtectedRoute>
            }
          />
          {/* Grease/Oil Current Requests */}
          <Route
            path="/requests/grease-oil/current"
            element={
              <ProtectedRoute>
                <GreaseOilCurrent />
              </ProtectedRoute>
            }
          />
          {/* Grease/Oil Requests History */}
          <Route
            path="/requests/grease-oil/history"
            element={
              <ProtectedRoute>
                <GreaseOilHistory />
              </ProtectedRoute>
            }
          />
          {/* --- END NEW ROUTES --- */}

          {/* --- NEW ROUTES FOR CLEANING --- */}
          {/* Cleaning submenu (you might create this later, or just link directly to form/history) */}
          {/* For now, you can link directly to /cleaning/form or /cleaning/history from the dashboard */}
          <Route
            path="/cleaning"
            element={
              <ProtectedRoute>
                <CleaningHistory /> {/* Default to history view, or create a CleaningIndex for a menu */}
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
          {/* --- END NEW ROUTES --- */}

          {/* --- NEW ROUTES FOR EQUIPMENT --- */}
          <Route
            path="/equipment"
            element={
              <ProtectedRoute>
                <EquipmentIndex />
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
          {/* --- END NEW ROUTES --- */}

          {/* --- NEW ROUTES FOR USERS --- */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <UsersIndex />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users/manage"
            element={
              <ProtectedRoute>
                <ManageUsers />
              </ProtectedRoute>
            }
          />
          {/* --- END NEW ROUTES --- */}

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
