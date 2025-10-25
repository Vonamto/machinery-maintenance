// frontend/src/components/Navbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
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

    return (
        <nav className="sticky top-0 z-10 p-4 bg-theme-background-secondary backdrop-blur-sm border-b border-theme-border-light"> {/* Apply theme colors */}
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <div className="flex items-center space-x-4">
                    <h1 className="text-xl font-bold text-theme-text-primary cursor-pointer" onClick={() => navigate("/")}>
                        🛠️ Machinery Maintenance
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    {user && (
                        <div className="flex items-center space-x-2 text-theme-text-primary">
                            <User size={20} />
                            <span className="hidden sm:inline text-sm">{user.full_name || user.username} ({user.role})</span>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 bg
