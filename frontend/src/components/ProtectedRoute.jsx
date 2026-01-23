// frontend/src/components/ProtectedRoute.jsx

import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 *
 * Usage:
 * <ProtectedRoute allowedRoles={["Supervisor", "Mechanic"]}>
 *   <SomePage />
 * </ProtectedRoute>
 *
 * Rules:
 * - Redirects to /login if not authenticated
 * - Redirects to / if role is not allowed
 */

export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch {
    user = null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
