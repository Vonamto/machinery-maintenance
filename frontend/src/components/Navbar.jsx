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
                </div>
                {/* Group Dashboard and Logout buttons together on the right */}
                <div className="flex items-center space-x-2"> {/* Group buttons, reduced space-x */}
                    <button
                        onClick={goToDashboard}
                        className="flex items-center gap-1 px-3 py-2 bg-theme-primary-600 hover:bg-theme-primary-700 text-theme-text-primary rounded-lg transition-colors text-sm" // Reduced gap, smaller padding
                    >
                        <Home size={14} /> {/* Smaller icon */}
                        <span>Dashboard</span> {/* Keep text visible */}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-theme-text-primary rounded-lg transition-colors text-sm" // Red background, reduced gap, smaller padding
                    >
                        <LogOut size={14} /> {/* Smaller icon */}
                        <span>Logout</span> {/* Keep text visible */}
                    </button>
                </div>
            </div>
        </nav>
    );
}
