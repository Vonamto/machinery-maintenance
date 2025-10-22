// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Protects routes that require login.
 * Usage:
 *   <Route path="/dashboard" element={
 *       <ProtectedRoute><Dashboard /></ProtectedRoute>
 *   } />
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // If there's no token, redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Otherwise, render the requested protected page
  return children;
}
