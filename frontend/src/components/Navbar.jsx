// frontend/src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Home } from "lucide-react"; // Added Home icon
// Import the custom hook instead of the context object
import { useAuth } from "@/context/AuthContext";

export default function Navbar({ user }) {
    const navigate = useNavigate();
    // Use the custom hook to get the logout function
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const goToDashboard = () => {
        navigate("/"); // Navigate to the root, which is the dashboard
    };

    return (
        <nav className="sticky top-0 z-10 p-4 bg-theme-background-secondary backdrop-blur-sm border-b border-theme-border-light"> {/* Apply theme colors */}
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center space-x-4">
                    {/* Show full name or username, without role */}
                    <h1 className="text-lg font-semibold text-theme-text-primary">
                        👋 Welcome, {user?.full_name || user?.username || "User"}
                    </h1>
                    {/* Add Dashboard button */}
                    <button
                        onClick={goToDashboard}
                        className="flex items-center gap-2 px-3 py-2 bg-theme-primary-600 hover:bg-theme-primary-700 text-theme-text-primary rounded-lg transition-colors text-sm" // Apply theme colors
                    >
                        <Home size={16} /> {/* Smaller icon */}
                        Dashboard
                    </button>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg-theme-primary-600 hover:bg-theme-primary-700 text-theme-text-primary rounded-lg transition-colors" // Apply theme colors
                    >
                        <LogOut size={18} />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </div>
        </nav>
    );
}
