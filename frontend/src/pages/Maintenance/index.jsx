// frontend/src/pages/Maintenance/index.jsx
import React from "react";
import { Link, Outlet } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { useAuth } from "../../context/AuthContext";

/**
 * Maintenance index page (submenu + outlet)
 * - default route shows the Form (we'll configure nested routes in App.jsx)
 */

export default function MaintenanceIndex() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white">
      <Navbar user={user} />

      <div className="max-w-6xl mx-auto p-6">
        <header className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            Maintenance
          </h2>

          <nav className="flex gap-3">
            <Link
              to="form"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Form
            </Link>
            <Link
              to="history"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              History
            </Link>
          </nav>
        </header>

        <main>
          {/* nested pages (Form / History) */}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
